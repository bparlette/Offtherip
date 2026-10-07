import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, config } from "../build.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const pages = build();
const htmlFiles = (dir = DIST) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? htmlFiles(path.join(dir, d.name)) : d.name.endsWith(".html") ? [path.join(dir, d.name)] : []));
const rd = (rel) => fs.readFileSync(path.join(DIST, rel), "utf8");

test("every page builds with no leftover template syntax", () => {
  for (const f of htmlFiles()) assert.ok(!/\{\{|\}\}/.test(fs.readFileSync(f, "utf8")), `unresolved template in ${path.relative(DIST, f)}`);
});

test("expected pages exist", () => {
  for (const r of ["index.html", "shop/index.html", "verdict/index.html", "watch/index.html", "want-list/index.html", "giveaways/index.html", "about/index.html", "links/index.html", "thanks/index.html", "privacy/index.html", "terms/index.html", "404.html", config.hqPath.slice(1) + "index.html"])
    assert.ok(fs.existsSync(path.join(DIST, r)), r);
});

test("all internal links, scripts, styles and images resolve to files", () => {
  const bad = [];
  for (const f of htmlFiles()) {
    const html = fs.readFileSync(f, "utf8");
    for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|tel:|#|data:)/.test(url)) continue;
      const clean = url.split("#")[0].split("?")[0];
      if (!clean) continue;
      let target = clean.startsWith("/") ? path.join(DIST, clean) : path.join(path.dirname(f), clean);
      if (clean.endsWith("/")) target = path.join(target, "index.html");
      if (!fs.existsSync(target)) bad.push(`${path.relative(DIST, f)} -> ${url}`);
    }
  }
  assert.deepEqual(bad, []);
});

test("every page has title, description, canonical and exactly one h1 (except link hub)", () => {
  for (const f of htmlFiles()) {
    const h = fs.readFileSync(f, "utf8"), n = path.relative(DIST, f);
    assert.match(h, /<title>[^<]{5,}<\/title>/, n);
    assert.match(h, /<meta name="description" content="[^"]{20,}/, n);
    assert.match(h, /<link rel="canonical" href="https:\/\//, n);
    assert.equal((h.match(/<h1[ >]/g) || []).length, 1, `${n}: h1 count`);
  }
});

test("HQ page is noindex, absent from sitemap and robots, and not linked from the public site", () => {
  const hq = rd(config.hqPath.slice(1) + "index.html");
  assert.match(hq, /<meta name="robots" content="noindex,nofollow,noarchive">/);
  assert.ok(!rd("sitemap.xml").includes(config.hqPath));
  assert.ok(!rd("robots.txt").includes(config.hqPath.replace(/\/$/, "")));
  for (const f of htmlFiles().filter((x) => !x.includes(config.hqPath.slice(1)))) assert.ok(!fs.readFileSync(f, "utf8").includes(config.hqPath), `HQ linked from ${path.relative(DIST, f)}`);
  assert.match(rd("_headers"), new RegExp(`${config.hqPath.replace(/\//g, "\\/")}\\*\\n  X-Robots-Tag: noindex`));
  for (const f of ["brief.md", "tasks.json", "facts.json", "playbook.json", "copykit.json", "rules.md", "hq.js", "hq.css", "site-meta.json"]) assert.ok(fs.existsSync(path.join(DIST, config.hqPath.slice(1), f)), f);
});

test("noindex pages (links, thanks, 404) stay out of the sitemap; indexable pages are in it", () => {
  const sm = rd("sitemap.xml");
  for (const r of ["/links/", "/thanks/", "/404.html"]) assert.ok(!sm.includes(`${config.siteUrl}${r}<`), r);
  for (const r of ["/", "/shop/", "/verdict/", "/watch/", "/want-list/", "/giveaways/", "/about/", "/privacy/", "/terms/"]) assert.ok(sm.includes(`<loc>${config.siteUrl}${r}</loc>`), r);
});

test("null links are hidden, set links appear in the footer and structured data", () => {
  const home = rd("index.html");
  for (const [k, v] of Object.entries(config.links)) if (v) assert.ok(home.includes(v.replace(/&/g, "&amp;")), `${k} missing from home`);
  assert.ok(!/href="null"|href=""/.test(home));
  assert.match(home, /application\/ld\+json/);
});

test("signup forms are accessible and protected", () => {
  const home = rd("index.html");
  assert.match(home, /data-form="subscribe"/);
  assert.match(home, /name="website"[^>]*tabindex="-1"/);          // honeypot
  assert.match(home, /name="consent"[^>]*required/);               // explicit consent
  assert.match(home, /<label class="sr" for="email-home">/);
  assert.match(rd("want-list/index.html"), /data-form="wantlist"/);
});

test("copyright disclaimer present in every footer", () => {
  for (const f of htmlFiles().filter((x) => !x.includes("links") && !x.includes(config.hqPath.slice(1)))) assert.match(fs.readFileSync(f, "utf8"), /not affiliated with, endorsed by, or sponsored by/, path.relative(DIST, f));
});

test("shop page is honest when there is no live inventory", () => {
  const shop = rd("shop/index.html");
  assert.match(shop, /grid--empty/);
  assert.ok(!/\$\d/.test(shop.split('id="grid"')[1] || ""), "no prices should appear without live data");
});

test("each Verdict day gets its own indexable page, linked from the sitemap", () => {
  const days = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/verdicts.json"), "utf8")).entries;
  for (const e of days) {
    const h = rd(`verdict/day-${e.day}/index.html`);
    assert.match(h, /worth it\?/i);
    assert.match(h, new RegExp(e.videoId));
    assert.ok(rd("sitemap.xml").includes(`/verdict/day-${e.day}/`));
  }
});
