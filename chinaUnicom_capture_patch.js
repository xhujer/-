// 中国联通 新版抓取补丁 v1.2
// 适配：Base64 body + loginxx域名 + isbinded/onLine双端点
// 存到cu_accounts_v2，定时任务直接复用

const STORE_KEY = "cu_accounts_v2";

// 纯JS Base64解码
function b64Decode(s) {
    try {
        s = String(s || "").replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var out = "", i = 0;
        while (i < s.length) {
            if (s.charAt(i) === "=") break;
            var a = chars.indexOf(s.charAt(i++));
            if (i >= s.length) break;
            var bv = s.charAt(i); var b = bv === "=" ? 0 : chars.indexOf(bv); i++;
            if (i >= s.length) break;
            var cv = s.charAt(i); var c = cv === "=" ? 64 : chars.indexOf(cv); i++;
            if (i >= s.length) break;
            var dv = s.charAt(i); var d = dv === "=" ? 64 : chars.indexOf(dv); i++;
            out += String.fromCharCode((a << 2) | (b >> 4));
            if (c !== 64) out += String.fromCharCode(((b & 15) << 4) | (c >> 2));
            if (d !== 64) out += String.fromCharCode(((c & 3) << 6) | d);
        }
        return out;
    } catch (_) { return ""; }
}

function parseForm(s) {
    var out = {};
    String(s || "").split("&").forEach(function(p) {
        var i = p.indexOf("=");
        if (i >= 0) {
            try { out[decodeURIComponent(p.slice(0, i))] = decodeURIComponent(p.slice(i + 1).replace(/\+/g, " ")); } catch (_) {}
        }
    });
    return out;
}

function dateTime() {
    var d = new Date();
    var pad = function(n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
}

function mask(s) {
    s = String(s || "");
    return s.length <= 8 ? "***" : s.slice(0, 4) + "****" + s.slice(-4);
}

function readJSON(key, fallback) {
    try { var v = $.getdata(key); return v ? JSON.parse(v) : fallback; } catch (_) { return fallback; }
}
function writeJSON(key, val) {
    try { $.setdata(JSON.stringify(val), key); } catch (_) {}
}

// 主逻辑
(function() {
    var rawBody = String($request.body || "");
    console.log("[联通补丁] 开始抓取, body长度=" + rawBody.length);

    if (!rawBody || rawBody.length < 10) {
        console.log("[联通补丁] body太短,跳过");
        $done({});
        return;
    }

    var body = {};
    var decoded = b64Decode(rawBody);

    if (decoded && decoded.length > 10) {
        console.log("[联通补丁] Base64解码成功, 解码后长度=" + decoded.length);
        // JSON (isbinded端点)
        try { var j = JSON.parse(decoded); if (j && typeof j === "object") body = j; } catch (_) {}
        // Form (onLine端点)
        if (Object.keys(body).length === 0) body = parseForm(decoded);
    } else {
        console.log("[联通补丁] Base64解码失败或太短, 尝试明文");
        // 明文JSON
        try { var j2 = JSON.parse(rawBody); if (j2 && typeof j2 === "object") body = j2; } catch (_) {}
        // 明文Form
        if (Object.keys(body).length === 0) body = parseForm(rawBody);
    }

    console.log("[联通补丁] 解析到 " + Object.keys(body).length + " 个字段");

    var token = String(body.tokenOnline || body.token_online || "").trim();
    var appId = String(body.appId || body.app_id || "").trim();

    if (!token) {
        console.log("[联通补丁] 未找到token, 已解析字段: " + Object.keys(body).join(","));
        $done({});
        return;
    }

    console.log("[联通补丁] 找到token=" + mask(token) + " appId=" + (appId ? mask(appId) : "无"));

    var list = readJSON(STORE_KEY, []);
    var index = -1;
    for (var k = 0; k < list.length; k++) {
        if (list[k].tokenOnline === token) { index = k; break; }
    }

    var item = { tokenOnline: token, appId: appId, updatedAt: dateTime(), mobile: index >= 0 ? (list[index].mobile || "") : "" };

    if (index < 0) {
        list.push(item);
        console.log("[联通补丁] 新增账号 #" + list.length);
    } else {
        list[index] = item;
        console.log("[联通补丁] 更新账号 #" + (index+1));
    }
    writeJSON(STORE_KEY, list);

    $notification.post("🟢 联通账号抓取成功", "已保存第 " + (index < 0 ? list.length : index+1) + " 个账号", "Token: " + mask(token) + (appId ? "\nAppId: " + mask(appId) : ""));
    $done({});
})();