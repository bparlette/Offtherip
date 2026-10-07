#!/usr/bin/env node
// Merge Clayton's Daily Pack Verdict numbers into src/data/verdicts.json.
//   node scripts/import-verdicts-csv.mjs path/to/verdicts.csv      (template: templates/verdicts.csv)
// Columns: day,date,game,product,videoId,cost,value,result   (result optional: derived from cost/value)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export function parseCsv(text) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some((x) => x.trim())) rows.push(row); row = []; }
    else cur += c;
  }
  row.push(cur); if (row.some((x) => x.trim())) rows.push(row);
  const [head, ...body] = rows; const keys = head.map((h) => h.trim());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}
const num = (s) => { const n = parseFloat(String(s).replace(/[$,]/g, "")); return Number.isFinite(n) ? n : null; };

export function applyRows(verdicts, rows) {
  let changed = 0;
  for (const r of rows) {
    const day = parseInt(r.day, 10); if (!day) continue;
    let e = verdicts.entries.find((x) => x.day === day);
    if (!e) { e = { day, date: r.date, game: r.game, product: r.product, videoId: r.videoId, result: null, resultSource: "csv", cost: null, value: null }; verdicts.entries.push(e); }
    for (const k of ["date", "game", "product", "videoId"]) if (r[k]) e[k] = r[k];
    const cost = num(r.cost), value = num(r.value);
    if (cost !== null) e.cost = cost;
    if (value !== null) e.value = value;
    const res = (r.result || "").toLowerCase();
    if (["loss", "profit", "even"].includes(res)) { e.result = res; e.resultSource = "csv"; }
    else if (e.cost !== null && e.value !== null) { e.result = e.value > e.cost ? "profit" : e.value < e.cost ? "loss" : "even"; e.resultSource = "cost-vs-value"; }
    changed++;
  }
  verdicts.entries.sort((a, b) => a.day - b.day);
  return changed;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) { console.error("usage: node scripts/import-verdicts-csv.mjs verdicts.csv"); process.exit(1); }
  const p = path.join(ROOT, "src/data/verdicts.json");
  const v = JSON.parse(fs.readFileSync(p, "utf8"));
  const n = applyRows(v, parseCsv(fs.readFileSync(file, "utf8")));
  v.updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(p, JSON.stringify(v, null, 1) + "\n");
  console.log(`verdicts: ${n} row(s) merged`);
}
