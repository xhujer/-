/**
 * WPS · 每日签到 + 福利中心 + 任务中心(PC) + 小程序打卡
 * @Author: MaYIHEI <https://github.com/MaYIHEI/paperclip> | 多账号改造 by Ming
 * @Updated: 2026-09-27
 */
const $ = new Env("WPS");

const CK_KEY = "wps_sid";

const LIST_KEY = "wps_sid_list";
function normAcc(a) {
    if (typeof a === "string") return a ? { sid: a, ck: `wps_sid=${a}; wps_sids=${a}` } : null;
    if (a && a.sid) return { sid: a.sid, ck: a.ck || `wps_sid=${a.sid}; wps_sids=${a.sid}` };
    return null;
}
function saveAccounts(list) {
    $.setdata(JSON.stringify(list.map((a) => ({ sid: a.sid, ck: a.ck }))), LIST_KEY);
}
function getAccounts() {
    let raw = [];
    try {
        const v = JSON.parse($.getdata(LIST_KEY) || "[]");
        raw = Array.isArray(v) ? v : [];
    } catch (e) {
        raw = [];
    }
    const list = raw.map(normAcc).filter(Boolean);
    const old = $.getdata(CK_KEY);
    if (old) {
        if (!list.some((a) => a.sid === old)) list.unshift(normAcc(old));
        saveAccounts(list);
        $.setdata("", CK_KEY);
    }
    return list;
}
function collectAccounts() {
    return getAccounts().map((a, i) => ({ n: i + 1, sid: a.sid, ck: a.ck }));
}

function removeAccount(sid) {
    saveAccounts(getAccounts().filter((a) => a.sid !== sid));
}

let ACTIVE_SID = "";
let ACTIVE_CK = "";
let ACTIVE_CSRF = "";

async function saveCookieFromRequest() {
    if ($request.method === "OPTIONS") {
        $.log("[WARN] 这是 OPTIONS 预检请求,跳过");
        $.msg("WPS", "⚠️ 抓到的不是活动页请求", `这是 OPTIONS 预检(${$request.url})。\n请用 Safari 打开 WPS 活动页,不要手动运行抓包脚本`);
        return;
    }
    const wantDebug = debugSwitchOn() ? "true" : "false";
    if (($.getdata("wps_debug") || "false") !== wantDebug) {
        $.setdata(wantDebug, "wps_debug");
        $.msg("WPS", wantDebug === "true" ? "🔍 调试模式已开启" : "🔍 调试模式已关闭",
            "下次运行 cron 时会" + (wantDebug === "true" ? "打印接口原始响应" : "恢复正常日志"));
    }
    if (shouldClearAll()) {
        const hadAccounts = getAccounts().length > 0;
        saveAccounts([]);
        $.setdata("", CK_KEY);
        if (hadAccounts) {
            $.msg("WPS", "", "✅ 全部账号 Cookie 已清除(插件开关触发),请重新抓取");
        } else {
            $.msg("WPS", "ℹ️ 账号本来就是空的", "「清空全部账号」开关记得关掉,否则会一直清");
        }
        return;
    }
    try {
        const cookie = String($request.headers["Cookie"] || $request.headers["cookie"] || "");
        const m = cookie.match(/(?:^|;\s*)wps_sid=([^;]+)/);
        if (!m) {
            const has = getAccounts().length > 0;
            $.log(`[WARN] 请求头里没找到 wps_sid;该请求携带的 Cookie 键: ${(cookie.match(/(?:^|;\s*)([^=;]+)=/g) || []).join(",") || "(无)"}`);
            if (!has) {
                $.msg("WPS", "⚠️ 没抓到登录态", `这次请求里没有 wps_sid。\n请先在 WPS/浏览器里登录,再打开活动页`);
            }
            return;
        }
        const sid = m[1];

        const accts = getAccounts();
        const idx = accts.findIndex((a) => a.sid === sid);
        if (idx >= 0) {
            if (accts[idx].ck !== cookie) {
                accts[idx].ck = cookie;
                saveAccounts(accts);
            }
            return;
        }
        accts.push({ sid, ck: cookie });
        saveAccounts(accts);

        let uid = "";
        try {
            const r = await requestUserId(sid);
            const j = safeJson(r.body);
            if (j && j.result === "ok" && j.userid) uid = String(j.userid);
            else $.log(`[WARN] Cookie 已保存,但账号 ID 获取失败: ${(r.body || "").slice(0, 200)}`);
        } catch (e) {
            $.log(`[WARN] Cookie 已保存,但账号 ID 请求异常: ${e}`);
        }

        const identity = uid ? `账号ID:${uid}\n` : "";
        $.msg("WPS", "✅ WPS Cookie 获取成功", `${identity}第 ${accts.length} 个账号已保存,共 ${accts.length} 个;重复抓取会自动去重`);
    } catch (e) {
        $.log("[ERROR] cookie 抓取失败: " + e);
    }
}

function argFlag(keys) {
    try {
        const a = $argument;
        const pick = (o) => keys.some((k) => isTrueValue(o[k]));
        if (a && typeof a === "object") return pick(a);
        if (typeof a === "string" && a.trim() !== "") {
            const text = a.trim();
            try {
                const parsed = JSON.parse(text);
                if (parsed && typeof parsed === "object") return pick(parsed);
            } catch (e) {  }
            return keys.some((k) => new RegExp(`(?:^|[,&;\\s])${k}\\s*=\\s*(?:true|1)(?=$|[,&;\\s])`, "i").test(text));
        }
    } catch (e) {  }
    return false;
}
function shouldClearAll() {
    return argFlag(["清空全部账号", "clearAll"]);
}
function debugSwitchOn() {
    return argFlag(["调试模式", "debug"]);
}

function isTrueValue(v) {
    return v === true || v === 1 || v === "true" || v === "1";
}

function taskOff(k) {
    const v = $.getdata(k);
    return v === false || v === 0 || v === "false" || v === "0";
}

function debug(content) {
    if (($.getdata("wps_debug") || "false") !== "true") return;
    $.log(`[DEBUG] ${typeof content === "string" ? content : JSON.stringify(content)}`);
}

const ISLOGIN = "https://account.wps.cn/api/v3/islogin";
const ENC_KEY = "https://personal-bus.wps.cn/sign_in/v1/encrypt/key";
const DAY_INFO = "https://personal-bus.wps.cn/sign_in/v1/day_info";
const SIGN_IN = "https://personal-bus.wps.cn/sign_in/v1/sign_in";
const COMPONENT = "https://personal-act.wps.cn/activity-rubik/activity/component_action";
const PAGE_INFO = "https://personal-act.wps.cn/activity-rubik/activity/page_info";

