var COOKIE_KEY = "V2EX_Cookie";

var COMMON_HEADERS = {
  "Accept": "*/*",
  "Accept-Language": "en,zh-CN;q=0.9,zh;q=0.8",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Referer": "https://www.v2ex.com/"
};

var $http = {
  fetch: function (opts) {
    return new Promise(function (resolve, reject) {
      var handler = function (err, resp, data) {
        if (err) reject(err);
        else resolve(data || "");
      };
      if ((opts.method || "GET").toUpperCase() === "POST") $httpClient.post(opts, handler);
      else $httpClient.get(opts, handler);
    });
  }
};

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function getStoredCookie() {
  try { return String($persistentStore.read(COOKIE_KEY) || "").trim(); }
  catch (e) { return ""; }
}

function saveCookie(cookie) {
  try {
    if (!cookie) return false;
    if (getStoredCookie() === cookie) return false;
    $persistentStore.write(cookie, COOKIE_KEY);
    return true;
  } catch (e) { return false; }
}

function buildHeaders(cookie) {
  var h = {};
  for (var k in COMMON_HEADERS) h[k] = COMMON_HEADERS[k];
  h["Cookie"] = cookie;
  return h;
}

function fetchUrl(url, headers) {
  return $http.fetch({ url: url, headers: headers, method: "GET" });
}

