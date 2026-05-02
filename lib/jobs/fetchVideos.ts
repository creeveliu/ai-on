import { JobStatus, Platform } from "@prisma/client";

import { db } from "@/lib/db";
import { sendJobFailureEmail } from "@/lib/mail/jobAlert";
import { getPlatformClient } from "@/lib/platform";

type Creator = Awaited<ReturnType<typeof db.creator.findMany>>[0];
type Failure = { platformId: string; platform: Platform; reason: string };

async function fetchCreator(creator: Creator): Promise<{ success: boolean; upserted: number; failure?: Failure }> {
  const client = getPlatformClient(creator.platform);
  let upserted = 0;
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
      upserted += 1;
    }

    await db.creator.update({
      where: { id: creator.id },
      data: {
        lastFetchedAt: new Date(),
        name: profileName ?? creator.name,
        avatarUrl: profileAvatarUrl,
      },
    });

    return { success: true, upserted };
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

    return {
      success: false,
      upserted,
      failure: {
        platform: creator.platform,
        platformId: creator.platformId,
        reason: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

export async function runFetchVideosJob() {
  const creators = await db.creator.findMany({ where: { enabled: true } });

  let successCount = 0;
  let failedCount = 0;
  let upsertedCount = 0;
  const failures: Failure[] = [];

  // 第一轮抓取
  for (const creator of creators) {
    const result = await fetchCreator(creator);
    if (result.success) {
      successCount += 1;
    } else {
      failedCount += 1;
      if (result.failure) failures.push(result.failure);
    }
    upsertedCount += result.upserted;

    // Keep the cron under Vercel's serverless timeout while still spacing requests a little.
    if (creators.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  if (failures.length > 0) {
    console.log(`[fetchVideos] ${failures.length} creators failed; skipping retry in serverless job`);
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

  if (status !== "success") {
    try {
      await sendJobFailureEmail({ jobName: "fetch_videos", status, summary, failures });
    } catch (error) {
      console.error("[fetchVideos] failed to send job alert", error);
    }
  }

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
