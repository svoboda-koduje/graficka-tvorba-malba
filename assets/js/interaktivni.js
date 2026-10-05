/* =====================================================================
   Malba – interaktivní ukázky jednotlivých etap
   (akvarelová laboratoř, míchání barev, barevný kruh, tónový hledáček,
   tělové barvy, kánon postavy, kompoziční hledáček, kalkulačka rozlišení,
   perspektivní mřížka, generátor postavy, komiksová šablona, volba techniky)
   ===================================================================== */
(function(){
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ulozit = {
  get(k, d){ try { const v = localStorage.getItem("malba2:" + k); return v === null ? d : JSON.parse(v); } catch(_) { return d; } },
  set(k, v){ try { localStorage.setItem("malba2:" + k, JSON.stringify(v)); } catch(_) {} }
};

/* spustí init jen jednou, až je panel poprvé vidět (kvůli rozměrům plátna) */
const cekajici = {};
function naPanel(id, fn){ (cekajici[id] = cekajici[id] || []).push(fn); }
document.addEventListener("panel:show", e => {
  const id = e.detail, f = cekajici[id]; if (!f) return;
  delete cekajici[id];
  requestAnimationFrame(() => f.forEach(fn => { try { fn(); } catch(err) { console.error(err); } }));
});

/* plátno přizpůsobené šířce rodiče (HiDPI) */
function platno(cv, vyskaFn, onResize){
  const ctx = cv.getContext("2d");
  const st = {w: 0, h: 0, dpr: 1, ctx};
  let prvni = true;
  function nastav(volat){
    const r = cv.parentElement.getBoundingClientRect();
    const w = Math.max(240, Math.round(r.width)), h = Math.round(vyskaFn(w));
    if (w !== st.w || h !== st.h){
      st.dpr = Math.min(devicePixelRatio || 1, 2); st.w = w; st.h = h;
      cv.width = w * st.dpr; cv.height = h * st.dpr; cv.style.width = w + "px"; cv.style.height = h + "px";
      ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
    } else if (!prvni || !volat) return;
    if (!volat) return;
    prvni = false;
    if (onResize) onResize(st);
  }
  nastav(false);                                            // rozměry hned, překreslení až po vrácení st
  new ResizeObserver(() => nastav(true)).observe(cv.parentElement);
  return st;
}
function bodUdalosti(cv, e){ const r = cv.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; }

/* ---------- Barevný model: subtraktivní míchání přes absorbanci ---------- */
const hex2rgb = h => { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const rgb2hex = c => "#" + c.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");
const absorb = rgb => rgb.map(v => -Math.log(clamp(v / 255, .035, 1)));
const PAPIR = [251, 248, 240];
/* složky = [{rgb, mnozstvi}], voda 0..1 → výsledná barva na bílém papíře */
function michej(slozky, voda){
  const celk = slozky.reduce((s, x) => s + x.mnozstvi, 0);
  if (!celk) return PAPIR.slice();
  const A = [0, 0, 0];
  slozky.forEach(x => { const a = absorb(x.rgb); for (let c = 0; c < 3; c++) A[c] += a[c] * x.mnozstvi / celk; });
  const sila = 1.15 * Math.pow(1 - clamp(voda, 0, .97), 1.25);
  return PAPIR.map((p, c) => p * Math.exp(-A[c] * sila));
}
// relativní jas (pro převod do šedi) a světlost L*
const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
const jas = rgb => .2126 * lin(rgb[0]) + .7152 * lin(rgb[1]) + .0722 * lin(rgb[2]);
const Lstar = rgb => { const Y = jas(rgb); return Y > .008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y; };
const sedaHex = rgb => { const L = Lstar(rgb); const Y = L > 8 ? Math.pow((L + 16) / 116, 3) : L / 903.3; const s = Y <= .0031308 ? 12.92 * Y : 1.055 * Math.pow(Y, 1 / 2.4) - .055; const v = Math.round(s * 255); return rgb2hex([v, v, v]); };
function rgb2hsl(r, g, b){
  r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn){ const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s, l];
}

/* Školní vodovky – přibližné barvy pigmentů */
const VODOVKY = [
  {n: "citronová žlutá", c: "#F4E04D"}, {n: "žlutá", c: "#F5B921"}, {n: "oranžová", c: "#EC7A22"},
  {n: "rumělka (červená)", c: "#D93A2B"}, {n: "karmín", c: "#A8193F"}, {n: "fialová", c: "#6A3B8F"},
  {n: "ultramarín", c: "#2C3E9E"}, {n: "azurová (pruská) modř", c: "#1665A8"}, {n: "zelená", c: "#23824B"},
  {n: "světle zelená", c: "#7DB443"}, {n: "okr", c: "#C48A35"}, {n: "hnědá (sépie)", c: "#6B4122"}, {n: "černá", c: "#262626"}
];
function vykresliPaletu(el, vybrano, onPick){
  el.innerHTML = VODOVKY.map((p, i) => `<button type="button" style="background:${p.c}" title="${p.n}" aria-label="${p.n}" aria-pressed="${i === vybrano}" data-i="${i}"></button>`).join("");
  el.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; $$("button", el).forEach(x => x.setAttribute("aria-pressed", x === b)); onPick(+b.dataset.i); });
}

/* =====================================================================
   1) AKVARELOVÁ LABORATOŘ – simulace vody a pigmentu na papíře
   ===================================================================== */
