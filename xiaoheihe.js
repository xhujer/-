const SCRIPT_NAME = "小黑盒签到与任务";
const SCRIPT_VERSION = "2.0.3";
const STORAGE_KEY = "xhh_sign_accounts_v1";
const CAPTURE_NOTICE_KEY = "xhh_sign_capture_notice_v1";
const SIGN_PATH = "/task/sign/";
const SIGN_V3_PATH = "/task/sign_v3/sign";
const TASK_LIST_PATH = "/task/list_v2/";
const DATA_REPORT_PATH = "/account/data_report/";
const API_BASE = "https://api.xiaoheihe.cn";
const DATA_BASE = "https://data.xiaoheihe.cn";
const DEFAULT_TASK_SERVICE = "http://47.120.39.109:9900/hkey";
const API_NONCE = "tb6e1k7WqQCIHToyzWzI8Ogq9d0EIgpb";
const DATA_NONCE = "fSz04CwxvcWzG737aFNKKxNeGZDFOqJ1";
const MAX_ACCOUNTS = 10;
const DAILY_TASKS = [
  { key: "shareArticle", label: "分享帖子" },
  { key: "shareGameDetail", label: "分享游戏详情" },
  { key: "shareGameComment", label: "分享游戏评价" },
  { key: "visitGameRank", label: "访问游戏榜单" }
];

function notify(title, subtitle, content) {
  const detail = String(content == null ? "" : content);
  console.log([String(title), String(subtitle), detail].join("\n"));
  $notification.post(String(title), String(subtitle), detail);
}

function safeAdd(x, y) {
  const lsw = (x & 0xffff) + (y & 0xffff);
  const msw = (x >>> 16) + (y >>> 16) + (lsw >>> 16);
  return (msw << 16) | (lsw & 0xffff);
}

function bitRotateLeft(num, cnt) {
  return (num << cnt) | (num >>> (32 - cnt));
}

function md5Cmn(q, a, b, x, s, t) {
  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}

function md5Ff(a, b, c, d, x, s, t) {
  return md5Cmn((b & c) | (~b & d), a, b, x, s, t);
}

function md5Gg(a, b, c, d, x, s, t) {
  return md5Cmn((b & d) | (c & ~d), a, b, x, s, t);
}

function md5Hh(a, b, c, d, x, s, t) {
  return md5Cmn(b ^ c ^ d, a, b, x, s, t);
}

function md5Ii(a, b, c, d, x, s, t) {
  return md5Cmn(c ^ (b | ~d), a, b, x, s, t);
}

function binlMd5(x, len) {
  x[len >> 5] |= 0x80 << len % 32;
  x[((len + 64) >>> 9 << 4) + 14] = len;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < x.length; i += 16) {
    const oldA = a;
    const oldB = b;
    const oldC = c;
    const oldD = d;

    a = md5Ff(a, b, c, d, x[i], 7, -680876936);
    d = md5Ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5Ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5Ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5Ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5Ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5Ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5Ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5Ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5Ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5Ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5Ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5Ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5Ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5Ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5Ff(b, c, d, a, x[i + 15], 22, 1236535329);

    a = md5Gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5Gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5Gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5Gg(b, c, d, a, x[i], 20, -373897302);
    a = md5Gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5Gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5Gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5Gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5Gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5Gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5Gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5Gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5Gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5Gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5Gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5Gg(b, c, d, a, x[i + 12], 20, -1926607734);

    a = md5Hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5Hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5Hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5Hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5Hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5Hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5Hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5Hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5Hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5Hh(d, a, b, c, x[i], 11, -358537222);
    c = md5Hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5Hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5Hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5Hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5Hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5Hh(b, c, d, a, x[i + 2], 23, -995338651);

    a = md5Ii(a, b, c, d, x[i], 6, -198630844);
    d = md5Ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5Ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5Ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5Ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5Ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5Ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5Ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5Ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5Ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5Ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5Ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5Ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5Ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5Ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5Ii(b, c, d, a, x[i + 9], 21, -343485551);

    a = safeAdd(a, oldA);
    b = safeAdd(b, oldB);
    c = safeAdd(c, oldC);
    d = safeAdd(d, oldD);
  }

  return [a, b, c, d];
}

