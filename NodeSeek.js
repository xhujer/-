const SCRIPT_NAME = "NodeSeek签到";
const DOMAIN = "www.nodeseek.com";

const KEY_COOKIE = "nodeseek_cookie";
const KEY_USER_AGENT = "nodeseek_user_agent";
const KEY_RANDOM = "nodeseek_random";
const KEY_MEMBER_ID = "nodeseek_member_id";
const KEY_BOARD_STATS = "nodeseek_board_stats";

const DEFAULT_MEMBER_ID = "44709";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 " +
  "Mobile/15E148 Safari/604.1";

/* ==============================
 * 基础工具
 * ============================== */

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

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function getHeader(headers, name) {
  const target = String(name).toLowerCase();

  for (const key in headers || {}) {
    if (String(key).toLowerCase() === target) {
      return headers[key];
    }
  }

  return null;
}

function getStatusCode(response) {
  return Number(
    response?.status ||
    response?.statusCode ||
    0
  );
}

function parseJson(value) {
  try {
    return JSON.parse(String(value || ""));
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

function toNumber(value, fallback = 0) {
  return isNumber(value)
    ? Number(value)
    : fallback;
}

function chinaDateKey(value = Date.now()) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Date(
    date.getTime() + 8 * 60 * 60 * 1000
  )
    .toISOString()
    .slice(0, 10);
}

/* ==============================
 * HTTP 请求
 * ============================== */

function httpGet(options) {
  return new Promise((resolve, reject) => {
    $httpClient.get(
      options,
      (error, response, data) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          response: response || {},
          data: data ?? ""
        });
      }
    );
  });
}

function httpPost(options) {
  return new Promise((resolve, reject) => {
    $httpClient.post(
      options,
      (error, response, data) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          response: response || {},
          data: data ?? ""
        });
      }
    );
  });
}

function isCloudflarePage(response, data) {
  const code =
    getStatusCode(response);

  const text =
    String(data || "").toLowerCase();

  return (
    code === 403 ||
    text.includes("just a moment") ||
    text.includes("cf-chl-") ||
    text.includes("challenge-platform") ||
    text.includes("cloudflare ray id") ||
    text.includes("performing security verification")
  );
}

/* ==============================
 * 插件参数
 * ============================== */

