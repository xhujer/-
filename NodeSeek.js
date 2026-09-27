const SCRIPT_NAME = "NodeSeek签到";
let lastHttpDiagnostic = "";
const DOMAIN = "www.nodeseek.com";

const KEY_COOKIE = "nodeseek_cookie";
const KEY_USER_AGENT = "nodeseek_user_agent";
const KEY_RANDOM = "nodeseek_random";
const KEY_MEMBER_ID = "nodeseek_verified_member_id";
const KEY_AUTH_SIGNATURE = "nodeseek_identity_signature_v2";
const KEY_CAPTURE_NOTIFY_TIME = "nodeseek_capture_notify_time";
const KEY_REFRACT_KEY = "nodeseek_refract_key";
const KEY_NOTIFY_DAY = "nodeseek_notify_day";
const KEY_BROWSER_HEADERS = "nodeseek_browser_headers";

// 抓浏览器真实请求头重放（参考 ZenmoFeiShi/Qx）
const PICK_KEYS = [
  "Accept",
  "Accept-Encoding",
  "Accept-Language",
  "Priority",
  "Connection",
  "Sec-Fetch-Dest",
  "Sec-Fetch-Mode",
  "Sec-Fetch-Site",
  "Referer"
];

const FALLBACK_REFRACT_KEY = "CHICZkKViFoZmVbIH1Y6";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 " +
  "Mobile/15E148 Safari/604.1";

function read(key) {
  return $persistentStore.read(key);
}

function write(value, key) {
  return $persistentStore.write(String(value), key);
}

function done(value = {}) {
  $done(value);
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .trim();
}

function print(text) {
  const output = cleanText(text);
  if (output) {
    console.log(output);
  }
}

function notify(title, subtitle = "", body = "", attach) {
  let content = cleanText(body);
  if (content.length > 1000) {
    content = content.slice(0, 1000) + "…";
  }

  $notification.post(
    cleanText(title) || SCRIPT_NAME,
    cleanText(subtitle),
    content,
    attach
  );
}

function getHeader(headers, name) {
  const target = String(name).toLowerCase();

  for (const key in headers || {}) {
    if (String(key).toLowerCase() === target) {
      const value = headers[key];
      return Array.isArray(value) ? value[0] : value;
    }
  }

  return null;
}

function getStatusCode(response) {
  return Number(response?.status || response?.statusCode || 0);
}

function parseJson(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return null;
  }

  try {
    let result = JSON.parse(text);
    if (typeof result === "string") {
      result = JSON.parse(result);
    }
    return result;
  } catch {
    return null;
  }
}

function isRecentIso(value, windowSeconds = 180) {
  const stamp = Date.parse(String(value || ""));
  if (!isNumber(stamp)) {
    return false;
  }

  const delta = Date.now() - stamp;
  return delta >= -30 * 1000 && delta <= windowSeconds * 1000;
}

// alpn=h2 / timeout 15s 固定值；仅 CF 重试时会临时覆盖 alpn
const REQUEST_NETWORK = { alpn: "h2", timeout: 15000 };
let networkOverride = {};

function withNetwork(options) {
  return {
    ...(options || {}),
    ...REQUEST_NETWORK,
    ...(networkOverride || {})
  };
}

function todayStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

// 已签到/失败每天只通知一次；签到成功每次都通知
function shouldNotify(force) {
  const today = todayStamp();

  if (force) {
    write(today, KEY_NOTIFY_DAY);
    return true;
  }

  if (cleanText(read(KEY_NOTIFY_DAY)) === today) {
    return false;
  }

  write(today, KEY_NOTIFY_DAY);
  return true;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeResponse(response, data) {
  const code = getStatusCode(response);
  const mitigated = cleanText(getHeader(response?.headers, "cf-mitigated"));
  const body = cleanText(String(data || "")).slice(0, 100);

  lastHttpDiagnostic =
    `HTTP ${code} · cf-mitigated=${mitigated || "无"} · 正文=${body || "(空)"}`;

  return lastHttpDiagnostic;
}

function isNumber(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value))
  );
}

function numberOrZero(value) {
  return isNumber(value) ? Number(value) : 0;
}

