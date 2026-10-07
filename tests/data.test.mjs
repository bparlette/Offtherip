import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

test("tasks: ids unique, dependencies exist, no cycles, enums valid", () => {
  const { phases, tasks } = J("src/hq/tasks.json");
  const ids = new Set(tasks.map((t) => t.id));
  assert.equal(ids.size, tasks.length, "duplicate task id");
  const ph = new Set(phases.map((p) => p.id));
  for (const t of tasks) {
    assert.ok(ph.has(t.phase), `${t.id} phase`);
    assert.ok(["human", "ai", "either"].includes(t.owner), `${t.id} owner`);
    assert.ok(["todo", "doing", "blocked", "done"].includes(t.status), `${t.id} status`);
    assert.ok(t.steps.length && t.acceptance.length, `${t.id} needs steps and acceptance`);
    assert.ok(t.minutes >= 0 && [1, 2, 3].includes(t.priority), `${t.id} numbers`);
    for (const d of t.depends_on) assert.ok(ids.has(d), `${t.id} depends on missing ${d}`);
  }
  const seen = new Map();
  const visit = (id, stack = []) => {
    if (seen.get(id) === 2) return;
    assert.ok(!stack.includes(id), `dependency cycle: ${[...stack, id].join(" -> ")}`);
    const t = tasks.find((x) => x.id === id);
    t.depends_on.forEach((d) => visit(d, [...stack, id]));
    seen.set(id, 2);
  };
  tasks.forEach((t) => visit(t.id));
});

test("tasks that need payment, 2FA or accounts name a human", () => {
  const { tasks } = J("src/hq/tasks.json");
  for (const t of tasks.filter((x) => /payment|CAPTCHA|login|2FA|OAuth|phone verification/i.test(x.needs_human.join(" ")))) assert.notEqual(t.owner, "ai", `${t.id} cannot be fully AI`);
  for (const t of tasks.filter((x) => x.owner === "ai" && x.status !== "done")) assert.equal(t.needs_human.length, 0, `${t.id} is AI-only but lists human needs`);
});

test("verdicts: days unique, results valid, numbers consistent", () => {
  const v = J("src/data/verdicts.json");
  const days = v.entries.map((e) => e.day);
  assert.equal(new Set(days).size, days.length);
  for (const e of v.entries) {
    assert.ok([null, "loss", "profit", "even"].includes(e.result), `day ${e.day}`);
    assert.match(e.videoId, /^[\w-]{11}$/);
    if (typeof e.cost === "number" && typeof e.value === "number" && e.resultSource === "cost-vs-value")
      assert.equal(e.result, e.value > e.cost ? "profit" : e.value < e.cost ? "loss" : "even");
  }
});

test("videos feed has well-formed entries", () => {
  const { videos } = J("src/data/videos.json");
  assert.ok(videos.length >= 5);
  for (const v of videos) { assert.match(v.id, /^[\w-]{11}$/); assert.match(v.published, /^\d{4}-\d{2}-\d{2}$/); assert.ok(v.title.length > 3); }
});

test("facts: statuses valid and every platform has a source note", () => {
  const f = J("src/hq/facts.json");
  const ok = ["confirmed", "exists", "none", "other", "unknown"];
  for (const a of f.accounts) assert.ok(ok.includes(a.status), a.platform);
  assert.ok(f.domains.every((d) => d.checked && d.action));
});

test("the generated brief mentions every task and the rules", async () => {
  const { buildBrief } = await import("../scripts/build-brief.mjs");
  const brief = buildBrief({ config: J("site.config.json"), root: ROOT });
  for (const t of J("src/hq/tasks.json").tasks) assert.ok(brief.includes(`#### ${t.id} `), t.id);
  assert.match(brief, /Do NOT cut the real domain over/);
  assert.ok(!/KIT_API_KEY\s*[=:]\s*\S{12,}/.test(brief), "no secret values in the brief");
});

test("no secrets or personal data committed", () => {
  const files = ["site.config.json", "wrangler.toml", ...fs.readdirSync(path.join(ROOT, "src/hq")).map((f) => "src/hq/" + f)];
  for (const f of files) {
    const s = fs.readFileSync(path.join(ROOT, f), "utf8");
    assert.ok(!/AKIA[0-9A-Z]{16}|sk_live_|xox[bp]-|-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(s), f);
    assert.ok(!/\b\d{3}[-.]\d{3}[-.]\d{4}\b/.test(s), `${f} contains a phone-like number`);
  }
});
