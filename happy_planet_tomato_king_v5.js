'use strict';

const SCRIPT_NAME = "统一梦时代·茄皇签到";
const BASE_URL = "https://farmgames.ioutu.cn";
const ACCOUNT_KEY = "QH";

const PUBLIC_KEY =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA70sK419vy3MabW3lEGlk" +
  "7Zh1u78OdnVlioVazp5Y46eBh+/TDqo/wZ9VrQ/4MmAtoP0vJ2vmwP5gqO3WPoj" +
  "b07WddXfF1eU+5M+Rj3s0eSRrvZvBcGZ3qK0dOgZJScK66IDQazt/c4xqhDcsI" +
  "tIyNRahUqB/IKc6E80GZJvMvFtZVSCseAXC0mAJXhi1AdUOlP+3Pv0fiUVejTJp" +
  "1j7LBNWJ7Z5/8mRcclQH0vmxsdYsaV3qZiJ2d/CfNoKcwmI2IWmeZy8NP5U8Hn" +
  "0AsxPEwjdHoEqG/iy/SoA46TZL+RLtWqUSHXpaKR/VFN0rbl25SE91X8FTfLqyD" +
  "8LfGMCwRQIDAQAB";

const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_2 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 " +
  "MicroMessenger/8.0.75(0x18004b42) NetType/WIFI Language/zh_CN " +
  "miniProgram/wx532ecb3bdaaf92f9";

const ACTION_DELAY = [2.5, 5.0];
const PHASE_DELAY = [8.0, 15.0];
const ACCOUNT_DELAY = [30.0, 60.0];
const RATE_LIMIT_DELAY = [15.0, 25.0];
const MAX_WATER_TIMES = 5;

const REQUEST_TIMEOUT_MS = 20000;

let RSA_KEY = null;
let PUBLIC_KEY_B64 = PUBLIC_KEY;
const SENSITIVE_VALUES = new Set();

const CONFIG = readConfig();

function readConfig() {
  const args = parseScriptArguments(typeof $argument !== "undefined" ? $argument : "");
  return {
    capture: toBool(args.capture, true),
    debug: toBool(args.debug, false),
  };
}

function parseScriptArguments(value) {
  const result = { capture: "", debug: "" };
  const keys = ["capture", "debug"];

  if (value === null || value === undefined || value === "") return result;

  if (typeof value === "object" && !Array.isArray(value)) {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const item = value[key];
        result[key] = item === null || item === undefined ? "" : String(item);
      }
    }
    return result;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (index < keys.length) result[keys[index]] = clean(item);
    });
    return result;
  }

  let text = clean(value);
  if (!text) return result;

  if (text.charAt(0) === "{" || text.charAt(0) === "[") {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") return parseScriptArguments(parsed);
    } catch (_) {}
  }

  if (text.indexOf("=") > -1) {
    for (const pair of text.split(",")) {
      const at = pair.indexOf("=");
      if (at < 0) continue;
      const key = pair.slice(0, at).trim();
      const val = pair.slice(at + 1).trim().replace(/^["']|["']$/g, "");
      if (key in result) result[key] = val;
    }
    return result;
  }

  text.split(",").forEach((item, index) => {
    if (index < keys.length) result[keys[index]] = clean(item);
  });
  return result;
}

function clean(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/^\s+|\s+$/g, "").replace(/^["']|["']$/g, "");
}

function toBool(value, fallback) {
  const text = clean(value).toLowerCase();
  if (!text) return fallback;
  if (["1", "true", "yes", "on", "开", "启用"].indexOf(text) > -1) return true;
  if (["0", "false", "no", "off", "关", "关闭"].indexOf(text) > -1) return false;
  return fallback;
}

function errText(error) {
  return String((error && error.message) || error || "未知错误");
}

function val(value) {
  return value === undefined || value === null || value === "" ? "?" : value;
}

function debugLog(message) {
  if (!CONFIG.debug) return;
  console.log(`[${SCRIPT_NAME}] ${String(message)}`);
}

function sleep(seconds) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, seconds * 1000)));
}

function randomBetween(min, max) {
  return min + Math.random() * Math.max(0, max - min);
}

function sleepHuman(range) {
  return sleep(randomBetween(range[0], range[1]));
}

function registerSensitive() {
  for (const value of arguments) {
    const text = value === null || value === undefined ? "" : String(value);
    if (text.length >= 4) SENSITIVE_VALUES.add(text);
  }
}

function maskId(value) {
  const text = value === null || value === undefined ? "" : String(value);
  if (!text) return "-";
  if (/^1\d{10}$/.test(text)) return `${text.slice(0, 3)}****${text.slice(-4)}`;
  if (text.length <= 4) return "*".repeat(text.length);
  if (text.length <= 8) return `${text.slice(0, 2)}****${text.slice(-2)}`;
  return `${text.slice(0, 4)}…${text.slice(-4)}`;
}

function shortOpenId(openId) {
  const text = String(openId || "");
  if (!text) return "-";
  return text.length > 12 ? `${text.slice(0, 6)}…${text.slice(-4)}` : maskId(text);
}

function redact(text) {
  let out = String(text === null || text === undefined ? "" : text);
  for (const secret of SENSITIVE_VALUES) {
    if (secret && secret.length >= 4) out = out.split(secret).join(maskId(secret));
  }
  out = out.replace(/(^|\D)(1\d{10})(?!\d)/g, (all, pre, phone) => {
    return `${pre}${phone.slice(0, 3)}****${phone.slice(-4)}`;
  });
  return out;
}

