/*
 * Linux.Do 助手 for Loon
 * 功能：
 * 1. 自动抓取 Cookie (需手动访问一次 https://linux.do)
 * 2. 每日访问保持活跃
 * 3. 查询 Connect 达标情况
 * * 使用方法：
 * 1. 配置好插件。
 * 2. 确保 MitM 开启并包含 hostname = linux.do
 * 3. Safari 打开 https://linux.do 并登录，等待顶部弹出“Cookie获取成功”。
 */

const $ = new Env("Linux.Do");
const CK_KEY = "linuxdo_cookie";

// 脚本入口
(async () => {
    if (typeof $request !== "undefined") {
        getCookie();
    } else {
        await checkIn();
    }
    $.done();
})();

// 1. 获取 Cookie
function getCookie() {
    if ($request.headers) {
        // Loon 的 header key 可能是小写
        const cookie = $request.headers["Cookie"] || $request.headers["cookie"];
        if (cookie && cookie.includes("_forum_session")) {
            $.write(cookie, CK_KEY);
            $.notify("Linux.Do", "✅ Cookie 获取成功", "您的会话已保存，脚本将以此身份运行。");
        }
    }
}

// 2. 签到与查询流程
async function checkIn() {
    const cookie = $.read(CK_KEY);
    if (!cookie) {
        $.notify("Linux.Do", "❌ 失败", "未找到 Cookie，请先在浏览器访问 linux.do 进行获取。");
        return;
    }

    // 步骤1：访问主页 (模拟活跃)
    await httpRequest("GET", "https://linux.do/", cookie);
    
    // 步骤2：访问 Connect 页面获取数据
    const connectData = await httpRequest("GET", "https://connect.linux.do/", cookie);
    
    if (connectData) {
        const info = parseConnectInfo(connectData);
        if (info) {
            const notifySwitch = $.getArgument("Notify_Enable") !== "false";
            if (notifySwitch) {
                $.notify("Linux.Do 每日统计", info.status, info.detail);
            }
            console.log(`\n${info.status}\n${info.detail}`);
        } else {
            $.notify("Linux.Do", "⚠️ 数据解析失败", "无法获取 Connect 信息，Cookie 可能已过期。");
        }
    }
}

// 辅助：HTTP 请求
function httpRequest(method, url, cookie) {
    return new Promise((resolve) => {
        const options = {
            url: url,
            headers: {
                "Cookie": cookie,
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
            }
        };

        $httpClient.get(options, (err, resp, data) => {
            if (err) {
                console.log(`请求失败: ${url} - ${err}`);
                resolve(null);
            } else {
                if (resp.status === 200) {
                    resolve(data);
                } else {
                    console.log(`请求非200: ${resp.status}`);
                    resolve(null);
                }
            }
        });
    });
}

// 辅助：解析 HTML 表格 (正则提取核心数据)
function parseConnectInfo(html) {
    try {
        // 简单正则提取，防止引入 heavy 库
        // 提取 50天内登录
        const loginMatch = html.match(/50天内登录.*?(\d+).*?(\d+)/s);
        // 提取 帖子回复
        const replyMatch = html.match(/帖子回复.*?(\d+).*?(\d+)/s);
        // 提取 获得点赞
        const likeMatch = html.match(/获得点赞.*?(\d+).*?(\d+)/s);
        // 提取 进入读帖
        const readMatch = html.match(/进入读帖.*?(\d+).*?(\d+)/s);

        if (loginMatch && replyMatch) {
            const loginCur = loginMatch[1].trim();
            const loginReq = loginMatch[2].trim();
            
            const replyCur = replyMatch[1].trim();
            const likeCur = likeMatch ? likeMatch[1].trim() : "0";
            const readCur = readMatch ? readMatch[1].trim() : "0";

            let msg = `📅 登录: ${loginCur}/${loginReq} 天\n`;
            msg += `💬 回复: ${replyCur} | ❤️ 获赞: ${likeCur}\n`;
            msg += `📖 读帖: ${readCur} 贴`;
            
            return {
                status: "✅ 数据获取成功",
                detail: msg
            };
        }
        return null;
    } catch (e) {
        console.log("解析错误: " + e);
        return null;
    }
}

// 辅助：Loon/Surge/QX 兼容类 (简版)
function Env(t) {
    return {
        name: t,
        read: (key) => $persistentStore.read(key),
        write: (val, key) => $persistentStore.write(val, key),
        notify: (title, subtitle, content) => $notification.post(title, subtitle, content),
        getArgument: (key) => {
            if (typeof $argument !== "undefined") {
                // 简单的参数解析，实际 Loon 可以直接获取
                return $argument; 
            }
            return null;
        },
        done: () => $done()
    };
}
