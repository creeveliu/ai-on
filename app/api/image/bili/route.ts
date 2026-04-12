import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function isAllowedBiliImageHost(hostname: string) {
  return hostname.endsWith("hdslb.com") || hostname.endsWith("bilibili.com");
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

  if (!isAllowedBiliImageHost(target.hostname)) {
    return new NextResponse("Forbidden host", { status: 403 });
  }

  const upstream = await fetch(target.toString(), {
    headers: {
      Referer: "https://www.bilibili.com/",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    },
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
