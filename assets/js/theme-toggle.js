/* =========================================================
   PRO-PLAST — Okna i Drzwi Białystok
   Theme toggle (light / dark) — samodzielny IIFE, zero zależności.

   Działanie:
   - Motyw startowy: localStorage 'pp_theme' → jeśli brak, prefers-color-scheme.
   - Ustawia data-theme na <html> tak wcześnie, jak to możliwe (anty-FOUC).
   - Przycisk #themeToggle przełącza light/dark, zapisuje wybór, aktualizuje
     aria-pressed oraz widoczność ikon .icon-sun / .icon-moon.
   - Reaguje na zmianę prefers-color-scheme TYLKO gdy user nie wybrał ręcznie.
   - Brak błędów, gdy przycisku nie ma na stronie.

   WSKAZÓWKA (anti-flash): wstaw <script src="theme-toggle.js"></script>
   w <head> (najlepiej przed CSS lub zaraz po), aby data-theme było ustawione
   zanim przeglądarka odmaluje stronę.
   ========================================================= */
(function () {
  "use strict";

  var STORAGE_KEY = "pp_theme";
  var LIGHT = "light";
  var DARK = "dark";

  var root = document.documentElement;

  /* --- bezpieczny odczyt/zapis localStorage (tryb prywatny, blokady) --- */
  function readStored() {
    try {
      var v = window.localStorage.getItem(STORAGE_KEY);
      return v === LIGHT || v === DARK ? v : null;
    } catch (e) {
      return null;
    }
  }
  function writeStored(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      /* brak dostępu do storage — przełącznik nadal działa w obrębie sesji */
    }
  }
  function clearStored() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  /* --- media query: preferencja systemowa --- */
  var prefersDarkMQ =
    window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function systemTheme() {
    return prefersDarkMQ && prefersDarkMQ.matches ? DARK : LIGHT;
  }

  /* --- czy user wybrał motyw ręcznie? --- */
  function hasManualChoice() {
    return readStored() !== null;
  }

  /* --- wyznacz motyw startowy --- */
  function resolveInitialTheme() {
    var stored = readStored();
    if (stored) return stored;
    return systemTheme();
  }

  /* --- zastosuj motyw do <html> (ASAP, bez czekania na DOM) --- */
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    /* klasy pomocnicze na <html> — do zaczepienia CSS-em, jeśli ktoś woli */
    root.classList.toggle("theme-dark", theme === DARK);
    root.classList.toggle("theme-light", theme === LIGHT);
  }

  /* === KROK 1: ustaw motyw natychmiast (anti-FOUC) === */
  applyTheme(resolveInitialTheme());

  /* --- aktualizacja stanu przycisku (a11y + ikony) --- */
  function syncButton(btn, theme) {
    if (!btn) return;
    var isDark = theme === DARK;

    /* aria-pressed: "wciśnięty" = aktywny tryb ciemny */
    btn.setAttribute("aria-pressed", isDark ? "true" : "false");

    /* czytelny opis dla AT — co zrobi kliknięcie */
    var label = isDark ? "Włącz tryb jasny" : "Włącz tryb ciemny";
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);

    /* klasy na przycisku — alternatywne zaczepienie dla CSS ikon */
    btn.classList.toggle("is-dark", isDark);
    btn.classList.toggle("is-light", !isDark);

    /* jawne sterowanie widocznością ikon (gdy CSS nie pokrywa danego case'u).
       Domyślnie CSS bazowy: .icon-moon ukryte; dark CSS pokazuje moon, chowa sun.
       Tu dodatkowo gwarantujemy spójność przez atrybut hidden. */
    var sun = btn.querySelector(".icon-sun");
    var moon = btn.querySelector(".icon-moon");
    if (sun) sun.hidden = isDark;
    if (moon) moon.hidden = !isDark;
  }

  /* --- bieżący motyw z atrybutu (źródło prawdy po zastosowaniu) --- */
  function currentTheme() {
    return root.getAttribute("data-theme") === DARK ? DARK : LIGHT;
  }

  /* === KROK 2: po załadowaniu DOM — podłącz przycisk === */
  function init() {
    var btn = document.getElementById("themeToggle");

    /* zsynchronizuj UI przycisku z bieżącym motywem (nawet jeśli btn=null → no-op) */
    syncButton(btn, currentTheme());

    if (btn) {
      btn.addEventListener("click", function () {
        var next = currentTheme() === DARK ? LIGHT : DARK;
        applyTheme(next);
        writeStored(next); /* klik = wybór ręczny → zapamiętaj i przestań śledzić system */
        syncButton(btn, next);
      });
    }

    /* === KROK 3: reaguj na zmianę preferencji systemowej ===
       tylko gdy user NIE dokonał ręcznego wyboru */
    if (prefersDarkMQ) {
      var onSystemChange = function (e) {
        if (hasManualChoice()) return; /* user zdecydował ręcznie — nie nadpisuj */
        var theme = e.matches ? DARK : LIGHT;
        applyTheme(theme);
        syncButton(document.getElementById("themeToggle"), theme);
      };

      /* nowsze API (addEventListener) z fallbackiem na addListener (starsze Safari) */
      if (typeof prefersDarkMQ.addEventListener === "function") {
        prefersDarkMQ.addEventListener("change", onSystemChange);
      } else if (typeof prefersDarkMQ.addListener === "function") {
        prefersDarkMQ.addListener(onSystemChange);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* --- opcjonalne mini-API (debug / integracja) ---
     window.ProPlastTheme.set('dark'|'light'), .toggle(), .reset() (wraca do systemu) */
  window.ProPlastTheme = {
    get: currentTheme,
    set: function (theme) {
      var t = theme === DARK ? DARK : LIGHT;
      applyTheme(t);
      writeStored(t);
      syncButton(document.getElementById("themeToggle"), t);
    },
    toggle: function () {
      var next = currentTheme() === DARK ? LIGHT : DARK;
      applyTheme(next);
      writeStored(next);
      syncButton(document.getElementById("themeToggle"), next);
    },
    reset: function () {
      clearStored();
      var t = systemTheme();
      applyTheme(t);
      syncButton(document.getElementById("themeToggle"), t);
    }
  };
})();
