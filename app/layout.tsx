import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-ON",
  description: "AI 驱动的 B 站创作者聚合与日报推送",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
