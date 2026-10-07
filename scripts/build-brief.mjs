// Generates the single-file markdown handoff brief (served at <hqPath>/brief.md) from src/hq/*.
import fs from "node:fs";
import path from "node:path";

const rd = (root, f) => fs.readFileSync(path.join(root, "src/hq", f), "utf8");
const OWNER = { human: "HUMAN", ai: "AI", either: "AI or human (human enters secrets/payment)" };

export function buildBrief({ config, root }) {
  const rules = rd(root, "rules.md").trim();
  const facts = JSON.parse(rd(root, "facts.json"));
  const { phases, tasks, asOf } = JSON.parse(rd(root, "tasks.json"));
  const play = JSON.parse(rd(root, "playbook.json"));
  const kit = JSON.parse(rd(root, "copykit.json"));
  const done = tasks.filter((t) => t.status === "done").length;
  const out = [];
  out.push(`# ${config.brand.name}: AI handoff brief`, "", `Generated from \`src/hq/*\` at build time. Task data as of ${asOf}; facts as of ${facts.asOf}. Progress: ${done}/${tasks.length} tasks done.`, "",
    `**Goal:** a fast brand-hub website for ${config.brand.name} (sports cards, TCG, pack openings; eBay seller + YouTube channel) that sends buyers to eBay, builds an owned email list, and brings customers back. The site is built (this repo). What remains is mostly accounts, domains, data and growth work, listed below with exact steps.`, "",
    `**How to use this brief:** read Rules, then pick tasks whose \`depends_on\` are done. Do the steps. Stop at every \`needs_human\` item. Update the task in \`src/hq/tasks.json\` (status + notes) when done or blocked.`, "",
    "## 0. Rules (read first)", "", rules, "",
    "## 1. Project snapshot (facts)", "", `Brand: **${facts.business.name}**. Owner: ${facts.business.owner}. ${facts.business.what_it_sells}`, "", "### Accounts", "");
  for (const a of facts.accounts) out.push(`- **${a.platform}** [${a.status}] ${a.handle ? a.handle + " " : ""}${a.url ? "<" + a.url + "> " : ""}${a.metrics ? "· " + a.metrics + " " : ""}${a.notes ? "· " + a.notes : ""}`);
  out.push("", "### Domains", "");
  for (const d of facts.domains) out.push(`- \`${d.domain}\` [${d.status}] checked ${d.checked}. ${d.action}`);
  out.push("", "### Similar names to avoid confusion with", "", ...facts.similar_names.map((s) => `- ${s}`), "", "### Open questions for Clayton", "", ...facts.questions_for_clayton.map((q) => `- ${q}`), "");
  out.push("## 2. Repo map and commands", "", "```", "npm run dev            build + serve http://localhost:8080 (forms log leads, nothing stored)", "npm run build          src/ -> dist/", "npm test               build checks, data checks, form-function tests", "npm run sync:youtube   refresh videos.json + add Verdict stubs (no key needed)", "npm run sync:ebay      refresh listings.json (needs EBAY_APP_ID / EBAY_CERT_ID)", "npm run import:verdicts -- file.csv   merge cost/value numbers", "npm run deploy         build + wrangler pages deploy (after `wrangler login`)", "```", "",
    "- `site.config.json`: brand, links (null = hidden), stats with as-of date, feature flags, analytics, promo bar, hqPath.", "- `src/pages/*.html`: pages; `src/partials/*`: shared head/header/footer/signup; `scripts/render-slots.mjs`: build-time lists.", "- `src/data/*.json`: videos, verdicts, listings. `functions/api/*`: form endpoints (Cloudflare Pages Functions). `emails/`: welcome drafts. `src/hq/*`: this brief's source.", "- Never hand-edit `dist/`. Promo bar: set `promo.enabled`, `text`, `url`, `endsIso` in `site.config.json`.", "");
  out.push("## 3. Tasks", "");
  for (const ph of phases) {
    out.push(`### ${ph.id}: ${ph.title}`, "", `_${ph.blurb}_`, "");
    for (const t of tasks.filter((x) => x.phase === ph.id)) {
      out.push(`#### ${t.id} [${t.status.toUpperCase()}] ${t.title}`, `Owner: ${OWNER[t.owner]} · ~${t.minutes} min · priority ${t.priority}${t.depends_on.length ? " · depends on " + t.depends_on.join(", ") : ""}`, "", `Why: ${t.why}`, "", "Steps:", ...t.steps.map((s, i) => `${i + 1}. ${s}`), "", "Done when:", ...t.acceptance.map((s) => `- ${s}`));
      if (t.needs_human.length) out.push("", "Needs a human for:", ...t.needs_human.map((s) => `- ${s}`));
      if (t.verify) out.push("", `Verify first: ${t.verify}`);
      if (t.links.length) out.push("", "Links: " + t.links.map((l) => `[${l.label}](${l.url})`).join(", "));
      if (t.notes) out.push("", `Notes: ${t.notes}`);
      out.push("");
    }
  }
  out.push("## 4. Playbook (recommendations)", "", play.intro, "");
  for (const s of play.sections) out.push(`### ${s.title}`, "", ...s.bullets.map((b) => `- ${b}`), "");
  out.push("## 5. Copy kit (drafts for Clayton's approval)", "", kit.note, "");
  for (const b of kit.bios) out.push(`**${b.platform}**`, "```", b.text, "```", "");
  out.push("**YouTube description template**", "```", kit.youtube_description_template, "```", "", "**Pinned comment**", "```", kit.pinned_comment_template, "```", "", "**Short captions**", ...kit.short_caption_templates.map((c) => `- ${c}`), "", "**Hashtags**", ...Object.entries(kit.hashtags).map(([k, v]) => `- ${k}: ${v}`), "", "**Order insert**", "```", kit.order_insert_text, "```", "", "**Want List match email**", "```", kit.want_list_match_email, "```", "", "**Giveaway disclosure**", "```", kit.giveaway_disclosure, "```", "");
  return out.join("\n");
}
