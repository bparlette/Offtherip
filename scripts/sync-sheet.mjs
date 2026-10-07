#!/usr/bin/env node
// Merge Clayton's Daily Pack Verdict numbers from a published Google Sheet (CSV) into src/data/verdicts.json.
// Needs env VERDICTS_CSV_URL (File > Share > Publish to web > CSV). Without it, or on any failure, exits 0 and keeps existing data.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv, applyRows } from "./import-verdicts-csv.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function fetchSheetRows(url, fetchImpl = fetch) {
  const res = await fetchImpl(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (/^\s*</.test(text)) throw new Error("got HTML, not CSV: the sheet is probably not published to the web");
  const rows = parseCsv(text);
  if (!rows.length || !("day" in rows[0])) throw new Error("CSV has no 'day' column: header row must match templates/verdicts.csv");
  return rows;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const url = process.env.VERDICTS_CSV_URL;
  if (!url) { console.log("sheet sync skipped: VERDICTS_CSV_URL not set"); process.exit(0); }
  try {
    const rows = await fetchSheetRows(url);
    const p = path.join(ROOT, "src/data/verdicts.json");
    const v = JSON.parse(fs.readFileSync(p, "utf8"));
    const n = applyRows(v, rows);
    v.updated = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(p, JSON.stringify(v, null, 1) + "\n");
    console.log(`sheet: ${n} row(s) merged`);
  } catch (e) { console.error("sheet sync failed (kept previous data):", e.message); }
}
