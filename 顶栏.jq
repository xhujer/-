
# 删除所有频道（channelDOList）
if .data.homeTopList[0].widgets[0].widgetDO.channelDOList
then
  .data.homeTopList[0].widgets[0].widgetDO.channelDOList = []
else
  .
end
|
# 删除首页上方 widget 模块（广告组件）
del(.data.homeTopList[]? | select(.template.name | test("^idlefish_home_widget")))
|
# 删除 widgetReturnDO 字段
del(.data.widgetReturnDO)
|
# 删除首页信息流中的广告组件 + 清理冗余标签字段
.data.sections |= map(
  if .template.name | test("fish_home_(advertise_card|channel_standard_card|content_card|feeds_commodity_card|feeds_pager_banner|yunying_card)|home_fish_real_live")
  then empty
  else del(.data.fishTags.r88)
  end
)
