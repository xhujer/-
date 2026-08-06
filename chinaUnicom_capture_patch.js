// 中国联通 新版抓取补丁 v1.1
// 适配：Base64 body + loginxx域名 + isbinded端点
// token存到原版cu_accounts_v2

const STORE_KEY = "cu_accounts_v2";

// 纯JS Base64解码（不依赖CryptoJS）
function b64Decode(s) {
    try {
        s = String(s || "").replace(/-/g, "+").replace(/_/g, "/");
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var out = "", i = 0;
        while (i < s.length) {
            if (s.charAt(i) === "=") break;
            var a = chars.indexOf(s.charAt(i++));
            var bv = s.charAt(i); var b = bv === "=" ? 0 : chars.indexOf(bv); i++;
            var cv = s.charAt(i); var c = cv === "=" ? 64 : chars.indexOf(cv); i++;
            var dv = s.charAt(i); var d = dv === "=" ? 64 : chars.indexOf(dv); i++;
            out += String.fromCharCode((a << 2) | (b >> 4));
            if (c !== 64) out += String.fromCharCode(((b & 15) << 4) | (c >> 2));
            if (d !== 64) out += String.fromCharCode(((c & 3) << 6) | d);
        }
        return out;
    } catch (_) { return ""; }
}
function parseForm(s) {
    const out = {};
    String(s || "").split("&").forEach(p => {
        const i = p.indexOf("=");
        if (i >= 0) out[decodeURIComponent(p.slice(0, i))] = decodeURIComponent(p.slice(i + 1).replace(/\+/g, " "));
    });
    return out;
}
function dateTime() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function mask(s) {
    s = String(s || "");
    return s.length <= 8 ? "***" : s.slice(0, 4) + "****" + s.slice(-4);
}
function readJSON(key, fallback) {
    try { const v = $.getdata(key); return v ? JSON.parse(v) : fallback; } catch (_) { return fallback; }
}
function writeJSON(key, val) {
    $.setdata(JSON.stringify(val), key);
}

// ===== 主逻辑：http-request抓取 =====
function captureRequest() {
    const url = $request.url;
    const rawBody = String($request.body || "");
    
    if (!rawBody || rawBody.length < 10) {
        $done({});
        return;
    }

    let body = {};

    // 1. Base64解码（新版联通App v12.14+）
    const decoded = b64Decode(rawBody);
    if (decoded) {
        // 先试JSON（isbinded端点用JSON）
        try { const j = JSON.parse(decoded); if (j && typeof j === "object") body = j; } catch (_) {}
        // 再试form
        if (Object.keys(body).length === 0) body = parseForm(decoded);
        if (Object.keys(body).length) console.log("[联通补丁] Base64解码成功");
    }
    
    // 2. 回退：直接JSON
    if (Object.keys(body).length === 0) {
        try { const j = JSON.parse(rawBody); if (j && typeof j === "object") body = j; } catch (_) {}
    }
    
    // 3. 回退：form
    if (Object.keys(body).length === 0) body = parseForm(rawBody);
    
    // 4. 回退：URL decode + 再试
    if (Object.keys(body).length === 0) {
        try {
            const d2 = decodeURIComponent(rawBody);
            try { const j = JSON.parse(d2); if (j && typeof j === "object") body = j; } catch (_) {}
            if (Object.keys(body).length === 0) body = parseForm(d2);
        } catch (_) {}
    }

    // 取token：支持 snake_case(token_online) 和 camelCase(tokenOnline)
    const token = String(body.tokenOnline || body.token_online || "").trim();
    const appId = String(body.appId || body.app_id || "").trim();

    if (!token) {
        console.log("[联通补丁] 未找到token (body长度=" + rawBody.length + ", 解码后=" + Object.keys(body).length + "个字段)");
        $done({});
        return;
    }

    // 存储
    const list = readJSON(STORE_KEY, []);
    const index = list.findIndex(x => x.tokenOnline === token);
    const item = { tokenOnline: token, appId: appId, updatedAt: dateTime(), mobile: index >= 0 ? (list[index].mobile || "") : "" };
    
    if (index < 0) {
        list.push(item);
        console.log("[联通补丁] ✅ 新增账号 #" + list.length + ", Token=" + mask(token));
    } else {
        list[index] = { ...list[index], ...item };
        console.log("[联通补丁] ✅ 更新账号 #" + (index+1) + ", Token=" + mask(token));
    }
    writeJSON(STORE_KEY, list);
    
    $notification.post("🟢 联通账号抓取成功", "已保存第 " + (index < 0 ? list.length : index+1) + " 个账号", "Token: " + mask(token) + (appId ? "\nAppId: " + mask(appId) : "") + "\n\n定时任务将自动使用。");

    $done({});
}

captureRequest();