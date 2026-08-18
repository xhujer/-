var COOKIE_KEY = "V2EX_Cookie";
var READ_COUNT = 20;
var READ_SOURCES = ["/", "/?tab=hot", "/?tab=all", "/?tab=tech", "/recent?p=1", "/recent?p=2"];

var COMMON_HEADERS = {
  "Accept": "*/*",
  "Accept-Language": "en,zh-CN;q=0.9,zh;q=0.8",
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Referer": "https://www.v2ex.com/"
};

function notify(title, subtitle, body) {
  $notification.post(title, subtitle, body);
}

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function readGap() {
  return 3000 + Math.floor(Math.random() * 3000);
}

function isValidPost(html) {
  if (!html) return false;
  if (/cf-challenge|just a moment|attention required/i.test(html)) return false;
  if (html.length < 3000) return false;
  return true;
}

function getStoredCookie() {
  try { return String($persistentStore.read(COOKIE_KEY) || "").trim(); }
  catch (e) { return ""; }
}

function isV2exLoginCookie(cookie) {
  return /(?:^|;\s*)A2O?=/i.test(String(cookie || ""));
}

function saveCookie(cookie) {
  try {
    if (!isV2exLoginCookie(cookie)) return false;
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

function mergeSetCookies(currentCookie, setCookieArr) {
  if (!setCookieArr || setCookieArr.length === 0) return currentCookie;
  var map = {};
  var parts = (currentCookie || "").split(";");
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].trim();
    if (!p) continue;
    var idx = p.indexOf("=");
    if (idx < 0) continue;
    map[p.slice(0, idx).trim()] = p.slice(idx + 1).trim();
  }
  for (var j = 0; j < setCookieArr.length; j++) {
    var sc = String(setCookieArr[j]);
    var first = sc.split(";")[0];
    var k = first.indexOf("=");
    if (k < 0) continue;
    var name = first.slice(0, k).trim();
    var value = first.slice(k + 1).trim();
    if (!name) continue;
    if (value === "" || /^deleted$/i.test(value) || /Max-Age=0/i.test(sc)) {
      delete map[name];
      continue;
    }
    if (map[name] !== value) map[name] = value;
  }
  var merged = [];
  for (var key in map) {
    if (Object.prototype.hasOwnProperty.call(map, key)) merged.push(key + "=" + map[key]);
  }
  return merged.join("; ");
}

function fetchUrl(url, headers, retries) {
  if (retries === undefined) retries = 3;
  if (headers && headers["Cookie"]) {
    var latestCookie = getStoredCookie();
    if (isV2exLoginCookie(latestCookie)) headers["Cookie"] = latestCookie;
  }
  return new Promise(function (resolve, reject) {
    $httpClient.get({ url: url, headers: headers }, function (err, resp, data) {
      if (err) {
        if (retries > 0) {
          console.log("⚠️ 请求失败，重试剩余 " + retries + " 次: " + url);
          sleep(2000).then(function () {
            fetchUrl(url, headers, retries - 1).then(resolve, reject);
          });
          return;
        }
        reject(err);
        return;
      }
      try {
        var sc = (resp && resp.headers && (resp.headers["Set-Cookie"] || resp.headers["set-cookie"])) || [];
        if (!Array.isArray(sc)) sc = [sc];
        if (sc.length > 0 && headers && headers["Cookie"]) {
          var newCookie = mergeSetCookies(headers["Cookie"], sc);
          if (newCookie !== headers["Cookie"] && isV2exLoginCookie(newCookie)) {
            headers["Cookie"] = newCookie;
            $persistentStore.write(newCookie, COOKIE_KEY);
          }
        }
      } catch (e) {}
      resolve(data || "");
    });
  });
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
    var nickMatch = html.match(/\/member\/([A-Za-z0-9_-]+)/);
    if (nickMatch) result.nickname = nickMatch[1];

    var parts = [];
    var balanceBlock = html.match(/class="balance_area bigger"[\s\S]*?<\/div>/);
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
      var descCell = stripHtml(rm[4]).trim();

      var date = "";
      var dm = timeStr.match(/(\d{8})/);
      if (dm) date = dm[1];
      else { var d2 = descCell.match(/(\d{8})/); if (d2) date = d2[1]; }

      result.transactions.push({ type: typeCell, amount: amountCell, date: date });
    }
    return result;
  } catch (e) { return result; }
}