naPanel("akvarel", function akvarel(){
  const cv = $("#cv-akv"); if (!cv) return;
  const CELL = 3;
  let GW = 0, GH = 0, wet, pw, pd, tex, buf, img, offc, octx;
  let barva = 6, nastroj = "barva", aktivni = false, smyckaBezi = false, posledni = null;
  const rVoda = $("#r-akv-voda"), rVel = $("#r-akv-vel"), out = $("#akv-readout");
  vykresliPaletu($("#akv-paleta"), barva, i => { barva = i; nastroj = "barva"; nastavNastroj(); });
  function alokuj(st){
    const nGW = Math.ceil(st.w / CELL), nGH = Math.ceil(st.h / CELL);
    const stare = wet ? {GW, GH, wet, pw, pd} : null;
    GW = nGW; GH = nGH; const N = GW * GH;
    wet = new Float32Array(N); pw = new Float32Array(N * 3); pd = new Float32Array(N * 3); tex = new Float32Array(N);
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++){
      const n = Math.sin(x * 1.7 + y * .3) * Math.cos(y * 1.3 - x * .2) * .5 + Math.random() * .9;
      tex[y * GW + x] = .965 + n * .03;
    }
    if (stare){ for (let y = 0; y < Math.min(GH, stare.GH); y++) for (let x = 0; x < Math.min(GW, stare.GW); x++){ const a = y * GW + x, b = y * stare.GW + x; wet[a] = stare.wet[b]; for (let c = 0; c < 3; c++){ pw[a * 3 + c] = stare.pw[b * 3 + c]; pd[a * 3 + c] = stare.pd[b * 3 + c]; } } }
    offc = document.createElement("canvas"); offc.width = GW; offc.height = GH; octx = offc.getContext("2d");
    img = octx.createImageData(GW, GH); buf = img.data;
    vykresli(); popis();
  }
  const st = platno(cv, w => Math.min(460, Math.max(300, w * .55)), alokuj);
  function nastavNastroj(){ $$("[data-akv-nastroj]").forEach(b => b.setAttribute("aria-pressed", b.dataset.akvNastroj === nastroj)); popis(); }
  $$("[data-akv-nastroj]").forEach(b => b.addEventListener("click", () => { nastroj = b.dataset.akvNastroj; nastavNastroj(); }));
  function popis(){
    if (!wet) return;
    let mokro = 0; for (let i = 0; i < wet.length; i += 7) if (wet[i] > .08) mokro++;
    const podil = mokro / (wet.length / 7);
    const v = +rVoda.value;
    $("#o-akv-voda").textContent = v < .3 ? "hustá barva" : v < .65 ? "středně ředěná" : "hodně vody";
    $("#o-akv-vel").textContent = rVel.value + " px";
    out.innerHTML = nastroj === "voda"
      ? "<b>Čistá voda:</b> navlhčete papír a pak do mokré plochy vpusťte barvu – rozlije se do měkkých okrajů (<i>mokré do mokrého</i>)."
      : podil > .02
        ? `<b>Papír je ještě mokrý</b> (${Math.round(podil * 100)} % plochy). Barva se do vlhkých míst rozpije. Chcete-li ostré okraje nebo <i>lazuru</i>, nechte vrstvu zaschnout.`
        : "<b>Papír je suchý:</b> tahy mají ostré okraje (<i>mokré do suchého</i>). Vrstva přes zaschlou barvu je <i>lazura</i> – spodní barva prosvítá.";
  }
  function stetec(px, py){
    const r = +rVel.value / CELL, v = +rVoda.value;
    const gx = px / CELL, gy = py / CELL;
    const A = absorb(hex2rgb(VODOVKY[barva].c));
    const konc = nastroj === "voda" ? 0 : (1 - v * .86) * .55;
    const x0 = Math.max(0, Math.floor(gx - r)), x1 = Math.min(GW - 1, Math.ceil(gx + r));
    const y0 = Math.max(0, Math.floor(gy - r)), y1 = Math.min(GH - 1, Math.ceil(gy + r));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){
      const d = Math.hypot(x - gx, y - gy) / r; if (d > 1) continue;
      const i = y * GW + x, f = (1 - d * d) * (.75 + Math.random() * .25);
      const pridanaVoda = (.35 + v * .65) * f * .55;
      wet[i] = Math.min(1.4, wet[i] + pridanaVoda);
      if (konc) for (let c = 0; c < 3; c++) pw[i * 3 + c] = Math.min(6, pw[i * 3 + c] + A[c] * konc * f * .5);
    }
    spust();
  }
  function krok(){
    const N = GW * GH; let zbyva = false;
    // difuze vody a pigmentu mezi mokrými buňkami
    for (let pass = 0; pass < 2; pass++){
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++){
        const i = y * GW + x; const wi = wet[i]; if (wi < .03) continue;
        const sous = [x + 1 < GW ? i + 1 : -1, y + 1 < GH ? i + GW : -1];
        for (const j of sous){
          if (j < 0) continue; const wj = wet[j];
          if (wj < .03 && wi < .5) continue;                // na suchý papír barva neteče (ostrý okraj)
          const k = wj < .03 ? .02 : .11 * Math.min(wi, wj) / (Math.min(wi, wj) + .25);
          const dw = (wi - wj) * k; wet[i] -= dw; wet[j] += dw;
          for (let c = 0; c < 3; c++){
            const ci = pw[i * 3 + c] / (wi + .05), cj = pw[j * 3 + c] / (wj + .05);
            const dp = (ci - cj) * k * .55 * Math.min(wi, wj + .05);
            pw[i * 3 + c] -= dp; pw[j * 3 + c] += dp;
          }
        }
      }
    }
    // odpařování, usazování pigmentu, ztmavení okrajů
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++){
      const i = y * GW + x; let w = wet[i];
      if (w <= 0 && pw[i * 3] + pw[i * 3 + 1] + pw[i * 3 + 2] === 0) continue;
      const okraj = (x > 0 && wet[i - 1] < .02) || (x < GW - 1 && wet[i + 1] < .02) || (y > 0 && wet[i - GW] < .02) || (y < GH - 1 && wet[i + GW] < .02);
      const odpar = okraj ? .0075 : .0042;
      w = Math.max(0, w - odpar); wet[i] = w;
      const dep = w <= 0 ? 1 : (okraj ? .05 : .012) * (2 - tex[i]);
      for (let c = 0; c < 3; c++){ const p = pw[i * 3 + c] * dep; pw[i * 3 + c] -= p; pd[i * 3 + c] += p * (okraj && w > 0 ? 1.08 : 1); }
      if (w > 0) zbyva = true;
    }
    return zbyva;
  }
  function vykresli(){
    if (!buf) return;
    for (let i = 0, N = GW * GH; i < N; i++){
      const t = tex[i], w = wet[i], o = i * 4;
      for (let c = 0; c < 3; c++){
        const A = pd[i * 3 + c] + pw[i * 3 + c] * .92;
        buf[o + c] = PAPIR[c] * t * Math.exp(-A) * (w > .05 ? .975 : 1);
      }
      buf[o + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    const ctx = st.ctx; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, st.w, st.h); ctx.drawImage(offc, 0, 0, GW * CELL, GH * CELL);
  }
  let snimek = 0;
  function spust(){ if (smyckaBezi) return; smyckaBezi = true; requestAnimationFrame(smycka); }
  function smycka(){
    const dalsi = krok(); vykresli(); if (++snimek % 15 === 0) popis();
    if (dalsi || aktivni) requestAnimationFrame(smycka); else { smyckaBezi = false; popis(); }
  }
  cv.addEventListener("pointerdown", e => { aktivni = true; cv.setPointerCapture(e.pointerId); posledni = bodUdalosti(cv, e); stetec(posledni.x, posledni.y); });
  cv.addEventListener("pointermove", e => {
    if (!aktivni) return; const p = bodUdalosti(cv, e);
    const d = Math.hypot(p.x - posledni.x, p.y - posledni.y), krokPx = Math.max(2, +rVel.value * .35);
    for (let s = krokPx; s <= d; s += krokPx){ const t = s / d; stetec(posledni.x + (p.x - posledni.x) * t, posledni.y + (p.y - posledni.y) * t); }
    if (d >= krokPx) posledni = p;
  });
  const konec = () => { aktivni = false; };
  cv.addEventListener("pointerup", konec); cv.addEventListener("pointercancel", konec);
  rVoda.addEventListener("input", popis); rVel.addEventListener("input", popis);
  $("#akv-vysusit").addEventListener("click", () => { for (let i = 0; i < wet.length; i++){ wet[i] = 0; for (let c = 0; c < 3; c++){ pd[i * 3 + c] += pw[i * 3 + c]; pw[i * 3 + c] = 0; } } vykresli(); popis(); });
  $("#akv-novy").addEventListener("click", () => { wet.fill(0); pw.fill(0); pd.fill(0); vykresli(); popis(); });
  // ukázka: automaticky namaluje tři pruhy (suché, mokré, lazura)
  $("#akv-ukazka").addEventListener("click", () => {
    wet.fill(0); pw.fill(0); pd.fill(0);
    const pruh = (y, w, b, vody, tool) => { const pb = barva, pv = rVoda.value, pt = nastroj; barva = b; rVoda.value = vody; nastroj = tool;
      for (let x = st.w * .06; x < st.w * .94; x += 4) stetec(x, y + Math.sin(x / 40) * 4); barva = pb; rVoda.value = pv; nastroj = pt; };
    const h = st.h;
    pruh(h * .2, 1, 6, .55, "barva");                                   // mokré do suchého
    pruh(h * .5, 1, 0, .5, "voda"); pruh(h * .5, 1, 3, .5, "barva");   // mokré do mokrého (nejdřív voda)
    pruh(h * .8, 1, 0, .6, "barva");
    setTimeout(() => { $("#akv-vysusit").click(); pruh(h * .8, 1, 7, .62, "barva"); }, 900);  // lazura modrou přes žlutou
    popis();
  });
  nastavNastroj(); vykresli();
});

/* =====================================================================
   2) MÍCHÁNÍ DVOU BAREV (etapa Barvy)
   ===================================================================== */
naPanel("barvy", function mixer(){
  const root = $("#lab-mix"); if (!root) return;
  let a = 6, b = 2;
  const rPomer = $("#r-mix-pomer"), rVoda = $("#r-mix-voda");
  vykresliPaletu($("#mix-a"), a, i => { a = i; aktualizuj(); });
  vykresliPaletu($("#mix-b"), b, i => { b = i; aktualizuj(); });
  function aktualizuj(){
    const p = +rPomer.value, v = +rVoda.value;
    const ra = hex2rgb(VODOVKY[a].c), rb = hex2rgb(VODOVKY[b].c);
    const vys = michej([{rgb: ra, mnozstvi: 1 - p}, {rgb: rb, mnozstvi: p}], v);
    $("#mix-blob").style.background = rgb2hex(vys);
    $("#mix-blob-seda").style.background = sedaHex(vys);
    $("#o-mix-pomer").textContent = `${Math.round((1 - p) * 100)} : ${Math.round(p * 100)}`;
    $("#o-mix-voda").textContent = v < .3 ? "málo" : v < .65 ? "středně" : "hodně";
    // stupnice ředění
    $("#mix-skala").innerHTML = [.1, .3, .5, .7, .88].map(w => { const c = michej([{rgb: ra, mnozstvi: 1 - p}, {rgb: rb, mnozstvi: p}], w); return `<div class="swatch" style="background:${rgb2hex(c)}">${Math.round(w * 100)} %</div>`; }).join("");
    const ha = rgb2hsl(...ra)[0], hb = rgb2hsl(...rb)[0];
    const rozdil = Math.min(Math.abs(ha - hb), 360 - Math.abs(ha - hb));
    let t = `<b>${VODOVKY[a].n} + ${VODOVKY[b].n}</b>. `;
    if (a === b) t += "Stejná barva – měníte jen sytost ředěním vodou.";
    else if (VODOVKY[a].n === "černá" || VODOVKY[b].n === "černá") t += "Černá barvu rychle „zašpiní“. Na stíny raději míchejte doplňkové barvy – stín bude živější.";
    else if (rozdil > 130) t += "Barvy leží v kruhu <b>proti sobě</b> (doplňkové) – navzájem se ztlumí do šedé nebo hnědé. Hodí se na stíny a na zklidnění křiklavé barvy.";
    else if (rozdil < 50) t += "Barvy jsou v kruhu <b>blízko sebe</b> – výsledek zůstane čistý a sytý (harmonická, příbuzná barevnost).";
    else t += "Vzniká <b>sekundární nebo lomená</b> barva. Čím vzdálenější barvy v kruhu, tím je výsledek méně sytý.";
    $("#mix-popis").innerHTML = t;
  }
  rPomer.addEventListener("input", aktualizuj); rVoda.addEventListener("input", aktualizuj);
  aktualizuj();
});