const CLOCK_INFO = "https://personal-bus.wps.cn/activity/clock_in/v1/info";
const CLOCK_IN = "https://personal-bus.wps.cn/activity/clock_in/v1/clock_in";
const CLOCK_REWARD = "https://personal-bus.wps.cn/activity/clock_in/v1/reward";
const CLOCK_CONF = "https://personal-act.wpscdn.cn/srcapi/act/rubik-service/honeycomb-adapter/client/module-info?pid=113&mg_id=47736&id=48312";

const APPLET = {
    activity_number: "HD2024082815116866",
    page_number: "YM2024082815122017",
    filter: { virtualPayEnabled: "1" },
    lottery_times: "https://personal-bus.wps.cn/activity/clock_in/v1/task/lottery_times?position=wx_xcx_clock_activity",
};

const FLZX = {
    activity_number: "HD2025031721339450",
    page_number: "YM2025060910400185",
    filter: { cs_from: "", mk_key: "", position: "ios_flzx_grzxsdjg3001" },
};
const COMPONENTS = {
    fragment: { component_number: "ZJ2025061815352884", component_node_id: "FN1769668388sb3w", type: 42 },
    lottery: { component_number: "ZJ2025092916519174", component_node_id: "FN1779447163CApn", type: 45, session_id: 3002 },
    trial: { component_number: "ZJ2025041115207603", component_node_id: "FN1744359116PWbV", type: 32 },
    hot: { component_number: "ZJ2025041115200788", component_node_id: "FN1744358694RbIn", type: 31 },
};

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WpsiOS/26.6.1";
const MINI_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.49(0x18003123) NetType/WIFI Language/zh_CN miniProgram";
const PC_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0";

const TC = {
    activity_number: "HD2025031821201822",
    page_number: "YM2025040908558269",
    filter: {
        cs_from: "web_vipcenter_banner_inpublic",
        mk_key: "4b9deqIfqNO3KCZrgH17WPH1kdzMoKUEvya",
        position: "pc_aty_ban3_kaixue_test_b",
    },
    lottery_session: 2,
};
const TC_REFERER = `https://personal-act.wps.cn/rubik2/portal/${TC.activity_number}/${TC.page_number}`
    + `?cs_from=${TC.filter.cs_from}&mk_key=${TC.filter.mk_key}&position=${TC.filter.position}`;
const TC_TASK_INFO = "https://personal-act.wps.cn/activity-rubik/user/task_center/task_info";
const TC_TASK_FINISH = "https://personal-act.wps.cn/activity-rubik/user/task_center/task_finish";
const SKIP_KEYWORDS = ["邀请", "PDF转换", "PDF合并", "语音速记", "关注", "消费", "开通会员", "认证", "上喜马拉雅", "微博", "苏宁易购", "添加"];
const TC_MAX_BROWSE = 8;
const TC_BROWSE_WAIT = 25;
const LOTTERY_MAX = 20;

const ACTION_GAP = [5, 10];

const SCRIPT_BUILD = "2026-09-27";
const RUN_MODE = typeof $request !== "undefined" ? "抓Cookie" : "cron签到";
$.log(`[WPS] 脚本启动 build=${SCRIPT_BUILD} mode=${RUN_MODE}`);

if (typeof $request !== "undefined") {
    $.log(`[WPS] 抓包请求: ${$request.method} ${$request.url}`);
    saveCookieFromRequest()
        .catch((e) => $.log(`[ERROR] Cookie 抓取流程异常: ${e}`))
        .finally(() => $.done());
} else {
    $.results = [];
    const accts = getAccounts();
    $.log(`[WPS] 已存账号 ${accts.length} 个${accts.length ? "" : "(还没抓过 Cookie,先打开一次 WPS 活动页)"}`);
    if (isTrueValue($.getdata("wps_clear"))) {
        $.setdata("[]", LIST_KEY);
        $.setdata("", CK_KEY);
        $.setdata("false", "wps_clear");
        $.msg("WPS", "", "✅ 全部账号 Cookie 已清除，请重新抓取");
        $.done();
    } else {
        mainAll().catch((e) => {
            $.log(`[ERROR] 主流程异常: ${e}`);
            $.msg("WPS", "❌ 运行异常", String(e));
        }).finally(() => $.done());
    }
}

async function mainAll() {
    const accounts = collectAccounts();
    if (!accounts.length) {
        $.msg("WPS", "🚫 缺少 Cookie", "请先开启 cookie 抓取脚本,打开 WPS APP 进任意活动页停留 1 秒");
        return;
    }
    const report = [];
    for (let i = 0; i < accounts.length; i++) {
        if (i > 0) await sleep(3000);
        $.results = [];
        await mainForAccount(accounts[i].sid, accounts[i].n, report, accounts[i].ck);
    }
    if (report.length) {
        $.msg(`WPS 多账号签到(${accounts.length} 个账号)`, "", report.join("\n\n"));
    }
}

async function mainForAccount(sid, accountNo, report, ck) {
    const TAG = `[账号${accountNo}]`;
    let LABEL = `账号${accountNo}`;
    ACTIVE_SID = sid || "";
    ACTIVE_CK = ck || (sid ? `wps_sid=${sid}; wps_sids=${sid}` : "");
    const cm = ACTIVE_CK.match(/(?:^|;\s*)act_csrf_token=([^;]+)/);
    ACTIVE_CSRF = cm ? cm[1] : "";
    if (!sid) {
        if (report && Array.isArray(report)) report.push(`【${LABEL}】🚫 缺少 Cookie`);
        else $.msg("WPS" + TAG, "🚫 缺少 Cookie", "请先开启 cookie 抓取脚本,打开 WPS APP 进任意活动页停留 1 秒");
        return;
    }

    let uid, lastErr;
    for (let attempt = 0; attempt < 2 && !uid; attempt++) {
        if (attempt > 0) await sleep(3000);
        try {
            const r = await httpReq("GET", ISLOGIN);
            const j = JSON.parse(r.body);
            if (j.result !== "ok" || !j.userid) {
                removeAccount(sid);
                if (report && Array.isArray(report)) report.push(`【${LABEL}】🚫 登录态失效,已自动从列表移除,请重新抓取`);
                else $.msg("WPS" + TAG, "🚫 登录态失效", "wps_sid 已过期,已自动从账号列表移除,请重新抓取(打开 WPS 进活动页)");
                $.log(`[ERROR] ${TAG} islogin 非 ok: ${r.body.slice(0, 200)}`);
                return;
            }
            uid = j.userid;
            LABEL = `账号ID:${String(uid)}`;
        } catch (e) {
            lastErr = e;
            $.log(`[WARN] ${TAG} islogin 网络错误(${attempt + 1}/2): ${e}`);
        }
    }
    if (!uid) {
        if (report && Array.isArray(report)) report.push(`【${LABEL}】⚠️ 网络异常,稍后会自动重试`);
        else $.msg("WPS" + TAG, "⚠️ 网络异常", "islogin 请求超时(非 Cookie 失效),稍后会自动重试或手动运行一次");
        $.log(`[ERROR] ${TAG} islogin 重试后仍失败: ${lastErr}`);
        return;
    }

    const tasks = [
        ["wps_task_hot", () => taskHot()],
        ["wps_task_trial", () => taskTrial()],
        ["wps_task_signin", () => taskSignIn(uid)],
        ["wps_task_fragment", () => taskFragment()],
        ["wps_task_lottery", () => taskLottery()],
        ["wps_task_center", () => taskCenter()],
        ["wps_task_clockin", () => taskClockIn()],
        ["wps_task_applet_lottery", () => taskAppletLottery()],
    ];
    let ran = 0;
    for (const [key, run] of tasks) {
        if (taskOff(key)) continue;
        if (ran++ > 0) await sleep(jitter(ACTION_GAP));
        await run();
    }
    if (!ran) $.results.push("ℹ️ 所有任务均已关闭");

    if (report && Array.isArray(report)) report.push(`【${LABEL}】\n${$.results.join("\n")}`);
    else $.msg("WPS 任务汇总" + TAG, "", $.results.join("\n"));
}