function rstr2binl(input) {
  const output = [];
  output[(input.length >> 2) - 1] = undefined;
  for (let i = 0; i < output.length; i += 1) output[i] = 0;
  for (let i = 0; i < input.length * 8; i += 8) {
    output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << i % 32;
  }
  return output;
}

function binl2rstr(input) {
  let output = "";
  for (let i = 0; i < input.length * 32; i += 8) {
    output += String.fromCharCode((input[i >> 5] >>> i % 32) & 0xff);
  }
  return output;
}

function rstrMd5(input) {
  return binl2rstr(binlMd5(rstr2binl(input), input.length * 8));
}

function rstr2hex(input) {
  const hexTab = "0123456789abcdef";
  let output = "";
  for (let i = 0; i < input.length; i += 1) {
    const x = input.charCodeAt(i);
    output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f);
  }
  return output;
}

function str2rstrUtf8(input) {
  return unescape(encodeURIComponent(input));
}

function md5(input) {
  return rstr2hex(rstrMd5(str2rstrUtf8(String(input))));
}

function vm(num) {
  return num & 128 ? 255 & ((num << 1) ^ 27) : num << 1;
}

function qm(num) {
  return vm(num) ^ num;
}

function xm(num) {
  return qm(vm(num));
}

function ym(num) {
  return xm(qm(vm(num)));
}

function gm(num) {
  return ym(num) ^ xm(num) ^ qm(num);
}

function mixed(values) {
  return [
    gm(values[0]) ^ ym(values[1]) ^ xm(values[2]) ^ qm(values[3]),
    qm(values[0]) ^ gm(values[1]) ^ ym(values[2]) ^ xm(values[3]),
    xm(values[0]) ^ qm(values[1]) ^ gm(values[2]) ^ ym(values[3]),
    ym(values[0]) ^ xm(values[1]) ^ qm(values[2]) ^ gm(values[3]),
    values[4],
    values[5]
  ];
}

function av(value, key, offset) {
  const alphabet = key.slice(0, key.length + offset);
  let output = "";
  for (let i = 0; i < value.length; i += 1) {
    output += alphabet.charAt(value.charCodeAt(i) % alphabet.length);
  }
  return output;
}

function sv(value, key) {
  let output = "";
  for (let i = 0; i < value.length; i += 1) {
    output += key.charAt(value.charCodeAt(i) % key.length);
  }
  return output;
}

function interleave(values) {
  let output = "";
  const maxLength = Math.max.apply(null, values.map((item) => item.length));
  for (let i = 0; i < maxLength; i += 1) {
    for (let j = 0; j < values.length; j += 1) {
      if (i < values[j].length) output += values[j].charAt(i);
    }
  }
  return output;
}

function createSignature(path, fixedTime, fixedNonce) {
  const time = fixedTime || Math.floor(Date.now() / 1000);
  const nonce =
    fixedNonce ||
    md5(String(time) + String(Math.floor(Math.random() * Date.now()))).toUpperCase();
  const key = "AB45STUVWZEFGJ6CH01D237IXYPQRKLMN89";
  const parts = [av(String(time), key, -2), sv(path, key), sv(nonce, key)];
  parts.sort((a, b) => a.length - b.length);
  const digest = md5(interleave(parts).slice(0, 20));
  const tail = digest
    .slice(-6)
    .split("")
    .map((char) => char.charCodeAt(0));
  const total = mixed(tail).reduce((sum, item) => sum + item, 0);
  return {
    hkey: av(digest.slice(0, 5), key, -4) + String(total % 100).padStart(2, "0"),
    nonce,
    time
  };
}

function readStore(key, fallback) {
  try {
    const value = $persistentStore.read(key);
    return value == null || value === "" ? fallback : value;
  } catch (_) {
    return fallback;
  }
}