function getArg(name) {
  try {
    if (
      typeof $argument === "object" &&
      $argument !== null &&
      !Array.isArray($argument)
    ) {
      return $argument[name] ?? null;
    }

    if (
      typeof $argument !== "string" ||
      !$argument.trim()
    ) {
      return null;
    }

    const text =
      $argument.trim();

    try {
      const json =
        JSON.parse(text);

      if (
        json &&
        typeof json === "object"
      ) {
        return json[name] ?? null;
      }
    } catch {}

    const params = {};

    text.split("&").forEach((part) => {
      const index =
        part.indexOf("=");

      if (index < 0) {
        return;
      }

      const key =
        part.slice(0, index).trim();

      const rawValue =
        part.slice(index + 1);

      try {
        params[key] =
          decodeURIComponent(rawValue);
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
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const text =
    String(value)
      .trim()
      .toLowerCase();

  if (
    [
      "false",
      "0",
      "off",
      "no",
      "fixed",
      "固定",
      "固定签到"
    ].includes(text)
  ) {
    return false;
  }

  if (
    [
      "true",
      "1",
      "on",
      "yes",
      "random",
      "随机",
      "随机签到"
    ].includes(text)
  ) {
    return true;
  }

  return fallback;
}

function getSignMode() {
  const argument =
    getArg("Random") ??
    getArg("random");

  const stored =
    read(KEY_RANDOM);

  const random =
    parseBoolean(
      argument !== null
        ? argument
        : stored,
      true
    );

  write(random, KEY_RANDOM);

  return {
    random,
    name: random
      ? "随机签到"
      : "固定签到"
  };
}

function normalizeMemberId(value) {
  const text =
    cleanText(value);

  const match =
    text.match(
      /(?:\/space\/)?(\d+)/
    );

  return match?.[1] || "";
}

function getMemberId() {
  const argument =
    getArg("MemberID") ??
    getArg("memberId") ??
    getArg("member_id");

  const argumentId =
    normalizeMemberId(argument);

  if (argumentId) {
    write(
      argumentId,
      KEY_MEMBER_ID
    );

    return argumentId;
  }

  const storedId =
    normalizeMemberId(
      read(KEY_MEMBER_ID)
    );

  if (storedId) {
    return storedId;
  }

  write(
    DEFAULT_MEMBER_ID,
    KEY_MEMBER_ID
  );

  return DEFAULT_MEMBER_ID;
}

/* ==============================
 * Cookie 处理
 * ============================== */

function normalizeCookie(value) {
  return String(value || "")
    .replace(/\r?\n/g, "; ")
    .replace(/;+\s*/g, "; ")
    .replace(/\s*;\s*$/, "")
    .trim();
}

function getCookieFromHeaders(headers) {
  const value =
    getHeader(headers, "Cookie");

  if (!value) {
    return "";
  }

  return normalizeCookie(
    Array.isArray(value)
      ? value.join("; ")
      : value
  );
}

function parseCookiePairs(cookie) {
  const pairs = [];

  String(cookie || "")
    .split(";")
    .forEach((part) => {
      const item =
        part.trim();

      const index =
        item.indexOf("=");

      if (index <= 0) {
        return;
      }

      const name =
        item.slice(0, index).trim();

      const value =
        item.slice(index + 1).trim();

      if (name) {
        pairs.push({
          name,
          value
        });
      }
    });

  return pairs;
}

/**
 * 不再直接用新 Cookie 覆盖旧 Cookie。
 * 将新旧 Cookie 合并，避免某个请求只携带部分 Cookie，
 * 导致 cf_clearance 或登录字段丢失。
 */
function mergeCookies(oldCookie, newCookie) {
  const map = {};
  const order = [];

  function add(cookie) {
    parseCookiePairs(cookie)
      .forEach(({ name, value }) => {
        if (
          !Object.prototype
            .hasOwnProperty
            .call(map, name)
        ) {
          order.push(name);
        }

        map[name] = value;
      });
  }

  add(oldCookie);
  add(newCookie);

  return order
    .filter((name) => map[name] !== "")
    .map((name) => {
      return `${name}=${map[name]}`;
    })
    .join("; ");
}

function hasCookieName(cookie, targetName) {
  const target =
    String(targetName).toLowerCase();

  return parseCookiePairs(cookie)
    .some(({ name }) => {
      return name.toLowerCase() === target;
    });
}

/* ==============================
 * HTML 处理
 * ============================== */

function decodeUnicodeEscapes(value) {
  return String(value || "")
    .replace(
      /\\u([0-9a-fA-F]{4})/g,
      (_, hex) => {
        return String.fromCharCode(
          parseInt(hex, 16)
        );
      }
    );
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(
      /&#(\d+);/g,
      (_, code) => {
        return String.fromCharCode(
          Number(code)
        );
      }
    )
    .replace(
      /&#x([0-9a-f]+);/gi,
      (_, code) => {
        return String.fromCharCode(
          parseInt(code, 16)
        );
      }
    );
}

function htmlToText(html) {
  return decodeHtmlEntities(
    decodeUnicodeEscapes(html)
  )
    .replace(
      /<script\b[^>]*>[\s\S]*?<\/script>/gi,
      " "
    )
    .replace(
      /<style\b[^>]*>[\s\S]*?<\/style>/gi,
      " "
    )
    .replace(/<[^>]+>/g, " ")
    .replace(/\\n|\\r|\\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ==============================
 * Board 奖励和排名
 * ============================== */

function parseBoardStats(body) {
  const raw =
    decodeUnicodeEscapes(
      decodeHtmlEntities(body)
    );

  const text =
    htmlToText(raw);

  const sources = [
    raw,
    text
  ];

  for (const source of sources) {
    const fullMatch =
      String(source).match(
        /今日签到获得鸡腿\s*(\d+)\s*个[\s\S]{0,100}?当前排名第\s*(\d+)/i
      );

    if (fullMatch) {
      return {
        reward: Number(fullMatch[1]),
        rank: Number(fullMatch[2]),
        date: chinaDateKey()
      };
    }
  }

  let reward = null;
  let rank = null;

  for (const source of sources) {
    if (reward === null) {
      const rewardMatch =
        String(source).match(
          /今日签到获得鸡腿\s*(\d+)\s*个/i
        );

      if (rewardMatch?.[1]) {
        reward =
          Number(rewardMatch[1]);
      }
    }

    if (rank === null) {
      const rankMatch =
        String(source).match(
          /当前排名第\s*(\d+)/i
        );

      if (rankMatch?.[1]) {
        rank =
          Number(rankMatch[1]);
      }
    }
  }

  if (
    reward === null &&
    rank === null
  ) {
    return null;
  }

  return {
    reward,
    rank,
    date: chinaDateKey()
  };
}

function saveBoardStats(stats) {
  if (!stats) {
    return;
  }

  write(
    JSON.stringify({
      reward:
        isNumber(stats.reward)
          ? Number(stats.reward)
          : null,

      rank:
        isNumber(stats.rank)
          ? Number(stats.rank)
          : null,

      date:
        stats.date ||
        chinaDateKey()
    }),
    KEY_BOARD_STATS
  );
}

function readBoardStats() {
  const json =
    parseJson(
      read(KEY_BOARD_STATS)
    );

  if (
    !json ||
    json.date !== chinaDateKey()
  ) {
    return null;
  }

  return {
    reward:
      isNumber(json.reward)
        ? Number(json.reward)
        : null,

    rank:
      isNumber(json.rank)
        ? Number(json.rank)
        : null,

    date:
      json.date
  };
}

/**
 * Safari 打开 /board 时，
 * 从真实浏览器响应中抓取奖励和排名。
 */
async function captureBoardResponse() {
  const url =
    String($request?.url || "");

  if (
    !/\/board(?:\?|$)/i.test(url)
  ) {
    return;
  }

  const body =
    String($response?.body || "");

  if (
    !body ||
    isCloudflarePage(
      $response,
      body
    )
  ) {
    return;
  }

  const stats =
    parseBoardStats(body);

  if (!stats) {
    return;
  }

  saveBoardStats(stats);

  const line =
    `📊 今日签到获得鸡腿 ${stats.reward} 个` +
    ` | 当前排名第 ${stats.rank}`;

  print(`✅ 签到排名已更新\n${line}`);
}

/* ==============================
 * 自动抓取 Cookie
 * ============================== */

async function captureRequest() {
  const url =
    String($request?.url || "");

  if (
    !url.includes("nodeseek.com")
  ) {
    return;
  }

  const headers =
    $request?.headers || {};

  const incomingCookie =
    getCookieFromHeaders(headers);

  if (
    incomingCookie &&
    incomingCookie.length >= 20
  ) {
    const oldCookie =
      read(KEY_COOKIE) || "";

    const mergedCookie =
      mergeCookies(
        oldCookie,
        incomingCookie
      );

    if (
      mergedCookie &&
      mergedCookie !== oldCookie
    ) {
      write(
        mergedCookie,
        KEY_COOKIE
      );

      const containsClearance =
        hasCookieName(
          mergedCookie,
          "cf_clearance"
        );

      print(
        containsClearance
          ? "✅ Cookie 已更新，已包含 Cloudflare 凭据"
          : "✅ Cookie 已更新"
      );
    }
  }

  const userAgent =
    cleanText(
      getHeader(
        headers,
        "User-Agent"
      )
    );

  if (userAgent) {
    write(
      userAgent,
      KEY_USER_AGENT
    );
  }

  const memberMatch =
    url.match(
      /\/space\/(\d+)/
    );

  if (memberMatch?.[1]) {
    write(
      memberMatch[1],
      KEY_MEMBER_ID
    );
  }
}

/* ==============================
 * 请求头
 * ============================== */

function buildApiHeaders(
  cookie,
  userAgent,
  referer
) {
  return {
    "Accept": "*/*",
    "Accept-Language":
      "zh-CN,zh-Hans;q=0.9,en;q=0.8",

    "Origin":
      `https://${DOMAIN}`,

    "Referer":
      referer ||
      `https://${DOMAIN}/board`,

    "Sec-Fetch-Dest":
      "empty",

    "Sec-Fetch-Mode":
      "cors",

    "Sec-Fetch-Site":
      "same-origin",

    "X-Requested-With":
      "XMLHttpRequest",

    "User-Agent":
      userAgent ||
      DEFAULT_USER_AGENT,

    "Cookie":
      cookie
  };
}

/* ==============================
 * 签到
 * ============================== */

function extractGain(message) {
  const text =
    cleanText(message);

  const patterns = [
    /(?:获得|得到|奖励|增加)\s*[+＋]?\s*(\d+)\s*(?:个|只)?\s*鸡腿/i,
    /鸡腿\s*[+＋]\s*(\d+)/i,
    /[+＋]\s*(\d+)\s*(?:个|只)?\s*鸡腿/i,
    /午饭\s*[+＋]?\s*(\d+)\s*(?:个|只)?\s*鸡腿/i
  ];

  for (const pattern of patterns) {
    const match =
      text.match(pattern);

    if (match?.[1]) {
      return Number(match[1]);
    }
  }

  return null;
}

function parseSignResult(json, httpCode) {
  const message =
    cleanText(
      json?.message ||
      json?.msg
    );

  const gain =
    isNumber(json?.gain)
      ? Number(json.gain)
      : extractGain(message);

  const already =
    /今天已完成签到|今日已签到|已经签到|重复操作|重复签到|已签到/i
      .test(message);

  if (already) {
    return {
      status: "already",
      message:
        message ||
        "今天已完成签到，请勿重复操作",
      gain,
      current:
        isNumber(json?.current)
          ? Number(json.current)
          : null
    };
  }

  const success =
    json?.success === true ||
    gain !== null ||
    /签到成功|获得.*鸡腿/i
      .test(message);

  if (success) {
    return {
      status: "success",

      message:
        gain !== null
          ? `签到成功，获得 ${gain} 鸡腿`
          : (
              message ||
              "签到成功"
            ),

      gain,

      current:
        isNumber(json?.current)
          ? Number(json.current)
          : null
    };
  }

  return {
    status: "fail",

    message:
      message ||
      `签到失败（HTTP ${httpCode}）`,

    gain: null,
    current: null
  };
}

async function signIn(
  cookie,
  userAgent,
  random
) {
  const url =
    `https://${DOMAIN}` +
    `/api/attendance` +
    `?random=${random ? "true" : "false"}`;

  const headers = {
    ...buildApiHeaders(
      cookie,
      userAgent,
      `https://${DOMAIN}/board`
    ),

    "Content-Length": "0"
  };

  const {
    response,
    data
  } = await httpPost({
    url,
    headers
  });

  const code =
    getStatusCode(response);

  if (
    isCloudflarePage(
      response,
      data
    )
  ) {
    return {
      status: "cloudflare",

      message:
        "签到请求被 Cloudflare 拦截",

      gain: null,
      current: null
    };
  }

  const json =
    parseJson(data);

  if (!json) {
    return {
      status: "fail",

      message:
        `签到结果解析失败（HTTP ${code}）：` +
        (
          cleanText(data)
            .slice(0, 160) ||
          "空响应"
        ),

      gain: null,
      current: null
    };
  }

  return parseSignResult(
    json,
    code
  );
}

/* ==============================
 * 当天签到积分记录
 * ============================== */

function parseCreditRecord(record) {
  if (!Array.isArray(record)) {
    return null;
  }

  const amount =
    record[0];

  const balance =
    record[1];

  const description =
    cleanText(record[2]);

  const timestamp =
    cleanText(record[3]);

  if (
    !description ||
    !timestamp
  ) {
    return null;
  }

  return {
    amount:
      isNumber(amount)
        ? Number(amount)
        : null,

    balance:
      isNumber(balance)
        ? Number(balance)
        : null,

    description,
    timestamp,
    date:
      chinaDateKey(timestamp)
  };
}

async function getTodayCreditRecord(
  cookie,
  userAgent
) {
  const {
    response,
    data
  } = await httpGet({
    url:
      `https://${DOMAIN}` +
      `/api/account/credit/page-1` +
      `?_=${Date.now()}`,

    headers:
      buildApiHeaders(
        cookie,
        userAgent,
        `https://${DOMAIN}/board`
      )
  });

  if (
    isCloudflarePage(
      response,
      data
    )
  ) {
    return null;
  }

  const json =
    parseJson(data);

  const records =
    Array.isArray(json?.data)
      ? json.data
      : [];

  const today =
    chinaDateKey();

  for (const rawRecord of records) {
    const record =
      parseCreditRecord(rawRecord);

    if (!record) {
      continue;
    }

    const isToday =
      record.date === today;

    const isAttendance =
      /签到收益|签到/i
        .test(record.description) &&
      /鸡腿/i
        .test(record.description);

    if (
      isToday &&
      isAttendance
    ) {
      return {
        gain:
          record.amount,

        balance:
          record.balance,

        description:
          record.description,

        timestamp:
          record.timestamp
      };
    }
  }

  return null;
}

/* ==============================
 * 后台尝试读取 Board
 * ============================== */

async function getBoardStats(
  cookie,
  userAgent
) {
  try {
    const {
      response,
      data
    } = await httpGet({
      url:
        `https://${DOMAIN}/board` +
        `?_=${Date.now()}`,

      headers: {
        "Accept":
          "text/html,application/xhtml+xml," +
          "application/xml;q=0.9,*/*;q=0.8",

        "Accept-Language":
          "zh-CN,zh-Hans;q=0.9,en;q=0.8",

        "Cache-Control":
          "no-cache",

        "Pragma":
          "no-cache",

        "Referer":
          `https://${DOMAIN}/board`,

        "Sec-Fetch-Dest":
          "document",

        "Sec-Fetch-Mode":
          "navigate",

        "Sec-Fetch-Site":
          "same-origin",

        "User-Agent":
          userAgent ||
          DEFAULT_USER_AGENT,

        "Cookie":
          cookie
      }
    });

    if (
      isCloudflarePage(
        response,
        data
      )
    ) {
      return readBoardStats();
    }

    const stats =
      parseBoardStats(data);

    if (stats) {
      saveBoardStats(stats);
      return stats;
    }
  } catch {}

  return readBoardStats();
}

/* ==============================
 * 用户信息
 * ============================== */

async function getAccountInfo(
  cookie,
  userAgent,
  memberId
) {
  if (!/^\d+$/.test(memberId)) {
    throw new Error(
      "成员 ID 无效"
    );
  }

  const {
    response,
    data
  } = await httpGet({
    url:
      `https://${DOMAIN}` +
      `/api/account/getInfo/${memberId}` +
      `?readme=1&_=${Date.now()}`,

    headers:
      buildApiHeaders(
        cookie,
        userAgent,
        `https://${DOMAIN}/space/${memberId}`
      )
  });

  const code =
    getStatusCode(response);

  if (
    isCloudflarePage(
      response,
      data
    )
  ) {
    throw new Error(
      "用户信息请求被 Cloudflare 拦截"
    );
  }

  const json =
    parseJson(data);

  const user =
    json?.detail ||
    json?.data ||
    json?.user ||
    null;

  if (!user) {
    throw new Error(
      cleanText(
        json?.message ||
        json?.msg
      ) ||
      `用户信息请求失败（HTTP ${code}）`
    );
  }

  return {
    name:
      cleanText(
        user.member_name ||
        user.username ||
        user.nickname ||
        user.name ||
        `用户${memberId}`
      ),

    coin:
      toNumber(
        user.coin ??
        user.chicken ??
        user.credit
      ),

    rank:
      toNumber(
        user.rank ??
        user.level
      ),

    posts:
      toNumber(
        user.nPost ??
        user.postCount ??
        user.posts
      ),

    comments:
      toNumber(
        user.nComment ??
        user.commentCount ??
        user.comments
      )
  };
}

/* ==============================
 * 输出格式
 * ============================== */

function getResultTitle(status) {
  if (status === "success") {
    return "✅ NodeSeek 签到成功";
  }

  if (status === "already") {
    return "ℹ️ NodeSeek 今日已签到";
  }

  if (status === "cloudflare") {
    return "❌ NodeSeek 签到被 Cloudflare 拦截";
  }

  return "❌ NodeSeek 签到失败";
}

function formatAttendanceLine(
  boardStats,
  signResult,
  creditRecord
) {
  const reward =
    isNumber(boardStats?.reward)
      ? Number(boardStats.reward)
      : (
          isNumber(signResult?.gain)
            ? Number(signResult.gain)
            : (
                isNumber(creditRecord?.gain)
                  ? Number(creditRecord.gain)
                  : null
              )
        );

  const rank =
    isNumber(boardStats?.rank)
      ? Number(boardStats.rank)
      : null;

  if (
    reward !== null &&
    rank !== null
  ) {
    return (
      `📊 今日签到获得鸡腿 ${reward} 个` +
      ` | 当前排名第 ${rank}`
    );
  }

  if (reward !== null) {
    return (
      `📊 今日签到获得鸡腿 ${reward} 个` +
      ` | 当前排名暂未获取`
    );
  }

  if (rank !== null) {
    return (
      `📊 当前排名第 ${rank}`
    );
  }

  return "⚠️ 今日签到奖励和排名暂未获取";
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

/* ==============================
 * 主程序
 * ============================== */

(async () => {
  try {
    /*
     * HTTP Response 模式：
     * 抓取 Board 奖励和排名
     */
    if (
      typeof $response !== "undefined"
    ) {
      await captureBoardResponse();
      return done({});
    }

    /*
     * HTTP Request 模式：
     * 合并 Cookie、保存 User-Agent
     */
    if (
      typeof $request !== "undefined"
    ) {
      await captureRequest();
      return done({});
    }

    /*
     * Cron 模式
     */
    const cookie =
      read(KEY_COOKIE);

    if (!cookie) {
      const message =
        "请开启自动获取 Cookie，" +
        "然后在 Safari 登录并刷新 NodeSeek";

      print(
        `❌ NodeSeek 签到失败\n${message}`
      );

      notify(
        "❌ NodeSeek 签到失败",
        "未获取 Cookie",
        message
      );

      return done();
    }

    const userAgent =
      cleanText(
        read(KEY_USER_AGENT)
      ) ||
      DEFAULT_USER_AGENT;

    const signMode =
      getSignMode();

    const memberId =
      getMemberId();

    console.log(
      `签到模式：${signMode.name}`
    );

    console.log(
      `成员 ID：${memberId}`
    );

    /*
     * 1. 执行签到
     */
    let signResult =
      await signIn(
        cookie,
        userAgent,
        signMode.random
      );

    if (
      signResult.status === "success"
    ) {
      await sleep(700);
    }

    /*
     * 2. 读取当天积分记录
     */
    let creditRecord = null;

    try {
      creditRecord =
        await getTodayCreditRecord(
          cookie,
          userAgent
        );
    } catch (error) {
      console.log(
        `积分记录：${cleanText(
          error?.message ||
          error
        )}`
      );
    }

    /*
     * 签到接口被 Cloudflare 拦截，
     * 但积分记录显示今天已经签到：
     * 按“今日已签到”输出，避免误报。
     */
    if (
      signResult.status === "cloudflare" &&
      creditRecord
    ) {
      signResult = {
        status: "already",

        message:
          `检测到今日签到记录，` +
          `获得 ${creditRecord.gain} 鸡腿`,

        gain:
          creditRecord.gain,

        current:
          creditRecord.balance
      };
    }

    if (
      signResult.gain === null &&
      creditRecord &&
      isNumber(creditRecord.gain)
    ) {
      signResult.gain =
        Number(creditRecord.gain);
    }

    /*
     * 3. 获取奖励和排名
     */
    const boardStats =
      await getBoardStats(
        cookie,
        userAgent
      );

    /*
     * 4. 获取账户信息
     */
    let account = null;

    try {
      account =
        await getAccountInfo(
          cookie,
          userAgent,
          memberId
        );
    } catch (error) {
      console.log(
        `用户信息：${cleanText(
          error?.message ||
          error
        )}`
      );
    }

    const title =
      getResultTitle(
        signResult.status
      );

    const attendanceLine =
      formatAttendanceLine(
        boardStats,
        signResult,
        creditRecord
      );

    const accountLine =
      formatAccountLine(account);

    let extraNotice = "";

    if (
      signResult.status === "cloudflare"
    ) {
      extraNotice =
        "\n请开启自动获取 Cookie，" +
        "在 Safari 完成验证并刷新 /board";
    }

    const output =
      `${title}\n` +
      `${signResult.message}\n` +
      `${attendanceLine}\n` +
      `${accountLine}` +
      `${extraNotice}`;

    print(output);

    notify(
      title,
      signResult.message,
      `${attendanceLine}\n` +
      `${accountLine}` +
      `${extraNotice}`
    );

    return done();
  } catch (error) {
    const message =
      `❌ 脚本异常：${cleanText(
        error?.message ||
        error
      )}`;

    print(message);

    notify(
      SCRIPT_NAME,
      "❌ 脚本异常",
      message
    );

    return done();
  }
})();