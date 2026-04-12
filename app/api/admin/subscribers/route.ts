import { NextRequest } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redirectTo } from "@/lib/http";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const email = String(formData.get("email") ?? "").trim();
  const enabled = formData.get("enabled") === "on";

  if (!email) {
    return redirectTo(req, "/admin/subscribers?error=invalid");
  }

  await db.subscriber.upsert({
    where: { email },
    update: { enabled },
    create: { email, enabled },
  });

  return redirectTo(req, "/admin/subscribers");
}
