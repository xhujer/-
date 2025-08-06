[Rewrite]
# 匹配闲鱼发现页推荐接口
^https?:\/\/acs\.m\.taobao\.com\/gw\/mtop\.taobao\.idlemtopsearch\.search\.discover\/.*$ url response-body ".*" ""
