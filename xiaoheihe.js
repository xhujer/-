const SCRIPT_NAME = "小黑盒签到与任务";
const STORAGE_KEY = "xhh_sign_accounts_v1";
const API_BASE = "https://api.xiaoheihe.cn";
const DATA_BASE = "https://data.xiaoheihe.cn";
const HKEY_API = "https://hkey.qcciii.com/hkey";
const PATH_TASK_LIST = "/task/list_v2/";
const PATH_SIGN = "/task/sign_v3/sign";
const PATH_SIGN_STATE = "/task/sign_v3/get_sign_state";
const PATH_FEEDS = "/bbs/app/feeds";
const PATH_GAME_RECOMMEND = "/game/all_recommend/v2";
const PATH_GAME_COMMENTS = "/bbs/app/link/game/comments";
const PATH_VIEW_TIME = "/bbs/app/link/view/time";
const PATH_DATA_REPORT = "/account/data_report/";
const PATH_BBS_POST = "/bbs/app/api/link/post";
const PATH_BBS_DELETE = "/bbs/app/link/delete";
const APP_UA =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36 ApiMaxJia/1.0";
const APP_REFERER = "http://api.maxjia.com/";
const MAX_ACCOUNTS = 10;
const WAITING_STATE = "waiting";
const FINISH_STATE = "finish";
const OK_STATE = "ok";
const SHARE_TASK_SETTLE_MS = 2200;
const GAME_REVIEW_CONTENT = "好玩推荐游戏体验非常好";
const RUN_BUDGET_MS = 540 * 1000;
const SIGN_ATTEMPTS = 2;
const SIGN_WAIT_DEFAULT_SEC = 30;
const SIGN_WAIT_MIN_SEC = 6;
const SIGN_WAIT_MAX_SEC = 120;
const SIGN_POLL_GAPS = [2000, 4000, 7000, 11000, 15000];
const SIGN_FINAL_WAIT_MS = 5000;
const SIGN_RETRY_DELAY_MS = 2000;
const SIGNED_STATES = /^(ok|finish|ignore)$/i;
const LOGIN_EXPIRED_HINT = "登录态已失效，请打开小黑盒 App 进入“我的”页面刷新一次以重新获取账号";
const APP_PROFILE = {
  os_type: "Android",
  x_os_type: "Android",
  x_client_type: "mobile",
  os_version: "12",
  dw: "360",
  channel: "heybox",
  x_app: "heybox",
  time_zone: "Asia/Shanghai",
  device_info: "HBP-AL00"
};


const WEB_SIGN_ALPHABET = "AB45STUVWZEFGJ6CH01D237IXYPQRKLMN89";
const WEB_VERSION = "999.0.4";
const WEB_PROFILE = {
  app: "heybox",
  os_type: "web",
  x_app: "heybox",
  x_client_type: "web",
  x_os_type: "Android",
  x_client_version: "1.3.389",
};
const WEB_UA =
  "Mozilla/5.0 (Linux; Android 16; 23113RKC6C Build/BP2A.250605.031.A3; wv) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/143.0.7499.192 Mobile Safari/537.36";

function mul2(value) {
  return 128 & value ? 255 & ((value << 1) ^ 27) : value << 1;
}

function mixX(value) {
  return mul2(value) ^ value;
}

function mixK(value) {
  return mixX(mul2(value));
}

function mixC(value) {
  return mixK(mixX(mul2(value)));
}

function mixS(value) {
  return mixC(value) ^ mixK(value) ^ mixX(value);
}

function mixArray(input) {
  const output = [0, 0, 0, 0];
  output[0] = mixS(input[0]) ^ mixC(input[1]) ^ mixK(input[2]) ^ mixX(input[3]);
  output[1] = mixX(input[0]) ^ mixS(input[1]) ^ mixC(input[2]) ^ mixK(input[3]);
  output[2] = mixK(input[0]) ^ mixX(input[1]) ^ mixS(input[2]) ^ mixC(input[3]);
  output[3] = mixC(input[0]) ^ mixK(input[1]) ^ mixX(input[2]) ^ mixS(input[3]);
  input[0] = output[0];
  input[1] = output[1];
  input[2] = output[2];
  input[3] = output[3];
  return input;
}

function remapByAlphabet(input, alphabet, endOffset) {
  let output = "";
  const base = alphabet.slice(0, endOffset);
  for (let index = 0; index < input.length; index += 1) {
    output += base.charAt(input.charCodeAt(index) % base.length);
  }
  return output;
}

function remapFull(input, alphabet) {
  let output = "";
  for (let index = 0; index < input.length; index += 1) {
    output += alphabet.charAt(input.charCodeAt(index) % alphabet.length);
  }
  return output;
}

function interleaveParts(parts) {
  let output = "";
  let maxLength = 0;
  for (let i = 0; i < parts.length; i += 1) {
    maxLength = Math.max(maxLength, parts[i].length);
  }
  for (let index = 0; index < maxLength; index += 1) {
    for (let i = 0; i < parts.length; i += 1) {
      if (index < parts[i].length) output += parts[i].charAt(index);
    }
  }
  return output;
}

function normalizeSignPath(path) {
  return "/" + String(path).split("/").filter(Boolean).join("/") + "/";
}

function makeWebHkey(path, timeSec, nonce) {
  const alphabet = WEB_SIGN_ALPHABET;
  const timePart = remapByAlphabet(String(timeSec), alphabet, -2);
  const pathPart = remapFull(normalizeSignPath(path), alphabet);
  const noncePart = remapFull(nonce, alphabet);
  const mixed = interleaveParts([timePart, pathPart, noncePart]).slice(0, 20);
  const digest = md5(mixed);
  let suffix = String(
    mixArray(
      digest
        .slice(-6)
        .split("")
        .map((char) => char.charCodeAt(0))
    ).reduce((sum, value) => sum + value, 0) % 100
  );
  if (suffix.length < 2) suffix = "0" + suffix;
  return remapByAlphabet(digest.substring(0, 5), alphabet, -4) + suffix;
}

function makeWebSignature(path, timeSec, nonce) {
  const time = timeSec || Math.floor(Date.now() / 1000);
  const value = nonce || md5(String(Date.now()) + Math.random()).toUpperCase();
  return {
    version: WEB_VERSION,
    hkey: makeWebHkey(path, time + 1, value),
    _time: String(time),
    nonce: value,
  };
}

function notify(title, subtitle, content) {
  $notification.post(String(title), String(subtitle), String(content == null ? "" : content));
}

