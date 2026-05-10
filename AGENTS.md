# AI ON Agent Notes

## Project Summary
- Stack: Next.js App Router + Prisma + PostgreSQL + Vercel Cron.
- Goal: B 站创作者聚合与日报发送。
- MVP path: 登录 -> 主播管理 -> 抓取入库 -> 首页展示 -> 邮件订阅 -> 日报发送。

## Implementation Rules
- Keep all app code under root-level `app/`, `lib/`, `prisma/`.
- Do not introduce extra app roots (for example `web/` or `src/` clones).
- Homepage is Threads-like style, but avoid adding fake social features not in product scope.
- Add creator flow is link-only; defaults to enabled and triggers fetch immediately.
- Preserve existing API contracts unless explicitly asked to change.

## Env & Secrets
- Local env file: `.env.local`.
- Never commit real secrets.
- Keep `.env.example` updated when env contract changes.

## Prisma
- Schema source of truth: `prisma/schema.prisma`.
- Whenever schema changes:
  1. add migration under `prisma/migrations/*`
  2. run `npm run prisma:generate`
  3. ensure `npm run build` passes

## Deploy
- Vercel project: `ai-on`.
- Build includes `prisma generate` (required for CI/Vercel type safety).
- Keep `vercel.json` cron schedules consistent with product requirement.

## Cron / Serverless Timeout
- Vercel Serverless 函数默认超时：Hobby 10s / Pro 30s。超时后进程被 kill，无报错日志，表现为 cron 静默不执行。
- 所有 cron 路由必须显式设置 `export const maxDuration`，根据实际耗时决定（含 `setTimeout` 延迟也要算进去）。
- 调试 cron：`curl -H "Authorization: Bearer $CRON_SECRET" <url>`，若超时优先排查 `maxDuration` 与 job 内部等待。
- 已发生：`fetch-videos` 因 2s 间隔 + 60s 重试导致全量静默失败；Serverless 内重试等待必须保持短耗时。

## Docs
- Keep `README.md` accurate for:
  - local run
  - deployment
  - cron verification
  - common troubleshooting
