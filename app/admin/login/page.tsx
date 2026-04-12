import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/auth";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin/creators");
  }

  return (
    <main style={{ maxWidth: 460, margin: "40px auto", padding: 24 }}>
      <h1>管理员登录</h1>
      <form action="/api/admin/login" method="post" style={{ display: "grid", gap: 12 }}>
        <input name="email" type="email" placeholder="Email" required style={{ padding: "8px 10px" }} />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          style={{ padding: "8px 10px" }}
        />
        <button type="submit">登录</button>
      </form>
      <p style={{ marginTop: 12 }}>
        <Link href="/">返回首页</Link>
      </p>
    </main>
  );
}
