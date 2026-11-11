export interface Env {
  DB: D1Database;
  GITHUB_TOKEN?: string;
  WAKATIME_OAUTH_TOKEN?: string;
  OWNER_ADMIN_KEY?: string;
}

export type Session = { id: string; username: string };

export async function getSession(request: Request, db: D1Database): Promise<Session | null> {
  const cookie = request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith("portfolio_session="));
  const id = cookie?.slice("portfolio_session=".length);
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return null;
  return db.prepare("SELECT id, username FROM chat_sessions WHERE id = ? AND expires_at > ?").bind(id, new Date().toISOString()).first<Session>();
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return null;
  try {
    const value: unknown = await request.json();
    return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}
