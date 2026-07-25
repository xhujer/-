/**
 * HDHive / 影巢自动签到（Loon）
 *
 * 适配 2026 年 6 月 HDHive 重构后的 Next.js Server Action 签到。
 *
 * 工作流程：
 * 1. http-request 模式保存浏览器中的长期登录 Cookie 与 User-Agent。
 * 2. cron 模式主动删除已过期的 hdh_sa_token。
 * 3. 使用长期登录 Cookie GET 首页，让服务器签发新的 hdh_sa_token。
 * 4. 动态获取当前部署的 checkIn Server Action ID。
 * 5. POST [false]（普通签到）或 [true]（赌狗签到）。
 * 6. 保存响应中轮换后的 Cookie；Token 失效或 Action 更新时自动重试一次。
 *
 * 安全说明：
 * - 登录 Cookie、Token 只保存在 Loon 本地。
 * - Action ID 解析服务只收到 domain/path/actionName，不会收到 Cookie。
 * - 日志和通知不会输出 Cookie、Token 或完整响应正文。
 */

const NAME = "HDHive 自动签到";
const BASE_URL = "https://hdhive.com";
const ACTION_RESOLVER_URL = "https://hdhive.ckid.workers.dev/";
const DEFAULT_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 " +
  "Mobile/15E148 Safari/604.1";

// 取自重构后首页真实签到请求。该值描述当前首页的 Next.js 路由树。
const ROUTER_STATE_TREE =
  "%5B%22%22%2C%7B%22children%22%3A%5B%22(app)%22%2C%7B%22children%22%3A" +
  "%5B%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue" +
  "%5D%7D%2Cnull%2Cnull%2Ctrue%5D";

const KEY = {
  cookie: "hdhive_cookie_v15",
  ua: "hdhive_ua_v15",
  saToken: "hdhive_sa_token_v1",
  action: "hdhive_action_v1",
  report: "hdhive_checkin_report_v1",
};

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
      const deleteByAge = maxAgeMatch && Number(maxAgeMatch[1]) <= 0;
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

      if (changedNames.indexOf(name) === -1) {
        changedNames.push(name);
      }
    });

    return changedNames;
  }
}

function getHeader(headers, wantedName) {
  const source = headers || {};
  const wanted = String(wantedName).toLowerCase();
  const key = Object.keys(source).find(
    (name) => String(name).toLowerCase() === wanted
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
            if (trimmed) lines.push(trimmed);
          });
      });
  });

  return lines;
}

function parseArgument(text) {
  if (text === null || typeof text === "undefined") return {};
  const trimmed = String(text).trim();
  if (!trimmed) return {};

  if (trimmed[0] === "{" || trimmed[0] === "[") {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return { gamble: parsed[0] };
      }
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      // 继续按 query string 解析。
    }
  }

  if (trimmed.indexOf("=") === -1) {
    return { gamble: trimmed };
  }

  const result = {};
  trimmed.split("&").forEach((part) => {
    const index = part.indexOf("=");
    if (index <= 0) return;

    const key = decodeURIComponent(part.slice(0, index).replace(/\+/g, " "));
    const value = decodeURIComponent(
      part.slice(index + 1).replace(/\+/g, " ")
    );
    result[key] = value;
  });
  return result;
}

function readArguments() {
  if (typeof $argument === "undefined" || $argument === null) {
    return {};
  }

  if (Array.isArray($argument)) {
    return { gamble: $argument[0] };
  }

  if (typeof $argument === "object") {
    return $argument;
  }

  return parseArgument($argument);
}

function asBoolean(value, defaultValue) {
  if (typeof value === "boolean") return value;

  const normalized = String(value === undefined ? "" : value)
    .trim()
    .toLowerCase();

  if (/^(1|true|yes|on|开启|是)$/.test(normalized)) return true;
  if (/^(0|false|no|off|关闭|否)$/.test(normalized)) return false;

  return Boolean(defaultValue);
}

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

      const rawStatus =
        response && (response.status || response.statusCode)
          ? response.status || response.statusCode
          : 0;

      resolve({
        status: Number(rawStatus) || parseInt(String(rawStatus), 10) || 0,
        headers: (response && response.headers) || {},
        body: data === undefined || data === null ? "" : String(data),
      });
    });
  });
}

function isChallenge(status, body) {
  const text = String(body || "").toLowerCase();

  return (
    status === 503 ||
    text.includes("正在检测浏览器安全能力") ||
    text.includes("just a moment") ||
    text.includes("checking your browser") ||
    text.includes("/cdn-cgi/challenge-platform") ||
    text.includes("cf-chl-") ||
    text.includes("challenge-form")
  );
}

