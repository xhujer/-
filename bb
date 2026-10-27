#!name = BiliBili每日等级任务
#!desc = 登录/观看/分享/投币 + 大积分签到 + 漫画签到，全部默认执行
#!author = MartinsKing（@ClydeTime）
#!homepage = https://github.com/ClydeTime/BiliBili/tree/master
#!icon = https://raw.githubusercontent.com/ClydeTime/BiliBili/main/database/icon_Avatar.png
#!tag = B站,签到
#!type = normal
#!loon_version = 3.5.1(983)
#!date = 2026-10-27

[Argument]
qrCookie = switch,false,type=boolean,tag=扫码Cookie,desc=需要抓 cookie 时打开 抓完关掉
runTime = input,"30 7 * * *",type=string,tag=执行时间,desc=主任务执行时间 默认早上7点30分
ogvTask = switch,true,type=boolean,tag=观看剧集大积分

[Script]
cron ${runTime} then script("https://x0.at/ADds.js") with tag="B站每日等级任务", timeout=120

cron "41 7 * * *" then script("https://x0.at/ADds.js") with enable=${ogvTask}, tag="B站观看剧集大积分", timeout=15

response if ${url} ~= /^https?:\/\/app\.bilibili\.com\/x\/resource\/fingerprint/ then script("https://x0.at/ADds.js") with enable=${qrCookie}, tag="B站Cookie(扫码)", timeout=30

[MitM]
hostname = app.bilibili.com
