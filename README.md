# AI ON

B 站创作者聚合站（MVP）：
登录后台 -> 添加主播（链接）-> 自动抓取入库 -> 首页 Threads 风格展示 -> 邮件订阅 -> 每日摘要发送。

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

```bash
cp .env.example .env.local
# 编辑 .env.local
```

3. 生成客户端并迁移数据库

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
```

4. 初始化管理员账号

```bash
npm run db:seed
```

5. 运行开发环境

```bash
npm run dev
```

访问：
- 首页：`http://localhost:3000`
- 管理后台：`http://localhost:3000/admin/login`

## 后台使用

- 添加主播：只贴 B 站空间链接，默认启用并立即触发抓取。
- 改名：在主播列表里直接编辑并保存。
- 任务：`/admin/jobs` 可手动触发抓取与日报发送，并查看日志。

## 部署到 Vercel

1. 连接仓库并部署项目根目录。
2. 在 Vercel 环境变量里配置 `.env.example` 全部字段。
3. 确保 `CRON_SECRET` 已设置（Cron 会使用 `Authorization: Bearer <CRON_SECRET>`）。
4. `vercel.json` 已包含定时任务：
   - `0 0 * * *`：UTC 00:00 抓取一次
   - `0 1 * * *`：UTC 01:00 发送摘要（即 Asia/Shanghai 09:00）
5. 手动验证 Cron 路由时使用 GET：
   `curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/jobs/fetch-videos`

## 常见问题

- 报 `Unknown field avatarUrl`：执行 `npm run prisma:generate`，并重启 `npm run dev`。
- 抓取失败且日志出现 `Unexpected token '<'`：通常是风控页/代理拦截，已内置直连回退重试。
- 没配发信变量时：摘要发送任务会跳过发信并记录日志，不会影响其他功能。

## 目录

- `app/`：页面与 API 路由
- `lib/`：B 站抓取、任务调度、鉴权、邮件等逻辑
- `prisma/`：Schema、迁移、seed
- `vercel.json`：Cron 配置
