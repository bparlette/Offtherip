# Off The Rip Collectables: brand hub

A fast static website for **Off The Rip Collectables** (sports cards, TCG, pack openings; eBay seller + YouTube channel). It does three jobs:

1. **Sends buyers to eBay.** The site never takes payment; every listing link goes to the eBay store.
2. **Builds an owned audience.** Email list ("The Hit List"), Want List, giveaway alerts.
3. **Brings people back.** The Daily Pack Verdict scoreboard, fresh videos, and a thank-you page for order inserts.

No framework, no runtime dependencies. Node 20+ only. Forms run on Cloudflare Pages Functions.

> **The plan and the to-do list live on the private HQ page** (`/backstage-otr26/` after a build): tasks with exact steps, recommendations, facts found, copy kit, and an AI handoff brief. `TODO.md` is the short version.

## Quick start

```bash
npm run dev        # build + serve http://localhost:8080 (forms log leads, nothing is stored)
npm test           # 34 checks: build integrity, data, form functions, parsers
npm run build      # src/ -> dist/
```

## Pages

| Page | Job |
|---|---|
| `/` | Home: hero, Verdict streak, latest videos, shop tiles, how it works, signup |
| `/shop/` | Category shortcuts into the eBay store; live listing grid once the eBay sync is on |
| `/verdict/` | Daily Pack Verdict scoreboard: streak, record, running profit/loss chart, every day |
| `/watch/` | YouTube playlist embed, series, latest uploads |
| `/want-list/` | "Hunting a card?" form (email + what + budget) |
| `/giveaways/` | Alerts for the giveaways that run on YouTube (no entries are taken here) |
| `/about/` | Verified facts only until Clayton adds his story (HQ task T23) |
| `/links/` | Link-in-bio hub for Instagram/TikTok/etc. (noindex) |
| `/thanks/` | Landing page for the QR code on order inserts (noindex) |
| `/privacy/`, `/terms/`, `404` | Legal + not found |
| `/backstage-otr26/` | **Private HQ** (noindex, not in sitemap/robots, not linked anywhere; protect with Cloudflare Access, HQ task T13) |

Short links (`_redirects`): `/yt`, `/ebay`, `/ig`, `/tiktok`, `/threads` (only those whose link is set in the config).

## Editing

| What | Where |
|---|---|
| Brand, social links (null = hidden), eBay stats + "as of" date, feature flags, promo bar, analytics | `site.config.json` |
| Pages and copy | `src/pages/*.html` (header comment sets title/description) |
| Shared head/header/footer/signup | `src/partials/*.html` |
| Videos / Pack Verdict / eBay listings | `src/data/*.json` (see tools below) |
| Private HQ tasks, facts, playbook, copy kit | `src/hq/*.json`, `src/hq/rules.md` |
| Welcome emails | `emails/welcome-series.md` |

Never hand-edit `dist/`. **Template syntax**: `{{config.path}}` (build fails on typos), `{{#if x}}…{{else}}…{{/if}}`, `{{> partial}}`, `{{{@slot}}}` (HTML built in `scripts/render-slots.mjs`).

**Sale or giveaway banner:** in `site.config.json` set `promo` → `{ "enabled": true, "text": "Weekend sale on slabs", "url": "/shop/", "endsIso": "2026-10-12T23:59:00-04:00" }` and rebuild. It shows a live countdown and removes itself when it ends.

## Tools

| Command | What it does |
|---|---|
| `npm run sync:youtube` | Pulls the channel's public RSS feed (no key) into `videos.json`; adds a "TBD" row for each new *Daily Pack Verdict Day N* video |
| `npm run import:verdicts -- file.csv` | Merges cost/value numbers from a CSV (template: `templates/verdicts.csv`); derives profit/loss |
| `npm run sync:ebay` | Pulls live listings through eBay's official Browse API (needs `EBAY_APP_ID`, `EBAY_CERT_ID`; skipped without them). **Not yet run against live credentials.** |
| `npm run deploy` | Build, then `wrangler pages deploy` (after `wrangler login`) |

`.github/workflows/refresh.yml` runs the syncs, tests, build and deploy every 6 hours once the Cloudflare secrets exist (HQ task T27).

## Forms

`POST /api/subscribe` and `POST /api/wantlist` (`functions/api/`). Validation, honeypot, minimum-time check, origin check, optional Cloudflare Turnstile. A lead is delivered to every configured sink and **the form fails loudly if none accepts it** (no silent lead loss):

| Setting (Cloudflare Pages variables) | Sink |
|---|---|
| `KIT_API_KEY` (secret) + `KIT_FORM_ID` | Kit (ConvertKit) subscriber + form |
| `FORM_WEBHOOK_URL` | Zapier / Make / Google Apps Script → a Google Sheet backup |
| KV binding `LEADS` | Raw backup in Cloudflare KV |
| `SITE_URL`, `ALLOW_PAGES_DEV`, `ALLOW_NO_SINK`, `TURNSTILE_SECRET` | Origin check; allow `*.pages.dev` while testing; dev-only accept-and-log; bot check |

The Kit request shape was written from public docs and must be verified on first use (HQ task T09).

## Deploying

1. Push the repo, create a Cloudflare Pages project (build `npm run build`, output `dist`, `NODE_VERSION=22`) and open the `off-the-rip.pages.dev` preview.
2. Clayton reviews the preview. **Do not point the real domain at it until he approves.**
3. Connect the domain, then email, forms and analytics (HQ tasks T03 to T12).

## Tracking

Link every post with `?src=<platform>` (and `utm_*` if wanted). Forms record it with each signup. Optional Plausible (`analytics.plausibleDomain`) receives the custom events `eBay Click`, `YouTube Click`, `Newsletter Signup`, `Want List`. Cloudflare Web Analytics (`analytics.cloudflareToken`) is cookie-free, so no consent banner is needed.

## Working rules

- Multiple AIs and people may edit this repo. Check `git log` first; **merge, never overwrite**.
- Content in JSON/HTML sources; run `npm run build && npm test` before every commit.
- No secrets, personal addresses or phone numbers in the repo.
- The site stays **non-transactional** (links to eBay only). Re-read eBay's off-platform policy before changing that.
- Nothing goes live on Clayton's accounts without his approval.
