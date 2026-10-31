// 三国咸话（三国杀社区）签到｜Loon：http-request 抓登录态 + cron 签到
// 签到 POST wxforum.sanguosha.cn/api/user/signIn；任务接口在 api-xh.sanguosha.cn
const $ = new Env('三国咸话签到');

const HOSTS = ['https://wxforum.sanguosha.cn', 'https://api-xh.sanguosha.cn'];
const SIGN_PATH = ['/api/user/signIn', '/sgxh/api/user/signIn'];
const PROFILE_PATH = ['/api/profile', '/sgxh/api/profile'];

const TASK_DEFAULT = { share: true, views: 3, claim: true, heat: true, shareTaskId: '1004', viewTaskId: '1003' };
const STORE_KEY = 'sgx_xianhua_token_v1';
const cfg = { notify: true, timeout: 15000 };

function storeRead() {
  try {
    let raw = null;
    if (typeof $persistentStore !== 'undefined' && $persistentStore) {
      raw = $persistentStore.read(STORE_KEY);
    } else if (typeof $prefs !== 'undefined' && $prefs) {
      raw = $prefs.valueForKey(STORE_KEY);
    }
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function storeWrite(obj) {
  try {
    const raw = JSON.stringify(obj);
    if (typeof $persistentStore !== 'undefined' && $persistentStore) {
      $persistentStore.write(raw, STORE_KEY);
    } else if (typeof $prefs !== 'undefined' && $prefs) {
      $prefs.setValueForKey(raw, STORE_KEY);
    }
  } catch (e) {}
}

function b64urlDecode(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  if (typeof Buffer !== 'undefined') return Buffer.from(s, 'base64').toString('utf8');
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

function jwtPayload(token) {
  try { return JSON.parse(b64urlDecode(String(token).split('.')[1] || '')); } catch (e) { return null; }
}

function jwtExp(token) {
  const p = jwtPayload(token);
  return p && p.exp ? Number(p.exp) * 1000 : 0;
}

function jwtSub(token) {
  const p = jwtPayload(token);
  return p && p.sub != null ? String(p.sub) : '';
}

function headerOf(headers, name) {
  if (!headers) return '';
  const want = String(name).toLowerCase();
  const keys = Object.keys(headers);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === want) return String(headers[keys[i]] || '');
  }
  return '';
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function parseArgs(raw) {
  let arg = raw || (typeof $argument !== 'undefined' ? $argument : '');
  const out = { token: '', appCode: '2', notify: true, tasks: Object.assign({}, TASK_DEFAULT) };

  if (arg && typeof arg === 'object' && !Array.isArray(arg)) {
    applyObj(out, arg);
    return out;
  }
  if (typeof arg === 'string' && arg.trim()) {
    const s = arg.trim();
    if (s.startsWith('{')) {
      try { applyObj(out, JSON.parse(s)); return out; } catch (e) {}
      applyObj(out, looseObj(s));
      return out;
    }
    const a = parseTokenLine(s);
    if (a) { out.token = a.token; out.appCode = a.appCode; }
    return out;
  }
  return out;
}

// Loon 的 argument 常写成 {k:v} 这种非标准 JSON，需要宽松解析
function looseObj(str) {
  const o = {};
  const body = String(str).replace(/^\s*\{/, '').replace(/\}\s*$/, '');
  body.split(/,(?=[^,"']*(?:["'][^"']*["'][^,"']*)*$)/).forEach((seg) => {
    const i = seg.indexOf(':');
    if (i < 0) return;
    const k = seg.slice(0, i).trim().replace(/^["']|["']$/g, '');
    let v = seg.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (v === 'true') v = true;
    else if (v === 'false') v = false;
    if (k) o[k] = v;
  });
  return o;
}

function applyObj(out, o) {
  const raw = o.cookie || o.token || o.token1 || o.url || '';
  if (raw) {
    const a = parseTokenLine(String(raw), o.appCode || o.appCode1);
    if (a) { out.token = a.token; out.appCode = a.appCode; }
  }
}

function parseTokenLine(input, forceCode) {
  let s = String(input).trim().replace(/^["']|["']$/g, '');
  if (!s) return null;
  let token = '';
  let code = forceCode;

  if (/^https?:\/\//i.test(s)) {
    const i = s.indexOf('?');
    if (i >= 0) {
      s.slice(i + 1).split(/[&#]/).forEach((kv) => {
        const j = kv.indexOf('=');
        if (j < 0) return;
        const k = kv.slice(0, j).toLowerCase();
        const v = decodeURIComponent(kv.slice(j + 1));
        if (k === 'token') token = v;
        if (k === 'c') code = v;
      });
    }
  } else if (/^(cookie|token|appCode|c)=/i.test(s)) {
    s.split(/[&,]/).forEach((kv) => {
      const i = kv.indexOf('=');
      if (i < 0) return;
      const k = kv.slice(0, i).trim().toLowerCase();
      const v = kv.slice(i + 1).trim();
      if (k === 'token' || k === 'cookie') token = v;
      if (k === 'c' || k === 'appcode') code = v;
    });
  } else {
    token = s;
  }

  token = String(token || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  return { token, appCode: String(code || '2') };
}

function http(method, url, headers, body) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (r) => { if (!done) { done = true; resolve(r); } };
    const base = Object.assign({
      'Content-Type': 'application/json',
      'App-System': 'weixin',
      'App-Code': '2',
      'App-Version': '8.2.1',
      'AppVersion-Code': '821',
      platform: 'weixin',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) MicroMessenger/8.0.63',
    }, headers || {});

    if (typeof $httpClient !== 'undefined' && $httpClient) {
      const opts = { url, headers: base, timeout: cfg.timeout };
      const cb = (err, resp, data) => {
        if (err) return finish({ ok: false, error: String(err), status: 0 });
        finish(handleResp(resp && resp.status, data));
      };
      if (String(method).toUpperCase() === 'POST') $httpClient.post(Object.assign({ body }, opts), cb);
      else $httpClient.get(opts, cb);
    } else if (typeof $task !== 'undefined' && $task) {
      const opts = { url, headers: base, timeout: cfg.timeout };
      const p = String(method).toUpperCase() === 'POST'
        ? $task.fetch(Object.assign({ method: 'POST', body }, opts))
        : $task.fetch(opts);
      p.then((r) => finish(handleResp(r.statusCode, r.body)))
        .catch((e) => finish({ ok: false, error: String(e), status: 0 }));
    } else if (typeof fetch === 'function') {
      fetch(url, { method, headers: base, body: String(method).toUpperCase() === 'POST' ? (body == null ? '' : body) : undefined })
        .then(async (r) => finish(handleResp(r.status, await r.text())))
        .catch((e) => finish({ ok: false, error: String(e), status: 0 }));
    } else {
      finish({ ok: false, error: '$httpClient 不可用', status: 0 });
    }
  });
}

function handleResp(status, data) {
  let text = data;
  if (typeof text !== 'string') {
    try { text = JSON.stringify(text); } catch (e) { text = String(text); }
  }
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}
  return { ok: true, status: Number(status) || 0, text: text || '', json };
}

async function callWithFallback(method, paths, headers, body) {
  let last = null;
  for (let i = 0; i < HOSTS.length; i++) {
    const r = await http(method, HOSTS[i] + paths[i], headers, body);
    last = r;
    if (!r.ok) continue;
    if (r.status === 404) continue;
    if (r.json && (r.json.code === 0 || r.json.code === 1000)) return r;
    if (r.status >= 500) continue;
    return r;
  }
  return last;
}

async function taskCall(method, path, headers, body) {
  let last = null;
  for (let i = HOSTS.length - 1; i >= 0; i--) {
    const r = await http(method, HOSTS[i] + path, headers, body);
    last = r;
    if (r.ok && r.status !== 404) return r;
  }
  return last;
}

function readProfile(json) {
  const d = (json && json.data) || {};
  const u = d.userinfo || d;
  return {
    nick: u.nick_name || u.nickname || u.nickName || '',
    coin: u.coin,
    isSign: Number(u.is_sign) > 0,
    signCount: u.signCount,
  };
}

async function fetchTasks(headers) {
  const r = await taskCall('GET', '/task/sgxh-task/taskList', headers);
  const j = r && r.json;
  if (!j || (j.code !== 0 && j.code !== 1000) || !Array.isArray(j.data)) return null;
  return j.data;
}

function findTask(list, id) {
  return (list || []).find((t) => String(t.taskId) === String(id));
}

function beanOf(task) {
  let n = 0;
  (task.rewardInfos || []).forEach((x) => { if (Number(x.type) === 2) n += Number(x.amount) || 0; });
  return n;
}

async function viewOnce(headers) {
  const r = await taskCall('POST', '/task/sgxh-task/updateTaskProgress', headers, JSON.stringify({ operateType: 1, gameId: 2 }));
  return !!(r && r.ok && r.json && (r.json.code === 0 || r.json.code === 1000));
}

async function runTasks(headers, opts, logs) {
  let claimedBeans = 0;
  let claimedNames = [];

  if (opts.share) {
    const cur = findTask(await fetchTasks(headers), opts.shareTaskId);
    const done = cur && (Number(cur.progressStatus) === 1 || Number(cur.progressStatus) === 2 ||
      Number(cur.currentProgressValue) >= Number(cur.targetProgressValue));
    if (done) {
      logs.push('分享任务：今日已完成');
    } else {
      const r = await taskCall('POST', '/task/sgxh-task/updateTaskProgress', headers, JSON.stringify({ operateType: 2, gameId: 2 }));
      const ok = !!(r && r.ok && r.json && (r.json.code === 0 || r.json.code === 1000));
      if (!ok) {
        logs.push('分享任务：上报失败');
      } else {
        const now = findTask(await fetchTasks(headers), opts.shareTaskId);
        const c = now ? Number(now.currentProgressValue) || 0 : 1;
        const t = now ? Number(now.targetProgressValue) || 1 : 1;
        logs.push(c >= t ? `分享任务：已完成（${c}/${t}）` : `分享任务：已上报（${c}/${t}）`);
      }
    }
  }

  if (opts.views > 0) {
    const before = findTask(await fetchTasks(headers), opts.viewTaskId);
    const target = before ? Number(before.targetProgressValue) || 3 : 3;
    const cur = before ? Number(before.currentProgressValue) || 0 : 0;
    const need = Math.max(0, Math.min(opts.views, target - cur));
    let added = 0;
    for (let i = 0; i < need; i++) {
      if (await viewOnce(headers)) added++;
      await wait(800);
    }
    if (need === 0) {
      logs.push(`浏览任务：今日已满（${cur}/${target}）`);
    } else {
      const after = findTask(await fetchTasks(headers), opts.viewTaskId);
      const now = after ? Number(after.currentProgressValue) || 0 : cur + added;
      logs.push(`浏览任务：+${added} 次（${now}/${target}）`);
    }
  }

  if (opts.heat) {
    const pv = findTask(await fetchTasks(headers), '1006');
    const hp = await taskCall('GET', '/task/heatValue/progress', headers);
    const hd = hp && hp.json && hp.json.data;
    const tot = hd ? parseFloat(hd.heatValue) || 0 : 0;

    if (!pv) {
      logs.push(`热力竹：任务未下发（热力 ${tot}）`);
    } else {
      const st = Number(pv.progressStatus);
      const prog = `${Number(pv.currentProgressValue) || 0}/${Number(pv.targetProgressValue) || 1}`;
      if (st === 1 || st === 2) logs.push(`热力竹：本周已完成（${prog}，热力 ${tot}）`);
      else logs.push(`热力竹：未完成（${prog}）— 需在小程序内手动打开一次热力竹页`);
    }

    if (hd) {
      const hv = parseFloat(hd.heatValue) || 0;
      const ok = (hd.rewards || []).filter((r) => !r.received && Number(r.rewardType) === 1 &&
        parseFloat(r.heatThreshold) > 0 && parseFloat(r.heatThreshold) <= hv);
      for (let i = 0; i < ok.length; i++) {
        // 参数名是 id；传 rewardId 会报「奖励id不能为空」
        await taskCall('POST', '/task/heatValue/rewardReceive', headers, JSON.stringify({ id: ok[i].id, rewardType: 1 }));
        claimedBeans += Number(ok[i].rewardContent) || 0;
        await wait(500);
      }
      logs.push(ok.length ? `热力奖励：领取 ${ok.length} 档` : `热力奖励：暂无可领档位（热力 ${hv}）`);
    }
  }

  // 1001 需真实点赞他人帖子，跳过
  if (opts.claim) {
    const list = await fetchTasks(headers);
    const claimable = (list || []).filter((t) => Number(t.progressStatus) === 1 && t.taskProgressId && String(t.taskId) !== '1001');
    for (let i = 0; i < claimable.length; i++) {
      const t = claimable[i];
      const r = await taskCall('POST', '/task/sgxh-task/getReward', headers, JSON.stringify({ taskProgressId: t.taskProgressId }));
      const j = r && r.json;
      if (j && (j.code === 0 || j.code === 1000)) {
        claimedNames.push(t.taskDesc || String(t.taskId));
        claimedBeans += beanOf(t);
      }
      await wait(500);
    }
    logs.push(claimedNames.length
      ? `领取奖励：${claimedNames.join('、')}（+${claimedBeans} 咸豆）`
      : '领取奖励：暂无可领');
  }

  return claimedBeans;
}

function handleCapture() {
  const req = (typeof $request !== 'undefined' && $request) || {};
  const auth = headerOf(req.headers, 'Authorization');
  const token = auth.replace(/^Bearer\s+/i, '').trim();

  if (!token || token.split('.').length !== 3) { $.done({}); return; }

  const exp = jwtExp(token);
  if (exp && exp < Date.now()) {
    console.log('[抓取] token 已过期，忽略');
    $.done({});
    return;
  }

  const prev = storeRead();
  const changed = !prev || prev.token !== token;
  const sub = jwtSub(token);
  const appCode = headerOf(req.headers, 'App-Code') || '2';

  storeWrite({ token, appCode: String(appCode), sub, ts: Date.now(), exp: exp || 0 });

  if (changed) {
    console.log(`[抓取] 已保存登录态${sub ? '，账号 ' + sub : ''}`);
    if (typeof $notification !== 'undefined' && $notification) {
      $notification.post('三国咸话', '已自动获取登录态',
        `${sub ? '账号 ' + sub + '，' : ''}有效期至 ${exp ? new Date(exp).toLocaleDateString() : '约 30 天'}，之后无需手动填写`);
    }
  }
  $.done({});
}

function loadAccount(conf) {
  if (conf.token) {
    return { token: conf.token, appCode: conf.appCode || '2', sub: jwtSub(conf.token), manual: true };
  }
  const st = storeRead();
  if (!st || !st.token) return null;
  if (st.exp && st.exp < Date.now()) return null;
  return { token: st.token, appCode: String(st.appCode || '2'), sub: st.sub || jwtSub(st.token), manual: false };
}

async function runCron() {
  const conf = parseArgs();
  const acc = loadAccount(conf);

  if (!acc) {
    console.log('暂无登录态：请先打开一次小程序「三国咸话」');
    if (conf.notify && typeof $notification !== 'undefined' && $notification) {
      $notification.post('三国咸话签到', '暂无登录态', '打开一次小程序「三国咸话」即可自动获取，无需手动填 token');
    }
    $.done();
    return;
  }
  if (!conf.tasks) conf.tasks = Object.assign({}, TASK_DEFAULT);

  const logs = [];
  const headers = { 'App-Code': String(acc.appCode), Authorization: 'Bearer ' + acc.token };

  try {
    const prof = await callWithFallback('GET', PROFILE_PATH, headers);
    if (!prof || !prof.ok) {
      logs.push('网络错误：' + ((prof && prof.error) || 'unknown'));
      return finish(logs, conf, false);
    }
    const pj = prof.json;
    if (!pj) { logs.push('响应异常'); return finish(logs, conf, false); }
    if (pj.code !== 0 && pj.code !== 1000) {
      const m = pj.msg || pj.message || pj.data;
      logs.push(/token|登录|1003|401/i.test(String(m) + prof.status) ? '鉴权失败，登录态可能已失效（重新打开一次小程序即可）' : '查询状态失败：' + m);
      return finish(logs, conf, false);
    }

    const before = readProfile(pj);
    logs.push(`状态：${before.nick || '已登录'}${acc.sub ? '（' + acc.sub + '）' : ''}｜咸豆 ${before.coin != null ? before.coin : '?'}｜本月已签 ${before.signCount != null ? before.signCount : '?'} 天`);

    if (before.isSign) {
      logs.push('签到：今日已签到');
    } else {
      const r = await callWithFallback('POST', SIGN_PATH, headers, '');
      const rj = r && r.json;
      if (!r || !r.ok) {
        logs.push('签到失败：网络错误');
      } else if (!rj) {
        logs.push('签到失败：响应异常');
      } else if (rj.code === 0 || rj.code === 1000) {
        const d = rj.data;
        const num = d && !Array.isArray(d) && d.num != null ? d.num : null;
        logs.push(num != null ? `签到成功：咸豆 +${num}` : '签到：今日已签过（幂等，不加豆）');
      } else {
        logs.push('签到失败：' + (rj.msg || rj.message || rj.data));
      }
    }

    await runTasks(headers, conf.tasks, logs);

    let coin = before.coin;
    const after = await callWithFallback('GET', PROFILE_PATH, headers);
    if (after && after.json && (after.json.code === 0 || after.json.code === 1000)) coin = readProfile(after.json).coin;
    const delta = before.coin != null && coin != null ? coin - before.coin : null;
    logs.push(`咸豆余额：${coin != null ? coin : '?'}${delta != null && delta > 0 ? `（本次 +${delta}）` : ''}`);

    return finish(logs, conf, true, coin, delta);
  } catch (e) {
    logs.push('异常：' + (e && e.message ? e.message : e));
    return finish(logs, conf, false);
  }
}

function finish(logs, conf, ok, coin, delta) {
  logs.forEach((l) => console.log(l));
  console.log(ok ? '== 完成 ==' : '== 失败 ==');

  if (conf.notify && typeof $notification !== 'undefined' && $notification) {
    const head = logs.filter((l) => /^签到/.test(l))[0] || (ok ? '完成' : '失败');
    const tasks = logs.filter((l) => /^(分享任务|浏览任务|热力竹|热力奖励|领取奖励|网络|响应|鉴权|异常)/.test(l));
    const body = [head, ...tasks].join('\n');
    const title = ok
      ? (delta != null && delta > 0 ? `+${delta} 咸豆` : '已完成')
      : '执行失败';
    $notification.post('三国咸话签到', title, body);
  }
  $.done();
}

if (typeof $request !== 'undefined' && $request) {
  handleCapture();
} else {
  runCron();
}

function Env(name) {
  this.name = name;
  this.log = (...a) => console.log(...a);
  this.done = () => { if (typeof $done === 'function') $done({}); };
  return this;
}
