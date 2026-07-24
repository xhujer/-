const SCRIPT_NAME = "NodeSeek签到";
const DOMAIN = "www.nodeseek.com";

const KEY_COOKIE = "nodeseek_cookie";
const KEY_UA = "nodeseek_user_agent";
const KEY_RANDOM = "nodeseek_random";
const KEY_USER_ID = "nodeseek_user_id";
const KEY_USERNAME = "nodeseek_username";

const DEFAULT_UA =
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

function notify(title, subtitle = "", body = "") {
  let text = cleanText(body);

  if (text.length > 900) {
    text = text.slice(0, 900) + "…";
  }

  $notification.post(
    cleanText(title) || SCRIPT_NAME,
    cleanText(subtitle),
    text
  );
}

function print(text) {
  const output = cleanText(text);

  if (output) {
    console.log(output);
  }
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

function parseJson(text) {
  try {
    return JSON.parse(String(text || ""));
  } catch {
    return null;
  }
}

function hasNumber(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value))
  );
}

function numberValue(value, fallback = 0) {
  return hasNumber(value)
    ? Number(value)
    : fallback;
}

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

/**
 * 兼容：
 * 1. Loon argument=[{Random}]
 * 2. Random=true
 * 3. JSON 参数
 */
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
      typeof $argument === "string" &&
      $argument.trim()
    ) {
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

        const raw = part.slice(
          index + 1
        );

        try {
          params[key] =
            decodeURIComponent(raw);
        } catch {
          params[key] = raw;
        }
      });

      return params[name] ?? null;
    }
  } catch {}

  return null;
}

function parseBoolean(
  value,
  fallback = true
) {
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

function buildHeaders(
  cookie,
  userAgent,
  referer = `https://${DOMAIN}/board`
) {
  return {
    "Accept":
      "application/json, text/plain, */*",

    "Referer": referer,

    "X-Requested-With":
      "XMLHttpRequest",

    "User-Agent":
      userAgent || DEFAULT_UA,

    "Cookie": cookie
  };
}

/**
 * 自动保存 Cookie 和真实 User-Agent
 */
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
    write(
      cookie,
      KEY_COOKIE
    );
  }

  if (userAgent) {
    write(
      userAgent,
      KEY_UA
    );
  }

  if (cookie !== oldCookie) {
    const message =
      "✅ Cookie 已更新";

    print(message);

    notify(
      SCRIPT_NAME,
      message,
      "可以关闭自动获取Cookie开关"
    );
  }
}

/**
 * 解析签到接口返回
 */
function parseSignResult(
  json,
  httpCode
) {
  const message = cleanText(
    json?.message ||
    json?.msg
  );

  const already =
    /今日已签到|已经签到|已完成签到|重复签到|已签到/i
      .test(message);

  if (already) {
    return {
      status: "already",

      message:
        message ||
        "今日已经签到",

      current:
        hasNumber(json?.current)
          ? Number(json.current)
          : null
    };
  }

  const success =
    json?.success === true ||
    hasNumber(json?.gain) ||
    /签到成功|获得.*鸡腿|午饭\+?\d+.*鸡腿/i
      .test(message);

  if (success) {
    let resultMessage =
      message || "签到成功";

    if (hasNumber(json?.gain)) {
      resultMessage =
        `签到成功，获得 ${Number(
          json.gain
        )} 鸡腿`;
    } else {
      const match = message.match(
        /(?:获得|得到|奖励|增加|午饭\+?)\s*[+＋]?\s*(\d+)\s*(?:个|只)?\s*鸡腿/i
      );

      if (match?.[1]) {
        resultMessage =
          `签到成功，获得 ${match[1]} 鸡腿`;
      }
    }

    return {
      status: "success",

      message: resultMessage,

      current:
        hasNumber(json?.current)
          ? Number(json.current)
          : null
    };
  }

  return {
    status: "fail",

    message:
      message ||
      `签到失败（HTTP ${httpCode}）`,

    current: null
  };
}

/**
 * 执行随机签到或固定签到
 */
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
      userAgent
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

    body: JSON.stringify({
      content: []
    })
  });

  const code =
    getStatusCode(response);

  const json =
    parseJson(data);

  if (!json) {
    return {
      status: "fail",

      message:
        `解析失败（HTTP ${code}）：` +
        (
          cleanText(data)
            .slice(0, 160) ||
          "（空响应）"
        ),

      current: null
    };
  }

  return parseSignResult(
    json,
    code
  );
}

function decodeName(value) {
  const text =
    cleanText(value);

  try {
    return JSON.parse(
      `"${text.replace(
        /"/g,
        '\\"'
      )}"`
    );
  } catch {
    return text.replace(
      /\\u([0-9a-fA-F]{4})/g,
      (_, hex) =>
        String.fromCharCode(
          parseInt(hex, 16)
        )
    );
  }
}

/**
 * 从 Board 页面中的 meCard 获取当前登录用户
 */
