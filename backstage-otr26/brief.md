# Off The Rip Collectables: AI handoff brief

Generated from `src/hq/*` at build time. Task data as of 2026-10-07; facts as of 2026-10-07. Progress: 1/39 tasks done.

**Goal:** a fast brand-hub website for Off The Rip Collectables (sports cards, TCG, pack openings; eBay seller + YouTube channel) that sends buyers to eBay, builds an owned email list, and brings customers back. The site is built (this repo). What remains is mostly accounts, domains, data and growth work, listed below with exact steps.

**How to use this brief:** read Rules, then pick tasks whose `depends_on` are done. Do the steps. Stop at every `needs_human` item. Update the task in `src/hq/tasks.json` (status + notes) when done or blocked.

## 0. Rules (read first)

These rules apply to ANY AI agent (browser-control, CLI, or chat) working from this brief. If a task conflicts with a rule, the rule wins; stop and ask the human.

1. **Authority.** Clayton Floyd owns the Off The Rip Collectables brand and every account. Nothing public goes live, and no existing eBay listing / store setting / social profile is changed, without his explicit OK. **Do NOT cut the real domain over, redirect anything, or post publicly until he approves the preview** (preview first at `https://off-the-rip.pages.dev`).
2. **Secrets.** Never type, read aloud, store or commit passwords, card numbers, 2FA codes or API keys. The human enters them. API keys go only in Cloudflare Pages variables / GitHub secrets. `.env*` is gitignored.
3. **Stop and hand to the human at:** payment entry, CAPTCHAs, phone or ID verification, accepting terms that bind the business, account recovery, and any spend not listed in a task. Budget cap for the whole project without asking: **$40 (domains only).**
4. **Verify, don't assume.** Before acting, confirm the current state (screenshot or page text). After acting, confirm the result and write what you saw in the task's notes. Fees, free-tier limits and API details in this brief were written from public docs and memory: anything marked **(verify)** must be checked against the live official page first.
5. **Truthful content only.** Publish only facts marked `confirmed` in the facts list, with an as-of date. No fake reviews, scarcity or urgency. Disclose giveaways and sponsorships (FTC). Use only real, permissioned customer quotes.
6. **eBay policy.** The site is deliberately **non-transactional**: it links to eBay listings and never takes payment. Do not message eBay buyers to complete a purchase off eBay, do not put external purchase links in eBay listings, and do not use buyer contact details from eBay orders for marketing without opt-in. Re-read eBay's current off-platform and links policies before any task that touches buyers **(verify)**.
7. **Email law.** CAN-SPAM / consent: clear consent checkbox (already on the forms), unsubscribe in every email, a real mailing address in the footer of every email, honest subject lines.
8. **Repo etiquette.** Content lives in `src/data/*.json`, `src/hq/*.json` and `site.config.json`; pages in `src/pages`. Never hand-edit `dist/`. Run `npm run build && npm test` before committing. Multiple AIs may edit this repo: check `git log` first and **merge, never overwrite**. No personal data (phone numbers, home addresses) in commits.
9. **Report back.** When you finish or get blocked, update the task's `status` and `notes` in `src/hq/tasks.json` (statuses: `todo`, `doing`, `blocked`, `done`) and say exactly what the human must do next.
10. **Don't impersonate.** Never post, DM or email as Clayton without his approval of the exact text. Drafts are fine.

## 1. Project snapshot (facts)

Brand: **Off The Rip Collectables**. Owner: Clayton Floyd (display name on Instagram and Facebook). Sports cards (basketball, football, baseball, more), TCG (Pokémon, One Piece, Dragon Ball Super, more), graded slabs, singles/lots/sealed. eBay store text says most cards are pulled on the YouTube channel.

### Accounts

- **eBay** [confirmed] offtheripcollectables <https://www.ebay.com/str/offtheripollectables> · 100% positive feedback; 1.6K items sold; 71 store followers (store page 2026-10-06). An older listing page showed 99.8%. Member since Jan 2023 (from a search snippet, unconfirmed). · Store URL slug is misspelled (missing the 'c'). Categories: Sports Cards, TCG Cards, Video Games, Other. Listings seen from $1.49 to $749.99.
- **YouTube** [confirmed] @offtheripcollectables <https://www.youtube.com/@offtheripcollectables> · 687 subscribers. 15 uploads in the last 7 days (about 2 a day, mostly Shorts). Typical Short: 28 to 1,689 views. · Channel ID UCoc5YV93E64NXWy0XyFOf9A. Series: Daily Pack Verdict (Day 23 on 2026-10-06; titles say 7 losses in a row), UP OR DOWN weekly price check (Week 16: 2026 Bowman Football Blaster, $250 Josh Allen Gold /50), box and blaster breaks, giveaways (Caitlin Clark PSA giveaway).
- **Instagram** [confirmed] @offtheripcollectables <https://www.instagram.com/offtheripcollectables/> · 281 followers, 126 following, 1,096 posts · Display name 'Clayton Floyd'.
- **Threads** [confirmed] @offtheripcollectables <https://www.threads.net/@offtheripcollectables> · 2 followers, 24 threads 
- **TikTok** [exists] @offtheripcollectables <https://www.tiktok.com/@offtheripcollectables> · Unreadable (page showed 0 followers / 0 videos, which may be a scraping block) · Nickname 'Clayton'. Check by hand whether it is active.
- **Facebook** [exists] Clayton Floyd (personal profile) <https://www.facebook.com/share/19VSqBiv67/?mibextid=wwXIfr> · Behind login · No business Page found. facebook.com/offtheripcollectables returned a generic page; check by hand.
- **X (Twitter)** [none] @offtheripcollectables <https://x.com/offtheripcollectables> · Returned 404 on 2026-10-07 = unclaimed, yet the logo shows an X icon. @OffTheRipCards and @offtheripco ('Off The RIP Kicks') belong to other people; @offtherip is unconfirmed.
- **Whatnot / TCGplayer / Mercari / Etsy / COMC / Twitch** [unknown] · All blocked automated checks or returned generic pages. Ask Clayton which of these he uses.
- **Amazon storefront / LinkedIn** [none] · Nothing found by search. Amazon cannot be searched reliably by seller name.

