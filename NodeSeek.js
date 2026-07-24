const SCRIPT_NAME = "NodeSeek签到";
const DOMAIN = "www.nodeseek.com";

const KEY_COOKIE = "nodeseek_cookie";
const KEY_USER_AGENT = "nodeseek_user_agent";
const KEY_RANDOM = "nodeseek_random";
const KEY_MEMBER_ID = "nodeseek_member_id";

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

function isValidNumber(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value))
  );
}

function toNumber(value, fallback = 0) {
  return isValidNumber(value)
    ? Number(value)
    : fallback;
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

    const text = $argument.trim();

    try {
      const json = JSON.parse(text);

      if (
        json &&
        typeof json === "object"
      ) {
        return json[name] ?? null;
      }
    } catch {}

    const params = {};

    text.split("&").forEach((part) => {
      const index = part.indexOf("=");

      if (index < 0) {
        return;
      }

      const key = part
        .slice(0, index)
        .trim();

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
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const text = String(value)
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

  const stored = read(KEY_RANDOM);

  const random = parseBoolean(
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
  const text = cleanText(value);

  const match = text.match(
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
    write(argumentId, KEY_MEMBER_ID);
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
 * Cookie 和 User-Agent
 * ============================== */

function normalizeCookie(value) {
  return String(value || "")
    .replace(/\r?\n/g, "; ")
    .replace(/;+\s*/g, "; ")
    .replace(/\s*;\s*$/, "")
    .trim();
}

function getCookie(headers) {
  const value = getHeader(
    headers,
    "Cookie"
  );

  if (!value) {
    return "";
  }

  return normalizeCookie(
    Array.isArray(value)
      ? value.join("; ")
      : value
  );
}

async function captureCookie() {
  const url = String(
    $request?.url || ""
  );

  if (!url.includes("nodeseek.com")) {
    return;
  }

  const headers =
    $request?.headers || {};

  const cookie =
    getCookie(headers);

  if (
    !cookie ||
    cookie.length < 20
  ) {
    return;
  }

  const userAgent = cleanText(
    getHeader(
      headers,
      "User-Agent"
    )
  );

  const oldCookie =
    read(KEY_COOKIE);

  if (cookie !== oldCookie) {
    write(cookie, KEY_COOKIE);
  }

  if (userAgent) {
    write(
      userAgent,
      KEY_USER_AGENT
    );
  }

  if (cookie !== oldCookie) {
    const message =
      "✅ Cookie 已更新";

    print(message);

    notify(
      SCRIPT_NAME,
      message,
      "Cookie 和 User-Agent 已保存"
    );
  }
}

/* ==============================
 * 请求头
 * ============================== */

function buildHeaders(
  cookie,
  userAgent,
  referer = `https://${DOMAIN}/board`
) {
  return {
    "Accept":
      "application/json, text/plain, */*",

    "Accept-Language":
      "zh-CN,zh-Hans;q=0.9",

    "Referer":
      referer,

    "X-Requested-With":
      "XMLHttpRequest",

    "User-Agent":
      userAgent || DEFAULT_USER_AGENT,

    "Cookie":
      cookie
  };
}

/* ==============================
 * 签到
 * ============================== */

function normalizeSuccessMessage(
  message,
  json
) {
  if (isValidNumber(json?.gain)) {
    return (
      `签到成功，获得 ` +
      `${Number(json.gain)} 鸡腿`
    );
  }

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
      return (
        `签到成功，获得 ` +
        `${match[1]} 鸡腿`
      );
    }
  }

  return text || "签到成功";
}

function parseSignResult(
  json,
  httpCode
) {
  const message = cleanText(
    json?.message ||
    json?.msg
  );

  const already =
    /今天已完成签到|今日已签到|已经签到|重复操作|重复签到|已签到/i
      .test(message);

  if (already) {
    return {
      status: "already",

      message:
        message ||
        "今天已完成签到，请勿重复操作",

      gain:
        isValidNumber(json?.gain)
          ? Number(json.gain)
          : null
    };
  }

  const success =
    json?.success === true ||
    isValidNumber(json?.gain) ||
    /签到成功|获得.*鸡腿|鸡腿\s*[+＋]\s*\d+/i
      .test(message);

  if (success) {
    return {
      status: "success",

      message:
        normalizeSuccessMessage(
          message,
          json
        ),

      gain:
        isValidNumber(json?.gain)
          ? Number(json.gain)
          : null
    };
  }

  return {
    status: "fail",

    message:
      message ||
      `签到失败（HTTP ${httpCode}）`,

    gain: null
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
    ...buildHeaders(
      cookie,
      userAgent,
      `https://${DOMAIN}/board`
    ),

    "Content-Type":
      "application/json;charset=utf-8",

    "Origin":
      `https://${DOMAIN}`
  };

  const {
    response,
    data
  } = await httpPost({
    url,
    headers,
    body: "{}"
  });

  const code =
    getStatusCode(response);

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

      gain: null
    };
  }

  return parseSignResult(
    json,
    code
  );
}

/* ==============================
 * HTML 处理
 * ============================== */

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
    .replace(/&#(\d+);/g, (_, code) => {
      return String.fromCharCode(
        Number(code)
      );
    })
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
  return decodeHtmlEntities(html)
    .replace(
      /<script\b[^>]*>[\s\S]*?<\/script>/gi,
      " "
    )
    .replace(
      /<style\b[^>]*>[\s\S]*?<\/style>/gi,
      " "
    )
    .replace(
      /<[^>]+>/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

/* ==============================
 * 签到奖励和排名
 * ============================== */

function parseBoardAttendance(html) {
  const source =
    htmlToText(html);

  const fullMatch = source.match(
    /今日签到获得鸡腿\s*(\d+)\s*个\s*[，,、]?\s*当前排名第\s*(\d+)/i
  );

  if (fullMatch) {
    return {
      reward:
        Number(fullMatch[1]),

      rank:
        Number(fullMatch[2])
    };
  }

  const rewardMatch = source.match(
    /今日签到获得鸡腿\s*(\d+)\s*个/i
  );

  const rankMatch = source.match(
    /当前排名第\s*(\d+)/i
  );

  const reward =
    rewardMatch?.[1]
      ? Number(rewardMatch[1])
      : null;

  const rank =
    rankMatch?.[1]
      ? Number(rankMatch[1])
      : null;

  if (
    reward === null &&
    rank === null
  ) {
    return null;
  }

  return {
    reward,
    rank
  };
}

async function getBoardAttendance(
  cookie,
  userAgent
) {
  const {
    response,
    data
  } = await httpGet({
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

      "Cache-Control":
        "no-cache",

      "Pragma":
        "no-cache"
    }
  });

  const code =
    getStatusCode(response);

  if (
    code < 200 ||
    code >= 400
  ) {
    throw new Error(
      `签到排名页面 HTTP ${code}`
    );
  }

  const attendance =
    parseBoardAttendance(data);

  if (!attendance) {
    throw new Error(
      "未识别到签到奖励和排名"
    );
  }

  return attendance;
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

  const url =
    `https://${DOMAIN}` +
    `/api/account/getInfo/${memberId}` +
    `?_=${Date.now()}`;

  const {
    response,
    data
  } = await httpGet({
    url,
    headers: {
      ...buildHeaders(
        cookie,
        userAgent,
        `https://${DOMAIN}/space/${memberId}`
      ),

      "Cache-Control":
        "no-cache"
    }
  });

  const code =
    getStatusCode(response);

  const json =
    parseJson(data);

  if (!json) {
    throw new Error(
      `用户信息解析失败（HTTP ${code}）`
    );
  }

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
    id:
      String(
        user.member_id ??
        user.id ??
        memberId
      ),

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

  return "❌ NodeSeek 签到失败";
}

