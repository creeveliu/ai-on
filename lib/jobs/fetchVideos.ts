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

    // 每个 creator 间隔 2 秒，降低 B站反爬风控概率
    if (creators.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // 如果有失败，等 60 秒后重试
  if (failures.length > 0 && failures.length < creators.length) {
    console.log(`[fetchVideos] ${failures.length} creators failed, retrying in 60s...`);
    await new Promise((resolve) => setTimeout(resolve, 60000));

    const failedCreators = creators.filter((c) =>
      failures.some((f) => f.platformId === c.platformId && f.platform === c.platform),
    );

    const retryFailures: Failure[] = [];
    for (const creator of failedCreators) {
      const result = await fetchCreator(creator);
      if (result.success) {
        // 重试成功，从失败列表移除
        successCount += 1;
        failedCount -= 1;
        upsertedCount += result.upserted;
        failures.splice(
          failures.findIndex((f) => f.platformId === creator.platformId),
          1,
        );
      } else {
        // 重试仍然失败，更新原因
        upsertedCount += result.upserted;
        if (result.failure) {
          const idx = failures.findIndex((f) => f.platformId === creator.platformId);
          if (idx >= 0) failures[idx].reason = `Retry failed: ${result.failure.reason}`;
          retryFailures.push(result.failure);
        }
      }
    }

    if (retryFailures.length > 0) {
      console.log(`[fetchVideos] ${retryFailures.length} creators still failed after retry`);
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
