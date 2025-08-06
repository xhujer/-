// ==UserScript==
// @name         闲鱼屏蔽推荐模组
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  屏蔽闲鱼"发现"页的分类商品推荐卡片
// @author       You
// @match        https://2.taobao.com/*
// @match        https://market.m.taobao.com/app/idleFish-F2e/IdleFishWeexPortal/*
// @require      https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
// @grant        none
// ==/UserScript==

(function($) {
    'use strict';

    // 屏蔽目标：分类推荐卡片（如"耳机配件""手机配件"等分组）
    function hideRecommendModules() {
        // 1. 针对网页端常见的推荐卡片容器选择器（根据实际页面结构调整）
        // 示例：包含"推荐"、"配件"等关键词的卡片容器
        const selectors = [
            '.recommend-floor', // 推荐楼层容器
            '[data-floor-name*="配件"]', // 包含"配件"的楼层
            '.algorithmic-recall', // 算法推荐卡片
            '.audience-recall' // 受众召回卡片
        ];

        // 隐藏匹配的元素
        selectors.forEach(selector => {
            $(selector).hide().remove();
        });

        console.log('闲鱼推荐模组已屏蔽');
    }

    // 初始加载时执行
    hideRecommendModules();

    // 监听页面滚动/动态加载，防止推荐内容重新出现
    let lastScrollTop = 0;
    $(window).scroll(() => {
        const scrollTop = $(this).scrollTop();
        // 滚动超过一定距离或方向变化时重新检查
        if (Math.abs(scrollTop - lastScrollTop) > 300) {
            hideRecommendModules();
            lastScrollTop = scrollTop;
        }
    });

    // 监听页面动态内容加载（如AJAX更新）
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => {
            hideRecommendModules();
        });
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})(jQuery);
