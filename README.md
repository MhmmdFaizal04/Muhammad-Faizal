# Muhammad Faizal — Portfolio

Next.js static export on Cloudflare Pages, Pages Functions for APIs, D1 for chat/visitor counts/cache, GSAP for animations.

## Home and About Me

Home now contains a text-only introduction and the complete Skills section, including the interactive technology-card shuffle. The large hero portrait is removed; the sidebar profile photo remains. About Me (`#about`) replaces Skills in the sidebar and contains biography, freelance career, and education: SMA Negeri 1 Luwu Utara (2021–2023) and Universitas Muhammadiyah Makassar (2023–2027, expected completion). Legacy `#skills` links redirect to Home. All new text supports ID/EN; the AI profile context includes the same education details.

The university logo at `public/unismuh-logo.png` is sourced from the official university site's icon (`https://www.unismuh.ac.id/wp-content/uploads/2022/09/cropped-logo-unismuh-official-192x192.png`). The high-school logo at `public/Logo-Smansa-Lutra-Baru.png` was supplied by the owner and is displayed on its education card.

## Portfolio AI assistant

The AI Assistant tab appears below Contact and supports ID/EN. `POST /api/ai` sends a single question (no conversation history) to `https://api.rindri.com/v1/chat/completions` with model ID `claude-sonnet-5-5`. This is a provider-specific model ID; availability and model identity depend on ThirtyStore. No provider key is bundled into browser code. Questions leave Cloudflare and are sent to this third-party provider; do not submit private data.

Before deployment:

1. Revoke any API key shared in messages/screenshots. Create a replacement key and save it as a **Production encrypted secret** named `THIRTYSTORE_API_KEY` in Cloudflare Pages. Never commit it or prefix it with `NEXT_PUBLIC_`.
2. Apply `migrations/0005_ai_limits.sql` to the D1 database actually bound as `DB`. Verify the database name and ID in `wrangler.jsonc` first, then run `npx wrangler d1 migrations apply <actual-database-name> --remote`.
3. Push to the production branch to deploy with the new secret and migration.

The server enforces a same-origin check, a 2 KB request-body limit, 400-character questions, a conservative profile-topic/input filter, no user-supplied roles or history, a fixed verified profile, a 240-token output limit, a 25-second upstream timeout, and a basic output-code filter. D1 atomically reserves quota: 3 requests/minute and 20/day per Cloudflare-observed IP, plus 200/day globally (UTC windows). Only a daily rotating hash of the IP is stored with counters, not question/answer text. Failed upstream calls may consume quota; shared IPs share quota. Displayed messages remain in component memory only and reset on leaving the tab. Quotas are conservative: rejected requests during a partial quota reservation may also consume other buckets.

These defenses reduce abuse but are not a guarantee against all prompt injection or automated use. Configure a spending cap at the provider as well; consider Cloudflare Turnstile/WAF for a high-traffic public launch. The assistant has no tools, cannot execute code, and receives no secrets in its prompt. Without a valid secret, migration, or available provider model it returns a localized unavailable message. A real upstream response has not been tested with the exposed key. Run `node scripts/test-ai-policy.mjs` for input-policy checks.

The ID/EN switch in the sidebar changes all interface text across the eight panels. Proper names and original certificates retain their source names; certificate titles in the gallery have English display translations. UI copy lives in `src/components/language.tsx`.

## Run locally

1. `npm install`
2. The supplied Cloudflare D1 database ID is configured in `wrangler.jsonc` under the `DB` binding.
3. Run `npm run dev`. This builds the static site, applies local D1 migrations, and starts Cloudflare Pages Functions. Open the Pages URL printed by Wrangler (usually `http://localhost:8788`); chat and GitHub both work there. `npm run dev:next` is available for Next.js hot reload, but chat cannot work on that Next-only server.
4. After editing the UI, restart `npm run dev` to rebuild the static output.

## GitHub contribution calendar