async function tcAction(uq, ctype, action, taskId) {
    const reqObj = {
        component_uniq_number: uq,
        component_type: ctype,
        component_action: action,
        task_center: { task_id: taskId },
    };
    const r = await httpReq("POST", COMPONENT, { body: JSON.stringify(reqObj), pc: true });
    const j = safeJson(r.body);
    const inner = (j && j.data && j.data.task_center) || {};
    if (j && j.result === "ok" && inner.success === true) return inner.token || true;
    debug(`任务中心 ${action} #${taskId} 未成功: ${(r.body || "").slice(0, 200)}`);
    return false;
}

async function tcTaskInfo(token) {
    const started = Date.now();
    const r = await httpReq("GET", `${TC_TASK_INFO}?batch_tag=${started}&token=${encodeURIComponent(token)}`, { pc: true });
    const j = safeJson(r.body);
    if (j && j.result === "ok" && j.data && typeof j.data.start_at === "number") return started + j.data.start_at;
    debug(`task_info 异常: ${(r.body || "").slice(0, 200)}`);
    return 0;
}

async function tcTaskFinish(token, batchTag) {
    const r = await httpReq("POST", TC_TASK_FINISH, { body: JSON.stringify({ batch_tag: batchTag, token }), pc: true });
    const j = safeJson(r.body);
    if (j && j.result === "ok") return true;
    debug(`task_finish 异常: ${(r.body || "").slice(0, 200)}`);
    return false;
}

async function taskCenter() {
    const tag = "任务中心";
    try {
        const list = await fetchPageInfo(TC, true);
        if (!list) { $.results.push(`❌ ${tag}:page_info 无响应`); return; }
        const comp = list.find((c) => c && c.task_center);
        if (!comp) { $.results.push(`⚠️ ${tag}:未找到任务组件(可能已换期)`); return; }

        const uq = {
            activity_number: TC.activity_number,
            page_number: TC.page_number,
            component_number: comp.number,
            component_node_id: comp.component_node_id,
            filter_params: TC.filter,
        };
        const all = (comp.task_center.task_list || []).filter((t) => t && t.task_id);
        let ok = 0, already = 0, skipped = 0, failed = 0, browse = 0;

        for (const t of all) {
            const title = String(t.title || "");
            if (t.task_status === 2) { already++; continue; }
            if (SKIP_KEYWORDS.some((k) => title.indexOf(k) >= 0)) { skipped++; continue; }
            const isBrowse = title.indexOf("浏览") >= 0;
            if (isBrowse && browse >= TC_MAX_BROWSE) { skipped++; continue; }

            await sleep(jitter([1, 3]));
            let done = false;
            if (isBrowse) {
                browse++;
                const token = await tcAction(uq, comp.type, "task_center.start", t.task_id);
                if (typeof token === "string" && token) {
                    const batchTag = await tcTaskInfo(token);
                    if (batchTag) {
                        const wait = Math.min(TC_BROWSE_WAIT, Math.max(8, batchTag - Date.now()));
                        await sleep(wait * 1000 + 1000);
                        done = await tcTaskFinish(token, batchTag);
                    }
                }
            } else {
                done = (await tcAction(uq, comp.type, "task_center.finish", t.task_id)) !== false;
            }

            if (done) {
                await sleep(jitter([1, 2]));
                await tcAction(uq, comp.type, "task_center.reward", t.task_id);
                ok++;
            } else {
                failed++;
            }
        }
        const total = all.length;
        if (!ok && !failed) {
            $.results.push(`✅ ${tag}:今日无待做任务(${already} 已完成 · ${skipped} 主动跳过 · 共 ${total})`);
        } else {
            $.results.push(`${failed ? "⚠️" : "✅"} ${tag}:本轮完成 ${ok} · 已做过 ${already} · 跳过 ${skipped} · 失败 ${failed}(共 ${total})`);
        }
        await tcLottery(list);
    } catch (e) {
        $.results.push(`❌ ${tag}:异常`);
        $.log(`[ERROR] ${tag}: ${e}`);
    }
}

async function tcLottery(list) {
    const tag = "任务中心抽奖";
    const comp = (list || []).find((c) => c && c.lottery_v2 && Array.isArray(c.lottery_v2.lottery_list));
    if (!comp) { $.results.push(`⚠️ ${tag}:未找到抽奖组件`); return; }
    const sessions = comp.lottery_v2.lottery_list || [];
    const sess = sessions.find((s) => s && s.session_id === TC.lottery_session) || sessions[0];
    const times = (sess && sess.times) || 0;
    if (times < 1) { $.results.push(`✅ ${tag}:今日暂无次数`); return; }
    await drawLottery(tag, TC, comp, (sess && sess.session_id) || TC.lottery_session, times, true);
}

