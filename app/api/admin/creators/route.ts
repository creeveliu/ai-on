import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirectTo } from "@/lib/http";
import { detectPlatformFromUrl, getPlatformClient } from "@/lib/platform";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const link = String(formData.get("link") ?? "").trim();

  if (!link) {
    return redirectTo(req, "/admin/creators?error=invalid");
  }

  // Detect platform from URL
  const platform = detectPlatformFromUrl(link);
  if (!platform) {
    return redirectTo(req, "/admin/creators?error=unknown_platform");
  }

  const client = getPlatformClient(platform);
  const platformId = client.parsePlatformId(link);

  if (!platformId) {
    return redirectTo(req, "/admin/creators?error=invalid_id");
  }

  // Resolve to actual platform ID if needed (for YouTube handles)
  let resolvedPlatformId = platformId;
  if (platform === "youtube" && !/^UC[A-Za-z0-9_-]{22}$/.test(platformId)) {
    // Import resolveChannelId dynamically to handle resolution
    const { resolveChannelId } = await import("@/lib/youtube");
    const resolved = await resolveChannelId(platformId);
    if (!resolved) {
      return redirectTo(req, "/admin/creators?error=resolve_failed");
    }
    resolvedPlatformId = resolved;
  }

  // Fetch profile
  let finalName: string;
  let avatarUrl: string | null = null;
  try {
    const profile = await client.fetchProfile(resolvedPlatformId);
    finalName = profile.name ?? `${platform}_${resolvedPlatformId}`;
    avatarUrl = profile.avatarUrl;
  } catch {
    finalName = `${platform}_${resolvedPlatformId}`;
  }

  // Upsert creator with composite key
  const creator = await db.creator.upsert({
    where: {
      platform_platformId: {
        platform,
        platformId: resolvedPlatformId,
      },
    },
    update: { name: finalName, avatarUrl, enabled: true },
    create: {
      name: finalName,
      platform,
      platformId: resolvedPlatformId,
      avatarUrl,
      enabled: true,
    },
  });

  // Auto-fetch videos
  try {
    const videos = await client.fetchLatestVideos(resolvedPlatformId);
    for (const item of videos) {
      await db.video.upsert({
        where: {
          platform_videoId: {
            platform,
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
          platform,
          videoId: item.videoId,
          title: item.title,
          url: item.url,
          publishedAt: item.publishedAt,
          raw: item.raw as object,
          creatorId: creator.id,
        },
      });
    }
    await db.creator.update({
      where: { id: creator.id },
      data: { lastFetchedAt: new Date() },
    });
  } catch {
    // Ignore auto-fetch errors so adding creator still succeeds.
  }

  return redirectTo(req, "/admin/creators");
}