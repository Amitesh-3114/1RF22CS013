// Reusable logging function: Log(stack, level, pkg, message)
// Sends logs to your external Test Server (replace LOG_SERVER if needed)
const LOG_SERVER = import.meta.env.VITE_LOG_SERVER || "http://localhost:9000/logs";

export async function Log(
  stack: "frontend" | "backend" | string,
  level: "info" | "warn" | "error" | "fatal" | string,
  pkg: string,
  message: string
) {
  const payload = {
    stack,
    level,
    package: pkg,
    message,
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(LOG_SERVER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Intentionally swallow errors (no console.log allowed)
  }
}