function parseCurrentUser(html) {
  const source = String(
    html || ""
  )
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/gi, '"')
    .replace(/&amp;/gi, "&");

  const index =
    source.indexOf("meCard");

  if (index < 0) {
    return null;
  }

  const block = source.slice(
    index,
    index + 12000
  );

  const idMatch = block.match(
    /(?:["']member_id["']|\bmember_id)\s*:\s*["']?(\d+)/i
  );

  const nameMatch = block.match(
    /(?:["']member_name["']|\bmember_name)\s*:\s*["']((?:\\.|[^"'])+)["']/i
  );

  const id =
    idMatch?.[1] || "";

  const name =
    nameMatch?.[1]
      ? decodeName(nameMatch[1])
      : "";

  return id
    ? { id, name }
    : null;
}

/**
 * 请求 Board 页面识别当前用户 ID
 */
async function getCurrentUser(
  cookie,
  userAgent
) {
  let user = null;

  try {
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
          userAgent
        ),

        "Accept":
          "text/html,application/xhtml+xml," +
          "application/xml;q=0.9,*/*;q=0.8",

        "Cache-Control":
          "no-cache"
      }
    });

    const code =
      getStatusCode(response);

    if (
      code >= 200 &&
      code < 400
    ) {
      user =
        parseCurrentUser(data);
    }
  } catch {}

  const id = cleanText(
    user?.id ||
    read(KEY_USER_ID)
  );

  const name = cleanText(
    user?.name ||
    read(KEY_USERNAME)
  );

  if (id) {
    write(
      id,
      KEY_USER_ID
    );
  }

  if (name) {
    write(
      name,
      KEY_USERNAME
    );
  }

  return {
    id,
    name
  };
}

/**
 * 获取昵称、鸡腿、等级、帖子和评论
 */
async function getAccountInfo(
  cookie,
  userAgent,
  currentCoin
) {
  const currentUser =
    await getCurrentUser(
      cookie,
      userAgent
    );

  if (
    !/^\d+$/.test(
      currentUser.id
    )
  ) {
    throw new Error(
      "未识别到当前用户ID"
    );
  }

  const {
    response,
    data
  } = await httpGet({
    url:
      `https://${DOMAIN}` +
      `/api/account/getInfo/` +
      `${currentUser.id}` +
      `?_=${Date.now()}`,

    headers: {
      ...buildHeaders(
        cookie,
        userAgent
      ),

      "Cache-Control":
        "no-cache"
    }
  });

  const code =
    getStatusCode(response);

  const json =
    parseJson(data);

  if (
    !json?.success ||
    !json?.detail
  ) {
    throw new Error(
      cleanText(
        json?.message ||
        json?.msg
      ) ||
      `用户信息获取失败（HTTP ${code}）`
    );
  }

  const user =
    json.detail;

  const name = cleanText(
    user.member_name ||
    user.username ||
    user.nickname ||
    currentUser.name ||
    `用户${currentUser.id}`
  );

  if (name) {
    write(
      name,
      KEY_USERNAME
    );
  }

  return {
    name,

    coin:
      hasNumber(currentCoin)
        ? Number(currentCoin)
        : numberValue(user.coin),

    rank:
      numberValue(user.rank),

    posts:
      numberValue(user.nPost),

    comments:
      numberValue(user.nComment)
  };
}

function resultTitle(status) {
  if (status === "success") {
    return "✅ NodeSeek 签到成功";
  }

  if (status === "already") {
    return "ℹ️ NodeSeek 今日已签到";
  }

  return "❌ NodeSeek 签到失败";
}

function accountLine(
  account,
  currentCoin
) {
  if (account) {
    return (
      `👤 ${account.name}` +
      ` | 🍗 ${account.coin} 鸡腿` +
      ` | 🏅 Lv.${account.rank}` +
      ` | 📝 ${account.posts} 帖` +
      ` | 💬 ${account.comments} 评论`
    );
  }

  if (hasNumber(currentCoin)) {
    return (
      `🍗 ${Number(currentCoin)} 鸡腿` +
      ` | ⚠️ 其他用户信息获取失败`
    );
  }

  return "⚠️ 用户信息获取失败";
}

(async () => {
  try {
    /**
     * HTTP Request 模式：
     * 自动抓取 Cookie
     */
    if (
      typeof $request !==
      "undefined"
    ) {
      await captureCookie();
      return done();
    }

    /**
     * Cron 模式：
     * 执行签到
     */
    const cookie =
      read(KEY_COOKIE);

    if (!cookie) {
      const message =
        "❌ 未获取 Cookie" +
        "（请开启自动获取Cookie并访问 NodeSeek）";

      print(message);

      notify(
        SCRIPT_NAME,
        "❌ 无法签到",
        message
      );

      return done();
    }

    const userAgent =
      cleanText(
        read(KEY_UA)
      ) ||
      DEFAULT_UA;

    const mode =
      getSignMode();

    console.log(
      `签到模式：${mode.name}`
    );

    const signResult =
      await signIn(
        cookie,
        userAgent,
        mode.random
      );

    let account = null;

    try {
      account =
        await getAccountInfo(
          cookie,
          userAgent,
          signResult.current
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
      resultTitle(
        signResult.status
      );

    const userLine =
      accountLine(
        account,
        signResult.current
      );

    const output =
      `${title}\n` +
      `${signResult.message}\n` +
      `${userLine}`;

    print(output);

    notify(
      title,
      signResult.message,
      userLine
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