'use strict';

/*
 * 快乐星球·茄皇 V6（多账号 / Loon）
 * 基准：统一茄皇青龙版 v1.0.3（2026-07-26）
 * 移植时保留的：开卡状态守卫、page-visit 上报、好友能量、浇水循环、
 *               频控退避、阶段间隔、日志脱敏
 * 有意去掉的：登录包 shareTomatoUserId 邀请绑定（默认 null，可手动填 inviter）
 * 保留自 V5 的：好友按 friendStatus 预筛、分享前创建小程序二维码
 */

const SCRIPT_NAME = "快乐星球·茄皇 V6";
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

const FORGE_URLS = [
  "https://cdn.jsdelivr.net/npm/node-forge@1.3.1/dist/forge.min.js",
  "https://unpkg.com/node-forge@1.3.1/dist/forge.min.js",
  "https://raw.githubusercontent.com/digitalbazaar/forge/1.3.1/dist/forge.min.js",
];

// 风控节奏（秒），与青龙版一致
const ACTION_DELAY = [2.5, 5.0];
const PHASE_DELAY = [8.0, 15.0];
const ACCOUNT_DELAY = [30.0, 60.0];
const RATE_LIMIT_DELAY = [15.0, 25.0];

const REQUEST_TIMEOUT_MS = 20000;
const STEP_ORDER = ["登录", "主页", "开卡", "签到", "浏览任务", "分享任务", "浇水", "信息"];
const STEP_EMOJI = {
  "登录": "🔑",
  "主页": "🏠",
  "开卡": "💳",
  "签到": "📅",
  "浏览任务": "🔍",
  "分享任务": "📤",
  "浇水": "💧",
  "信息": "ℹ️",
};

let FORGE = null;
let RSA_PUBLIC_KEY = null;
let DEADLINE = 0;
const SENSITIVE_VALUES = new Set();

const CONFIG = readConfig();

// ==================== 配置 ====================

function readConfig() {
  const raw = typeof $argument !== "undefined" ? $argument : "";
  const args = parseScriptArguments(raw);

  return {
    capture: toBool(args.capture, true),
    notify: toBool(args.notify, true),
    debug: toBool(args.debug, false),
    // 邀请人 tomatoUserId：默认空 = 不绑定任何人，登录包发 null
    inviter: clean(args.inviter),
    waterTimes: clampInt(args.waterTimes, 1, 20, 5),
    maxRuntime: clampInt(args.maxRuntime, 60, 280, 240),
    manualAccounts: parseManualAccounts(args.accounts),
    accounts: [],
  };
}

