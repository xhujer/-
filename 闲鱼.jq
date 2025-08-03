.data.container.sections |= map(
  if .template.name == "my_fy25_tools" then
    empty
  elif .template.name == "my_fy25_slider" then
    empty
  elif .template.name == "my_fy25_recycle" then
    empty
  elif .template.name == "xianyu_home_fish_my_banner_card_2023" then
    empty
  elif .template.name == "my_fy25_community" then
    .item.bottom = {}
  else
    .
  end
) 
| .data.container.sections |= map(
  if has("item") and (.item | has("tool")) then
    .item.tool.exContent.tools = []
  else
    .
  end
)
