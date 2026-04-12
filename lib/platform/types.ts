import { Platform } from "@prisma/client";

export type PlatformVideo = {
  videoId: string;
  title: string;
  url: string;
  publishedAt: Date;
  raw: unknown;
};

export type PlatformCreatorProfile = {
  name: string | null;
  avatarUrl: string | null;
};

export type PlatformClient = {
  fetchLatestVideos(platformId: string): Promise<PlatformVideo[]>;
  fetchProfile(platformId: string): Promise<PlatformCreatorProfile>;
  fetchDisplayName(platformId: string): Promise<string | null>;
  parsePlatformId(input: string): string | null;
};

export function detectPlatformFromUrl(url: string): Platform | null {
  if (url.includes("bilibili.com") || url.includes("bilibili.cn")) {
    return "bilibili";
  }
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "youtube";
  }
  return null;
}