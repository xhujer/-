var raw = $request.body;
console.log("[联通] body长度=" + raw.length);

// Base64解码
var s = raw.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
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
console.log("[联通] 解码后长度=" + out.length + " 前200=" + out.substring(0, 200));

// 尝试JSON解析
var body = {};
try { body = JSON.parse(out); } catch(e) { console.log("[联通] JSON解析失败: " + e); }

var token = body.tokenOnline || body.token_online || "";
var appId = body.appId || body.app_id || "";

console.log("[联通] token=" + (token ? token.substring(0,40)+"..." : "无"));
console.log("[联通] appId=" + (appId ? appId.substring(0,40)+"..." : "无"));

$notification.post(token ? "🟢 抓到token" : "🔴 未找到token", "token=" + (token ? token.substring(0,20)+"..." : "无"), "appId=" + appId.substring(0,20)+"...");
$done({});
