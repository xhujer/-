/**
 * 拼多多果园 - Loon 自动浇水脚本
 * 移植自 pdd_manor_yyb_go.py（YYB Go code 登录 / Cookie 直连）
 *
 * 使用方法：
 *   1. Loon → 脚本 → 新建脚本，粘贴本文件内容（或托管到 GitHub/Gist 后引用）
 *   2. 配置方式二选一：
 *      a) 直接编辑下方 CONFIG 对象
 *      b) 在 Loon 脚本配置的"参数"里填 JSON，如：
 *         {"YYB_GO_URL":"http://115.190.216.15:8000","PDD_OPENID":"账号1&账号2"}
 *   3. 手动运行一次验证，再配置定时任务 cron "0 8 * * *"
 *
 * 配置项：
 *   YYB_GO_URL    YYB Go 服务地址（必填，除非用 PDD_COOKIE）
 *   PDD_OPENID    YYB Go 账号引用（ID/UIN/openid），多账号用 & 或换行分隔
 *   PDD_COOKIE    (可选) 完整 Cookie 字符串，提供则跳过登录流程
 *   PDD_WATER_MAX 单账号最多浇水次数（默认 20，原 Python 版为 50）
 *   PDD_STEAL     是否执行偷水（true/false，默认 true）
 *   PDD_ANTI_MODE anti_content 生成策略：always（默认）/ never（跳过，更快但可能触发风控）
 *   PDD_DEBUG_ANTI 设为 true 时仅测试 anti_content 生成（调试用）
 */

const CONFIG = {
  YYB_GO_URL: "",
  PDD_OPENID: "",
  PDD_COOKIE: "",
  PDD_COOKIE_STORE: true,  // PDD_COOKIE 为空时，自动读取捕获的身份信息
  PDD_CAPTURE: true,       // 开关：是否在 http-request/http-response 触发时自动捕获
  // App 抓包手动配置（从抓包提取 AccessToken / pdduid / api_uid 后填写）
  PDD_ACCESS_TOKEN: "",
  PDD_USER_ID: "",
  PDD_API_UID: "",
  PDD_WATER_MAX: 20,
  PDD_STEAL: true,
  PDD_ANTI_MODE: "always",
  PDD_DEBUG_ANTI: false,
};

// 允许通过 Loon 脚本"参数"($arguments, JSON 字符串)覆盖配置
try {
  if (typeof $arguments !== "undefined" && $arguments) {
    const arg = typeof $arguments === "string" ? JSON.parse($arguments) : $arguments;
    Object.assign(CONFIG, arg || {});
  }
} catch (e) {
  log("[配置] 参数解析失败，使用默认配置: " + e.message);
}

// ===== 硬编码常量 =====
const PDD_MINI_APP_ID = "wx32540bd863b27570";
const PDD_XCX_VERSION = "v8.6.21";
const PDD_APP_ID = 33;
const SCRIPT_BUILD = "loon-20260807.1";

const MANOR_BASE = "https://mobile.yangkeduo.com/proxy/api/api";
const LOGIN_BASE = "https://api.pinduoduo.com";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/132.0.0.0 Safari/537.36 " +
  "MicroMessenger/7.0.20.1781(0x6700143B) " +
  "NetType/WIFI MiniProgramEnv/Windows " +
  "WindowsWechat/WMPF WindowsWechat(0x63090a13) " +
  "UnifiedPCWindowsWechat(0xf254193e) XWEB/19841";

const ANTI_SDK_URL = "https://static.pddpic.com/assets/js/risk_control_anti_dac600d707bbff03e560.js";
const ANTI_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36";

// ===== 工具函数 =====
function log(msg) {
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log("[" + ts + "] " + msg);
}

function mask(s, h, t) {
  h = h || 4; t = t || 4;
  s = String(s);
  if (s.length <= h + t) return s.slice(0, h) + "***";
  return s.slice(0, h) + "***" + s.slice(-t);
}

const CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function randString(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

function parseOpenids(raw) {
  if (!raw) return [];
  const out = [];
  String(raw).replace(/\r/g, "\n").split("\n").forEach(function (line) {
    line.split("&").forEach(function (p) {
      p = p.trim();
      if (p) out.push(p);
    });
  });
  return out;
}

function cookieStrToDict(cookieStr) {
  const d = {};
  String(cookieStr || "").split(";").forEach(function (item) {
    const i = item.indexOf("=");
    if (i > 0) {
      const k = item.slice(0, i).trim();
      const v = item.slice(i + 1).trim();
      if (k) d[k] = v;
    }
  });
  return d;
}

function cookieDictToStr(d) {
  const parts = [];
  Object.keys(d).forEach(function (k) { parts.push(k + "=" + d[k]); });
  return parts.join("; ");
}

function extractUid(cookieStr) {
  const m = String(cookieStr || "").match(/pdd_user_id=(\d+)/);
  return m ? m[1] : "";
}

// ===== HTTP 层 (Loon $task.fetch) =====
function http(opts) {
  const headers = Object.assign({
    "User-Agent": UA,
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
  }, opts.headers || {});
  return $task.fetch({
    url: opts.url,
    method: opts.method || "GET",
    headers: headers,
    body: opts.body || "",
    timeout: opts.timeout || 20,
  });
}

function postJson(url, body, extraHeaders, cookieStr, timeout) {
  const headers = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=UTF-8",
    "Origin": "https://mobile.yangkeduo.com",
    "Referer": "https://mobile.yangkeduo.com/garden_index_lz_0.html",
  };
  if (cookieStr) headers["Cookie"] = cookieStr;
  if (extraHeaders) Object.assign(headers, extraHeaders);
  return http({
    url: url,
    method: "POST",
    headers: headers,
    body: JSON.stringify(body),
    timeout: timeout || 15,
  }).then(function (resp) {
    if (resp.statusCode >= 400) {
      throw new Error("HTTP " + resp.statusCode + ": " + String(resp.body || "").slice(0, 200));
    }
    return JSON.parse(resp.body);
  });
}

// Set-Cookie 解析：处理多个 Set-Cookie 被逗号拼接的情况（保护 Expires 日期里的逗号）
function splitSetCookies(s) {
  const out = [];
  let last = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === ",") {
      const rest = s.slice(i + 1).trim();
      if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+/.test(rest)) continue; // Expires 日期
      if (/^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/.test(rest)) continue;
      out.push(s.slice(last, i));
      last = i + 1;
    }
  }
  out.push(s.slice(last));
  return out.map(function (x) { return x.trim(); }).filter(Boolean);
}

function collectCookies(resp) {
  const d = {};
  const headers = resp.headers || {};
  let hc = headers["set-cookie"] || headers["Set-Cookie"];
  if (!hc) return d;
  const arr = Array.isArray(hc) ? hc : splitSetCookies(String(hc));
  arr.forEach(function (seg) {
    const semi = seg.indexOf(";");
    const pair = semi >= 0 ? seg.slice(0, semi) : seg;
    const eq = pair.indexOf("=");
    if (eq > 0) {
      const k = pair.slice(0, eq).trim();
      const v = pair.slice(eq + 1).trim();
      if (k && v) d[k] = v;
    }
  });
  return d;
}

// ===== 缓存 ($persistentStore) =====
function cacheKey(openid) {
  let h = 0;
  const s = String(openid);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return "pdd_cookie_" + h.toString(36);
}

