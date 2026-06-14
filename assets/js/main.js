/* =========================================================
   PRO-PLAST — interakcje (wielostronicowe)
   nav · burger · język (linki) · FAQ · scroll-reveal · formularz
   Motyw jasny/ciemny obsługuje osobny theme-toggle.js
   ========================================================= */

/* Podpięcie formularza: wklej endpoint Formspree/Basin/Netlify, by zbierać zapytania.
   Pusty ("") = tryb demo (nic nie wysyła). Powiadomienia kieruj na okna@pro-plast.com.pl */
const FORM_ENDPOINT = "";

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".nav");
  const hero = document.querySelector(".hero");

  /* nav: tło po scrollu + przezroczysty nad ciemnym hero (tylko strona główna) */
  const onScroll = () => {
    if (!nav) return;
    if (!hero) { nav.classList.add("scrolled"); return; } // podstrony: nav zawsze widoczny
    const y = window.scrollY || 0;
    nav.classList.toggle("scrolled", y > 20);
    nav.classList.toggle("over-hero", y < hero.offsetHeight - 80);
  };
  if (hero && nav) nav.classList.add("over-hero");
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* przełącznik języka (lista linków do /en/ /uk/ /de/) */
  const lang = document.getElementById("lang");
  const langBtn = document.getElementById("langBtn");
  if (lang && langBtn) {
    langBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = lang.classList.toggle("open");
      langBtn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", () => {
      lang.classList.remove("open");
      langBtn.setAttribute("aria-expanded", "false");
    });
  }

  /* burger (menu mobilne) */
  const burger = document.getElementById("burger");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    document.querySelectorAll(".nav__links a").forEach((a) =>
      a.addEventListener("click", () => nav.classList.remove("menu-open")));
  }

  /* FAQ accordion */
  document.querySelectorAll(".faq__q").forEach((q) => {
    q.addEventListener("click", () => {
      const item = q.closest(".faq__item");
      const a = item.querySelector(".faq__a");
      const open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", String(open));
      a.style.maxHeight = open ? a.scrollHeight + "px" : null;
    });
  });

  /* scroll-reveal */
  const reveals = document.querySelectorAll("[data-reveal]");
  if (reveals.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const sibs = [...e.target.parentElement.querySelectorAll(":scope > [data-reveal]")];
          const i = Math.max(0, sibs.indexOf(e.target));
          e.target.style.transitionDelay = `${Math.min(i * 80, 400)}ms`;
          e.target.classList.add("in");
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach((el) => obs.observe(el));
  }

  /* formularz kontaktowy */
  const form = document.getElementById("contactForm");
  if (form) {
    const note = form.querySelector(".form__note");
    const btn = form.querySelector("button[type=submit]");
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      if (note) note.classList.remove("error");
      const phone = (form.phone && form.phone.value.trim()) || "";
      const email = (form.email && form.email.value.trim()) || "";
      const consent = form.consent && form.consent.checked;
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const validPhone = phone.replace(/[^\d]/g, "").length >= 9;

      if (!validPhone && !validEmail) {
        if (note) { note.textContent = "Podaj telefon lub e-mail, żebyśmy mogli oddzwonić."; note.classList.add("error"); }
        return;
      }
      if (!consent) {
        if (note) { note.textContent = "Zaznacz zgodę na kontakt, aby wysłać zapytanie."; note.classList.add("error"); }
        return;
      }
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Wysyłanie…"; }
      try {
        if (FORM_ENDPOINT) {
          const fd = new FormData(form);
          const res = await fetch(FORM_ENDPOINT, { method: "POST", headers: { Accept: "application/json" }, body: fd });
          if (!res.ok) throw new Error("net");
        } else {
          await new Promise((r) => setTimeout(r, 700));
        }
        form.reset();
        if (btn) btn.textContent = "Wysłano ✓";
        if (note) note.textContent = "Dziękujemy — oddzwonimy i umówimy bezpłatny pomiar.";
      } catch (_) {
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || "Wyślij zapytanie"; }
        if (note) { note.textContent = "Coś poszło nie tak — zadzwoń: 602 488 413."; note.classList.add("error"); }
      }
    });
  }
});
