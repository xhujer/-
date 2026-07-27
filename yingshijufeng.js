const NAME = "影视飓风";
const SCRIPT_VERSION = "1.2.3";
const STORE_KEY = "yingshijufeng_auth";
const MINI_APP_ID = "wx92782ef90ebc836d";
const DEFAULT_KDT_ID = "149536603";
const API_BASE = "https://h5.youzan.com";
const USER_VERSION = "2.226.7.101";
const DEFAULT_REFERER =
    "https://servicewechat.com/wx92782ef90ebc836d/17/page-frame.html";
const DEFAULT_UA =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) " +
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 " +
    "MicroMessenger MiniProgram";

const isRewrite = typeof $request !== "undefined";

function readAuth() {
    try {
        return JSON.parse($persistentStore.read(STORE_KEY) || "{}");
    } catch (_) {
        return {};
    }
}

function saveAuth(auth) {
    return $persistentStore.write(JSON.stringify(auth), STORE_KEY);
}

function getHeader(headers, name) {
    if (!headers) return "";
    const target = String(name).toLowerCase();
    for (const key of Object.keys(headers)) {
        if (String(key).toLowerCase() === target) {
            const value = headers[key];
            return Array.isArray(value) ? value.join("\n") : String(value || "");
        }
    }
    return "";
}

