const SCRIPT_NAME = "小黑盒签到与任务";
const SCRIPT_VERSION = "3.0.1";
const STORAGE_KEY = "xhh_sign_accounts_v1";
const CAPTURE_NOTICE_KEY = "xhh_sign_capture_notice_v1";
const API_BASE = "https://api.xiaoheihe.cn";
const DATA_BASE = "https://data.xiaoheihe.cn";
const HKEY_API = "https://hkey.qcciii.com/hkey";
const PATH_TASK_LIST = "/task/list_v2/";
const PATH_SIGN = "/task/sign_v3/sign";
const PATH_SIGN_STATE = "/task/sign_v3/get_sign_state";
const PATH_FEEDS = "/bbs/app/feeds";
const PATH_GAME_RECOMMEND = "/game/all_recommend/v2";
const PATH_GAME_COMMENTS = "/bbs/app/link/game/comments";
const PATH_VIEW_TIME = "/bbs/app/link/view/time";
const PATH_DATA_REPORT = "/account/data_report/";
const PATH_BBS_POST = "/bbs/app/api/link/post";
const PATH_BBS_DELETE = "/bbs/app/link/delete";
const APP_UA =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36 ApiMaxJia/1.0";
const APP_REFERER = "http://api.maxjia.com/";
const MAX_ACCOUNTS = 10;
const WAITING_STATE = "waiting";
const FINISH_STATE = "finish";
const OK_STATE = "ok";
const SHARE_TASK_SETTLE_MS = 2200;
const APP_PROFILE = {
  os_type: "Android",
  x_os_type: "Android",
  x_client_type: "mobile",
  os_version: "12",
  dw: "360",
  channel: "heybox",
  x_app: "heybox",
  time_zone: "Asia/Shanghai",
  device_info: "HBP-AL00"
};

function notify(title, subtitle, content) {
  const detail = String(content == null ? "" : content);
  console.log([String(title), String(subtitle), detail].join("\n"));
  $notification.post(String(title), String(subtitle), detail);
}

