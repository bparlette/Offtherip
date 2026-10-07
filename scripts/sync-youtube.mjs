#!/usr/bin/env node
// Refresh src/data/videos.json from YouTube's public RSS feed (no API key) and add stub rows to
// src/data/verdicts.json for any new "Daily Pack Verdict Day N" video. Safe to run repeatedly.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const rd = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const GAMES = ["Union Arena", "Digimon", "One Piece", "Pokémon", "Pokemon", "Dragon Ball Super", "Dragon Ball", "Magic", "Yu-Gi-Oh", "Lorcana", "Flesh and Blood", "Riftbound", "Weiss Schwarz"];
const unesc = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");

export function parseFeed(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    id: e.match(/<yt:videoId>(.*?)<\/yt:videoId>/)[1],
    title: unesc(e.match(/<title>(.*?)<\/title>/)[1]),
    published: e.match(/<published>(.*?)<\/published>/)[1].slice(0, 10),
    views: +(e.match(/<media:statistics views="(\d+)"/) || [0, 0])[1],
  }));
}

/** "Daily Pack Verdict Day 22 | Union Arena Jujutsu Kaisen | SIX Losses..." -> {day, game, product} (or null) */
export function parseVerdictTitle(title) {
  const m = title.match(/Daily Pack Verdict\s+Day\s+(\d+)/i);
  if (!m) return null;
  const segs = title.replace(/#\w+/g, "").split("|").map((s) => s.trim()).filter(Boolean)
    .filter((s) => !/Daily Pack Verdict/i.test(s) && !/\b(loss|losses|profit|win|wins|value)\b/i.test(s) && !/[\u{1F300}-\u{1FAFF}]/u.test(s));
  const name = (segs[0] || "").replace(/\s*Pack Opening\s*$/i, "").trim();
  const game = GAMES.find((g) => name.toLowerCase().startsWith(g.toLowerCase())) || "";
  return { day: +m[1], game: game || "TCG", product: (game ? name.slice(game.length) : name).trim() || name };
}

export function mergeVerdicts(verdicts, videos) {
  const have = new Set(verdicts.entries.map((e) => e.day));
  let added = 0;
  for (const v of [...videos].sort((a, b) => a.published.localeCompare(b.published))) {
    const p = parseVerdictTitle(v.title);
    if (!p || have.has(p.day)) continue;
    verdicts.entries.push({ day: p.day, date: v.published, game: p.game, product: p.product, videoId: v.id, result: null, resultSource: "needs-input", cost: null, value: null });
    have.add(p.day); added++;
  }
  verdicts.entries.sort((a, b) => a.day - b.day);
  return added;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cfg = rd("site.config.json");
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${cfg.youtube.channelId}`, { headers: { "User-Agent": "off-the-rip-site/1.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const videos = parseFeed(await res.text());
    if (!videos.length) throw new Error("feed had no entries");
    const today = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(path.join(ROOT, "src/data/videos.json"), JSON.stringify({ source: "youtube-rss", updated: today, videos }, null, 1) + "\n");
    const verdicts = rd("src/data/verdicts.json");
    const added = mergeVerdicts(verdicts, videos);
    if (added) { verdicts.updated = today; fs.writeFileSync(path.join(ROOT, "src/data/verdicts.json"), JSON.stringify(verdicts, null, 1) + "\n"); }
    console.log(`youtube: ${videos.length} videos; ${added} new Daily Pack Verdict day(s) need cost/value (see templates/verdicts.csv)`);
  } catch (e) { console.error("youtube sync skipped:", e.message); process.exitCode = 0; }
}
