#!name=美团去广告
#!desc=屏蔽美团/美团外卖开屏广告、图片广告、推荐
#!author=ChatGPT
#!update=2025-08-06

[Rewrite]
^https?:\/\/wmapi\.meituan\.com\/api\/v7\/(loadInfo|openscreen|startpicture)\? reject-dict
^https?:\/\/(s3plus|flowplus)\.meituan\.net\/v\d\/\w+\/linglong\/\w+\.(gif|jpg|mp4) reject
^https?:\/\/img\.meituan\.net\/bizad\/bizad_brandCpt_\d+\.jpg reject-img
^https?:\/\/img\.meituan\.net\/goodsawardpic\/[a-f0-9]+\.png\.webp reject-img
^https?:\/\/s3plus\.meituan\.net\/ocean-blk-index\/index\/blk_conf_\d+\.json reject-dict
^https?:\/\/s3plus\.meituan\.net\/v1\/mss_\w+\/(brandcpt-vedio|waimai-alita)\/\w+\.zip$ reject-dict
^http:\/\/59\.82\.113\.10\/amdc\/mobileDispatch\?appkey=213807& reject-dict
^https?:\/\/apimobile\.meituan\.com\/group\/v1\/recommend\/unity\/recommends reject-dict

[MITM]
hostname = %APPEND% img.meituan.net, s3plus.meituan.net, flowplus.meituan.net
