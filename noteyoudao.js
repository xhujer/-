/*
 * 有道云笔记 · 自动签到 + 看广告领空间（Loon）
 * v1.1.0 · 接口与 Loon Script API 按官方文档校对：nsloon.app/docs
 *
 * GET  /login/acc/pe/getsess?product=YNOTE   刷新会话
 * POST /yws/api/daupromotion?method=sync     每日登录奖励
 * POST /yws/mapi/user?method=checkin         每日签到
 * POST /yws/mapi/user?method=adPrompt        广告（普通）
 * POST /yws/mapi/user?method=adRandomPrompt  广告（视频）
 * GET  /yws/api/self?method=get              账号信息 / Cookie 校验
 *
 * 抓取模式：从 note.youdao.com 流量取 Cookie，校验后入库（多账号自动追加）
 * 定时/手动：刷新会话 → 登录奖励 → 签到 → 看广告 → 汇总通知
 */

var SCRIPT_VERSION = "1.2.0";
var HOST = "https://note.youdao.com";
var KEY_ACCOUNTS = "noteyoudao_accounts";
var KEY_BUSY = "noteyoudao_validating";
var KEY_DEVICE = "noteyoudao_device";
var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
var HTTP_TIMEOUT = 15000;

var isRequest = typeof $request !== "undefined";
var scriptName = !isRequest && typeof $script !== "undefined" ? String($script.name || "") : "";
var isManual = /手动|录入/.test(scriptName);
var arg = (typeof $argument === "object" && $argument) ? $argument : {};

function boolArg(v, d) {
  if (v === undefined || v === null || v === "") return d;
  return String(v).toLowerCase() === "true";
}
function numArg(v, d) {
  var n = Number(v);
  return isFinite(n) ? n : d;
}
function strArg(v, d) {
  return (v === undefined || v === null || String(v) === "") ? d : String(v);
}

var CFG = {
  clearAllAccounts: boolArg(arg.clearAllAccounts, false),
  enableNotify: boolArg(arg.enableNotify, true),
  adPrompt: boolArg(arg.adPrompt, true),
  adRandom: boolArg(arg.adRandom, true),
  adCount: Math.max(0, Math.min(10, Math.round(numArg(arg.adCount, 3)))),
  debug: boolArg(arg.debug, false),
  manualCookie: strArg(arg.manualCookie, "").trim()
};