function failRequest(error, reject) {
  lastHttpDiagnostic = `网络错误：${cleanText(error) || "未知错误"}`;
  print(`请求失败：${cleanText(error)}`);
  reject(error);
}

function httpGet(options) {
  return new Promise((resolve, reject) => {
    $httpClient.get(withNetwork(options), (error, response, data) => {
      if (error) {
        failRequest(error, reject);
        return;
      }

      describeResponse(response, data);

      resolve({
        response: response || {},
        data: data ?? ""
      });
    });
  });
}

function httpPost(options) {
  return new Promise((resolve, reject) => {
    $httpClient.post(withNetwork(options), (error, response, data) => {
      if (error) {
        failRequest(error, reject);
        return;
      }

      describeResponse(response, data);

      resolve({
        response: response || {},
        data: data ?? ""
      });
    });
  });
}

function isCloudflarePage(response, data) {
  const code = getStatusCode(response);
  const text = String(data || "").toLowerCase();
  const marcadores = [
    "__cf$cv$params",
    "cf_chl_opt",
    "cdn-cgi/challenge-platform",
    "just a moment",
    "cf-chl-",
    "challenge-platform",
    "cloudflare ray id",
    "attention required",
    "cf-mitigated"
  ];

  if (marcadores.some((marcador) => text.includes(marcador))) {
    return true;
  }

  const mitigated = getHeader(response?.headers, "cf-mitigated");
  if (mitigated && String(mitigated).toLowerCase().includes("challenge")) {
    return true;
  }

  // 边缘层的裸 403 不算 CF 挑战，否则会误报
  return code === 429;
}

function getArg(name) {
  try {
    if (
      typeof $argument === "object" &&
      $argument !== null &&
      !Array.isArray($argument)
    ) {
      return $argument[name] ?? null;
    }

    if (typeof $argument !== "string" || !$argument.trim()) {
      return null;
    }

    const text = $argument.trim();

    try {
      const json = JSON.parse(text);
      if (json && typeof json === "object") {
        return json[name] ?? null;
      }
    } catch {}

    const params = {};

    text.split("&").forEach((part) => {
      const index = part.indexOf("=");
      if (index < 0) {
        return;
      }

      const key = part.slice(0, index).trim();
      const rawValue = part.slice(index + 1);

      try {
        params[key] = decodeURIComponent(rawValue);
      } catch {
        params[key] = rawValue;
      }
    });

    return params[name] ?? null;
  } catch {
    return null;
  }
}

function parseBoolean(value, fallback = true) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const text = String(value).trim().toLowerCase();

  if (
    ["false", "0", "off", "no", "fixed", "固定", "固定签到"].includes(text)
  ) {
    return false;
  }

  if (
    ["true", "1", "on", "yes", "random", "随机", "随机签到"].includes(text)
  ) {
    return true;
  }

  return fallback;
}

function getSignMode() {
  const argument = getArg("Random") ?? getArg("random");
  const random = parseBoolean(argument ?? read(KEY_RANDOM), true);

  write(random, KEY_RANDOM);

  return {
    random,
    name: random ? "随机签到" : "固定签到"
  };
}

function normalizeCookie(value) {
  return String(value || "")
    .replace(/\r?\n/g, "; ")
    .replace(/;+\s*/g, "; ")
    .replace(/\s*;\s*$/, "")
    .trim();
}

function getCookieFromHeaders(headers) {
  const value = getHeader(headers, "Cookie");
  if (!value) {
    return "";
  }

  return normalizeCookie(Array.isArray(value) ? value.join("; ") : value);
}

function parseCookie(cookie) {
  const map = {};

  String(cookie || "")
    .split(";")
    .forEach((part) => {
      const index = part.indexOf("=");
      if (index <= 0) {
        return;
      }

      const key = part.slice(0, index).trim().toLowerCase();
      const value = part.slice(index + 1).trim();

      if (key) {
        map[key] = value;
      }
    });

  return map;
}

function buildIdentitySignature(cookieMap) {
  if (cookieMap.session) {
    return `session=${cookieMap.session}`;
  }

  if (cookieMap.pjwt) {
    return `pjwt=${cookieMap.pjwt}`;
  }

  return "";
}