function brief(value, limit) {
  const text = redact(typeof value === "string" ? value : JSON.stringify(value || {}));
  const max = limit || 120;
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function safeStoreRead(key) {
  try {
    return $persistentStore.read(key) || "";
  } catch (_) {
    return "";
  }
}

function parseAccountString(rawValue) {
  const parts = clean(rawValue).split("#").map((item) => item.trim());
  const wid = parts[0] || "";
  if (!wid) return null;
  const openId = parts[1] || "";
  if (openId && openId.charAt(0) !== "o") return null;
  return {
    wid,
    openId,
    phone: /^\d{6,15}$/.test(parts[2] || "") ? parts[2] : "",
  };
}

function accountString(account) {
  const openId = account.openId || "";
  return account.phone ? `${account.wid}#${openId}#${account.phone}` : `${account.wid}#${openId}`;
}

function accountKey(account) {
  return `${account.wid}#${account.openId || ""}`;
}

function dedupeAccounts(list) {
  const seen = {};
  const out = [];
  for (const item of list) {
    if (!item || !item.wid) continue;
    const key = accountKey(item);
    if (seen[key]) {
      if (!seen[key].phone && item.phone) seen[key].phone = item.phone;
      continue;
    }
    seen[key] = item;
    out.push(item);
  }
  return out;
}

function loadAccounts() {
  const raw = safeStoreRead(ACCOUNT_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return dedupeAccounts(parsed.map((item) => parseAccountString(item)).filter(Boolean));
    }
  } catch (_) {}

  const single = parseAccountString(raw);
  return single ? [single] : [];
}

function saveAccountList(accounts) {
  const list = accounts.filter(Boolean);
  try {
    return Boolean($persistentStore.write(JSON.stringify(list.map(accountString)), ACCOUNT_KEY));
  } catch (_) {
    return false;
  }
}

function getHeader(headers, name) {
  if (!headers) return "";
  const target = String(name).toLowerCase();
  for (const key of Object.keys(headers)) {
    if (String(key).toLowerCase() === target) return String(headers[key]);
  }
  return "";
}

function safeDecode(value) {
  let text = String(value || "");
  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(text.replace(/\+/g, "%20"));
      if (decoded === text) break;
      text = decoded;
    } catch (_) {
      break;
    }
  }
  return text;
}

function findParam(text, names) {
  const source = safeDecode(text);
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`[?&#]${escaped}=([^&#\\s]+)`, "i"),
      new RegExp(`(?:^|[&\\s])${escaped}=([^&\\s]+)`, "i"),
      new RegExp(`["']${escaped}["']\\s*:\\s*["']([^"']+)["']`, "i"),
    ];
    for (const pattern of patterns) {
      const match = source.match(pattern);
      if (match && match[1]) return safeDecode(match[1]).trim();
    }
  }
  return "";
}

