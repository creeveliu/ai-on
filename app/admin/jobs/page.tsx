import Link from "next/link";

import { requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { isDbReachabilityError } from "@/lib/prisma-error";

export default async function JobsPage() {
  await requireAdminSession();

  let dbUnavailable = false;
  let logs: Array<{
    id: string;
    createdAt: Date;
    jobName: string;
    status: string;
    summary: string;
  }> = [];

  try {
    logs = await db.jobLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, createdAt: true, jobName: true, status: true, summary: true },
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
          任务日志
        </h1>
        <p className="ui-subtitle">查看抓取与摘要发送执行结果，可手动触发任务。</p>
        <div className="ui-nav">
          <Link href="/admin/creators">主播</Link>
          <Link href="/admin/subscribers">订阅者</Link>
          <Link href="/admin/jobs">任务日志</Link>
          <Link href="/">首页</Link>
        </div>
      </header>

      <section className="ui-panel">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <form action="/api/jobs/fetch-videos" method="post">
            <button className="ui-button" type="submit">
              手动执行抓取
            </button>
          </form>
          <p style={{ fontSize: 14, opacity: 0.7 }}>
            任务执行约需 15-30 秒，提交后可稍后刷新页面查看结果。
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <form action="/api/jobs/send-digest" method="post">
            <button className="ui-button ui-button--ghost" type="submit">
              手动发送日报
            </button>
          </form>
        </div>
      </section>

      <section className="ui-panel">
        {dbUnavailable ? <p className="ui-alert">数据库暂时不可达，请稍后重试。</p> : null}
        <div className="ui-table-wrap ui-space-top">
          <table className="ui-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>任务</th>
                <th>状态</th>
                <th>摘要</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.createdAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</td>
                  <td>{log.jobName}</td>
                  <td>{log.status}</td>
                  <td>{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
