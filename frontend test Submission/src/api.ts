import { Log } from "./logger";

const BASE = import.meta.env.VITE_BACKEND || "http://localhost:5000";

export type CreateShortUrlReq = {
  url: string;
  validity?: number;   // minutes
  shortcode?: string;  // optional custom
};

export type CreateShortUrlRes = {
  shortcode: string;
  originalUrl: string;
  createdAt: number;
  expiresAt: number;
  shortUrl: string;
};

export type ShortUrlStats = {
  shortcode: string;
  originalUrl: string;
  createdAt: number;
  expiresAt: number;
  totalClicks: number;
  clicks: { timestamp: number; source?: string; location?: string }[];
};

export async function createShortUrl(req: CreateShortUrlReq): Promise<CreateShortUrlRes> {
  await Log("frontend", "info", "api", `POST /shorturls for ${req.url}`);
  const r = await fetch(`${BASE}/shorturls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!r.ok) {
    const errText = await r.text();
    await Log("frontend", "error", "api", `Create failed: ${errText}`);
    throw new Error(errText || "Failed to create short URL");
  }
  const data = (await r.json()) as CreateShortUrlRes;
  await Log("frontend", "info", "api", `Created ${data.shortcode}`);
  return data;
}

export async function getStats(code: string): Promise<ShortUrlStats> {
  await Log("frontend", "info", "api", `GET /shorturls/${code}/stats`);
  const r = await fetch(`${BASE}/shorturls/${code}/stats`);
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as ShortUrlStats;
}
