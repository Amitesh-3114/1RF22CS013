// src/storage.ts
export interface ShortUrl {
  originalUrl: string;
  shortcode: string;
  createdAt: number;
  expiresAt: number;
  clicks: { timestamp: number; source?: string; location?: string }[];
}

export const urlDatabase: Map<string, ShortUrl> = new Map();
