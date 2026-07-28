(function () {
    'use strict';

    var url = typeof $request !== 'undefined' && $request.url
        ? String($request.url)
        : '';

    var body = typeof $response !== 'undefined' && typeof $response.body === 'string'
        ? $response.body
        : '';

    if (!body) {
        $done({});
        return;
    }

    var BLOCKED_COMPONENT_IDS = new Set([
        816,
        818,
        837,
        859, 860, 861, 862, 863, 864, 865, 866, 867,
        894,
        900
    ]);

    var BLOCKED_TEXT_RULES = [
        /广告/i,
        /品宣/,
        /推广/,
        /营销/,
        /活动/,
        /福利/,
        /优惠/,
        /优惠券/,
        /权益/,
        /礼包/,
        /商城/,
        /购物/,
        /商品/,
        /特价/,
        /限时/,
        /秒杀/,
        /爆款/,
        /热门推荐/,
        /精选推荐/,
        /猜你喜欢/,
        /瀑布流/,
        /社区/,
        /发现/,
        /内容流/,
        /攻略/,
        /游记/,
        /目的地/,
        /景点/,
        /酒店/,
        /机票/,
        /流量/,
        /数据卡/,
        /套餐/,
        /订购/,
        /充值/,
        /会员中心/
    ];

    var BLOCKED_LINK_RULES = [
        /\/commodity\//i,
        /\/community\//i,
        /\/destination\//i,
        /\/product\//i,
        /\/mall\//i,
        /\/coupon/i,
        /\/activity/i,
        /\/campaign/i,
        /\/promotion/i,
        /\/benefit/i,
        /\/rights/i,
        /\/hotel/i,
        /\/flight/i,
        /\/traffic/i,
        /\/sim/i,
        /\/data-card/i
    ];

    var PROTECTED_TEXT_RULES = [
        /电话托管/,
        /来电/,
        /短信/,
        /语音/,
        /voip/i,
        /push/i,
        /消息通知/,
        /账号/,
        /登录/,
        /用户资料/,
        /个人资料/,
        /实名认证/,
        /客服/,
        /设置/,
        /帮助/
    ];

    function text(value) {
        if (value === undefined || value === null) return '';
        return String(value);
    }

    function matchesAny(value, rules) {
        var valueText = text(value);
        return rules.some(function (rule) {
            return rule.test(valueText);
        });
    }

    function collectSearchable(obj) {
        if (!obj || typeof obj !== 'object') return '';

        var fields = [
            'name', 'title', 'subTitle', 'subtitle', 'subHeading',
            'floorName', 'componentName', 'moduleName', 'label',
            'desc', 'description', 'content', 'type', 'code',
            'link', 'url', 'jumpUrl', 'htmlLink', 'rnLink',
            'schema', 'scheme', 'targetUrl', 'iconUrl', 'imageUrl'
        ];

        return fields.map(function (key) {
            return text(obj[key]);
        }).join(' ');
    }

    function getComponentId(obj) {
        if (!obj || typeof obj !== 'object') return NaN;

        var value = obj.id;
        if (value === undefined || value === null || value === '') {
            value = obj.componentId;
        }

        return Number(value);
    }

    function isProtected(obj) {
        return matchesAny(collectSearchable(obj), PROTECTED_TEXT_RULES);
    }

    function shouldRemove(obj) {
        if (!obj || typeof obj !== 'object') return false;
        if (isProtected(obj)) return false;

        var id = getComponentId(obj);
        if (BLOCKED_COMPONENT_IDS.has(id)) return true;

        var searchable = collectSearchable(obj);
        return matchesAny(searchable, BLOCKED_TEXT_RULES) ||
            matchesAny(searchable, BLOCKED_LINK_RULES);
    }

    function isEmptyContainer(obj) {
        if (!obj || typeof obj !== 'object') return false;

        var containerKeys = [
            'data', 'list', 'records', 'items', 'columns',
            'resourceComponents', 'pageFloorVos', 'subPageFloorVos',
            'children', 'modules', 'components'
        ];

        var hasContainer = false;
        var hasContent = false;

        containerKeys.forEach(function (key) {
            if (Array.isArray(obj[key])) {
                hasContainer = true;
                if (obj[key].length > 0) hasContent = true;
            }
        });

        return hasContainer && !hasContent;
    }

    function cleanArray(arr) {
        if (!Array.isArray(arr)) return arr;

        return arr
            .map(function (item) {
                return cleanValue(item);
            })
            .filter(function (item) {
                return item !== null && item !== undefined;
            });
    }

    function cleanObject(obj) {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
        if (shouldRemove(obj)) return null;

        Object.keys(obj).forEach(function (key) {
            var value = obj[key];

            if (Array.isArray(value)) {
                obj[key] = cleanArray(value);
                return;
            }

            if (value && typeof value === 'object') {
                obj[key] = cleanObject(value);
            }
        });

        ['total', 'totalCount', 'totalPages', 'pageOccupyNum', 'count'].forEach(function (key) {
            if (key in obj) {
                var listKeys = ['data', 'list', 'records', 'items', 'columns'];
                var allEmpty = listKeys.every(function (listKey) {
                    return !Array.isArray(obj[listKey]) || obj[listKey].length === 0;
                });

                if (allEmpty && typeof obj[key] === 'number') {
                    obj[key] = 0;
                }
            }
        });

        if (isEmptyContainer(obj) && !isProtected(obj)) {
            var searchable = collectSearchable(obj);

            if (!searchable ||
                matchesAny(searchable, BLOCKED_TEXT_RULES) ||
                matchesAny(searchable, BLOCKED_LINK_RULES)) {
                return null;
            }
        }

        return obj;
    }

    function cleanValue(value) {
        if (Array.isArray(value)) return cleanArray(value);
        if (value && typeof value === 'object') return cleanObject(value);
        return value;
    }

    function clearKnownRecommendationResponse(data) {
        if (!data || typeof data !== 'object') return;

        var target = data.body && typeof data.body === 'object'
            ? data.body
            : data;

        ['dataList', 'list', 'records', 'items', 'columns'].forEach(function (key) {
            if (Array.isArray(target[key])) target[key] = [];
        });

        ['pageOccupyNum', 'totalCount', 'totalPages', 'total', 'count'].forEach(function (key) {
            if (key in target && typeof target[key] === 'number') {
                target[key] = 0;
            }
        });

        if ('recName' in target) target.recName = '';
        if ('recSubName' in target) target.recSubName = '';
    }

    try {
        var data = JSON.parse(body);

        if (
            url.indexOf('/api/destination/') !== -1 ||
            url.indexOf('/api/community/') !== -1 ||
            url.indexOf('/api/content/') !== -1 ||
            url.indexOf('/api/product/') !== -1
        ) {
            clearKnownRecommendationResponse(data);
        }

        data = cleanValue(data);

        if (data === null || data === undefined) {
            data = {
                code: 0,
                success: true,
                body: {}
            };
        }

        $done({
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.log('[无忧行深度精简] JSON 解析失败：' + error);
        $done({});
    }
})();
