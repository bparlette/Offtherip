/* Backstage (HQ): renders tasks / playbook / facts / copy kit from the JSON files next to it.
   Checkmarks + notes you add here are saved in THIS browser only. tasks.json is the shared source of truth. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const KEY = "otr_hq_v1";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { status: {}, notes: {} }; } catch (_) { return { status: {}, notes: {} }; } };
  const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) {} };
  let local = load();
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`(.+?)`/g, "<code>$1</code>").replace(/_(.+?)_/g, "<em>$1</em>");
  const toast = (m) => { const t = document.createElement("div"); t.className = "toast"; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 1800); };
  const copy = async (text, msg = "Copied") => {
    try { await navigator.clipboard.writeText(text); } catch (_) { const a = document.createElement("textarea"); a.value = text; document.body.appendChild(a); a.select(); document.execCommand("copy"); a.remove(); }
    toast(msg);
  };
  const j = (f) => fetch(f, { cache: "no-store" }).then((r) => { if (!r.ok) throw new Error(f + " " + r.status); return r.json(); });

  let DATA, RULES = "";
  const status = (t) => local.status[t.id] || t.status;
  const OWN = { human: "Human", ai: "AI", either: "AI or human" };

  const taskMd = (t) => `# Task ${t.id}: ${t.title}\nOwner: ${OWN[t.owner]} · ~${t.minutes} min · priority ${t.priority} · depends on: ${t.depends_on.join(", ") || "none"}\n\nWhy: ${t.why}\n\nSteps:\n${t.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nDone when:\n${t.acceptance.map((s) => `- ${s}`).join("\n")}\n${t.needs_human.length ? `\nNeeds a human for:\n${t.needs_human.map((s) => `- ${s}`).join("\n")}\n` : ""}${t.verify ? `\nVerify first: ${t.verify}\n` : ""}\nRules (always apply):\n${RULES}\n\nFull context: the repo's HQ brief (brief.md). When finished, update this task's status and notes in src/hq/tasks.json.`;

  function card(t) {
    const s = status(t);
    const el = document.createElement("article");
    el.className = "tcard"; el.dataset.status = s; el.dataset.id = t.id;
    el.innerHTML = `<div class="tcard__head"><input type="checkbox" aria-label="Mark ${esc(t.id)} done" ${s === "done" ? "checked" : ""}><div class="tcard__title"><span class="tcard__id">${esc(t.id)}</span>${esc(t.title)}</div></div>
      <div class="tags"><span class="tag tag--${t.owner}">${OWN[t.owner]}</span><span class="tag">~${t.minutes} min</span>${t.priority === 1 ? '<span class="tag tag--p1">Priority 1</span>' : ""}<span class="tag">${esc(s)}</span>${t.depends_on.length ? `<span class="tag">after ${esc(t.depends_on.join(", "))}</span>` : ""}</div>
      <details><summary>Steps, checks and notes</summary><div>
        <p>${md(t.why)}</p>
        <h4>Steps</h4><ol>${t.steps.map((x) => `<li>${md(x)}</li>`).join("")}</ol>
        <h4>Done when</h4><ul>${t.acceptance.map((x) => `<li>${md(x)}</li>`).join("")}</ul>
        ${t.needs_human.length ? `<h4>Needs a human for</h4><ul>${t.needs_human.map((x) => `<li>${md(x)}</li>`).join("")}</ul>` : ""}
        ${t.verify ? `<p class="tcard__verify"><b>Verify first:</b> ${md(t.verify)}</p>` : ""}
        ${t.links.length ? `<p>${t.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(" · ")}</p>` : ""}
        ${t.notes ? `<p><b>Notes (shared):</b> ${md(t.notes)}</p>` : ""}${t.done_by ? `<p class="fine">Done by ${esc(t.done_by)}</p>` : ""}
        <h4>My notes (this browser)</h4><textarea aria-label="My notes for ${esc(t.id)}">${esc(local.notes[t.id] || "")}</textarea>
        <div class="tcard__btns"><button class="btn btn--small btn--dark" data-act="ai">Copy for AI</button>
          <select aria-label="Status for ${esc(t.id)}"><option value="">Status…</option>${["todo", "doing", "blocked", "done"].map((v) => `<option ${s === v ? "selected" : ""}>${v}</option>`).join("")}</select></div>
      </div></details>`;
    el.querySelector("input[type=checkbox]").addEventListener("change", (e) => setStatus(t, e.target.checked ? "done" : "todo"));
    el.querySelector("select").addEventListener("change", (e) => e.target.value && setStatus(t, e.target.value));
    el.querySelector("textarea").addEventListener("input", (e) => { local.notes[t.id] = e.target.value; save(local); });
    el.querySelector('[data-act="ai"]').addEventListener("click", () => copy(taskMd(t), `Copied ${t.id} for AI`));
    return el;
  }
  const setStatus = (t, v) => { local.status[t.id] = v; save(local); renderAll(); };

  function progress() {
    const all = DATA.tasks, done = all.filter((t) => status(t) === "done").length;
    const pct = Math.round((done / all.length) * 100);
    $("#pfill").style.width = pct + "%"; $("#pbar").setAttribute("aria-valuenow", pct);
    const mins = all.filter((t) => status(t) !== "done").reduce((n, t) => n + t.minutes, 0);
    const human = all.filter((t) => status(t) !== "done" && t.owner === "human").length;
    $("#ptext").textContent = `${done} of ${all.length} tasks done (${pct}%) · about ${Math.round(mins / 60)} hours of work left · ${human} tasks need Clayton or another human`;
  }

  function nextUp() {
    const done = new Set(DATA.tasks.filter((t) => status(t) === "done").map((t) => t.id));
    const list = DATA.tasks.filter((t) => status(t) !== "done" && status(t) !== "blocked" && t.depends_on.every((d) => done.has(d)))
      .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id)).slice(0, 5);
    const box = $("#nextlist"); box.replaceChildren(...list.map(card));
    if (!list.length) box.textContent = "Nothing unblocked. Check blocked tasks below.";
  }

  function taskList() {
    const fo = $("#f-owner").value, fs = $("#f-status").value, q = $("#f-q").value.trim().toLowerCase();
    const wrap = $("#tasklist"); wrap.replaceChildren();
    for (const ph of DATA.phases) {
      const ts = DATA.tasks.filter((t) => t.phase === ph.id && (!fo || t.owner === fo) && (!fs || status(t) === fs) && (!q || (t.title + t.why + t.steps.join(" ")).toLowerCase().includes(q)));
      if (!ts.length) continue;
      const sec = document.createElement("div"); sec.className = "phase";
      sec.innerHTML = `<h3>${esc(ph.id)}: ${esc(ph.title)}</h3><p>${esc(ph.blurb)}</p>`;
      ts.forEach((t) => sec.appendChild(card(t))); wrap.appendChild(sec);
    }
  }

  function playbook(p) {
    $("#playbook-body").innerHTML = `<p>${md(p.intro)}</p>` + p.sections.map((s) => `<details class="tcard" open><summary><b>${esc(s.title)}</b></summary><ul>${s.bullets.map((b) => `<li>${md(b)}</li>`).join("")}</ul></details>`).join("");
  }

  function facts(f) {
    $("#facts-asof").textContent = `(as of ${f.asOf})`;
    const st = (s) => `<span class="st st--${esc(String(s).replace(/\s+/g, "-"))}">${esc(s)}</span>`;
    $("#facts-body").innerHTML = `<p class="fine">${esc(f.note)}</p>
      <div class="tablewrap"><table class="facttable"><thead><tr><th>Platform</th><th>Status</th><th>Handle / link</th><th>What we saw</th></tr></thead><tbody>${f.accounts.map((a) => `<tr><td><b>${esc(a.platform)}</b></td><td>${st(a.status)}</td><td>${a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.handle || a.url)}</a>` : esc(a.handle)}</td><td>${esc(a.metrics)} ${esc(a.notes)}</td></tr>`).join("")}</tbody></table></div>
      <h3>Domains</h3><div class="tablewrap"><table class="facttable"><thead><tr><th>Domain</th><th>Status</th><th>Checked</th><th>Action</th></tr></thead><tbody>${f.domains.map((d) => `<tr><td><code>${esc(d.domain)}</code></td><td>${st(d.status)}</td><td>${esc(d.checked)}</td><td>${esc(d.action)}</td></tr>`).join("")}</tbody></table></div>
      <h3>Lookalike names to avoid</h3><ul>${f.similar_names.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <h3>Questions for Clayton</h3><ol>${f.questions_for_clayton.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`;
  }

  function kit(k) {
    const blocks = [...k.bios.map((b) => [b.platform, b.text]), ["YouTube description template", k.youtube_description_template], ["Pinned comment", k.pinned_comment_template], ...k.short_caption_templates.map((c, i) => [`Short caption ${i + 1}`, c]), ["Hashtags", Object.entries(k.hashtags).map(([a, b]) => `${a}: ${b}`).join("\n")], ["Order insert", k.order_insert_text], ["Want List match email", k.want_list_match_email], ["Giveaway disclosure", k.giveaway_disclosure], ...k.dm_reply_templates.map((c, i) => [`DM reply ${i + 1}`, c])];
    const box = $("#kit-body"); box.replaceChildren();
    for (const [title, text] of blocks) { const d = document.createElement("div"); d.className = "kitblock"; d.title = "Click to copy"; d.innerHTML = `<b>${esc(title)}</b>${esc(text)}`; d.addEventListener("click", () => copy(text, "Copied: " + title)); box.appendChild(d); }
    const n = document.createElement("p"); n.className = "fine"; n.textContent = k.note; box.prepend(n);
  }

  async function health() {
    const box = $("#health-body");
    try {
      const [meta, ver, vid, lst] = await Promise.all([j("site-meta.json"), j("/data/verdicts.json"), j("/data/videos.json"), j("/data/listings.json")]);
      const priced = ver.entries.filter((e) => typeof e.cost === "number" && typeof e.value === "number").length;
      const rows = [
        [meta.siteUrl.startsWith("https://offtheripcollectables.com") ? "ok" : "warn", `Public URL in config: ${meta.siteUrl}`],
        [meta.missingLinks.length ? "warn" : "ok", `Profile links not set (hidden on site): ${meta.missingLinks.join(", ") || "none"}`],
        [lst.source === "ebay-api" && lst.items.length ? "ok" : "warn", `Shop grid: ${lst.source === "ebay-api" ? lst.items.length + " live listings, updated " + lst.updated : "category shortcuts only (task T21)"}`],
        [priced === ver.entries.length ? "ok" : "warn", `Verdict dollars: ${priced} of ${ver.entries.length} days have cost + value (task T22)`],
        [vid.updated ? "ok" : "warn", `Videos: ${vid.videos.length} on the site, updated ${vid.updated}`],
        [meta.analytics ? "ok" : "warn", `Analytics: ${meta.analytics ? "on" : "off (task T11)"}`],
        [meta.packingBlock ? "ok" : "warn", `About page packing/shipping block: ${meta.packingBlock ? "on" : "off until Clayton confirms (T24)"}`],
        [meta.promo ? "ok" : "info", `Promo bar: ${meta.promo ? "ON" : "off"}`],
      ];
      box.innerHTML = `<ul class="healthlist">${rows.map(([k, t]) => `<li class="h-${k}">${k === "ok" ? "✅" : k === "warn" ? "⚠️" : "•"} ${esc(t)}</li>`).join("")}</ul>`;
    } catch (e) { box.textContent = "Could not load health data: " + e.message; }
  }

  const renderAll = () => { progress(); nextUp(); taskList(); };

  (async () => {
    try {
      const [t, p, f, k, r] = await Promise.all([j("tasks.json"), j("playbook.json"), j("facts.json"), j("copykit.json"), fetch("rules.md").then((x) => x.text())]);
      DATA = t; RULES = r;
      $("#rules-body").innerHTML = "<ol>" + r.split(/\n/).filter((l) => /^\d+\./.test(l)).map((l) => `<li>${md(l.replace(/^\d+\.\s*/, ""))}</li>`).join("") + "</ol>";
      renderAll(); playbook(p); facts(f); kit(k); health();
      ["#f-owner", "#f-status", "#f-q"].forEach((s) => $(s).addEventListener("input", taskList));
      $("#reset").addEventListener("click", () => { if (confirm("Clear the checkmarks and notes saved in this browser?")) { local = { status: {}, notes: {} }; save(local); renderAll(); } });
      $("#copy-brief").addEventListener("click", async () => { try { copy(await (await fetch("brief.md")).text(), "AI brief copied"); } catch (e) { toast("Could not load brief.md"); } });
    } catch (e) { $("#ptext").textContent = "Failed to load HQ data: " + e.message + " (open via the site, not file://)"; }
  })();
})();
