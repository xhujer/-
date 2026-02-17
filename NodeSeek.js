const SCRIPT_NAME = "NodeSeek签到";
const DOMAIN = "www.nodeseek.com";

const KEY_COOKIE = "nodeseek_cookie";
const KEY_RANDOM = "nodeseek_random";
const KEY_MEMBER_ID = "nodeseek_member_id";

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
      $argument.split("&").forEach(p => {
        const idx = p.indexOf("=");
        if (idx > -1) params[p.slice(0, idx)] = decodeURIComponent(p.slice(idx + 1));
      });
      return params[key] ?? null;
    }
  } catch {}
  return null;
}

async function captureCookie() {
  const url = String($request?.url || "");
  if (!url.includes(DOMAIN) && !url.includes("nodeseek.com")) return;

  const cookie = getCookieFromHeaders($request?.headers || {});
  if (!cookie || cookie.length < 20) return;

  const old = read(KEY_COOKIE);
  if (cookie !== old) {
    write(cookie, KEY_COOKIE);
    const msg = "✅ Cookie 已更新";
    printResult(msg);
    notify(SCRIPT_NAME, msg, "可以关闭自动获取Cookie开关");
  }
}

async function signIn(nsCookie, randomFlag) {
  const url = `https://${DOMAIN}/api/attendance?random=${randomFlag ? "true" : "false"}`;
  const headers = {
    "Accept": "*/*",
    "Origin": `https://${DOMAIN}`,
    "Referer": `https://${DOMAIN}/board`,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    "Cookie": nsCookie,
    "Content-Length": "0",
  };

  const { data } = await httpPost({ url, headers, body: "" });
  const raw = String(data || "");

  let json = null;
  try { json = JSON.parse(raw); } catch {}

  if (json && typeof json === "object") {
    const msg = json.message || json.msg || "";
    return msg ? `签到信息：${msg}` : "签到信息：（无提示文本）";
  }

  return `签到信息：解析失败（返回片段：${cleanText(raw).slice(0, 160)}）`;
}

async function getUserInfo(memberId) {
  if (!memberId) return "";

  const url = `https://${DOMAIN}/api/account/getInfo/${memberId}?readme=1`;
  const headers = {
    "Accept": "*/*",
    "Origin": `https://${DOMAIN}`,
    "Referer": `https://${DOMAIN}/space/${memberId}`,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  };

  const { data } = await httpGet({ url, headers });
  const raw = String(data || "");

  let json = null;
  try { json = JSON.parse(raw); } catch {}

  const d = json && json.detail;
  if (!d) return "用户信息：获取失败（可能 MemberId 不对）";

  return [
    "用户信息：",
    `【用户】：${d.member_name ?? ""}`,
    `【等级】：${d.rank ?? ""}`,
    `【鸡腿数目】：${d.coin ?? ""}`,
    `【主题帖数】：${d.nPost ?? ""}`,
    `【评论数】：${d.nComment ?? ""}`,
  ].join("\n");
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

(async () => {
  try {
    if (typeof $request !== "undefined") {
      await captureCookie();
      return done();
    }

    const nsCookie = read(KEY_COOKIE);
    if (!nsCookie) {
      const msg = "❌ 未获取 Cookie（先开启抓Cookie并访问 NodeSeek 登录页面）";
      printResult(msg);
      notify(SCRIPT_NAME, "❌ 无法签到", msg);
      return done();
    }

    const argRandom = getArg("Random");
    const argMemberId = getArg("MemberId");

    const randomStored = read(KEY_RANDOM);
    const memberStored = read(KEY_MEMBER_ID);

    const randomFlag =
      argRandom !== null ? (String(argRandom).toLowerCase() !== "false")
      : (randomStored ? (String(randomStored).toLowerCase() !== "false") : true);

    const memberId =
      argMemberId !== null ? String(argMemberId)
      : (memberStored || "");

    write(String(randomFlag), KEY_RANDOM);
    if (memberId) write(memberId, KEY_MEMBER_ID);

    const signText = await signIn(nsCookie, randomFlag);
    const infoText = await getUserInfo(memberId);

    const body = [infoText, signText, `时间：${nowText()}`].filter(Boolean).join("\n");

    // ✅ 日志只输出结果（不输出流程）
    printResult(body);

    // ✅ 通知也只发一次结果
    notify(SCRIPT_NAME, "📌 结果", body);

    return done();
  } catch (e) {
    const msg = `❌ 脚本异常：${String(e && e.message ? e.message : e)}`;
    printResult(msg);
    notify(SCRIPT_NAME, "❌ 脚本异常", msg);
    return done();
  }
})();