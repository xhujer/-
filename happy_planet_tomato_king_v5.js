'use strict';

const SCRIPT_NAME = "Happy Planet Tomato King V5";
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

const SUPPORTED_TASK_TYPES = new Set(["SIGN", "BROWSE", "SHARE"]);
const FRIEND_TASK_TYPE = "FRIEND_STEAL_ENERGY";
const FRIEND_STATUS_CLAIMABLE = "0";
const REQUEST_TIMEOUT_MS = 20000;
const REQUEST_RETRIES = 2;
const FORGE_URLS = [
  "https://cdn.jsdelivr.net/npm/node-forge@1.3.1/dist/forge.min.js",
  "https://unpkg.com/node-forge@1.3.1/dist/forge.min.js",
  "https://raw.githubusercontent.com/digitalbazaar/forge/1.3.1/dist/forge.min.js",
];

let FORGE = null;
let RSA_PUBLIC_KEY = null;

const CONFIG = readConfig();

function readConfig() {
  const args = parseScriptArguments(
    typeof $argument !== "undefined" ? $argument : ""
  );

  return {
    accounts: loadAccounts(),
    capture: parseBoolean(args[0], true),
    notify: parseBoolean(args[1], true),
    debug: parseBoolean(args[2], false),
  };
}

function parseScriptArguments(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? ""));
  }

  if (value && typeof value === "object") {
    if (
      Object.prototype.hasOwnProperty.call(value, "capture") ||
      Object.prototype.hasOwnProperty.call(value, "notify") ||
      Object.prototype.hasOwnProperty.call(value, "debug")
    ) {
      return [value.capture, value.notify, value.debug].map((item) => String(item ?? ""));
    }
    return Object.values(value).map((item) => String(item ?? ""));
  }

  const text = String(value ?? "").trim();
  if (!text) return [];

  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item ?? ""));
      }
    } catch (_) {}
  }

  return text.split(",").map((item) => item.trim());
}

function cleanArgument(value) {
  const text = String(value ?? "").trim();
  if (!text || text === "null" || text === "undefined") return "";
  return text;
}

function parseBoolean(value, fallback) {
  const text = cleanArgument(value).toLowerCase();
  if (!text) return fallback;
  if (["true", "1", "yes", "on", "开启"].includes(text)) return true;
  if (["false", "0", "no", "off", "关闭"].includes(text)) return false;
  return fallback;
}

function safeStoreRead(key) {
  try {
    return $persistentStore.read(key) || "";
  } catch (_) {
    return "";
  }
}

function debugLog(message) {
  if (CONFIG.debug) console.log(`[${SCRIPT_NAME}] ${message}`);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

function randomSleep(minimumSeconds, maximumSeconds) {
  return sleep(Math.round(randomBetween(minimumSeconds, maximumSeconds) * 1000));
}

function shortOpenId(openId) {
  const text = String(openId || "");
  return text.length > 12
    ? `${text.slice(0, 6)}...${text.slice(-4)}`
    : text;
}

function parseSingleAccount(rawValue) {
  const text = String(rawValue || "").trim();
  if (!text) return { account: null, error: "未读取到已保存账号" };

  const parts = text.split("#").map((item) => item.trim());
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { account: null, error: "已保存账号格式错误，应为 wid#openId" };
  }

  const wid = parts[0];
  const openId = parts[1];
  if (!openId.startsWith("o")) {
    return { account: null, error: "已保存的 openId 格式异常" };
  }

  return { account: { wid, openId }, error: "" };
}

function accountString(account) {
  return `${account.wid}#${account.openId}`;
}

function accountsEqual(a, b) {
  return Boolean(a && b && a.wid === b.wid && a.openId === b.openId);
}

// 读取所有已保存账号，兼容旧版单账号字符串（"wid#openId"）与新版数组格式。
function loadAccounts() {
  const raw = safeStoreRead(ACCOUNT_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter(Boolean)
        .map((item) => parseSingleAccount(typeof item === "string" ? item : ""))
        .filter((r) => r.account)
        .map((r) => r.account);
    }
  } catch (_) {}

  const single = parseSingleAccount(raw);
  return single.account ? [single.account] : [];
}

