/**
 * HDHive / 影巢 Server Action Token 逆向探针（Loon）
 *
 * 目的：
 * 1. 删除旧 hdh_sa_token 后访问首页、登录页，确认纯 HTTP GET 能否签发新票据。
 * 2. 如果本地提供了账号密码，再测试一次“登录 Server Action -> 首页”的签发链路。
 * 3. 全程不调用 checkIn，不会执行每日签到，也不会在日志中输出 Cookie、Token 或密码。
 *
 * 同一脚本同时支持：
 * - http-request：打开 HDHive 时自动保存登录 Cookie 与 User-Agent
 * - cron：执行 Token 签发探测
 *
 * 默认复用/保存：
 * - hdhive_cookie_v15
 * - hdhive_ua_v15
 *
 * 可选登录探测参数：
 * - hdhive_username_v1
 * - hdhive_password_v1
 *
 * 探测结果：
 * - hdhive_token_probe_report_v1
 * - hdhive_cookie_probe_v1
 * - hdhive_sa_token_probe_v1
 */

const NAME = "HDHive Token 逆向探针";
const BASE_URL = "https://hdhive.com";
const ACTION_RESOLVER_URL = "https://hdhive.ckid.workers.dev/";

const DEFAULT_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 " +
  "Mobile/15E148 Safari/604.1";

const KEY = {
  cookie: "hdhive_cookie_v15",
  ua: "hdhive_ua_v15",
  username: "hdhive_username_v1",
  password: "hdhive_password_v1",
  probeCookie: "hdhive_cookie_probe_v1",
  probeToken: "hdhive_sa_token_probe_v1",
  report: "hdhive_token_probe_report_v1",
};

const reports = [];
let sawChallenge = false;

/* ==============================
 * Cookie 管理
 * ============================== */

class CookieJar {
  constructor(cookieHeader) {
    this.cookies = {};
    this.importCookieHeader(cookieHeader || "");
  }

  importCookieHeader(cookieHeader) {
    const ignored = {
      path: true,
      domain: true,
      expires: true,
      "max-age": true,
      secure: true,
      httponly: true,
      samesite: true,
    };

    String(cookieHeader)
      .split(/;\s*/)
      .forEach((item) => {
        const index = item.indexOf("=");

        if (index <= 0) return;

        const name = item.slice(0, index).trim();
        const value = item.slice(index + 1).trim();

        if (!name || ignored[name.toLowerCase()]) return;

        this.cookies[name] = value;
      });
  }

  remove(name) {
    delete this.cookies[name];
  }

  get(name) {
    return this.cookies[name] || "";
  }

  has(name) {
    return Object.prototype.hasOwnProperty.call(this.cookies, name);
  }

  toHeader() {
    return Object.keys(this.cookies)
      .map((name) => `${name}=${this.cookies[name]}`)
      .join("; ");
  }

  absorbResponseHeaders(headers) {
    const lines = getSetCookieLines(headers);
    const changedNames = [];

    lines.forEach((line) => {
      const firstPart = line.split(";", 1)[0];
      const index = firstPart.indexOf("=");

      if (index <= 0) return;

      const name = firstPart.slice(0, index).trim();
      const value = firstPart.slice(index + 1).trim();

      const maxAgeMatch = line.match(/;\s*Max-Age=(-?\d+)/i);
      const expiresMatch = line.match(/;\s*Expires=([^;]+)/i);

      const deleteByAge =
        maxAgeMatch && Number(maxAgeMatch[1]) <= 0;

      const deleteByExpiry =
        !maxAgeMatch &&
        expiresMatch &&
        !Number.isNaN(Date.parse(expiresMatch[1])) &&
        Date.parse(expiresMatch[1]) <= Date.now();

      if (deleteByAge || deleteByExpiry || value === "") {
        delete this.cookies[name];
      } else {
        this.cookies[name] = value;
      }

      changedNames.push(name);
    });

    return unique(changedNames);
  }
}

/* ==============================
 * 通用工具
 * ============================== */

