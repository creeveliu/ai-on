import Link from "next/link";

import { requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function JobsPage() {
  await requireAdminSession();

  const logs = await db.jobLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: 24 }}>
      <h1>任务日志</h1>
      <nav style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <Link href="/admin/creators">主播</Link>
        <Link href="/admin/subscribers">订阅者</Link>
        <Link href="/admin/jobs">任务日志</Link>
        <Link href="/">首页</Link>
      </nav>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <form action="/api/jobs/fetch-videos" method="post">
          <button type="submit">手动执行抓取</button>
        </form>
        <form action="/api/jobs/send-digest" method="post">
          <button type="submit">手动发送日报</button>
        </form>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px 6px" }}>时间</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px 6px" }}>任务</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px 6px" }}>状态</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px 6px" }}>摘要</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>
                {log.createdAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
              </td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{log.jobName}</td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{log.status}</td>
              <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px 6px" }}>{log.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