function parseScriptArguments(value) {
  const result = {
    capture: "",
    notify: "",
    debug: "",
    inviter: "",
    waterTimes: "",
    maxRuntime: "",
    accounts: "",
  };
  const keys = ["capture", "notify", "debug", "inviter", "waterTimes", "maxRuntime", "accounts"];

  if (value === null || value === undefined || value === "") return result;

  // 新版 Script 语法（Loon 3.5.1 / build 983+）：插件对象参数，
  // script("x.js", {${capture}, ${notify}}) 传进来的是 Object，值保留 String/Number/Boolean
  if (typeof value === "object" && !Array.isArray(value)) {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const item = value[key];
        result[key] = item === null || item === undefined ? "" : String(item);
      }
    }
    return result;
  }

  // 旧版插件数组参数：argument=[{capture},{notify},{debug}]
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (index < keys.length) result[keys[index]] = clean(item);
    });
    return result;
  }

  let text = clean(value);
  if (!text) return result;

  // 也可能是被序列化成 JSON 的对象/数组字符串
  if (text.charAt(0) === "{" || text.charAt(0) === "[") {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") return parseScriptArguments(parsed);
    } catch (_) {}
  }

  if (text.indexOf("=") > -1) {
    // key=value,key=value 形式（旧版 argument="capture=true,notify=true"）
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

function clampInt(value, min, max, fallback) {
  const number = Number.parseInt(clean(value), 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

// ==================== 基础工具 ====================

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

function randomSleep(range) {
  return sleep(randomBetween(range[0], range[1]));
}

function budgetLeftMs() {
  if (!DEADLINE) return Number.MAX_SAFE_INTEGER;
  return DEADLINE - Date.now();
}

function budgetLow(reserveMs) {
  return budgetLeftMs() < reserveMs;
}

/** 受预算约束的等待：剩余时间不够就少睡，绝不拖过 Loon 的硬超时。 */
async function pacedSleep(range, reserveMs) {
  const want = randomBetween(range[0], range[1]);
  const allowed = (budgetLeftMs() - (reserveMs || 5000)) / 1000;
  if (allowed <= 0.5) return false;
  await sleep(Math.min(want, allowed));
  return true;
}

// ==================== 脱敏 ====================

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
  // 不用 lookbehind，兼容较老的 JavaScriptCore
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

// ==================== 账号存储 ====================

function safeStoreRead(key) {
  try {
    return $persistentStore.read(key) || "";
  } catch (_) {
    return "";
  }
}

function parseAccountString(rawValue) {
  const parts = clean(rawValue).split("#").map((item) => item.trim());
  if (parts.length < 2 || !parts[0] || !parts[1]) return null;
  const openId = parts[1];
  if (openId.charAt(0) !== "o") return null;
  return {
    wid: parts[0],
    openId,
    phone: /^\d{6,15}$/.test(parts[2] || "") ? parts[2] : "",
  };
}

function accountString(account) {
  return account.phone
    ? `${account.wid}#${account.openId}#${account.phone}`
    : `${account.wid}#${account.openId}`;
}

function loadAccounts() {
  const raw = safeStoreRead(ACCOUNT_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => parseAccountString(item)).filter(Boolean);
    }
  } catch (_) {}

  const single = parseAccountString(raw);
  return single ? [single] : [];
}

function saveAccountList(accounts) {
  const list = accounts.filter(Boolean);
  try {
    const saved = Boolean(
      $persistentStore.write(JSON.stringify(list.map(accountString)), ACCOUNT_KEY)
    );
    if (saved) CONFIG.accounts = list;
    return saved;
  } catch (_) {
    return false;
  }
}

/** 手动账号：wid@openId@手机号，多个用 & 分隔（与青龙版 TYQH 格式一致） */
function parseManualAccounts(rawValue) {
  const text = clean(rawValue);
  if (!text) return [];

  const list = [];
  for (const chunk of text.split("&")) {
    const parts = chunk.split("@").map((item) => item.trim());
    const wid = parts[0] || "";
    if (!wid) continue;
    let openId = "";
    let phone = "";
    for (const part of parts.slice(1)) {
      if (!part) continue;
      if (/^\d{6,15}$/.test(part)) phone = part;
      else if (!openId) openId = part;
    }
    list.push({ wid, openId, phone });
  }
  return list;
}

function mergeAccounts() {
  const stored = loadAccounts();
  const merged = stored.slice();
  for (const account of CONFIG.manualAccounts) {
    const hit = merged.find((item) => item.wid === account.wid);
    if (hit) {
      if (!hit.openId && account.openId) hit.openId = account.openId;
      if (!hit.phone && account.phone) hit.phone = account.phone;
    } else {
      merged.push(account);
    }
  }
  return merged.filter((item) => item && item.wid);
}

// ==================== 抓包模式 ====================

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
  if (!wid || !openId || openId.charAt(0) !== "o") return null;
  return { wid, openId, phone: "" };
}

function handleCapture() {
  if (!CONFIG.capture) {
    debugLog("未开启自动获取账号，跳过");
    return;
  }

  const account = extractAccount($request);
  if (!account) {
    debugLog("请求中没有 wid/openId，跳过");
    return;
  }

  const current = CONFIG.accounts.length ? CONFIG.accounts : loadAccounts();
  const exists = current.find((item) => item.wid === account.wid);
  if (exists) {
    debugLog(`账号已保存：wid=${maskId(account.wid)}`);
    return;
  }

  const next = current.concat([account]);
  const saved = saveAccountList(next);
  const total = next.length;
  const message =
    `已保存账号（wid ${maskId(account.wid)}）\n` +
    `当前共 ${total} 个账号，每天定时自动执行`;

  console.log(`[${SCRIPT_NAME}] ${redact(message)}`);
  if (CONFIG.notify && saved) {
    try {
      $notification.post(SCRIPT_NAME, "账号获取成功", message);
    } catch (_) {}
  }
}

// ==================== HTTP ====================

/** Loon 在 binary-mode 或非 UTF-8 响应时会给 Uint8Array，这里统一转成字符串 */
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

function isNeedOpenCard(message) {
  return String(message || "").indexOf("开卡") > -1;
}

