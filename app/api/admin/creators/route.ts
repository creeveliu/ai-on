import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirectTo } from "@/lib/http";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const name = String(formData.get("name") ?? "").trim();
  const mid = String(formData.get("mid") ?? "").trim();
  const enabled = formData.get("enabled") === "on";

  if (!name || !mid) {
    return redirectTo(req, "/admin/creators?error=invalid");
  }

  await db.creator.upsert({
    where: { mid },
    update: { name, enabled },
    create: {
      name,
      mid,
      enabled,
      platform: "bilibili",
    },
  });

  return redirectTo(req, "/admin/creators");
}
