/**
 * HDHive / 影巢自动签到（Loon）
 * 适配 2026 年 6 月重构后的 Next.js Server Action。
 * 支持 Token 自动续签、动态 Action、积分资料和最近三条积分记录。
 */

const NAME = "HDHive 自动签到";
const BASE = "https://hdhive.com";
const HOME = `${BASE}/`;
const ACTION_API = "https://hdhive.ckid.workers.dev/";
const DEFAULT_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 " +
  "Mobile/15E148 Safari/604.1";
const CHECKIN_TREE =
  "%5B%22%22%2C%7B%22children%22%3A%5B%22(app)%22%2C%7B%22children%22%3A" +
  "%5B%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue" +
  "%5D%7D%2Cnull%2Cnull%2Ctrue%5D";
const POINTS_TREE = routeTree(["manager", "points-logs"]);

const KEY = {
  cookie: "hdhive_cookie_v15",
  ua: "hdhive_ua_v15",
  action: "hdhive_action_v1",
  user: "hdhive_last_user_v2",
  points: "hdhive_last_points_v2",
  history: "hdhive_sign_history_v2",
  flow: "hdhive_points_flow_v4",
  report: "hdhive_checkin_report_v1",
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

        if (name) {
          this.data[name] = value;
        }
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

      if (index <= 0) {
        return;
      }

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

      if (!value || expired) {
        delete this.data[name];
      } else {
        this.data[name] = value;
      }

      if (changed.indexOf(name) === -1) {
        changed.push(name);
      }
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
            if (item.trim()) {
              result.push(item.trim());
            }
          });
      });
  });

  return result;
}

function getArgs() {
  if (typeof $argument === "undefined" || $argument === null) {
    return {};
  }

  if (typeof $argument === "object") {
    return Array.isArray($argument)
      ? { gamble: $argument[0] }
      : $argument;
  }

  const text = String($argument).trim();

  if (!text) {
    return {};
  }

  if (text[0] === "{" || text[0] === "[") {
    try {
      const value = JSON.parse(text);
      return Array.isArray(value) ? { gamble: value[0] } : value;
    } catch (_) {}
  }

  if (text.indexOf("=") < 0) {
    return { gamble: text };
  }

  const result = {};

  text.split("&").forEach((part) => {
    const index = part.indexOf("=");

    if (index <= 0) {
      return;
    }

    const key = decodeURIComponent(
      part.slice(0, index).replace(/\+/g, " ")
    );
    const value = decodeURIComponent(
      part.slice(index + 1).replace(/\+/g, " ")
    );

    result[key] = value;
  });

  return result;
}

function bool(value) {
  if (typeof value === "boolean") {
    return value;
  }

  return /^(1|true|yes|on|开启|是)$/i.test(
    String(value || "").trim()
  );
}

function clean(value) {
  return String(
    value === null || value === undefined ? "" : value
  )
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
  return $persistentStore.write(
    JSON.stringify(value),
    key
  );
}

function toNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (Number.isFinite(Number(value))) {
    return Number(value);
  }

  const match = String(value).match(
    /[+-]?\d+(?:\.\d+)?/
  );

  return match && Number.isFinite(Number(match[0]))
    ? Number(match[0])
    : null;
}

function formatTime(value) {
  const original = clean(value);

  let date =
    value instanceof Date
      ? value
      : new Date(
          original
            ? original.replace(" ", "T")
            : Date.now()
        );

  if (Number.isNaN(date.getTime())) {
    return original || formatTime(new Date());
  }

  const pad = (number) =>
    String(number).padStart(2, "0");

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())} ` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}:` +
    `${pad(date.getSeconds())}`
  );
}