function emit(tag, args) {
  var parts = [];
  for (var i = 0; i < args.length; i++) parts.push(args[i]);
  console.log("[有道云笔记" + tag + "] " + parts.join(" "));
}
function log() {
  emit("", arguments);
}
function debug() {
  if (CFG.debug) emit("·调试", arguments);
}
function safeJson(text) {
  try { return JSON.parse(text); } catch (e) { return null; }
}
function getHeader(headers, name) {
  if (!headers) return "";
  var lower = name.toLowerCase();
  for (var k in headers) {
    if (String(k).toLowerCase() === lower) return String(headers[k]);
  }
  return "";
}
function mb(bytes) {
  var n = Number(bytes);
  if (!isFinite(n) || n <= 0) return "0MB";
  var v = n / 1048576;
  return (v >= 100 ? v.toFixed(0) : v.toFixed(v >= 10 ? 1 : 2)) + "MB";
}
function cookieToObj(cookie) {
  var out = {};
  String(cookie || "").split(";").forEach(function (part) {
    var idx = part.indexOf("=");
    if (idx > 0) {
      var k = part.slice(0, idx).trim();
      var v = part.slice(idx + 1).trim();
      if (k) out[k] = v;
    }
  });
  return out;
}
function objToCookie(obj) {
  var list = [];
  for (var k in obj) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]) !== "") list.push(k + "=" + obj[k]);
  }
  return list.join("; ");
}
function uidOf(cookie) {
  var c = cookieToObj(cookie);
  var parts = String(c.YNOTE_PERS || "").split("||");
  return parts.length >= 2 ? String(parts[parts.length - 2] || "").trim() : "";
}
function accountKey(cookie) {
  var c = cookieToObj(cookie);
  return uidOf(cookie) || c.YNOTE_CSTK || c.YNOTE_SESS || String(cookie).slice(0, 40);
}
function maskAccount(key) {
  var s = String(key || "");
  if (s.length <= 6) return s;
  return s.slice(0, 3) + "***" + s.slice(-3);
}
function shortBody(text, limit) {
  var max = limit || 160;
  var s = String(text || "").replace(/[\r\n\t]+/g, " ").trim();
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function readAccounts() {
  try {
    var raw = $persistentStore.read(KEY_ACCOUNTS);
    var arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter(function (a) { return a && a.cookie; });
  } catch (e) {
    log("读取账号失败: " + e);
    return [];
  }
}
function saveAccounts(list) {
  $persistentStore.write(JSON.stringify(list), KEY_ACCOUNTS);
}
function isBusy() {
  try {
    var t = Number($persistentStore.read(KEY_BUSY)) || 0;
    return t > 0 && (Date.now() - t) < 20000;
  } catch (e) {
    return false;
  }
}
function setBusy(on) {
  try {
    $persistentStore.write(on ? String(Date.now()) : undefined, KEY_BUSY);
  } catch (e) {}
}
function upsertAccount(cookie, info) {
  var list = readAccounts();
  var key = accountKey(cookie);
  var rec = {
    key: key,
    cookie: cookie,
    name: (info && info.name) || "",
    uid: (info && info.uid) || uidOf(cookie),
    updatedAt: Date.now()
  };
  var found = false;
  for (var i = 0; i < list.length; i++) {
    if (list[i].key === key) {
      list[i] = Object.assign({}, list[i], rec);
      found = true;
      break;
    }
  }
  if (!found) list.push(rec);
  saveAccounts(list);
  return list.length;
}

function httpGet(url, headers, extra) {
  return new Promise(function (resolve) {
    $httpClient.get(requestOptions(url, headers, extra), function (err, resp, data) {
      resolve(normalize(err, resp, data));
    });
  });
}
function httpPost(url, headers, body) {
  return new Promise(function (resolve) {
    var opt = requestOptions(url, headers);
    opt.body = body === undefined ? "" : body;
    $httpClient.post(opt, function (err, resp, data) {
      resolve(normalize(err, resp, data));
    });
  });
}
function requestOptions(url, headers, extra) {
  var opt = { url: url, headers: headers || {}, timeout: HTTP_TIMEOUT };
  if (extra) {
    for (var k in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, k)) opt[k] = extra[k];
    }
  }
  return opt;
}
function normalize(err, resp, data) {
  var body = "";
  if (data !== undefined && data !== null) body = String(data);
  else if (resp && resp.body !== undefined && resp.body !== null) body = String(resp.body);
  if (!body && err) body = String(err);
  return {
    status: resp ? (resp.status || resp.statusCode || 0) : 0,
    headers: (resp && resp.headers) || {},
    body: body
  };
}
function apiHeaders(cookie) {
  return {
    "Cookie": cookie,
    "User-Agent": UA,
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://note.youdao.com/web/"
  };
}
function formHeaders(cookie) {
  var h = apiHeaders(cookie);
  h["Content-Type"] = "application/x-www-form-urlencoded;charset=utf-8";
  return h;
}
function cstkOf(cookie) {
  return cookieToObj(cookie).YNOTE_CSTK || "";
}
function qs(obj) {
  var list = [];
  for (var k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) list.push(encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]));
  }
  return list.join("&");
}
function randHex(len) {
  var s = "";
  while (s.length < len) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}
/* 网页版客户端会带一组设备参数，这里生成一次后固定下来 */
function deviceInfo() {
  var raw = $persistentStore.read(KEY_DEVICE);
  if (raw) {
    try {
      var d = JSON.parse(raw);
      if (d && d.appUser) return d;
    } catch (e) { }
  }
  var dev = { appUser: randHex(32), deviceId: randHex(16) };
  $persistentStore.write(JSON.stringify(dev), KEY_DEVICE);
  return dev;
}
function webParams(method, cookie) {
  var dev = deviceInfo();
  return {
    method: method,
    device_type: "PC",
    _system: "web",
    _systemVersion: "",
    _screenWidth: "1920",
    _screenHeight: "1080",
    _appName: "ynote",
    _appuser: dev.appUser,
    _vendor: "official-website",
    _launch: "0",
    _firstTime: "",
    _deviceId: dev.deviceId,
    _platform: "web",
    _cityCode: "",
    _cityName: "",
    _product: "YNote-Web",
    _version: "",
    sev: "j1",
    sec: "v1",
    keyfrom: "web",
    cstk: cstkOf(cookie)
  };
}
function collectSetCookie(headers) {
  var raw = getHeader(headers, "Set-Cookie");
  if (!raw) return [];
  if (Object.prototype.toString.call(raw) === "[object Array]") return raw.map(String);
  return String(raw).split(/,(?=\s*[^;,=\s]+=)/).map(function (s) { return s.trim(); }).filter(Boolean);
}
function mergeCookie(cookie, setCookies) {
  if (!setCookies || !setCookies.length) return cookie;
  var jar = cookieToObj(cookie);
  var changed = false;
  setCookies.forEach(function (sc) {
    var eq = sc.indexOf("=");
    if (eq <= 0) return;
    var name = sc.slice(0, eq).trim();
    var val = sc.slice(eq + 1).split(";")[0].trim();
    if (name && val && jar[name] !== val) {
      jar[name] = val;
      changed = true;
    }
  });
  return changed ? objToCookie(jar) : cookie;
}

