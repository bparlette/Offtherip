/* Off The Rip: Cinematic Interactions & Collector FX */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad = (n) => String(n).padStart(2, "0");

  const store = {
    get(k, d) {
      try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (_) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {}
    },
  };

  /* ==========================================================================
     Countdown Clock for Next Drop
     ========================================================================== */
  function zoneOffsetMs(utc, tz) {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).formatToParts(utc).map((x) => [x.type, x.value])
    );
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(utc.getTime() / 1000) * 1000;
  }

  function nextDrop(hhmm, tz) {
    const [h, m] = (hhmm || "12:00").split(":").map(Number);
    const now = new Date();
    for (let add = 0; add < 3; add++) {
      const base = new Date(now.getTime() + add * 864e5);
      const p = Object.fromEntries(
        new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).formatToParts(base).map((x) => [x.type, x.value])
      );
      const guess = new Date(Date.UTC(+p.year, +p.month - 1, +p.day, h, m));
      const t = new Date(guess.getTime() - zoneOffsetMs(guess, tz));
      if (t > now) return t;
    }
    return null;
  }

  const dropEls = $$("[data-drop]");
  if (dropEls.length) {
    const tickDrop = () => {
      dropEls.forEach((el) => {
        const out = $$(".hud__t, [data-clock]", el);
        let at = el._dropAt;
        if (!at || at <= Date.now()) {
          try {
            at = el._dropAt = nextDrop(el.dataset.drop, el.dataset.tz || "America/New_York");
          } catch (_) {
            at = null;
          }
        }
        if (!at) return;
        const s = Math.max(0, Math.floor((at - Date.now()) / 1000));
        const txt = ` · drops in ${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
        out.forEach((o) => (o.textContent = txt));
      });
    };
    tickDrop();
    setInterval(tickDrop, 1000);
  }

  /* ==========================================================================
     Streak Counter Animation
     ========================================================================== */
  const countNum = $("[data-count]");
  if (countNum) {
    const target = +countNum.dataset.count;
    let counted = false;
    try {
      counted = sessionStorage.getItem("otr_counted") === "1";
      sessionStorage.setItem("otr_counted", "1");
    } catch (_) {}
    if (!reduce && !counted && target > 0) {
      const t0 = performance.now();
      const dur = 1000;
      countNum.textContent = "0";
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        countNum.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step);
        else countNum.textContent = String(target);
      };
      requestAnimationFrame(step);
    }
  }

  /* ==========================================================================
     Interactive Hit or Bust Prediction Call
     ========================================================================== */
  $$("[data-predict]").forEach((box) => {
    const next = box.dataset.next;
    let results = {};
    try { results = JSON.parse(box.dataset.results || "{}"); } catch (_) {}
    const KEY = "otr_calls";
    const out = $(".predict__out", box);
    const rec = $(".predict__rec", box);
    const share = $("[data-share]", box);
    const btns = $$("[data-pick]", box);

    const render = () => {
      const calls = store.get(KEY, {});
      const mine = calls[next];
      btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.pick === mine)));
      if (out) {
        out.textContent = mine
          ? `Locked in: ${mine === "hit" ? "HIT 🔥" : "BUST 💀"} for Day ${next}. Come back after the drop!`
          : "Pick one! Your prediction stays saved on this device.";
      }
      if (share) share.hidden = !mine;
      const settled = Object.keys(calls).filter((d) => results[d]).sort((a, b) => a - b);
      if (settled.length && rec) {
        const ok = settled.map((d) => (results[d] === "profit") === (calls[d] === "hit"));
        rec.hidden = false;
        rec.textContent = `Your prediction score: ${ok.filter(Boolean).length} of ${ok.length} correct.`;
      }
    };

    btns.forEach((b) => {
      b.addEventListener("click", () => {
        const calls = store.get(KEY, {});
        calls[next] = b.dataset.pick;
        store.set(KEY, calls);
        try { window.otrTrack && window.otrTrack("Verdict Call", { day: next, pick: b.dataset.pick }); } catch (_) {}
        render();
      });
    });

    if (share) {
      share.addEventListener("click", async () => {
        const calls = store.get(KEY, {});
        const text = `I'm calling Day ${next} of the Daily Pack Verdict: ${calls[next] === "hit" ? "HIT 🔥" : "BUST 💀"}! Think you can call it?`;
        const url = location.origin + (location.pathname.includes("/preview/") ? "/Offtherip/preview/verdict/" : location.pathname.startsWith("/Offtherip/") ? "/Offtherip/verdict/" : "/verdict/");
        try {
          if (navigator.share) await navigator.share({ text, url });
          else if (navigator.clipboard) {
            await navigator.clipboard.writeText(`${text} ${url}`);
            if (out) out.textContent = "Link copied! Paste it in the comments or group chat.";
          }
        } catch (_) {}
      });
    }

    render();
  });

  /* ==========================================================================
     3D Interactive Tilt & Holographic Foil Specular Reflection
     ========================================================================== */
  if (matchMedia("(hover: hover) and (pointer: fine)").matches && !reduce) {
    $$("[data-tilt], .slab-showcase, .tile, .lcard, .vcard__thumb").forEach((el) => {
      const tilt = el.hasAttribute("data-tilt") || el.classList.contains("slab-showcase");
      let raf = 0;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
          el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
          if (tilt) {
            el.style.setProperty("--ry", ((x - 0.5) * 14).toFixed(2) + "deg");
            el.style.setProperty("--rx", ((0.5 - y) * 14).toFixed(2) + "deg");
          }
          el.classList.add("is-hot");
        });
      });
      el.addEventListener("pointerleave", () => {
        cancelAnimationFrame(raf);
        el.classList.remove("is-hot");
        if (tilt) {
          el.style.setProperty("--ry", "0deg");
          el.style.setProperty("--rx", "0deg");
        }
      });
    });
  }

  /* ==========================================================================
     Scroll Reveal Observer
     ========================================================================== */
  const revealTargets = $$(
    ".section .sechead, .section .vgrid > *, .section .shelf > *, .section .tiles > *, " +
    ".section .steps > *, .section .split > *, .band__in > *, .stats > *, .tablewrap, .lverdict, .grid > *"
  );
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    revealTargets.forEach((el, i) => {
      el.classList.add("reveal");
      el.style.setProperty("--d", (i % 4) * 60 + "ms");
      io.observe(el);
    });
    setTimeout(() => revealTargets.forEach((el) => el.classList.add("in")), 3500);
  } else {
    revealTargets.forEach((el) => el.classList.add("in"));
  }

  /* ==========================================================================
     Mobile Conversion Dock Toggle
     ========================================================================== */
  const dock = $(".dock");
  const heroCta = $(".hero .cta, .hero .cta-row");
  if (dock && heroCta && "IntersectionObserver" in window) {
    const ioHero = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        dock.classList.toggle("on", !en.isIntersecting);
      });
    }, { rootMargin: "0px 0px -60px 0px" });
    ioHero.observe(heroCta);

    // Hide dock over forms or footer
    const hideTargets = $$("#hitlist, .site-footer, form");
    const visibleHide = new Set();
    const ioHide = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) visibleHide.add(en.target);
        else visibleHide.delete(en.target);
      });
      dock.classList.toggle("is-away", visibleHide.size > 0);
    });
    hideTargets.forEach((t) => ioHide.observe(t));
  }
  /* ==========================================================================
     Horizontal Shelf & Reviews Slider Controls (Ashley Claudy Parity)
     ========================================================================== */
  function wireSlider(box, trackSel, prevSel, nextSel, barSel, cardSel) {
    const track = box.querySelector(trackSel);
    if (!track) return;
    const prev = box.querySelector(prevSel);
    const next = box.querySelector(nextSel);
    const bar = box.querySelector(barSel);

    function step() {
      const card = track.querySelector(cardSel);
      return card ? card.getBoundingClientRect().width + 20 : 320;
    }

    function update() {
      const max = track.scrollWidth - track.clientWidth;
      const pos = max > 0 ? track.scrollLeft / max : 0;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
      if (bar) {
        const view = max > 0 ? track.clientWidth / track.scrollWidth : 1;
        bar.style.width = Math.max(view, 0.15) * 100 + "%";
        bar.style.transform = "translateX(" + pos * (1 / Math.max(view, 0.15) - 1) * 100 + "%)";
      }
    }

    function go(dir) {
      track.scrollBy({ left: dir * step(), behavior: reduce ? "auto" : "smooth" });
    }

    if (prev) prev.addEventListener("click", () => { go(-1); track.focus({ preventScroll: true }); });
    if (next) next.addEventListener("click", () => { go(1); track.focus({ preventScroll: true }); });

    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });

    track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();

    // Desktop drag-to-scroll
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let moved = false;

    track.addEventListener("mousedown", (e) => {
      isDown = true;
      moved = false;
      track.classList.add("is-dragging");
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });

    window.addEventListener("mouseup", () => {
      if (isDown) {
        isDown = false;
        track.classList.remove("is-dragging");
      }
    });

    track.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 6) moved = true;
      track.scrollLeft = scrollLeft - walk;
    });

    track.addEventListener("click", (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }

  // Initialize review sliders
  $$("[data-reviews]").forEach((box) => {
    wireSlider(box, ".rv-track", '[data-rv="prev"]', '[data-rv="next"]', ".rv-prog i", ".rv-card");
  });

  // Initialize shelf sliders
  $$("[data-shelf]").forEach((box) => {
    wireSlider(box, ".shelf", '[data-shelf-btn="prev"]', '[data-shelf-btn="next"]', ".shelf-prog i", ".shelf-card");
  });
})();
