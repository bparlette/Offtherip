# Off The Rip — AI Handoff Guide

**Last updated:** 2026-10-07
**Live site:** https://bparlette.github.io/Offtherip/
**Repo:** https://github.com/bparlette/Offtherip

## The Two Branches (READ THIS FIRST)

| Branch | Purpose | How it's updated |
|--------|---------|-----------------|
| `main` | Source code, scripts, data, assets | Normal git pushes |
| `gh-pages` | **The live site.** Served by GitHub Pages. | **Pushed directly** — NOT built from `main` |

**Critical:** The `gh-pages` branch contains pre-built HTML that is pushed directly.
The `main` branch source (`src/`, `scripts/`, `build.mjs`) is **not** currently
wired to auto-build into `gh-pages`. If you change `main` source files, you must
manually port the changes to `gh-pages` or the live site won't update.

The canonical working file for the homepage is:
- Local: `~/workspace/otr-v2/v22-for-pages.html`
- Live: `gh-pages` branch → `index.html`

## Current Design: v22 (locked 2026-10-07)

Cherie selected v22 as the final design. Key decisions:

- **Hero:** 3 large buttons — "Shop on eBay", "Watch the latest rips", "Wanted List"
- **Section order:** Shop the pulls → Fresh off the rip → (streak banner at bottom of Fresh)
- **Removed:** "How It Works" band, "Slabbed & graded", duplicate "Fresh listings"
- **Tagline:** "Ripped on camera. Sold on eBay."
- **Colors:** Warm cinematic (cream/olive/lime). NO neon green.
- **"Wanted List"** (not "Want List" or "Watch List" — "Watch List" conflicts with YouTube)

## Dynamic Features (all client-side JS)

### 1. Video previews (Fresh off the rip)
- 6 short MP4 clips (12s each) at `main:src/assets/video/previews/<VIDEO_ID>.mp4`
- Served via jsDelivr: `https://cdn.jsdelivr.net/gh/bparlette/Offtherip@main/src/assets/video/previews/`
- Plays the card **nearest the viewport center** (vertical scroll) AND **nearest the shelf center** (horizontal scroll)
- Video only reveals when first frame is ready (`canplay` event) — **no green flash**
- Tapping a card opens YouTube
- iOS requires `setAttribute('playsinline')` etc., not just properties

### 2. Listing image rotation (Shop the pulls)
- Each card cycles front/back eBay photos like a GIF
- **Only activates when scrolled into view** (IntersectionObserver, threshold 0.4)
- Timing: **front image 2.5s**, back/others **1.5s**
- Gallery data in `data-images` attribute (pipe-separated URLs)

### 3. Streak banner (Daily Pack Verdict)
- Fetches `https://cdn.jsdelivr.net/gh/bparlette/Offtherip@main/src/data/verdicts.json`
- Calculates win/loss streak from the end of entries
- Updates: streak number, kind ("wins/losses in a row"), description ("Day N: Game Product"), CTA ("Will Day N+1 break it?")
- Falls back to hardcoded values if fetch fails

### 4. Logos (performance)
- Header logo (44px): inlined as base64 PNG data URI — **zero network requests**
- Hero badge (480px): inlined as base64 WebP data URI (~15KB)
- **Never** load logos from CDN — Cherie complained about slow logo loading

## Scripts (in `main:scripts/`)

| Script | Purpose | Notes |
|--------|---------|-------|
| `sync-youtube.mjs` | Refresh `videos.json` from YouTube | No API key needed |
| `sync-ebay.mjs` | Refresh `listings.json` from eBay Browse API | Needs `EBAY_APP_ID` + `EBAY_CERT_ID` |
| `sync-sheet.mjs` | Sync from Google Sheet | Other AI's script — don't break it |
| `sync-video-previews.mjs` | Generate 12s MP4 clips from YouTube videos | `npm run sync:previews`. Uses `yt-dlp --extractor-args "youtube:player_client=android"` to avoid bot checks |
| `sync-listing-images.mjs` | Fetch gallery images per listing | API mode (needs eBay creds) or `--merge galleries.json` (browser-grabbed) |

**`npm run sync`** runs all sync scripts.

## eBay Store Gotchas

- **Store URL has a typo and that's correct:** `ebay.com/str/offtheripollectables` (missing 'c' in "collectables"). Do NOT "fix" this.
- **Domain/email use correct spelling:** `offtheripcollectables.com`, `hello@offtheripcollectables.com`
- **Social handles use correct spelling:** `@offtheripcollectables`
- **Category buttons** must use store search: `ebay.com/str/offtheripollectables?_nkw=<term>` — NOT `_ssn=` (shows 0 results)

## Binary Files — NEVER Use the Connector

The GitHub connector (`create_or_update_file`/`push_files`) **corrupts binary files**
(UTF-8 encodes the content). Verified empirically 2026-10-07.

- **Text files** (HTML, JS, CSS, JSON, MD): use connector, batch with `push_files`
- **Binary files** (PNG, JPG, MP4, WOFF2): upload via **browser task** only
- **Workaround:** reference existing binaries via jsDelivr CDN

## Git Push Rules (Cherie's standing orders)

1. **ALWAYS batch** — use `push_files` (multi-file), never one-file-at-a-time. Split into 2 batches only if >128KB.
2. **Check branch tip before pushing** — another AI commits to this repo. Fetch latest SHA first.
3. **Never overwrite newer work** — merge, don't clobber.
4. **Cherie has granted full permission** for migration/push work — no need to ask per-push.

## Test Suite

