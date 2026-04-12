import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bilibili Digest",
  description: "Bilibili-first daily digest site",
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
