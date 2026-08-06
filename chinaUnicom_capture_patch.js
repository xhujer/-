// 中国联通 抓取补丁 v1.3
// binary-body-mode → Uint8Array → UTF-8解码 → JSON提取token

var STORE_KEY = "cu_accounts_v2";

// Uint8Array → UTF-8 String
function utf8Decode(bytes) {
    var out = "", i = 0;
    while (i < bytes.length) {
        var c = bytes[i++];
        if (c < 128) {
            out += String.fromCharCode(c);
        } else if (c < 224) {
            out += String.fromCharCode(((c & 31) << 6) | (bytes[i++] & 63));
        } else if (c < 240) {
            out += String.fromCharCode(((c & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63));
        } else {
            out += String.fromCharCode(((c & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63));
        }
    }
    return out;
}

function mask(s) {
    s = String(s || "");
    return s.length <= 8 ? "***" : s.slice(0, 4) + "****" + s.slice(-4);
}

function dateTime() {
    var d = new Date();
    var pad = function(n) { return ("0" + n).slice(-2); };
    return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
}

(function() {
    var raw = $request.body; // Uint8Array
    console.log("[联通] body类型=" + (raw instanceof Uint8Array ? "Uint8Array" : typeof raw) + " 长度=" + raw.length);

    var text = utf8Decode(raw);
    console.log("[联通] UTF8解码后前150: " + text.substring(0, 150));

    var body = {};
    try { body = JSON.parse(text); } catch(e) {
        console.log("[联通] JSON解析失败: " + e.message);
        // 尝试form
        var parts = text.split("&");
        for (var p = 0; p < parts.length; p++) {
            var eq = parts[p].indexOf("=");
            if (eq >= 0) {
                try { body[decodeURIComponent(parts[p].slice(0,eq))] = decodeURIComponent(parts[p].slice(eq+1).replace(/\+/g," ")); } catch(_){}
            }
        }
    }

    var token = String(body.tokenOnline || body.token_online || "").trim();
    var appId = String(body.appId || body.app_id || "").trim();

    console.log("[联通] token=" + (token ? mask(token) : "无") + " appId=" + (appId ? mask(appId) : "无"));

    if (!token) {
        $done({});
        return;
    }

    // 存储
    var list = [];
    try { list = JSON.parse($.getdata(STORE_KEY) || "[]"); } catch(_) {}
    var found = -1;
    for (var k = 0; k < list.length; k++) {
        if (list[k].tokenOnline === token) { found = k; break; }
    }
    var item = { tokenOnline: token, appId: appId, updatedAt: dateTime(), mobile: found >= 0 ? (list[found].mobile || "") : "" };
    if (found < 0) { list.push(item); } else { list[found] = item; }
    $.setdata(JSON.stringify(list), STORE_KEY);

    $notification.post("🟢 联通抓取成功", "第" + (found < 0 ? list.length : found+1) + "个账号", "Token: " + mask(token));
    $done({});
})();
