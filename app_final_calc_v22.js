
/*
  app_final_calc_v22.js
  ------------------------------------------------------------
  Opravná a doplňující vrstva pro projekt "Práce a výkon":
  - Fallback ZÁPIS: addZapisRow + checkZapis (pokud chybí v jádru)
  - Live validace řádku + automatický návrh převodu na základní jednotku
  - Modály: Kalkulačka, Vzorec (SVG), Obrázek (SVG), Nápověda
  - Bezpečná inicializace (nebude se vázat dvakrát)
  - Kompatibilní s app_cleaned_v11.js a v20/v21 výpočetním modulem
  ------------------------------------------------------------
*/

(function () {
  if (window.__APP_V22_READY__) return;
  window.__APP_V22_READY__ = true;

  console.log("🧩 Načítání app_final_calc_v22.js ...");

  // ---------- Helpers ----------
  const $  = (sel, c=document) => c.querySelector(sel);
  const $$ = (sel, c=document) => Array.from(c.querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn, { passive: true });
  const cls = (el, add=[], rem=[]) => { if(!el) return; (Array.isArray(rem)?rem:[rem]).forEach(r=>el.classList.remove(r)); (Array.isArray(add)?add:[add]).forEach(a=>el.classList.add(a)); };
  const pm = (n) => (n==null || !isFinite(n)) ? "?" : String(n).replace(".", ",");
  const parseNum = (s) => {
    if (s == null) return NaN;
    const t = String(s).replace(",", ".").trim();
    if (!t) return NaN;
    return Number(t);
  };
  const almostEqual = (a,b,rel=0.05) => {
    if (!isFinite(a) || !isFinite(b)) return false;
    if (b === 0) return Math.abs(a) < 1e-9;
    return Math.abs(a-b) <= Math.abs(b) * rel;
  };

  // Mapy jednotek
  const symbolToKind = { s:"length", F:"force", W:"energy" };
  const baseUnit     = { length:"m", force:"N",    energy:"J" };
  const unitSets     = {
    length:["mm","cm","m","km"],
    force:["N","kN","MN"],
    energy:["J","kJ","MJ"]
  };
  const unitToBaseFactor = {
    mm:1/1000, cm:1/100, m:1, km:1000,
    N:1, kN:1000, MN:1_000_000,
    J:1, kJ:1000, MJ:1_000_000
  };

  // --------- DOM refs (lazy) ----------
  const DOM = {
    setup:        () => $("#setup-screen"),
    practice:     () => $("#practice-screen"),
    problemText:  () => $("#problem-text"),
    addBtn:       () => $("#add-zapis-row-button"),
    checkBtn:     () => $("#check-zapis-button"),
    zapisWrap:    () => $("#zapis-container"),
    zapisStep:    () => $("#zapis-step"),
    vypocetStep:  () => $("#vypocet-step"),
    zapisReview:  () => $("#zapis-review-container"),
    zapisFeedback:() => $("#zapis-feedback-container"),
    // tool buttons
    bFormula:     () => $("#open-formula-button"),
    bDiagram:     () => $("#open-diagram-button"),
    bHelp:        () => $("#open-help-button"),
    bCalc:        () => $("#open-calculator-button"),
    // modals
    mFormula:     () => $("#formula-modal"),
    mDiagram:     () => $("#diagram-modal"),
    mHelp:        () => $("#help-modal"),
    mCalc:        () => $("#calculator-modal"),
    // modal content
    formulaSvg:   () => $("#formula-svg-container"),
    diagramSvg:   () => $("#diagram-svg-container"),
    helpContent:  () => $("#help-content"),
    // calculator
    cDisplay:     () => $("#calculator-display"),
    cHistory:     () => $("#calculator-history"),
    cButtons:     () => $("#calculator-buttons"),
    // close buttons
    closeFormula: () => $("#close-formula-button"),
    closeDiagram: () => $("#close-diagram-button"),
    closeHelp:    () => $("#close-help-button"),
    closeCalc:    () => $("#close-calculator-button"),
  };

  // Safety getter na currentProblem ze základní app
  const getProblem = () => window.currentProblem || null;

  // ---------- ZÁPIS: tvorba řádku ----------
  function createSelect(options, value, extraClass="") {
    const s = document.createElement("select");
    s.className = `p-2 rounded-md bg-gray-900 border border-gray-700 text-white ${extraClass}`.trim();
    options.forEach(o=>{
      const opt = document.createElement("option");
      opt.value = o; opt.textContent = o;
      s.appendChild(opt);
    });
    s.value = value;
    return s;
  }
  function createInput(placeholder="", value="") {
    const i = document.createElement("input");
    i.type = "text";
    i.placeholder = placeholder || "Hodnota";
    i.value = value;
    i.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white zapis-value";
    return i;
  }

  function addZapisRow(symbol="-", value="", unit="-", baseHint=false) {
    const wrap = DOM.zapisWrap();
    if (!wrap) return null;

    const row = document.createElement("div");
    row.className = "grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";

    const sSel = createSelect(["-","F","s","W"], symbol, "zapis-symbol");
    const val  = createInput("Hodnota", value);
    const uSel = createSelect(["-","mm","cm","m","km","J","kJ","MJ","N","kN","MN"], unit, "zapis-unit");

    const lab = document.createElement("label");
    lab.className = "flex items-center gap-2 text-sm text-gray-300";
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.className = "zapis-unknown h-4 w-4";
    const sp = document.createElement("span"); sp.textContent = "Hledaná veličina";
    lab.append(cb, sp);

    row.append(sSel, val, uSel, lab);
    wrap.appendChild(row);

    if (baseHint) {
      const hint = document.createElement("div");
      hint.className = "text-sm text-yellow-400 mt-1 italic col-span-4";
      hint.textContent = "💡 Převeď tuto veličinu na základní jednotku.";
      wrap.appendChild(hint);
    }

    const onRowChange = () => rowLiveValidate(row);
    on(sSel, "change", onRowChange);
    on(uSel, "change", onRowChange);
    on(val,  "input", onRowChange);
    on(cb,   "change", () => {
      val.value = cb.checked ? "?" : "";
      val.disabled = cb.checked;
      rowLiveValidate(row);
    });

    return row;
  }

  function rowLiveValidate(row) {
    row.classList.remove("ring-2","ring-red-500","ring-green-500");
    const symbol  = row.querySelector(".zapis-symbol")?.value || "-";
    const unit    = row.querySelector(".zapis-unit")?.value || "-";
    const unknown = row.querySelector(".zapis-unknown")?.checked || false;
    const raw     = row.querySelector(".zapis-value")?.value.trim() || "";

    if (symbol === "-" || unit === "-" || (!unknown && raw==="")) return;

    const kind = symbolToKind[symbol];
    if (!kind) return;
    if (!unitSets[kind].includes(unit)) {
      row.classList.add("ring-2","ring-red-500");
      pushZapisToast(`❌ ${symbol} neodpovídá jednotce ${unit}.`);
      return;
    }

    // Porovnej s danými hodnotami v zadání (pokud existují)
    const p = getProblem();
    const given = p?.givens?.find(g => g.symbol === symbol);
    if (!given) { row.classList.add("ring-2","ring-green-500"); return; }

    if (!unknown) {
      const v = parseNum(raw);
      if (!isFinite(v)) { row.classList.add("ring-2","ring-red-500"); pushZapisToast("❌ Hodnota musí být číslo."); return; }
      const factor = unitToBaseFactor[unit] ?? NaN;
      if (!isFinite(factor)) { row.classList.add("ring-2","ring-red-500"); pushZapisToast(`❌ Neznámý převod pro jednotku ${unit}.`); return; }
      const inBase = v * factor;
      if (almostEqual(inBase, given.value)) {
        row.classList.add("ring-2","ring-green-500");
      } else {
        row.classList.add("ring-2","ring-red-500");
        pushZapisToast(`❌ ${symbol}: očekává se ≈ ${given.value} ${given.unit}, máš ${v} ${unit} (≈ ${inBase} ${given.unit}).`);
      }
      if (unit !== given.unit) maybeAddBaseConversionRow(symbol, given.unit);
    } else {
      row.classList.add("ring-2","ring-green-500");
    }
  }

  function maybeAddBaseConversionRow(symbol, base) {
    const rows = $$(".zapis-row");
    const has = rows.some(r => r.querySelector(".zapis-symbol")?.value===symbol && r.querySelector(".zapis-unit")?.value===base);
    if (has) return;
    addZapisRow(symbol, "", base, true);
    pushZapisToast(`ℹ️ Přidej převod: ${symbol} na ${base}.`);
  }

  function pushZapisToast(msg) {
    const box = DOM.zapisFeedback(); if (!box) return;
    const d = document.createElement("div");
    d.className = "text-yellow-300 text-sm mt-1";
    d.textContent = msg;
    box.appendChild(d);
    setTimeout(()=>d.remove(), 5000);
  }

  function collectRows() {
    return $$(".zapis-row").map(r => ({
      symbol:  r.querySelector(".zapis-symbol")?.value || "-",
      unit:    r.querySelector(".zapis-unit")?.value   || "-",
      raw:     r.querySelector(".zapis-value")?.value.trim() || "",
      unknown: r.querySelector(".zapis-unknown")?.checked || false,
    }));
  }

  function mergedSummary(rows) {
    const order=[]; const by={};
    rows.forEach(r=>{
      if (r.symbol==="-" || !r.symbol) return;
      if (!by[r.symbol]) { by[r.symbol]=[]; order.push(r.symbol); }
      const part = r.unknown ? `? ${r.unit}` : `${r.raw} ${r.unit}`;
      if (!by[r.symbol].includes(part)) by[r.symbol].push(part);
    });
    return order.map(sym => `${sym} = ${by[sym].join(" = ")}`).join("\n");
  }

  function checkZapis() {
    const rows = collectRows();
    const p = getProblem();
    if (!p) { pushZapisToast("⚠️ Nejprve spusťte příklad."); return false; }

    // musí existovat hledaná veličina
    if (!rows.some(r => r.unknown && r.symbol !== "-")) {
      pushZapisToast("⚠️ Označte hledanou veličinu.");
      return false;
    }

    const errs=[];
    for (const g of p.givens) {
      const r = rows.find(x => x.symbol===g.symbol && !x.unknown && x.unit !== "-" && x.raw!=="");
      if (!r) { errs.push(`❌ Chybí veličina ${g.symbol}.`); continue; }
      const val = parseNum(r.raw);
      const factor = unitToBaseFactor[r.unit] ?? NaN;
      if (!isFinite(val) || !isFinite(factor)) { errs.push(`❌ ${g.symbol}: neplatná hodnota/jednotka.`); continue; }
      const inBase = val * factor;
      if (!almostEqual(inBase, g.value)) errs.push(`❌ ${g.symbol}: očekává se ≈ ${g.value} ${g.unit}, máš ${val} ${r.unit} (≈ ${inBase} ${g.unit}).`);
    }
    const fb = DOM.zapisFeedback();
    if (fb) fb.innerHTML = "";
    if (errs.length) {
      if (fb) fb.innerHTML = `<div class="feedback-wrong"><b>Chyby:</b><ul class="list-disc pl-5 mt-1">${errs.map(e=>`<li>${e}</li>`).join("")}</ul></div>`;
      return false;
    }

    // souhrn + přechod do výpočtu
    const sum = mergedSummary(rows);
    const rev = DOM.zapisReview();
    if (rev) {
      rev.innerHTML = `
        <div class="p-3 bg-gray-900 border border-gray-700 rounded">
          <div class="font-semibold mb-2 text-gray-300">Souhrn zápisu:</div>
          <pre class="text-gray-200 text-sm whitespace-pre-wrap">${sum}</pre>
        </div>`;
    }
    const zs = DOM.zapisStep(); const vs = DOM.vypocetStep();
    if (zs && vs) { zs.classList.add("hidden"); vs.classList.remove("hidden"); }
    return true;
  }

  // ---------- Modály ----------
  function toggleModal(el, show) {
    if (!el) return;
    el.classList.toggle("hidden", !show);
  }

  function renderHelp() {
    const c = DOM.helpContent(); if (!c) return;
    c.innerHTML = `
      <div class="space-y-3 text-gray-300 text-sm text-left">
        <p>💡 <b>Tip:</b> Zapište všechny <b>známé veličiny</b> a <b>označte hledanou</b> (otazníkem).</p>
        <p>🧭 Pokud je hodnota v násobcích (kN, km, kJ…), aplikace vám <b>nabídne převod</b> na základní jednotku.</p>
        <p>✅ Do výpočtu se dostanete, až když budou <b>všechny veličiny</b> ze zadání zapsané správně.</p>
      </div>`;
  }

  function renderFormula() {
    const c = DOM.formulaSvg(); if (!c) return;
    c.innerHTML = `
      <svg width="240" height="180" viewBox="0 0 240 180">
        <polygon points="120,15 25,165 215,165" fill="none" stroke="white" stroke-width="2"/>
        <line x1="52" y1="112" x2="188" y2="112" stroke="white" stroke-width="2"/>
        <text x="120" y="70"  fill="white" font-size="36" text-anchor="middle">W</text>
        <text x="120" y="150" fill="white" font-size="26" text-anchor="middle">F · s</text>
      </svg>`;
  }

  function renderDiagram() {
    const c = DOM.diagramSvg(); if (!c) return;
    const p = getProblem();
    if (!p) { c.innerHTML = `<p class="text-gray-400 text-sm">Nejdříve spusťte příklad.</p>`; return; }
    const F = p.givens.find(g=>g.symbol==="F") || {};
    const s = p.givens.find(g=>g.symbol==="s") || {};
    c.innerHTML = `
      <svg width="340" height="190" viewBox="0 0 340 190">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="red"/>
          </marker>
          <marker id="arrowhead2" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="orange"/>
          </marker>
        </defs>
        <rect x="25" y="160" width="290" height="8" fill="#777"/>
        <rect x="85" y="115" width="90" height="42" fill="#00AEEF" stroke="white" stroke-width="2"/>
        <circle cx="103" cy="160" r="9" fill="#333"/>
        <circle cx="155" cy="160" r="9" fill="#333"/>
        <line x1="175" y1="130" x2="255" y2="130" stroke="red" stroke-width="3" marker-end="url(#arrowhead)"/>
        <text x="215" y="118" fill="red" font-size="16" text-anchor="middle">F = ${pm(F.value)} ${F.unit||""}</text>
        <line x1="85" y1="175" x2="255" y2="175" stroke="orange" stroke-width="2" marker-end="url(#arrowhead2)"/>
        <text x="170" y="190" fill="orange" font-size="14" text-anchor="middle">s = ${pm(s.value)} ${s.unit||""}</text>
      </svg>`;
  }

  function initCalculator() {
    const display = DOM.cDisplay();
    const history = DOM.cHistory();
    const grid    = DOM.cButtons();
    if (!display || !history || !grid) return;

    grid.innerHTML = "";
    const keys = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+","C","⌫","Copy"];
    keys.forEach(k => {
      const b = document.createElement("button");
      b.textContent = k;
      b.className = "bg-gray-700 text-white py-2 rounded hover:bg-gray-600";
      grid.appendChild(b);
    });
    let current = "";
    const update = () => display.textContent = current || "0";

    grid.addEventListener("click", (e) => {
      const t = e.target.closest("button"); if (!t) return;
      const key = t.textContent;
      if (key === "C") { current=""; history.textContent=""; }
      else if (key === "⌫") { current = current.slice(0,-1); }
      else if (key === "=") {
        try { const r = eval(current); history.textContent = `${current} =`; current = String(r); }
        catch { current = "Error"; }
      } else if (key === "Copy") {
        navigator.clipboard?.writeText(display.textContent);
      } else {
        current += key;
      }
      update();
    });

    document.addEventListener("keydown", (e) => {
      const modal = DOM.mCalc();
      if (!modal || modal.classList.contains("hidden")) return;
      if (/[0-9+\-*/.]/.test(e.key)) { current += e.key; update(); }
      else if (e.key === "Enter") {
        try { const r = eval(current); history.textContent = `${current} =`; current = String(r); }
        catch { current = "Error"; }
        update();
      } else if (e.key === "Backspace") { current = current.slice(0,-1); update(); }
    });

    update();
  }

  // ---------- Init binding ----------
  function bindUI() {
    // Zápis – zajištění funkcí, pokud chybí
    if (typeof window.addZapisRow !== "function") window.addZapisRow = addZapisRow;
    if (typeof window.checkZapis  !== "function") window.checkZapis  = checkZapis;

    const add = DOM.addBtn();
    const chk = DOM.checkBtn();
    on(add, "click", () => { addZapisRow(); });
    on(chk, "click", () => { const ok = checkZapis(); if (ok) console.log("✅ Zápis v pořádku → výpočet"); });

    // Tools
    on(DOM.bHelp(),    "click", () => { renderHelp();    toggleModal(DOM.mHelp(), true); });
    on(DOM.bFormula(), "click", () => { renderFormula(); toggleModal(DOM.mFormula(), true); });
    on(DOM.bDiagram(), "click", () => { renderDiagram(); toggleModal(DOM.mDiagram(), true); });
    on(DOM.bCalc(),    "click", () => { initCalculator(); toggleModal(DOM.mCalc(), true); });

    // Zavírání modálů
    on(DOM.closeHelp(),    "click", () => toggleModal(DOM.mHelp(), false));
    on(DOM.closeFormula(), "click", () => toggleModal(DOM.mFormula(), false));
    on(DOM.closeDiagram(), "click", () => toggleModal(DOM.mDiagram(), false));
    on(DOM.closeCalc(),    "click", () => toggleModal(DOM.mCalc(), false));

    // Klik mimo obsah modal = zavřít
    [DOM.mHelp(), DOM.mFormula(), DOM.mDiagram(), DOM.mCalc()].forEach(m => {
      on(m, "click", (e) => { if (e.target === m) toggleModal(m, false); });
    });

    // Při spuštění practice kroku přidej první řádek, pokud není žádný
    const wrap = DOM.zapisWrap();
    if (wrap && wrap.children.length === 0) addZapisRow();
  }

  function tryBindWhenPracticeVisible() {
    const pr = DOM.practice();
    if (pr && !pr.classList.contains("hidden")) bindUI();
  }

  // Init: po načtení DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      console.log("✅ v22: DOM ready");
      tryBindWhenPracticeVisible();
    });
  } else {
    console.log("✅ v22: DOM was ready");
    tryBindWhenPracticeVisible();
  }

  // Reakce na přechod do practice (app_cleaned_v11 volá showPractice())
  // Přes jednoduchý observer sleduj zviditelnění practice-screen
  const prNode = document.getElementById("practice-screen");
  if (prNode) {
    const obs = new MutationObserver(() => {
      if (!prNode.classList.contains("hidden")) {
        console.log("✅ v22: Practice screen aktivní – navazuji handlers.");
        bindUI();
      }
    });
    obs.observe(prNode, { attributes: true, attributeFilter: ["class"] });
  }

  console.log("✅ app_final_calc_v22.js připraven.");
})();
