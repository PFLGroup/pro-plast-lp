/* =============================================================
   PRO-PLAST flagship — interactions
   IIFE, defensive (works when elements are absent),
   respects prefers-reduced-motion.
   ============================================================= */
(function () {
  "use strict";

  // progressive enhancement flag (CSS hides .reveal only when .js present)
  document.documentElement.classList.add("js");

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------
     1. THEME TOGGLE  (localStorage 'pp_theme' + prefers-color)
     ----------------------------------------------------------- */
  (function theme() {
    var KEY = "pp_theme";
    var root = document.documentElement;

    function systemPref() {
      return (window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    }
    function apply(t) {
      root.setAttribute("data-theme", t);
      var btn = $("#themeToggle");
      if (btn) {
        btn.setAttribute("aria-pressed", String(t === "dark"));
        btn.setAttribute("aria-label", t === "dark" ? "Włącz tryb jasny" : "Włącz tryb ciemny");
      }
      var meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", t === "dark" ? "#12161C" : "#F7F3EC");
    }

    var stored;
    try { stored = localStorage.getItem(KEY); } catch (e) { stored = null; }
    // optional ?theme=light|dark override (handy for previews / QA)
    var qp = null;
    try { qp = new URLSearchParams(location.search).get("theme"); } catch (e) {}
    if (qp === "light" || qp === "dark") apply(qp);
    else apply(stored || systemPref());

    // react to OS change only when user hasn't chosen
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onMq = function () {
        var s; try { s = localStorage.getItem(KEY); } catch (e) { s = null; }
        if (!s) apply(systemPref());
      };
      if (mq.addEventListener) mq.addEventListener("change", onMq);
      else if (mq.addListener) mq.addListener(onMq);
    }

    var toggle = $("#themeToggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        apply(next);
        try { localStorage.setItem(KEY, next); } catch (e) {}
      });
    }
  })();

  /* -----------------------------------------------------------
     2. NAV scroll state
     ----------------------------------------------------------- */
  (function nav() {
    var bar = $("#nav");
    if (!bar) return;
    var onScroll = function () {
      bar.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  })();

  /* -----------------------------------------------------------
     3. MOBILE DRAWER
     ----------------------------------------------------------- */
  (function drawer() {
    var d = $("#drawer"), open = $("#burger"), close = $("#drawerClose"), scrim = $("#drawerScrim");
    if (!d) return;
    var lastFocus = null;
    function show() {
      lastFocus = document.activeElement;
      d.classList.add("is-open"); d.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      var first = d.querySelector("a,button"); if (first) first.focus();
    }
    function hide() {
      d.classList.remove("is-open"); d.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    if (open) open.addEventListener("click", show);
    if (close) close.addEventListener("click", hide);
    if (scrim) scrim.addEventListener("click", hide);
    $$(".d-link", d).forEach(function (a) { a.addEventListener("click", hide); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && d.classList.contains("is-open")) hide();
    });
  })();

  /* -----------------------------------------------------------
     4. REVEAL on scroll (IntersectionObserver)
     ----------------------------------------------------------- */
  (function reveal() {
    var els = $$(".reveal");
    if (!els.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });

    // safety net: never let content stay hidden (e.g. IO edge cases, deep links)
    window.addEventListener("load", function () {
      setTimeout(function () {
        els.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("in");
        });
      }, 600);
    });
  })();

  /* -----------------------------------------------------------
     5. COUNT-UP numbers (data-count, optional data-decimals)
     ----------------------------------------------------------- */
  (function countUp() {
    var nums = $$("[data-count]");
    if (!nums.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var dur = 1400;
      if (reduceMotion) { el.textContent = format(target, dec); return; }
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = format(target * eased, dec);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = format(target, dec);
      }
      requestAnimationFrame(step);
    }
    function format(v, dec) {
      var s = v.toFixed(dec);
      if (dec > 0) s = s.replace(".", ",");          // PL decimal comma
      return s;
    }

    if (!("IntersectionObserver" in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  })();

  /* -----------------------------------------------------------
     6. Uw bars fill on scroll
     ----------------------------------------------------------- */
  (function uwBars() {
    var chart = $("#uwChart");
    if (!chart) return;
    function fill() {
      $$(".uw-row__fill", chart).forEach(function (f) {
        f.style.width = (f.getAttribute("data-fill") || "0") + "%";
      });
    }
    if (reduceMotion || !("IntersectionObserver" in window)) { fill(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { fill(); io.disconnect(); } });
    }, { threshold: 0.35 });
    io.observe(chart);
  })();

  /* -----------------------------------------------------------
     7. BEFORE / AFTER slider (range + handle)
     ----------------------------------------------------------- */
  (function beforeAfter() {
    var stage = $("#baStage");
    if (!stage) return;
    var before = $(".ba__before", stage);
    var handle = $(".ba__handle", stage);
    var knob   = $(".ba__knob", stage);
    var range  = $("#baRange", stage);

    function setPos(p) {
      p = Math.max(0, Math.min(100, p));
      if (before) before.style.clipPath = "inset(0 " + (100 - p) + "% 0 0)";
      if (handle) handle.style.left = p + "%";
      if (knob)   knob.style.left = p + "%";
      if (range)  range.setAttribute("aria-valuenow", Math.round(p));
    }
    if (range) {
      range.addEventListener("input", function () { setPos(parseFloat(range.value)); });
    }
    // pointer drag directly on stage
    var dragging = false;
    function fromEvent(clientX) {
      var r = stage.getBoundingClientRect();
      var p = ((clientX - r.left) / r.width) * 100;
      setPos(p);
      if (range) range.value = Math.round(Math.max(0, Math.min(100, p)));
    }
    stage.addEventListener("pointerdown", function (e) {
      if (e.target === range) return; // range handles itself
      dragging = true; fromEvent(e.clientX);
    });
    window.addEventListener("pointermove", function (e) { if (dragging) fromEvent(e.clientX); });
    window.addEventListener("pointerup", function () { dragging = false; });

    setPos(50);
  })();

  /* -----------------------------------------------------------
     8. LIGHTBOX (native <dialog>)
     ----------------------------------------------------------- */
  (function lightbox() {
    var dlg = $("#lightbox");
    var tiles = $$("[data-lb]");
    if (!dlg || !tiles.length) return;

    var imgEl = $(".lightbox__frame img", dlg);
    var capEl = $(".lightbox__cap", dlg);
    var prevB = $(".lb-prev", dlg);
    var nextB = $(".lb-next", dlg);
    var closeB = $(".lb-close", dlg);
    var idx = 0;

    var items = tiles.map(function (t) {
      return { src: t.getAttribute("data-lb"), cap: t.getAttribute("data-cap") || "" };
    });

    function render() {
      var it = items[idx];
      imgEl.src = it.src;
      imgEl.alt = it.cap;
      capEl.textContent = it.cap;
    }
    function openAt(i) {
      idx = i; render();
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.setAttribute("open", "");
    }
    function move(d) { idx = (idx + d + items.length) % items.length; render(); }

    tiles.forEach(function (t, i) {
      t.addEventListener("click", function () { openAt(i); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openAt(i); }
      });
    });
    if (prevB) prevB.addEventListener("click", function () { move(-1); });
    if (nextB) nextB.addEventListener("click", function () { move(1); });
    if (closeB) closeB.addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    document.addEventListener("keydown", function (e) {
      if (!dlg.open) return;
      if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "ArrowRight") move(1);
    });
  })();

  /* -----------------------------------------------------------
     9. MAGNETIC buttons
     ----------------------------------------------------------- */
  (function magnetic() {
    if (reduceMotion) return;
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return;
    $$(".magnetic").forEach(function (m) {
      var strength = 18;
      m.addEventListener("pointermove", function (e) {
        var r = m.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        m.style.transform = "translate(" + (x / r.width) * strength + "px," + (y / r.height) * strength + "px)";
      });
      m.addEventListener("pointerleave", function () { m.style.transform = "translate(0,0)"; });
    });
  })();

  /* -----------------------------------------------------------
     10. CONFIGURATOR (3 steps)
     ----------------------------------------------------------- */
  (function configurator() {
    var root = $("#configurator");
    if (!root) return;

    var steps = $$(".config__step", root);
    var dots  = $$(".config__dot", root);
    var prevB = $("#cfgPrev"), nextB = $("#cfgNext");
    var preview = $("#cfgImg");
    var pillName = $("#cfgPillName"), pillDesc = $("#cfgPillDesc");
    var cur = 0;
    var state = { type: "Okna PCV", color: "Biały", colorClass: "tint-white", panes: "3 szyby" };

    function show(i) {
      cur = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach(function (s, n) { s.hidden = n !== cur; });
      dots.forEach(function (d, n) { d.classList.toggle("is-on", n <= cur); });
      if (prevB) prevB.disabled = cur === 0;
      if (nextB) nextB.textContent = cur === steps.length - 1 ? "Wyślij zapytanie" : "Dalej";
    }
    function syncPill() {
      if (pillName) pillName.textContent = state.type + " · " + state.color;
      if (pillDesc) pillDesc.textContent = state.panes + " — szacunkowa wycena: skontaktuj się";
      if (preview) {
        preview.classList.remove("tint-white", "tint-anthracite", "tint-oak");
        preview.classList.add(state.colorClass);
      }
    }

    $$(".opt", root).forEach(function (opt) {
      opt.addEventListener("click", function () {
        var group = opt.getAttribute("data-group");
        $$('.opt[data-group="' + group + '"]', root).forEach(function (o) { o.classList.remove("is-sel"); o.setAttribute("aria-pressed", "false"); });
        opt.classList.add("is-sel"); opt.setAttribute("aria-pressed", "true");
        var val = opt.getAttribute("data-val");
        if (group === "type") state.type = val;
        else if (group === "color") { state.color = val; state.colorClass = opt.getAttribute("data-tint") || "tint-white"; }
        else if (group === "panes") state.panes = val;
        syncPill();
      });
    });

    if (nextB) nextB.addEventListener("click", function () {
      if (cur === steps.length - 1) {
        var contact = $("#kontakt") || $('a[href*="kontakt"]');
        if (contact && contact.id) location.hash = "#kontakt";
        else if (contact) location.href = contact.href;
        return;
      }
      show(cur + 1);
    });
    if (prevB) prevB.addEventListener("click", function () { show(cur - 1); });

    show(0); syncPill();
  })();

  /* -----------------------------------------------------------
     11. Smooth same-page anchor with nav offset
     ----------------------------------------------------------- */
  (function anchors() {
    $$('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      a.addEventListener("click", function (e) {
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        var top = t.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
      });
    });
  })();

  /* footer year */
  var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

  /* -----------------------------------------------------------
     12. CONTACT FORM (validation: phone OR email + consent;
         demo mode when no data-endpoint; localized messages)
     ----------------------------------------------------------- */
  (function contactForm() {
    var form = $("#contactForm");
    if (!form) return;
    var note = $(".form__note", form);
    var msgErr = form.getAttribute("data-msg-err") || "Provide a phone or e-mail and tick the consent box.";
    var msgOk = form.getAttribute("data-msg-ok") || "Thank you! We'll get back to you soon.";
    var msgSending = form.getAttribute("data-msg-sending") || "Sending…";
    var endpoint = form.getAttribute("data-endpoint") || "";

    function setNote(text, kind) {
      if (!note) return;
      note.textContent = text;
      note.classList.remove("is-err", "is-ok");
      if (kind) note.classList.add(kind === "err" ? "is-err" : "is-ok");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var phone = (form.querySelector('[name="phone"]') || {}).value || "";
      var email = (form.querySelector('[name="email"]') || {}).value || "";
      var consent = form.querySelector('[name="consent"]');
      var hasContact = phone.trim().length >= 6 || /\S+@\S+\.\S+/.test(email.trim());
      var hasConsent = consent && consent.checked;

      if (!hasContact || !hasConsent) {
        setNote(msgErr, "err");
        return;
      }

      if (!endpoint) {
        // demo mode — no backend wired in
        setNote(msgOk, "ok");
        form.reset();
        return;
      }

      setNote(msgSending, null);
      var data = new FormData(form);
      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) {
          if (r.ok) { setNote(msgOk, "ok"); form.reset(); }
          else { setNote(msgErr, "err"); }
        })
        .catch(function () { setNote(msgErr, "err"); });
    });
  })();
})();
