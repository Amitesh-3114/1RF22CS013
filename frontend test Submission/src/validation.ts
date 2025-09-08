export function isValidUrl(s: string): boolean {
  try { new URL(s); return true; } catch { return false; }
}

export function isValidShortcode(s: string): boolean {
  // Alphanumeric, 3–20 chars (tweak if needed)
  return /^[a-zA-Z0-9_-]{3,20}$/.test(s);
}