function isValidActionId(value) {
  return /^[A-Fa-f0-9]{20,128}$/.test(String(value || ""));
}

function buildDocumentHeaders(ua, jar) {
  const headers = {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9," +
      "image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": ua,
  };

  const cookie = jar.toHeader();
  if (cookie) headers.Cookie = cookie;

  return headers;
}

function saveSession(jar) {
  const cookie = jar.toHeader();

  if (cookie) {
    $persistentStore.write(cookie, KEY.cookie);
  }

  const saToken = jar.get("hdh_sa_token");

  if (saToken) {
    $persistentStore.write(saToken, KEY.saToken);
  } else {
    $persistentStore.write("", KEY.saToken);
  }
}

async function refreshSession(jar, ua, reason) {
  const removedOldToken = jar.has("hdh_sa_token");
  jar.remove("hdh_sa_token");

  const response = await request("get", {
    url: `${BASE_URL}/?_loon_refresh=${Date.now()}`,
    timeout: 25000,
    alpn: "h2",
    "auto-cookie": false,
    "auto-redirect": false,
    headers: buildDocumentHeaders(ua, jar),
  });

  const changedNames = jar.absorbResponseHeaders(response.headers);
  saveSession(jar);

  console.log(
    `[${NAME}] ${reason || "刷新会话"}: HTTP ${response.status}; ` +
      `移除旧Token=${removedOldToken ? "是" : "否"}; ` +
      `Set-Cookie=[${changedNames.join(", ") || "无"}]; ` +
      `新Token=${jar.has("hdh_sa_token") ? "有" : "无"}`
  );

  if (isChallenge(response.status, response.body)) {
    throw new Error("首页触发浏览器安全检测，未能自动续签");
  }

  const location = String(getHeader(response.headers, "location") || "");

  if (
    response.status === 401 ||
    response.status === 403 ||
    /\/login(?:[/?#]|$)/i.test(location) ||
    /请先登录|登录已失效|未登录/.test(response.body)
  ) {
    throw new Error("长期登录 Cookie 已失效，请在 Loon 下重新登录一次 HDHive");
  }

  if (!jar.has("hdh_sa_token")) {
    throw new Error(
      `首页 HTTP ${response.status}，但没有签发新的 hdh_sa_token`
    );
  }

  return response;
}

function extractActionId(payload, rawBody) {
  const candidates = [];

  if (typeof payload === "string") {
    candidates.push(payload);
  } else if (payload && typeof payload === "object") {
    candidates.push(payload.actionId);

    if (payload.data) {
      candidates.push(payload.data.actionId);
    }

    if (payload.result) {
      candidates.push(payload.result.actionId);
    }
  }

  const regexMatch = String(rawBody || "").match(
    /"actionId"\s*:\s*"([A-Fa-f0-9]{20,128})"/
  );

  if (regexMatch) {
    candidates.push(regexMatch[1]);
  }

  for (let index = 0; index < candidates.length; index += 1) {
    if (isValidActionId(candidates[index])) {
      return String(candidates[index]);
    }
  }

  return "";
}

async function discoverCheckInAction() {
  let networkError = "";

  try {
    const response = await request("post", {
      url: ACTION_RESOLVER_URL,
      timeout: 18000,
      "auto-cookie": false,
      "auto-redirect": false,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain: "hdhive.com",
        path: "/",
        actionName: "checkIn",
      }),
    });

    if (response.status !== 200) {
      throw new Error(`Action 解析服务 HTTP ${response.status}`);
    }

    let payload = null;

    try {
      payload = JSON.parse(response.body);
    } catch (_) {
      payload = null;
    }

    const actionId = extractActionId(payload, response.body);

    if (!actionId) {
      throw new Error("Action 解析服务未返回有效 ID");
    }

    $persistentStore.write(actionId, KEY.action);

    console.log(`[${NAME}] 已动态获取当前 checkIn Action ID`);

    return {
      actionId,
      source: "dynamic",
    };
  } catch (error) {
    networkError =
      error && error.message ? error.message : String(error);

    console.log(`[${NAME}] 动态 Action 解析失败: ${networkError}`);
  }

  const cachedAction = $persistentStore.read(KEY.action) || "";

  if (isValidActionId(cachedAction)) {
    console.log(`[${NAME}] 临时改用上次缓存的 Action ID`);

    return {
      actionId: cachedAction,
      source: "cache",
    };
  }

  throw new Error(networkError || "无法获取 checkIn Action ID");
}