function getOnce(headers) {
  return fetchUrl("https://www.v2ex.com/mission/daily", headers).then(function (html) {
    if (!html || html.indexOf("需要先登录") !== -1) return { once: "", logged_in: false, already: false, days: "?" };
    if (/href="\/signin"/i.test(html) && !/href="\/signout"/i.test(html)) return { once: "", logged_in: false, already: false, days: "?" };
    var dm = html.match(/已连续登录\s*(\d+)\s*天/);
    var days = dm ? dm[1] : "?";
    if (html.indexOf("每日登录奖励已领取") !== -1) return { once: "", logged_in: true, already: true, days: days };
    var om = html.match(/once\s*=\s*["']?(\d+)/);
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

function formatCard(info, q) {
  var lines = ["用户昵称：" + (q.nickname || "未知"), "连续登录：" + (info.days || "?") + " 天", "当前余额：" + (q.balance || "未知"), ""];
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
  return getOnce(headers).then(function (info) {
    if (!info.logged_in) {
      console.log("❌ Cookie 已失效，请重新抓取");
      notify("V2EX", "❌ Cookie 已失效", "请重新登录并抓取 Cookie");
      return false;
    }
    if (info.already) {
      return queryBalance(headers).then(function (q) {
        var body = formatCard(info, q);
        console.log("📌 V2EX 每日签到\n今天已完成签到\n\n" + body);
        notify("📌 V2EX 每日签到", "今天已完成签到", body);
        return true;
      });
    }
    if (!info.once) {
      if (attempt + 1 < maxRetry) return sleep(3000).then(function () { return doCheckin(attempt + 1, maxRetry, headers); });
      console.log("❌ 签到失败：未找到 once 码");
      notify("V2EX", "❌ 签到失败", "未找到 once 码");
      return false;
    }
    return fetchUrl("https://www.v2ex.com/mission/daily/redeem?once=" + info.once, headers).then(function () {
      return getOnce(headers);
    }).then(function (checkInfo) {
      if (!checkInfo.already) {
        if (attempt + 1 < maxRetry) return sleep(3000).then(function () { return doCheckin(attempt + 1, maxRetry, headers); });
        console.log("❌ 签到失败：签到未生效");
        notify("V2EX", "❌ 签到失败", "签到未生效，请稍后重试");
        return false;
      }
      return queryBalance(headers).then(function (q) {
        var todayReward = "";
        if (q.transactions && q.transactions.length > 0) {
          var t = q.transactions[0];
          if (t.type.indexOf("每日登录奖励") !== -1) {
            var n = parseFloat(t.amount);
            if (!isNaN(n)) todayReward = "今日签到：" + (n > 0 ? "+" : "") + n + " 铜币";
          }
        }
        var body = formatCard(checkInfo, q);
        if (todayReward) body = todayReward + "\n" + body;
        console.log("📌 V2EX 每日签到\n今天签到成功\n\n" + body);
        notify("📌 V2EX 每日签到", "今天签到成功", body);
        return true;
      });
    });
  }).catch(function (e) {
    if (attempt + 1 < maxRetry) return sleep(3000).then(function () { return doCheckin(attempt + 1, maxRetry, headers); });
    console.log("❌ 网络错误，请检查网络连接");
    notify("V2EX", "❌ 网络错误", "请检查网络连接");
    return false;
  });
}

function extractCopper(balanceStr) {
  var m = String(balanceStr || "").match(/(\d+)\s*铜币/);
  return m ? parseInt(m[1], 10) : null;
}

function fetchTopics(headers) {
  var all = [];
  var seen = {};
  var sources = READ_SOURCES.slice();
  sources.sort(function () { return Math.random() - 0.5; });
  var chain = Promise.resolve();
  for (var s = 0; s < sources.length; s++) {
    (function (path) {
      chain = chain.then(function () {
        return fetchUrl("https://www.v2ex.com" + path, headers).then(function (html) {
          var re = /href="\/t\/(\d+)[^"]*"[^>]*>([\s\S]*?)<\/a>/g, m;
          while ((m = re.exec(html)) !== null) {
            var id = m[1];
            if (!seen[id]) {
              seen[id] = true;
              all.push({ id: id, title: stripHtml(m[2]) });
            }
          }
        }).catch(function (e) {
          console.log("⏭️ 帖子来源失败，跳过 " + path + ": " + e);
        });
      });
    })(sources[s]);
  }
  return chain.then(function () { return all; });
}

function doRead(headers) {
  return queryBalance(headers).catch(function () {
    return { balance: "" };
  }).then(function (base) {
    var baseCopper = extractCopper(base.balance);
    return fetchTopics(headers).then(function (topics) {
      if (!topics.length) {
        notify("V2EX", "❌ 阅读失败", "未获取到帖子列表");
        return;
      }
      topics.sort(function () { return Math.random() - 0.5; });
      var count = Math.min(topics.length, READ_COUNT);
      var done = 0, skipped = 0;
      var chain = Promise.resolve();
      console.log("📖 开始阅读 " + count + " 个帖子");
      for (var i = 0; i < count; i++) {
        (function (topic, idx) {
          chain = chain.then(function () {
            return fetchUrl("https://www.v2ex.com/t/" + topic.id, headers).then(function (html) {
              if (isValidPost(html)) {
                done++;
                console.log(done + "/" + count + " " + topic.title);
              } else {
                skipped++;
                console.log("⏭️ 跳过无效页面 " + topic.id);
              }
            }).catch(function (e) {
              skipped++;
              console.log("⏭️ 读取失败，跳过 " + topic.id + ": " + e);
            });
          }).then(function () {
            if (idx + 1 >= count) return;
            return sleep(readGap());
          }).then(function () {
            if (idx + 1 < count && (idx + 1) % 5 === 0) {
              return sleep(8000 + Math.floor(Math.random() * 7000));
            }
          });
        })(topics[i], i);
      }
      return chain.then(function () {
        return queryBalance(headers).catch(function () {
          return { balance: "" };
        }).then(function (final) {
          var finalCopper = extractCopper(final.balance);
          var delta = (baseCopper !== null && finalCopper !== null) ? finalCopper - baseCopper : null;
          var msg = "已读 " + done + " 篇，跳过 " + skipped + " 篇";
          if (delta !== null) msg += "，铜币 " + (delta > 0 ? "+" : "") + delta;
          console.log("📖 阅读完成，" + msg);
          notify("V2EX", "📖 阅读完成", msg);
        });
      });
    });
  }).catch(function (e) {
    console.log("❌ 阅读失败: " + e);
    notify("V2EX", "❌ 阅读失败", "未获取到可读帖子");
  });
}

function extractUsernameFromHtml(html) {
  if (!html) return "";
  var m = String(html).match(/href=["']\/member\/([A-Za-z0-9_-]+)["'][^>]*>/i);
  return m ? m[1] : "";
}

if (typeof $response !== "undefined" && $response && typeof $response.body !== "undefined") {
  var responseHeaders = $response.headers || {};
  var contentType = String(responseHeaders["Content-Type"] || responseHeaders["content-type"] || "");
  if (contentType && contentType.toLowerCase().indexOf("text/html") === -1) {
    $done({});
  } else {
    var responseUsername = extractUsernameFromHtml($response.body);
    var responseCookie = getStoredCookie();
    if (responseUsername && isV2exLoginCookie(responseCookie)) {
      var lastNotifiedUser = "";
      try { lastNotifiedUser = String($persistentStore.read("V2EX_LastNotifiedUser") || ""); } catch (e) {}
      try { $persistentStore.write(responseUsername, "V2EX_Username"); } catch (e) {}
      if (lastNotifiedUser !== responseUsername) {
        try { $persistentStore.write(responseUsername, "V2EX_LastNotifiedUser"); } catch (e) {}
        notify("V2EX", "🎉" + responseUsername + " cookie存储成功", "");
      }
    }
    $done({});
  }
} else if (typeof $request !== "undefined" && $request && $request.headers) {
  console.log("=== V2EX 抓包 ===");
  var allHeaders = $request.headers || {};
  var cookie = allHeaders.Cookie || allHeaders.cookie || "";
  if (!isV2exLoginCookie(cookie)) {
    console.log("忽略不含 A2O/A2 的非登录 Cookie");
    $done({});
  } else {
    var changed = saveCookie(cookie);
    console.log("已捕获登录 Cookie，长度 " + cookie.length + (changed ? "，已更新" : "，内容未变化"));
    if (changed) console.log("等待 HTML 响应提取用户名并通知");
    $done({});
  }
} else {
  var scriptName = (typeof $script !== "undefined" && $script.name) || "";
  var storedCookie = getStoredCookie();
  if (!storedCookie) {
    console.log("⚠️ 无 Cookie，请先打开「获取Cookie」开关并访问 V2EX");
    notify("V2EX", "⚠️ 无 Cookie", "请打开获取Cookie开关后访问 V2EX");
    $done({});
  } else if (/阅读|read/i.test(scriptName)) {
    console.log("=== V2EX 阅读 ===");
    doRead(buildHeaders(storedCookie)).then(function () { $done({}); });
  } else {
    var h = buildHeaders(storedCookie);
    doCheckin(0, 3, h).then(function (ok) {
      if (ok) return doRead(h);
    }).then(function () { $done({}); });
  }
}