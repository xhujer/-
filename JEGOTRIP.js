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

    var isFindByPageCode =
        url.indexOf('/api/assembly/v1/findByPageCode') !== -1;

    var isQueryDataSources =
        url.indexOf('/api/assembly/v1/queryDataSources') !== -1;

    if (!isFindByPageCode && !isQueryDataSources) {
        $done({});
        return;
    }

    var BLOCKED_COMPONENT_IDS = {
        816: true,
        818: true,
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

    var BLOCKED_TEXT_RULES = [
        /品宣图/i,
        /广告/i,
        /营销/i,
        /热门商品/i,
        /商品推荐/i,
        /商城(?:入口|推荐|专区)?/i,
        /优惠券/i,
        /热门权益/i,
        /我的权益/i,
        /活动推广/i,
        /活动专区/i,
        /精选推荐/i,
        /社区/i,
        /内容流/i
    ];

    var BLOCKED_LINK_RULES = [
        /\/community(?:\/|$|\?)/i,
        /\/content(?:\/|$|\?)/i,
        /\/socialcontact(?:\/|$|\?)/i,
        /\/product(?:\/|$|\?)/i,
        /\/commodity(?:\/|$|\?)/i,
        /(?:^|[\/:?&=_-])mall(?:[\/?&#=_-]|$)/i,
        /(?:^|[\/:?&=_-])shop(?:[\/?&#=_-]|$)/i,
        /(?:^|[\/:?&=_-])coupon(?:[\/?&#=_-]|$)/i,
        /(?:^|[\/:?&=_-])equity(?:[\/?&#=_-]|$)/i,
        /(?:^|[\/:?&=_-])rights?(?:[\/?&#=_-]|$)/i,
        /(?:^|[\/:?&=_-])activity(?:[\/?&#=_-]|$)/i,
        /(?:^|[\/:?&=_-])promotion(?:[\/?&#=_-]|$)/i
    ];

    var PROTECTED_RULES = [
        /\/destination(?:\/|$|\?)/i,
        /(?:^|[\/:?&=_-])destination(?:[\/?&#=_-]|$)/i,
        /(?:^|[\/:?&=_-])voip(?:[\/?&#=_-]|$)/i,
        /(?:^|[\/:?&=_-])assistant(?:[\/?&#=_-]|$)/i,
        /(?:^|[\/:?&=_-])message(?:[\/?&#=_-]|$)/i,
        /(?:^|[\/:?&=_-])notice(?:[\/?&#=_-]|$)/i,
        /(?:^|[\/:?&=_-])notification(?:[\/?&#=_-]|$)/i,
        /(?:^|[\/:?&=_-])push(?:[\/?&#=_-]|$)/i,
        /(?:^|[\/:?&=_-])user(?:[\/?&#=_-]|$)/i,
        /(?:^|[\/:?&=_-])member(?:[\/?&#=_-]|$)/i,
        /(?:^|[\/:?&=_-])login(?:[\/?&#=_-]|$)/i,
        /(?:^|[\/:?&=_-])servertime(?:[\/?&#=_-]|$)/i,
        /目的地/i,
        /电话/i,
        /消息/i,
        /通知/i,
        /用户/i,
        /会员/i,
        /登录/i
    ];

    function matchesAny(value, rules) {
        var text = String(value || '');
        for (var i = 0; i < rules.length; i++) {
            if (rules[i].test(text)) return true;
        }
        return false;
    }

    function getComponentId(component) {
        if (!component || typeof component !== 'object') return NaN;

        var value = component.id;
        if (value === undefined || value === null || value === '') {
            value = component.componentId;
        }

        return Number(value);
    }

    function collectSearchable(value, depth) {
        if (depth > 3 || value === null || value === undefined) return '';

        if (typeof value === 'string' || typeof value === 'number') {
            return String(value);
        }

        if (Array.isArray(value)) {
            return value.slice(0, 20).map(function (item) {
                return collectSearchable(item, depth + 1);
            }).join(' ');
        }

        if (typeof value === 'object') {
            var keys = [
                'name',
                'title',
                'subTitle',
                'subHeading',
                'componentName',
                'floorName',
                'pageName',
                'code',
                'type',
                'link',
                'url',
                'jumpUrl',
                'htmlLink',
                'rnLink',
                'schema',
                'scheme',
                'targetUrl'
            ];

            return keys.map(function (key) {
                return collectSearchable(value[key], depth + 1);
            }).join(' ');
        }

        return '';
    }

    function isProtected(value) {
        return matchesAny(collectSearchable(value, 0), PROTECTED_RULES);
    }

    function isBlocked(value) {
        if (!value || typeof value !== 'object') return false;
        if (isProtected(value)) return false;

        var componentId = getComponentId(value);
        if (BLOCKED_COMPONENT_IDS[componentId]) return true;

        var searchable = collectSearchable(value, 0);

        return matchesAny(searchable, BLOCKED_TEXT_RULES) ||
            matchesAny(searchable, BLOCKED_LINK_RULES);
    }

    function cleanArray(items) {
        if (!Array.isArray(items)) return items;

        var output = [];

        items.forEach(function (item) {
            if (item && typeof item === 'object' && isBlocked(item)) {
                return;
            }

            var cleaned = cleanValue(item);

            if (cleaned !== null && cleaned !== undefined) {
                output.push(cleaned);
            }
        });

        return output;
    }

    function cleanObject(object) {
        if (!object || typeof object !== 'object') return object;
        if (isBlocked(object)) return null;

        Object.keys(object).forEach(function (key) {
            var value = object[key];

            if (Array.isArray(value)) {
                object[key] = cleanArray(value);
            } else if (value && typeof value === 'object') {
                var cleaned = cleanObject(value);

                if (cleaned === null) {
                    delete object[key];
                } else {
                    object[key] = cleaned;
                }
            }
        });

        return object;
    }

    function cleanValue(value) {
        if (Array.isArray(value)) return cleanArray(value);
        if (value && typeof value === 'object') return cleanObject(value);
        return value;
    }

    try {
        var data = JSON.parse(body);
        var cleaned = cleanValue(data);

        if (cleaned === null || cleaned === undefined) {
            cleaned = data;
        }

        $done({
            body: JSON.stringify(cleaned)
        });
    } catch (error) {
        console.log('[JEGOTRIP] JSON解析失败：' + error);
        $done({});
    }
})();
