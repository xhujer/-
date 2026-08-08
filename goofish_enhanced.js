//  闲鱼去广告 JS (增强版)
//  基于 HAR v7.27.60 分析，在 树先生 原版基础上新增:
//  - 回收页信息流广告过滤
//  - 圈子主tab签到/积分过滤
//  - follow.recommend 增强处理
//  原版作者: 树先生 (2026-05-28)
//  增强: Minis (2026-08-08)

let url = $request.url;
let body = $response.body;
let obj = JSON.parse(body);

// ====== 首页下拉刷新信息流 ======
if (url.includes("/gw/mtop.taobao.idlehome.home.nextfresh")) {
  delete obj.data.widgetReturnDO;
  delete obj.data.bannerReturnDO;
  if (obj.data?.sections) {
    obj.data.sections = obj.data.sections.filter(section => {
      return !(section.data && (section.data.bizType === "AD" || section.data.bizType === "homepage" || section.data.bizType === "resell"));
    });
    // 过滤主题推荐卡片 (二手车/租房/服饰主题等)
    obj.data.sections = obj.data.sections.filter(section => {
      return !(section.data && section.data.cardTypeValue === "ThemeRec");
    });
    // 过滤带"广告"标签的商品卡片 (fishTags 中有 content=="广告" 的 tag)
    obj.data.sections = obj.data.sections.filter(section => {
      var tags = section.data && section.data.fishTags;
      if (!tags) return true;
      for (var rkey in tags) {
        var tagList = tags[rkey].tagList || [];
        for (var ti = 0; ti < tagList.length; ti++) {
          if (tagList[ti].data && tagList[ti].data.content === "广告") return false;
        }
      }
      return true;
    });
    var excludeNames = ['fish_home_yunying_card_d3', 'idlefish_seafood_market', 'fish_home_chat_room'];
    obj.data.sections = obj.data.sections.filter(function(section) {  
      return !excludeNames.includes(section.template.name);  
    });
    obj.data.sections = obj.data.sections.filter(section => {
      return (section.data && (section.data.cardTypeValue === "Item"));
    });
  }
  obj.data.homeTopList = [];
}

if (url.includes("/gw/mtop.taobao.idle.local.home")) {
  if (obj.data?.sections) {
    obj.data.sections = obj.data.sections.filter(section => {
      return !(section.data && section.data.bizType === "AD");
    });
    // 过滤带"广告"标签的商品卡片
    obj.data.sections = obj.data.sections.filter(section => {
      var tags = section.data && section.data.fishTags;
      if (!tags) return true;
      for (var rkey in tags) {
        var tagList = tags[rkey].tagList || [];
        for (var ti = 0; ti < tagList.length; ti++) {
          if (tagList[ti].data && tagList[ti].data.content === "广告") return false;
        }
      }
      return true;
    });
  }
}

if (url.includes("/gw/mtop.taobao.idle.home.whale.modulet")) {
  delete obj.data.container.sections;
}

if (url.includes("/gw/mtop.taobao.idlemtopsearch.search.shade") || url.includes("/gw/mtop.taobao.idle.user.strategy.list")) {
  delete obj.data;
}

if (url.includes("/gw/mtop.taobao.idle.user.strategy.get")) {
  delete obj.data;
}

if (url.includes("/mtop.idle.user.page.my.adapter")) {
  var indexArr = ["0", "1", "3"];
  obj.data.container.sections = obj.data.container.sections.filter(item => indexArr.includes(item.index));
  obj.data.ability = [];
  obj.data.container.sections.forEach(section => {
    if (section.index === "3") {
      var targetToolTitle = ["超级擦亮", "闲鱼小法庭", "闲鱼公约", "安全中心", "帖子中心"];
      if (section.item?.tool?.exContent) {
        var foundElements = section.item.tool.exContent.tools
          .flat()
          .filter(element => 
            element.exContent && 
            element.exContent.title && 
            targetToolTitle.includes(element.exContent.title)
          );
        section.item.tool.exContent.tools = [foundElements];
      }
    }
  });
}

