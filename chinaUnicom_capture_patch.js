// 中国联通 抓包调试 - dump body内容
(function() {
    var raw = String($request.body || "");
    console.log("[联通调试] URL: " + $request.url);
    console.log("[联通调试] body长度: " + raw.length);
    console.log("[联通调试] body前200字符: " + raw.substring(0, 200));
    console.log("[联通调试] body后100字符: " + raw.substring(Math.max(0, raw.length - 100)));
    
    // Base64解码
    var s = raw.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var out = "", i = 0;
    try {
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
    } catch(e) { console.log("[联通调试] b64解码异常: " + e); }
    
    console.log("[联通调试] Base64解码后长度: " + out.length);
    console.log("[联通调试] 解码后前300字符: " + out.substring(0, 300));
    
    // 检查token_online
    if (out.indexOf("token_online") >= 0 || out.indexOf("tokenOnline") >= 0) {
        console.log("[联通调试] ✅ 解码后包含token!");
        // 提取token
        var m = out.match(/token_?online[=:"]?\s*"?([a-f0-9]{30,})/i);
        if (m) console.log("[联通调试] token值: " + m[1].substring(0, 60) + "...");
    } else {
        console.log("[联通调试] ❌ 解码后不包含token");
    }