const SCRIPT_NAME = "NodeSeek签到";
const DOMAIN = "www.nodeseek.com";

const KEY_COOKIE = "nodeseek_cookie";
const KEY_USER_AGENT = "nodeseek_user_agent";
const KEY_RANDOM = "nodeseek_random";
const KEY_MEMBER_ID = "nodeseek_verified_member_id";
const KEY_AUTH_SIGNATURE = "nodeseek_auth_signature";
const KEY_CAPTURE_NOTIFY_TIME = "nodeseek_capture_notify_time";

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
  return isNumber(value)
    ? Number(value)
    : 0;
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

  const random = parseBoolean(
    argument ?? read(KEY_RANDOM),
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

function parseCookie(cookie) {
  const map = {};

  String(cookie || "")
    .split(";")
    .forEach((part) => {
      const index =
        part.indexOf("=");

      if (index <= 0) {
        return;
      }

      const key = part
        .slice(0, index)
        .trim()
        .toLowerCase();

      const value = part
        .slice(index + 1)
        .trim();

      if (key) {
        map[key] = value;
      }
    });

  return map;
}

function hasAuthCookie(cookieMap) {
  return Boolean(
    cookieMap.session ||
    cookieMap.pjwt ||
    cookieMap.fog ||
    cookieMap.cf_clearance
  );
}

function buildAuthSignature(cookieMap) {
  return [
    "session",
    "pjwt",
    "fog",
    "cf_clearance"
  ]
    .map((name) => {
      return (
        `${name}=` +
        (cookieMap[name] || "")
      );
    })
    .join("|");
}

function isNodeSeekUrl(url) {
  return /^https?:\/\/(?:www\.)?nodeseek\.com\//i
    .test(String(url || ""));
}

function isFogUrl(url) {
  return /\/edge-cgi\/fog(?:[?#]|$)/i
    .test(String(url || ""));
}

function isBrowserUserAgent(userAgent) {
  const value =
    String(userAgent || "");

  return (
    /Mozilla\/5\.0/i.test(value) &&
    /Safari/i.test(value) &&
    !/Loon|Quantumult|Surge|Shadowrocket|Stash/i
      .test(value)
  );
}

function canSendCaptureNotice() {
  const now = Date.now();

  const last = Number(
    read(KEY_CAPTURE_NOTIFY_TIME) || 0
  );

  if (now - last < 10000) {
    return false;
  }

  write(now, KEY_CAPTURE_NOTIFY_TIME);

  return true;
}

async function captureRequest() {
  const url =
    String($request?.url || "");

  if (
    !isNodeSeekUrl(url) ||
    isFogUrl(url)
  ) {
    return;
  }

  const headers =
    $request?.headers || {};

  const cookie =
    getCookieFromHeaders(headers);

  const userAgent =
    cleanText(
      getHeader(
        headers,
        "User-Agent"
      )
    );

  const oldCookie =
    read(KEY_COOKIE) || "";

  const oldUserAgent =
    cleanText(
      read(KEY_USER_AGENT)
    );

  if (
    isBrowserUserAgent(userAgent) &&
    userAgent !== oldUserAgent
  ) {
    write(
      userAgent,
      KEY_USER_AGENT
    );
  }

  if (cookie.length < 20) {
    return;
  }

  const cookieMap =
    parseCookie(cookie);

  if (!hasAuthCookie(cookieMap)) {
    return;
  }

  const newSignature =
    buildAuthSignature(cookieMap);

  const oldSignature =
    read(KEY_AUTH_SIGNATURE) ||
    (
      oldCookie
        ? buildAuthSignature(
            parseCookie(oldCookie)
          )
        : ""
    );

  if (cookie !== oldCookie) {
    write(
      cookie,
      KEY_COOKIE
    );
  }

  write(
    newSignature,
    KEY_AUTH_SIGNATURE
  );

  if (
    newSignature !== oldSignature &&
    canSendCaptureNotice()
  ) {
    notify(
      "NodeSeek",
      "✅ 身份信息已更新",
      "Cookie：已更新\n" +
      `User-Agent：${
        read(KEY_USER_AGENT)
          ? "已获取"
          : "未获取"
      }`
    );
  }
}

function buildCommonHeaders(
  cookie,
  userAgent,
  referer
) {
  return {
    "Accept":
      "application/json, text/plain, */*",

    "Accept-Language":
      "zh-CN,zh-Hans;q=0.9,en;q=0.8",

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
  const payload =
    (
      json?.data &&
      typeof json.data === "object"
    )
      ? {
          ...json,
          ...json.data
        }
      : json;

  const message =
    cleanText(
      payload?.message ||
      payload?.msg
    );

  const gain =
    isNumber(payload?.gain)
      ? Number(payload.gain)
      : extractGain(message);

  if (
    /今天已完成签到|今日已签到|已经签到|重复操作|重复签到|已签到/i
      .test(message)
  ) {
    return {
      status: "already",
      message:
        message ||
        "今天已完成签到",
      gain
    };
  }

  if (
    payload?.success === true ||
    gain !== null ||
    /签到成功|获得.*鸡腿/i
      .test(message)
  ) {
    return {
      status: "success",
      message:
        message ||
        "签到成功",
      gain
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
    `?random=${
      random
        ? "true"
        : "false"
    }`;

  const {
    response,
    data
  } = await httpPost({
    url,

    headers: {
      ...buildCommonHeaders(
        cookie,
        userAgent,
        `https://${DOMAIN}/board`
      ),

      "Content-Type":
        "application/json;charset=utf-8",

      "Origin":
        `https://${DOMAIN}`
    },

    body: "{}"
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
        `签到接口被 Cloudflare 拦截（HTTP ${code}）`,

      gain: null
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
            .slice(0, 120) ||
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

function parseBoardData(json) {
  if (
    !json ||
    typeof json !== "object"
  ) {
    throw new Error(
      "签到排行榜返回格式无效"
    );
  }

  const source =
    (
      json.data &&
      typeof json.data === "object"
    )
      ? json.data
      : json;

  const record =
    source.record &&
    typeof source.record === "object"
      ? source.record
      : null;

  return {
    memberId:
      record?.member_id
        ? String(record.member_id)
        : "",

    gain:
      isNumber(record?.gain)
        ? Number(record.gain)
        : null,

    rank:
      isNumber(source.order)
        ? Number(source.order)
        : null
  };
}

async function getBoardData(
  cookie,
  userAgent
) {
  const {
    response,
    data
  } = await httpGet({
    url:
      `https://${DOMAIN}` +
      `/api/attendance/board` +
      `?page=1&_=${Date.now()}`,

    headers: {
      ...buildCommonHeaders(
        cookie,
        userAgent,
        `https://${DOMAIN}/board`
      ),

      "Cache-Control":
        "no-cache",

      "Pragma":
        "no-cache"
    }
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
      `签到排行榜被 Cloudflare 拦截（HTTP ${code}）`
    );
  }

  const json =
    parseJson(data);

  if (!json) {
    throw new Error(
      `签到排行榜解析失败（HTTP ${code}）`
    );
  }

  const board =
    parseBoardData(json);

  if (board.memberId) {
    write(
      board.memberId,
      KEY_MEMBER_ID
    );
  }

  return board;
}

async function getBoardDataSafe(
  cookie,
  userAgent
) {
  try {
    return await getBoardData(
      cookie,
      userAgent
    );
  } catch (error) {
    print(
      `签到排行榜：${cleanText(
        error?.message ||
        error
      )}`
    );

    return null;
  }
}

async function getAccountInfo(
  cookie,
  userAgent,
  memberId
) {
  if (
    !/^\d+$/.test(
      String(memberId || "")
    )
  ) {
    throw new Error(
      "未识别到可信成员 ID"
    );
  }

  const {
    response,
    data
  } = await httpGet({
    url:
      `https://${DOMAIN}` +
      `/api/account/getInfo/${memberId}` +
      `?_=${Date.now()}`,

    headers: {
      ...buildCommonHeaders(
        cookie,
        userAgent,
        `https://${DOMAIN}/space/${memberId}`
      ),

      "Cache-Control":
        "no-cache",

      "Pragma":
        "no-cache"
    }
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
      `用户信息被 Cloudflare 拦截（HTTP ${code}）`
    );
  }

  const json =
    parseJson(data);

  const user =
    json?.detail ||
    json?.data?.detail ||
    json?.data ||
    json?.user ||
    null;

  if (
    !user ||
    typeof user !== "object"
  ) {
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
      numberOrZero(
        user.coin ??
        user.chicken ??
        user.credit
      ),

    rank:
      numberOrZero(
        user.rank ??
        user.level
      ),

    posts:
      numberOrZero(
        user.nPost ??
        user.postCount ??
        user.posts
      ),

    comments:
      numberOrZero(
        user.nComment ??
        user.commentCount ??
        user.comments
      )
  };
}

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

function formatBoardLine(
  board,
  signResult
) {
  const gain =
    isNumber(board?.gain)
      ? Number(board.gain)
      : (
          isNumber(signResult?.gain)
            ? Number(signResult.gain)
            : null
        );

  const rank =
    isNumber(board?.rank)
      ? Number(board.rank)
      : null;

  if (
    gain !== null &&
    rank !== null
  ) {
    return (
      `📊 今日签到获得鸡腿 ${gain} 个` +
      ` | 当前排名第 ${rank}`
    );
  }

  if (gain !== null) {
    return (
      `📊 今日签到获得鸡腿 ${gain} 个` +
      " | 当前排名暂未获取"
    );
  }

  if (rank !== null) {
    return (
      `📊 当前排名第 ${rank}`
    );
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
    if (
      typeof $request !== "undefined"
    ) {
      await captureRequest();
      return done({});
    }

    const cookie =
      read(KEY_COOKIE);

    if (!cookie) {
      const message =
        "请开启自动获取 Cookie，然后在 Safari 登录并刷新 NodeSeek";

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

    print(
      `签到模式：${signMode.name}`
    );

    const signResult =
      await signIn(
        cookie,
        userAgent,
        signMode.random
      );

    if (
      signResult.status ===
      "cloudflare"
    ) {
      const title =
        getResultTitle(
          signResult.status
        );

      const extra =
        "Cookie 或 Cloudflare 验证已失效，请在 Safari 刷新一次 NodeSeek";

      print(
        `${title}\n` +
        `${signResult.message}\n` +
        `${extra}`
      );

      notify(
        title,
        signMode.name,
        `${signResult.message}\n${extra}`
      );

      return done();
    }

    if (
      signResult.status ===
      "fail"
    ) {
      const title =
        getResultTitle(
          signResult.status
        );

      print(
        `${title}\n` +
        `${signResult.message}`
      );

      notify(
        title,
        signMode.name,
        signResult.message
      );

      return done();
    }

    const board =
      await getBoardDataSafe(
        cookie,
        userAgent
      );

    const memberId =
      board?.memberId ||
      cleanText(
        read(KEY_MEMBER_ID)
      );

    let account = null;

    if (memberId) {
      try {
        account =
          await getAccountInfo(
            cookie,
            userAgent,
            memberId
          );
      } catch (error) {
        print(
          `用户信息：${cleanText(
            error?.message ||
            error
          )}`
        );
      }
    }

    if (
      isNumber(board?.gain)
    ) {
      signResult.gain =
        Number(board.gain);
    }

    const title =
      getResultTitle(
        signResult.status
      );

    const boardLine =
      formatBoardLine(
        board,
        signResult
      );

    const accountLine =
      formatAccountLine(
        account
      );

    print(
      `${title}\n` +
      `${boardLine}\n` +
      `${accountLine}`
    );

    notify(
      title,
      signMode.name,
      `${boardLine}\n` +
      `${accountLine}`
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