**Location:** `~/workspace/otr-v2/tests/test_v22.py` (local only, not in repo)

```bash
python3 tests/test_v22.py --file path/to/page.html  # test local file
python3 tests/test_v22.py                             # test live site
```

**26 checks covering every issue Cherie caught:**
- Logos inlined (no network fetch)
- No duplicate/broken HTML attributes
- Hero has exactly 3 correct buttons
- Section order (Shop before Fresh)
- No removed sections (Slabbed, How It Works, duplicate Fresh listings)
- Follow the Rips has brand SVG logos
- Video scroll-play wiring + no green flash (canplay-gated)
- Listing rotation timing (2.5s front / 1.5s others) + IntersectionObserver
- Horizontal shelf scroll triggers video pick
- All links resolve (with eBay/TikTok bot-block exceptions)
- Want List form uses mailto (no dead POST)
- Shop category buttons use store search (no `_ssn`)

**Run the test suite before every push.** Add a check for every new bug Cherie catches.

## Page Inventory (gh-pages)

Live pages: `/`, `/about/`, `/shop/`, `/want-list/`, `/watch/`, `/verdict/` (+ day-17 through day-23), `/giveaways/`, `/links/`, `/privacy/`, `/terms/`, `/thanks/`, `/backstage-otr26/`, `/404.html`

All pages have been fixed for: canonical/OG → github.io URLs, removed broken Anton font preload, og:image → logo.

## Forms

- **Homepage signup** (`data-form="subscribe"`): no backend — check before promising it works
- **Want List** (`data-form="wantlist"`): opens mailto to hello@offtheripcollectables.com with form data
- GitHub Pages returns **405 for POST** — never use form POST without a backend

## Cloudflare (do not touch without asking)

- `offtherip-redesign` — authorized for deletion (paused until GitHub fully verified)
- `ashleyclaudy-cinematic` — authorized for deletion (paused)
- `off-the-rip` — **DO NOT DELETE**

## Cherie's Working Style

- **Phone-first:** she reviews on iPhone. Test at 390px width.
- **"No short cuts. Take your time. Multiple iterations. Make it right."**
- **Direct and evidence-based.** Say what you did, what failed, what's unverified.
- **"Stop" means stop.** Don't re-pitch.
- **Simple changes stay simple.** Don't redesign unrelated elements.
- She catches everything — the test suite exists because she found every bug manually.

---

## Deployment Architecture (updated 2026-10-07)

**Optimal setup — all free ($0/month):**

1. **Private GitHub repo** — code hidden. Free for private repos.
2. **GitHub Actions** (`.github/workflows/daily-sync.yml`) — runs daily at 6am ET:
   - Sync YouTube videos → `src/data/videos.json`
   - Sync eBay listings → `src/data/listings.json`
   - Generate video previews (max 3 new)
   - Sync verdict prices (retail cost + eBay sold values)
   - Sync VERDICTS.md ↔ verdicts.json (both directions)
   - Commits to `main` only if files changed
   - Each step has `continue-on-error: true` — one failure never blocks others
   - Free tier: 2,000 min/month. This uses ~90.
3. **Cloudflare Pages** — connected to the private repo, auto-deploys every push to `main`.
   Custom domain: `offtheripcollectables.com` (~$12/year).

**Why not GitHub Pages:** Requires Pro ($4/mo) for private repos. Cloudflare Pages
is free regardless and handles the custom domain + SSL automatically.

**Why not Cloudflare Workers for sync:** Workers have CPU time limits and can't
easily run yt-dlp. GitHub Actions has full Node.js with no such constraints.

### Adding the workflow file
GitHub blocks API integrations from creating `.github/workflows/` files.
It must be added via the GitHub web UI (Add file → Create new file).
Done 2026-10-07 via browser.

### Required secrets (repo Settings → Secrets → Actions)
- `EBAY_APP_ID` — eBay Browse API client ID
- `EBAY_CERT_ID` — eBay Browse API client secret
Without these, eBay steps skip gracefully (no crash).

## VERDICTS.md — Clayton's editable scores

**Location:** `VERDICTS.md` (repo root)

Clayton edits this in GitHub's web UI (pencil icon). Simple markdown table:

| Day | Date | Product | Result | Pack $ | Hits |
|-----|------|---------|--------|--------|------|
| 24 | 2026-10-07 | Pokemon 151 Booster | loss | | Charizard ($45); Pikachu |

**Sync scripts:**
- `npm run sync:verdicts` — MD → JSON (after Clayton edits)
- `npm run verdicts:review` — JSON → MD (writes auto-prices back for review)
- **Clayton's values always win** — auto-lookup only fills blank cells, never overwrites.

**Auto price lookup** (`scripts/sync-verdict-prices.mjs`):
- Pack cost → Target → Walmart → TCGPlayer → CamelCamelCamel (price history fallback)
- Hit values → eBay sold listings (median of recent sales)
- Needs `EBAY_APP_ID` + `EBAY_CERT_ID` for eBay lookups

## Data freshness footer

The homepage footer shows "Videos updated [date] · Listings updated [date] ·
Verdicts updated [date]" — fetched live from each JSON file's `updated` field.
If a sync fails silently, the stale date is visible.

## npm scripts (updated)

| Script | Purpose |
|--------|---------|
| `npm run sync` | All syncs: YouTube + Sheet + eBay + previews + verdict prices |
| `npm run sync:prices` | Verdict auto price lookup only |
| `npm run sync:verdicts` | VERDICTS.md → verdicts.json |
| `npm run verdicts:review` | verdicts.json → VERDICTS.md (fill blanks) |
