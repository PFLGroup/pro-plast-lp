# Pro-Plast — Okna i Drzwi Białystok (strona wielostronicowa)

Statyczna witryna (HTML + CSS + vanilla JS) generowana ze źródeł w `_build/`.
Wielojęzyczna: **PL / EN / UK / DE** (osobne URL-e + `hreflang`). Motyw **jasny i ciemny** (przełącznik).
Wykonanie: **PFL Group**.

🔗 Podgląd: https://pflgroup.github.io/pro-plast-lp/

## Struktura zakładek (8 + strona główna)
`/` · `/okna/` · `/drzwi/` · `/parapety/` · `/zaluzje/` · `/moskitiery/` · `/rolety/` · `/bramy-garazowe/` · `/kontakt/`
(oraz `/en/…`, `/uk/…`, `/de/…`)

## SEO
- Per-strona: `<title>`, meta description, canonical, `hreflang` (PL/EN/UK/DE + x-default), Open Graph.
- Dane strukturalne JSON-LD: LocalBusiness, BreadcrumbList, Service.
- `sitemap.xml` (z alternatywami językowymi) + `robots.txt`.
- Hierarchia nagłówków H1→H4. Pliki grafik nazwane pod SEO (np. `okna-pcv-bialystok-salon-trzyszybowe.jpg`).

## ⚠️ Do uzupełnienia przed produkcją
1. **Cookiebot** — w `_build/build.js` ustaw `COOKIEBOT_ID` na ID z Twojego konta Cookiebot (Domain Group ID), potem przebuduj. Obecnie jest placeholder `PASTE-COOKIEBOT-DOMAIN-GROUP-ID`.
2. **Formularz** — w `_build/main.js` ustaw `FORM_ENDPOINT` (Formspree/Basin/Netlify), powiadomienia na `okna@pro-plast.com.pl`.
3. **Godziny otwarcia** — uzupełnij w `_build/build.js` (`UI.<lang>.hoursVal`).
4. **Własna domena** `pro-plast.com.pl` — w `_build/build.js` ustaw `BASE = ""` i `HOST = "https://pro-plast.com.pl"`, przebuduj, w GitHub Pages dodaj Custom domain + plik CNAME, ustaw DNS (A: 185.199.108–111.153, CNAME `www` → pflgroup.github.io).
5. **Logo** — tekstowy wordmark `PRO·PLAST` można podmienić na oficjalny plik klienta.

## Budowanie
```
node _build/build.js
```
Treści: `_build/content/<lang>/<slug>.json`. Style: `_build/style.base.css` + `style.add.css` + `theme-dark.css`. JS: `main.js`, `theme-toggle.js`.

---
© 2026 Copyright by [PFL Group](https://www.pflgroup.pl/). Wszelkie prawa zastrzeżone.
Treści autorskie; zdjęcia poglądowe. Marka i dane: Pro-Plast, ul. Św. Rocha 13/15, Białystok.
