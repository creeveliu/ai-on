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

## Docs
- Keep `README.md` accurate for:
  - local run
  - deployment
  - cron verification
  - common troubleshooting
