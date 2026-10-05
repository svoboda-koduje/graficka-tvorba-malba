# Malba – Grafická tvorba, 2. ročník

Interaktivní výukový web pro předmět **Grafická tvorba** ve 2. ročníku oboru 18-20-M/01 Informační technologie – Počítačová grafika na SPŠE a VOŠ Pardubice (školní rok 2026/27, třída 2.G). Vzhled a hlavička vycházejí z webu *Základy kresby* pro 1. ročník.

Web je statický (HTML + CSS + JavaScript bez knihoven a bez sestavování), takže funguje přímo na **GitHub Pages**.

## Obsah (podle tematického plánu INF_PG_2_GT_2026-27_SVO)

| Záložka | Blok / hodiny | Interaktivní prvek |
|---|---|---|
| Úvod | plán, dvě pololetí, povinné pomůcky, tablety, hodnocení, odkazy | – |
| 01 Barva a akvarel | blok 1, úvod | akvarelová laboratoř (simulace vody a pigmentu: mokré do mokrého, lazura) |
| 02 Teplé × studené, světlé × tmavé | blok 1, 3 + 3 h | barevný kruh, míchání vodovek, tónový hledáček (i pro vlastní fotku), hra se světlostí |
| 03 Zátiší a draperie | blok 1, 3 + 3 h | animace malby geometrického zátiší po vrstvách |
| 04 Portrét | blok 2, 6 h | kroková ukázka vyučujícího, míchání tělových barev |
| 05 Figura | blok 2, 6 h | interaktivní kánon postavy s kontrapostem |
| 06 Kompozice a krajina | blok 2, 6 h | kompoziční hledáček (třetiny, zlatý řez, diagonály, výřez A3) |
| 07 Tablet, A3 a export CMYK | blok 3 | kalkulačka rozlišení, návody Photoshop / Sketchbook / vlastní tablet (A3, 300 DPI, JPEG CMYK Coated FOGRA39), generátor názvu souboru, kontrolní seznam |
| 08 Architektura a doprava | blok 3, 6 + 6 h | perspektivní mřížka (1, 2, 3 úběžníky) |
| 09 Charakter postavy | blok 3, 6 h | generátor zadání postavy |
| 10 Komiksový strip | blok 3, 6 h | šablona políček A3 ke stažení (PNG 3508 × 4961 px, 300 DPI) |
| 11 Dějiny umění | blok 4, 15 × 3 h | odkazy na web Časová osa dějin umění |
| Další techniky | nad rámec | srovnání technik, pomocník pro výběr techniky |
| Videa | přehled | 62 videotutoriálů s filtrem ruční / digitální malba |

Záložky se přepínají přes adresu (`#akvarel`, `#digital` …), lze odkázat i na část etapy (např. `#digital-navody`).

## Struktura souborů

```
index.html                 – celý obsah webu (všechny záložky)
assets/css/styl.css        – vzhled (převzatý z 1. ročníku + doplňky pro malbu)
assets/js/data.js          – galerie obrázků, videa a kvízy (snadno upravitelné)
assets/js/app.js           – záložky, menu, galerie, lightbox, videa, kvízy, animace
assets/js/interaktivni.js  – interaktivní laboratoře jednotlivých etap
img/<etapa>/*.webp         – obrázky v plné velikosti (max. 1600 px)
img/<etapa>/nahled/*.webp  – náhledy do galerií (max. 640 px)
img/logo-spse*.png         – logo školy
.nojekyll                  – vypne zpracování Jekyllem na GitHub Pages
```

## Zveřejnění na GitHub Pages

1. Na GitHubu vytvořte nový veřejný repozitář, např. `graficka-tvorba-malba`.
2. Nahrajte **obsah této složky** (ne složku samotnou) do kořene repozitáře – nejpohodlněji přes **GitHub Desktop** (webové rozhraní nahraje najednou nejvýše 100 souborů).
3. **Settings → Pages** → Deploy from a branch → `main` / `(root)`.
4. Web poběží na `https://svoboda-koduje.github.io/graficka-tvorba-malba/`.

## Úpravy

- **Přidat obrázek:** WebP do `img/<etapa>/` a náhled do `img/<etapa>/nahled/`, pak záznam do `window.GALERIE` v `assets/js/data.js`.
- **Přidat video:** záznam do `window.VIDEA` v `assets/js/data.js` – stačí ID z YouTube, název a český popis.
- **Upravit kvíz:** `window.KVIZY` (`a` je index správné odpovědi od nuly).

## Před zveřejněním zkontrolujte

- **Videa** byla vybrána z výsledků vyhledávání; při tvorbě webu nebylo možné je jednotlivě přehrát. Proklikejte je prosím a nefunkční nahraďte.
- **Autorská práva:** obrázky pocházejí z výukových podkladů vyučujícího (malby z internetu, předlohy portrétů, stripy Dana Černého). Před veřejným zveřejněním je vhodné ověřit autorství, doplnit jména autorů do popisků, případně obrázky nahradit vlastními nebo žákovskými pracemi.
- Do webu **záměrně nejsou zařazeny**: fotografie žáků (předlohy portrétů – zůstávají jen na OneDrive), naskenované stránky učebnic a knih (Akvarelové skici, Creating Stylized Characters), bakalářské práce o digitální malbě a matte paintingu, vektorové portréty celebrit, obal hry Red Dead Redemption 2 a videa MP4 (na GitHub jsou příliš velká – jsou odkázaná ve sdílené složce). Soubor *Zátiší_s_nádobami.jpg* je poškozený a nešel načíst.
- Názvy nabídek ve Sketchbooku se mohou podle verze aplikace a jazyka tabletu mírně lišit.