function writeStore(value, key) {
  try {
    return $persistentStore.write(value, key);
  } catch (_) {
    return false;
  }
}

function loadAccounts() {
  try {
    const accounts = JSON.parse(readStore(STORAGE_KEY, "[]"));
    return Array.isArray(accounts) ? accounts : [];
  } catch (_) {
    return [];
  }
}

function getHeader(headers, name) {
  const target = String(name).toLowerCase();
  const keys = Object.keys(headers || {});
  for (let i = 0; i < keys.length; i += 1) {
    if (keys[i].toLowerCase() === target) return headers[keys[i]];
  }
  return "";
}

function getQueryParam(url, name) {
  const match = String(url).match(new RegExp("[?&]" + name + "=([^&#]*)", "i"));
  if (!match) return "";
  try {
    return decodeURIComponent(match[1].replace(/\+/g, " "));
  } catch (_) {
    return match[1];
  }
}

function pickCookie(rawCookie) {
  const wanted = {};
  String(rawCookie || "")
    .split(";")
    .forEach((part) => {
      const index = part.indexOf("=");
      if (index < 1) return;
      const name = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      const lower = name.toLowerCase();
      if ((lower === "pkey" || lower === "x_xhh_tokenid") && value) {
        wanted[lower] = name + "=" + value;
      }
    });
  return wanted.pkey && wanted.x_xhh_tokenid
    ? wanted.pkey + "; " + wanted.x_xhh_tokenid
    : "";
}

function captureClient(url, headers) {
  const fields = [
    "imei",
    "device_info",
    "device_id",
    "os_type",
    "x_os_type",
    "app",
    "client_type",
    "x_client_type",
    "os_version",
    "version",
    "web_version",
    "build",
    "dw",
    "channel",
    "x_app"
  ];
  const client = {};
  fields.forEach((field) => {
    const value = getQueryParam(url, field);
    if (value) client[field] = value;
  });
  const userAgent = getHeader(headers, "User-Agent");
  if (userAgent) client.userAgent = userAgent;
  return client;
}

function maskId(id) {
  const value = String(id || "");
  if (value.length <= 4) return value;
  return value.slice(0, 2) + "***" + value.slice(-2);
}

async function captureAccount() {
  const url = $request.url || "";
  const headers = $request.headers || {};
  const heyboxId = getQueryParam(url, "heybox_id") || getQueryParam(url, "user_id");
  const cookie = pickCookie(getHeader(headers, "Cookie"));
  if (!heyboxId || !cookie) return;

  const accounts = loadAccounts();
  const client = captureClient(url, headers);
  const index = accounts.findIndex((item) => String(item.heyboxId) === String(heyboxId));
  const previous = index >= 0 ? accounts[index] : null;
  const account = {
    heyboxId: String(heyboxId),
    cookie,
    client: Object.assign({}, previous ? previous.client : {}, client),
    updatedAt: Date.now()
  };

  if (index >= 0) accounts[index] = account;
  else accounts.push(account);
  while (accounts.length > MAX_ACCOUNTS) accounts.shift();

  if (!writeStore(JSON.stringify(accounts), STORAGE_KEY)) {
    notify(SCRIPT_NAME, "❌ 获取账号失败", "Loon 持久化存储写入失败");
    return;
  }

  const fingerprint = heyboxId + "|" + md5(cookie);
  if (readStore(CAPTURE_NOTICE_KEY, "") !== fingerprint) {
    writeStore(fingerprint, CAPTURE_NOTICE_KEY);
    notify(
      SCRIPT_NAME,
      "✅ 获取账号成功",
      "账号：" + maskId(heyboxId) + "\n已保存 Cookie 和当前客户端参数"
    );
  }
}

function encodeQuery(params) {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(String(params[key])))
    .join("&");
}