async function taskSignIn(uid) {
    const tag = "每日签到";
    try {
        const di = await httpReq("GET", DAY_INFO);
        const info = (JSON.parse(di.body).data || {}).info || {};
        if (info.has_sign) {
            $.results.push(`✅ ${tag}:已签到`);
            return;
        }

        const ek = await httpReq("GET", ENC_KEY);
        const pubKeyB64 = JSON.parse(ek.body).data;
        if (!pubKeyB64) throw new Error(`公钥获取失败: ${ek.body.slice(0, 120)}`);

        const aesKey = genAesKey();
        const userId = typeof uid === "string" && /^\d+$/.test(uid) ? Number(uid) : uid;
        const plain = JSON.stringify({ user_id: userId, platform: 32 });
        const extra = aesEncrypt(plain, aesKey, aesKey.substr(0, 16));
        const token = rsaEncryptB64(aesKey, pubKeyB64);

        const body = JSON.stringify({ encrypt: true, extra, pay_origin: "ios_ucs_rwzx sign", channel: "" });
        const r = await httpReq("POST", SIGN_IN, { body, token });
        const j = safeJson(r.body);
        if (j && j.result === "ok") {
            const names = ((j.data || {}).rewards || []).map((x) => x.reward_name).filter(Boolean);
            $.results.push(`✅ ${tag}:成功${names.length ? " " + names.join("/") : ""}`);
        } else {
            const st = classify(j && (j.ext_msg || j.msg), "已签到");
            $.results.push(`${st.e} ${tag}:${st.t}`);
            if (st.e !== "✅") debug(`${tag} 响应: ${r.body.slice(0, 300)}`);
        }
    } catch (e) {
        $.results.push(`❌ ${tag}:异常`);
        $.log(`[ERROR] ${tag}: ${e}`);
    }
}

async function drawLottery(tag, cfg, node, sessionId, times, pc) {
    const got = [];
    for (let i = 0; i < Math.min(times, LOTTERY_MAX); i++) {
        const reqObj = {
            component_uniq_number: {
                activity_number: cfg.activity_number,
                page_number: cfg.page_number,
                component_number: node.number,
                component_node_id: node.component_node_id,
                filter_params: cfg.filter,
            },
            component_type: node.type || 45,
            component_action: "lottery_v2.exec",
            lottery_v2: { session_id: sessionId },
        };
        const r = await httpReq("POST", COMPONENT, { body: JSON.stringify(reqObj), pc });
        const j = safeJson(r.body);
        const inner = (j && j.data && j.data.lottery_v2) || {};
        if (j && j.result === "ok" && inner.success === true) {
            got.push(inner.reward_name || "奖品");
            await sleep(jitter([1, 2]));
            continue;
        }
        const st = classify(inner.send_msg || (j && j.msg), "次数用完");
        if (got.length) {
            $.results.push(`${st.e} ${tag}:抽 ${got.length} 次 ${got.join("/")}（${st.t}）`);
        } else {
            // 一次都没抽成 → 无论服务端说什么都不是正常收尾,统一用 ⚠️
            $.results.push(`⚠️ ${tag}:未抽到（${st.t}）`);
        }
        debug(`${tag} 响应: ${(r.body || "").slice(0, 200)}`);
        return;
    }
    $.results.push(`✅ ${tag}:抽 ${got.length} 次${got.length ? " " + got.join("/") : ""}`);
}

async function fetchPageInfo(cfg, pc) {
    const filter = encodeURIComponent(JSON.stringify(cfg.filter));
    const pi = await httpReq("GET",
        `${PAGE_INFO}?activity_number=${cfg.activity_number}&page_number=${cfg.page_number}&filter_params=${filter}`,
        { pc });
    const pj = safeJson(pi.body);
    if (!pj || pj.result !== "ok" || !Array.isArray(pj.data)) {
        debug(`page_info 异常(${cfg.activity_number}): ${(pi.body || "").slice(0, 300)}`);
        return null;
    }
    return pj.data;
}
function findComp(list, number, node) {
    return (list || []).find((c) => c && c.number === number && (!node || c.component_node_id === node)) || null;
}

async function taskHot() {
    const tag = "限量爆款";
    const comp = COMPONENTS.hot;
    try {
        const list = await fetchPageInfo(FLZX);
        if (!list) { $.results.push(`❌ ${tag}:page_info 无响应`); return; }
        const node = findComp(list, comp.component_number, comp.component_node_id);
        const ps = (node && node.privilege_select) || {};
        const details = ps.privilege_select_details || [];
        if (!details.length) { $.results.push(`⚠️ ${tag}:未找到爆款组件(可能已换期,需重抓)`); return; }

        if (ps.select_reach_limit) { $.results.push(`✅ ${tag}:已领取(今日已选)`); return; }

        const score = (d) => (d.privilege_type === "privilege" ? 10000 : 0) + (d.hours || 0) * 100 + (d.nums || 0);
        const ranked = details.slice().sort((a, b) => score(b) - score(a));

        let done = false;
        let lastReason = "";
        for (const d of ranked) {
            const reqObj = {
                component_uniq_number: {
                    activity_number: FLZX.activity_number,
                    page_number: FLZX.page_number,
                    component_number: comp.component_number,
                    component_node_id: comp.component_node_id,
                },
                component_type: comp.type,
                component_action: "privilege_select.exec",
                    privilege_select: { group_id: d.group_id, privilege_id: d.privilege_id },
            };
            const r = await httpReq("POST", COMPONENT, { body: JSON.stringify(reqObj) });
            const j = safeJson(r.body);
            const inner = (j && j.data && j.data.privilege_select) || {};
            if (j && j.result === "ok" && inner.success === true) {
                $.results.push(`✅ ${tag}:成功 ${d.title || "pid " + d.privilege_id}`);
                done = true;
                break;
            }
            lastReason = inner.reason || (j && (j.msg || j.ext_msg)) || "";
            debug(`${tag} ${d.title}(pid ${d.privilege_id})未中: ${(r.body || "").slice(0, 200)}`);
        }
        if (!done) {
            const st = classify(lastReason, "已完成");
            $.results.push(`⚠️ ${tag}:未领到${lastReason ? "（" + st.t + "）" : ""}`);
        }
    } catch (e) {
        $.results.push(`❌ ${tag}:异常`);
        $.log(`[ERROR] ${tag}: ${e}`);
    }
}

async function taskFragment() {
    const tag = "打卡领会员";
    const comp = COMPONENTS.fragment;
    try {
        const today = beijingDate();

        const list = await fetchPageInfo(FLZX);
        const node = findComp(list, comp.component_number);
        if (!node) {
            $.results.push(`⚠️ ${tag}:未取到序列状态,跳过(避免误清零连续天数)`);
            debug(`${tag} page_info 未含 fragment 组件 ${comp.component_number}`);
            return;
        }
        const fc = node.fragment_collect || {};
        const seriesId = fc.sign_series_id || "";
        const records = fc.sign_records || [];
        debug(`${tag} 读到 series_id=${seriesId || "(空)"} records=${records.map((r) => r.sign_date + ":" + r.sign_status).join(",")}`);

        const todayRec = records.find((r) => r && r.sign_date === today);
        if (todayRec && todayRec.sign_status === "signed") {
            $.results.push(`✅ ${tag}:已打卡`);
            return;
        }

        const diag = `序列 ${seriesId || "(空)"} · 读到 ${records.length} 天${records.length ? " " + records.slice(-4).map((x) => String(x.sign_date).slice(5) + (x.sign_status === "signed" ? "✓" : "✗")).join(" ") : ""}`;

        let res = await signFragment(today, seriesId, !seriesId);
        let usedNew = !seriesId;
        if (!res.ok && /not in se/i.test(res.msg)) {
            debug(`${tag} 原序列被拒(${res.msg}),改用新序列重试`);
            res = await signFragment(today, "", true);
            usedNew = true;
        }

        const st = classify(res.msg, "已打卡");
        if (res.ok) {
            $.results.push(`✅ ${tag}:成功${usedNew && seriesId ? "(原序列已断,开新序列)" : usedNew ? "(新序列)" : ""}`);
        } else {
            $.results.push(`${st.e} ${tag}:${st.t}`);
            $.results.push(`   ↳ ${diag}`);
            if (st.e !== "✅") debug(`${tag} 响应: ${String(res.raw).slice(0, 300)}`);
        }
    } catch (e) {
        $.results.push(`❌ ${tag}:异常`);
        $.log(`[ERROR] ${tag}: ${e}`);
    }
}