function extractAccount(request) {
  const headers = (request && request.headers) || {};
  const sources = [
    (request && request.url) || "",
    getHeader(headers, "Referer"),
    getHeader(headers, "Referrer"),
    (request && request.body) || "",
  ].filter(Boolean);

  let wid = "";
  let openId = "";
  for (const source of sources) {
    if (!wid) wid = findParam(source, ["wid"]);
    if (!openId) openId = findParam(source, ["openId", "openid"]);
    if (wid && openId) break;
  }

  wid = String(wid || "").replace(/["'<>]/g, "").trim();
  openId = String(openId || "").replace(/["'<>]/g, "").trim();
  if (!wid) return null;
  if (openId && openId.charAt(0) !== "o") openId = "";
  return { wid, openId, phone: "" };
}

function handleCapture() {
  if (!CONFIG.capture) {
    debugLog("未开启自动获取账号，跳过");
    return;
  }

  const account = extractAccount($request);
  if (!account) {
    debugLog(`[抓包] 未提取到 wid：${brief(($request && $request.url) || "", 120)}`);
    return;
  }

  const current = loadAccounts();
  const duplicate = current.find((item) => accountKey(item) === accountKey(account));
  if (duplicate) {
    debugLog(
      `[抓包] 已存在 wid=${maskId(account.wid)} openId=${shortOpenId(account.openId)}，共 ${current.length} 个`
    );
    return;
  }

  const sameWid = current.filter((item) => item.wid === account.wid);
  if (sameWid.length) {
    const emptyOpenId = sameWid.find((item) => !item.openId);
    if (!account.openId && sameWid.some((item) => item.openId)) {
      debugLog(`[抓包] wid=${maskId(account.wid)} 已有 openId 记录，忽略这次无 openId 的请求`);
      return;
    }
    if (account.openId && emptyOpenId) {
      emptyOpenId.openId = account.openId;
      const saved = saveAccountList(current);
      const message =
        `wid：${maskId(account.wid)}\nopenId：${shortOpenId(account.openId)}\n当前共 ${current.length} 个账号`;
      console.log(`[${SCRIPT_NAME}] 账号已补全\n${redact(message)}`);
      if (saved) {
        try {
          $notification.post(SCRIPT_NAME, "账号已补全", redact(message));
        } catch (_) {}
      }
      return;
    }
  }

  const next = current.concat([account]);
  const saved = saveAccountList(next);
  const action = current.length === 0 ? "账号获取成功" : "新账号已保存";
  const detail =
    `账号 #${next.length}/${next.length}\nwid：${maskId(account.wid)}\nopenId：${shortOpenId(account.openId) || "未获取"}` +
    (sameWid.length ? "\n注意：与已有账号 wid 相同、openId 不同，已按独立账号保存" : "");
  const message =
    `wid：${maskId(account.wid)}\nopenId：${shortOpenId(account.openId) || "未获取"}\n当前共 ${next.length} 个账号`;

  console.log(`[${SCRIPT_NAME}] ${action}\n${redact(message)}`);
  if (saved) {
    try {
      $notification.post(SCRIPT_NAME, action, redact(detail));
    } catch (_) {}
  }
}

function utf8Decode(bytes) {
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    const byte = bytes[i];
    if (byte < 0x80) {
      out += String.fromCharCode(byte);
    } else if (byte >= 0xc0 && byte < 0xe0) {
      out += String.fromCharCode(((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
      i += 1;
    } else if (byte >= 0xe0 && byte < 0xf0) {
      out += String.fromCharCode(
        ((byte & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)
      );
      i += 2;
    } else if (byte >= 0xf0) {
      const code =
        ((byte & 0x07) << 18) |
        ((bytes[i + 1] & 0x3f) << 12) |
        ((bytes[i + 2] & 0x3f) << 6) |
        (bytes[i + 3] & 0x3f);
      const point = code - 0x10000;
      out += String.fromCharCode(0xd800 + (point >> 10), 0xdc00 + (point & 0x3ff));
      i += 3;
    }
  }
  return out;
}

function toText(data) {
  if (data === null || data === undefined) return "";
  if (typeof data === "string") return data;
  if (typeof data === "object" && typeof data.length === "number") {
    try {
      const bytes = new Uint8Array(data.length);
      bytes.set(data);
      return utf8Decode(bytes);
    } catch (_) {
      return String(data);
    }
  }
  return String(data);
}

function loonHttp(method, options) {
  return new Promise((resolve, reject) => {
    const name = String(method || "GET").toLowerCase();
    const requester = $httpClient[name];
    if (typeof requester !== "function") {
      reject(new Error(`Loon 不支持 HTTP 方法：${method}`));
      return;
    }

    requester(options, (error, response, data) => {
      if (error && String(error).length) {
        reject(new Error(String(error)));
        return;
      }
      resolve({
        status: Number((response && (response.status || response.statusCode)) || 0),
        headers: (response && response.headers) || {},
        body: toText(data),
      });
    });
  });
}

const RATE_LIMIT_MARKERS = ["频繁", "稍后再试", "稍后重试", "活动火热进行中"];

function isRateLimited(message) {
  const text = String(message || "");
  return RATE_LIMIT_MARKERS.some((marker) => text.indexOf(marker) > -1);
}

function ok(result) {
  return Boolean(result) && (Number(result.code) === 200 || result.success === true);
}

async function requestWithRetry(options) {
  const {
    method,
    path,
    payload = null,
    encrypted = true,
    retries = 3,
    baseSleep = 2.0,
    headers = {},
  } = options;

  let last = null;

  for (let i = 0; i < retries; i += 1) {
    const requestHeaders = Object.assign({}, headers);
    const request = {
      url: `${BASE_URL}${path}`,
      timeout: REQUEST_TIMEOUT_MS,
      headers: requestHeaders,
    };

    if (payload !== null) {
      if (encrypted) {
        request.body = JSON.stringify(encryptPayload(payload));
        requestHeaders["Content-Type"] = "application/json";
        requestHeaders["X-Request-Encrypted"] = "true";
      } else {
        request.body = typeof payload === "string" ? payload : JSON.stringify(payload);
      }
    }

    debugLog(`${method} ${path}（第 ${i + 1} 次）`);
    const response = await loonHttp(method, request);

    let result;
    try {
      result = JSON.parse(response.body);
    } catch (_) {
      throw new Error(`非 JSON 响应（HTTP ${response.status}）：${brief(response.body, 120)}`);
    }

    if (response.status >= 400) {
      throw new Error(
        (result && (result.msg || result.message)) || `HTTP ${response.status}`
      );
    }

    last = result;
    if (ok(result)) return result;

    const message = String((result && (result.msg || result.message)) || "");
    if (isRateLimited(message) && i < retries - 1) {
      const low = Math.max(baseSleep, RATE_LIMIT_DELAY[0]);
      const high = Math.max(low, RATE_LIMIT_DELAY[1]);
      const wait = randomBetween(low, high) * (i + 1);
      console.log(`触发频控，${wait.toFixed(1)}s 后重试（${i + 1}/${retries - 1}）`);
      await sleep(wait);
      continue;
    }
    return result;
  }

  return last;
}

function b64decode(text) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const clean = String(text).replace(/[^A-Za-z0-9+/]/g, "");
  const out = [];
  for (let i = 0; i < clean.length; i += 4) {
    const n =
      (chars.indexOf(clean[i]) << 18) |
      (chars.indexOf(clean[i + 1]) << 12) |
      ((clean[i + 2] ? chars.indexOf(clean[i + 2]) : 0) << 6) |
      (clean[i + 3] ? chars.indexOf(clean[i + 3]) : 0);
    out.push((n >> 16) & 255);
    if (clean[i + 2]) out.push((n >> 8) & 255);
    if (clean[i + 3]) out.push(n & 255);
  }
  return new Uint8Array(out);
}

function b64encode(bytes) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += chars[b0 >> 2];
    out += chars[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? chars[((b1 & 15) << 2) | (b2 >> 6)] : "=";
    out += i + 2 < bytes.length ? chars[b2 & 63] : "=";
  }
  return out;
}

function utf8Encode(text) {
  const out = [];
  for (let i = 0; i < text.length; i += 1) {
    let code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(i + 1);
      code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
      i += 1;
    }
    if (code < 0x80) {
      out.push(code);
    } else if (code < 0x800) {
      out.push(0xc0 | (code >> 6), 0x80 | (code & 63));
    } else if (code < 0x10000) {
      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    } else {
      out.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 63),
        0x80 | ((code >> 6) & 63),
        0x80 | (code & 63)
      );
    }
  }
  return new Uint8Array(out);
}

let RANDOM_POOL = [];

function randomBytes(length) {
  if (!RANDOM_POOL.length) {
    RANDOM_POOL.push(Date.now(), Math.random(), Math.random(), Math.random());
  }
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    out[i] = Math.floor(Math.random() * 256);
  }
  return out;
}

const K256 = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotr(x, n) {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

function sha256(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const bitLen = data.length * 8;
  const padded = new Uint8Array((((data.length + 9) >> 6) + 1) << 6);
  padded.set(data);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 4294967296));
  view.setUint32(padded.length - 4, bitLen >>> 0);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Array(64);

  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i += 1) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K256[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  const out = new Uint8Array(32);
  const ov = new DataView(out.buffer);
  [h0, h1, h2, h3, h4, h5, h6, h7].forEach((v, i) => ov.setUint32(i * 4, v));
  return out;
}

