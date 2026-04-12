import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirectTo } from "@/lib/http";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const formData = await req.formData();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return redirectTo(req, "/admin/creators?error=invalid_name");
  }

  await db.creator.update({
    where: { id },
    data: { name },
  });

  return redirectTo(req, "/admin/creators");
}