function md5(input) {
  function add32(a, b) {
    return (a + b) & 0xffffffff;
  }
  function cmn(q, a, b, x, s, t) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function cycle(state, block) {
    let a = state[0];
    let b = state[1];
    let c = state[2];
    let d = state[3];
    const oa = a;
    const ob = b;
    const oc = c;
    const od = d;

    a = ff(a, b, c, d, block[0], 7, -680876936);
    d = ff(d, a, b, c, block[1], 12, -389564586);
    c = ff(c, d, a, b, block[2], 17, 606105819);
    b = ff(b, c, d, a, block[3], 22, -1044525330);
    a = ff(a, b, c, d, block[4], 7, -176418897);
    d = ff(d, a, b, c, block[5], 12, 1200080426);
    c = ff(c, d, a, b, block[6], 17, -1473231341);
    b = ff(b, c, d, a, block[7], 22, -45705983);
    a = ff(a, b, c, d, block[8], 7, 1770035416);
    d = ff(d, a, b, c, block[9], 12, -1958414417);
    c = ff(c, d, a, b, block[10], 17, -42063);
    b = ff(b, c, d, a, block[11], 22, -1990404162);
    a = ff(a, b, c, d, block[12], 7, 1804603682);
    d = ff(d, a, b, c, block[13], 12, -40341101);
    c = ff(c, d, a, b, block[14], 17, -1502002290);
    b = ff(b, c, d, a, block[15], 22, 1236535329);

    a = gg(a, b, c, d, block[1], 5, -165796510);
    d = gg(d, a, b, c, block[6], 9, -1069501632);
    c = gg(c, d, a, b, block[11], 14, 643717713);
    b = gg(b, c, d, a, block[0], 20, -373897302);
    a = gg(a, b, c, d, block[5], 5, -701558691);
    d = gg(d, a, b, c, block[10], 9, 38016083);
    c = gg(c, d, a, b, block[15], 14, -660478335);
    b = gg(b, c, d, a, block[4], 20, -405537848);
    a = gg(a, b, c, d, block[9], 5, 568446438);
    d = gg(d, a, b, c, block[14], 9, -1019803690);
    c = gg(c, d, a, b, block[3], 14, -187363961);
    b = gg(b, c, d, a, block[8], 20, 1163531501);
    a = gg(a, b, c, d, block[13], 5, -1444681467);
    d = gg(d, a, b, c, block[2], 9, -51403784);
    c = gg(c, d, a, b, block[7], 14, 1735328473);
    b = gg(b, c, d, a, block[12], 20, -1926607734);

    a = hh(a, b, c, d, block[5], 4, -378558);
    d = hh(d, a, b, c, block[8], 11, -2022574463);
    c = hh(c, d, a, b, block[11], 16, 1839030562);
    b = hh(b, c, d, a, block[14], 23, -35309556);
    a = hh(a, b, c, d, block[1], 4, -1530992060);
    d = hh(d, a, b, c, block[4], 11, 1272893353);
    c = hh(c, d, a, b, block[7], 16, -155497632);
    b = hh(b, c, d, a, block[10], 23, -1094730640);
    a = hh(a, b, c, d, block[13], 4, 681279174);
    d = hh(d, a, b, c, block[0], 11, -358537222);
    c = hh(c, d, a, b, block[3], 16, -722521979);
    b = hh(b, c, d, a, block[6], 23, 76029189);
    a = hh(a, b, c, d, block[9], 4, -640364487);
    d = hh(d, a, b, c, block[12], 11, -421815835);
    c = hh(c, d, a, b, block[15], 16, 530742520);
    b = hh(b, c, d, a, block[2], 23, -995338651);

    a = ii(a, b, c, d, block[0], 6, -198630844);
    d = ii(d, a, b, c, block[7], 10, 1126891415);
    c = ii(c, d, a, b, block[14], 15, -1416354905);
    b = ii(b, c, d, a, block[5], 21, -57434055);
    a = ii(a, b, c, d, block[12], 6, 1700485571);
    d = ii(d, a, b, c, block[3], 10, -1894986606);
    c = ii(c, d, a, b, block[10], 15, -1051523);
    b = ii(b, c, d, a, block[1], 21, -2054922799);
    a = ii(a, b, c, d, block[8], 6, 1873313359);
    d = ii(d, a, b, c, block[15], 10, -30611744);
    c = ii(c, d, a, b, block[6], 15, -1560198380);
    b = ii(b, c, d, a, block[13], 21, 1309151649);
    a = ii(a, b, c, d, block[4], 6, -145523070);
    d = ii(d, a, b, c, block[11], 10, -1120210379);
    c = ii(c, d, a, b, block[2], 15, 718787259);
    b = ii(b, c, d, a, block[9], 21, -343485551);

    state[0] = add32(a, oa);
    state[1] = add32(b, ob);
    state[2] = add32(c, oc);
    state[3] = add32(d, od);
  }
  function block(text) {
    const out = [];
    for (let i = 0; i < 64; i += 4) {
      out[i >> 2] =
        text.charCodeAt(i) +
        (text.charCodeAt(i + 1) << 8) +
        (text.charCodeAt(i + 2) << 16) +
        (text.charCodeAt(i + 3) << 24);
    }
    return out;
  }
  function digest(text) {
    const state = [1732584193, -271733879, -1732584194, 271733878];
    const totalLength = text.length;
    let i;
    for (i = 64; i <= text.length; i += 64) cycle(state, block(text.substring(i - 64, i)));
    text = text.substring(i - 64);
    const tail = new Array(16).fill(0);
    for (i = 0; i < text.length; i += 1) tail[i >> 2] |= text.charCodeAt(i) << ((i % 4) << 3);
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      cycle(state, tail);
      for (i = 0; i < 16; i += 1) tail[i] = 0;
    }
    tail[14] = totalLength * 8;
    cycle(state, tail);
    return state;
  }
  function rhex(value) {
    const hex = "0123456789abcdef";
    let out = "";
    for (let i = 0; i < 4; i += 1) {
      out +=
        hex.charAt((value >> (i * 8 + 4)) & 15) +
        hex.charAt((value >> (i * 8)) & 15);
    }
    return out;
  }
  const text = unescape(encodeURIComponent(String(input)));
  return digest(text).map(rhex).join("");
}

function readStore(key, fallback) {
  try {
    const value = $persistentStore.read(key);
    return value == null || value === "" ? fallback : value;
  } catch (_) {
    return fallback;
  }
}

function writeStore(value, key) {
  try {
    return $persistentStore.write(value, key);
  } catch (_) {
    return false;
  }
}

function toText(value) {
  return value == null ? "" : String(value).trim();
}

function getHeader(headers, name) {
  const target = String(name).toLowerCase();
  const keys = Object.keys(headers || {});
  for (let i = 0; i < keys.length; i += 1) {
    if (keys[i].toLowerCase() === target) return headers[keys[i]];
  }
  return "";
}

function getQueryParam(url, name) {
  const match = String(url).match(new RegExp("[?&]" + name + "=([^&#]*)", "i"));
  if (!match) return "";
  try {
    return decodeURIComponent(match[1].replace(/\+/g, " "));
  } catch (_) {
    return match[1];
  }
}

function pickCookieValue(cookie, key) {
  const items = String(cookie || "").split(";");
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i].trim();
    const pos = item.indexOf("=");
    if (pos < 1) continue;
    if (item.slice(0, pos).trim().toLowerCase() === String(key).toLowerCase()) {
      return item.slice(pos + 1).trim();
    }
  }
  return "";
}