function buildSbox() {
  const exp = new Uint8Array(512);
  const log = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    exp[i] = x;
    log[x] = i;
    x ^= (x << 1) ^ ((x & 0x80) ? 0x11b : 0);
    x &= 0xff;
  }
  for (let i = 255; i < 512; i += 1) exp[i] = exp[i - 255];

  const sbox = new Uint8Array(256);
  for (let i = 0; i < 256; i += 1) {
    const inv = i === 0 ? 0 : exp[255 - log[i]];
    let s = inv;
    for (let k = 1; k <= 4; k += 1) s ^= ((inv << k) | (inv >>> (8 - k))) & 0xff;
    sbox[i] = (s ^ 0x63) & 0xff;
  }
  return sbox;
}

const SBOX = buildSbox();
const RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40];

function expandKey(key) {
  const nk = key.length / 4;
  const nr = nk + 6;
  const w = [];
  for (let i = 0; i < nk; i += 1) w.push([key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]]);

  for (let i = nk; i < 4 * (nr + 1); i += 1) {
    let temp = w[i - 1].slice();
    if (i % nk === 0) {
      temp = [temp[1], temp[2], temp[3], temp[0]].map((b) => SBOX[b]);
      temp[0] ^= RCON[i / nk - 1];
    } else if (nk > 6 && i % nk === 4) {
      temp = temp.map((b) => SBOX[b]);
    }
    w.push(w[i - nk].map((b, k) => b ^ temp[k]));
  }
  return { w, nr };
}

function encryptBlock(block, expanded) {
  const { w, nr } = expanded;
  const state = new Uint8Array(block);

  for (let c = 0; c < 4; c += 1) {
    for (let r = 0; r < 4; r += 1) state[4 * c + r] ^= w[c][r];
  }

  for (let round = 1; round <= nr; round += 1) {
    for (let i = 0; i < 16; i += 1) state[i] = SBOX[state[i]];

    const copy = state.slice();
    for (let r = 1; r < 4; r += 1) {
      for (let c = 0; c < 4; c += 1) state[4 * c + r] = copy[4 * ((c + r) % 4) + r];
    }

    if (round !== nr) {
      for (let c = 0; c < 4; c += 1) {
        const a0 = state[4 * c];
        const a1 = state[4 * c + 1];
        const a2 = state[4 * c + 2];
        const a3 = state[4 * c + 3];
        const all = a0 ^ a1 ^ a2 ^ a3;
        state[4 * c] = a0 ^ all ^ xtime(a0 ^ a1);
        state[4 * c + 1] = a1 ^ all ^ xtime(a1 ^ a2);
        state[4 * c + 2] = a2 ^ all ^ xtime(a2 ^ a3);
        state[4 * c + 3] = a3 ^ all ^ xtime(a3 ^ a0);
      }
    }

    for (let c = 0; c < 4; c += 1) {
      for (let r = 0; r < 4; r += 1) state[4 * c + r] ^= w[round * 4 + c][r];
    }
  }
  return state;
}

function xtime(b) {
  return ((b << 1) ^ ((b & 0x80) ? 0x1b : 0)) & 0xff;
}

function gfMul(x, y) {
  const z = new Uint8Array(16);
  const v = x.slice();
  for (let i = 0; i < 128; i += 1) {
    if ((y[i >> 3] >> (7 - (i & 7))) & 1) {
      for (let k = 0; k < 16; k += 1) z[k] ^= v[k];
    }
    const lsb = v[15] & 1;
    for (let k = 15; k > 0; k -= 1) v[k] = ((v[k] >>> 1) | ((v[k - 1] & 1) << 7)) & 0xff;
    v[0] = v[0] >>> 1;
    if (lsb) v[0] ^= 0xe1;
  }
  return z;
}

function ghash(h, data) {
  let y = new Uint8Array(16);
  for (let off = 0; off < data.length; off += 16) {
    for (let k = 0; k < 16; k += 1) y[k] ^= data[off + k] || 0;
    y = gfMul(y, h);
  }
  return y;
}