function stripHtml(str) {
  return String(str || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseProfile(html) {
  var result = { nickname: "", balance: "", transactions: [] };
  try {
    if (!html) return result;
    var nickMatch = html.match(/alt="([A-Za-z0-9_-]+)"/);
    if (nickMatch) result.nickname = nickMatch[1];

    var parts = [];
    var balanceBlock = html.match(/balance_area bigger[\s\S]*?<\/div>/);
    if (balanceBlock) {
      var re = /(\d+)\s+<img[^>]+alt="([A-Z])"/g, m;
      while ((m = re.exec(balanceBlock[0])) !== null) {
        if (m[2] === "G") parts.push(m[1] + " 金币");
        if (m[2] === "S") parts.push(m[1] + " 银币");
        if (m[2] === "B") parts.push(m[1] + " 铜币");
      }
    }
    result.balance = parts.join(", ") || "";

    var rowRe = /<tr>[\s\S]*?<td class="d">([\s\S]*?)<\/td>[\s\S]*?<td class="d"[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td class="d"[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td class="d"[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/g;
    var rm;
    while ((rm = rowRe.exec(html)) !== null) {
      var typeRaw = rm[1];
      var timeMatch = typeRaw.match(/<small class="gray">([\s\S]*?)<\/small>/);
      var timeStr = timeMatch ? stripHtml(timeMatch[1]).trim() : "";
      var typeCell = stripHtml(typeRaw.replace(/<small[\s\S]*?<\/small>/, "")).trim();
      var amountCell = stripHtml(rm[2]).trim();
      var balanceCell = stripHtml(rm[3]).trim();
      var descCell = stripHtml(rm[4]).trim();

      var date = "";
      var dm = timeStr.match(/(\d{8})/);
      if (dm) date = dm[1];
      else { var d2 = descCell.match(/(\d{8})/); if (d2) date = d2[1]; }

      result.transactions.push({ type: typeCell, time: timeStr, amount: amountCell, balance: balanceCell, desc: descCell, date: date });
    }
    return result;
  } catch (e) { return result; }
}

function getOnce(headers) {
  return fetchUrl("https://www.v2ex.com/mission/daily", headers).then(function (html) {
    if (!html || html.indexOf("需要先登录") !== -1) return { once: "", logged_in: false, already: false, days: "?" };
    var dm = html.match(/已连续登录\s*(\d+)\s*天/);
    var days = dm ? dm[1] : "?";
    if (html.indexOf("每日登录奖励已领取") !== -1) return { once: "", logged_in: true, already: true, days: days };
    var om = html.match(/once=(\d+)/);
    return { once: om ? om[1] : "", logged_in: true, already: false, days: days };
  });
}

function queryBalance(headers) {
  return fetchUrl("https://www.v2ex.com/balance", headers).then(function (html) { return parseProfile(html); });
}

function formatDate(d) {
  if (!d || d.length !== 8) return d;
  return d.substring(0, 4) + "-" + d.substring(4, 6) + "-" + d.substring(6, 8);
}

function formatCard(info, q, statusText) {
  var lines = ["📌 V2EX 每日签到", statusText, "", "用户昵称：" + (q.nickname || "未知"), "连续登录：" + (info.days || "?") + " 天", "当前余额：" + (q.balance || "未知"), ""];
  var txns = q.transactions || [];
  if (txns.length > 0) {
    lines.push("📝 最近流水：");
    for (var i = 0; i < txns.length && i < 3; i++) {
      lines.push("- " + formatDate(txns[i].date) + "：" + txns[i].amount + "（" + txns[i].type + "）");
    }
  }
  return lines.join("\n");
}

function doCheckin(attempt, maxRetry, headers) {
  console.log("签到尝试 " + (attempt + 1) + "/" + maxRetry);
  return getOnce(headers).then(function (info) {
    if (!info.logged_in) {
      console.log("登录状态: Cookie 已失效");
      $notification.post("V2EX", "❌ Cookie 已失效", "请重新登录并抓取 Cookie");
      $done({});
      return;
    }
    if (info.already) {
      console.log("登录状态: 正常 | 连续登录 " + info.days + " 天 | 今日已签到");
      return queryBalance(headers).then(function (q) {
        console.log("余额: " + (q.balance || "未知"));
        $notification.post("📌 V2EX 每日签到", "今天已完成签到", formatCard(info, q, "今天已完成签到"));
        $done({});
      });
    }
    if (!info.once) {
      if (attempt + 1 < maxRetry) return sleep(3000).then(function () { return doCheckin(attempt + 1, maxRetry, headers); });
      console.log("签到失败: 未找到 once 码");
      $notification.post("V2EX", "❌ 签到失败", "未找到 once 码");
      $done({});
      return;
    }
    console.log("登录状态: 正常 | 连续登录 " + info.days + " 天 | 开始签到");
    return fetchUrl("https://www.v2ex.com/mission/daily/redeem?once=" + info.once, headers).then(function () {
      return queryBalance(headers);
    }).then(function (q) {
      console.log("签到成功 | 余额: " + (q.balance || "未知"));
      $notification.post("📌 V2EX 每日签到", "今天签到成功", formatCard(info, q, "今天签到成功"));
      $done({});
    });
  }).catch(function (e) {
    if (attempt + 1 < maxRetry) return sleep(3000).then(function () { return doCheckin(attempt + 1, maxRetry, headers); });
    console.log("网络错误: " + e);
    $notification.post("V2EX", "❌ 网络错误", "请检查网络连接");
    $done({});
  });
}

function verifyAndSaveCookie(cookie) {
  return fetchUrl("https://www.v2ex.com/mission/daily", buildHeaders(cookie)).then(function (html) {
    var loggedIn = html.indexOf("已连续登录") !== -1 || html.indexOf("每日登录奖励") !== -1;
    if (!loggedIn) {
      console.log("回验失败: Cookie 无效或未登录");
      $notification.post("V2EX", "抓取失败", "Cookie 无效或未登录，请先登录 V2EX");
      return;
    }
    var um = html.match(/\/member\/([A-Za-z0-9_-]+)/);
    var username = um ? um[1] : "";
    console.log("回验成功: " + (username || "未知用户"));
    if (saveCookie(cookie)) {
      $notification.post("V2EX", "✅ 抓取成功", "已保存 Cookie" + (username ? "（用户：" + username + "）" : ""));
    }
  }).catch(function (e) {
    console.log("回验网络错误: " + e);
    $notification.post("V2EX", "抓取失败", "回验失败，请检查网络");
  });
}

if (typeof $request !== "undefined" && $request && $request.headers) {
  console.log("=== V2EX 抓包 ===");
  var allHeaders = $request.headers || {};
  var cookie = allHeaders.Cookie || allHeaders.cookie || "";
  if (!cookie) {
    console.log("未获取到 Cookie，请检查 MITM 配置");
    $notification.post("V2EX", "抓包失败", "未获取到 Cookie，请检查 MITM 配置");
    $done({});
  } else {
    console.log("已捕获 Cookie，长度 " + cookie.length + "，开始回验...");
    verifyAndSaveCookie(cookie).then(function () { $done({}); });
  }
} else {
  console.log("=== V2EX 每日签到 ===");
  var storedCookie = getStoredCookie();
  if (!storedCookie) {
    console.log("未找到 Cookie，请先打开「获取Cookie」开关并访问 V2EX");
    $notification.post("V2EX", "⚠️ 无 Cookie", "请打开获取Cookie开关后访问 V2EX");
    $done({});
  } else {
    console.log("已读取 Cookie，长度 " + storedCookie.length);
    doCheckin(0, 3, buildHeaders(storedCookie));
  }
}
