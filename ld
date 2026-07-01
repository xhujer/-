// ==UserScript==
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
‘use strict’;

```
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
        bottomSettleDelay:           800,
        readConfirmationChecks:      12,
        readConfirmationDelay:       1000,
        readConfirmationClearChecks: 2,
        readConfirmationNudgePixels: 6,
    },
    time: {
        browseTime: 3600000,  // 连续阅读 60 分钟后休息
        restTime:   600000,   // 休息 10 分钟
    },
    article: {
        commentLimit: 5000,   // 过滤评论数超过此值的帖子
        retryLimit:   3,
    },
};

const GUARD = {
    checkInterval:     5000,
    topicStuckTimeout: 60000,
    listStuckTimeout:  30000,
    pageLoadTimeout:   25000,
};

// ==================== 样式 ====================
const styles = `
    .tm-toast-container { position: fixed; top: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px; }
    .tm-toast { background: rgba(255,255,255,0.8); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.3); color: #333; padding: 12px 24px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); font-size: 14px; font-weight: 500; animation: tm-slide-in 0.3s ease-out forwards; min-width: 200px; text-align: center; }
    @keyframes tm-slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .tm-toast.fade-out { animation: tm-slide-out 0.3s ease-in forwards; }
    @keyframes tm-slide-out { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    #tm-status-indicator { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); color: white; padding: 10px 20px; border-radius: 20px; display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 500; box-shadow: 0 10px 30px rgba(0,0,0,0.3); pointer-events: none; animation: tm-pop-in 0.3s cubic-bezier(0.175,0.885,0.32,1.275); }
    @keyframes tm-pop-in { from { transform: translateX(-50%) translateY(-50px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
    .tm-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: tm-spin 0.8s linear infinite; }
    @keyframes tm-spin { to { transform: rotate(360deg); } }
    #tm-config-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 9998; display: flex; align-items: center; justify-content: center; animation: tm-fade-in 0.2s ease-out; }
    @keyframes tm-fade-in { from { opacity: 0; } to { opacity: 1; } }
    #tm-config { background: rgba(255,255,255,0.95); padding: 24px; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); width: 380px; max-width: 90vw; max-height: 80vh; overflow-y: auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    #tm-config h2 { margin: 0 0 20px; font-size: 20px; color: #1d1d1f; text-align: center; }
    .tm-settings-section { background: #f5f5f7; padding: 12px 15px; border-radius: 10px; margin-bottom: 12px; }
    .tm-settings-section h3 { margin: 0 0 8px; font-size: 12px; color: #86868b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .tm-settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .tm-setting-item { display: flex; align-items: center; justify-content: space-between; background: white; padding: 8px 12px; border-radius: 8px; border: 1px solid #e5e5e5; }
    .tm-setting-item label { font-size: 13px; color: #1d1d1f; }
    .tm-setting-item input[type="number"] { width: 50px; padding: 4px 6px; border: 1px solid #d2d2d7; border-radius: 6px; font-size: 13px; text-align: center; }
    .tm-btn-container { display: flex; gap: 12px; margin-top: 16px; }
    .tm-btn { flex: 1; padding: 10px; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .tm-btn-primary { background: #0071e3; color: white; }
    .tm-btn-primary:hover { background: #0077ed; }
    .tm-btn-secondary { background: #e8e8ed; color: #1d1d1f; }
    .tm-btn-secondary:hover { background: #d2d2d7; }
    .tm-hint { font-size: 12px; color: #86868b; text-align: center; margin-top: 10px; line-height: 1.6; }
`;
const styleEl = document.createElement('style');
styleEl.textContent = styles;
document.head.appendChild(styleEl);
const toastContainer = document.createElement('div');
toastContainer.className = 'tm-toast-container';
document.body.appendChild(toastContainer);

// ==================== 默认配置 ====================
const DEFAULT_SETTINGS = {
    accountCount:     3,
    topicsToRead:     5,
    dailyLikesLimit:  2,
    autoRead:         true,
    autoLike:         true,
    fullRead:         false,
    betweenPostDelay: 2000,
    queueFetchPages:  3,
    randomOrder:      true,
};

GM_registerMenuCommand('⚙️ 配置', openConfig);
GM_registerMenuCommand('▶️ 启动 / 停止', toggleScript);
GM_registerMenuCommand('🔄 重置账号进度', resetAccountProgress);

// ==================== 工具函数 ====================
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function randomDelay(min, max) { return sleep(randInt(min, max)); }

// sessionStorage：运行状态（刷新恢复，窗口独立）
function ssGet(key, def = null) {
    try { const v = sessionStorage.getItem(key); return v !== null ? JSON.parse(v) : def; } catch { return def; }
}
function ssSet(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error('ssSet:', e); }
}

// GM：账号进度、配置、已读记录（跨页面持久化），全部立即写不 debounce
function gmGet(key, def) { return GM_getValue(key, def); }
function gmSet(key, value) { GM_setValue(key, value); }

function isNearBottom() {
    return (document.documentElement.scrollTop + window.innerHeight) >= (document.body.scrollHeight - 200);
}
function isPageLoaded() {
    return document.querySelectorAll('.loading-container, .spinner, .discourse-loading').length === 0;
}
function showMessage(msg, timeout = 3000) {
    const toast = document.createElement('div');
    toast.className = 'tm-toast';
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); toast.addEventListener('animationend', () => toast.remove()); }, timeout);
}
function updateRunningStatus(text) {
    let el = document.getElementById('tm-status-indicator');
    if (!text) { if (el) el.remove(); return; }
    if (!el) {
        el = document.createElement('div');
        el.id = 'tm-status-indicator';
        el.innerHTML = '<div class="tm-spinner"></div><span id="tm-status-text"></span>';
        document.body.appendChild(el);
    }
    document.getElementById('tm-status-text').textContent = text;
}
function waitForElement(selector, callback, timeout = 8000) {
    const start = Date.now();
    const iv = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) { clearInterval(iv); callback(el); }
        else if (Date.now() - start >= timeout) {
            clearInterval(iv);
            showMessage('操作超时，脚本已停止。');
            gmSet('scriptEnabled', false);
            ssSet('autoRunning', false);
            updateRunningStatus(null);
            stopNavigationGuard();
        }
    }, 100);
}
function isLoggedIn()  { return !!document.querySelector('#toggle-current-user'); }
function isLoginPage() { return location.href.includes('/login') || !!document.querySelector('.login-form'); }
function getSettings() { return { ...DEFAULT_SETTINGS, ...gmGet('globalSettings', {}) }; }
function getCurrentAcctIdx() { return gmGet('accountIndex', 0); }
function isTopicPage() { return window.location.pathname.includes('/t/'); }
function getCurrentTopicId() {
    const m = window.location.pathname.match(/\/t\/[^/]+\/(\d+)/);
    return m ? m[1] : null;
}
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function getToday() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}

// ==================== 已读记录（移植原脚本 saveUserReadHistory / isTopicRead） ====================
async function getCurrentUsername() {
    try {
        const el = document.querySelector('.current-user .username, #current-user .username, .names .username');
        if (el) return el.textContent.trim();
        const res  = await fetch('/session/current.json', { credentials: 'include' });
        const data = await res.json();
        return data?.current_user?.username || null;
    } catch { return null; }
}

let _readTopics      = null;   // 历史已读（GM持久化）
let _readTopicsKey   = null;
let _currentRunRead  = new Set(); // 当次运行已读（内存，防止重复处理同一篇）

async function loadReadTopics() {
    const username = await getCurrentUsername();
    if (!username) { _readTopics = []; return; }
    _readTopicsKey = `readTopics_${username}`;
    _readTopics    = gmGet(_readTopicsKey, []);
    // 跨天自动清空，防止历史已读记录跳过今天的帖子
    clearReadTopicsIfNewDay();
    console.log(`[已读] 加载用户 ${username} 阅读历史：${_readTopics.length} 篇`);
}

function isTopicRead(topicId) {
    if (!_readTopics) return false;
    return _readTopics.includes(String(topicId));
}

function markTopicRead(topicId) {
    if (!_readTopics || !_readTopicsKey) return;
    const id = String(topicId);
    if (_readTopics.includes(id)) return;
    _readTopics.push(id);
    if (_readTopics.length > 1000) _readTopics = _readTopics.slice(-1000);
    gmSet(_readTopicsKey, _readTopics);

    // 今日阅读统计
    const today = getToday();
    const saved = gmGet('todayReadStats', null);
    const count = (saved?.date === today) ? (saved.count + 1) : 1;
    gmSet('todayReadStats', { date: today, count });
    console.log(`[已读] 标记帖子 ${id}，今日已读 ${count} 篇`);
}

// 已读记录只在当天有效，跨天自动清空（防止跨天跳过帖子）
function clearReadTopicsIfNewDay() {
    const lastDay = gmGet('readTopicsDay', null);
    const today   = getToday();
    if (lastDay !== today) {
        console.log('[已读] 新的一天，清空已读记录');
        if (_readTopicsKey) gmSet(_readTopicsKey, []);
        _readTopics = [];
        gmSet('readTopicsDay', today);
    }
}

// ==================== RequestManager ====================
const RequestManager = {
    _lastAt:   new Map(),
    _inFlight: new Map(),
    async run(key, fn, { minInterval = 1200, retries = 2, backoffBase = 1200, jitter = 250 } = {}) {
        if (this._inFlight.has(key)) return this._inFlight.get(key);
        const runner = (async () => {
            const wait = minInterval - (Date.now() - (this._lastAt.get(key) || 0)) + randInt(0, jitter);
            if (wait > 0) await sleep(wait);
            for (let attempt = 0; attempt <= retries; attempt++) {
                try { this._lastAt.set(key, Date.now()); return await fn(); }
                catch (e) { if (attempt >= retries) throw e; await sleep(backoffBase * Math.pow(2, attempt) + randInt(100, 600)); }
            }
            return null;
        })();
        this._inFlight.set(key, runner);
        try { return await runner; } finally { this._inFlight.delete(key); }
    }
};

// ==================== 配置界面 ====================
function openConfig() {
    if (document.getElementById('tm-config-overlay')) return;
    const s = getSettings();
    document.body.insertAdjacentHTML('beforeend', `
        <div id="tm-config-overlay">
          <div id="tm-config">
            <h2>⚙️ 运行配置</h2>
            <div class="tm-settings-section"><h3>账号设置</h3>
              <div class="tm-settings-grid">
                <div class="tm-setting-item"><label>账号总数</label><input type="number" id="tm-account-count" value="${s.accountCount}" min="1" max="20"></div>
                <div class="tm-setting-item"><label>自动阅读</label><input type="checkbox" id="tm-auto-read" ${s.autoRead ? 'checked' : ''} style="transform:scale(1.3)"></div>
                <div class="tm-setting-item"><label>自动点赞</label><input type="checkbox" id="tm-auto-like" ${s.autoLike ? 'checked' : ''} style="transform:scale(1.3)"></div>
                <div class="tm-setting-item"><label>完整阅读</label><input type="checkbox" id="tm-full-read" ${s.fullRead ? 'checked' : ''} style="transform:scale(1.3)"></div>
                <div class="tm-setting-item"><label>随机顺序</label><input type="checkbox" id="tm-random-order" ${s.randomOrder ? 'checked' : ''} style="transform:scale(1.3)"></div>
              </div>
            </div>
            <div class="tm-settings-section"><h3>任务限制</h3>
              <div class="tm-settings-grid">
                <div class="tm-setting-item"><label>每日阅读帖数</label><input type="number" id="tm-topics-count" value="${s.topicsToRead}" min="1" max="100"></div>
                <div class="tm-setting-item"><label>每日点赞上限</label><input type="number" id="tm-likes-limit" value="${s.dailyLikesLimit}" min="1" max="50"></div>
                <div class="tm-setting-item"><label>队列获取页数</label><input type="number" id="tm-queue-pages" value="${s.queueFetchPages}" min="1" max="20"></div>
              </div>
            </div>
            <div class="tm-settings-section"><h3>速度设置</h3>
              <div class="tm-settings-grid">
                <div class="tm-setting-item"><label>帖子间隔(秒)</label><input type="number" id="tm-post-interval" value="${s.betweenPostDelay / 1000}" min="1" max="30"></div>
              </div>
            </div>
            <p class="tm-hint">队列：新帖(new) → 最新(latest)<br>连续阅读60分钟自动休息10分钟</p>
            <div class="tm-btn-container">
              <button id="tm-save-config" class="tm-btn tm-btn-primary">保存</button>
              <button id="tm-close-config" class="tm-btn tm-btn-secondary">取消</button>
            </div>
          </div>
        </div>
    `);
    document.getElementById('tm-save-config').addEventListener('click', saveConfig);
    document.getElementById('tm-close-config').addEventListener('click', () => document.getElementById('tm-config-overlay').remove());
    document.getElementById('tm-config-overlay').addEventListener('click', e => { if (e.target.id === 'tm-config-overlay') e.target.remove(); });
}
function saveConfig() {
    const postSec = parseFloat(document.getElementById('tm-post-interval').value) || 2.0;
    gmSet('globalSettings', {
        accountCount:     parseInt(document.getElementById('tm-account-count').value) || 3,
        topicsToRead:     parseInt(document.getElementById('tm-topics-count').value)  || 10,
        dailyLikesLimit:  parseInt(document.getElementById('tm-likes-limit').value)   || 2,
        autoRead:         document.getElementById('tm-auto-read').checked,
        autoLike:         document.getElementById('tm-auto-like').checked,
        fullRead:         document.getElementById('tm-full-read').checked,
        randomOrder:      document.getElementById('tm-random-order').checked,
        queueFetchPages:  parseInt(document.getElementById('tm-queue-pages').value)   || 3,
        betweenPostDelay: Math.round(postSec * 1000),
    });
    showMessage('✅ 配置已保存！');
    document.getElementById('tm-config-overlay').remove();
}

// ==================== 重置 ====================
function resetAccountProgress() {
    gmSet('accountIndex', 0);
    gmSet('scriptEnabled', false);
    gmSet('shouldRunMain', false);
    ssSet('autoRunning', false);
    ssSet('topicList', []);
    ssSet('lastFetchedPage', 0);
    ssSet('accumulatedTime', 0);
    stopNavigationGuard();
    updateRunningStatus(null);
    showMessage('🔄 账号进度已重置');
}

// ==================== 通行密钥 ====================
function triggerPasskey() {
    for (const btn of document.querySelectorAll('button, .btn, [role="button"]')) {
        if (btn.innerText?.includes('通行密钥')) { btn.click(); return true; }
    }
    return false;
}
function waitAndTriggerPasskey() {
    const s       = getSettings();
    const acctIdx = getCurrentAcctIdx();
    updateRunningStatus(`账号 ${acctIdx + 1}/${s.accountCount}：请完成通行密钥验证`);
    showMessage(`🔑 账号 ${acctIdx + 1}/${s.accountCount}，请完成通行密钥验证`, 10000);
    let attempts = 0;
    const timer = setInterval(() => { attempts++; if (triggerPasskey() || attempts > 50) clearInterval(timer); }, 200);
}

// ==================== 登出 ====================
function logout(callback) {
    if (!document.querySelector('#toggle-current-user')) { callback?.(); return; }
    waitForElement('#toggle-current-user', btn => {
        btn.click();
        waitForElement('.bottom-tabs .user-menu-tab', tab => {
            tab.click();
            waitForElement('.logout .profile-tab-btn', logoutBtn => {
                logoutBtn.click();
                callback?.();
            });
        });
    });
}

// ==================== 页码管理 ====================
function getLastFetchedPage()   { return ssGet('lastFetchedPage', 0); }
function saveLastFetchedPage(p) { ssSet('lastFetchedPage', p); }
function getHistoricalMaxPage() {
    const data = gmGet('historicalMaxPageData', null);
    return (data?.date === getToday()) ? data.maxPage : 0;
}
function saveHistoricalMaxPage(page) {
    if (page > getHistoricalMaxPage()) gmSet('historicalMaxPageData', { date: getToday(), maxPage: page });
}
function getStartPage() {
    const last = getLastFetchedPage();
    if (last > 0) return last + 1;
    const hist = getHistoricalMaxPage();
    if (hist > 0) return hist + 1;
    return 0;
}
function resetPageProgress() {
    ssSet('lastFetchedPage', 0);
    gmSet('historicalMaxPageData', null);
}

// ==================== 修复1：buildQueue 加 posts_count 过滤 + 502 停止脚本 ====================
async function buildQueue(desiredCount) {
    updateRunningStatus('📥 正在获取新帖子...');
    const s          = getSettings();
    const maxPages   = Math.max(50, Math.ceil(desiredCount / 5));
    let startPage    = getStartPage();
    let page         = startPage;
    const maxPage    = startPage + maxPages - 1;
    let topicList    = [];
    let emptyCount   = 0;
    let retryCount   = 0;
    const seenIds    = new Set();
    let totalSkipped = 0;

    async function fetchPage(endpoint, p) {
        const res = await fetch(`/${endpoint}.json?no_definitions=true&page=${p}`, { credentials: 'include' });
        // 修复5：502 直接停止脚本
        if (res.status === 502) {
            showMessage('⚠️ 服务器繁忙(502)，脚本已停止');
            gmSet('scriptEnabled', false);
            ssSet('autoRunning', false);
            stopNavigationGuard();
            throw new Error('502');
        }
        return res.json();
    }

    function filterTopics(topics) {
        return topics.filter(t => {
            if (seenIds.has(String(t.id))) return false;
            // 修复1：过滤置顶/关闭/归档/超长帖
            if (t.pinned || t.closed || t.archived || t.visible === false) { totalSkipped++; return false; }
            // 修复1：过滤评论数超限的帖子（移植原脚本 commentLimit）
            if (t.posts_count >= CONFIG.article.commentLimit) { totalSkipped++; return false; }
            // 不在 buildQueue 里过滤已读，避免当次运行帖子被误跳过
            // 已读过滤只在 getNextTopic 里做，且只过滤上次运行的历史
            return true;
        });
    }

    // ---- 第一步：new.json（真正未看过的新帖） ----
    while (topicList.length < desiredCount && retryCount < CONFIG.article.retryLimit && page <= maxPage) {
        try {
            const data   = await RequestManager.run(`new-p${page}`, () => fetchPage('new', page), { minInterval: 800 });
            const topics = data?.topic_list?.topics || [];

            if (topics.length === 0) {
                emptyCount++;
                if (emptyCount >= 3) break;
                if (startPage > 0 && topicList.length < desiredCount) {
                    page = 0; startPage = 0; emptyCount = 0; resetPageProgress(); continue;
                }
                page++; continue;
            }

            emptyCount = 0; retryCount = 0;
            const filtered = filterTopics(topics);
            filtered.forEach(t => { seenIds.add(String(t.id)); topicList.push({ id: String(t.id), slug: t.slug, url: `/t/${t.slug}/${t.id}` }); });
            updateRunningStatus(`📥 新帖 ${topicList.length}/${desiredCount}（跳过 ${totalSkipped}）`);
            page++;
            await randomDelay(300, 600);
        } catch (e) {
            if (String(e).includes('502')) return [];
            retryCount++; await randomDelay(1000, 2000);
        }
    }

    saveLastFetchedPage(page - 1);
    saveHistoricalMaxPage(page - 1);

    // ---- 第二步：不足则补 latest.json ----
    if (topicList.length < desiredCount) {
        showMessage(topicList.length === 0 ? '📭 无新帖，切换最新...' : '新帖不足，补充最新...');
        page = 0; emptyCount = 0; retryCount = 0;

        while (topicList.length < desiredCount && retryCount < CONFIG.article.retryLimit) {
            try {
                const data   = await RequestManager.run(`latest-p${page}`, () => fetchPage('latest', page), { minInterval: 800 });
                const topics = data?.topic_list?.topics || [];
                if (topics.length === 0) { emptyCount++; if (emptyCount >= 3) break; page++; continue; }
                emptyCount = 0; retryCount = 0;
                const filtered = filterTopics(topics);
                filtered.forEach(t => { seenIds.add(String(t.id)); topicList.push({ id: String(t.id), slug: t.slug, url: `/t/${t.slug}/${t.id}` }); });
                updateRunningStatus(`📥 最新 ${topicList.length}/${desiredCount}`);
                page++; await randomDelay(300, 600);
            } catch (e) {
                if (String(e).includes('502')) return [];
                retryCount++; await randomDelay(1000, 2000);
            }
        }
    }

    if (s.randomOrder && topicList.length > 1) topicList = shuffleArray(topicList);
    const result = topicList.slice(0, desiredCount);
    ssSet('topicList', result);
    console.log(`[队列] 获取 ${result.length} 篇，跳过 ${totalSkipped} 篇`);
    return result;
}

// ==================== getNextTopic：直接取队列，不做已读过滤 ====================
async function getNextTopic() {
    let queue = ssGet('topicList', []);

    if (queue.length > 0) {
        const topic = queue.shift();
        ssSet('topicList', queue);
        return topic;
    }

    // 队列耗尽，重新拉取
    console.log('[队列] 当前队列已耗尽，重新获取...');
    const s        = getSettings();
    const newQueue = await buildQueue(s.topicsToRead);
    if (newQueue.length === 0) return null;

    const topic = newQueue.shift();
    ssSet('topicList', newQueue);
    return topic;
}

// ==================== 软导航（移植原脚本优先级） ====================
function getPageWindow() {
    try { if (typeof unsafeWindow !== 'undefined' && unsafeWindow) return unsafeWindow; } catch (_) {}
    return window;
}
async function waitForTopicNavigation(targetId, timeout = 8000) {
    const start = Date.now(), target = String(targetId);
    while (Date.now() - start < timeout) {
        const cur = getCurrentTopicId();
        if (cur === target) {
            await sleep(300);
            if (document.querySelector('.topic-post article, .post-stream')) return true;
        }
        await sleep(150);
    }
    return false;
}
async function softNavigateTo(url, topicId, retryCount = 0) {
    const MAX_RETRIES = 2;
    const path = new URL(url, location.href).pathname;
    const pw   = getPageWindow();

    try {
        // 1. DiscourseURL.routeTo
        try { if (pw.DiscourseURL?.routeTo) { pw.DiscourseURL.routeTo(path); if (await waitForTopicNavigation(topicId)) return true; } } catch (_) {}

        // 2. Discourse router
        try {
            const c = pw.Discourse?.__container__;
            const r = c?.lookup?.('router:main') || c?.lookup?.('service:router');
            if (r?.transitionTo) { r.transitionTo(path); if (await waitForTopicNavigation(topicId)) return true; }
        } catch (_) {}

        // 3. 已有 anchor 点击
        try {
            const a = Array.from(document.querySelectorAll('a[href]')).find(a => a.getAttribute('href')?.includes(`/${topicId}`));
            if (a) { a.click(); if (await waitForTopicNavigation(topicId)) return true; }
        } catch (_) {}

        // 4. 临时 anchor 点击
        try {
            const a = document.createElement('a');
            a.href = url; a.setAttribute('href', path);
            a.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;';
            document.body.appendChild(a); a.click();
            const ok = await waitForTopicNavigation(topicId); a.remove();
            if (ok) return true;
        } catch (_) {}

        // 5. pushState
        try { pw.history.pushState({}, '', path); pw.dispatchEvent(new PopStateEvent('popstate')); if (await waitForTopicNavigation(topicId)) return true; } catch (_) {}

        // 软导航全部失败，重试
        if (retryCount < MAX_RETRIES) {
            console.warn(`[导航] 软导航失败，${retryCount + 1}/${MAX_RETRIES} 次重试...`);
            await sleep(2000);
            return softNavigateTo(url, topicId, retryCount + 1);
        }

        // 最终兜底
        console.warn('[导航] 软导航全部失败，使用 location.href 兜底');
        location.href = url;
        return false;

    } catch (e) {
        console.error('[导航] 异常:', e);
        location.href = url;
        return false;
    }
}

// ==================== 底部确认（完整移植原脚本） ====================
function parseCssPixels(v) { const p = Number.parseFloat(v); return Number.isFinite(p) ? p : 0; }
function isBlueTimelineColor(v) {
    const rgb = String(v || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
    if (!rgb) return false;
    const a = rgb[4] === undefined ? 1 : Number(rgb[4]);
    return a > 0.35 && Number(rgb[3]) >= 120 && Number(rgb[2]) >= 90 && Number(rgb[1]) <= 80;
}
function isBlueDotStyle(style, rect = null) {
    if (!style || style.display === 'none' || style.visibility === 'hidden') return false;
    if (Number(style.opacity || 1) < 0.2) return false;
    const w = parseCssPixels(style.width) || rect?.width || 0;
    const h = parseCssPixels(style.height) || rect?.height || 0;
    const r = parseCssPixels(style.borderTopLeftRadius);
    if (!(w >= 4 && w <= 18 && h >= 4 && h <= 18 && Math.abs(w - h) <= 6 && r >= Math.min(w, h) * 0.35)) return false;
    return [style.backgroundColor, style.borderColor, style.color].some(isBlueTimelineColor);
}
function hasUnreadTimelineBlueDot() {
    const containers = Array.from(document.querySelectorAll('.topic-timeline,.timeline-scrollarea,.timeline-container,.timeline-replies,.topic-navigation'));
    if (!containers.length) return false;
    return containers.some(c => Array.from(c.querySelectorAll('*')).some(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        if (isBlueDotStyle(window.getComputedStyle(el), rect)) return true;
        return ['::before', '::after'].some(pseudo => {
            const ps = window.getComputedStyle(el, pseudo);
            return ps && ps.content !== 'none' && isBlueDotStyle(ps);
        });
    }));
}
function getLoadedMaxPostNumber() {
    return Array.from(document.querySelectorAll('.topic-post[data-post-number]'))
        .reduce((max, el) => { const n = parseInt(el.getAttribute('data-post-number') || '0', 10); return Number.isFinite(n) ? Math.max(max, n) : max; }, 0);
}
let _cachedMaxPostTopicId = null, _cachedMaxPostNumber = null;
async function getCurrentTopicMaxPostNumber() {
    const id = getCurrentTopicId();
    if (!id) return getLoadedMaxPostNumber();
    if (_cachedMaxPostTopicId === id && Number.isFinite(_cachedMaxPostNumber)) return _cachedMaxPostNumber;
    try {
        const res  = await fetch(window.location.href.replace(/#.*$/, '').replace(/\/$/, '') + '.json', { credentials: 'include' });
        const data = res.ok ? await res.json() : null;
        const max  = Number(data?.highest_post_number || data?.posts_count || 0);
        _cachedMaxPostTopicId = id;
        _cachedMaxPostNumber  = Number.isFinite(max) && max > 0 ? max : getLoadedMaxPostNumber();
        return _cachedMaxPostNumber;
    } catch { return getLoadedMaxPostNumber(); }
}
function getTopicProgressSnapshot() {
    return { scrollHeight: document.documentElement.scrollHeight || 0, postCount: document.querySelectorAll('.topic-post').length, maxLoadedPostNumber: getLoadedMaxPostNumber() };
}
function hasTopicProgressChanged(prev, cur) {
    return cur.scrollHeight > prev.scrollHeight + 50 || cur.postCount > prev.postCount || cur.maxLoadedPostNumber > prev.maxLoadedPostNumber;
}
function nudgeScroll() {
    const px = CONFIG.scroll.readConfirmationNudgePixels;
    window.dispatchEvent(new Event('scroll'));
    window.scrollBy({ top: -px, behavior: 'auto' });
    window.scrollBy({ top: px * 2, behavior: 'smooth' });
}
async function waitForTopicReadConfirmation() {
    if (!isTopicPage()) return true;
    let clearChecks = 0;
    for (let i = 0; i < CONFIG.scroll.readConfirmationChecks; i++) {
        if (!gmGet('scriptEnabled', false)) return false;
        if (!hasUnreadTimelineBlueDot()) {
            clearChecks++;
            if (clearChecks >= CONFIG.scroll.readConfirmationClearChecks) return true;
        } else {
            clearChecks = 0;
            console.log('[底部确认] 蓝点未消失，继续 nudge...');
            nudgeScroll();
        }
        await sleep(CONFIG.scroll.readConfirmationDelay);
    }
    return !hasUnreadTimelineBlueDot();
}
async function isTopicFullyRead() {
    const targetMax = await getCurrentTopicMaxPostNumber();
    let prev        = getTopicProgressSnapshot();
    for (let i = 0; i < CONFIG.scroll.bottomSettleChecks; i++) {
        await sleep(CONFIG.scroll.bottomSettleDelay);
        if (!gmGet('scriptEnabled', false) || !isScrolling) return false;
        if (!isNearBottom() || !isPageLoaded()) return false;
        const cur = getTopicProgressSnapshot();
        if (targetMax > 0 && cur.maxLoadedPostNumber < targetMax) return false;
        if (hasTopicProgressChanged(prev, cur)) return false;
        if (hasUnreadTimelineBlueDot()) { nudgeScroll(); return false; }
        prev = cur;
    }
    return (targetMax <= 0 || prev.maxLoadedPostNumber >= targetMax) && await waitForTopicReadConfirmation();
}

// ==================== 滚动计划（双模） ====================
function getScrollPlan(fullRead) {
    if (!fullRead) {
        return { step: randInt(CONFIG.scroll.minDistance, CONFIG.scroll.maxDistance) * CONFIG.scroll.stepMultiplier, behavior: 'smooth', delay: randInt(CONFIG.scroll.minSpeed, CONFIG.scroll.maxSpeed), allowFastScroll: true };
    }
    const vh   = Math.max(window.innerHeight || 0, document.documentElement?.clientHeight || 0, CONFIG.scroll.fullTopicMinStep);
    const rng  = (a, b) => [Math.max(12, Math.floor(vh * a)), Math.max(12, Math.floor(vh * b))];
    const roll = randInt(1, 100);
    if (roll <= CONFIG.scroll.fullTopicBacktrackChance) {
        const [mn, mx] = rng(CONFIG.scroll.fullTopicBacktrackMinRatio, CONFIG.scroll.fullTopicBacktrackMaxRatio);
        return { step: -randInt(mn, mx), behavior: 'smooth', delay: randInt(CONFIG.scroll.fullTopicBacktrackMinSpeed, CONFIG.scroll.fullTopicBacktrackMaxSpeed), allowFastScroll: false };
    }
    const slow     = roll <= CONFIG.scroll.fullTopicSlowChance;
    const [mn, mx] = slow ? rng(CONFIG.scroll.fullTopicSmallStepMinRatio, CONFIG.scroll.fullTopicSmallStepMaxRatio) : rng(CONFIG.scroll.fullTopicNormalStepMinRatio, CONFIG.scroll.fullTopicNormalStepMaxRatio);
    const [dn, dx] = slow ? [CONFIG.scroll.fullTopicSlowMinSpeed, CONFIG.scroll.fullTopicSlowMaxSpeed] : [CONFIG.scroll.fullTopicNormalMinSpeed, CONFIG.scroll.fullTopicNormalMaxSpeed];
    return { step: randInt(mn, mx), behavior: 'smooth', delay: randInt(dn, dx), allowFastScroll: false };
}

// ==================== 修复3：accumulateTime 休息机制 ====================
let accumulatedTime = 0;
let lastActionTime  = Date.now();

function accumulateTime() {
    const now = Date.now();
    accumulatedTime += now - lastActionTime;
    lastActionTime   = now;
    ssSet('accumulatedTime', accumulatedTime);

    if (accumulatedTime >= CONFIG.time.browseTime) {
        accumulatedTime = 0;
        ssSet('accumulatedTime', 0);
        pauseForRest();
    }
}

async function pauseForRest() {
    isScrolling = false;
    const mins  = Math.floor(CONFIG.time.restTime / 60000);
    showMessage(`⏸️ 连续阅读1小时，休息 ${mins} 分钟...`, CONFIG.time.restTime);
    updateRunningStatus(`⏸️ 休息中，${mins} 分钟后继续...`);
    await sleep(CONFIG.time.restTime);
    showMessage('✅ 休息结束，继续阅读');
    // 休息结束后恢复滚动
    const tasks = ssGet('tasks', null);
    if (tasks && gmGet('scriptEnabled', false)) startAutoLikeFlow();
}

// ==================== 模拟阅读（修复2：点赞在滚动前触发） ====================
let isScrolling     = false;
let scrollStartTime = 0;

async function simulateReading() {
    if (isScrolling) return;
    const s        = getSettings();
    const fullRead = s.fullRead;
    isScrolling    = true;
    scrollStartTime = Date.now();
    lastActionTime  = Date.now();
    updateRunningStatus('📖 阅读中...');

    // 完整阅读最大时间兜底：10分钟，防止无限卡死
    const absoluteMaxTime = fullRead ? 600000 : 10000;

    try {
        if (fullRead) { window.scrollTo({ top: 0, behavior: 'auto' }); await sleep(300); }

        let loops = 0;
        while (isScrolling) {
            loops++;

            if (!gmGet('scriptEnabled', false)) { isScrolling = false; return; }

            // 绝对超时：不管什么模式，超过最大时间强制退出
            if (Date.now() - scrollStartTime > absoluteMaxTime) {
                console.warn('[阅读] 绝对超时，强制结束');
                isScrolling = false;
                return;
            }

            // 防死循环兜底
            if (loops > 5000) {
                console.warn('[阅读] 循环次数超限，强制结束');
                isScrolling = false;
                return;
            }

            const plan = getScrollPlan(fullRead);
            window.scrollBy({ top: plan.step, behavior: plan.behavior });

            if (isNearBottom()) {
                await sleep(CONFIG.scroll.bottomSettleDelay);
                if (!gmGet('scriptEnabled', false)) { isScrolling = false; return; }
                const canNav = fullRead ? await isTopicFullyRead() : (isNearBottom() && isPageLoaded());
                if (canNav) { isScrolling = false; return; }
            }

            // 普通模式超时：检查蓝点再决定是否强制退出
            if (!fullRead && Date.now() - scrollStartTime > 10000) {
                if (hasUnreadTimelineBlueDot()) {
                    nudgeScroll();
                    scrollStartTime = Date.now();
                } else {
                    console.log('[阅读] 超时强制结束');
                    isScrolling = false;
                    return;
                }
            }

            await sleep(plan.delay);
            accumulateTime();

            if (plan.allowFastScroll && Math.random() < CONFIG.scroll.fastScrollChance) {
                window.scrollBy({ top: randInt(CONFIG.scroll.fastScrollMin, CONFIG.scroll.fastScrollMax), behavior: 'smooth' });
                await sleep(200);
            }
        }
    } catch (e) {
        console.error('[阅读] 异常:', e);
        isScrolling = false;
    }
}

// ==================== 点赞（修复2：滚动前调用 + 校验成功） ====================
async function tryLike() {
    const tasks = ssGet('tasks', null);
    if (!tasks || tasks.remainingLikes <= 0) return;
    if (Math.random() < 0.5) return;

    await randomDelay(800, 1500);
    const posts = shuffleArray(Array.from(document.querySelectorAll('.topic-post')));

    for (const post of posts) {
        const current = ssGet('tasks', null);
        if (!current || current.remainingLikes <= 0) break;

        const likeBtn = post.querySelector('.discourse-reactions-reaction-button button.btn-toggle-reaction-like');
        if (!likeBtn) continue;
        if (likeBtn.classList.contains('has-like') || likeBtn.getAttribute('aria-pressed') === 'true') continue;
        if ((likeBtn.getAttribute('title') || '').includes('删除')) continue;

        likeBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await randomDelay(800, 1200);
        likeBtn.click();
        await randomDelay(800, 1200);

        // 4. 点赞成功校验
        const btn2    = post.querySelector('.discourse-reactions-reaction-button button.btn-toggle-reaction-like');
        const success = btn2 && (btn2.classList.contains('has-like') || btn2.getAttribute('aria-pressed') === 'true' || (btn2.getAttribute('title') || '').includes('删除'));

        if (success) {
            current.remainingLikes--;
            if (!current.stats) current.stats = { topicsRead: 0, likesGiven: 0, startTime: Date.now() };
            current.stats.likesGiven++;
            ssSet('tasks', current);
            updateRunningStatus(`👍 点赞成功！剩余 ${current.remainingLikes} 次`);
            showMessage(`👍 今日剩余 ${current.remainingLikes} 次`);
        } else {
            console.warn('[点赞] 点击后未检测到成功状态');
        }

        setTimeout(() => { document.querySelector('#dialog-holder .btn-primary')?.click(); }, 300);
        await randomDelay(1000, 1500);
        break;
    }
}

// ==================== 导航守护 ====================
let guardInterval    = null;
let pageLoadTime     = Date.now();
let lastPageUrl      = location.href;
let guardRecovering  = false;
let guardRecoverTime = 0; // 修复：守护锁超时，防止 recoverFromStuck 并发卡死

function startNavigationGuard() {
    stopNavigationGuard();
    pageLoadTime = Date.now(); lastPageUrl = location.href;
    guardInterval = setInterval(async () => {
        if (!gmGet('scriptEnabled', false)) { stopNavigationGuard(); return; }

        // 修复：守护锁超时 30 秒自动释放，防止上次恢复卡死导致后续守护失效
        if (guardRecovering) {
            if (Date.now() - guardRecoverTime > 30000) {
                console.warn('[守护] 恢复锁超时，强制释放');
                guardRecovering = false;
                isScrolling     = false;
            } else {
                return;
            }
        }

        const now        = Date.now();
        const timeOnPage = now - pageLoadTime;
        const curUrl     = location.href;

        if (curUrl !== lastPageUrl) {
            pageLoadTime = now; lastPageUrl = curUrl;
            if (isTopicPage() && !isScrolling) {
                const t = ssGet('tasks', null);
                if (t) startAutoLikeFlow();
            }
            return;
        }

        if (isTopicPage() && timeOnPage > GUARD.pageLoadTimeout && !isPageLoaded()) {
            showMessage('⚠️ 页面加载超时，脚本已停止');
            gmSet('scriptEnabled', false); ssSet('autoRunning', false); stopNavigationGuard(); return;
        }
        if (isTopicPage() && timeOnPage > GUARD.topicStuckTimeout && !isScrolling) await recoverFromStuck();
        if (!isTopicPage() && timeOnPage > GUARD.listStuckTimeout) await recoverFromStuck();
    }, GUARD.checkInterval);
    console.log('🛡️ 导航守护已启动');
}

function stopNavigationGuard() {
    if (guardInterval) { clearInterval(guardInterval); guardInterval = null; }
}

async function recoverFromStuck() {
    if (guardRecovering) return;
    guardRecovering  = true;
    guardRecoverTime = Date.now();
    isScrolling      = false;

    try {
        await sleep(1000);
        if (!gmGet('scriptEnabled', false)) { guardRecovering = false; return; }

        if (isTopicPage()) {
            console.log('[守护] 帖子页恢复：重新触发阅读');
            const t = ssGet('tasks', null);
            if (t) {
                // 清除处理锁，允许重新处理
                t.processingTopicId = null;
                t.processingStart   = null;
                ssSet('tasks', t);
                await startAutoLikeFlow();
            }
        } else {
            console.log('[守护] 列表页恢复：跳下一篇');
            const next = await getNextTopic();
            if (next) await softNavigateTo(next.url, next.id);
            else location.href = 'https://linux.do/new';
        }
    } catch (e) {
        console.error('[守护] 恢复异常:', e);
    } finally {
        pageLoadTime    = Date.now();
        guardRecovering = false;
    }
}

// ==================== 主流程（修复2：点赞在滚动前触发） ====================
async function startAutoLikeFlow() {
    if (!gmGet('scriptEnabled', false)) return;
    const tasks = ssGet('tasks', null);
    if (!tasks || !isTopicPage()) return;

    const curId = getCurrentTopicId();

    // 当次运行已处理过这篇，直接跳过（防止 SPA 重复触发）
    if (curId && _currentRunRead.has(curId)) {
        console.log(`[主流程] 当次运行已处理过 ${curId}，跳过`);
        return;
    }

    if (tasks.processingTopicId === curId && tasks.processingStart) {
        if (Date.now() - tasks.processingStart < 300000) return;
    }

    tasks.processingTopicId = curId;
    tasks.processingStart   = Date.now();
    ssSet('tasks', tasks);

    try {
        await randomDelay(randInt(600, 1200), randInt(1200, 1800));

        // 修复2：点赞在滚动开始前触发（与原脚本一致）
        if (tasks.autoLike) await tryLike();
        if (tasks.autoRead) await simulateReading();

        const current = ssGet('tasks', null);
        if (!current) return;

        current.remainingTopics--;
        current.processingTopicId = null;
        current.processingStart   = null;
        if (!current.stats) current.stats = { topicsRead: 0, likesGiven: 0, startTime: Date.now() };
        if (tasks.autoRead) current.stats.topicsRead++;
        ssSet('tasks', current);

        // 标记已读：写内存集合（防当次重复）+ 写GM（历史持久化）
        if (curId) {
            _currentRunRead.add(curId);
            markTopicRead(curId);
        }

        const s       = getSettings();
        const total   = s.topicsToRead;
        const done    = total - current.remainingTopics;
        const elapsed = Math.round((Date.now() - current.stats.startTime) / 60000);
        updateRunningStatus(`账号 ${getCurrentAcctIdx() + 1} | ${done}/${total} 篇 | 赞 ${current.stats.likesGiven} 次 | ${elapsed} 分钟`);

        if (current.remainingTopics <= 0) { await handleAccountDone(current); return; }

        // 修复4：取下一篇时二次校验已读
        const jitter = Math.round(s.betweenPostDelay * (0.7 + Math.random() * 0.6));
        await sleep(jitter);
        const next = await getNextTopic();
        if (next) await softNavigateTo(next.url, next.id);
        else await handleAccountDone(current);

    } catch (e) {
        // 全局异常捕获：任何未处理的错误都不让脚本静默死掉
        console.error('[主流程] 异常:', e);
        isScrolling = false;

        const t = ssGet('tasks', null);
        if (t) {
            t.processingTopicId = null;
            t.processingStart   = null;
            ssSet('tasks', t);
        }

        // 5秒后尝试恢复
        if (gmGet('scriptEnabled', false)) {
            showMessage('⚠️ 检测到异常，5秒后尝试恢复...');
            await sleep(5000);
            if (gmGet('scriptEnabled', false)) await recoverFromStuck();
        }
    }
}

// ==================== 账号完成 ====================
async function handleAccountDone(tasks) {
    const acctIdx = getCurrentAcctIdx();
    const s       = getSettings();
    const done    = s.topicsToRead - tasks.remainingTopics;
    const elapsed = tasks.stats ? Math.round((Date.now() - tasks.stats.startTime) / 60000) : 0;

    stopNavigationGuard();
    isScrolling = false;

    showMessage(`✅ 账号 ${acctIdx + 1} 完成！读 ${done} 篇，赞 ${tasks.stats?.likesGiven || 0} 次，耗时 ${elapsed} 分钟`, 6000);
    updateRunningStatus('任务完成，正在退出...');

    // 先清掉任务状态，再递增账号索引
    _currentRunRead.clear();
    ssSet('tasks', null);
    ssSet('topicList', []);
    ssSet('accumulatedTime', 0);
    ssSet('autoRunning', false);
    resetPageProgress();

    // 账号索引递增写入 GM（持久化，刷新后继续下一个账号）
    gmSet('accountIndex', acctIdx + 1);

    // 等 1.5 秒让 showMessage 显示完再登出
    await sleep(1500);

    // 登出：等待登出完成后再刷新
    await new Promise(resolve => {
        logout(() => {
            // 登出成功，等 1 秒再刷新
            setTimeout(() => { resolve(); }, 1000);
        });
        // 登出失败兜底：5 秒后强制 resolve
        setTimeout(() => { resolve(); }, 5000);
    });

    location.reload();
}

// ==================== 启动账号任务 ====================
async function startAccountTask() {
    const acctIdx = getCurrentAcctIdx();
    const s       = getSettings();

    if (acctIdx >= s.accountCount) {
        gmSet('shouldRunMain', false); gmSet('scriptEnabled', false);
        ssSet('autoRunning', false); stopNavigationGuard(); updateRunningStatus(null);
        showMessage('🎉 所有账号任务已完成！'); return;
    }

    // 加载已读记录
    await loadReadTopics();

    // 恢复累计时间
    accumulatedTime = ssGet('accumulatedTime', 0);
    lastActionTime  = Date.now();

    // 状态恢复
    const savedTasks = ssGet('tasks', null);
    const savedQueue = ssGet('topicList', []);
    if (savedTasks?.accountIndex === acctIdx && savedQueue.length > 0) {
        console.log('[恢复] 从 sessionStorage 恢复任务');
        startNavigationGuard();
        if (isTopicPage()) startAutoLikeFlow();
        else { const next = await getNextTopic(); if (next) await softNavigateTo(next.url, next.id); }
        return;
    }

    updateRunningStatus(`🔄 账号 ${acctIdx + 1}/${s.accountCount} 准备中...`);
    const queue = await buildQueue(s.topicsToRead);

    if (queue.length === 0) {
        showMessage(`⚠️ 账号 ${acctIdx + 1} 无可用帖子，跳过`);
        gmSet('accountIndex', acctIdx + 1); location.reload(); return;
    }

    ssSet('topicList', queue.slice(1));
    ssSet('autoRunning', true);
    ssSet('accumulatedTime', 0);
    ssSet('tasks', {
        accountIndex: acctIdx, remainingTopics: s.topicsToRead, remainingLikes: s.dailyLikesLimit,
        autoRead: s.autoRead, autoLike: s.autoLike, processingTopicId: null, processingStart: null,
        stats: { topicsRead: 0, likesGiven: 0, startTime: Date.now() },
    });

    startNavigationGuard();
    await softNavigateTo(queue[0].url, queue[0].id);
}

// ==================== 修复6：SPA Hook 只监听 pushState + popstate，移除 replaceState ====================
;(function hookSPA() {
    const _push = history.pushState.bind(history);
    history.pushState = function (...args) { _push(...args); setTimeout(onRouteChange, 0); };
    // 修复6：replaceState 是同页面状态替换，不触发路由变化
    window.addEventListener('popstate', () => setTimeout(onRouteChange, 0));
})();

function onRouteChange() {
    if (ssGet('tasks', null) && gmGet('scriptEnabled', false)) startAutoLikeFlow();
}

// 轮询兜底
let lastUrl = location.href;
setInterval(() => {
    if (location.href !== lastUrl) { lastUrl = location.href; onRouteChange(); }
}, 500);

// ==================== 启动/停止 ====================
function toggleScript() {
    const enabled = !gmGet('scriptEnabled', false);
    gmSet('scriptEnabled', enabled);
    showMessage('脚本' + (enabled ? '已启动 🚀' : '已停止 ⏹'));
    if (enabled) {
        gmSet('shouldRunMain', true);
        const idx = getCurrentAcctIdx(), total = getSettings().accountCount;
        if (idx >= total) { gmSet('accountIndex', 0); showMessage('🔄 已重置，从第一个账号开始'); }
        if (isLoggedIn()) startAccountTask();
        else location.href = 'https://linux.do/login';
    } else {
        gmSet('shouldRunMain', false);
        isScrolling = false; ssSet('autoRunning', false); stopNavigationGuard(); updateRunningStatus(null);
    }
}

// ==================== 页面加载入口 ====================
window.addEventListener('load', async () => {
    if (!gmGet('shouldRunMain', false) || !gmGet('scriptEnabled', false)) return;

    const s = getSettings(), acctIdx = getCurrentAcctIdx(), total = s.accountCount;

    if (acctIdx >= total) {
        gmSet('shouldRunMain', false); gmSet('scriptEnabled', false); gmSet('accountIndex', 0);
        updateRunningStatus(null); showMessage('🎉 所有账号任务完成！'); return;
    }

    if (isLoginPage()) { waitAndTriggerPasskey(); return; }

    const tasks = ssGet('tasks', null);
    if (tasks && ssGet('autoRunning', false)) {
        console.log('[入口] 恢复运行');
        await loadReadTopics();
        accumulatedTime = ssGet('accumulatedTime', 0);
        lastActionTime  = Date.now();
        startNavigationGuard();
        if (isTopicPage()) startAutoLikeFlow();
        else startAccountTask();
    } else if (isLoggedIn()) {
        updateRunningStatus(`✅ 账号 ${acctIdx + 1}/${total} 登录成功`);
        showMessage(`✅ 账号 ${acctIdx + 1} 开始任务`);
        setTimeout(() => startAccountTask(), 500);
    } else {
        location.href = 'https://linux.do/login';
    }
});
```

})();