function formatAttendanceLine(
  attendance,
  signResult
) {
  const reward =
    isValidNumber(attendance?.reward)
      ? Number(attendance.reward)
      : (
          isValidNumber(signResult?.gain)
            ? Number(signResult.gain)
            : null
        );

  const rank =
    isValidNumber(attendance?.rank)
      ? Number(attendance.rank)
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
      `📊 今日签到获得鸡腿 ${reward} 个`
    );
  }

  if (rank !== null) {
    return (
      `📊 当前排名第 ${rank}`
    );
  }

  return "⚠️ 签到奖励和排名获取失败";
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
     * HTTP Request 模式：
     * 抓取 Cookie 和 User-Agent
     */
    if (
      typeof $request !== "undefined"
    ) {
      await captureCookie();
      return done();
    }

    /*
     * Cron 模式
     */
    const cookie =
      read(KEY_COOKIE);

    if (!cookie) {
      const message =
        "请开启自动获取 Cookie，" +
        "然后登录或刷新 NodeSeek";

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
     * 第一步：执行签到
     */
    const signResult =
      await signIn(
        cookie,
        userAgent,
        signMode.random
      );

    /*
     * 签到成功后等待页面数据刷新
     */
    if (
      signResult.status === "success"
    ) {
      await sleep(800);
    }

    /*
     * 第二步：读取签到奖励和排名
     */
    let attendance = null;

    try {
      attendance =
        await getBoardAttendance(
          cookie,
          userAgent
        );
    } catch (error) {
      console.log(
        `签到排名：${cleanText(
          error?.message ||
          error
        )}`
      );
    }

    /*
     * 第三步：读取账户信息
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
        attendance,
        signResult
      );

    const accountLine =
      formatAccountLine(account);

    const output =
      `${title}\n` +
      `${signResult.message}\n` +
      `${attendanceLine}\n` +
      `${accountLine}`;

    print(output);

    notify(
      title,
      signResult.message,
      `${attendanceLine}\n${accountLine}`
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