function buildCheckInHeaders(ua, jar, actionId) {
  const headers = {
    Accept: "text/x-component",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
    "Content-Type": "text/plain;charset=UTF-8",
    Origin: BASE_URL,
    Referer: `${BASE_URL}/`,
    "User-Agent": ua,
    "Next-Action": actionId,
    "Next-Router-State-Tree": ROUTER_STATE_TREE,
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
  };

  const cookie = jar.toHeader();

  if (cookie) {
    headers.Cookie = cookie;
  }

  return headers;
}

async function postCheckIn(jar, ua, actionId, gamble) {
  const response = await request("post", {
    url: `${BASE_URL}/`,
    timeout: 30000,
    alpn: "h2",
    "auto-cookie": false,
    "auto-redirect": false,
    headers: buildCheckInHeaders(ua, jar, actionId),

    // 重构后的真实请求体：普通 [false]，赌狗 [true]。
    body: JSON.stringify([Boolean(gamble)]),
  });

  const changedNames = jar.absorbResponseHeaders(response.headers);
  saveSession(jar);

  console.log(
    `[${NAME}] 签到 POST: HTTP ${response.status}; ` +
      `Set-Cookie=[${changedNames.join(", ") || "无"}]`
  );

  return response;
}

function decodeLooseJsonText(text) {
  return String(text || "")
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/\\"/g, '"');
}

function readJsonStringField(text, fieldName) {
  const escapedName = String(fieldName).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const regex = new RegExp(
    `"${escapedName}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`
  );

  const match = String(text || "").match(regex);

  if (!match) {
    return "";
  }

  try {
    return JSON.parse(`"${match[1]}"`);
  } catch (_) {
    return match[1]
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
}

function joinResultText(message, description, fallback) {
  const parts = [];

  [message, description].forEach((value) => {
    const trimmed = String(value || "").trim();

    if (trimmed && parts.indexOf(trimmed) === -1) {
      parts.push(trimmed);
    }
  });

  return parts.join("：") || fallback;
}

function analyzeCheckInResponse(response) {
  const rawBody = String(response.body || "");
  const text = decodeLooseJsonText(rawBody);
  const lower = text.toLowerCase();

  const message = readJsonStringField(text, "message");
  const description = readJsonStringField(text, "description");

  const tokenInvalid =
    response.status === 409 ||
    lower.includes("action_token_invalid") ||
    lower.includes("action token invalid");

  if (tokenInvalid) {
    return {
      ok: false,
      retryable: true,
      kind: "token_invalid",
      httpStatus: response.status,
      detail: "短期 Action Token 已失效",
    };
  }

  const actionMissing =
    response.status === 404 ||
    lower.includes("server action not found") ||
    lower.includes("failed to find server action");

  if (actionMissing) {
    return {
      ok: false,
      retryable: true,
      kind: "action_changed",
      httpStatus: response.status,
      detail: "当前部署的 Server Action 已更新",
    };
  }

  if (isChallenge(response.status, text)) {
    return {
      ok: false,
      retryable: false,
      kind: "challenge",
      httpStatus: response.status,
      detail: "签到请求触发浏览器安全检测",
    };
  }

  const alreadySigned =
    /你已经签到过了|明天再来吧|今日已签到|已经签到/.test(text);

  if (alreadySigned) {
    return {
      ok: true,
      retryable: false,
      kind: "already",
      httpStatus: response.status,
      detail: joinResultText(
        message,
        description,
        "今天已经签到过了"
      ),
    };
  }

  const success =
    /"success"\s*:\s*true/i.test(text) ||
    /签到成功|签到奖励|获得.{0,20}(积分|蜂蜜)/.test(text);

  if (success) {
    return {
      ok: true,
      retryable: false,
      kind: "success",
      httpStatus: response.status,
      detail: joinResultText(
        message,
        description,
        "签到成功"
      ),
    };
  }

  const loginRequired =
    response.status === 401 ||
    /请先登录|未登录|登录已失效|unauthorized|authentication required/i.test(
      text
    );

  if (loginRequired) {
    return {
      ok: false,
      retryable: false,
      kind: "login_required",
      httpStatus: response.status,
      detail: "登录状态已失效，请在 Loon 下重新登录一次 HDHive",
    };
  }

  return {
    ok: false,
    retryable: false,
    kind: "unknown",
    httpStatus: response.status,
    detail: joinResultText(
      message,
      description,
      `服务返回了无法识别的结果（HTTP ${
        response.status || "未知"
      }）`
    ),
  };
}

function saveReport(result, gamble, attempts, actionSource) {
  const report = {
    success: Boolean(result && result.ok),
    result: (result && result.kind) || "error",
    detail: (result && result.detail) || "",
    httpStatus: (result && result.httpStatus) || 0,
    mode: gamble ? "gamble" : "normal",
    attempts,
    actionSource: actionSource || "",
    executedAt: new Date().toISOString(),
  };

  $persistentStore.write(
    JSON.stringify(report),
    KEY.report
  );
}

async function main() {
  const argument = readArguments();
  const gamble = asBoolean(argument.gamble, false);
  const modeName = gamble ? "赌狗签到" : "普通签到";

  const storedCookie =
    $persistentStore.read(KEY.cookie) || "";

  const ua =
    $persistentStore.read(KEY.ua) || DEFAULT_UA;

  if (!storedCookie) {
    throw new Error(
      "尚未获取登录 Cookie；请先启用插件并在 Loon 下登录一次 hdhive.com"
    );
  }

  const jar = new CookieJar(storedCookie);

  console.log(
    `[${NAME}] 开始执行；模式=${modeName}；` +
      `已有长期会话=${
        jar.has("token") || jar.has("refresh_token")
          ? "是"
          : "未知"
      }`
  );

  await refreshSession(
    jar,
    ua,
    "签到前自动续签"
  );

  let lastResult = null;
  let actionSource = "";

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const action = await discoverCheckInAction();
    actionSource = action.source;

    const response = await postCheckIn(
      jar,
      ua,
      action.actionId,
      gamble
    );

    const result = analyzeCheckInResponse(response);
    lastResult = result;

    console.log(
      `[${NAME}] 第 ${attempt} 次结果: ${result.kind}; ` +
        `HTTP=${result.httpStatus}; ` +
        `可重试=${result.retryable ? "是" : "否"}`
    );

    if (result.retryable && attempt === 1) {
      console.log(
        `[${NAME}] ${result.detail}，` +
          "自动刷新 Token 与 Action 后重试"
      );

      await refreshSession(
        jar,
        ua,
        "重试前自动续签"
      );

      continue;
    }

    saveReport(
      result,
      gamble,
      attempt,
      actionSource
    );

    return {
      ok: result.ok,
      kind: result.kind,
      title:
        result.kind === "success"
          ? "✅ 签到成功"
          : result.kind === "already"
          ? "ℹ️ 今日已签到"
          : "❌ 签到失败",
      message: `${modeName}\n${result.detail}`,
    };
  }

  const fallback = lastResult || {
    ok: false,
    kind: "unknown",
    httpStatus: 0,
    detail: "签到流程未返回结果",
  };

  saveReport(
    fallback,
    gamble,
    2,
    actionSource
  );

  return {
    ok: false,
    kind: fallback.kind,
    title: "❌ 签到失败",
    message: `${modeName}\n${fallback.detail}`,
  };
}

