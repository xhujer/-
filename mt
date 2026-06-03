#!name=美团外卖去广告
#!desc=屏蔽美团外卖开屏广告、首页Banner广告、弹窗推广、运营视频广告、底部Tab栏。
#!author=
#!icon=https://cdn.nodeimage.com/i/vFhtVkFPkjnQ6pgrSxyZPAo6wnhbULfz.png
#!category=去广告
#!openUrl=https://apps.apple.com/app/id737310995
#!tag=去广告
#!loon_version=3.2.4(787)
#!date=2025-06-03 00:00:00

[Rewrite]
# 开屏广告
^https?:\/\/mobile\.meituan\.com\/.*\/splash reject-dict

# 首页 Banner 广告位
^https?:\/\/market\.waimai\.meituan\.com\/.*\/placement\/bannerforwx response-body-json-jq '.data = []'

# 引导弹窗
^https?:\/\/market\.waimai\.meituan\.com\/.*\/vp\/magical\/welfare\/newGuidePopup response-body-json-jq '.data.showNewGuidePopup = 0'

# 运营推广弹窗
^https?:\/\/promotion\.waimai\.meituan\.com\/.*\/popup reject-dict

# 首页运营推广视频（Banner 自动播放广告视频）
^https?:\/\/msstest-corp\.sankuai\.com\/v1\/.*\/yunying-video\/ reject-img

# 首页聚合 API 中的广告插槽（shark-wm）
^https?:\/\/shark-wm\.meituan\.com\/.*\/advert reject-dict

[MitM]
hostname=market.waimai.meituan.com, promotion.waimai.meituan.com, mobile.meituan.com, msstest-corp.sankuai.com, shark-wm.meituan.com
