// V2EX Cookie 抓取调试版
var COOKIE_KEY = "V2EX_Cookie";

function notify(title, subtitle, body) {
  $notification.post(title, subtitle, body);
}

// 调试：检查是否进入抓包分支
if (typeof $request !== "undefined" && $request) {
  console.log("========== V2EX 调试模式 ==========");
  console.log("✅ 已进入 http-request 抓包分支");
  console.log("URL: " + ($request.url || "无"));
  console.log("Method: " + ($request.method || "无"));
  
  var allHeaders = $request.headers || {};
  console.log("========== Request Headers ==========");
  for (var key in allHeaders) {
    if (key.toLowerCase() === "cookie") {
      var cookieVal = allHeaders[key];
      console.log("Cookie 长度: " + cookieVal.length);
      console.log("Cookie 前100字符: " + cookieVal.substring(0, 100));
      
      // 检查关键字段
      var hasA2 = /\bA2=/.test(cookieVal);
      var hasPB3 = /\bPB3=/.test(cookieVal);
      console.log("包含 A2: " + (hasA2 ? "✅" : "❌"));
      console.log("包含 PB3: " + (hasPB3 ? "✅" : "❌"));
      
      if (!hasA2 || !hasPB3) {
        notify("V2EX 调试", "❌ Cookie 不完整", 
          "A2: " + (hasA2 ? "有" : "无") + "\n" +
          "PB3: " + (hasPB3 ? "有" : "无") + "\n\n" +
          "请在 Safari 退出后重新登录");
      } else {
        notify("V2EX 调试", "✅ Cookie 完整", 
          "已捕获完整 Cookie\n长度: " + cookieVal.length);
        $persistentStore.write(cookieVal, COOKIE_KEY);
      }
    } else {
      console.log(key + ": " + allHeaders[key]);
    }
  }
  
  if (!allHeaders.Cookie && !allHeaders.cookie) {
    console.log("❌❌❌ 未捕获到 Cookie 字段 ❌❌❌");
    notify("V2EX 调试", "❌ 未捕获 Cookie", 
      "请检查:\n" +
      "1. MITM 是否开启\n" +
      "2. 证书是否已信任\n" +
      "3. hostname 是否包含 www.v2ex.com");
  }
  
  console.log("========================================");
  $done({});
} else {
  console.log("⚠️ 未检测到 $request 对象");
  console.log("当前是 cron 或 generic 触发，不是 http-request");
  
  var stored = $persistentStore.read(COOKIE_KEY);
  if (stored) {
    console.log("✅ 已有存储的 Cookie，长度: " + stored.length);
    notify("V2EX 调试", "Cookie 状态", "已存储 Cookie\n长度: " + stored.length);
  } else {
    console.log("❌ 未存储 Cookie");
    notify("V2EX 调试", "Cookie 状态", "未存储任何 Cookie");
  }
  $done({});
}