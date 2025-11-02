// ====================================================================
//  app_final_calc_v26.js
//  - čisté UI bez starých single-inputů
//  - tlačítko „+ Přidat veličinu“ funkční (zápisové řádky se živě validují)
//  - po „Zkontrolovat zápis“ se vykreslí nový 3-řádkový výpočetní box
//  - stejné vizuální třídy jako zápis
//  - logy ponechány pro debug
// ====================================================================

console.log("🧩 Načítání app_final_calc_v26.js ...");

(function () {
  // --- Helpers -------------------------------------------------------
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const log = (...a) => console.log("v26:", ...a);

  // mapy + převody (stejné jako dřív)
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

  // --- Zápis UI ------------------------------------------------------
  const zapisRowClass = "grid grid-cols-1 sm:grid-cols-4 gap-2 mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";
  const inputClass    = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white";
  const selectClass   = inputClass;

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
    if (almostEq(inBase, given.value)) row.classList.add("ring-2","ring-green-500");
    else {
      row.classList.add("ring-2","ring-red-500");
      toast(`❌ ${sym}: očekává se ≈ ${given.value} ${given.unit}`);
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

    // musí být jedna „hledaná“
    if (!rows.some(r => r.unknown)) errs.push("❌ Označte hledanou veličinu.");

    // ověř, že F a s sedí na základní jednotky
    for (const g of prob.givens) {
      const r = rows.find(x => x.symbol===g.symbol && !x.unknown);
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

    // shrnutí
    const summary = mergedSummary(rows);
    $("#zapis-review-container").innerHTML = `
      <div class="p-3 bg-gray-900 border border-gray-700 rounded">
        <div class="font-semibold mb-2 text-gray-300">Souhrn zápisu:</div>
        <pre class="text-gray-200 text-sm whitespace-pre-wrap">${summary}</pre>
      </div>`;
    return true;
  }

  // --- Výpočetní box (nový) -----------------------------------------
  const rowCls   = "grid items-center gap-2 mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";
  const rowCols  = "grid-cols-[5.5rem,auto,1fr,auto] sm:grid-cols-[6rem,auto,1fr,auto]";
  const inCls    = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white";

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

    // doplnění live-mirrorů do interní logiky (nepotřebujeme staré single inputy)
    log("✅ výpočetní box v26 vykreslen");
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
    // vzorec
    const compact = fTxt.replace(/\s+/g,"");
    formulaOK = /^W=(F[*·]s|s[*·]F)$/.test(compact);

    // dosazení
    const m = sTxt.replace(/\s+/g,"").match(/^W=(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/);
    if (m && Fg && sg) {
      const a = parseNum(m[1]); const b = parseNum(m[2]);
      substOK = (almostEq(a,Fg.value) && almostEq(b,sg.value)) ||
                (almostEq(a,sg.value) && almostEq(b,Fg.value));
    }

    // výsledek
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

  // --- Handlery ------------------------------------------------------
  function wireButtons() {
    // + Přidat veličinu
    on($("#add-zapis-row-button"), "click", () => {
      addZapisRow();
    });

    // Zkontrolovat zápis
    on($("#check-zapis-button"), "click", () => {
      if (!checkZapis()) return;
      // přepni do výpočtu (očekává se, že app_cleaned_v11.js už přepnul – ale pro jistotu)
      $("#zapis-step")?.classList.add("hidden");
      $("#vypocet-step")?.classList.remove("hidden");
      renderCalcBox();
    });

    // Ověřit výpočet
    on($("#check-calculation-button"), "click", checkCalculation);

    // inicializační jedna prázdná řádka zápisu
    if ($$(".zapis-row").length === 0) addZapisRow();
  }

  // --- Start ---------------------------------------------------------
  window.addEventListener("load", () => {
    log("DOM ready");
    wireButtons();
  });
})();
