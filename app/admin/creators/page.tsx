import Link from "next/link";

import { requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { isDbReachabilityError } from "@/lib/prisma-error";

export default async function CreatorsPage() {
  await requireAdminSession();

  let dbUnavailable = false;
  let creators: Array<{
    id: string;
    name: string;
    platform: string;
    platformId: string;
    enabled: boolean;
    lastFetchedAt: Date | null;
  }> = [];

  try {
    creators = await db.creator.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, platform: true, platformId: true, enabled: true, lastFetchedAt: true },
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
          主播管理
        </h1>
        <p className="ui-subtitle">维护追踪主播列表，供抓取任务执行。</p>
        <div className="ui-nav">
          <Link href="/admin/creators">主播</Link>
          <Link href="/admin/subscribers">订阅者</Link>
          <Link href="/admin/jobs">任务日志</Link>
          <Link href="/">首页</Link>
        </div>
      </header>

      <section className="ui-panel">
        <h2>添加主播</h2>
        <p className="ui-muted" style={{ marginBottom: 10 }}>
          粘贴 Bilibili 空间链接或 YouTube 频道链接，系统会自动识别平台、名称，默认启用并立即抓取。
        </p>
        <form action="/api/admin/creators" method="post" className="ui-inline-form">
          <input className="ui-input" name="link" placeholder="https://space.bilibili.com/xxxxxx 或 https://youtube.com/@handle" required />
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
                <th>名称</th>
                <th>平台</th>
                <th>ID</th>
                <th>状态</th>
                <th>上次抓取</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {creators.map((creator) => (
                <tr key={creator.id}>
                  <td>
                    <form
                      action={`/api/admin/creators/${creator.id}/update`}
                      method="post"
                      style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
                    >
                      <input
                        className="ui-input"
                        name="name"
                        defaultValue={creator.name}
                        required
                        style={{ padding: "6px 10px", fontSize: 12, minWidth: 160 }}
                      />
                      <button className="ui-button ui-button--ghost" type="submit" style={{ padding: "6px 10px" }}>
                        保存
                      </button>
                    </form>
                  </td>
                  <td>{creator.platform === "bilibili" ? "B站" : "YT"}</td>
                  <td>{creator.platformId}</td>
                  <td>{creator.enabled ? "enabled" : "disabled"}</td>
                  <td>
                    {creator.lastFetchedAt
                      ? creator.lastFetchedAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
                      : "-"}
                  </td>
                  <td>
                    <form action={`/api/admin/creators/${creator.id}/delete`} method="post">
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

        <form action="/api/admin/logout" method="post" className="ui-space-top">
          <button className="ui-button ui-button--ghost" type="submit">
            退出登录
          </button>
        </form>
      </section>
    </main>
  );
}
