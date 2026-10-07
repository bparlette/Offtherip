import test from "node:test";
import assert from "node:assert/strict";
import { parseVerdictTitle, mergeVerdicts, parseFeed } from "../scripts/sync-youtube.mjs";
import { parseCsv, applyRows } from "../scripts/import-verdicts-csv.mjs";
import { categorize, toItem } from "../scripts/sync-ebay.mjs";
import { streakOf, cleanTitle, listingsGrid } from "../scripts/render-slots.mjs";

test("parseVerdictTitle handles the real title formats", () => {
  assert.deepEqual(parseVerdictTitle("Daily Pack Verdict Day 22 | Union Arena Jujutsu Kaisen | SIX Losses in a Row?! 😬💸#shorts"), { day: 22, game: "Union Arena", product: "Jujutsu Kaisen" });
  assert.deepEqual(parseVerdictTitle("Dragon Ball Super Prismatic Clash Pack Opening | 7 LOSSES IN A ROW?! 😱 | Daily Pack Verdict Day 23"), { day: 23, game: "Dragon Ball Super", product: "Prismatic Clash" });
  assert.deepEqual(parseVerdictTitle("Daily Pack Verdict Day 21 | Pokémon Pitch Black | The Losing Streak Continues?! 😬💸 #shorts"), { day: 21, game: "Pokémon", product: "Pitch Black" });
  assert.equal(parseVerdictTitle("LAMAR JACKSON INSERT! 2026 Topps Flagship"), null);
});

test("mergeVerdicts adds only new days, as TBD stubs", () => {
  const v = { entries: [{ day: 22, result: "loss" }] };
  const added = mergeVerdicts(v, [{ id: "AAAAAAAAAAA", title: "Daily Pack Verdict Day 22 | Pokémon X", published: "2026-10-05", views: 1 }, { id: "BBBBBBBBBBB", title: "Daily Pack Verdict Day 24 | Pokémon Mega Evolution | Finally?!", published: "2026-10-07", views: 1 }]);
  assert.equal(added, 1);
  assert.deepEqual(v.entries.map((e) => e.day), [22, 24]);
  assert.equal(v.entries[1].result, null);
});

test("parseFeed reads YouTube RSS entries", () => {
  const xml = `<feed><entry><yt:videoId>abc123DEF45</yt:videoId><title>Hi &amp; bye</title><published>2026-10-06T10:00:00+00:00</published><media:group><media:community><media:statistics views="12"/></media:community></media:group></entry></feed>`;
  assert.deepEqual(parseFeed(xml), [{ id: "abc123DEF45", title: "Hi & bye", published: "2026-10-06", views: 12 }]);
});

test("CSV import: quotes, derived results, and merging", () => {
  const rows = parseCsv('day,date,game,product,videoId,cost,value,result\n17,2026-09-30,Union Arena,"Rurouni, Kenshin",kGMpc6Qd2Ok,$12.50,$3.00,\n18,,,,,10,25,\n');
  assert.equal(rows[0].product, "Rurouni, Kenshin");
  const v = { entries: [{ day: 17, result: "loss", cost: null, value: null }] };
  assert.equal(applyRows(v, rows), 2);
  assert.equal(v.entries[0].cost, 12.5);
  assert.equal(v.entries[0].result, "loss");
  assert.equal(v.entries[1].result, "profit");
});

test("streakOf counts trailing identical results and stops at unknowns", () => {
  assert.deepEqual(streakOf([{ day: 1, result: "profit" }, { day: 2, result: "loss" }, { day: 3, result: "loss" }]).n, 2);
  assert.equal(streakOf([{ day: 1, result: "loss" }, { day: 2, result: null }]).n, 0);
  assert.equal(streakOf([]).n, 0);
});

test("eBay mapping: categories and item fields", () => {
  assert.equal(categorize("2024 Pokémon TWM Dipplin - PSA 9"), "graded");
  assert.equal(categorize("One Piece EB02-050 R"), "tcg");
  assert.equal(categorize("2026 Bowman Chrome Josh Allen Gold Refractor"), "sports");
  const it = toItem({ itemId: "v1|1|0", title: "X", price: { value: "74.99", currency: "USD" }, itemWebUrl: "https://www.ebay.com/itm/1", image: { imageUrl: "https://i.ebayimg.com/a.jpg" } });
  assert.equal(it.price, 74.99);
  assert.equal(it.image, "https://i.ebayimg.com/a.jpg");
});

test("cleanTitle strips hashtags; listings grid escapes HTML and hides sample data", () => {
  assert.equal(cleanTitle("Big hit 🔥 #shorts #nfl"), "Big hit 🔥");
  const cfg = { links: { ebay: "https://e.example" } };
  assert.match(listingsGrid({ source: "sample", items: [{ title: "x" }] }, cfg), /grid--empty/);
  const html = listingsGrid({ source: "ebay-api", items: [{ title: '<img src=x onerror=1>', price: 1, url: "https://www.ebay.com/itm/1", category: "tcg" }] }, cfg);
  assert.ok(!html.includes("<img src=x"));
});

import { giveawayVideos } from "../scripts/render-slots.mjs";
test("giveaway section lists only giveaway videos and vanishes when there are none", () => {
  const v = [{ id: "AAAAAAAAAAA", title: "WNBA PLAYOFFS + CAITLIN CLARK GIVEAWAY!", published: "2026-10-04", views: 1 }, { id: "BBBBBBBBBBB", title: "Daily Pack Verdict Day 1", published: "2026-10-04", views: 1 }];
  const html = giveawayVideos(v);
  assert.match(html, /AAAAAAAAAAA/); assert.ok(!html.includes("BBBBBBBBBBB"));
  assert.equal(giveawayVideos([v[1]]), "");
});
