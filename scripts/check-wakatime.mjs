import { readFile } from "node:fs/promises";

const localVars = await readFile(new URL("../.dev.vars", import.meta.url), "utf8");
const secret = localVars.match(/^WAKATIME_OAUTH_TOKEN=(.*)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, "");
if (!secret) throw new Error("WAKATIME_OAUTH_TOKEN belum disetel di .dev.vars");

async function request(path) {
  const response = await fetch(`https://api.wakatime.com/api/v1/${path}`, {
    headers: { Authorization: `Bearer ${secret}`, Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, data: json.data };
}

const [account, total] = await Promise.all([
  request("users/current"),
  request("users/current/all_time_since_today"),
]);
const today = new Intl.DateTimeFormat("en-CA", { timeZone: account.data?.timezone || "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const summary = await request(`users/current/summaries?start=${today}&end=${today}`);

console.log(JSON.stringify({
  accountStatus: account.status,
  account: account.data?.username ?? account.data?.user?.username ?? null,
  linkedGithub: account.data?.github_username ?? null,
  lastHeartbeat: account.data?.last_heartbeat_at ?? null,
  lastPlugin: account.data?.last_plugin_name ?? null,
  statsStatus: total.status,
  totalSeconds: total.data?.total_seconds ?? null,
  statsReady: total.data?.is_up_to_date ?? null,
  percentCalculated: total.data?.percent_calculated ?? null,
  todaySummaryStatus: summary.status,
  todaySeconds: summary.data?.[0]?.grand_total?.total_seconds ?? null,
}, null, 2));