function buildAppCookie(cookie) {
  const pkey = pickCookieValue(cookie, "pkey");
  const token = pickCookieValue(cookie, "x_xhh_tokenid");
  if (!pkey || !token) return "";
  return "pkey=" + pkey + ";x_xhh_tokenid=" + token;
}

function decodePkeyUserId(cookie) {
  const pkey = pickCookieValue(cookie, "pkey");
  if (!pkey) return "";
  let encoded;
  try {
    encoded = decodeURIComponent(pkey);
  } catch (_) {
    encoded = pkey;
  }
  const variants = [encoded];
  const trimmed = encoded.replace(/_+$/, "");
  if (trimmed && trimmed !== encoded) variants.push(trimmed);
  for (let v = 0; v < variants.length; v += 1) {
    const padded = variants[v] + "=".repeat((4 - (variants[v].length % 4)) % 4);
    const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    let plain = "";
    try {
      if (typeof atob === "function") plain = atob(base64);
      else if (typeof Buffer !== "undefined")
        plain = Buffer.from(base64, "base64").toString("utf8");
      else return "";
    } catch (_) {
      plain = "";
    }
    const match = plain.match(/_(\d{5,})/);
    if (match) return match[1];
  }
  return "";
}

function makeImei(cookie) {
  const pkey = pickCookieValue(cookie, "pkey");
  if (!pkey) throw new Error("Cookie 缺少 pkey");
  return md5(pkey).slice(0, 16);
}

function maskId(id) {
  const value = String(id || "");
  if (value.length <= 4) return value;
  return value.slice(0, 2) + "***" + value.slice(-2);
}

function loadAccounts() {
  try {
    const list = JSON.parse(readStore(STORAGE_KEY, "[]"));
    return Array.isArray(list)
      ? list
          .map((item) => {
            const cookie = buildAppCookie(item && item.cookie);
            const heyboxId =
              toText(item && item.heyboxId) || decodePkeyUserId(cookie);
            if (!cookie || !heyboxId) return null;
            return {
              heyboxId,
              cookie,
              imei: makeImei(cookie),
              updatedAt: Number(item.updatedAt) || 0
            };
          })
          .filter(Boolean)
      : [];
  } catch (_) {
    return [];
  }
}

async function captureAccount() {
  const url = toText($request && $request.url);
  const headers = ($request && $request.headers) || {};
  const cookie = buildAppCookie(getHeader(headers, "Cookie"));
  if (!cookie) return;
  const heyboxId =
    getQueryParam(url, "heybox_id") ||
    getQueryParam(url, "user_id") ||
    decodePkeyUserId(cookie);
  if (!heyboxId) return;

  const accounts = loadAccounts();
  const account = {
    heyboxId: String(heyboxId),
    cookie,
    imei: makeImei(cookie),
    updatedAt: Date.now()
  };
  const index = accounts.findIndex((item) => String(item.heyboxId) === String(heyboxId));
  const previousAccount = index >= 0 ? accounts[index] : null;
  const previousPkey = previousAccount
    ? pickCookieValue(previousAccount.cookie, "pkey")
    : "";
  const currentPkey = pickCookieValue(cookie, "pkey");
  const shouldNotify = !previousAccount || previousPkey !== currentPkey;
  if (index >= 0) accounts[index] = account;
  else accounts.push(account);
  if (accounts.length > MAX_ACCOUNTS) {
    accounts.sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));
    accounts.length = MAX_ACCOUNTS;
  }

  if (!writeStore(JSON.stringify(accounts), STORAGE_KEY)) {
    notify(SCRIPT_NAME, "❌ 获取账号失败", "Loon 持久化存储写入失败");
    return;
  }

  if (shouldNotify) {
    notify(
      SCRIPT_NAME,
      "✅ 获取账号成功",
      "账号：" + maskId(heyboxId) + "\n已保存 Cookie，并根据 pkey 生成设备标识"
    );
  }
}

function encodeQuery(params) {
  return Object.keys(params || {})
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(String(params[key])))
    .join("&");
}

function parseSwitch(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return !/^(false|0|off|no)$/i.test(String(value));
}

function runtimeOptions() {
  let value = typeof $argument === "undefined" ? null : $argument;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch (_) {
      value = value.split(",");
    }
  }
  const pick = (key, index) => {
    if (Array.isArray(value)) return value[index];
    return value && typeof value === "object" ? value[key] : undefined;
  };
  const signWait = Number(pick("signWait", 2));
  return {
    dailyTasks: parseSwitch(pick("dailyTasks", 0), true),
    publishTask: parseSwitch(pick("publishTask", 1), false),
    signWait: signWait > 0 ? signWait : SIGN_WAIT_DEFAULT_SEC,
    reviewTask: parseSwitch(pick("reviewTask", 3), false)
  };
}

function randomString(length) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return output;
}

function randomUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    return (char === "x" ? value : (value & 3) | 8).toString(16);
  });
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function httpRequest(method, options) {
  return new Promise((resolve, reject) => {
    const fn = String(method || "GET").toUpperCase() === "POST" ? "post" : "get";
    const request = Object.assign({ timeout: 15000 }, options || {});
    $httpClient[fn](request, (error, response, data) => {
      if (error) {
        const host = toText(request.url).match(/^https?:\/\/([^/?#]+)/i);
        reject(
          taggedError(
            fn.toUpperCase() +
              " " +
              (host ? host[1] : "网络请求") +
              "：" +
              String(error),
            true
          )
        );
        return;
      }
      resolve({
        status: Number(response && (response.status || response.statusCode)) || 0,
        body: data == null ? "" : String(data)
      });
    });
  });
}

function sanitize(text) {
  return String(text == null ? "" : text)
    .replace(/(pkey|x_xhh_tokenid)=[^;&"'\s]*/gi, "$1=***")
    .replace(/Cookie:\s*[^\n]*/gi, "Cookie: ***")
    .slice(0, 160);
}

function taggedError(message, retryable) {
  const error = new Error(message);
  error.retryable = retryable !== false;
  return error;
}

function parseJsonResponse(response, action) {
  if (response.status < 200 || response.status >= 300) {
    const retryable = response.status >= 500 || response.status === 429;
    throw taggedError(
      action + " HTTP " + response.status + " " + sanitize(response.body),
      retryable
    );
  }
  try {
    return response.body ? JSON.parse(response.body) : null;
  } catch (_) {
    throw taggedError(action + "返回内容不是 JSON：" + sanitize(response.body), false);
  }
}

async function getJsonRequest(options, action) {
  return parseJsonResponse(await httpRequest("GET", options), action);
}

async function postJsonRequest(options, action) {
  return parseJsonResponse(await httpRequest("POST", options), action);
}

function apiFailureMessage(payload, fallback) {
  if (!payload) return fallback;
  return toText(payload.msg || payload.message) || toText(payload.status) || fallback;
}

function requireOk(payload, action) {
  if (!payload || toText(payload.status) !== OK_STATE) {
    const message = apiFailureMessage(payload, "服务器未返回成功状态");
    if (isLoginExpired(payload && payload.status, message)) {
      throw new Error(action + "：" + LOGIN_EXPIRED_HINT);
    }
    throw new Error(action + "：" + message);
  }
  return payload;
}

function unwrapHkeyPayload(payload) {
  if (!payload || typeof payload !== "object") return {};
  if (payload.result && typeof payload.result === "object") return payload.result;
  return payload;
}

async function withRetry(action, handler, options) {
  const opts = options || {};
  const maxAttempts = Number(opts.attempts) > 0 ? Number(opts.attempts) : 3;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await handler(attempt);
      if (attempt > 1) {
        console.log("[重试成功] " + action + " 第" + attempt + "次");
      }
      return result;
    } catch (error) {
      lastError = error;
      if (error && error.retryable === false) throw error;
      if (attempt < maxAttempts) {
        const backoff = Math.min(700 * Math.pow(2, attempt - 1), 4000);
        console.log(
          "[准备重试] " +
            action +
            " 第" +
            attempt +
            "次失败：" +
            String(error.message || error) +
            "（" +
            (backoff / 1000).toFixed(1) +
            "s 后）"
        );
        await sleep(backoff);
      }
    }
  }
  throw new Error(
    action +
      "连续" +
      maxAttempts +
      "次失败：" +
      String((lastError && lastError.message) || lastError)
  );
}

async function requestHkey(account, path, timeSec) {
  return withRetry("GET hkey " + path, async () => {
    const time = String(timeSec || Math.floor(Date.now() / 1000));
    const payload = await getJsonRequest(
      {
        url:
          HKEY_API +
          "?" +
          encodeQuery({
            mode: "request",
            path,
            time,
            imei: account.imei,
            heybox_id: account.heyboxId
          }),
        headers: { "User-Agent": APP_UA, Accept: "application/json" },
        "auto-cookie": false
      },
      "hkey请求"
    );
    if (payload && payload.status && toText(payload.status) !== OK_STATE) {
      throw taggedError("hkey接口：" + apiFailureMessage(payload, "签名失败"), false);
    }
    const result = unwrapHkeyPayload(payload);
    if (!result.hkey || !result.version || !/^\d+$/.test(toText(result.build))) {
      throw new Error("hkey接口缺少 hkey/version/build");
    }
    return {
      hkey: toText(result.hkey),
      version: toText(result.version),
      build: toText(result.build),
      time
    };
  });
}

async function requestReportData(account, path, textPayload) {
  return withRetry("POST hkey " + path, async () => {
    const time = String(Math.floor(Date.now() / 1000));
    const payload = await postJsonRequest(
      {
        url: HKEY_API,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          mode: "report",
          path,
          text: textPayload,
          time,
          imei: account.imei,
          heybox_id: account.heyboxId
        }),
        "auto-cookie": false
      },
      "任务数据编码"
    );
    if (payload && payload.status && toText(payload.status) !== OK_STATE) {
      throw taggedError("任务数据编码：" + apiFailureMessage(payload, "编码失败"), false);
    }
    const result = unwrapHkeyPayload(payload);
    if (
      !result.hkey ||
      !result.version ||
      !/^\d+$/.test(toText(result.build)) ||
      !result.time ||
      !result.data ||
      !result.key ||
      !result.sid
    ) {
      throw new Error("任务数据编码返回字段不完整");
    }
    return result;
  });
}

function appHeaders(account, hasBody) {
  const headers = {
    "User-Agent": APP_UA,
    Referer: APP_REFERER,
    Cookie: account.cookie,
    Accept: "application/json"
  };
  if (hasBody) headers["Content-Type"] = "application/x-www-form-urlencoded";
  return headers;
}

function buildWebCookie(cookie, heyboxId) {
  const pkey = pickCookieValue(cookie, "pkey");
  const token = pickCookieValue(cookie, "x_xhh_tokenid");
  if (!pkey || !token) return cookie;
  return (
    "pkey=" + pkey + ";x_xhh_tokenid=" + token + ";x_pkey=" + pkey + ";x_heybox_id=" + heyboxId
  );
}

function webHeaders(account, hasBody) {
  const headers = {
    "User-Agent": WEB_UA,
    Accept: "application/json, text/plain, */*",
    Origin: "https://web.xiaoheihe.cn",
    Referer: "https://web.xiaoheihe.cn/",
    "X-Requested-With": "com.max.xiaoheihe",
    Cookie: account.webCookie || buildWebCookie(account.cookie, account.heyboxId)
  };
  if (hasBody) headers["Content-Type"] = "application/x-www-form-urlencoded;charset=UTF-8";
  return headers;
}

function buildWebQuery(account, path, extraQuery) {
  const signature = makeWebSignature(path);
  return Object.assign(
    {},
    WEB_PROFILE,
    {
      heybox_id: account.heyboxId
    },
    signature,
    extraQuery || {}
  );
}

async function webRequest(account, path, extraQuery, baseUrl, bodyData) {
  const url =
    (baseUrl || API_BASE) + path + "?" + encodeQuery(buildWebQuery(account, path, extraQuery));
  if (bodyData == null) {
    return await getJsonRequest(
      { url, headers: webHeaders(account, false), "auto-cookie": false },
      path
    );
  }
  return await postJsonRequest(
    {
      url,
      headers: webHeaders(account, true),
      body: encodeQuery(bodyData),
      "auto-cookie": false
    },
    path
  );
}

async function webPostForm(account, path, bodyData, extraQuery, baseUrl) {
  const payload = await webRequest(account, path, extraQuery, baseUrl, bodyData || {});
  return payload;
}

function buildSignedQuery(account, signature, extraQuery) {
  return Object.assign(
    {
      heybox_id: account.heyboxId,
      imei: account.imei,
      device_info: APP_PROFILE.device_info,
      nonce: randomString(32),
      hkey: signature.hkey,
      os_type: APP_PROFILE.os_type,
      x_os_type: APP_PROFILE.x_os_type,
      x_client_type: APP_PROFILE.x_client_type,
      os_version: APP_PROFILE.os_version,
      version: signature.version,
      build: signature.build,
      _time: signature.time,
      dw: APP_PROFILE.dw,
      channel: APP_PROFILE.channel,
      x_app: APP_PROFILE.x_app,
      time_zone: APP_PROFILE.time_zone
    },
    extraQuery || {}
  );
}

function readRetry(action, handler) {
  return withRetry(action, handler, {
    attempts: 2,
    retryable: (error) => !error || error.retryable !== false
  });
}

async function appGet(account, path, extraQuery, baseUrl) {
  const payload = await readRetry(path, async () => {
    const signature = await requestHkey(account, path);
    const url = buildAppUrl(account, baseUrl, path, signature, extraQuery);
    return await getJsonRequest(
      { url, headers: appHeaders(account, false), "auto-cookie": false },
      path
    );
  });
  return payload;
}

function buildAppUrl(account, baseUrl, path, signature, extraQuery) {
  return (
    (baseUrl || API_BASE) +
    path +
    "?" +
    encodeQuery(buildSignedQuery(account, signature, extraQuery))
  );
}

async function appPostForm(account, path, extraQuery, bodyData, baseUrl) {
  const signature = await requestHkey(account, path);
  const url = buildAppUrl(account, baseUrl, path, signature, extraQuery);
  const payload = await postJsonRequest(
    {
      url,
      headers: appHeaders(account, true),
      body: encodeQuery(bodyData || {}),
      "auto-cookie": false
    },
    path
  );
  return payload;
}

async function postEncryptedForm(account, path, textPayload, extraQuery, baseUrl) {
  const encoded = await requestReportData(account, path, textPayload);
  const signature = {
    hkey: encoded.hkey,
    version: encoded.version,
    build: encoded.build,
    time: toText(encoded.time)
  };
  const payload = await postJsonRequest(
    {
      url: buildAppUrl(
        account,
        baseUrl || DATA_BASE,
        path,
        signature,
        Object.assign({ time_: signature.time }, extraQuery || {})
      ),
      headers: appHeaders(account, true),
      body: encodeQuery({
        data: encoded.data,
        key: encoded.key,
        sid: encoded.sid
      }),
      "auto-cookie": false
    },
    path
  );
  return payload;
}

function extractTaskList(payload) {
  requireOk(payload, "任务列表");
  const result = payload.result && typeof payload.result === "object" ? payload.result : {};
  const user = result.user && typeof result.user === "object" ? result.user : {};
  const levelInfo =
    user.level_info && typeof user.level_info === "object" ? user.level_info : {};
  const groups = Array.isArray(result.task_list) ? result.task_list : [];
  const tasks = [];
  groups.forEach((group) => {
    const list = Array.isArray(group.tasks) ? group.tasks : [];
    list.forEach((item) => {
      const reportExtra =
        item.report_extra && typeof item.report_extra === "object"
          ? item.report_extra
          : {};
      const awardText = (Array.isArray(item.award_desc_v2) ? item.award_desc_v2 : [])
        .map((award) => {
          const desc = toText(award && award.desc);
          const icon = toText(award && award.icon);
          if (icon.indexOf("b9aca51c") >= 0) return desc + "H币";
          if (icon.indexOf("c10d89ae") >= 0) return desc + "经验";
          if (icon.indexOf("e63b192a") >= 0) return desc + "盒电";
          return desc;
        })
        .filter(Boolean)
        .join(" ");
      tasks.push({
        title: toText(item.title || item.name || "未命名任务"),
        state: toText(item.state),
        stateDesc: toText(item.state_desc),
        taskId: toText(reportExtra.task_id),
        taskType: toText(item.type),
        reportTaskType: toText(reportExtra.task_type),
        maxjia: toText(item.maxjia),
        awardText
      });
    });
  });
  return {
    nickname: toText(user.username),
    coin: toText(levelInfo.coin),
    tasks
  };
}

function taskKey(task) {
  return task.taskId + "|" + task.title;
}

function findTask(snapshot, key) {
  return snapshot.tasks.find((task) => taskKey(task) === key);
}

function isSignTask(task) {
  return task.taskType === "sign";
}

function isDailyTask(task) {
  return isSignTask(task) || task.reportTaskType === "daily";
}

function isTaskEnabled(task, options) {
  if (isSignTask(task)) return true;
  if (task.taskId === "33") return !!options.dailyTasks && !!options.publishTask;
  if (task.taskId === "24") return !!options.dailyTasks && !!options.reviewTask;
  if (!options.dailyTasks) return false;
  return task.reportTaskType === "daily";
}

async function fetchSnapshot(account) {
  return extractTaskList(await appGet(account, PATH_TASK_LIST));
}

function collectObjects(root, matcher, limit) {
  const output = [];
  const stack = [root];
  const max = limit || 20;
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    if (matcher(node)) {
      output.push(node);
      if (output.length >= max) break;
    }
    const values = Array.isArray(node) ? node : Object.keys(node).map((key) => node[key]);
    for (let i = values.length - 1; i >= 0; i -= 1) stack.push(values[i]);
  }
  return output;
}

