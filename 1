let body = $response.body;
try {
  let json = JSON.parse(body);

  // 删除首页广告/推荐模块
  if (json && json.data) {
    if (json.data.bannerList) delete json.data.bannerList;
    if (json.data.recommend) delete json.data.recommend;
    if (json.data.columnListByRegion) delete json.data.columnListByRegion;
    if (json.data.poiList) delete json.data.poiList;
  }

  // 删除“我的”页广告
  if (json && json.data && json.data.userCenter && json.data.userCenter.ads) {
    delete json.data.userCenter.ads;
  }

  $done({ body: JSON.stringify(json) });
} catch (e) {
  // 异常回落：原样返回，避免功能受影响
  $done({ body });
}