/* =====================================================================
   3) BAREVNÝ KRUH (etapa Barvy)
   ===================================================================== */
naPanel("barvy", function kruh(){
  const svg = $("#svg-kruh"); if (!svg) return;
  const K = [
    {n: "žlutá", c: "#F7D417", t: "P", tep: "teplá"}, {n: "žlutooranžová", c: "#F5A81C", t: "T", tep: "teplá"},
    {n: "oranžová", c: "#EE7A1E", t: "S", tep: "teplá"}, {n: "červenooranžová", c: "#E2502A", t: "T", tep: "teplá"},
    {n: "červená", c: "#D22B2B", t: "P", tep: "teplá"}, {n: "červenofialová", c: "#A8235E", t: "T", tep: "přechodová"},
    {n: "fialová", c: "#6E3290", t: "S", tep: "studená"}, {n: "modrofialová", c: "#45399B", t: "T", tep: "studená"},
    {n: "modrá", c: "#2350A8", t: "P", tep: "studená"}, {n: "modrozelená", c: "#13858E", t: "T", tep: "studená"},
    {n: "zelená", c: "#2E9446", t: "S", tep: "studená"}, {n: "žlutozelená", c: "#94BE2C", t: "T", tep: "přechodová"}
  ];
  const cx = 210, cy = 210, R1 = 196, R0 = 96;
  const arc = (i, r0, r1) => { const a0 = (i * 30 - 105) * Math.PI / 180, a1 = ((i + 1) * 30 - 105) * Math.PI / 180;
    const p = (r, a) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
    return `M${p(r0, a0)} L${p(r1, a0)} A${r1} ${r1} 0 0 1 ${p(r1, a1)} L${p(r0, a1)} A${r0} ${r0} 0 0 0 ${p(r0, a0)}Z`; };
  svg.innerHTML = K.map((k, i) => `<path d="${arc(i, R0, R1)}" fill="${k.c}" stroke="#fff" stroke-width="3" data-i="${i}" tabindex="0" role="button" aria-label="${k.n}"><title>${k.n}</title></path>`).join("") +
    K.map((k, i) => { const a = (i * 30 - 90) * Math.PI / 180; return `<text x="${cx + 172 * Math.cos(a)}" y="${cy + 172 * Math.sin(a) + 5}" text-anchor="middle" style="font:700 14px var(--cond);fill:#fff;pointer-events:none">${k.t}</text>`; }).join("") +
    `<circle cx="${cx}" cy="${cy}" r="${R0 - 8}" fill="#FFFDF8" stroke="rgba(0,0,0,.08)"/><text id="kruh-nazev" x="${cx}" y="${cy - 4}" text-anchor="middle" style="font:700 22px var(--cond);fill:var(--ink)"></text><text id="kruh-sub" x="${cx}" y="${cy + 20}" text-anchor="middle" style="font:500 13px var(--font);fill:var(--ink-soft)"></text>`;
  let rezim = "dopl", vyb = 0;
  const cesty = $$("path", svg);
  function aktualizuj(){
    let sada = [vyb], text = "";
    const k = K[vyb];
    if (rezim === "dopl"){ sada = [vyb, (vyb + 6) % 12]; text = `<b>Doplňková dvojice:</b> ${k.n} + ${K[(vyb + 6) % 12].n}. Leží proti sobě – vedle sebe se navzájem rozzáří (simultánní kontrast), smíchané se ztlumí do šedé.`; }
    if (rezim === "pribuz"){ sada = [(vyb + 11) % 12, vyb, (vyb + 1) % 12]; text = `<b>Příbuzné (analogické) barvy:</b> ${K[(vyb + 11) % 12].n}, ${k.n}, ${K[(vyb + 1) % 12].n}. Sousedé v kruhu tvoří klidnou, harmonickou barevnost.`; }
    if (rezim === "triada"){ sada = [vyb, (vyb + 4) % 12, (vyb + 8) % 12]; text = `<b>Triáda:</b> ${k.n}, ${K[(vyb + 4) % 12].n}, ${K[(vyb + 8) % 12].n}. Tři barvy ve stejné vzdálenosti – pestré, ale vyvážené. Jedna by měla převládat.`; }
    if (rezim === "teplota"){ sada = K.map((x, i) => i).filter(i => K[i].tep === k.tep); text = `<b>${k.n[0].toUpperCase() + k.n.slice(1)}</b> je ${k.tep === "přechodová" ? "na rozhraní teplých a studených barev – podle okolí působí jednou tepleji, jindy chladněji" : k.tep + " barva"}. ${k.tep === "teplá" ? "Teplé barvy opticky vystupují dopředu, působí energicky a blízko." : k.tep === "studená" ? "Studené barvy ustupují do dálky – proto modrají vzdálené hory (vzdušná perspektiva)." : ""}`; }
    cesty.forEach((p, i) => { p.classList.toggle("dim", !sada.includes(i)); p.classList.toggle("sel", i === vyb); });
    $("#kruh-nazev").textContent = k.n; $("#kruh-sub").textContent = {P: "primární", S: "sekundární", T: "terciární"}[k.t] + " · " + k.tep;
    $("#kruh-readout").innerHTML = text;
  }
  svg.addEventListener("click", e => { const p = e.target.closest("path"); if (!p) return; vyb = +p.dataset.i; aktualizuj(); });
  svg.addEventListener("keydown", e => { const p = e.target.closest("path"); if (p && (e.key === "Enter" || e.key === " ")){ e.preventDefault(); vyb = +p.dataset.i; aktualizuj(); } });
  $$("[data-kruh]").forEach(b => b.addEventListener("click", () => { rezim = b.dataset.kruh; $$("[data-kruh]").forEach(x => x.setAttribute("aria-pressed", x === b)); aktualizuj(); }));
  aktualizuj();
});

/* =====================================================================
   4) TÓNOVÝ HLEDÁČEK – šeď, posterizace, teplé × studené (etapa Barvy)
   ===================================================================== */
