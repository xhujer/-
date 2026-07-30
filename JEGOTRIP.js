var url = ($request && $request.url) || "";
var source = ($response && $response.body) || "";

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function lower(value) {
  return String(value == null ? "" : value).toLowerCase();
}

function numberValue(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && /^-?\d+$/.test(value)) return parseInt(value, 10);
  return NaN;
}

function contains(value, pattern) {
  return lower(value).indexOf(lower(pattern)) !== -1;
}

function firstValue(object, keys) {
  var i;
  for (i = 0; i < keys.length; i += 1) {
    if (hasOwn(object, keys[i]) && object[keys[i]] != null) return object[keys[i]];
  }
  return "";
}

function isCommunicationNode(node) {
  var floorName = lower(firstValue(node, ["floorName", "name", "title"]));
  var className = lower(firstValue(node, ["className", "cellClassName", "viewClassName"]));
  var moduleType = numberValue(firstValue(node, ["moduleType", "floorModuleType"]));
  var showCommunication = firstValue(node, ["isShowCommunicationFloor", "showCommunicationFloor"]);
  var action = lower(firstValue(node, ["action", "actionUrl", "jumpUrl", "linkUrl", "url", "scheme"]));

  return moduleType === 2 ||
    showCommunication === 1 ||
    showCommunication === true ||
    showCommunication === "1" ||
    floorName.indexOf("快捷入口") !== -1 ||
    floorName.indexOf("境外流量") !== -1 ||
    floorName.indexOf("境外语音") !== -1 ||
    className.indexOf("communication") !== -1 ||
    action.indexOf("native://flowhome") !== -1 ||
    action.indexOf("native://call") !== -1;
}

function hasAssistantMarker(node) {
  var keys = [
    "name", "title", "subTitle", "floorName", "componentName", "action",
    "actionUrl", "jumpUrl", "linkUrl", "url", "scheme", "targetUrl"
  ];
  var i;
  var value;

  for (i = 0; i < keys.length; i += 1) {
    if (!hasOwn(node, keys[i]) || node[keys[i]] == null) continue;
    value = lower(node[keys[i]]);
    if (
      value.indexOf("aiassistant") !== -1 ||
      value.indexOf("ai-assistant") !== -1 ||
      value.indexOf("ai助手") !== -1 ||
      value.indexOf("智能助手") !== -1 ||
      value.indexOf("旅行助手") !== -1
    ) {
      return true;
    }
  }
  return false;
}

function shouldRemoveNode(node) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return false;
  if (isCommunicationNode(node)) return false;

  var floorName = lower(firstValue(node, ["floorName", "floorTitle"]));
  var className = lower(firstValue(node, ["className", "cellClassName", "viewClassName"]));
  var componentName = lower(firstValue(node, ["componentName", "componentTitle"]));
  var resourceCode = lower(firstValue(node, ["resourceDataCode", "resourceCode", "dataCode"]));
  var moduleId = numberValue(firstValue(node, ["moduleId", "floorId"]));
  var componentId = numberValue(firstValue(node, ["componentId", "componentID"]));
  var moduleType = numberValue(firstValue(node, ["moduleType", "floorModuleType"]));
  var floorLike = hasOwn(node, "floorName") ||
    hasOwn(node, "moduleId") ||
    hasOwn(node, "moduleType") ||
    hasOwn(node, "resourceComponents") ||
    hasOwn(node, "componentParamVo") ||
    hasOwn(node, "componentVos");

  if (className === "tripoperatingadcell" || className === "tbrecommendedcell") return true;
  if (floorName.indexOf("品宣位") !== -1 ||
      floorName.indexOf("运营位") !== -1 ||
      floorName.indexOf("瀑布流") !== -1) return true;
  if (resourceCode.indexOf("narrowpublicity010503") !== -1 ||
      resourceCode.indexOf("promotionmodel010503") !== -1 ||
      /^newhomeapptype050[1-4]$/.test(resourceCode)) return true;
  if (moduleId === 104 || moduleId === 113 || moduleId === 122) return true;
  if (componentId === 104 || componentId === 113 ||
      componentId === 122 || componentId === 123 ||
      componentId === 124 || componentId === 125) return true;
  if (componentName.indexOf("广告位") !== -1 && floorLike) return true;
  if ((moduleType === 1 || moduleType === 3 || moduleType === 4) &&
      floorLike &&
      (componentName.indexOf("广告") !== -1 ||
       componentName.indexOf("推荐") !== -1 ||
       hasOwn(node, "isShowPromotion"))) return true;
  if (hasAssistantMarker(node)) return true;

  return false;
}

var REMOVE = {};

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

function emptyPayloadTemplate(kind) {
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
    root[key] = Array.isArray(root[key]) ? [] : emptyPayloadTemplate(kind);
    changed = true;
  }

  if (!changed) {
    root.items = [];
    root.list = [];
    root.rows = [];
    root.records = [];
    root.total = 0;
    if (kind === "activity") {
      root.activities = [];
      root.activityList = [];
      root.advertisementBaseVos = [];
      root.isShow = false;
      root.showPopup = false;
      root.popNeedDisplay = false;
    }
  }

  return root;
}

function matches(expression) {
  return expression.test(url);
}

try {
  if (!source) {
    $done({});
  } else {
    var json = JSON.parse(source);
    var output = json;

    if (matches(/\/api\/assembly\/v1\/(?:findByPageCode|queryExtendDataSources|queryDataSources)(?:\?|$)/i)) {
      output = cleanTree(json, 0);
      if (output === REMOVE) output = {};
    } else if (matches(/\/api\/activity\/v1\/getActivityInfo(?:\?|$)/i)) {
      output = neutralizeEnvelope(json, "activity");
    } else if (matches(/\/api\/(?:layout\/v1\/home\/(?:publicity|operation\/space)|layout\/v1\/guessLike\/(?:guessLikeTab|guessLikeTabData|guessLikeCityAroundTabData)|service\/layout\/recommend\/v1\/(?:query|update)|community\/v1\/bi\/queryPost|content\/v1\/content\/list|destination\/v1\/(?:rec\/(?:guessYouLike|queryData)|recommend\/guessYouLike))(?:\?|$)/i)) {
      output = neutralizeEnvelope(json, "list");
    }

    $done({ body: JSON.stringify(output) });
  }
} catch (error) {
  $done({});
}
