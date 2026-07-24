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

function testWebSocket(target) {
  return new Promise((resolve) => {
    let socket = null;
    let finished = false;
    let timer = null;
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

      const elapsed = Date.now() - startedAt;

      const result = {
        name: target.name,
        url: target.url,
        status,
        detail: cleanText(detail),
        elapsed
      };

      results.push(result);

      console.log(
        `${target.name}：${status}，` +
        `${result.detail}，耗时 ${elapsed}ms`
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
      socket = new WebSocket(target.url);

      try {
        socket.binaryType = "arraybuffer";
      } catch {}

      socket.onopen = () => {
        finish(
          "连接成功",
          `readyState=${socket.readyState}`
        );
      };

      socket.onmessage = (event) => {
        const data = event?.data;

        if (data instanceof ArrayBuffer) {
          console.log(
            `${target.name} 收到二进制消息：` +
            `${data.byteLength} 字节`
          );
        } else {
          console.log(
            `${target.name} 收到消息：` +
            `${String(data).slice(0, 100)}`
          );
        }
      };

      socket.onerror = (event) => {
        finish(
          "连接错误",
          event?.message ||
          event?.error?.message ||
          "未返回具体错误"
        );
      };

      socket.onclose = (event) => {
        finish(
          "连接关闭",
          `code=${event?.code ?? "未知"}，` +
          `reason=${cleanText(event?.reason) || "无"}`
        );
      };

      timer = setTimeout(() => {
        finish(
          "连接超时",
          `readyState=${socket?.readyState ?? "未知"}`
        );
      }, TEST_TIMEOUT);
    } catch (error) {
      finish(
        "创建失败",
        error?.message || error
      );
    }
  });
}

function buildHtml() {
  const rows = results
    .map((item) => {
      return `
        <div style="
          margin-bottom:14px;
          padding:14px;
          border-radius:12px;
          background:rgba(128,128,128,0.12);
        ">
          <strong>${escapeHtml(item.name)}</strong><br>
          状态：${escapeHtml(item.status)}<br>
          详情：${escapeHtml(item.detail)}<br>
          耗时：${item.elapsed}ms
        </div>
      `;
    })
    .join("");

  return `
    <div style="
      padding:16px;
      font-family:-apple-system,BlinkMacSystemFont,sans-serif;
      line-height:1.6;
    ">
      <h2>WebSocket 对照测试</h2>
      ${rows}
    </div>
  `;
}

(async () => {
  try {
    console.log("=== WebSocket 对照测试 ===");
    console.log(`WebSocket：${typeof WebSocket}`);

    if (typeof WebSocket !== "function") {
      $done({
        title: "❌ WebSocket 不可用",
        htmlMessage: "<h2>WebSocket 构造器不存在</h2>"
      });

      return;
    }

    for (const target of TARGETS) {
      await testWebSocket(target);
    }

    $done({
      title: "WebSocket 对照测试完成",
      htmlMessage: buildHtml()
    });
  } catch (error) {
    $done({
      title: "❌ 测试异常",
      htmlMessage:
        `<pre>${escapeHtml(
          error?.stack ||
          error?.message ||
          error
        )}</pre>`
    });
  }
})();