import { Resend } from "resend";

import { getEnv } from "@/lib/env";
import { Platform } from "@prisma/client";

type DigestVideo = {
  platform: Platform;
  creatorName: string;
  title: string;
  url: string;
  publishedAt: Date;
};

function renderDigestHtml(videos: DigestVideo[]) {
  const items = videos
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .map(
      (video) => {
        const platformBadge = video.platform === "bilibili" ? "[B站]" : "[YT]";
        return `<li style="margin-bottom:10px;"><strong>${video.creatorName}</strong> <span style="color:#888;">${platformBadge}</span> · <a href="${video.url}">${video.title}</a> <span style="color:#666;">(${video.publishedAt.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })})</span></li>`;
      },
    )
    .join("");

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 0 auto; color: #111;">
      <h2>视频每日摘要</h2>
      <p>过去 24 小时更新如下：</p>
      <ul style="padding-left: 20px;">
        ${items}
      </ul>
    </div>
  `;
}

export async function sendDigestEmail(to: string, videos: DigestVideo[]) {
  const env = getEnv();
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) {
    throw new Error("RESEND_API_KEY or MAIL_FROM is missing");
  }
  const resend = new Resend(env.RESEND_API_KEY);

  await resend.emails.send({
    from: env.MAIL_FROM,
    to,
    subject: `视频摘要 ${new Date().toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
    html: renderDigestHtml(videos),
  });
}
