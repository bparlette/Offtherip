// Shared helpers for the form endpoints (Cloudflare Pages Functions). No dependencies.
export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
export const clean = (v, max = 200) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);

/** Only accept posts from our own site (or localhost during dev). */
export function originOk(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return true; // curl / server-side tests; the honeypot + sinks still apply
  const allowed = [env.SITE_URL, "http://localhost:8788", "http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:8787"].filter(Boolean);
  return allowed.some((a) => origin === a || (env.ALLOW_PAGES_DEV && /^https:\/\/[a-z0-9-]+\.pages\.dev$/.test(origin)));
}

export async function verifyTurnstile(token, env, ip) {
  if (!env.TURNSTILE_SECRET) return true; // not enabled
  if (!token) return false;
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip || "" }),
  });
  return !!(await r.json()).success;
}

/** Normalise + validate a lead. Returns {error} or {lead}. */
export function parseLead(body, type) {
  if (!body || typeof body !== "object") return { error: "Bad request." };
  if (body.website) return { silent: true }; // honeypot: pretend success, store nothing
  if (typeof body.elapsedMs === "number" && body.elapsedMs < 1200) return { silent: true };
  const email = clean(body.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Please enter a valid email address." };
  if (body.consent !== true) return { error: "Please tick the box so we can email you." };
  const lead = {
    type, email, name: clean(body.name, 60),
    interests: (Array.isArray(body.interests) ? body.interests : []).map((x) => clean(x, 30)).filter(Boolean).slice(0, 6),
    source: clean(body.source, 80), utm_source: clean(body.utm_source, 80), utm_medium: clean(body.utm_medium, 80),
    utm_campaign: clean(body.utm_campaign, 80), src: clean(body.src, 80), ts: new Date().toISOString(),
  };
  if (type === "wantlist") {
    lead.want = clean(body.want, 800); lead.budget = clean(body.budget, 40); lead.grade = clean(body.grade, 12);
    if (lead.want.length < 3) return { error: "Tell us what you're hunting (a few words is fine)." };
  }
  return { lead };
}

/**
 * Deliver a lead to every configured sink. Succeeds if at least one sink accepts it.
 *   KIT_API_KEY + KIT_FORM_ID   Kit (ConvertKit) v4: subscriber + form
 *   FORM_WEBHOOK_URL            any webhook (Zapier / Make / Google Apps Script -> Sheet)
 *   LEADS (KV namespace)        raw backup copy in Cloudflare KV
 *   ALLOW_NO_SINK=1             dev only: accept and log without storing
 */
export async function deliver(lead, env, fetchImpl = fetch) {
  const results = [];
  if (env.KIT_API_KEY && env.KIT_FORM_ID) {
    try {
      const h = { "Content-Type": "application/json", "X-Kit-Api-Key": env.KIT_API_KEY };
      const fields = { source: lead.source, interests: lead.interests.join(","), utm_source: lead.utm_source, utm_medium: lead.utm_medium, utm_campaign: lead.utm_campaign, want: lead.want || "", budget: lead.budget || "", grade: lead.grade || "" };
      const a = await fetchImpl("https://api.kit.com/v4/subscribers", { method: "POST", headers: h, body: JSON.stringify({ email_address: lead.email, first_name: lead.name || undefined, fields }) });
      const b = await fetchImpl(`https://api.kit.com/v4/forms/${encodeURIComponent(env.KIT_FORM_ID)}/subscribers`, { method: "POST", headers: h, body: JSON.stringify({ email_address: lead.email }) });
      results.push({ sink: "kit", ok: a.ok && b.ok });
    } catch { results.push({ sink: "kit", ok: false }); }
  }
  if (env.FORM_WEBHOOK_URL) {
    try { const r = await fetchImpl(env.FORM_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) }); results.push({ sink: "webhook", ok: r.ok }); }
    catch { results.push({ sink: "webhook", ok: false }); }
  }
  if (env.LEADS) {
    try { await env.LEADS.put(`lead:${lead.ts}:${lead.type}:${lead.email}`, JSON.stringify(lead)); results.push({ sink: "kv", ok: true }); }
    catch { results.push({ sink: "kv", ok: false }); }
  }
  if (!results.length && env.ALLOW_NO_SINK) { console.log("lead (no sink configured):", JSON.stringify(lead)); results.push({ sink: "log", ok: true }); }
  return results;
}

export async function handle(request, env, type, fetchImpl = fetch) {
  if (!originOk(request, env)) return json({ error: "Not allowed." }, 403);
  let body; try { body = await request.json(); } catch { return json({ error: "Bad request." }, 400); }
  const ip = request.headers.get("CF-Connecting-IP") || "";
  if (!(await verifyTurnstile(body && body["cf-turnstile-response"], env, ip))) return json({ error: "Please complete the verification and try again." }, 400);
  const parsed = parseLead(body, type);
  if (parsed.silent) return json({ ok: true });
  if (parsed.error) return json({ error: parsed.error }, 400);
  const results = await deliver(parsed.lead, env, fetchImpl);
  if (!results.some((r) => r.ok)) {
    console.error("form: no sink accepted the lead", JSON.stringify(results.map((r) => r.sink + ":" + r.ok)));
    return json({ error: "We couldn't save that just now. Please try again in a minute, or email us directly." }, 503);
  }
  return json({ ok: true });
}
