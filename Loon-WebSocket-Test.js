/*
 * NodeSeek Cookie 捕获与 Fog WebSocket 握手修复测试
 *
 * 功能：
 * 1. 从 Safari 的 NodeSeek 请求中保存 Cookie 和 User-Agent
 * 2. 尝试拦截 /edge-cgi/fog WebSocket 握手
 * 3. 注入正确的 Origin、Referer、Cookie 和 User-Agent
 */

const SCRIPT_NAME = "NodeSeek Fog 握手";
const DOMAIN = "nodeseek.com";

const KEY_COOKIE = "nodeseek_cookie";
const KEY_USER_AGENT = "nodeseek_user_agent";
const KEY_CAPTURE_TIME = "nodeseek_capture_time";

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
      return String(headers[key] || "");
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

  if (value !== undefined && value !== null && String(value) !== "") {
    headers[name] = String(value);
  }
}

function maskCookie(cookie) {
  if (!cookie) {
    return "无";
  }

  if (cookie.length <= 20) {
    return `${cookie.slice(0, 5)}***`;
  }

  return `${cookie.slice(0, 10)}***${cookie.slice(-6)}`;
}

function saveRequestIdentity(headers) {
  const requestCookie = readHeader(headers, "Cookie");
  const requestUserAgent = readHeader(headers, "User-Agent");

  let cookieUpdated = false;
  let userAgentUpdated = false;

  if (requestCookie) {
    const oldCookie =
      $persistentStore.read(KEY_COOKIE) || "";

    if (requestCookie !== oldCookie) {
      $persistentStore.write(
        requestCookie,
        KEY_COOKIE
      );

      cookieUpdated = true;
    }
  }

  if (requestUserAgent) {
    const oldUserAgent =
      $persistentStore.read(KEY_USER_AGENT) || "";

    if (requestUserAgent !== oldUserAgent) {
      $persistentStore.write(
        requestUserAgent,
        KEY_USER_AGENT
      );

      userAgentUpdated = true;
    }
  }

  if (cookieUpdated || userAgentUpdated) {
    const captureTime =
      new Date().toLocaleString();

    $persistentStore.write(
      captureTime,
      KEY_CAPTURE_TIME
    );

    log("NodeSeek 身份信息已更新");

    if (cookieUpdated) {
      log(
        `Cookie：${maskCookie(requestCookie)}`
      );
    }

    if (userAgentUpdated) {
      log(
        `User-Agent：${requestUserAgent}`
      );
    }
  }
}

function isFogRequest(url) {
  return (
    typeof url === "string" &&
    /\/edge-cgi\/fog(?:[?#]|$)/i.test(url)
  );
}

function handleFogHandshake(url, originalHeaders) {
  const headers = {
    ...originalHeaders
  };

  /*
   * 当前握手本身可能已经带有 Cookie 和 UA。
   * 优先使用当前请求中的值，缺少时读取此前捕获的值。
   */
  const currentCookie =
    readHeader(headers, "Cookie");

  const currentUserAgent =
    readHeader(headers, "User-Agent");

  const savedCookie =
    $persistentStore.read(KEY_COOKIE) || "";

  const savedUserAgent =
    $persistentStore.read(KEY_USER_AGENT) || "";

  const finalCookie =
    currentCookie || savedCookie;

  const finalUserAgent =
    savedUserAgent || currentUserAgent;

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
   * 删除可能暴露 generic 页面来源的 Fetch Metadata，
   * 避免与手动写入的 Origin 冲突。
   */
  removeHeader(
    headers,
    "Sec-Fetch-Site"
  );

  removeHeader(
    headers,
    "Sec-Fetch-Mode"
  );

  removeHeader(
    headers,
    "Sec-Fetch-Dest"
  );

  log("=== NodeSeek Fog 握手已拦截 ===");
  log(`URL：${url}`);
  log(`Origin：${readHeader(headers, "Origin")}`);
  log(`Referer：${readHeader(headers, "Referer")}`);

  log(
    `Cookie：${
      finalCookie
        ? `已注入（${maskCookie(finalCookie)}）`
        : "未找到"
    }`
  );

  log(
    `User-Agent：${
      finalUserAgent
        ? "已注入"
        : "未找到"
    }`
  );

  const captureTime =
    $persistentStore.read(KEY_CAPTURE_TIME) || "未知";

  log(`身份捕获时间：${captureTime}`);

  $notification.post(
    SCRIPT_NAME,
    "Fog 握手已拦截",
    [
      `Cookie：${finalCookie ? "已注入" : "未找到"}`,
      `User-Agent：${finalUserAgent ? "已注入" : "未找到"}`,
      `Origin：https://www.nodeseek.com`
    ].join("\n")
  );

  /*
   * 使用修改后的完整请求头继续握手。
   */
  $done({
    headers
  });
}

function main() {
  const request =
    typeof $request !== "undefined"
      ? $request
      : null;

  if (!request || !request.url) {
    log("没有获取到 $request");

    $done({});
    return;
  }

  const url =
    String(request.url);

  const headers =
    request.headers || {};

  /*
   * 每次访问 NodeSeek 都尝试更新 Cookie 和 UA。
   */
  saveRequestIdentity(headers);

  if (isFogRequest(url)) {
    handleFogHandshake(
      url,
      headers
    );

    return;
  }

  /*
   * 普通网页请求不做修改。
   */
  $done({});
}

try {
  main();
} catch (error) {
  log(
    `执行异常：${String(
      error && (
        error.stack ||
        error.message
      ) || error
    )}`
  );

  /*
   * 出错时保持原请求继续，避免影响网页访问。
   */
  $done({});
}