/**
 * 中国联通 · 呼叫转移助手 for Loon
 * ---------------------------------------------------------------
 * 功能：查询 / 开通 / 关闭 / 设置 呼叫转移
 * 鉴权：复用联通 App 的 H5 会话 Cookie（mxx.client.10010.com）
 *
 * 接口（全部 POST，x-www-form-urlencoded，基址 https://mxx.client.10010.com/servicetransactbusiness）
 *   callForwardingNew/queryCallOutState   查询状态（返回一次性凭据 busiOrder）
 *   callForwardingNew/transcatCallOut     开通/关闭/设置转移号码
 *   callForwardingNew/banLiCallOutState   开通/关闭（备用入口）
 *   getConfiguration/switch               读取省份/机型开关
 *
 * 关键语义（来自 H5 前端源码，反直觉但确定）
 *   state       0 = 场景已开通(开关开)   1 = 场景未开通(开关关)
 *   openStatus  00 = 服务已开通          01 = 服务未开通
 *   提交参数 *OpenType   0 = 开通   1 = 关闭   留空 = 不动
 *   无条件转移与自定义转移互斥：设了无条件，其余三种失效
 * ---------------------------------------------------------------
 */
"use strict";

const VERSION = "1.0.0";
const STORE_KEY = "unicom_call_forwarding_accounts";
const BASE = "https://mxx.client.10010.com/servicetransactbusiness";
const PAGE_ORIGIN = "https://imgxx.client.10010.com";
const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko)  " +
  "unicom{version:iphone_c@13.0000};ltst;OSVersion/27.2";

/* ============================ 工具函数 ============================ */

function safeJSON(text, fallback) {
  try {
    const v = JSON.parse(text);
    return v === null || v === undefined ? fallback : v;
  } catch (_) {
    return fallback;
  }
}

function readJSON(key, fallback) {
  try {
    return JSON.parse($persistentStore.read(key) || "");
  } catch (_) {
    return fallback;
  }
}

