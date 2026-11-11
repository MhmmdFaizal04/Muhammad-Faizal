import { isSameOrigin, jsonError, readJson, type Env } from "../_lib/chat";
import emojiRegex from "emoji-regex";

type TargetType = "project" | "certificate";
type Item = { counts: Record<string, number>; mine: string | null };

const projects = new Set(["pusat-mlbb", "underspec-sulbagsel"]);
const certificates = new Set(["6734", "6733", "5235", "5234", "5233", "4572", "4571", "4570", "1514", "1086", "1085", "175"]);
const emojiPattern = emojiRegex();

function visitorId(request: Request) {
  const value = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("portfolio_visitor="))?.slice("portfolio_visitor=".length);
  return value && /^[0-9a-f-]{36}$/.test(value) ? value : null;
}

function validTarget(type: unknown, id: unknown): type is TargetType {
  return (type === "project" && typeof id === "string" && projects.has(id)) || (type === "certificate" && typeof id === "string" && certificates.has(id));
}

function blank(): Item { return { counts: {}, mine: null }; }

function isEmoji(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 64) return false;
  const matches = value.match(emojiPattern);
  return matches?.length === 1 && matches[0] === value;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const type = new URL(request.url).searchParams.get("type");
  if (type !== "project" && type !== "certificate") return jsonError("Invalid target type.", 400);
  const visitor = visitorId(request);
  const [totals, mine] = await Promise.all([
    env.DB.prepare("SELECT target_id, reaction_type, COUNT(*) AS total FROM site_reactions WHERE target_type = ? GROUP BY target_id, reaction_type").bind(type).all<{ target_id: string; reaction_type: string; total: number }>(),
    visitor ? env.DB.prepare("SELECT target_id, reaction_type FROM site_reactions WHERE target_type = ? AND visitor_id = ?").bind(type, visitor).all<{ target_id: string; reaction_type: string }>() : Promise.resolve({ results: [] }),
  ]);
  const items: Record<string, Item> = {};
  for (const row of totals.results) {
    items[row.target_id] ??= blank();
    items[row.target_id].counts[row.reaction_type] = row.total;
  }
  for (const row of mine.results) {
    items[row.target_id] ??= blank();
    items[row.target_id].mine = row.reaction_type;
  }
  return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!isSameOrigin(request)) return jsonError("Invalid request origin.", 403);
  const input = await readJson(request);
  if (!validTarget(input?.type, input?.id) || !isEmoji(input?.reaction)) return jsonError("Invalid reaction.", 400);
  const visitor = visitorId(request);
  if (!visitor || !await env.DB.prepare("SELECT id FROM site_visitors WHERE id = ?").bind(visitor).first()) return jsonError("Visitor session required.", 401);

  await env.DB.prepare("INSERT INTO site_reactions (target_type, target_id, visitor_id, reaction_type) VALUES (?, ?, ?, ?) ON CONFLICT(target_type, target_id, visitor_id) DO UPDATE SET reaction_type = excluded.reaction_type, updated_at = datetime('now')").bind(input.type, input.id, visitor, input.reaction).run();
  const rows = await env.DB.prepare("SELECT reaction_type, COUNT(*) AS total FROM site_reactions WHERE target_type = ? AND target_id = ? GROUP BY reaction_type").bind(input.type, input.id).all<{ reaction_type: string; total: number }>();
  const item = blank();
  item.mine = input.reaction;
  for (const row of rows.results) item.counts[row.reaction_type] = row.total;
  return Response.json(item, { headers: { "Cache-Control": "no-store" } });
};
