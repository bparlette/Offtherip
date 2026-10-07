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
  <span class="vcard__thumb holo"><img loading="lazy" width="480" height="360" src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt=""><span class="vcard__play" aria-hidden="true">▶</span></span>
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
  <div class="streak__num" data-count="${n}">${n}</div>
  <div class="streak__text"><strong>${esc(label)} in a row</strong><span>Daily Pack Verdict · Day ${last.day}: ${esc(last.game)} ${esc(last.product)}</span></div>
  <a class="btn btn--small btn--glow" href="/verdict/">Will Day ${last.day + 1} break it?</a></div>`;
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
  return `<article class="lverdict"><a class="lverdict__img holo" href="/verdict/day-${last.day}/"><img loading="lazy" width="480" height="360" src="https://i.ytimg.com/vi/${esc(last.videoId)}/hqdefault.jpg" alt=""></a>
  <div><p class="eyebrow"><span class="badge badge--live" style="margin-right: 0.5rem;">LATEST RIP</span>Day ${last.day} · ${fmtDate(last.date)}</p><h2>${esc(last.game)} ${esc(last.product)}</h2>
  <p><span class="badge badge--${esc(last.result || "none")}">${word}</span> ${typeof last.cost === "number" && typeof last.value === "number" ? `Cost ${money(last.cost)} · pulled ${money(last.value)}` : "Dollar figures coming soon"}</p>
  <p><a class="btn btn--glow btn--small" href="/verdict/day-${last.day}/">Is it worth it? See the verdict</a> <a class="btn btn--ghost-dark btn--small" href="https://www.youtube.com/watch?v=${esc(last.videoId)}" target="_blank" rel="noopener">Watch the rip</a></p></div></article>`;
}

export function giveawayVideos(videos) {
  const g = videos.filter((v) => /giveaway/i.test(v.title)).slice(0, 6);
  if (!g.length) return "";
  return `<section class="section section--cream" aria-labelledby="gv-h"><div class="wrap"><h2 id="gv-h">Recent giveaway videos</h2><div class="vgrid">${g.map(videoCard).join("")}</div></div></section>`;
}

export const MARQUEE = ["DAILY PACK VERDICT", "BOX BREAKS", "SPORTS CARDS", "POKÉMON", "ONE PIECE", "DRAGON BALL SUPER", "BIG HITS", "GIVEAWAYS", "GRADED SLABS"];

export const SHOP_CATEGORIES = [
  ["Basketball", "basketball", "🏀", "NBA & Rookies", "Prizm, Optic, Select blasters & hobby. Rookie autos, numbered parallels & chases.", "HOT"],
  ["Football", "football", "🏈", "NFL Blasters & Hobby", "Bowman Chrome, Prizm, Donruss. Key rookie quarterbacks and case hits.", "NEW"],
  ["Baseball", "baseball", "⚾", "MLB & Flagship", "Topps Flagship, Chrome, Bowman. Short prints, numbered parallels & autographs.", "POPULAR"],
  ["Pokémon", "pokemon", "⚡", "Scarlet & Violet", "Prismatic Evolutions, Pitch Black, 151, Crown Zenith. Special Art Rares.", "CHASE"],
  ["One Piece", "one piece", "🏴‍☠️", "Bandai Card Game", "OP-09, Wings of the Captain, Memorial Collection. Manga rares & Leaders.", "TRENDING"],
  ["Dragon Ball Super", "dragon ball", "🐉", "Fusion World & Masters", "Prismatic Clash, Realm of the Gods. Secret Rares & God Rares.", "FRESH"],
  ["Graded slabs", "(psa,bgs,sgc,cgc)", "🔒", "Investment Grade", "PSA 10 Gem Mint, BGS 9.5, CGC pristine slabs. Graded and sealed.", "GEM MINT"],
  ["Everything new", "", "🆕", "Daily Live Drops", "Every fresh hit listed directly from the studio. Bubble wrapped and insured.", "DAILY"],
];

export function shelfCollectibles(config) {
  const s = config.ebay.sellerName;
  const cards = SHOP_CATEGORIES.map(([name, kw, icon, kicker, desc, badge]) => {
    const url = kw ? searchUrl(s, kw) : `https://www.ebay.com/sch/i.html?_ssn=${s}&_sop=10`;
    return `<a class="shelf-card" href="${esc(url)}" target="_blank" rel="noopener">
      <span class="cover">
        <span class="badge">${esc(badge)}</span>
        <span class="cover__bg" aria-hidden="true"><span class="cover__icon">${icon}</span></span>
        <span class="cover__art holo"></span>
      </span>
      <p class="kicker">${esc(kicker)}</p>
      <h3>${esc(name)}</h3>
      <p class="line">${esc(desc)}</p>
      <span class="more">Shop on eBay <svg class="ico" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4.5-5L15.5 10l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    </a>`;
  });
  return `<div class="shelf-wrap" data-shelf>
    <div class="shelf" tabindex="0" aria-label="Collectibles by Off The Rip">${cards.join("\n")}</div>
    <div class="wrap shelf-ctl">
      <button class="shelf-btn" type="button" data-shelf-btn="prev" aria-label="Scroll left">←</button>
      <div class="shelf-prog" aria-hidden="true"><i></i></div>
      <button class="shelf-btn" type="button" data-shelf-btn="next" aria-label="Scroll right">→</button>
    </div>
  </div>`;
}