async function signFragment(signDate, seriesId, isNew) {
    const comp = COMPONENTS.fragment;
    const reqObj = {
        component_uniq_number: {
            activity_number: FLZX.activity_number,
            page_number: FLZX.page_number,
            component_number: comp.component_number,
            component_node_id: comp.component_node_id,
        },
        component_type: comp.type,
        component_action: "fragment_collect.sign_in",
        fragment_collect: { sign_date: signDate, series_id: seriesId, is_new_sign_series: isNew },
    };
    const r = await httpReq("POST", COMPONENT, { body: JSON.stringify(reqObj) });
    const j = safeJson(r.body);
    if (!j) return { ok: false, msg: "无响应", raw: r.body };
    if (j.result !== "ok") return { ok: false, msg: j.msg || j.ext_msg || "服务端返回非 ok", raw: r.body };
    const inner = (j.data || {}).fragment_collect || {};
    if (inner.success === true) return { ok: true, msg: "", raw: r.body };
    return { ok: false, msg: inner.reason || j.msg || "未成功", raw: r.body };
}

async function taskLottery() {
    const tag = "天天抽奖";
    const comp = COMPONENTS.lottery;
    try {
        const list = await fetchPageInfo(FLZX);
        if (!list) { $.results.push(`❌ ${tag}:page_info 无响应`); return; }
        const node = findComp(list, comp.component_number, comp.component_node_id);
        if (!node || !node.lottery_v2) { $.results.push(`⚠️ ${tag}:未找到抽奖组件(可能已换期)`); return; }
        const sessions = node.lottery_v2.lottery_list || [];
        const sess = sessions.find((s) => s && s.session_status === "IN_PROGRESS") || sessions[0];
        const times = (sess && sess.times) || 0;
        if (times < 1) { $.results.push(`✅ ${tag}:今日暂无免费次数`); return; }
        await drawLottery(tag, FLZX, node, (sess && sess.session_id) || comp.session_id, times, false);
    } catch (e) {
        $.results.push(`❌ ${tag}:异常`);
        $.log(`[ERROR] ${tag}: ${e}`);
    }
}

async function taskTrial() {
    const tag = "会员试用";
    try {
        const base = {
            activity_number: FLZX.activity_number,
            page_number: FLZX.page_number,
            component_number: COMPONENTS.trial.component_number,
            component_node_id: COMPONENTS.trial.component_node_id,
        };
        const callTrial = async (action, extra) => {
            const reqObj = { component_uniq_number: base, component_type: COMPONENTS.trial.type, component_action: action };
            for (const k in extra) reqObj[k] = extra[k];
            const r = await httpReq("POST", COMPONENT, { body: JSON.stringify(reqObj) });
            return safeJson(r.body);
        };
        const short = (t) => String(t || "奖品").replace(/超级会员/g, "");

        const pv = await callTrial("divide_prize.preview", {});
        const details = (((pv || {}).data || {}).divide_prize || {}).divide_prize_details || [];
        if (!details.length || details.every((d) => d.has_join)) {
            $.results.push(`✅ ${tag}:全部已申请`);
            return;
        }

        const parts = [];
        let allGood = true;
        let acted = 0;
        for (const d of details) {
            const name = short(d.title);
            if (d.has_join) { parts.push(`${name}已申请`); continue; }
            if (d.stock != null && d.stock <= 0) { parts.push(`${name}已领完`); allGood = false; continue; }
            if (acted > 0) await sleep(jitter(ACTION_GAP));
            acted++;
            const su = await callTrial("divide_prize.sign_up", {
                divide_prize: { cycle_id: d.cycle_id, session_id: `${d.session_id}_${beijingDate()}` },
            });
            const inner = ((su || {}).data || {}).divide_prize || {};
            if (su && su.result === "ok" && inner.success === true) {
                parts.push(`${name}✓`);
            } else {
                const st = classify(inner.reason || (su && su.msg), "已申请");
                parts.push(`${name}${st.t}`);
                if (st.e !== "✅") { allGood = false; debug(`${tag} ${d.title}: ${JSON.stringify(su).slice(0, 200)}`); }
            }
        }
        $.results.push(allGood ? `✅ ${tag}:全部已申请` : `⚠️ ${tag}:${parts.join(" ")}`);
    } catch (e) {
        $.results.push(`❌ ${tag}:异常`);
        $.log(`[ERROR] ${tag}: ${e}`);
    }
}

async function taskClockIn() {
    const tag = "小程序打卡";
    try {
        const sid = ACTIVE_SID || $.getdata(CK_KEY);

        await sleep(jitter([3, 10]));

        let ss = "", cfBody = "";
        for (let i = 0; i < 2 && !ss; i++) {
            if (i > 0) await sleep(2000);
            const cf = await rawReq("GET", CLOCK_CONF, {});
            cfBody = cf.body || "";
            ss = (((safeJson(cfBody) || {}).data || {}).value || {}).ss;
        }

        let s_key = "", infBody = "";
        const backoff = [0, 3000, 6000, 9000];
        for (let i = 0; i < backoff.length && !s_key; i++) {
            if (backoff[i]) await sleep(backoff[i]);
            const inf = await rawReq("GET", `${CLOCK_INFO}?client_type=1&page_index=0&page_size=10`, { sid });
            infBody = inf.body || "";
            s_key = ((safeJson(infBody) || {}).data || {}).s_key;
            if (!s_key) debug(`${tag} info 重试 ${i + 1}/${backoff.length}: ${infBody.slice(0, 120)}`);
        }

        if (!ss || !s_key) {
            const which = !ss ? "ss" : "s_key";
            const src = !ss ? cfBody : infBody;
            const m = ((safeJson(src) || {}).msg) || src.slice(0, 60) || `缺 ${which}`;
            $.results.push(`⚠️ ${tag}:接口异常(取 ${which} 失败:${m})`);
            debug(`${tag} info: ss=${!!ss} s_key=${!!s_key} cf=${cfBody.slice(0, 120)} inf=${infBody.slice(0, 120)}`);
            return;
        }

        const bodyStr = canonicalJSON({ client_type: 1 });
        const date = new Date().toUTCString();
        const signature = hmacSha256Hex(s_key + md5Hex(bodyStr) + date, ss);

        const r = await rawReq("POST", CLOCK_IN, { sid, body: bodyStr, date, signature });
        const j = safeJson(r.body);
        if (j && j.result === "ok") {
            const d = j.data || {};
            const rw = d.reward_name || (d.prize && d.prize.name) || (d.reward && d.reward.name) || "";
            $.results.push(`✅ ${tag}:成功${rw ? " " + rw : ""}`);
        } else {
            const st = classify(j && j.msg, "已打卡");
            $.results.push(`${st.e} ${tag}:${st.t}`);
            if (st.e !== "✅") debug(`${tag} 响应: ${r.body.slice(0, 300)}`);
        }

        await claimClockInRewards(infBody, sid, s_key, ss);
    } catch (e) {
        $.results.push(`❌ ${tag}:异常`);
        $.log(`[ERROR] ${tag}: ${e}`);
    }
}

