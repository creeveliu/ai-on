import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/auth";

export default async function AdminIndexPage() {
  await requireAdminSession();
  redirect("/admin/creators");
}