function runtimeOptions() {
  const defaults = {
    dailyTasks: true,
    taskService: DEFAULT_TASK_SERVICE
  };
  if (typeof $argument === "undefined" || $argument == null) return defaults;
  if (typeof $argument === "object") {
    return {
      dailyTasks: !/^(false|0|off)$/i.test(String($argument.dailyTasks)),
      taskService: String($argument.taskService || DEFAULT_TASK_SERVICE).trim()
    };
  }
  try {
    const parsed = JSON.parse(String($argument));
    return {
      dailyTasks: !/^(false|0|off)$/i.test(String(parsed.dailyTasks)),
      taskService: String(parsed.taskService || DEFAULT_TASK_SERVICE).trim()
    };
  } catch (_) {
    return defaults;
  }
}

function buildClientParams(account, signature) {
  return {
    heybox_id: account.heyboxId,
    imei: "4187fb55b1be198a",
    device_info: "XiaoMi 13私人定制版",
    nonce: signature.nonce || API_NONCE,
    hkey: signature.hkey,
    os_type: "Android",
    x_os_type: "Android",
    x_client_type: "mobile",
    os_version: "9",
    version: "1.3.332",
    build: "871",
    _time: signature.time || signature.timestamp,
    dw: "428",
    channel: "heybox_xiaomi",
    x_app: "heybox"
  };
}

function commonHeaders(account, host) {
  return {
    Cookie: account.cookie,
    Referer: "http://api.maxjia.com/",
    Host: host,
    Connection: "Keep-Alive",
    "Accept-Encoding": "gzip",
    "User-Agent":
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML like Gecko) Chrome/41.0.2272.118 Safari/537.36 ApiMaxJia/1.0"
  };
}

