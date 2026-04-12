import { JobStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { sendDigestEmail } from "@/lib/mail/digest";

function digestDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function runSendDigestJob() {
  const env = getEnv();
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) {
    const summary = "Mail provider not configured, digest skipped";
    await db.jobLog.create({
      data: {
        jobName: "send_digest",
        status: "success",
        summary,
      },
    });
    return { status: "success" as JobStatus, summary, sent: 0, failed: 0 };
  }

  const now = new Date();
  const dateKey = digestDateKey(now);
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const videos = await db.video.findMany({
    where: { publishedAt: { gte: since } },
    include: { creator: true },
    orderBy: { publishedAt: "desc" },
  });

  if (videos.length === 0) {
    const summary = "No videos in last 24h, digest skipped";
    await db.jobLog.create({
      data: {
        jobName: "send_digest",
        status: "success",
        summary,
      },
    });

    return { status: "success" as JobStatus, summary, sent: 0, failed: 0 };
  }

  const subscribers = await db.subscriber.findMany({ where: { enabled: true } });

  let sent = 0;
  let failed = 0;
  const failures: Array<{ email: string; reason: string }> = [];

  for (const subscriber of subscribers) {
    try {
      const existing = await db.digestSendLog.findUnique({
        where: { subscriberId_dateKey: { subscriberId: subscriber.id, dateKey } },
      });

      if (existing) {
        continue;
      }

      await sendDigestEmail(
        subscriber.email,
        videos.map((video) => ({
          creatorName: video.creator.name,
          title: video.title,
          url: video.url,
          publishedAt: video.publishedAt,
        })),
      );

      await db.digestSendLog.create({
        data: {
          subscriberId: subscriber.id,
          dateKey,
          status: "success",
        },
      });

      sent += 1;
    } catch (error) {
      failed += 1;
      const reason = error instanceof Error ? error.message : "Unknown error";
      failures.push({ email: subscriber.email, reason });

      await db.digestSendLog.upsert({
        where: { subscriberId_dateKey: { subscriberId: subscriber.id, dateKey } },
        update: {
          status: "failed",
          error: reason,
        },
        create: {
          subscriberId: subscriber.id,
          dateKey,
          status: "failed",
          error: reason,
        },
      });
    }
  }

  const status: JobStatus = failed === 0 ? "success" : sent > 0 ? "partial" : "failed";
  const summary = `videos=${videos.length}, subscribers=${subscribers.length}, sent=${sent}, failed=${failed}`;

  await db.jobLog.create({
    data: {
      jobName: "send_digest",
      status,
      summary,
      meta: { failures },
    },
  });

  return { status, summary, sent, failed, failures };
}