async function claimClockInRewards(infBody, sid, s_key, ss) {
    try {
        const list = (((safeJson(infBody) || {}).data || {}).reward_list || {}).list || [];
        const pend = list.filter((rw) => rw && rw.reward_status === 1);
        debug(`奖励表(${list.length}): ${list.map((rw) => `${rw.reward_id}=${rw.reward_status}`).join(" ") || "空"}`);
        if (!pend.length) {
            $.results.push(list.length ? "ℹ️ 昨日奖励:暂无可领(未到开放时间)" : "⚠️ 领奖:未取到奖励列表");
            return;
        }

        const got = [], fail = [];
        for (const rw of pend) {
            const body = canonicalJSON({ client_type: 1, reward_id: rw.reward_id, clock_in_time: rw.clock_in_time });
            const date = new Date().toUTCString();
            const signature = hmacSha256Hex(s_key + md5Hex(body) + date, ss);
            const r = await rawReq("POST", CLOCK_REWARD, { sid, body, date, signature });
            const j = safeJson(r.body);
            const name = rw.sku_name || rw.mb_name || "奖励";
            if (j && j.result === "ok" && (j.data || {}).reward_status === true) got.push(name);
            else { fail.push(name); debug(`领奖 ${name}(${rw.reward_id}) 失败: ${(r.body || "").slice(0, 200)}`); }
            await sleep(jitter(ACTION_GAP));
        }
        if (got.length) $.results.push(`✅ 领昨日奖励:${got.join("、")}`);
        if (fail.length) $.results.push(`⚠️ 待领奖励未领成功(可去小程序手动领):${fail.join("、")}`);
    } catch (e) {
        $.log(`[ERROR] 领昨日奖励: ${e}`);
    }
}

async function taskAppletLottery() {
    const tag = "小程序抽奖";
    try {
        const sid = ACTIVE_SID || $.getdata(CK_KEY);
        const t = await rawReq("GET", APPLET.lottery_times, { sid });
        const tj = safeJson(t.body);
        if (!tj || tj.result !== "ok") {
            const msg = (tj && tj.msg) || (t.body || "").slice(0, 60) || "无响应";
            $.results.push(`⚠️ ${tag}:次数查询失败(${msg})`);
            debug(`${tag} 次数响应: ${(t.body || "").slice(0, 200)}`);
            return;
        }
        const times = Number(tj.data) || 0;
        if (times < 1) { $.results.push(`✅ ${tag}:无可用次数(次数靠浏览任务获得,需在微信小程序里做)`); return; }

        const list = await fetchPageInfo(APPLET);
        const node = (list || []).find((c) => c && c.lottery_v2 && Array.isArray(c.lottery_v2.lottery_list));
        if (!node) {
            $.results.push(`⚠️ ${tag}:未找到抽奖组件(可能已换期)`);
            debug(`${tag} page_info: ${JSON.stringify(list).slice(0, 300)}`);
            return;
        }
        const sess = (node.lottery_v2.lottery_list || []).find((s) => s && s.session_id != null) || {};
        await drawLottery(tag, APPLET, node, sess.session_id != null ? sess.session_id : 1, times, false);
    } catch (e) {
        $.results.push(`❌ ${tag}:异常`);
        $.log(`[ERROR] ${tag}: ${e}`);
    }
}

function rawReq(method, url, { sid, body, date, signature } = {}) {
    const headers = { "User-Agent": MINI_UA, "Accept": "*/*", "X-CSRFToken": "1234567890" };
    if (sid) headers["Cookie"] = `wps_sid=${sid};csrf=1234567890`;
    if (body) headers["Content-Type"] = "application/json";
    if (signature) headers["Signature"] = signature;
    if (date) headers["Date"] = date;
    return new Promise((resolve, reject) => {
        const cb = (err, resp, data) =>
            err ? reject(err) : resolve({ status: (resp && (resp.status || resp.statusCode)) || 0, body: data || "" });
        method === "POST" ? $.post({ url, headers, body }, cb) : $.get({ url, headers, body }, cb);
    });
}

function canonicalJSON(obj) {
    const sorted = Object.keys(obj).sort().reduce((a, k) => ((a[k] = obj[k]), a), {});
    return JSON.stringify(sorted);
}

function requestUserId(sid) {
    const headers = {
        "User-Agent": UA,
        "Cookie": `wps_sid=${sid}; wps_sids=${sid}`,
        "Origin": "https://personal-act.wps.cn",
        "Referer": "https://personal-act.wps.cn/",
    };
    return new Promise((resolve, reject) => {
        $.get({ url: ISLOGIN, headers }, (err, resp, data) => {
            if (err) return reject(err);
            resolve({ status: (resp && (resp.status || resp.statusCode)) || 0, body: data || "" });
        });
    });
}

function httpReq(method, url, { body, token, pc } = {}) {
    const sid = ACTIVE_SID || $.getdata(CK_KEY);
    const headers = {
        "User-Agent": pc ? PC_UA : UA,
        "Cookie": ACTIVE_CK || `wps_sid=${sid}; wps_sids=${sid}`,
        "Origin": "https://personal-act.wps.cn",
        "Referer": pc ? TC_REFERER : "https://personal-act.wps.cn/",
    };
    if (body) headers["Content-Type"] = "application/json";
    if (token) headers["token"] = token;
    if (pc && ACTIVE_CSRF) headers["X-Act-CSRFToken"] = ACTIVE_CSRF;
    return new Promise((resolve, reject) => {
        const req = { url, headers, body };
        const cb = (err, resp, data) => {
            if (err) return reject(err);
            resolve({ status: (resp && (resp.status || resp.statusCode)) || 0, body: data || "" });
        };
        method === "POST" ? $.post(req, cb) : $.get(req, cb);
    });
}