function refreshSession(cookie) {
  return httpGet("http://note.youdao.com/login/acc/pe/getsess?product=YNOTE", apiHeaders(cookie), { "auto-redirect": false })
    .then(function (r) {
      var setCookies = collectSetCookie(r.headers);
      var merged = mergeCookie(cookie, setCookies);
      debug("getsess HTTP " + r.status + " · Set-Cookie " + setCookies.length + " 条 · 变化=" + (merged !== cookie));
      return merged;
    })
    .catch(function (e) {
      debug("getsess 异常（忽略，继续用原 Cookie）: " + e);
      return cookie;
    });
}

function fetchSelf(cookie) {
  return httpGet(HOST + "/yws/api/self?method=get", apiHeaders(cookie)).then(function (r) {
    var json = safeJson(r.body);
    if (json && !json.error) {
      return { ok: true, name: json.name || "", uid: json.userId || json.userid || "" };
    }
    return {
      ok: false,
      error: json && json.error ? String(json.error) : ("HTTP " + r.status),
      message: json && json.message ? String(json.message) : shortBody(r.body)
    };
  });
}

function apiError(json) {
  return {
    ok: false,
    auth: String(json.error) === "207" || /AUTHENTICATION_FAILURE/i.test(String(json.message || "")),
    message: String(json.message || json.error)
  };
}

function dailySync(cookie) {
  return httpPost(HOST + "/yws/api/daupromotion?method=sync", apiHeaders(cookie)).then(function (r) {
    var json = safeJson(r.body) || {};
    debug("sync HTTP " + r.status + " → " + shortBody(r.body, 400));
    if (json.error) return apiError(json);
    return {
      ok: true,
      already: json.accept === false,
      rewardSpace: Number(json.rewardSpace) || 0,
      continuousDays: json.continuousDays
    };
  });
}

function isAlreadySigned(json, text) {
  return json.success === 0 || /already|today|已签|已经签|重复签/.test(String(text || ""));
}
function checkinOk(json, text) {
  return {
    ok: true,
    already: isAlreadySigned(json, text),
    space: (Number(json.space) || 0) + (Number(json.rewardSpace) || 0)
  };
}
/* 网页版签到：URL 带客户端参数，表单体带 cstk（对齐网页端拦截器抓到的请求）。
 * 被服务端拒绝时退回基础 POST，保证不会比旧版更差。 */
function checkin(cookie) {
  var p = webParams("checkin", cookie);
  var url = HOST + "/yws/mapi/user?" + qs(p);
  return httpPost(url, formHeaders(cookie), "cstk=" + encodeURIComponent(p.cstk)).then(function (r) {
    debug("checkin(web) HTTP " + r.status + " → " + shortBody(r.body, 400));
    var json = safeJson(r.body) || {};
    if (json.error && !isAlreadySigned(json, r.body)) {
      debug("网页版参数被拒，改用基础请求重试");
      return httpPost(HOST + "/yws/mapi/user?method=checkin", apiHeaders(cookie)).then(function (r2) {
        var j2 = safeJson(r2.body) || {};
        debug("checkin(basic) HTTP " + r2.status + " → " + shortBody(r2.body, 400));
        if (j2.error && !isAlreadySigned(j2, r2.body)) return apiError(j2);
        return checkinOk(j2, r2.body);
      });
    }
    return checkinOk(json, r.body);
  });
}

function watchAd(cookie, method) {
  return httpPost(HOST + "/yws/mapi/user?method=" + method, apiHeaders(cookie)).then(function (r) {
    var json = safeJson(r.body) || {};
    debug(method + " HTTP " + r.status + " → " + shortBody(r.body, 400));
    if (json.error) return { ok: false, space: 0 };
    return { ok: true, space: (Number(json.space) || 0) + (Number(json.rewardSpace) || 0) };
  });
}

