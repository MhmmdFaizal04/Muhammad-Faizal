import { jsonError, type Env } from "../_lib/chat";

const LOGIN = "MhmmdFaizal04";
const HEADERS = { "Accept": "application/vnd.github+json", "User-Agent": "faizal-portfolio", "X-GitHub-Api-Version": "2022-11-28" };
const LEVELS: Record<string, number> = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

type Day = { date: string; contributionCount: number; contributionLevel: string };
type ContributionsResponse = { data?: { user?: { contributionsCollection?: { contributionCalendar?: { totalContributions: number; weeks: { contributionDays: Day[] }[] } } } } };

async function githubJson(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, { ...init, headers: { ...HEADERS, ...init?.headers } });
  if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
  return response.json();
}

async function publicContributionCalendar(): Promise<{ total: number; days: { date: string; count: number; level: number }[] } | null> {
  const response = await fetch(`https://github.com/users/${LOGIN}/contributions`, { headers: { "User-Agent": "faizal-portfolio", "Accept": "text/html" } });
  if (!response.ok) return null;
  const html = await response.text();
  const totalMatch = html.match(/<h2[^>]*id="js-contribution-activity-description"[^>]*>\s*([\d,]+)\s+contributions/);
  const days = Array.from(html.matchAll(/<td\b[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="([0-4])"[^>]*><\/td>([\s\S]{0,600}?)<\/tool-tip>/g), ([, date, level, tooltip]) => ({
    date,
    level: Number(level),
    count: Number(tooltip.match(/>(\d+) contributions? on/)?.[1] ?? 0),
  })).sort((a, b) => a.date.localeCompare(b.date));
  if (days.length < 350 || !totalMatch) return null;
  return { total: Number(totalMatch[1].replaceAll(",", "")), days };
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const cached = await env.DB.prepare("SELECT payload, updated_at FROM github_cache WHERE cache_key = 'profile'").first<{ payload: string; updated_at: number }>();
  if (cached && Date.now() - cached.updated_at < 3_600_000) return new Response(cached.payload, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=120" } });

  try {
    const [profile, repoResult] = await Promise.all([
      githubJson(`https://api.github.com/users/${LOGIN}`),
      githubJson(`https://api.github.com/users/${LOGIN}/repos?sort=updated&per_page=30&type=owner`),
    ]);
    let contributions: { total: number; days: { date: string; count: number; level: number }[] } | null = null;
    if (env.GITHUB_TOKEN) {
      try {
        const result = await githubJson("https://api.github.com/graphql", {
          method: "POST",
          headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query: "query($login:String!) { user(login:$login) { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }", variables: { login: LOGIN } }),
        }) as ContributionsResponse;
        const calendar = result.data?.user?.contributionsCollection?.contributionCalendar;
        if (calendar) contributions = { total: calendar.totalContributions, days: calendar.weeks.flatMap((week) => week.contributionDays.map((day) => ({ date: day.date, count: day.contributionCount, level: LEVELS[day.contributionLevel] ?? 0 }))) };
      } catch { /* Profile and repositories remain available without GraphQL access. */ }
    }
    if (!contributions) {
      try { contributions = await publicContributionCalendar(); } catch { /* Mark calendar unavailable if GitHub's public format changes. */ }
    }
    const repos = (repoResult as { fork: boolean }[]).filter((repo) => !repo.fork).slice(0, 12);
    const payload = JSON.stringify({ profile, repos, contributions, updatedAt: new Date().toISOString() });
    await env.DB.prepare("INSERT INTO github_cache (cache_key, payload, updated_at) VALUES ('profile', ?, ?) ON CONFLICT(cache_key) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at").bind(payload, Date.now()).run();
    return new Response(payload, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=120" } });
  } catch {
    if (cached) return new Response(cached.payload, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=60" } });
    return jsonError("GitHub is temporarily unavailable.", 503);
  }
};
