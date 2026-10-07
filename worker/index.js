// Scheduled Worker: asks Cloudflare Pages to rebuild the site every 6 hours.
// The build itself pulls fresh YouTube / eBay / Google Sheet data (see docs/AUTOMATION.md).
export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(rebuild(env));
  },
  async fetch() {
    return new Response("off-the-rip-refresh: scheduled worker, nothing to see here.", { status: 404 });
  },
};

export async function rebuild(env, fetchImpl = fetch) {
  if (!env.DEPLOY_HOOK_URL) { console.error("DEPLOY_HOOK_URL secret is not set"); return false; }
  const res = await fetchImpl(env.DEPLOY_HOOK_URL, { method: "POST" });
  if (!res.ok) console.error("deploy hook failed:", res.status);
  return res.ok;
}
