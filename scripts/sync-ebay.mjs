#!/usr/bin/env node
// Refresh src/data/listings.json from eBay's Browse API (official, free).
// Needs EBAY_APP_ID (Client ID) and EBAY_CERT_ID (Client Secret) from a PRODUCTION keyset at
// https://developer.ebay.com/my/keys. Without them this exits 0 and leaves the file alone,
// so CI keeps working. NOTE: written from the public API docs and NOT yet run against live
// credentials; verify the first run (see HQ task T21).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));
const QUERIES = ["pokemon", "one piece", "dragon ball", "basketball", "football", "baseball", "psa", "bgs", "card"];

export function categorize(title) {
  if (/\b(psa|bgs|sgc|cgc)\s*\d/i.test(title) || /\b(psa|bgs|sgc|cgc)\b/i.test(title)) return "graded";
  if (/pok[eé]mon|one piece|dragon ball|digimon|union arena|lorcana|yu-?gi-?oh|magic the gathering|\bmtg\b|tcg/i.test(title)) return "tcg";
  return "sports";
}

export function toItem(s) {
  return {
    id: s.itemId, title: s.title, category: categorize(s.title),
    price: s.price ? Number(s.price.value) : null, currency: s.price?.currency || "USD",
    image: s.image?.imageUrl || s.thumbnailImages?.[0]?.imageUrl || null, url: s.itemWebUrl,
    condition: s.condition || null, listedAt: s.itemCreationDate || null,
  };
}

async function token(id, secret) {
  const r = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64") },
    body: "grant_type=client_credentials&scope=" + encodeURIComponent("https://api.ebay.com/oauth/api_scope"),
  });
  if (!r.ok) throw new Error(`token HTTP ${r.status}`);
  return (await r.json()).access_token;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { EBAY_APP_ID, EBAY_CERT_ID } = process.env;
  if (!EBAY_APP_ID || !EBAY_CERT_ID) { console.log("ebay sync skipped: set EBAY_APP_ID and EBAY_CERT_ID (see HQ task T21)"); process.exit(0); }
  try {
    const t = await token(EBAY_APP_ID, EBAY_CERT_ID);
    const seen = new Map();
    for (const q of QUERIES) {
      const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(q)}&filter=${encodeURIComponent(`sellers:{${cfg.ebay.sellerName}}`)}&sort=newlyListed&limit=200`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${t}`, "X-EBAY-C-MARKETPLACE-ID": "EBAY_US" } });
      if (!r.ok) throw new Error(`search "${q}" HTTP ${r.status}`);
      for (const s of (await r.json()).itemSummaries || []) if (!seen.has(s.itemId)) seen.set(s.itemId, toItem(s));
    }
    const items = [...seen.values()].sort((a, b) => String(b.listedAt).localeCompare(String(a.listedAt))).slice(0, 120);
    fs.writeFileSync(path.join(ROOT, "src/data/listings.json"), JSON.stringify({ source: "ebay-api", updated: new Date().toISOString(), items }, null, 1) + "\n");
    console.log(`ebay: ${items.length} listings written`);
  } catch (e) { console.error("ebay sync failed (kept previous data):", e.message); }
}
