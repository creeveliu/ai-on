import { Platform } from "@prisma/client";

import { parseMid, fetchCreatorLatestVideos, fetchCreatorProfile, fetchCreatorDisplayName } from "@/lib/bilibili";
import { parseYouTubeChannelId, fetchCreatorLatestVideos as ytFetchVideos, fetchCreatorProfile as ytFetchProfile, fetchCreatorDisplayName as ytFetchDisplayName, resolveChannelId } from "@/lib/youtube";
import type { PlatformClient, PlatformVideo, PlatformCreatorProfile } from "./types";

const clients: Record<Platform, PlatformClient> = {
  bilibili: {
    fetchLatestVideos: (mid) => fetchCreatorLatestVideos(mid),
    fetchProfile: (mid) => fetchCreatorProfile(mid),
    fetchDisplayName: (mid) => fetchCreatorDisplayName(mid),
    parsePlatformId: (input) => parseMid(input),
  },
  youtube: {
    fetchLatestVideos: async (channelId) => {
      // Resolve handle to channel ID if needed
      let resolvedId = channelId;
      if (!/^UC[A-Za-z0-9_-]{22}$/.test(channelId)) {
        const resolved = await resolveChannelId(channelId);
        if (!resolved) {
          throw new Error(`Could not resolve YouTube channel: ${channelId}`);
        }
        resolvedId = resolved;
      }
      return ytFetchVideos(resolvedId);
    },
    fetchProfile: async (channelId) => {
      let resolvedId = channelId;
      if (!/^UC[A-Za-z0-9_-]{22}$/.test(channelId)) {
        const resolved = await resolveChannelId(channelId);
        if (!resolved) {
          return { name: null, avatarUrl: null };
        }
        resolvedId = resolved;
      }
      return ytFetchProfile(resolvedId);
    },
    fetchDisplayName: async (channelId) => {
      let resolvedId = channelId;
      if (!/^UC[A-Za-z0-9_-]{22}$/.test(channelId)) {
        const resolved = await resolveChannelId(channelId);
        if (!resolved) return null;
        resolvedId = resolved;
      }
      return ytFetchDisplayName(resolvedId);
    },
    parsePlatformId: (input) => parseYouTubeChannelId(input),
  },
};

export function getPlatformClient(platform: Platform): PlatformClient {
  return clients[platform];
}

export { detectPlatformFromUrl } from "./types";
export type { PlatformVideo, PlatformCreatorProfile, PlatformClient } from "./types";