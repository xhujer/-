def reorder($order):
  [ $order[] as $name
    | add[]
    | select(.exContent.title == $name)
  ];

.data.container.sections |= map(
  if .template.name == "my_fy25_tools" then
    .item.tool.exContent.tools |= (
      map(select(
        .exContent.title != "闲鱼币"
        and .exContent.title != "循环商店"
        and .exContent.title != "反诈宣传月"
        and .exContent.title != "小法庭"
        and .exContent.title != "闲鱼赚钱"
      ))
      | reorder(["淘宝转卖", "安全中心"])  # 你想保留并排序的按钮列表
    )
  else
    .
  end
)
