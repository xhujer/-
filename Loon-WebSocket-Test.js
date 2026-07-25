/*
 * Loon WebSocket 对照测试
 *
 * 测试目标：
 * 1. Postman Echo：确认 Loon WebSocket 本身可用
 * 2. NodeSeek Fog：确认 Fog WebSocket 握手是否成功
 */

const SCRIPT_NAME = "WebSocket 对照测试";
const TEST_TIMEOUT = 15000;

const TARGETS = [
  {
    name: "Postman Echo",
    url: "wss://ws.postman-echo.com/raw"
  },
  {
    name: "NodeSeek Fog",
    url: "wss://www.nodeseek.com/edge-cgi/fog"
  }
];

const results = [];

function cleanText(value) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function log(message) {
  console.log(message);
}

function testWebSocket(target) {
  return new Promise((resolve) => {
    let socket = null;
    let timer = null;
    let finished = false;

    const startedAt = Date.now();

    function finish(status, detail) {
      if (finished) {
        return;
      }

      finished = true;

      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      const elapsed =
        Date.now() - startedAt;

      const result = {
        name: target.name,
        url: target.url,
        status,
        detail: cleanText(detail),
        elapsed
      };

      results.push(result);

      log(
        `${target.name}：${status}，` +
        `${result.detail}，` +
        `耗时 ${elapsed}ms`
      );

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

      resolve(result);
    }

    try {
      socket =
        new WebSocket(target.url);

      try {
        socket.binaryType =
          "arraybuffer";
      } catch {}

      socket.onopen = () => {
        finish(
          "连接成功",
          `readyState=${socket.readyState}`
        );
      };

      socket.onmessage = (event) => {
        const data =
          event?.data;

        if (
          typeof ArrayBuffer !== "undefined" &&
          data instanceof ArrayBuffer
        ) {
          log(
            `${target.name} 收到二进制消息：` +
            `${data.byteLength} 字节`
          );
        } else {
          log(
            `${target.name} 收到消息：` +
            `${String(data ?? "").slice(0, 150)}`
          );
        }
      };

      socket.onerror = (event) => {
        finish(
          "连接错误",
          cleanText(
            event?.message ||
            event?.error?.message ||
            event?.error ||
            "未返回具体错误"
          )
        );
      };

      socket.onclose = (event) => {
        finish(
          "连接关闭",
          [
            `code=${event?.code ?? "未知"}`,
            `reason=${
              cleanText(event?.reason) ||
              "无"
            }`
          ].join("，")
        );
      };

      timer = setTimeout(() => {
        finish(
          "连接超时",
          `readyState=${
            socket?.readyState ??
            "未知"
          }`
        );
      }, TEST_TIMEOUT);
    } catch (error) {
      finish(
        "创建失败",
        cleanText(
          error?.stack ||
          error?.message ||
          error
        )
      );
    }
  });
}

function buildHtml() {
  const rows = results
    .map((item) => {
      const successful =
        item.status === "连接成功";

      return `
        <div style="
          margin-bottom:14px;
          padding:14px;
          border-radius:12px;
          background:rgba(128,128,128,0.12);
        ">
          <div style="
            font-size:17px;
            font-weight:600;
            margin-bottom:8px;
          ">
            ${successful ? "✅" : "⚠️"}
            ${escapeHtml(item.name)}
          </div>

          <div>
            地址：${escapeHtml(item.url)}
          </div>

          <div>
            状态：${escapeHtml(item.status)}
          </div>

          <div>
            详情：${escapeHtml(item.detail)}
          </div>

          <div>
            耗时：${item.elapsed}ms
          </div>
        </div>
      `;
    })
    .join("");

  const logText = results
    .map((item) => {
      return (
        `${item.name}：${item.status}，` +
        `${item.detail}，` +
        `耗时 ${item.elapsed}ms`
      );
    })
    .join("\n");

  return `
    <div style="
      padding:16px;
      font-family:-apple-system,
        BlinkMacSystemFont,
        sans-serif;
      line-height:1.65;
      word-break:break-word;
    ">
      <h2 style="
        margin:0 0 16px 0;
      ">
        WebSocket 对照测试
      </h2>

      ${rows}

      <pre style="
        padding:14px;
        border-radius:12px;
        background:rgba(128,128,128,0.12);
        white-space:pre-wrap;
        word-break:break-word;
        font-size:13px;
      ">${escapeHtml(logText)}</pre>
    </div>
  `;
}

function finishScript() {
  const summary = results
    .map((item) => {
      return (
        `${item.name}：${item.status}，` +
        `${item.detail}，` +
        `耗时 ${item.elapsed}ms`
      );
    })
    .join("\n");

  $notification.post(
    SCRIPT_NAME,
    "测试完成",
    summary
  );

  $done({
    title: "WebSocket 对照测试完成",
    htmlMessage: buildHtml()
  });
}

(async () => {
  try {
    log(
      "=== WebSocket 对照测试 ==="
    );

    log(
      `WebSocket：${typeof WebSocket}`
    );

    if (
      typeof WebSocket !== "function"
    ) {
      results.push({
        name: "Loon 环境",
        url: "",
        status: "不可用",
        detail:
          "WebSocket 构造器不存在",
        elapsed: 0
      });

      finishScript();
      return;
    }

    for (const target of TARGETS) {
      await testWebSocket(target);
    }

    finishScript();
  } catch (error) {
    const message =
      cleanText(
        error?.stack ||
        error?.message ||
        error
      );

    log(`测试异常：${message}`);

    results.push({
      name: "脚本运行",
      url: "",
      status: "异常",
      detail: message,
      elapsed: 0
    });

    finishScript();
  }
})();