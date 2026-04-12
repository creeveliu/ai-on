import Link from "next/link";

import { requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { isDbReachabilityError } from "@/lib/prisma-error";

export default async function SubscribersPage() {
  await requireAdminSession();

  let dbUnavailable = false;
  let subscribers: Array<{
    id: string;
    email: string;
    enabled: boolean;
    createdAt: Date;
  }> = [];

  try {
    subscribers = await db.subscriber.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, enabled: true, createdAt: true },
    });
  } catch (error) {
    if (isDbReachabilityError(error)) {
      dbUnavailable = true;
    } else {
      throw error;
    }
  }

  return (
    <main className="ui-shell ui-grid">
      <header className="ui-header">
        <h1 className="ui-title" style={{ fontSize: "clamp(32px, 5vw, 48px)" }}>
          订阅者管理
        </h1>
        <p className="ui-subtitle">管理每日摘要收件人。</p>
        <div className="ui-nav">
          <Link href="/admin/creators">主播</Link>
          <Link href="/admin/subscribers">订阅者</Link>
          <Link href="/admin/jobs">任务日志</Link>
          <Link href="/">首页</Link>
        </div>
      </header>

      <section className="ui-panel">
        <h2>添加订阅者</h2>
        <p className="ui-muted" style={{ marginBottom: 10 }}>
          可手动录入邮箱，后续会参与日报发送。
        </p>
        <form action="/api/admin/subscribers" method="post" className="ui-inline-form">
          <input className="ui-input" name="email" type="email" required placeholder="you@example.com" />
          <label className="ui-muted" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input name="enabled" type="checkbox" defaultChecked /> 启用
          </label>
          <button className="ui-button" type="submit">
            保存
          </button>
        </form>
      </section>

      <section className="ui-panel">
        {dbUnavailable ? <p className="ui-alert">数据库暂时不可达，请稍后重试。</p> : null}
        <div className="ui-table-wrap ui-space-top">
          <table className="ui-table">
            <thead>
              <tr>
                <th>邮箱</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id}>
                  <td>{subscriber.email}</td>
                  <td>{subscriber.enabled ? "enabled" : "disabled"}</td>
                  <td>{subscriber.createdAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</td>
                  <td>
                    <form action={`/api/admin/subscribers/${subscriber.id}/delete`} method="post">
                      <button className="ui-button ui-button--ghost" type="submit">
                        删除
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
