(function () {
    'use strict';

    var url = typeof $request !== 'undefined' && $request.url
        ? String($request.url)
        : '';

    var body = typeof $response !== 'undefined' &&
        typeof $response.body === 'string'
        ? $response.body
        : '';

    if (!body) {
        $done({});
        return;
    }

    var isHomeFloor =
        /\/api\/assembly\/v1\/findByPageCode/i.test(url);

    var isHomeComponent =
        /\/api\/assembly\/v1\/queryDataSources/i.test(url);

    if (!isHomeFloor && !isHomeComponent) {
        $done({});
        return;
    }

    try {
        var data = JSON.parse(body);

        function clearObject(obj) {
            if (!obj || typeof obj !== 'object') return;

            Object.keys(obj).forEach(function (key) {
                if (Array.isArray(obj[key])) {
                    obj[key] = [];
                } else if (obj[key] && typeof obj[key] === 'object') {
                    clearObject(obj[key]);
                }
            });
        }

        if (isHomeFloor) {
            if (data.body && typeof data.body === 'object') {

                if (Array.isArray(data.body.pageFloorVos)) {
                    data.body.pageFloorVos = [];
                }

                if (Array.isArray(data.body.subPageFloorVos)) {
                    data.body.subPageFloorVos = [];
                }

                if (Array.isArray(data.body.dataList)) {
                    data.body.dataList = [];
                }

                if (Array.isArray(data.body.list)) {
                    data.body.list = [];
                }
            }
        }

        if (isHomeComponent) {
            if (Array.isArray(data.body)) {
                data.body = [];
            } else if (data.body && typeof data.body === 'object') {
                clearObject(data.body);
            }
        }

        $done({
            body: JSON.stringify(data)
        });

    } catch (e) {
        console.log('[JEGOTRIP 首页净空] JSON错误: ' + e);
        $done({});
    }

})();