function md5(input) {
  function add32(a, b) {
    return (a + b) & 0xffffffff;
  }
  function cmn(q, a, b, x, s, t) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function cycle(state, block) {
    let a = state[0];
    let b = state[1];
    let c = state[2];
    let d = state[3];
    const oa = a;
    const ob = b;
    const oc = c;
    const od = d;

    a = ff(a, b, c, d, block[0], 7, -680876936);
    d = ff(d, a, b, c, block[1], 12, -389564586);
    c = ff(c, d, a, b, block[2], 17, 606105819);
    b = ff(b, c, d, a, block[3], 22, -1044525330);
    a = ff(a, b, c, d, block[4], 7, -176418897);
    d = ff(d, a, b, c, block[5], 12, 1200080426);
    c = ff(c, d, a, b, block[6], 17, -1473231341);
    b = ff(b, c, d, a, block[7], 22, -45705983);
    a = ff(a, b, c, d, block[8], 7, 1770035416);
    d = ff(d, a, b, c, block[9], 12, -1958414417);
    c = ff(c, d, a, b, block[10], 17, -42063);
    b = ff(b, c, d, a, block[11], 22, -1990404162);
    a = ff(a, b, c, d, block[12], 7, 1804603682);
    d = ff(d, a, b, c, block[13], 12, -40341101);
    c = ff(c, d, a, b, block[14], 17, -1502002290);
    b = ff(b, c, d, a, block[15], 22, 1236535329);

    a = gg(a, b, c, d, block[1], 5, -165796510);
    d = gg(d, a, b, c, block[6], 9, -1069501632);
    c = gg(c, d, a, b, block[11], 14, 643717713);
    b = gg(b, c, d, a, block[0], 20, -373897302);
    a = gg(a, b, c, d, block[5], 5, -701558691);
    d = gg(d, a, b, c, block[10], 9, 38016083);
    c = gg(c, d, a, b, block[15], 14, -660478335);
    b = gg(b, c, d, a, block[4], 20, -405537848);
    a = gg(a, b, c, d, block[9], 5, 568446438);
    d = gg(d, a, b, c, block[14], 9, -1019803690);
    c = gg(c, d, a, b, block[3], 14, -187363961);
    b = gg(b, c, d, a, block[8], 20, 1163531501);
    a = gg(a, b, c, d, block[13], 5, -1444681467);
    d = gg(d, a, b, c, block[2], 9, -51403784);
    c = gg(c, d, a, b, block[7], 14, 1735328473);
    b = gg(b, c, d, a, block[12], 20, -1926607734);

    a = hh(a, b, c, d, block[5], 4, -378558);
    d = hh(d, a, b, c, block[8], 11, -2022574463);
    c = hh(c, d, a, b, block[11], 16, 1839030562);
    b = hh(b, c, d, a, block[14], 23, -35309556);
    a = hh(a, b, c, d, block[1], 4, -1530992060);
    d = hh(d, a, b, c, block[4], 11, 1272893353);
    c = hh(c, d, a, b, block[7], 16, -155497632);
    b = hh(b, c, d, a, block[10], 23, -1094730640);
    a = hh(a, b, c, d, block[13], 4, 681279174);
    d = hh(d, a, b, c, block[0], 11, -358537222);
    c = hh(c, d, a, b, block[3], 16, -722521979);
    b = hh(b, c, d, a, block[6], 23, 76029189);
    a = hh(a, b, c, d, block[9], 4, -640364487);
    d = hh(d, a, b, c, block[12], 11, -421815835);
    c = hh(c, d, a, b, block[15], 16, 530742520);
    b = hh(b, c, d, a, block[2], 23, -995338651);

    a = ii(a, b, c, d, block[0], 6, -198630844);
    d = ii(d, a, b, c, block[7], 10, 1126891415);
    c = ii(c, d, a, b, block[14], 15, -1416354905);
    b = ii(b, c, d, a, block[5], 21, -57434055);
    a = ii(a, b, c, d, block[12], 6, 1700485571);
    d = ii(d, a, b, c, block[3], 10, -1894986606);
    c = ii(c, d, a, b, block[10], 15, -1051523);
    b = ii(b, c, d, a, block[1], 21, -2054922799);
    a = ii(a, b, c, d, block[8], 6, 1873313359);
    d = ii(d, a, b, c, block[15], 10, -30611744);
    c = ii(c, d, a, b, block[6], 15, -1560198380);
    b = ii(b, c, d, a, block[13], 21, 1309151649);
    a = ii(a, b, c, d, block[4], 6, -145523070);
    d = ii(d, a, b, c, block[11], 10, -1120210379);
    c = ii(c, d, a, b, block[2], 15, 718787259);
    b = ii(b, c, d, a, block[9], 21, -343485551);

    state[0] = add32(a, oa);
    state[1] = add32(b, ob);
    state[2] = add32(c, oc);
    state[3] = add32(d, od);
  }
  function block(text) {
    const out = [];
    for (let i = 0; i < 64; i += 4) {
      out[i >> 2] =
        text.charCodeAt(i) +
        (text.charCodeAt(i + 1) << 8) +
        (text.charCodeAt(i + 2) << 16) +
        (text.charCodeAt(i + 3) << 24);
    }
    return out;
  }
  function digest(text) {
    const state = [1732584193, -271733879, -1732584194, 271733878];
    const totalLength = text.length;
    let i;
    for (i = 64; i <= text.length; i += 64) cycle(state, block(text.substring(i - 64, i)));
    text = text.substring(i - 64);
    const tail = new Array(16).fill(0);
    for (i = 0; i < text.length; i += 1) tail[i >> 2] |= text.charCodeAt(i) << ((i % 4) << 3);
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      cycle(state, tail);
      for (i = 0; i < 16; i += 1) tail[i] = 0;
    }
    tail[14] = totalLength * 8;
    cycle(state, tail);
    return state;
  }
  function rhex(value) {
    const hex = "0123456789abcdef";
    let out = "";
    for (let i = 0; i < 4; i += 1) {
      out +=
        hex.charAt((value >> (i * 8 + 4)) & 15) +
        hex.charAt((value >> (i * 8)) & 15);
    }
    return out;
  }
  const text = unescape(encodeURIComponent(String(input)));
  return digest(text).map(rhex).join("");
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

function toText(value) {
  return value == null ? "" : String(value).trim();
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

function pickCookieValue(cookie, key) {
  const items = String(cookie || "").split(";");
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i].trim();
    const pos = item.indexOf("=");
    if (pos < 1) continue;
    if (item.slice(0, pos).trim().toLowerCase() === String(key).toLowerCase()) {
      return item.slice(pos + 1).trim();
    }
  }
  return "";
}

