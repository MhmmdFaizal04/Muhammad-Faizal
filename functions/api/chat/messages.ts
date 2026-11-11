import { getSession, isSameOrigin, jsonError, readJson, type Env } from "../../_lib/chat";

type ChatRow = { id: number; username: string; body: string; created_at: string };

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!await getSession(request, env.DB)) return jsonError("Choose a username to view chat.", 401);
  const after = Number(new URL(request.url).searchParams.get("after") ?? 0);
  if (!Number.isSafeInteger(after) || after < 0) return jsonError("Invalid message cursor.", 400);
  const query = after === 0
    ? env.DB.prepare("SELECT id, username, body, created_at FROM (SELECT id, username, body, created_at FROM chat_messages ORDER BY id DESC LIMIT 50) ORDER BY id ASC")
    : env.DB.prepare("SELECT id, username, body, created_at FROM chat_messages WHERE id > ? ORDER BY id ASC LIMIT 100").bind(after);
  const { results } = await query.all<ChatRow>();
  return Response.json(results, { headers: { "Cache-Control": "no-store" } });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin.", 403);
  const session = await getSession(request, env.DB);
  if (!session) return jsonError("Choose a username before sending a message.", 401);
  const input = await readJson(request);
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  if (!body || body.length > 500 || /[\u0000-\u0008\u000b\u000e-\u001f]/.test(body)) return jsonError("Message must contain 1–500 valid characters.", 400);

  const recent = await env.DB.prepare("SELECT id FROM chat_messages WHERE session_id = ? AND created_at > datetime('now', '-5 seconds') LIMIT 1").bind(session.id).first();
  if (recent) return jsonError("Please wait 5 seconds before sending another message.", 429);
  const result = await env.DB.prepare("INSERT INTO chat_messages (session_id, username, body) VALUES (?, ?, ?)").bind(session.id, session.username, body).run();
  return Response.json({ id: result.meta.last_row_id }, { status: 201, headers: { "Cache-Control": "no-store" } });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.OWNER_ADMIN_KEY || request.headers.get("authorization") !== `Bearer ${env.OWNER_ADMIN_KEY}`) return jsonError("Unauthorized.", 401);
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) return jsonError("Invalid message id.", 400);
  const result = await env.DB.prepare("DELETE FROM chat_messages WHERE id = ?").bind(id).run();
  return Response.json({ deleted: result.meta.changes > 0 }, { headers: { "Cache-Control": "no-store" } });
};
