import Link from "next/link";

import { requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function SubscribersPage() {
  await requireAdminSession();

  const subscribers = await db.subscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: 24 }}>
      <h1>订阅者管理</h1>
      <nav style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <Link href="/admin/creators">主播</Link>
        <Link href="/admin/subscribers">订阅者</Link>
        <Link href="/admin/jobs">任务日志</Link>
        <Link href="/">首页</Link>
      </nav>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 14, marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>手动添加订阅者</h2>
        <form action="/api/admin/subscribers" method="post" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input name="email" type="email" required placeholder="you@example.com" style={{ padding: "8px 10px" }} />
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input name="enabled" type="checkbox" defaultChecked /> 启用
          </label>
          <button type="submit">保存</button>
        </form>
      </section>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px 6px" }}>邮箱</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px 6px" }}>状态</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px 6px" }}>创建时间</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "8px 6px" }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map((subscriber) => (
            <tr key={subscriber.id}>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{subscriber.email}</td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>
                {subscriber.enabled ? "enabled" : "disabled"}
              </td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>
                {subscriber.createdAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
              </td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px", textAlign: "right" }}>
                <form action={`/api/admin/subscribers/${subscriber.id}/delete`} method="post">
                  <button type="submit">删除</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
