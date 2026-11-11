import { isSameOrigin, jsonError, type Env } from "../_lib/chat";

async function countVisitors(db: D1Database): Promise<number> {
  const result = await db.prepare("SELECT COUNT(*) AS total FROM site_visitors").first<{ total: number }>();
  return result?.total ?? 0;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return Response.json({ visitors: await countVisitors(env.DB) }, { headers: { "Cache-Control": "no-store" } });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin.", 403);
  const cookie = request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith("portfolio_visitor="));
  const existingId = cookie?.slice("portfolio_visitor=".length);
  const validId = existingId && /^[0-9a-f-]{36}$/.test(existingId) ? existingId : null;
  const existing = validId ? await env.DB.prepare("SELECT id FROM site_visitors WHERE id = ?").bind(validId).first() : null;
  const id = existing ? validId : crypto.randomUUID();
  if (existing) await env.DB.prepare("UPDATE site_visitors SET last_seen = datetime('now'), page_views = page_views + 1 WHERE id = ?").bind(id).run();
  else await env.DB.prepare("INSERT INTO site_visitors (id) VALUES (?)").bind(id).run();

  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return Response.json({ visitors: await countVisitors(env.DB) }, { headers: { "Cache-Control": "no-store", "Set-Cookie": `portfolio_visitor=${id}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}` } });
};
