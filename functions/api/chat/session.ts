import { getSession, isSameOrigin, jsonError, readJson, type Env } from "../../_lib/chat";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await getSession(request, env.DB);
  return Response.json({ username: session?.username ?? null }, { headers: { "Cache-Control": "no-store" } });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin.", 403);
  const existing = await getSession(request, env.DB);
  if (existing) return Response.json({ username: existing.username });

  const input = await readJson(request);
  const username = typeof input?.username === "string" ? input.username.trim() : "";
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) return jsonError("Use 3–24 letters, numbers, or underscores for your username.", 400);
  if (/^(admin|administrator|moderator|muhammadfaizal|faizal|mhmmdfaizal04|system)$/i.test(username)) return jsonError("That username is reserved.", 400);

  const id = crypto.randomUUID();
  const expires = new Date(Date.now() + 30 * 86400_000).toISOString();
  await env.DB.prepare("INSERT INTO chat_sessions (id, username, expires_at) VALUES (?, ?, ?)").bind(id, username, expires).run();
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return Response.json({ username }, { headers: { "Set-Cookie": `portfolio_session=${id}; Path=/api/chat; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`, "Cache-Control": "no-store" } });
};