function captureRequestCookie() {
  const headers =
    ($request && $request.headers) || {};

  const cookie = String(
    getHeader(headers, "cookie") || ""
  ).trim();

  const ua = String(
    getHeader(headers, "user-agent") || ""
  ).trim();

  const hasLoginCookie =
    /(?:^|;\s*)token=/.test(cookie) ||
    /(?:^|;\s*)refresh_token=/.test(cookie);

  if (!cookie || !hasLoginCookie) {
    console.log(
      `[${NAME}] 当前请求没有登录 Cookie，跳过保存`
    );

    $done({});
    return;
  }

  const oldCookie =
    $persistentStore.read(KEY.cookie) || "";

  const firstCapture = !oldCookie;
  const changed = oldCookie !== cookie;

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
    `[${NAME}] 登录 Cookie 已${
      changed ? "更新" : "存在"
    }；字段数=${
      cookie.split(/;\s*/).filter(Boolean).length
    }`
  );

  if (firstCapture) {
    $notification.post(
      NAME,
      "✅ 登录信息获取成功",
      "以后会在签到前自动续签 hdh_sa_token，无需每天手动打开网页。"
    );
  }

  $done({});
}

if (typeof $request !== "undefined") {
  captureRequestCookie();
} else {
  main()
    .then((result) => {
      console.log(
        `[${NAME}] ${result.title}: ` +
          result.message.replace(/\n/g, "；")
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
        `[${NAME}] 执行失败: ${message}`
      );

      const failure = {
        ok: false,
        kind: "exception",
        httpStatus: 0,
        detail: message,
      };

      const args = readArguments();

      saveReport(
        failure,
        asBoolean(args.gamble, false),
        0,
        ""
      );

      $notification.post(
        NAME,
        "❌ 签到失败",
        message
      );
    })
    .finally(() => $done());
}