function extractFeeds(payload) {
  const links = payload && payload.result && payload.result.links;
  if (!Array.isArray(links)) return [];
  const seen = {};
  return links
    .map((item) => ({
      linkId: toText(item && item.link_id),
      hSrc: toText(item && item.h_src)
    }))
    .filter((item) => {
      const key = item.linkId + "|" + item.hSrc;
      if (!/^\d+$/.test(item.linkId) || !item.hSrc || seen[key]) return false;
      seen[key] = true;
      return true;
    });
}

function extractGames(payload) {
  const objects = collectObjects(
    payload && payload.result,
    (node) =>
      !Array.isArray(node) &&
      Object.prototype.hasOwnProperty.call(node, "appid") &&
      Object.prototype.hasOwnProperty.call(node, "h_src"),
    40
  );
  const seen = {};
  return objects
    .map((item) => ({
      appid: toText(item.appid),
      hSrc: toText(item.h_src)
    }))
    .filter((item) => {
      const key = item.appid + "|" + item.hSrc;
      if (!/^\d+$/.test(item.appid) || !item.hSrc || seen[key]) return false;
      seen[key] = true;
      return true;
    });
}

function extractComment(payload) {
  const links = payload && payload.result && payload.result.links;
  if (!Array.isArray(links)) return null;
  for (let i = 0; i < links.length; i += 1) {
    const item = links[i] || {};
    const linkId = toText(item.linkid || item.link_id);
    const userId = toText(item.userid);
    const hSrc = toText(item.h_src);
    if (/^\d+$/.test(linkId) && /^\d+$/.test(userId) && hSrc) {
      return { linkId, userId, hSrc };
    }
  }
  return null;
}

function buildShareReport(action, source, extra) {
  return JSON.stringify({
    events: [
      {
        type: action === "tap" ? "4" : "3",
        path: action === "tap" ? "/share/behavior/tap" : "/share/behavior/success",
        time: String(Math.floor(Date.now() / 1000)),
        addition: Object.assign({}, extra || {}, {
          src: source,
          plat: "WechatSession"
        })
      }
    ]
  });
}

async function sendShareEvents(account, source, extra) {
  const sessionId = randomUuid();
  const actions = ["tap", "success"];
  for (let i = 0; i < actions.length; i += 1) {
    const action = actions[i];
    const payload = await postEncryptedForm(
      account,
      PATH_DATA_REPORT,
      buildShareReport(action, source, extra),
      { type: "104", session_id: sessionId },
      DATA_BASE
    );
    requireOk(payload, "分享 " + action + " 上报");
    if (action === "tap") await sleep(2000);
  }
}

async function settleTask(account, task, detail) {
  await sleep(SHARE_TASK_SETTLE_MS);
  const snapshot = await fetchSnapshot(account);
  const after = findTask(snapshot, taskKey(task));
  if (after && after.state === FINISH_STATE) {
    return {
      ok: true,
      message: task.title + "完成" + (detail ? " " + detail : ""),
      snapshot
    };
  }
  return { ok: false, message: "仍为待完成", snapshot };
}

function isSignedState(state) {
  return SIGNED_STATES.test(toText(state));
}

function isLoginExpired(status, message) {
  return /relogin|login|重新登录|请登录|未登录|登录态|失效/i.test(
    toText(status) + " " + toText(message)
  );
}