function safeJson(s) {
    try { return JSON.parse(s); } catch (e) { return null; }
}

function classify(msg, doneLabel) {
    const m = String(msg || "");
    if (!m) return { e: "⚠️", t: "未成功" };
    if (/已签|has sign/i.test(m)) return { e: "✅", t: "已签到" };
    if (/Duplicate entry|已领取|已申领|已参与|已参加|已报名|已完成|重复|repeat|already/i.test(m)) return { e: "✅", t: doneLabel || "已完成" };
    if (/无.*次数|没有.*次数|次数.*(用完|不足|为0)|达到?.*上限|已达.*上限|超(出|过).*次数|reach limit|out of limit|上限/i.test(m)) return { e: "✅", t: "已达上限" };
    if (/售罄|领完|抢完|发完|抢光|领光|out of stock|库存(不足)?|no stock|sold out|stock/i.test(m)) return { e: "⚠️", t: "已领完" };
    if (/资格|不满足|未满足|不符合|无权限|没有权限|没有资格|not (match|qualified)|不在.*(范围|名单)|未达条件/i.test(m)) return { e: "⚠️", t: "没资格" };
    return { e: "⚠️", t: m.length > 60 ? m.slice(0, 60) + "…" : m };
}

function beijingDate() {
    const d = new Date(Date.now() + 8 * 3600 * 1000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function jitter([min, max]) {
    return Math.floor((min + Math.random() * (max - min)) * 1000);
}

function genAesKey() {
    const cs = "0123456789abcdefghijklmnopqrstuvwxyz";
    let s = "";
    for (let i = 0; i < 22; i++) s += cs[Math.floor(Math.random() * 36)];
    return s + Math.floor(Date.now() / 1000);
}

function modpow(base, exp, mod) {
    let result = 1n;
    base %= mod;
    while (exp > 0n) {
        if (exp & 1n) result = (result * base) % mod;
        exp >>= 1n;
        base = (base * base) % mod;
    }
    return result;
}

function rsaEncryptB64(msg, pemB64) {
    const pem = bytesUtf8(b64dec(pemB64));
    const der = b64dec(pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, ""));
    let p = 0;
    p++;
    let sl = der[p++];
    if (sl & 0x80) p += sl & 0x7f;
    const readInt = () => {
        p++;
        let l = der[p++];
        if (l & 0x80) {
            let nb = l & 0x7f;
            l = 0;
            for (let i = 0; i < nb; i++) l = (l << 8) | der[p++];
        }
        let v = 0n;
        for (let i = 0; i < l; i++) v = (v << 8n) | BigInt(der[p++]);
        return v;
    };
    const n = readInt(), e = readInt();
    let k = 0, nn = n;
    while (nn > 0n) { k++; nn >>= 8n; }

    const m = utf8Bytes(msg);
    const psLen = k - 3 - m.length;
    if (psLen < 8) throw new Error("RSA 明文过长");
    const block = [0x00, 0x02];
    for (let i = 0; i < psLen; i++) block.push(1 + Math.floor(Math.random() * 255));
    block.push(0x00);
    for (const b of m) block.push(b);

    let mm = 0n;
    for (const b of block) mm = (mm << 8n) | BigInt(b);
    let hex = modpow(mm, e, n).toString(16);
    while (hex.length < k * 2) hex = "0" + hex;
    const cb = [];
    for (let i = 0; i < hex.length; i += 2) cb.push(parseInt(hex.substr(i, 2), 16));
    return b64enc(cb);
}

const _SB = [];
(function () {
    const p = [], l = [];
    let x = 1;
    for (let i = 0; i < 256; i++) {
        p[i] = x;
        x ^= (x << 1) ^ (x & 0x80 ? 0x11b : 0);
        p[i] &= 0xff;
    }
    for (let i = 0; i < 255; i++) l[p[i]] = i;
    let si = 0;
    for (let i = 0; i < 256; i++) {
        let xx = si ? p[255 - l[si]] : 0;
        let t = xx;
        for (let r = 0; r < 4; r++) {
            t = ((t << 1) | (t >>> 7)) & 0xff;
            xx ^= t;
        }
        xx = (xx ^ 0x63) & 0xff;
        _SB[si] = xx;
        si = si ? p[(l[si] + 1) % 255] : 1;
    }
})();
const _RCON = [1, 2, 4, 8, 16, 32, 64, 128, 27, 54];
function _xt(a) { return ((a << 1) ^ (a & 0x80 ? 0x11b : 0)) & 0xff; }
function _mul(a, b) {
    let r = 0;
    for (; b; b >>= 1) {
        if (b & 1) r ^= a;
        a = _xt(a);
    }
    return r;
}
function _keyExp(key) {
    const Nk = key.length / 4, Nr = Nk + 6, w = [];
    for (let i = 0; i < Nk; i++) w[i] = [key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]];
    for (let i = Nk; i < 4 * (Nr + 1); i++) {
        let t = w[i - 1].slice();
        if (i % Nk === 0) {
            t.push(t.shift());
            t = t.map((b) => _SB[b]);
            t[0] ^= _RCON[i / Nk - 1];
        } else if (Nk > 6 && i % Nk === 4) {
            t = t.map((b) => _SB[b]);
        }
        w[i] = w[i - Nk].map((b, j) => b ^ t[j]);
    }
    return { w, Nr };
}
function _enc(inp, ks) {
    let s = [[], [], [], []];
    for (let i = 0; i < 16; i++) s[i % 4][i >> 2] = inp[i];
    const ar = (k) => {
        for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) s[r][c] ^= k[c][r];
    };
    ar(ks.w.slice(0, 4));
    for (let rd = 1; rd < ks.Nr; rd++) {
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) s[r][c] = _SB[s[r][c]];
        for (let r = 1; r < 4; r++) {
            const row = s[r].slice();
            for (let c = 0; c < 4; c++) s[r][c] = row[(c + r) % 4];
        }
        for (let c = 0; c < 4; c++) {
            const a = [s[0][c], s[1][c], s[2][c], s[3][c]];
            s[0][c] = _mul(a[0], 2) ^ _mul(a[1], 3) ^ a[2] ^ a[3];
            s[1][c] = a[0] ^ _mul(a[1], 2) ^ _mul(a[2], 3) ^ a[3];
            s[2][c] = a[0] ^ a[1] ^ _mul(a[2], 2) ^ _mul(a[3], 3);
            s[3][c] = _mul(a[0], 3) ^ a[1] ^ a[2] ^ _mul(a[3], 2);
        }
        ar(ks.w.slice(4 * rd, 4 * rd + 4));
    }
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) s[r][c] = _SB[s[r][c]];
    for (let r = 1; r < 4; r++) {
        const row = s[r].slice();
        for (let c = 0; c < 4; c++) s[r][c] = row[(c + r) % 4];
    }
    ar(ks.w.slice(4 * ks.Nr, 4 * ks.Nr + 4));
    const out = [];
    for (let i = 0; i < 16; i++) out[i] = s[i % 4][i >> 2];
    return out;
}
function utf8Bytes(str) {
    const out = [];
    for (const ch of unescape(encodeURIComponent(str))) out.push(ch.charCodeAt(0));
    return out;
}
function bytesUtf8(b) {
    let s = "";
    for (const x of b) s += String.fromCharCode(x);
    return decodeURIComponent(escape(s));
}
const _B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function b64enc(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length; i += 3) {
        const b0 = bytes[i], b1 = bytes[i + 1], b2 = bytes[i + 2];
        s += _B64[b0 >> 2] + _B64[((b0 & 3) << 4) | (b1 >> 4)];
        s += i + 1 < bytes.length ? _B64[((b1 & 15) << 2) | (b2 >> 6)] : "=";
        s += i + 2 < bytes.length ? _B64[b2 & 63] : "=";
    }
    return s;
}
function b64dec(str) {
    const out = [];
    let buf = 0, bits = 0;
    for (const c of str) {
        if (c === "=") break;
        const v = _B64.indexOf(c);
        if (v < 0) continue;
        buf = (buf << 6) | v;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            out.push((buf >> bits) & 0xff);
        }
    }
    return out;
}
function aesEncrypt(plain, keyStr, ivStr) {
    const ks = _keyExp(utf8Bytes(keyStr));
    const data = utf8Bytes(plain);
    const pad = 16 - (data.length % 16);
    for (let i = 0; i < pad; i++) data.push(pad);
    let prev = utf8Bytes(ivStr);
    const out = [];
    for (let i = 0; i < data.length; i += 16) {
        const blk = data.slice(i, i + 16).map((b, j) => b ^ prev[j]);
        prev = _enc(blk, ks);
        out.push(...prev);
    }
    return b64enc(out);
}

