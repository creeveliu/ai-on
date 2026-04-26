import { JobStatus } from "@prisma/client";
import { Resend } from "resend";

import { getEnv } from "@/lib/env";

type JobAlertFailure = {
  reason?: string;
  email?: string;
  platform?: string;
  platformId?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderFailures(failures: JobAlertFailure[]) {
  if (failures.length === 0) {
    return "<p>No failure details were recorded.</p>";
  }

  const items = failures
    .map((failure) => {
      const target = failure.email ?? [failure.platform, failure.platformId].filter(Boolean).join(":");
      const label = target ? `<strong>${escapeHtml(target)}</strong>: ` : "";
      return `<li>${label}${escapeHtml(failure.reason ?? "Unknown error")}</li>`;
    })
    .join("");

  return `<ul>${items}</ul>`;
}

export async function sendJobFailureEmail({
  jobName,
  status,
  summary,
  failures = [],
}: {
  jobName: string;
  status: JobStatus;
  summary: string;
  failures?: JobAlertFailure[];
}) {
  const env = getEnv();
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) {
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  await resend.emails.send({
    from: env.MAIL_FROM,
    to: env.ADMIN_EMAIL,
    subject: `[AI ON] Cron ${jobName} ${status}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:720px;margin:0 auto;color:#111;">
        <h2>AI ON Cron Alert</h2>
        <p><strong>Job:</strong> ${escapeHtml(jobName)}</p>
        <p><strong>Status:</strong> ${escapeHtml(status)}</p>
        <p><strong>Summary:</strong> ${escapeHtml(summary)}</p>
        <h3>Failures</h3>
        ${renderFailures(failures)}
      </div>
    `,
  });
}