function aesGcmEncrypt(key, iv, plaintext) {
  const expanded = expandKey(key);
  const h = encryptBlock(new Uint8Array(16), expanded);

  const j0 = new Uint8Array(16);
  j0.set(iv.subarray(0, 12));
  j0[15] = 1;

  const counter = j0.slice();
  const ciphertext = new Uint8Array(plaintext.length);
  for (let off = 0; off < plaintext.length; off += 16) {
    for (let k = 15; k >= 12; k -= 1) {
      counter[k] = (counter[k] + 1) & 0xff;
      if (counter[k] !== 0) break;
    }
    const stream = encryptBlock(counter, expanded);
    const n = Math.min(16, plaintext.length - off);
    for (let k = 0; k < n; k += 1) ciphertext[off + k] = plaintext[off + k] ^ stream[k];
  }

  const lenBlock = new Uint8Array(16);
  const textBits = plaintext.length * 8;
  for (let i = 0; i < 8; i += 1) {
    lenBlock[15 - i] = (textBits / Math.pow(2, 8 * i)) & 0xff;
  }
  const paddedLen = Math.ceil(ciphertext.length / 16) * 16;
  const tagData = new Uint8Array(paddedLen + 16);
  tagData.set(ciphertext, 0);
  tagData.set(lenBlock, paddedLen);

  const s = ghash(h, tagData);
  const mask = encryptBlock(j0, expanded);
  const tag = new Uint8Array(16);
  for (let i = 0; i < 16; i += 1) tag[i] = s[i] ^ mask[i];

  return { ciphertext, tag };
}

function derChildren(bytes, start, end) {
  const out = [];
  let i = start;
  while (i < end) {
    const tag = bytes[i];
    let len = bytes[i + 1];
    let head = 2;
    if (len & 0x80) {
      const count = len & 0x7f;
      len = 0;
      for (let k = 0; k < count; k += 1) len = (len << 8) | bytes[i + 2 + k];
      head = 2 + count;
    }
    out.push({ tag, start: i + head, end: i + head + len, raw: bytes.subarray(i + head, i + head + len) });
    i += head + len;
  }
  return out;
}

function bytesToBigInt(bytes) {
  let hex = "";
  for (let i = 0; i < bytes.length; i += 1) hex += bytes[i].toString(16).padStart(2, "0");
  return BigInt("0x" + (hex || "0"));
}

function bigIntToBytes(value, length) {
  let hex = value.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  const raw = new Uint8Array(hex.length / 2);
  for (let i = 0; i < raw.length; i += 1) raw[i] = parseInt(hex.substr(i * 2, 2), 16);
  if (raw.length >= length) return raw.subarray(raw.length - length);
  const out = new Uint8Array(length);
  out.set(raw, length - raw.length);
  return out;
}

function parseRsaPublicKey(base64Text) {
  const der = b64decode(base64Text);
  if (der[0] !== 0x30) throw new Error("公钥格式异常");
  const top = derChildren(der, 0, der.length)[0];
  const parts = derChildren(der, top.start, top.end);
  const bitString = parts[1].raw.subarray(1);
  const seq = derChildren(bitString, 0, bitString.length)[0];
  const ints = derChildren(bitString, seq.start, seq.end);
  return { n: bytesToBigInt(ints[0].raw), e: bytesToBigInt(ints[1].raw) };
}

function modPow(base, exponent, modulus) {
  let result = 1n;
  let b = base % modulus;
  let e = exponent;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % modulus;
    b = (b * b) % modulus;
    e >>= 1n;
  }
  return result;
}

function mgf1(seed, length) {
  const out = new Uint8Array(length);
  let offset = 0;
  for (let counter = 0; offset < length; counter += 1) {
    const block = new Uint8Array(seed.length + 4);
    block.set(seed);
    block[seed.length] = (counter >>> 24) & 255;
    block[seed.length + 1] = (counter >>> 16) & 255;
    block[seed.length + 2] = (counter >>> 8) & 255;
    block[seed.length + 3] = counter & 255;
    const digest = sha256(block);
    out.set(digest.subarray(0, Math.min(32, length - offset)), offset);
    offset += 32;
  }
  return out;
}

function rsaOaepEncrypt(message, key) {
  const k = Math.ceil(key.n.toString(16).length / 2);
  const hLen = 32;
  const lHash = sha256(new Uint8Array(0));
  const ps = new Uint8Array(k - message.length - hLen * 2 - 2);
  const db = new Uint8Array(lHash.length + ps.length + 1 + message.length);
  db.set(lHash, 0);
  db[lHash.length + ps.length] = 1;
  db.set(message, lHash.length + ps.length + 1);

  const seed = randomBytes(hLen);
  const dbMask = mgf1(seed, k - hLen - 1);
  const maskedDB = new Uint8Array(db.length);
  for (let i = 0; i < db.length; i += 1) maskedDB[i] = db[i] ^ dbMask[i];
  const seedMask = mgf1(maskedDB, hLen);
  const maskedSeed = new Uint8Array(hLen);
  for (let i = 0; i < hLen; i += 1) maskedSeed[i] = seed[i] ^ seedMask[i];

  const em = new Uint8Array(k);
  em.set(maskedSeed, 1);
  em.set(maskedDB, hLen + 1);

  return bigIntToBytes(modPow(bytesToBigInt(em), key.e, key.n), k);
}