function cachedCookie(openid) {
  try {
    const raw = $persistentStore.read(cacheKey(openid));
    if (!raw) return "";
    const entry = JSON.parse(raw);
    return entry.cookie_str || "";
  } catch (e) {
    return "";
  }
}

function saveCookieCache(openid, cookieStr) {
  try {
    $persistentStore.write(
      JSON.stringify({ cookie_str: cookieStr, updatedAt: new Date().toISOString() }),
      cacheKey(openid)
    );
  } catch (e) {
    log("[缓存写入失败] " + e.message);
  }
}

// ===== YYB Go 获取微信 code =====
function getWxCode(accountRef) {
  return http({
    url: CONFIG.YYB_GO_URL + "/wxapp/getCode",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: PDD_MINI_APP_ID, ref: accountRef }),
    timeout: 15,
  }).then(function (resp) {
    let response;
    try { response = JSON.parse(resp.body); } catch (e) { response = {}; }
    const c = response.code;
    if (!(c === 0 || c === "0" || c === undefined || c === null)) {
      log("[YYB Go] 获取 code 失败: " + (response.msg || JSON.stringify(response).slice(0, 200)));
      return null;
    }
    const data = response.data || {};
    const result = data.result || {};
    let code = (result && typeof result === "object") ? result.code : (typeof result === "string" ? result : null);
    code = code || data.code;
    if (!code) {
      log("[YYB Go] 未返回小程序 code: " + JSON.stringify(response).slice(0, 300));
      return null;
    }
    return code;
  }).catch(function (e) {
    log("[YYB Go] 异常: " + e.message);
    return null;
  });
}

// ===== Anti-Content 生成（内嵌，纯 JS 移植自 Node 版）=====
function utf8EncodePolyfill(str) {
  const bin = unescape(encodeURIComponent(str));
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
function utf8DecodePolyfill(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return decodeURIComponent(escape(bin));
}

function generateAntiContent() {
  if (CONFIG.PDD_ANTI_MODE === "never") {
    log("  [AntiToken] PDD_ANTI_MODE=never，跳过 anti_content");
    return Promise.resolve(null);
  }
  return http({
    url: ANTI_SDK_URL,
    method: "GET",
    headers: { "User-Agent": ANTI_UA },
    timeout: 30,
  }).then(function (resp) {
    if (resp.statusCode !== 200 || !resp.body || resp.body.length < 1000) {
      log("  [AntiToken] SDK 下载失败 (HTTP " + resp.statusCode + ")");
      return null;
    }
    const sdkCode = resp.body;
    log("  [AntiToken] SDK 已下载 (" + Math.round(sdkCode.length / 1024) + " KB)，正在执行...");

    const win = {
      webpackChunkmobile_cartoon_activity: [],
      navigator: {
        userAgent: ANTI_UA, platform: "Win32", language: "zh-CN",
        languages: ["zh-CN", "zh"], cookieEnabled: true,
        hardwareConcurrency: 8, maxTouchPoints: 0,
        vendor: "Google Inc.", appVersion: "5.0",
        appName: "Netscape", onLine: true,
        plugins: { length: 3 }, mimeTypes: { length: 2 },
        connection: null, getBattery: null, sendBeacon: function () { return true; },
      },
      document: {
        cookie: "", referrer: "", title: "test", domain: "mobile.pinduoduo.com",
        readyState: "complete", visibilityState: "visible", hidden: false,
        createElement: function (tag) { return { style: {}, setAttribute: function () {}, getAttribute: function () { return null; }, addEventListener: function () {}, removeEventListener: function () {}, appendChild: function () {}, removeChild: function () {}, getContext: function () { return null; }, tagName: String(tag || "").toUpperCase() }; },
        getElementById: function () { return null; }, querySelector: function () { return null; }, querySelectorAll: function () { return []; },
        getElementsByTagName: function () { return []; }, addEventListener: function () {}, removeEventListener: function () {},
        createEvent: function () { return { initEvent: function () {} }; },
        body: { appendChild: function () {}, removeChild: function () {}, style: {}, scrollTop: 0, scrollLeft: 0, clientWidth: 1920, clientHeight: 1080 },
        head: { appendChild: function () {}, removeChild: function () {} },
        documentElement: { scrollTop: 0, scrollLeft: 0, clientWidth: 1920, clientHeight: 1080, style: {} },
      },
      location: { href: "https://mobile.pinduoduo.com/garden_index_lz_0.html", hostname: "mobile.pinduoduo.com", protocol: "https:", pathname: "/garden_index_lz_0.html", search: "", hash: "", host: "mobile.pinduoduo.com", origin: "https://mobile.pinduoduo.com" },
      screen: { width: 1920, height: 1080, colorDepth: 24, availWidth: 1920, availHeight: 1040 },
      performance: { now: function () { return Date.now() - 1000; }, timing: { navigationStart: Date.now() - 3000 }, getEntriesByType: function () { return []; }, mark: function () {}, measure: function () {} },
      history: { length: 3, state: null, pushState: function () {}, replaceState: function () {} },
      innerWidth: 1920, innerHeight: 1080, outerWidth: 1920, outerHeight: 1080,
      devicePixelRatio: 1, pageXOffset: 0, pageYOffset: 0, scrollX: 0, scrollY: 0,
      localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {}, clear: function () {}, length: 0, key: function () { return null; } },
      sessionStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {}, clear: function () {}, length: 0, key: function () { return null; } },
      crypto: { getRandomValues: function (arr) { for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256); return arr; }, subtle: null },
      addEventListener: function () {}, removeEventListener: function () {}, dispatchEvent: function () { return true; },
      setTimeout: setTimeout, clearTimeout: clearTimeout, setInterval: setInterval, clearInterval: clearInterval,
      Promise: Promise, JSON: JSON, Math: Math, Date: Date, Array: Array, Object: Object, String: String, Number: Number, Boolean: Boolean, RegExp: RegExp, Error: Error,
      Uint8Array: Uint8Array, Uint16Array: Uint16Array, Int32Array: Int32Array, ArrayBuffer: ArrayBuffer, DataView: DataView, Function: Function,
      Map: Map, Set: Set, WeakMap: WeakMap, WeakSet: WeakSet, Symbol: Symbol,
      Element: function Element() {}, HTMLElement: function HTMLElement() {}, Node: function Node() {},
      Event: function Event() {}, EventTarget: function EventTarget() {}, HTMLCanvasElement: function HTMLCanvasElement() {},
      encodeURIComponent: encodeURIComponent, decodeURIComponent: decodeURIComponent, encodeURI: encodeURI, decodeURI: decodeURI,
      parseInt: parseInt, parseFloat: parseFloat, isNaN: isNaN, isFinite: isFinite, console: console,
      MutationObserver: function () { this.observe = function () {}; this.disconnect = function () {}; },
      IntersectionObserver: function () { this.observe = function () {}; this.disconnect = function () {}; },
    };
    win.self = win;
    win.window = win;
    win.top = win;
    win.parent = win;

    // 全局挂载（SDK 以自由变量引用 window/document/...）
    const G = typeof globalThis !== "undefined" ? globalThis : {};
    G.self = win; G.window = win; G.top = win; G.parent = win;
    G.document = win.document; G.location = win.location; G.screen = win.screen;
    G.performance = win.performance; G.localStorage = win.localStorage; G.sessionStorage = win.sessionStorage;
    G.navigator = win.navigator;
    G.fetch = function () { return Promise.resolve({ ok: true, json: function () { return Promise.resolve({}); }, text: function () { return Promise.resolve(""); } }); };
    G.XMLHttpRequest = function () { this.open = function () {}; this.send = function () {}; };
    G.MutationObserver = win.MutationObserver;
    G.Element = win.Element; G.HTMLElement = win.HTMLElement; G.Node = win.Node;
    G.Event = win.Event; G.EventTarget = win.EventTarget; G.HTMLCanvasElement = win.HTMLCanvasElement;
    if (typeof G.TextEncoder === "undefined") G.TextEncoder = function () { this.encode = utf8EncodePolyfill; };
    if (typeof G.TextDecoder === "undefined") G.TextDecoder = function () { this.decode = utf8DecodePolyfill; };
    if (typeof G.crypto === "undefined") G.crypto = win.crypto;
    // 纯 JS base64 polyfill（Loon 运行时无 Buffer）
    if (typeof G.btoa === "undefined") G.btoa = function (s) {
      const B64C = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      let bin = "";
      for (let i = 0; i < s.length; i++) bin += String.fromCharCode(s.charCodeAt(i) & 0xff);
      let out = "";
      for (let i = 0; i < bin.length; i += 3) {
        const a = bin.charCodeAt(i);
        const b = i + 1 < bin.length ? bin.charCodeAt(i + 1) : NaN;
        const c = i + 2 < bin.length ? bin.charCodeAt(i + 2) : NaN;
        out += B64C[a >> 2];
        out += B64C[((a & 3) << 4) | (isNaN(b) ? 0 : b >> 4)];
        out += isNaN(b) ? "=" : B64C[((b & 15) << 2) | (isNaN(c) ? 0 : c >> 6)];
        out += isNaN(c) ? "=" : B64C[c & 63];
      }
      return out;
    };
    if (typeof G.atob === "undefined") G.atob = function (s) {
      const B64C = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      s = String(s).replace(/[^A-Za-z0-9+/=]/g, "");
      let out = "";
      for (let i = 0; i + 3 < s.length + 1 && i < s.length; i += 4) {
        const a = B64C.indexOf(s[i]);
        const b = B64C.indexOf(s[i + 1]);
        const c = B64C.indexOf(s[i + 2]);
        const d = B64C.indexOf(s[i + 3]);
        if (a === -1 || b === -1) break;
        out += String.fromCharCode((a << 2) | (b >> 4));
        if (c !== -1) out += String.fromCharCode(((b & 15) << 4) | (c >> 2));
        if (d !== -1) out += String.fromCharCode(((c & 3) << 6) | d);
      }
      return out;
    };

    // 执行 SDK
    eval(sdkCode);

    const chunks = win.webpackChunkmobile_cartoon_activity;
    if (!chunks || !chunks.length) {
      log("  [AntiToken] SDK chunks 未加载");
      return null;
    }

    const modules = chunks[0][1];
    const cache = {};
    function req(id) {
      if (cache[id]) return cache[id].exports;
      const m = { i: id, l: false, exports: {} };
      cache[id] = m;
      if (modules[id]) { modules[id].call(m.exports, m, m.exports, req); m.l = true; }
      return m.exports;
    }
    req.r = function (e) { Object.defineProperty(e, "__esModule", { value: true }); };
    req.d = function (e, n, g) { if (!Object.prototype.hasOwnProperty.call(e, n)) Object.defineProperty(e, n, { enumerable: true, get: g }); };
    req.o = function (o, p) { return Object.prototype.hasOwnProperty.call(o, p); };
    req.n = function (m) { const g = m && m.__esModule ? function () { return m.default; } : function () { return m; }; req.d(g, "a", g); return g; };
    req.p = "";

    const sdk = req(96636);
    const SDKClass = sdk.default || sdk;
    const instance = new SDKClass({ serverTime: Date.now(), _2827c887a48a351a: false });

    return instance.messagePackSync({
      touchEventData: true, clickEventData: true, focusblurEventData: true,
      changeEventData: true, locationInfo: true, referrer: true,
      browserSize: true, browserInfo: true, token: true, fingerprint: true
    });
  }).then(function (token) {
    if (token && String(token).length > 50) {
      log("  [AntiToken] 生成成功: " + String(token).slice(0, 40) + "...");
      return String(token);
    }
    log("  [AntiToken] 输出异常: " + String(token || "").slice(0, 100));
    return null;
  }).catch(function (e) {
    log("  [AntiToken] 异常: " + e.message);
    return null;
  });
}

