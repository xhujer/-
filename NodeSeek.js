const SCRIPT_NAME = "NodeSeek签到";
const DOMAIN = "www.nodeseek.com";

const KEY_COOKIE = "nodeseek_cookie";
const KEY_USER_AGENT = "nodeseek_user_agent";
const KEY_RANDOM = "nodeseek_random";
const KEY_MEMBER_ID = "nodeseek_member_id";

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

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
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
    let result = JSON.parse(
      String(value ?? "")
    );

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
    text.includes("cloudflare ray id")
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

/* ==============================
 * Cookie 和用户信息抓取
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

function hasCookie(cookie, name) {
  const target =
    String(name).toLowerCase();

  return String(cookie || "")
    .split(";")
    .some((part) => {
      const index =
        part.indexOf("=");

      if (index <= 0) {
        return false;
      }

      return (
        part
          .slice(0, index)
          .trim()
          .toLowerCase() === target
      );
    });
}

async function captureRequest() {
  const url =
    String($request?.url || "");

  if (!url.includes("nodeseek.com")) {
    return;
  }

  const headers =
    $request?.headers || {};

  const cookie =
    getCookieFromHeaders(headers);

  const oldCookie =
    read(KEY_COOKIE) || "";

  const hasLoginCookie =
    hasCookie(cookie, "session") ||
    hasCookie(cookie, "pjwt") ||
    hasCookie(cookie, "fog");

  /*
   * 使用浏览器当前请求携带的完整 Cookie。
   * 不再合并旧 Cookie，避免保留已经失效的
   * cf_clearance 或其他旧字段。
   */
  if (
    cookie.length >= 20 &&
    (hasLoginCookie || !oldCookie)
  ) {
    if (cookie !== oldCookie) {
      write(cookie, KEY_COOKIE);
      print("✅ NodeSeek Cookie 已更新");
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

  /*
   * 访问个人主页时自动保存成员 ID。
   * 正常情况下也会从签到排行榜接口自动取得。
   */
  const memberMatch =
    url.match(/\/space\/(\d+)/i);

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

function buildCommonHeaders(
  cookie,
  userAgent,
  referer
) {
  return {
    "Accept": "*/*",

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

    "User-Agent":
      userAgent ||
      DEFAULT_USER_AGENT,

    "Cookie":
      cookie
  };
}

/* ==============================
 * 签到排行榜接口
 * ============================== */

function parseBoardData(json) {
  if (
    !json ||
    typeof json !== "object"
  ) {
    throw new Error(
      "签到排行榜返回格式无效"
    );
  }

  const record =
    json.record &&
    typeof json.record === "object"
      ? json.record
      : null;

  let signedToday = false;

  if (record) {
    const recordDate =
      chinaDateKey(
        record.created_at
      );

    signedToday =
      !recordDate ||
      recordDate === chinaDateKey();
  }

  return {
    signedToday,

    memberId:
      record?.member_id
        ? String(record.member_id)
        : "",

    gain:
      isNumber(record?.gain)
        ? Number(record.gain)
        : null,

    rank:
      isNumber(json.order)
        ? Number(json.order)
        : null,

    total:
      isNumber(json.total)
        ? Number(json.total)
        : null,

    createdAt:
      cleanText(
        record?.created_at
      )
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
        `https://${DOMAIN}/sw.js?v=0.3.34`
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
    console.log(
      `签到排行榜：${cleanText(
        error?.message ||
        error
      )}`
    );

    return null;
  }
}

/* ==============================
 * 签到接口
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

function parseSignResult(
  json,
  httpCode
) {
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

      gain
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
    `?random=${random ? "true" : "false"}`;

  /*
   * 恢复原来能够正常工作的请求格式：
   * Content-Type 为 JSON，正文为 {}。
   */
  const headers = {
    "Accept":
      "application/json, text/plain, */*",

    "Accept-Language":
      "zh-CN,zh-Hans;q=0.9,en;q=0.8",

    "Content-Type":
      "application/json;charset=utf-8",

    "Origin":
      `https://${DOMAIN}`,

    "Referer":
      `https://${DOMAIN}/board`,

    "X-Requested-With":
      "XMLHttpRequest",

    "User-Agent":
      userAgent ||
      DEFAULT_USER_AGENT,

    "Cookie":
      cookie
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

async function getBoardAfterSign(
  cookie,
  userAgent
) {
  const delays = [
    500,
    1000,
    1800
  ];

  let lastBoard = null;

  for (const delay of delays) {
    await sleep(delay);

    lastBoard =
      await getBoardDataSafe(
        cookie,
        userAgent
      );

    if (lastBoard?.signedToday) {
      return lastBoard;
    }
  }

  return lastBoard;
}

/* ==============================
 * 用户资料
 * ============================== */

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
      "未识别到成员 ID"
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
      "Accept":
        "application/json, text/plain, */*",

      "Accept-Language":
        "zh-CN,zh-Hans;q=0.9,en;q=0.8",

      "Referer":
        `https://${DOMAIN}/space/${memberId}`,

      "X-Requested-With":
        "XMLHttpRequest",

      "User-Agent":
        userAgent ||
        DEFAULT_USER_AGENT,

      "Cookie":
        cookie,

      "Cache-Control":
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
      ` | 当前排名暂未获取`
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

/* ==============================
 * 主程序
 * ============================== */

(async () => {
  try {
    /*
     * HTTP Request 模式：
     * 自动保存 Cookie、User-Agent 和个人主页 ID。
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

    console.log(
      `签到模式：${signMode.name}`
    );

    /*
     * 先查询签到排行榜。
     *
     * 今天已经签到时直接读取结果，
     * 不再重复请求签到接口，
     * 避免重复签到请求触发 Cloudflare 403。
     */
    let boardBefore =
      await getBoardDataSafe(
        cookie,
        userAgent
      );

    let boardAfter =
      boardBefore;

    let signResult;

    if (boardBefore?.signedToday) {
      signResult = {
        status: "already",

        message:
          "今天已完成签到，请勿重复操作",

        gain:
          boardBefore.gain
      };
    } else {
      /*
       * 今天尚未签到，执行签到请求。
       */
      signResult =
        await signIn(
          cookie,
          userAgent,
          signMode.random
        );

      /*
       * 签到后重新查询排行榜。
       * 接口数据可能稍有延迟，因此自动重试。
       */
      boardAfter =
        await getBoardAfterSign(
          cookie,
          userAgent
        );

      if (boardAfter?.signedToday) {
        const gain =
          isNumber(boardAfter.gain)
            ? Number(boardAfter.gain)
            : signResult.gain;

        if (
          signResult.status === "success"
        ) {
          signResult.gain = gain;

          if (gain !== null) {
            signResult.message =
              `签到成功，获得 ${gain} 鸡腿`;
          }
        } else if (
          signResult.status === "already"
        ) {
          signResult.gain = gain;
        } else if (
          boardBefore &&
          boardBefore.signedToday === false
        ) {
          /*
           * 签到前明确没有记录，
           * 签到后出现记录，可确定本次签到成功。
           */
          signResult = {
            status: "success",

            message:
              gain !== null
                ? `签到成功，获得 ${gain} 鸡腿`
                : "签到成功",

            gain
          };
        } else {
          /*
           * 签到前排行榜请求失败，无法确认之前状态。
           * 签到后发现当天记录，按已签到处理。
           */
          signResult = {
            status: "already",

            message:
              "检测到今天已经完成签到",

            gain
          };
        }
      }
    }

    const board =
      boardAfter ||
      boardBefore;

    /*
     * 成员 ID 优先从排行榜 record.member_id 获取。
     * 无需在插件中手动内置。
     */
    const memberId =
      board?.memberId ||
      cleanText(
        read(KEY_MEMBER_ID)
      );

    if (memberId) {
      write(
        memberId,
        KEY_MEMBER_ID
      );

      console.log(
        `成员 ID：${memberId}`
      );
    } else {
      console.log(
        "成员 ID：未识别"
      );
    }

    /*
     * 获取昵称、总鸡腿、等级、帖子和评论。
     */
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
        console.log(
          `用户信息：${cleanText(
            error?.message ||
            error
          )}`
        );
      }
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
      formatAccountLine(account);

    let extra = "";

    if (
      signResult.status === "cloudflare"
    ) {
      extra =
        "\nCookie 或 Cloudflare 验证已失效，请开启自动获取 Cookie 后刷新一次 NodeSeek";
    }

    const output =
      `${title}\n` +
      `${signResult.message}\n` +
      `${boardLine}\n` +
      `${accountLine}` +
      extra;

    print(output);

    notify(
      title,
      signResult.message,
      `${boardLine}\n` +
      `${accountLine}` +
      extra
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