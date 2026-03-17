# CRD

CRD (`China Roblox Download`) 是一个基于 `Lit + TypeScript + Vite` 构建的静态 Roblox 下载站前端。

项目当前包含：

- Windows / macOS 官方下载入口
- Android 下载入口
- 第三方启动器下载入口
- `gh-proxy` 线路选择
- RDD 免安装包生成
- 公告悬浮卡片与公告弹窗

仓库地址：

- [https://github.com/Yar1991-Translation/CRD](https://github.com/Yar1991-Translation/CRD)

## 本地开发

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

构建生产版本：

```bash
npm run build
```

本地预览：

```bash
npm run preview
```

## 生产部署思路

推荐拆成两部分：

1. 静态前端  
   用 Vite 构建后，把 `dist/` 部署到 Nginx。

2. 公告 API  
   在你的服务器上提供一个很轻量的接口，例如：

```text
https://your-domain.com/api/announcements
```

前端会优先读取：

```text
VITE_ANNOUNCEMENTS_API_URL
```

如果没有配置，则默认读取：

```text
/api/announcements
```

## 服务器部署示例

下面假设你的服务器是 `Ubuntu / Debian + Nginx`。

### 1. 构建前端

在本地项目目录执行：

```bash
npm install
npm run build
```

构建完成后会得到：

```text
dist/
```

### 2. 上传到服务器

把 `dist/` 上传到服务器，例如：

```bash
scp -r dist/* root@your-server:/var/www/crd/
```

### 3. 安装 Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

### 4. 配置站点

示例配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/crd;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/announcements {
        proxy_pass http://127.0.0.1:3001/api/announcements;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

保存后启用：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 公告 API 格式

前端支持两种返回格式。

### 对象格式

推荐使用这个：

```json
{
  "title": "公告中心",
  "subtitle": "这里会显示站点通知、线路维护和版本提醒。",
  "items": [
    {
      "id": "notice-1",
      "title": "线路维护通知",
      "content": "今晚 23:00 到 23:30 将进行线路调整。",
      "publishedAt": "2026-03-17T20:00:00+08:00",
      "pinned": true,
      "level": "warning",
      "link": "https://your-domain.com/notices/notice-1",
      "linkText": "查看详情"
    }
  ]
}
```

### 数组格式

也支持直接返回数组：

```json
[
  {
    "id": "notice-1",
    "title": "公告标题",
    "content": "公告内容"
  }
]
```

## 一个最轻量的公告 API 示例

如果你想先快速跑起来，可以在服务器上用 Node 自带的 `http` 模块做一个最简单的接口。

保存为 `announcements-api.js`：

```js
const http = require('http');

const data = {
  title: '公告中心',
  subtitle: '这里会显示站点通知、线路维护和版本提醒。',
  items: [
    {
      id: 'notice-1',
      title: '公告接口已启用',
      content: '前端现在会通过 /api/announcements 读取公告。',
      publishedAt: '2026-03-17T20:00:00+08:00',
      pinned: true,
      level: 'success'
    }
  ]
};

http.createServer((req, res) => {
  if (req.url === '/api/announcements') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(data));
    return;
  }

  res.writeHead(404, {
    'Content-Type': 'application/json; charset=utf-8'
  });
  res.end(JSON.stringify({ error: 'Not Found' }));
}).listen(3001, '127.0.0.1', () => {
  console.log('Announcements API running at http://127.0.0.1:3001');
});
```

运行：

```bash
node announcements-api.js
```

如果你想后台常驻运行，可以用 `pm2`：

```bash
npm install -g pm2
pm2 start announcements-api.js --name crd-announcements
pm2 save
pm2 startup
```

## 如果前端和 API 不同域名

如果你的前端是：

```text
https://crd.example.com
```

而 API 是：

```text
https://api.example.com/api/announcements
```

那么需要在前端构建前配置：

```bash
VITE_ANNOUNCEMENTS_API_URL=https://api.example.com/api/announcements
```

然后重新构建：

```bash
npm run build
```

同时你的 API 需要允许跨域，例如返回：

```text
Access-Control-Allow-Origin: https://crd.example.com
```

## 当前公告读取优先级

前端读取顺序如下：

1. `VITE_ANNOUNCEMENTS_API_URL`
2. `VITE_ANNOUNCEMENTS_URL`
3. `/api/announcements`

## 说明

- 这个项目前端仍然是静态站。
- 公告功能只是通过 `fetch` 读取远端 API。
- 这意味着你可以继续保持站点主体静态，只把公告放到服务器接口里动态返回。

## License

许可证见 [LICENSE](./LICENSE)。
