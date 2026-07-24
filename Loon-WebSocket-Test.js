const SCRIPT_NAME = "Loon 环境检测";
const FOG_URL = "wss://www.nodeseek.com/edge-cgi/fog";
const CONNECT_TIMEOUT = 8000;

let finished = false;
let socket = null;
let timer = null;

function cleanText(value) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .trim();
}

function log(name, value) {
  console.log(`${name}：${value}`);
}

function notify(title, subtitle = "", body = "") {
  $notification.post(
    cleanText(title) || SCRIPT_NAME,
    cleanText(subtitle),
    cleanText(body)
  );
}

function closeSocket() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  if (socket) {
    try {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    } catch {}

    socket = null;
  }
}

function finish(title, body) {
  if (finished) {
    return;
  }

  finished = true;
  closeSocket();

  console.log("");
  console.log(`=== ${title} ===`);
  console.log(body);

  notify(
    SCRIPT_NAME,
    title,
    body
  );

  $done();
}

function bytesToHex(buffer) {
  return Array.from(
    new Uint8Array(buffer)
  )
    .map((byte) => {
      return byte
        .toString(16)
        .padStart(2, "0");
    })
    .join("");
}

async function testWebCrypto() {
  if (
    typeof crypto === "undefined" ||
    !crypto ||
    !crypto.subtle ||
    typeof crypto.subtle.digest !== "function"
  ) {
    return {
      available: false,
      message: "WebCrypto SHA-256 不可用"
    };
  }

  if (typeof TextEncoder !== "function") {
    return {
      available: false,
      message: "TextEncoder 不可用"
    };
  }

  try {
    const data =
      new TextEncoder().encode(
        "NodeSeek"
      );

    const digest =
      await crypto.subtle.digest(
        "SHA-256",
        data
      );

    return {
      available: true,
      message:
        `WebCrypto SHA-256 可用\n` +
        `${bytesToHex(digest)}`
    };
  } catch (error) {
    return {
      available: false,
      message:
        `WebCrypto SHA-256 执行失败：` +
        `${cleanText(
          error?.message || error
        )}`
    };
  }
}

async function printEnvironment() {
  console.log(
    "=== Loon JavaScript 环境检测 ==="
  );

  log(
    "Loon 信息",
    typeof $loon !== "undefined"
      ? JSON.stringify($loon)
      : "undefined"
  );

  log(
    "WebSocket",
    typeof WebSocket
  );

  log(
    "crypto",
    typeof crypto
  );

  log(
    "crypto.subtle",
    typeof crypto !== "undefined" &&
    crypto
      ? typeof crypto.subtle
      : "undefined"
  );

  log(
    "crypto.getRandomValues",
    typeof crypto !== "undefined" &&
    crypto
      ? typeof crypto.getRandomValues
      : "undefined"
  );

  log(
    "crypto.randomUUID",
    typeof crypto !== "undefined" &&
    crypto
      ? typeof crypto.randomUUID
      : "undefined"
  );

  log(
    "TextEncoder",
    typeof TextEncoder
  );

  log(
    "TextDecoder",
    typeof TextDecoder
  );

  log(
    "Uint8Array",
    typeof Uint8Array
  );

  log(
    "ArrayBuffer",
    typeof ArrayBuffer
  );

  log(
    "Blob",
    typeof Blob
  );

  log(
    "Worker",
    typeof Worker
  );

  log(
    "URL",
    typeof URL
  );

  log(
    "btoa",
    typeof btoa
  );

  log(
    "atob",
    typeof atob
  );

  log(
    "document",
    typeof document
  );

  log(
    "location",
    typeof location
  );

  const cryptoResult =
    await testWebCrypto();

  console.log(
    cryptoResult.message
  );

  return cryptoResult;
}

function testFogWebSocket(
  cryptoResult
) {
  if (typeof WebSocket !== "function") {
    const details = [
      "WebSocket：不支持",
      cryptoResult.message,
      "",
      "结论：Loon 当前脚本环境不能直接建立 NodeSeek Fog WebSocket。"
    ].join("\n");

    finish(
      "❌ WebSocket 不可用",
      details
    );

    return;
  }

  console.log("");
  console.log(
    "检测到 WebSocket 构造器"
  );

  console.log(
    `开始连接：${FOG_URL}`
  );

  try {
    socket =
      new WebSocket(FOG_URL);

    try {
      socket.binaryType =
        "arraybuffer";
    } catch {}

    socket.onopen = () => {
      const details = [
        "WebSocket：可用",
        "NodeSeek Fog：连接成功",
        cryptoResult.message,
        "",
        "结论：可以继续尝试制作纯 Loon Fog 验证脚本。"
      ].join("\n");

      finish(
        "✅ Fog 连接成功",
        details
      );
    };

    socket.onmessage = (event) => {
      const data =
        event?.data;

      let description = "";

      if (
        data instanceof ArrayBuffer
      ) {
        description =
          `收到二进制消息，${data.byteLength} 字节`;
      } else if (
        typeof data === "string"
      ) {
        description =
          `收到文本消息，${data.length} 字符`;
      } else {
        description =
          `收到消息，类型：${typeof data}`;
      }

      console.log(description);
    };

    socket.onerror = (event) => {
      const errorText =
        cleanText(
          event?.message ||
          event?.error?.message ||
          event?.error ||
          "未返回具体错误"
        );

      const details = [
        "WebSocket：构造器存在",
        "NodeSeek Fog：连接失败",
        `错误：${errorText}`,
        cryptoResult.message,
        "",
        "结论：Loon 有 WebSocket 对象，但当前无法连接 Fog。"
      ].join("\n");

      finish(
        "❌ Fog 连接失败",
        details
      );
    };

    socket.onclose = (event) => {
      if (finished) {
        return;
      }

      const code =
        event?.code ?? "未知";

      const reason =
        cleanText(
          event?.reason
        ) || "无";

      const details = [
        "WebSocket：构造器存在",
        "NodeSeek Fog：连接已关闭",
        `关闭代码：${code}`,
        `关闭原因：${reason}`,
        cryptoResult.message
      ].join("\n");

      finish(
        "⚠️ Fog 连接关闭",
        details
      );
    };

    timer = setTimeout(() => {
      const readyState =
        socket?.readyState ??
        "未知";

      const details = [
        "WebSocket：构造器存在",
        `NodeSeek Fog：${CONNECT_TIMEOUT / 1000} 秒内未建立连接`,
        `readyState：${readyState}`,
        cryptoResult.message
      ].join("\n");

      finish(
        "⚠️ Fog 连接超时",
        details
      );
    }, CONNECT_TIMEOUT);
  } catch (error) {
    const details = [
      "WebSocket：构造器存在",
      "NodeSeek Fog：创建连接时异常",
      `错误：${cleanText(
        error?.message || error
      )}`,
      cryptoResult.message
    ].join("\n");

    finish(
      "❌ WebSocket 创建失败",
      details
    );
  }
}

(async () => {
  try {
    const cryptoResult =
      await printEnvironment();

    testFogWebSocket(
      cryptoResult
    );
  } catch (error) {
    finish(
      "❌ 检测异常",
      cleanText(
        error?.stack ||
        error?.message ||
        error
      )
    );
  }
})();