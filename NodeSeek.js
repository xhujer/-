const SCRIPT_NAME = "NodeSeek签到";
const DOMAIN = "www.nodeseek.com";

const KEY_COOKIE = "nodeseek_cookie";
const KEY_RANDOM = "nodeseek_random";
const KEY_UA = "nodeseek_user_agent";
const KEY_USER_ID = "nodeseek_user_id";

const DEFAULT_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 " +
  "Mobile/15E148 Safari/604.1";

function read(key) {
  return $persistentStore.read(key);
}

function write(val, key) {
  return $persistentStore.write(String(val), key);
}

function done(obj = {}) {
  $done(obj);
}

function cleanText(s) {
  return String(s ?? "")
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .trim();
}

function printResult(text) {
  const out = cleanText(text);
  if (out) console.log(out);
}

function notify(title, subtitle = "", body = "") {
  const t = cleanText(title) || "通知";
  const s = cleanText(subtitle);
  let b = cleanText(body);

  const MAX = 900;
  if (b.length > MAX) {
    b = b.slice(0, MAX) + "…";
  }

  $notification.post(t, s, b);
}

function httpRequest(method, options) {
  return new Promise((resolve, reject) => {
    const callback = (error, response, data) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        resp: response,
        data
      });
    };

    if (String(method).toLowerCase() === "post") {
      $httpClient.post(options, callback);
    } else {
      $httpClient.get(options, callback);
    }
  });
}

function httpGet(options) {
  return httpRequest("get", options);
}

function httpPost(options) {
  return httpRequest("post", options);
}

function getStatusCode(resp) {
  return Number(resp?.status || resp?.statusCode || 0);
}

function getHeader(headers, name) {
  const target = String(name).toLowerCase();

  for (const key in (headers || {})) {
    if (String(key).toLowerCase() === target) {
      return headers[key];
    }
  }

  return null;
}

function normalizeCookie(str) {
  return String(str || "")
    .replace(/\r?\n/g, "; ")
    .replace(/;+\s*/g, "; ")
    .replace(/\s*;\s*$/, "")
    .trim();
}

function getCookieFromHeaders(headers) {
  const value = getHeader(headers, "Cookie");

  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return normalizeCookie(value.join("; "));
  }

  return normalizeCookie(value);
}

function getArg(key) {
  try {
    if (typeof $argument === "string" && $argument.length) {
      const params = {};

      $argument.split("&").forEach((part) => {
        const index = part.indexOf("=");

        if (index < 0) {
          return;
        }

        const argKey = part.slice(0, index);
        const argValue = part.slice(index + 1);

        try {
          params[argKey] = decodeURIComponent(argValue);
        } catch {
          params[argKey] = argValue;
        }
      });

      return params[key] ?? null;
    }
  } catch {}

  return null;
}

function parseBoolean(value, defaultValue = true) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return defaultValue;
  }

  const text = String(value).trim().toLowerCase();

  if (["false", "0", "no", "off"].includes(text)) {
    return false;
  }

  if (["true", "1", "yes", "on"].includes(text)) {
    return true;
  }

  return defaultValue;
}

function buildHeaders(
  cookie,
  userAgent,
  referer = `https://${DOMAIN}/board`
) {
  return {
    "Accept": "application/json, text/plain, */*",
    "Referer": referer,
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": userAgent || DEFAULT_UA,
    "Cookie": cookie
  };
}

/**
 * 自动抓取 Cookie 和真实 User-Agent
 */
async function captureCookie() {
  const url = String($request?.url || "");

  if (!url.includes("nodeseek.com")) {
    return;
  }

  const headers = $request?.headers || {};
  const cookie = getCookieFromHeaders(headers);

  if (!cookie || cookie.length < 20) {
    return;
  }

  const userAgent = cleanText(
    getHeader(headers, "User-Agent")
  );

  const oldCookie = read(KEY_COOKIE);
  const oldUserAgent = read(KEY_UA);

  if (cookie !== oldCookie) {
    write(cookie, KEY_COOKIE);
  }

  if (userAgent && userAgent !== oldUserAgent) {
    write(userAgent, KEY_UA);
  }

  if (cookie !== oldCookie) {
    const message = "✅ Cookie 已更新";

    printResult(message);

    notify(
      SCRIPT_NAME,
      message,
      "可以关闭自动获取Cookie开关"
    );
  }
}

