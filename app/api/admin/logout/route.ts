import { NextRequest } from "next/server";

import { clearAdminSession } from "@/lib/auth";
import { redirectTo } from "@/lib/http";

export async function POST(req: NextRequest) {
  await clearAdminSession();
  return redirectTo(req, "/admin/login");
}