function writeJSON(key, value) {
  return $persistentStore.write(JSON.stringify(value), key);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function nowMs() {
  return Date.now();
}

function dateTime() {
  const d = new Date(nowMs() + 8 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ` +
    `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`
  );
}

function mask(text) {
  const s = String(text || "");
  if (!s) return "";
  if (s.length <= 8) return s[0] + "***" + s[s.length - 1];
  return s.slice(0, 4) + "***" + s.slice(-4);
}

/* 解析 Loon 传入的 argument
 * Loon 会把 argument=[{mode},{scene},...] 替换成按【参数名】索引的对象：
 *   { mode: "query", scene: "busy", targetNumber: "138...", enableNotify: "true", ... }
 * 也兼容字符串形式（部分版本传的是 [{a},{b}] 原文）。
 */
function parseArgs() {
  const arg = typeof $argument !== "undefined" ? $argument : "";
  if (arg && typeof arg === "object") return arg;
  // 字符串形式：仅能拿到值，无法对应键名，按顺序兜底
  const list = [];
  const re = /\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(String(arg))) !== null) list.push(m[1].trim());
  return {
    mode: list[0],
    scene: list[1],
    targetNumber: list[2],
    autoQuery: list[3],
    enableNotify: list[4],
    requestNode: list[5],
    forceScene: list[6],
    capture: list[0],
    _positional: list
  };
}

function form(obj) {
  const parts = [];
  for (const k in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
    const v = obj[k];
    parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(v === null || v === undefined ? "" : v));
  }
  return parts.join("&");
}

function getHeader(headers, name) {
  if (!headers) return "";
  const lower = String(name).toLowerCase();
  for (const k in headers) {
    if (String(k).toLowerCase() === lower) return headers[k];
  }
  return "";
}

/* Cookie 字符串 → 对象 */
function parseCookies(str) {
  const out = {};
  String(str || "")
    .split(/;\s*/)
    .forEach((pair) => {
      const i = pair.indexOf("=");
      if (i > 0) out[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
    });
  return out;
}

/* ============================ 配置 ============================ */

function loadConfig() {
  const arg = parseArgs();
  const bool = (v, d) => (v === undefined || v === null || v === "" ? d : String(v).toLowerCase() === "true");
  const pos = arg._positional || [];
  const pick = (key, idx, dflt) => {
    if (arg[key] !== undefined && arg[key] !== null && arg[key] !== "") return String(arg[key]);
    if (pos[idx] !== undefined && pos[idx] !== "") return String(pos[idx]);
    return dflt;
  };
  return {
    mode: pick("mode", 0, "query"),
    scene: pick("scene", 1, "unconditional"),
    targetNumber: pick("targetNumber", 2, "").trim(),
    autoQuery: bool(pick("autoQuery", 3, ""), false),
    enableNotify: bool(pick("enableNotify", 4, ""), true),
    requestNode: pick("requestNode", 5, "").trim(),
    forceScene: bool(pick("forceScene", 6, ""), false),
    // 抓取规则传参
    isCapture: bool(pick("capture", 0, ""), false),
    captureNotify: bool(pick("enableNotify", 4, ""), true)
  };
}

const CFG = loadConfig();

const SCENES = {
  unconditional: { key: "unconditionalCallOut", param: "unconditionalOpenType", label: "无条件呼叫转移", id: "50019" },
  busy: { key: "busyCallOut", param: "busyOpenType", label: "遇忙占线转移", id: "50020" },
  noAnswer: { key: "noAnswerCallOut", param: "noAnswerOpenType", label: "无人接听转移", id: "50021" },
  notAvailable: { key: "notAvailableCallOut", param: "notAvailableOpenType", label: "无法接通转移", id: "50022" }
};

/* ============================ HTTP ============================ */

function http(method, url, options) {
  const opt = options || {};
  const run = (attempt) =>
    new Promise((resolve) => {
      const params = {
        url,
        timeout: opt.timeout || 20000,
        headers: opt.headers || {},
        "auto-redirect": true,
        "auto-cookie": false,
        alpn: "h1"
      };
      if (CFG.requestNode) params.node = CFG.requestNode;
      if (opt.body !== undefined) params.body = opt.body;
      const fn = $httpClient[String(method).toLowerCase()] || $httpClient.get;
      fn(params, async (error, response, data) => {
        const body = typeof data === "string" ? data : "";
        if (error && attempt < 2) {
          await sleep(600 * (attempt + 1));
          resolve(run(attempt + 1));
          return;
        }
        resolve({
          error: error || null,
          status: (response && response.status) || 0,
          headers: (response && response.headers) || {},
          body,
          json: safeJSON(body, {})
        });
      });
    });
  return run(0);
}

/* ============================ 会话管理 ============================ */

/* 呼叫转移 H5 需要的 Cookie 白名单（从抓包 44 项里挑出与鉴权强相关的） */
const COOKIE_KEEP = [
  "ecs_token", "ecs_acc", "enc_acc", "c_id", "numToken", "cw_mutual",
  "t3_token", "third_token", "JSESSIONID", "PvSessionId", "devicedId",
  "d_deviceCode", "c_mobile", "custId", "u_account", "login_type",
  "channel", "c_version", "random_login", "u_areaCode", "wo_family",
  "city", "acw_tc", "ecs_cook", "MUT", "TOKEN_UID", "TOKEN_UID_ALL",
  "TOKEN_UID_NAME", "TOKEN_UID_USER_TYPE", "TOKEN_USER_NET", "TOKEN_USER_TYPE",
  "certNum", "mallcity", "usercity", "cdn_area", "GUESS_NUM", "TOKEN_NET",
  "servicetransactbusiness", "tianjin_ip", "tianjincity", "SHOP_PROV_CITY",
  "SUCCESSBANNER", "SUCCESSPOPUP"
];

function buildCookieString(cookies) {
  const parts = [];
  COOKIE_KEEP.forEach((k) => {
    if (cookies[k]) parts.push(`${k}=${cookies[k]}`);
  });
  // 白名单外的也保留，避免漏掉服务端新增字段
  for (const k in cookies) {
    if (COOKIE_KEEP.indexOf(k) < 0 && cookies[k]) parts.push(`${k}=${cookies[k]}`);
  }
  return parts.join("; ");
}

/* 抓取模式：从 App 的 H5 请求里保存整条会话 */
function captureSession() {
  try {
    const headers = $request.headers || {};
    const cookieRaw = getHeader(headers, "Cookie");
    if (!cookieRaw) {
      logLine("抓取触发，但请求未携带 Cookie");
      $done({});
      return;
    }
    const cookies = parseCookies(cookieRaw);
    if (!cookies.ecs_token) {
      logLine("抓取触发，但缺少 ecs_token，可能尚未登录");
      $done({});
      return;
    }
    const list = readJSON(STORE_KEY, []);
    const mobile = cookies.c_mobile || cookies.u_account || cookies.custId || "";
    const item = {
      mobile,
      cookie: buildCookieString(cookies),
      cookieRaw,
      ecsToken: cookies.ecs_token,
      cId: cookies.c_id || "",
      numToken: cookies.numToken || "",
      devicedId: cookies.devicedId || cookies.d_deviceCode || "",
      updatedAt: dateTime()
    };
    const idx = list.findIndex((x) => (mobile && x.mobile === mobile) || (item.ecsToken && x.ecsToken === item.ecsToken));
    if (idx >= 0) list[idx] = Object.assign({}, list[idx], item);
    else list.push(item);
    writeJSON(STORE_KEY, list);
    logLine(`已保存会话：${mask(mobile)}，共 ${list.length} 个账号`);
    if (CFG.captureNotify) {
      $notification.post("联通呼叫转移", "会话已保存", `账号 ${mask(mobile)}\n共 ${list.length} 个账号\n${dateTime()}`);
    }
  } catch (e) {
    logLine("抓取异常：" + String((e && e.stack) || e));
  }
  $done({});
}

function logLine(msg) {
  console.log(`[联通呼叫转移] ${msg}`);
}

/* ============================ 业务请求 ============================ */

function h5Headers(cookie) {
  return {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh-Hans;q=0.9",
    Origin: PAGE_ORIGIN,
    Referer: PAGE_ORIGIN + "/",
    "User-Agent": UA,
    Cookie: cookie
  };
}

/* 前缀参数：H5 每个业务请求都会带上这 6 个空字段 */
function prefixParams() {
  return (
    "duanlianjieabc=&channelCode=&serviceType=&saleChannel=" +
    "&externalSources=&contactCode="
  );
}

async function queryState(acc) {
  const url = `${BASE}/callForwardingNew/queryCallOutState`;
  const r = await http("post", url, { headers: h5Headers(acc.cookie), body: prefixParams() });
  if (r.error) return { error: r.error };
  return { data: r.json || {}, raw: r.body };
}

async function submitTranscat(acc, busiOrder, params, serialNumber) {
  const url = `${BASE}/callForwardingNew/transcatCallOut`;
  let body = prefixParams() + `&busiOrder=${encodeURIComponent(busiOrder)}`;
  body += `&serialNumber=${serialNumber ? encodeURIComponent(serialNumber) : ""}`;
  body += `&unconditionalOpenType=${val(params.unconditionalOpenType)}`;
  body += `&noAnswerOpenType=${val(params.noAnswerOpenType)}`;
  body += `&busyOpenType=${val(params.busyOpenType)}`;
  body += `&notAvailableOpenType=${val(params.notAvailableOpenType)}`;
  const r = await http("post", url, { headers: h5Headers(acc.cookie), body });
  return { json: r.json || {}, raw: r.body, error: r.error, status: r.status };
}

function val(v) {
  // 未指定场景：保留参数名但值为空（不要传 0！）
  return v === null || v === undefined ? "" : String(v);
}

/* ============================ 状态解析 ============================ */

function parseState(resp) {
  const d = (resp && resp.data) || {};
  if (String(d.code) !== "0000") {
    return { ok: false, code: String(d.code || ""), desc: d.desc || "查询失败" };
  }
  const data = d.data || {};
  const scenes = {};
  Object.keys(SCENES).forEach((name) => {
    const s = SCENES[name];
    const node = data[s.key] || {};
    scenes[name] = {
      state: String(node.state === null || node.state === undefined ? "" : node.state),
      number: node.transNumer || "",
      label: s.label,
      id: s.id,
      // state=0 表示场景已开通
      opened: String(node.state) === "0"
    };
  });
  return {
    ok: true,
    code: "0000",
    busiOrder: data.busiOrder || "",
    openStatus: String(data.openStatus || ""),
    serviceOpened: String(data.openStatus || "") === "00",
    custName: data.custName || "",
    userMobile: data.userMobile || "",
    isDate: String(data.isDate === null || data.isDate === undefined ? "" : data.isDate),
    certTypeCode: String(data.certTypeCode === null || data.certTypeCode === undefined ? "" : data.certTypeCode),
    scenes,
    tips: data.tips || ""
  };
}

function formatState(st, mobile) {
  if (!st.ok) return `查询失败：${st.desc}（code=${st.code}）`;
  const lines = [];
  lines.push(`账号 ${mobile ? mask(mobile) : ""}  ${st.custName || ""}`.trim());
  lines.push(`服务状态：${st.serviceOpened ? "已开通" : "未开通"}（openStatus=${st.openStatus}）`);
  Object.keys(SCENES).forEach((name) => {
    const s = st.scenes[name];
    const flag = s.opened ? "已开通" : "未开通";
    const num = s.number ? `  → ${mask(s.number)}` : "";
    lines.push(`  ${s.label}：${flag}${num}`);
  });
  return lines.join("\n");
}

/* ============================ 业务动作 ============================ */

/* 使单个场景开通(0)/关闭(1)；其余场景留空不动 */
function singleSceneParams(sceneName, openType) {
  const p = {
    unconditionalOpenType: null,
    noAnswerOpenType: null,
    busyOpenType: null,
    notAvailableOpenType: null
  };
  const meta = SCENES[sceneName] || SCENES.unconditional;
  p[meta.param] = openType; // "0" 开通 / "1" 关闭
  return p;
}

/*
 * 执行一次办理
 * 返回 { ok, needVerify, message }
 * needVerify = true 表示该号需要走短信/人脸核验，脚本无法完成
 */
async function runAction(acc, action) {
  const q = await queryState(acc);
  if (q.error) return { ok: false, message: `查询异常：${q.error}` };

  const st = parseState(q);
  if (!st.ok) return { ok: false, message: `查询失败：${st.desc}` };

  const scene = SCENES[action.scene] || SCENES.unconditional;
  const cur = st.scenes[action.scene];

  /* 前置状态检查（forceScene 可跳过） */
  if (!CFG.forceScene) {
    if (action.type === "open" && cur.opened) {
      return { ok: true, skipped: true, message: `${scene.label} 本来就是已开通，无需操作` };
    }
    if (action.type === "close" && !cur.opened) {
      return { ok: true, skipped: true, message: `${scene.label} 本来就是未开通，无需操作` };
    }
    if (action.type === "open" && !st.serviceOpened) {
      // openStatus=01 表示服务未开通，通常也可以直接通过 transcat 开通
      logLine(`提示：服务整体为未开通（openStatus=${st.openStatus}），尝试提交开通`);
    }
  }

  /* 核验前置判断 */
  if (st.isDate !== "1") {
    logLine(`注意：isDate=${st.isDate}，App 端此号需要短信/人脸核验，脚本无法自动完成`);
  }

  /* 组装参数 */
  let openType;
  if (action.type === "open") openType = "0";
  else if (action.type === "close") openType = "1";
  else openType = null; // set：只设置号码，不改开关

  const params = singleSceneParams(action.scene, openType);

  /* 转入号码：需要 RSA 加密 + encodeURIComponent */
  let serialNumber = "";
  if (action.type === "set") {
    if (!/^1\d{10}$/.test(action.targetNumber)) {
      return { ok: false, message: `转入号码无效：${action.targetNumber}（需为 11 位手机号）` };
    }
    if (typeof rsaEncrypt === "function") {
      serialNumber = rsaEncrypt(action.targetNumber);
    } else {
      return { ok: false, message: "当前环境缺少 RSA 加密能力，无法设置号码；请改用开通/关闭模式" };
    }
  }

  const r = await submitTranscat(acc, st.busiOrder, params, serialNumber);
  if (r.error) return { ok: false, message: `提交异常：${r.error}` };

  const j = r.json || {};
  const code = String(j.code || "");
  if (code === "0000") {
    const needsignature = j.data && String(j.data.needsignature) === "0";
    return {
      ok: true,
      message: `${verb(action.type)}${scene.label} 成功` + (needsignature ? "（需在App完成签字免填单）" : ""),
      raw: j
    };
  }

  /* 失败分支 */
  let hint = "";
  if (code === "9999") {
    hint =
      "\n可能原因：①该号不支持线上自助办理 ②需要先完成短信/人脸核验 " +
      "③无条件与自定义转移互斥 ④当日 5 次额度已用尽";
  } else if (code === "0004") {
    hint = "\n该号是固话/宽带/异网号码，不支持办理";
  } else if (code === "7777" || code === "0002") {
    hint = "\n页面判定为不可自助办理（isDate 异常），需前往营业厅";
  }
  return { ok: false, code, message: `${verb(action.type)}${scene.label} 失败：${j.desc || "未知错误"}${hint}` };
}

function verb(type) {
  if (type === "open") return "开通";
  if (type === "close") return "关闭";
  if (type === "set") return "设置";
  return "查询";
}

/* ============================ RSA 加密 ============================ */

/*
 * 前端使用 RSA PKCS#1 v1.5 公钥加密，结果 base64 后再 encodeURIComponent。
 * Loon 运行时没有内置 RSA，这里内联一个最小实现（BigInt 版）。
 * 公钥为 512-bit（64 字节），满足单块加密需求。
 */
const RSA_PUB_B64 =
  "MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBALNflQ3EdFdC3gFmD4ElXBajYlo5/eNceSzMquB8pRHZzjuCA6vw2Zmoveb+cwZes90NpXqXNMqSmc6rE8ppVn8CAwEAAQ==";

function b64ToBytes(b64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = {};
  for (let i = 0; i < chars.length; i++) lookup[chars[i]] = i;
  const clean = String(b64).replace(/[^A-Za-z0-9+/]/g, "");
  const bytes = [];
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = lookup[clean[i]];
    const c1 = lookup[clean[i + 1]];
    const c2 = lookup[clean[i + 2]];
    const c3 = lookup[clean[i + 3]];
    bytes.push((c0 << 2) | (c1 >> 4));
    if (c2 !== undefined) bytes.push(((c1 & 15) << 4) | (c2 >> 2));
    if (c3 !== undefined) bytes.push(((c2 & 3) << 6) | c3);
  }
  return bytes;
}

function bytesToB64(bytes) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += chars[b0 >> 2];
    out += chars[((b0 & 3) << 4) | ((b1 === undefined ? 0 : b1) >> 4)];
    out += b1 === undefined ? "=" : chars[((b1 & 15) << 2) | ((b2 === undefined ? 0 : b2) >> 6)];
    out += b2 === undefined ? "=" : chars[b2 & 63];
  }
  return out;
}

function bytesToBigInt(bytes) {
  let n = 0n;
  for (let i = 0; i < bytes.length; i++) n = (n << 8n) | BigInt(bytes[i]);
  return n;
}

function bigIntToBytes(n, len) {
  const out = [];
  let v = n;
  for (let i = 0; i < len; i++) {
    out.unshift(Number(v & 255n));
    v >>= 8n;
  }
  return out;
}

/* 解析 DER 编码的 RSA 公钥，取 modulus 与 exponent */
function parseDerPublicKey(b64) {
  const bytes = b64ToBytes(b64);
  // SubjectPublicKeyInfo: SEQUENCE { SEQUENCE { OID, NULL }, BIT STRING { SEQUENCE { N, E } } }
  let i = 0;
  function readLen() {
    let len = bytes[i++];
    if (len & 0x80) {
      const n = len & 0x7f;
      len = 0;
      for (let k = 0; k < n; k++) len = (len << 8) | bytes[i++];
    }
    return len;
  }
  if (bytes[i++] !== 0x30) throw new Error("DER: 期望 SEQUENCE");
  readLen();
  if (bytes[i++] !== 0x30) throw new Error("DER: 期望算法 SEQUENCE");
  const algLen = readLen();
  i += algLen; // 跳过 OID + NULL
  if (bytes[i++] !== 0x03) throw new Error("DER: 期望 BIT STRING");
  readLen();
  i++; // 跳过 unused bits
  if (bytes[i++] !== 0x30) throw new Error("DER: 期望内层 SEQUENCE");
  readLen();
  if (bytes[i++] !== 0x02) throw new Error("DER: 期望 INTEGER(N)");
  const nLen = readLen();
  const nBytes = bytes.slice(i, i + nLen);
  i += nLen;
  if (bytes[i++] !== 0x02) throw new Error("DER: 期望 INTEGER(E)");
  const eLen = readLen();
  const eBytes = bytes.slice(i, i + eLen);
  let n = bytesToBigInt(nBytes);
  const e = bytesToBigInt(eBytes);
  // DER 里的 INTEGER 可能带前导 0x00，真实模长按位长向上取整到字节
  const k = Math.ceil(n.toString(2).length / 8);
  return { n, e, k };
}

let _pubKey = null;
function getPub() {
  if (!_pubKey) _pubKey = parseDerPublicKey(RSA_PUB_B64);
  return _pubKey;
}

/* PKCS#1 v1.5 填充后做模幂运算 */
function rsaEncryptRaw(plain) {
  const pub = getPub();
  const msg = [];
  const str = unescape(encodeURIComponent(String(plain)));
  for (let i = 0; i < str.length; i++) msg.push(str.charCodeAt(i));

  const k = pub.k;
  if (msg.length > k - 11) throw new Error("明文过长");

  // EB = 00 || 02 || PS(随机非零) || 00 || M
  const psLen = k - msg.length - 3;
  const ps = [];
  for (let i = 0; i < psLen; i++) {
    let b = 0;
    while (b === 0) b = Math.floor(Math.random() * 255) + 1;
    ps.push(b);
  }
  const eb = [0x00, 0x02].concat(ps, [0x00], msg);
  const m = bytesToBigInt(eb);

  // c = m^e mod n
  let c = 1n;
  let base = m % pub.n;
  let exp = pub.e;
  while (exp > 0n) {
    if (exp & 1n) c = (c * base) % pub.n;
    base = (base * base) % pub.n;
    exp >>= 1n;
  }
  return bigIntToBytes(c, k);
}

function rsaEncrypt(plain) {
  const ct = rsaEncryptRaw(plain);
  return bytesToB64(ct);
}

/* ============================ 主流程 ============================ */

async function main() {
  const accounts = readJSON(STORE_KEY, []);
  if (!accounts.length) {
    const msg = "尚无账号会话。请开启“自动抓取会话”开关，然后在联通App中打开一次“呼叫转移”页面。";
    logLine(msg);
    if (CFG.enableNotify) $notification.post(`联通呼叫转移 ${VERSION}`, "未找到会话", msg);
    $done();
    return;
  }

  const type = CFG.mode === "open" ? "open" : CFG.mode === "close" ? "close" : CFG.mode === "set" ? "set" : "query";
  const parts = [];

  for (let i = 0; i < accounts.length; i++) {
    const acc = accounts[i];
    const label = `${acc.mobile ? mask(acc.mobile) : "账号" + (i + 1)}`;
    logLine(`—— 处理 ${label} ——`);

    if (type === "query") {
      const q = await queryState(acc);
      if (q.error) {
        parts.push(`【${label}】查询异常：${q.error}`);
        continue;
      }
      const st = parseState(q);
      const text = formatState(st, acc.mobile);
      logLine(text);
      parts.push(`【${label}】\n${text}`);
      await sleep(400);
      continue;
    }

    const res = await runAction(acc, { type, scene: CFG.scene, targetNumber: CFG.targetNumber });
    logLine(res.message);
    parts.push(`【${label}】${res.message}`);
    await sleep(600);
  }

  if (CFG.enableNotify) {
    const body = parts.join("\n\n");
    $notification.post(`联通呼叫转移 ${VERSION}`, `${accounts.length} 个账号 · ${dateTime()}`, body);
  }
  $done();
}

/* ============================ 入口 ============================ */

(async () => {
  try {
    if (CFG.isCapture) {
      captureSession();
      return;
    }
    await main();
  } catch (e) {
    const msg = String((e && e.stack) || e);
    console.log(msg);
    try {
      $notification.post("联通呼叫转移脚本异常", "", msg);
    } catch (_) {}
    $done();
  }
})();
