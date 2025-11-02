// ====================================================================
//  app_final_calc_v28.js
//  - stejné jako v27 + auto-nabídka řádku pro převod na základní jednotku
//  - když žák zadá např. F = 7 kN, vloží se automaticky další řádek F v N
//  - logy ponechány
// ====================================================================

console.log("🧩 Načítání app_final_calc_v28.js ...");

(function () {
  // --- helpers -------------------------------------------------------
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const log = (...a) => console.log("v28:", ...a);

  // jednotky / převody
  const symbolToKind = { s:"length", F:"force", W:"energy" };
  const unitSets = { length:["mm","cm","m","km"], energy:["J","kJ","MJ"], force:["N","kN","MN"] };
  const baseUnit = { length:"m", force:"N", energy:"J" };
  const factor = { mm:1/1000, cm:1/100, m:1, km:1000, J:1, kJ:1000, MJ:1_000_000, N:1, kN:1000, MN:1_000_000 };

  const parseNum = s => {
    if (s == null) return NaN;
    const t = String(s).replace(",", ".").trim();
    return t === "" ? NaN : Number(t);
  };
  const almostEq = (a,b,rel=0.05) => (isFinite(a)&&isFinite(b))
    ? (b === 0 ? Math.abs(a)<1e-9 : Math.abs(a-b) <= Math.abs(b)*rel)
    : false;

  // --- UI třídy ------------------------------------------------------
  const inputClass    = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white";
  const selectClass   = inputClass;
  const zapisRowClass = "grid grid-cols-1 sm:grid-cols-4 gap-2 mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";

  const rowCls   = "grid items-center gap-2 mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";
  const rowCols  = "grid-cols-[5.5rem,auto,1fr,auto] sm:grid-cols-[6rem,auto,1fr,auto]";
  const inCls    = inputClass;

  // --- drobné utility UI ---------------------------------------------
  function createSelect(opts, value, cls) {
    const s = document.createElement("select");
    s.className = `${selectClass} ${cls||""}`;
    opts.forEach(o => {
      const opt = document.createElement("option");
      opt.value = o; opt.textContent = o;
      s.appendChild(opt);
    });
    if (value) s.value = value;
    return s;
  }
  function createInput(value, ph="Hodnota") {
    const i = document.createElement("input");
    i.type="text"; i.placeholder = ph; i.value = value || "";
    i.className = inputClass;
    return i;
  }
  function toast(msg) {
    const box = $("#zapis-feedback-container");
    if (!box) return;
    const d = document.createElement("div");
    d.className = "text-yellow-300 text-sm mt-1";
    d.textContent = msg;
    box.appendChild(d);
    setTimeout(()=>d.remove(), 5000);
  }

  // --- ZÁPIS ---------------------------------------------------------
  function addZapisRow(symbol = "-", value = "", unit = "-") {
    const cont = $("#zapis-container");
    if (!cont) return;
    const row = document.createElement("div");
    row.className = zapisRowClass + " zapis-row";

    const symSel = createSelect(["-","F","s","W"], symbol, "zapis-symbol");
    const valInp = createInput(value);
    valInp.classList.add("zapis-value");
    const kindUnits = ["-","mm","cm","m","km","J","kJ","MJ","N","kN","MN"];
    const unitSel = createSelect(kindUnits, unit, "zapis-unit");

    // checkbox hledaná
    const lab = document.createElement("label");
    lab.className = "flex items-center gap-2 text-sm text-gray-300";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "zapis-unknown h-4 w-4";
    const sp = document.createElement("span");
    sp.textContent = "Hledaná veličina";
    lab.append(cb, sp);

    // live validace
    const validate = () => validateRow(row);
    on(symSel,"change", validate);
    on(valInp,"input", validate);
    on(unitSel,"change", validate);
    on(cb,"change", () => {
      valInp.value = cb.checked ? "?" : "";
      valInp.disabled = cb.checked;
      validate();
    });

    row.append(symSel, valInp, unitSel, lab);
    cont.appendChild(row);
  }

  // >>> NOVÉ: pokud žák použil jinou než základní jednotku a jde o veličinu ze zadání,
  //           přidej jeden pomocný řádek se základní jednotkou a žlutým hintem.
  function maybeAddBaseConversionRow(symbol, baseUnitCode) {
    const cont = $("#zapis-container");
    const rows = $$(".zapis-row", cont);
    const already = rows.some(r =>
      r.querySelector(".zapis-symbol")?.value === symbol &&
      r.querySelector(".zapis-unit")?.value   === baseUnitCode
    );
    if (already) return;

    const row = document.createElement("div");
    row.className = zapisRowClass + " zapis-row";

    const symSel = createSelect(["-","F","s","W"], symbol, "zapis-symbol");
    const valInp = createInput("", "Hodnota v základní jednotce");
    valInp.classList.add("zapis-value");
    const unitSel = createSelect(["-"].concat(unitSets[symbolToKind[symbol]]||[]), baseUnitCode, "zapis-unit");

    const lab = document.createElement("div");
    lab.className = "text-yellow-400 text-sm italic col-span-4";
    lab.textContent = `💡 Přidej převod: ${symbol} na ${baseUnitCode}.`;

    row.append(symSel, valInp, unitSel, document.createElement("div"));
    cont.appendChild(row);
    cont.appendChild(lab);
  }

  function validateRow(row) {
    row.classList.remove("ring-2","ring-red-500","ring-green-500");
    const sym  = row.querySelector(".zapis-symbol")?.value;
    const valS = row.querySelector(".zapis-value")?.value?.trim();
    const unit = row.querySelector(".zapis-unit")?.value;
    const unk  = row.querySelector(".zapis-unknown")?.checked;

    if (!sym || sym==="-") return;
    if (unk) { row.classList.add("ring-2","ring-green-500"); return; }

    if (!unit || unit==="-") return;
    const kind = symbolToKind[sym];
    if (!kind) return;
    if (!unitSets[kind].includes(unit)) {
      row.classList.add("ring-2","ring-red-500");
      toast(`❌ ${sym}: neplatná jednotka ${unit}`);
      return;
    }

    const prob = window.currentProblem;
    const given = prob?.givens?.find(g => g.symbol===sym);
    if (!given) { row.classList.add("ring-2","ring-green-500"); return; }

    const val = parseNum(valS);
    if (!isFinite(val)) {
      row.classList.add("ring-2","ring-red-500");
      toast(`❌ ${sym}: hodnota musí být číslo`);
      return;
    }

    const inBase = val * (factor[unit] ?? NaN);
    if (!isFinite(inBase)) {
      row.classList.add("ring-2","ring-red-500");
      toast(`❌ ${sym}: neznámý převod jednotky`);
      return;
    }

    if (almostEq(inBase, given.value)) {
      row.classList.add("ring-2","ring-green-500");
    } else {
      row.classList.add("ring-2","ring-red-500");
      toast(`❌ ${sym}: očekává se ≈ ${given.value} ${given.unit}`);
    }

    // >>> NOVÉ: pokud je jednotka jiná než základní, navrhni převodový řádek
    const base = baseUnit[kind];
    if (unit !== base) {
      maybeAddBaseConversionRow(sym, base);
    }
  }

  function collectRows() {
    return $$(".zapis-row").map(r => ({
      symbol:  r.querySelector(".zapis-symbol")?.value || "-",
      raw:     r.querySelector(".zapis-value")?.value?.trim() || "",
      unit:    r.querySelector(".zapis-unit")?.value || "-",
      unknown: !!r.querySelector(".zapis-unknown")?.checked,
    }));
  }

  function mergedSummary(rows) {
    const order = [];
    const bySym = {};
    rows.forEach(r=>{
      if (!r.symbol || r.symbol==="-" ) return;
      if (!bySym[r.symbol]) { bySym[r.symbol]=[]; order.push(r.symbol); }
      const part = r.unknown ? `?` : `${r.raw} ${r.unit}`;
      if (!bySym[r.symbol].includes(part)) bySym[r.symbol].push(part);
    });
    return order.map(sym => `${sym} = ${bySym[sym].join(" = ")}`).join("\n");
  }

  function checkZapis() {
    const prob = window.currentProblem;
    if (!prob) { toast("Nejprve spusťte příklad."); return false; }

    const rows = collectRows();
    const errs = [];

    if (!rows.some(r => r.unknown)) errs.push("❌ Označte hledanou veličinu.");

    for (const g of prob.givens) {
      const r = rows.find(x => x.symbol===g.symbol && !x.unknown && x.unit!=="-" && x.raw!=="");
      if (!r) { errs.push(`❌ Chybí veličina ${g.symbol}.`); continue; }
      const v  = parseNum(r.raw);
      const fb = factor[r.unit] ?? NaN;
      if (!isFinite(v)||!isFinite(fb)) { errs.push(`❌ ${g.symbol}: neplatná hodnota/jednotka.`); continue; }
      if (!almostEq(v*fb, g.value)) errs.push(`❌ ${g.symbol}: očekává se ≈ ${g.value} ${g.unit}.`);
    }

    const out = $("#zapis-feedback-container"); out && (out.innerHTML = "");
    if (errs.length) {
      const html = `<div class="feedback-wrong"><b>Chyby:</b><ul class="list-disc pl-5 mt-1">${errs.map(e=>`<li>${e}</li>`).join("")}</ul></div>`;
      out?.insertAdjacentHTML("beforeend", html);
      return false;
    }

    const summary = mergedSummary(rows);
    $("#zapis-review-container").innerHTML = `
      <div class="p-3 bg-gray-900 border border-gray-700 rounded">
        <div class="font-semibold mb-2 text-gray-300">Souhrn zápisu:</div>
        <pre class="text-gray-200 text-sm whitespace-pre-wrap">${summary}</pre>
      </div>`;
    return true;
  }

  // --- Výpočetní box -------------------------------------------------
  function buildCalcRow(key, lhsPh, rhsPh, withUnit=false) {
    const row = document.createElement("div");
    row.className = `${rowCls} ${rowCols}`;

    const lhs = document.createElement("input");
    lhs.type="text"; lhs.id=`${key}-lhs`; lhs.maxLength=2; lhs.placeholder=lhsPh; lhs.className = inCls + " text-center w-20 sm:w-24";

    const eq = document.createElement("div");
    eq.textContent="="; eq.className="text-gray-300 text-center";

    const rhs = document.createElement("input");
    rhs.type="text"; rhs.id=`${key}-rhs`; rhs.placeholder=rhsPh; rhs.className = inCls + " w-full";

    row.append(lhs, eq, rhs);

    if (withUnit) {
      const unit = document.createElement("select");
      unit.id="unit-select-v26"; unit.className = inCls;
      ["J","kJ","MJ"].forEach(u=>{ const o=document.createElement("option"); o.value=u; o.textContent=u; unit.appendChild(o); });
      row.appendChild(unit);
    } else {
      const spacer = document.createElement("div"); spacer.style.minWidth="0.5rem"; row.appendChild(spacer);
    }
    return row;
  }

  function renderCalcBox() {
    const host = $("#calc-box-v26");
    if (!host) return;
    host.innerHTML = "";

    host.appendChild(buildCalcRow("formula","např. W","např. F * s"));
    host.appendChild(buildCalcRow("subs","např. W","např. 1000 * 2"));
    host.appendChild(buildCalcRow("result","např. W","např. 2000", true));

    log("✅ výpočetní box v28 vykreslen");
  }

  // --- Ověření výpočtu ----------------------------------------------
  function checkCalculation() {
    const prob = window.currentProblem;
    if (!prob) { toast("Nejprve spusťte příklad."); return; }

    const fTxt = ($("#formula-lhs")?.value||"")+"="+($("#formula-rhs")?.value||"");
    const sTxt = ($("#subs-lhs")?.value||"")+"="+($("#subs-rhs")?.value||"");
    const resV = parseNum($("#result-rhs")?.value);
    const resU = $("#unit-select-v26")?.value || "J";

    const Fg = prob.givens.find(g=>g.symbol==="F");
    const sg = prob.givens.find(g=>g.symbol==="s");
    const Wv = prob.result;

    let formulaOK=false, substOK=false, resultOK=false;
    const compact = fTxt.replace(/\s+/g,"");
    formulaOK = /^W=(F[*·]s|s[*·]F)$/.test(compact);

    const m = sTxt.replace(/\s+/g,"").match(/^W=(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/);
    if (m && Fg && sg) {
      const a = parseNum(m[1]); const b = parseNum(m[2]);
      substOK = (almostEq(a,Fg.value) && almostEq(b,sg.value)) ||
                (almostEq(a,sg.value) && almostEq(b,Fg.value));
    }

    const inJ = resV * (factor[resU] ?? 1);
    resultOK = isFinite(resV) && almostEq(inJ, Wv);

    const fb = $("#vypocet-feedback-container");
    if (fb) {
      const msgs = [];
      msgs.push(formulaOK ? "✅ Vzorec v pořádku." : "❌ Uprav vzorec (W = F * s).");
      msgs.push(substOK ? "✅ Správné dosazení." : "❌ Zkontroluj dosazení (hodnoty musí odpovídat zadání).");
      msgs.push(resultOK ? "✅ Výsledek je správně." : "❌ Výsledek neodpovídá.");

      fb.innerHTML = `
        <div class="p-3 bg-gray-900 border border-gray-700 rounded space-y-2">
          ${msgs.map(m=>`<div>${m}</div>`).join("")}
        </div>`;
    }
  }

  // --- Modály (beze změny) ------------------------------------------
  function toggleModal(id, show) {
    const m = $(id);
    if (!m) return;
    m.classList.toggle("hidden", !show);
  }
  function renderFormula() {
    const c = $("#formula-svg-container");
    if (!c) return;
    c.innerHTML = `
      <svg width="240" height="180" viewBox="0 0 240 180">
        <polygon points="120,15 25,165 215,165" fill="none" stroke="white" stroke-width="2"/>
        <line x1="52" y1="112" x2="188" y2="112" stroke="white" stroke-width="2"/>
        <text x="120" y="70"  fill="white" font-size="36" text-anchor="middle">W</text>
        <text x="120" y="150" fill="white" font-size="26" text-anchor="middle">F · s</text>
      </svg>`;
  }
  function renderDiagram() {
    const c = $("#diagram-svg-container");
    if (!c) return;
    const prob = window.currentProblem;
    const F = prob?.givens?.find(g => g.symbol==="F") || {};
    const s = prob?.givens?.find(g => g.symbol==="s") || {};
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
        <text x="215" y="118" fill="red" font-size="16" text-anchor="middle">F = ${F.value ?? "?"} ${F.unit ?? ""}</text>
        <line x1="85" y1="175" x2="255" y2="175" stroke="orange" stroke-width="2" marker-end="url(#arrowhead2)"/>
        <text x="170" y="190" fill="orange" font-size="14" text-anchor="middle">s = ${s.value ?? "?"} ${s.unit ?? ""}</text>
      </svg>`;
  }
  function renderHelp() {
    const h = $("#help-content"); if (!h) return;
    h.innerHTML = `
      <div class="space-y-3 text-gray-300 text-sm text-left">
        <p>💡 <b>Tip:</b> Zapište známé veličiny a <b>označte hledanou</b> (otazníkem).</p>
        <p>🔁 Hodnoty v násobcích (kN, km, kJ…) převádějte na základní jednotky.</p>
        <p>🧮 Vzorec pro práci je <b>W = F · s</b>.</p>
        <p>✅ Do výpočtu přejdete až po správném zápisu všech veličin.</p>
      </div>`;
  }
  function renderCalculator() {
    const display = $("#calculator-display");
    const history = $("#calculator-history");
    const btns    = $("#calculator-buttons");
    if (!display || !history || !btns) return;
    btns.innerHTML = "";
    const keys = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+","C","⌫","Copy"];
    keys.forEach(k => {
      const b = document.createElement("button");
      b.textContent = k;
      b.className = "bg-gray-700 text-white py-2 rounded hover:bg-gray-600";
      btns.appendChild(b);
    });
    let current = "";
    const update = ()=> display.textContent = current || "0";
    update();
    btns.addEventListener("click", e => {
      const t = e.target.textContent;
      if (t==="C"){ current=""; history.textContent=""; }
      else if (t==="⌫"){ current = current.slice(0,-1); }
      else if (t==="="){
        try { const r = eval(current); history.textContent = `${current} =`; current = String(r); }
        catch { current = "Error"; }
      } else if (t==="Copy"){ navigator.clipboard?.writeText(display.textContent); }
      else { current += t; }
      update();
    });
  }
  function wireModals() {
    on($("#open-diagram-button"),  "click", () => { renderDiagram(); toggleModal("#diagram-modal", true); });
    on($("#open-formula-button"),  "click", () => { renderFormula(); toggleModal("#formula-modal", true); });
    on($("#open-help-button"),     "click", () => { renderHelp(); toggleModal("#help-modal", true); });
    on($("#open-calculator-button"),"click", () => { renderCalculator(); toggleModal("#calculator-modal", true); });

    on($("#close-diagram-button"), "click", () => toggleModal("#diagram-modal", false));
    on($("#close-formula-button"), "click", () => toggleModal("#formula-modal", false));
    on($("#close-help-button"),    "click", () => toggleModal("#help-modal", false));
    on($("#close-calculator-button"), "click", () => toggleModal("#calculator-modal", false));

    ["#diagram-modal","#formula-modal","#help-modal","#calculator-modal"].forEach(id=>{
      const m = $(id);
      on(m, "click", (e)=>{ if (e.target === m) toggleModal(id, false); });
    });
  }

  // --- Reset stavu ---------------------------------------------------
  function resetForNewProblem() {
    log("↺ reset pro nový příklad");
    $("#zapis-container")?.replaceChildren();
    $("#zapis-feedback-container") && ($("#zapis-feedback-container").innerHTML = "");
    $("#zapis-review-container") && ($("#zapis-review-container").innerHTML = "");
    addZapisRow(); // první prázdný řádek

    $("#calc-box-v26") && ($("#calc-box-v26").innerHTML = "");
    $("#vypocet-feedback-container") && ($("#vypocet-feedback-container").innerHTML = "");

    $("#vypocet-step")?.classList.add("hidden");
    $("#zapis-step")?.classList.remove("hidden");
  }

  function observeProblemText() {
    const node = $("#problem-text");
    if (!node) return;
    let last = node.textContent;
    const mo = new MutationObserver(()=>{
      const cur = node.textContent;
      if (cur !== last) {
        last = cur;
        resetForNewProblem();
      }
    });
    mo.observe(node, {childList:true, subtree:true, characterData:true});
  }

  // --- Handlery ------------------------------------------------------
  function wireButtons() {
    on($("#add-zapis-row-button"), "click", () => addZapisRow());
    on($("#check-zapis-button"), "click", () => {
      if (!checkZapis()) return;
      $("#zapis-step")?.classList.add("hidden");
      $("#vypocet-step")?.classList.remove("hidden");
      renderCalcBox();
    });
    on($("#check-calculation-button"), "click", checkCalculation);
    on($("#new-problem-button"), "click", resetForNewProblem);
    if ($$(".zapis-row").length === 0) addZapisRow();
  }

  // --- Start ---------------------------------------------------------
  window.addEventListener("load", () => {
    log("DOM ready");
    wireButtons();
    wireModals();
    observeProblemText();
  });
})();
