
/*
  app_final_calc_v17.js
  ------------------------------------------------------------
  Samostatný výpočetní modul (sjednocená varianta A)
  - čeká na spuštění procvičování (app_cleaned_v11.js)
  - zápis se kontroluje po kliknutí na „Zkontrolovat zápis“
  - po validaci se zobrazí vlastní „Výpočetní část“ (LHS = RHS + jednotka)
  - live validace všech 3 řádků (vzorec, dosazení, výsledek)
  - výsledky a nápovědy v odděleném boxu pod výpočtem
  ------------------------------------------------------------
*/

(function () {
  console.log("🧩 v17: start");

  // ---------- Utilities ----------
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const cls = (el, add=[], rem=[]) => {
    if (!el) return;
    (Array.isArray(rem)?rem:[rem]).forEach(r => r && el.classList.remove(r));
    (Array.isArray(add)?add:[add]).forEach(a => a && el.classList.add(a));
  };
  const num = (x) => {
    if (x == null) return NaN;
    const t = String(x).replace(",", ".").trim();
    if (t === "") return NaN;
    return Number(t);
  };
  const almostEqual = (a,b,rel=0.05) => {
    if (!isFinite(a) || !isFinite(b)) return false;
    if (b === 0) return Math.abs(a) < 1e-9;
    return Math.abs(a-b) <= Math.abs(b)*rel;
  };

  // převody
  const unitToBaseFactor = {
    mm:1/1000, cm:1/100, m:1, km:1000,
    J:1, kJ:1000, MJ:1_000_000,
    N:1, kN:1000, MN:1_000_000
  };
  const symbolToKind = { s:"length", F:"force", W:"energy" };
  const unitSets = {
    length:["mm","cm","m","km"],
    energy:["J","kJ","MJ"],
    force:["N","kN","MN"]
  };

  function currentUnknownSymbol() {
    const row = $$(".zapis-row").find(r => r.querySelector(".zapis-unknown")?.checked);
    const s = row?.querySelector(".zapis-symbol")?.value;
    return (s && s !== "-") ? s : "W";
  }

  // ---------- Build calc box (hidden by default) ----------
  function ensureCalcBox() {
    let box = $("#calc-box-v17");
    if (box) return box;

    // Umístění: za #zapis-step (existuje v app_cleaned_v11.js)
    const anchor = $("#zapis-step") || $("#practice-screen");
    if (!anchor) return null;

    box = document.createElement("section");
    box.id = "calc-box-v17";
    box.className = "hidden mt-6 bg-gray-850/60 border border-gray-700 rounded-xl p-4 space-y-3";

    box.innerHTML = `
      <h3 class="text-lg font-semibold text-blue-300 flex items-center gap-2">
        <span class="inline-block h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
        Výpočetní část
      </h3>

      <div class="grid gap-3">
        <!-- Vzorec -->
        <div class="grid grid-cols-[110px_22px_1fr] items-center gap-2">
          <input id="v17-formula-lhs" class="p-2 rounded-md bg-gray-900 border border-gray-700 text-white text-center"
                 type="text" maxlength="2" placeholder="např. W">
          <div class="text-center text-gray-300">=</div>
          <input id="v17-formula-rhs" class="p-2 rounded-md bg-gray-900 border border-gray-700 text-white"
                 type="text" placeholder="např. F * s">
        </div>

        <!-- Dosazení -->
        <div class="grid grid-cols-[110px_22px_1fr] items-center gap-2">
          <input id="v17-subs-lhs" class="p-2 rounded-md bg-gray-900 border border-gray-700 text-white text-center"
                 type="text" maxlength="2" placeholder="např. W">
          <div class="text-center text-gray-300">=</div>
          <input id="v17-subs-rhs" class="p-2 rounded-md bg-gray-900 border border-gray-700 text-white"
                 type="text" placeholder="např. 1000 * 2">
        </div>

        <!-- Výsledek -->
        <div class="grid grid-cols-[110px_22px_1fr_110px] items-center gap-2">
          <input id="v17-result-lhs" class="p-2 rounded-md bg-gray-900 border border-gray-700 text-white text-center"
                 type="text" maxlength="2" placeholder="např. W">
          <div class="text-center text-gray-300">=</div>
          <input id="v17-result-rhs" class="p-2 rounded-md bg-gray-900 border border-gray-700 text-white"
                 type="text" placeholder="např. 2000">
          <select id="v17-unit" class="p-2 rounded-md bg-gray-900 border border-gray-700 text-white">
            <option>J</option><option>kJ</option><option>MJ</option>
          </select>
        </div>

        <div class="flex justify-end">
          <button id="v17-check" class="btn btn-primary px-5">Ověřit výpočet</button>
        </div>

        <!-- Výsledkový box -->
        <div id="v17-result-box" class="hidden rounded-lg border border-gray-700 bg-gray-900/70 p-3 text-sm space-y-2"></div>
      </div>
    `;
    anchor.parentElement?.insertBefore(box, anchor.nextSibling);
    console.log("✅ v17: calc box created");
    return box;
  }

  function mark(el, ok) {
    el.classList.remove("ring-2","ring-red-500","ring-green-500");
    if (!el.value.trim()) return;
    el.classList.add("ring-2", ok ? "ring-green-500" : "ring-red-500");
  }

  // ---------- Live validation ----------
  function attachLiveValidation() {
    const fL = $("#v17-formula-lhs");
    const fR = $("#v17-formula-rhs");
    const sL = $("#v17-subs-lhs");
    const sR = $("#v17-subs-rhs");
    const rL = $("#v17-result-lhs");
    const rR = $("#v17-result-rhs");
    const unit = $("#v17-unit");
    if (!fL || !fR) return;

    function vFormula() {
      const L = (fL.value||"").trim();
      const R = (fR.value||"").trim().replace(/\s+/g,"");
      const u = currentUnknownSymbol();
      let ok = false;
      if (u === "W") ok = /^[Ww]$/.test(L) && /^(F[*·]s|s[*·]F)$/i.test(R);
      else if (u === "F") ok = /^[Ff]$/.test(L) && /^W\/s$/i.test(R);
      else if (u === "s") ok = /^[sS]$/.test(L) && /^W\/F$/i.test(R);
      mark(fL, ok && L); mark(fR, ok && R);
    }
    function vSubs() {
      const L = (sL.value||"").trim();
      const R = (sR.value||"").trim().replace(/\s+/g,"");
      const Fg = window.currentProblem?.givens?.find(g=>g.symbol==="F");
      const sg = window.currentProblem?.givens?.find(g=>g.symbol==="s");
      const Wv = window.currentProblem?.result;
      const u = currentUnknownSymbol();
      let ok = false;
      if (u === "W") {
        const m = R.match(/^(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/);
        if (m && Fg && sg) {
          const a = num(m[1]), b = num(m[2]);
          ok = (/^[Ww]$/.test(L)) && (
            (almostEqual(a,Fg.value) && almostEqual(b,sg.value)) ||
            (almostEqual(a,sg.value) && almostEqual(b,Fg.value))
          );
        }
      } else if (u === "F") {
        const m = R.match(/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
        if (m && sg && isFinite(Wv)) {
          ok = (/^[Ff]$/.test(L)) && almostEqual(num(m[1]), Wv) && almostEqual(num(m[2]), sg.value);
        }
      } else if (u === "s") {
        const m = R.match(/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
        if (m && Fg && isFinite(Wv)) {
          ok = (/^[sS]$/.test(L)) && almostEqual(num(m[1]), Wv) && almostEqual(num(m[2]), Fg.value);
        }
      }
      mark(sL, ok && L); mark(sR, ok && R);
    }
    function vRes() {
      const L = (rL.value||"").trim();
      const R = num(rR.value);
      const u = currentUnknownSymbol();
      let ok = false;
      if (u === "W") {
        const factor = unitToBaseFactor[unit.value] ?? 1;
        ok = /^[Ww]$/.test(L) && isFinite(R) && almostEqual(R*factor, window.currentProblem?.result);
      } else {
        ok = /^[WwFfSs]$/.test(L) && isFinite(R);
      }
      mark(rL, ok && L); mark(rR, ok && String(R));
    }

    [fL,fR].forEach(el => on(el, "input", vFormula));
    [sL,sR].forEach(el => on(el, "input", vSubs));
    [rL,rR,unit].forEach(el => on(el, "input", vRes));
  }

  // ---------- Zápis validator (spouští zobrazení calc boxu) ----------
  function validateZapisAndMaybeShowCalc() {
    const rows = $$(".zapis-row");
    const problem = window.currentProblem;
    if (!rows.length || !problem?.givens) return false;

    const errors = [];
    // musí být zvolena hledaná veličina
    const hasUnknown = rows.some(r => r.querySelector(".zapis-unknown")?.checked);
    if (!hasUnknown) errors.push("Označte jednu veličinu jako hledanou.");

    // každá daná veličina musí být zapsána správně (s tolerancí převodu)
    problem.givens.forEach(g => {
      const row = rows.find(r => r.querySelector(".zapis-symbol")?.value === g.symbol);
      if (!row) { errors.push(`Chybí veličina ${g.symbol}.`); return; }
      const unit = row.querySelector(".zapis-unit")?.value;
      const raw  = row.querySelector(".zapis-value")?.value?.trim();
      if (!unit || unit === "-" || !raw) { errors.push(`Doplňte hodnotu a jednotku u ${g.symbol}.`); return; }
      const factor = unitToBaseFactor[unit] ?? NaN;
      const val    = num(raw);
      if (!isFinite(factor) || !isFinite(val)) {
        errors.push(`Neplatná hodnota/jednotka u ${g.symbol}.`);
        return;
      }
      const inBase = val * factor;
      if (!almostEqual(inBase, g.value)) {
        errors.push(`${g.symbol}: očekává se ≈ ${g.value} ${g.unit}, zadáno ${val} ${unit}.`);
      }
    });

    const box = $("#calc-box-v17") || ensureCalcBox();
    const resultBox = $("#v17-result-box");
    if (errors.length) {
      if (box) cls(box, "hidden", []); // schovat výpočet
      if (resultBox) {
        resultBox.innerHTML = `<div class="text-red-300">Zápis není v pořádku:</div>
          <ul class="list-disc pl-5 text-red-200">${errors.map(e=>`<li>${e}</li>`).join("")}</ul>`;
        cls(resultBox, [], "hidden");
      }
      return false;
    }

    // zápis v pořádku → ukázat výpočet
    if (box) cls(box, [], "hidden");
    if (resultBox) { resultBox.innerHTML = ""; cls(resultBox, "hidden", []); }
    return true;
  }

  // ---------- Kontrola výpočtu ----------
  function attachFinalCheck() {
    const btn = $("#v17-check");
    const fL = $("#v17-formula-lhs");
    const fR = $("#v17-formula-rhs");
    const sL = $("#v17-subs-lhs");
    const sR = $("#v17-subs-rhs");
    const rL = $("#v17-result-lhs");
    const rR = $("#v17-result-rhs");
    const unit = $("#v17-unit");
    const box = $("#v17-result-box");
    if (!btn || !box) return;

    on(btn, "click", () => {
      const msgs = [];
      const unknown = currentUnknownSymbol();

      // 1) Vzorec
      const compact = (fL.value||"").trim() + "=" + (fR.value||"").trim().replace(/\s+/g,"");
      let formulaOK = false;
      if (unknown==="W") formulaOK = /^W=(F[*·]s|s[*·]F)$/i.test(compact);
      else if (unknown==="F") formulaOK = /^F=W\/s$/i.test(compact);
      else if (unknown==="s") formulaOK = /^s=W\/F$/i.test(compact);
      if (!formulaOK) msgs.push("Upravte vzorec (např. W = F * s).");

      // 2) Dosazení
      let subsOK = false;
      const Fg = window.currentProblem?.givens?.find(g=>g.symbol==="F");
      const sg = window.currentProblem?.givens?.find(g=>g.symbol==="s");
      const Wv = window.currentProblem?.result;
      const R = (sR.value||"").trim().replace(/\s+/g,"");
      if (unknown==="W") {
        const m = R.match(/^(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/);
        if (m && Fg && sg) {
          const a = num(m[1]), b = num(m[2]);
          subsOK = (/^[Ww]$/.test(sL.value||"")) &&
                   ( (almostEqual(a,Fg.value) && almostEqual(b,sg.value)) ||
                     (almostEqual(a,sg.value) && almostEqual(b,Fg.value)) );
          if (!subsOK) msgs.push("Zkontrolujte dosazení (měla by to být čísla ze zadání pro F a s).");
        } else msgs.push("Dosazení zadejte jako např. 1000 * 2.");
      } else if (unknown==="F" && sg && isFinite(Wv)) {
        const m = R.match(/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
        subsOK = m && /^[Ff]$/.test(sL.value||"") && almostEqual(num(m[1]), Wv) && almostEqual(num(m[2]), sg.value);
        if (!subsOK) msgs.push("Pro F použijte tvar F = W / s a dosazení např. 2000 / 2.");
      } else if (unknown==="s" && Fg && isFinite(Wv)) {
        const m = R.match(/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
        subsOK = m && /^[sS]$/.test(sL.value||"") && almostEqual(num(m[1]), Wv) && almostEqual(num(m[2]), Fg.value);
        if (!subsOK) msgs.push("Pro s použijte tvar s = W / F a dosazení např. 2000 / 1000.");
      }

      // 3) Výsledek
      const val = num(rR.value);
      let resultOK = false;
      if (unknown==="W") {
        const factor = unitToBaseFactor[unit.value] ?? 1;
        resultOK = /^[Ww]$/.test(rL.value||"") && isFinite(val) && almostEqual(val*factor, Wv);
        if (!resultOK) msgs.push("Výsledek neodpovídá. Přepočítejte a zkontrolujte jednotku.");
      } else {
        resultOK = /^[WwFfSs]$/.test(rL.value||"") && isFinite(val);
        if (!resultOK) msgs.push("Doplňte výsledek ve správném formátu.");
      }

      // Výpis výsledků
      if (!msgs.length) {
        box.innerHTML = `<div class="text-green-300">✅ Výpočet je správně!</div>`;
      } else {
        box.innerHTML = `
          <div class="text-red-300">❌ Něco je špatně, mrkněte na tipy:</div>
          <ul class="list-disc pl-5 text-red-200">${msgs.map(m=>`<li>${m}</li>`).join("")}</ul>`;
      }
      cls(box, [], "hidden");
    });
  }

  // ---------- Bind buttons ----------
  function bindTriggers() {
    const checkBtn = $("#check-zapis-button");
    const newBtn = $("#new-problem-button");
    const startBtn = $("#start-button");

    on(checkBtn, "click", () => {
      setTimeout(() => { // necháme doběhnout případnou vnitřní logiku app_cleaned_v11
        validateZapisAndMaybeShowCalc();
      }, 0);
    });
    on(newBtn, "click", () => {
      setTimeout(() => {
        const box = $("#calc-box-v17");
        if (box) cls(box, "hidden", []); // schovat
        const rb = $("#v17-result-box"); if (rb) { rb.innerHTML=""; cls(rb, "hidden", []); }
      }, 0);
    });
    on(startBtn, "click", () => {
      setTimeout(() => {
        ensureCalcBox();
        attachLiveValidation();
        attachFinalCheck();
        const box = $("#calc-box-v17"); if (box) cls(box, "hidden", []); // při startu skryto
      }, 0);
    });
  }

  function init() {
    ensureCalcBox();
    attachLiveValidation();
    attachFinalCheck();
    bindTriggers();
    console.log("✅ v17: připraven (čeká na validní zápis).");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
