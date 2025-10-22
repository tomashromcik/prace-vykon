
/*
  app_final_calc_v19.js
  ------------------------------------------------------------
  Výpočetní část – dvoupólová pole (LHS = RHS) + live validace,
  korektní práce s jednotkami, přeposílání kliků na Obrázek /
  Vzorec / Nápověda / Kalkulačka, a výsledkový box s tipy.
  ------------------------------------------------------------
*/

(function () {
  console.log("🧩 Načítání app_final_calc_v19.js ...");

  // ---------- Helpers ----------
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn, {passive:true});
  const add = (el, cls) => el && el.classList && el.classList.add(...[].concat(cls));
  const rem = (el, cls) => el && el.classList && el.classList.remove(...[].concat(cls));

  // Small utils
  const NUM = (x) => {
    if (x == null) return NaN;
    const t = String(x).replace(",", ".").trim();
    if (!t) return NaN;
    return Number(t);
  };
  const almost = (a, b, rel=0.02) => {
    if (!isFinite(a) || !isFinite(b)) return false;
    if (b === 0) return Math.abs(a) < 1e-9;
    return Math.abs(a-b) <= Math.abs(b)*rel;
  };

  // Unit factors to base units (m, N, J)
  const U = {
    mm:1/1000, cm:1/100, m:1, km:1000,
    N:1, kN:1000, MN:1_000_000,
    J:1, kJ:1000, MJ:1_000_000,
    W:1, kW:1000, MW:1_000_000 // if needed in future
  };
  const toBase = (val, unit) => (val * (U[unit] ?? 1));

  // Forward toolbar clicks (from calc toolbar to the main ones under zadání)
  function forwardClick(kind){
    // try to find by data-role first (if defined by app_cleaned_v11.js)
    const map = {
      image:   ['#open-diagram-button', '#show-image'],
      formula: ['#open-formula-button', '#show-formula'],
      help:    ['#open-help-button', '#show-help'],
      calc:    ['#open-calculator-button', '#show-calculator']
    };
    const candidates = map[kind] || [];
    for (const sel of candidates){
      const btn = $(sel);
      if (btn){ btn.click(); return; }
    }
    // fallback: try by visible text (CZ labels)
    const labels = {
      image: ["Obrázek"],
      formula: ["Vzorec"],
      help: ["Nápověda"],
      calc: ["Kalkulačka"]
    }[kind] || [];
    const btn = $$('button').find(b => labels.includes((b.textContent||"").trim()));
    if (btn) btn.click();
  }

  // ---------- UI creation ----------
  function ensureCalcBox(){
    // Parent section – zkusíme výpočetní krok z původní aplikace
    const host = $("#vypocet-step") || $("#main-calculation-step") || $("#practice-screen");
    if (!host) return null;

    // Already exists?
    let box = $("#calc-box-v19");
    if (box) return box;

    box = document.createElement("section");
    box.id = "calc-box-v19";
    box.className = "mt-6 rounded-xl border border-blue-800/40 bg-blue-900/20 p-4";
    box.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-blue-200">3️⃣ Finální výpočet</h3>
        <div class="flex items-center gap-2 text-sm">
          <button type="button" id="calcv19-img"     class="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-100">Obrázek</button>
          <button type="button" id="calcv19-formula" class="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-100">Vzorec</button>
          <button type="button" id="calcv19-help"    class="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-100">Nápověda</button>
          <button type="button" id="calcv19-calc"    class="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-100">Kalkulačka</button>
        </div>
      </div>

      <p class="text-sm text-gray-300 mb-3">Sestavte vzorec, dosaďte hodnoty a vypočítejte výsledek.</p>

      <!-- Rows -->
      <div class="space-y-3">
        <!-- Row: Formula -->
        <div class="grid grid-cols-[auto,28px,1fr] gap-2 items-center">
          <input  id="v19-formula-lhs" type="text" placeholder="např. W"  class="px-3 py-2 w-20 rounded bg-gray-900 border border-gray-700 text-gray-100" />
          <span class="text-gray-300 text-lg text-center">=</span>
          <input  id="v19-formula-rhs" type="text" placeholder="např. F * s" class="px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100" />
        </div>

        <!-- Row: Substitution -->
        <div class="grid grid-cols-[auto,28px,1fr] gap-2 items-center">
          <input  id="v19-subs-lhs" type="text" placeholder="např. W"  class="px-3 py-2 w-20 rounded bg-gray-900 border border-gray-700 text-gray-100" />
          <span class="text-gray-300 text-lg text-center">=</span>
          <input  id="v19-subs-rhs" type="text" placeholder="např. 1000 * 2" class="px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100" />
        </div>

        <!-- Row: Result -->
        <div class="grid grid-cols-[auto,28px,1fr,auto] gap-2 items-center">
          <input  id="v19-res-lhs" type="text" placeholder="např. W"  class="px-3 py-2 w-20 rounded bg-gray-900 border border-gray-700 text-gray-100" />
          <span class="text-gray-300 text-lg text-center">=</span>
          <input  id="v19-res-rhs" type="text" placeholder="např. 2000" class="px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100" />
          <select id="v19-res-unit" class="px-3 py-2 rounded bg-gray-900 border border-gray-700 text-gray-100">
            <option>J</option><option>kJ</option><option>MJ</option>
          </select>
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <button id="v19-check" class="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white">Ověřit výpočet</button>
      </div>

      <div id="v19-result-box" class="mt-3 hidden rounded-lg border border-gray-700 bg-gray-900/70 p-3 text-sm text-gray-200"></div>
    `;
    host.appendChild(box);

    // Hook toolbar fwd
    on($("#calcv19-img"),     "click", () => forwardClick("image"));
    on($("#calcv19-formula"), "click", () => forwardClick("formula"));
    on($("#calcv19-help"),    "click", () => forwardClick("help"));
    on($("#calcv19-calc"),    "click", () => forwardClick("calc"));

    return box;
  }

  // Fill default placeholders according to unknown symbol
  function setDefaultsByUnknown(){
    const unknown = getUnknownFromZapis() || "W";
    const fL = $("#v19-formula-lhs"), fR = $("#v19-formula-rhs");
    const sL = $("#v19-subs-lhs"),    sR = $("#v19-subs-rhs");
    const rL = $("#v19-res-lhs"),     rR = $("#v19-res-rhs");
    if (!fL) return;

    if (unknown === "W") {
      fL.value = "W"; fR.value = "F * s";
      sL.value = "W"; sR.value = "";
      rL.value = "W"; rR.value = "";
      $("#v19-res-unit").value = "J";
    } else if (unknown === "F") {
      fL.value = "F"; fR.value = "W / s";
      sL.value = "F"; sR.value = "";
      rL.value = "F"; rR.value = "";
      $("#v19-res-unit").value = "N";
    } else if (unknown === "s") {
      fL.value = "s"; fR.value = "W / F";
      sL.value = "s"; sR.value = "";
      rL.value = "s"; rR.value = "";
      $("#v19-res-unit").value = "m";
    }
  }

  // Unknown symbol detection from zapis rows (fallback to W)
  function getUnknownFromZapis(){
    // Common structures used earlier
    // checkbox with label "Hledaná veličina"
    const rows = $$(".zapis-row");
    const hit  = rows.find(r => $("input[type=checkbox]", r)?.checked);
    const symSel = hit && ($("select", hit) || $(".zapis-symbol", hit));
    let sym = symSel && symSel.value;
    if (!sym || sym === "-") sym = "W";
    return sym;
  }

  // Mirror units based on topic
  function prepareUnitSelect(){
    const unitSel = $("#v19-res-unit");
    if (!unitSel) return;
    let topic = (window.selectedTopic) || "prace";
    unitSel.innerHTML = "";
    const opts = (topic === "vykon") ? ["W","kW","MW"] : ["J","kJ","MJ"];
    for (const u of opts){
      const o = document.createElement("option"); o.textContent = u; o.value = u;
      unitSel.appendChild(o);
    }
  }

  // Live validation (simple colours)
  function markOK(el){ rem(el, ["ring-red-500","border-red-500"]); add(el, ["ring-2","ring-green-500","border-green-500"]); }
  function markBAD(el){ rem(el, ["ring-green-500","border-green-500"]); add(el, ["ring-2","ring-red-500","border-red-500"]); }
  function markNEU(el){ rem(el, ["ring-2","ring-green-500","border-green-500","ring-red-500","border-red-500"]); }

  function liveFormula(){
    const fL = $("#v19-formula-lhs"), fR = $("#v19-formula-rhs");
    const unknown = getUnknownFromZapis() || "W";
    const raw = (fL.value+"="+fR.value).replace(/\s+/g,"");
    let ok = false;
    if (unknown === "W") ok = /^W=(F[*·]s|s[*·]F)$/i.test(raw);
    else if (unknown === "F") ok = /^F=W\/s$/i.test(raw);
    else if (unknown === "s") ok = /^s=W\/F$/i.test(raw);
    (ok ? markOK : (raw ? markBAD : markNEU))(fL);
    (ok ? markOK : (raw ? markBAD : markNEU))(fR);
    return ok;
  }

  function liveSubs(){
    const sL = $("#v19-subs-lhs"), sR = $("#v19-subs-rhs");
    const unknown = getUnknownFromZapis() || "W";
    if (!sL.value && !sR.value){ markNEU(sL); markNEU(sR); return false; }

    const cp = window.currentProblem || {};
    const Fg = (cp.givens || []).find(g => g.symbol === "F");
    const sg = (cp.givens || []).find(g => g.symbol === "s");
    const Wv = cp.result;

    let ok = false;

    if (unknown === "W" && Fg && sg){
      // expected: W=a*b, order-free; but allow spaces
      const m = sR.value.replace(/\s+/g,"").match(/^(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/);
      if (m){
        const a = NUM(m[1]), b = NUM(m[2]);
        const ea = toBase(Fg.value, Fg.unit || "N");
        const eb = toBase(sg.value, sg.unit || "m");
        if (isFinite(a)&&isFinite(b)){
          ok = (almost(a,ea) && almost(b,eb)) || (almost(a,eb) && almost(b,ea));
        }
      }
      ok = ok && /^W$/i.test(sL.value.trim());
    } else if (unknown === "F" && sg && isFinite(Wv)){
      const m = sR.value.replace(/\s+/g,"").match(/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
      if (m){
        const a = NUM(m[1]), b = NUM(m[2]);
        const eb = toBase(sg.value, sg.unit || "m");
        ok = almost(a, Wv) && almost(b, eb);
      }
      ok = ok && /^F$/i.test(sL.value.trim());
    } else if (unknown === "s" && Fg && isFinite(Wv)){
      const m = sR.value.replace(/\s+/g,"").match(/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
      if (m){
        const a = NUM(m[1]), b = NUM(m[2]);
        const ea = toBase(Fg.value, Fg.unit || "N");
        ok = almost(a, Wv) && almost(b, ea);
      }
      ok = ok && /^s$/i.test(sL.value.trim());
    }

    (ok ? markOK : markBAD)(sL);
    (ok ? markOK : markBAD)(sR);
    return ok;
  }

  function liveResult(){
    const rL = $("#v19-res-lhs"), rR = $("#v19-res-rhs"), ru = $("#v19-res-unit");
    const unknown = getUnknownFromZapis() || "W";
    if (!rL.value && !rR.value){ markNEU(rL); markNEU(rR); return false; }

    const cp = window.currentProblem || {};
    let ok = false;

    if (unknown === "W"){
      const val = NUM(rR.value);
      const unit = ru.value || "J";
      const inJ  = toBase(val, unit);
      ok = isFinite(val) && almost(inJ, cp.result);
      ok = ok && /^W$/i.test(rL.value.trim());
    } else {
      // outside scope for now → just check number present
      ok = !!rR.value;
    }

    (ok ? markOK : markBAD)(rL);
    (ok ? markOK : markBAD)(rR);
    return ok;
  }

  function allLive(){
    const okF = liveFormula();
    const okS = liveSubs();
    const okR = liveResult();
    return {okF, okS, okR};
  }

  // Result box rendering
  function renderResultBox({okF, okS, okR}){
    const box = $("#v19-result-box");
    if (!box) return;
    box.classList.remove("hidden");
    const notes = [];
    if (!okF) notes.push("Uprav vzorec (např. <b>W = F * s</b>). Dbej na velikost písmen.");
    if (!okS) notes.push("Zkontroluj dosazení – čísla musí vycházet ze zadání, pořadí má navazovat na vzorec.");
    if (!okR) notes.push("Výsledek neodpovídá. Zadej správné číslo a zvol jednotku.");
    const verdict = (okF && okS && okR)
      ? `<div class="text-green-400 font-semibold">✅ Výborně! Výpočet je správný.</div>`
      : `<div class="text-red-400 font-semibold">❌ Ještě něco chybí. Mrkni na tipy níže:</div>`;

    box.innerHTML = `
      <div class="space-y-2">
        ${verdict}
        ${notes.length ? `<ul class="list-disc pl-5">${notes.map(n=>`<li>${n}</li>`).join("")}</ul>` : ""}
      </div>
    `;
  }

  // Minimal zápis summary (pokud existuje cílový element)
  function renderZapisSummary(){
    const tgt = $("#zapis-review-container") || $("#zapis-summary") || null;
    if (!tgt) return;

    const cp = window.currentProblem || {};
    const giv = cp.givens || [];
    // try to detect unknown mark from UI
    const unknown = getUnknownFromZapis() || "W";
    const lines = giv.map(g => `${g.symbol} = ${g.value} ${g.unit}`);
    lines.push(`${unknown} = ? ${unknown==="W"?"J": unknown==="F"?"N":"m"}`);
    tgt.innerHTML = `
      <div class="p-3 bg-gray-900 border border-gray-700 rounded">
        <div class="font-semibold mb-2 text-gray-300">Souhrn zápisu:</div>
        <pre class="text-gray-200 text-sm whitespace-pre-wrap">${lines.join("")}</pre>
      </div>`;
  }

  // Show calc box when user clicks "Zkontrolovat zápis"
  function bindShowOnCheck(){
    const btn = $("#check-zapis-button") || $$("button").find(b => /Zkontrolovat zápis/i.test(b.textContent||""));
    if (!btn) return;
    on(btn, "click", () => {
      const box = ensureCalcBox();
      if (!box) return;
      prepareUnitSelect();
      setDefaultsByUnknown();
      // hide main toolbar duplicates if desired:
      // const toolRow = $("#tools-row"); toolRow && toolRow.classList.add("hidden");
      // attach live
      attachLiveHandlers();
      renderZapisSummary();
    });
  }

  function attachLiveHandlers(){
    ["v19-formula-lhs","v19-formula-rhs","v19-subs-lhs","v19-subs-rhs","v19-res-lhs","v19-res-rhs","v19-res-unit"]
      .map(id => document.getElementById(id))
      .forEach(el => on(el, "input", allLive));
    on($("#v19-check"), "click", () => renderResultBox(allLive()));
  }

  // Init now (wait DOM)
  function init(){
    ensureCalcBox(); // create once (can stay hidden until user uses it)
    // but reveal/provision upon "Zkontrolovat zápis"
    bindShowOnCheck();
    console.log("✅ v19: připraveno (čeká na validní zápis & klik na 'Zkontrolovat zápis').");
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
