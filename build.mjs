#!/usr/bin/env node
/**
 * Zero-dependency static site builder.
 *   src/pages/**.html  -> dist/<route>/index.html   (pages/hq/ -> config.hqPath)
 *   src/partials/*.html  included with {{> name}}
 *   src/assets, src/data copied as-is;  src/hq/*  copied into the HQ folder
 * Template syntax:  {{path.to.config}}  (HTML-escaped, build FAILS on undefined)
 *                   {{{@slot}}}         (raw HTML generated below)
 *                   {{#if x}}..{{else}}..{{/if}}   {{#unless x}}..{{/unless}}
 *                   {{> partial}}
 * Each page starts with:  <!--page {"title":"..","description":"..","nav":"shop"} -->
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slots } from "./scripts/render-slots.mjs";
import { buildBrief } from "./scripts/build-brief.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const readJSON = (p) => JSON.parse(read(p));

export const config = readJSON("site.config.json");
const data = {
  videos: readJSON("src/data/videos.json"),
  verdicts: readJSON("src/data/verdicts.json"),
  listings: readJSON("src/data/listings.json"),
  reviews: fs.existsSync(path.join(ROOT, "src/data/reviews.json")) ? readJSON("src/data/reviews.json") : { reviews: [] },
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const get = (o, p) => p.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
const truthy = (v) => v !== undefined && v !== null && v !== false && v !== "" && !(Array.isArray(v) && !v.length);

export function render(tpl, ctx, where = "?") {
  tpl = tpl.replace(/\{\{>\s*([\w/-]+)\s*\}\}/g, (_, n) => render(read(`src/partials/${n}.html`), ctx, `partial:${n}`));
  for (let prev; prev !== tpl; ) {
    prev = tpl;
    tpl = tpl.replace(
      /\{\{#(if|unless)\s+([\w.]+)\s*\}\}((?:(?!\{\{#(?:if|unless)\s)[\s\S])*?)\{\{\/\1\}\}/g,
      (_, kind, p, body) => {
        const [yes, no = ""] = body.split("{{else}}");
        return (kind === "if") === truthy(get(ctx, p)) ? yes : no;
      },
    );
  }
  tpl = tpl.replace(/\{\{\{@([\w]+)\}\}\}/g, (_, n) => {
    if (!(n in ctx.slots)) throw new Error(`[${where}] unknown slot @${n}`);
    return ctx.slots[n];
  });
  return tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, p) => {
    const v = get(ctx, p);
    if (v === undefined) throw new Error(`[${where}] undefined template value: ${p}`);
    return v === null ? "" : esc(v);
  });
}

function walk(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const full = path.join(dir, d.name);
    return d.isDirectory() ? walk(full, base) : [path.relative(base, full)];
  });
}
const copyDir = (from, to) => {
  if (!fs.existsSync(from)) return;
  for (const rel of walk(from)) {
    fs.mkdirSync(path.dirname(path.join(to, rel)), { recursive: true });
    fs.copyFileSync(path.join(from, rel), path.join(to, rel));
  }
};
const write = (rel, content) => {
  const out = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, content);
};

if (!globalThis.__otrWarn) { globalThis.__otrWarn = true; const age = (Date.now() - Date.parse(config.stats.asOf)) / 864e5; if (age > 45) console.warn(`WARNING: eBay stats "as of ${config.stats.asOf}" are ${Math.round(age)} days old. Update site.config.json stats (HQ task T38).`); }
const NAV_KEYS = ["home", "shop", "verdict", "watch", "wantlist", "about"];

export function build() {
  fs.rmSync(DIST, { recursive: true, force: true });
  const pages = [];
  const hqRoute = config.hqPath;

  for (const rel of walk(path.join(SRC, "pages")).filter((f) => f.endsWith(".html"))) {
    const raw = read(`src/pages/${rel}`);
    const m = raw.match(/^<!--page\s+(\{[\s\S]*?\})\s*-->\s*/);
    if (!m) throw new Error(`${rel}: missing <!--page {...} --> header`);
    const page = JSON.parse(m[1]);
    const isHq = rel.startsWith("hq/");
    let route;
    if (isHq) route = hqRoute;
    else if (rel === "index.html") route = "/";
    else if (rel === "404.html") route = "/404.html";
    else route = "/" + rel.replace(/\.html$/, "").replace(/\/index$/, "") + "/";
    page.path = route;
    page.noindex = !!page.noindex || isHq;
    page.canonical = config.siteUrl + (route === "/404.html" ? "/" : route);
    page.ogImage = page.ogImage || "/assets/img/og-image.jpg";
    page.title = page.title || config.brand.name;
    page.fullTitle = page.title === config.brand.name || page.home ? config.brand.name + " | Sports Cards, TCG & Pack Openings" : `${page.title} | ${config.brand.name}`;
    const nav = Object.fromEntries(NAV_KEYS.map((k) => [k, page.nav === k ? "is-active" : ""]));
    const ctx = { ...config, page, nav, slots: slots({ config, data, page }), now: new Date().getFullYear() };
    const html = render(raw.slice(m[0].length), ctx, rel);
    const outRel = route === "/404.html" ? "404.html" : path.join(route, "index.html");
    write(outRel, html);
    pages.push({ route, noindex: page.noindex, rel });
  }

  // loose files in src/ (e.g. manifest.webmanifest) go to the site root
  for (const f of fs.readdirSync(SRC, { withFileTypes: true })) if (f.isFile()) fs.copyFileSync(path.join(SRC, f.name), path.join(DIST, f.name));
  const sorted = [...data.verdicts.entries].sort((a, b) => a.day - b.day);
  const dayTpl = read("src/templates/verdict-day.html");
  sorted.forEach((e, i) => {
    const has = typeof e.cost === "number" && typeof e.value === "number";
    const route = `/verdict/day-${e.day}/`;
    const page = { nav: "verdict", title: `${e.game} ${e.product}: worth it? Day ${e.day}`, description: `Is ${e.game} ${e.product} worth opening? Daily Pack Verdict Day ${e.day}: ${e.result === "profit" ? "profit" : e.result === "loss" ? "loss" : "result pending"}. Watch the rip.`, path: route, noindex: false, canonical: config.siteUrl + route, ogImage: "/assets/img/og-image.jpg" };
    page.fullTitle = `${page.title} | ${config.brand.name}`;
    const nav = Object.fromEntries(NAV_KEYS.map((k) => [k, k === "verdict" ? "is-active" : ""]));
    const link = (x, t) => (x ? `<a href="/verdict/day-${x.day}/">${t} Day ${x.day}: ${esc(x.game)} ${esc(x.product)}</a>` : "");
    const v = { ...e, resultWord: e.result === "loss" ? "LOSS" : e.result === "profit" ? "PROFIT" : "pending", dateLabel: e.date, money: has ? `Cost $${e.cost.toFixed(2)}, pulled $${e.value.toFixed(2)}.` : "Dollar figures coming soon." };
    const ctx = { ...config, page, nav, v, slots: { ...slots({ config, data, page }), dayNav: `<p class="daynav">${link(sorted[i - 1], "← ")} ${link(sorted[i + 1], "")}</p>` }, now: new Date().getFullYear() };
    write(path.join(route, "index.html"), render(dayTpl, ctx, `verdict-day-${e.day}`));
    pages.push({ route, noindex: false, rel: `verdict-day-${e.day}` });
  });
  copyDir(path.join(SRC, "assets"), path.join(DIST, "assets"));
  copyDir(path.join(SRC, "data"), path.join(DIST, "data"));
  fs.rmSync(path.join(DIST, "data", "listings.sample.json"), { force: true });
  if (data.listings.source !== "sample") fs.copyFileSync(path.join(SRC, "data", "listings.sample.json"), path.join(DIST, "data", "listings.sample.json"));
  copyDir(path.join(SRC, "hq"), path.join(DIST, hqRoute));
  write(path.join(hqRoute, "brief.md"), buildBrief({ config, root: ROOT }));
  write(path.join(hqRoute, "site-meta.json"), JSON.stringify({
    siteUrl: config.siteUrl,
    missingLinks: Object.entries(config.links).filter(([, v]) => !v).map(([k]) => k),
    analytics: !!(config.analytics.cloudflareToken || config.analytics.plausibleDomain),
    packingBlock: !!config.features.packingBlock,
    promo: !!config.promo.enabled,
  }));

  const urls = pages.filter((p) => !p.noindex && p.route !== "/404.html");
  const today = new Date().toISOString().slice(0, 10);
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((p) => `  <url><loc>${config.siteUrl}${p.route}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`);
  // NOTE: the HQ path is deliberately NOT listed in robots.txt or the sitemap.
  write("robots.txt", `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`);
  write("_headers", `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; img-src 'self' data: https://i.ytimg.com https://i.ebayimg.com https://*.cdninstagram.com; frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com; script-src 'self' https://static.cloudflareinsights.com https://challenges.cloudflare.com; connect-src 'self' https://cloudflareinsights.com; style-src 'self' 'unsafe-inline'; base-uri 'self'; form-action 'self'

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/data/*
  Cache-Control: public, max-age=300

${hqRoute}*
  X-Robots-Tag: noindex, nofollow, noarchive
  Cache-Control: no-store
`);
  const L = config.links;
  const hop = (name, url) => (url ? `/${name}  ${url}  302\n` : "");
  write("_redirects", hop("yt", L.youtube) + hop("ebay", L.ebay) + hop("ig", L.instagram) + hop("tiktok", L.tiktok) + hop("threads", L.threads) + hop("fb", L.facebook) + hop("x", L.x) + hop("whatnot", L.whatnot) + hop("tcgplayer", L.tcgplayer) + "/links  /links/  301\n/shop/ebay  /shop/  301\n");
  return pages;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pages = build();
  console.log(`built ${pages.length} pages -> dist/  (HQ at ${config.hqPath})`);
}
