import { JobStatus } from "@prisma/client";

import { fetchCreatorLatestVideos } from "@/lib/bili";
import { db } from "@/lib/db";

export async function runFetchVideosJob() {
  const creators = await db.creator.findMany({ where: { enabled: true } });

  let successCount = 0;
  let failedCount = 0;
  let upsertedCount = 0;
  const failures: Array<{ mid: string; reason: string }> = [];

  for (const creator of creators) {
    try {
      const videos = await fetchCreatorLatestVideos(creator.mid);

      for (const item of videos) {
        await db.video.upsert({
          where: { bvid: item.bvid },
          update: {
            title: item.title,
            url: item.url,
            publishedAt: item.publishedAt,
            raw: item.raw as object,
            creatorId: creator.id,
          },
          create: {
            bvid: item.bvid,
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
        data: { lastFetchedAt: new Date() },
      });

      successCount += 1;
    } catch (error) {
      failedCount += 1;
      failures.push({
        mid: creator.mid,
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
