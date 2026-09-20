const NAME = "HDHive 自动签到";
const BASE = "https://re0.me";
const HOME = `${BASE}/`;
const DEFAULT_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 " +
  "Mobile/15E148 Safari/604.1";
const CHECKIN_TREE =
  "%5B%22%22%2C%7B%22children%22%3A%5B%22(app)%22%2C%7B%22children%22%3A" +
  "%5B%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue" +
  "%5D%7D%2Cnull%2Cnull%2Ctrue%5D";
const POINTS_TREE = routeTree(["manager", "points-logs"]);

const PINNED_ACTION = "4080a19fea2b3d0fa9529be769a60c039cf1a731fc";
const ACTION_SCAN_LIMIT = 60;
const ACTION_SCAN_CONCURRENCY = 8;

const KEY = {
  cookie: "hdhive_cookie_v15",
  ua: "hdhive_ua_v15",
  action: "hdhive_action_v1",
  user: "hdhive_last_user_v2",
  points: "hdhive_last_points_v2",
  history: "hdhive_sign_history_v2",
  flow: "hdhive_points_flow_v4",
  report: "hdhive_checkin_report_v1",
  chunk: "hdhive_chunk_v1",
};

class CookieJar {
  constructor(cookie) {
    this.data = {};
    String(cookie || "")
      .split(/;\s*/)
      .forEach((part) => {
        const index = part.indexOf("=");
        if (index <= 0) return;
        const name = part.slice(0, index).trim();
        const value = part.slice(index + 1).trim();
        if (name) this.data[name] = value;
      });
  }

  get(name) {
    return this.data[name] || "";
  }

  has(name) {
    return Object.prototype.hasOwnProperty.call(this.data, name);
  }

  remove(name) {
    delete this.data[name];
  }

  header() {
    return Object.keys(this.data)
      .map((name) => `${name}=${this.data[name]}`)
      .join("; ");
  }

  absorb(headers) {
    const changed = [];
    setCookieLines(headers).forEach((line) => {
      const pair = line.split(";", 1)[0];
      const index = pair.indexOf("=");
      if (index <= 0) return;

      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      const maxAge = line.match(/;\s*Max-Age=(-?\d+)/i);
      const expires = line.match(/;\s*Expires=([^;]+)/i);
      const expired =
        (maxAge && Number(maxAge[1]) <= 0) ||
        (!maxAge &&
          expires &&
          !Number.isNaN(Date.parse(expires[1])) &&
          Date.parse(expires[1]) <= Date.now());

      if (!value || expired) delete this.data[name];
      else this.data[name] = value;
      if (changed.indexOf(name) === -1) changed.push(name);
    });
    return changed;
  }
}

function getHeader(headers, name) {
  const source = headers || {};
  const target = String(name).toLowerCase();
  const key = Object.keys(source).find(
    (item) => String(item).toLowerCase() === target
  );
  return key ? source[key] : "";
}

