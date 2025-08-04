def reorder($order):
  map(select((.title // .exContent.title // "") as $t | $order | index($t)));

.data.container.sections |= map(
  if .template.name == "my_fy25_slider"
     or .template.name == "my_fy25_recycle"
     or .template.name == "xianyu_home_fish_my_banner_card_2023"
     or .template.name == "my_fy25_ad"
  then
    empty

  elif .template.name == "my_fy25_tools" then
    .item.tool.exContent.tools |= reorder(["淘宝转卖", "宝贝上首页", "安全中心", "我的帖子"])

  elif .template.name == "my_fy25_community" then
    .item.bottom = {}

  else
    .
  end
)