function signDetailText(state) {
  if (!state) return "";
  const details = [];
  if (state.coin) details.push("+" + state.coin + "H币");
  if (state.exp) details.push("+" + state.exp + "经验");
  if (state.streak) details.push("连签" + state.streak + "天");
  return details.join(" ");
}

function hasSignEvidence(state) {
  if (!state) return false;
  return Boolean(
    state.coin ||
      state.exp ||
      state.streak ||
      /已签到|已经签到|重复签到|签到成功/.test(state.message)
  );
}

function shortPayload(payload) {
  try {
    return JSON.stringify(payload || {}).slice(0, 220);
  } catch (_) {
    return "";
  }
}

async function readSignState(account) {
  const payload = await appGet(account, PATH_SIGN_STATE);
  const result =
    payload && payload.result && typeof payload.result === "object" ? payload.result : {};
  return {
    status: toText(payload && payload.status),
    state: toText(result.state || result.sign_state || result.sign_status),
    message: toText(payload && (payload.msg || payload.message)),
    coin: toText(result.sign_in_coin),
    exp: toText(result.sign_in_exp),
    streak: toText(result.sign_in_streak),
    raw: shortPayload(payload)
  };
}

function signWaitBudget(options) {
  const wanted = Number(options && options.signWait);
  const seconds = Number.isFinite(wanted) && wanted > 0 ? wanted : SIGN_WAIT_DEFAULT_SEC;
  const clamped = Math.min(Math.max(seconds, SIGN_WAIT_MIN_SEC), SIGN_WAIT_MAX_SEC);
  if (typeof globalThis !== "undefined") globalThis.__xhhSignBudget = clamped;
  return clamped * 1000;
}

async function confirmSignState(account, budgetMs) {
  let last = null;
  let waited = 0;
  let round = 0;
  for (;;) {
    const gap = SIGN_POLL_GAPS[Math.min(round, SIGN_POLL_GAPS.length - 1)];
    await sleep(gap);
    waited += gap;
    round += 1;
    let state;
    try {
      state = await readSignState(account);
    } catch (error) {
      console.log("[签到确认] 第" + round + "次读取失败：" + String(error.message || error));
      continue;
    }
    last = state;
    if (state.status === OK_STATE && isSignedState(state.state)) return { ok: true, state };
    if (isLoginExpired(state.status, state.message)) return { ok: false, expired: true, state };
    if (waited >= budgetMs) return { ok: false, state };
  }
}

async function executeSign(account, options) {
  const budget = signWaitBudget(options);
  const half = Math.round(budget / 2);
  let last = null;
  try {
    last = await readSignState(account);
  } catch (error) {
    console.log("[签到预查] 失败：" + String(error.message || error));
  }
  if (last) {
    if (last.status === OK_STATE && isSignedState(last.state) && hasSignEvidence(last)) {
      return {
        ok: true,
        already: true,
        state: last,
        message: signDetailText(last) || "今日已签到"
      };
    }
    if (isLoginExpired(last.status, last.message)) {
      return { ok: false, expired: true, message: LOGIN_EXPIRED_HINT };
    }
  }

  for (let attempt = 1; attempt <= SIGN_ATTEMPTS; attempt += 1) {
    let payload = null;
    try {
      payload = await appGet(account, PATH_SIGN);
    } catch (error) {
      if (attempt < SIGN_ATTEMPTS) await sleep(SIGN_RETRY_DELAY_MS);
      continue;
    }
    const result =
      payload && payload.result && typeof payload.result === "object" ? payload.result : {};
    const signState = toText(result.state || result.sign_state);
    const signMessage = toText(payload && (payload.msg || payload.message));
    if (isLoginExpired(payload.status, signMessage)) {
      return { ok: false, expired: true, message: LOGIN_EXPIRED_HINT };
    }
    if (signState === "ignore" || /已签到|重复签到/.test(signMessage)) {
      let state = last;
      try {
        state = await readSignState(account);
      } catch (_) {}
      return {
        ok: true,
        already: true,
        late: attempt > 1 || !hasSignEvidence(last),
        state,
        message: signDetailText(state) || (attempt > 1 ? "签到已生效（服务器已记录）" : "今日已签到")
      };
    }
    const confirm = await confirmSignState(account, half);
    if (confirm.ok) {
      return { ok: true, state: confirm.state, message: signDetailText(confirm.state) || "签到成功" };
    }
    if (confirm.expired) return { ok: false, expired: true, message: LOGIN_EXPIRED_HINT };
    if (confirm.state) last = confirm.state;
    if (attempt < SIGN_ATTEMPTS) await sleep(SIGN_RETRY_DELAY_MS);
  }

  const finalCheck = await confirmSignState(account, SIGN_FINAL_WAIT_MS);
  if (finalCheck.ok) return { ok: true, state: finalCheck.state, message: signDetailText(finalCheck.state) || "签到成功" };
  if (finalCheck.expired) return { ok: false, expired: true, message: LOGIN_EXPIRED_HINT };
  if (finalCheck.state) last = finalCheck.state;
  return {
    ok: false,
    state: last,
    message:
      "已提交但服务器未确认（返回 " + ((last && (last.state || last.message)) || "未知状态") + "）"
  };
}

async function executeSharePost(account, task) {
  const feeds = await appGet(account, PATH_FEEDS, {
    pull: "1",
    last_pull: "1",
    is_first: "0",
    list_ver: "2",
    has_cache: "1",
    netmode: "wifi"
  });
  requireOk(feeds, "拉取帖子流");
  const posts = extractFeeds(feeds);
  if (!posts.length) return { ok: false, message: "没有可用帖子" };
  const post = posts[0];
  await sleep(1000);

  const viewPayload = await postEncryptedForm(
    account,
    PATH_VIEW_TIME,
    JSON.stringify({
      duration: [
        {
          id: Number(post.linkId),
          duration: 5,
          duration_ms: 5000,
          type: "link",
          time: Math.floor(Date.now() / 1000),
          h_src: post.hSrc
        }
      ],
      shows: [],
      disappear: []
    }),
    {},
    DATA_BASE
  );
  requireOk(viewPayload, "帖子浏览时长上报");
  await sendShareEvents(account, "link", {
    link_id: post.linkId,
    h_src: post.hSrc
  });
  return settleTask(account, task, "link_id=" + post.linkId);
}

async function pickRecommendGame(account) {
  const payload = await appGet(account, PATH_GAME_RECOMMEND, { offset: "0", limit: "1" });
  requireOk(payload, "拉取推荐游戏");
  return extractGames(payload)[0] || null;
}

async function executeShareGameDetail(account, task) {
  const game = await pickRecommendGame(account);
  if (!game) return { ok: false, message: "没有可用游戏" };
  await sleep(1000);
  await sendShareEvents(account, "game_detail", {
    app_id: game.appid,
    h_src: game.hSrc
  });
  return settleTask(account, task, "appid=" + game.appid);
}

async function fetchGameComments(account, appId) {
  return await appGet(account, PATH_GAME_COMMENTS, {
    api_version: "4",
    offset: "0",
    limit: "30",
    appid: appId
  });
}