function buildSignedRequest(account, base, path, signature, extraParams, method, body) {
  const params = Object.assign(
    {},
    buildClientParams(account, signature),
    extraParams || {}
  );
  const host = base.replace(/^https?:\/\//i, "");
  const request = {
    url: base + path + "?" + encodeQuery(params),
    headers: commonHeaders(account, host),
    timeout: 15000
  };
  if (String(method || "GET").toUpperCase() === "POST") {
    request.headers["Content-Type"] = "application/x-www-form-urlencoded";
    request.body = body || "";
  }
  return request;
}

function buildSignRequest(account, signature) {
  if (signature) {
    return buildSignedRequest(account, API_BASE, SIGN_V3_PATH, signature);
  }
  return buildSignedRequest(account, API_BASE, SIGN_PATH, createSignature(SIGN_PATH));
}

function httpRequest(method, options) {
  return new Promise((resolve, reject) => {
    const fn = String(method).toUpperCase() === "POST" ? "post" : "get";
    $httpClient[fn](options, (error, response, data) => {
      if (error) {
        const host = String(options.url || "").match(/^https?:\/\/([^/?#]+)/i);
        reject(
          new Error(
            fn.toUpperCase() +
              " " +
              (host ? host[1] : "网络请求") +
              "：" +
              String(error)
          )
        );
        return;
      }
      resolve({
        status: Number(response && (response.status || response.statusCode)) || 0,
        body: data == null ? "" : String(data)
      });
    });
  });
}

function httpGet(options) {
  return httpRequest("GET", options);
}

function httpPost(options) {
  return httpRequest("POST", options);
}

async function getTaskSignature(account, type, taskName, serviceUrl) {
  if (!/^https?:\/\/[^/]+/i.test(serviceUrl || "")) {
    throw new Error("任务编码服务地址无效");
  }
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await httpPost({
        url: serviceUrl,
        headers: {
          "Content-Type": "application/json",
          Connection: "close"
        },
        body: JSON.stringify({
          heyboxId: String(account.heyboxId),
          type: Number(type),
          taskName: taskName || "null"
        }),
        timeout: 15000,
        "auto-cookie": false
      });
      if (response.status < 200 || response.status >= 300) {
        throw new Error("编码服务 HTTP " + response.status);
      }
      let payload;
      try {
        payload = JSON.parse(response.body);
      } catch (_) {
        throw new Error("编码服务返回内容不是 JSON");
      }
      if (!payload || !payload.hkey || !payload.timestamp) {
        throw new Error(
          String((payload && (payload.msg || payload.message)) || "编码服务缺少签名")
        );
      }
      payload.time = payload.timestamp;
      if (attempt > 1) console.log("任务编码服务第 " + attempt + " 次请求成功");
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(700 * attempt);
    }
  }
  throw new Error(
    "编码服务连续 3 次请求失败：" + String(lastError.message || lastError)
  );
}

function parseSignResult(response) {
  if (response.status < 200 || response.status >= 300) {
    return {
      ok: false,
      text: "HTTP " + response.status + "\n" + response.body.slice(0, 160)
    };
  }

  let data;
  try {
    data = JSON.parse(response.body);
  } catch (_) {
    return { ok: false, text: "返回内容不是 JSON\n" + response.body.slice(0, 160) };
  }

  const message = String(data.msg || data.message || "").trim();
  const state = String(
    data.result && data.result.state != null ? data.result.state : ""
  );
  const resultText = (message + " " + state).trim();

  if (
    /非法请求|失败|错误|过期|重新登录|未登录|无效|拒绝/i.test(resultText) ||
    /\b(invalid|error|fail(?:ed|ure)?|denied|expired)\b/i.test(resultText)
  ) {
    return {
      ok: false,
      text: message || state || "服务器返回签到失败"
    };
  }

  if (
    data.status === "ok" ||
    data.success === true ||
    data.code === 0 ||
    /^(signed|success|ok)$/i.test(state) ||
    /签到成功|^成功$/.test(message)
  ) {
    return {
      ok: true,
      text: message || "今天已经签到"
    };
  }

  if (/已签到|已经签到|重复签到/.test(message)) {
    return { ok: true, text: message };
  }

  return {
    ok: false,
    text: message || "服务器返回签到失败"
  };
}

function parseJsonResponse(response, action) {
  if (response.status < 200 || response.status >= 300) {
    return {
      ok: false,
      data: null,
      text: action + " HTTP " + response.status
    };
  }
  let data;
  try {
    data = JSON.parse(response.body);
  } catch (_) {
    return { ok: false, data: null, text: action + "返回内容不是 JSON" };
  }
  const message = String(data.msg || data.message || "").trim();
  const ok =
    data.status === "ok" ||
    data.success === true ||
    data.code === 0 ||
    message === "";
  return {
    ok,
    data,
    text: message || (ok ? action + "成功" : action + "失败")
  };
}

async function signAccount(account, serviceUrl) {
  let serviceError;
  try {
    const signature = await getTaskSignature(account, 1, "null", serviceUrl);
    return parseSignResult(await httpGet(buildSignRequest(account, signature)));
  } catch (error) {
    serviceError = error;
  }

  try {
    const fallback = parseSignResult(await httpGet(buildSignRequest(account)));
    if (!fallback.ok) {
      fallback.text += "\n任务编码服务：" + String(serviceError.message || serviceError);
    }
    return fallback;
  } catch (fallbackError) {
    throw new Error(
      "任务编码服务：" +
        String(serviceError.message || serviceError) +
        "\n官方签到请求：" +
        String(fallbackError.message || fallbackError)
    );
  }
}

async function reportDailyTask(account, task, serviceUrl) {
  const signature = await getTaskSignature(account, 5, task.key, serviceUrl);
  if (!signature.data || !signature.key || !signature.sid) {
    throw new Error("编码服务未返回任务数据");
  }
  const params = {
    type: 104,
    time_: signature.timestamp,
    session_id: "77ee4fea-46d9-4a53-b5ce-5df9cf056b7e",
    nonce: DATA_NONCE
  };
  const body = encodeQuery({
    data: signature.data,
    key: signature.key,
    sid: signature.sid
  });
  const request = buildSignedRequest(
    account,
    DATA_BASE,
    DATA_REPORT_PATH,
    signature,
    params,
    "POST",
    body
  );
  return parseJsonResponse(await httpPost(request), task.label);
}

function flattenTaskList(payload) {
  const result = payload && payload.result;
  const groups = result && Array.isArray(result.task_list) ? result.task_list : [];
  const lines = [];
  groups.forEach((group) => {
    const tasks = Array.isArray(group.tasks) ? group.tasks : [];
    tasks.forEach((task) => {
      const title = String(task.title || task.name || "未命名任务");
      const state = String(task.state == null ? "" : task.state);
      const done =
        /^(1|2|done|complete|completed|finish|finished)$/i.test(state) ||
        /已完成|已领取/.test(state);
      lines.push((done ? "✅ " : "▫️ ") + title + "：" + (done ? "已完成" : state || "未完成"));
    });
  });
  return lines;
}

async function getTaskList(account, serviceUrl) {
  let signature;
  try {
    signature = await getTaskSignature(account, 3, "null", serviceUrl);
  } catch (_) {
    signature = createSignature(TASK_LIST_PATH);
  }
  const request = buildSignedRequest(
    account,
    API_BASE,
    TASK_LIST_PATH,
    signature
  );
  return parseJsonResponse(await httpGet(request), "任务列表");
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function runAutomation() {
  const accounts = loadAccounts();
  const options = runtimeOptions();
  if (!accounts.length) {
    notify(
      SCRIPT_NAME,
      "⚠️ 尚未获取账号",
      "请打开小黑盒 App，进入“我的”页面或刷新一次。"
    );
    return;
  }

  const lines = ["📌 签到与任务结果"];
  let successCount = 0;
  for (let i = 0; i < accounts.length; i += 1) {
    const account = accounts[i];
    const accountTitle = "账号 " + (i + 1) + "（" + maskId(account.heyboxId) + "）";
    lines.push("", accountTitle);
    try {
      const result = await signAccount(account, options.taskService);
      if (result.ok) successCount += 1;
      lines.push((result.ok ? "✅ " : "❌ ") + "签到：" + result.text);
    } catch (error) {
      lines.push("❌ 签到：" + String(error.message || error));
    }

    if (options.dailyTasks) {
      for (let j = 0; j < DAILY_TASKS.length; j += 1) {
        const task = DAILY_TASKS[j];
        try {
          const result = await reportDailyTask(account, task, options.taskService);
          lines.push((result.ok ? "✅ " : "❌ ") + task.label + "：" + result.text);
        } catch (error) {
          lines.push("❌ " + task.label + "：" + String(error.message || error));
        }
        await sleep(800);
      }

      try {
        const taskList = await getTaskList(account, options.taskService);
        const states = taskList.ok ? flattenTaskList(taskList.data) : [];
        if (states.length) {
          lines.push("📋 服务器任务状态");
          Array.prototype.push.apply(lines, states);
        } else {
          lines.push("⚠️ 任务状态：" + taskList.text);
        }
      } catch (error) {
        lines.push("⚠️ 任务状态读取失败：" + String(error.message || error));
      }
    } else {
      lines.push("⏭️ 日常任务：已在插件参数中关闭");
    }

    if (i < accounts.length - 1) await sleep(1200);
  }

  lines.push("", "成功：" + successCount + "/" + accounts.length, "版本：" + SCRIPT_VERSION);
  notify(
    "===小黑盒===",
    successCount === accounts.length ? "✅ 执行完成" : "⚠️ 执行存在失败",
    lines.join("\n")
  );
}

async function main() {
  if (typeof $request !== "undefined") await captureAccount();
  else await runAutomation();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    md5,
    createSignature,
    parseSignResult,
    parseJsonResponse,
    flattenTaskList,
    buildSignRequest,
    buildSignedRequest
  };
} else {
  main()
    .catch((error) => {
      notify(
        SCRIPT_NAME,
        "❌ 脚本异常",
        String((error && error.stack) || error)
      );
    })
    .then(() => $done());
}
