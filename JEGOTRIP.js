(function () {
    'use strict';

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
        859,
        860,
        861,
        862,
        863,
        864,
        865,
        866,
        867,
        894,
        900
    ]);

    var BLOCKED_NAME_RULES = [
        /品宣图/,
        /广告/,
        /营销/,
        /活动推广/,
        /活动专区/,
        /优惠券/,
        /热门商品/,
        /商品推荐/,
        /精选推荐/,
        /猜你喜欢/,
        /瀑布流/,
        /我的权益/,
        /热门权益/,
        /商城入口/,
        /商城专区/,
        /商城推荐/,
        /购物入口/,
        /限时特价/,
        /秒杀专区/
    ];

    var BLOCKED_LINK_RULES = [
        /\/commodity(?:\/|$)/i,
        /\/mall(?:\/|$)/i,
        /\/product(?:\/|$)/i,
        /\/coupon(?:\/|$)/i,
        /\/promotion(?:\/|$)/i,
        /\/campaign(?:\/|$)/i,
        /\/activity(?:\/|$)/i,
        /\/benefit(?:\/|$)/i,
        /\/rights(?:\/|$)/i,
        /commodityDetail/i,
        /productDetail/i,
        /couponCenter/i,
        /mallHome/i
    ];

    var PROTECTED_RULES = [
        /电话托管/,
        /来电/,
        /短信/,
        /语音/,
        /voip/i,
        /push/i,
        /消息通知/,
        /登录/,
        /账号/,
        /用户资料/,
        /个人资料/,
        /实名认证/,
        /会员资料/,
        /客服/,
        /帮助/,
        /设置/
    ];

    var ARRAY_KEYS = [
        'data',
        'list',
        'records',
        'items',
        'columns',
        'resourceComponents',
        'pageFloorVos',
        'subPageFloorVos',
        'children',
        'modules',
        'components'
    ];

    function toText(value) {
        return value === undefined || value === null ? '' : String(value);
    }

    function matches(value, rules) {
        var text = toText(value);
        return rules.some(function (rule) {
            return rule.test(text);
        });
    }

    function getNameText(obj) {
        if (!obj || typeof obj !== 'object') return '';

        return [
            obj.name,
            obj.title,
            obj.subTitle,
            obj.subtitle,
            obj.floorName,
            obj.componentName,
            obj.moduleName,
            obj.label,
            obj.type,
            obj.code
        ].map(toText).join(' ');
    }

    function getLinkText(obj) {
        if (!obj || typeof obj !== 'object') return '';

        return [
            obj.link,
            obj.url,
            obj.jumpUrl,
            obj.htmlLink,
            obj.rnLink,
            obj.schema,
            obj.scheme,
            obj.targetUrl
        ].map(toText).join(' ');
    }

    function getProtectedText(obj) {
        if (!obj || typeof obj !== 'object') return '';

        return [
            getNameText(obj),
            getLinkText(obj),
            obj.desc,
            obj.description
        ].map(toText).join(' ');
    }

    function getComponentId(obj) {
        if (!obj || typeof obj !== 'object') return NaN;

        var value = obj.componentId;

        if (value === undefined || value === null || value === '') {
            value = obj.id;
        }

        return Number(value);
    }

    function isProtected(obj) {
        return matches(getProtectedText(obj), PROTECTED_RULES);
    }

    function shouldRemove(obj) {
        if (!obj || typeof obj !== 'object') return false;
        if (isProtected(obj)) return false;

        if (BLOCKED_COMPONENT_IDS.has(getComponentId(obj))) {
            return true;
        }

        if (matches(getNameText(obj), BLOCKED_NAME_RULES)) {
            return true;
        }

        if (matches(getLinkText(obj), BLOCKED_LINK_RULES)) {
            return true;
        }

        return false;
    }

    function cleanArray(arr) {
        return arr
            .map(cleanValue)
            .filter(function (item) {
                return item !== null && item !== undefined;
            });
    }

    function hasArrayContainer(obj) {
        return ARRAY_KEYS.some(function (key) {
            return Array.isArray(obj[key]);
        });
    }

    function hasNonEmptyArrayContainer(obj) {
        return ARRAY_KEYS.some(function (key) {
            return Array.isArray(obj[key]) && obj[key].length > 0;
        });
    }

    function shouldDropEmptyContainer(obj) {
        if (!obj || typeof obj !== 'object') return false;
        if (isProtected(obj)) return false;
        if (!hasArrayContainer(obj) || hasNonEmptyArrayContainer(obj)) return false;

        return matches(getNameText(obj), BLOCKED_NAME_RULES) ||
            matches(getLinkText(obj), BLOCKED_LINK_RULES);
    }

    function normalizeCounts(obj) {
        var hasKnownList = ['data', 'list', 'records', 'items', 'columns'].some(function (key) {
            return Array.isArray(obj[key]);
        });

        var allKnownListsEmpty = ['data', 'list', 'records', 'items', 'columns'].every(function (key) {
            return !Array.isArray(obj[key]) || obj[key].length === 0;
        });

        if (!hasKnownList || !allKnownListsEmpty) return;

        ['total', 'totalCount', 'totalPages', 'pageOccupyNum', 'count'].forEach(function (key) {
            if (typeof obj[key] === 'number') {
                obj[key] = 0;
            }
        });
    }

    function cleanObject(obj) {
        if (shouldRemove(obj)) return null;

        Object.keys(obj).forEach(function (key) {
            var value = obj[key];

            if (Array.isArray(value)) {
                obj[key] = cleanArray(value);
            } else if (value && typeof value === 'object') {
                obj[key] = cleanObject(value);
            }
        });

        normalizeCounts(obj);

        if (shouldDropEmptyContainer(obj)) {
            return null;
        }

        return obj;
    }

    function cleanValue(value) {
        if (Array.isArray(value)) {
            return cleanArray(value);
        }

        if (value && typeof value === 'object') {
            return cleanObject(value);
        }

        return value;
    }

    try {
        var data = JSON.parse(body);
        var cleaned = cleanValue(data);

        if (cleaned === null || cleaned === undefined) {
            cleaned = {
                code: 0,
                success: true,
                body: {}
            };
        }

        $done({
            body: JSON.stringify(cleaned)
        });
    } catch (error) {
        console.log('[JEGOTRIP] JSON parse failed: ' + error);
        $done({});
    }
})();
