import { mkdir, readFile, writeFile } from "node:fs/promises";

const login = "MhmmdFaizal04";
const destination = new URL("../public/github-snapshot.json", import.meta.url);
const headers = { "User-Agent": "faizal-portfolio", Accept: "application/vnd.github+json" };

async function fetchText(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

function parseCalendar(html) {
  const totalMatch = html.match(/<h2[^>]*id="js-contribution-activity-description"[^>]*>\s*([\d,]+)\s+contributions/);
  const days = Array.from(html.matchAll(/<td\b[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="([0-4])"[^>]*><\/td>([\s\S]{0,600}?)<\/tool-tip>/g), ([, date, level, tooltip]) => ({
    date,
    level: Number(level),
    count: Number(tooltip.match(/>(\d+) contributions? on/)?.[1] ?? 0),
  })).sort((a, b) => a.date.localeCompare(b.date));
  if (!totalMatch || days.length < 350) throw new Error("GitHub's public contribution calendar format changed.");
  return { total: Number(totalMatch[1].replaceAll(",", "")), days };
}

try {
  const [profile, repos, html] = await Promise.all([
    fetchText(`https://api.github.com/users/${login}`, { headers }),
    fetchText(`https://api.github.com/users/${login}/repos?sort=updated&per_page=30&type=owner`, { headers }),
    fetchText(`https://github.com/users/${login}/contributions`, { headers: { "User-Agent": headers["User-Agent"], Accept: "text/html" } }),
  ]);
  const snapshot = {
    profile: JSON.parse(profile),
    repos: JSON.parse(repos).filter((repo) => !repo.fork).slice(0, 12),
    contributions: parseCalendar(html),
    updatedAt: new Date().toISOString(),
  };
  await mkdir(new URL("../public/", import.meta.url), { recursive: true });
  await writeFile(destination, JSON.stringify(snapshot));
  console.log(`GitHub snapshot ready: ${snapshot.contributions.total} contributions, ${snapshot.contributions.days.length} days.`);
} catch (error) {
  try {
    const previous = JSON.parse(await readFile(destination, "utf8"));
    if (!previous.profile?.login || !previous.contributions?.days?.length) throw new Error("Snapshot is incomplete.");
    console.warn(`GitHub sync failed (${error.message}); using the existing snapshot.`);
  } catch {
    throw new Error("Cannot build the GitHub chart without a valid snapshot or GitHub connection.", { cause: error });
  }
}
