#!/usr/bin/env node
// Local preview server for dist/ with clean URLs, the 404 page, and the /api/* functions (leads are logged, not stored).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handle, json } from "../functions/api/_lib.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const PORT = +process.env.PORT || 8080;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain", ".md": "text/markdown; charset=utf-8", ".webmanifest": "application/manifest+json" };

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) {
      const type = url.pathname.slice(5);
      if (req.method !== "POST" || !["subscribe", "wantlist"].includes(type)) { const r = json({ error: "POST only." }, 405); res.writeHead(r.status, { "Content-Type": "application/json" }); return res.end(await r.text()); }
      const chunks = []; for await (const c of req) chunks.push(c);
      const r = await handle(new Request(url, { method: "POST", headers: req.headers, body: Buffer.concat(chunks) }), { ALLOW_NO_SINK: "1" }, type);
      res.writeHead(r.status, { "Content-Type": "application/json" }); return res.end(await r.text());
    }
    let p = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    let file = path.join(ROOT, p);
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404, { "Content-Type": TYPES[".html"] }); return res.end(fs.readFileSync(path.join(ROOT, "404.html"))); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" }); fs.createReadStream(file).pipe(res);
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) createServer().listen(PORT, () => console.log(`http://localhost:${PORT}  (Ctrl-C to stop)`));
