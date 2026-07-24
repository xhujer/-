const SCRIPT_NAME = "Loon WebSocket 环境检测";
const FOG_URL = "wss://www.nodeseek.com/edge-cgi/fog";
const CONNECT_TIMEOUT = 8000;

let finished = false;
let socket = null;
let timer = null;
const logs = [];

function cleanText(value) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .trim();
}

function addLog(name, value = "") {
  const line = value === ""
    ? cleanText(name)
    : `${cleanText(name)}：${cleanText(value)}`;

  logs.push(line);
  console.log(line);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(title, details) {
  const content = [
    ...logs,
    "",
    `=== ${title} ===`,
    details
  ].join("\n");

  return `
  <div style="
    padding:16px;
    font-family:-apple-system,BlinkMacSystemFont,sans-serif;
    line-height:1.65;
    word-break:break-word;
  ">
    <h2 style="margin:0 0 14px 0;">
      ${escapeHtml(title)}
    </h2>

    <pre style="
      margin:0;
      padding:14px;
      border-radius:12px;
      background:rgba(128,128,128,0.12);
      white-space:pre-wrap;
      word-break:break-word;
      font-size:14px;
    ">${escapeHtml(content)}</pre>
  </div>`;
}

function closeSocket() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  if (!socket) {
    return;
  }

  try {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    socket.close();
  } catch {}

  socket = null;
}

function finish(title, details) {
  if (finished) {
    return;
  }

  finished = true;
  closeSocket();

  const finalTitle = cleanText(title);
  const finalDetails = cleanText(details);

  console.log("");
  console.log(`=== ${finalTitle} ===`);
  console.log(finalDetails);

  /*
   * generic 脚本必须返回 title 和 htmlMessage，
   * 否则 Loon 会显示空白结果页。
   */
  $done({
    title: finalTitle,
    htmlMessage: buildHtml(
      finalTitle,
      finalDetails
    )
  });
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

function safeJson(value) {
  try {
    return JSON.stringify(
      value,
      null,
      2
    );
  } catch {
    return String(value);
  }
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
        "WebCrypto SHA-256 可用\n" +
        bytesToHex(digest)
    };
  } catch (error) {
    return {
      available: false,
      message:
        "WebCrypto SHA-256 执行失败：" +
        cleanText(
          error?.message || error
        )
    };
  }
}

async function inspectEnvironment() {
  addLog(
    "=== Loon JavaScript 环境检测 ==="
  );

  addLog(
    "$loon",
    typeof $loon !== "undefined"
      ? safeJson($loon)
      : "undefined"
  );

  addLog(
    "$environment",
    typeof $environment !== "undefined"
      ? safeJson($environment)
      : "undefined"
  );

  addLog(
    "WebSocket",
    typeof WebSocket
  );

  addLog(
    "crypto",
    typeof crypto
  );

  addLog(
    "crypto.subtle",
    typeof crypto !== "undefined" &&
    crypto
      ? typeof crypto.subtle
      : "undefined"
  );

  addLog(
    "crypto.getRandomValues",
    typeof crypto !== "undefined" &&
    crypto
      ? typeof crypto.getRandomValues
      : "undefined"
  );

  addLog(
    "crypto.randomUUID",
    typeof crypto !== "undefined" &&
    crypto
      ? typeof crypto.randomUUID
      : "undefined"
  );

  addLog(
    "TextEncoder",
    typeof TextEncoder
  );

  addLog(
    "TextDecoder",
    typeof TextDecoder
  );

  addLog(
    "Uint8Array",
    typeof Uint8Array
  );

  addLog(
    "ArrayBuffer",
    typeof ArrayBuffer
  );

  addLog(
    "Blob",
    typeof Blob
  );

  addLog(
    "Worker",
    typeof Worker
  );

  addLog(
    "URL",
    typeof URL
  );

  addLog(
    "btoa",
    typeof btoa
  );

  addLog(
    "atob",
    typeof atob
  );

  addLog(
    "document",
    typeof document
  );

  addLog(
    "location",
    typeof location
  );

  const cryptoResult =
    await testWebCrypto();

  addLog(
    "WebCrypto 测试",
    cryptoResult.message
  );

  return cryptoResult;
}

function testFogWebSocket(cryptoResult) {
  if (typeof WebSocket !== "function") {
    finish(
      "❌ WebSocket 不可用",
      [
        "WebSocket：不支持",
        cryptoResult.message,
        "",
        "结论：Loon 当前脚本环境不能直接建立 NodeSeek Fog WebSocket。"
      ].join("\n")
    );

    return;
  }

  addLog(
    "Fog 测试",
    `开始连接 ${FOG_URL}`
  );

  try {
    socket =
      new WebSocket(FOG_URL);

    try {
      socket.binaryType =
        "arraybuffer";
    } catch {}

    socket.onopen = () => {
      finish(
        "✅ Fog 连接成功",
        [
          "WebSocket：可用",
          "NodeSeek Fog：连接成功",
          cryptoResult.message,
          "",
          "结论：可以继续制作纯 Loon Fog 验证脚本。"
        ].join("\n")
      );
    };

    socket.onmessage = (event) => {
      const data =
        event?.data;

      if (
        typeof ArrayBuffer !== "undefined" &&
        data instanceof ArrayBuffer
      ) {
        addLog(
          "Fog 消息",
          `二进制数据 ${data.byteLength} 字节`
        );

        return;
      }

      if (typeof data === "string") {
        addLog(
          "Fog 消息",
          `文本数据 ${data.length} 字符`
        );

        return;
      }

      addLog(
        "Fog 消息",
        `类型 ${typeof data}`
      );
    };

    socket.onerror = (event) => {
      const errorText =
        cleanText(
          event?.message ||
          event?.error?.message ||
          event?.error ||
          "未返回具体错误"
        );

      finish(
        "❌ Fog 连接失败",
        [
          "WebSocket：构造器存在",
          "NodeSeek Fog：连接失败",
          `错误：${errorText}`,
          cryptoResult.message
        ].join("\n")
      );
    };

    socket.onclose = (event) => {
      if (finished) {
        return;
      }

      finish(
        "⚠️ Fog 连接已关闭",
        [
          "WebSocket：构造器存在",
          `关闭代码：${event?.code ?? "未知"}`,
          `关闭原因：${cleanText(event?.reason) || "无"}`,
          cryptoResult.message
        ].join("\n")
      );
    };

    timer = setTimeout(() => {
      finish(
        "⚠️ Fog 连接超时",
        [
          "WebSocket：构造器存在",
          `${CONNECT_TIMEOUT / 1000} 秒内未建立连接`,
          `readyState：${socket?.readyState ?? "未知"}`,
          cryptoResult.message
        ].join("\n")
      );
    }, CONNECT_TIMEOUT);
  } catch (error) {
    finish(
      "❌ WebSocket 创建失败",
      [
        "WebSocket：构造器存在",
        "NodeSeek Fog：创建连接时发生异常",
        `错误：${cleanText(
          error?.message || error
        )}`,
        cryptoResult.message
      ].join("\n")
    );
  }
}

(async () => {
  try {
    const cryptoResult =
      await inspectEnvironment();

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