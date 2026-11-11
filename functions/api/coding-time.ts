import { type Env } from "../_lib/chat";

type CodingTime = { hours: number | null; source: "WakaTime" | null; period: "all_time" | "today" | null };

const CACHE_KEY = "coding_time_v2";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const unavailable = { hours: null, source: null, period: null } satisfies CodingTime;
  if (!env.WAKATIME_OAUTH_TOKEN) return Response.json(unavailable, { headers: { "Cache-Control": "no-store" } });

  const cached = await env.DB.prepare("SELECT payload, updated_at FROM github_cache WHERE cache_key = ?").bind(CACHE_KEY).first<{ payload: string; updated_at: number }>();
  if (cached && Date.now() - cached.updated_at < 120_000) return new Response(cached.payload, { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

  try {
    const headers = { Authorization: `Bearer ${env.WAKATIME_OAUTH_TOKEN}`, Accept: "application/json" };
    const [response, userResponse] = await Promise.all([
      fetch("https://api.wakatime.com/api/v1/users/current/all_time_since_today", { headers }),
      fetch("https://api.wakatime.com/api/v1/users/current", { headers }),
    ]);
    if (!response.ok) throw new Error("WakaTime unavailable");
    const result = await response.json() as { data?: { total_seconds?: number; is_up_to_date?: boolean } };
    const seconds = result.data?.total_seconds;
    if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) throw new Error("Invalid WakaTime response");
    let measuredSeconds = seconds;
    let period: CodingTime["period"] = "all_time";

    if (userResponse.ok) {
      try {
        const user = await userResponse.json() as { data?: { timezone?: string } };
        const today = new Intl.DateTimeFormat("en-CA", { timeZone: user.data?.timezone || "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
        const summaryResponse = await fetch(`https://api.wakatime.com/api/v1/users/current/summaries?start=${today}&end=${today}`, { headers });
        if (summaryResponse.ok) {
          const summary = await summaryResponse.json() as { data?: { grand_total?: { total_seconds?: number } }[] };
          const todaySeconds = summary.data?.[0]?.grand_total?.total_seconds;
          if (typeof todaySeconds === "number" && Number.isFinite(todaySeconds) && todaySeconds > measuredSeconds) {
            measuredSeconds = todaySeconds;
            period = "today";
          }
        }
      } catch { /* Keep the available all-time value if daily data cannot be loaded. */ }
    }

    const payload = JSON.stringify({ hours: Math.round(measuredSeconds / 360) / 10, source: "WakaTime", period } satisfies CodingTime);
    await env.DB.prepare("INSERT INTO github_cache (cache_key, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(cache_key) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at").bind(CACHE_KEY, payload, Date.now()).run();
    return new Response(payload, { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    return cached ? new Response(cached.payload, { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }) : Response.json(unavailable, { headers: { "Cache-Control": "no-store" } });
  }
};