function isNodeSeekUrl(url) {
  return /^https?:\/\/(?:www\.)?nodeseek\.com\//i.test(String(url || ""));
}

function isFogUrl(url) {
  return /\/edge-cgi\/fog(?:[?#]|$)/i.test(String(url || ""));
}

function isBrowserUserAgent(userAgent) {
  const value = String(userAgent || "");

  return (
    /Mozilla\/5\.0/i.test(value) &&
    /Safari/i.test(value) &&
    !/Loon|Quantumult|Surge|Shadowrocket|Stash/i.test(value)
  );
}

function isDocumentRequest(headers) {
  const destination = cleanText(
    getHeader(headers, "Sec-Fetch-Dest")
  ).toLowerCase();

  const accept = cleanText(getHeader(headers, "Accept")).toLowerCase();

  return destination === "document" || accept.includes("text/html");
}

function canSendCaptureNotice() {
  const now = Date.now();
  const last = Number(read(KEY_CAPTURE_NOTIFY_TIME) || 0);

  if (now - last < 10000) {
    return false;
  }

  write(now, KEY_CAPTURE_NOTIFY_TIME);
  return true;
}

async function captureRequest() {
  const url = String($request?.url || "");

  if (!isNodeSeekUrl(url) || isFogUrl(url)) {
    return;
  }

  const headers = $request?.headers || {};
  const cookie = getCookieFromHeaders(headers);
  const userAgent = cleanText(getHeader(headers, "User-Agent"));
  const oldCookie = read(KEY_COOKIE) || "";
  const oldUserAgent = cleanText(read(KEY_USER_AGENT));

  if (isBrowserUserAgent(userAgent) && userAgent !== oldUserAgent) {
    write(userAgent, KEY_USER_AGENT);
  }

  if (cookie.length < 20) {
    return;
  }

  const cookieMap = parseCookie(cookie);
  const newIdentitySignature = buildIdentitySignature(cookieMap);

  if (!newIdentitySignature) {
    return;
  }

  const oldCookieMap = parseCookie(oldCookie);
  const oldIdentitySignature =
    read(KEY_AUTH_SIGNATURE) || buildIdentitySignature(oldCookieMap);

  if (cookie !== oldCookie) {
    write(cookie, KEY_COOKIE);
  }

  // 非文档请求里抓一份浏览器真实头
  if (!isDocumentRequest(headers)) {
    const picked = {};

    for (const key of PICK_KEYS) {
      const value = cleanText(getHeader(headers, key));

      if (value) {
        picked[key] = value;
      }
    }

    if (Object.keys(picked).length >= 3) {
      write(JSON.stringify(picked), KEY_BROWSER_HEADERS);
    }
  }

  write(newIdentitySignature, KEY_AUTH_SIGNATURE);

  if (
    isDocumentRequest(headers) &&
    newIdentitySignature !== oldIdentitySignature &&
    canSendCaptureNotice()
  ) {
    notify(
      "NodeSeek",
      "✅ 身份信息已更新",
      "签到 Cookie：已更新\n\n" +
        `User-Agent：${read(KEY_USER_AGENT) ? "已获取" : "未获取"}`
    );
  }
}

function getCapturedHeaders() {
  try {
    const raw = cleanText(read(KEY_BROWSER_HEADERS));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function buildCommonHeaders({ userAgent, referer, cookie = "" }) {
  const headers = {
    Accept: "*/*",
    "Accept-Encoding": "gzip, deflate",
    "Accept-Language": "zh-CN,zh-Hans;q=0.9,en;q=0.8",
    Connection: "keep-alive",
    Priority: "u=3, i",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    // 抓到的真实浏览器头优先
    ...getCapturedHeaders(),
    Referer: referer || `https://${DOMAIN}/board`,
    Origin: `https://${DOMAIN}`,
    // 缺这个头会被判 high risk action（社区实测）
    "x-csrf-challenge": "simple-token",
    "User-Agent": userAgent || DEFAULT_USER_AGENT
  };

  // Loon 解不了 br/zstd，强制 gzip, deflate
  headers["Accept-Encoding"] = "gzip, deflate";

  if (cookie) {
    headers.Cookie = cookie;
  }

  return headers;
}

function rotateLeft(value, bits) {
  return (value << bits) | (value >>> (32 - bits));
}

function toHex32(value) {
  let output = "";

  for (let shift = 28; shift >= 0; shift -= 4) {
    output += ((value >>> shift) & 0x0f).toString(16);
  }

  return output;
}

// 与官方 sw.js 的 crypto.subtle.digest("SHA-1") 等价
function sha1(value) {
  const text = unescape(encodeURIComponent(String(value)));
  const words = [];
  const byteLength = text.length;

  for (let index = 0; index < byteLength; index += 1) {
    words[index >> 2] =
      (words[index >> 2] || 0) |
      (text.charCodeAt(index) << (24 - (index % 4) * 8));
  }

  words[byteLength >> 2] =
    (words[byteLength >> 2] || 0) |
    (0x80 << (24 - (byteLength % 4) * 8));

  words[(((byteLength + 8) >> 6) + 1) * 16 - 1] = byteLength * 8;

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  for (let block = 0; block < words.length; block += 16) {
    const schedule = [];

    for (let index = 0; index < 80; index += 1) {
      if (index < 16) {
        schedule[index] = words[block + index] | 0;
      } else {
        schedule[index] = rotateLeft(
          schedule[index - 3] ^
            schedule[index - 8] ^
            schedule[index - 14] ^
            schedule[index - 16],
          1
        );
      }
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let index = 0; index < 80; index += 1) {
      let f;
      let k;

      if (index < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (index < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (index < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (rotateLeft(a, 5) + f + e + k + schedule[index]) | 0;
      e = d;
      d = c;
      c = rotateLeft(b, 30);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
  }

  return (
    toHex32(h0) +
    toHex32(h1) +
    toHex32(h2) +
    toHex32(h3) +
    toHex32(h4)
  );
}

function canonicalizeUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return String(url || "").split("#")[0];
  }
}

function makeRefractSignature(method, url, userAgent, body, key) {
  return sha1(
    [
      String(method || "GET").toUpperCase(),
      canonicalizeUrl(url),
      String(userAgent || ""),
      String(body || ""),
      String(key || "")
    ].join("\n\n")
  );
}

function getRefractKey() {
  return cleanText(read(KEY_REFRACT_KEY)) || FALLBACK_REFRACT_KEY;
}

function saveRefractKey(key) {
  if (cleanText(key)) {
    write(cleanText(key), KEY_REFRACT_KEY);
  }
}

async function signedRequest({
  method,
  url,
  userAgent,
  headers,
  body = ""
}) {
  const requestMethod = String(method || "GET").toUpperCase();
  let refractKey = getRefractKey();

  networkOverride = {};
  let lastResult = null;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    // 带 refract-version 会被边缘层裸 403，故不发送
    const requestHeaders = {
      ...(headers || {}),
      "refract-sign": makeRefractSignature(
        requestMethod,
        url,
        userAgent,
        body,
        refractKey
      ),
      "refract-key": refractKey
    };

    lastResult =
      requestMethod === "POST"
        ? await httpPost({
            url,
            headers: requestHeaders,
            body
          })
        : await httpGet({
            url,
            headers: requestHeaders
          });

    // CF 挑战时退避重试，连打只会推高风险分
    if (isCloudflarePage(lastResult.response, lastResult.data)) {
      // timeout=60 约束下只补试一次
      if (attempt >= 2) {
        return lastResult;
      }

      // DIRECT 直连会超时，只切 HTTP 版本
      networkOverride = attempt === 1 ? { alpn: "h1" } : {};

      const waitMs = 2000 + Math.floor(Math.random() * 2000) * attempt;

      print(
        `遇到 Cloudflare 挑战，切换${attempt === 1 ? "HTTP/1.1" : "HTTP/2"}，` +
          `${Math.round(waitMs / 1000)}s 后重试（第 2/2 次）`
      );

      refractKey = getRefractKey();
      await sleep(waitMs);
      continue;
    }

    const updatedKey = cleanText(
      getHeader(lastResult.response?.headers, "refract-key-update")
    );

    if (
      updatedKey &&
      updatedKey !== refractKey &&
      updatedKey.length <= 512
    ) {
      refractKey = updatedKey;

      saveRefractKey(refractKey);
      continue;
    }

    return lastResult;
  }

  return lastResult;
}

function parseSignResult(json, httpCode) {
  const payload =
    json?.data && typeof json.data === "object"
      ? {
          ...json,
          ...json.data
        }
      : json;

  const message = cleanText(payload?.message || payload?.msg);
  const gain = isNumber(payload?.gain) ? Number(payload.gain) : null;

  if (
    /今天已完成签到|今日已签到|已经签到|重复操作|重复签到|已签到/i.test(
      message
    )
  ) {
    return {
      status: "already",
      message: message || "今天已完成签到",
      gain
    };
  }

  // Cookie 失效时官方返回 USER NOT FOUND / status 404
  if (
    /USER NOT FOUND|用户不存在|未登录|请先登录|需要先登录|unauthorized|not logged/i.test(
      message
    ) ||
    Number(payload?.status) === 401 ||
    Number(payload?.status) === 404
  ) {
    return {
      status: "nologin",
      message: message || "登录态已失效",
      gain: null
    };
  }

  if (payload?.success === true || /签到成功/i.test(message)) {
    return {
      status: "success",
      message: message || "签到成功",
      gain
    };
  }

  return {
    status: "fail",
    message: message || `签到失败（HTTP ${httpCode}）`,
    gain: null
  };
}

async function signIn(cookie, userAgent, random) {
  const url =
    `https://${DOMAIN}/api/attendance` +
    `?random=${random ? "true" : "false"}`;

  // 对齐官方前端：无 body、无 Content-Type
  const body = "";
  const { response, data } = await signedRequest({
    method: "POST",
    url,
    userAgent,
    headers: {
      ...buildCommonHeaders({
        cookie,
        userAgent,
        referer: `https://${DOMAIN}/board`
      }),
      "Content-Type": "text/plain;charset=UTF-8"
    },
    body
  });

  const code = getStatusCode(response);

  if (isCloudflarePage(response, data)) {
    return {
      status: "cloudflare",
      message: `签到接口被 Cloudflare 拦截（HTTP ${code}）`,
      gain: null
    };
  }

  const json = parseJson(data);

  if (!json) {
    return {
      status: "fail",
      message:
        `签到结果解析失败（HTTP ${code}）：` +
        (cleanText(data).slice(0, 120) || "空响应"),
      gain: null
    };
  }

  return parseSignResult(json, code);
}

function parseBoardPage(json, page) {
  if (!json || typeof json !== "object") {
    throw new Error("签到排行榜返回格式无效");
  }

  const source =
    json.data && typeof json.data === "object" && !Array.isArray(json.data)
      ? json.data
      : json;

  const list = Array.isArray(source.list) ? source.list : [];

  return {
    page,
    list,
    total: isNumber(source.total) ? Number(source.total) : list.length,
    order: isNumber(source.order) ? Number(source.order) : null,
    record:
      source.record && typeof source.record === "object"
        ? source.record
        : null
  };
}

async function getBoardPage(page, userAgent, cookie) {
  const pageNumber = Math.max(1, Number(page) || 1);
  const url = `https://${DOMAIN}/api/attendance/board?page=${pageNumber}`;

  const { response, data } = await signedRequest({
    method: "GET",
    url,
    userAgent,
    headers: {
      ...buildCommonHeaders({
        userAgent,
        cookie,
        referer: `https://${DOMAIN}/board`
      }),
      "Cache-Control": "no-cache",
      Pragma: "no-cache"
    }
  });

  const code = getStatusCode(response);
  const label = "登录态签到排行榜";

  if (isCloudflarePage(response, data)) {
    throw new Error(`${label}被 Cloudflare 拦截（HTTP ${code}）`);
  }

  const json = parseJson(data);

  if (!json) {
    throw new Error(
      `${label}解析失败（HTTP ${code}）：` +
        (cleanText(data).slice(0, 100) || "空响应")
    );
  }

  return parseBoardPage(json, pageNumber);
}

function getOfficialMember(boardPage) {
  const record =
    boardPage.record &&
    typeof boardPage.record === "object"
      ? boardPage.record
      : null;

  const memberId = cleanText(record?.member_id);

  if (!/^\d+$/.test(memberId) || !isNumber(boardPage.order)) {
    return null;
  }

  return {
    memberId,
    name: cleanText(record.member_name),
    gain: isNumber(record.gain) ? Number(record.gain) : null,
    createdAt: cleanText(record.created_at),
    rank: Number(boardPage.order),
    total: boardPage.total,
    source: "order",
    page: boardPage.page,
    verified: true
  };
}

async function getOfficialBoardDataSafe(cookie, userAgent) {
  try {
    const boardPage = await getBoardPage(1, userAgent, cookie);

    const found = getOfficialMember(boardPage);

    if (!found) {
      throw new Error("排行榜未返回当前账号的 record / order（多为未登录或 Cookie 已失效）");
    }

    write(found.memberId, KEY_MEMBER_ID);

    const data = {
      ...found,
      verified: true,
      verifiedAt: Date.now()
    };

    return {
      data,
      error: ""
    };
  } catch (error) {
    const message = cleanText(error?.message || error);

    return {
      data: null,
      error: message
    };
  }
}

async function getAccountInfo(cookie, userAgent, memberId) {
  if (!/^\d+$/.test(String(memberId || ""))) {
    throw new Error("未识别到可信成员 ID");
  }

  const url =
    `https://${DOMAIN}/api/account/getInfo/${memberId}` +
    `?_=${Date.now()}`;

  const { response, data } = await signedRequest({
    method: "GET",
    url,
    userAgent,
    headers: {
      ...buildCommonHeaders({
        cookie,
        userAgent,
        referer: `https://${DOMAIN}/space/${memberId}`
      }),
      "Cache-Control": "no-cache",
      Pragma: "no-cache"
    }
  });

  const code = getStatusCode(response);

  if (isCloudflarePage(response, data)) {
    throw new Error(`用户信息被 Cloudflare 拦截（HTTP ${code}）`);
  }

  const json = parseJson(data);
  const user =
    json?.detail ||
    json?.data?.detail ||
    json?.data ||
    json?.user ||
    null;

  if (!user || typeof user !== "object") {
    throw new Error(
      cleanText(json?.message || json?.msg) ||
        `用户信息请求失败（HTTP ${code}）`
    );
  }

  return {
    name: cleanText(
      user.member_name ||
        user.username ||
        user.nickname ||
        user.name ||
        `用户${memberId}`
    ),
    coin: numberOrZero(user.coin ?? user.chicken ?? user.credit),
    rank: numberOrZero(user.rank ?? user.level),
    posts: numberOrZero(user.nPost ?? user.postCount ?? user.posts),
    comments: numberOrZero(
      user.nComment ?? user.commentCount ?? user.comments
    )
  };
}

function getResultTitle(status) {
  if (status === "success") {
    return "✅ NodeSeek 签到成功";
  }

  if (status === "already") {
    return "🎁 NodeSeek 今日已签到";
  }

  if (status === "nologin") {
    return "🔑 NodeSeek 登录态已失效";
  }

  if (status === "cloudflare") {
    return "❌ NodeSeek 签到被 Cloudflare 拦截";
  }

  return "❌ NodeSeek 签到失败";
}

function formatBoardLine(board, signResult) {
  const gain = isNumber(board?.gain)
    ? Number(board.gain)
    : isNumber(signResult?.gain)
      ? Number(signResult.gain)
      : null;

  const rank = isNumber(board?.rank) ? Number(board.rank) : null;

  if (gain !== null && rank !== null) {
    return (
      `🎖️ 今日签到获得鸡腿 ${gain} 个` +
      ` | 当前排名第 ${rank}`
    );
  }

  if (gain !== null) {
    return `🎖️ 今日签到获得鸡腿 ${gain} 个 | 当前排名暂未获取`;
  }

  if (rank !== null) {
    return `🎖️ 当前排名第 ${rank}`;
  }

  return "⚠️ 今日签到奖励和排名获取失败";
}

function formatAccountLine(account) {
  if (!account) {
    return "⚠️ 用户信息获取失败";
  }

  return (
    `👤 ${account.name}` +
    ` | 🍗 ${account.coin} 鸡腿` +
    ` | 🏅 Lv.${account.rank}` +
    ` | 📝 ${account.posts} 帖` +
    ` | 💬 ${account.comments} 评论`
  );
}

(async () => {
  try {
    if (typeof $request !== "undefined") {
      await captureRequest();
      return done({});
    }

    const cookie = read(KEY_COOKIE);

    if (!cookie) {
      const message =
        "请开启自动获取 Cookie，然后在 Safari 登录并刷新一次 NodeSeek";

      print(`❌ NodeSeek 签到失败\n\n${message}`);
      notify("❌ NodeSeek 签到失败", "未获取 Cookie", message);
      return done();
    }

    const userAgent =
      cleanText(read(KEY_USER_AGENT)) || DEFAULT_USER_AGENT;

    const signMode = getSignMode();

    let signResult;

    try {
      signResult = await signIn(
        cookie,
        userAgent,
        signMode.random
      );
    } catch (error) {
      signResult = {
        status: "fail",
        message: cleanText(error?.message || error) || "签到请求异常",
        gain: null
      };
    }

    const boardResult = await getOfficialBoardDataSafe(
      cookie,
      userAgent
    );

    let board = boardResult.data;

    // POST 被拦时以排行榜 record 为准；刚生成的 record 视为本次签到成功
    if (
      board &&
      (signResult.status === "fail" ||
        signResult.status === "cloudflare")
    ) {
      const justSigned = isRecentIso(board.createdAt);

      signResult = {
        status: justSigned ? "success" : "already",
        message: justSigned
          ? "排行榜确认刚刚签到成功"
          : "排行榜确认今天已经签到",
        gain: board.gain
      };
    }

    if (board && isNumber(board.gain)) {
      signResult.gain = Number(board.gain);
    }

    if (signResult.status === "nologin") {
      const title = getResultTitle("nologin");
      const message =
        "Cookie 里的 session 已失效（官方返回：" +
        `${signResult.message}）。请在 Safari 重新登录 NodeSeek，` +
        "登录后刷新一次首页即可自动更新 Cookie。";

      print(`签到模式：${signMode.name}\n\n${title}\n\n${message}`);

      if (shouldNotify(false)) {
        notify(title, signMode.name, message, {
          openUrl: `https://${DOMAIN}/signIn.html`
        });
      }

      return done();
    }

    if (
      !board &&
      (signResult.status === "fail" ||
        signResult.status === "cloudflare")
    ) {
      const title = getResultTitle(signResult.status);
      const extra = boardResult.error
        ? `\n\n排行榜：${boardResult.error}`
        : "";

      print(
        `签到模式：${signMode.name}\n\n` +
          `${title}\n\n` +
          `${signResult.message}${extra}` +
          `\n\n诊断：${lastHttpDiagnostic || "(无)"}`
      );

      if (shouldNotify(false)) {
        notify(
          title,
          signMode.name,
          `${signResult.message}${extra}\n\n诊断：${lastHttpDiagnostic || "(无)"}`
        );
      }

      return done();
    }

    const memberId =
      board?.memberId ||
      cleanText(read(KEY_MEMBER_ID));

    let account = null;

    try {
      account = await getAccountInfo(
        cookie,
        userAgent,
        memberId
      );
    } catch (error) {
      print(`用户信息：${cleanText(error?.message || error)}`);
    }

    const title = getResultTitle(signResult.status);
    const boardLine = formatBoardLine(board, signResult);
    const accountLine = formatAccountLine(account);

    print(
      `签到模式：${signMode.name}\n\n` +
        `${title}\n\n` +
        `${boardLine}\n\n` +
        `${accountLine}`
    );

    if (shouldNotify(signResult.status === "success")) {
      notify(
        title,
        signMode.name,
        `${boardLine}\n\n${accountLine}`
      );
    }

    return done();
  } catch (error) {
    const message = `❌ 脚本异常：${cleanText(error?.message || error)}`;

    print(message);
    notify(SCRIPT_NAME, "❌ 脚本异常", message);
    return done();
  }
})();