// src/routes.ts
import { Router, Request, Response } from "express";
import { urlDatabase, ShortUrl } from "./storage";
import { Log } from "./logger";
import { nanoid } from "nanoid";

const router = Router();

// Create Short URL
router.post("/shorturls", async (req: Request, res: Response) => {
  const { url, validity, shortcode } = req.body;

  if (!url || typeof url !== "string") {
    await Log("backend", "error", "api", "Invalid URL input");
    return res.status(400).json({ error: "Invalid URL" });
  }

  let code = shortcode || nanoid(6);

  if (urlDatabase.has(code)) {
    await Log("backend", "error", "api", `Shortcode collision: ${code}`);
    return res.status(409).json({ error: "Shortcode already exists" });
  }

  const createdAt = Date.now();
  const expiresAt = createdAt + ((validity || 30) * 60 * 1000);

  const shortUrl: ShortUrl = { originalUrl: url, shortcode: code, createdAt, expiresAt, clicks: [] };
  urlDatabase.set(code, shortUrl);

  await Log("backend", "info", "api", `Created shortcode ${code} for URL ${url}`);

  res.status(201).json({
    shortcode: code,
    originalUrl: url,
    createdAt,
    expiresAt,
    shortUrl: `http://localhost:5000/${code}`
  });
});

// Redirect to original URL
router.get("/:shortcode", async (req: Request, res: Response) => {
  const code = req.params.shortcode;
  const entry = urlDatabase.get(code);

  if (!entry) {
    await Log("backend", "error", "api", `Shortcode not found: ${code}`);
    return res.status(404).json({ error: "Shortcode not found" });
  }

  if (Date.now() > entry.expiresAt) {
    await Log("backend", "warn", "api", `Expired shortcode: ${code}`);
    return res.status(410).json({ error: "Link expired" });
  }

  entry.clicks.push({ timestamp: Date.now(), source: req.get("referer") || "direct", location: "unknown" });

  await Log("backend", "info", "api", `Redirecting shortcode ${code} to ${entry.originalUrl}`);

  res.redirect(entry.originalUrl);
});

// Stats for a short URL
router.get("/shorturls/:shortcode/stats", async (req: Request, res: Response) => {
  const code = req.params.shortcode;
  const entry = urlDatabase.get(code);

  if (!entry) {
    await Log("backend", "error", "api", `Stats requested for missing shortcode: ${code}`);
    return res.status(404).json({ error: "Shortcode not found" });
  }

  res.json({
    shortcode: entry.shortcode,
    originalUrl: entry.originalUrl,
    createdAt: entry.createdAt,
    expiresAt: entry.expiresAt,
    totalClicks: entry.clicks.length,
    clicks: entry.clicks
  });
});

export default router;
