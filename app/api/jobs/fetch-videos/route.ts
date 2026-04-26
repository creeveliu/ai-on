import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { redirectTo } from "@/lib/http";
import { runFetchVideosJob } from "@/lib/jobs/fetchVideos";
import { sendJobFailureEmail } from "@/lib/mail/jobAlert";

export const runtime = "nodejs";
export const maxDuration = 180;

function isAuthorized(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${getEnv().CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runFetchVideosJob();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    try {
      await sendJobFailureEmail({
        jobName: "fetch_videos",
        status: "failed",
        summary: "Unhandled cron error",
        failures: [{ reason }],
      });
    } catch (alertError) {
      console.error("[fetchVideos] failed to send cron error alert", alertError);
    }
    return NextResponse.json({ ok: false, error: reason }, { status: 500 });
  }
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