function setCookieLines(headers) {
  const raw = getHeader(headers, "set-cookie");
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const result = [];

  values.forEach((value) => {
    String(value)
      .split(/\r?\n/)
      .forEach((line) => {
        line
          .split(/,(?=\s*[A-Za-z0-9_!#$%&'*+\-.^`|~]+=)/)
          .forEach((item) => {
            if (item.trim()) result.push(item.trim());
          });
      });
  });
  return result;
}

function positional(values) {
  const keys = ["gamble"];
  const args = {};
  for (let index = 0; index < values.length && index < keys.length; index += 1) {
    args[keys[index]] = values[index];
  }
  return args;
}

function getArgs() {
  if (typeof $argument === "undefined" || $argument === null) return {};
  if (typeof $argument === "object") {
    return Array.isArray($argument)
      ? positional($argument)
      : $argument;
  }

  const text = String($argument).trim();
  if (!text) return {};

  if (text[0] === "{" || text[0] === "[") {
    try {
      const value = JSON.parse(text);
      return Array.isArray(value) ? positional(value) : value;
    } catch (_) {}
  }

  if (text.indexOf("=") < 0) return { gamble: text };

  const result = {};
  text.split("&").forEach((part) => {
    const index = part.indexOf("=");
    if (index <= 0) return;
    const key = decodeURIComponent(part.slice(0, index).replace(/\+/g, " "));
    const value = decodeURIComponent(
      part.slice(index + 1).replace(/\+/g, " ")
    );
    result[key] = value;
  });
  return result;
}

function bool(value) {
  if (typeof value === "boolean") return value;
  return /^(1|true|yes|on|开启|是)$/i.test(String(value || "").trim());
}

function clean(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function readJSON(key, fallback) {
  try {
    const value = $persistentStore.read(key);
    return value ? JSON.parse(value) : fallback;
  } catch (_) {
    return fallback;
  }
}

function writeJSON(key, value) {
  return $persistentStore.write(JSON.stringify(value), key);
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (Number.isFinite(Number(value))) return Number(value);
  const match = String(value).match(/[+-]?\d+(?:\.\d+)?/);
  return match && Number.isFinite(Number(match[0])) ? Number(match[0]) : null;
}

function formatTime(value) {
  const original = clean(value);
  let date =
    value instanceof Date
      ? value
      : new Date(original ? original.replace(" ", "T") : Date.now());
  if (Number.isNaN(date.getTime())) return original || formatTime(new Date());

  const pad = (number) => String(number).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

function decodeText(value) {
  return String(value || "")
    .replace(/\\u([0-9a-f]{4})/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/\\x([0-9a-f]{2})/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\\"/g, '"');
}

function jsonField(text, name) {
  const escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(text || "").match(
    new RegExp(`"${escaped}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`)
  );
  if (!match) return "";
  try {
    return JSON.parse(`"${match[1]}"`);
  } catch (_) {
    return match[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
}

function jsonAfter(body, marker) {
  const variants = [String(body || ""), decodeText(body)];

  for (let variant = 0; variant < variants.length; variant += 1) {
    const text = variants[variant];
    const markerIndex = text.indexOf(marker);
    if (markerIndex < 0) continue;

    let start = markerIndex + marker.length;
    while (start < text.length && text[start] !== "{" && text[start] !== "[") {
      start += 1;
      if (start - markerIndex > 200) break;
    }
    if (start >= text.length || start - markerIndex > 200) continue;

    const open = text[start];
    const close = open === "{" ? "}" : "]";
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < text.length; index += 1) {
      const character = text[index];

      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }

      if (character === '"') inString = true;
      else if (character === open) depth += 1;
      else if (character === close) {
        depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(text.slice(start, index + 1));
          } catch (_) {
            break;
          }
        }
      }
    }
  }
  return null;
}

function routeTree(parts) {
  let children = ["__PAGE__", {}, null, null];
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    children = [parts[index], { children }, null, null, true];
  }
  children = ["(app)", { children }, null, null, true];
  return encodeURIComponent(
    JSON.stringify(["", { children }, null, null, true])
  );
}

function compressionKind(bytes) {
  if (!bytes || bytes.length < 4) return "";
  if (bytes[0] === 0x28 && bytes[1] === 0xb5 && bytes[2] === 0x2f && bytes[3] === 0xfd) return "zstd";
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) return "gzip";
  if (bytes[0] === 0x42 && bytes[1] === 0x5a && bytes[2] === 0x68) return "bzip2";
  return "";
}

function utf8ToString(bytes) {
  let out = "";
  let index = 0;
  const length = bytes.length;
  while (index < length) {
    const first = bytes[index];
    index += 1;
    if (first < 0x80) {
      out += String.fromCharCode(first);
    } else if (first < 0xe0 && index < length) {
      out += String.fromCharCode(((first & 0x1f) << 6) | (bytes[index] & 0x3f));
      index += 1;
    } else if (first < 0xf0 && index + 1 < length) {
      out += String.fromCharCode(
        ((first & 0x0f) << 12) | ((bytes[index] & 0x3f) << 6) | (bytes[index + 1] & 0x3f)
      );
      index += 2;
    } else if (index + 2 < length) {
      const code =
        ((first & 0x07) << 18) |
        ((bytes[index] & 0x3f) << 12) |
        ((bytes[index + 1] & 0x3f) << 6) |
        (bytes[index + 2] & 0x3f);
      index += 3;
      const adjusted = code - 0x10000;
      out += String.fromCharCode(0xd800 + (adjusted >> 10), 0xdc00 + (adjusted & 0x3ff));
    }
  }
  return out;
}

function toBytes(data) {
  if (!data) return null;
  if (typeof Uint8Array !== "undefined" && data instanceof Uint8Array) return data;
  if (Object.prototype.toString.call(data) === "[object Array]") return new Uint8Array(data);
  if (typeof data.length === "number") {
    try {
      return new Uint8Array(data);
    } catch (_) {
      return null;
    }
  }
  return null;
}

function bodyToText(data) {
  if (typeof data === "string") return data;
  const bytes = toBytes(data);
  if (!bytes) return data === null || data === undefined ? "" : String(data);
  const kind = compressionKind(bytes);
  if (kind === "gzip") {
    try {
      return utf8ToString(toBytes($utils.ungzip(bytes)) || new Uint8Array(0));
    } catch (_) {
      console.log(`[${NAME}] gzip 解压失败`);
      return "";
    }
  }
  if (kind) {
    console.log(`[${NAME}] 响应为 ${kind} 压缩，Loon 无法解压（需要站点回 gzip/未压缩）`);
    return "";
  }
  return utf8ToString(bytes);
}

function request(method, options) {
  return new Promise((resolve, reject) => {
    const send = $httpClient[String(method).toLowerCase()];
    if (typeof send !== "function") {
      reject(new Error(`Loon 不支持 HTTP ${method}`));
      return;
    }

    send(options, (error, response, data) => {
      if (error) {
        reject(new Error(String(error)));
        return;
      }
      const rawStatus =
        response && (response.status || response.statusCode)
          ? response.status || response.statusCode
          : 0;
      resolve({
        status: Number(rawStatus) || parseInt(String(rawStatus), 10) || 0,
        headers: (response && response.headers) || {},
        body: bodyToText(data),
      });
    });
  });
}

function isChallenge(status, body, headers) {
  const text = String(body || "").toLowerCase();
  const head = headers || {};
  const cfRay = String(getHeader(head, "cf-ray") || "");
  const cfMitigated = String(getHeader(head, "cf-mitigated") || "");
  return (
    status === 503 ||
    Boolean(cfMitigated) ||
    (status === 403 && text.includes("cloudflare")) ||
    text.includes("正在进行安全验证") ||
    text.includes("正在验证") ||
    text.includes("enable javascript and cookies") ||
    text.includes("cdn-cgi/challenge-platform") ||
    text.includes("cf_chl_opt") ||
    text.includes("正在检测浏览器安全能力") ||
    text.includes("just a moment") ||
    text.includes("checking your browser") ||
    text.includes("/cdn-cgi/challenge-platform") ||
    text.includes("cf-chl-") ||
    text.includes("challenge-form")
  );
}

function documentHeaders(ua, jar, referer, extra) {
  const headers = {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9," +
      "image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "Upgrade-Insecure-Requests": "1",
    "Accept-Encoding": "gzip, deflate",
    "User-Agent": ua,
  };
  if (jar.header()) headers.Cookie = jar.header();
  if (referer) headers.Referer = referer;
  if (extra) Object.keys(extra).forEach((key) => { headers[key] = extra[key]; });
  return headers;
}

function saveSession(jar) {
  if (jar.header()) $persistentStore.write(jar.header(), KEY.cookie);
}

async function renewToken(jar, ua) {
  jar.remove("hdh_sa_token");

  const response = await request("get", {
    url: `${HOME}?_loon_refresh=${Date.now()}`,
    timeout: 25000,
    alpn: "h2",
    "auto-cookie": false,
    "auto-redirect": false,
    headers: documentHeaders(ua, jar),
  });

  jar.absorb(response.headers);
  saveSession(jar);

  if (isChallenge(response.status, response.body, response.headers)) {
    const ray = String(getHeader(response.headers, "cf-ray") || "");
    throw new Error(
      `首页被 Cloudflare 安全拦截（HTTP ${response.status}${ray ? `，ray ${ray}` : ""}）`
    );
  }

  const location = String(getHeader(response.headers, "location") || "");
  const body = String(response.body || "");
  const shortBody = body.length > 0 && body.length < 4096 && !/<!doctype|<html/i.test(body);
  if (
    response.status === 401 ||
    response.status === 403 ||
    /\/login(?:[/?#]|$)/i.test(location) ||
    (shortBody && /请先登录|登录已失效|未登录/.test(body))
  ) {
    throw new Error(
      `长期登录 Cookie 已失效（HTTP ${response.status}` +
        `${location ? `，跳转 ${location}` : ""}，正文 ${body.length} 字节），请重新登录一次 HDHive`
    );
  }

  if (!jar.has("hdh_sa_token")) {
    throw new Error(`首页 HTTP ${response.status}，但没有签发新 Token`);
  }
  return response;
}

function validAction(value) {
  return /^[a-f0-9]{20,128}$/i.test(String(value || ""));
}

function chunkBase(path) {
  return String(path || "").split("/").pop();
}

/** 逆向结论：首页列出的 chunk 文件名带构建哈希；缓存那份不在列表里 = 站点重新构建过 */
function cachedChunkStale(html) {
  const cached = $persistentStore.read(KEY.chunk) || "";
  if (!cached || !html) return false;
  const listed = collectChunks(html);
  if (!listed.length) return false;
  const want = chunkBase(cached);
  return !listed.some((path) => chunkBase(path) === want);
}

function chunkPrefix(path) {
  const name = String(path || "").split("/").pop();
  return name.indexOf("-") > 0 ? name.split("-")[0] : "";
}

function preferKnownChunk(paths) {
  const known = chunkPrefix($persistentStore.read(KEY.chunk) || "");
  if (!known) return paths;
  return paths
    .slice()
    .sort((first, second) =>
      (chunkPrefix(first) === known ? 0 : 1) - (chunkPrefix(second) === known ? 0 : 1)
    );
}
function normalizeBody(text) {
  return String(text || "")
    .replace(/\\u002[fF]/g, "/")
    .replace(/\\\//g, "/")
    .replace(/&#x2[fF];/g, "/")
    .replace(/&#47;/g, "/")
    .replace(/&amp;/g, "&");
}

function collectChunks(html) {
  const source = normalizeBody(html);
  const found = [];
  const pattern = /\/_next\/static\/[^\s"'<>;\\]+?\.js/g;
  let match;
  while ((match = pattern.exec(source))) {
    const path = match[0].replace(/[?&].*$/, "");
    if (path.indexOf("/_next/static/") !== 0) continue;
    if (found.indexOf(path) === -1) found.push(path);
  }
  return found;
}

function actionFromChunk(text) {
  const match = String(text || "").match(
    /createServerReference\)?\(\s*"([0-9a-f]{32,64})"[\s\S]{0,240}?"checkIn"/
  );
  return match && validAction(match[1]) ? match[1] : "";
}

async function fetchDocument(jar, ua, url, extraHeaders) {
  const response = await request("get", {
    url,
    timeout: 25000,
    alpn: "h2",
    "auto-cookie": false,
    "auto-redirect": true,
    headers: documentHeaders(ua, jar, HOME, extraHeaders),
  });
  jar.absorb(response.headers);
  saveSession(jar);
  console.log(
    `[${NAME}] 抓取 ${url.replace(BASE, "")} -> HTTP ${response.status}，` +
      `长度 ${String(response.body || "").length}`
  );
  return response;
}

async function fetchChunk(jar, ua, path) {
  try {
    const response = await request("get", {
      url: /^https?:/i.test(path) ? path : BASE + path,
      timeout: 15000,
      alpn: "h2",
      "auto-cookie": false,
      "auto-redirect": false,
      headers: documentHeaders(ua, jar, HOME),
    });
    return response.status === 200 ? response.body : "";
  } catch (error) {
    return "";
  }
}

async function scanSiteAction(jar, ua, html) {
  const sources = [];
  if (html) sources.push(String(html));

  let paths = collectChunks(sources[0] || "");
  if (paths.length === 0) {
    const targets = [
      `${HOME}?_loon_scan=${Date.now()}`,
      `${BASE}/manager/account?_loon_scan=${Date.now()}`,
    ];
    for (let index = 0; index < targets.length && paths.length === 0; index += 1) {
      try {
        const page = await fetchDocument(jar, ua, targets[index]);
        sources.push(String(page.body || ""));
        paths = collectChunks(page.body);
      } catch (error) {
        console.log(
          `[${NAME}] 抓取失败: ${error && error.message ? error.message : error}`
        );
      }
    }
  }

  if (paths.length === 0) {
    // Loon 只能解 gzip；若站点回了 zstd/brotli，正文会是空的。
    // 带 Range 的分段响应 CF 通常不压缩，用它再取一段未压缩正文。
    try {
      const ranged = await fetchDocument(jar, ua, `${HOME}?_loon_range=${Date.now()}`, {
        Range: "bytes=0-262143",
      });
      const rangedPaths = collectChunks(ranged.body);
      if (rangedPaths.length > 0) {
        paths = rangedPaths;
        sources.push(String(ranged.body || ""));
        console.log(`[${NAME}] 用 Range 拿到未压缩正文，候选 JS ${paths.length} 个`);
      }
    } catch (error) {
      console.log(`[${NAME}] Range 兜底失败: ${error && error.message ? error.message : error}`);
    }
  }

  console.log(`[${NAME}] 站点内解析 Action：候选 JS ${paths.length} 个`);
  if (paths.length === 0) {
    const raw = String(sources[sources.length - 1] || "");
    const looksBinary = raw.length > 0 && raw.indexOf("<") < 0 && /^[0-9]+(,[0-9]+){8,}/.test(raw);
    console.log(
      `[${NAME}] 首页诊断: ${raw.length} 字节, ` +
        (looksBinary ? "疑似压缩未解（zstd/brotli 需站点回 gzip）" : `开头 ${raw.slice(0, 80).replace(/\s+/g, " ")}`)
    );
    return "";
  }

  let list = preferKnownChunk(paths).slice(0, ACTION_SCAN_LIMIT);

  const known = chunkPrefix($persistentStore.read(KEY.chunk) || "");
  const retry = known
    ? list.filter((path) => chunkPrefix(path) === known)[0]
    : "";
  if (retry) {
    console.log(`[${NAME}] 先试探上次命中的 chunk`);
    const action = actionFromChunk(await fetchChunk(jar, ua, retry));
    if (action) {
      console.log(`[${NAME}] 命中 ${retry}`);
      return action;
    }
    list = list.filter((path) => path !== retry);
  }

  for (let start = 0; start < list.length; start += ACTION_SCAN_CONCURRENCY) {
    const batch = list.slice(start, start + ACTION_SCAN_CONCURRENCY);
    const bodies = await Promise.all(batch.map((path) => fetchChunk(jar, ua, path)));
    for (let index = 0; index < bodies.length; index += 1) {
      const action = actionFromChunk(bodies[index]);
      if (action) {
        console.log(`[${NAME}] 命中 ${batch[index]}`);
        $persistentStore.write(batch[index], KEY.chunk);
        return action;
      }
    }
  }
  return "";
}

async function getAction(jar, ua, html, forceScan) {
  const cached = $persistentStore.read(KEY.action) || "";

  if (!forceScan && validAction(cached)) {
    return { id: cached, source: "cache" };
  }

  let errorMessage = "";
  try {
    const action = await scanSiteAction(jar, ua, html);
    if (action) {
      $persistentStore.write(action, KEY.action);
      return { id: action, source: "site" };
    }
    errorMessage = "站点 JS 中未找到 checkIn Action ID";
  } catch (error) {
    errorMessage = error && error.message ? error.message : String(error);
  }

  if (validAction(PINNED_ACTION)) {
    console.log(`[${NAME}] 站点解析失败(${errorMessage})，使用内置 Action ID`);
    $persistentStore.write(PINNED_ACTION, KEY.action);
    return { id: PINNED_ACTION, source: "pinned" };
  }
  throw new Error(errorMessage || "无法获取 checkIn Action ID");
}

async function submitCheckin(jar, ua, action, gamble) {
  const headers = {
    Accept: "text/x-component",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
    "Content-Type": "text/plain;charset=UTF-8",
    Origin: BASE,
    Referer: HOME,
    "User-Agent": ua,
    "Next-Action": action,
    "Next-Router-State-Tree": CHECKIN_TREE,
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    Cookie: jar.header(),
  };

  const response = await request("post", {
    url: HOME,
    timeout: 30000,
    alpn: "h2",
    "auto-cookie": false,
    "auto-redirect": false,
    headers,
    body: JSON.stringify([Boolean(gamble)]),
  });

  jar.absorb(response.headers);
  saveSession(jar);
  return response;
}

function jsonAt(text, start) {
  const open = text[start];
  if (open !== "{" && open !== "[") return null;
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === open) depth += 1;
    else if (character === close) {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, index + 1));
        } catch (_) {
          return null;
        }
      }
    }
  }
  return null;
}

/** 只认服务端动作返回值本身：{response:{...}} / {error:{...}}，与所在行格式无关 */
function actionPayload(body) {
  const text = decodeText(body);
  for (let markerIndex = 0; markerIndex < 2; markerIndex += 1) {
    const marker = markerIndex === 0 ? '{"error"' : '{"response"';
    let at = text.indexOf(marker);
    while (at >= 0) {
      const value = jsonAt(text, at);
      if (value && (value.error || value.response)) return value;
      at = text.indexOf(marker, at + 1);
    }
  }
  return null;
}

function analyze(response) {
  const headers = response.headers || {};
  const text = decodeText(response.body);
  const lower = text.toLowerCase();
  const payload = actionPayload(response.body);
  const error = payload && payload.error ? payload.error : null;
  const response2 = payload && payload.response ? payload.response : null;
  const code = error && error.code !== undefined ? String(error.code) : "";
  const detailOf = (obj) =>
    [clean(obj && obj.message), clean(obj && obj.description)]
      .filter((value, index, array) => value && array.indexOf(value) === index)
      .join("：");

  if (
    response.status === 404 ||
    getHeader(headers, "x-nextjs-action-not-found") ||
    lower.includes("server action not found") ||
    lower.includes("failed to find server action")
  ) {
    return { ok: false, retry: true, kind: "action", status: response.status, detail: "当前 Server Action 已更新" };
  }

  if (isChallenge(response.status, text)) {
    return { ok: false, retry: false, kind: "challenge", status: response.status, detail: "签到请求触发浏览器安全检测" };
  }

  if (response.status === 409 || /action_token_invalid/.test(lower) || /action token invalid/.test(lower)) {
    return { ok: false, retry: true, kind: "token", status: response.status, detail: "短期 Action Token 已失效" };
  }

  if (error) {
    const detail = detailOf(error) || "服务返回了错误";
    const blob = `${code} ${detail}`.toLowerCase();
    if (/你已经签到过了|明天再来吧|今日已签到|已经签到/.test(detail)) {
      return { ok: true, retry: false, kind: "already", status: response.status, detail };
    }
    if (/account_dormant/.test(blob)) {
      return { ok: false, retry: false, kind: "dormant", status: response.status, detail: detail || "账号处于休眠状态" };
    }
    if (code === "401" || /session_user_mismatch|请先登录|未登录|登录已失效|unauthorized/.test(blob)) {
      return { ok: false, retry: false, kind: "login", status: response.status, detail: detail || "登录状态已失效，请重新登录一次 HDHive" };
    }
    return { ok: false, retry: false, kind: "unknown", status: response.status, detail };
  }

  if (response2) {
    const detail = detailOf(response2) || "签到成功";
    if (/已经签到|明天再来/.test(detail)) {
      return { ok: true, retry: false, kind: "already", status: response.status, detail, verified: true };
    }
    return { ok: true, retry: false, kind: "success", status: response.status, detail, verified: true };
  }

  const shortPlain = text.length > 0 && text.length < 4096 && !/<!doctype|<html/i.test(text);
  if (shortPlain && /你已经签到过了|明天再来吧|今日已签到|已经签到/.test(text)) {
    return { ok: true, retry: false, kind: "already", status: response.status, detail: jsonField(text, "description") || "今天已经签到过了" };
  }
  if (shortPlain && (/"success"\s*:\s*true/i.test(text) || /签到成功|签到奖励|获得.{0,20}积分/.test(text))) {
    return { ok: true, retry: false, kind: "success", status: response.status, detail: jsonField(text, "message") || "签到成功" };
  }
  if (response.status === 401 || (shortPlain && /请先登录|未登录|登录已失效|unauthorized/i.test(text))) {
    return { ok: false, retry: false, kind: "login", status: response.status, detail: "登录状态已失效，请重新登录一次 HDHive" };
  }
  return {
    ok: false,
    retry: false,
    kind: "unknown",
    status: response.status,
    detail: `服务返回了无法识别的结果（HTTP ${response.status || "未知"}）`,
    sample: clean(text).slice(0, 200),
  };
}

function normalizeUser(value) {
  const user = value && typeof value === "object" ? value : {};
  const meta = user.user_meta || user.userMeta || {};
  const points = [
    meta.points,
    user.points,
    user.current_points,
  ]
    .map(toNumber)
    .find((item) => item !== null);
  const days = [
    meta.signin_days_total,
    meta.signinDaysTotal,
    user.signin_days_total,
    user.signinDaysTotal,
  ]
    .map(toNumber)
    .find((item) => item !== null);

  return {
    id:
      user.id !== undefined && user.id !== null
        ? String(user.id)
        : user.user_id !== undefined && user.user_id !== null
        ? String(user.user_id)
        : "",
    nickname: clean(user.nickname || user.username || user.name),
    points: points === undefined ? null : points,
    days: days === undefined ? null : days,
  };
}

function userFrom(body) {
  const object = jsonAfter(body, '"currentUser":');
  if (object) return normalizeUser(object);

  const text = decodeText(body);
  const id = text.match(
    /"currentUser"\s*:\s*\{[\s\S]{0,8000}?"id"\s*:\s*"?(\d+)"?/
  );
  const nickname = text.match(
    /"currentUser"\s*:\s*\{[\s\S]{0,8000}?"nickname"\s*:\s*"((?:\\.|[^"\\])*)"/
  );
  const points = text.match(
    /"user_meta"\s*:\s*\{[\s\S]{0,2000}?"points"\s*:\s*(-?\d+)/
  );
  const days = text.match(/"signin_days_total"\s*:\s*(\d+)/);
  if (!id && !nickname && !points && !days) return null;

  return {
    id: id ? id[1] : "",
    nickname: nickname ? clean(nickname[1]) : "",
    points: points ? Number(points[1]) : null,
    days: days ? Number(days[1]) : null,
  };
}

function mergeUsers() {
  const sources = Array.prototype.slice.call(arguments).filter(Boolean);
  const result = { id: "", nickname: "", points: null, days: null };

  sources.forEach((user) => {
    if (!result.id && user.id) result.id = String(user.id);
    if (!result.nickname && user.nickname) result.nickname = clean(user.nickname);
    if (result.points === null && user.points !== null && user.points !== undefined) {
      result.points = Number(user.points);
    }
    if (result.days === null && user.days !== null && user.days !== undefined) {
      result.days = Number(user.days);
    }
  });
  return result;
}

async function queryAccount(jar, ua) {
  try {
    const response = await request("get", {
      url: `${BASE}/manager/account?_loon_points=${Date.now()}`,
      timeout: 25000,
      alpn: "h2",
      "auto-cookie": false,
      "auto-redirect": false,
      headers: documentHeaders(ua, jar, HOME),
    });
    jar.absorb(response.headers);
    saveSession(jar);
    if (response.status !== 200 || isChallenge(response.status, response.body)) {
      return null;
    }
    return userFrom(response.body);
  } catch (error) {
    console.log(
      `[${NAME}] 账户积分查询失败: ${
        error && error.message ? error.message : String(error)
      }`
    );
    return null;
  }
}

function normalizeRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const description =
    clean(
      value.remark ||
        value.description ||
        value.reason ||
        value.content ||
        value.message ||
        value.title
    ) ||
    (value.change_type ? `积分变动（${clean(value.change_type)}）` : "");
  const time =
    value.created_at ||
    value.createdAt ||
    value.updated_at ||
    value.updatedAt ||
    value.time ||
    value.date ||
    value.occurred_at;
  const change = [
    value.remark !== undefined || value.change_type !== undefined ? value.points : undefined,
    value.change,
    value.points_change,
    value.pointsChange,
    value.change_value,
    value.points_delta,
    value.pointsDelta,
    value.delta,
    value.amount,
    value.value,
    value.points,
  ]
    .map(toNumber)
    .find((item) => item !== null);

  if (!description && !time) return null;
  return {
    time: formatTime(time || new Date()),
    change: change === undefined ? null : change,
    description: description || "积分变动",
  };
}

function collectRecords(value, result, depth) {
  if (depth > 8 || value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((item) => {
      const record = normalizeRecord(item);
      if (record) result.push(record);
      collectRecords(item, result, depth + 1);
    });
    return;
  }
  if (typeof value === "object") {
    Object.keys(value).forEach((key) => {
      if (value[key] && typeof value[key] === "object") {
        collectRecords(value[key], result, depth + 1);
      }
    });
  }
}

function uniqueRecords(values) {
  const seen = {};
  const result = [];

  (Array.isArray(values) ? values : []).forEach((value) => {
    const record = normalizeRecord(value);
    if (!record) return;
    const key =
      `${record.time.slice(0, 10)}|${record.change}|${record.description}`;
    if (seen[key]) return;
    seen[key] = true;
    result.push(record);
  });

  return result.sort((first, second) => {
    const a = Date.parse(first.time.replace(" ", "T")) || 0;
    const b = Date.parse(second.time.replace(" ", "T")) || 0;
    return b - a;
  });
}

function parsePointLogs(body) {
  const result = [];
  ['"initialData":', '"pointsLogs":', '"pointLogs":'].forEach((marker) => {
    const value = jsonAfter(body, marker);
    if (value !== null) collectRecords(value, result, 0);
  });
  return uniqueRecords(result).slice(0, 10);
}

async function queryPointLogs(jar, ua) {
  try {
    const headers = {
      Accept: "text/x-component",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Referer: `${BASE}/manager/account`,
      RSC: "1",
      "Next-Router-State-Tree": POINTS_TREE,
      "User-Agent": ua,
      Cookie: jar.header(),
    };
    const response = await request("get", {
      url:
        `${BASE}/manager/points-logs?page=1&page_size=10` +
        `&_rsc=1&_loon_points=${Date.now()}`,
      timeout: 25000,
      alpn: "h2",
      "auto-cookie": false,
      "auto-redirect": false,
      headers,
    });
    jar.absorb(response.headers);
    saveSession(jar);

    if (response.status !== 200 || isChallenge(response.status, response.body)) {
      console.log(`[${NAME}] 服务器积分日志不可用: HTTP ${response.status}`);
      return [];
    }

    return parsePointLogs(response.body);
  } catch (error) {
    console.log(
      `[${NAME}] 积分日志查询失败，使用本地历史: ${
        error && error.message ? error.message : String(error)
      }`
    );
    return [];
  }
}

function rewardFrom(result, body, before, after) {
  const patterns = [
    /获得\s*([+-]?\d+)\s*积分/,
    /奖励\s*([+-]?\d+)\s*积分/,
    /积分\s*([+-]\d+)/,
  ];
  for (let index = 0; index < patterns.length; index += 1) {
    const match = clean(result.detail).match(patterns[index]);
    if (match) return Number(match[1]);
  }

  const explicit = String(body || "").match(
    /"(?:reward|points_earned|earned_points|points_delta)"\s*:\s*([+-]?\d+)/
  );
  if (explicit) return Number(explicit[1]);

  if (
    result.kind !== "already" &&
    before.points !== null &&
    after.points !== null
  ) {
    const difference = Number(after.points) - Number(before.points);
    if (Number.isFinite(difference) && difference >= 0 && difference <= 1000) {
      return difference;
    }
  }
  return null;
}

function saveHistory(server, current, already, trustServer) {
  const stored = trustServer ? [] : readJSON(KEY.history, []);
  let values = [];
  if (Array.isArray(server)) values = values.concat(server);
  if (current && (!already || values.length === 0)) values.push(current);
  if (Array.isArray(stored)) values = values.concat(stored);

  let history = uniqueRecords(values);
  if (history.length === 0) {
    history.push({
      time: formatTime(new Date()),
      change: null,
      description: already ? "今日已签到" : "签到成功",
    });
  }
  writeJSON(KEY.history, history.slice(0, 30));
  return history.slice(0, 3);
}

async function loadPoints(result, response, before, jar, ua) {
  const saved = readJSON(KEY.user, null);
  let user = mergeUsers(userFrom(response.body), before, saved);

  if (!user.id || !user.nickname || user.points === null || user.days === null) {
    user = mergeUsers(await queryAccount(jar, ua), user);
  }

  const oldPoints = $persistentStore.read(KEY.points);
  if (user.points === null && oldPoints !== null && oldPoints !== "") {
    user.points = toNumber(oldPoints);
  }

  const reward = rewardFrom(result, response.body, before, user);
  const server = await queryPointLogs(jar, ua);
  const current =
    result.kind === "success" && result.verified
      ? reward !== null && reward > 0
        ? { time: formatTime(new Date()), change: reward, description: `签到成功，获得 ${reward} 积分` }
        : { time: formatTime(new Date()), change: null, description: result.detail || "签到成功" }
      : null;
  const history = saveHistory(
    server,
    current,
    result.kind === "already",
    server.length > 0
  );

  writeJSON(KEY.user, user);
  if (user.points !== null) {
    $persistentStore.write(String(user.points), KEY.points);
  }

  const info = {
    user,
    reward,
    latest: history[0] || null,
    history,
    source: server.length ? "server" : "local",
    queriedAt: new Date().toISOString(),
  };
  writeJSON(KEY.flow, info);
  return info;
}

function render(result, mode, points) {
  if (result.kind === "dormant") {
    return {
      title: "⚠️ 账号休眠",
      message: `${result.detail}\n\n点按此通知可直接打开恢复页面。`,
      log: `[${NAME}] 账号休眠：${result.detail}`,
      attach: { openUrl: "https://re0.me/restore" },
    };
  }
  if (result.kind === "login") {
    return {
      title: "🔑 登录已失效",
      message: `${result.detail}\n\n点按此通知重新登录 HDHive。`,
      log: `[${NAME}] 登录失效：${result.detail}`,
      attach: { openUrl: "https://re0.me/login" },
    };
  }
  const status =
    result.kind === "success"
      ? "✅ 签到成功"
      : result.kind === "already"
      ? "🎁 今天已经签到"
      : "❌ 签到失败";
  const lines = [
    "===HDHive===",
    "📌 签到结果",
    status,
    `签到模式：${mode}`,
  ];

  if (!points) {
    if (result.detail) lines.push(result.detail);
    if (result.sample) lines.push(`响应片段：${result.sample.slice(0, 120)}`);
  } else {
    const user = points.user;
    const latest = points.latest;
    if (user.nickname) lines.push(`用户昵称：${user.nickname}`);
    if (user.id) lines.push(`用户ID：${user.id}`);
    if (user.points !== null) lines.push(`当前积分：${user.points}`);
    if (user.days !== null) lines.push(`累计签到：${user.days} 天`);

    if (latest) {
      lines.push("", `最新变动：${latest.time}`);
      if (latest.change !== null) {
        lines.push(
          `变动数值：${latest.change >= 0 ? "+" : ""}${latest.change} 积分`
        );
      }
      lines.push(`内容描述：${latest.description}`);
    }

    lines.push("", "📝 积分日志：");
    points.history.slice(0, 3).forEach((item) => {
      const change =
        item.change === null
          ? ""
          : `${item.change >= 0 ? "+" : ""}${item.change} 积分 `;
      lines.push(`- ${item.time}：${change}${item.description}`);
    });
  }

  return {
    title: status,
    message: lines.slice(3).join("\n"),
    log: lines.join("\n"),
  };
}

function saveReport(result, gamble, attempts, source, points) {
  const report = {
    success: Boolean(result.ok),
    result: result.kind,
    detail: result.detail,
    sample: result.sample || "",
    httpStatus: result.status || 0,
    mode: gamble ? "gamble" : "normal",
    attempts,
    actionSource: source || "",
    executedAt: new Date().toISOString(),
  };

  if (points) {
    report.user = points.user;
    report.reward = points.reward;
    report.latest = points.latest;
    report.pointsSource = points.source;
  }
  writeJSON(KEY.report, report);
}

async function main() {
  const args = getArgs();
  const gamble = bool(args.gamble);
  const mode = gamble ? "赌狗签到" : "普通签到";
  const cookie = $persistentStore.read(KEY.cookie) || "";
  const ua = $persistentStore.read(KEY.ua) || DEFAULT_UA;

  if (!cookie) {
    throw new Error(
      "尚未获取登录 Cookie；请启用插件并登录一次 re0.me"
    );
  }

  const jar = new CookieJar(cookie);
  const firstSession = await renewToken(jar, ua);
  let pageHtml = firstSession.body;
  let before = mergeUsers(
    userFrom(firstSession.body),
    readJSON(KEY.user, null)
  );
  const savedPoints = $persistentStore.read(KEY.points);
  if (before.points === null && savedPoints !== null && savedPoints !== "") {
    before.points = toNumber(savedPoints);
  }

  let result = null;
  let response = null;
  let source = "";
  let attempts = 0;

  let forceScan = cachedChunkStale(pageHtml);
  if (forceScan) console.log(`[${NAME}] 检测到站点已重新构建，直接重新解析 Action ID`);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    attempts = attempt;
    const action = await getAction(jar, ua, pageHtml, forceScan);
    source = action.source;
    response = await submitCheckin(jar, ua, action.id, gamble);
    result = analyze(response);
    if (result.kind !== "success" && result.kind !== "already") {
      console.log(
        `[${NAME}] POST ${response.status} len=${String(response.body || "").length} ` +
          `kind=${result.kind}${result.verified ? " (verified)" : ""}`
      );
    }

    if (result.retry && attempt < 3) {
      forceScan = result.kind === "action";
      if (forceScan) $persistentStore.write(undefined, KEY.action);
      const session = await renewToken(jar, ua);
      pageHtml = session.body;
      before = mergeUsers(userFrom(session.body), before);
      continue;
    }
    break;
  }

  if (!result) {
    result = {
      ok: false,
      kind: "unknown",
      status: 0,
      detail: "签到流程没有返回结果",
    };
  }

  const points = result.ok
    ? await loadPoints(result, response, before, jar, ua)
    : null;
  saveReport(result, gamble, attempts, source, points);

  const output = render(result, mode, points);
  return {
    title: output.title,
    message: output.message,
    log: output.log,
    attach: output.attach || null,
  };
}

