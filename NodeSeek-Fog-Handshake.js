/*
 * NodeSeek 身份捕获与 Fog WebSocket 握手修正
 */

const SCRIPT_NAME = "NodeSeek";

const KEY_COOKIE = "nodeseek_cookie";
const KEY_SAFARI_UA = "nodeseek_safari_user_agent_v2";
const KEY_LANGUAGE = "nodeseek_accept_language_v2";
const KEY_CAPTURE_TIME = "nodeseek_capture_time_v2";
const KEY_NOTIFY_TIME = "nodeseek_capture_notify_time_v2";

function log(message) {
  console.log(`[${SCRIPT_NAME}] ${message}`);
}

function readHeader(headers, name) {
  if (!headers || typeof headers !== "object") {
    return "";
  }

  const target = String(name).toLowerCase();

  for (const key of Object.keys(headers)) {
    if (String(key).toLowerCase() === target) {
      return String(headers[key] ?? "");
    }
  }

  return "";
}

function removeHeader(headers, name) {
  const target = String(name).toLowerCase();

  for (const key of Object.keys(headers)) {
    if (String(key).toLowerCase() === target) {
      delete headers[key];
    }
  }
}

function setHeader(headers, name, value) {
  removeHeader(headers, name);

  if (
    value !== undefined &&
    value !== null &&
    String(value) !== ""
  ) {
    headers[name] = String(value);
  }
}

function maskCookie(cookie) {
  const value = String(cookie || "");

  if (!value) {
    return "未获取";
  }

  if (value.length <= 24) {
    return `${value.slice(0, 8)}***`;
  }

  return (
    `${value.slice(0, 12)}` +
    "***" +
    `${value.slice(-8)}`
  );
}

function isNodeSeekRequest(url) {
  return (
    typeof url === "string" &&
    /^https?:\/\/(?:www\.)?nodeseek\.com\//i.test(url)
  );
}