if (url.includes("/mtop.taobao.idlehome.home.circle.list")) {
  obj.data.circleList = obj.data.circleList.filter(circle => circle.circleId === "1" || circle.circleId === "2");
  if (obj.data?.next?.headList) {
    obj.data.next.headList = obj.data.next.headList.filter(circle => circle.bizCode === "main" || circle.bizCode === "recycle");
  }
  obj.data.headList = obj.data.headList.filter(circle => circle.bizCode === "main" || circle.bizCode === "recycle");
}

if (url.includes("/gw/mtop.taobao.idlemtopsearch.search")) {
    if (obj.data && Array.isArray(obj.data.resultList)) {  
      obj.data.resultList = obj.data.resultList.filter(element => {  
          if (element.data && element.data.item && element.data.item.main && element.data.item.main.exContent) {  
              var isAliMaMaAD = element.data.item.main.exContent.isAliMaMaAD;  
              return !(isAliMaMaAD === true || isAliMaMaAD === "true");  
          }  
          return true;  
      }); 
      var srchExcludeNames = ["idlefish_search_card_category_select", "idlefish_search_spu_market_publish"];
      obj.data.resultList = obj.data.resultList.filter(element => {
        return !srchExcludeNames.includes(element.data.template.name);
      });
    }
    if (obj.data?.resultPrefixBar) {
      delete obj.data.resultPrefixBar;
    }
    if (obj.data?.topList) {
      obj.data.topList = [];
    }
}

if (url.includes("/mtop.taobao.idle.group.myself.banner")) {
    obj.data.bannerList = [];
}

if (url.includes("/mtop.taobao.idle.playboy.recommend")) {
    obj.data.recommends = [];
    obj.data.items = [];
    obj.data.next = false;
}

if (url.includes("/mtop.taobao.idle.item.recommend.list")) {
    obj.data.cardList = [];
}

if (url.includes("/mtop.taobao.idle.local.nearby.itemdetail.enter/1.0")) {
   obj.data.targetUrl = "";
   obj.data.trackParams.itemIds = "";
   obj.data.nearbyItemInfoList = [];
   obj.data.name = "";
   obj.data.desc = "";
   obj.data.poiName = "";
}

if (url.includes("/gw/mtop.taobao.idlemessage.session.sync/3.0")) {
    // 过滤推广会话: 25=闲鱼精选(降价提醒等), 23=热门活动/服务号(卖货助手/鱼小铺等)
    obj.data.sessions = obj.data.sessions.filter(session => {
      var stype = session.session.sessionType;
      return stype !== "25" && stype !== "23";
    });
}

if (url.includes("idle.fun.follow.feed.list")) {
    obj.data.sections = obj.data.sections.filter(session => session.cardType === 9999);
    obj.data.sections.forEach(section => {
    if (section.cardData?.subText) {
        section.cardData.subText = "";
    }
  });
}

if (url.includes("idle.fun.follow.often.visit")) {
    obj.data.sections = [];
}

if (url.includes("idle.circle.myself.banner/1.0")) {
    obj.data.bannerList = [];
}

if (url.includes("idle.circle.visited/1.0")) {
    obj.data.visitedCircleList = [];
}

if (url.includes("follow.recommend.feed.list")) {
  obj.data.needDecryptKeys = [];
  obj.data.nextPage = false;
  obj.data.fitRecommendAB = true;
}

if (url.includes("/mtop.taobao.idle.local.flow.plat.section")) {
  var keyArr = ["fish_home_activity_enter_cardV1"];
  obj.data.data.components = obj.data.data.components.filter(item => !keyArr.includes(item.key));
}

// ====== 回收页信息流 ======
if (url.includes("/mtop.idle.recycle.customer.home.page.entrance")) {
  if (obj.data?.feedsList) {
    obj.data.feedsList = obj.data.feedsList.filter(item => {
      return !item.data?.bannerList;
    });
  }
}

// ====== 圈子主tab — 过滤签到/积分引导 ======
if (url.includes("/mtop.taobao.idle.circle.main.tab")) {
  if (obj.data?.feedsList) {
    obj.data.feedsList = obj.data.feedsList.filter(item => {
      return item.cardType !== "81006";
    });
  }
}

// ====== 魔方首页(频道推荐) ======
if (url.includes("/mtop.taobao.idlehome.magic.home.page.list")) {
  if (obj.data?.feedsList) {
    obj.data.feedsList = [];
  }
  obj.data.feedsCount = "0";
}

body = JSON.stringify(obj);
$done({body});
