import Link from "next/link";

import { db } from "@/lib/db";

import { SubscribeForm } from "./subscribe-form";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ creator?: string }>;
}) {
  const { creator } = await searchParams;

  const creators = await db.creator.findMany({
    where: { enabled: true },
    orderBy: { name: "asc" },
  });

  const videos = await db.video.findMany({
    where: creator ? { creatorId: creator } : undefined,
    include: { creator: true },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: 24 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>Bilibili Digest</h1>
        <p style={{ color: "#666", marginBottom: 16 }}>最新视频（本地数据库）</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/">全部</Link>
          {creators.map((item) => (
            <Link key={item.id} href={`/?creator=${item.id}`}>
              {item.name}
            </Link>
          ))}
          <Link href="/admin/login" style={{ marginLeft: "auto" }}>
            管理后台
          </Link>
        </div>
      </header>

      <section style={{ marginBottom: 28, padding: 16, border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>邮件订阅</h2>
        <SubscribeForm />
      </section>

      <section>
        {videos.length === 0 ? (
          <p>暂无数据，请先在后台添加主播并执行抓取任务。</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
            {videos.map((video) => (
              <li key={video.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
                  {video.creator.name} · {video.publishedAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
                </div>
                <a href={video.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
                  {video.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