function unique(values) {
  return values.filter(
    (value, index) => values.indexOf(value) === index
  );
}

function getHeader(headers, wantedName) {
  const source = headers || {};
  const wanted = wantedName.toLowerCase();

  const key = Object.keys(source).find(
    (name) => name.toLowerCase() === wanted
  );

  return key ? source[key] : "";
}

function getSetCookieLines(headers) {
  const raw = getHeader(headers, "set-cookie");
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const lines = [];

  values.forEach((value) => {
    String(value)
      .split(/\r?\n/)
      .forEach((physicalLine) => {
        physicalLine
          .split(/,(?=\s*[A-Za-z0-9_!#$%&'*+\-.^`|~]+=)/)
          .forEach((cookieLine) => {
            const trimmed = cookieLine.trim();

            if (trimmed) {
              lines.push(trimmed);
            }
          });
      });
  });

  return lines;
}

function parseArgument(text) {
  if (!text || typeof text !== "string") {
    return {};
  }

  const trimmed = text.trim();

  if (!trimmed) {
    return {};
  }

  if (trimmed[0] === "{") {
    try {
      return JSON.parse(trimmed);
    } catch (_) {
      return {};
    }
  }

  const result = {};

  trimmed.split("&").forEach((part) => {
    const index = part.indexOf("=");

    if (index <= 0) return;

    const key = decodeURIComponent(
      part.slice(0, index).replace(/\+/g, " ")
    );

    const value = decodeURIComponent(
      part.slice(index + 1).replace(/\+/g, " ")
    );

    result[key] = value;
  });

  return result;
}

function readArguments() {
  if (
    typeof $argument === "undefined" ||
    $argument === null
  ) {
    return {};
  }

  if (typeof $argument === "object") {
    return $argument;
  }

  return parseArgument(String($argument));
}

function isChallenge(status, body) {
  const text = String(body || "").toLowerCase();

  return (
    status === 403 ||
    status === 503 ||
    text.includes("正在检测浏览器安全能力") ||
    text.includes("just a moment") ||
    text.includes("checking your browser") ||
    text.includes("/cdn-cgi/challenge-platform") ||
    text.includes("cf-chl-") ||
    text.includes("challenge-form")
  );
}

function safeBodyHint(body) {
  const text = String(body || "");

  if (text.includes("action_token_invalid")) {
    return "action_token_invalid";
  }

  if (text.includes("Server action not found")) {
    return "server_action_not_found";
  }

  if (text.includes("用户名或密码错误")) {
    return "bad_credentials";
  }

  if (text.includes("请求参数错误")) {
    return "bad_request";
  }

  if (text.includes("请先登录")) {
    return "login_required";
  }

  if (text.includes("NEXT_REDIRECT")) {
    return "next_redirect";
  }

  return "";
}

/* ==============================
 * HTTP 请求
 * ============================== */

function request(method, options) {
  return new Promise((resolve, reject) => {
    const clientMethod = String(method).toLowerCase();
    const sender = $httpClient[clientMethod];

    if (typeof sender !== "function") {
      reject(new Error(`Loon 不支持 HTTP ${method}`));
      return;
    }

    sender(options, (error, response, data) => {
      if (error) {
        reject(new Error(String(error)));
        return;
      }

      resolve({
        status: Number(
          (response &&
            (response.status || response.statusCode)) ||
            0
        ),
        headers: (response && response.headers) || {},
        body: data || "",
      });
    });
  });
}

function buildDocumentHeaders(ua, jar, referer) {
  const headers = {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9," +
      "image/avif,image/webp,image/apng,*/*;q=0.8",

    "Accept-Language":
      "zh-CN,zh;q=0.9,en;q=0.7",

    "Cache-Control": "no-cache",

    Pragma: "no-cache",

    "Upgrade-Insecure-Requests": "1",

    "User-Agent": ua,
  };

  const cookie = jar.toHeader();

  if (cookie) {
    headers.Cookie = cookie;
  }

  if (referer) {
    headers.Referer = referer;
  }

  return headers;
}

/* ==============================
 * 页面 GET 探测
 * ============================== */

async function documentGet(
  label,
  path,
  ua,
  jar,
  referer
) {
  const separator = path.includes("?") ? "&" : "?";

  const url =
    `${BASE_URL}${path}` +
    `${separator}_loon_probe=${Date.now()}`;

  const response = await request("get", {
    url,
    timeout: 20000,
    alpn: "h2",
    "auto-cookie": false,
    "auto-redirect": false,
    headers: buildDocumentHeaders(
      ua,
      jar,
      referer
    ),
  });

  const setCookieNames =
    jar.absorbResponseHeaders(response.headers);

  const challenge = isChallenge(
    response.status,
    response.body
  );

  sawChallenge = sawChallenge || challenge;

  const entry = {
    step: label,
    status: response.status,
    challenge,
    setCookieNames,
    hasSaToken: jar.has("hdh_sa_token"),
    location: Boolean(
      getHeader(
        response.headers,
        "location"
      )
    ),
    hint: safeBodyHint(response.body),
  };

  reports.push(entry);

  console.log(
    `[${NAME}] ${label}: ` +
      `HTTP ${entry.status}; ` +
      `Set-Cookie=[${setCookieNames.join(", ") || "无"}]; ` +
      `SA-Token=${entry.hasSaToken ? "有" : "无"}; ` +
      `Challenge=${challenge ? "是" : "否"}`
  );

  return response;
}

/* ==============================
 * 动态获取 Server Action ID
 * ============================== */

async function discoverAction(
  actionName,
  path
) {
  const response = await request("post", {
    url: ACTION_RESOLVER_URL,
    timeout: 15000,
    "auto-cookie": false,
    "auto-redirect": false,

    headers: {
      Accept: "application/json",
      "Content-Type":
        "application/json",
    },

    body: JSON.stringify({
      domain: "hdhive.com",
      path,
      actionName,
    }),
  });

  if (response.status !== 200) {
    throw new Error(
      `Action 解析服务 HTTP ${response.status}`
    );
  }

  let payload;

  try {
    payload = JSON.parse(response.body);
  } catch (_) {
    throw new Error(
      "Action 解析服务返回了非 JSON 内容"
    );
  }

  const actionId =
    payload && payload.actionId;

  if (
    !actionId ||
    !/^[A-Fa-f0-9]{20,128}$/.test(
      String(actionId)
    )
  ) {
    throw new Error(
      "未解析到有效的 login Server Action ID"
    );
  }

  return String(actionId);
}

/* ==============================
 * 登录 Server Action 探测
 * ============================== */

async function loginProbe(
  username,
  password,
  ua
) {
  const jar = new CookieJar("");

  console.log(
    `[${NAME}] 启动匿名登录链路探测，凭据只发送给 hdhive.com`
  );

  await documentGet(
    "匿名登录页 GET",
    "/login",
    ua,
    jar,
    ""
  );

  if (jar.has("hdh_sa_token")) {
    return {
      jar,
      stage: "匿名登录页 GET",
    };
  }

  if (sawChallenge) {
    return {
      jar,
      stage: "",
    };
  }

  const loginAction =
    await discoverAction(
      "login",
      "/login"
    );

  const headers = {
    Accept: "text/x-component",

    "Accept-Language":
      "zh-CN,zh;q=0.9,en;q=0.7",

    "Content-Type":
      "text/plain;charset=UTF-8",

    Origin: BASE_URL,

    Referer:
      `${BASE_URL}/login`,

    "User-Agent": ua,

    "Next-Action": loginAction,
  };

  const cookie = jar.toHeader();

  if (cookie) {
    headers.Cookie = cookie;
  }

  const response = await request(
    "post",
    {
      url: `${BASE_URL}/login`,
      timeout: 25000,
      alpn: "h2",
      "auto-cookie": false,
      "auto-redirect": false,
      headers,

      body: JSON.stringify([
        {
          username,
          password,
        },
        "/",
      ]),
    }
  );

  const setCookieNames =
    jar.absorbResponseHeaders(
      response.headers
    );

  const challenge = isChallenge(
    response.status,
    response.body
  );

  sawChallenge = sawChallenge || challenge;

  const hint =
    safeBodyHint(response.body);

  reports.push({
    step: "登录 Server Action POST",
    status: response.status,
    challenge,
    setCookieNames,
    hasSaToken:
      jar.has("hdh_sa_token"),
    location: Boolean(
      getHeader(
        response.headers,
        "location"
      )
    ),
    hint,
  });

  console.log(
    `[${NAME}] 登录 POST: ` +
      `HTTP ${response.status}; ` +
      `Set-Cookie=[${setCookieNames.join(", ") || "无"}]; ` +
      `SA-Token=${jar.has("hdh_sa_token") ? "有" : "无"}; ` +
      `Hint=${hint || "无"}`
  );

  if (
    hint === "bad_credentials" ||
    hint === "bad_request"
  ) {
    throw new Error(
      hint === "bad_credentials"
        ? "用户名或密码错误"
        : "登录参数错误"
    );
  }

  if (jar.has("hdh_sa_token")) {
    return {
      jar,
      stage:
        "登录 Server Action POST",
    };
  }

  if (challenge) {
    return {
      jar,
      stage: "",
    };
  }

  await documentGet(
    "登录后首页 GET",
    "/",
    ua,
    jar,
    `${BASE_URL}/login`
  );

  return {
    jar,
    stage: jar.has("hdh_sa_token")
      ? "登录后首页 GET"
      : "",
  };
}

/* ==============================
 * 保存探测结果
 * ============================== */

function saveSuccess(
  jar,
  stage
) {
  const token =
    jar.get("hdh_sa_token");

  if (!token) {
    return false;
  }

  $persistentStore.write(
    jar.toHeader(),
    KEY.probeCookie
  );

  $persistentStore.write(
    token,
    KEY.probeToken
  );

  $persistentStore.write(
    JSON.stringify({
      success: true,
      stage,
      tokenLength:
        token.length,
      reports,
      testedAt:
        new Date().toISOString(),
    }),
    KEY.report
  );

  return true;
}

function saveFailure(reason) {
  $persistentStore.write(
    JSON.stringify({
      success: false,
      reason,
      reports,
      testedAt:
        new Date().toISOString(),
    }),
    KEY.report
  );
}

/* ==============================
 * 主流程
 * ============================== */

async function main() {
  const argument =
    readArguments();

  const ua =
    $persistentStore.read(KEY.ua) ||
    argument.ua ||
    DEFAULT_UA;

  const storedCookie =
    $persistentStore.read(
      KEY.cookie
    ) || "";

  const username =
    argument.username ||
    $persistentStore.read(
      KEY.username
    ) ||
    "";

  const password =
    argument.password ||
    $persistentStore.read(
      KEY.password
    ) ||
    "";

  const jar =
    new CookieJar(storedCookie);

  const hadStoredToken =
    jar.has("hdh_sa_token");

  /*
   * 主动删除旧票据。
   * 这样才能判断服务器是否能自动签发新票据。
   */
  jar.remove("hdh_sa_token");

  console.log(
    `[${NAME}] 开始；` +
      `已有会话 Cookie=${storedCookie ? "是" : "否"}；` +
      `已主动移除旧 SA-Token=${hadStoredToken ? "是" : "否"}`
  );

  /* ---------- 已有会话首页 ---------- */

  await documentGet(
    "已有会话首页 GET",
    "/",
    ua,
    jar,
    ""
  );

  if (jar.has("hdh_sa_token")) {
    saveSuccess(
      jar,
      "已有会话首页 GET"
    );

    return {
      title:
        "可纯 HTTP 自动续签",

      message:
        "首页 GET 已签发新 hdh_sa_token；无需手动打开网页。",
    };
  }

  /* ---------- 已有会话登录页 ---------- */

  await documentGet(
    "已有会话登录页 GET",
    "/login",
    ua,
    jar,
    BASE_URL
  );

  if (jar.has("hdh_sa_token")) {
    saveSuccess(
      jar,
      "已有会话登录页 GET"
    );

    return {
      title:
        "可纯 HTTP 自动续签",

      message:
        "登录页 GET 已签发新 hdh_sa_token；无需手动打开网页。",
    };
  }

  /* ---------- 浏览器安全检测 ---------- */

  if (sawChallenge) {
    saveFailure(
      "browser_challenge"
    );

    return {
      title:
        "纯 Loon GET 被浏览器检测拦截",

      message:
        "响应是“正在检测浏览器安全能力”页面，未获得短期票据。",
    };
  }

  /* ---------- 未配置登录凭据 ---------- */

  if (!username || !password) {
    saveFailure(
      "credentials_not_configured"
    );

    return {
      title:
        "GET 未签发，需继续测登录链路",

      message:
        "请在 Loon 插件设置中填写影巢账号和密码后再运行；本脚本仍不会签到。",
    };
  }

  /* ---------- 登录链路探测 ---------- */

  const loginResult =
    await loginProbe(
      username,
      password,
      ua
    );

  if (
    loginResult.stage &&
    saveSuccess(
      loginResult.jar,
      loginResult.stage
    )
  ) {
    return {
      title:
        "可由登录链路自动签发",

      message:
        `${loginResult.stage} 已获得新 hdh_sa_token；` +
        "完整插件可以每次先登录再签到，无需手动打开网页。",
    };
  }

  /* ---------- 登录后仍未签发 ---------- */

  const reason =
    sawChallenge
      ? "browser_challenge"
      : "login_flow_did_not_issue_sa_token";

  saveFailure(reason);

  return {
    title:
      sawChallenge
        ? "登录链路被浏览器检测拦截"
        : "登录链路仍未签发短期票据",

    message:
      sawChallenge
        ? "纯 Loon HTTP 无法完成当前浏览器能力检测。"
        : "需进一步抓取从打开 /login 开始的完整 HAR，定位 JS 初始化步骤。",
  };
}

/* ==============================
 * Cookie 自动获取
 * ============================== */

function captureRequestCookie() {
  const headers =
    ($request && $request.headers) || {};

  const cookie = String(
    getHeader(headers, "cookie") || ""
  ).trim();

  const ua = String(
    getHeader(headers, "user-agent") || ""
  ).trim();

  if (
    !cookie ||
    !/(?:^|;\s*)token=/.test(cookie)
  ) {
    console.log(
      `[${NAME}] 当前请求没有有效登录 Cookie，跳过保存`
    );

    $done({});
    return;
  }

  const oldCookie =
    $persistentStore.read(
      KEY.cookie
    ) || "";

  const firstCapture =
    !oldCookie;

  $persistentStore.write(
    cookie,
    KEY.cookie
  );

  if (ua) {
    $persistentStore.write(
      ua,
      KEY.ua
    );
  }

  console.log(
    `[${NAME}] 登录 Cookie 已${oldCookie === cookie ? "存在" : "更新"}；` +
      `Cookie 字段数=${cookie.split(/;\s*/).filter(Boolean).length}`
  );

  if (firstCapture) {
    $notification.post(
      NAME,
      "登录信息获取成功",
      "已保存 HDHive Cookie 与 User-Agent，可以关闭自动获取 Cookie。"
    );
  }

  $done({});
}

/* ==============================
 * 执行
 * ============================== */

if (
  typeof $request !== "undefined"
) {
  captureRequestCookie();
} else {
  main()
    .then((result) => {
      console.log(
        `[${NAME}] ${result.title}: ${result.message}`
      );

      $notification.post(
        NAME,
        result.title,
        result.message
      );
    })
    .catch((error) => {
      const message =
        error && error.message
          ? error.message
          : String(error);

      console.log(
        `[${NAME}] 失败: ${message}`
      );

      saveFailure(message);

      $notification.post(
        NAME,
        "探测失败",
        message
      );
    })
    .finally(() => {
      $done();
    });
}