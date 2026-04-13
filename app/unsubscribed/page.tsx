import Link from "next/link";

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  const succeeded = success === "true";

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 480, padding: 40 }}>
        {succeeded ? (
          <>
            <h1 style={{ fontSize: 24, marginBottom: 12 }}>你已成功退订</h1>
            <p style={{ color: "#666", marginBottom: 24 }}>你将不再收到我们的邮件日报。如果这是误操作，可以重新订阅。</p>
            <Link href="/" style={{ color: "#0070f3", textDecoration: "none" }}>
              返回首页
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 24, marginBottom: 12 }}>退订失败</h1>
            <p style={{ color: "#666", marginBottom: 24 }}>无效的退订链接，或你已完成退订。</p>
            <Link href="/" style={{ color: "#0070f3", textDecoration: "none" }}>
              返回首页
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