naPanel("barvy", function hledacekTonu(){
  const cv = $("#cv-tony"); if (!cv) return;
  const sel = $("#tony-obr"), file = $("#tony-soubor"), rDel = $("#r-tony-del");
  const vzory = (window.GALERIE.barvy || []).filter(g => /\/(st|ts)-/.test(g.src));
  sel.innerHTML = vzory.map((g, i) => `<option value="${i}">${g.cap.split(" – ")[0]}</option>`).join("");
  let obr = new Image(), rezim = "seda", zpracovane = null;
  const st = platno(cv, w => Math.min(520, Math.max(300, w * .72)), () => kresli());
  function zpracuj(){
    if (!obr.naturalWidth) return;
    const sc = Math.min(1, 900 / Math.max(obr.naturalWidth, obr.naturalHeight));
    const w = Math.round(obr.naturalWidth * sc), h = Math.round(obr.naturalHeight * sc);
    const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d");
    x.drawImage(obr, 0, 0, w, h);
    const zdroj = x.getImageData(0, 0, w, h), d = zdroj.data, v = x.createImageData(w, h), o = v.data;
    let tepla = 0, studena = 0;
    for (let i = 0; i < d.length; i += 4){
      const rgb = [d[i], d[i + 1], d[i + 2]], L = Lstar(rgb);
      let r, g, b;
      if (rezim === "seda"){ const s = parseInt(sedaHex(rgb).slice(1, 3), 16); r = g = b = s; }
      else if (rezim === "t3" || rezim === "t5"){
        const n = rezim === "t3" ? 3 : 5, k = Math.min(n - 1, Math.floor(L / 100 * n));
        const s = Math.round(30 + k / (n - 1) * 215); r = g = b = s;
      } else {
        const [hh, ss, ll] = rgb2hsl(...rgb);
        if (ss < .12 || ll < .08 || ll > .95){ const s = Math.round(140 + ll * 80); r = g = b = s; }
        else if (hh < 75 || hh >= 330){ r = 222; g = 112; b = 52; tepla++; }
        else if (hh >= 150 && hh < 290){ r = 52; g = 108; b = 196; studena++; }
        else { r = g = b = 175; }
      }
      o[i] = r; o[i + 1] = g; o[i + 2] = b; o[i + 3] = 255;
    }
    x.putImageData(v, 0, 0);
    const orig = document.createElement("canvas"); orig.width = w; orig.height = h; orig.getContext("2d").drawImage(obr, 0, 0, w, h);
    zpracovane = {c, orig, w, h, tepla, studena};
    const r = $("#tony-readout");
    if (rezim === "seda") r.innerHTML = "<b>Odstíny šedi:</b> vidíte jen světlost. Je v obraze nejsvětlejší i nejtmavší tón? Neslévá se motiv s pozadím?";
    if (rezim === "t3") r.innerHTML = "<b>Tři tóny</b> – světlý, střední, tmavý. Dobrý obraz je čitelný i takhle zjednodušený. Tak plánujte i svou malbu.";
    if (rezim === "t5") r.innerHTML = "<b>Pět tónů</b> – stupnice, kterou máte namalovat ve cvičení se světlými a tmavými tóny.";
    if (rezim === "teplota"){ const s = tepla + studena || 1; r.innerHTML = `<b>Teplé × studené:</b> oranžově teplé, modře studené, šedě neutrální plochy. Poměr přibližně <b>${Math.round(tepla / s * 100)} % teplých</b> a <b>${Math.round(studena / s * 100)} % studených</b> barevných ploch.`; }
    kresli();
  }
  function kresli(){
    const ctx = st.ctx; ctx.clearRect(0, 0, st.w, st.h);
    if (!zpracovane) return;
    const {c, orig, w, h} = zpracovane, sc = Math.min(st.w / w, st.h / h), dw = w * sc, dh = h * sc, ox = (st.w - dw) / 2, oy = (st.h - dh) / 2;
    const del = +rDel.value;
    ctx.drawImage(orig, ox, oy, dw, dh);
    ctx.save(); ctx.beginPath(); ctx.rect(ox + dw * del, oy, dw * (1 - del), dh); ctx.clip(); ctx.drawImage(c, ox, oy, dw, dh); ctx.restore();
    const lx = ox + dw * del;
    ctx.fillStyle = "#fff"; ctx.fillRect(lx - 1.5, oy, 3, dh);
    ctx.beginPath(); ctx.arc(lx, oy + dh / 2, 14, 0, 7); ctx.fillStyle = "#23272D"; ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "700 14px Barlow"; ctx.textAlign = "center"; ctx.fillText("⇆", lx, oy + dh / 2 + 5);
  }
  function nacti(src){ obr = new Image(); obr.onload = zpracuj; obr.src = src; }
  sel.addEventListener("change", () => nacti(vzory[+sel.value].src));
  file.addEventListener("change", () => { const f = file.files[0]; if (!f) return; const u = URL.createObjectURL(f); obr = new Image(); obr.onload = () => { zpracuj(); URL.revokeObjectURL(u); }; obr.src = u; });
  $$("[data-tony]").forEach(b => b.addEventListener("click", () => { rezim = b.dataset.tony; $$("[data-tony]").forEach(x => x.setAttribute("aria-pressed", x === b)); zpracuj(); }));
  rDel.addEventListener("input", kresli);
  let tah = false;
  cv.addEventListener("pointerdown", e => { tah = true; cv.setPointerCapture(e.pointerId); posun(e); });
  cv.addEventListener("pointermove", e => { if (tah) posun(e); });
  cv.addEventListener("pointerup", () => tah = false);
  function posun(e){ if (!zpracovane) return; const p = bodUdalosti(cv, e); const {w, h} = zpracovane, sc = Math.min(st.w / w, st.h / h), ox = (st.w - w * sc) / 2; rDel.value = clamp((p.x - ox) / (w * sc), 0, 1); kresli(); }
  nacti(vzory[0].src);
});

/* =====================================================================
   5) HRA: seřaďte barvy podle světlosti (etapa Barvy)
   ===================================================================== */
naPanel("barvy", function hraSvetlost(){
  const root = $("#hra-svetlost"); if (!root) return;
  const zasoba = ["#F7D417", "#EE7A1E", "#D22B2B", "#A8235E", "#6E3290", "#2350A8", "#13858E", "#2E9446", "#94BE2C", "#C48A35", "#6B4122", "#E89BB0", "#8FC3E8", "#5A6B2E", "#F2C7A0"];
  const box = $(".order-game", root), sloty = $(".order-slots", root), vys = $(".hra-vysledek", root);
  let sada = [], poradi = [];
  function nova(){
    const kopie = zasoba.slice(); sada = [];
    while (sada.length < 6){ const c = kopie.splice(Math.floor(Math.random() * kopie.length), 1)[0];
      if (sada.every(s => Math.abs(Lstar(hex2rgb(s)) - Lstar(hex2rgb(c))) > 6)) sada.push(c); }
    poradi = []; box.classList.remove("gray"); sloty.classList.remove("gray"); vys.textContent = "";
    box.innerHTML = sada.map((c, i) => `<button type="button" style="background:${c}" data-i="${i}" aria-label="Barva ${i + 1}"></button>`).join("");
    sloty.innerHTML = "";
  }
  box.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || b.classList.contains("picked")) return;
    b.classList.add("picked"); poradi.push(+b.dataset.i);
    sloty.insertAdjacentHTML("beforeend", `<span style="background:${sada[+b.dataset.i]}">${poradi.length}.</span>`);
    if (poradi.length === sada.length){
      const spravne = sada.map((c, i) => i).sort((a, b) => Lstar(hex2rgb(sada[b])) - Lstar(hex2rgb(sada[a])));
      let ok = 0; poradi.forEach((p, k) => { if (p === spravne[k]) ok++; });
      box.classList.add("gray"); sloty.classList.add("gray");
      vys.innerHTML = ok === 6 ? "<b>Perfektní!</b> Odhadli jste světlost všech barev. V šedi je to vidět." : `<b>${ok} z 6</b> na správném místě. Barvy se teď zobrazují v odstínech šedi – porovnejte, jak světlé ve skutečnosti jsou. Žlutá bývá nejsvětlejší, modrá a fialová nejtmavší.`;
    }
  });
  $(".hra-nova", root).addEventListener("click", nova);
  nova();
});

/* =====================================================================
   6) TĚLOVÉ BARVY (etapa Portrét)
   ===================================================================== */
naPanel("portret", function plet(){
  const root = $("#lab-plet"); if (!root) return;
  const S = {okr: {rgb: hex2rgb("#C48A35")}, cerv: {rgb: hex2rgb("#D93A2B")}, karm: {rgb: hex2rgb("#A8193F")}, modr: {rgb: hex2rgb("#2C3E9E")}};
  const r = {okr: $("#r-plet-okr"), cerv: $("#r-plet-cerv"), karm: $("#r-plet-karm"), modr: $("#r-plet-modr"), voda: $("#r-plet-voda")};
  const RECEPTY = [
    {n: "Světlá pleť – osvětlená tvář", okr: .5, cerv: .35, karm: 0, modr: 0, voda: .86},
    {n: "Světlá pleť – polostín", okr: .55, cerv: .35, karm: .05, modr: .06, voda: .72},
    {n: "Stín pod bradou a nosem", okr: .45, cerv: .2, karm: .15, modr: .25, voda: .55},
    {n: "Tváře, rty, ušní boltce", okr: .2, cerv: .45, karm: .35, modr: 0, voda: .7},
    {n: "Tmavší pleť – světlo", okr: .6, cerv: .3, karm: .05, modr: .08, voda: .55},
    {n: "Tmavší pleť – stín", okr: .4, cerv: .2, karm: .2, modr: .3, voda: .35}
  ];
  $("#plet-recepty").innerHTML = RECEPTY.map((x, i) => `<button type="button" data-i="${i}"><i style="background:${rgb2hex(vypocti(x))}"></i>${x.n}</button>`).join("");
  $("#plet-recepty").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; const x = RECEPTY[+b.dataset.i]; Object.keys(r).forEach(k => r[k].value = x[k]); aktualizuj(); });
  function vypocti(x){ return michej(["okr", "cerv", "karm", "modr"].map(k => ({rgb: S[k].rgb, mnozstvi: +x[k]})), +x.voda); }
  function aktualizuj(){
    const x = {}; Object.keys(r).forEach(k => x[k] = +r[k].value);
    const c = vypocti(x);
    $("#plet-blob").style.background = rgb2hex(c);
    Object.keys(r).forEach(k => { const o = $("#o-plet-" + k); if (o) o.textContent = k === "voda" ? (x.voda < .4 ? "málo" : x.voda < .75 ? "středně" : "hodně") : Math.round(x[k] * 100) + " %"; });
    let t = "";
    if (x.modr > .2) t = "Modrá (doplňková k oranžové) pleťový tón <b>ztlumí a ochladí</b> – vhodné pro stíny.";
    else if (x.karm > x.okr) t = "Převaha karmínu dává <b>růžové až červené</b> tóny – pro tváře, rty a uši.";
    else if (x.voda > .8) t = "Hodně vody = <b>světlá průsvitná lazura</b>. První vrstvu na obličej malujte takhle světle.";
    else t = "Okr a červená tvoří <b>teplý základ pleti</b>. Ředěním vodou upravíte světlost.";
    $("#plet-popis").innerHTML = t;
  }
  Object.values(r).forEach(x => x.addEventListener("input", aktualizuj));
  aktualizuj();
});

/* =====================================================================
   7) KÁNON POSTAVY (etapa Figura)
   ===================================================================== */
