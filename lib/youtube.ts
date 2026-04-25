import { getEnv } from "@/lib/env";

export type YouTubeVideo = {
  videoId: string;
  title: string;
  url: string;
  publishedAt: Date;
  raw: unknown;
};

export type YouTubeCreatorProfile = {
  name: string | null;
  avatarUrl: string | null;
};

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

async function youtubeFetch(endpoint: string, params: Record<string, string>) {
  const { YOUTUBE_API_KEY } = getEnv();
  if (!YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY is not configured");
  }

  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
  url.searchParams.set("key", YOUTUBE_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API error (${res.status}): ${text}`);
  }

  return res.json();
}

export async function fetchCreatorLatestVideos(channelId: string): Promise<YouTubeVideo[]> {
  // 1. Get uploads playlist ID from channel
  const channelRes = await youtubeFetch("channels", {
    part: "contentDetails",
    id: channelId,
  });

  const uploadsPlaylistId = channelRes?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new Error("Could not find uploads playlist for channel");
  }

  // 2. Get videos from uploads playlist
  const playlistRes = await youtubeFetch("playlistItems", {
    part: "snippet,contentDetails",
    playlistId: uploadsPlaylistId,
    maxResults: "30",
  });

  const items = playlistRes?.items ?? [];

  // Extract video IDs
  const videoIds = items
    .filter((item: { contentDetails?: { videoId?: string } }) => item?.contentDetails?.videoId)
    .map((item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId);

  // 3. Batch fetch video durations (up to 50 IDs per request)
  const durationMap: Record<string, string> = {};
  if (videoIds.length > 0) {
    try {
      const videosRes = await youtubeFetch("videos", {
        part: "contentDetails",
        id: videoIds.join(","),
      });

      for (const video of (videosRes?.items ?? [])) {
        const vid = video?.id;
        const duration = video?.contentDetails?.duration; // ISO 8601 format: "PT4M13S"
        if (vid && duration) {
          durationMap[vid] = duration;
        }
      }
    } catch {
      // Ignore duration fetch errors
    }
  }

  return items
    .filter((item: { contentDetails?: { videoId?: string } }) => item?.contentDetails?.videoId)
    .map((item: { contentDetails: { videoId: string }; snippet: { title?: string; publishedAt?: string } }) => {
      const videoId = item.contentDetails.videoId;
      const duration = durationMap[videoId];
      return {
        videoId,
        title: item.snippet?.title ?? "Untitled",
        url: `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt: new Date(item.snippet?.publishedAt ?? Date.now()),
        raw: { ...item, duration },
      };
    });
}

export async function fetchCreatorProfile(channelId: string): Promise<YouTubeCreatorProfile> {
  const res = await youtubeFetch("channels", {
    part: "snippet",
    id: channelId,
  });

  const channel = res?.items?.[0]?.snippet;
  if (!channel) {
    return { name: null, avatarUrl: null };
  }

  return {
    name: channel.title ?? null,
    avatarUrl: channel.thumbnails?.default?.url ?? channel.thumbnails?.medium?.url ?? null,
  };
}

export async function fetchCreatorDisplayName(channelId: string): Promise<string | null> {
  const profile = await fetchCreatorProfile(channelId);
  return profile.name;
}

/**
 * Parse YouTube channel ID from various input formats:
 * - Direct channel ID: UC...
 * - Channel URL: https://www.youtube.com/channel/UC...
 * - Handle URL: https://www.youtube.com/@handle
 * - Custom URL: https://www.youtube.com/c/name
 */
export function parseYouTubeChannelId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct channel ID format: UC... (22 chars after UC)
  if (/^UC[A-Za-z0-9_-]{22}$/.test(trimmed)) return trimmed;

  // URL formats
  const patterns = [
    /youtube\.com\/channel\/([^\/\?]+)/i,
    /youtube\.com\/@([^\/\?]+)/i,
    /youtube\.com\/c\/([^\/\?]+)/i,
    /youtube\.com\/user\/([^\/\?]+)/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Resolve a handle or custom URL to a proper channel ID (UC...)
 * Required for handles like @name and custom URLs like /c/name
 */
export async function resolveChannelId(handleOrId: string): Promise<string | null> {
  // If already a proper channel ID, return it
  if (/^UC[A-Za-z0-9_-]{22}$/.test(handleOrId)) {
    return handleOrId;
  }

  // Try to resolve via forHandle parameter (for @handles)
  try {
    const handleRes = await youtubeFetch("channels", {
      part: "id",
      forHandle: handleOrId,
    });

    const resolvedId = handleRes?.items?.[0]?.id;
    if (resolvedId) return resolvedId;
  } catch {
    // Continue to next method
  }

  // Try search for custom URLs
  try {
    const searchRes = await youtubeFetch("search", {
      part: "snippet",
      q: handleOrId,
      type: "channel",
      maxResults: "1",
    });

    const foundId = searchRes?.items?.[0]?.snippet?.channelId;
    if (foundId) return foundId;
  } catch {
    // Ignore search failures
  }

  return null;
}
