/*
 * Linux.Do 助手 - 终极防盾版 (v2.0)
 * 适用于 Loon
 */

const $ = new Env("Linux.Do");
const CK_KEY = "linuxdo_cookie";
// 模拟 iOS 17 Safari 的完整请求头，防 403 核心
const USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";

(async () => {
    if (typeof $request !== "undefined") {
        getCookie();
    } else {
        await main();
    }
    $.done();
})();

function getCookie() {
    if ($request.headers) {
        const cookie = $request.headers["Cookie"] || $request.headers["cookie"];
        if (cookie && cookie.includes("_forum_session")) {
            $.write(cookie, CK_KEY);
            $.notify("Linux.Do", "🎉 Cookie 捕获成功", "凭证已更新，防 403 模式已就绪。");
            console.log("Cookie 更新成功");
        }
    }
}

async function main() {
    const cookie = $.read(CK_KEY);
    if (!cookie) {
        $.notify("Linux.Do", "🔴 无法运行", "未找到 Cookie，请先在 Safari 访问 linux.do");
        return;
    }

    const headers = {
        "Cookie": cookie,
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        "Referer": "https://linux.do/",
        "Origin": "https://linux.do",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-site",
        "Priority": "u=0, i"
    };

    const options = {
        url: "https://connect.linux.do/",
        headers: headers,
        timeout: 20
    };

    $httpClient.get(options, (err, resp, data) => {
        if (err) {
            $.notify("Linux.Do", "❌ 网络错误", "无法连接服务器");
        } else if (resp.status === 403) {
            $.notify("Linux.Do", "🚫 403 拒绝访问", "请尝试：1. Safari退出重登 2. 切换节点");
        } else if (resp.status === 200) {
            const result = parseHtml(data);
            if (result) $.notify("Linux.Do 每日统计", result.title, result.desc);
            else $.notify("Linux.Do", "⚠️ 解析失败", "Cookie 可能过期");
        } else {
            $.notify("Linux.Do", "⚠️ 异常状态", `状态码: ${resp.status}`);
        }
        $.done();
    });
}

function parseHtml(html) {
    try {
        let login = html.match(/50天内登录[\s\S]*?(\d+)\s*\/\s*(\d+)/);
        let reply = html.match(/帖子回复[\s\S]*?(\d+)/);
        let like = html.match(/获得点赞[\s\S]*?(\d+)/);
        let read = html.match(/进入读帖[\s\S]*?(\d+)/);

        if (login) {
            const cur = parseInt(login[1]), tgt = parseInt(login[2]);
            const title = cur >= tgt ? `✅ 活跃达标 (${cur}/${tgt})` : `🚧 还需努力 (${cur}/${tgt})`;
            const desc = `📅 登录: ${cur}/${tgt} 天\n💬 回复: ${reply?reply[1]:0} | ❤️ 获赞: ${like?like[1]:0}\n📖 读帖: ${read?read[1]:0} 贴`;
            return { title, desc };
        }
        return null;
    } catch (e) { return null; }
}

function Env(t) {
    return {
        read: (k) => $persistentStore.read(k),
        write: (v, k) => $persistentStore.write(v, k),
        notify: (t, s, c) => $notification.post(t, s, c),
        done: () => $done()
    };
}