/**
 * 统一签到结果文本
 */
function normalizeSignMessage(message, status) {
  const text = cleanText(message);

  if (status === "success") {
    const rewardMatch = text.match(
      /(?:获得|得到|奖励|增加)\s*[+＋]?\s*(\d+)\s*(?:个|只)?\s*鸡腿/i
    );

    if (rewardMatch) {
      return `签到成功，获得 ${rewardMatch[1]} 鸡腿`;
    }

    return text || "签到成功";
  }

  if (status === "already") {
    return text || "今日已经签到";
  }

  return text || "签到失败，服务器未返回提示";
}

/**
 * 执行签到
 */
async function signIn(cookie, randomFlag, userAgent) {
  const randomValue = randomFlag ? "true" : "false";

  const url =
    `https://${DOMAIN}/api/attendance` +
    `?random=${randomValue}`;

  const headers = {
    ...buildHeaders(cookie, userAgent),
    "Content-Type": "application/json;charset=utf-8",
    "Origin": `https://${DOMAIN}`
  };

  const { resp, data } = await httpPost({
    url,
    headers,
    body: "{}"
  });

  const code = getStatusCode(resp);
  const raw = String(data || "");

  let json = null;

  try {
    json = JSON.parse(raw);
  } catch {}

  if (!json || typeof json !== "object") {
    return {
      status: "fail",
      code,
      message:
        `解析失败（HTTP ${code}）：` +
        `${cleanText(raw).slice(0, 160) || "（空响应）"}`
    };
  }

  const message = cleanText(
    json.message || json.msg || ""
  );

  const already =
    /已完成签到|今日已签到|已经签到|已签到|重复签到/i
      .test(message);

  if (already) {
    return {
      status: "already",
      code,
      message: normalizeSignMessage(
        message,
        "already"
      )
    };
  }

  const success =
    json.success === true ||
    /获得.*鸡腿|签到成功/i.test(message);

  if (success) {
    return {
      status: "success",
      code,
      message: normalizeSignMessage(
        message,
        "success"
      )
    };
  }

  return {
    status: "fail",
    code,
    message:
      message ||
      `签到失败（HTTP ${code}）`
  };
}

/**
 * 从登录后的网页中识别当前用户 ID
 */
