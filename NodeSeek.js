const SCRIPT_NAME = "NodeSeek签到1";
const DOMAIN = "www.nodeseek.com";

// 匿名排行榜无法自动知道“你是谁”，因此必须给出目标成员 ID。
const TARGET_MEMBER_ID = "44709";
const BOARD_PAGE_SIZE = 50;
const BOARD_REQUEST_INTERVAL = 160;
const DIRECT_RANK_PARAMS = ["member_id", "memberId", "uid"];

const KEY_COOKIE = "nodeseek_cookie";
const KEY_USER_AGENT = "nodeseek_user_agent";
const KEY_RANDOM = "nodeseek_random";
const KEY_MEMBER_ID = "nodeseek_verified_member_id";
const KEY_AUTH_SIGNATURE = "nodeseek_identity_signature_v2";
const KEY_CAPTURE_NOTIFY_TIME = "nodeseek_capture_notify_time";
const KEY_REFRACT_VERSION = "nodeseek_refract_version";
const KEY_REFRACT_KEY = "nodeseek_refract_key";
const KEY_LAST_GAIN = "nodeseek_last_gain";
const KEY_LAST_GAIN_DAY = "nodeseek_last_gain_day";
const KEY_DIRECT_RANK_PARAM = "nodeseek_direct_rank_param_v1";
const KEY_DIRECT_RANK_PROBE_VERSION =
  "nodeseek_direct_rank_probe_version_v1";

// 仅作首次协商兜底；脚本会自动读取 sw.js，并处理 refract-key-update。
const FALLBACK_REFRACT_VERSION = "0.3.34";
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

function notify(title, subtitle = "", body = "") {
  let content = cleanText(body);
  if (content.length > 1000) {
    content = content.slice(0, 1000) + "…";
  }

  $notification.post(
    cleanText(title) || SCRIPT_NAME,
    cleanText(subtitle),
    content
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpGet(options) {
  return new Promise((resolve, reject) => {
    $httpClient.get(options, (error, response, data) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        response: response || {},
        data: data ?? ""
      });
    });
  });
}

