import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(6),
  AUTH_JWT_SECRET: z.string().min(16),
  BILI_SESSDATA: z.string().min(1),
  BILI_COOKIE: z.string().min(1).optional(),
  BILI_PROXY: z.string().optional(),
  YOUTUBE_API_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1).optional(),
  MAIL_FROM: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
}
