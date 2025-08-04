def reorder($order):
  [ $order[] as $name
    | .[]?
    | select(.exContent.title == $name)
  ];

.data.container.sections |= map(
  if .template.name == "my_fy25_tools" and (.item.tool.exContent.tools? // null) then
    .item.tool.exContent.tools |= (
      map(select(
        (.exContent.title // "") as $t
        | ($t != "闲鱼币" and $t != "循环商店" and $t != "反诈宣传月" and $t != "小法庭" and $t != "闲鱼赚钱")
      ))
      | reorder(["淘宝转卖", "安全中心"])
    )
  else
    .
  end
)
