import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { fetchCreatorLatestVideos, fetchCreatorProfile } from "@/lib/bili";
import { db } from "@/lib/db";
import { redirectTo } from "@/lib/http";

function parseMid(value: string): string | null {
  const input = value.trim();
  if (!input) return null;
  if (/^\d+$/.test(input)) return input;

  // Supports links like:
  // https://space.bilibili.com/12345
  // https://m.bilibili.com/space/12345
  const match = input.match(/(?:space\.bilibili\.com\/|\/space\/)(\d+)/i);
  if (match?.[1]) return match[1];

  // Last fallback: extract a number sequence from pasted content.
  const loose = input.match(/(\d{3,})/);
  return loose?.[1] ?? null;
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const mid = parseMid(String(formData.get("link") ?? formData.get("mid") ?? ""));

  if (!mid) {
    return redirectTo(req, "/admin/creators?error=invalid");
  }

  let finalName: string;
  let avatarUrl: string | null = null;
  try {
    const profile = await fetchCreatorProfile(mid);
    finalName = profile.name ?? `up_${mid}`;
    avatarUrl = profile.avatarUrl;
  } catch {
    finalName = `up_${mid}`;
  }

  const creator = await db.creator.upsert({
    where: { mid },
    update: { name: finalName, avatarUrl, enabled: true },
    create: {
      name: finalName,
      mid,
      avatarUrl,
      enabled: true,
      platform: "bilibili",
    },
  });

  // Auto-fetch this creator right after adding/updating.
  try {
    const videos = await fetchCreatorLatestVideos(mid);
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