function md5Hex(str) {
    const rol = (n, c) => (n << c) | (n >>> (32 - c));
    const s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
        5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
        4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
        6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
    const K = [];
    for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    const m = utf8Bytes(str);
    const origLen = m.length;
    m.push(0x80);
    while (m.length % 64 !== 56) m.push(0);
    const bitLen = origLen * 8;
    for (let i = 0; i < 8; i++) m.push(Math.floor(bitLen / Math.pow(2, 8 * i)) & 0xff);
    for (let off = 0; off < m.length; off += 64) {
        const M = [];
        for (let i = 0; i < 16; i++)
            M[i] = (m[off + i * 4]) | (m[off + i * 4 + 1] << 8) | (m[off + i * 4 + 2] << 16) | (m[off + i * 4 + 3] << 24);
        let A = a0, B = b0, C = c0, D = d0;
        for (let i = 0; i < 64; i++) {
            let F, g;
            if (i < 16) { F = (B & C) | (~B & D); g = i; }
            else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
            else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
            else { F = C ^ (B | ~D); g = (7 * i) % 16; }
            F = (F + A + K[i] + M[g]) >>> 0;
            A = D; D = C; C = B;
            B = (B + rol(F, s[i])) >>> 0;
        }
        a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
    }
    const hexLE = (n) => { let h = ""; for (let i = 0; i < 4; i++) h += ((n >>> (i * 8)) & 0xff).toString(16).padStart(2, "0"); return h; };
    return hexLE(a0) + hexLE(b0) + hexLE(c0) + hexLE(d0);
}

function sha256Bytes(bytes) {
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    let h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const m = bytes.slice();
    const origLen = m.length;
    m.push(0x80);
    while (m.length % 64 !== 56) m.push(0);
    const bitLen = origLen * 8;
    for (let i = 7; i >= 0; i--) m.push(Math.floor(bitLen / Math.pow(2, 8 * i)) & 0xff);
    const rotr = (n, c) => (n >>> c) | (n << (32 - c));
    for (let off = 0; off < m.length; off += 64) {
        const w = [];
        for (let i = 0; i < 16; i++)
            w[i] = ((m[off + i * 4] << 24) | (m[off + i * 4 + 1] << 16) | (m[off + i * 4 + 2] << 8) | (m[off + i * 4 + 3])) >>> 0;
        for (let i = 16; i < 64; i++) {
            const s0 = (rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)) >>> 0;
            const s1 = (rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)) >>> 0;
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
        }
        let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
        for (let i = 0; i < 64; i++) {
            const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
            const ch = ((e & f) ^ (~e & g)) >>> 0;
            const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
            const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
            const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
            const t2 = (S0 + maj) >>> 0;
            hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
        }
        h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
        h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }
    const out = [];
    for (const x of h) out.push((x >>> 24) & 0xff, (x >>> 16) & 0xff, (x >>> 8) & 0xff, x & 0xff);
    return out;
}

const bytesToHex = (b) => b.map((x) => x.toString(16).padStart(2, "0")).join("");

function hmacSha256Hex(msgStr, keyStr) {
    let key = utf8Bytes(keyStr);
    if (key.length > 64) key = sha256Bytes(key);
    while (key.length < 64) key.push(0);
    const o = [], i = [];
    for (let j = 0; j < 64; j++) { o.push(key[j] ^ 0x5c); i.push(key[j] ^ 0x36); }
    const inner = sha256Bytes(i.concat(utf8Bytes(msgStr)));
    return bytesToHex(sha256Bytes(o.concat(inner)));
}

function Env(s) {
    this.name = s;
    this.log = (...a) => console.log(a.join("\n"));
    this.msg = (t = this.name, s = "", b = "") => {
        try {
            $notification.post(t, s, b);
        } catch (e) {
            this.log(`[WARN] 通知发送失败(不影响任务): ${e}`);
        }
        console.log(["", "====📣" + t + "====", s, b].filter(Boolean).join("\n"));
    };
    this.getdata = (k) => $persistentStore.read(k);
    this.setdata = (v, k) => $persistentStore.write(v, k);
    this.get = (req, cb) => this.send(req, "GET", cb);
    this.post = (req, cb) => this.send(req, "POST", cb);
    this.send = (req, method, cb) => {
        const fn = method === "POST" ? $httpClient.post : $httpClient.get;
        fn(req, (err, resp, data) => {
            if (resp) { resp.body = data; resp.statusCode = resp.status || resp.statusCode; }
            cb(err, resp, data);
        });
    };
    this.done = (v = {}) => { if (typeof $done !== "undefined") $done(v); };
}