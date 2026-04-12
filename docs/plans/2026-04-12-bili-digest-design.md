# Bilibili Digest Site Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Bilibili-first video update site with admin backend, email subscriptions, 2-hour fetch jobs, and daily 09:00 digest emails.

**Architecture:** One Next.js app (public site + admin + API jobs) backed by PostgreSQL (Prisma). Bilibili updates are fetched through `wbi` API with `SESSDATA` and optional proxy, then normalized into local DB. Public pages and emails read only from local DB.

**Tech Stack:** Next.js (App Router), TypeScript, Prisma, PostgreSQL (Neon), Resend, bcryptjs, jose.

---

## 1) Scope

### In Scope
- Public page: latest videos, grouped/filterable by creator.
- Email subscribe form: add email to subscriber list.
- Admin login: single admin with email/password.
- Admin pages: manage creators and subscribers.
- Scheduled jobs:
- fetch Bilibili videos every 2 hours.
- send daily digest at 09:00 Asia/Shanghai.
- Basic observability: job logs and send logs.

### Out of Scope (v1)
- Real-time refresh/websocket.
- Complex RBAC/multi-admin.
- YouTube ingestion (can be added later).
- Full user accounts and per-user preferences.

---

## 2) Decisions (Confirmed)

- Product focus: Bilibili first.
- Fetch cadence: every 2 hours.
- Digest send time: daily 09:00 (`Asia/Shanghai`).
- Auth model: single admin email/password.
- Email provider: Resend.
- Bilibili strategy: `wbi` fetch with `SESSDATA`; optional outbound proxy.

---

## 3) System Design

### Data Flow
1. Admin adds creators (`mid`) in backend.
2. Scheduled fetch job loads active creators, calls Bilibili API, upserts videos by `bvid`.
3. Public homepage reads recent videos from DB.
4. Daily digest job queries videos from last 24h and emails all active subscribers.

### Failure Strategy
- If one creator fetch fails, continue remaining creators.
- On Bili risk codes (`-352`, `-412`, `-401`), log and retry with backoff.
- If email sending partially fails, log per recipient and continue.

---

## 4) Data Model (Prisma)

### `Admin`
- `id`
- `email` (unique)
- `passwordHash`
- `createdAt`, `updatedAt`

### `Creator`
- `id`
- `platform` (`bilibili`)
- `mid` (unique)
- `name`
- `enabled`
- `lastFetchedAt`
- `createdAt`, `updatedAt`

### `Video`
- `id`
- `platform` (`bilibili`)
- `bvid` (unique)
- `creatorId` (FK)
- `title`
- `url`
- `publishedAt`
- `raw` (JSON, optional)
- `createdAt`

### `Subscriber`
- `id`
- `email` (unique)
- `enabled`
- `createdAt`, `updatedAt`

### `JobLog`
- `id`
- `jobName` (`fetch_videos` / `send_digest`)
- `status` (`success` / `partial` / `failed`)
- `summary`
- `meta` (JSON)
- `createdAt`

---

## 5) API and Pages

### Public
- `GET /` latest videos
- `POST /api/subscribe` create subscriber

### Admin
- `GET /admin/login`
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /admin/creators`
- `POST /api/admin/creators`
- `POST /api/admin/creators/:id/delete`
- `GET /admin/subscribers`
- `POST /api/admin/subscribers`
- `POST /api/admin/subscribers/:id/delete`
- `GET /admin/jobs`

### Cron Jobs
- `POST /api/jobs/fetch-videos` (guarded by cron secret)
- `POST /api/jobs/send-digest` (guarded by cron secret)

---

## 6) Environment Variables

- `DATABASE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `AUTH_JWT_SECRET`
- `BILI_SESSDATA`
- `BILI_PROXY` (optional)
- `CRON_SECRET`
- `RESEND_API_KEY`
- `MAIL_FROM`

---

## 7) Execution Plan

### Phase A: Foundation
1. Initialize Next.js app in `web/`.
2. Add Prisma and schema models.
3. Run first migration.
4. Add admin seed script (single admin from env).

### Phase B: Admin Core
1. Implement credential auth (bcrypt + signed cookie/JWT).
2. Build admin login page.
3. Build creator CRUD page.
4. Build subscriber CRUD page.

### Phase C: Bilibili Fetch
1. Add shared Bili client (wbi sign + request).
2. Build fetch service for one creator.
3. Build batch fetch job for all enabled creators.
4. Add dedupe/upsert by `bvid`.
5. Add job logs.

### Phase D: Public + Digest
1. Build homepage video feed.
2. Add subscribe endpoint with dedupe.
3. Build daily digest renderer.
4. Send digest via Resend.
5. Add send logs and partial-failure handling.

### Phase E: Deployment
1. Add `vercel.json` cron:
- `0 */2 * * *` fetch job
- `0 1 * * *` send job (UTC 01:00 = Asia/Shanghai 09:00)
2. Set production envs on Vercel.
3. Run smoke tests on prod.

---

## 8) Acceptance Criteria

- Admin can login and manage creators/subscribers.
- Fetch job successfully stores new videos for configured creators.
- Homepage shows recent videos from DB.
- Subscriber can submit email and be persisted.
- Daily digest sends only when there are new videos in last 24h.
- Job logs show success/failure details.

---

## 9) Risks and Mitigations

- Bilibili anti-bot risk:
- Mitigation: dedicated small account, stable IP/proxy, low-frequency requests.
- `SESSDATA` expiry:
- Mitigation: rotate token, admin warning in docs.
- Email provider limits:
- Mitigation: batch sends, retry policy, logging.

---

## 10) Suggested Repo Structure

```txt
web/
  prisma/
    schema.prisma
  src/
    app/
      page.tsx
      admin/
      api/
        subscribe/
        admin/
        jobs/
    lib/
      auth.ts
      db.ts
      bili.ts
      jobs/
      mail/
```