function decodeText(value) {
  return String(value || "")
    .replace(
      /\\u([0-9a-f]{4})/gi,
      (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
    )
    .replace(
      /\\x([0-9a-f]{2})/gi,
      (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\\"/g, '"');
}

function jsonField(text, name) {
  const escaped = String(name).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const match = String(text || "").match(
    new RegExp(
      `"${escaped}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`
    )
  );

  if (!match) {
    return "";
  }

  try {
    return JSON.parse(`"${match[1]}"`);
  } catch (_) {
    return match[1]
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
}

function jsonAfter(body, marker) {
  const variants = [
    String(body || ""),
    decodeText(body),
  ];

  for (
    let variant = 0;
    variant < variants.length;
    variant += 1
  ) {
    const text = variants[variant];
    const markerIndex = text.indexOf(marker);

    if (markerIndex < 0) {
      continue;
    }

    let start = markerIndex + marker.length;

    while (
      start < text.length &&
      text[start] !== "{" &&
      text[start] !== "["
    ) {
      start += 1;

      if (start - markerIndex > 200) {
        break;
      }
    }

    if (
      start >= text.length ||
      start - markerIndex > 200
    ) {
      continue;
    }

    const open = text[start];
    const close = open === "{" ? "}" : "]";
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (
      let index = start;
      index < text.length;
      index += 1
    ) {
      const character = text[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (character === "\\") {
          escaped = true;
        } else if (character === '"') {
          inString = false;
        }

        continue;
      }

      if (character === '"') {
        inString = true;
      } else if (character === open) {
        depth += 1;
      } else if (character === close) {
        depth -= 1;

        if (depth === 0) {
          try {
            return JSON.parse(
              text.slice(start, index + 1)
            );
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
  let children = [
    "__PAGE__",
    {},
    null,
    null,
  ];

  for (
    let index = parts.length - 1;
    index >= 0;
    index -= 1
  ) {
    children = [
      parts[index],
      { children },
      null,
      null,
      true,
    ];
  }

  children = [
    "(app)",
    { children },
    null,
    null,
    true,
  ];

  return encodeURIComponent(
    JSON.stringify([
      "",
      { children },
      null,
      null,
      true,
    ])
  );
}

function request(method, options) {
  return new Promise((resolve, reject) => {
    const send =
      $httpClient[String(method).toLowerCase()];

    if (typeof send !== "function") {
      reject(
        new Error(
          `Loon 不支持 HTTP ${method}`
        )
      );
      return;
    }

    send(
      options,
      (error, response, data) => {
        if (error) {
          reject(new Error(String(error)));
          return;
        }

        const rawStatus =
          response &&
          (response.status ||
            response.statusCode)
            ? response.status ||
              response.statusCode
            : 0;

        resolve({
          status:
            Number(rawStatus) ||
            parseInt(
              String(rawStatus),
              10
            ) ||
            0,
          headers:
            (response &&
              response.headers) ||
            {},
          body:
            data === undefined ||
            data === null
              ? ""
              : String(data),
        });
      }
    );
  });
}

function isChallenge(status, body) {
  const text = String(
    body || ""
  ).toLowerCase();

  return (
    status === 503 ||
    text.includes(
      "正在检测浏览器安全能力"
    ) ||
    text.includes("just a moment") ||
    text.includes(
      "checking your browser"
    ) ||
    text.includes(
      "/cdn-cgi/challenge-platform"
    ) ||
    text.includes("cf-chl-") ||
    text.includes("challenge-form")
  );
}

function documentHeaders(
  ua,
  jar,
  referer
) {
  const headers = {
    Accept:
      "text/html,application/xhtml+xml," +
      "application/xml;q=0.9," +
      "image/avif,image/webp," +
      "image/apng,*/*;q=0.8",
    "Accept-Language":
      "zh-CN,zh;q=0.9,en;q=0.7",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": ua,
  };

  if (jar.header()) {
    headers.Cookie = jar.header();
  }

  if (referer) {
    headers.Referer = referer;
  }

  return headers;
}

function saveSession(jar) {
  if (jar.header()) {
    $persistentStore.write(
      jar.header(),
      KEY.cookie
    );
  }
}

async function renewToken(
  jar,
  ua,
  label
) {
  const removed =
    jar.has("hdh_sa_token");

  jar.remove("hdh_sa_token");

  const response = await request(
    "get",
    {
      url:
        `${HOME}?_loon_refresh=` +
        Date.now(),
      timeout: 25000,
      alpn: "h2",
      "auto-cookie": false,
      "auto-redirect": false,
      headers: documentHeaders(
        ua,
        jar
      ),
    }
  );

  const changed = jar.absorb(
    response.headers
  );

  saveSession(jar);

  console.log(
    `[${NAME}] ${label}: ` +
      `HTTP ${response.status}; ` +
      `移除旧Token=${
        removed ? "是" : "否"
      }; ` +
      `Set-Cookie=[${
        changed.join(", ") || "无"
      }]; ` +
      `新Token=${
        jar.has("hdh_sa_token")
          ? "有"
          : "无"
      }`
  );

  if (
    isChallenge(
      response.status,
      response.body
    )
  ) {
    throw new Error(
      "首页触发浏览器安全检测，" +
        "Token 自动续签失败"
    );
  }

  const location = String(
    getHeader(
      response.headers,
      "location"
    ) || ""
  );

  if (
    response.status === 401 ||
    response.status === 403 ||
    /\/login(?:[/?#]|$)/i.test(
      location
    ) ||
    /请先登录|登录已失效|未登录/.test(
      response.body
    )
  ) {
    throw new Error(
      "长期登录 Cookie 已失效，" +
        "请重新登录一次 HDHive"
    );
  }

  if (!jar.has("hdh_sa_token")) {
    throw new Error(
      `首页 HTTP ${response.status}，` +
        "但没有签发新 Token"
    );
  }

  return response;
}

function validAction(value) {
  return /^[a-f0-9]{20,128}$/i.test(
    String(value || "")
  );
}

async function getAction() {
  let errorMessage = "";

  try {
    const response = await request(
      "post",
      {
        url: ACTION_API,
        timeout: 18000,
        "auto-cookie": false,
        "auto-redirect": false,
        headers: {
          Accept:
            "application/json",
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          domain: "hdhive.com",
          path: "/",
          actionName: "checkIn",
        }),
      }
    );

    if (response.status !== 200) {
      throw new Error(
        `Action 解析服务 HTTP ` +
          response.status
      );
    }

    let value = null;

    try {
      value = JSON.parse(
        response.body
      );
    } catch (_) {}

    const candidates = [
      typeof value === "string"
        ? value
        : "",
      value && value.actionId,
      value &&
        value.data &&
        value.data.actionId,
      value &&
        value.result &&
        value.result.actionId,
      (
        response.body.match(
          /"actionId"\s*:\s*"([a-f0-9]{20,128})"/i
        ) || []
      )[1],
    ];

    const action =
      candidates.find(validAction);

    if (!action) {
      throw new Error(
        "Action 解析服务未返回有效 ID"
      );
    }

    $persistentStore.write(
      String(action),
      KEY.action
    );

    return {
      id: String(action),
      source: "dynamic",
    };
  } catch (error) {
    errorMessage =
      error && error.message
        ? error.message
        : String(error);

    console.log(
      `[${NAME}] ` +
        `动态 Action 获取失败: ` +
        errorMessage
    );
  }

  const cached =
    $persistentStore.read(
      KEY.action
    ) || "";

  if (validAction(cached)) {
    console.log(
      `[${NAME}] 使用缓存的 Action ID`
    );

    return {
      id: cached,
      source: "cache",
    };
  }

  throw new Error(
    errorMessage ||
      "无法获取 checkIn Action ID"
  );
}

async function submitCheckin(
  jar,
  ua,
  action,
  gamble
) {
  const headers = {
    Accept: "text/x-component",
    "Accept-Language":
      "zh-CN,zh;q=0.9,en;q=0.7",
    "Content-Type":
      "text/plain;charset=UTF-8",
    Origin: BASE,
    Referer: HOME,
    "User-Agent": ua,
    "Next-Action": action,
    "Next-Router-State-Tree":
      CHECKIN_TREE,
    "Sec-Fetch-Site":
      "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    Cookie: jar.header(),
  };

  const response = await request(
    "post",
    {
      url: HOME,
      timeout: 30000,
      alpn: "h2",
      "auto-cookie": false,
      "auto-redirect": false,
      headers,
      body: JSON.stringify([
        Boolean(gamble),
      ]),
    }
  );

  const changed = jar.absorb(
    response.headers
  );

  saveSession(jar);

  console.log(
    `[${NAME}] 签到 POST: ` +
      `HTTP ${response.status}; ` +
      `Set-Cookie=[${
        changed.join(", ") || "无"
      }]`
  );

  return response;
}

function analyze(response) {
  const text = decodeText(
    response.body
  );
  const lower =
    text.toLowerCase();
  const message = jsonField(
    text,
    "message"
  );
  const description = jsonField(
    text,
    "description"
  );

  const detail = [
    message,
    description,
  ]
    .map(clean)
    .filter(
      (value, index, array) =>
        value &&
        array.indexOf(value) ===
          index
    )
    .join("：");

  if (
    response.status === 409 ||
    lower.includes(
      "action_token_invalid"
    ) ||
    lower.includes(
      "action token invalid"
    )
  ) {
    return {
      ok: false,
      retry: true,
      kind: "token",
      status: response.status,
      detail:
        "短期 Action Token 已失效",
    };
  }

  if (
    response.status === 404 ||
    lower.includes(
      "server action not found"
    ) ||
    lower.includes(
      "failed to find server action"
    )
  ) {
    return {
      ok: false,
      retry: true,
      kind: "action",
      status: response.status,
      detail:
        "当前 Server Action 已更新",
    };
  }

  if (
    isChallenge(
      response.status,
      text
    )
  ) {
    return {
      ok: false,
      retry: false,
      kind: "challenge",
      status: response.status,
      detail:
        "签到请求触发浏览器安全检测",
    };
  }

  if (
    /你已经签到过了|明天再来吧|今日已签到|已经签到/.test(
      text
    )
  ) {
    return {
      ok: true,
      retry: false,
      kind: "already",
      status: response.status,
      detail:
        detail ||
        "今天已经签到过了",
    };
  }

  if (
    /"success"\s*:\s*true/i.test(
      text
    ) ||
    /签到成功|签到奖励|获得.{0,20}(积分|蜂蜜)/.test(
      text
    )
  ) {
    return {
      ok: true,
      retry: false,
      kind: "success",
      status: response.status,
      detail:
        detail || "签到成功",
    };
  }

  if (
    response.status === 401 ||
    /请先登录|未登录|登录已失效|unauthorized/i.test(
      text
    )
  ) {
    return {
      ok: false,
      retry: false,
      kind: "login",
      status: response.status,
      detail:
        "登录状态已失效，" +
        "请重新登录一次 HDHive",
    };
  }

  return {
    ok: false,
    retry: false,
    kind: "unknown",
    status: response.status,
    detail:
      detail ||
      `服务返回了无法识别的结果` +
        `（HTTP ${
          response.status || "未知"
        }）`,
  };
}

function normalizeUser(value) {
  const user =
    value &&
    typeof value === "object"
      ? value
      : {};

  const meta =
    user.user_meta ||
    user.userMeta ||
    {};

  const points = [
    meta.points,
    user.points,
    user.current_points,
  ]
    .map(toNumber)
    .find(
      (item) => item !== null
    );

  const days = [
    meta.signin_days_total,
    meta.signinDaysTotal,
    user.signin_days_total,
    user.signinDaysTotal,
  ]
    .map(toNumber)
    .find(
      (item) => item !== null
    );

  return {
    id:
      user.id !== undefined &&
      user.id !== null
        ? String(user.id)
        : user.user_id !==
              undefined &&
            user.user_id !== null
        ? String(user.user_id)
        : "",
    nickname: clean(
      user.nickname ||
        user.username ||
        user.name
    ),
    points:
      points === undefined
        ? null
        : points,
    days:
      days === undefined
        ? null
        : days,
  };
}

function userFrom(body) {
  const object = jsonAfter(
    body,
    '"currentUser":'
  );

  if (object) {
    return normalizeUser(object);
  }

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

  const days = text.match(
    /"signin_days_total"\s*:\s*(\d+)/
  );

  if (
    !id &&
    !nickname &&
    !points &&
    !days
  ) {
    return null;
  }

  return {
    id: id ? id[1] : "",
    nickname: nickname
      ? clean(nickname[1])
      : "",
    points: points
      ? Number(points[1])
      : null,
    days: days
      ? Number(days[1])
      : null,
  };
}

function mergeUsers() {
  const sources =
    Array.prototype.slice
      .call(arguments)
      .filter(Boolean);

  const result = {
    id: "",
    nickname: "",
    points: null,
    days: null,
  };

  sources.forEach((user) => {
    if (!result.id && user.id) {
      result.id = String(user.id);
    }

    if (
      !result.nickname &&
      user.nickname
    ) {
      result.nickname =
        clean(user.nickname);
    }

    if (
      result.points === null &&
      user.points !== null &&
      user.points !== undefined
    ) {
      result.points =
        Number(user.points);
    }

    if (
      result.days === null &&
      user.days !== null &&
      user.days !== undefined
    ) {
      result.days =
        Number(user.days);
    }
  });

  return result;
}

async function queryAccount(
  jar,
  ua
) {
  try {
    const response = await request(
      "get",
      {
        url:
          `${BASE}/manager/account` +
          `?_loon_points=${Date.now()}`,
        timeout: 25000,
        alpn: "h2",
        "auto-cookie": false,
        "auto-redirect": false,
        headers: documentHeaders(
          ua,
          jar,
          HOME
        ),
      }
    );

    jar.absorb(response.headers);
    saveSession(jar);

    if (
      response.status !== 200 ||
      isChallenge(
        response.status,
        response.body
      )
    ) {
      return null;
    }

    return userFrom(response.body);
  } catch (error) {
    console.log(
      `[${NAME}] 账户积分查询失败: ` +
        `${
          error && error.message
            ? error.message
            : String(error)
        }`
    );

    return null;
  }
}

function normalizeRecord(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const description = clean(
    value.description ||
      value.reason ||
      value.remark ||
      value.content ||
      value.message ||
      value.title ||
      value.type
  );

  const time =
    value.created_at ||
    value.createdAt ||
    value.updated_at ||
    value.updatedAt ||
    value.time ||
    value.date ||
    value.occurred_at;

  const change = [
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
    .find(
      (item) => item !== null
    );

  if (!description && !time) {
    return null;
  }

  return {
    time: formatTime(
      time || new Date()
    ),
    change:
      change === undefined
        ? null
        : change,
    description:
      description ||
      "积分变动",
  };
}

function collectRecords(
  value,
  result,
  depth
) {
  if (
    depth > 8 ||
    value === null ||
    value === undefined
  ) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      const record =
        normalizeRecord(item);

      if (record) {
        result.push(record);
      }

      collectRecords(
        item,
        result,
        depth + 1
      );
    });

    return;
  }

  if (typeof value === "object") {
    Object.keys(value).forEach(
      (key) => {
        if (
          value[key] &&
          typeof value[key] ===
            "object"
        ) {
          collectRecords(
            value[key],
            result,
            depth + 1
          );
        }
      }
    );
  }
}

function uniqueRecords(values) {
  const seen = {};
  const result = [];

  (
    Array.isArray(values)
      ? values
      : []
  ).forEach((value) => {
    const record =
      normalizeRecord(value);

    if (!record) {
      return;
    }

    const key =
      `${record.time.slice(0, 10)}|` +
      `${record.change}|` +
      record.description;

    if (seen[key]) {
      return;
    }

    seen[key] = true;
    result.push(record);
  });

  return result.sort(
    (first, second) => {
      const a =
        Date.parse(
          first.time.replace(
            " ",
            "T"
          )
        ) || 0;

      const b =
        Date.parse(
          second.time.replace(
            " ",
            "T"
          )
        ) || 0;

      return b - a;
    }
  );
}

function parsePointLogs(body) {
  const result = [];

  [
    '"initialData":',
    '"pointsLogs":',
    '"pointLogs":',
  ].forEach((marker) => {
    const value = jsonAfter(
      body,
      marker
    );

    if (value !== null) {
      collectRecords(
        value,
        result,
        0
      );
    }
  });

  return uniqueRecords(
    result
  ).slice(0, 10);
}

async function queryPointLogs(
  jar,
  ua
) {
  try {
    const headers = {
      Accept: "text/x-component",
      "Accept-Language":
        "zh-CN,zh;q=0.9,en;q=0.7",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Referer:
        `${BASE}/manager/account`,
      RSC: "1",
      "Next-Router-State-Tree":
        POINTS_TREE,
      "User-Agent": ua,
      Cookie: jar.header(),
    };

    const response = await request(
      "get",
      {
        url:
          `${BASE}/manager/points-logs` +
          "?page=1&page_size=10" +
          "&_rsc=1" +
          `&_loon_points=${Date.now()}`,
        timeout: 25000,
        alpn: "h2",
        "auto-cookie": false,
        "auto-redirect": false,
        headers,
      }
    );

    jar.absorb(response.headers);
    saveSession(jar);

    if (
      response.status !== 200 ||
      isChallenge(
        response.status,
        response.body
      )
    ) {
      console.log(
        `[${NAME}] ` +
          "服务器积分日志不可用: " +
          `HTTP ${response.status}`
      );

      return [];
    }

    const records =
      parsePointLogs(
        response.body
      );

    console.log(
      `[${NAME}] ` +
        `积分日志解析记录=` +
        records.length
    );

    return records;
  } catch (error) {
    console.log(
      `[${NAME}] ` +
        "积分日志查询失败，" +
        "使用本地历史: " +
        `${
          error && error.message
            ? error.message
            : String(error)
        }`
    );

    return [];
  }
}

function rewardFrom(
  result,
  body,
  before,
  after
) {
  const patterns = [
    /获得\s*([+-]?\d+)\s*积分/,
    /奖励\s*([+-]?\d+)\s*积分/,
    /积分\s*([+-]\d+)/,
  ];

  for (
    let index = 0;
    index < patterns.length;
    index += 1
  ) {
    const match =
      clean(result.detail).match(
        patterns[index]
      );

    if (match) {
      return Number(match[1]);
    }
  }

  const explicit =
    String(body || "").match(
      /"(?:reward|points_earned|earned_points|points_delta)"\s*:\s*([+-]?\d+)/
    );

  if (explicit) {
    return Number(explicit[1]);
  }

  if (
    result.kind !== "already" &&
    before.points !== null &&
    after.points !== null
  ) {
    const difference =
      Number(after.points) -
      Number(before.points);

    if (
      Number.isFinite(difference) &&
      difference >= 0 &&
      difference <= 1000
    ) {
      return difference;
    }
  }

  return null;
}

function saveHistory(
  server,
  current,
  already
) {
  const stored = readJSON(
    KEY.history,
    []
  );

  let values = [];

  if (Array.isArray(server)) {
    values =
      values.concat(server);
  }

  if (
    current &&
    (!already || values.length === 0)
  ) {
    values.push(current);
  }

  if (Array.isArray(stored)) {
    values =
      values.concat(stored);
  }

  let history =
    uniqueRecords(values);

  if (history.length === 0) {
    history.push({
      time: formatTime(
        new Date()
      ),
      change: null,
      description: already
        ? "今日已签到"
        : "签到成功",
    });
  }

  writeJSON(
    KEY.history,
    history.slice(0, 30)
  );

  return history.slice(0, 3);
}

async function loadPoints(
  result,
  response,
  before,
  jar,
  ua
) {
  const saved = readJSON(
    KEY.user,
    null
  );

  let user = mergeUsers(
    userFrom(response.body),
    before,
    saved
  );

  if (
    !user.id ||
    !user.nickname ||
    user.points === null ||
    user.days === null
  ) {
    user = mergeUsers(
      await queryAccount(
        jar,
        ua
      ),
      user
    );
  }

  const oldPoints =
    $persistentStore.read(
      KEY.points
    );

  if (
    user.points === null &&
    oldPoints !== null &&
    oldPoints !== ""
  ) {
    user.points =
      toNumber(oldPoints);
  }

  const reward = rewardFrom(
    result,
    response.body,
    before,
    user
  );

  const server =
    await queryPointLogs(
      jar,
      ua
    );

  const current =
    result.kind === "success"
      ? {
          time: formatTime(
            new Date()
          ),
          change: reward,
          description:
            reward === null
              ? result.detail ||
                "签到成功"
              : `签到成功，` +
                `获得 ${reward} 积分`,
        }
      : null;

  const history = saveHistory(
    server,
    current,
    result.kind === "already"
  );

  writeJSON(
    KEY.user,
    user
  );

  if (user.points !== null) {
    $persistentStore.write(
      String(user.points),
      KEY.points
    );
  }

  const info = {
    user,
    reward,
    latest:
      history[0] || null,
    history,
    source:
      server.length
        ? "server"
        : "local",
    queriedAt:
      new Date().toISOString(),
  };

  writeJSON(
    KEY.flow,
    info
  );

  return info;
}

function render(
  result,
  mode,
  points
) {
  const status =
    result.kind === "success"
      ? "✅ 签到成功"
      : result.kind === "already"
      ? "ℹ️ 今天已经签到"
      : "❌ 签到失败";

  const lines = [
    "===HDHive===",
    "📌 签到结果",
    status,
    `签到模式：${mode}`,
  ];

  if (!points) {
    if (result.detail) {
      lines.push(result.detail);
    }
  } else {
    const user = points.user;
    const latest = points.latest;

    if (user.nickname) {
      lines.push(
        `用户昵称：${user.nickname}`
      );
    }

    if (user.id) {
      lines.push(
        `用户ID：${user.id}`
      );
    }

    if (user.points !== null) {
      lines.push(
        `当前积分：${user.points}`
      );
    }

    if (user.days !== null) {
      lines.push(
        `累计签到：${user.days} 天`
      );
    }

    if (latest) {
      lines.push(
        "",
        `最新变动：${latest.time}`
      );

      if (
        latest.change !== null
      ) {
        lines.push(
          `变动数值：${
            latest.change >= 0
              ? "+"
              : ""
          }${latest.change} 积分`
        );
      }

      lines.push(
        `内容描述：` +
          latest.description
      );
    }

    lines.push(
      "",
      "📝 积分日志："
    );

    points.history
      .slice(0, 3)
      .forEach((item) => {
        const change =
          item.change === null
            ? ""
            : `${
                item.change >= 0
                  ? "+"
                  : ""
              }${item.change} 积分 `;

        lines.push(
          `- ${item.time}：` +
            change +
            item.description
        );
      });
  }

  return {
    title: status,
    message:
      lines.slice(3).join("\n"),
    log: lines.join("\n"),
  };
}

function saveReport(
  result,
  gamble,
  attempts,
  source,
  points
) {
  const report = {
    success:
      Boolean(result.ok),
    result: result.kind,
    detail: result.detail,
    httpStatus:
      result.status || 0,
    mode: gamble
      ? "gamble"
      : "normal",
    attempts,
    actionSource:
      source || "",
    executedAt:
      new Date().toISOString(),
  };

  if (points) {
    report.user = points.user;
    report.reward =
      points.reward;
    report.latest =
      points.latest;
    report.pointsSource =
      points.source;
  }

  writeJSON(
    KEY.report,
    report
  );
}

async function main() {
  const gamble = bool(
    getArgs().gamble
  );

  const mode = gamble
    ? "赌狗签到"
    : "普通签到";

  const cookie =
    $persistentStore.read(
      KEY.cookie
    ) || "";

  const ua =
    $persistentStore.read(
      KEY.ua
    ) || DEFAULT_UA;

  if (!cookie) {
    throw new Error(
      "尚未获取登录 Cookie；" +
        "请启用插件并登录一次 " +
        "hdhive.com"
    );
  }

  const jar =
    new CookieJar(cookie);

  const firstSession =
    await renewToken(
      jar,
      ua,
      "签到前自动续签"
    );

  let before = mergeUsers(
    userFrom(
      firstSession.body
    ),
    readJSON(
      KEY.user,
      null
    )
  );

  const savedPoints =
    $persistentStore.read(
      KEY.points
    );

  if (
    before.points === null &&
    savedPoints !== null &&
    savedPoints !== ""
  ) {
    before.points =
      toNumber(savedPoints);
  }

  let result = null;
  let response = null;
  let source = "";
  let attempts = 0;

  for (
    let attempt = 1;
    attempt <= 2;
    attempt += 1
  ) {
    attempts = attempt;

    const action =
      await getAction();

    source = action.source;

    response =
      await submitCheckin(
        jar,
        ua,
        action.id,
        gamble
      );

    result =
      analyze(response);

    console.log(
      `[${NAME}] ` +
        `第 ${attempt} 次结果=` +
        `${result.kind}; ` +
        `HTTP=${result.status}; ` +
        `可重试=${
          result.retry ? "是" : "否"
        }`
    );

    if (
      result.retry &&
      attempt === 1
    ) {
      const session =
        await renewToken(
          jar,
          ua,
          "重试前自动续签"
        );

      before = mergeUsers(
        userFrom(session.body),
        before
      );

      continue;
    }

    break;
  }

  if (!result) {
    result = {
      ok: false,
      kind: "unknown",
      status: 0,
      detail:
        "签到流程没有返回结果",
    };
  }

  const points = result.ok
    ? await loadPoints(
        result,
        response,
        before,
        jar,
        ua
      )
    : null;

  saveReport(
    result,
    gamble,
    attempts,
    source,
    points
  );

  const output = render(
    result,
    mode,
    points
  );

  return {
    title: output.title,
    message: output.message,
    log: output.log,
  };
}

function captureCookie() {
  const headers =
    ($request &&
      $request.headers) ||
    {};

  const cookie = clean(
    getHeader(
      headers,
      "cookie"
    )
  );

  const ua = clean(
    getHeader(
      headers,
      "user-agent"
    )
  );

  const loggedIn =
    /(?:^|;\s*)token=/.test(
      cookie
    ) ||
    /(?:^|;\s*)refresh_token=/.test(
      cookie
    );

  if (!cookie || !loggedIn) {
    console.log(
      `[${NAME}] ` +
        "当前请求没有登录 Cookie，" +
        "跳过保存"
    );

    $done({});
    return;
  }

  $persistentStore.write(
    cookie,
    KEY.cookie
  );

  if (ua) {
    $persistentStore.write(
      ua,
      KEY.ua
    );
  }

  console.log(
    `[${NAME}] ` +
      "登录 Cookie 已保存；" +
      `字段数=${
        cookie
          .split(/;\s*/)
          .filter(Boolean)
          .length
      }`
  );

  $done({});
}

if (
  typeof $request !==
  "undefined"
) {
  captureCookie();
} else {
  main()
    .then((result) => {
      console.log(result.log);
    })
    .catch((error) => {
      const message =
        error && error.message
          ? error.message
          : String(error);

      console.log(
        `[${NAME}] 执行失败: ` +
          message
      );

      saveReport(
        {
          ok: false,
          kind: "exception",
          status: 0,
          detail: message,
        },
        bool(
          getArgs().gamble
        ),
        0,
        "",
        null
      );
    })
    .finally(() => {
      $done();
    });
}
