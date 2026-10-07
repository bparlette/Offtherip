# Hands-off automation: setup guide (for Muse or any browser AI)

**Goal:** the site rebuilds itself every 6 hours and each build pulls fresh data, so nobody touches it day to day.

```
Cloudflare Worker (cron, every 6h)  ->  Pages deploy hook  ->  Pages build
Pages build = `npm run sync && npm run build`
   sync:youtube  YouTube RSS (no key)            -> latest videos + new Verdict days
   sync:sheet    published Google Sheet (CSV)    -> Verdict cost/value (Clayton types these)
   sync:ebay     eBay Browse API (needs keys)    -> live listings
```
Every sync step keeps the old data and exits 0 if its source is down or unconfigured, so a build never breaks because of a feed.

## Rules (same as `src/hq/rules.md`)
Do not type or store passwords, 2FA codes or API keys: the human does that. Secrets go ONLY in Cloudflare variables or `wrangler secret put`, never in files or Git. Stop at every **HUMAN** step. Confirm each **CHECK** before moving on and note what you saw in `src/hq/tasks.json`.

## Step 1: Pages build command  (task T39) — needs T05 done
1. Cloudflare dashboard > Workers & Pages > project `off-the-rip` > Settings > Builds.
2. Build command: `npm run sync && npm run build`. Output directory: `dist`.
3. Settings > Variables and Secrets (Production) > add `NODE_VERSION` = `22`.
4. Deployments > Retry the latest deployment.
- **CHECK:** build log contains lines starting `youtube:` and `sheet sync skipped` (or `sheet:`), then `built 20 pages`.

## Step 2: Deploy hook + scheduler  (task T40)
1. Pages project > Settings > Builds > Deploy hooks > Add: name `scheduled-refresh`, branch `main`. Copy the hook URL (it is a secret).
2. **HUMAN:** run in a terminal (the URL is pasted by the human at the prompt, never into a file):
   ```bash
   cd worker
   npx wrangler login
   npx wrangler deploy
   npx wrangler secret put DEPLOY_HOOK_URL
   ```
3. Cloudflare > Workers & Pages > `off-the-rip-refresh` > Settings > Triggers: confirm cron `17 */6 * * *`.
- **CHECK:** in the Worker page click Logs, or trigger once by hand with `curl -X POST "<deploy hook URL>"`: a new Pages deployment appears within a minute. Within 6 hours a second one appears without anyone touching it.

## Step 3: Verdict numbers from a Google Sheet  (task T41)
1. **HUMAN (Clayton's Google account):** create a Sheet. Row 1 = exactly `day,date,game,product,videoId,cost,value,result`. Paste the rows from `templates/verdicts.csv`.
2. File > Share > Publish to web > choose the sheet tab and **Comma-separated values (.csv)** > Publish. Copy the link.
3. Pages project > Settings > Variables and Secrets > add `VERDICTS_CSV_URL` = that link. Retry the deployment.
4. Clayton's daily routine: add `cost` and `value` for the day (leave `result` blank; it is worked out). New days appear automatically from his YouTube uploads on the next build, so he only fills two cells.
- **CHECK:** build log says `sheet: N row(s) merged`; /verdict/ shows dollar amounts and the chart. If the log says `got HTML, not CSV`, the sheet is not published.

## Step 4: eBay live listings  (task T21)
Follow T21 in the HQ brief to get `EBAY_APP_ID` and `EBAY_CERT_ID`, then add them as Pages **secrets** (encrypted). Retry the deployment.
- **CHECK:** build log says `ebay: N listings written` and /shop/ shows a grid. This sync has never run against live credentials: if it errors, fix `scripts/sync-ebay.mjs` against eBay's Browse API docs and keep the old data meanwhile.

## Step 5: Safety net  (task T42)
1. Free uptime monitor (UptimeRobot or similar) on the home page, emails Clayton and you.
2. Pages > Deployments: if the newest deployment is red or older than 12 hours, something broke. Check the build log first.
3. Monthly: update `stats` in `site.config.json` (items sold; its "as of" date). The build prints a warning when it is over 45 days old.

## Troubleshooting
| Symptom | Likely cause / fix |
|---|---|
| Build log: `youtube sync skipped` | YouTube feed blip; harmless, retries next build |
| `sheet sync failed ... not published` | Re-do Publish to web, CSV format; check `VERDICTS_CSV_URL` has no spaces |
| `sheet ... no 'day' column` | Header row changed; restore it to match `templates/verdicts.csv` |
| Site never changes | Worker secret `DEPLOY_HOOK_URL` missing or hook deleted; redo Step 2 |
| Build fails outright | Run `npm run build && npm test` locally, fix, push; the old site stays live |
