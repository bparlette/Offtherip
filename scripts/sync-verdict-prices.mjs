#!/usr/bin/env node
// Automate Daily Pack Verdict pricing:
//  1. Pack cost  -> retail price from Target / Walmart / TCGPlayer
//                   (falls back to price-history sites if out of stock)
//  2. Hit values -> eBay sold listings (what the card actually sold for)
//
// Usage:
//   node sync-verdict-prices.mjs                    # update all days missing prices
//   node sync-verdict-prices.mjs --day 23           # update a single day
//   node sync-verdict-prices.mjs --dry-run         # show what it would do
//
// Needs: EBAY_APP_ID + EBAY_CERT_ID for eBay sold-listing lookup.
// Without them, eBay lookups are skipped and the file is left alone.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const VERDICTS = path.join(ROOT, "src/data/verdicts.json");
const DRY = process.argv.includes("--dry-run");
const DAY = (() => {
  const i = process.argv.indexOf("--day");
  return i > -1 ? Number(process.argv[i + 1]) : null;
})();

// ---------------------------------------------------------------------------
// Retail price lookup (pack cost)
// ---------------------------------------------------------------------------

// Target's public search API (no key needed for basic queries)
async function targetPrice(query) {
  try {
    const url = `https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2?key=9f36aeafbe60771d321a7cc95a78140772ab3e96&keyword=${encodeURIComponent(query)}&limit=5`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return null;
    const d = await r.json();
    const products = d?.data?.search?.products || [];
    for (const p of products) {
      const price = p?.price?.current_retail;
      const avail = p?.fulfillment?.is_out_of_stock_in_all_store_locations;
      if (price && !avail) return { price, source: "Target", url: p.item?.product_url };
    }
    return null;
  } catch { return null; }
}

// Walmart search API
async function walmartPrice(query) {
  try {
    const url = `https://www.walmart.com/search?q=${encodeURIComponent(query)}`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" } });
    if (!r.ok) return null;
    const html = await r.text();
    const m = html.match(/"price":([\d.]+),"priceString":"\$([\d.]+)"/);
    if (m) return { price: Number(m[1]), source: "Walmart", url };
    return null;
  } catch { return null; }
}

// TCGPlayer (best for TCG sealed product)
async function tcgplayerPrice(query) {
  try {
    const url = `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(query)}`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return null;
    const html = await r.text();
    // TCGPlayer embeds prices in JSON-LD or data attributes
    const m = html.match(/\$([\d,]+\.\d{2})/);
    if (m) return { price: Number(m[1].replace(",", "")), source: "TCGPlayer", url };
    return null;
  } catch { return null; }
}

// Price history fallback (camelcamelcamel for Amazon)
async function priceHistoryFallback(query) {
  try {
    const url = `https://camelcamelcamel.com/search?sq=${encodeURIComponent(query)}`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return null;
    const html = await r.text();
    const m = html.match(/\$([\d,]+\.\d{2})/);
    if (m) return { price: Number(m[1].replace(",", "")), source: "CamelCamelCamel (history)", url };
    return null;
  } catch { return null; }
}

async function findRetailPrice(productName) {
  // Try each source in order; return first hit
  const sources = [targetPrice, walmartPrice, tcgplayerPrice, priceHistoryFallback];
  for (const fn of sources) {
    const result = await fn(productName);
    if (result?.price) return result;
    // Brief pause between sources
    await new Promise(r => setTimeout(r, 500));
  }
  return null;
}

// ---------------------------------------------------------------------------
// eBay sold listings (hit card values)
// ---------------------------------------------------------------------------

let ebayToken = null;

async function getEbayToken() {
  const id = process.env.EBAY_APP_ID;
  const cert = process.env.EBAY_CERT_ID;
  if (!id || !cert || ebayToken) return ebayToken;
  const r = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(`${id}:${cert}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });
  if (!r.ok) return null;
  const d = await r.json();
  ebayToken = d.access_token;
  return ebayToken;
}

async function ebaySoldPrice(cardName) {
  const token = await getEbayToken();
  if (!token) return null;
  try {
    // Search sold/completed listings
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(cardName)}&filter=soldItems:true&limit=10&sort=price`;
    const r = await fetch(url, {
      headers: { "Authorization": `Bearer ${token}`, "X-EBAY-C-MARKETPLACE-ID": "EBAY_US" },
    });
    if (!r.ok) return null;
    const d = await r.json();
    const items = (d.itemSummaries || [])
      .map(i => Number(i.price?.value))
      .filter(p => p > 0)
      .sort((a, b) => a - b);
    if (!items.length) return null;
    // Use median sold price
    const mid = Math.floor(items.length / 2);
    const median = items.length % 2 ? items[mid] : (items[mid - 1] + items[mid]) / 2;
    return { price: Math.round(median * 100) / 100, source: "eBay sold", count: items.length };
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const verdicts = JSON.parse(fs.readFileSync(VERDICTS, "utf8"));
  let entries = verdicts.entries;
  if (DAY) entries = entries.filter(e => e.day === DAY);

  let updated = 0;

  for (const entry of entries) {
    const productQuery = `${entry.game} ${entry.product}`.trim();
    let changed = false;

    // 1. Pack cost from retail
    if (entry.cost == null) {
      console.log(`Day ${entry.day}: looking up retail price for "${productQuery}"...`);
      const retail = await findRetailPrice(productQuery);
      if (retail) {
        entry.cost = retail.price;
        entry.costSource = `${retail.source}${retail.url ? ` (${retail.url})` : ""}`;
        console.log(`  → $${retail.price} via ${retail.source}`);
        changed = true;
      } else {
        console.log(`  → no retail price found`);
      }
    }

    // 2. Hit values from eBay sold
    if (entry.hits?.length) {
      for (const hit of entry.hits) {
        if (hit.value == null && hit.card) {
          console.log(`Day ${entry.day}: looking up sold price for "${hit.card}"...`);
          const sold = await ebaySoldPrice(hit.card);
          if (sold) {
            hit.value = sold.price;
            hit.valueSource = `${sold.source} (median of ${sold.count})`;
            console.log(`  → $${sold.price} via eBay sold (${sold.count} sales)`);
            changed = true;
          } else {
            console.log(`  → no sold data found`);
          }
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }

    // Recalculate net if we have cost and values
    if (changed) {
      const totalValue = (entry.hits || []).reduce((s, h) => s + (h.value || 0), 0);
      if (entry.cost != null) {
        entry.net = Math.round((totalValue - entry.cost) * 100) / 100;
        // Auto-determine win/loss if not set
        if (!entry.result || entry.resultSource === "auto") {
          entry.result = entry.net > 0 ? "win" : "loss";
          entry.resultSource = "auto";
        }
      }
      updated++;
    }
  }

  if (updated > 0 && !DRY) {
    verdicts.updated = new Date().toISOString().split("T")[0];
    fs.writeFileSync(VERDICTS, JSON.stringify(verdicts, null, 2) + "\n");
    console.log(`\nUpdated ${updated} day(s) in ${VERDICTS}`);
  } else if (DRY) {
    console.log(`\n[dry run] Would update ${updated} day(s)`);
  } else {
    console.log("\nNo updates needed — all days have prices.");
  }
}

main().catch(e => { console.error(e); process.exit(1); });
