import Link from "next/link";

import { db } from "@/lib/db";
import { isDbReachabilityError } from "@/lib/prisma-error";

import { SubscribePopover } from "./subscribe-popover";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ creator?: string }>;
}) {
  const { creator } = await searchParams;

  let dbUnavailable = false;
  let creators: Array<{ id: string; name: string }> = [];
  let videos: Array<{
    id: string;
    title: string;
    url: string;
    publishedAt: Date;
    raw: unknown;
    creator: { name: string; avatarUrl: string | null };
  }> = [];

  try {
    creators = await db.creator.findMany({
      where: { enabled: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    videos = await db.video.findMany({
      where: creator ? { creatorId: creator } : undefined,
      include: { creator: { select: { name: true, avatarUrl: true } } },
      orderBy: { publishedAt: "desc" },
      take: 100,
    });
  } catch (error) {
    if (isDbReachabilityError(error)) {
      dbUnavailable = true;
    } else {
      throw error;
    }
  }

  return (
    <main className="threads-root">
      <header className="threads-topbar">
        <div className="threads-topbar-title">AI ON</div>
        <div className="threads-topbar-actions">
          <SubscribePopover />
          <Link href="/admin/login" className="threads-admin-link">
            后台
          </Link>
        </div>
      </header>

      <section className="threads-board">
        <div className="threads-creator-filter">
          <Link href="/" className={!creator ? "is-active" : ""}>
            全部
          </Link>
          {creators.map((item) => (
            <Link key={item.id} href={`/?creator=${item.id}`} className={creator === item.id ? "is-active" : ""}>
              {item.name}
            </Link>
          ))}
        </div>

        {dbUnavailable ? <p className="threads-alert">数据库暂时不可达，请稍后重试。</p> : null}

        {videos.length === 0 ? (
          <p className="threads-empty">暂无数据</p>
        ) : (
          <ul className="threads-feed">
            {videos.map((video) => {
              const maybePic =
                typeof video.raw === "object" &&
                video.raw &&
                "pic" in video.raw &&
                typeof (video.raw as { pic?: unknown }).pic === "string"
                  ? (video.raw as { pic: string }).pic
                  : null;
              const maybeDuration =
                typeof video.raw === "object" &&
                video.raw &&
                "length" in video.raw &&
                typeof (video.raw as { length?: unknown }).length === "string"
                  ? (video.raw as { length: string }).length
                  : null;
              const cover = maybePic
                ? maybePic.startsWith("//")
                  ? `https:${maybePic}`
                  : maybePic
                : null;
              const proxiedCover = cover ? `/api/image/bili?url=${encodeURIComponent(cover)}` : null;
              const proxiedAvatar = video.creator.avatarUrl
                ? `/api/image/bili?url=${encodeURIComponent(video.creator.avatarUrl)}`
                : null;

              return (
                <li key={video.id} className="threads-item">
                  <div className="threads-rail">
                    <div className="threads-avatar">
                      {proxiedAvatar ? (
                        <img src={proxiedAvatar} alt={video.creator.name} className="threads-avatar-image" />
                      ) : (
                        video.creator.name.slice(0, 1)
                      )}
                    </div>
                  </div>

                  <article className="threads-content">
                    <div className="threads-head">
                      <span className="threads-name">{video.creator.name}</span>
                      <span className="threads-time">
                        {video.publishedAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
                      </span>
                    </div>

                    <a className="threads-text" href={video.url} target="_blank" rel="noreferrer">
                      {video.title}
                    </a>

                    {proxiedCover ? (
                      <a href={video.url} target="_blank" rel="noreferrer" className="threads-image-wrap">
                        <img src={proxiedCover} alt={video.title} className="threads-image" />
                        {maybeDuration ? (
                          <span className="threads-duration" aria-label={`视频时长 ${maybeDuration}`}>
                            {maybeDuration}
                          </span>
                        ) : null}
                      </a>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>

    </main>
  );
}
