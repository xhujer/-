#!name = BiliBili每日等级任务
#!desc = 登录/观看/分享/投币
#!icon = https://x0.at/TIqg.png
#!tag = B站,签到
#!date = 2026-10-27

[Argument]
qrCookie = switch,false,type=boolean,tag=扫码Cookie,desc=默认开启，抓完Cookie后可关闭 
runTime = input,"0 7 * * *",type=string,tag=执行时间
ogvTask = switch,true,type=boolean,tag=观看剧集大积分

[Script]
cron ${runTime} then script("https://paste.c-net.org/SoundFloozy") with tag="B站每日等级任务", timeout=120

cron "41 7 * * *" then script("https://paste.c-net.org/SoundFloozy") with enable=${ogvTask}, tag="B站观看剧集大积分", timeout=15

response if ${url} ~= /^https?:\/\/app\.bilibili\.com\/x\/resource\/fingerprint/ then script("https://paste.c-net.org/SoundFloozy") with enable=${qrCookie}, tag="B站Cookie(扫码)", timeout=30

[MitM]
hostname = app.bilibili.com