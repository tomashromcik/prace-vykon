
/*
  app_hotfix_bind_v16.js
  ------------------------------------------------------------
  Nouzové připojení handlerů pro tlačítka „+ Přidat veličinu“
  a „Zkontrolovat zápis“ + minimální validace zápisu.
  Funguje i bez interních funkcí app_cleaned_v11.js.
  ------------------------------------------------------------
*/

(function() {
  console.log("🩹 Hotfix v16: init");

  // helpers
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

  function parseNum(s){
    if (s == null) return NaN;
    const t = String(s).trim().replace(",", ".");
    if (!t) return NaN;
    return Number(t);
  }
  const unitToBase = {
    mm:1/1000, cm:1/100, m:1, km:1000,
    J:1, kJ:1000, MJ:1_000_000,
    N:1, kN:1000, MN:1_000_000
  };
  const symbolKind = { s:"length", F:"force", W:"energy" };
  const kindUnits = {
    length:["mm","cm","m","km"],
    energy:["J","kJ","MJ"],
    force:["N","kN","MN"]
  };
  function eqApprox(a,b,rel=0.05){
    if (!isFinite(a) || !isFinite(b)) return false;
    if (b === 0) return Math.abs(a) < 1e-9;
    return Math.abs(a-b) <= Math.abs(b)*rel;
  }

  // Elements
  const addBtn = document.getElementById("add-zapis-row-button");
  const checkBtn = document.getElementById("check-zapis-button");
  const container = document.getElementById("zapis-container");
  const feedback = document.getElementById("zapis-feedback-container");

  // If anything missing, bail out silently
  if (!addBtn || !checkBtn || !container) {
    console.warn("🩹 Hotfix v16: nebylo co opravovat (chybí prvky).");
    return;
  }

  // ——— add row ———
  function addRow(defaults={symbol:"-", unit:"-", value:"", unknown:false}){
    const row = document.createElement("div");
    row.className = "grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";

    const sym = document.createElement("select");
    ["-","F","s","W"].forEach(v=>{
      const o=document.createElement("option"); o.value=v; o.textContent=v; sym.appendChild(o);
    });
    sym.value = defaults.symbol;

    const val = document.createElement("input");
    val.type="text";
    val.placeholder="Hodnota";
    val.value = defaults.value || "";
    val.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white zapis-value";

    const unit = document.createElement("select");
    ["-","mm","cm","m","km","J","kJ","MJ","N","kN","MN"].forEach(v=>{
      const o=document.createElement("option"); o.value=v; o.textContent=v; unit.appendChild(o);
    });
    unit.value = defaults.unit;

    const lab = document.createElement("label");
    lab.className="flex items-center gap-2 text-sm text-gray-300";
    const cb = document.createElement("input");
    cb.type="checkbox"; cb.checked = !!defaults.unknown; cb.className="zapis-unknown h-4 w-4";
    lab.append(cb, document.createTextNode("Hledaná veličina"));

    sym.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white zapis-symbol";
    unit.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white zapis-unit";

    row.append(sym, val, unit, lab);
    container.appendChild(row);
  }

  // initial safeguard: ensure at least one row exists
  if ($$(".zapis-row", container).length === 0) addRow();

  // bind add button
  addBtn.addEventListener("click", () => addRow());

  // collect rows
  function getRows(){
    return $$(".zapis-row", container).map(r => ({
      symbol: $(".zapis-symbol", r)?.value || "-",
      unit: $(".zapis-unit", r)?.value || "-",
      valueRaw: $(".zapis-value", r)?.value.trim() || "",
      unknown: $(".zapis-unknown", r)?.checked || false,
      el: r
    }));
  }

  function clearFeedback(){
    if (feedback) feedback.innerHTML = "";
  }
  function pushFeedback(msg, ok=false){
    if (!feedback) return;
    const d = document.createElement("div");
    d.className = ok ? "text-green-400 text-sm mt-1" : "text-yellow-300 text-sm mt-1";
    d.textContent = msg;
    feedback.appendChild(d);
  }

  function validateRows(){
    clearFeedback();
    const rows = getRows();
    const prob = window.currentProblem || {};
    const errs = [];

    // must have a marked unknown
    if (!rows.some(r => r.unknown)) {
      errs.push("Označte hledanou veličinu (zaškrtněte políčko).");
    }

    // all givens must be present & correct (with conversion)
    (prob.givens || []).forEach(g => {
      const r = rows.find(x => x.symbol === g.symbol && !x.unknown);
      if (!r) { errs.push(`Chybí veličina ${g.symbol}.`); return; }
      const kind = symbolKind[g.symbol];
      if (!kind) return;
      if (!kindUnits[kind].includes(r.unit)) {
        errs.push(`Veličina ${g.symbol} musí mít jednotku z {${kindUnits[kind].join(", ")}}.`);
        return;
      }
      const val = parseNum(r.valueRaw);
      if (!isFinite(val)) { errs.push(`Veličina ${g.symbol} musí být číslo.`); return; }
      const factor = unitToBase[r.unit] || NaN;
      const inBase = val * factor;
      if (!eqApprox(inBase, g.value)) {
        errs.push(`${g.symbol}: očekává se ≈ ${g.value} ${g.unit}, máte ${val} ${r.unit}.`);
      }
    });

    // visual flags
    rows.forEach(r => {
      r.el.classList.remove("ring-2","ring-red-500","ring-green-500");
      if (r.symbol==="-" || r.unit==="-" || (!r.unknown && r.valueRaw==="")) return;
      const kind = symbolKind[r.symbol];
      let ok = true;
      if (kind && !kindUnits[kind].includes(r.unit)) ok = false;
      if (!r.unknown) {
        const val = parseNum(r.valueRaw);
        const g = (window.currentProblem?.givens || []).find(x => x.symbol===r.symbol);
        if (g){
          const factor = unitToBase[r.unit] || NaN;
          ok = ok && isFinite(val) && isFinite(factor) && eqApprox(val*factor, g.value);
        }
      }
      r.el.classList.add("ring-2", ok ? "ring-green-500" : "ring-red-500");
    });

    return { ok: errs.length===0, errs, rows };
  }

  function showCalcBox(){
    // try a few known IDs/classes from v14–v16
    const el = document.getElementById("calc-box-v16") ||
               document.getElementById("calc-box-v14") ||
               document.querySelector("[data-calc-box]");
    if (el) el.classList.remove("hidden");
  }

  // bind check button
  checkBtn.addEventListener("click", () => {
    const res = validateRows();
    if (!res.ok) {
      pushFeedback("Zápis ještě není kompletní. Opravte uvedené položky.");
      res.errs.forEach(e => pushFeedback("• " + e));
      return;
    }
    pushFeedback("✅ Zápis je v pořádku. Pokračujte na výpočet.", true);
    showCalcBox();
  });

  console.log("🩹 Hotfix v16: vázání dokončeno.");
})();
