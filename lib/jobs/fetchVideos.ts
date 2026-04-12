import { JobStatus, Platform } from "@prisma/client";

import { db } from "@/lib/db";
import { getPlatformClient } from "@/lib/platform";

export async function runFetchVideosJob() {
  const creators = await db.creator.findMany({ where: { enabled: true } });

  let successCount = 0;
  let failedCount = 0;
  let upsertedCount = 0;
  const failures: Array<{ platformId: string; platform: Platform; reason: string }> = [];

  for (const creator of creators) {
    const client = getPlatformClient(creator.platform);

    let profileName: string | null = null;
    let profileAvatarUrl: string | null = null;

    try {
      const profile = await client.fetchProfile(creator.platformId);
      profileName = profile.name;
      profileAvatarUrl = profile.avatarUrl;
      const videos = await client.fetchLatestVideos(creator.platformId);

      for (const item of videos) {
        await db.video.upsert({
          where: {
            platform_videoId: {
              platform: creator.platform,
              videoId: item.videoId,
            },
          },
          update: {
            title: item.title,
            url: item.url,
            publishedAt: item.publishedAt,
            raw: item.raw as object,
            creatorId: creator.id,
          },
          create: {
            platform: creator.platform,
            videoId: item.videoId,
            title: item.title,
            url: item.url,
            publishedAt: item.publishedAt,
            raw: item.raw as object,
            creatorId: creator.id,
          },
        });
        upsertedCount += 1;
      }

      await db.creator.update({
        where: { id: creator.id },
        data: {
          lastFetchedAt: new Date(),
          name: profileName ?? creator.name,
          avatarUrl: profileAvatarUrl,
        },
      });

      successCount += 1;
    } catch (error) {
      if (profileName || profileAvatarUrl) {
        await db.creator.update({
          where: { id: creator.id },
          data: {
            name: profileName ?? creator.name,
            avatarUrl: profileAvatarUrl,
          },
        });
      }

      failedCount += 1;
      failures.push({
        platform: creator.platform,
        platformId: creator.platformId,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const status: JobStatus =
    failedCount === 0 ? "success" : successCount > 0 ? "partial" : "failed";

  const summary = `creators=${creators.length}, success=${successCount}, failed=${failedCount}, upserted=${upsertedCount}`;

  await db.jobLog.create({
    data: {
      jobName: "fetch_videos",
      status,
      summary,
      meta: { failures },
    },
  });

  return {
    status,
    summary,
    creators: creators.length,
    successCount,
    failedCount,
    upsertedCount,
    failures,
  };
}