// ===== Code 登录流程 =====
function assembleCookie(accessToken, uid, uin, acid, responseCookies) {
  const parts = ["PDDAccessToken=" + accessToken, "pdd_user_id=" + uid, "pdd_user_uin=" + uin];
  if (acid) parts.push("acid=" + acid);
  const apiUid = responseCookies.api_uid || "";
  if (apiUid) parts.push("api_uid=" + apiUid);
  Object.keys(responseCookies).forEach(function (k) {
    if (k !== "api_uid") parts.push(k + "=" + responseCookies[k]);
  });
  return parts.join("; ");
}

function tryDirectLogin(result, responseCookies) {
  const data = result.data || {};
  const uid = result.uid || data.uid;
  const token = result.access_token || data.access_token;
  if (uid && token) {
    log("  [登录] 直接获取到登录数据! uid=" + uid);
    const cookieStr = assembleCookie(
      token, uid,
      result.uin || (data.uin || ""),
      result.acid || (data.acid || ""),
      responseCookies
    );
    return [cookieStr, String(uid), result.uin || ""];
  }
  return null;
}

function pddCodeLogin(openid) {
  log("  --- Code登录 openId=" + mask(openid) + " ---");
  return getWxCode(openid).then(function (code) {
    if (!code) return null;
    log("  [1/4] 获取code: " + mask(code, 6, 6));

    // 获取 server_time
    return http({ url: LOGIN_BASE + "/api/server/_stm", timeout: 10 }).then(function (stmResp) {
      let serverTime = Date.now();
      try {
        const j = JSON.parse(stmResp.body);
        if (j.server_time) serverTime = j.server_time;
      } catch (e) {}
      return serverTime;
    }).then(function (serverTime) {
      // Step 2: 用 code 换取 verify_auth_token
      const randStr = randString(15);
      const loginParams = "xcx=20161201&xcx_version=" + PDD_XCX_VERSION + "&xcx_hash=" + serverTime + randStr;
      return generateAntiContent().then(function (anti) {
        const loginBody = {
          code: code, has_auth: false, app_id: PDD_APP_ID,
          support_enhance_type: 3, xcx_version: PDD_XCX_VERSION,
        };
        if (anti) loginBody.anti_content = anti;
        const headers = {
          "Content-Type": "application/json;charset=UTF-8",
          "Referer": "https://servicewechat.com/" + PDD_MINI_APP_ID + "/1840/page-frame.html",
          "x-xcx-queries": "mini_program_name=pdd;mp_theme_version=" + PDD_XCX_VERSION,
          "rfp": "LqTtkNj4yziKrApKfKKwmWgc2NXA1yXo",
        };
        if (anti) headers["anti-content"] = anti;

        return http({
          url: LOGIN_BASE + "/login?" + loginParams,
          method: "POST",
          headers: headers,
          body: JSON.stringify(loginBody),
          timeout: 15,
        }).then(function (resp) {
          let result;
          try { result = JSON.parse(resp.body); } catch (e) { result = {}; }
          let responseCookies = collectCookies(resp);
          let verifyAuthToken = result.verify_auth_token || "";

          if (!verifyAuthToken) {
            const direct = tryDirectLogin(result, responseCookies);
            if (direct) return finishLogin(direct);
            log("  [2/6] /login 未返回verify_auth_token");
            log("  [2/6] error_code=" + (result.error_code || 0) + ", msg=" + (result.error_msg || ""));
            log("  [2/6] 完整响应: " + JSON.stringify(result).slice(0, 500));
            return null;
          }
          log("  [2/6] 获取verify_auth_token: " + mask(verifyAuthToken));

          // Step 3: 第二轮 /login，携带 verifyauthtoken
          return getWxCode(openid).then(function (code2) {
            if (!code2) { log("  [3/6] 获取第二个code失败"); return null; }
            log("  [3/6] code2=" + mask(code2, 6, 6));
            return generateAntiContent().then(function (anti2) {
              const rand2 = randString(15);
              const login2Params = "xcx=20161201&xcx_version=" + PDD_XCX_VERSION + "&xcx_hash=" + serverTime + rand2;
              const login2Body = {
                code: code2, has_auth: false, app_id: PDD_APP_ID,
                support_enhance_type: 3, xcx_version: PDD_XCX_VERSION,
              };
              if (anti2) login2Body.anti_content = anti2;
              const h2 = {
                "Content-Type": "application/json;charset=UTF-8",
                "Referer": "https://servicewechat.com/" + PDD_MINI_APP_ID + "/1840/page-frame.html",
                "x-xcx-queries": "mini_program_name=pdd;mp_theme_version=" + PDD_XCX_VERSION,
                "rfp": "LqTtkNj4yziKrApKfKKwmWgc2NXA1yXo",
                "verifyauthtoken": verifyAuthToken,
              };
              if (anti2) h2["anti-content"] = anti2;

              return http({
                url: LOGIN_BASE + "/login?" + login2Params,
                method: "POST",
                headers: h2,
                body: JSON.stringify(login2Body),
                timeout: 15,
              }).then(function (resp2) {
                let result2;
                try { result2 = JSON.parse(resp2.body); } catch (e) { result2 = {}; }
                responseCookies = Object.assign(responseCookies, collectCookies(resp2));
                let verifyAuthToken2 = result2.verify_auth_token || "";

                if (!verifyAuthToken2) {
                  const direct = tryDirectLogin(result2, responseCookies);
                  if (direct) return finishLogin(direct);
                  log("  [3/6] 第二轮 /login 未返回verify_auth_token 且无直接登录数据");
                  log("  [3/6] error_code=" + (result2.error_code || 0) + ", msg=" + (result2.error_msg || ""));
                  log("  [3/6] 完整响应: " + JSON.stringify(result2).slice(0, 300));
                  return null;
                }
                verifyAuthToken = verifyAuthToken2;
                log("  [3/6] 第二轮token: " + mask(verifyAuthToken));

                // Step 4: 用第二轮 verify_auth_token 换取正式 token
                const rand3 = randString(15);
                const verifyParams = "xcx=20161201&xcx_version=" + PDD_XCX_VERSION + "&xcx_hash=" + serverTime + rand3;
                return generateAntiContent().then(function (anti3) {
                  const verifyBody = {
                    has_auth: false, support_enhance_type: 3,
                    verify_auth_token: verifyAuthToken, xcx_version: PDD_XCX_VERSION,
                  };
                  if (anti3) verifyBody.anti_content = anti3;
                  const h3 = {
                    "Content-Type": "application/json;charset=UTF-8",
                    "Referer": "https://servicewechat.com/" + PDD_MINI_APP_ID + "/1840/page-frame.html",
                    "x-xcx-queries": "mini_program_name=pdd;mp_theme_version=" + PDD_XCX_VERSION,
                    "rfp": "LqTtkNj4yziKrApKfKKwmWgc2NXA1yXo",
                    "verifyauthtoken": verifyAuthToken,
                  };
                  if (anti3) h3["anti-content"] = anti3;

                  return http({
                    url: LOGIN_BASE + "/api/sigerus/verify/login?" + verifyParams,
                    method: "POST",
                    headers: h3,
                    body: JSON.stringify(verifyBody),
                    timeout: 15,
                  }).then(function (resp3) {
                    let result3;
                    try { result3 = JSON.parse(resp3.body); } catch (e) { result3 = {}; }
                    responseCookies = Object.assign(responseCookies, collectCookies(resp3));

                    const uid = result3.uid || 0;
                    const uin = result3.uin || "";
                    const accessToken = result3.access_token || "";
                    const acid = result3.acid || "";

                    if (!uid || !accessToken) {
                      log("  [4/6] 登录失败: " + JSON.stringify(result3).slice(0, 300));
                      return null;
                    }
                    log("  [4/6] 登录成功! uid=" + uid + ", uin=" + mask(uin));

                    const cookieStr = assembleCookie(accessToken, uid, uin, acid, responseCookies);
                    log("  [5/6] Cookie组装完成");

                    // Step 5: 访问果园页面收集额外 Cookie（尽力而为，失败可忽略）
                    return collectGardenCookies(cookieStr).then(function (updated) {
                      log("  [6/6] Cookie已更新 (共" + Object.keys(cookieStrToDict(updated)).length + "项)");
                      return [updated, String(uid), uin];
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

function finishLogin(loginTuple) {
  const cookieStr = loginTuple[0];
  return collectGardenCookies(cookieStr).then(function (updated) {
    log("  [6/6] Cookie已更新 (共" + Object.keys(cookieStrToDict(updated)).length + "项)");
    return [updated, loginTuple[1], loginTuple[2]];
  });
}

function collectGardenCookies(cookieStr) {
  const gardenUrl = "https://mobile.yangkeduo.com/garden_index_lz_0.html?_pdd_fs=1&_pdd_tc=676666&_pdd_sbs=1&fun_id=wechat_app_home";
  return http({
    url: gardenUrl,
    method: "GET",
    headers: {
      "User-Agent": UA,
      "Referer": "https://servicewechat.com/" + PDD_MINI_APP_ID + "/1840/page-frame.html",
      "Cookie": cookieStr,
    },
    timeout: 15,
  }).then(function (resp) {
    const d = cookieStrToDict(cookieStr);
    Object.assign(d, collectCookies(resp));
    return cookieDictToStr(d);
  }).catch(function (e) {
    log("  [6/6] 页面访问异常(可忽略): " + e.message);
    return cookieStr;
  });
}

// ===== 果园任务 API =====
function manorPost(path, pdduid, body, cookieStr, extraQs) {
  const qs = "pdduid=" + pdduid + (extraQs ? "&" + extraQs : "");
  return postJson(MANOR_BASE + path + "?" + qs, body, null, cookieStr, 15);
}

function getWater(pdduid, cookieStr) {
  return manorPost("/manor-gateway/manor/query/user/water", pdduid, {}, cookieStr, "is_back=1")
    .then(function (r) { return r.water_amount || 0; })
    .catch(function () { return 0; });
}

function waterTree(pdduid, cookieStr, tubetoken, maxTimes) {
  return getWater(pdduid, cookieStr).then(function (water) {
    log("  [浇水] 当前水滴: " + water);
    if (water < 10) {
      log("  [浇水] 水滴不足10颗，跳过");
      return 0;
    }
    const url = MANOR_BASE + "/manor/water/cost";
    const count = Math.min(maxTimes, Math.floor(water / 10));
    let watered = 0;
    let cur = water;

    function doOne(i) {
      if (i >= count || cur < 10) return Promise.resolve();
      const body = {
        atw: true, location_auth: false, last_stay_time: 10 + i * 4,
        can_trigger_random_mission: false, product_scene: 0, minor: false,
        ext_params: { can_trigger201824: true }, mission_type: 0,
        cost_water_amount: 10, merge_cost: false, fun_id: "wechat_app_home",
        lower_end_device: false, cost_water_competition_in_scene_icon: false,
        is_small_screen: true, tubetoken: tubetoken, fun_pl: 2,
      };
      return postJson(url + "?pdduid=" + pdduid, body, null, cookieStr, 15).then(function (result) {
        const left = result.now_water_amount;
        if (left !== undefined && left !== null && left < cur) {
          cur = left;
          watered++;
          log("  [浇水] " + watered + "/" + count + ", 剩余: " + left);
          if (left < 10) return Promise.resolve();
          return new Promise(function (r) { setTimeout(r, 150); }).then(function () { return doOne(i + 1); });
        }
        log("  [浇水] 水滴未扣除，停止");
        return Promise.resolve();
      }).catch(function (e) {
        log("  [浇水] 请求失败: " + e.message);
        return Promise.resolve();
      });
    }

    return doOne(0).then(function () {
      return getWater(pdduid, cookieStr).then(function (finalWater) {
        log("  [浇水] 完成! 浇水" + watered + "次, 剩余水滴: " + finalWater);
        return watered;
      });
    });
  });
}

function getHomePage(pdduid, cookieStr, tubetoken) {
  const body = {
    mission_type: 0, fun_id: "wechat_app_home", message_source: null,
    page_type: "HOME_PAGE", push_source_mission_type: 0,
    fruit_config_version: "", unlock_scene_version: "",
    app_home_click_icon_type: null, tubetoken: tubetoken,
    push_act_source: null, need_show_home_popup: true, fun_pl: 2,
  };
  return manorPost("/manor-query/proxy/home/page", pdduid, body, cookieStr)
    .then(function (result) {
      if (result.error_code === 40001) {
        log("  [首页] 验证失败, Cookie可能已过期");
        return [null, null];
      }
      const newToken = result.tubetoken || tubetoken;
      const water = result.water_amount || 0;
      log("  [首页] 水滴: " + water);
      return [newToken, water];
    })
    .catch(function (e) {
      log("  [首页] 请求异常: " + e.message);
      return [null, null];
    });
}

function getMissionList(pdduid, cookieStr, tubetoken) {
  log("  [任务] 获取任务列表...");
  const body = {
    activity_id_list: [201015, 201036],
    mission_types: [38160, 38242, 38090, 38451, 37859, 38428,
      38500, 38501, 38502, 38503, 38504, 38505,
      38600, 38601, 38700, 38701, 38800, 38900,
      37900, 37950, 38000, 38050, 38100, 38150],
    request_params: { act201015EntryInfo: {}, act201036EntryInfo: {} },
    lower_end_device: false, tubetoken: tubetoken, fun_pl: 2,
  };
  for (let i = 1; i <= 8; i++) {
    body.request_params.act201015EntryInfo[String(i)] = { needRefresh: true };
    body.request_params.act201036EntryInfo[String(i)] = { needRefresh: true };
  }
  return manorPost("/manor/mission/list", pdduid, body, cookieStr).then(function (result) {
    const activityMap = result.activity_vo_map || {};
    const tasks = [];
    Object.keys(activityMap).forEach(function (actIdStr) {
      const actId = parseInt(actIdStr, 10);
      const actMissions = activityMap[actIdStr].mission_list || {};
      Object.keys(actMissions).forEach(function (missionIdStr) {
        const m = actMissions[missionIdStr];
        const rewardInfo = m.reward_info || [];
        let rewardAmount = 0;
        let rewardType = "";
        for (let i = 0; i < rewardInfo.length; i++) {
          if (rewardInfo[i].reward_type === 1) {
            rewardAmount = rewardInfo[i].min_reward_amount || 0;
            rewardType = "水滴";
            break;
          }
        }
        if (!rewardAmount && rewardInfo.length) {
          rewardAmount = rewardInfo[0].min_reward_amount || 0;
          rewardType = "T" + (rewardInfo[0].reward_type || "?");
        }
        tasks.push({
          activity_id: actId,
          mission_id: parseInt(missionIdStr, 10),
          type: m.type,
          unified_status: m.unified_status,
          is_draw: m.is_draw || false,
          is_open: m.is_open || false,
          finished_count: m.finished_count || 0,
          max_count: m.max_count || 0,
          reward_amount: rewardAmount,
          reward_type: rewardType,
        });
      });
    });

    const canClaim = tasks.filter(function (t) { return !t.is_draw && t.is_open && t.finished_count >= 1; });
    const needAccept = tasks.filter(function (t) { return !t.is_draw && !t.is_open && t.finished_count >= 1; });

    if (tasks.length) {
      log("  [任务] 共" + tasks.length + "个, 可领取: " + canClaim.length + ", 需接受: " + needAccept.length);
      tasks.forEach(function (t) {
        let flag = "";
        if (!t.is_draw && t.is_open && t.finished_count >= 1) flag = " [可领]";
        else if (!t.is_draw && !t.is_open && t.finished_count >= 1) flag = " [需接]";
        log("    act=" + t.activity_id + " id=" + t.mission_id +
          " draw=" + t.is_draw + " open=" + t.is_open +
          " done=" + t.finished_count + "/" + t.max_count +
          " +" + t.reward_amount + t.reward_type + flag);
      });
    }
    return [canClaim, needAccept];
  }).catch(function (e) {
    log("  [任务] 获取失败: " + e.message);
    return [[], []];
  });
}

function acceptMission(pdduid, cookieStr, tubetoken, activityId, missionId) {
  const body = { mission_id: missionId, activity_id: activityId, tubetoken: tubetoken, fun_pl: 2 };
  return manorPost("/manor/mission/accept", pdduid, body, cookieStr).then(function (result) {
    if (result.success) { log("  [任务] 接受成功 act=" + activityId + " id=" + missionId); return true; }
    log("  [任务] 接受失败 act=" + activityId + " id=" + missionId + ": " + (result.error_msg || ""));
    return false;
  }).catch(function (e) {
    log("  [任务] 接受异常: " + e.message);
    return false;
  });
}

function claimMission(pdduid, cookieStr, tubetoken, activityId, missionId) {
  const body = { mission_id: missionId, activity_id: activityId, tubetoken: tubetoken, fun_pl: 2 };
  return manorPost("/manor/mission/draw", pdduid, body, cookieStr).then(function (result) {
    if (result.success) {
      const reward = result.water || result.reward_amount || 0;
      log("  [任务] 领取成功 act=" + activityId + " id=" + missionId + ": +" + reward + "水滴");
      return true;
    }
    log("  [任务] 领取失败 act=" + activityId + " id=" + missionId + ": " + (result.error_msg || ""));
    return false;
  }).catch(function (e) {
    log("  [任务] 领取异常: " + e.message);
    return false;
  });
}

function dailyCheckin(pdduid, cookieStr, tubetoken) {
  log("  [签到] 签到中...");
  const body = {
    type: 201811,
    params: { ui_id: 3, type: 2 },
    fun_id: "wechat_app_home", tubetoken: tubetoken, fun_pl: 2,
  };
  return manorPost("/manor/common/apply/activity", pdduid, body, cookieStr).then(function (result) {
    if (result.success) { log("  [签到] 成功!"); return true; }
    log("  [签到] 今日已签到");
    return false;
  }).catch(function (e) {
    log("  [签到] 请求异常: " + e.message);
    return false;
  });
}

// ===== 抢水滴 =====
function getFriendList(pdduid, cookieStr, tubetoken) {
  log("  [偷水] 获取好友列表...");
  const body = { page_num: 1, tubetoken: tubetoken, fun_pl: 2 };
  return manorPost("/manor-query/friend/list/page", pdduid, body, cookieStr).then(function (result) {
    const friendList = result.friend_list || [];
    const canSteal = [];
    friendList.forEach(function (f) {
      const stealStatus = f.steal_water_status || {};
      if (stealStatus.status === 2) {
        canSteal.push({ uid: f.uid, nickname: f.nickname || "未知", amount: f.amount || 0 });
      }
    });
    log("  [偷水] 可偷好友: " + canSteal.length + " 人");
    canSteal.forEach(function (f) { log("    uid=" + f.uid + " " + f.nickname + " 水量=" + f.amount); });
    return canSteal;
  }).catch(function (e) {
    log("  [偷水] 好友列表获取失败: " + e.message);
    return [];
  });
}

function getStealChances(pdduid, cookieStr, tubetoken) {
  const body = { tubetoken: tubetoken, fun_pl: 2 };
  return manorPost("/manor/steal/chance/lack", pdduid, body, cookieStr).then(function (result) {
    const activityMap = result.activity_vo_map || {};
    const stealInfo = activityMap["201423"] || {};
    const restChance = stealInfo.rest_chance || 0;
    const robots = stealInfo.robots || [];
    const robotUids = robots.map(function (r) { return [r.uid, r.nickname || "机器人", r.water || 0]; });
    log("  [偷水] 剩余次数: " + restChance + ", 机器人: " + robotUids.length + " 个");
    return [restChance, robotUids];
  }).catch(function (e) {
    log("  [偷水] 次数查询失败: " + e.message);
    return [0, []];
  });
}

function stealWaterFromFriend(pdduid, cookieStr, tubetoken, friendUid, dogStatus) {
  const body = {
    friend_uid: friendUid, steal_type: 10,
    dog_status: dogStatus, tubetoken: tubetoken, fun_pl: 2,
  };
  return manorPost("/manor/steal/water", pdduid, body, cookieStr).then(function (result) {
    return [result.steal_amount || 0, result.bitten_water || 0];
  }).catch(function (e) {
    log("  [偷水] 请求异常: " + e.message);
    return [null, null];
  });
}

function stealFromFriends(pdduid, cookieStr, tubetoken) {
  return getFriendList(pdduid, cookieStr, tubetoken).then(function (friends) {
    return getStealChances(pdduid, cookieStr, tubetoken).then(function (info) {
      const restChance = info[0];
      const robotUids = info[1];
      const allTargets = friends.map(function (f) { return [f.uid, f.nickname, f.amount]; });
      robotUids.forEach(function (r) { allTargets.push(r); });

      if (!allTargets.length) { log("  [偷水] 没有可偷的目标"); return; }

      const maxSteals = restChance > 0 ? Math.min(restChance, allTargets.length) : allTargets.length;
      log("  [偷水] 开始偷水, 最多 " + maxSteals + " 次...");

      let totalStolen = 0;
      let stealCount = 0;
      let idx = 0;

      function next() {
        if (idx >= maxSteals) {
          log("  [偷水] 完成! 共偷 " + stealCount + " 次, 获得 " + totalStolen + " 水滴");
          return Promise.resolve();
        }
        const target = allTargets[idx];
        idx++;
        const targetUid = target[0];
        const nickname = target[1];
        const water = target[2];
        if (water <= 0) return next();

        const dog = 1 + Math.floor(Math.random() * 3);
        let stolen = 0;
        let retried = 0;

        function trySteal(retry) {
          retried = retry;
          if (retry >= 3) return Promise.resolve();
          return stealWaterFromFriend(pdduid, cookieStr, tubetoken, targetUid, dog).then(function (r) {
            const amount = r[0];
            const bitten = r[1];
            if (amount > 0) { stolen = amount; return Promise.resolve(); }
            return new Promise(function (res) { setTimeout(res, 150); }).then(function () { return trySteal(retry + 1); });
          });
        }

        return trySteal(0).then(function () {
          if (stolen > 0) {
            totalStolen += stolen;
            stealCount++;
            log("  [偷水] uid=" + targetUid + " " + nickname + " dog=" + dog + ": +" + stolen + "滴");
          } else {
            log("  [偷水] uid=" + targetUid + " " + nickname + " dog=" + dog + ": 未偷到(重试" + (retried + 1) + "次)");
          }
          return new Promise(function (res) { setTimeout(res, 200); }).then(next);
        });
      }

      return next();
    });
  });
}

// ===== 单账号处理 =====
function processAccount(openid, idx, total) {
  log("\n" + "=".repeat(48));
  log("账号 [" + idx + "/" + total + "] openId=" + mask(openid));

  let cookieStr = cachedCookie(openid);
  let pdduid = "";

  function ensureValidCookie() {
    if (!cookieStr) return Promise.resolve();
    pdduid = extractUid(cookieStr);
    if (!pdduid) { cookieStr = ""; return Promise.resolve(); }
    const cookies = cookieStrToDict(cookieStr);
    return getHomePage(pdduid, cookieStr, cookies.tubetoken || "").then(function (r) {
      const newToken = r[0];
      if (newToken !== null && newToken !== undefined) {
        log("缓存Cookie有效, uid=" + pdduid);
      } else {
        log("缓存Cookie失效, 重新登录");
        cookieStr = "";
      }
    });
  }

  return ensureValidCookie().then(function () {
    if (!cookieStr) {
      return pddCodeLogin(openid).then(function (result) {
        if (!result) {
          log("[失败] 登录失败, 跳过此账号");
          return null;
        }
        cookieStr = result[0];
        pdduid = result[1];
        saveCookieCache(openid, cookieStr);
        return true;
      });
    }
    return true;
  }).then(function (ok) {
    if (!ok) return;
    if (!pdduid) pdduid = extractUid(cookieStr);
    if (!pdduid) { log("[失败] Cookie中无 pdd_user_id"); return; }
    log("UID: " + pdduid);

    const cookies = cookieStrToDict(cookieStr);
    let tubetoken = cookies.tubetoken || "";

    return getHomePage(pdduid, cookieStr, tubetoken).then(function (r) {
      const newToken = r[0];
      const water = r[1];
      if (newToken === null || newToken === undefined) {
        log("[失败] 首页加载失败, Cookie 无效");
        return;
      }
      if (newToken && newToken !== tubetoken) {
        tubetoken = newToken;
        cookies.tubetoken = tubetoken;
        cookieStr = cookieDictToStr(cookies);
        saveCookieCache(openid, cookieStr);
      }
      log("当前水滴: " + water);

      return dailyCheckin(pdduid, cookieStr, tubetoken).then(function () {
        return sleep(500);
      }).then(function () {
        return waterTree(pdduid, cookieStr, tubetoken, CONFIG.PDD_WATER_MAX);
      }).then(function () {
        return sleep(500);
      }).then(function () {
        return getMissionList(pdduid, cookieStr, tubetoken);
      }).then(function (missionRes) {
        const canClaim = missionRes[0];
        const needAccept = missionRes[1];
        let p = Promise.resolve();
        if (needAccept.length) {
          log("\n  [任务] 正在接受 " + needAccept.length + " 个任务...");
          needAccept.forEach(function (t) {
            p = p.then(function () {
              return acceptMission(pdduid, cookieStr, tubetoken, t.activity_id, t.mission_id);
            }).then(function () { return sleep(400); });
          });
        }
        return p.then(function () {
          if (canClaim.length) {
            log("\n  [任务] 正在领取 " + canClaim.length + " 个任务...");
            canClaim.forEach(function (t) {
              p = p.then(function () {
                return claimMission(pdduid, cookieStr, tubetoken, t.activity_id, t.mission_id);
              }).then(function () { return sleep(400); });
            });
          }
          return p;
        }).then(function () {
          if (CONFIG.PDD_STEAL) return stealFromFriends(pdduid, cookieStr, tubetoken);
        }).then(function () {
          return getWater(pdduid, cookieStr).then(function (finalWater) {
            log("\n最终水滴: " + finalWater);
            return "账号 " + mask(openid) + " 完成，最终水滴: " + finalWater;
          });
        });
      });
    });
  });
}

function sleep(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

// ===== 直接 Cookie 模式 =====
function processDirectCookie(cookieStr) {
  log("=".repeat(48));
  log("使用 Cookie 直连模式（PDD_COOKIE / MITM 捕获）");

  const pdduid = extractUid(cookieStr);
  if (!pdduid) { log("[错误] Cookie 缺少 pdd_user_id"); return Promise.resolve(); }
  log("UID: " + pdduid);

  const cookies = cookieStrToDict(cookieStr);
  let tubetoken = cookies.tubetoken || "";

  return getHomePage(pdduid, cookieStr, tubetoken).then(function (r) {
    const newToken = r[0];
    const water = r[1];
    if (newToken === null || newToken === undefined) {
      log("[失败] Cookie 无效");
      return "Cookie 无效";
    }
    if (newToken) tubetoken = newToken;
    log("当前水滴: " + water);

    return dailyCheckin(pdduid, cookieStr, tubetoken).then(function () {
      return sleep(500);
    }).then(function () {
      return waterTree(pdduid, cookieStr, tubetoken, CONFIG.PDD_WATER_MAX);
    }).then(function () {
      return sleep(500);
    }).then(function () {
      return getMissionList(pdduid, cookieStr, tubetoken);
    }).then(function (missionRes) {
      const canClaim = missionRes[0];
      const needAccept = missionRes[1];
      let p = Promise.resolve();
      if (needAccept.length) {
        log("\n  [任务] 正在接受 " + needAccept.length + " 个任务...");
        needAccept.forEach(function (t) {
          p = p.then(function () {
            return acceptMission(pdduid, cookieStr, tubetoken, t.activity_id, t.mission_id);
          }).then(function () { return sleep(400); });
        });
      }
      return p.then(function () {
        if (canClaim.length) {
          log("\n  [任务] 正在领取 " + canClaim.length + " 个任务...");
          canClaim.forEach(function (t) {
            p = p.then(function () {
              return claimMission(pdduid, cookieStr, tubetoken, t.activity_id, t.mission_id);
            }).then(function () { return sleep(400); });
          });
        }
        return p;
      }).then(function () {
        if (CONFIG.PDD_STEAL) return stealFromFriends(pdduid, cookieStr, tubetoken);
      }).then(function () {
        return getWater(pdduid, cookieStr).then(function (finalWater) {
          log("\n最终水滴: " + finalWater);
          return "Cookie 模式完成，最终水滴: " + finalWater;
        });
      });
    });
  });
}

// ===== 通知 =====
function notify(title, body) {
  try {
    if (typeof $notification !== "undefined" && $notification.post) {
      $notification.post(title, "", body || "");
    }
  } catch (e) {}
}

// ===== 入口 =====
function main() {
  log("=".repeat(48));
  log("拼多多果园 - 自动浇水领水滴");
  log("Build: " + SCRIPT_BUILD);

  if (CONFIG.PDD_DEBUG_ANTI) {
    log("[调试] PDD_DEBUG_ANTI=true，仅测试 anti_content 生成");
    return generateAntiContent().then(function (token) {
      if (token) {
        log("[调试] anti_content 生成成功，长度 " + token.length);
        notify("拼多多果园 - AntiToken 测试", "生成成功，长度 " + token.length);
      } else {
        log("[调试] anti_content 生成失败");
        notify("拼多多果园 - AntiToken 测试", "生成失败，详见日志");
      }
      return Promise.resolve();
    });
  }

  if (CONFIG.PDD_COOKIE) {
    return processDirectCookie(CONFIG.PDD_COOKIE).then(function (summary) {
      notify("拼多多果园", summary || "执行完成");
    });
  }

  // 无手动 PDD_COOKIE 时，按优先级尝试自动获取：
  // 1) 手动填写的 App 三件套 (PDD_ACCESS_TOKEN + PDD_USER_ID)
  // 2) http-request 自动捕获的 App 身份 (persistentStore: pdd_app_identity)
  // 3) MITM 捕获的网页 Cookie (persistentStore: pdd_cookie_direct)
  if (CONFIG.PDD_COOKIE_STORE) {
    let directCookie = "";

    if (CONFIG.PDD_ACCESS_TOKEN && CONFIG.PDD_USER_ID) {
      directCookie = assembleAppCookie(CONFIG.PDD_ACCESS_TOKEN, CONFIG.PDD_USER_ID, CONFIG.PDD_API_UID || "");
      log("[配置] 使用手动配置的 App 身份 (PDD_ACCESS_TOKEN)");
    } else {
      const appIdent = readAppIdentity();
      if (appIdent && appIdent.access_token && appIdent.pdd_user_id) {
        directCookie = assembleAppCookie(appIdent.access_token, appIdent.pdd_user_id, appIdent.api_uid || "");
        log("[配置] 使用自动捕获的 App 身份 (persistentStore: pdd_app_identity, uid=" + appIdent.pdd_user_id + ")");
      } else {
        const captured = $persistentStore.read("pdd_cookie_direct") || "";
        if (captured) {
          directCookie = captured;
          log("[配置] 使用 MITM 自动捕获的网页 Cookie (persistentStore: pdd_cookie_direct)");
        }
      }
    }

    if (directCookie) {
      return processDirectCookie(directCookie).then(function (summary) {
        notify("拼多多果园", summary || "执行完成");
      });
    }
  }

  if (!CONFIG.YYB_GO_URL) {
    log("[错误] 未配置任何登录方式!");
    log("  方式1 (推荐): 打开拼多多果园页面自动捕获 Cookie");
    log("    → Loon 设置中打开 MITM 并信任证书");
    log("    → 确保插件已加载 http-response 捕获规则");
    log("    → 打开果园页面后收到『Cookie 已捕获』通知即可");
    log("  方式2: 手动填写 PDD_COOKIE (完整 cookie, 需含 pdd_user_id)");
    log("  方式3: 配置 YYB_GO_URL + PDD_OPENID (YYB Go code 登录)");
    notify("拼多多果园", "未捕获到 Cookie：请打开果园页面（需开启 Loon MITM），或配置 PDD_COOKIE / YYB_GO_URL");
    return Promise.resolve();
  }

  const openids = parseOpenids(CONFIG.PDD_OPENID);
  if (!openids.length) {
    log("[错误] 未配置 PDD_OPENID");
    notify("拼多多果园", "未配置 PDD_OPENID");
    return Promise.resolve();
  }

  log("共 " + openids.length + " 个账号");

  let p = Promise.resolve();
  let okCount = 0;
  openids.forEach(function (oid, i) {
    p = p.then(function () {
      return processAccount(oid, i + 1, openids.length).then(function () { okCount++; });
    }).catch(function (e) {
      log("[账号异常] " + e.message + "\n" + (e.stack || ""));
    });
  });

  return p.then(function () {
    log("\n" + "=".repeat(48));
    log("全部账号处理完毕 (" + okCount + "/" + openids.length + " 成功)");
    notify("拼多多果园", "全部账号处理完毕 (" + okCount + "/" + openids.length + " 成功)");
  });
}

// ===== App 身份（AccessToken 体系）=====
// 拼多多 App 的果园请求认证方式：AccessToken 请求头 + URL 的 pdduid 参数 + api_uid Cookie
// 这些字段可组装成网页版 Cookie 使用（已实测验证）
function assembleAppCookie(accessToken, pddUserId, apiUid) {
  const parts = ["PDDAccessToken=" + accessToken, "pdd_user_id=" + pddUserId];
  if (apiUid) parts.push("api_uid=" + apiUid);
  return parts.join("; ");
}

function readAppIdentity() {
  try {
    const raw = $persistentStore.read("pdd_app_identity");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveAppIdentity(ident) {
  try {
    ident.updatedAt = new Date().toISOString();
    $persistentStore.write(JSON.stringify(ident), "pdd_app_identity");
  } catch (e) {
    log("[抓身份] 写入失败: " + e.message);
  }
}

// 从请求对象提取 App 身份（http-request 触发）
function extractAppIdentity(req) {
  const ident = { access_token: "", pdd_user_id: "", api_uid: "" };
  if (!req) return ident;
  const headers = req.headers || {};
  Object.keys(headers).forEach(function (k) {
    if (k.toLowerCase() === "accesstoken") ident.access_token = headers[k];
  });
  const m = String(req.url || "").match(/pdduid=(\d+)/);
  if (m) ident.pdd_user_id = m[1];
  const ck = headers["Cookie"] || headers["cookie"] || "";
  const m2 = String(ck).match(/api_uid=([^;]+)/);
  if (m2) ident.api_uid = m2[1];
  return ident;
}

// ===== Cookie 捕获模式（http-request 触发）=====
// 由 Loon 的 http-request 规则调用：App 果园 API 请求经过时，
// 自动提取 AccessToken / pdduid / api_uid 存入 persistentStore: pdd_app_identity
function runRequestCapture() {
  try {
    if (CONFIG.PDD_CAPTURE === false) {
      if (typeof $done === "function") $done({});
      return;
    }
    const ident = extractAppIdentity($request);
    if (!ident.access_token || !ident.pdd_user_id) {
      if (typeof $done === "function") $done({});
      return;
    }
    const prev = readAppIdentity();
    const changed = !prev ||
      prev.access_token !== ident.access_token ||
      prev.pdd_user_id !== ident.pdd_user_id ||
      (prev.api_uid || "") !== (ident.api_uid || "");
    if (changed) {
      saveAppIdentity(ident);
      log("[抓身份] App 身份已更新: uid=" + ident.pdd_user_id);
      notify("拼多多果园 - 身份已捕获", "已保存 App 登录身份，直接运行脚本即可");
    }
  } catch (e) {
    log("[抓身份] 异常: " + e.message);
  }
  if (typeof $done === "function") $done({});
}

// ===== Cookie 捕获模式（MITM http-response 触发）=====
// 由 Loon 的 http-response 规则调用：打开拼多多果园页面时，
// 自动把 Set-Cookie 合并存入 persistentStore: pdd_cookie_direct
function runCookieCapture() {
  if (CONFIG.PDD_CAPTURE === false) {
    // 开关关闭：不捕获，直接放行
    if (typeof $done === "function") $done({ response: $response });
    return;
  }
  try {
    const resp = $response;
    const headers = resp.headers || {};
    let sc = headers["set-cookie"] || headers["Set-Cookie"];
    if (!sc) {
      if (typeof $done === "function") $done({ response: resp });
      return;
    }
    const arr = Array.isArray(sc) ? sc : splitSetCookies(String(sc));
    const dict = cookieStrToDict($persistentStore.read("pdd_cookie_direct") || "");
    arr.forEach(function (seg) {
      const semi = seg.indexOf(";");
      const pair = semi >= 0 ? seg.slice(0, semi) : seg;
      const eq = pair.indexOf("=");
      if (eq > 0) {
        const k = pair.slice(0, eq).trim();
        const v = pair.slice(eq + 1).trim();
        if (k && v) dict[k] = v;
      }
    });
    const merged = cookieDictToStr(dict);
    const prev = $persistentStore.read("pdd_cookie_direct") || "";
    if (merged && merged !== prev) {
      $persistentStore.write(merged, "pdd_cookie_direct");
      log("[抓Cookie] 已更新，共 " + Object.keys(dict).length + " 项");
      if (dict.pdd_user_id && dict.PDDAccessToken) {
        notify("拼多多果园 - Cookie 已捕获", "已保存，直接运行脚本即可自动使用");
      }
    }
  } catch (e) {
    log("[抓Cookie] 异常: " + e.message);
  }
  if (typeof $done === "function") $done({ response: $response });
}

// ===== 入口：区分触发方式 =====
// http-request 触发（App 身份捕获）→ runRequestCapture
// http-response 触发（网页 Cookie 捕获）→ runCookieCapture
// cron / 手动运行 → main()
if (typeof $response !== "undefined" && $response && $response.headers) {
  runCookieCapture();
} else if (typeof $request !== "undefined" && $request) {
  runRequestCapture();
} else {
  main().catch(function (e) {
    log("[异常] " + (e && e.stack ? e.stack : e));
  }).then(function () {
    if (typeof $done === "function") {
      try { $done(); } catch (e) {}
    }
  });
}