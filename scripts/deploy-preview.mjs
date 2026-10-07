#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const TARGET = path.join(ROOT, "..", "offtherip-gh-pages", "preview");
const PREFIX = "/Offtherip/preview";

console.log("1. Building fresh dist...");
execSync("node build.mjs", { cwd: ROOT, stdio: "inherit" });

console.log("2. Cleaning target preview directory...");
fs.rmSync(TARGET, { recursive: true, force: true });
fs.mkdirSync(TARGET, { recursive: true });

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const full = path.join(dir, d.name);
    return d.isDirectory() ? walk(full) : [full];
  });
}

console.log("3. Copying and rewriting files for preview...");
const files = walk(DIST);

for (const src of files) {
  const rel = path.relative(DIST, src);
  const dest = path.join(TARGET, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  if (rel.endsWith(".html")) {
    let content = fs.readFileSync(src, "utf8");
    // Add noindex if not already present
    if (!content.includes('content="noindex')) {
      content = content.replace("<head>", '<head><meta name="robots" content="noindex,nofollow">');
    }
    // Rewrite root-relative links, attributes and assets
    content = content.replace(/href="\/(?!\/)/g, `href="${PREFIX}/`);
    content = content.replace(/src="\/(?!\/)/g, `src="${PREFIX}/`);
    content = content.replace(/action="\/(?!\/)/g, `action="${PREFIX}/`);
    content = content.replace(/content="\/(assets\/[^"]+)"/g, `content="${PREFIX}/$1"`);
    content = content.replace(/value="(\/(?:watch|verdict|want-list|shop|about|giveaways|thanks|privacy|terms)?\/)"/g, `value="${PREFIX}$1"`);
    fs.writeFileSync(dest, content);
  } else if (rel.endsWith(".webmanifest") || rel.endsWith(".json")) {
    let content = fs.readFileSync(src, "utf8");
    if (rel.endsWith(".webmanifest")) {
      content = content.replace(/"\/(assets\/[^"]+)"/g, `"${PREFIX}/$1"`);
      content = content.replace(/"start_url": "\/"/, `"start_url": "${PREFIX}/"`);
    }
    fs.writeFileSync(dest, content);
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log(`4. Preview generated with ${files.length} files at ${TARGET}`);
