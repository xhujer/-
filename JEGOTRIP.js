(function () {
    'use strict';

    var url = typeof $request !== 'undefined' && $request.url
        ? $request.url
        : '';

    var isFindByPageCode =
        /\/api\/assembly\/v1\/findByPageCode(?:\?|$)/i.test(url);

    var isQueryDataSources =
        /\/api\/assembly\/v1\/queryDataSources(?:\?|$)/i.test(url);

    if (!isFindByPageCode && !isQueryDataSources) {
        $done({});
        return;
    }

    var body = typeof $response !== 'undefined' &&
        typeof $response.body === 'string'
        ? $response.body
        : '';

    if (!body) {
        $done({
            body: JSON.stringify({
                code: 0,
                success: true,
                data: []
            })
        });
        return;
    }

    try {
        var original = JSON.parse(body);

        var result = {};

        if (
            Object.prototype.hasOwnProperty.call(original, 'code')
        ) {
            result.code = original.code;
        } else {
            result.code = 0;
        }

        if (
            Object.prototype.hasOwnProperty.call(original, 'success')
        ) {
            result.success = original.success;
        } else {
            result.success = true;
        }

        if (
            Object.prototype.hasOwnProperty.call(original, 'message')
        ) {
            result.message = original.message;
        }

        if (
            Object.prototype.hasOwnProperty.call(original, 'msg')
        ) {
            result.msg = original.msg;
        }

        if (
            Object.prototype.hasOwnProperty.call(original, 'data')
        ) {
            result.data = [];
        }

        if (
            Object.prototype.hasOwnProperty.call(original, 'body')
        ) {
            result.body = [];
        }

        if (
            Object.prototype.hasOwnProperty.call(original, 'result')
        ) {
            result.result = [];
        }

        if (
            !Object.prototype.hasOwnProperty.call(result, 'data') &&
            !Object.prototype.hasOwnProperty.call(result, 'body') &&
            !Object.prototype.hasOwnProperty.call(result, 'result')
        ) {
            result.data = [];
        }

        result.total = 0;
        result.totalCount = 0;
        result.count = 0;

        $done({
            status: 200,
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Pragma': 'no-cache'
            },
            body: JSON.stringify(result)
        });
    } catch (error) {
        console.log('[JEGOTRIP] 首页响应解析失败：' + error);

        $done({
            status: 200,
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'Cache-Control': 'no-store, no-cache, must-revalidate'
            },
            body: JSON.stringify({
                code: 0,
                success: true,
                data: [],
                total: 0,
                totalCount: 0
            })
        });
    }
})();