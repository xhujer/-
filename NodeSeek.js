const SCRIPT_NAME = "NodeSeek签到";
const DOMAIN = "www.nodeseek.com";

const KEY_COOKIE = "nodeseek_cookie";
const KEY_RANDOM = "nodeseek_random";
const KEY_SPACE_ID = "nodeseek_space_id";
const KEY_UID = "nodeseek_uid";

function read(key) { return $persistentStore.read(key); }
function write(val, key) { return $persistentStore.write(String(val), key); }
function done(obj = {}) { $done(obj); }

function cleanText(s) {
  return String(s ?? "")
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function printResult(text) {
  const out = cleanText(text);
  if (out) console.log(out);
}

function notify(title, subtitle = "", body = "") {
  const t = cleanText(title) || "通知";
  const s = cleanText(subtitle);
  let b = cleanText(body);
  const MAX = 900;
  if (b.length > MAX) b = b.slice(0, MAX) + "…";
  $notification.post(t, s, b);
}

function httpGet(opt) {
  return new Promise((resolve, reject) => {
    $httpClient.get(opt, (err, resp, data) => {
      if (err) return reject(err);
      resolve({ resp, data });
    });
  });
}

function httpPost(opt) {
  return new Promise((resolve, reject) => {
    $httpClient.post(opt, (err, resp, data) => {
      if (err) return reject(err);
      resolve({ resp, data });
    });
  });
}

function getHeader(h, k) {
  const key = k.toLowerCase();
  for (const i in (h || {})) if (i.toLowerCase() === key) return h[i];
  return null;
}

function normalizeCookie(str) {
  return String(str || "")
    .replace(/\r?\n/g, "; ")
    .replace(/;+\s*/g, "; ")
    .replace(/\s*;\s*$/, "")
    .trim();
}

function getCookieFromHeaders(h) {
  const v = getHeader(h, "Cookie");
  if (!v) return null;
  if (Array.isArray(v)) return normalizeCookie(v.join("; "));
  return normalizeCookie(v);
}

function getArg(key) {
  try {
    if (typeof $argument === "string" && $argument.length) {
      const params = {};
      $argument.split("&").forEach((p) => {
        const idx = p.indexOf("=");
        if (idx > -1) params[p.slice(0, idx)] = decodeURIComponent(p.slice(idx + 1));
      });
      return params[key] ?? null;
    }
  } catch {}
  return null;
}

function nowText() {
  const n = new Date();
  const Y = n.getFullYear();
  const M = String(n.getMonth() + 1).padStart(2, "0");
  const D = String(n.getDate()).padStart(2, "0");
  const h = String(n.getHours()).padStart(2, "0");
  const m = String(n.getMinutes()).padStart(2, "0");
  const s = String(n.getSeconds()).padStart(2, "0");
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

function parseUidFromProfileBody(body) {
  const raw = String(body || "");
  if (!raw) return "";

  // 尽量多兜底一些常见格式：JSON/内嵌数据/属性
  const patterns = [
    /"uid"\s*:\s*(\d+)/i,
    /"user_id"\s*:\s*(\d+)/i,
    /"member_id"\s*:\s*(\d+)/i,
    /data-(?:uid|user-id|member-id)\s*=\s*"(\d+)"/i,
    /memberId"\s*:\s*(\d+)/i,
    /uid"\s*,\s*"(\d+)"/i,
  ];

  for (const re of patterns) {
    const m = raw.match(re);
    if (m && m[1]) return m[1];
  }

  return "";
}

async function captureCookieFromRequest() {
  const url = String($request?.url || "");
  if (!url.includes("nodeseek.com")) return;

  const cookie = getCookieFromHeaders($request?.headers || {});
  if (!cookie || cookie.length < 20) return;

  const old = read(KEY_COOKIE);
  if (cookie !== old) {
    write(cookie, KEY_COOKIE);
    const msg = "✅ Cookie 已更新";
    printResult(msg);
    notify(SCRIPT_NAME, msg, "可以关闭自动获取开关");
  }
}

async function captureUidFromResponse() {
  const url = String($request?.url || "");
  if (!/\/space\/\d+/i.test(url)) return;

  const body = $response?.body || "";
  const uid = parseUidFromProfileBody(body);

  // 同时记录 spaceId（从URL里取）
  const m = url.match(/\/space\/(\d+)/i);
  const spaceId = m ? m[1] : "";

  if (spaceId) write(spaceId, KEY_SPACE_ID);

  if (uid) {
    const old = read(KEY_UID);
    if (uid !== old) {
      write(uid, KEY_UID);
      const msg = `✅ UID 已保存：${uid}`;
      printResult(msg);
      notify(SCRIPT_NAME, "✅ UID 已解析", `已保存 UID：${uid}`);
    }
  } else {
    // 解析不到不刷屏，只打日志
    printResult("❌ 未能从个人页解析到 UID（可能页面未解密/被防护拦截）");
  }
}

async function signIn(nsCookie, randomFlag) {
  const url = `https://${DOMAIN}/api/attendance?random=${randomFlag ? "true" : "false"}`;
  const headers = {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json;charset=utf-8",
    "Origin": `https://${DOMAIN}`,
    "Referer": `https://${DOMAIN}/board`,
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    "Cookie": nsCookie,
  };

  const { resp, data } = await httpPost({ url, headers, body: "{}" });
  const raw = String(data || "");
  const code = resp?.status || resp?.statusCode || 0;

  let json = null;
  try { json = JSON.parse(raw); } catch {}

  if (json && typeof json === "object") {
    const msg = json.message || json.msg || "";
    return msg ? `签到信息：${msg}` : "签到信息：（无提示文本）";
  }

  return `签到信息：解析失败（HTTP ${code}）\n返回片段：${cleanText(raw).slice(0, 200) || "（空）"}`;
}

async function getUserInfo(uid, nsCookie) {
  uid = String(uid || "").trim();
  if (!uid) return "";

  const url = `https://${DOMAIN}/api/account/getInfo/${uid}?readme=1`;
  const headers = {
    "Accept": "application/json, text/plain, */*",
    "Origin": `https://${DOMAIN}`,
    "Referer": `https://${DOMAIN}/space/${read(KEY_SPACE_ID) || ""}`,
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    "Cookie": nsCookie || "",
  };

  const { resp, data } = await httpGet({ url, headers });
  const raw = String(data || "");
  const code = resp?.status || resp?.statusCode || 0;

  let json = null;
  try { json = JSON.parse(raw); } catch {}

  if (json && json.success === false) {
    // 如果还是 wrong uid，就直接不显示用户信息（避免影响签到结果）
    return "";
  }

  const d = json && json.detail;
  if (!d) {
    // 不再刷失败片段，保持输出干净
    return "";
  }

  return [
    "用户信息：",
    `【用户】：${d.member_name ?? ""}`,
    `【等级】：${d.rank ?? ""}`,
    `【鸡腿数目】：${d.coin ?? ""}`,
    `【主题帖数】：${d.nPost ?? ""}`,
    `【评论数】：${d.nComment ?? ""}`,
  ].join("\n");
}

(async () => {
  try {
    if (typeof $request !== "undefined" && typeof $response !== "undefined") {
      // http-response：解析个人页 UID
      await captureUidFromResponse();
      return done();
    }

    if (typeof $request !== "undefined") {
      // http-request：抓 Cookie
      await captureCookieFromRequest();
      return done();
    }

    // cron：签到
    const nsCookie = read(KEY_COOKIE);
    if (!nsCookie) {
      const msg = "❌ 未获取 Cookie（先开启抓取开关并访问 NodeSeek 登录页面）";
      printResult(msg);
      notify(SCRIPT_NAME, "❌ 无法签到", msg);
      return done();
    }

    const argRandom = getArg("Random");
    const argSpaceId = getArg("MemberId"); // 这里仍然接收你配置里的空间页 ID
    const randomStored = read(KEY_RANDOM);

    const randomFlag =
      argRandom !== null ? (String(argRandom).toLowerCase() !== "false")
      : (randomStored ? (String(randomStored).toLowerCase() !== "false") : true);

    write(String(randomFlag), KEY_RANDOM);

    // 记录 spaceId（用于 referer），但真正请求用户信息用 uid
    const spaceId = String(argSpaceId || read(KEY_SPACE_ID) || "").trim();
    if (spaceId) write(spaceId, KEY_SPACE_ID);

    const uid = String(read(KEY_UID) || "").trim();

    const signText = await signIn(nsCookie, randomFlag);
    const infoText = uid ? await getUserInfo(uid, nsCookie) : "";

    const body = [infoText, signText, `时间：${nowText()}`].filter(Boolean).join("\n");
    printResult(body);
    notify(SCRIPT_NAME, "📌 结果", body);

    return done();
  } catch (e) {
    const msg = `❌ 脚本异常：${String(e && e.message ? e.message : e)}`;
    printResult(msg);
    notify(SCRIPT_NAME, "❌ 脚本异常", msg);
    return done();
  }
})();