naPanel("figura", function kanon(){
  const svg = $("#svg-kanon"); if (!svg) return;
  const rH = $("#r-kanon"), cK = $("#c-kontrapost");
  function kresli(){
    const n = +rH.value, H = 460, hl = H / n, cx = 160, top = 20;
    const kp = cK.checked ? 1 : 0;
    $("#o-kanon").textContent = String(n).replace(".", ",") + " hlav";
    const y = k => top + k * hl;                  // y po k hlavách
    const sirRam = hl * (n >= 8 ? 2.1 : n >= 7 ? 1.95 : 1.6), sirPan = hl * (n >= 8 ? 1.5 : 1.45);
    const rot = kp ? 6 : 0;
    // klíčové body (poměrně k výšce – rozkrok v polovině)
    const kRam = 1.35, kPas = n * .37, kRoz = n / 2, kKol = n * .74, kChod = n;
    let s = "";
    for (let k = 0; k <= n; k += 1) s += `<line x1="20" x2="300" y1="${y(k)}" y2="${y(k)}" stroke="#5B9BB5" stroke-width="1" stroke-dasharray="${k % 1 ? "" : "4 5"}" opacity=".6"/><text x="12" y="${y(k) + hl / 2 + 5}" style="font:700 13px var(--cond);fill:#5B9BB5">${k < Math.floor(n) ? k + 1 : ""}</text>`;
    if (n % 1) s += `<line x1="20" x2="300" y1="${y(n)}" y2="${y(n)}" stroke="#5B9BB5" stroke-dasharray="4 5" opacity=".6"/>`;
    // tělo – panák z článků
    const ramL = [cx - sirRam / 2, y(kRam) + rot], ramP = [cx + sirRam / 2, y(kRam) - rot];
    const panL = [cx - sirPan / 2 + kp * 6, y(kRoz * .93) - rot], panP = [cx + sirPan / 2 + kp * 6, y(kRoz * .93) + rot];
    const kycL = [panL[0] + sirPan * .2, panL[1] + hl * .1], kycP = [panP[0] - sirPan * .2, panP[1] + hl * .1];
    const kotnikL = kp ? [cx - hl * .05, y(n - .3)] : [kycL[0] - hl * .04, y(n - .3)];
    const kolenoL = kp ? [kycL[0] + hl * .02, y(kKol)] : [kycL[0] - hl * .02, y(kKol)];
    const kolenoP = kp ? [kycP[0] + hl * .18, y(kKol) + hl * .12] : [kycP[0] + hl * .02, y(kKol)];
    const kotnikP = kp ? [kycP[0] + hl * .42, y(n - .45)] : [kycP[0] + hl * .04, y(n - .3)];
    const hlavaX = kp ? kotnikL[0] + hl * .08 : cx;
    const loketL = [ramL[0] - hl * .12, y(kPas) + rot * .5], loketP = [ramP[0] + hl * .12, y(kPas) - rot * .5];
    const zapL = [ramL[0] - hl * .06, y(kRoz + n * .08) + rot], zapP = [ramP[0] + hl * .06, y(kRoz + n * .08) - rot];
    const clanky = [[kycL, kolenoL, hl * .34], [kolenoL, kotnikL, hl * .24], [kycP, kolenoP, hl * .34], [kolenoP, kotnikP, hl * .24],
      [ramL, loketL, hl * .22], [loketL, zapL, hl * .17], [ramP, loketP, hl * .22], [loketP, zapP, hl * .17], [[hlavaX, y(.9)], [cx, y(kRam) - hl * .1], hl * .2]];
    const car = (q, w, c) => `<line x1="${q[0][0]}" y1="${q[0][1]}" x2="${q[1][0]}" y2="${q[1][1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
    s += clanky.map(q => car(q, q[2] + 4, "#23272D")).join("");
    s += `<path d="M${ramL} L${ramP} L${panP[0] - sirPan * .05} ${y(kPas)} L${panP} L${panL} L${panL[0] + sirPan * .05} ${y(kPas)} Z" fill="#F1DDD0" stroke="#23272D" stroke-width="2" stroke-linejoin="round"/>`;
    s += clanky.map(q => car(q, q[2], "#F1DDD0")).join("");
    s += `<ellipse cx="${hlavaX}" cy="${y(.5)}" rx="${hl * .38}" ry="${hl * .5}" fill="#F1DDD0" stroke="#23272D" stroke-width="2"/>`;
    [kolenoL, kolenoP, loketL, loketP].forEach(q => s += `<circle cx="${q[0]}" cy="${q[1]}" r="${hl * .06}" fill="#B4532A" opacity=".55"/>`);
    const opora = [kotnikL[0], y(n)];
    // osy
    s += `<line x1="${ramL[0] - 20}" y1="${ramL[1] + rot * 1.2}" x2="${ramP[0] + 20}" y2="${ramP[1] - rot * 1.2}" stroke="#B4532A" stroke-width="2"/><line x1="${panL[0] - 20}" y1="${panL[1] - rot * 1.2}" x2="${panP[0] + 20}" y2="${panP[1] + rot * 1.2}" stroke="#B4532A" stroke-width="2"/>`;
    s += `<line x1="${cx}" y1="${y(kRoz)}" x2="300" y2="${y(kRoz)}" stroke="#B4532A" stroke-dasharray="3 3"/><text x="302" y="${y(kRoz) + 4}" style="font:600 15px var(--hand);fill:#B4532A">polovina = rozkrok</text>`;
    s += `<text x="${cx + sirRam / 2 + 26}" y="${y(kRam) + 4}" style="font:600 15px var(--hand);fill:#B4532A">ramena</text><text x="${cx + sirPan / 2 + 30}" y="${y(kRoz * .93) + 4}" style="font:600 15px var(--hand);fill:#B4532A">pánev</text>`;
    if (kp) s += `<line x1="${opora[0]}" y1="${y(.5)}" x2="${opora[0]}" y2="${y(kChod)}" stroke="#4E7A45" stroke-width="1.5" stroke-dasharray="6 4"/><text x="${opora[0] + 8}" y="${y(n * .85)}" style="font:600 15px var(--hand);fill:#4E7A45">těžiště nad opěrnou nohou</text>`;
    svg.innerHTML = s;
    const popis = n <= 5.5 ? "Malé dítě (asi 4 roky): velká hlava, krátké končetiny." : n <= 6.5 ? "Dítě kolem 10 let nebo stylizovaná komiksová postava." : n <= 7.6 ? "Běžný dospělý člověk – realistický kánon 7–7,5 hlavy." : n <= 8.2 ? "Akademický (ideální) kánon 8 hlav – v kresbě a malbě nejčastější." : "Heroický kánon superhrdinů a módních ilustrací – záměrně protažený.";
    $("#kanon-readout").innerHTML = `<b>${String(n).replace(".", ",")} hlav:</b> ${popis}${kp ? " <br><b>Kontrapost:</b> váha na jedné noze – pánev a ramena se naklánějí proti sobě." : ""}`;
  }
  rH.addEventListener("input", kresli); cK.addEventListener("change", kresli);
  kresli();
});

/* =====================================================================
   8) KOMPOZIČNÍ HLEDÁČEK (etapa Kompozice)
   ===================================================================== */
naPanel("kompozice", function hledacek(){
  const cv = $("#cv-hled"); if (!cv) return;
  const vzory = (window.GALERIE.kompozice || []).slice(0, 24);
  const sel = $("#hled-obr"); sel.innerHTML = vzory.map((g, i) => `<option value="${i}">${g.cap.split(" – ")[0]}</option>`).join("");
  let obr = new Image(), sit = "tretiny", pomer = 0, vel = .8, cx = .5, cy = .5, rozm = null;
  const st = platno(cv, w => Math.min(540, Math.max(300, w * .7)), () => kresli());
  const POMERY = {orig: 0, vysku: 297 / 420, sirku: 420 / 297, ctverec: 1};
  function kresli(){
    const ctx = st.ctx; ctx.clearRect(0, 0, st.w, st.h); if (!obr.naturalWidth) return;
    const sc = Math.min(st.w / obr.naturalWidth, st.h / obr.naturalHeight), w = obr.naturalWidth * sc, h = obr.naturalHeight * sc, ox = (st.w - w) / 2, oy = (st.h - h) / 2;
    ctx.drawImage(obr, ox, oy, w, h);
    const p = pomer || w / h;
    let fw = w * vel, fh = fw / p; if (fh > h * vel){ fh = h * vel; fw = fh * p; }
    if (fw > w){ fw = w; fh = fw / p; } if (fh > h){ fh = h; fw = fh * p; }
    let fx = ox + cx * w - fw / 2, fy = oy + cy * h - fh / 2;
    fx = clamp(fx, ox, ox + w - fw); fy = clamp(fy, oy, oy + h - fh);
    cx = (fx + fw / 2 - ox) / w; cy = (fy + fh / 2 - oy) / h;
    rozm = {ox, oy, w, h, fx, fy, fw, fh};
    ctx.fillStyle = "rgba(20,22,26,.6)";
    ctx.beginPath(); ctx.rect(ox, oy, w, h); ctx.rect(fx, fy, fw, fh); ctx.fill("evenodd");
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeRect(fx, fy, fw, fh);
    ctx.save(); ctx.beginPath(); ctx.rect(fx, fy, fw, fh); ctx.clip();
    ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1.4; ctx.setLineDash([]);
    const L = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
    const bod = (x, y) => { ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fillStyle = "#B4532A"; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.stroke(); };
    if (sit === "tretiny" || sit === "zlaty"){
      const f = sit === "tretiny" ? 1 / 3 : .382;
      [f, 1 - f].forEach(t => { L(fx + fw * t, fy, fx + fw * t, fy + fh); L(fx, fy + fh * t, fx + fw, fy + fh * t); });
      [f, 1 - f].forEach(a => [f, 1 - f].forEach(b => bod(fx + fw * a, fy + fh * b)));
    }
    if (sit === "diagonaly"){ L(fx, fy, fx + fw, fy + fh); L(fx + fw, fy, fx, fy + fh); ctx.setLineDash([6, 6]);
      const k = fh / fw; // kolmice z rohů (baroková diagonála)
      L(fx, fy + fh, fx + fw / (1 + k * k), fy + fh - fw / (1 + k * k) * k); L(fx + fw, fy, fx + fw - fw / (1 + k * k), fy + fw / (1 + k * k) * k); }
    if (sit === "stred"){ L(fx + fw / 2, fy, fx + fw / 2, fy + fh); L(fx, fy + fh / 2, fx + fw, fy + fh / 2); bod(fx + fw / 2, fy + fh / 2); }
    ctx.restore();
  }
  function nacti(){ obr = new Image(); obr.onload = () => { cx = .5; cy = .5; kresli(); }; obr.src = vzory[+sel.value].src; }
  sel.addEventListener("change", nacti);
  $$("[data-sit]").forEach(b => b.addEventListener("click", () => { sit = b.dataset.sit; $$("[data-sit]").forEach(x => x.setAttribute("aria-pressed", x === b)); kresli(); popis(); }));
  $$("[data-pomer]").forEach(b => b.addEventListener("click", () => { pomer = POMERY[b.dataset.pomer]; $$("[data-pomer]").forEach(x => x.setAttribute("aria-pressed", x === b)); kresli(); }));
  $("#r-hled-vel").addEventListener("input", e => { vel = +e.target.value; kresli(); });
  let tah = null;
  cv.addEventListener("pointerdown", e => { if (!rozm) return; tah = bodUdalosti(cv, e); cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", e => { if (!tah) return; const p = bodUdalosti(cv, e); cx += (p.x - tah.x) / rozm.w; cy += (p.y - tah.y) / rozm.h; tah = p; kresli(); });
  cv.addEventListener("pointerup", () => tah = null);
  function popis(){
    const t = {tretiny: "<b>Pravidlo třetin:</b> horizont na vodorovnou linii, hlavní motiv do jednoho z oranžových průsečíků. Posouvejte rámeček a hledejte nejlepší výřez.",
      zlaty: "<b>Zlatý řez</b> (≈ 0,618) je o něco blíž středu než třetiny. Působí klidně a vyváženě – využívali ho renesanční malíři.",
      diagonaly: "<b>Diagonály</b> přinášejí pohyb. Cesta, řeka nebo kmen vedený po diagonále vtáhne oko do hloubky obrazu.",
      stred: "<b>Střed</b> – motiv přesně uprostřed a horizont v polovině působí staticky. Hodí se jen pro symetrické, klidné motivy (zrcadlení na hladině)."}[sit];
    $("#hled-readout").innerHTML = t;
  }
  nacti(); popis();
});

/* =====================================================================
   9) DIGITÁLNÍ PRACOVIŠTĚ – kalkulačka, název souboru, kontrolní seznam
   ===================================================================== */
naPanel("digital", function kalkulacka(){
  const root = $("#kalk"); if (!root) return;
  const F = {A5: [148, 210], A4: [210, 297], A3: [297, 420], A2: [420, 594], B4: [250, 353]};
  const fm = $("#k-format"), ori = $("#k-orient"), dpi = $("#k-dpi"), spad = $("#k-spad"), vl = $("#k-vlastni");
  function aktualizuj(){
    let [w, h] = fm.value === "vlastni" ? [+$("#k-w").value || 0, +$("#k-h").value || 0] : F[fm.value];
    vl.hidden = fm.value !== "vlastni";
    if (ori.value === "sirku") [w, h] = [Math.max(w, h), Math.min(w, h)]; else [w, h] = [Math.min(w, h), Math.max(w, h)];
    const s = spad.checked ? 3 : 0; w += 2 * s; h += 2 * s;
    const d = +dpi.value, pw = Math.round(w / 25.4 * d), ph = Math.round(h / 25.4 * d), mp = pw * ph / 1e6;
    $("#k-px").textContent = `${pw} × ${ph}`;
    $("#k-mp").textContent = mp.toFixed(1).replace(".", ",") + " Mpx";
    $("#k-rgb").textContent = (pw * ph * 3 / 1048576).toFixed(0) + " MB";
    $("#k-cmyk").textContent = (pw * ph * 4 / 1048576).toFixed(0) + " MB";
    const kv = $("#k-kvalita");
    kv.textContent = d >= 300 ? "tisk ✓" : d >= 150 ? "jen náhled" : "jen obrazovka"; kv.className = d >= 300 ? "ok" : "warn";
    $("#k-cm").textContent = `${(w / 10).toFixed(1).replace(".", ",")} × ${(h / 10).toFixed(1).replace(".", ",")} cm`;
  }
  $$("select,input", root).forEach(x => x.addEventListener("input", aktualizuj));
  aktualizuj();
});
naPanel("digital", function nazevSouboru(){
  const root = $("#nazev"); if (!root) return;
  const bezDia = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const j = $("#n-jmeno"), p = $("#n-prijmeni"), t = $("#n-tema"), tr = $("#n-trida"), out = $("#n-out");
  const ul = ulozit.get("jmeno", {j: "", p: ""}); j.value = ul.j; p.value = ul.p;
  function aktualizuj(){
    const s = [bezDia(p.value) || "prijmeni", bezDia(j.value) || "jmeno", tr.value, t.value].join("_") + ".jpg";
    $("code", out).textContent = s; ulozit.set("jmeno", {j: j.value, p: p.value});
  }
  [j, p, t, tr].forEach(x => x.addEventListener("input", aktualizuj));
  $("button", out).addEventListener("click", () => {
    const s = $("code", out).textContent;
    (navigator.clipboard ? navigator.clipboard.writeText(s) : Promise.reject()).then(() => { $("button", out).textContent = "Zkopírováno ✓"; setTimeout(() => $("button", out).textContent = "Kopírovat", 1600); }).catch(() => {});
  });
  aktualizuj();
});
naPanel("digital", function kontrola(){
  const root = $("#check-odevzdani"); if (!root) return;
  const boxy = $$("input", root), skore = $(".check-score", root.parentElement);
  const ul = ulozit.get("checklist", []);
  boxy.forEach((b, i) => { b.checked = !!ul[i]; b.addEventListener("change", aktualizuj); });
  function aktualizuj(){
    const n = boxy.filter(b => b.checked).length;
    ulozit.set("checklist", boxy.map(b => b.checked));
    skore.textContent = n === boxy.length ? "Vše splněno – soubor můžete odevzdat. ✓" : `Splněno ${n} z ${boxy.length}`;
    skore.classList.toggle("done", n === boxy.length);
  }
  $("#check-reset").addEventListener("click", () => { boxy.forEach(b => b.checked = false); aktualizuj(); });
  aktualizuj();
});

/* =====================================================================
   10) PERSPEKTIVNÍ MŘÍŽKA (etapa Architektura a doprava)
   ===================================================================== */
naPanel("architektura", function perspektiva(){
  const cv = $("#cv-mriz"); if (!cv) return;
  let mod = 2, hust = 14, kvadr = true, H = .42, V1 = .08, V2 = .92, V3y = 1.9, tah = null;
  const st = platno(cv, w => Math.min(480, Math.max(300, w * .6)), () => kresli());
  function body(){ return {h: st.h * H, v1: st.w * V1, v2: st.w * V2, v3: st.h * V3y, vc: st.w * .5}; }
  function kresli(){
    const c = st.ctx, {w, h: hh} = {w: st.w, h: st.h}, b = body();
    c.clearRect(0, 0, w, hh); c.fillStyle = "#fff"; c.fillRect(0, 0, w, hh);
    // obloha a zem pro orientaci
    const g = c.createLinearGradient(0, 0, 0, b.h); g.addColorStop(0, "rgba(91,155,181,.16)"); g.addColorStop(1, "rgba(91,155,181,.03)"); c.fillStyle = g; c.fillRect(0, 0, w, b.h);
    c.fillStyle = "rgba(198,154,91,.08)"; c.fillRect(0, b.h, w, hh - b.h);
    c.lineWidth = 1;
    const paprsky = (vx, vy, barva) => { c.strokeStyle = barva; c.beginPath();
      for (let k = 0; k < hust * 2; k++){ const a = (k / (hust * 2)) * Math.PI * 2; c.moveTo(vx, vy); c.lineTo(vx + Math.cos(a) * 3000, vy + Math.sin(a) * 3000); } c.stroke(); };
    if (mod === 1){ paprsky(b.vc, b.h, "rgba(46,79,163,.28)");
      c.strokeStyle = "rgba(35,39,45,.12)"; c.beginPath(); for (let k = 1; k < hust; k++){ const y = b.h + (hh - b.h) * Math.pow(k / hust, 1.6); c.moveTo(0, y); c.lineTo(w, y); } c.stroke(); }
    if (mod >= 2){ paprsky(b.v1, b.h, "rgba(46,79,163,.25)"); paprsky(b.v2, b.h, "rgba(180,83,42,.25)"); }
    if (mod === 3) paprsky(b.vc, b.v3, "rgba(78,122,69,.3)");
    // horizont
    c.strokeStyle = "#B4532A"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, b.h); c.lineTo(w, b.h); c.stroke();
    c.fillStyle = "#B4532A"; c.font = "600 17px Caveat, cursive"; c.fillText("horizont – výška očí", 10, b.h - 8);
    // ukázkový kvádr (budova)
    if (kvadr){
      c.lineWidth = 2.2; c.strokeStyle = "#23272D"; c.fillStyle = "rgba(35,39,45,.08)";
      const x0 = w * .5, yTop = hh * .16, yBot = hh * .86;
      const sm = (x, y, vx, vy, t) => [x + (vx - x) * t, y + (vy - y) * t];
      if (mod === 1){
        const s = w * .16, L = [x0 - s, yTop + hh * .1], P = [x0 + s, yTop + hh * .1], Ld = [x0 - s, yBot], Pd = [x0 + s, yBot];
        const t = .35, L2 = sm(...L, b.vc, b.h, t), P2 = sm(...P, b.vc, b.h, t), Ld2 = sm(...Ld, b.vc, b.h, t), Pd2 = sm(...Pd, b.vc, b.h, t);
        c.beginPath(); c.moveTo(...L); c.lineTo(...L2); c.lineTo(...P2); c.lineTo(...P); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(...P); c.lineTo(...P2); c.lineTo(...Pd2); c.lineTo(...Pd); c.closePath(); c.fill(); c.stroke();
        c.strokeRect(L[0], L[1], P[0] - L[0], Ld[1] - L[1]);
      } else {
        let top = [x0, yTop], bot = [x0, yBot];
        let topL, topP, botL, botP;
        const tL = .32, tP = .3;
        if (mod === 3){ const k = .12; top = [x0, yTop]; bot = sm(x0, yTop, b.vc, b.v3, .55); }
        topL = sm(...top, b.v1, b.h, tL); botL = sm(...bot, b.v1, b.h, tL); topP = sm(...top, b.v2, b.h, tP); botP = sm(...bot, b.v2, b.h, tP);
        if (mod === 3){ botL = intersect(topL, [b.vc, b.v3], bot, [b.v1, b.h]); botP = intersect(topP, [b.vc, b.v3], bot, [b.v2, b.h]); }
        c.beginPath(); c.moveTo(...topL); c.lineTo(...top); c.lineTo(...bot); c.lineTo(...botL); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = "rgba(35,39,45,.18)"; c.beginPath(); c.moveTo(...top); c.lineTo(...topP); c.lineTo(...botP); c.lineTo(...bot); c.closePath(); c.fill(); c.stroke();
        // okna – dělení po úběžnicích
        c.lineWidth = 1; c.strokeStyle = "rgba(35,39,45,.55)";
        for (let k = 1; k < 6; k++){ const t = k / 6; const a = [top[0] + (bot[0] - top[0]) * t, top[1] + (bot[1] - top[1]) * t];
          const aL = intersect(a, [b.v1, b.h], topL, botL), aP = intersect(a, [b.v2, b.h], topP, botP);
          if (aL){ c.beginPath(); c.moveTo(...a); c.lineTo(...aL); c.stroke(); } if (aP){ c.beginPath(); c.moveTo(...a); c.lineTo(...aP); c.stroke(); } }
      }
    }
    // úběžníky
    const vb = (x, y, t) => { c.beginPath(); c.arc(x, y, 8, 0, 7); c.fillStyle = "#B4532A"; c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 2; c.stroke(); c.fillStyle = "#23272D"; c.font = "600 13px Barlow"; c.fillText(t, x + 10, y + 22); };
    if (mod === 1) vb(b.vc, b.h, "Ú");
    if (mod >= 2){ vb(b.v1, b.h, "Ú1"); vb(b.v2, b.h, "Ú2"); }
    if (mod === 3 && b.v3 < hh) vb(b.vc, b.v3, "Ú3");
    $("#mriz-readout").innerHTML = mod === 1 ? "<b>Jednoúběžníková perspektiva:</b> průčelí rovnoběžné s obrazem, hloubka míří do jednoho úběžníku. Ulice, interiér, tunel." :
      mod === 2 ? "<b>Dvouúběžníková perspektiva:</b> budova natočená nárožím. Táhněte úběžníky – blízko u sebe = zkreslení jako u širokoúhlého objektivu." :
      "<b>Tříúběžníková perspektiva:</b> pohled prudce nahoru nebo dolů – sbíhají se i svislice. Třetí úběžník je pod (žabí pohled je nad) obrazem.";
  }
  function intersect(p1, p2, p3, p4){
    const d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]); if (Math.abs(d) < 1e-6) return null;
    const t = ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) / d;
    return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
  }
  cv.addEventListener("pointerdown", e => {
    const p = bodUdalosti(cv, e), b = body();
    const kand = [["v1", b.v1, b.h], ["v2", b.v2, b.h], ["v3", b.vc, b.v3]].filter(k => (mod >= 2 && k[0] !== "v3") || (mod === 3 && k[0] === "v3"));
    let cil = "h";
    for (const k of kand) if (Math.hypot(p.x - k[1], p.y - k[2]) < 24) cil = k[0];
    if (cil === "h" && Math.abs(p.y - b.h) > 30 && !(mod === 1)) cil = null;
    tah = cil; if (tah) cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener("pointermove", e => {
    if (!tah) return; const p = bodUdalosti(cv, e);
    if (tah === "h") H = clamp(p.y / st.h, .05, .95);
    if (tah === "v1"){ V1 = clamp(p.x / st.w, -.2, .45); H = clamp(p.y / st.h, .05, .95); }
    if (tah === "v2"){ V2 = clamp(p.x / st.w, .55, 1.2); H = clamp(p.y / st.h, .05, .95); }
    if (tah === "v3") V3y = clamp(p.y / st.h, H + .3, 3);
    kresli();
  });
  cv.addEventListener("pointerup", () => tah = null);
  $$("[data-mriz]").forEach(b => b.addEventListener("click", () => { mod = +b.dataset.mriz; $$("[data-mriz]").forEach(x => x.setAttribute("aria-pressed", x === b)); kresli(); }));
  $("#r-mriz-hust").addEventListener("input", e => { hust = +e.target.value; kresli(); });
  $("#c-mriz-kvadr").addEventListener("change", e => { kvadr = e.target.checked; kresli(); });
  kresli();
});

/* =====================================================================
   11) GENERÁTOR ZADÁNÍ POSTAVY (etapa Charakter)
   ===================================================================== */
naPanel("charakter", function generator(){
  const root = $("#gen-postava"); if (!root) return;
  const D = {
    archetyp: ["hrdina, který o svou roli nestál", "moudrý učitel / mentor", "šibal a vtipálek", "strážce, který nikoho nepustí dál", "vynálezce samouk", "tulák a vypravěč", "padouch s pochopitelným motivem", "nesmělý pomocník, který překvapí", "lovec pokladů", "kurýr doručující zakázanou zprávu"],
    svet: ["steampunkové město plné páry", "dno oceánu", "les pohádkových bytostí", "vesmírná stanice", "středověké tržiště", "postapokalyptická poušť", "Pardubice roku 2150", "ledová pustina na severu", "džungle s ruinami chrámu", "noční město s neony"],
    rys: ["neustále něco sbírá", "bojí se tmy", "je extrémně pečlivý", "mluví jen v hádankách", "je nemotorný, ale odvážný", "nikdy se neusměje", "je posedlý časem a hodinkami", "všude nosí zvíře", "je velmi starý a unavený", "je hlučný a výbušný"],
    tvar: ["kruhy – přátelský, měkký", "čtverce – pevný, spolehlivý", "trojúhelníky – rychlý, nebezpečný", "kruh + trojúhelník – roztomilý, ale zákeřný", "čtverec + kruh – dobrák silák", "protáhlé tvary – elegantní, tajemný"],
    barvy: ["oranžová × modrá (doplňkové)", "fialová × žlutá (doplňkové)", "červená × zelená (doplňkové)", "studená modrá škála + jeden teplý akcent", "zemité okry a hnědé", "černobílá + jedna sytá barva"],
    rekvizita: ["obrovský klíč", "lucerna", "batoh plný svitků", "mechanická ruka", "deštník, který umí víc", "kompas, který neukazuje na sever", "starý fotoaparát", "meč z větve", "hrnek s čajem", "tablet s perem"]
  };
  const NAZVY = {archetyp: "Archetyp", svet: "Svět / prostředí", rys: "Povahový rys", tvar: "Tvarový jazyk", barvy: "Barevné schéma", rekvizita: "Rekvizita"};
  const zamky = {};
  const box = $(".gen", root);
  box.innerHTML = Object.keys(D).map(k => `<div data-k="${k}"><small>${NAZVY[k]}</small><b>–</b><button type="button" class="lock" aria-pressed="false" aria-label="Zamknout: ${NAZVY[k]}" title="Zamknout"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0"/></svg></button></div>`).join("");
  box.addEventListener("click", e => { const b = e.target.closest(".lock"); if (!b) return; const k = b.parentElement.dataset.k; zamky[k] = !zamky[k]; b.setAttribute("aria-pressed", zamky[k]); });
  function losuj(){
    $$("[data-k]", box).forEach(d => { const k = d.dataset.k; if (zamky[k]) return;
      const moznosti = D[k], b = $("b", d); let n; do { n = moznosti[Math.floor(Math.random() * moznosti.length)]; } while (n === b.textContent && moznosti.length > 1);
      b.textContent = n; d.classList.remove("spin"); void d.offsetWidth; d.classList.add("spin"); });
  }
  $("#gen-losuj").addEventListener("click", losuj);
  losuj();
});

/* =====================================================================
   12) KOMIKSOVÁ ŠABLONA A3 (etapa Komiks)
   ===================================================================== */
naPanel("komiks", function sablona(){
  const root = $("#lab-strip"); if (!root) return;
  const W = 297, H = 420;                      // mm, A3 na výšku
  const ROZVRH = {
    "strip3": {n: "Strip – 3 políčka", r: [[1, 1, 1]], h: [.32], top: .06},
    "strip4": {n: "Strip – 4 políčka", r: [[1, 1, 1, 1]], h: [.26], top: .06},
    "2x2": {n: "4 políčka 2 × 2", r: [[1, 1], [1, 1]], h: [.5, .5]},
    "1+2": {n: "Velké úvodní + 2", r: [[1], [1, 1]], h: [.55, .45]},
    "3x2": {n: "Stránka 2 × 3", r: [[1, 1], [1, 1], [1, 1]], h: [1 / 3, 1 / 3, 1 / 3]},
    "dyn": {n: "Dynamická stránka", r: [[2, 1], [1], [1, 1.4, 1]], h: [.3, .28, .42]}
  };
  let roz = "strip3", mezera = 5, okraj = 12;
  function obdelniky(){
    const R = ROZVRH[roz], vnW = W - 2 * okraj, out = [];
    const vnH = R.top ? (H - 2 * okraj) : (H - 2 * okraj);
    let y = okraj + (R.top ? 0 : 0);
    const sumH = R.h.reduce((s, x) => s + x, 0);
    const vyskaCelku = R.top ? R.h[0] * vnH : vnH;
    R.r.forEach((rada, ri) => {
      const rh = (R.top ? vyskaCelku : vnH * R.h[ri] / sumH) - (R.top ? 0 : mezera * (R.r.length - 1) / R.r.length);
      const sum = rada.reduce((s, x) => s + x, 0); let x = okraj;
      const dostupne = vnW - mezera * (rada.length - 1);
      rada.forEach(v => { const pw = dostupne * v / sum; out.push([x, y, pw, rh]); x += pw + mezera; });
      y += rh + mezera;
    });
    return out;
  }
  function svg(){
    const o = obdelniky();
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 1.4}" height="${H * 1.4}"><rect width="${W}" height="${H}" fill="#fff"/>` +
      o.map((r, i) => `<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" fill="none" stroke="#111" stroke-width="1.2"/><text x="${r[0] + 4}" y="${r[1] + 9}" style="font:600 7px Barlow,sans-serif;fill:#9aa">${i + 1}</text>`).join("") +
      `<text x="${W / 2}" y="${H - 4}" text-anchor="middle" style="font:500 5px Barlow,sans-serif;fill:#9aa">A3 · ${ROZVRH[roz].n} · okraj ${okraj} mm · mezera ${mezera} mm</text></svg>`;
  }
  function aktualizuj(){ $("#strip-nahled").innerHTML = svg(); $("#o-strip-mezera").textContent = mezera + " mm"; $("#o-strip-okraj").textContent = okraj + " mm"; }
  $$("[data-roz]").forEach(b => b.addEventListener("click", () => { roz = b.dataset.roz; $$("[data-roz]").forEach(x => x.setAttribute("aria-pressed", x === b)); aktualizuj(); }));
  $("#r-strip-mezera").addEventListener("input", e => { mezera = +e.target.value; aktualizuj(); });
  $("#r-strip-okraj").addEventListener("input", e => { okraj = +e.target.value; aktualizuj(); });
  // stažení PNG 3508 × 4961 px s údajem 300 DPI (chunk pHYs)
  $("#strip-stahnout").addEventListener("click", () => {
    const k = 300 / 25.4, c = document.createElement("canvas"); c.width = 3508; c.height = 4961;
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = "#111"; x.lineWidth = 9;
    obdelniky().forEach(r => x.strokeRect(r[0] * k, r[1] * k, r[2] * k, r[3] * k));
    c.toBlob(async blob => {
      const buf = new Uint8Array(await blob.arrayBuffer());
      const s = pridejDPI(buf, 300);
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([s], {type: "image/png"}));
      a.download = `komiks_sablona_A3_${roz}.png`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }, "image/png");
  });
  function crc32(b){ let c, crc = 0xFFFFFFFF; for (let n = 0; n < b.length; n++){ c = (crc ^ b[n]) & 0xFF; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xFFFFFFFF) >>> 0; }
  function pridejDPI(png, dpi){
    const ppm = Math.round(dpi / .0254), data = new Uint8Array(21), dv = new DataView(data.buffer);
    dv.setUint32(0, 9); data.set([112, 72, 89, 115], 4); dv.setUint32(8, ppm); dv.setUint32(12, ppm); data[16] = 1;
    dv.setUint32(17, crc32(data.subarray(4, 17)));
    const pos = 33; // za IHDR (8 + 25)
    const out = new Uint8Array(png.length + 21); out.set(png.subarray(0, pos)); out.set(data, pos); out.set(png.subarray(pos), pos + 21);
    return out;
  }
  aktualizuj();
});

