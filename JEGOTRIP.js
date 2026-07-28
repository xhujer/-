(function () {
    'use strict';

    var url = typeof $request !== 'undefined' && $request.url
        ? $request.url
        : '';
    var body = typeof $response !== 'undefined' && typeof $response.body === 'string'
        ? $response.body
        : '';

    if (!body) {
        $done({});
        return;
    }

    var BLOCKED_COMPONENT_IDS = new Set([
        816, // 品宣图
        818, // 我的权益
        837, // 热门商品
        859, 860, 861, 862, 863, 864, 865, 866, 867, // 优惠券
        894, // 精选推荐瀑布流
        900  // 行程推荐中的商品
    ]);

    var BLOCKED_FLOOR_RULES = [
        /品宣图/,
        /热门商品/,
        /商品推荐/,
        /热门权益/,
        /我的权益/,
        /精选推荐/,
        /优惠券/,
        /活动推广/,
        /活动专区/,
        /商城(?:入口|推荐|专区)?/
    ];

    var BLOCKED_COMPONENT_RULES = [
        /商品/,
        /优惠券/,
        /瀑布流/,
        /广告/,
        /营销/,
        /活动推广/,
        /商城/
    ];

    // 快捷入口中保留工具类入口，移除导购、套餐和商城入口。
    var BLOCKED_SHORTCUT_RULES = [
        /特价/,
        /酒店/,
        /机票/,
        /流量/,
        /数据卡/,
        /商城/,
        /活动/,
        /优惠/,
        /权益/,
        /礼包/,
        /购物/,
        /会员/,
        /订购/,
        /套餐/
    ];

    function matchesAny(value, rules) {
        var text = String(value || '');
        return rules.some(function (rule) {
            return rule.test(text);
        });
    }

    function getComponentId(component) {
        if (!component || typeof component !== 'object') return NaN;
        var value = component.id;
        if (value === undefined || value === null || value === '') {
            value = component.componentId;
        }
        return Number(value);
    }

    function isBlockedComponent(component) {
        if (!component || typeof component !== 'object') return false;

        var id = getComponentId(component);
        if (BLOCKED_COMPONENT_IDS.has(id)) return true;

        return matchesAny(component.componentName, BLOCKED_COMPONENT_RULES);
    }

    function isBlockedFloor(floor) {
        if (!floor || typeof floor !== 'object') return false;
        return matchesAny(floor.floorName, BLOCKED_FLOOR_RULES);
    }

    function isBlockedShortcut(item) {
        if (!item || typeof item !== 'object') return false;

        var searchable = [
            item.name,
            item.title,
            item.subHeading,
            item.link,
            item.url,
            item.jumpUrl,
            item.htmlLink,
            item.rnLink
        ].join(' ');

        return matchesAny(searchable, BLOCKED_SHORTCUT_RULES);
    }

    function cleanComponent(component) {
        if (!component || typeof component !== 'object') return component;
        if (isBlockedComponent(component)) return null;

        var id = getComponentId(component);
        var name = String(component.componentName || '');

        if ((id === 817 || name.indexOf('快捷入口') !== -1) && Array.isArray(component.data)) {
            component.data = component.data.filter(function (item) {
                return !isBlockedShortcut(item);
            });

            if (component.data.length === 0) return null;
        }

        return component;
    }

    function cleanComponentList(components) {
        if (!Array.isArray(components)) return components;

        return components
            .map(cleanComponent)
            .filter(function (component) {
                return component !== null;
            });
    }

    function getFloorVersion(floor) {
        if (!floor || typeof floor !== 'object') return null;
        return floor.queryPageFloorVersionVo || floor.subPageFloorVersionVo || null;
    }

    function cleanFloor(floor) {
        if (!floor || typeof floor !== 'object') return floor;
        if (isBlockedFloor(floor)) return null;

        var version = getFloorVersion(floor);
        var beforeComponents = 0;
        var beforeSubFloors = 0;

        if (version && typeof version === 'object') {
            if (Array.isArray(version.resourceComponents)) {
                beforeComponents = version.resourceComponents.length;
                version.resourceComponents = cleanComponentList(version.resourceComponents);
            }

            if (Array.isArray(version.subPageFloorVos)) {
                beforeSubFloors += version.subPageFloorVos.length;
                version.subPageFloorVos = cleanFloorList(version.subPageFloorVos);
            }
        }

        if (Array.isArray(floor.subPageFloorVos)) {
            beforeSubFloors += floor.subPageFloorVos.length;
            floor.subPageFloorVos = cleanFloorList(floor.subPageFloorVos);
        }

        var afterComponents = version && Array.isArray(version.resourceComponents)
            ? version.resourceComponents.length
            : 0;
        var afterSubFloors = 0;

        if (version && Array.isArray(version.subPageFloorVos)) {
            afterSubFloors += version.subPageFloorVos.length;
        }
        if (Array.isArray(floor.subPageFloorVos)) {
            afterSubFloors += floor.subPageFloorVos.length;
        }

        // 原本只由推广组件/子楼层组成，清理后整层一并移除，避免留下空白。
        if ((beforeComponents > 0 || beforeSubFloors > 0) &&
            afterComponents === 0 && afterSubFloors === 0) {
            return null;
        }

        // 部分地区会返回没有任何内容的容器楼层，直接移除空白占位。
        var floorName = String(floor.floorName || '');
        if ((floorName === '行程推荐' || floorName === '金刚区') &&
            afterComponents === 0 && afterSubFloors === 0) {
            return null;
        }

        return floor;
    }

    function cleanFloorList(floors) {
        if (!Array.isArray(floors)) return floors;

        return floors
            .map(cleanFloor)
            .filter(function (floor) {
                return floor !== null;
            });
    }

    function clearRecommendationBody(responseBody) {
        if (!responseBody || typeof responseBody !== 'object') return;

        if (Array.isArray(responseBody.dataList)) responseBody.dataList = [];
        if (Array.isArray(responseBody.list)) responseBody.list = [];
        if (Array.isArray(responseBody.records)) responseBody.records = [];

        if ('pageOccupyNum' in responseBody) responseBody.pageOccupyNum = 0;
        if ('totalCount' in responseBody) responseBody.totalCount = 0;
        if ('totalPages' in responseBody) responseBody.totalPages = 0;
        if ('total' in responseBody) responseBody.total = 0;
    }

    try {
        var data = JSON.parse(body);

        if (url.indexOf('/api/assembly/v1/findByPageCode') !== -1) {
            if (data.body && typeof data.body === 'object') {
                data.body.pageFloorVos = cleanFloorList(data.body.pageFloorVos);
            }
        } else if (url.indexOf('/api/assembly/v1/queryDataSources') !== -1) {
            if (Array.isArray(data.body)) {
                data.body = cleanComponentList(data.body);
            }
        } else if (url.indexOf('/api/destination/v1/rec/queryData') !== -1) {
            clearRecommendationBody(data.body);
        } else if (url.indexOf('/api/destination/v1/rec/columnListByRegion') !== -1) {
            if (data.body && typeof data.body === 'object') {
                data.body.recName = '';
                data.body.recSubName = '';
                data.body.columns = [];
            }
        }

        $done({ body: JSON.stringify(data) });
    } catch (error) {
        console.log('[无忧行去广告（托管安全最终版）] 响应解析失败：' + error);
        $done({});
    }
})();