async function executeShareGameComment(account, task) {
  const game = await pickRecommendGame(account);
  if (!game) return { ok: false, message: "没有可用游戏" };
  const comments = await fetchGameComments(account, game.appid);
  requireOk(comments, "拉取游戏评价");
  const comment = extractComment(comments);
  if (!comment) return { ok: false, message: "游戏评价缺少关键字段" };
  await sendShareEvents(account, "game_comment", {
    link_id: comment.linkId
  });
  return settleTask(account, task, "appid=" + game.appid);
}

function parseMaxjia(value) {
  const raw = toText(value);
  if (!raw) return null;
  const body = raw.replace(/^heybox:\/\//, "");
  const candidates = [body];
  try {
    candidates.unshift(decodeURIComponent(body));
  } catch (_) {
    return null;
  }
  for (let i = 0; i < candidates.length; i += 1) {
    try {
      const parsed = JSON.parse(candidates[i]);
      if (parsed && typeof parsed === "object") return parsed;
    } catch (_) {
      continue;
    }
  }
  return null;
}

function maxjiaValue(maxjia, key) {
  if (!maxjia) return "";
  const direct = toText(maxjia[key]);
  if (direct) return direct;
  const params = maxjia.params && typeof maxjia.params === "object" ? maxjia.params : {};
  return toText(params[key]);
}

function extractTopicId(maxjia) {
  return maxjiaValue(parseMaxjia(maxjia), "topic_id");
}

async function executeGameReviewTask(account, task) {
  const maxjia = parseMaxjia(task.maxjia);
  const appId = maxjiaValue(maxjia, "app_id") || maxjiaValue(maxjia, "appid");
  if (!appId) return { ok: false, message: "评价值任务缺少 app_id" };

  const comments = await fetchGameComments(account, appId);
  requireOk(comments, "拉取游戏话题");
  const links = comments && comments.result && comments.result.links;
  const topicId = toText(
    Array.isArray(links) &&
      links[0] &&
      Array.isArray(links[0].topics) &&
      links[0].topics[0] &&
      links[0].topics[0].topic_id
  );
  if (!topicId) return { ok: false, message: "游戏 " + appId + " 没有可用话题" };

  const content = GAME_REVIEW_CONTENT;
  const payload = await webPostForm(
    account,
    PATH_BBS_POST,
    {
      link_tag: "3",
      appid: appId,
      score: "5",
      topic_ids: topicId,
      text: JSON.stringify([{ checked: false, text: content, type: "text" }]),
      title: content,
      desc: content,
      draft: "0"
    },
    {},
    API_BASE
  );
  const linkId = toText(payload && payload.result && payload.result.link_id);
  if (toText(payload && payload.status) !== OK_STATE || !linkId) {
    return { ok: false, message: "发布评价失败：" + apiFailureMessage(payload, "无 link_id") };
  }
  const snapshot = await settleThenDelete(account, task, linkId, 7);
  const after = findTask(snapshot, taskKey(task));
  if (after && after.state === FINISH_STATE) return { ok: true, message: "评价完成 link_id=" + linkId, snapshot };
  return { ok: false, message: "评价已发布(link_id=" + linkId + ")但任务未结算", snapshot };
}

async function settleThenDelete(account, task, linkId, tries) {
  let snapshot = null;
  for (let i = 0; i < tries; i += 1) {
    await sleep(2000);
    snapshot = await fetchSnapshot(account);
    const after = findTask(snapshot, taskKey(task));
    if (after && after.state === FINISH_STATE) break;
  }
  const deletion = await appPostForm(account, PATH_BBS_DELETE, {}, { link_id: linkId }, API_BASE);
  if (toText(deletion && deletion.status) !== OK_STATE) {
    console.log("[警告] 删帖失败 link_id=" + linkId + " msg=" + apiFailureMessage(deletion, "未知"));
  }
  return snapshot;
}

async function executePublishTask(account, task) {
  const topicId = extractTopicId(task.maxjia);
  if (!topicId) return { ok: false, message: "发布任务缺少 topic_id" };
  const title = "前面忘了中间忘了后面也忘了";
  const content = "孩子很爱用，很好吃，会复购";
  const payload = await appPostForm(
    account,
    PATH_BBS_POST,
    {},
    {
      draft: "0",
      topic_ids: topicId,
      link_tag: "27",
      text: JSON.stringify([{ checked: false, text: content, type: "text" }]),
      title,
      desc: content
    },
    API_BASE
  );
  requireOk(payload, "发布内容");
  const linkId = toText(payload.result && payload.result.link_id);
  if (!linkId) return { ok: false, message: "发帖成功但未返回 link_id" };
  const snapshot = await settleThenDelete(account, task, linkId, 3);
  const after = findTask(snapshot, taskKey(task));
  if (after && after.state === FINISH_STATE) return { ok: true, message: "发布完成 link_id=" + linkId, snapshot };
  return { ok: false, message: "已发布(link_id=" + linkId + ")但任务未结算", snapshot };
}

async function executeTask(account, task, options) {
  try {
    if (task.taskId === "1") return await executeSharePost(account, task);
    if (task.taskId === "19") return await executeShareGameDetail(account, task);
    if (task.taskId === "31") return await executeShareGameComment(account, task);
    if (task.taskId === "33" && options.publishTask) {
      return await executePublishTask(account, task);
    }
    if (task.taskId === "24" && options.reviewTask) {
      return await executeGameReviewTask(account, task);
    }
    return {
      ok: false,
      unsupported: true,
      message:
        task.taskId === "33"
          ? "自动发帖任务已关闭"
          : task.taskId === "24"
            ? "游戏评价任务已关闭"
            : "暂不支持 task_id=" + (task.taskId || "未知")
    };
  } catch (error) {
    return { ok: false, message: String(error.message || error) };
  }
}

async function runAccount(account, index, options, lines) {
  options = Object.assign({ deadline: Date.now() + RUN_BUDGET_MS }, options || {});
  account.webCookie = buildWebCookie(account.cookie, account.heyboxId);
  let snapshot = await fetchSnapshot(account);
  const nickname = toText(snapshot.nickname);
  const coinBefore = Number(snapshot.coin) || 0;
  lines.push(
    "",
    "账号 " +
      (index + 1) +
      "（" +
      maskId(account.heyboxId) +
      "）" +
      (snapshot.nickname ? " " + snapshot.nickname : "")
  );

  let signOk = false;
  let signResult = null;
  try {
    signResult = await executeSign(account, options);
    signOk = signResult.ok;
  } catch (error) {
    signResult = { ok: false, message: String(error.message || error) };
  }

  snapshot = await fetchSnapshot(account);
  const coinAfterSign = Number(snapshot.coin) || 0;
  const signGain = coinAfterSign - coinBefore;
  let signMessage = toText(signResult && signResult.message);
  if (isLoginExpired("", signMessage)) signMessage = LOGIN_EXPIRED_HINT;
  if (!signOk) {
    const signTask = snapshot.tasks.find((task) => isSignTask(task));
    if (signTask && signTask.state === FINISH_STATE) {
      signOk = true;
      signMessage = "任务列表已确认签到完成";
    } else if (signGain > 0) {
      signOk = true;
      signMessage = "签到收益已到账（H币 +" + signGain + "）";
    }
  }
  lines.push((signOk ? "✅ " : "❌ ") + "签到：" + (signMessage || "状态未确认"));
  const signLineIndex = lines.length - 1;
  if (signGain !== 0) {
    lines.push("💰 H币：" + coinBefore + " → " + coinAfterSign);
  }

  const relevant = snapshot.tasks.filter(
    (task) => !isSignTask(task) && isTaskEnabled(task, options)
  );

  for (let i = 0; i < relevant.length; i += 1) {
    const task = relevant[i];
    if (task.state === FINISH_STATE) {
      lines.push(
        "✅ " +
          task.title +
          "：已完成" +
          (task.awardText ? "（" + task.awardText + "）" : "")
      );
      continue;
    }
    if (task.state !== WAITING_STATE) {
      lines.push("⚠️ " + task.title + "：" + (task.stateDesc || task.state || "状态未知"));
      continue;
    }

    if (Date.now() > options.deadline) {
      lines.push("⏱ 时间预算用尽，剩余任务未执行：" + task.title);
      break;
    }
    snapshot = await fetchSnapshot(account);
    const latest = findTask(snapshot, taskKey(task));
    if (!latest) continue;
    if (latest.state === FINISH_STATE) {
      lines.push("✅ " + latest.title + "：已完成（服务器已更新状态）");
      continue;
    }
    if (latest.state !== WAITING_STATE) {
      lines.push("⚠️ " + latest.title + "：" + (latest.stateDesc || latest.state || "状态未知"));
      continue;
    }
    const result = await executeTask(account, latest, options);
    if (result.unsupported) {
      lines.push("⚠️ " + latest.title + "：" + result.message);
      continue;
    }

    snapshot = result.snapshot || (await fetchSnapshot(account));
    const after = findTask(snapshot, taskKey(latest));
    if (result.ok && after && after.state === FINISH_STATE) {
      lines.push(
        "✅ " +
          after.title +
          "：服务器已确认完成" +
          (latest.awardText ? "（" + latest.awardText + "）" : "")
      );
    } else {
      lines.push("❌" + latest.title + "：" + result.message);
    }
    await sleep(800);
  }

  const finalSnapshot = await fetchSnapshot(account);
  if (!signOk) {
    const finalSignTask = finalSnapshot.tasks.find((task) => isSignTask(task));
    if (finalSignTask && finalSignTask.state === FINISH_STATE) {
      signOk = true;
      lines[signLineIndex] = "✅ 签到：已确认签到（服务器在运行期间完成结算）";
    }
  }
  lines.push("💰 当前H币：" + (finalSnapshot.coin || "未知"));
  const waiting = finalSnapshot.tasks.filter(
    (task) => !isSignTask(task) && isTaskEnabled(task, options) && task.state === WAITING_STATE
  );
  if (waiting.length) {
    lines.push("❌仍待完成：" + waiting.map((task) => task.title).join("、"));
  }
  return { signOk, tasksOk: waiting.length === 0, nickname };
}

async function runAutomation() {
  const accounts = loadAccounts();
  const options = runtimeOptions();
  if (!accounts.length) {
    notify(
      SCRIPT_NAME,
      "⚠️ 尚未获取账号",
      "请打开小黑盒 App，进入“我的”页面并刷新一次。"
    );
    return;
  }

  const lines = [];
  const deadline = Date.now() + RUN_BUDGET_MS;
  const nicknames = [];
  let signOkCount = 0;
  let taskOkCount = 0;
  let skipped = 0;
  for (let i = 0; i < accounts.length; i += 1) {
    if (Date.now() > deadline) {
      skipped = accounts.length - i;
      lines.push("", "⏱ 时间预算用尽，跳过剩余 " + skipped + " 个账号");
      break;
    }
    try {
      const result = await runAccount(
        accounts[i],
        i,
        Object.assign({}, options, { deadline }),
        lines
      );
      nicknames.push(result.nickname || "账号" + (i + 1) + "（" + maskId(accounts[i].heyboxId) + "）");
      if (result.signOk) signOkCount += 1;
      if (result.tasksOk) taskOkCount += 1;
    } catch (error) {
      const detail = String(error.message || error);
      nicknames.push("账号" + (i + 1) + "（" + maskId(accounts[i].heyboxId) + "）");
      lines.push(
        "",
        "账号 " + (i + 1) + "（" + maskId(accounts[i].heyboxId) + "）",
        "❌ 执行失败：" + sanitize(detail)
      );
      if (isLoginExpired("", detail)) lines.push("🔑 " + LOGIN_EXPIRED_HINT);
    }
    if (i < accounts.length - 1) await sleep(1200);
  }

  const allDone = signOkCount === accounts.length && taskOkCount === accounts.length && !skipped;
  const keepHeader = accounts.length > 1;
  const body = lines
    .filter((line) => line && (keepHeader || !/^账号 \d+（/.test(line)))
    .join("\n");
  const nicknameLines = nicknames.map((name) => "用户昵称：" + name).join("\n");
  const details = nicknameLines + (body ? "\n" + body : "");
  const subtitle = allDone
    ? "今天已完成签到"
    : skipped
      ? "时间预算不足"
      : taskOkCount < accounts.length
        ? "存在未完成任务"
        : "签到未确认";
  const content = details;
  if (typeof globalThis !== "undefined") globalThis.__xhhRunDetail = content;
  console.log("📌 小黑盒每日签到\n" + subtitle + "\n" + content);
  notify("📌 小黑盒每日签到", subtitle, content);
}

async function main() {
  if (typeof $request !== "undefined") await captureAccount();
  else await runAutomation();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    md5,
    buildAppCookie,
    decodePkeyUserId,
    makeImei,
    encodeQuery,
    runtimeOptions,
    unwrapHkeyPayload,
    extractTaskList,
    extractFeeds,
    extractGames,
    extractComment,
    buildShareReport,
    extractTopicId,
    taskKey,
    isDailyTask,
    requestHkey,
    requestReportData,
    withRetry,
    executeSign,
    signWaitBudget,
    readSignState,
    isSignedState,
    isLoginExpired,
    isTaskEnabled,
    parseMaxjia,
    maxjiaValue,
    executeGameReviewTask,
    buildWebCookie,
    buildWebQuery,
    webHeaders,
    webPostForm,
    makeWebHkey,
    makeWebSignature,
    WEB_VERSION,
    sanitize,
    RUN_BUDGET_MS,
    signDetailText,
    appGet,
    postEncryptedForm,
    loadAccounts,
    captureAccount,
    runAccount,
    runAutomation,
    fetchSnapshot,
    executeTask
  };
} else {
  const requestMode = typeof $request !== "undefined";
  main()
    .catch((error) => {
      notify(SCRIPT_NAME, "❌ 脚本异常", String((error && error.stack) || error));
    })
    .then(() => {
      if (requestMode) $done({});
      else $done();
    });
}
