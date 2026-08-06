// 手动写入token到cu_accounts_v2，token从argument读取
var args = {};
String($argument || "").split("&").forEach(function(p) {
    var i = p.indexOf("=");
    if (i >= 0) args[decodeURIComponent(p.slice(0,i))] = decodeURIComponent(p.slice(i+1));
});

var token = (args.token || "").trim();
var appId = (args.appId || "").trim();
var mobile = (args.mobile || "").trim();

if (!token) {
    $notification.post("❌ 缺少token", "请在插件设置中填写tokenOnline", "");
    $done();
    return;
}

$.setdata(JSON.stringify([{
    tokenOnline: token,
    appId: appId,
    mobile: mobile,
    updatedAt: new Date().toISOString()
}]), "cu_accounts_v2");

$notification.post("✅ Token已写入", "账号: " + (mobile || "未填"), "定时任务可正常使用");
$done();