### Domains

- `offtheripcollectables.com` [unregistered] checked 2026-10-07 (whois: No match; no DNS). Register as the primary domain
- `offtheripcollectibles.com` [unregistered] checked 2026-10-07 (whois: No match; no DNS). Register and redirect to the primary (people search both spellings)
- `offtheripcards.com` [unregistered] checked 2026-10-07 (whois: No match; no DNS). Optional third
- `offtherip.com` [taken] checked 2026-10-07. Belongs to someone else (a clothing-brand site, registered 2015). Do not use.
- `offtherip.net` [for sale] checked 2026-10-07. Parked on GoDaddy. Probably not worth the price.
- `offtherip.shop` [taken] checked 2026-10-07. RipVibe streetwear store. Do not use.

### Similar names to avoid confusion with

- eBay store 'Off The Rip Sports Cards' (formerly Junk Wax Joe's): a different seller
- YouTube @offtherip and @offtheripcards: different channels
- X @OffTheRipCards and @offtheripco (sneakers): different accounts
- Always use the full name 'Off The Rip Collectables' to avoid confusion

### Open questions for Clayton

- Confirm the exact brand spelling: 'Collectables' (as on the logo).
- Are you OK with your first name 'Clayton' appearing on the site?
- Which email address should be public (hello@ forwarded to you)?
- Do you sell or go live on Whatnot, TCGplayer, Mercari or Facebook groups?
- Is the TikTok account active, and who runs Instagram and Threads?
- How do you score a Daily Pack Verdict (pack cost vs which prices)? Can you log cost and pulled value each day?
- What are your packing, shipping and return practices (for the About page)?
- Do you 3D-print card stands or slab displays (the filament photo suggests it)? Would you sell or give them away?
- Are you a registered business or sole proprietor, and what mailing address can go in the emails?
- Do you want the Want List to be a promise to email people, and who checks it each week?

## 2. Repo map and commands

```
npm run dev            build + serve http://localhost:8080 (forms log leads, nothing stored)
npm run build          src/ -> dist/
npm test               build checks, data checks, form-function tests
npm run sync:youtube   refresh videos.json + add Verdict stubs (no key needed)
npm run sync:ebay      refresh listings.json (needs EBAY_APP_ID / EBAY_CERT_ID)
npm run import:verdicts -- file.csv   merge cost/value numbers
npm run deploy         build + wrangler pages deploy (after `wrangler login`)
```

- `site.config.json`: brand, links (null = hidden), stats with as-of date, feature flags, analytics, promo bar, hqPath.
- `src/pages/*.html`: pages; `src/partials/*`: shared head/header/footer/signup; `scripts/render-slots.mjs`: build-time lists.
- `src/data/*.json`: videos, verdicts, listings. `functions/api/*`: form endpoints (Cloudflare Pages Functions). `emails/`: welcome drafts. `src/hq/*`: this brief's source.
- Never hand-edit `dist/`. Promo bar: set `promo.enabled`, `text`, `url`, `endsIso` in `site.config.json`.

## 3. Tasks

### P0: Approvals & accounts

_Nothing goes live without Clayton's OK. Accounts must be in his name._

#### T00 [DONE] Research the brand and build the first version of the site
Owner: AI · ~0 min · priority 1

Why: Everything below depends on it.

Steps:
1. Gathered public facts (facts.json), built the static site, forms backend, sync tools, tests and this HQ.

Done when:
- `npm run build && npm test` pass

Notes: Preview not deployed yet (T05).

#### T01 [TODO] Get Clayton's go-ahead and answer the open questions
Owner: HUMAN · ~20 min · priority 1

Why: He owns the brand. Rule 1: nothing public or changed on his accounts without his OK.

Steps:
1. Show him the site (run `npm run dev` and open http://localhost:8080, or the preview from T05).
2. Walk through `facts.json` → `questions_for_clayton` and write his answers into the notes of this task.
3. Get a yes/no on each: brand spelling, using his first name, public email, domain choice, which platforms to claim.

Done when:
- His approval is recorded in notes (date + how he said it)
- Answers to every question are in notes

Needs a human for:
- Clayton's decision

#### T02 [TODO] Decide who owns which account, and secure them
Owner: HUMAN · ~20 min · priority 1

Why: Domains, Cloudflare, email list and GitHub must be in Clayton's name with his email, or he can be locked out of his own brand.

Steps:
1. Create or confirm: a Clayton-owned Google/Gmail (or other) email for account sign-ups.
2. Use a password manager (1Password / Bitwarden) and turn on 2FA everywhere (authenticator app, not SMS where possible).
3. List any operator/helper accounts and give them delegated access instead of sharing passwords.

Done when:
- Every account below lists Clayton as owner
- 2FA on registrar, Cloudflare, email list tool, GitHub

Needs a human for:
- Account creation, passwords, 2FA codes

### P1: Launch the site

_Domain, hosting, email, forms, analytics. Preview first, cutover only after approval._

#### T03 [TODO] Register the domains
Owner: AI or human (human enters secrets/payment) · ~20 min · priority 1 · depends on T01, T02

Why: The website, email and every bio link need one home. Both spellings are unregistered today and could be taken any day.

Steps:
1. Re-check availability (facts.json is from 2026-10-07): `whois offtheripcollectables.com` should say 'No match'.
2. Open the registrar. Recommended: Cloudflare Registrar (sold at cost, free WHOIS privacy; needs a Cloudflare account). Alternatives: Porkbun, Namecheap. (verify current price)
3. Register `offtheripcollectables.com` (primary) and `offtheripcollectibles.com` (redirect). Optional: `offtheripcards.com`.
4. Turn ON: auto-renew, registrar lock, WHOIS privacy, 2FA.
5. Registrant email must be Clayton's.

Done when:
- `dig +short NS offtheripcollectables.com` returns the registrar/Cloudflare nameservers
- Auto-renew shows ON
- Total spend ≤ $40

Needs a human for:
- Entering payment details
- CAPTCHA / email verification

Verify first: Registrar prices and WHOIS-privacy policy change; read the checkout page before paying.

#### T04 [TODO] Put the project in a GitHub repository
Owner: AI or human (human enters secrets/payment) · ~15 min · priority 2 · depends on T02

Why: Version history, collaboration between AIs, and automatic deploys.

Steps:
1. Human runs `gh auth login` once (browser).
2. In the project folder: `gh repo create off-the-rip-site --private --source . --remote origin --push` (private until launch; the repo contains no secrets).
3. Confirm `.gitignore` excludes `dist/`, `node_modules/`, `.env*`.

Done when:
- Repo exists and `git log` shows the history online
- No secrets in the repo (`git grep -iE 'api[_-]?key|secret' -- ':!*.md'` finds nothing real)

Needs a human for:
- GitHub login

#### T05 [TODO] Deploy a preview to Cloudflare Pages
Owner: AI or human (human enters secrets/payment) · ~25 min · priority 1 · depends on T04

Why: Lets Clayton see the real thing before any domain changes.

Steps:
1. Create a free Cloudflare account (T02 rules apply).
2. Option A (recommended): Workers & Pages → Create → Pages → Connect to Git → pick the repo. Build command `npm run build`, output directory `dist`, env var `NODE_VERSION=22`. Project name `off-the-rip`.
3. Option B (no Git): `npx wrangler login` (human approves in the browser) then `npm run deploy`.
4. Set `ALLOW_PAGES_DEV=1` and `ALLOW_NO_SINK=1` as variables on the preview so the forms don't error before T09/T10.
5. Open https://off-the-rip.pages.dev and click every nav link.

Done when:
- Home, Shop, Pack Verdict, Watch, Want List, About, Links and the HQ path all load on the .pages.dev URL
- Response headers on the HQ path include `X-Robots-Tag: noindex`
- Lighthouse (Chrome DevTools) ≥ 90 on Performance, Accessibility and SEO for the home page

Needs a human for:
- Cloudflare login / OAuth approval

Links: [Cloudflare Pages docs](https://developers.cloudflare.com/pages/)

#### T06 [TODO] Clayton reviews the preview and lists corrections
Owner: HUMAN · ~20 min · priority 1 · depends on T05

Why: Rule 1. He signs off before the real domain points here.

Steps:
1. Send him the .pages.dev link (not the HQ link).
2. Collect every correction in notes; fix; redeploy.
3. Get an explicit 'go' to connect the real domain.

Done when:
- 'Go' recorded with a date

Needs a human for:
- Clayton's sign-off

#### T07 [TODO] Connect the real domain and set redirects
Owner: AI or human (human enters secrets/payment) · ~25 min · priority 1 · depends on T03, T05, T06

Why: Go live.

Steps:
1. Pages project → Custom domains → add `offtheripcollectables.com` and `www.offtheripcollectables.com`.
2. Redirect `www` → apex, and `offtheripcollectibles.com` → `https://offtheripcollectables.com` (Cloudflare Rules → Redirect Rules, preserve path).
3. Update `siteUrl` in `site.config.json` if different; `npm run build`; redeploy.
4. Check HTTPS padlock, and that `https://offtheripcollectables.com/sitemap.xml` loads.

Done when:
- All four URL variants end on the primary https URL
- Sitemap and robots load
- The old preview URL is no longer used in any bio

#### T08 [TODO] Set up hello@ email
Owner: AI or human (human enters secrets/payment) · ~20 min · priority 1 · depends on T07

Why: The site publishes hello@offtheripcollectables.com; mail to it must arrive.

Steps:
1. Cloudflare → Email → Email Routing → enable for the domain (adds MX + SPF automatically).
2. Create address `hello@` → forward to Clayton's real inbox; verify the destination via the confirmation email.
3. Optional: set up 'Send mail as hello@' in Gmail (needs an SMTP provider; (verify) options).
4. Send a test email to hello@ from a different account.

Done when:
- Test email arrives
- SPF record present (`dig TXT offtheripcollectables.com`)

Needs a human for:
- Confirming the destination inbox

Verify first: If Email Routing is unavailable, use any forwarding service; just don't publish an address that doesn't work.

#### T09 [TODO] Create the email list in Kit (ConvertKit)
Owner: AI or human (human enters secrets/payment) · ~30 min · priority 1 · depends on T02

Why: The one asset eBay won't give him: a list he owns.

Steps:
1. Create a Kit account (free plan; (verify) current subscriber limit and terms).
2. Create a form named 'The Hit List'. Turn on double opt-in.
3. Create custom fields: source, interests, utm_source, utm_medium, utm_campaign, want, budget, grade.
4. Settings → email: sender name 'Off The Rip Collectables', sender `hello@` once T08 works, and authenticate the sending domain (DKIM/SPF) per Kit's wizard.
5. Footer mailing address: Clayton chooses (PO box / virtual mailbox / home). Required by CAN-SPAM.
6. Create an API key (Developer settings) and note the numeric form id. Do not paste either into chat or the repo.

Done when:
- Test signup on the preview shows up in Kit as an unconfirmed subscriber with the right fields
- Footer address set

Needs a human for:
- Account creation
- Choosing the mailing address
- Pasting the API key into Cloudflare (T10), not into any file

Verify first: The Kit v4 request shape in `functions/api/_lib.js` (POST /v4/subscribers, POST /v4/forms/{id}/subscribers, header X-Kit-Api-Key) was written from memory of the public docs. Check developers.kit.com before relying on it; fix `deliver()` if it differs.

Links: [Kit developer docs](https://developers.kit.com/)

#### T10 [TODO] Connect the forms and test end to end
Owner: AI or human (human enters secrets/payment) · ~20 min · priority 1 · depends on T05, T09

Why: A broken signup form silently loses customers.

Steps:
1. Cloudflare Pages → Settings → Variables and Secrets (Production): `SITE_URL=https://offtheripcollectables.com`, `KIT_API_KEY` (secret), `KIT_FORM_ID`. Optional: `FORM_WEBHOOK_URL` (Google Sheet backup), KV binding `LEADS`.
2. Remove `ALLOW_NO_SINK` from production.
3. Redeploy. Submit the home-page form with a real inbox, and the Want List form.
4. Confirm: Kit shows both subscribers with fields filled; the confirmation email arrives; a post with the hidden `website` field filled is silently ignored.
5. Command-line check: `curl -s -X POST https://<site>/api/subscribe -H 'Content-Type: application/json' -d '{"email":"you+test@example.com","consent":true}'` should return `{"ok":true}`.

Done when:
- Real signup reaches Kit and the backup sink
- Error path: with a wrong key the form shows an error instead of fake success

Needs a human for:
- Pasting secrets into the Cloudflare dashboard

#### T11 [TODO] Turn on privacy-friendly analytics
Owner: AI or human (human enters secrets/payment) · ~10 min · priority 2 · depends on T07

Why: You can't improve what you can't see.

Steps:
1. Cloudflare → Web Analytics → add the site → copy the token.
2. Put it in `site.config.json` → `analytics.cloudflareToken` (a public token, not a secret). Optional: `analytics.plausibleDomain` for custom events (eBay Click, Newsletter Signup, Want List).
3. Rebuild, deploy, load a page, confirm a visit appears.

Done when:
- Visits show in the dashboard
- No cookie banner needed (no cookies set)

#### T12 [TODO] Register with Google Search Console and Bing
Owner: AI or human (human enters secrets/payment) · ~15 min · priority 2 · depends on T07

Why: So the site and the Verdict pages get indexed.

Steps:
1. Search Console → Add property → Domain → verify with a DNS TXT record in Cloudflare.
2. Submit `https://offtheripcollectables.com/sitemap.xml`.
3. Bing Webmaster Tools → import from Search Console.

Done when:
- Sitemap status 'Success' with 9 pages

#### T13 [TODO] Lock the HQ page behind Cloudflare Access
Owner: AI or human (human enters secrets/payment) · ~15 min · priority 1 · depends on T07

Why: The HQ path is unlisted but anyone with the URL could read it. It contains planning notes, not secrets, but should still be private.

Steps:
1. Cloudflare Zero Trust (free for up to 50 users) → Access → Applications → Add → Self-hosted.
2. Application domain `offtheripcollectables.com`, path `backstage-otr26/*` (use the real `hqPath` from site.config.json).
3. Policy: Allow → emails: Clayton's and the operator's. One-time PIN login.
4. Confirm an incognito window gets the login screen.

Done when:
- Incognito can't open the HQ page; both emails can

Needs a human for:
- Approving the allowed emails

Verify first: Zero Trust free-plan limits and UI labels (verify).

### P2: Claim and unify the brand

_Close the gaps (X, Facebook Page, TikTok) and make every profile point at the site._

#### T14 [TODO] Claim the X (Twitter) handle
Owner: HUMAN · ~15 min · priority 2 · depends on T07

Why: The logo shows an X icon but no matching account exists, and the handle is free right now.

Steps:
1. Try `@offtheripcollectables` first. If taken, fallbacks in order: `@OTRCollectables`, `@offtherip_cc`, `@otr_cards` (check each in the signup flow; do not use names that other brands already use).
2. Sign up with the Clayton-owned email; phone verification is required.
3. Set the profile photo to `src/assets/img/logo-640.png`, bio from the Copy Kit, link to the site.
4. Put the final handle in `site.config.json` → `links.x` and rebuild.

Done when:
- Handle exists, bio and link set, `links.x` filled so the footer shows it

Needs a human for:
- Phone verification
- CAPTCHA

Notes: @OffTheRipCards and @offtheripco belong to other people. Don't confuse or impersonate.

#### T15 [TODO] Create a Facebook Business Page
Owner: AI or human (human enters secrets/payment) · ~25 min · priority 2 · depends on T07

Why: Card buyers live in Facebook groups, and a personal profile can't run ads or hold a shop link.

Steps:
1. From Clayton's profile: Pages → Create. Name 'Off The Rip Collectables'. Category (verify): Collectibles Store or Trading Card Store.
2. Profile photo = the logo; cover = a banner (see T26); about text from the Copy Kit; website + eBay link.
3. Add a 'Shop now' / 'Learn more' button pointing at the eBay store.
4. Put the Page URL in `site.config.json` → `links.facebook`; rebuild.

Done when:
- Page is public, has the logo, the bio and both links

Needs a human for:
- Facebook login / identity checks

#### T16 [TODO] Decide on Whatnot (live auctions)
Owner: HUMAN · ~20 min · priority 2 · depends on T01

Why: Live selling is the biggest card-sales channel for many YouTubers; Clayton already makes video content.

Steps:
1. Ask Clayton whether he wants to go live weekly. If no, close this task.
2. If yes: apply as a seller at whatnot.com/sell; read current fees, payout and category rules (verify).
3. Set `links.whatnot` and `features.whatnotLive=true`, add the schedule to /watch/.

Done when:
- Decision recorded; if yes, seller application submitted

Needs a human for:
- Application, ID verification

Verify first: Whatnot fees and seller requirements.

#### T17 [TODO] Decide on TCGplayer (TCG singles)
Owner: HUMAN · ~20 min · priority 3 · depends on T01

Why: TCG singles often sell faster on TCGplayer than eBay.

Steps:
1. Ask if he already sells there. If not, read the seller requirements and fee schedule (verify) and decide with Clayton whether the extra channel is worth the work.
2. If yes: set `links.tcgplayer`.

Done when:
- Decision recorded

Verify first: TCGplayer seller eligibility and fees.

#### T18 [TODO] Make sure TikTok is live and cross-posting
Owner: AI or human (human enters secrets/payment) · ~30 min · priority 2 · depends on T07

Why: TikTok is where card content grows fastest and the account exists but looks empty.

Steps:
1. Log in as Clayton; confirm the account is active; if empty, post the last 7 days of Shorts (download from YouTube Studio, no watermark issue).
2. Switch to a Business account if the 'website' field needs it (verify), set link = the site's /links/ page.
3. Set the bio from the Copy Kit; pin the best video.

Done when:
- At least 7 posts live, bio link set

Needs a human for:
- TikTok login

#### T19 [TODO] Unify every profile: name, picture, bio, one link
Owner: AI or human (human enters secrets/payment) · ~45 min · priority 1 · depends on T07, T14, T15

Why: Every profile should look like the same business and send people to the same place.

Steps:
1. For each of YouTube, Instagram, Threads, TikTok, Facebook Page, X, eBay store: profile photo = `logo-640.png`; name 'Off The Rip Collectables'; bio from the Copy Kit; link = `https://offtheripcollectables.com/links/?src=<platform>` (ig, yt, tt, th, fb, x).
2. YouTube: Customize channel → Basic info → Links: add the website, eBay store, Instagram. Add the site to the About description.
3. Add the new website to the eBay store description and 'social links' if eBay offers it (verify; eBay restricts selling links but permits social and brand links).

Done when:
- All profiles show the same name, logo and link
- Links/redirects: `/yt`, `/ebay`, `/ig`, `/tiktok` resolve

Needs a human for:
- Logging into each platform

#### T20 [TODO] Polish the eBay store itself
Owner: AI or human (human enters secrets/payment) · ~45 min · priority 1 · depends on T01

Why: All sales happen here. Small store fixes lift conversion immediately.

Steps:
1. Seller Hub → Store: check whether the store URL slug (currently `offtheripollectables`, missing the 'c') can be changed; if not, leave it and use `/ebay` on the site. (verify)
2. Write the store description from the Copy Kit: what he sells, 'most cards pulled on YouTube', link to the channel.
3. Add store categories that match the site: Basketball, Football, Baseball, Pokémon, One Piece, Dragon Ball, Graded.
4. Add a banner/logo (logo-640.png).
5. Do not add links that sell outside eBay (rule 6).

Done when:
- Store shows description, logo and categories
- Seller Hub shows no policy warnings

Needs a human for:
- Seller Hub login

Verify first: eBay store settings and link policy.

### P3: Data & content

_Feed the site real numbers and real copy._

#### T21 [TODO] Switch on the live eBay inventory grid
Owner: AI or human (human enters secrets/payment) · ~40 min · priority 1 · depends on T05

Why: The Shop page currently shows category shortcuts. Live listings with prices keep visitors on-site longer and send ready-to-buy traffic to eBay.

Steps:
1. developer.ebay.com → create a developer account (Clayton's) → Application Keys → Production keyset. Note the Client ID (App ID) and Client Secret (Cert ID).
2. GitHub repo → Settings → Secrets → add `EBAY_APP_ID`, `EBAY_CERT_ID`.
3. Locally: `EBAY_APP_ID=... EBAY_CERT_ID=... npm run sync:ebay`. Expect `ebay: N listings written`.
4. Check `src/data/listings.json` has `source: "ebay-api"` and sensible titles, prices, images.
5. `npm run build`, look at /shop/, commit.

Done when:
- /shop/ shows a live grid with images and prices
- Re-running the workflow refreshes it

Needs a human for:
- Creating the developer account, keyset approval (eBay may require a production-access review)

Verify first: `scripts/sync-ebay.mjs` follows the public Browse API docs but has NOT been run against live credentials. Fix the filter syntax / fields on the first run if the API differs.

Links: [eBay Browse API](https://developer.ebay.com/api-docs/buy/browse/overview.html)

#### T22 [TODO] Log the Daily Pack Verdict numbers
Owner: HUMAN · ~15 min · priority 1 · depends on T01

Why: The scoreboard is the site's best retention hook. Days 17 to 23 show only win/loss; dollar amounts make the chart and totals appear.

Steps:
1. Clayton fills `templates/verdicts.csv` (cost and value for days 17 to 23) in a spreadsheet, or tells an AI the numbers.
2. `npm run import:verdicts -- path/to/verdicts.csv` → `npm run build`.
3. Going forward: log each new day (30 seconds) in the same CSV, or in the Kit/Sheet you prefer.
4. Define and publish the scoring method: what 'value' means (e.g. recent eBay sold prices for the cards pulled, minus fees?). Add 2 to 3 lines under the table in `src/pages/verdict.html`.

Done when:
- /verdict/ shows dollar amounts, running chart and net total
- A 'how we score' note is visible

Needs a human for:
- Clayton's numbers and method

Notes: Auto-added days arrive with result=null (TBD) via `npm run sync:youtube`, which also breaks the streak until filled in.

#### T23 [TODO] Write the real About story and add a photo
Owner: HUMAN · ~30 min · priority 2 · depends on T01

Why: People buy from people. The About page currently has only verified facts and no story.

Steps:
1. Clayton writes 3 to 5 sentences: why cards, how the channel started, what makes his rips different. Supplies a clear photo.
2. Add to `src/pages/about.html`, photo to `src/assets/img/`, then rebuild.

Done when:
- About page has his story and photo (his approval recorded)

Needs a human for:
- Clayton's words and photo

#### T24 [TODO] Confirm shipping, packing and returns, then publish them
Owner: HUMAN · ~15 min · priority 2 · depends on T01

Why: Packing quality is the #1 trust signal for card buyers, but the site must only say what is true.

Steps:
1. Clayton describes exactly how cards ship (sleeve, toploader, team bag, bubble mailer? tracking? handling time?).
2. Write 3 to 4 bullets in the packing block of `about.html` and set `features.packingBlock` to `true`.

Done when:
- Block live and accurate

Needs a human for:
- Clayton's confirmation

#### T25 [TODO] Legal pass
Owner: HUMAN · ~45 min · priority 2 · depends on T01

Why: Cheap insurance before collecting emails and running giveaways.

Steps:
1. Have someone competent review `privacy.html` and `terms.html` (they are plain-language templates, not legal advice).
2. Fill `legal.businessName` (and `legal.address` if you want it on the site).
3. Confirm giveaway practice: 'no purchase necessary', age and state limits, who is eligible, and FTC disclosure. Publish rules per giveaway.
4. Sales tax: eBay collects and remits for marketplace sales; selling anywhere else would change this (see rule 6).

Done when:
- Review done; changes applied

Needs a human for:
- A person with legal judgment

#### T26 [TODO] Design the social images (OG image, banners)
Owner: AI · ~40 min · priority 3 · depends on T05

Why: The link-preview image people see when the site is shared is currently a basic placeholder.

Steps:
1. Render a 1200x630 image from an HTML template using the site fonts (headless Chrome screenshot) and save over `src/assets/img/og-image.jpg`.
2. Also produce a YouTube banner (2560x1440) and a Facebook cover (820x312) in the same style.

Done when:
- Link preview looks right in https://www.opengraph.xyz/

#### T27 [TODO] Turn on the scheduled data refresh
Owner: AI or human (human enters secrets/payment) · ~20 min · priority 2 · depends on T04, T05

Why: Keeps the video grid, listings and Verdict stubs current without anyone touching the site.

Steps:
1. Cloudflare → My Profile → API Tokens → create a token with 'Cloudflare Pages: Edit' permission.
2. GitHub → Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
3. Actions → refresh-and-deploy → Run workflow; confirm it passes and deploys.

Done when:
- Workflow green; the site shows the newest video within 6 hours of an upload

Needs a human for:
- Creating the token

### P4: Growth

_More eyes on the rips, more buyers on eBay._

#### T28 [TODO] Optimize the YouTube channel
Owner: AI or human (human enters secrets/payment) · ~60 min · priority 1 · depends on T19

Why: All sales start here. Better packaging of the same content earns more views for free.

Steps:
1. Playlists: Daily Pack Verdict, Up or Down, Box & Blaster Breaks, Giveaways, Pokémon, One Piece, Sports.
2. Description template for every upload from the Copy Kit: what's in the video, eBay store link, website link, Verdict scoreboard link.
3. Pinned comment template; end screen pointing to the Verdict playlist; channel trailer = the best 60-second Verdict.
4. Thumbnails: consistent look (logo corner, big result 'PROFIT' / 'LOSS', the chase card). Test two styles for two weeks and compare click-through rate.

Done when:
- Playlists and templates in place; CTR tracked in a sheet

Needs a human for:
- YouTube Studio login

#### T29 [TODO] Same-day cross-posting routine
Owner: AI or human (human enters secrets/payment) · ~30 min · priority 1 · depends on T19

Why: Every Short already exists; posting it on 4 more platforms is the cheapest growth available.

Steps:
1. Same day: YouTube Short → TikTok → Instagram Reels → Facebook Reels → Threads (and X once claimed). Use the caption templates in the Copy Kit; same hashtags; bio link via `/links/?src=<platform>`.
2. Pick a scheduler if wanted (Buffer, Metricool, Meta Business Suite) (verify free tiers).
3. Track per-platform views weekly in the KPI sheet.

Done when:
- 7 days in a row of cross-posts on all platforms

Needs a human for:
- Approving the captions

#### T30 [TODO] eBay listing optimization pass
Owner: AI or human (human enters secrets/payment) · ~90 min · priority 1 · depends on T20

Why: The best traffic is already on eBay; better listings convert it.

Steps:
1. Titles: Year Brand Set Player Parallel /numbering Grade (use all 80 characters).
2. Photos: front + back, grading label, natural light; the first photo on a plain background.
3. Turn on Best Offer for singles; send offers to watchers; Promoted Listings Standard at a low ad rate for slow movers (verify rates).
4. Combined shipping / multi-buy discounts; sale events; relist unsold with a 5% markdown.
5. Add 'as seen on the channel' + video link in descriptions where the card was pulled (a link to YouTube, not an external store: rule 6).

Done when:
- Sample of 20 listings updated; sell-through compared after 30 days

Needs a human for:
- Seller Hub login

Verify first: eBay's current rules on description links and promoted listings.

#### T31 [TODO] Giveaway playbook
Owner: AI or human (human enters secrets/payment) · ~30 min · priority 2 · depends on T25

Why: Giveaways already run on the channel; they are the main way to grow the list.

Steps:
1. Pick a repeatable format (e.g. every 25th Verdict Day, or per 100 subscribers).
2. Rules template (T25) in the video description; disclose any sponsor.
3. Mechanic: subscribe + comment to enter on YouTube. To build the email list, add 'get giveaway alerts: /giveaways/' as an extra, not a condition of entry (legal).
4. Announce winner on camera; ship the same week; post the proof.

Done when:
- Next giveaway uses the template; list growth measured

Needs a human for:
- Approving rules and prizes

#### T32 [TODO] Order inserts and (optional) 3D-printed stands
Owner: HUMAN · ~60 min · priority 3 · depends on T07

Why: A small card in each order turns a one-time buyer into a follower. The filament photo suggests card stands could be a free gift or merch.

Steps:
1. Design a 3x5 insert: logo, 'Thanks!', QR code → `https://offtheripcollectables.com/thanks/?src=insert`, 'Watch the rips on YouTube'. Do NOT invite buyers to purchase off eBay (rule 6).
2. Print 500 (verify a vendor: Vistaprint, Moo, local).
3. If printing stands: test a slab-sized stand; photograph; decide free gift over $X vs. sold item on eBay.

Done when:
- First 20 orders shipped with the insert; scans show up as `src=insert`

Needs a human for:
- Design approval, vendor payment

Verify first: eBay policy on inserts and promotional material in packages.

### P5: Retention

_Turn one-time eBay buyers into a list, a Want List and repeat customers._

#### T33 [TODO] Build the welcome emails in Kit
Owner: AI or human (human enters secrets/payment) · ~60 min · priority 1 · depends on T09, T10

Why: Subscribers are warmest in their first week. Five emails, segmented by interest.

Steps:
1. Use `emails/welcome-series.md`. In Kit create a sequence; add conditions on the `interests` field for the sports / Pokémon / One Piece-DBS / graded variants.
2. Replace placeholders; send a test to Clayton; he approves the voice (rule 10).
3. Turn it on for new subscribers.

Done when:
- A fresh test signup receives email 1 within a minute and the rest on schedule

Needs a human for:
- Clayton's approval of the copy

#### T34 [TODO] Run the Want List like a service
Owner: HUMAN · ~30 min · priority 1 · depends on T10

Why: A hunted card is a pre-qualified buyer. Keep the promise on the form.

Steps:
1. Weekly (Sunday): export the Want List (Kit custom fields or the backup sheet).
2. Search the store and the week's pulls; for each match, send a short email with the eBay link (the buyer buys on eBay).
3. Mark fulfilled; tell the buyer if nothing matches yet.

Done when:
- First weekly pass done; reply rate and sales from matches tracked

Needs a human for:
- Clayton or an assistant

#### T35 [TODO] Collect and publish real customer quotes
Owner: AI or human (human enters secrets/payment) · ~30 min · priority 3 · depends on T01

Why: Social proof beyond the feedback score.

Steps:
1. Pick 5 positive eBay feedback comments.
2. Ask each buyer's permission by eBay message (only to ask permission to quote their public feedback, no sales message) (verify policy).
3. Add approved quotes to the About/Shop page.

Done when:
- Quotes are real, permissioned and linked to the source

Needs a human for:
- Clayton sends the messages

Verify first: eBay messaging rules.

#### T36 [TODO] Retention loops
Owner: AI or human (human enters secrets/payment) · ~60 min · priority 2 · depends on T22, T33

Why: Return visits drive repeat buyers.

Steps:
1. Streak-break email: one automated email the day a Verdict ends the losing streak (subscribers who ticked interest 'verdict' come later; for now send manually).
2. Weekly 'Up or Down' price tracker for the featured card: log one price a week; add as a page (see Playbook → future builds).
3. Birthday-style 'anniversary' perk is overkill for now: skip until the list passes 500.

Done when:
- Streak email sent the first time the streak breaks

### P6: Ongoing

_Short routines that keep it all alive._

#### T37 [TODO] Weekly routine (30 minutes)
Owner: AI or human (human enters secrets/payment) · ~30 min · priority 1 · depends on T10

Why: Small, regular maintenance beats occasional big pushes.

Steps:
1. `npm run sync:youtube && npm run sync:ebay` (or let the Action do it).
2. Log the week's Verdict results (T22). Check Want List (T34).
3. Look at KPIs: YouTube subs, IG/TikTok followers, eBay followers, list size, site visits, eBay Clicks. Write them in the KPI sheet.
4. Send the weekly Hit List.

Done when:
- KPI sheet updated every week

#### T38 [TODO] Monthly routine (45 minutes)
Owner: AI or human (human enters secrets/payment) · ~45 min · priority 2 · depends on T07

Why: Keep facts accurate and the site healthy.

Steps:
1. Re-check facts.json numbers and update `stats` in site.config.json (with the new 'as of').
2. Run `npm test`; click every link; check domain/renewal dates; rotate API keys if anyone left the project.
3. Re-run the 'similar names' search (facts.json) to make sure no new lookalike brand appeared.
4. Review the Playbook and move the next 3 items into tasks.

Done when:
- `stats.asOf` updated; no broken links

## 4. Playbook (recommendations)

Recommendations, ordered by expected payoff for the effort. Baselines are from facts.json (2026-10-07). Targets are suggestions, not predictions.

### 1. The strategy in one paragraph

- Clayton already makes a lot of content (about 2 videos a day) and has a clean eBay record (100% positive, 1.6K sold). The weak links are **reach beyond YouTube**, **owning an audience** (no email list, no website) and **repeat buying**.
- So the site is a **brand hub and retention engine, not a store**: it points people to eBay for every purchase, and captures an email or a Want List entry for everyone who isn't ready to buy today.
- The strongest asset is the **Daily Pack Verdict** series with a visible 7-day losing streak: a built-in cliffhanger. Build the audience habit around 'will today break it?'.

### 2. Content that compounds

- Keep Daily Pack Verdict daily; log cost and pulled value so the scoreboard, chart and totals can grow (T22). Publish the scoring method for trust.
- Weekly 'Up or Down': track one chase card's price every week (the Josh Allen Gold /50 from Week 16 is a good start) and add a small chart page. Price-tracking content is evergreen search traffic.
- 'Is this box worth ripping?' summaries per product: one page per set on the site, fed by Verdict results. Search for 'is <set> worth it' is high-intent.
- Repurpose every Short on TikTok, Reels, Facebook Reels, Threads the same day (T29). Same content, 4x the surface.
- Pin the best-performing Verdict as the channel trailer; make a 'Start here' playlist.

### 3. eBay optimization (where the money is made)

- Every listing: strong 80-character title, front/back photos, correct category and item specifics (these power eBay search).
- Best Offer on singles, offers to watchers, and a modest Promoted Listings Standard rate for slow movers. (verify current rates and fee schedule before committing)
- Highlight cards 'pulled on the channel' (with the video link); that story is what a generic seller can't copy.
- Run 2 to 3 'weekend sale' events a month; announce them in the Hit List and on the site's promo bar (`promo` in site.config.json).
- Ask for feedback politely after delivery; protect the 100% score: it is the main conversion asset.

### 4. Website conversion

- One primary action per page: Shop on eBay. One secondary: Join the Hit List.
- Use the same words and logo as the YouTube channel so a visitor from a video recognises the page instantly.
- Bio links on every platform use `?src=<platform>` so the Newsletter and Want List forms record where signups came from.
- Keep it fast: no frameworks, self-hosted fonts, images lazy-loaded. Re-run Lighthouse after any change.

### 5. Email and retention

- Weekly 'Hit List' email: 3 biggest pulls, the Verdict scoreboard, 3 new listings, one giveaway reminder. Short, scannable.
- Segment by the interests ticked at signup (sports, Pokémon, One Piece/DBS, graded) so Pokémon fans don't get football emails.
- Want List: a weekly Sunday pass (T34). Each match email is the highest-converting message he can send.
- Giveaway engine: announce each giveaway in the Hit List first, tag subscribers with the giveaways interest, and keep entry on YouTube (email is an extra alert, never a condition of entry).
- Special 'streak broke!' email the day the losing streak ends.
- Starting targets for 90 days (guesses): 250 email subscribers, 40 Want List entries, 25% more eBay followers, bio-link clicks tracked per platform.

### 6. Community and collaboration

- Reply to every YouTube comment in the first hour after upload; it boosts distribution and builds loyalty.
- Collab with similar-size card YouTubers (join each other's breaks, trade shout-outs, 'break together' videos).
- Local: card shows, hobby shops and Facebook groups (follow each group's rules about selling and self-promotion).
- Consider a free Discord only after the list passes 500; communities need daily attention to stay alive.

### 7. 3D-printed extras (optional, test small)

- A branded slab/card stand as a free gift over a set order value, or sold in the eBay store. Cheap to make, memorable, photographs well.
- Use the logo's olive for the filament so it matches the brand. Photograph the stand with a card on it for the listing and Reels.
- Check material costs and print time first; only scale if people ask.

### 8. Compliance guardrails

- **eBay**: do not move buyers off eBay to complete sales. The earlier idea of a 'direct-buy discount' is **parked** until eBay's current off-platform policy has been read and a lawyer or eBay support confirms what is allowed (verify). If direct sales ever happen, they need sales-tax collection (e.g. Stripe Tax) and a real checkout.
- **Email**: consent, unsubscribe, honest subject lines, a mailing address in every email.
- **FTC**: disclose sponsors and giveaway terms. Never pay for or fabricate reviews.
- **Trademarks**: card names and artwork are the owners'; keep the disclaimer in the footer and don't imply endorsement.
- **Kids**: many TCG fans are minors. The email list is for ages 13+ (privacy page says so); giveaways need age rules.

### 9. Future builds (when the basics are running)

- 'Which collector are you?' quiz that recommends a category and captures email (the same pattern worked on the Ashley Claudy site).
- Up-or-Down price tracker page with a chart per tracked card.
- 'Is this set worth ripping?' pages generated from Verdict data.
- Break calendar with reminders (.ics) if he starts live breaks or Whatnot shows.
- Collection showcase: his personal PC with the story behind each card.
- Real checkout via Shopify/Stripe, only after the policy and tax steps above.

### 10. What not to do

- Don't buy followers, fake reviews or engagement pods: platforms detect them and it can kill the eBay account.
- Don't change the live eBay store or listings in bulk without testing a few first.
- Don't cut over the domain, or send the first email, before Clayton has approved the exact page or copy.
- Don't let the HQ page leak: no passwords, keys or private contact details in it, ever.

## 5. Copy kit (drafts for Clayton's approval)

Draft copy for Clayton to approve (rule 10). Only claims that are true today. Replace [DOMAIN] with the live domain. Keep platform character limits in mind (verify).

**Instagram (150 chars)**
```
Sports cards • TCG • pack openings
Daily Pack Verdict: profit or loss?
Shop the pulls on eBay 👇
```

**TikTok (80 chars)**
```
Cards ripped on camera. Shop on eBay. Daily Pack Verdict.
```

**X (160 chars)**
```
Sports cards, TCG & pack openings. Daily Pack Verdict: profit or loss? Shop the pulls on eBay. YouTube: Off The Rip Collectables.
```

**Threads / Facebook short**
```
Sports cards, TCG and pack openings. Most of the store gets pulled on camera: watch on YouTube, buy on eBay.
```

**YouTube About**
```
Welcome to Off The Rip Collectables: your home for sports cards, TCG, pack openings, box breaks, big hits and everything in the hobby!

New videos daily, including the Daily Pack Verdict: one pack a day, profit or loss?

Shop the cards pulled on this channel on eBay: [EBAY STORE LINK]
Scoreboard, Want List and giveaway alerts: [DOMAIN]

Business: hello@[DOMAIN]
```

**eBay store description**
```
Off The Rip Collectables is your destination for sports cards and TCG singles, hits and sealed product: NBA, NFL, MLB and more, plus Pokémon, One Piece, Dragon Ball Super and more, and graded slabs. Most cards are pulled on camera on our YouTube channel, Off The Rip Collectables. Questions? Send a message; we usually reply within a day. Thanks for supporting a small hobby seller!
```

**YouTube description template**
```
[ONE-LINE SUMMARY OF THE VIDEO]

▶ Daily Pack Verdict scoreboard: [DOMAIN]/verdict/?src=yt
🛒 Shop the pulls on eBay: [EBAY STORE LINK]
📝 Want a specific card? [DOMAIN]/want-list/?src=yt
🎁 Get giveaway alerts: [DOMAIN]/giveaways/?src=yt

Chapters:
00:00 Intro
...

#sportscards #tcg #packopening
```

**Pinned comment**
```
What would you rip next? Drop your pick below 👇 Day [N] result + the running scoreboard: [DOMAIN]/verdict/?src=yt
```

**Short captions**
- Day [N]: [PRODUCT]. Profit or loss? 👀 Scoreboard: [DOMAIN]/verdict/
- [PLAYER] [PARALLEL] /[NUMBER] pulled! 🔥 Shop on eBay: link in bio
- Can a $[PRICE] [PRODUCT] turn a profit? Full result on the channel. Link in bio.

**Hashtags**
- sports: #sportscards #nba #nfl #mlb #rookie #cardcollecting
- pokemon: #pokemoncards #pokemontcg #packopening
- onepiece_dbs: #onepiecetcg #dragonballsupertcg
- general: #packopening #cardbreaks #hobby #tcg

**Order insert**
```
THANK YOU for your order! 🙌
Watch the cards get ripped: YouTube → Off The Rip Collectables
Tell us what you're hunting: [DOMAIN]/thanks/?src=insert
```

**Want List match email**
```
Subject: A match for your Want List: [CARD]

Hi [NAME],

A card you asked about just came off the rip: [CARD DESCRIPTION].
Here's the eBay listing: [LINK]

If it's not what you hoped, reply and tell me what to look for next.

— Clayton
```

**Giveaway disclosure**
```
No purchase necessary. Open to [ELIGIBILITY]. Ends [DATE]. Not sponsored by or affiliated with YouTube, eBay or any card company. Winner chosen at random and announced on the channel. Full rules: [RULES LINK].
```