async function refreshPublicKey() {
  try {
    const response = await loonHttp("GET", {
      url: `${BASE_URL}/api/web/open/encrypt/public-key`,
      timeout: 15000,
    });
    if (response.status < 200 || response.status >= 300) return false;

    let body;
    try {
      body = JSON.parse(response.body);
    } catch (_) {
      return false;
    }

    const data = body && body.data;
    const candidates = [];
    if (typeof data === "string") candidates.push(data);
    if (data && typeof data === "object") candidates.push(data.publicKey, data.public_key, data.key);
    candidates.push(body && body.publicKey, body && body.public_key);

    const found = candidates.find((v) => typeof v === "string" && v.indexOf("MIIB") > -1);
    if (!found) return false;

    const cleaned = found
      .replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----/g, "")
      .replace(/\\n|\s/g, "");

    parseRsaPublicKey(cleaned);
    PUBLIC_KEY_B64 = cleaned;
    RSA_KEY = null;
    return true;
  } catch (error) {
    debugLog(`刷新公钥失败，使用内置公钥：${errText(error)}`);
    return false;
  }
}

function getPublicKey() {
  if (RSA_KEY) return RSA_KEY;
  RSA_KEY = parseRsaPublicKey(PUBLIC_KEY_B64);
  return RSA_KEY;
}

function encryptPayload(payload) {
  const aesKey = randomBytes(32);
  const iv = randomBytes(12);
  const plaintext = utf8Encode(JSON.stringify(payload));
  const { ciphertext, tag } = aesGcmEncrypt(aesKey, iv, plaintext);
  const data = new Uint8Array(ciphertext.length + tag.length);
  data.set(ciphertext, 0);
  data.set(tag, ciphertext.length);

  return {
    data: b64encode(data),
    key: b64encode(rsaOaepEncrypt(aesKey, getPublicKey())),
    iv: b64encode(iv),
  };
}

class TomatoClient {
  constructor(account) {
    this.account = account;
    this.wid = account.wid;
    this.openId = account.openId || "";
    this.phone = account.phone || "";
    this.token = "";

    const query = [`wid=${encodeURIComponent(this.wid)}`];
    if (this.openId) query.push(`openId=${encodeURIComponent(this.openId)}`);

    this.baseHeaders = {
      "User-Agent": USER_AGENT,
      Accept: "*/*",
      "Content-Type": "application/json",
      Origin: BASE_URL,
      Referer: `${BASE_URL}/?${query.join("&")}`,
      "Accept-Language": "zh-CN,zh;q=0.9",
    };
  }

  headers() {
    const headers = Object.assign({}, this.baseHeaders);
    if (this.token) headers.Authorization = this.token;
    return headers;
  }

  call(method, path, payload, options) {
    const config = Object.assign(
      { method, path, payload: payload === undefined ? null : payload, headers: this.headers() },
      options || {}
    );
    return requestWithRetry(config);
  }

  async login() {
    await refreshPublicKey();

    const payload = { wid: String(this.wid), queryCardStatus: true };
    if (this.openId) payload.openId = this.openId;
    if (this.phone) {
      payload.wm_phone = this.phone;
      payload.mobile = this.phone;
    }
    payload.shareTomatoUserId = null;

    const result = await this.call("POST", "/api/web/open/tomato/login", payload, {
      retries: 2,
      baseSleep: 1.5,
    });

    const data = (result && result.data) || {};
    if (!ok(result) || !data.token) {
      throw new Error(brief(result, 160));
    }

    this.token = data.token;
    registerSensitive(data.token, data.wid, data.openId, data.mobile, data.tomatoUserId);
    return data;
  }

  home() {
    return this.call("GET", "/api/web/member/tomato/home", null, { retries: 2, baseSleep: 1.2 });
  }

  tasks() {
    return this.call("GET", "/api/web/member/tomato/tasks", null, { retries: 2, baseSleep: 1.2 });
  }

  pageVisit(pagePath) {
    return this.call(
      "POST",
      "/api/web/member/tomato/page-visit",
      { pagePath: String(pagePath).slice(0, 500) },
      { retries: 1, baseSleep: 1.5 }
    );
  }

  completeTask(task) {
    return this.call(
      "POST",
      "/api/web/member/tomato/tasks/complete",
      {
        taskType: (task && task.taskType) || "",
        browseTarget: (task && task.browseTarget) || "",
      },
      { retries: 4, baseSleep: 2.5 }
    );
  }

  async friends(pageSize) {
    const size = pageSize || 20;
    const list = [];
    for (let pageNum = 1; pageNum <= 50; pageNum += 1) {
      const result = await this.call(
        "GET",
        `/api/web/member/tomato/friends?pageNum=${pageNum}&pageSize=${size}`,
        null,
        { retries: 2, baseSleep: 1.2 }
      );
      if (!ok(result)) throw new Error(`获取好友列表失败：${brief(result, 120)}`);

      const rows = Array.isArray(result.rows) ? result.rows : [];
      list.push.apply(list, rows);

      const total = Number(result.total || 0);
      if (rows.length === 0 || (total > 0 && list.length >= total) || rows.length < size) break;
    }
    return list;
  }

  friendHome(friendUserId) {
    return this.call(
      "GET",
      `/api/web/member/tomato/friends/${encodeURIComponent(friendUserId)}/home`,
      null,
      { retries: 2, baseSleep: 1.0 }
    );
  }

  steal(friendUserId) {
    return this.call(
      "POST",
      "/api/web/member/tomato/friends/steal",
      { friendTomatoUserId: friendUserId },
      { retries: 2, baseSleep: 1.2 }
    );
  }

  useEnergy() {
    return this.call(
      "POST",
      "/api/web/member/tomato/energy/use",
      { syncHomeInfo: true },
      { retries: 4, baseSleep: 2.5 }
    );
  }
}