function extractCurrentUserId(html) {
  const source = String(html || "");

  const patterns = [
    /\/userstyle\/(\d+)\.css(?:\?[^"']*)?/i,
    /["']member_id["']\s*:\s*["']?(\d+)/i,
    /["']userId["']\s*:\s*["']?(\d+)/i,
    /["']uid["']\s*:\s*["']?(\d+)/i
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);

    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * 请求 Board 页面获取当前用户 ID
 *
 * 获取失败时使用之前保存的用户 ID 作为兜底
 */
async function resolveCurrentUserId(
  cookie,
  userAgent
) {
  let detectedId = null;

  try {
    const { resp, data } = await httpGet({
      url:
        `https://${DOMAIN}/board` +
        `?_=${Date.now()}`,

      headers: {
        ...buildHeaders(
          cookie,
          userAgent,
          `https://${DOMAIN}/board`
        ),

        "Accept":
          "text/html,application/xhtml+xml," +
          "application/xml;q=0.9,*/*;q=0.8",

        "Cache-Control": "no-cache"
      }
    });

    const code = getStatusCode(resp);

    if (code >= 200 && code < 400) {
      detectedId = extractCurrentUserId(data);
    }
  } catch {}

  if (detectedId) {
    write(detectedId, KEY_USER_ID);
    return detectedId;
  }

  return cleanText(read(KEY_USER_ID)) || null;
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

/**
 * 获取昵称、鸡腿、等级、帖子和评论
 */
async function getAccountInfo(
  cookie,
  userAgent
) {
  const userId = await resolveCurrentUserId(
    cookie,
    userAgent
  );

  if (!userId) {
    throw new Error("未识别到当前用户 ID");
  }

  const { resp, data } = await httpGet({
    url:
      `https://${DOMAIN}` +
      `/api/account/getInfo/${userId}` +
      `?_=${Date.now()}`,

    headers: {
      ...buildHeaders(
        cookie,
        userAgent,
        `https://${DOMAIN}/board`
      ),

      "Cache-Control": "no-cache"
    }
  });

  const code = getStatusCode(resp);
  const raw = String(data || "");

  let json = null;

  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(
      `用户信息解析失败（HTTP ${code}）`
    );
  }

  if (!json?.success || !json?.detail) {
    throw new Error(
      cleanText(
        json?.message || json?.msg
      ) ||
      `用户信息请求失败（HTTP ${code}）`
    );
  }

  const user = json.detail;

  return {
    userId: String(
      user.member_id ?? userId
    ),

    name: cleanText(
      user.member_name ??
      user.username ??
      user.nickname ??
      user.name ??
      `用户${userId}`
    ),

    coin: normalizeNumber(user.coin),
    rank: normalizeNumber(user.rank),
    posts: normalizeNumber(user.nPost),
    comments: normalizeNumber(user.nComment)
  };
}

/**
 * 格式化账户信息
 */
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

/**
 * 根据签到状态生成通知标题
 */
function getResultTitle(status) {
  if (status === "success") {
    return "✅ NodeSeek 签到成功";
  }

  if (status === "already") {
    return "ℹ️ NodeSeek 今日已签到";
  }

  return "❌ NodeSeek 签到失败";
}

(async () => {
  try {
    /**
     * HTTP Request 模式：抓取 Cookie
     */
    if (typeof $request !== "undefined") {
      await captureCookie();
      return done();
    }

    /**
     * Cron 模式：执行签到
     */
    const cookie = read(KEY_COOKIE);

    if (!cookie) {
      const message =
        "❌ 未获取 Cookie" +
        "（先开启抓Cookie并访问 NodeSeek 登录页面）";

      printResult(message);

      notify(
        SCRIPT_NAME,
        "❌ 无法签到",
        message
      );

      return done();
    }

    const argumentRandom = getArg("Random");
    const storedRandom = read(KEY_RANDOM);

    const randomFlag = parseBoolean(
      argumentRandom !== null
        ? argumentRandom
        : storedRandom,
      true
    );

    write(randomFlag, KEY_RANDOM);

    const userAgent =
      cleanText(read(KEY_UA)) ||
      DEFAULT_UA;

    /**
     * 第一步：签到
     */
    const signResult = await signIn(
      cookie,
      randomFlag,
      userAgent
    );

    /**
     * 第二步：签到后查询最新账户数据
     */
    let account = null;
    let accountError = "";

    try {
      account = await getAccountInfo(
        cookie,
        userAgent
      );
    } catch (error) {
      accountError = cleanText(
        error?.message || error
      );
    }

    const title = getResultTitle(
      signResult.status
    );

    const accountLine =
      formatAccountLine(account);

    const output =
      `${title}\n` +
      `${signResult.message}\n` +
      `${accountLine}`;

    /**
     * Loon/Surge 日志
     */
    printResult(output);

    if (accountError) {
      console.log(
        `用户信息：${accountError}`
      );
    }

    /**
     * 系统通知
     *
     * 标题：✅ NodeSeek 签到成功
     * 副标题：签到成功，获得 5 鸡腿
     * 正文：账户详细信息
     */
    notify(
      title,
      signResult.message,
      accountLine
    );

    return done();
  } catch (error) {
    const message =
      `❌ 脚本异常：${String(
        error?.message
          ? error.message
          : error
      )}`;

    printResult(message);

    notify(
      SCRIPT_NAME,
      "❌ 脚本异常",
      message
    );

    return done();
  }
})();