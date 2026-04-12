import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/auth";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin/creators");
  }

  return (
    <main className="ui-shell">
      <section className="ui-header" style={{ maxWidth: 560, margin: "52px auto" }}>
        <h1 className="ui-title" style={{ fontSize: "clamp(30px, 5vw, 44px)" }}>
          后台登录
        </h1>
        <p className="ui-subtitle">管理主播、订阅者与任务调度</p>

        <form action="/api/admin/login" method="post" className="ui-form" style={{ marginTop: 18 }}>
          <input className="ui-input" name="email" type="email" placeholder="Email" required />
          <input className="ui-input" name="password" type="password" placeholder="Password" required />
          <button className="ui-button" type="submit">
            登录
          </button>
        </form>

        <p className="ui-space-top">
          <Link className="ui-muted" href="/">
            返回首页
          </Link>
        </p>
      </section>
    </main>
  );
}