function isFogRequest(url) {
  return (
    typeof url === "string" &&
    /\/edge-cgi\/fog(?:[?#]|$)/i.test(url)
  );
}

function isDocumentRequest(headers) {
  const destination = readHeader(
    headers,
    "Sec-Fetch-Dest"
  ).toLowerCase();

  const accept = readHeader(
    headers,
    "Accept"
  ).toLowerCase();

  return (
    destination === "document" ||
    accept.includes("text/html")
  );
}

function shouldNotify() {
  const now = Date.now();

  const lastTime = Number(
    $persistentStore.read(KEY_NOTIFY_TIME) || 0
  );

  /*
   * 避免网页资源并发请求造成重复通知。
   */
  if (now - lastTime < 10000) {
    return false;
  }

  $persistentStore.write(
    String(now),
    KEY_NOTIFY_TIME
  );

  return true;
}

function captureBrowserIdentity(url, headers) {
  if (
    !isNodeSeekRequest(url) ||
    isFogRequest(url)
  ) {
    return;
  }

  const cookie = readHeader(
    headers,
    "Cookie"
  );

  const userAgent = readHeader(
    headers,
    "User-Agent"
  );

  const language = readHeader(
    headers,
    "Accept-Language"
  );

  let cookieSaved = false;
  let userAgentSaved = false;

  /*
   * 不再检查 Cookie 名称。
   * 只要 NodeSeek 请求携带 Cookie，就直接保存完整 Cookie。
   */
  if (cookie) {
    $persistentStore.write(
      cookie,
      KEY_COOKIE
    );

    cookieSaved = true;
  }

  /*
   * 防止 Loon generic 环境的 UA 覆盖 Safari UA。
   */
  if (
    userAgent &&
    !/Loon/i.test(userAgent)
  ) {
    $persistentStore.write(
      userAgent,
      KEY_SAFARI_UA
    );

    userAgentSaved = true;
  }

  if (language) {
    $persistentStore.write(
      language,
      KEY_LANGUAGE
    );
  }

  const captureTime =
    new Date().toLocaleString();

  if (cookieSaved || userAgentSaved) {
    $persistentStore.write(
      captureTime,
      KEY_CAPTURE_TIME
    );
  }

  /*
   * 只在网页主文档请求时通知，防止图片、JS、CSS 重复弹窗。
   */
  if (
    isDocumentRequest(headers) &&
    shouldNotify()
  ) {
    log("=== NodeSeek 身份信息获取 ===");
    log(`URL：${url}`);
    log(
      `Cookie：${
        cookieSaved
          ? `已保存（${maskCookie(cookie)}）`
          : "请求中没有 Cookie"
      }`
    );
    log(
      `Safari User-Agent：${
        userAgentSaved
          ? "已保存"
          : "未获取"
      }`
    );
    log(`获取时间：${captureTime}`);

    $notification.post(
      "NodeSeek",
      cookieSaved
        ? "✅ 身份信息获取成功"
        : "⚠️ 未获取到 Cookie",
      [
        `Cookie：${cookieSaved ? "已保存" : "未找到"}`,
        `Safari UA：${userAgentSaved ? "已保存" : "未找到"}`,
        `时间：${captureTime}`
      ].join("\n")
    );
  }
}

function handleFogHandshake(url, originalHeaders) {
  const headers = {
    ...(originalHeaders || {})
  };

  const savedCookie =
    $persistentStore.read(KEY_COOKIE) || "";

  const savedSafariUA =
    $persistentStore.read(KEY_SAFARI_UA) || "";

  const savedLanguage =
    $persistentStore.read(KEY_LANGUAGE) ||
    "zh-CN,zh-Hans;q=0.9";

  const currentCookie =
    readHeader(headers, "Cookie");

  const currentUA =
    readHeader(headers, "User-Agent");

  const finalCookie =
    savedCookie || currentCookie;

  const finalUserAgent =
    savedSafariUA || currentUA;

  setHeader(
    headers,
    "Origin",
    "https://www.nodeseek.com"
  );

  setHeader(
    headers,
    "Referer",
    "https://www.nodeseek.com/"
  );

  setHeader(
    headers,
    "Sec-Fetch-Site",
    "same-origin"
  );

  setHeader(
    headers,
    "Sec-Fetch-Mode",
    "websocket"
  );

  setHeader(
    headers,
    "Sec-Fetch-Dest",
    "websocket"
  );

  setHeader(
    headers,
    "Accept",
    "*/*"
  );

  setHeader(
    headers,
    "Accept-Language",
    savedLanguage
  );

  setHeader(
    headers,
    "Pragma",
    "no-cache"
  );

  setHeader(
    headers,
    "Cache-Control",
    "no-cache"
  );

  if (finalCookie) {
    setHeader(
      headers,
      "Cookie",
      finalCookie
    );
  }

  if (finalUserAgent) {
    setHeader(
      headers,
      "User-Agent",
      finalUserAgent
    );
  }

  log("=== NodeSeek Fog 握手已修正 ===");
  log(`URL：${url}`);
  log(
    `Cookie：${
      finalCookie
        ? `已注入（${maskCookie(finalCookie)}）`
        : "未找到"
    }`
  );
  log(
    `Safari User-Agent：${
      savedSafariUA
        ? "已注入"
        : "未捕获"
    }`
  );
  log(
    `Sec-Fetch-Site：${readHeader(
      headers,
      "Sec-Fetch-Site"
    )}`
  );
  log(
    `Sec-Fetch-Mode：${readHeader(
      headers,
      "Sec-Fetch-Mode"
    )}`
  );
  log(
    `Sec-Fetch-Dest：${readHeader(
      headers,
      "Sec-Fetch-Dest"
    )}`
  );

  $done({
    headers
  });
}

function main() {
  if (
    typeof $request === "undefined" ||
    !$request ||
    !$request.url
  ) {
    log("未获取到请求信息");
    $done({});
    return;
  }

  const url = String($request.url);
  const headers = $request.headers || {};

  if (isFogRequest(url)) {
    handleFogHandshake(
      url,
      headers
    );

    return;
  }

  captureBrowserIdentity(
    url,
    headers
  );

  $done({});
}

try {
  main();
} catch (error) {
  log(
    `执行异常：${String(
      error?.stack ||
      error?.message ||
      error
    )}`
  );

  $done({});
}