/*
 * Linux.Do 增强版 (修复 403 问题)
 * 使用方法：
 * 1. 复制此代码到 Loon 本地脚本。
 * 2. 浏览器访问 https://linux.do 获取 Cookie。
 */

const $ = new Env("Linux.Do");
const CK_KEY = "linuxdo_cookie";

(async () => {
    if (typeof $request !== "undefined") {
        getCookie();
    } else {
        await checkIn();
    }
    $.done();
})();

function getCookie() {
    if ($request.headers) {
        const cookie = $request.headers["Cookie"] || $request.headers["cookie"];
        // 只有包含关键 session 字段才保存
        if (cookie && cookie.includes("_forum_session")) {
            $.write(cookie, CK_KEY);
            $.notify("Linux.Do", "✅ Cookie 更新成功", "请手动运行一次脚本测试");
        }
    }
}

async function checkIn() {
    const cookie = $.read(CK_KEY);
    if (!cookie) {
        $.notify("Linux.Do", "❌ 未找到 Cookie", "请使用 Safari 访问并登录 linux.do");
        return;
    }

    // 伪装成 iOS Safari 17
    const headers = {
        "Cookie": cookie,
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
        "Referer": "https://linux.do/",
        "Origin": "https://linux.do",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9"
    };

    const url = "https://connect.linux.do/";

    const options = {
        url: url,
        headers: headers,
        timeout: 15 // 增加超时时间
    };

    $httpClient.get(options, (err, resp, data) => {
        if (err) {
            console.log("请求失败: " + err);
            $.notify("Linux.Do", "❌ 请求失败", "网络错误，请检查节点");
        } else if (resp.status === 403) {
            console.log("403 Forbidden - 详细 Headers: " + JSON.stringify(headers));
            $.notify("Linux.Do", "🚫 403 拒绝访问", "Cookie失效 或 IP被盾。请尝试：\n1. 切换节点\n2. 重新登录网页获取Cookie");
        } else if (resp.status !== 200) {
            $.notify("Linux.Do", "❌ 异常状态", `状态码: ${resp.status}`);
        } else {
            // 解析数据
            const info = parseConnectInfo(data);
            if (info) {
                $.notify("Linux.Do 状态", info.status, info.detail);
                console.log("成功获取数据");
            } else {
                $.notify("Linux.Do", "⚠️ 解析失败", "网页结构可能已变更或Cookie过期");
            }
        }
        $.done();
    });
}

function parseConnectInfo(html) {
    try {
        // 宽松正则匹配，防止网页微调导致失败
        let login = html.match(/50天内登录[\s\S]*?(\d+)\s*\/\s*(\d+)/);
        let reply = html.match(/帖子回复[\s\S]*?(\d+)/);
        let like = html.match(/获得点赞[\s\S]*?(\d+)/);
        let read = html.match(/进入读帖[\s\S]*?(\d+)/);

        if (login) {
            return {
                status: "✅ 活跃检测通过",
                detail: `📅 登录: ${login[1]}/${login[2]} 天\n💬 回复: ${reply ? reply[1] : 0} | ❤️ 获赞: ${like ? like[1] : 0}\n📖 读帖: ${read ? read[1] : 0}`
            };
        }
        return null;
    } catch (e) {
        console.log("解析错误: " + e);
        return null;
    }
}

// 兼容层
function Env(t) {
    return {
        name: t,
        read: (key) => $persistentStore.read(key),
        write: (val, key) => $persistentStore.write(val, key),
        notify: (title, subtitle, content) => $notification.post(title, subtitle, content),
        done: () => $done()
    };
}
