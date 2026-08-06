// 中国联通 抓取 v1.4 - 双模：String/Uint8Array都处理
var STORE_KEY = "cu_accounts_v2";

function mask(s) {
    s = String(s || "");
    return s.length <= 8 ? "***" : s.slice(0, 4) + "****" + s.slice(-4);
}
function now() {
    var d = new Date(), p = function(n) { return ("0" + n).slice(-2); };
    return d.getFullYear() + "-" + p(d.getMonth()+1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
}
function utf8ToStr(bytes) {
    var s = "", i = 0;
    while (i < bytes.length) {
        var c = bytes[i++];
        if (c < 128) s += String.fromCharCode(c);
        else if (c < 224) s += String.fromCharCode(((c & 31) << 6) | (bytes[i++] & 63));
        else if (c < 240) s += String.fromCharCode(((c & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63));
        else s += String.fromCharCode(((c & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63));
    }
    return s;
}

(function() {
    var raw = $request.body;
    var text = "";
    var isArr = (raw instanceof Uint8Array);

    console.log("[联通] body类型=" + (isArr ? "Uint8Array" : typeof raw));

    if (isArr) {
        text = utf8ToStr(raw);
    } else {
        text = String(raw || "");
        // 如果看起来像base64，尝试解码
        if (/^[A-Za-z0-9+/=\s]+$/.test(text) && text.length > 50) {
            console.log("[联通] 检测到base64，尝试解码");
            try {
                var b64 = text.replace(/\s/g, "");
                var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                var bytes = [], i = 0;
                while (i < b64.length) {
                    if (b64[i] === "=") break;
                    var a = chars.indexOf(b64[i++]);
                    if (i >= b64.length) break;
                    var bv = b64[i], b = bv === "=" ? 0 : chars.indexOf(bv); i++;
                    if (i >= b64.length) break;
                    var cv = b64[i], c = cv === "=" ? 64 : chars.indexOf(cv); i++;
                    if (i >= b64.length) break;
                    var dv = b64[i], d = dv === "=" ? 64 : chars.indexOf(dv); i++;
                    bytes.push((a << 2) | (b >> 4));
                    if (c !== 64) bytes.push(((b & 15) << 4) | (c >> 2));
                    if (d !== 64) bytes.push(((c & 3) << 6) | d);
                }
                text = utf8ToStr(bytes);
            } catch(e) { console.log("[联通] b64解码失败: " + e); }
        }
    }

    console.log("[联通] 解析后文本前120: " + text.substring(0, 120));

    // 提取JSON
    var body = {};
    try { body = JSON.parse(text); } catch(e) { console.log("[联通] JSON失败: " + e.message); }

    // 提取form
    if (!Object.keys(body).length && text.indexOf("=") > 0) {
        text.split("&").forEach(function(p) {
            var eq = p.indexOf("=");
            if (eq >= 0) try { body[decodeURIComponent(p.slice(0,eq))] = decodeURIComponent(p.slice(eq+1).replace(/\+/g," ")); } catch(_){}
        });
    }

    var token = String(body.tokenOnline || body.token_online || "").trim();
    var appId = String(body.appId || body.app_id || "").trim();

    console.log("[联通] token=" + (token ? mask(token) : "❌无") + " appId=" + (appId ? mask(appId) : "无"));

    if (!token) { $done({}); return; }

    var list = [];
    try { list = JSON.parse($.getdata(STORE_KEY) || "[]"); } catch(_) {}
    var idx = -1;
    for (var k = 0; k < list.length; k++) {
        if (list[k].tokenOnline === token) { idx = k; break; }
    }
    var item = { tokenOnline: token, appId: appId, updatedAt: now(), mobile: idx >= 0 ? (list[idx].mobile || "") : "" };
    if (idx < 0) list.push(item); else list[idx] = item;
    $.setdata(JSON.stringify(list), STORE_KEY);

    $notification.post("🟢 联通抓取成功", "第" + (idx < 0 ? list.length : idx+1) + "个账号", "Token: " + mask(token));
    console.log("[联通] ✅ 已保存");
    $done({});
})();
