// Build-time HTML generators for the {{{@slot}}} placeholders. Pure functions: easy to test.
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = (n) => (typeof n === "number" ? (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—");
const fmtDate = (iso) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const fmtViews = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "K" : String(n)) + " views";
export const cleanTitle = (t) => t.replace(/\s*#\w+/g, "").replace(/\s{2,}/g, " ").trim();

export const SOCIALS = [
  ["youtube", "YouTube"], ["instagram", "Instagram"], ["tiktok", "TikTok"], ["threads", "Threads"],
  ["facebook", "Facebook"], ["x", "X"], ["whatnot", "Whatnot"], ["tcgplayer", "TCGplayer"],
];

export function videoCard(v) {
  return `<a class="vcard" href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener">
  <span class="vcard__thumb"><img loading="lazy" width="480" height="360" src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt=""><span class="vcard__play" aria-hidden="true">▶</span></span>
  <span class="vcard__title">${esc(cleanTitle(v.title))}</span>
  <span class="vcard__meta">${fmtDate(v.published)} · ${fmtViews(v.views)}</span></a>`;
}

/** Current streak of identical results at the end of the series. */
export function streakOf(entries) {
  const sorted = [...entries].sort((a, b) => a.day - b.day);
  let n = 0, kind = null;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const r = sorted[i].result;
    if (!r || r === "even") break;
    if (kind === null) kind = r;
    if (r !== kind) break;
    n++;
  }
  return { n, kind, last: sorted[sorted.length - 1] };
}

export function streakCard(verdicts) {
  const { n, kind, last } = streakOf(verdicts.entries);
  if (!last) return "";
  const label = kind === "profit" ? (n === 1 ? "win" : "wins") : n === 1 ? "loss" : "losses";
  return `<div class="streak" role="group" aria-label="Daily Pack Verdict streak">
  <div class="streak__num">${n}</div>
  <div class="streak__text"><strong>${esc(label)} in a row</strong><span>Daily Pack Verdict · Day ${last.day}: ${esc(last.game)} ${esc(last.product)}</span></div>
  <a class="btn btn--small btn--lime" href="/verdict/">Will Day ${last.day + 1} break it?</a></div>`;
}

const streakLabel = (n, kind) => (kind === "profit" ? (n === 1 ? "win" : "wins") : n === 1 ? "loss" : "losses");
const RESULT_MAP = (entries) => JSON.stringify(Object.fromEntries(entries.filter((e) => e.result === "profit" || e.result === "loss").map((e) => [e.day, e.result])));

/** Compact streak bar pinned under the header on every page. The countdown only renders when config.verdict.dropTime is set. */
export function streakHud(verdicts, config) {
  const { n, kind, last } = streakOf(verdicts.entries);
  if (!last || !n) return "";
  const v = (config && config.verdict) || {};
  const drop = v.dropTime ? ` data-drop="${esc(v.dropTime)}" data-tz="${esc(v.dropTz || "America/New_York")}"` : "";
  return `<a class="hud" href="/verdict/" data-next="${last.day + 1}"${drop} aria-label="Daily Pack Verdict: ${n} ${streakLabel(n, kind)} in a row">
  <span class="hud__streak"><i aria-hidden="true"></i><b>${n}</b> ${streakLabel(n, kind)} in a row</span>
  <span class="hud__next">Day ${last.day + 1}<span class="hud__t" aria-live="off"> drops daily</span></span>
  <span class="hud__go">Call it →</span></a>`;
}

/** Hero centrepiece: one giant streak number, the last 7 results as pips, a live countdown and the latest video as the poster. */
export function streakHero(verdicts, config) {
  const { n, kind, last } = streakOf(verdicts.entries);
  if (!last) return "";
  const v = (config && config.verdict) || {};
  const drop = v.dropTime ? ` data-drop="${esc(v.dropTime)}" data-tz="${esc(v.dropTz || "America/New_York")}"` : "";
  const recent = [...verdicts.entries].sort((a, b) => a.day - b.day).slice(-7);
  const pips = recent.map((e) => `<a class="pip pip--${esc(e.result || "none")}" href="/verdict/day-${e.day}/" title="Day ${e.day}: ${esc(e.result || "pending")}"><span class="sr">Day ${e.day}: ${esc(e.result || "pending")}</span></a>`).join("");
  return `<div class="streakhero" data-next="${last.day + 1}"${drop}>
  <p class="streakhero__eyebrow"><span class="live" aria-hidden="true"></span>Daily Pack Verdict · Day ${last.day}</p>
  <div class="streakhero__row"><span class="streakhero__num" data-count="${n}" aria-hidden="true">${n}</span>
    <span class="streakhero__lbl"><b>${esc(streakLabel(n, kind))}</b> in a row<small>${esc(last.game)} ${esc(last.product)}</small></span></div>
  <p class="sr">${n} ${esc(streakLabel(n, kind))} in a row.</p>
  <div class="pips" role="group" aria-label="Last ${recent.length} results">${pips}<span class="pip pip--next" title="Day ${last.day + 1}">?</span></div>
  <p class="streakhero__next">Day ${last.day + 1}<span class="hud__t"> drops daily</span></p></div>`;
}

/** Hit-or-Bust call for the next Verdict day. Picks live in the visitor's own browser (localStorage); there is no shared vote. */
export function predictCard(verdicts) {
  const { last } = streakOf(verdicts.entries);
  if (!last) return "";
  const next = last.day + 1;
  return `<div class="predict" data-predict data-next="${next}" data-results='${RESULT_MAP(verdicts.entries)}'>
  <p class="predict__q"><span class="eyebrow">Your call</span><b>Day ${next}: hit or bust?</b></p>
  <div class="predict__btns" role="group" aria-label="Call Day ${next}">
    <button type="button" class="pbtn pbtn--hit" data-pick="hit"><span aria-hidden="true">🔥</span> Hit<small>profit</small></button>
    <button type="button" class="pbtn pbtn--bust" data-pick="bust"><span aria-hidden="true">💥</span> Bust<small>loss</small></button></div>
  <p class="predict__out" role="status" aria-live="polite"></p>
  <p class="predict__rec fine" hidden></p>
  <button type="button" class="predict__share link" data-share hidden>Share my call</button></div>`;
}

export function latestPoster(verdicts) {
  const last = [...verdicts.entries].sort((a, b) => a.day - b.day).pop();
  if (!last) return "";
  return `<a class="poster" data-tilt href="https://www.youtube.com/watch?v=${esc(last.videoId)}" target="_blank" rel="noopener" aria-label="Watch Day ${last.day}: ${esc(last.game)} ${esc(last.product)}">
  <img src="https://i.ytimg.com/vi/${esc(last.videoId)}/hqdefault.jpg" width="480" height="360" alt="" fetchpriority="high">
  <span class="poster__play" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M8 5v14l11-7z"/></svg></span>
  <span class="poster__cap"><b>Day ${last.day}</b>${esc(last.game)} ${esc(last.product)}</span></a>`;
}

export function verdictSummary(verdicts) {
  const e = verdicts.entries;
  const wins = e.filter((x) => x.result === "profit").length, losses = e.filter((x) => x.result === "loss").length;
  const priced = e.filter((x) => typeof x.cost === "number" && typeof x.value === "number");
  const net = priced.reduce((s, x) => s + x.value - x.cost, 0);
  return `<ul class="stats">
  <li><b>${e.length}</b><span>days logged</span></li>
  <li><b>${wins}–${losses}</b><span>profit–loss record</span></li>
  <li><b>${priced.length ? money(net) : "—"}</b><span>net on ${priced.length} priced day${priced.length === 1 ? "" : "s"}</span></li></ul>
  ${priced.length < e.length ? `<p class="fine">Dollar figures are added day by day. ${e.length - priced.length} of ${e.length} days still show win/loss only.</p>` : ""}`;
}

export function verdictTable(verdicts) {
  const rows = [...verdicts.entries].sort((a, b) => b.day - a.day).map((x) => {
    const has = typeof x.cost === "number" && typeof x.value === "number";
    const pl = has ? x.value - x.cost : null;
    return `<tr data-result="${esc(x.result || "")}" data-game="${esc(x.game)}" data-day="${x.day}" data-cost="${x.cost ?? ""}" data-value="${x.value ?? ""}">
  <th scope="row">Day ${x.day}</th><td>${fmtDate(x.date)}</td><td><b>${esc(x.game)}</b> ${esc(x.product)}</td>
  <td><span class="badge badge--${esc(x.result || "none")}">${x.result === "loss" ? "LOSS" : x.result === "profit" ? "PROFIT" : x.result === "even" ? "EVEN" : "TBD"}</span></td>
  <td class="num">${money(x.cost)}</td><td class="num">${money(x.value)}</td><td class="num ${pl === null ? "" : pl >= 0 ? "pos" : "neg"}">${pl === null ? "—" : money(pl)}</td>
  <td><a href="https://www.youtube.com/watch?v=${esc(x.videoId)}" target="_blank" rel="noopener" aria-label="Watch Day ${x.day}">▶ Watch</a></td></tr>`;
  });
  return `<div class="tablewrap"><table class="vtable" id="vtable"><thead><tr><th>Day</th><th>Date</th><th>Product</th><th>Result</th><th class="num">Cost</th><th class="num">Pulled</th><th class="num">P/L</th><th></th></tr></thead><tbody>${rows.join("\n")}</tbody></table></div>`;
}

const searchUrl = (seller, kw) => `https://www.ebay.com/sch/i.html?_ssn=${encodeURIComponent(seller)}&_nkw=${encodeURIComponent(kw)}&_sop=10`;
export const SHOP_TILES = [
  ["Basketball", "basketball", "🏀"], ["Football", "football", "🏈"], ["Baseball", "baseball", "⚾"],
  ["Pokémon", "pokemon", "⚡"], ["One Piece", "one piece", "🏴‍☠️"], ["Dragon Ball Super", "dragon ball", "🐉"],
  ["Graded slabs", "(psa,bgs,sgc,cgc)", "🔒"], ["Everything new", "", "🆕"],
];
export function shopTiles(config) {
  const s = config.ebay.sellerName;
  return `<div class="tiles">${SHOP_TILES.map(([name, kw, icon]) => `<a class="tile" href="${esc(kw ? searchUrl(s, kw) : `https://www.ebay.com/sch/i.html?_ssn=${s}&_sop=10`)}" target="_blank" rel="noopener"><span class="tile__icon" aria-hidden="true">${icon}</span><span class="tile__name">${esc(name)}</span><span class="tile__go">Shop on eBay →</span></a>`).join("")}</div>`;
}

export function listingsGrid(listings, config) {
  const items = listings.source === "ebay-api" ? listings.items : [];
  if (!items.length)
    return `<div id="grid" class="grid grid--empty" data-count="0"><p class="lead">Live inventory is on eBay: new listings drop daily. Pick a category above or <a href="${esc(config.links.ebay)}" target="_blank" rel="noopener">open the whole store</a>.</p></div>`;
  return `<div id="grid" class="grid" data-count="${items.length}">${items.map((i) => `<a class="lcard" data-cat="${esc(i.category || "")}" data-price="${i.price ?? ""}" data-title="${esc((i.title || "").toLowerCase())}" href="${esc(i.url)}" target="_blank" rel="noopener">
  <span class="lcard__img">${i.image ? `<img loading="lazy" src="${esc(i.image)}" alt="">` : ""}</span><span class="lcard__title">${esc(i.title)}</span>
  <span class="lcard__price">${money(i.price)}${i.condition ? ` <small>${esc(i.condition)}</small>` : ""}</span></a>`).join("")}</div>`;
}

export function socialLinks(config, cls = "pills") {
  const out = SOCIALS.filter(([k]) => config.links[k]).map(([k, label]) => `<a href="${esc(config.links[k])}" target="_blank" rel="me noopener">${label}</a>`);
  return `<nav class="${cls}" aria-label="Social links">${out.join("")}</nav>`;
}

export function jsonLd(config) {
  const sameAs = SOCIALS.map(([k]) => config.links[k]).filter(Boolean).concat(config.links.ebay);
  const org = { "@context": "https://schema.org", "@type": "Organization", name: config.brand.name, url: config.siteUrl, logo: `${config.siteUrl}/assets/img/logo-640.png`, sameAs, description: config.brand.tagline };
  const site = { "@context": "https://schema.org", "@type": "WebSite", name: config.brand.name, url: config.siteUrl };
  return [org, site].map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n");
}

export function latestVerdict(verdicts) {
  const last = [...verdicts.entries].sort((a, b) => b.day - a.day)[0];
  if (!last) return "";
  const word = last.result === "loss" ? "LOSS" : last.result === "profit" ? "PROFIT" : "TBD";
  return `<article class="lverdict"><a class="lverdict__img" href="/verdict/day-${last.day}/"><img loading="lazy" width="480" height="360" src="https://i.ytimg.com/vi/${esc(last.videoId)}/hqdefault.jpg" alt=""></a>
  <div><p class="eyebrow">Latest verdict · Day ${last.day} · ${fmtDate(last.date)}</p><h2>${esc(last.game)} ${esc(last.product)}</h2>
  <p><span class="badge badge--${esc(last.result || "none")}">${word}</span> ${typeof last.cost === "number" && typeof last.value === "number" ? `Cost ${money(last.cost)} · pulled ${money(last.value)}` : "Dollar figures coming soon"}</p>
  <p><a class="btn btn--lime btn--small" href="/verdict/day-${last.day}/">Is it worth it? See the verdict</a> <a class="btn btn--ghost-dark btn--small" href="https://www.youtube.com/watch?v=${esc(last.videoId)}" target="_blank" rel="noopener">Watch the rip</a></p></div></article>`;
}

export function giveawayVideos(videos) {
  const g = videos.filter((v) => /giveaway/i.test(v.title)).slice(0, 6);
  if (!g.length) return "";
  return `<section class="section section--cream" aria-labelledby="gv-h"><div class="wrap"><h2 id="gv-h">Recent giveaway videos</h2><div class="vgrid">${g.map(videoCard).join("")}</div></div></section>`;
}

export const MARQUEE = ["DAILY PACK VERDICT", "BOX BREAKS", "SPORTS CARDS", "POKÉMON", "ONE PIECE", "DRAGON BALL SUPER", "BIG HITS", "GIVEAWAYS", "GRADED SLABS"];

export function slots({ config, data, page }) {
  const vids = data.videos.videos;
  return {
    latestVideos: `<div class="vgrid">${vids.slice(0, 6).map(videoCard).join("")}</div>`,
    allVideos: `<div class="vgrid">${vids.slice(0, 12).map(videoCard).join("")}</div>`,
    streak: streakCard(data.verdicts),
    streakHero: streakHero(data.verdicts, config),
    streakHud: streakHud(data.verdicts, config),
    predict: predictCard(data.verdicts),
    latestPoster: latestPoster(data.verdicts),
    giveawayVideos: giveawayVideos(vids),
    latestVerdict: latestVerdict(data.verdicts),
    verdictSummary: verdictSummary(data.verdicts),
    verdictTable: verdictTable(data.verdicts),
    shopTiles: shopTiles(config),
    listingsGrid: listingsGrid(data.listings, config),
    socialLinks: socialLinks(config),
    socialLinksFooter: socialLinks(config, "footlinks"),
    jsonLd: page.home ? jsonLd(config) : "",
    marquee: [...MARQUEE, ...MARQUEE].map((t) => `<span>${esc(t)}</span>`).join(""),
    uploadsPlaylist: "UU" + config.youtube.channelId.slice(2),
  };
}
