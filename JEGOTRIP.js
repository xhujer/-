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

    var isHomeApi =
        url.indexOf('/api/assembly/v1/findByPageCode') !== -1 ||
        url.indexOf('/api/assembly/v1/queryDataSources') !== -1;

    if (!isHomeApi) {
        $done({});
        return;
    }

    function clearArrays(value) {
        if (!value || typeof value !== 'object') {
            return;
        }

        Object.keys(value).forEach(function (key) {
            var item = value[key];

            if (Array.isArray(item)) {
                value[key] = [];
                return;
            }

            if (item && typeof item === 'object') {
                clearArrays(item);
            }
        });
    }

    function resetCounts(value) {
        if (!value || typeof value !== 'object') {
            return;
        }

        Object.keys(value).forEach(function (key) {
            var item = value[key];

            if (
                typeof item === 'number' &&
                /^(?:total|totalCount|totalPages|count|pageCount|pageOccupyNum)$/i.test(key)
            ) {
                value[key] = 0;
                return;
            }

            if (item && typeof item === 'object') {
                resetCounts(item);
            }
        });
    }

    try {
        var data = JSON.parse(body);

        clearArrays(data);
        resetCounts(data);

        $done({
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.log('[JEGOTRIP] JSON parse failed: ' + error);
        $done({});
    }
})();
