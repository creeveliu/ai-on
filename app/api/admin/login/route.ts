import { NextRequest } from "next/server";

import { setAdminSession, validateAdminCredentials } from "@/lib/auth";
import { redirectTo } from "@/lib/http";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const admin = await validateAdminCredentials(email, password);

  if (!admin) {
    return redirectTo(req, "/admin/login?error=invalid");
  }

  await setAdminSession({ adminId: admin.id, email: admin.email });
  return redirectTo(req, "/admin/creators");
}