function apiError(message, result) {
  const error = new Error(message);
  error.payload = result;
  return error;
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

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
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

      debugLog(`${method} ${path}（第 ${attempt + 1} 次）`);
      const response = await loonHttp(method, request);

      if (response.status === 429 || response.status === 503) {
        const retryAfter = Number.parseFloat(getHeader(response.headers, "Retry-After") || "0");
        const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : baseSleep * (attempt + 1);
        if (attempt < retries) {
          await sleep(Math.max(wait, 2));
          continue;
        }
      }

      let result;
      try {
        result = JSON.parse(response.body);
      } catch (_) {
        throw apiError(
          `非 JSON 响应（HTTP ${response.status}）：${brief(response.body, 120)}`,
          null
        );
      }

      if (response.status >= 400) {
        throw apiError(result && (result.msg || result.message) || `HTTP ${response.status}`, result);
      }

      if (result && (Number(result.code) === 200 || result.success === true)) {
        return result;
      }

      const message = String((result && (result.msg || result.message)) || "接口返回异常");

      // 频控：按青龙版节奏指数退避，15–25s × (次数+1)
      if (attempt < retries && isRateLimited(message)) {
        const low = Math.max(baseSleep, RATE_LIMIT_DELAY[0]);
        const high = Math.max(low, RATE_LIMIT_DELAY[1]);
        const wait = randomBetween(low, high) * (attempt + 1);
        console.log(`[${SCRIPT_NAME}] 触发频控，${wait.toFixed(1)}s 后重试（${attempt + 1}/${retries}）`);
        const allowed = (budgetLeftMs() - 15000) / 1000;
        if (allowed <= 1) {
          // 预算不够等退避窗口，直接放弃并如实上报，避免把"没时间"说成"接口失败"
          throw apiError("时间预算不足，已放弃重试", result);
        }
        await sleep(Math.min(wait, allowed));
        continue;
      }

      throw apiError(message, result);
    } catch (error) {
      lastError = error;
      const message = String((error && error.message) || error);
      const retryable = /timeout|timed out|network|连接|网络|HTTP 5\d\d|非 JSON/i.test(message);
      if (attempt < retries && retryable && !isNeedOpenCard(message)) {
        await sleep(baseSleep * (attempt + 1));
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error("请求重试后仍未成功");
}

// ==================== 加密 ====================

function globalObject() {
  try {
    return Function("return this")();
  } catch (_) {
    return globalThis;
  }
}

function sanitizeLibrarySource(source) {
  let text = String(source || "").replace(/^\uFEFF/, "");
  // Loon 的 JSC 偶尔把开头的 /*! ... */ 误解析成代码，先剥掉前导注释
  for (;;) {
    const before = text;
    text = text.replace(/^\s*\/\*[\s\S]*?\*\//, "");
    text = text.replace(/^\s*\/\/[^\r\n]*(?:\r?\n|$)/, "");
    if (text === before) break;
  }
  return text.trim();
}

async function loadForge() {
  if (FORGE) return FORGE;

  const root = globalObject();
  if (root.forge && root.forge.cipher && root.forge.pki) {
    FORGE = root.forge;
    return FORGE;
  }

  if (typeof root.window === "undefined") root.window = root;
  if (typeof root.self === "undefined") root.self = root;
  if (typeof root.navigator === "undefined") root.navigator = { userAgent: "Loon JavaScriptCore" };

  let lastError = null;
  for (const url of FORGE_URLS) {
    try {
      debugLog(`加载加密库：${url}`);
      const response = await loonHttp("GET", { url, timeout: REQUEST_TIMEOUT_MS });
      if (response.status < 200 || response.status >= 300) throw new Error(`HTTP ${response.status}`);
      if (!response.body || response.body.length < 100000) throw new Error("加密库内容不完整");

      const source = sanitizeLibrarySource(response.body);
      if (!source || source.charAt(0) === "*") throw new Error("加密库源码开头异常");

      hideIncompatibleCrypto(root);
      (0, eval)(`${source}\n//# sourceURL=node-forge-1.3.1.min.js`);
      if (!root.forge || !root.forge.cipher || !root.forge.pki) throw new Error("加密库初始化失败");

      FORGE = root.forge;
      seedRandom();
      debugLog("加密库加载成功");
      return FORGE;
    } catch (error) {
      lastError = error;
      debugLog(`加密库加载失败：${(error && error.message) || error}`);
    }
  }

  throw new Error(`无法加载加密库：${(lastError && lastError.message) || "未知错误"}`);
}

/**
 * forge 会优先使用 self.crypto.randomBytes。某些环境（含 node 的 webcrypto）
 * 只提供 getRandomValues，forge 探测到 crypto 却在 randomBytes 处抛错。
 * 这类环境隐藏它，让 forge 退回 Math.random，再由 seedRandom() 补熵。
 */
function hideIncompatibleCrypto(root) {
  try {
    const source = root.crypto;
    if (source && typeof source.randomBytes !== "function") {
      Object.defineProperty(root, "crypto", { value: undefined, configurable: true, writable: true });
      debugLog("已隐藏不兼容的 crypto 实现");
    }
  } catch (error) {
    debugLog(`crypto 兼容处理失败：${(error && error.message) || error}`);
  }
}

function seedRandom() {  if (!FORGE || !FORGE.random) return;
  try {
    FORGE.random.collect([Date.now(), Math.random(), Math.random()].join(":"));
    FORGE.random.collectInt(Date.now() >>> 0, 32);
  } catch (_) {}
}

function getPublicKey() {
  if (RSA_PUBLIC_KEY) return RSA_PUBLIC_KEY;
  if (!FORGE) throw new Error("加密库尚未初始化");
  const lines = PUBLIC_KEY.match(/.{1,64}/g) || [];
  const pem = `-----BEGIN PUBLIC KEY-----\n${lines.join("\n")}\n-----END PUBLIC KEY-----`;
  RSA_PUBLIC_KEY = FORGE.pki.publicKeyFromPem(pem);
  return RSA_PUBLIC_KEY;
}

/** 与青龙版 encrypt_request_body 等价：AES-256-GCM + RSA-OAEP(SHA256) 包裹密钥 */
function encryptPayload(payload) {
  if (!FORGE) throw new Error("加密库尚未初始化");
  seedRandom();

  const plaintext = JSON.stringify(payload);
  const aesKey = FORGE.random.getBytesSync(32);
  const iv = FORGE.random.getBytesSync(12);

  const cipher = FORGE.cipher.createCipher("AES-GCM", aesKey);
  cipher.start({ iv, tagLength: 128 });
  cipher.update(FORGE.util.createBuffer(plaintext, "utf8"));
  if (!cipher.finish()) throw new Error("AES-GCM 加密失败");

  // Python 的 AESGCM.encrypt 输出为 ciphertext || 16 字节 tag
  const encryptedData = cipher.output.getBytes() + cipher.mode.tag.getBytes();
  const encryptedKey = getPublicKey().encrypt(aesKey, "RSA-OAEP", {
    md: FORGE.md.sha256.create(),
    mgf1: { md: FORGE.md.sha256.create() },
  });

  return {
    data: FORGE.util.encode64(encryptedData),
    key: FORGE.util.encode64(encryptedKey),
    iv: FORGE.util.encode64(iv),
  };
}

// ==================== 接口客户端 ====================

class TomatoClient {
  constructor(account) {
    this.account = account;
    this.wid = account.wid;
    this.openId = account.openId || "";
    this.phone = account.phone || "";
    this.token = "";
    this.tomatoUserId = "";
    this.nickName = "";

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
    const payload = { wid: String(this.wid), queryCardStatus: true };
    if (this.openId) payload.openId = this.openId;
    if (this.phone) {
      payload.wm_phone = this.phone;
      payload.mobile = this.phone;
    }
    // 青龙版默认把每个号绑到作者邀请人 11422，这里默认不绑；需要时在插件参数 inviter 填
    payload.shareTomatoUserId = CONFIG.inviter || null;

    const result = await this.call("POST", "/api/web/open/tomato/login", payload, {
      retries: 2,
      baseSleep: 1.5,
    });

    const data = (result && result.data) || {};
    if (!data.token) throw new Error("登录响应中没有 token");

    this.token = data.token;
    this.tomatoUserId = data.tomatoUserId || "";
    this.nickName = data.nickName || "";
    registerSensitive(data.token, data.wid, data.openId, data.mobile, data.tomatoUserId);
    return data;
  }

  async home() {
    const result = await this.call("GET", "/api/web/member/tomato/home", null, {
      retries: 2,
      baseSleep: 1.2,
    });
    return (result && result.data) || {};
  }

  async cardStatus() {
    try {
      const result = await this.call("GET", "/api/web/member/tomato/cardStatus", null, {
        retries: 1,
        baseSleep: 1,
      });
      const data = result && result.data;
      if (data && typeof data === "object") return String(data.cardStatus || data.status || "");
      if (data !== undefined && data !== null) return String(data);
    } catch (error) {
      debugLog(`开卡状态查询失败：${(error && error.message) || error}`);
    }
    return "";
  }

  async tasks() {
    const result = await this.call("GET", "/api/web/member/tomato/tasks", null, {
      retries: 2,
      baseSleep: 1.2,
    });
    let rows = result && result.data;
    if (rows && !Array.isArray(rows) && typeof rows === "object") {
      rows = rows.list || rows.rows || [];
    }
    return Array.isArray(rows) ? rows : [];
  }

  async pageVisit(pagePath) {
    return this.call(
      "POST",
      "/api/web/member/tomato/page-visit",
      { pagePath: String(pagePath).slice(0, 500) },
      { retries: 1, baseSleep: 1.5 }
    );
  }

  async createShareQrcode() {
    if (!this.tomatoUserId) return false;
    await this.call(
      "POST",
      "/api/web/member/tomato/miniprogram/qrcode/create",
      { page: "packages/wm-cloud-qiehuang/home/index", scene: String(this.tomatoUserId) },
      { retries: 1, baseSleep: 1.2 }
    );
    return true;
  }

  async completeTask(task) {
    const taskType = String((task && task.taskType) || "");
    const payload = {
      taskType,
      browseTarget: (task && task.browseTarget) || "",
    };
    return this.call("POST", "/api/web/member/tomato/tasks/complete", payload, {
      retries: 3,
      baseSleep: 2.5,
    });
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
      const rows = Array.isArray(result && result.rows) ? result.rows : [];
      list.push.apply(list, rows);

      const total = Number((result && result.total) || 0);
      if (rows.length === 0 || (total > 0 && list.length >= total) || rows.length < size) break;
      if (budgetLow(30000)) {
        debugLog("时间预算不足，提前结束好友列表翻页");
        break;
      }
    }
    return list;
  }

  async friendHome(friendUserId) {
    const result = await this.call(
      "GET",
      `/api/web/member/tomato/friends/${encodeURIComponent(friendUserId)}/home`,
      null,
      { retries: 1, baseSleep: 1.0 }
    );
    return (result && result.data) || {};
  }

  async steal(friendUserId) {
    return this.call(
      "POST",
      "/api/web/member/tomato/friends/steal",
      { friendTomatoUserId: friendUserId },
      { retries: 2, baseSleep: 1.5 }
    );
  }

  /** 浇水：青龙版发加密 {syncHomeInfo:true}；失败则回退官方前端的空 POST */
  async useEnergy() {
    try {
      return await this.call(
        "POST",
        "/api/web/member/tomato/energy/use",
        { syncHomeInfo: true },
        { retries: 3, baseSleep: 2.5 }
      );
    } catch (error) {
      const message = String((error && error.message) || error);
      // 频控/未开卡/预算不足都不是"请求格式不对"，回退空请求没有意义
      if (isRateLimited(message) || isNeedOpenCard(message) || message.indexOf("时间预算不足") > -1) {
        throw error;
      }
      debugLog(`浇水加密请求失败（${message}），回退空 POST`);
      return this.call("POST", "/api/web/member/tomato/energy/use", null, {
        retries: 1,
        baseSleep: 2,
        encrypted: false,
      });
    }
  }
}

// ==================== 业务流程 ====================

function logStep(logs, step, message) {
  const line = `${step}: ${redact(message)}`;
  logs.push(line);
  console.log(`[${SCRIPT_NAME}] ${line}`);
}

function homeLine(home, prefix) {
  if (!home || typeof home !== "object") return `${prefix || "当前状态"}：无数据`;
  const parts = [`能量☀️${home.energyBalance === undefined ? "?" : home.energyBalance}`];
  parts.push(`番茄🍅${home.tomatoBalance === undefined ? "?" : home.tomatoBalance}`);
  if (home.stageName) parts.push(`阶段=${home.stageName}`);
  if (home.currentExp !== undefined && home.stageRequiredExp !== undefined) {
    parts.push(`经验=${home.currentExp}/${home.stageRequiredExp}`);
  }
  if (home.cardStatus !== undefined && home.cardStatus !== null && home.cardStatus !== "") {
    parts.push(`开卡=${home.cardStatus}`);
  }
  return `${prefix || "当前状态"}：${parts.join(" ")}`;
}

async function ensureCardOpened(client, loginData, logs) {
  let status = String((loginData && loginData.cardStatus) || "");
  if (status !== "0" && status !== "1") status = await client.cardStatus();

  if (status === "1") {
    logStep(logs, "开卡", "活动卡已开通 ✅");
    return true;
  }
  if (status === "0") {
    logStep(logs, "开卡", "登录已请求自动开卡，但状态仍为未开通 ⚠️");
    return false;
  }
  logStep(logs, "开卡", `状态未知（${status || "空"}），继续尝试 ⚠️`);
  return true;
}

function taskStepName(taskType) {
  const type = String(taskType || "").toUpperCase();
  if (type === "SIGN") return "签到";
  if (type === "BROWSE") return "浏览任务";
  if (type === "SHARE") return "分享任务";
  return "";
}

async function runTasks(client, cardOpened, logs) {
  let tasks;
  try {
    tasks = await client.tasks();
  } catch (error) {
    const message = `获取任务列表失败：${(error && error.message) || error}`;
    logStep(logs, "签到", message);
    logStep(logs, "浏览任务", message);
    return { completed: 0, skipped: 0, todo: 0 };
  }

  if (!tasks.length) {
    logStep(logs, "签到", "任务列表为空 ⚠️");
    logStep(logs, "浏览任务", "任务列表为空 ⚠️");
    return { completed: 0, skipped: 0, todo: 0 };
  }

  const done = { "签到": [], "浏览任务": [], "分享任务": [] };
  const todo = [];
  const others = [];

  for (const task of tasks) {
    const type = String((task && task.taskType) || "").toUpperCase();
    const name = (task && (task.taskName || task.taskCode)) || type || "未知任务";
    const isDone = String((task && task.completed) || "0") === "1";

    if (type === "FRIEND_STEAL_ENERGY") continue;

    const step = taskStepName(type);
    if (step) {
      if (isDone) done[step].push(name);
      else todo.push(task);
    } else {
      others.push(task);
    }
  }

  for (const step of ["签到", "浏览任务", "分享任务"]) {
    if (done[step].length) logStep(logs, step, `今日已完成 ✅（${done[step].join("、")}）`);
  }

  if (!cardOpened) {
    for (const task of todo.concat(others)) {
      const step = taskStepName(task && task.taskType) || "信息";
      const name = (task && (task.taskName || task.taskCode)) || "任务";
      logStep(logs, step, `${name} 跳过：账号未开卡 ⚠️`);
    }
    return { completed: 0, skipped: todo.length + others.length, todo: 0 };
  }

  let completed = 0;
  let failed = 0;

  for (const task of todo) {
    const type = String((task && task.taskType) || "").toUpperCase();
    const step = taskStepName(type);
    const name = (task && (task.taskName || task.taskCode)) || type;
    if (!step) continue;

    try {
      // 浏览任务先上报页面访问，与官方前端一致
      if (type === "BROWSE" && task.browseTarget) {
        try {
          await client.pageVisit(task.browseTarget);
        } catch (error) {
          debugLog(`page-visit 失败（忽略）：${(error && error.message) || error}`);
        }
        await pacedSleep(ACTION_DELAY, 20000);
      }

      // 分享任务先建小程序码，避免服务端判无效
      if (type === "SHARE") {
        try {
          await client.createShareQrcode();
        } catch (error) {
          debugLog(`分享二维码创建失败（忽略）：${(error && error.message) || error}`);
        }
      }

      const result = await client.completeTask(task);
      const data = (result && result.data) || {};
      const reward =
        data.rewardText ||
        (data.rewardEnergy !== undefined ? `+${data.rewardEnergy} 能量` : "已领取");
      logStep(logs, step, `${name} 完成成功 ✅ 奖励=${reward}`);
      completed += 1;
    } catch (error) {
      const message = String((error && error.message) || error);
      if (isNeedOpenCard(message)) {
        logStep(logs, step, `${name} 失败：请先开卡后再操作 ⚠️`);
      } else {
        logStep(logs, step, `${name} 失败：${brief(message, 80)} ❌`);
      }
      failed += 1;
    }

    if (budgetLow(20000)) {
      logStep(logs, "信息", "时间预算不足，停止剩余任务 ⚠️");
      break;
    }
    await pacedSleep(ACTION_DELAY, 15000);
  }

  for (const task of others) {
    const type = String((task && task.taskType) || "").toUpperCase();
    const name = (task && (task.taskName || task.taskCode)) || type;
    logStep(logs, "信息", `暂不自动处理类型 ${type}：${name}`);
  }

  return { completed, skipped: others.length, failed, todo: todo.length };
}

async function collectFriendEnergy(client, logs) {
  const stat = { checked: 0, collected: 0, energy: 0, failed: 0 };

  let friends;
  try {
    friends = await client.friends(20);
  } catch (error) {
    logStep(logs, "信息", `好友列表获取失败：${brief((error && error.message) || error, 80)} ❌`);
    return stat;
  }

  // 先用 friendStatus 预筛（V5 的做法，少一个量级的请求）；
  // 字段缺失时不过滤，避免因格式变化漏收。
  const candidates = friends.filter((friend) => {
    if (!friend || !friend.friendTomatoUserId) return false;
    const status = friend.friendStatus;
    if (status === undefined || status === null || status === "") return true;
    return String(status) === "0";
  });

  debugLog(`好友 ${friends.length} 人，候选 ${candidates.length} 人`);

  for (const friend of candidates) {
    const friendId = String(friend.friendTomatoUserId);
    registerSensitive(friendId);
    stat.checked += 1;

    try {
      const home = await client.friendHome(friendId);
      const amount = Number((home && home.stealAmount) || 0);
      if (String((home && home.canSteal) || "") !== "1" || amount <= 0) continue;

      stat.collected += 1;
      stat.energy += amount;
      try {
        const result = await client.steal(friendId);
        const gained = result && result.data;
        if (gained && typeof gained === "object") {
          const actual = Number(gained.stealAmount || gained.energyAmount || 0);
          if (actual > 0) stat.energy += actual - amount;
        }
      } catch (error) {
        stat.collected -= 1;
        stat.energy -= amount;
        stat.failed += 1;
        debugLog(`好友收取失败：${brief((error && error.message) || error, 60)}`);
      }
    } catch (error) {
      stat.failed += 1;
      debugLog(`好友主页失败：${brief((error && error.message) || error, 60)}`);
    }

    if (budgetLow(20000)) {
      debugLog("时间预算不足，停止好友能量收集");
      break;
    }
    await pacedSleep(ACTION_DELAY, 15000);
  }

  const summary =
    stat.collected > 0
      ? `好友能量：检查 ${stat.checked} 人，收取 ${stat.collected} 人，共 ${stat.energy} 能量` +
        (stat.failed ? `，失败 ${stat.failed} 人` : "")
      : stat.failed > 0
        ? `好友能量：检查 ${stat.checked} 人，收取失败 ${stat.failed} 人`
        : `好友能量：检查 ${stat.checked} 人，暂无可收能量`;
  logStep(logs, "信息", summary);
  return stat;
}

async function waterEnergy(client, home, cardOpened, logs) {
  const times = CONFIG.waterTimes;
  if (!cardOpened) {
    logStep(logs, "浇水", "账号未开卡，跳过浇水 ⚠️");
    return home;
  }

  const startEnergy = Number((home && home.energyBalance) || 0);
  if (startEnergy <= 0) {
    logStep(logs, "浇水", "当前能量为 0，跳过 ⚠️");
    return home;
  }

  let success = 0;
  let last = home;
  let lastMessage = "";

  for (let i = 0; i < times; i += 1) {
    try {
      const result = await client.useEnergy();
      const data = (result && result.data) || {};
      if (data && typeof data === "object" && Object.keys(data).length) last = data;
      success += 1;
      debugLog(
        `浇水#${success} 能量=${last.energyBalance} 经验=${last.currentExp}/${last.stageRequiredExp}`
      );

      const left = Number((data && data.energyBalance) || 0);
      if (left <= 0) break;
    } catch (error) {
      lastMessage = String((error && error.message) || error);
      if (success === 0) {
        logStep(logs, "浇水", `浇水失败：${brief(lastMessage, 80)} ❌`);
      } else {
        logStep(logs, "浇水", `成功 ${success} 次后停止：${brief(lastMessage, 60)} ⚠️`);
      }
      return last;
    }

    if (budgetLow(15000)) {
      debugLog("时间预算不足，停止浇水");
      break;
    }
    await pacedSleep(ACTION_DELAY, 10000);
  }

  if (success > 0) {
    logStep(
      logs,
      "浇水",
      `成功 ${success} 次 ✅ 能量☀️${last.energyBalance === undefined ? "?" : last.energyBalance} ` +
        `番茄🍅${last.tomatoBalance === undefined ? "?" : last.tomatoBalance} ` +
        `经验=${last.currentExp === undefined ? "?" : last.currentExp}/${
          last.stageRequiredExp === undefined ? "?" : last.stageRequiredExp
        } 阶段=${last.stageName || "?"}`
    );
  }
  return last;
}

async function processUser(account, index, total) {
  const wid = String(account.wid || "");
  const openId = String(account.openId || "");
  const phone = String(account.phone || "");
  registerSensitive(wid, openId, phone);

  const logs = [
    `账号 ${index}/${total}：wid ${maskId(wid)} · openId ${shortOpenId(openId)}` +
      (phone ? ` · 手机 ${maskId(phone)}` : ""),
  ];
  const client = new TomatoClient(account);

  // 1. 登录
  let loginData;
  try {
    loginData = await client.login();
  } catch (error) {
    logStep(logs, "登录", `失败：${brief((error && error.message) || error, 90)} ❌`);
    return logs;
  }

  logStep(
    logs,
    "登录",
    `成功 ✅ ${
      loginData.nickName || "未设置昵称"
    } 能量=${loginData.energyBalance} 番茄=${loginData.tomatoBalance} 阶段=${
      loginData.stageName || "?"
    } 开卡=${loginData.cardStatus}`
  );
  await pacedSleep(ACTION_DELAY, 30000);

  // 2. 开卡状态
  let cardOpened = await ensureCardOpened(client, loginData, logs);

  // 3. 主页
  let home = {};
  try {
    home = await client.home();
    logStep(logs, "主页", homeLine(home, "同步成功"));
  } catch (error) {
    logStep(logs, "主页", `失败：${brief((error && error.message) || error, 80)} ❌`);
  }

  if (String(home.cardStatus || "") === "1") cardOpened = true;
  else if (String(home.cardStatus || "") === "0") cardOpened = false;

  // 4. 任务（签到 / 浏览 / 分享）
  if (budgetLow(35000)) {
    logStep(logs, "信息", "时间预算不足，跳过任务阶段 ⚠️");
  } else {
    await pacedSleep(PHASE_DELAY, 30000);
    await runTasks(client, cardOpened, logs);
  }

  // 5. 好友能量
  if (budgetLow(35000)) {
    logStep(logs, "信息", "时间预算不足，跳过好友能量 ⚠️");
  } else if (!cardOpened) {
    logStep(logs, "信息", "账号活动卡未开通，跳过好友能量 ⚠️");
  } else {
    await pacedSleep(PHASE_DELAY, 30000);
    await collectFriendEnergy(client, logs);
  }

  // 6. 刷新主页后浇水
  try {
    if (!budgetLow(30000)) {
      const refreshed = await client.home();
      if (refreshed && typeof refreshed === "object") home = refreshed;
    }
  } catch (error) {
    debugLog(`浇水前主页刷新失败：${(error && error.message) || error}`);
  }

  if (budgetLow(25000)) {
    logStep(logs, "浇水", "时间预算不足，跳过浇水 ⚠️");
  } else {
    await pacedSleep(ACTION_DELAY, 20000);
    const after = await waterEnergy(client, home, cardOpened, logs);
    if (after && typeof after === "object") home = after;
    await pacedSleep(ACTION_DELAY, 20000);
  }

  // 7. 最终状态
  try {
    const finalHome = await client.home();
    if (finalHome && typeof finalHome === "object") home = finalHome;
  } catch (error) {
    debugLog(`最终主页刷新失败：${(error && error.message) || error}`);
  }
  logStep(logs, "主页", homeLine(home, "最终状态"));

  return logs;
}

// ==================== 报告与入口 ====================

function renderReport(allLogs) {
  const out = [];
  out.push("━━━━━━━━━━━━━━━━━━━━");

  for (const block of allLogs) {
    if (!block || !block.length) continue;
    out.push(block[0]);

    // 每步只保留最后一条，避免刷屏
    const byStep = {};
    for (const line of block.slice(1)) {
      const at = line.indexOf(": ");
      if (at < 0) continue;
      const step = line.slice(0, at);
      byStep[step] = line.slice(at + 2);
    }

    for (const step of STEP_ORDER) {
      if (!byStep[step]) continue;
      out.push(`${STEP_EMOJI[step] || "•"} ${step}：${byStep[step]}`);
    }

    const extra = Object.keys(byStep).filter((step) => STEP_ORDER.indexOf(step) < 0);
    for (const step of extra) out.push(`• ${step}：${byStep[step]}`);

    out.push("━━━━━━━━━━━━━━━━━━━━");
  }

  return redact(out.join("\n"));
}

function notify(title, subtitle, body) {
  if (!CONFIG.notify) return;
  try {
    $notification.post(title, subtitle, body);
  } catch (error) {
    console.log(`[${SCRIPT_NAME}] 通知失败：${(error && error.message) || error}`);
  }
}

async function main() {
  DEADLINE = Date.now() + CONFIG.maxRuntime * 1000;

  const accounts = mergeAccounts();
  if (!accounts.length) {
    const message = "没有可用账号。请先在微信打开一次茄皇活动页面自动获取，或在插件参数 accounts 里填 wid@openId@手机号";
    console.log(`[${SCRIPT_NAME}] ${message}`);
    notify(SCRIPT_NAME, "尚未获取账号", message);
    return;
  }

  for (const account of accounts) registerSensitive(account.wid, account.openId, account.phone);

  await loadForge();

  console.log(
    `[${SCRIPT_NAME}] 开始处理 ${accounts.length} 个账号，预算 ${CONFIG.maxRuntime}s，浇水 ${CONFIG.waterTimes} 次，邀请人=${CONFIG.inviter || "不绑定"}`
  );

  const allLogs = [];
  let done = 0;

  for (let i = 0; i < accounts.length; i += 1) {
    // 至少保证第一个账号跑完；后续账号才按预算决定是否跳过
    if (i > 0 && budgetLow(45000)) {
      allLogs.push([
        `账号 ${i + 1}/${accounts.length}：时间预算不足，已跳过`,
      ]);
      debugLog(`剩余 ${Math.round(budgetLeftMs() / 1000)}s，跳过剩余账号`);
      break;
    }

    let logs;
    try {
      logs = await processUser(accounts[i], i + 1, accounts.length);
    } catch (error) {
      logs = [
        `账号 ${i + 1}/${accounts.length}：wid ${maskId(accounts[i].wid)}`,
        `信息: 处理异常：${brief((error && error.message) || error, 100)} ❌`,
      ];
    }

    allLogs.push(logs);
    done += 1;

    if (i < accounts.length - 1) {
      if (budgetLow(90000)) {
        debugLog("时间预算不足以等待账号间隔，缩短等待");
        await pacedSleep([5, 10], 60000);
      } else {
        await pacedSleep(ACCOUNT_DELAY, 60000);
      }
    }
  }

  const report = renderReport(allLogs);
  console.log(`\n${report}\n`);
  notify(
    SCRIPT_NAME,
    `完成 ${done}/${accounts.length} 个账号 · 耗时 ${Math.round((Date.now() - (DEADLINE - CONFIG.maxRuntime * 1000)) / 1000)}s`,
    report
  );
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
    const message = `${captureMode ? "账号获取" : "脚本运行"}失败：${(error && error.message) || error}`;
    console.log(`[${SCRIPT_NAME}] ${redact(message)}`);
    notify(SCRIPT_NAME, captureMode ? "账号获取失败" : "运行失败", redact(message));
  } finally {
    if (captureMode) $done({});
    else $done();
  }
})();
