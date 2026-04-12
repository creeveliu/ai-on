import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getAllowedHosts(): string[] {
  // Combine all platform hosts
  const bilibiliHosts = ["hdslb.com", "bilibili.com"];
  const youtubeHosts = ["ytimg.com", "youtube.com", "ggpht.com"];
  return [...bilibiliHosts, ...youtubeHosts];
}

function isAllowedHost(hostname: string): boolean {
  const allowed = getAllowedHosts();
  return allowed.some((h) => hostname.endsWith(h) || hostname === h);
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return new NextResponse("Missing url", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (!isAllowedHost(target.hostname)) {
    return new NextResponse("Forbidden host", { status: 403 });
  }

  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  };

  // Add platform-specific headers
  if (target.hostname.includes("bilibili") || target.hostname.includes("hdslb")) {
    headers["Referer"] = "https://www.bilibili.com/";
  } else if (target.hostname.includes("youtube") || target.hostname.includes("ytimg") || target.hostname.includes("ggpht")) {
    headers["Referer"] = "https://www.youtube.com/";
  }

  const upstream = await fetch(target.toString(), {
    headers,
    cache: "force-cache",
  });

  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Upstream image failed", { status: upstream.status || 502 });
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}