function saveAccountList(accounts) {
  const list = accounts.filter(Boolean);
  const value = JSON.stringify(list.map(accountString));
  try {
    const saved = Boolean($persistentStore.write(value, ACCOUNT_KEY));
    if (saved) CONFIG.accounts = list;
    return saved;
  } catch (_) {
    return false;
  }
}

function getGlobalObject() {
  try {
    return Function("return this")();
  } catch (_) {
    return globalThis;
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
  for (let index = 0; index < 3; index += 1) {
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

function extractAccountFromRequest(request) {
  const headers = request && request.headers ? request.headers : {};
  const sources = [
    request && request.url ? request.url : "",
    getHeader(headers, "Referer"),
    getHeader(headers, "Referrer"),
    request && request.body ? request.body : "",
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
  if (!wid || !openId || !openId.startsWith("o")) return null;
  return { wid, openId };
}

function saveCapturedAccount(account) {
  const current = CONFIG.accounts || loadAccounts();
  const existing = current.find((a) => accountsEqual(a, account));

  if (existing) {
    debugLog(`账号已存在：wid=${account.wid}，index=${current.indexOf(existing)}`);
    return { saved: true, changed: false, previous: current.length, index: current.indexOf(existing) };
  }

  const number = current.length + 1;
  const next = current.concat([account]);
  const saved = saveAccountList(next);
  return { saved, changed: saved, previous: current.length, index: current.length + 1 };
}

function handleCaptureMode() {
  if (!CONFIG.capture) {
    debugLog("自动抓取开关已关闭");
    return;
  }

  const account = extractAccountFromRequest($request);
  if (!account) {
    debugLog(`当前请求未发现 wid/openId：${$request && $request.url ? $request.url : "未知地址"}`);
    return;
  }

  const result = saveCapturedAccount(account);
  if (!result.saved) {
    const message = "识别到账号，但写入 Loon 本地存储失败";
    console.log(`[${SCRIPT_NAME}] ${message}`);
    postNotification(SCRIPT_NAME, "账号保存失败", message);
    return;
  }
  if (!result.changed) return;

  const total = CONFIG.accounts.length;
  let action = result.previous === 0 ? "账号获取成功" : "新账号已保存";
  let detail = `账号 #${result.index}/${total}\nwid：${account.wid}\nopenId：${shortOpenId(account.openId)}`;
  const message = `wid：${account.wid}\nopenId：${shortOpenId(account.openId)}\n当前共 ${total} 个账号`;
  console.log(`[${SCRIPT_NAME}] ${action}\n${message}`);
  postNotification(SCRIPT_NAME, action, detail);
}

function loonHttp(method, options) {
  return new Promise((resolve, reject) => {
    const functionName = String(method || "GET").toLowerCase();
    const requester = $httpClient[functionName];
    if (typeof requester !== "function") {
      reject(new Error(`Loon 不支持 HTTP 方法：${method}`));
      return;
    }

    requester(options, (error, response, data) => {
      if (error) {
        reject(new Error(String(error)));
        return;
      }

      resolve({
        status: Number(response?.status || response?.statusCode || 0),
        headers: response?.headers || {},
        body: typeof data === "string" ? data : String(data ?? ""),
      });
    });
  });
}

function sanitizeExternalScript(source) {
  let text = String(source || "");
  text = text.replace(/^\uFEFF/, "");

  // 部分 Loon JavaScriptCore 环境在 eval 外部脚本时，会把开头的 /*! ... */
  // 错误解析为以 * 开头的代码，因此先剥离所有开头注释。
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

  const globalObject = getGlobalObject();
  if (globalObject.forge?.cipher && globalObject.forge?.pki) {
    FORGE = globalObject.forge;
    return FORGE;
  }

  if (typeof globalObject.window === "undefined") globalObject.window = globalObject;
  if (typeof globalObject.self === "undefined") globalObject.self = globalObject;
  if (typeof globalObject.navigator === "undefined") {
    globalObject.navigator = { userAgent: "Loon JavaScriptCore" };
  }

  let lastError = null;
  for (const url of FORGE_URLS) {
    try {
      debugLog(`加载加密库：${url}`);
      const response = await loonHttp("GET", {
        url,
        timeout: REQUEST_TIMEOUT_MS,
        headers: { "User-Agent": USER_AGENT },
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP ${response.status}`);
      }
      if (!response.body || response.body.length < 100000) {
        throw new Error("加密库内容不完整");
      }

      const librarySource = sanitizeExternalScript(response.body);
      if (!librarySource || librarySource[0] === "*") {
        throw new Error("加密库源码开头异常");
      }
      (0, eval)(`${librarySource}\n//# sourceURL=node-forge-1.3.1.min.js`);
      if (!globalObject.forge?.cipher || !globalObject.forge?.pki) {
        throw new Error("加密库初始化失败");
      }

      FORGE = globalObject.forge;
      seedForgeRandom();
      debugLog("加密库加载成功");
      return FORGE;
    } catch (error) {
      lastError = error;
      debugLog(`加密库加载失败：${error.message || error}`);
    }
  }

  throw new Error(`无法加载加密库：${lastError?.message || lastError || "未知错误"}`);
}

function seedForgeRandom() {
  if (!FORGE?.random) return;
  const seed = [
    Date.now(),
    Math.random(),
    Math.random(),
    typeof $loon !== "undefined" ? JSON.stringify($loon) : "Loon",
    typeof $script !== "undefined" ? String($script.startTime || "") : "",
  ].join(":");

  try {
    FORGE.random.collect(seed);
    FORGE.random.collectInt(Date.now() >>> 0, 32);
  } catch (_) {}
}

function getRsaPublicKey() {
  if (RSA_PUBLIC_KEY) return RSA_PUBLIC_KEY;
  if (!FORGE) throw new Error("加密库尚未初始化");

  const lines = PUBLIC_KEY.match(/.{1,64}/g) || [];
  const pem =
    "-----BEGIN PUBLIC KEY-----\n" +
    lines.join("\n") +
    "\n-----END PUBLIC KEY-----";

  RSA_PUBLIC_KEY = FORGE.pki.publicKeyFromPem(pem);
  return RSA_PUBLIC_KEY;
}

function encryptPayload(payload) {
  if (!FORGE) throw new Error("加密库尚未初始化");

  seedForgeRandom();
  const plaintext = JSON.stringify(payload);
  const aesKey = FORGE.random.getBytesSync(32);
  const iv = FORGE.random.getBytesSync(12);

  const cipher = FORGE.cipher.createCipher("AES-GCM", aesKey);
  cipher.start({ iv, tagLength: 128 });
  cipher.update(FORGE.util.createBuffer(plaintext, "utf8"));

  if (!cipher.finish()) throw new Error("AES-GCM 加密失败");

  // Python AESGCM.encrypt 的结果顺序为 ciphertext || 16-byte tag。
  const encryptedData = cipher.output.getBytes() + cipher.mode.tag.getBytes();
  const encryptedKey = getRsaPublicKey().encrypt(aesKey, "RSA-OAEP", {
    md: FORGE.md.sha256.create(),
    mgf1: { md: FORGE.md.sha256.create() },
  });

  return {
    data: FORGE.util.encode64(encryptedData),
    key: FORGE.util.encode64(encryptedKey),
    iv: FORGE.util.encode64(iv),
  };
}

class TomatoClient {
  constructor(wid, openId) {
    this.wid = wid;
    this.openId = openId;
    this.tomatoUserId = null;
    this.token = "";
    this.baseHeaders = {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/json",
      Origin: BASE_URL,
      Referer: `${BASE_URL}/?wid=${encodeURIComponent(wid)}&openId=${encodeURIComponent(openId)}`,
    };
  }

  async request(method, path, payload = null, encrypted = true, retry = REQUEST_RETRIES) {
    const url = `${BASE_URL}${path}`;
    let lastError = null;

    for (let attempt = 0; attempt <= retry; attempt += 1) {
      try {
        const headers = { ...this.baseHeaders };
        if (this.token) headers.Authorization = this.token;

        const options = {
          url,
          timeout: REQUEST_TIMEOUT_MS,
          headers,
        };

        if (payload !== null && payload !== undefined) {
          const requestBody = encrypted ? encryptPayload(payload) : payload;
          options.body = JSON.stringify(requestBody);
          if (encrypted) headers["X-Request-Encrypted"] = "true";
        }

        debugLog(`${method} ${path}，第 ${attempt + 1} 次`);
        const response = await loonHttp(method, options);

        if (response.status === 429 && attempt < retry) {
          const retryAfter = Number.parseFloat(
            getHeader(response.headers, "Retry-After") || "2"
          );
          const waitSeconds = Number.isFinite(retryAfter)
            ? Math.max(1, retryAfter)
            : 2;
          await sleep((waitSeconds + attempt) * 1000);
          continue;
        }

        let result;
        try {
          result = JSON.parse(response.body);
        } catch (_) {
          throw new Error(
            `接口返回非 JSON 数据（HTTP ${response.status}）：${response.body.slice(0, 200)}`
          );
        }

        if (response.status < 200 || response.status >= 300) {
          throw new Error(
            result?.msg || result?.message || `HTTP ${response.status}`
          );
        }

        const message = String(result?.msg || result?.message || "");
        if (Number(result?.code) === 200) return result;

        if (
          attempt < retry &&
          (response.status === 429 || message.includes("频繁") || message.includes("稍后"))
        ) {
          await sleep((2.5 + attempt * 1.5) * 1000);
          continue;
        }

        throw new Error(message || `接口返回 code=${result?.code}`);
      } catch (error) {
        lastError = error;
        const message = String(error?.message || error || "未知错误");
        const retryable =
          /timeout|timed out|network|连接|网络|频繁|稍后|HTTP 429/i.test(message);

        if (attempt < retry && retryable) {
          await sleep((2 + attempt * 1.5) * 1000);
          continue;
        }
        throw error;
      }
    }

    throw new Error(lastError?.message || "请求重试后仍未成功");
  }

  async login() {
    const result = await this.request("POST", "/api/web/open/tomato/login", {
      shareTomatoUserId: null,
      openId: this.openId,
      wid: this.wid,
      queryCardStatus: true,
    });

    const data = result?.data || {};
    if (!data.token) throw new Error("登录响应中没有 token");

    this.token = data.token;
    this.tomatoUserId = data.tomatoUserId || null;
    return data;
  }

  async home() {
    const result = await this.request("GET", "/api/web/member/tomato/home");
    return result?.data || {};
  }

  async tasks() {
    const result = await this.request("GET", "/api/web/member/tomato/tasks");
    return Array.isArray(result?.data) ? result.data : [];
  }

  async completeTask(task) {
    const taskType = task?.taskType;
    const payload = { taskType };

    if (taskType !== "SHARE") {
      payload.browseTarget = task?.browseTarget || "";
    } else if (this.tomatoUserId) {
      try {
        await this.request(
          "POST",
          "/api/web/member/tomato/miniprogram/qrcode/create",
          {
            page: "packages/wm-cloud-qiehuang/home/index",
            scene: String(this.tomatoUserId),
          }
        );
      } catch (error) {
        debugLog(`分享二维码创建失败，继续完成 SHARE：${error.message || error}`);
      }
    }

    const result = await this.request(
      "POST",
      "/api/web/member/tomato/tasks/complete",
      payload
    );
    return result?.data || {};
  }

  async friends(pageSize = 20) {
    const friends = [];
    let pageNum = 1;

    while (pageNum <= 50) {
      const result = await this.request(
        "GET",
        `/api/web/member/tomato/friends?pageNum=${pageNum}&pageSize=${pageSize}`
      );
      const rows = Array.isArray(result?.rows) ? result.rows : [];
      friends.push(...rows);

      const total = Number(result?.total || 0);
      if (
        rows.length === 0 ||
        (total > 0 && friends.length >= total) ||
        rows.length < pageSize
      ) {
        break;
      }
      pageNum += 1;
    }

    return friends;
  }

  async friendHome(friendUserId) {
    const result = await this.request(
      "GET",
      `/api/web/member/tomato/friends/${encodeURIComponent(friendUserId)}/home`
    );
    return result?.data || {};
  }

  async stealFriendEnergy(friendUserId) {
    const result = await this.request(
      "POST",
      "/api/web/member/tomato/friends/steal",
      { friendTomatoUserId: friendUserId }
    );
    return result?.data;
  }

  async useEnergy() {
    // 官方前端发送空 POST，不附加加密请求体。
    const result = await this.request(
      "POST",
      "/api/web/member/tomato/energy/use",
      null,
      false
    );
    return result?.data || {};
  }
}

function homeLine(data, prefix = "当前状态") {
  return (
    `${prefix}：能量 ${Number(data?.energyBalance || 0)}，` +
    `番茄 ${Number(data?.tomatoBalance || 0)}，` +
    `${data?.stageName || "未知阶段"} ` +
    `${Number(data?.currentExp || 0)}/${Number(data?.stageRequiredExp || 0)}`
  );
}

async function processUser(wid, openId, index) {
  const logs = [`账号（wid=${wid}，openId=${shortOpenId(openId)}）`];
  const client = new TomatoClient(wid, openId);

  const loginData = await client.login();
  logs.push(`登录成功：${loginData?.nickName || "未设置昵称"}`);

  let home = await client.home();
  logs.push(homeLine(home));

  let completed = 0;
  let skipped = 0;
  let friendTask = null;
  const tasks = await client.tasks();

  for (const task of tasks) {
    const name = task?.taskName || task?.taskCode || "未知任务";
    const taskType = task?.taskType;

    if (taskType === FRIEND_TASK_TYPE) {
      friendTask = task;
      if (String(task?.completed) === "1") logs.push(`任务已完成：${name}`);
      continue;
    }

    if (String(task?.completed) === "1") {
      logs.push(`任务已完成：${name}`);
      continue;
    }

    if (!SUPPORTED_TASK_TYPES.has(taskType)) {
      skipped += 1;
      logs.push(`跳过任务：${name}（需在小程序内操作）`);
      continue;
    }

    try {
      const result = await client.completeTask(task);
      const reward = result?.rewardText || task?.rewardText || "已领取";
      logs.push(`任务完成：${name}，${reward}`);
      completed += 1;
    } catch (error) {
      logs.push(`任务失败：${name}，${error.message || error}`);
    }

    await randomSleep(2.5, 3.5);
  }

  try {
    const allFriends = await client.friends();
    const claimableFriends = allFriends.filter(
      (friend) =>
        String(friend?.friendStatus) === FRIEND_STATUS_CLAIMABLE &&
        friend?.friendTomatoUserId
    );

    let stolenCount = 0;
    let stolenEnergy = 0;
    let failedCount = 0;

    for (const friend of claimableFriends) {
      const friendUserId = friend.friendTomatoUserId;
      try {
        const friendHome = await client.friendHome(friendUserId);
        const amount = Number(friendHome?.stealAmount || 0);
        if (String(friendHome?.canSteal) !== "1" || amount <= 0) continue;

        await client.stealFriendEnergy(friendUserId);
        stolenCount += 1;
        stolenEnergy += amount;
      } catch (error) {
        failedCount += 1;
        debugLog(`好友 ${friendUserId} 收取失败：${error.message || error}`);
      }
      await randomSleep(1.5, 2.5);
    }

    if (stolenCount > 0) {
      let detail = `好友能量：成功收取 ${stolenCount} 位好友，共 ${stolenEnergy} 能量`;
      if (failedCount > 0) detail += `，失败 ${failedCount} 位`;
      logs.push(detail);
      if (friendTask && String(friendTask?.completed) !== "1") completed += 1;
    } else if (failedCount > 0) {
      logs.push(`好友能量：收取失败 ${failedCount} 位`);
    } else {
      logs.push("好友能量：暂无可收取能量");
    }
  } catch (error) {
    logs.push(`好友能量失败：${error.message || error}`);
  }

  home = await client.home();
  logs.push(homeLine(home, "任务后状态"));

  const energy = Number(home?.energyBalance || 0);
  if (energy > 0) {
    const beforeTomato = Number(home?.tomatoBalance || 0);
    try {
      const grown = await client.useEnergy();
      const afterTomato = Number(grown?.tomatoBalance || 0);
      let gained = Number(grown?.gainedTomatoAmount || 0);
      if (!gained) gained = Math.max(0, afterTomato - beforeTomato);

      logs.push(
        `使用能量：消耗 ${Number(grown?.usedEnergyAmount || energy)}，` +
          `成长到 ${grown?.stageName || "未知阶段"} ` +
          `${Number(grown?.currentExp || 0)}/${Number(grown?.stageRequiredExp || 0)}，` +
          `获得番茄 ${gained}`
      );
      home = grown;
    } catch (error) {
      logs.push(`使用能量失败：${error.message || error}`);
    }
  } else {
    logs.push("使用能量：当前没有可用能量");
  }

  logs.push(homeLine(home, "最终状态"));
  logs.push(`本次完成任务 ${completed} 个，跳过 ${skipped} 个`);
  return logs;
}

function renderReport(allLogs) {
  const lines = [SCRIPT_NAME];
  for (const logs of allLogs) {
    lines.push("━━━━━━━━━━━━━━━━━━━━");
    lines.push(...logs);
  }
  lines.push("━━━━━━━━━━━━━━━━━━━━");
  return lines.join("\n");
}

function postNotification(title, subtitle, body) {
  if (!CONFIG.notify) return;
  try {
    $notification.post(title, subtitle, body);
  } catch (error) {
    console.log(`[${SCRIPT_NAME}] 通知失败：${error.message || error}`);
  }
}

async function main() {
  const accounts = CONFIG.accounts || loadAccounts();
  if (accounts.length === 0) {
    const message = "没有可用账号。请先在微信中打开一次茄皇活动页面自动获取";
    console.log(message);
    postNotification(SCRIPT_NAME, "尚未获取账号", message);
    return;
  }

  await loadForge();

  console.log(`===== 开始处理 ${accounts.length} 个账号 =====`);
  const allLogs = [];

  for (let i = 0; i < accounts.length; i += 1) {
    const { wid, openId } = accounts[i];
    const index = i + 1;
    console.log(`\n===== 开始处理账号 ${index}/${accounts.length}（wid=${wid}）=====`);

    let logs;
    try {
      logs = await processUser(wid, openId, index);
    } catch (error) {
      logs = [
        `账号 ${index}/${accounts.length}（wid=${wid}，openId=${shortOpenId(openId)}）`,
        `处理失败：${error.message || error}`,
      ];
    }

    console.log(logs.join("\n"));
    allLogs.push(logs);

    // 多账号之间错峰，降低触发限流概率
    if (i < accounts.length - 1) await randomSleep(3, 6);
  }

  const report = renderReport(allLogs);
  console.log(`
${report}`);
  postNotification(
    SCRIPT_NAME,
    `多账号任务完成（${accounts.length} 个账号）`,
    report
  );
}

(async () => {
  const requestMode = typeof $request !== "undefined" && Boolean($request && $request.url);

  try {
    if (requestMode) {
      handleCaptureMode();
    } else {
      await main();
    }
  } catch (error) {
    const message = `${requestMode ? "账号获取" : "脚本运行"}失败：${error.message || error}`;
    console.log(`[${SCRIPT_NAME}] ${message}`);
    postNotification(SCRIPT_NAME, requestMode ? "账号获取失败" : "运行失败", message);
  } finally {
    if (requestMode) {
      $done({});
    } else {
      $done();
    }
  }
})();