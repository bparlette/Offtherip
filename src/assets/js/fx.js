/* Off The Rip: streak HUD countdown, Hit-or-Bust call (localStorage only), reveal, tilt/holo, mobile dock. No dependencies. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad = (n) => String(n).padStart(2, "0");
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
  };

  /* ---- next-drop countdown: next HH:MM in the configured time zone, as a UTC instant ---- */
  function zoneOffsetMs(utc, tz) {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(utc).map((x) => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(utc.getTime() / 1000) * 1000;
  }
  function nextDrop(hhmm, tz) {
    const [h, m] = hhmm.split(":").map(Number);
    const now = new Date();
    for (let add = 0; add < 3; add++) {
      const base = new Date(now.getTime() + add * 864e5);
      const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(base).map((x) => [x.type, x.value]));
      const guess = new Date(Date.UTC(+p.year, +p.month - 1, +p.day, h, m));
      const t = new Date(guess.getTime() - zoneOffsetMs(guess, tz));
      if (t > now) return t;
    }
    return null;
  }
  const cd = $$("[data-drop]").map((el) => ({ el, out: $$(".hud__t", el), next: el.dataset.next, at: null }));
  if (cd.length) {
    const tick = () => {
      cd.forEach((c) => {
        if (!c.at || c.at <= Date.now()) {
          try { c.at = nextDrop(c.el.dataset.drop, c.el.dataset.tz || "America/New_York"); } catch (_) { c.at = null; }
        }
        if (!c.at) return;
        const s = Math.max(0, Math.floor((c.at - Date.now()) / 1000));
        const txt = ` drops in ${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
        c.out.forEach((o) => (o.textContent = txt));
      });
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---- count the streak number up once per session ---- */
  const num = $(".streakhero__num[data-count]");
  if (num) {
    const target = +num.dataset.count;
    let seen = false;
    try { seen = sessionStorage.getItem("otr_counted") === "1"; sessionStorage.setItem("otr_counted", "1"); } catch (_) {}
    if (!reduce && !seen && target > 0) {
      const t0 = performance.now(), dur = 1100;
      num.textContent = "0";
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        num.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step); else num.classList.add("count-in");
      };
      requestAnimationFrame(step);
      setTimeout(() => { num.textContent = String(target); }, dur + 300);
    }
  }

  /* ---- Hit or Bust: picks live only in this browser ---- */
  $$("[data-predict]").forEach((box) => {
    const next = box.dataset.next;
    let results = {};
    try { results = JSON.parse(box.dataset.results || "{}"); } catch (_) {}
    const KEY = "otr_calls";
    const out = $(".predict__out", box), rec = $(".predict__rec", box), share = $("[data-share]", box);
    const btns = $$("[data-pick]", box);
    const render = () => {
      const calls = store.get(KEY, {});
      const mine = calls[next];
      btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.pick === mine)));
      box.classList.toggle("is-locked", !!mine);
      out.textContent = mine ? `Locked in: ${mine === "hit" ? "HIT" : "BUST"} for Day ${next}. Come back after the drop.` : "Tap one. It stays on this device.";
      if (share) share.hidden = !mine;
      // settle past calls against the real results
      const settled = Object.keys(calls).filter((d) => results[d]).sort((a, b) => a - b);
      if (settled.length) {
        const ok = settled.map((d) => (results[d] === "profit") === (calls[d] === "hit"));
        let run = 0, best = 0;
        ok.forEach((v) => { run = v ? run + 1 : 0; best = Math.max(best, run); });
        rec.hidden = false;
        rec.textContent = `Your record: ${ok.filter(Boolean).length} of ${ok.length} right · best run ${best}`;
      }
    };
    btns.forEach((b) => b.addEventListener("click", () => {
      const calls = store.get(KEY, {});
      calls[next] = b.dataset.pick;
      store.set(KEY, calls);
      try { window.otrTrack && window.otrTrack("Verdict Call", { day: next, pick: b.dataset.pick }); } catch (_) {}
      render();
    }));
    if (share) share.addEventListener("click", async () => {
      const calls = store.get(KEY, {});
      const text = `I'm calling Day ${next} of the Daily Pack Verdict: ${calls[next] === "hit" ? "HIT" : "BUST"}. Think you can beat it?`;
      const url = location.origin + "/verdict/";
      try {
        if (navigator.share) await navigator.share({ text, url });
        else { await navigator.clipboard.writeText(`${text} ${url}`); out.textContent = "Copied. Paste it anywhere."; }
      } catch (_) {}
    });
    render();
  });

  /* ---- tilt + holo shine: fine pointers only ---- */
  if (matchMedia("(hover: hover) and (pointer: fine)").matches && !reduce) {
    $$("[data-tilt], .lcard, .vcard__thumb, .tile").forEach((el) => {
      const tilt = el.hasAttribute("data-tilt");
      if (!tilt) el.classList.add("holo");
      let raf = 0;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.setProperty("--mx", x * 100 + "%"); el.style.setProperty("--my", y * 100 + "%");
          if (tilt) { el.style.setProperty("--ry", ((x - 0.5) * 8).toFixed(2) + "deg"); el.style.setProperty("--rx", ((0.5 - y) * 6).toFixed(2) + "deg"); }
          el.classList.add("is-hot");
        });
      });
      el.addEventListener("pointerleave", () => {
        cancelAnimationFrame(raf);
        el.classList.remove("is-hot");
        el.style.removeProperty("--rx"); el.style.removeProperty("--ry");
      });
    });
  }

  /* ---- fade-up reveal; everything shows after 4s regardless ---- */
  const targets = $$(".section .sechead, .section .vgrid > *, .section .tiles > *, .section .steps > *, .section .split > *, .band__in > *, .stats > *, .tablewrap, .vchart, .lverdict, .grid > *");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    targets.forEach((el, i) => { el.classList.add("reveal"); el.style.setProperty("--d", (i % 4) * 70 + "ms"); io.observe(el); });
    setTimeout(() => targets.forEach((el) => el.classList.add("in")), 4000);
  }

  /* ---- skeleton shimmer clears when the thumbnail loads ---- */
  $$(".vcard__thumb img").forEach((img) => {
    const done = () => img.parentElement.classList.add("is-loaded");
    if (img.complete) done(); else { img.addEventListener("load", done, { once: true }); img.addEventListener("error", done, { once: true }); }
  });

  /* ---- mobile dock tucks away over the signup form and footer ---- */
  const dock = $(".dock");
  if (dock && "IntersectionObserver" in window) {
    const watched = $$("#hitlist, .site-footer, form");
    const vis = new Set();
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? vis.add(e.target) : vis.delete(e.target)));
      dock.classList.toggle("is-away", vis.size > 0);
    });
    watched.forEach((el) => io.observe(el));
  }
})();