`npm run build` downloads an authentic GitHub profile, public repositories, and the contribution calendar into `public/github-snapshot.json`. The app uses it if the Pages Function is unavailable (including `npm run dev`). Refresh it any time with `npm run refresh:github`. On Pages, the live API reads GitHub GraphQL when `GITHUB_TOKEN` is available, otherwise the public contribution calendar. Because GitHub can change its public HTML format, add a read-only GitHub personal access token with access to public data as a **Cloudflare Pages encrypted secret** for the most reliable calendar. For local testing, copy `.dev.vars.example` to `.dev.vars` and set the token there. Never commit tokens. The API caches the result in D1 for an hour.

The GitHub page also charts actual contributions by week. GitHub contributions do **not** measure hours worked. To display real coding hours, enable WakaTime in your editor and set `WAKATIME_OAUTH_TOKEN` (OAuth token with `read_stats` and daily summaries access) as a Pages encrypted secret, or in `.dev.vars` for local testing. The app normally shows WakaTime's all-time total; if WakaTime's all-time endpoint reports less than the verified daily summary, it displays today's hours instead and labels the period accurately. Coding-time results are cached for two minutes and refresh while the GitHub panel is open. Run `npm run check:wakatime` locally to compare both upstream measurements without printing the token.

## Featured projects and visitors

The Projects panel shows the user-supplied `image.png` and `image1.png` from the repository root as project previews, with direct links to `https://pusat-mlbb.vercel.app/` and `https://underspec-sulbagsel.vercel.app/`. It does not load projects from GitHub or embed the external sites.

On each browser's first visit, `POST /api/visitors` stores a random browser ID in D1, and the public `GET /api/visitors` reports the total unique browsers **since tracking began**. Returning browsers with the cookie are counted once; cleared cookies/new browsers count anew. No IP address is stored. The count appears in Chat.

## Certificates

The Pencapaian panel displays 12 original PDFs from `Pencapaian/`, with titles and years taken from their contents. During `npm run build`, `scripts/sync-certificates.mjs` copies the PDFs to `public/certificates/` and generates lightweight JPG previews from the first page. The gallery supports year filtering and opens the original PDF in a viewer with a direct PDF link. Generated assets are ignored by Git; keep the original PDFs in `Pencapaian/` when deploying from a Git repository. Run `npm run sync:certificates` to regenerate previews without rebuilding the site.

## Project and certificate reactions

Each project and certificate card starts with a **+** button. Clicking it opens a searchable emoji picker with the full available emoji catalog; selected emoji counts appear beside the button. `GET /api/reactions?type=project|certificate` returns totals and the current visitor's selection. `POST /api/reactions` creates or updates one reaction per target and anonymous browser ID. The `portfolio_visitor` cookie (Path `/api`) identifies a browser; changing reaction replaces the previous reaction instead of incrementing twice. Clearing cookies starts a new anonymous visitor identity, so this is not account-level verification. Apply the D1 migrations locally/remote; `0004_emoji_reactions.sql` converts previous heart/fire/clap values to emojis while preserving existing reactions.

## Contact channels

The Kontak page displays Gmail, Instagram, LinkedIn, TikTok, and GitHub cards. GitHub links to the verified public URL; the other four are clearly marked unavailable until Muhammad Faizal supplies the correct email/profile URLs. The Buku Tamu button provides an immediately usable contact option. Update `src/components/contact.tsx` when those details are available.

## Chat moderation

Choose a strong `OWNER_ADMIN_KEY` and add it as an encrypted Pages secret. A message can be deleted by ID using `DELETE /api/chat/messages?id=123` with an `Authorization: Bearer <OWNER_ADMIN_KEY>` header. Chat usernames are guest display names, not verified accounts.

## Deploy

1. Apply remote schema: `npx wrangler d1 migrations apply faizal-portfolio --remote`.
2. Connect your Git repository to **Cloudflare Pages**. Select **Next.js (Static HTML Export)** with build command `npm run build` and output directory `out`.
3. Configure the production and preview D1 `DB` binding and encrypted secrets (`GITHUB_TOKEN`, `OWNER_ADMIN_KEY`, and optional `WAKATIME_OAUTH_TOKEN`) in Pages settings (or use your Wrangler config for the binding). Redeploy after changing bindings.
4. Alternatively, run `npm run deploy` after configuring the project and Wrangler authentication.

The profile photo, CV, detailed project case studies, education details, email, and social links are left for Muhammad Faizal to provide.
