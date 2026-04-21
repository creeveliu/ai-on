import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { redirectTo } from "@/lib/http";
import { runFetchVideosJob } from "@/lib/jobs/fetchVideos";

export const runtime = "nodejs";
export const maxDuration = 180;

function isAuthorized(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${getEnv().CRON_SECRET}`;
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  const byCron = isAuthorized(req);

  if (!admin && !byCron) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await runFetchVideosJob();

  if (admin && !byCron) {
    return redirectTo(req, "/admin/jobs");
  }

  return NextResponse.json({ ok: true, ...result });
}
