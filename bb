#!name=BiliBili每日等级任务
#!desc=定时任务及Cookie获取
#!author= MartinsKing（@ClydeTime）
#!homepage= https://github.com/ClydeTime/BiliBili/tree/master
#!icon=https://raw.githubusercontent.com/ClydeTime/BiliBili/main/database/icon_Avatar.png
#!category= MK
# 现将获取cookie与定时任务合并为一个模块
# 使用APP获取cookie,保持B站Cookie(APP)开启,如检测到cookie变更会自动更新,解决cookie经常过期的问题(cookie仍有效不提醒更新)
# 使用扫码获取cookie,保持B站Cookie(扫码)开启,打开APP后,根据推送提示操作获取cookie,此方式cookie存活时间较长,使用后需关闭脚本,cookie失效后再次打开即可
# 用户可选择自行开启或关闭,两种获取方式不可兼用
# 大会员用户可选择开启bigPoint定时任务,以此获取观看剧集大积分,非大会员用户忽略即可
# ================ Boxjs订阅 ================
# 订阅地址：https://raw.githubusercontent.com/ClydeTime/BiliBili/main/boxjs/BiliBili.boxjs.json
# 更新时间：2025-05-15

[Argument]
扫码Cookie = switch,false,tag=[开关] 扫码Cookie,desc=是否启用此处修改
RunTime = input,"30 7 * * *",tag=自定义执行时间,desc=可手动更改脚本运行时间，默认早上7点半
APPCookie = switch,true,tag=[开关] APPCookie,desc=是否启用此处修改
bigPoint = switch,false,tag=[开关] 观看剧集大积分,desc=是否启用此处修改
bigPointWeb = switch,true,tag=[开关] 大会员积分签到(网页版),desc=每天一次,与"观看剧集大积分"无关,可独立开启
manga = switch,true,tag=[开关] 漫画签到,desc=每天一次
# 说明：积分签到 / 漫画签到 两个开关由脚本读取；未配置时默认开启。

[Script]
# BiliBili每日等级任务
cron {RunTime} script-path=https://x0.at/71mU.js, tag=B站每日等级任务, timeout=120, argument="bigPointWeb={bigPointWeb},manga={manga}"

cron "41 7 * * *" script-path=https://x0.at/71mU.js, tag=B站每日等级任务(大积分), enable={bigPoint}, timeout=15

http-response ^https?:\/\/app\.bilibili\.com\/x\/resource\/fingerprint\? script-path=https://x0.at/71mU.js, tag=B站Cookie(扫码), timeout=30, enable={扫码Cookie}

http-request ^https?:\/\/app\.bilibili\.com\/x\/resource\/fingerprint\? script-path=https://x0.at/71mU.js, tag=B站Cookie(APP), enable={APPCookie}

[MITM]
hostname = app.bilibili.com