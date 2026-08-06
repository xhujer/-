var b = $request.body;
$notification.post("联通调试1", "body类型: " + typeof b, "长度: " + (b ? b.length : "null"));
console.log("[联通] body类型=" + typeof b + " 长度=" + (b ? b.length : "null"));
$done({});