function notify(title, subtitle, body) {
  var text = title + "\n" + subtitle + "\n" + body;
  log("通知 → " + text.replace(/\n/g, " | "));
  if (!CFG.enableNotify) return;
  try {
    $notification.post(title, subtitle, body);
  } catch (e) {
    log("通知发送失败: " + e);
  }
}

async function runOne(acc, index) {
  var fallbackName = String(acc.name || uidOf(acc.cookie) || "").trim();
  var label = fallbackName || ("账号" + (index + 1));
  var result = { label: label, ok: false, auth: false, space: 0, lines: [] };
  var cookie = String(acc.cookie || "");

  var refreshed = await refreshSession(cookie);
  if (refreshed && refreshed !== cookie) {
    cookie = refreshed;
    updateStoredCookie(acc.key, cookie);
  }

  var me = await fetchSelf(cookie);
  if (me.ok && me.name) {
    label = me.name;
  } else if (!me.ok) {
    log(label + " self 校验失败(" + me.error + ")，改用 sync 判定");
  }
  result.lines.push("👤 " + label);

  var sync = await dailySync(cookie);
  if (!sync.ok) {
    result.auth = !!sync.auth || !me.ok;
    result.lines.push("❌ " + (result.auth ? "Cookie 已失效" : "登录奖励失败") + "：" + sync.message);
    log(label + " sync 失败: " + sync.message);
    return result;
  }
  var loginSpace = sync.already ? 0 : sync.rewardSpace;
  result.space += loginSpace;

  var ci = await checkin(cookie);
  if (!ci.ok) {
    result.auth = !!ci.auth;
    result.lines.push("❌ 签到失败：" + ci.message);
    log(label + " 签到失败: " + ci.message);
    return result;
  }
  result.space += ci.already ? 0 : ci.space;

  var adSpace = 0;
  var adNote = "";
  if (CFG.adCount > 0) {
    var plan = [];
    if (CFG.adPrompt) plan.push(["adPrompt", "普通广告"]);
    if (CFG.adRandom) plan.push(["adRandomPrompt", "视频广告"]);
    for (var p = 0; p < plan.length; p++) {
      var method = plan[p][0];
      var got = 0;
      for (var n = 0; n < CFG.adCount; n++) {
        var r = await watchAd(cookie, method);
        if (!r.ok || r.space <= 0) {
          if (n === 0 && !r.ok) adNote = plan[p][1] + " 不可用";
          break;
        }
        got += r.space;
      }
      adSpace += got;
    }
  }
  result.space += adSpace;

  result.ok = true;
  var days = (sync.continuousDays === undefined || sync.continuousDays === null || sync.continuousDays === "")
    ? "" : " · 连签 " + sync.continuousDays + " 天";
  var head = "✅ " + label + days + " · 本次 +" + mb(result.space);
  var detail = "登录 +" + mb(loginSpace) + (sync.already ? "(已领)" : "") +
    " · 签到 " + (ci.already ? "已签" : "+" + mb(ci.space)) +
    " · 广告 +" + mb(adSpace) + (adNote ? "（" + adNote + "）" : "");
  result.lines.push(head);
  result.lines.push("　" + detail);
  log(head);
  log(detail);
  return result;
}

function updateStoredCookie(key, cookie) {
  try {
    var list = readAccounts();
    for (var i = 0; i < list.length; i++) {
      if (list[i].key === key) {
        list[i].cookie = cookie;
        list[i].updatedAt = Date.now();
        saveAccounts(list);
        return;
      }
    }
  } catch (e) {
    log("回写 Cookie 失败: " + e);
  }
}

