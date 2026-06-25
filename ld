==UserScript==
// @name         多账号自动化助手（通行密钥版）
// @namespace    http://tampermonkey.net/
// @version      7.2
// @description  通行密钥登录 + new→latest队列 + sessionStorage状态恢复 + 软导航 + 双模滚动 + 导航守护 + 已读记录 + 休息机制
// @author       Linux.do
// @match        https://linux.do/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linux.do
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
    'use strict';

    // ==================== 配置常量（移植原脚本 CONFIG） ====================
    const CONFIG = {
        scroll: {
            minSpeed:                    10,
            maxSpeed:                    15,
            minDistance:                 2,
            maxDistance:                 4,
            stepMultiplier:              2.5,
            fastScrollChance:            0.08,
            fastScrollMin:               80,
            fastScrollMax:               200,
            fullTopicBacktrackChance:    8,
            fullTopicSlowChance:         24,
            fullTopicSmallStepMinRatio:  0.05,
            fullTopicSmallStepMaxRatio:  0.09,
            fullTopicNormalStepMinRatio: 0.09,
            fullTopicNormalStepMaxRatio: 0.18,
            fullTopicBacktrackMinRatio:  0.02,
            fullTopicBacktrackMaxRatio:  0.05,
            fullTopicMinStep:            160,
            fullTopicNormalMinSpeed:     260,
            fullTopicNormalMaxSpeed:     520,
            fullTopicSlowMinSpeed:       520,
            fullTopicSlowMaxSpeed:       900,
            fullTopicBacktrackMinSpeed:  180,
            fullTopicBacktrackMaxSpeed:  360,
            bottomSettleChecks:          3,