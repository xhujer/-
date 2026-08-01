(function () {
  "use strict";

  var url = typeof $request !== "undefined" && $request.url ? $request.url : "";
  var body = typeof $response !== "undefined" && typeof $response.body === "string"
    ? $response.body
    : "";
  var requestBody = typeof $request !== "undefined" && typeof $request.body === "string"
    ? $request.body
    : "";
  var isRequestPhase = typeof $response === "undefined";
  var REMOVE = {};

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function text(value) {
    return String(value == null ? "" : value).toLowerCase();
  }

  function numberValue(value) {
    if (typeof value === "number") return value;
    if (typeof value === "string" && /^-?\d+$/.test(value)) return parseInt(value, 10);
    return NaN;
  }

  function firstValue(object, keys) {
    var i;
    for (i = 0; i < keys.length; i += 1) {
      if (hasOwn(object, keys[i]) && object[keys[i]] != null) return object[keys[i]];
    }
    return "";
  }

  function includesAny(value, words) {
    var source = text(value);
    var i;
    for (i = 0; i < words.length; i += 1) {
      if (source.indexOf(text(words[i])) !== -1) return true;
    }
    return false;
  }

  function isCommunicationNode(node) {
    var floorName = firstValue(node, ["floorName", "name", "title", "componentName"]);
    var className = firstValue(node, ["className", "cellClassName", "viewClassName"]);
    var moduleType = numberValue(firstValue(node, ["moduleType", "floorModuleType"]));
    var showCommunication = firstValue(node, [
      "isShowCommunicationFloor",
      "showCommunicationFloor"
    ]);
    var action = firstValue(node, [
      "action",
      "actionUrl",
      "jumpUrl",
      "link",
      "linkUrl",
      "url",
      "scheme",
      "htmlLink",
      "rnLink"
    ]);

    return moduleType === 2 ||
      showCommunication === 1 ||
      showCommunication === true ||
      showCommunication === "1" ||
      includesAny(floorName, [
        "快捷入口",
        "境外流量",
        "境外语音",
        "当地电话卡",
        "电话/消息",
        "电话托管",
        "来电提醒",
        "短信提醒"
      ]) ||
      includesAny(className, ["communication", "voip"]) ||
      includesAny(action, [
        "native://flowhome",
        "native://call",
        "native://voip",
        "communication",
        "callhosting"
      ]);
  }

  function hasAssistantMarker(node) {
    var values = [
      firstValue(node, ["name", "title", "subTitle", "subHeading"]),
      firstValue(node, ["floorName", "componentName"]),
      firstValue(node, [
        "action",
        "actionUrl",
        "jumpUrl",
        "link",
        "linkUrl",
        "url",
        "scheme",
        "targetUrl",
        "htmlLink",
        "rnLink"
      ])
    ].join(" ");

    return includesAny(values, [
      "aiassistant",
      "ai-assistant",
      "ai助手",
      "智能助手",
      "旅行助手"
    ]);
  }

  function hasMissionMarker(node) {
    var name = [
      firstValue(node, ["name", "title", "subTitle", "subHeading"]),
      firstValue(node, ["floorName", "componentName"])
    ].join(" ");
    var action = firstValue(node, [
      "action",
      "actionUrl",
      "jumpUrl",
      "link",
      "linkUrl",
      "url",
      "scheme",
      "targetUrl",
      "htmlLink",
      "rnLink"
    ]);

    return includesAny(action, [
      "/mission/",
      "/task/",
      "signin",
      "checkin",
      "welfare"
    ]) || includesAny(name, [
      "签到任务",
      "任务中心",
      "福利中心",
      "签到有礼"
    ]);
  }

  function componentId(node) {
    var explicit = firstValue(node, ["componentId", "componentID"]);
    if (explicit !== "") return numberValue(explicit);

    if (
      hasOwn(node, "componentName") ||
      hasOwn(node, "componentType") ||
      hasOwn(node, "resourceDataCode") ||
      hasOwn(node, "componentParamVo")
    ) {
      return numberValue(node.id);
    }
    return NaN;
  }

  function shouldRemoveNode(node) {
    if (!node || typeof node !== "object" || Array.isArray(node)) return false;
    if (hasAssistantMarker(node) || hasMissionMarker(node)) return true;
    if (isCommunicationNode(node)) return false;

    var floorName = firstValue(node, ["floorName", "floorTitle"]);
    var className = text(firstValue(node, [
      "className",
      "cellClassName",
      "viewClassName"
    ]));
    var componentName = firstValue(node, ["componentName", "componentTitle"]);
    var resourceCode = text(firstValue(node, [
      "resourceDataCode",
      "resourceCode",
      "dataCode"
    ]));
    var moduleId = numberValue(firstValue(node, ["moduleId", "floorId"]));
    var currentComponentId = componentId(node);
    var moduleType = numberValue(firstValue(node, [
      "moduleType",
      "floorModuleType"
    ]));
    var floorLike = hasOwn(node, "floorName") ||
      hasOwn(node, "moduleId") ||
      hasOwn(node, "moduleType") ||
      hasOwn(node, "resourceComponents") ||
      hasOwn(node, "componentParamVo") ||
      hasOwn(node, "componentVos");
    var blockedComponentIds = {
      104: true,
      113: true,
      122: true,
      123: true,
      124: true,
      125: true,
      816: true,
      837: true,
      859: true,
      860: true,
      861: true,
      862: true,
      863: true,
      864: true,
      865: true,
      866: true,
      867: true,
      894: true,
      900: true
    };

    if (className === "tripoperatingadcell" || className === "tbrecommendedcell") {
      return true;
    }

    if (includesAny(floorName, [
      "品宣位",
      "品宣图",
      "运营位",
      "瀑布流",
      "热门商品",
      "商品推荐",
      "精选推荐",
      "优惠券",
      "活动推广",
      "活动专区",
      "商城推荐",
      "商城专区"
    ])) {
      return true;
    }

    if (
      resourceCode.indexOf("narrowpublicity010503") !== -1 ||
      resourceCode.indexOf("promotionmodel010503") !== -1 ||
      /^newhomeapptype050[1-4]$/.test(resourceCode)
    ) {
      return true;
    }

    if (moduleId === 104 || moduleId === 113 || moduleId === 122) return true;
    if (blockedComponentIds[currentComponentId]) return true;

    if (
      floorLike &&
      includesAny(componentName, [
        "广告位",
        "热门商品",
        "商品推荐",
        "精选推荐",
        "优惠券",
        "瀑布流",
        "营销",
        "活动推广",
        "商城推荐"
      ])
    ) {
      return true;
    }

    if (
      (moduleType === 1 || moduleType === 3 || moduleType === 4) &&
      floorLike &&
      (
        includesAny(componentName, ["广告", "推荐", "营销", "优惠"]) ||
        hasOwn(node, "isShowPromotion")
      )
    ) {
      return true;
    }

    return false;
  }

  function cleanTree(value, depth) {
    var i;
    var key;
    var child;
    var output;

    if (depth > 80) return value;

    if (Array.isArray(value)) {
      output = [];
      for (i = 0; i < value.length; i += 1) {
        child = cleanTree(value[i], depth + 1);
        if (child !== REMOVE) output.push(child);
      }
      return output;
    }

    if (!value || typeof value !== "object") return value;
    if (shouldRemoveNode(value)) return REMOVE;

    for (key in value) {
      if (!hasOwn(value, key)) continue;
      child = cleanTree(value[key], depth + 1);
      if (child === REMOVE) {
        delete value[key];
      } else {
        value[key] = child;
      }
    }
    return value;
  }

  function emptyPayload(kind) {
    if (kind === "activity") {
      return {
        activityList: [],
        activities: [],
        advertisementBaseVos: [],
        banners: [],
        isShow: false,
        showPopup: false,
        popNeedDisplay: false,
        total: 0
      };
    }

    return {
      items: [],
      list: [],
      rows: [],
      records: [],
      dataList: [],
      models: [],
      contents: [],
      columns: [],
      total: 0,
      totalCount: 0,
      totalPages: 0,
      hasMore: false,
      haveMore: false
    };
  }

  function neutralizeEnvelope(root, kind) {
    var payloadKeys = ["body", "data", "result", "results"];
    var i;
    var key;
    var changed = false;

    if (Array.isArray(root)) return [];
    if (!root || typeof root !== "object") return root;

    for (i = 0; i < payloadKeys.length; i += 1) {
      key = payloadKeys[i];
      if (!hasOwn(root, key)) continue;
      root[key] = Array.isArray(root[key]) ? [] : emptyPayload(kind);
      changed = true;
    }

    if (!changed) {
      root.items = [];
      root.list = [];
      root.rows = [];
      root.records = [];
      root.dataList = [];
      root.columns = [];
      root.total = 0;
      root.totalCount = 0;
      root.totalPages = 0;
      root.hasMore = false;
      root.haveMore = false;

      if (kind === "activity") {
        root.activities = [];
        root.activityList = [];
        root.advertisementBaseVos = [];
        root.banners = [];
        root.isShow = false;
        root.showPopup = false;
        root.popNeedDisplay = false;
      }
    }

    return root;
  }

  function blankDestinationValue(value, keyName, depth) {
    var key;
    var normalizedKey = text(keyName);

    if (depth > 80) return value;
    if (Array.isArray(value)) return [];
    if (value == null) return value;

    if (typeof value === "object") {
      for (key in value) {
        if (!hasOwn(value, key)) continue;
        value[key] = blankDestinationValue(value[key], key, depth + 1);
      }
      return value;
    }

    if (typeof value === "boolean") {
      if (/^(?:finished|isfinished|loadfinished|nomoredata|end|isend)$/.test(normalizedKey)) {
        return true;
      }
      if (
        /^(?:loading|isloading|showloading|hasmore|havemore|more|isshow|show|visible|display)$/.test(
          normalizedKey
        )
      ) {
        return false;
      }
      return value;
    }

    if (typeof value === "number") {
      if (
        /^(?:total|totalcount|totalpages|count|recordcount|itemcount|floorcount)$/.test(
          normalizedKey
        )
      ) {
        return 0;
      }
      return value;
    }

    if (
      typeof value === "string" &&
      /(?:title|subtitle|name|desc|description|content|text|image|img|icon|cover|photo|picture|url|link|scheme|html|address)/.test(
        normalizedKey
      )
    ) {
      return "";
    }

    return value;
  }

  function neutralizeDestination(root) {
    var payloadKeys = ["body", "data", "result", "results"];
    var changed = false;
    var i;
    var key;

    if (Array.isArray(root)) return [];
    if (!root || typeof root !== "object") return root;

    for (i = 0; i < payloadKeys.length; i += 1) {
      key = payloadKeys[i];
      if (!hasOwn(root, key)) continue;
      root[key] = blankDestinationValue(root[key], key, 0);
      changed = true;
    }

    if (!changed) {
      root = blankDestinationValue(root, "", 0);
    }

    return root;
  }

  function matches(expression) {
    return expression.test(url);
  }

  function isDestinationRequest() {
    return /destination(?:model)?|destinationpage|destpage|目的地/i.test(
      url + " " + requestBody
    );
  }

  function isAssemblyRequest() {
    return /\/api\/assembly\/v1\/(?:findByPageCode|queryExtendDataSources|queryDataSources)(?:\?|$)/i.test(
      url
    );
  }

  function isDirectDestinationRequest() {
    return /\/api\/(?:layout\/v1\/init\/destinationModel|destination\/v1\/.*)(?:\?|$)/i.test(
      url
    );
  }

  function hardBlankResponse() {
    return {
      response: {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        },
        body: "{}"
      }
    };
  }

  if (isRequestPhase) {
    if (
      isDirectDestinationRequest() ||
      (isAssemblyRequest() && isDestinationRequest())
    ) {
      $done(hardBlankResponse());
    } else {
      $done({});
    }
    return;
  }

  if (!body) {
    $done({});
    return;
  }

  try {
    var json = JSON.parse(body);
    var output = json;

    if (matches(/\/api\/assembly\/v1\/(?:findByPageCode|queryExtendDataSources|queryDataSources)(?:\?|$)/i)) {
      if (isDestinationRequest()) {
        output = neutralizeDestination(json);
      } else {
        output = cleanTree(json, 0);
        if (output === REMOVE) output = {};
      }
    } else if (matches(/\/api\/activity\/v1\/getActivityInfo(?:\?|$)/i)) {
      output = neutralizeEnvelope(json, "activity");
    } else if (matches(/\/api\/(?:layout\/v1\/init\/destinationModel|destination\/v1\/.*)(?:\?|$)/i)) {
      output = neutralizeDestination(json);
    } else if (matches(/\/api\/(?:layout\/v1\/home\/(?:publicity|operation\/space)|layout\/v1\/guessLike\/.*|service\/layout\/recommend\/v1\/(?:query|update)|community\/v1\/(?:bi\/queryPost|post\/.*)|socialcontact\/v1\/comment\/.*|content\/v1\/.*|ls\/v1\/content\/.*|ls\/v1\/opensearch\/hotsearchword.*|service\/v1\/mission\/.*|assistant\/(?:message\/recommend|alertV2))(?:\?|$)/i)) {
      output = neutralizeEnvelope(json, "list");
    }

    $done({ body: JSON.stringify(output) });
  } catch (error) {
    $done({});
  }
})();