async function runCheckin() {
  var accounts = readAccounts();
  if (!accounts.length) {
    notify("有道云笔记", "未获取到账号", "请打开「有道云笔记」App，或用 Safari 打开 note.youdao.com/web/ 刷新一次，插件会自动保存登录状态。");
    log("账号列表为空，等待抓取");
    return;
  }

  var lines = [];
  var okCount = 0;
  var totalSpace = 0;
  var authFailed = 0;

  for (var i = 0; i < accounts.length; i++) {
    var r = await runOne(accounts[i], i);
    if (r.ok) {
      okCount++;
      totalSpace += r.space;
      lines.push("【" + (i + 1) + "】" + r.lines.join("\n"));
    } else {
      if (r.auth) authFailed++;
      lines.push("【" + (i + 1) + "】" + r.label + " " + r.lines.join("\n"));
    }
  }

  var sub = okCount + "/" + accounts.length + " 个账号成功";
  if (totalSpace > 0) sub += " · 共 +" + mb(totalSpace);
  if (authFailed) sub += " · " + authFailed + " 个需重新抓取";
  var tail = authFailed ? "\n\n⚠️ 有账号登录态失效：打开有道云笔记 App 或网页版重新刷新一次即可自动更新。" : "";
  notify("有道云笔记签到 v" + SCRIPT_VERSION, sub, lines.join("\n") + tail);
}

function isYoudaoAuthCookie(cookie) {
  var c = cookieToObj(cookie);
  return !!(c.YNOTE_PERS || c.YNOTE_SESS || c.YNOTE_LOGIN || c.YNOTE_CSTK);
}

async function runCapture() {
  if (CFG.clearAllAccounts) {
    saveAccounts([]);
    log("已清空全部账号");
    notify("有道云笔记", "已清空全部账号", "请关闭插件中的「清空全部账号」开关，然后重新打开 App 或网页版以重新抓取。");
    return;
  }

  if (isBusy()) {
    debug("上一次校验仍在进行，本次抓取跳过");
    return;
  }

  var cookie = getHeader($request.headers, "Cookie");
  if (!cookie || !isYoudaoAuthCookie(cookie)) {
    debug("本次请求未携带有效 Cookie，忽略（" + String($request.url || "").slice(0, 80) + "）");
    return;
  }

  var key = accountKey(cookie);
  var list = readAccounts();
  var existed = null;
  for (var i = 0; i < list.length; i++) {
    if (list[i].key === key) { existed = list[i]; break; }
  }

  if (existed && existed.cookie === cookie) return;

  if (existed) {
    updateStoredCookie(key, cookie);
    log("已更新账号 " + maskAccount(key) + " 的登录状态");
    return;
  }

  setBusy(true);
  var me;
  try {
    me = await fetchSelf(cookie);
    if (!me.ok) {
      var probe = await dailySync(cookie);
      if (!probe.ok) {
        log("抓取到疑似新账号 " + maskAccount(key) + "，但校验失败：" + me.error + " · " + me.message);
        return;
      }
      me = { ok: true, name: "", uid: uidOf(cookie) };
    }
  } finally {
    setBusy(false);
  }
  var total = upsertAccount(cookie, { name: me.name, uid: me.uid || uidOf(cookie) });
  var who = me.name || maskAccount(key);
  log("已保存新账号：" + who + "（共 " + total + " 个）");
  notify("有道云笔记", "✅ 已保存账号：" + who, "共 " + total + " 个账号，将按插件定时自动签到。");
}

async function runManual() {
  if (CFG.manualCookie) {
    var cookie = CFG.manualCookie;
    if (!isYoudaoAuthCookie(cookie)) {
      notify("有道云笔记", "手动录入失败", "Cookie 格式不正确：需要包含 YNOTE_PERS / YNOTE_SESS 等字段的完整 Cookie。");
      log("手动录入的 Cookie 不支持");
    } else {
      var me = await fetchSelf(cookie);
      if (!me.ok) {
        notify("有道云笔记", "手动录入失败", "Cookie 校验未通过：" + me.error + " · " + me.message);
        log("手动录入校验失败: " + me.error + " · " + me.message);
      } else {
        var total = upsertAccount(cookie, { name: me.name, uid: me.uid });
        log("手动录入成功：" + (me.name || maskAccount(accountKey(cookie))) + "（共 " + total + " 个）");
      }
    }
  }
  await runCheckin();
}

(async function main() {
  try {
    log("v" + SCRIPT_VERSION + " 启动 · " + (isRequest ? "抓取模式" : (isManual ? "手动模式" : "定时任务")) +
      " · 运行时 " + (typeof $loon !== "undefined" ? String($loon) : "unknown"));
    if (isRequest) {
      await runCapture();
      return;
    }
    if (isManual) {
      await runManual();
    } else {
      await runCheckin();
    }
  } catch (e) {
    log("执行异常: " + (e && e.stack ? e.stack : e));
    try {
      notify("有道云笔记", "执行异常", String(e && e.message ? e.message : e));
    } catch (e2) {}
  } finally {
    if (isRequest) $done({});
    else $done();
  }
})();
