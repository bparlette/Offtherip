import test from "node:test";
import assert from "node:assert/strict";
import { parseLead, handle, deliver } from "../functions/api/_lib.js";

const req = (body, headers = {}) => new Request("https://x.test/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
const good = { email: "Fan@Example.com ", consent: true, interests: ["pokemon", "sports"], source: "/", elapsedMs: 5000 };
const okFetch = async () => ({ ok: true });

test("parseLead normalises and validates", () => {
  const { lead } = parseLead(good, "subscribe");
  assert.equal(lead.email, "fan@example.com");
  assert.deepEqual(lead.interests, ["pokemon", "sports"]);
  assert.match(parseLead({ ...good, email: "nope" }, "subscribe").error, /valid email/);
  assert.match(parseLead({ ...good, consent: false }, "subscribe").error, /tick the box/);
  assert.match(parseLead(good, "wantlist").error, /hunting/);
  assert.equal(parseLead({ ...good, want: "Josh Allen rookie", budget: "$100–$500" }, "wantlist").lead.want, "Josh Allen rookie");
});

test("parseLead strips control characters and caps lengths", () => {
  const { lead } = parseLead({ ...good, name: "Sam\n\u0000<script>".padEnd(300, "x") }, "subscribe");
  assert.ok(lead.name.length <= 60 && !/[\u0000-\u001f]/.test(lead.name));
});

test("honeypot and too-fast submissions are silently accepted but never delivered", async () => {
  let calls = 0; const f = async () => { calls++; return { ok: true }; };
  for (const bad of [{ ...good, website: "http://spam" }, { ...good, elapsedMs: 100 }]) {
    const r = await handle(req(bad), { KIT_API_KEY: "k", KIT_FORM_ID: "1" }, "subscribe", f);
    assert.equal(r.status, 200);
  }
  assert.equal(calls, 0);
});

test("no configured sink = loud failure, not fake success", async () => {
  const r = await handle(req(good), {}, "subscribe", okFetch);
  assert.equal(r.status, 503);
  const dev = await handle(req(good), { ALLOW_NO_SINK: "1" }, "subscribe", okFetch);
  assert.equal(dev.status, 200);
});

test("Kit sink: subscriber then form, with the API key header", async () => {
  const calls = [];
  const f = async (url, init) => { calls.push({ url, init }); return { ok: true }; };
  const r = await handle(req(good), { KIT_API_KEY: "KEY", KIT_FORM_ID: "99" }, "subscribe", f);
  assert.equal(r.status, 200);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /api\.kit\.com\/v4\/subscribers$/);
  assert.match(calls[1].url, /\/v4\/forms\/99\/subscribers$/);
  assert.equal(calls[0].init.headers["X-Kit-Api-Key"], "KEY");
  assert.equal(JSON.parse(calls[0].init.body).email_address, "fan@example.com");
});

test("one failing sink is fine if another succeeds; all failing returns 503", async () => {
  const f = async (url) => (url.includes("kit") ? { ok: false } : { ok: true });
  assert.equal((await handle(req(good), { KIT_API_KEY: "k", KIT_FORM_ID: "1", FORM_WEBHOOK_URL: "https://hook.test/x" }, "subscribe", f)).status, 200);
  assert.equal((await handle(req(good), { KIT_API_KEY: "k", KIT_FORM_ID: "1" }, "subscribe", async () => ({ ok: false }))).status, 503);
  const throwing = async () => { throw new Error("network"); };
  assert.equal((await handle(req(good), { FORM_WEBHOOK_URL: "https://hook.test/x" }, "subscribe", throwing)).status, 503);
});

test("KV backup sink stores the lead", async () => {
  const store = new Map();
  const env = { LEADS: { put: async (k, v) => store.set(k, v) } };
  const res = await deliver(parseLead(good, "subscribe").lead, env, okFetch);
  assert.ok(res[0].ok && store.size === 1);
});

test("origin check rejects foreign sites, allows own site and no-origin", async () => {
  const env = { SITE_URL: "https://offtheripcollectables.com", ALLOW_NO_SINK: "1" };
  assert.equal((await handle(req(good, { Origin: "https://evil.example" }), env, "subscribe", okFetch)).status, 403);
  assert.equal((await handle(req(good, { Origin: "https://offtheripcollectables.com" }), env, "subscribe", okFetch)).status, 200);
  assert.equal((await handle(req(good), env, "subscribe", okFetch)).status, 200);
});

test("malformed JSON is a 400", async () => {
  const r = await handle(new Request("https://x.test/api/subscribe", { method: "POST", body: "{nope" }), {}, "subscribe", okFetch);
  assert.equal(r.status, 400);
});

test("Turnstile is enforced only when a secret is configured", async () => {
  const env = { ALLOW_NO_SINK: "1", TURNSTILE_SECRET: "s" };
  assert.equal((await handle(req(good), env, "subscribe", okFetch)).status, 400);
});
