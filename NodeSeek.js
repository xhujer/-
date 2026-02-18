const SCRIPT_NAME = "NodeSeek签到";
const DOMAIN = "www.nodeseek.com";

const KEY_COOKIE = "nodeseek_cookie";
const KEY_RANDOM = "nodeseek_random";

function read(key) { return $persistentStore.read(key); }
function write(val, key) { return $persistentStore.write(String(val), key); }
function done(obj = {}) { $done(obj); }

function cleanText(s) {
  return String(s ?? "")
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
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

async function captureCookie() {
  const url = String($request?.url || "");
  if (!url.includes("nodeseek.com")) return;

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
    return msg ? msg : "（无提示文本）";
  }

  return `解析失败（HTTP ${code}）：${cleanText(raw).slice(0, 120) || "（空）"}`;
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
    const randomStored = read(KEY_RANDOM);

    const randomFlag =
      argRandom !== null ? (String(argRandom).toLowerCase() !== "false")
      : (randomStored ? (String(randomStored).toLowerCase() !== "false") : true);

    write(String(randomFlag), KEY_RANDOM);

    const result = await signIn(nsCookie, randomFlag);

    // 只要签到结果（日志 + 通知）
    printResult(result);
    notify(SCRIPT_NAME, "签到结果", result);

    return done();
  } catch (e) {
    const msg = `❌ 脚本异常：${String(e && e.message ? e.message : e)}`;
    printResult(msg);
    notify(SCRIPT_NAME, "❌ 脚本异常", msg);
    return done();
  }
})();