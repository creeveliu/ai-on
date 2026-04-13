import { Platform } from "@prisma/client";
import Link from "next/link";

import { db } from "@/lib/db";
import { isDbReachabilityError } from "@/lib/prisma-error";

import { CreatorFilter } from "./creator-filter";
import { SubscribePopover } from "./subscribe-popover";

type VideoWithCreator = {
  id: string;
  platform: Platform;
  title: string;
  url: string;
  publishedAt: Date;
  raw: unknown;
  creator: { name: string; avatarUrl: string | null };
};

function extractCoverUrl(video: VideoWithCreator): string | null {
  if (video.platform === "bilibili") {
    const maybePic =
      typeof video.raw === "object" &&
      video.raw &&
      "pic" in video.raw &&
      typeof (video.raw as { pic?: unknown }).pic === "string"
        ? (video.raw as { pic: string }).pic
        : null;
    return maybePic?.startsWith("//") ? `https:${maybePic}` : maybePic;
  }

  if (video.platform === "youtube") {
    const raw = video.raw as { snippet?: { thumbnails?: { medium?: { url?: string }; default?: { url?: string }; high?: { url?: string } } } } | null;
    const thumbnails = raw?.snippet?.thumbnails;
    return thumbnails?.medium?.url ?? thumbnails?.default?.url ?? thumbnails?.high?.url ?? null;
  }

  return null;
}

/**
 * Parse ISO 8601 duration (e.g., "PT4M13S") to readable format (e.g., "4:13")
 */
function parseIsoDuration(iso: string): string | null {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function extractDuration(video: VideoWithCreator): string | null {
  if (video.platform === "bilibili") {
    const raw = video.raw as { length?: string } | null;
    return raw?.length ?? null;
  }

  if (video.platform === "youtube") {
    const raw = video.raw as { duration?: string } | null;
    const iso = raw?.duration;
    if (iso) {
      return parseIsoDuration(iso);
    }
  }

  return null;
}

function PlatformIcon({ platform }: { platform: Platform }) {
  if (platform === "bilibili") {
    return (
      <img
        src="/bilibili.svg"
        alt="Bilibili"
        className="threads-platform-icon"
        style={{ width: 16, height: 16 }}
      />
    );
  }
  return (
    <img
      src="/youtube.svg"
      alt="YouTube"
      className="threads-platform-icon"
      style={{ width: 16, height: 16 }}
    />
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ creator?: string }>;
}) {
  const { creator } = await searchParams;

  let dbUnavailable = false;
  let creators: Array<{ id: string; name: string }> = [];
  let videos: VideoWithCreator[] = [];

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
        <CreatorFilter creators={creators} activeId={creator} />

        {dbUnavailable ? <p className="threads-alert">数据库暂时不可达，请稍后重试。</p> : null}

        {videos.length === 0 ? (
          <p className="threads-empty">暂无数据</p>
        ) : (
          <ul className="threads-feed">
            {videos.map((video) => {
              const cover = extractCoverUrl(video);
              const duration = extractDuration(video);
              const proxiedCover = cover ? `/api/image/proxy?url=${encodeURIComponent(cover)}` : null;
              const proxiedAvatar = video.creator.avatarUrl
                ? `/api/image/proxy?url=${encodeURIComponent(video.creator.avatarUrl)}`
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
                        <span className="threads-platform-badge">
                          <PlatformIcon platform={video.platform} />
                        </span>
                        <img src={proxiedCover} alt={video.title} className="threads-image" />
                        {duration ? (
                          <span className="threads-duration" aria-label={`视频时长 ${duration}`}>
                            {duration}
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
