[Rewrite]
# 匹配闲鱼发现页推荐接口
^https?:\/\/acs\.m\.taobao\.com\/gw\/mtop\.taobao\.idlemtopsearch\.search\.discover\/.*$ url response-body ".*" ""
[Rewrite]
# 屏蔽闲鱼发现页推荐接口的所有商品分组（彻底清空resultList）
^https?:\/\/acs\.m\.taobao\.com\/gw\/mtop\.taobao\.idlemtopsearch\.search\.discover\/1\.0\/.*$ url response-body "\"resultList\":\[.*?\]" "\"resultList\":[]"