export function shelfVideos(videos) {
  const cards = videos.slice(0, 10).map((v) => {
    return `<a class="shelf-card vcard--shelf holo" href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener">
      <span class="cover cover--video">
        <img loading="lazy" width="480" height="360" src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="">
        <span class="vcard__play" aria-hidden="true">▶</span>
      </span>
      <p class="kicker">${fmtDate(v.published)} · ${fmtViews(v.views)}</p>
      <h3>${esc(cleanTitle(v.title))}</h3>
      <span class="more">Watch Rip <svg class="ico" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4.5-5L15.5 10l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    </a>`;
  });
  return `<div class="shelf-wrap" data-shelf>
    <div class="shelf feed" tabindex="0" aria-label="Recent pack rip videos">${cards.join("\n")}</div>
    <div class="wrap shelf-ctl">
      <button class="shelf-btn" type="button" data-shelf-btn="prev" aria-label="Previous video">←</button>
      <div class="shelf-prog" aria-hidden="true"><i></i></div>
      <button class="shelf-btn" type="button" data-shelf-btn="next" aria-label="Next video">→</button>
    </div>
  </div>`;
}

export function shelfVerdicts(verdicts) {
  const sorted = [...verdicts.entries].sort((a, b) => b.day - a.day).slice(0, 8);
  const cards = sorted.map((x) => {
    const has = typeof x.cost === "number" && typeof x.value === "number";
    const pl = has ? x.value - x.cost : null;
    const isLoss = x.result === "loss";
    const isWin = x.result === "profit";
    return `<a class="shelf-card vcard--shelf verdict-card ${isLoss ? "t-loss" : isWin ? "t-win" : ""}" href="/verdict/day-${x.day}/">
      <span class="cover cover--video">
        <img loading="lazy" width="480" height="360" src="https://i.ytimg.com/vi/${esc(x.videoId)}/hqdefault.jpg" alt="">
        <span class="badge badge--${esc(x.result || "none")}">${isLoss ? "LOSS" : isWin ? "PROFIT" : "TBD"}</span>
      </span>
      <p class="kicker">Day ${x.day} · ${fmtDate(x.date)}</p>
      <h3>${esc(x.game)} ${esc(x.product)}</h3>
      <p class="line">${has ? `Cost ${money(x.cost)} · Pulled ${money(x.value)} (${pl >= 0 ? "+" : ""}${money(pl)})` : "Dollar figures coming soon"}</p>
      <span class="more">See Verdict Day ${x.day} <svg class="ico" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4.5-5L15.5 10l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    </a>`;
  });
  return `<div class="shelf-wrap" data-shelf>
    <div class="shelf verdict-shelf" tabindex="0" aria-label="Daily Pack Verdict days">${cards.join("\n")}</div>
    <div class="wrap shelf-ctl">
      <button class="shelf-btn" type="button" data-shelf-btn="prev" aria-label="Previous verdict day">←</button>
      <div class="shelf-prog" aria-hidden="true"><i></i></div>
      <button class="shelf-btn" type="button" data-shelf-btn="next" aria-label="Next verdict day">→</button>
    </div>
  </div>`;
}

export function reviewsSlider(reviewsData, config) {
  const list = reviewsData?.reviews || [];
  if (!list.length) return "";
  const cards = list.map((r, i) => {
    const tone = i % 3 === 0 ? "t-gold" : i % 3 === 1 ? "t-blue" : "t-emerald";
    return `<figure class="rv-card ${tone}">
      <div class="rv-top">
        <span class="stars" role="img" aria-label="5 out of 5 stars">★★★★★</span>
        <span class="rv-badge">★ 100% Positive</span>
        <span class="rv-book">${esc(r.item)}</span>
      </div>
      <blockquote>“${esc(r.quote)}”</blockquote>
      <figcaption>
        <b>${esc(r.by)}</b><span>Verified eBay Buyer</span>
        <a class="rv-link" href="${esc(config.links.ebayFeedback || config.links.ebay)}" target="_blank" rel="noopener">eBay Feedback</a>
      </figcaption>
    </figure>`;
  });
  return `<div class="rv reveal" data-reviews>
    <div class="rv-track" tabindex="0" aria-label="Collector reviews on eBay">${cards.join("\n")}</div>
    <div class="wrap rv-ctl">
      <button class="rv-btn" type="button" data-rv="prev" aria-label="Previous review">←</button>
      <div class="rv-prog" aria-hidden="true"><i></i></div>
      <button class="rv-btn" type="button" data-rv="next" aria-label="Next review">→</button>
    </div>
  </div>`;
}

export function slots({ config, data, page }) {
  const vids = data.videos.videos;
  return {
    latestVideos: `<div class="vgrid">${vids.slice(0, 6).map(videoCard).join("")}</div>`,
    allVideos: `<div class="vgrid">${vids.slice(0, 12).map(videoCard).join("")}</div>`,
    shelfVideos: shelfVideos(vids),
    shelfCollectibles: shelfCollectibles(config),
    shelfVerdicts: shelfVerdicts(data.verdicts),
    reviewsSlider: reviewsSlider(data.reviews, config),
    streak: streakCard(data.verdicts),
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
