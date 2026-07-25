/*
 * NodeSeek Cookie 捕获与 Fog WebSocket 握手修复
 *
 * 修复内容：
 * 1. Fog 请求不再覆盖已经保存的 Safari UA
 * 2. 恢复正确的 Fetch Metadata 请求头
 * 3. 优先使用 Safari 捕获的 Cookie、UA、语言
 * 4. 不修改 WebSocket Key、Version、Upgrade 等底层请求头
 */

const SCRIPT_NAME = "NodeSeek Fog 握手";

const KEY_COOKIE = "nodeseek_cookie";
const KEY_SAFARI_UA = "nodeseek_safari_user_agent_v2";
const KEY_LANGUAGE = "nodeseek_accept_language_v2";
const KEY_CAPTURE_TIME = "nodeseek_capture_time_v2";

function log(message) {
  console.log(`[${SCRIPT_NAME}] ${message}`);
}

function readHeader(headers, name) {
  if (
    !headers ||
    typeof headers !== "object"
  ) {
    return "";
  }

  const target =
    String(name).toLowerCase();

  for (const key of Object.keys(headers)) {
    if (
      String(key).toLowerCase() ===
      target
    ) {
      return String(
        headers[key] ?? ""
      );
    }
  }

  return "";
}

function removeHeader(headers, name) {
  const target =
    String(name).toLowerCase();

  for (const key of Object.keys(headers)) {
    if (
      String(key).toLowerCase() ===
      target
    ) {
      delete headers[key];
    }
  }
}

function setHeader(
  headers,
  name,
  value
) {
  removeHeader(headers, name);

  if (
    value !== undefined &&
    value !== null &&
    String(value) !== ""
  ) {
    headers[name] =
      String(value);
  }
}

function maskCookie(cookie) {
  const value =
    String(cookie || "");

  if (!value) {
    return "无";
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

function isFogRequest(url) {
  return (
    typeof url === "string" &&
    /\/edge-cgi\/fog(?:[?#]|$)/i.test(
      url
    )
  );
}

function isNodeSeekRequest(url) {
  return (
    typeof url === "string" &&
    /^https?:\/\/(?:www\.)?nodeseek\.com\//i.test(
      url
    )
  );
}

function looksLikeLoginCookie(cookie) {
  const value =
    String(cookie || "");

  return (
    value.includes("session=") ||
    value.includes("pjwt=") ||
    value.includes("cf_clearance=")
  );
}

function looksLikeSafariUA(userAgent) {
  const value =
    String(userAgent || "");

  return (
    /Safari\//i.test(value) &&
    /Mobile\//i.test(value) &&
    !/Loon/i.test(value)
  );
}

function captureBrowserIdentity(
  url,
  headers
) {
  /*
   * Fog 握手本身绝对不能用于更新身份，
   * 否则 generic 环境的 UA 可能覆盖 Safari UA。
   */
  if (
    !isNodeSeekRequest(url) ||
    isFogRequest(url)
  ) {
    return;
  }

  const cookie =
    readHeader(
      headers,
      "Cookie"
    );

  const userAgent =
    readHeader(
      headers,
      "User-Agent"
    );

  const acceptLanguage =
    readHeader(
      headers,
      "Accept-Language"
    );

  let updated = false;

  if (
    cookie &&
    looksLikeLoginCookie(cookie)
  ) {
    const oldCookie =
      $persistentStore.read(
        KEY_COOKIE
      ) || "";

    if (cookie !== oldCookie) {
      $persistentStore.write(
        cookie,
        KEY_COOKIE
      );

      updated = true;

      log(
        `Safari Cookie 已更新：${maskCookie(
          cookie
        )}`
      );
    }
  }

  if (
    userAgent &&
    looksLikeSafariUA(userAgent)
  ) {
    const oldUA =
      $persistentStore.read(
        KEY_SAFARI_UA
      ) || "";

    if (userAgent !== oldUA) {
      $persistentStore.write(
        userAgent,
        KEY_SAFARI_UA
      );

      updated = true;

      log(
        "Safari User-Agent 已更新"
      );
    }
  }

  if (acceptLanguage) {
    const oldLanguage =
      $persistentStore.read(
        KEY_LANGUAGE
      ) || "";

    if (
      acceptLanguage !== oldLanguage
    ) {
      $persistentStore.write(
        acceptLanguage,
        KEY_LANGUAGE
      );

      updated = true;
    }
  }

  if (updated) {
    const captureTime =
      new Date().toLocaleString();

    $persistentStore.write(
      captureTime,
      KEY_CAPTURE_TIME
    );

    log(
      `身份捕获时间：${captureTime}`
    );
  }
}

function handleFogHandshake(
  url,
  originalHeaders
) {
  const headers = {
    ...(originalHeaders || {})
  };

  const savedCookie =
    $persistentStore.read(
      KEY_COOKIE
    ) || "";

  const savedSafariUA =
    $persistentStore.read(
      KEY_SAFARI_UA
    ) || "";

  const savedLanguage =
    $persistentStore.read(
      KEY_LANGUAGE
    ) ||
    "zh-CN,zh-Hans;q=0.9";

  const currentCookie =
    readHeader(
      headers,
      "Cookie"
    );

  const currentUA =
    readHeader(
      headers,
      "User-Agent"
    );

  /*
   * 必须优先使用 Safari 捕获值。
   * generic WebSocket 当前请求中的 UA 只作为兜底。
   */
  const finalCookie =
    savedCookie ||
    currentCookie;

  const finalUserAgent =
    savedSafariUA ||
    currentUA;

  /*
   * 同源信息。
   */
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

  /*
   * 与 Safari 成功握手保持一致。
   * 上一版错误地删除了这三个请求头。
   */
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

  /*
   * 常规浏览器请求头。
   */
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

  setHeader(
    headers,
    "Priority",
    "u=3, i"
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

  /*
   * 不手动修改以下底层字段：
   *
   * Host
   * Connection
   * Upgrade
   * Sec-WebSocket-Key
   * Sec-WebSocket-Version
   * Sec-WebSocket-Extensions
   *
   * 这些字段由 WebSocket 实现自动生成。
   */

  log(
    "=== NodeSeek Fog 握手已修正 ==="
  );

  log(`URL：${url}`);

  log(
    `Origin：${readHeader(
      headers,
      "Origin"
    )}`
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

  log(
    `Cookie：${
      finalCookie
        ? `已注入（${maskCookie(
            finalCookie
          )}）`
        : "未找到"
    }`
  );

  log(
    `Safari User-Agent：${
      savedSafariUA
        ? "已注入"
        : "未捕获，正在使用当前 UA"
    }`
  );

  const captureTime =
    $persistentStore.read(
      KEY_CAPTURE_TIME
    ) || "未捕获";

  log(
    `Safari 身份捕获时间：${captureTime}`
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
    log(
      "未获取到请求信息"
    );

    $done({});
    return;
  }

  const url =
    String($request.url);

  const headers =
    $request.headers || {};

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