function homeLine(data, prefix) {
  const home = data || {};
  return (
    `${prefix || "当前状态"}：能量 ${Number(home.energyBalance || 0)}，` +
    `番茄 ${Number(home.tomatoBalance || 0)}，` +
    `${home.stageName || "未知阶段"} ` +
    `${Number(home.currentExp || 0)}/${Number(home.stageRequiredExp || 0)}`
  );
}

function say(logs, message) {
  const line = redact(message);
  logs.push(line);
  console.log(line);
}

function taskStepName(taskType) {
  const type = String(taskType || "").toUpperCase();
  if (type === "SIGN") return "签到";
  if (type === "BROWSE") return "浏览任务";
  if (type === "SHARE") return "分享任务";
  return "";
}

async function runTasks(client, logs) {
  const result = { completed: 0, skipped: 0 };

  let tasks;
  try {
    const response = await client.tasks();
    if (!ok(response)) throw new Error(brief(response, 140));
    let rows = response.data;
    if (rows && !Array.isArray(rows) && typeof rows === "object") {
      rows = rows.list || rows.rows || [];
    }
    tasks = Array.isArray(rows) ? rows : [];
  } catch (error) {
    say(logs, `获取任务列表失败：${brief(errText(error), 100)}`);
    return result;
  }

  if (!tasks.length) {
    say(logs, "任务列表为空");
    return result;
  }

  const todo = [];

  for (const task of tasks) {
    const type = String((task && task.taskType) || "").toUpperCase();
    const name = (task && (task.taskName || task.taskCode)) || type || "未知任务";

    if (type === "FRIEND_STEAL_ENERGY") continue;

    const isDone =
      String((task && task.completed) || "0") === "1" ||
      String((task && task.actionType) || "").toUpperCase() === "DONE";

    if (!taskStepName(type)) {
      result.skipped += 1;
      say(logs, `跳过任务：${name}（需在小程序内操作）`);
      continue;
    }
    if (isDone) {
      say(logs, `任务已完成：${name}`);
      continue;
    }
    todo.push(task);
  }

  for (const task of todo) {
    const type = String((task && task.taskType) || "").toUpperCase();
    const name = (task && (task.taskName || task.taskCode)) || type;

    try {
      if (type === "BROWSE" && task.browseTarget) {
        try {
          await client.pageVisit(task.browseTarget);
        } catch (error) {
          debugLog(`page-visit 失败（忽略）：${errText(error)}`);
        }
        await sleepHuman(ACTION_DELAY);
      }

      const response = await client.completeTask(task);
      if (ok(response)) {
        const data = (response && response.data) || {};
        const reward =
          data.rewardText ||
          (data.rewardEnergy !== undefined
            ? `+${data.rewardEnergy} 能量`
            : task.rewardEnergy !== undefined
              ? `+${task.rewardEnergy} 能量`
              : "已领取");
        say(logs, `任务完成：${name}，${reward}`);
        result.completed += 1;
      } else {
        result.skipped += 1;
        say(logs, `任务失败：${name}，${brief(response, 60)}`);
      }
    } catch (error) {
      result.skipped += 1;
      say(logs, `任务失败：${name}，${brief(errText(error), 60)}`);
    }

    await sleepHuman(ACTION_DELAY);
  }

  return result;
}

async function collectFriendEnergy(client, logs) {
  const stat = { checked: 0, collected: 0, energy: 0, failed: 0 };

  let friends;
  try {
    friends = await client.friends(20);
  } catch (error) {
    say(logs, `好友能量失败：${brief(errText(error), 80)}`);
    return stat;
  }

  for (const friend of friends) {
    const friendId = String((friend && friend.friendTomatoUserId) || "");
    if (!friendId) continue;
    registerSensitive(friendId);
    stat.checked += 1;

    try {
      const response = await client.friendHome(friendId);
      const home = (response && response.data) || null;
      if (!ok(response) || !home) {
        stat.failed += 1;
      } else {
        const available = Number(home.stealAmount || 0);
        if (String(home.canSteal || "") === "1" && available > 0) {
          const stealResponse = await client.steal(friendId);
          if (ok(stealResponse)) {
            let gained = stealResponse.data;
            if (gained && typeof gained === "object") {
              gained = gained.stealAmount !== undefined ? gained.stealAmount : gained.energyAmount;
            }
            const amount = Number(gained);
            stat.collected += 1;
            stat.energy += Number.isFinite(amount) ? amount : available;
          } else {
            stat.failed += 1;
          }
        }
      }
    } catch (error) {
      stat.failed += 1;
      debugLog(`好友处理失败：${brief(errText(error), 60)}`);
    }

    await sleepHuman(ACTION_DELAY);
  }

  if (stat.collected > 0) {
    say(
      logs,
      `好友能量：成功收取 ${stat.collected} 位好友，共 ${stat.energy} 能量` +
        (stat.failed > 0 ? `，失败 ${stat.failed} 位` : "")
    );
  } else if (stat.failed > 0) {
    say(logs, `好友能量：收取失败 ${stat.failed} 位`);
  } else {
    say(logs, "好友能量：暂无可收取能量");
  }

  return stat;
}