function getQuery(url, name) {
    const match = String(url || "").match(
        new RegExp("[?&]" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^&#]*)", "i")
    );
    if (!match) return "";
    try {
        return decodeURIComponent(match[1].replace(/\+/g, " "));
    } catch (_) {
        return match[1];
    }
}

function parseJson(text) {
    if (text && typeof text === "object") return text;
    try {
        return JSON.parse(String(text || ""));
    } catch (_) {
        return null;
    }
}

function pickToken(data) {
    data = data || {};
    return data.accessToken || data.access_token || "";
}

function maskPhone(phone) {
    return String(phone || "").replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2");
}

function accountName(auth) {
    const nickName = auth.nickName || "";
    const mobile = maskPhone(auth.mobile);
    return [nickName, mobile].filter(Boolean).join(" ") || "当前账号";
}

function postNotice(subtitle, content) {
    $notification.post(NAME, subtitle, String(content || ""));
}

function postCheckinResult(subtitle, content) {
    const body = String(content || "");
    console.log(
        [
            "===" + NAME + "===",
            "📌 签到结果",
            subtitle,
            body,
        ]
            .filter(Boolean)
            .join("\n")
    );
    postNotice(subtitle, body);
}

function splitSetCookie(value) {
    if (!value) return [];
    const values = Array.isArray(value) ? value : [String(value)];
    const result = [];

    for (const item of values) {
        const lines = String(item)
            .split(/\r?\n|,(?=\s*[^;,\s=]+=[^;,]*)/)
            .map((part) => part.trim())
            .filter(Boolean);
        for (const line of lines) {
            const pair = line.split(";")[0].trim();
            if (pair.includes("=")) result.push(pair);
        }
    }
    return result;
}

function mergeCookie(oldCookie, setCookie) {
    const jar = {};

    for (const pair of String(oldCookie || "").split(/;\s*/)) {
        const index = pair.indexOf("=");
        if (index > 0) jar[pair.slice(0, index)] = pair.slice(index + 1);
    }

    for (const pair of splitSetCookie(setCookie)) {
        const index = pair.indexOf("=");
        if (index > 0) jar[pair.slice(0, index)] = pair.slice(index + 1);
    }

    return Object.keys(jar)
        .map((key) => key + "=" + jar[key])
        .join("; ");
}

function parseSid(extraData) {
    const data = parseJson(extraData);
    return data && (data.sid || data.sessionId || data.session_id)
        ? String(data.sid || data.sessionId || data.session_id)
        : "";
}

function notifyCapture(oldAuth, newAuth) {
    const tokenChanged = oldAuth.accessToken !== newAuth.accessToken;
    const firstCapture = !oldAuth.accessToken;
    if (!firstCapture && !tokenChanged) return;

    const details = [
        "账号：" + accountName(newAuth),
        newAuth.cookie ? "Cookie：已保存" : "Cookie：请求中未携带",
        newAuth.sessionId ? "Session：已保存" : "Session：未检测到",
    ];
    postNotice("✅ Cookie 获取成功", details.join("\n"));
}

function captureFromRequest() {
    const url = $request.url || "";
    const headers = $request.headers || {};
    const accessToken = getQuery(url, "access_token");
    const appId = getQuery(url, "app_id");

    if (!accessToken || (appId && appId !== MINI_APP_ID)) return;

    const oldAuth = readAuth();
    const extraData = getHeader(headers, "Extra-Data") || oldAuth.extraData || "";
    const cookie = getHeader(headers, "Cookie") || oldAuth.cookie || "";
    const newAuth = {
        accessToken,
        sessionId: parseSid(extraData) || oldAuth.sessionId || "",
        kdtId: getQuery(url, "kdt_id") || oldAuth.kdtId || DEFAULT_KDT_ID,
        cookie,
        extraData,
        userAgent: getHeader(headers, "User-Agent") || oldAuth.userAgent || DEFAULT_UA,
        referer: getHeader(headers, "Referer") || oldAuth.referer || DEFAULT_REFERER,
        nickName: oldAuth.nickName || "",
        mobile: oldAuth.mobile || "",
        requestMode: oldAuth.requestMode || "",
        capturedAt: new Date().toISOString(),
    };

    if (!saveAuth(newAuth)) {
        throw new Error("登录凭据保存失败");
    }
    notifyCapture(oldAuth, newAuth);
}

function captureFromAuthorizeResponse() {
    const result = parseJson($response.body);
    if (!result || Number(result.code) !== 0 || !result.data) return;

    const data = result.data;
    const accessToken = pickToken(data);
    if (!accessToken) return;

    const oldAuth = readAuth();
    const requestHeaders = $request.headers || {};
    const responseHeaders = $response.headers || {};
    const requestCookie = getHeader(requestHeaders, "Cookie");
    const setCookie = getHeader(responseHeaders, "Set-Cookie");
    const extraData = getHeader(requestHeaders, "Extra-Data") || oldAuth.extraData || "";
    const cookie = mergeCookie(requestCookie || oldAuth.cookie || "", setCookie);

    const newAuth = {
        accessToken,
        sessionId:
            data.sessionId ||
            data.session_id ||
            parseSid(extraData) ||
            oldAuth.sessionId ||
            "",
        kdtId: String(data.kdtId || data.kdt_id || oldAuth.kdtId || DEFAULT_KDT_ID),
        cookie,
        extraData,
        userAgent:
            getHeader(requestHeaders, "User-Agent") || oldAuth.userAgent || DEFAULT_UA,
        referer:
            getHeader(requestHeaders, "Referer") || oldAuth.referer || DEFAULT_REFERER,
        nickName:
            data.nick_name || data.nickName || oldAuth.nickName || "",
        mobile: data.mobile || oldAuth.mobile || "",
        requestMode: oldAuth.requestMode || "",
        capturedAt: new Date().toISOString(),
    };

    if (!saveAuth(newAuth)) {
        throw new Error("登录凭据保存失败");
    }
    notifyCapture(oldAuth, newAuth);
}

function buildExtraData(auth) {
    const saved = parseJson(auth.extraData) || {};
    saved.sid = auth.sessionId || saved.sid || "";
    saved.version = saved.version || USER_VERSION;
    saved.clientType = saved.clientType || "weapp-miniprogram";
    saved.client = saved.client || "weapp";
    saved.bizEnv = saved.bizEnv || "wsc";
    return JSON.stringify(saved);
}

function encodeQuery(params) {
    return Object.keys(params)
        .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
        .map(
            (key) =>
                encodeURIComponent(key) + "=" + encodeURIComponent(String(params[key]))
        )
        .join("&");
}

function sanitizeHeaderValue(value) {
    return String(value || "")
        .replace(/[\r\n]+/g, " ")
        .trim();
}

function updateResponseCookie(auth, response) {
    const setCookie = getHeader(response && response.headers, "Set-Cookie");
    if (!setCookie) return;
    const cookie = mergeCookie(auth.cookie || "", setCookie);
    if (cookie && cookie !== auth.cookie) {
        auth.cookie = cookie;
        saveAuth(auth);
    }
}

function rawGet(options) {
    return new Promise((resolve, reject) => {
        $httpClient.get(options, (error, response, body) => {
            if (error || !response) {
                const transportError = new Error(
                    error ? String(error) : "HTTPClient 未返回响应"
                );
                transportError.isTransportError = true;
                reject(transportError);
                return;
            }

            resolve({ response, body });
        });
    });
}

function parseApiResult(auth, response, body) {
    updateResponseCookie(auth, response);
    const status = Number(
        (response && (response.status || response.statusCode)) || 0
    );

    if (!status) {
        const transportError = new Error("HTTPClient 返回空状态码");
        transportError.isTransportError = true;
        throw transportError;
    }

    const result = parseJson(body);
    if (status !== 200) {
        throw new Error(
            "HTTP " + status + ": " + String(body || "").slice(0, 200)
        );
    }

    if (!result) {
        throw new Error("接口返回不是有效 JSON");
    }

    if (Number(result.code) !== 0) {
        throw new Error(
            result.msg ||
                result.message ||
                "接口错误：" + JSON.stringify(result)
        );
    }

    return result.data || {};
}

async function apiGet(auth, path, params) {
    const query = encodeQuery(
        Object.assign(
            {
                app_id: MINI_APP_ID,
                kdt_id: auth.kdtId || DEFAULT_KDT_ID,
                access_token: auth.accessToken,
            },
            params || {}
        )
    );

    const fullHeaders = {
        Accept: "*/*",
        "User-Agent": sanitizeHeaderValue(auth.userAgent || DEFAULT_UA),
        Referer: sanitizeHeaderValue(auth.referer || DEFAULT_REFERER),
        "Extra-Data": buildExtraData(auth),
    };
    if (auth.cookie) {
        fullHeaders.Cookie = sanitizeHeaderValue(auth.cookie);
    }

    const liteHeaders = {
        Accept: "*/*",
        "User-Agent": DEFAULT_UA,
        Referer: DEFAULT_REFERER,
        "Extra-Data": buildExtraData(auth),
    };

    const modes = {
        full: {
            name: "完整请求",
            headers: fullHeaders,
        },
        direct: {
            name: "完整请求/DIRECT",
            headers: fullHeaders,
            node: "DIRECT",
        },
        lite: {
            name: "精简请求/DIRECT",
            headers: liteHeaders,
            node: "DIRECT",
        },
    };

    const order = [];
    for (const mode of [auth.requestMode, "full", "direct", "lite"]) {
        if (mode && modes[mode] && !order.includes(mode)) order.push(mode);
    }

    const transportErrors = [];
    for (const mode of order) {
        const config = modes[mode];
        const options = {
            url: API_BASE + path + "?" + query,
            headers: config.headers,
            timeout: 15000,
        };
        if (config.node) options.node = config.node;

        try {
            const result = await rawGet(options);
            const data = parseApiResult(auth, result.response, result.body);
            if (auth.requestMode !== mode) {
                auth.requestMode = mode;
                saveAuth(auth);
            }
            return data;
        } catch (error) {
            if (!error.isTransportError) throw error;
            transportErrors.push(config.name + "：" + String(error.message || error));
        }
    }

    throw new Error(
        "网络请求失败（v" +
            SCRIPT_VERSION +
            "）\n" +
            transportErrors.join("\n")
    );
}

function awardText(data) {
    const list = Array.isArray(data && data.list) ? data.list : [];
    return list
        .map((item) => {
            const infos = item && item.infos;
            if (Array.isArray(infos)) {
                return infos.map((info) => info && info.title).filter(Boolean).join("、");
            }
            return infos && infos.title ? infos.title : "";
        })
        .filter(Boolean)
        .join("、");
}

function isAlreadyChecked(message) {
    return /已达最大参与次数|已签到|重复签到|already/i.test(String(message || ""));
}

function isAuthError(message) {
    return /access[_ ]?token|token|登录|授权|invalid session|session/i.test(
        String(message || "")
    );
}

async function runCheckin() {
    const auth = readAuth();
    if (!auth.accessToken) {
        postCheckinResult(
            "❌ 未获取 Cookie",
            "请开启插件中的“自动获取 Cookie”，打开影视飓风小程序并进入积分或签到页面。"
        );
        return;
    }

    const debugLines = [
        "版本：" + SCRIPT_VERSION,
        "账号：" + accountName(auth),
        "凭据：" +
            [
                auth.accessToken ? "Token✓" : "Token×",
                auth.sessionId ? "Session✓" : "Session×",
                auth.cookie ? "Cookie✓" : "Cookie×",
            ].join(" "),
    ];
    const summary = [];
    let subtitle = "✅ 签到成功";

    try {
        const page = await apiGet(
            auth,
            "/wscump/checkin/show_checkin_page_v2.json"
        );
        const checkinId = page.checkinId || page.checkin_id || "";

        if (!checkinId) {
            throw new Error("未获取到 checkinId");
        }

        try {
            const result = await apiGet(
                auth,
                "/wscump/checkin/checkinV2.json",
                { checkinId }
            );
            const awards = awardText(result);
            summary.push(result.desc || "签到成功");
            if (awards) summary.push("奖励：" + awards);
        } catch (error) {
            const message = String(error.message || error);
            if (isAlreadyChecked(message)) {
                subtitle = "🎁 今日已签到";
            } else {
                throw error;
            }
        }

        try {
            const points = await apiGet(
                auth,
                "/wscump/integral/user_points.json"
            );
            const current =
                points.current_points !== undefined
                    ? points.current_points
                    : points.real_points;
            summary.push(
                "当前积分：" + (current !== undefined ? current : "未识别")
            );
        } catch (error) {
            summary.push("积分查询失败：" + String(error.message || error));
        }

        postCheckinResult(subtitle, summary.join("\n") || "任务执行完成");
    } catch (error) {
        const message = String(error.message || error);
        debugLines.push("原因：" + message);
        if (isAuthError(message)) {
            debugLines.push("请重新打开小程序进入签到页，更新 Cookie 后再试。");
        }
        postCheckinResult("❌ 签到失败", debugLines.join("\n"));
    }
}

(async () => {
    if (isRewrite) {
        if (typeof $response !== "undefined") {
            captureFromAuthorizeResponse();
        } else {
            captureFromRequest();
        }
        return;
    }

    await runCheckin();
})()
    .catch((error) => {
        const message = String(error.message || error);
        if (!isRewrite) {
            postCheckinResult("❌ 脚本异常", message);
        }
        console.log("[" + NAME + "] " + message);
    })
    .finally(() => {
        if (isRewrite) {
            $done({});
        } else {
            $done();
        }
    });
