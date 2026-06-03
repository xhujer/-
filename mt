#!name=美团外卖去广告
#!desc=屏蔽美团外卖开屏广告、首页Banner广告、弹窗推广、运营视频广告、订单页推荐。
#!author=
#!icon=https://raw.githubusercontent.com/luestr/IconResource/main/App_icon/120px/MeituanWaimai.png
#!category=去广告
#!openUrl=https://apps.apple.com/app/id737310995
#!tag=去广告
#!loon_version=3.2.4(787)
#!date=2025-06-03 00:00:00

[Rewrite]
^https?:\/\/wmapi\.meituan\.com\/api\/v7\/(loadInfo|openscreen|startpicture)\? reject-dict
^https?:\/\/mobile\.meituan\.com\/.*\/splash reject-dict
^https?:\/\/market\.waimai\.meituan\.com\/.*\/placement\/bannerforwx response-body-json-jq '.data = []'
^https?:\/\/img\.meituan\.net\/.*\/wmbanner\/ reject-img
^https?:\/\/market\.waimai\.meituan\.com\/.*\/vp\/magical\/welfare\/newGuidePopup response-body-json-jq '.data.showNewGuidePopup = 0'
^https?:\/\/promotion\.waimai\.meituan\.com\/.*\/popup reject-dict
^https?:\/\/(s3plus|flowplus)\.meituan\.net\/v\d\/\w+\/linglong\/\w+\.(gif|jpg|mp4) reject-img
^https?:\/\/s3plus\.meituan\.net\/v1\/.*\/goku\/lucency\/.*\.mp4 reject-img
^https?:\/\/msstest-corp\.sankuai\.com\/v1\/.*\/yunying-video\/ reject-img
^https?:\/\/s3plus\.meituan\.net\/v1\/\w+\/(brandcpt-vedio|waimai-alita)\/\w+\.zip$ reject-dict
^https?:\/\/shark-wm\.meituan\.com\/.*\/advert reject-dict
^https?:\/\/apimobile\.meituan\.com\/group\/v1\/recommend\/unity\/recommends reject-dict

[MitM]
hostname=market.waimai.meituan.com, promotion.waimai.meituan.com, mobile.meituan.com, msstest-corp.sankuai.com, shark-wm.meituan.com, s3plus.meituan.net, apimobile.meituan.com, img.meituan.net, wmapi.meituan.com, flowplus.meituan.net
