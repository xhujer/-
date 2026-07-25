/*
 * NodeSeek Fog WebSocket 握手响应检测
 */

const SCRIPT_NAME = "NodeSeek Fog 响应";

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

function log(message) {
  console.log(`[${SCRIPT_NAME}] ${message}`);
}

try {
  if (
    typeof $response === "undefined" ||
    !$response
  ) {
    log("没有获取到响应信息");
    $done({});
  } else {
    const status =
      $response.status ??
      $response.statusCode ??
      "未知";

    const headers =
      $response.headers || {};

    log("=== Fog WebSocket 响应 ===");
    log(`URL：${$request?.url || "未知"}`);
    log(`HTTP 状态：${status}`);

    log(
      `Upgrade：${
        readHeader(headers, "Upgrade") ||
        "无"
      }`
    );

    log(
      `Connection：${
        readHeader(headers, "Connection") ||
        "无"
      }`
    );

    log(
      `Server：${
        readHeader(headers, "Server") ||
        "无"
      }`
    );

    log(
      `CF-Ray：${
        readHeader(headers, "CF-Ray") ||
        "无"
      }`
    );

    log(
      `Content-Type：${
        readHeader(headers, "Content-Type") ||
        "无"
      }`
    );

    $notification.post(
      SCRIPT_NAME,
      `HTTP ${status}`,
      [
        `Upgrade：${readHeader(headers, "Upgrade") || "无"}`,
        `Server：${readHeader(headers, "Server") || "无"}`,
        `CF-Ray：${readHeader(headers, "CF-Ray") || "无"}`
      ].join("\n")
    );

    /*
     * 必须使用 $done({}) 放行响应。
     * 在 http-response 中直接 $done() 会断开连接。
     */
    $done({});
  }
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