#!/usr/bin/env node
// Generate muted looping preview clips for the "Fresh off the rip" video cards.
// Reads video IDs from src/data/videos.json, downloads a short segment of each
// via yt-dlp, and compresses to small web MP4s in src/assets/video/previews/.
// Re-run whenever videos.json changes (after scripts/sync-youtube.mjs).
//
// Requires: yt-dlp, ffmpeg on PATH.
// Usage: node scripts/sync-video-previews.mjs [--limit N] [--seconds S]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")).map(([k, v]) => [k, v ?? true])
);
const LIMIT = parseInt(args.limit ?? "6", 10);
const SECONDS = parseInt(args.seconds ?? "12", 10);
const START = args.start ?? "00:00:05";
const OUTDIR = path.join(ROOT, "src/assets/video/previews");

const run = (cmd, a, opts = {}) => execFileSync(cmd, a, { stdio: "inherit", ...opts });
const quiet = (cmd, a) => { try { execFileSync(cmd, a, { stdio: "pipe" }); return true; } catch { return false; } };

// dependency check
for (const bin of ["yt-dlp", "ffmpeg"]) {
  if (!quiet(bin, ["--version"])) {
    console.error(`Missing required binary: ${bin}`);
    process.exit(1);
  }
}

const videos = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/videos.json"), "utf8"));
const ids = videos.slice(0, LIMIT).map((v) => v.id);
fs.mkdirSync(OUTDIR, { recursive: true });

const end = new Date(new Date(`1970-01-01T${START}Z`).getTime() + SECONDS * 1000)
  .toISOString().slice(11, 19);
const section = `*${START}-${end}`;

for (const id of ids) {
  const out = path.join(OUTDIR, `${id}.mp4`);
  if (fs.existsSync(out)) {
    console.log(`skip ${id} (exists, delete to regenerate)`);
    continue;
  }
  console.log(`\n=== ${id} ===`);
  const tmp = path.join(OUTDIR, `${id}.tmp.mp4`);
  try {
    run("yt-dlp", [
      "--no-playlist",
      "--extractor-args", "youtube:player_client=android",
      "-f", "b[height<=480]/b",
      "--download-sections", section,
      "--force-keyframes-at-cuts",
      "-o", tmp,
      `https://www.youtube.com/watch?v=${id}`,
    ]);
    // compress: 480p, quiet audio stripped (muted anyway), faststart for streaming
    run("ffmpeg", [
      "-y", "-v", "error", "-i", tmp,
      "-vf", "scale=480:-2",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "28",
      "-an", "-movflags", "+faststart",
      out,
    ]);
    fs.unlinkSync(tmp);
    const kb = Math.round(fs.statSync(out).size / 1024);
    console.log(`wrote ${out} (${kb} KB)`);
  } catch (e) {
    console.error(`FAILED ${id}: ${e.message}`);
    for (const f of [tmp, out]) if (fs.existsSync(f)) fs.unlinkSync(f);
  }
}
console.log("\ndone.");
