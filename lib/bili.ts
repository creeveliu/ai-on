import crypto from "node:crypto";

import { ProxyAgent } from "undici";

import { getEnv } from "@/lib/env";

type BiliVideo = {
  bvid: string;
  title: string;
  url: string;
  publishedAt: Date;
  raw: unknown;
};

const MIXIN_KEY_ENC_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5,
  49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55,
  40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62,
  11, 36, 20, 34, 44, 52,
];

function encWbiKey(key: string) {
  return MIXIN_KEY_ENC_TAB.map((i) => key[i]).join("").slice(0, 32);
}

function signParams(params: Record<string, string | number>, mixinKey: string) {
  const wts = Math.floor(Date.now() / 1000);
  const searchParams = new URLSearchParams();

  const sortedEntries = Object.entries({ ...params, wts }).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  for (const [k, v] of sortedEntries) {
    searchParams.set(
      k,
      String(v).replace(/[!'()*]/g, ""),
    );
  }

  const query = searchParams.toString();
  const wRid = crypto.createHash("md5").update(query + mixinKey).digest("hex");

  searchParams.set("w_rid", wRid);
  return searchParams;
}

async function biliFetch(url: string) {
  const { BILI_SESSDATA, BILI_PROXY } = getEnv();

  const init: RequestInit & { dispatcher?: ProxyAgent } = {
    headers: {
      Cookie: `SESSDATA=${BILI_SESSDATA}`,
      Referer: "https://www.bilibili.com",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    },
  };

  if (BILI_PROXY) {
    init.dispatcher = new ProxyAgent(BILI_PROXY);
  }

  const res = await fetch(url, init);
  const json = await res.json();
  return json;
}

async function getMixinKey() {
  const nav = await biliFetch("https://api.bilibili.com/x/web-interface/nav");
  const imgUrl = String(nav?.data?.wbi_img?.img_url ?? "");
  const subUrl = String(nav?.data?.wbi_img?.sub_url ?? "");

  if (!imgUrl || !subUrl) {
    throw new Error("Failed to get Bilibili wbi keys");
  }

  const imgKey = imgUrl.split("/").pop()?.split(".")[0] ?? "";
  const subKey = subUrl.split("/").pop()?.split(".")[0] ?? "";
  return encWbiKey(imgKey + subKey);
}

export async function fetchCreatorLatestVideos(mid: string): Promise<BiliVideo[]> {
  const mixinKey = await getMixinKey();
  const params = signParams(
    {
      mid,
      ps: 30,
      pn: 1,
      order: "pubdate",
    },
    mixinKey,
  );

  const endpoint = `https://api.bilibili.com/x/space/wbi/arc/search?${params.toString()}`;

  let attempts = 0;
  while (attempts < 3) {
    attempts += 1;
    const json = await biliFetch(endpoint);
    const code = Number(json?.code ?? -1);

    if (code === 0) {
      const list = (json?.data?.list?.vlist ?? []) as Array<{
        bvid?: string;
        title?: string;
        created?: number;
      }>;

      return list
        .filter((item) => item.bvid && item.title && item.created)
        .map((item) => ({
          bvid: item.bvid!,
          title: item.title!,
          url: `https://www.bilibili.com/video/${item.bvid}`,
          publishedAt: new Date((item.created ?? 0) * 1000),
          raw: item,
        }));
    }

    if ([-352, -412, -401].includes(code) && attempts < 3) {
      await new Promise((resolve) => setTimeout(resolve, attempts * 1500));
      continue;
    }

    throw new Error(`Bilibili fetch failed (code=${code}, message=${json?.message ?? "unknown"})`);
  }

  throw new Error("Bilibili fetch exhausted retries");
}
