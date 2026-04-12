import { NextRequest } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { NextResponse } from "next/server";
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

  await db.creator.delete({ where: { id } });
  return redirectTo(req, "/admin/creators");
}
