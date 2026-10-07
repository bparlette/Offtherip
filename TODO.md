# Off The Rip Collectables site: TODO

The full, interactive version (steps, acceptance checks, copy kit, playbook) is the private HQ page; run `npm run dev` and open `/backstage-otr26/`, or read `dist/backstage-otr26/brief.md`.

**Status:** site built and tested locally. **Not deployed.** No domain registered. Real domain stays untouched until Clayton approves the preview.

## Done
- [x] Research: accounts, stats and domain availability (`src/hq/facts.json`, as of 2026-10-07)
- [x] Static site: home, shop, Daily Pack Verdict scoreboard (streak, record, chart), watch, want list, giveaways, about, link hub, thank-you page, privacy, terms, 404
- [x] Forms backend with honeypot/origin/Turnstile hooks and Kit + webhook + KV sinks (34 tests)
- [x] YouTube sync (no key), Verdict CSV import, eBay Browse sync (untested live)
- [x] Private HQ page + generated AI handoff brief, promo bar, tracking by `?src=`, welcome-email drafts

## Before launch, verify
- [ ] Clayton approves the preview and the brand spelling "Collectables" (T01, T06)
- [ ] eBay figures on the site (100% positive, 1.6K+ sold, since 2023) are current: update `stats` in `site.config.json` with a new "as of"
- [ ] Verdict results for Days 17 to 23 (all "loss") come from the video titles; get the real dollar numbers (T22)
- [ ] Kit API call shape and eBay Browse call shape verified on first run (T09, T21)
- [ ] The contact email `hello@…` works before the site goes live (T08)
- [ ] Privacy/terms reviewed by someone competent (T25)

## Setup that needs Clayton's accounts
- [ ] Register `offtheripcollectables.com` + `.../collectibles.com` (T03)
- [ ] GitHub repo, Cloudflare Pages preview, domain, email routing (T04 to T08)
- [ ] Kit list + Pages variables, forms end-to-end test (T09, T10)
- [ ] Analytics, Search Console, Cloudflare Access on the HQ path (T11 to T13)
- [ ] Claim X, Facebook Page, TikTok polish; decide Whatnot/TCGplayer (T14 to T18)

## Content to collect
- [ ] Clayton's story + photo; shipping/packing/returns (T23, T24)
- [ ] Verdict scoring method + daily cost/value log (T22)

## Next 30 days
- [ ] Launch (T03 to T13), unify profiles (T19), eBay store polish (T20), live eBay grid (T21)
- [ ] Welcome emails live (T33), Want List weekly pass (T34), cross-post routine (T29)

## Rules for every AI working here
See `src/hq/rules.md` (also section 0 of the brief): authority, secrets, stop points, eBay off-platform policy, truthful content, repo etiquette.