function buildAppCookie(cookie) {
  const pkey = pickCookieValue(cookie, "pkey");
  const token = pickCookieValue(cookie, "x_xhh_tokenid");
  if (!pkey || !token) return "";
  return "pkey=" + pkey + ";x_xhh_tokenid=" + token;
}

function decodePkeyUserId(cookie) {
  const pkey = pickCookieValue(cookie, "pkey");
  if (!pkey) return "";
  let encoded;
  try {
    encoded = decodeURIComponent(pkey);
  } catch (_) {
    encoded = pkey;
  }
  const compact = encoded.replace(/_+$/, "") || encoded;
  const padded = compact + "=".repeat((4 - (compact.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    let plain;
    if (typeof atob === "function") plain = atob(base64);
    else if (typeof Buffer !== "undefined") plain = Buffer.from(base64, "base64").toString("utf8");
    else return "";
    const match = plain.match(/_(\d{5,})/);
    return match ? match[1] : "";
  } catch (_) {
    return "";
  }
}

function makeImei(cookie) {
  const pkey = pickCookieValue(cookie, "pkey");
  if (!pkey) throw new Error("Cookie 缺少 pkey");
  return md5(pkey).slice(0, 16);
}

function maskId(id) {
  const value = String(id || "");
  if (value.length <= 4) return value;
  return value.slice(0, 2) + "***" + value.slice(-2);
}

function loadAccounts() {
  try {
    const list = JSON.parse(readStore(STORAGE_KEY, "[]"));
    return Array.isArray(list)
      ? list
          .map((item) => {
            const cookie = buildAppCookie(item && item.cookie);
            const heyboxId =
              toText(item && item.heyboxId) || decodePkeyUserId(cookie);
            if (!cookie || !heyboxId) return null;
            return {
              heyboxId,
              cookie,
              imei: makeImei(cookie),
              updatedAt: Number(item.updatedAt) || 0
            };
          })
          .filter(Boolean)
      : [];
  } catch (_) {
    return [];
  }
}

async function captureAccount() {
  const url = toText($request && $request.url);
  const headers = ($request && $request.headers) || {};
  const cookie = buildAppCookie(getHeader(headers, "Cookie"));
  if (!cookie) return;
  const heyboxId =
    getQueryParam(url, "heybox_id") ||
    getQueryParam(url, "user_id") ||
    decodePkeyUserId(cookie);
  if (!heyboxId) return;

  const accounts = loadAccounts();
  const account = {
    heyboxId: String(heyboxId),
    cookie,
    imei: makeImei(cookie),
    updatedAt: Date.now()
  };
  const index = accounts.findIndex((item) => String(item.heyboxId) === String(heyboxId));
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
      "账号：" + maskId(heyboxId) + "\n已保存 Cookie，并根据 pkey 生成设备标识"
    );
  }
}

function encodeQuery(params) {
  return Object.keys(params || {})
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(String(params[key])))
    .join("&");
}

function parseSwitch(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return !/^(false|0|off|no)$/i.test(String(value));
}

function runtimeOptions() {
  const defaults = { dailyTasks: true, publishTask: false };
  if (typeof $argument === "undefined" || $argument == null) return defaults;
  let value = $argument;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch (_) {
      value = value.split(",");
    }
  }
  if (Array.isArray(value)) {
    return {
      dailyTasks: parseSwitch(value[0], true),
      publishTask: parseSwitch(value[1], false)
    };
  }
  if (typeof value === "object") {
    return {
      dailyTasks: parseSwitch(value.dailyTasks, true),
      publishTask: parseSwitch(value.publishTask, false)
    };
  }
  return defaults;
}

function randomString(length) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return output;
}

function randomUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    return (char === "x" ? value : (value & 3) | 8).toString(16);
  });
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function httpRequest(method, options) {
  return new Promise((resolve, reject) => {
    const fn = String(method || "GET").toUpperCase() === "POST" ? "post" : "get";
    const request = Object.assign({ timeout: 15000 }, options || {});
    $httpClient[fn](request, (error, response, data) => {
      if (error) {
        const host = toText(request.url).match(/^https?:\/\/([^/?#]+)/i);
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

function parseJsonResponse(response, action) {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(action + " HTTP " + response.status + " " + response.body.slice(0, 180));
  }
  try {
    return response.body ? JSON.parse(response.body) : null;
  } catch (_) {
    throw new Error(action + "返回内容不是 JSON：" + response.body.slice(0, 180));
  }
}

async function getJsonRequest(options, action) {
  return parseJsonResponse(await httpRequest("GET", options), action);
}

async function postJsonRequest(options, action) {
  return parseJsonResponse(await httpRequest("POST", options), action);
}

function apiFailureMessage(payload, fallback) {
  if (!payload) return fallback;
  return toText(payload.msg || payload.message) || toText(payload.status) || fallback;
}

function requireOk(payload, action) {
  if (!payload || toText(payload.status) !== OK_STATE) {
    throw new Error(action + "：" + apiFailureMessage(payload, "服务器未返回成功状态"));
  }
  return payload;
}

function unwrapHkeyPayload(payload) {
  if (!payload || typeof payload !== "object") return {};
  if (payload.result && typeof payload.result === "object") return payload.result;
  return payload;
}

async function requestHkey(account, path, timeSec) {
  const time = String(timeSec || Math.floor(Date.now() / 1000));
  const payload = await getJsonRequest(
    {
      url:
        HKEY_API +
        "?" +
        encodeQuery({
          mode: "request",
          path,
          time,
          imei: account.imei,
          heybox_id: account.heyboxId
        }),
      headers: { "User-Agent": APP_UA, Accept: "application/json" }
    },
    "hkey请求"
  );
  if (payload && payload.status && toText(payload.status) !== OK_STATE) {
    throw new Error("hkey接口：" + apiFailureMessage(payload, "签名失败"));
  }
  const result = unwrapHkeyPayload(payload);
  if (!result.hkey || !result.version || !/^\d+$/.test(toText(result.build))) {
    throw new Error("hkey接口缺少 hkey/version/build");
  }
  return {
    hkey: toText(result.hkey),
    version: toText(result.version),
    build: toText(result.build),
    time
  };
}

async function requestReportData(account, path, textPayload) {
  const time = String(Math.floor(Date.now() / 1000));
  const payload = await postJsonRequest(
    {
      url: HKEY_API,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        mode: "report",
        path,
        text: textPayload,
        time,
        imei: account.imei,
        heybox_id: account.heyboxId
      }),
      "auto-cookie": false
    },
    "任务数据编码"
  );
  if (payload && payload.status && toText(payload.status) !== OK_STATE) {
    throw new Error("任务数据编码：" + apiFailureMessage(payload, "编码失败"));
  }
  const result = unwrapHkeyPayload(payload);
  if (
    !result.hkey ||
    !result.version ||
    !/^\d+$/.test(toText(result.build)) ||
    !result.time ||
    !result.data ||
    !result.key ||
    !result.sid
  ) {
    throw new Error("任务数据编码返回字段不完整");
  }
  return result;
}

function appHeaders(account, hasBody) {
  const headers = {
    "User-Agent": APP_UA,
    Referer: APP_REFERER,
    Cookie: account.cookie,
    Accept: "application/json"
  };
  if (hasBody) headers["Content-Type"] = "application/x-www-form-urlencoded";
  return headers;
}

function buildSignedQuery(account, signature, extraQuery) {
  return Object.assign(
    {
      heybox_id: account.heyboxId,
      imei: account.imei,
      device_info: APP_PROFILE.device_info,
      nonce: randomString(32),
      hkey: signature.hkey,
      os_type: APP_PROFILE.os_type,
      x_os_type: APP_PROFILE.x_os_type,
      x_client_type: APP_PROFILE.x_client_type,
      os_version: APP_PROFILE.os_version,
      version: signature.version,
      build: signature.build,
      _time: signature.time,
      dw: APP_PROFILE.dw,
      channel: APP_PROFILE.channel,
      x_app: APP_PROFILE.x_app,
      time_zone: APP_PROFILE.time_zone
    },
    extraQuery || {}
  );
}

async function appGet(account, path, extraQuery, baseUrl) {
  const signature = await requestHkey(account, path);
  const url =
    (baseUrl || API_BASE) +
    path +
    "?" +
    encodeQuery(buildSignedQuery(account, signature, extraQuery));
  const payload = await getJsonRequest(
    { url, headers: appHeaders(account, false), "auto-cookie": false },
    path
  );
  console.log("[官方接口] " + path + " status=" + apiFailureMessage(payload, "空"));
  return payload;
}

async function appPostForm(account, path, extraQuery, bodyData, baseUrl) {
  const signature = await requestHkey(account, path);
  const url =
    (baseUrl || API_BASE) +
    path +
    "?" +
    encodeQuery(buildSignedQuery(account, signature, extraQuery));
  const payload = await postJsonRequest(
    {
      url,
      headers: appHeaders(account, true),
      body: encodeQuery(bodyData || {}),
      "auto-cookie": false
    },
    path
  );
  console.log("[官方接口] " + path + " status=" + apiFailureMessage(payload, "空"));
  return payload;
}

async function postEncryptedForm(account, path, textPayload, extraQuery, baseUrl) {
  const encoded = await requestReportData(account, path, textPayload);
  const signature = {
    hkey: encoded.hkey,
    version: encoded.version,
    build: encoded.build,
    time: toText(encoded.time)
  };
  const query = buildSignedQuery(
    account,
    signature,
    Object.assign({ time_: signature.time }, extraQuery || {})
  );
  const payload = await postJsonRequest(
    {
      url: (baseUrl || DATA_BASE) + path + "?" + encodeQuery(query),
      headers: appHeaders(account, true),
      body: encodeQuery({
        data: encoded.data,
        key: encoded.key,
        sid: encoded.sid
      }),
      "auto-cookie": false
    },
    path
  );
  console.log("[任务上报] " + path + " status=" + apiFailureMessage(payload, "空"));
  return payload;
}

function extractTaskList(payload) {
  requireOk(payload, "任务列表");
  const result = payload.result && typeof payload.result === "object" ? payload.result : {};
  const user = result.user && typeof result.user === "object" ? result.user : {};
  const levelInfo =
    user.level_info && typeof user.level_info === "object" ? user.level_info : {};
  const groups = Array.isArray(result.task_list) ? result.task_list : [];
  const tasks = [];
  groups.forEach((group) => {
    const list = Array.isArray(group.tasks) ? group.tasks : [];
    list.forEach((item) => {
      const reportExtra =
        item.report_extra && typeof item.report_extra === "object"
          ? item.report_extra
          : {};
      const awardText = (Array.isArray(item.award_desc_v2) ? item.award_desc_v2 : [])
        .map((award) => {
          const desc = toText(award && award.desc);
          const icon = toText(award && award.icon);
          if (icon.indexOf("b9aca51c") >= 0) return desc + "H币";
          if (icon.indexOf("c10d89ae") >= 0) return desc + "经验";
          if (icon.indexOf("e63b192a") >= 0) return desc + "盒电";
          return desc;
        })
        .filter(Boolean)
        .join(" ");
      tasks.push({
        title: toText(item.title || item.name || "未命名任务"),
        state: toText(item.state),
        stateDesc: toText(item.state_desc),
        taskId: toText(reportExtra.task_id),
        taskType: toText(item.type),
        reportTaskType: toText(reportExtra.task_type),
        maxjia: toText(item.maxjia),
        awardText
      });
    });
  });
  return {
    nickname: toText(user.username),
    coin: toText(levelInfo.coin),
    tasks
  };
}

function taskKey(task) {
  return task.taskId + "|" + task.title;
}

function findTask(snapshot, key) {
  return snapshot.tasks.find((task) => taskKey(task) === key);
}

function isSignTask(task) {
  return task.taskType === "sign";
}

function isDailyTask(task) {
  return isSignTask(task) || task.reportTaskType === "daily";
}

async function fetchSnapshot(account) {
  return extractTaskList(await appGet(account, PATH_TASK_LIST));
}

function collectObjects(root, matcher, limit) {
  const output = [];
  const stack = [root];
  const max = limit || 20;
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    if (matcher(node)) {
      output.push(node);
      if (output.length >= max) break;
    }
    const values = Array.isArray(node) ? node : Object.keys(node).map((key) => node[key]);
    for (let i = values.length - 1; i >= 0; i -= 1) stack.push(values[i]);
  }
  return output;
}

function extractFeeds(payload) {
  const links = payload && payload.result && payload.result.links;
  if (!Array.isArray(links)) return [];
  const seen = {};
  return links
    .map((item) => ({
      linkId: toText(item && item.link_id),
      hSrc: toText(item && item.h_src)
    }))
    .filter((item) => {
      const key = item.linkId + "|" + item.hSrc;
      if (!/^\d+$/.test(item.linkId) || !item.hSrc || seen[key]) return false;
      seen[key] = true;
      return true;
    });
}

function extractGames(payload) {
  const objects = collectObjects(
    payload && payload.result,
    (node) =>
      !Array.isArray(node) &&
      Object.prototype.hasOwnProperty.call(node, "appid") &&
      Object.prototype.hasOwnProperty.call(node, "h_src"),
    40
  );
  const seen = {};
  return objects
    .map((item) => ({
      appid: toText(item.appid),
      hSrc: toText(item.h_src)
    }))
    .filter((item) => {
      const key = item.appid + "|" + item.hSrc;
      if (!/^\d+$/.test(item.appid) || !item.hSrc || seen[key]) return false;
      seen[key] = true;
      return true;
    });
}

function extractComment(payload) {
  const links = payload && payload.result && payload.result.links;
  if (!Array.isArray(links)) return null;
  for (let i = 0; i < links.length; i += 1) {
    const item = links[i] || {};
    const linkId = toText(item.linkid || item.link_id);
    const userId = toText(item.userid);
    const hSrc = toText(item.h_src);
    if (/^\d+$/.test(linkId) && /^\d+$/.test(userId) && hSrc) {
      return { linkId, userId, hSrc };
    }
  }
  return null;
}

function buildShareReport(action, source, extra) {
  return JSON.stringify({
    events: [
      {
        type: action === "tap" ? "4" : "3",
        path: action === "tap" ? "/share/behavior/tap" : "/share/behavior/success",
        time: String(Math.floor(Date.now() / 1000)),
        addition: Object.assign({}, extra || {}, {
          src: source,
          plat: "WechatSession"
        })
      }
    ]
  });
}

async function sendShareEvents(account, source, extra) {
  const sessionId = randomUuid();
  const actions = ["tap", "success"];
  for (let i = 0; i < actions.length; i += 1) {
    const action = actions[i];
    const payload = await postEncryptedForm(
      account,
      PATH_DATA_REPORT,
      buildShareReport(action, source, extra),
      { type: "104", session_id: sessionId },
      DATA_BASE
    );
    requireOk(payload, "分享 " + action + " 上报");
    if (action === "tap") await sleep(2000);
  }
}

async function settleTask(account, task, detail) {
  await sleep(SHARE_TASK_SETTLE_MS);
  const snapshot = await fetchSnapshot(account);
  const after = findTask(snapshot, taskKey(task));
  if (after && after.state === FINISH_STATE) {
    return {
      ok: true,
      message: task.title + "完成" + (detail ? " " + detail : ""),
      snapshot
    };
  }
  return { ok: false, message: task.title + "仍为待完成", snapshot };
}

async function executeSign(account) {
  const first = await appGet(account, PATH_SIGN);
  if (first && first.status && toText(first.status) !== OK_STATE) {
    return { ok: false, message: apiFailureMessage(first, "签到失败") };
  }
  await sleep(800);
  const finalPayload = await appGet(account, PATH_SIGN_STATE);
  const result =
    finalPayload && finalPayload.result && typeof finalPayload.result === "object"
      ? finalPayload.result
      : {};
  const state = toText(result.state);
  if (
    (toText(finalPayload && finalPayload.status) === OK_STATE && state === OK_STATE) ||
    state === "ignore"
  ) {
    const details = [];
    if (result.sign_in_coin) details.push("+" + result.sign_in_coin + "H币");
    if (result.sign_in_exp) details.push("+" + result.sign_in_exp + "经验");
    if (result.sign_in_streak) details.push("连签" + result.sign_in_streak + "天");
    return {
      ok: true,
      message: details.length ? details.join(" ") : state === "ignore" ? "今日已签到" : "签到完成"
    };
  }
  return {
    ok: false,
    message: apiFailureMessage(finalPayload, state || "签到状态未确认")
  };
}

async function executeSharePost(account, task) {
  const feeds = await appGet(account, PATH_FEEDS, {
    pull: "1",
    last_pull: "1",
    is_first: "0",
    list_ver: "2",
    has_cache: "1",
    netmode: "wifi"
  });
  requireOk(feeds, "拉取帖子流");
  const posts = extractFeeds(feeds);
  if (!posts.length) return { ok: false, message: "没有可用帖子" };
  const post = posts[0];
  await sleep(1000);

  const viewPayload = await postEncryptedForm(
    account,
    PATH_VIEW_TIME,
    JSON.stringify({
      duration: [
        {
          id: Number(post.linkId),
          duration: 5,
          duration_ms: 5000,
          type: "link",
          time: Math.floor(Date.now() / 1000),
          h_src: post.hSrc
        }
      ],
      shows: [],
      disappear: []
    }),
    {},
    DATA_BASE
  );
  requireOk(viewPayload, "帖子浏览时长上报");
  await sendShareEvents(account, "link", {
    link_id: post.linkId,
    h_src: post.hSrc
  });
  return settleTask(account, task, "link_id=" + post.linkId);
}

async function executeShareGameDetail(account, task) {
  const payload = await appGet(account, PATH_GAME_RECOMMEND, {
    offset: "0",
    limit: "1"
  });
  requireOk(payload, "拉取推荐游戏");
  const games = extractGames(payload);
  if (!games.length) return { ok: false, message: "没有可用游戏" };
  const game = games[0];
  await sleep(1000);
  await sendShareEvents(account, "game_detail", {
    app_id: game.appid,
    h_src: game.hSrc
  });
  return settleTask(account, task, "appid=" + game.appid);
}

async function executeShareGameComment(account, task) {
  const recommend = await appGet(account, PATH_GAME_RECOMMEND, {
    offset: "0",
    limit: "1"
  });
  requireOk(recommend, "拉取推荐游戏");
  const games = extractGames(recommend);
  if (!games.length) return { ok: false, message: "没有可用游戏" };
  const game = games[0];
  const comments = await appGet(account, PATH_GAME_COMMENTS, {
    api_version: "4",
    offset: "0",
    limit: "30",
    appid: game.appid
  });
  requireOk(comments, "拉取游戏评价");
  const comment = extractComment(comments);
  if (!comment) return { ok: false, message: "游戏评价缺少关键字段" };
  await sendShareEvents(account, "game_comment", {
    link_id: comment.linkId
  });
  return settleTask(account, task, "appid=" + game.appid);
}

function extractTopicId(maxjia) {
  if (!maxjia) return "";
  try {
    const json = decodeURIComponent(String(maxjia).replace(/^heybox:\/\//, ""));
    const parsed = JSON.parse(json);
    return toText(parsed && parsed.params && parsed.params.topic_id);
  } catch (_) {
    return "";
  }
}

async function executePublishTask(account, task) {
  const topicId = extractTopicId(task.maxjia);
  if (!topicId) return { ok: false, message: "发布任务缺少 topic_id" };
  const title = "前面忘了中间忘了后面也忘了";
  const content = "孩子很爱用，很好吃，会复购";
  const payload = await appPostForm(
    account,
    PATH_BBS_POST,
    {},
    {
      draft: "0",
      topic_ids: topicId,
      link_tag: "27",
      text: JSON.stringify([{ checked: false, text: content, type: "text" }]),
      title,
      desc: content
    },
    API_BASE
  );
  requireOk(payload, "发布内容");
  const linkId = toText(payload.result && payload.result.link_id);
  if (!linkId) return { ok: false, message: "发帖成功但未返回 link_id" };
  await sleep(3000);
  const deletePayload = await appPostForm(
    account,
    PATH_BBS_DELETE,
    {},
    { link_id: linkId },
    API_BASE
  );
  if (toText(deletePayload && deletePayload.status) !== OK_STATE) {
    console.log("[警告] 自动删除帖子失败 link_id=" + linkId);
  }
  return settleTask(account, task, "link_id=" + linkId);
}

async function executeTask(account, task, options) {
  try {
    if (isSignTask(task)) return await executeSign(account);
    if (task.taskId === "1") return await executeSharePost(account, task);
    if (task.taskId === "19") return await executeShareGameDetail(account, task);
    if (task.taskId === "31") return await executeShareGameComment(account, task);
    if (task.taskId === "33" && options.publishTask) {
      return await executePublishTask(account, task);
    }
    return {
      ok: false,
      unsupported: true,
      message:
        task.taskId === "33"
          ? "自动发帖任务已关闭"
          : "暂不支持 task_id=" + (task.taskId || "未知")
    };
  } catch (error) {
    return { ok: false, message: String(error.message || error) };
  }
}

async function runAccount(account, index, options, lines) {
  let snapshot = await fetchSnapshot(account);
  lines.push(
    "",
    "账号 " +
      (index + 1) +
      "（" +
      maskId(account.heyboxId) +
      "）" +
      (snapshot.nickname ? " " + snapshot.nickname : "")
  );

  const relevant = snapshot.tasks.filter((task) => {
    if (isSignTask(task)) return true;
    if (!options.dailyTasks) return false;
    return isDailyTask(task) || (options.publishTask && task.taskId === "33");
  });

  for (let i = 0; i < relevant.length; i += 1) {
    const task = relevant[i];
    if (task.state === FINISH_STATE) {
      lines.push(
        "✅ " +
          task.title +
          "：已完成" +
          (task.awardText ? "（" + task.awardText + "）" : "")
      );
      continue;
    }
    if (task.state !== WAITING_STATE) {
      lines.push("⚠️ " + task.title + "：" + (task.stateDesc || task.state || "状态未知"));
      continue;
    }

    snapshot = await fetchSnapshot(account);
    const latest = findTask(snapshot, taskKey(task));
    if (!latest || latest.state !== WAITING_STATE) continue;
    const result = await executeTask(account, latest, options);
    if (result.unsupported) {
      lines.push("⚠️ " + latest.title + "：" + result.message);
      continue;
    }

    snapshot = result.snapshot || (await fetchSnapshot(account));
    const after = findTask(snapshot, taskKey(latest));
    if (result.ok && after && after.state === FINISH_STATE) {
      lines.push(
        "✅ " +
          after.title +
          "：服务器已确认完成" +
          (latest.awardText ? "（" + latest.awardText + "）" : "")
      );
    } else {
      lines.push("❌ " + latest.title + "：" + result.message);
    }
    await sleep(800);
  }

  const finalSnapshot = await fetchSnapshot(account);
  lines.push("💰 当前H币：" + (finalSnapshot.coin || "未知"));
  const waiting = finalSnapshot.tasks.filter((task) => {
    if (!isDailyTask(task) && !(options.publishTask && task.taskId === "33")) return false;
    if (!options.dailyTasks && !isSignTask(task)) return false;
    return task.state === WAITING_STATE;
  });
  if (waiting.length) {
    lines.push("▫️ 仍待完成：" + waiting.map((task) => task.title).join("、"));
  }
  return waiting.length === 0;
}

async function runAutomation() {
  const accounts = loadAccounts();
  const options = runtimeOptions();
  if (!accounts.length) {
    notify(
      SCRIPT_NAME,
      "⚠️ 尚未获取账号",
      "请打开小黑盒 App，进入“我的”页面并刷新一次。"
    );
    return;
  }

  const lines = ["📌 签到与任务结果"];
  let okCount = 0;
  for (let i = 0; i < accounts.length; i += 1) {
    try {
      if (await runAccount(accounts[i], i, options, lines)) okCount += 1;
    } catch (error) {
      lines.push(
        "",
        "账号 " + (i + 1) + "（" + maskId(accounts[i].heyboxId) + "）",
        "❌ 执行失败：" + String(error.message || error)
      );
    }
    if (i < accounts.length - 1) await sleep(1200);
  }

  lines.push("", "完成账号：" + okCount + "/" + accounts.length, "版本：" + SCRIPT_VERSION);
  notify(
    "===小黑盒===",
    okCount === accounts.length ? "✅ 服务器已确认完成" : "⚠️ 存在未完成任务",
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
    buildAppCookie,
    decodePkeyUserId,
    makeImei,
    encodeQuery,
    runtimeOptions,
    unwrapHkeyPayload,
    extractTaskList,
    extractFeeds,
    extractGames,
    extractComment,
    buildShareReport,
    extractTopicId,
    taskKey,
    isDailyTask,
    requestHkey,
    requestReportData,
    appGet,
    postEncryptedForm
  };
} else {
  const requestMode = typeof $request !== "undefined";
  main()
    .catch((error) => {
      notify(SCRIPT_NAME, "❌ 脚本异常", String((error && error.stack) || error));
    })
    .then(() => {
      if (requestMode) $done({});
      else $done();
    });
}