function httpPost(options) {
  return new Promise((resolve, reject) => {
    $httpClient.post(options, (error, response, data) => {
      if (error) {
        reject(error);
        return;
      }

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

  return (
    code === 403 ||
    code === 429 ||
    text.includes("just a moment") ||
    text.includes("cf-chl-") ||
    text.includes("challenge-platform") ||
    text.includes("cloudflare ray id") ||
    text.includes("attention required")
  );
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

function getTargetMemberId() {
  const value =
    cleanText(getArg("MemberID") ?? getArg("memberId")) ||
    TARGET_MEMBER_ID;

  if (!/^\d+$/.test(value)) {
    throw new Error("成员 ID 格式无效");
  }

  write(value, KEY_MEMBER_ID);
  return value;
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

function buildCommonHeaders({ userAgent, referer, cookie = "", accept }) {
  const headers = {
    Accept: accept || "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh-Hans;q=0.9,en;q=0.8",
    Referer: referer || `https://${DOMAIN}/board`,
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": userAgent || DEFAULT_USER_AGENT
  };

  // 匿名排行榜调用时 cookie 为空，因此不会产生 Cookie 请求头。
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

// 与 NodeSeek sw.js 中 crypto.subtle.digest("SHA-1", ...) 的结果一致。
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

function getRefractProtocol() {
  return {
    version: cleanText(read(KEY_REFRACT_VERSION)) || FALLBACK_REFRACT_VERSION,
    key: cleanText(read(KEY_REFRACT_KEY)) || FALLBACK_REFRACT_KEY
  };
}

function saveRefractProtocol(version, key) {
  if (cleanText(version)) {
    write(cleanText(version), KEY_REFRACT_VERSION);
  }

  if (cleanText(key)) {
    write(cleanText(key), KEY_REFRACT_KEY);
  }
}

async function refreshRefractProtocol(userAgent) {
  const stored = getRefractProtocol();

  try {
    const { response, data } = await httpGet({
      url: `https://${DOMAIN}/sw.js?_=${Date.now()}`,
      headers: buildCommonHeaders({
        userAgent,
        referer: `https://${DOMAIN}/`,
        accept: "application/javascript, text/javascript, */*;q=0.8"
      })
    });

    const code = getStatusCode(response);
    const text = String(data || "");

    if (code < 200 || code >= 300 || !text) {
      return stored;
    }

    const versionMatch = text.match(
      /self\.version\s*=\s*["']([^"']+)["']/
    );

    const keyMatch = text.match(
      /this\.refractKey\s*=\s*["']([^"']+)["']/
    );

    const version = cleanText(versionMatch?.[1]) || stored.version;
    const defaultKey = cleanText(keyMatch?.[1]);
    const versionChanged = version !== stored.version;
    const key = versionChanged && defaultKey ? defaultKey : stored.key;

    saveRefractProtocol(version, key);
    return { version, key };
  } catch {
    return stored;
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
  let protocol = getRefractProtocol();
  let lastResult = null;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const requestHeaders = {
      ...(headers || {}),
      "refract-sign": makeRefractSignature(
        requestMethod,
        url,
        userAgent,
        body,
        protocol.key
      ),
      "refract-version": protocol.version,
      "refract-key": protocol.key
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

    const updatedKey = cleanText(
      getHeader(lastResult.response?.headers, "refract-key-update")
    );

    if (
      updatedKey &&
      updatedKey !== protocol.key &&
      updatedKey.length <= 512
    ) {
      protocol = {
        ...protocol,
        key: updatedKey
      };

      saveRefractProtocol(protocol.version, protocol.key);
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

  const body = "{}";
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
      "Content-Type": "application/json;charset=utf-8",
      Origin: `https://${DOMAIN}`
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

function buildBoardUrl(page, queryParams = {}) {
  const pageNumber = Math.max(1, Number(page) || 1);
  const query = [
    ["page", pageNumber],
    ...Object.entries(queryParams).filter(
      ([key, value]) => cleanText(key) && value !== null && value !== undefined
    )
  ]
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join("&");

  return `https://${DOMAIN}/api/attendance/board?${query}`;
}

async function getBoardPage(
  page,
  userAgent,
  { cookie = "", queryParams = {} } = {}
) {
  const pageNumber = Math.max(1, Number(page) || 1);
  const url = buildBoardUrl(pageNumber, queryParams);

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
  const requestName = cookie ? "签到排行榜" : "匿名签到排行榜";

  if (isCloudflarePage(response, data)) {
    throw new Error(`${requestName}被 Cloudflare 拦截（HTTP ${code}）`);
  }

  const json = parseJson(data);

  if (!json) {
    throw new Error(
      `${requestName}解析失败（HTTP ${code}）：` +
        (cleanText(data).slice(0, 100) || "空响应")
    );
  }

  return parseBoardPage(json, pageNumber);
}

async function getAnonymousBoardPage(
  page,
  userAgent,
  queryParams = {}
) {
  // 此处不传 Cookie；包括直查探测在内的所有匿名排行请求均保持匿名。
  return getBoardPage(page, userAgent, { queryParams });
}

async function getAuthenticatedBoardPage(page, cookie, userAgent) {
  return getBoardPage(page, userAgent, { cookie });
}

function findMemberInList(boardPage, memberId) {
  const target = String(memberId);
  const index = boardPage.list.findIndex(
    (item) => String(item?.member_id || "") === target
  );

  if (index < 0) {
    return null;
  }

  const record = boardPage.list[index] || {};

  return {
    memberId: target,
    name: cleanText(record.member_name),
    gain: isNumber(record.gain) ? Number(record.gain) : null,
    rank: (boardPage.page - 1) * BOARD_PAGE_SIZE + index + 1,
    total: boardPage.total,
    source: "list",
    page: boardPage.page,
    pageIndex: index,
    verified: false
  };
}

function findMemberOnPage(boardPage, memberId) {
  const target = String(memberId);

  if (
    String(boardPage.record?.member_id || "") === target &&
    isNumber(boardPage.order)
  ) {
    return {
      memberId: target,
      name: cleanText(boardPage.record?.member_name),
      gain: isNumber(boardPage.record?.gain)
        ? Number(boardPage.record.gain)
        : null,
      rank: Number(boardPage.order),
      total: boardPage.total,
      source: "order",
      page: boardPage.page,
      pageIndex: null,
      verified: true
    };
  }

  return findMemberInList(boardPage, memberId);
}

function readDirectRankProbe() {
  const version = getRefractProtocol().version;

  if (cleanText(read(KEY_DIRECT_RANK_PROBE_VERSION)) !== version) {
    return "";
  }

  const value = cleanText(read(KEY_DIRECT_RANK_PARAM));

  if (value === "none" || DIRECT_RANK_PARAMS.includes(value)) {
    return value;
  }

  return "";
}

function saveDirectRankProbe(parameter) {
  write(parameter || "none", KEY_DIRECT_RANK_PARAM);
  write(getRefractProtocol().version, KEY_DIRECT_RANK_PROBE_VERSION);
}

async function probeAnonymousDirectRank(userAgent, memberId) {
  const cached = readDirectRankProbe();

  if (cached === "none") {
    return {
      candidate: null,
      shouldCacheNone: false
    };
  }

  const parameters = cached
    ? [
        cached,
        ...DIRECT_RANK_PARAMS.filter((parameter) => parameter !== cached)
      ]
    : [...DIRECT_RANK_PARAMS];

  let completed = 0;

  for (let index = 0; index < parameters.length; index += 1) {
    if (index > 0) {
      await delay(BOARD_REQUEST_INTERVAL);
    }

    const parameter = parameters[index];

    try {
      const boardPage = await getAnonymousBoardPage(1, userAgent, {
        [parameter]: memberId
      });

      completed += 1;

      if (
        String(boardPage.record?.member_id || "") === String(memberId) &&
        isNumber(boardPage.order)
      ) {
        const candidate = findMemberOnPage(boardPage, memberId);

        saveDirectRankProbe(parameter);
        print(
          `匿名直查探测：${parameter} 可用，实时排名=${candidate.rank}`
        );

        return {
          candidate: {
            ...candidate,
            directParameter: parameter
          },
          shouldCacheNone: false
        };
      }
    } catch (error) {
      print(
        `匿名直查探测（${parameter}）：${cleanText(
          error?.message || error
        )}`
      );
    }
  }

  if (!cached) {
    print("匿名直查探测：未发现可用参数，改用公开分页");
  } else {
    print("匿名直查探测：缓存参数已失效，改用公开分页");
  }

  return {
    candidate: null,
    // 只有三个请求都正常返回，才允许把“无直查参数”缓存下来。
    shouldCacheNone: completed === parameters.length
  };
}

function getGainBounds(boardPage) {
  const gains = boardPage.list
    .map((item) => (isNumber(item?.gain) ? Number(item.gain) : null))
    .filter((value) => value !== null);

  if (!gains.length) {
    return null;
  }

  return {
    max: Math.max(...gains),
    min: Math.min(...gains)
  };
}

function pageContainsGain(boardPage, gain) {
  return boardPage.list.some(
    (item) => isNumber(item?.gain) && Number(item.gain) === Number(gain)
  );
}

async function findAnonymousBoardRecord(userAgent, memberId, gainHint) {
  const directProbe = await probeAnonymousDirectRank(
    userAgent,
    memberId
  );

  if (directProbe.candidate) {
    return directProbe.candidate;
  }

  const cache = new Map();
  let requestCount = 0;

  function finalizeFound(found) {
    // 只有公开分页确实找到了该成员，才证明刚才的三次直查阴性有效。
    if (found && directProbe.shouldCacheNone) {
      saveDirectRankProbe("none");
    }

    return found;
  }

  async function fetchPage(page) {
    if (cache.has(page)) {
      return cache.get(page);
    }

    if (requestCount > 0) {
      await delay(BOARD_REQUEST_INTERVAL);
    }

    const result = await getAnonymousBoardPage(page, userAgent);
    requestCount += 1;
    cache.set(page, result);
    return result;
  }

  const firstPage = await fetchPage(1);
  let found = findMemberOnPage(firstPage, memberId);

  if (found) {
    return finalizeFound(found);
  }

  const totalPages = Math.max(
    1,
    Math.ceil(Number(firstPage.total || firstPage.list.length) / BOARD_PAGE_SIZE)
  );

  // 排行榜先按 gain 从高到低排列，同一 gain 内再按签到时间从早到晚排列。
  // 已知今日奖励时，先二分找到该 gain 第一次出现的页面，再向后查找。
  // 例如凌晨很早获得 1 个鸡腿，即使实时排名已降到 8668 左右，
  // 通常也只需约 8 次二分请求和 1 个目标页请求。
  if (isNumber(gainHint)) {
    const targetGain = Number(gainHint);
    let low = 1;
    let high = totalPages;
    let firstCandidatePage = null;

    while (low <= high) {
      const page = Math.floor((low + high) / 2);
      const boardPage = await fetchPage(page);
      found = findMemberOnPage(boardPage, memberId);

      if (found) {
        return finalizeFound(found);
      }

      const bounds = getGainBounds(boardPage);

      if (!bounds) {
        firstCandidatePage = page;
        high = page - 1;
      } else if (bounds.min <= targetGain) {
        firstCandidatePage = page;
        high = page - 1;
      } else {
        low = page + 1;
      }
    }

    if (firstCandidatePage !== null) {
      for (
        let page = firstCandidatePage;
        page <= totalPages;
        page += 1
      ) {
        const boardPage = await fetchPage(page);
        found = findMemberOnPage(boardPage, memberId);

        if (found) {
          return finalizeFound(found);
        }

        const bounds = getGainBounds(boardPage);

        if (!bounds) {
          break;
        }

        // 当前页已经全部低于目标 gain，说明目标奖励区间已经结束。
        if (bounds.max < targetGain) {
          break;
        }

        // 边界页跨越了目标 gain，但没有该 gain，说明排行榜中不存在它。
        if (
          bounds.min <= targetGain &&
          bounds.max >= targetGain &&
          !pageContainsGain(boardPage, targetGain)
        ) {
          break;
        }
      }
    }
  }

  // “已签到”响应可能不带 gain。此时匿名扫描公开榜单。
  // 从末页向前查找，避开已经读取过的页面。
  for (let page = totalPages; page >= 2; page -= 1) {
    if (cache.has(page)) {
      continue;
    }

    const boardPage = await fetchPage(page);
    found = findMemberOnPage(boardPage, memberId);

    if (found) {
      return finalizeFound(found);
    }
  }

  return null;
}

async function verifyAnonymousBoardRecord(
  userAgent,
  memberId,
  candidate
) {
  if (!candidate) {
    return null;
  }

  // 如果服务器直接返回 order，它本身就是单次响应中的官方实时排名。
  if (candidate.source === "order") {
    return {
      ...candidate,
      verified: true
    };
  }

  let targetPage =
    Number(candidate.page) ||
    Math.max(1, Math.ceil(Number(candidate.rank) / BOARD_PAGE_SIZE));

  // 匿名分页查询期间，新的高鸡腿记录可能把目标向后一页推移。
  // 重新请求命中页；若刚好跨页，再检查后一页和前一页。
  for (let pass = 1; pass <= 2; pass += 1) {
    await delay(BOARD_REQUEST_INTERVAL);

    const pages = [
      targetPage,
      targetPage + 1,
      Math.max(1, targetPage - 1)
    ].filter((page, index, array) => array.indexOf(page) === index);

    for (const page of pages) {
      const boardPage = await getAnonymousBoardPage(page, userAgent);
      const verified = findMemberOnPage(boardPage, memberId);

      if (verified) {
        print(
          "匿名排行榜复核：" +
            `第 ${verified.page} 页第 ${Number(verified.pageIndex) + 1} 条，` +
            `实时排名=${verified.rank}`
        );

        return {
          ...verified,
          verified: true,
          verifiedAt: Date.now()
        };
      }
    }

    // 排名在查询期间通常只会向后移动，下一轮从后一页继续复查。
    targetPage += 1;
  }

  return null;
}

async function getAnonymousBoardDataSafe(userAgent, memberId, gainHint) {
  try {
    const candidate = await findAnonymousBoardRecord(
      userAgent,
      memberId,
      gainHint
    );

    const data = await verifyAnonymousBoardRecord(
      userAgent,
      memberId,
      candidate
    );

    return {
      data,
      error: data
        ? ""
        : candidate
          ? "匿名排行榜命中后实时复核失败"
          : `公开榜单中未找到成员 ID ${memberId}`
    };
  } catch (error) {
    const message = cleanText(error?.message || error);
    print(`签到排行榜：${message}`);

    return {
      data: null,
      error: message
    };
  }
}

async function auditAnonymousRank(cookie, userAgent, memberId, candidate) {
  if (!cookie || !candidate || !isNumber(candidate.rank)) {
    return {
      checked: false,
      matched: null,
      error: "缺少 A/B 校验条件"
    };
  }

  let page = Math.max(
    1,
    Math.ceil(Number(candidate.rank) / BOARD_PAGE_SIZE)
  );

  const visited = new Set();

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    if (attempt > 1) {
      await delay(BOARD_REQUEST_INTERVAL);
    }

    visited.add(page);

    const boardPage = await getAuthenticatedBoardPage(
      page,
      cookie,
      userAgent
    );

    const recordMatches =
      String(boardPage.record?.member_id || "") === String(memberId);

    if (!recordMatches || !isNumber(boardPage.order)) {
      return {
        checked: false,
        matched: null,
        error: "登录态响应未返回目标成员的官方 order"
      };
    }

    const officialOrder = Number(boardPage.order);
    const listHit = findMemberInList(boardPage, memberId);

    if (listHit) {
      const matched = officialOrder === listHit.rank;
      const audit = {
        checked: true,
        matched,
        officialOrder,
        listRank: listHit.rank,
        difference: listHit.rank - officialOrder,
        page: boardPage.page
      };

      print(
        "排行榜 A/B 校验：" +
          `官方 order=${audit.officialOrder}；` +
          `页内位置=${audit.listRank}；` +
          `差值=${audit.difference}；` +
          `结论=${matched ? "准确" : "不一致"}`
      );

      return audit;
    }

    const officialPage = Math.max(
      1,
      Math.ceil(officialOrder / BOARD_PAGE_SIZE)
    );

    // 排名恰好跨页时，按本次响应给出的 order 转到新页再取一份原子快照。
    if (officialPage !== page && !visited.has(officialPage)) {
      page = officialPage;
      continue;
    }

    const audit = {
      checked: true,
      matched: false,
      officialOrder,
      listRank: null,
      difference: null,
      page: boardPage.page,
      error: "官方 order 对应页内没有目标成员"
    };

    print(
      "排行榜 A/B 校验：" +
        `官方 order=${officialOrder}；页内位置=未命中；结论=不一致`
    );

    return audit;
  }

  return {
    checked: false,
    matched: null,
    error: "排名连续跨页，A/B 校验未完成"
  };
}

async function auditAnonymousRankSafe(
  cookie,
  userAgent,
  memberId,
  candidate
) {
  try {
    return await auditAnonymousRank(
      cookie,
      userAgent,
      memberId,
      candidate
    );
  } catch (error) {
    const message = cleanText(error?.message || error);
    print(`排行榜 A/B 校验：未完成（${message}）`);

    return {
      checked: false,
      matched: null,
      error: message
    };
  }
}

async function reconcileAnonymousRankAfterAudit(
  userAgent,
  memberId,
  candidate,
  audit
) {
  if (
    !candidate ||
    !audit?.checked ||
    !audit.matched ||
    !isNumber(audit.officialOrder) ||
    Number(audit.officialOrder) === Number(candidate.rank)
  ) {
    return {
      ...candidate,
      audit
    };
  }

  const previousRank = Number(candidate.rank);

  print(
    "排行榜实时变动：" +
      `匿名快照=${previousRank}；` +
      `校验快照=${Number(audit.officialOrder)}；` +
      "正在进行最终匿名复核"
  );

  const refreshed = await verifyAnonymousBoardRecord(
    userAgent,
    memberId,
    {
      ...candidate,
      rank: Number(audit.officialOrder),
      page: Number(audit.page),
      pageIndex: null,
      source: "list",
      verified: false
    }
  );

  if (refreshed) {
    return {
      ...refreshed,
      audit: {
        ...audit,
        previousAnonymousRank: previousRank,
        anonymousRefreshed: true
      }
    };
  }

  return {
    ...candidate,
    audit: {
      ...audit,
      previousAnonymousRank: previousRank,
      anonymousRefreshFailed: true
    }
  };
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

function getNodeSeekDayKey() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function saveTodayGain(gain) {
  if (!isNumber(gain)) {
    return;
  }

  write(Number(gain), KEY_LAST_GAIN);
  write(getNodeSeekDayKey(), KEY_LAST_GAIN_DAY);
}

function readTodayGain() {
  if (read(KEY_LAST_GAIN_DAY) !== getNodeSeekDayKey()) {
    return null;
  }

  const gain = read(KEY_LAST_GAIN);
  return isNumber(gain) ? Number(gain) : null;
}

function getResultTitle(status) {
  if (status === "success") {
    return "✅ NodeSeek 签到成功";
  }

  if (status === "already") {
    return "🎁 NodeSeek 今日已签到";
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

  if (board?.audit?.anonymousRefreshFailed) {
    const gainText =
      gain !== null
        ? `🎖️ 今日签到获得鸡腿 ${gain} 个 | `
        : "";

    return `${gainText}⚠️ 排名已变动，最终匿名复核失败`;
  }

  if (board?.audit?.checked && board.audit.matched === false) {
    const gainText =
      gain !== null
        ? `🎖️ 今日签到获得鸡腿 ${gain} 个 | `
        : "";

    return (
      `${gainText}⚠️ 排名 A/B 校验不一致` +
      `（匿名 ${rank ?? "未知"} / ` +
      `order ${board.audit.officialOrder ?? "未知"} / ` +
      `页内 ${board.audit.listRank ?? "未命中"}）`
    );
  }

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
        "签到操作仍需要登录 Cookie；匿名排行榜本身不使用 Cookie";

      print(`❌ NodeSeek 签到失败\n\n${message}`);
      notify("❌ NodeSeek 签到失败", "未获取签到 Cookie", message);
      return done();
    }

    const userAgent =
      cleanText(read(KEY_USER_AGENT)) || DEFAULT_USER_AGENT;

    const memberId = getTargetMemberId();
    const signMode = getSignMode();

    await refreshRefractProtocol(userAgent);

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

    if (isNumber(signResult.gain)) {
      saveTodayGain(signResult.gain);
    }

    const gainHint = isNumber(signResult.gain)
      ? Number(signResult.gain)
      : readTodayGain();

    const boardResult = await getAnonymousBoardDataSafe(
      userAgent,
      memberId,
      gainHint
    );

    let board = boardResult.data;

    // 即使签到 POST 被拦截，只要匿名公开榜单能找到 44709，
    // 就可以确定今天已经签到。
    if (
      board &&
      (signResult.status === "fail" ||
        signResult.status === "cloudflare")
    ) {
      signResult = {
        status: "already",
        message: "匿名排行榜确认今天已经签到",
        gain: board.gain
      };
    }

    if (board && isNumber(board.gain)) {
      signResult.gain = Number(board.gain);
      saveTodayGain(board.gain);
    }

    if (board) {
      const audit = await auditAnonymousRankSafe(
        cookie,
        userAgent,
        memberId,
        board
      );

      board = await reconcileAnonymousRankAfterAudit(
        userAgent,
        memberId,
        board,
        audit
      );
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
          `${signResult.message}${extra}`
      );

      notify(
        title,
        signMode.name,
        `${signResult.message}${extra}`
      );

      return done();
    }

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

    notify(
      title,
      signMode.name,
      `${boardLine}\n\n${accountLine}`
    );

    return done();
  } catch (error) {
    const message = `❌ 脚本异常：${cleanText(error?.message || error)}`;

    print(message);
    notify(SCRIPT_NAME, "❌ 脚本异常", message);
    return done();
  }
})();