function captureCookie() {
  const headers = ($request && $request.headers) || {};
  const cookie = clean(getHeader(headers, "cookie"));
  const ua = clean(getHeader(headers, "user-agent"));
  const loggedIn =
    /(?:^|;\s*)token=/.test(cookie) ||
    /(?:^|;\s*)refresh_token=/.test(cookie);

  if (!cookie || !loggedIn) {
    console.log(`[${NAME}] 当前请求没有登录 Cookie，跳过保存`);
    $done({});
    return;
  }

  const first = !$persistentStore.read(KEY.cookie);
  $persistentStore.write(cookie, KEY.cookie);
  if (ua) $persistentStore.write(ua, KEY.ua);

  console.log(
    `[${NAME}] 登录 Cookie 已保存；字段数=${
      cookie.split(/;\s*/).filter(Boolean).length
    }`
  );
  if (first) {
    $notification.post(
      NAME,
      "✅ 登录信息获取成功",
      "签到前会自动续签 Token，无需每天手动打开网页。"
    );
  }
  $done({});
}

if (typeof $request !== "undefined") {
  captureCookie();
} else {
  main()
    .then((result) => {
      console.log(result.log);
      if (result.attach) $notification.post(NAME, result.title, result.message, result.attach);
      else $notification.post(NAME, result.title, result.message);
    })
    .catch((error) => {
      const message = error && error.message ? error.message : String(error);
      console.log(`[${NAME}] 执行失败: ${message}`);
      saveReport(
        {
          ok: false,
          kind: "exception",
          status: 0,
          detail: message,
        },
        bool(getArgs().gamble),
        0,
        "",
        null
      );
      $notification.post(NAME, "❌ 签到失败", message);
    })
    .finally(() => $done());
}