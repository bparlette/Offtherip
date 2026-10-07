#!/usr/bin/env node
// Sync VERDICTS.md (Clayton's editable file) <-> src/data/verdicts.json
//
//   node scripts/sync-verdicts-md.mjs --from-md    # MD -> JSON (Clayton edited the file)
//   node scripts/sync-verdicts-md.mjs --to-md      # JSON -> MD (write auto-prices back for review)
//
// Rules:
//  - --from-md: blank cells stay blank in JSON (auto-lookup fills them later)
//  - --to-md: never overwrite a cell Clayton filled in; only fill blanks
//  - Hit format in MD: "Card Name ($12.34); Another Card ($5.00)" or "Card Name" (blank value)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const MD = path.join(ROOT, "VERDICTS.md");
const JSON_PATH = path.join(ROOT, "src/data/verdicts.json");

function parseMD() {
  const text = fs.readFileSync(MD, "utf8");
  const lines = text.split("\n");
  const rows = [];
  let inTable = false;
  for (const line of lines) {
    if (line.startsWith("| Day")) { inTable = true; continue; }
    if (inTable && line.startsWith("|---")) continue;
    if (inTable && line.startsWith("|")) {
      const cells = line.split("|").slice(1, -1).map(c => c.trim());
      if (cells.length >= 6) {
        rows.push({
          day: Number(cells[0]),
          date: cells[1] || null,
          product: cells[2] || null,
          result: cells[3] || null,
          cost: cells[4] ? Number(cells[4]) : null,
          hitsRaw: cells[5] || "",
        });
      }
    } else if (inTable && !line.startsWith("|") && line.trim()) {
      inTable = false;
    }
  }
  return rows;
}

function parseHits(hitsRaw) {
  if (!hitsRaw.trim()) return [];
  return hitsRaw.split(";").map(s => {
    s = s.trim();
    const m = s.match(/^(.+?)\s*\(\$([\d.]+)\)\s*$/);
    if (m) return { card: m[1].trim(), value: Number(m[2]) };
    return { card: s, value: null };
  }).filter(h => h.card);
}

function formatHits(hits) {
  return (hits || []).map(h =>
    h.value != null ? `${h.card} ($${h.value})` : h.card
  ).join("; ");
}

async function fromMD() {
  const rows = parseMD();
  const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));

  for (const row of rows) {
    let entry = data.entries.find(e => e.day === row.day);
    if (!entry) {
      entry = { day: row.day, entries: undefined };
      data.entries.push(entry);
      data.entries.sort((a, b) => a.day - b.day);
    }
    if (row.date) entry.date = row.date;
    if (row.product) {
      // Split "Game Product" — first two words as game, rest as product
      const parts = row.product.split(" ");
      // Try to be smart: check against known games
      const games = ["Pokemon", "Dragon Ball Super", "One Piece", "Magic", "Yu-Gi-Oh", "Lorcana"];
      let game = parts[0], product = parts.slice(1).join(" ");
      for (const g of games) {
        if (row.product.startsWith(g)) {
          game = g;
          product = row.product.slice(g.length).trim();
          break;
        }
      }
      entry.game = game;
      entry.product = product;
    }
    if (row.result) {
      entry.result = row.result;
      entry.resultSource = "manual";
    }
    if (row.cost != null) {
      entry.cost = row.cost;
      entry.costSource = "manual";
    }
    const hits = parseHits(row.hitsRaw);
    if (hits.length) {
      entry.hits = hits.map(h => ({
        card: h.card,
        ...(h.value != null ? { value: h.value, valueSource: "manual" } : {}),
      }));
    }
    // Recalculate net
    const totalValue = (entry.hits || []).reduce((s, h) => s + (h.value || 0), 0);
    if (entry.cost != null) {
      entry.net = Math.round((totalValue - entry.cost) * 100) / 100;
    }
  }

  data.updated = new Date().toISOString().split("T")[0];
  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + "\n");
  console.log(`Synced ${rows.length} day(s) from VERDICTS.md → verdicts.json`);
}

async function toMD() {
  const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  const rows = parseMD();
  const rowMap = new Map(rows.map(r => [r.day, r]));

  let text = fs.readFileSync(MD, "utf8");
  const lines = text.split("\n");
  const out = [];
  let inTable = false;

  for (const line of lines) {
    if (line.startsWith("| Day")) { inTable = true; out.push(line); continue; }
    if (inTable && line.startsWith("|---")) { out.push(line); continue; }
    if (inTable && line.startsWith("|")) {
      const cells = line.split("|").slice(1, -1).map(c => c.trim());
      const day = Number(cells[0]);
      const entry = data.entries.find(e => e.day === day);
      if (entry) {
        // Only fill blanks — never overwrite Clayton's values
        const cost = cells[4] || (entry.cost != null ? String(entry.cost) : "");
        const existingHits = parseHits(cells[5] || "");
        // Merge: keep Clayton's hit values, fill blanks from JSON
        const mergedHits = (entry.hits || []).map(h => {
          const existing = existingHits.find(eh => eh.card === h.card);
          if (existing?.value != null) return existing; // Clayton's value wins
          return h;
        });
        const hitsStr = cells[5] || formatHits(mergedHits);
        const product = cells[2] || (entry.game && entry.product ? `${entry.game} ${entry.product}`.trim() : "");
        const result = cells[3] || entry.result || "";
        const date = cells[1] || entry.date || "";

        out.push(`| ${day} | ${date} | ${product} | ${result} | ${cost} | ${hitsStr} |`);
      } else {
        out.push(line);
      }
    } else {
      if (inTable && line.trim() && !line.startsWith("<!--")) inTable = false;
      out.push(line);
    }
  }

  // Add any new days from JSON not in MD
  const mdDays = new Set(rows.map(r => r.day));
  const newEntries = data.entries.filter(e => !mdDays.has(e.day));
  if (newEntries.length) {
    // Insert before the <!-- comment
    const idx = out.findIndex(l => l.startsWith("<!--"));
    const newRows = newEntries.map(e =>
      `| ${e.day} | ${e.date || ""} | ${e.game && e.product ? `${e.game} ${e.product}`.trim() : ""} | ${e.result || ""} | ${e.cost != null ? e.cost : ""} | ${formatHits(e.hits)} |`
    );
    out.splice(idx, 0, ...newRows);
  }

  fs.writeFileSync(MD, out.join("\n"));
  console.log(`Synced verdicts.json → VERDICTS.md (blanks filled, Clayton's values preserved)`);
}

const mode = process.argv[2];
if (mode === "--from-md") fromMD();
else if (mode === "--to-md") toMD();
else {
  console.log("Usage: node scripts/sync-verdicts-md.mjs --from-md | --to-md");
  process.exit(1);
}
