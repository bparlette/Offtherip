#!/usr/bin/env node
// Fetch all gallery image URLs for each listing in src/data/listings.json.
// Stores them as an `images` array (front, back, details) so cards can rotate
// through photos like a GIF.
//
// Two modes:
//   1. eBay Browse API (preferred): needs EBAY_APP_ID + EBAY_CERT_ID.
//      Uses getItem which returns all imageUrls.
//   2. Without credentials: prints the listing URLs so a browser agent can
//      grab galleries manually, then merge via --merge <json-file>.
//
// Usage:
//   node scripts/sync-listing-images.mjs                  # API mode
//   node scripts/sync-listing-images.mjs --merge galleries.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "src/data/listings.json");
const args = process.argv.slice(2);
const mergeIdx = args.indexOf("--merge");

function load() {
  const d = JSON.parse(fs.readFileSync(DATA, "utf8"));
  return Array.isArray(d) ? d : d.items;
}
function save(items) {
  const d = JSON.parse(fs.readFileSync(DATA, "utf8"));
  if (Array.isArray(d)) fs.writeFileSync(DATA, JSON.stringify(items, null, 2) + "\n");
  else { d.items = items; fs.writeFileSync(DATA, JSON.stringify(d, null, 2) + "\n"); }
}

// ---- merge mode: combine browser-grabbed galleries ----
if (mergeIdx !== -1) {
  const galleries = JSON.parse(fs.readFileSync(args[mergeIdx + 1], "utf8"));
  const items = load();
  let updated = 0;
  for (const it of items) {
    const g = galleries[String(it.id)];
    if (g && g.length) { it.images = g; updated++; }
  }
  save(items);
  console.log(`merged galleries for ${updated}/${items.length} listings`);
  process.exit(0);
}

// ---- API mode ----
const { EBAY_APP_ID, EBAY_CERT_ID } = process.env;
if (!EBAY_APP_ID || !EBAY_CERT_ID) {
  const items = load();
  console.log("ebay gallery sync skipped: set EBAY_APP_ID and EBAY_CERT_ID");
  console.log("Listing URLs needing gallery grabs:");
  for (const it of items) console.log(`  https://www.ebay.com/itm/${it.id}`);
  process.exit(0);
}

async function token() {
  const r = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString("base64"),
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });
  return (await r.json()).access_token;
}

const items = load();
const tok = await token();
let updated = 0;
for (const it of items) {
  try {
    const r = await fetch(
      `https://api.ebay.com/buy/browse/v1/item/get_item_by_legacy_id?legacy_item_id=${it.id}`,
      { headers: { Authorization: `Bearer ${tok}` } }
    );
    const j = await r.json();
    const urls = (j.imageUrls || []).map((u) =>
      u.replace(/s-l\d+\./, "s-l800.")
    );
    if (urls.length) { it.images = urls; updated++; }
    console.log(`${it.id}: ${urls.length} images`);
  } catch (e) {
    console.error(`${it.id}: FAILED ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 300)); // be nice to the API
}
save(items);
console.log(`\ndone: ${updated}/${items.length} listings have galleries`);
