# 保留并排序指定工具名
def reorder($order):
  [ $order[] as $name
    | add[]
    | select(.exContent.title == $name)
  ];

# 要删除的模块模板名列表
def should_remove_template($names):
  $names | index(.template.name);

.data.container.sections |= map(
  if (["my_fy25_slider", "my_fy25_recycle", "xianyu_home_fish_my_banner_card_2023"] | index(.template.name)) then
    empty
  
  elif .template.name == "my_fy25_tools" then
    # 工具栏仅保留指定工具，若清空则整块删除
    .item.tool.exContent.tools |= reorder(["淘宝转卖", "安全中心"])
    | if (.item.tool.exContent.tools | length == 0) then empty else . end

  elif .template.name == "my_fy25_community" then
    # 清空底部按钮
    .item.bottom = {}

  else
    .
  end
)
