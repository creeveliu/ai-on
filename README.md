# Bilibili Digest (MVP)

最小可用闭环：登录 -> 管理主播 -> 抓取入库 -> 首页展示 -> 邮件订阅 -> 每日摘要发送。

## 1. 本地运行

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env
```

3. 生成 Prisma Client 并执行迁移

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
```

4. 初始化管理员

```bash
npm run db:seed
```

5. 启动

```bash
npm run dev
```

访问：
- 首页: `http://localhost:3000/`
- 管理登录: `http://localhost:3000/admin/login`

## 2. 关键接口

- 订阅: `POST /api/subscribe`
- 登录: `POST /api/admin/login`
- 退出: `POST /api/admin/logout`
- 主播新增/更新: `POST /api/admin/creators`
- 主播删除: `POST /api/admin/creators/:id/delete`
- 订阅者新增/更新: `POST /api/admin/subscribers`
- 订阅者删除: `POST /api/admin/subscribers/:id/delete`
- 手动抓取: `POST /api/jobs/fetch-videos`
- 手动发信: `POST /api/jobs/send-digest`

## 3. 部署到 Vercel

1. 使用仓库根目录作为项目目录。
2. 在 Vercel 环境变量中配置 `.env.example` 里的全部变量。
3. 确认 `CRON_SECRET` 已配置（Vercel Cron 请求会带 `Authorization: Bearer <CRON_SECRET>`）。
4. 部署后在 `Settings -> Cron Jobs` 验证两条定时任务：
   - `0 */2 * * *` 抓取视频
   - `0 1 * * *` 发送摘要（UTC 01:00 = Asia/Shanghai 09:00）

## 4. Cron 与生产验证

- 手动触发抓取：后台任务页点击“手动执行抓取”。
- 手动触发日报：后台任务页点击“手动发送日报”。
- 观察 `/admin/jobs` 的 `fetch_videos` 与 `send_digest` 日志。
- 若 Bilibili 触发风控（`-352`/`-412`/`-401`），系统会自动重试并记录失败信息。

## 5. 数据库结构

见 `prisma/schema.prisma`，包含：
- `Admin`
- `Creator`
- `Video`
- `Subscriber`
- `JobLog`
- `DigestSendLog`