async function waterEnergy(client, home, logs) {
  const startEnergy = Number((home && home.energyBalance) || 0);
  const startTomato = Number((home && home.tomatoBalance) || 0);
  if (startEnergy <= 0) {
    say(logs, "使用能量：当前没有可用能量");
    return home;
  }

  let success = 0;
  let last = home;

  for (let i = 0; i < MAX_WATER_TIMES; i += 1) {
    let response;
    try {
      response = await client.useEnergy();
    } catch (error) {
      say(logs, `使用能量失败：${brief(errText(error), 80)}`);
      break;
    }

    if (!ok(response)) {
      const message = String((response && (response.msg || response.message)) || "") || brief(response, 60);
      say(logs, success === 0 ? `使用能量失败：${message}` : `使用能量：成功 ${success} 次后停止，${message}`);
      break;
    }

    const data = (response && response.data) || {};
    if (data && typeof data === "object" && Object.keys(data).length) last = data;
    success += 1;
    debugLog(
      `浇水#${success} 能量=${val(last.energyBalance)} 经验=${val(last.currentExp)}/${val(last.stageRequiredExp)}`
    );

    let left = 0;
    try {
      left = Number(data.energyBalance || 0);
    } catch (_) {
      break;
    }
    if (left <= 0) break;

    await sleepHuman(ACTION_DELAY);
  }

  if (success > 0) {
    const used = Math.max(0, startEnergy - Number(last.energyBalance || 0));
    const gained = Math.max(0, Number(last.tomatoBalance || 0) - startTomato);
    say(
      logs,
      `使用能量：浇水 ${success} 次，消耗 ${used}，成长到 ${last.stageName || "未知阶段"} ` +
        `${Number(last.currentExp || 0)}/${Number(last.stageRequiredExp || 0)}，获得番茄 ${gained}`
    );
  }
  return last;
}

async function processUser(account, index, total) {
  const wid = String(account.wid || "");
  const openId = String(account.openId || "");
  const phone = String(account.phone || "");
  registerSensitive(wid, openId, phone);

  const logs = [];
  logs.title = `账号 ${maskId(wid)}`;
  const client = new TomatoClient(account);

  let loginData;
  try {
    loginData = await client.login();
  } catch (error) {
    say(logs, `登录失败：${brief(errText(error), 100)}`);
    return logs;
  }

  logs.title = loginData.nickName || "未设置昵称";
  console.log(logs.title);
  await sleepHuman(ACTION_DELAY);

  let home = {};
  try {
    const response = await client.home();
    if (ok(response) && response.data && typeof response.data === "object") {
      home = response.data;
      say(logs, homeLine(home));
    } else {
      say(logs, `获取主页失败：${brief(response, 80)}`);
    }
  } catch (error) {
    say(logs, `获取主页失败：${brief(errText(error), 80)}`);
  }

  await sleepHuman(PHASE_DELAY);

  let taskStat = { completed: 0, skipped: 0 };
  try {
    taskStat = await runTasks(client, logs);
  } catch (error) {
    say(logs, `任务处理失败：${brief(errText(error), 80)}`);
  }

  await sleepHuman(PHASE_DELAY);
  try {
    await collectFriendEnergy(client, logs);
  } catch (error) {
    say(logs, `好友能量失败：${brief(errText(error), 80)}`);
  }

  await sleepHuman(PHASE_DELAY);
  try {
    const response = await client.home();
    if (ok(response) && response.data && typeof response.data === "object") {
      home = response.data;
      say(logs, homeLine(home, "任务后状态"));
    }
  } catch (error) {
    debugLog(`主页刷新失败：${errText(error)}`);
  }

  await sleepHuman(ACTION_DELAY);
  home = await waterEnergy(client, home, logs);
  await sleepHuman(ACTION_DELAY);

  try {
    const response = await client.home();
    if (ok(response) && response.data && typeof response.data === "object") {
      home = response.data;
    }
  } catch (error) {
    debugLog(`终态主页刷新失败：${errText(error)}`);
  }
  say(logs, homeLine(home, "最终状态"));

  say(logs, `本次完成任务 ${taskStat.completed} 个，跳过 ${taskStat.skipped} 个`);

  return logs;
}

function renderReport(allLogs) {
  const blocks = [];
  for (const logs of allLogs) {
    if (!logs || (!logs.title && !logs.length)) continue;
    blocks.push([logs.title || "账号"].concat(logs).join("\n"));
  }
  return redact(blocks.join("\n━━━━━━━━━━━━━━━━━━━━\n"));
}

function notify(title, subtitle, body) {
  try {
    $notification.post(title, subtitle, body);
  } catch (error) {
    console.log(`[${SCRIPT_NAME}] 通知失败：${errText(error)}`);
  }
}

async function main() {
  const accounts = loadAccounts();
  if (!accounts.length) {
    const message = "没有可用账号。请先在微信打开一次茄皇活动页面自动获取";
    console.log(message);
    notify(SCRIPT_NAME, "尚未获取账号", message);
    return;
  }

  for (const account of accounts) registerSensitive(account.wid, account.openId, account.phone);


  const allLogs = [];

  for (let i = 0; i < accounts.length; i += 1) {
    if (i > 0) console.log("━━━━━━━━━━━━━━━━━━━━");
    allLogs.push(await processUser(accounts[i], i + 1, accounts.length));
    if (i < accounts.length - 1) await sleepHuman(ACCOUNT_DELAY);
  }

  const report = renderReport(allLogs);
  notify(SCRIPT_NAME, `多账号任务完成（${accounts.length} 个账号）`, report);
}

(async () => {
  const captureMode = typeof $request !== "undefined" && Boolean($request && $request.url);

  try {
    if (captureMode) {
      handleCapture();
    } else {
      await main();
    }
  } catch (error) {
    const message = `${captureMode ? "账号获取" : "脚本运行"}失败：${errText(error)}`;
    console.log(redact(message));
    notify(SCRIPT_NAME, captureMode ? "账号获取失败" : "运行失败", redact(message));
  } finally {
    if (captureMode) $done({});
    else $done();
  }
})();