/* =====================================================================
   13) KTEROU TECHNIKU ZVOLIT? (Další techniky)
   ===================================================================== */
naPanel("techniky", function volba(){
  const root = $("#volba-techniky"); if (!root) return;
  const T = {
    akvarel: {n: "Akvarel", t: "průsvitný, světlo dává papír, rychlá a svěží malba, opravy jsou těžké"},
    kvas: {n: "Kvaš (gouache)", t: "krycí vodová barva, světlé přes tmavé, matný povrch, ideální na ilustraci"},
    tempera: {n: "Tempera", t: "krycí i lazurní, rychle schne, sametově matná, na papír i desku"},
    akryl: {n: "Akryl", t: "rychle schne, po zaschnutí vodostálý, krycí i lazurní, na plátno, desku, papír"},
    olej: {n: "Olejomalba", t: "pomalu schne, plynulé přechody a míchání na plátně, vyžaduje ředidla a větrání"}
  };
  function vyhodnot(){
    const q = Object.fromEntries($$("input", root).map(i => [i.name, i.checked]));
    const skore = {akvarel: 0, kvas: 0, tempera: 0, akryl: 0, olej: 0};
    if (q.svetle){ skore.kvas += 2; skore.akryl += 2; skore.olej += 2; skore.tempera += 2; skore.akvarel -= 3; }
    if (q.rychle){ skore.akvarel += 2; skore.kvas += 2; skore.akryl += 2; skore.tempera += 1; skore.olej -= 3; }
    if (q.prechody){ skore.olej += 3; skore.akvarel += 1; skore.akryl -= 1; }
    if (q.skola){ skore.akvarel += 2; skore.kvas += 2; skore.tempera += 2; skore.akryl += 1; skore.olej -= 3; }
    if (q.platno){ skore.akryl += 3; skore.olej += 3; skore.akvarel -= 3; skore.kvas -= 2; }
    if (q.pruhledne){ skore.akvarel += 3; skore.olej += 1; skore.akryl += 1; skore.kvas -= 2; }
    const serazene = Object.entries(skore).sort((a, b) => b[1] - a[1]);
    const nic = !Object.values(q).some(Boolean);
    $("#volba-vysledek").innerHTML = nic ? "Zaškrtněte, co od malby očekáváte." :
      `<b>Doporučení: ${T[serazene[0][0]].n}</b> – ${T[serazene[0][0]].t}.<br><span class="note">Další v pořadí: ${T[serazene[1][0]].n}, ${T[serazene[2][0]].n}.</span>`;
  }
  $$("input", root).forEach(i => i.addEventListener("change", vyhodnot));
  vyhodnot();
});

})();
