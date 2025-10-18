
/*
  app_final_calc_v4.js
  ------------------------------------------------------------
  Přidává samostatný rámeček „Výpočetní část“ s dvoupólovými poli
  (LHS = RHS), live validací a modálním shrnutím. Nemění původní
  logiku generování příkladů ani zápisu. Původní single-inputy
  ve výpočtu skryje, ale ponechá v DOM kvůli kompatibilitě.
  ------------------------------------------------------------
*/

(function () {
  // Helpers
  const $  = (s, c=document) => c.querySelector(s);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const cls = (node, add, rem=[]) => {
    if (!node) return;
    (Array.isArray(rem) ? rem : [rem]).filter(Boolean).forEach(r => node.classList.remove(r));
    (Array.isArray(add) ? add : [add]).filter(Boolean).forEach(a => node.classList.add(a));
  };

  // Simple border feedback
  const markOK  = el => cls(el, "border-green-500", ["border-red-500"]);
  const markBAD = el => cls(el, "border-red-500",  ["border-green-500"]);
  const markNEU = el => cls(el, [],                ["border-green-500","border-red-500"]);

  function hideOriginalCalcInputs() {
    const ids = ["formula-input","substitution-input","user-answer"];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });
  }

  function ensureCalcBox() {
    // Parent section (neměníme strukturu, jen vkládáme nový box dovnitř)
    const mainStep = $("#main-calculation-step");
    if (!mainStep) return null;

    // Pokud už existuje, nespamovat
    let box = $("#calc-box-v4", mainStep);
    if (box) return box;

    box = document.createElement("div");
    box.id = "calc-box-v4";
    box.className = "mt-4 bg-blue-950/40 border border-blue-700/40 rounded-xl p-4 space-y-4";
    box.innerHTML = `
      <h4 class="text-lg font-semibold text-blue-300">Výpočetní část</h4>
      <div id="row-formula" class="flex items-center gap-3">
        <input id="calc-formula-lhs" type="text" placeholder="např. W"
               class="p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 w-24">
        <span class="text-xl font-bold text-gray-300 select-none">=</span>
        <input id="calc-formula-rhs" type="text" placeholder="např. F * s"
               class="p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 flex-1">
      </div>

      <div id="row-subs" class="flex items-center gap-3">
        <input id="calc-subs-lhs" type="text" placeholder="např. W"
               class="p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 w-24">
        <span class="text-xl font-bold text-gray-300 select-none">=</span>
        <input id="calc-subs-rhs" type="text" placeholder="např. 1000 * 2"
               class="p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 flex-1">
      </div>

      <div id="row-result" class="flex items-center gap-3">
        <input id="calc-result-lhs" type="text" placeholder="např. W"
               class="p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 w-24">
        <span class="text-xl font-bold text-gray-300 select-none">=</span>
        <input id="calc-result-rhs" type="text" placeholder="např. 2000"
               class="p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 flex-1">
        <div id="calc-unit-slot"></div>
      </div>
    `;
    // vložit box na konec sekce
    mainStep.appendChild(box);

    // Přestěhovat select jednotek do slotu na řádku výsledku
    const unit = $("#unit-select");
    const slot = $("#calc-unit-slot", box);
    if (unit && slot) {
      slot.appendChild(unit);
      unit.classList.add("ml-1","mt-0");
    }

    return box;
  }

  function ensureSummaryModal() {
    if ($("#calc-modal-v4")) return;
    const wrap = document.createElement("div");
    wrap.id = "calc-modal-v4";
    wrap.className = "hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4";
    wrap.innerHTML = `
      <div class="bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-xl space-y-4 relative">
        <button id="calc-modal-v4-close" class="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        <h3 class="text-xl font-semibold text-white">Shrnutí & hodnocení</h3>
        <div id="calc-modal-v4-content" class="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap"></div>
      </div>`;
    document.body.appendChild(wrap);
    on($("#calc-modal-v4-close"), "click", () => wrap.classList.add("hidden"));
    on(wrap, "click", (e) => { if (e.target === wrap) wrap.classList.add("hidden"); });
  }

  function showSummaryModal(text) {
    ensureSummaryModal();
    $("#calc-modal-v4-content").textContent = text;
    $("#calc-modal-v4").classList.remove("hidden");
  }

  function attachValidation() {
    const fL = $("#calc-formula-lhs");
    const fR = $("#calc-formula-rhs");
    const sL = $("#calc-subs-lhs");
    const sR = $("#calc-subs-rhs");
    const rL = $("#calc-result-lhs");
    const rR = $("#calc-result-rhs");
    const unit = $("#unit-select");

    const singleFormula = $("#formula-input");
    const singleSubs    = $("#substitution-input");
    const singleResult  = $("#user-answer");

    // Mirror do původních inputů (kvůli zbytku logiky)
    function mirrorSingles() {
      if (singleFormula) singleFormula.value = (fL.value && fR.value) ? `${fL.value} = ${fR.value}` : "";
      if (singleSubs)    singleSubs.value    = (sL.value && sR.value) ? `${sL.value} = ${sR.value}` : "";
      if (singleResult)  singleResult.value  = (rR.value || "").trim();
      // Spustit případnou stávající live validaci (pokud existuje)
      try {
        if (typeof window.formulaLiveValidate === "function") window.formulaLiveValidate();
        if (typeof window.substitutionLiveValidate === "function") window.substitutionLiveValidate();
        if (typeof window.resultLiveValidate === "function") window.resultLiveValidate();
      } catch {}
    }

    function vFormula() {
      const L = fL.value.trim();
      const R = fR.value.trim();
      if (!L && !R) { [fL,fR].forEach(markNEU); return; }
      const lhsOK = /^[WwPpFfSs]$/.test(L);
      const rhsOK = /^([Ff]\s*\*\s*[sS]|[sS]\s*\*\s*[Ff])$/.test(R) || R.length > 1;
      (lhsOK ? markOK : markBAD)(fL);
      (rhsOK ? markOK : markBAD)(fR);
      mirrorSingles();
    }
    function vSubs() {
      const L = sL.value.trim();
      const R = sR.value.trim();
      if (!L && !R) { [sL,sR].forEach(markNEU); return; }
      const lhsOK = /^[WwPpFfSs]$/.test(L);
      const rhsOK = /[0-9]/.test(R);
      (lhsOK ? markOK : markBAD)(sL);
      (rhsOK ? markOK : markBAD)(sR);
      mirrorSingles();
    }
    function vRes() {
      const L = rL.value.trim();
      const R = rR.value.trim();
      if (!L && !R) { [rL,rR].forEach(markNEU); return; }
      const lhsOK = /^[WwPpFfSs]$/.test(L);
      const rhsOK = !isNaN(parseFloat(R));
      (lhsOK ? markOK : markBAD)(rL);
      (rhsOK ? markOK : markBAD)(rR);
      mirrorSingles();
    }

    [fL,fR].forEach(el => on(el, "input", vFormula));
    [sL,sR].forEach(el => on(el, "input", vSubs));
    [rL,rR].forEach(el => on(el, "input", vRes));

    // Tlačítko "Ověřit výpočet"
    on($("#check-calculation-button"), "click", () => {
      const u = unit?.value || "";
      let summary = `Souhrn výpočtu:\n` +
        `${fL.value || "…"} = ${fR.value || "…"}\n` +
        `${sL.value || "…"} = ${sR.value || "…"}\n` +
        `${rL.value || "…"} = ${rR.value || "…"} ${u}\n\n`;

      let advice = [];
      if (!/^[Ww]$/.test(fL.value.trim())) advice.push("Vzorec začínejte hledanou veličinou (např. W).");
      if (!/^([Ff]\s*\*\s*[sS]|[sS]\s*\*\s*[Ff])$/.test(fR.value.trim())) advice.push("Na pravé straně vzorce použijte součin F * s (pořadí nevadí).");
      if (!/[0-9]/.test(sR.value)) advice.push("V dosazení uveďte číselné hodnoty (např. 1000 * 2).");
      if (isNaN(parseFloat(rR.value))) advice.push("Do výsledku zadejte číslo.");

      // porovnání s currentProblem.result (pokud existuje)
      let verdict = "ℹ️ Zkontrolujte kroky a jednotky.";
      try {
        const expected = window.currentProblem?.result;
        const numeric = parseFloat(rR.value);
        if (typeof expected === "number" && !isNaN(numeric)) {
          verdict = Math.abs(numeric - expected) <= 1
            ? "✅ Výsledek je správně!"
            : `❌ Očekávaný výsledek je přibližně ${expected}.`;
        }
      } catch {}

      if (advice.length) summary += "Doporučení:\n- " + advice.join("\n- ") + "\n\n";
      summary += verdict;
      showSummaryModal(summary);
    });
  }

  function resetCalcBox() {
    ["calc-formula-lhs","calc-formula-rhs","calc-subs-lhs","calc-subs-rhs","calc-result-lhs","calc-result-rhs"]
      .map(id => document.getElementById(id))
      .forEach(el => { if (el) { el.value = ""; markNEU(el); } });
  }

  function initCalcUI() {
    // už inicializováno?
    if ($("#calc-box-v4")) return;

    hideOriginalCalcInputs();
    const box = ensureCalcBox();
    if (!box) return;
    attachValidation();
  }

  function initWhenVisible() {
    const practice = $("#practice-screen");
    const startBtn = $("#start-button");
    const newBtn = $("#new-problem-button");

    // start přepne obrazovku → pak inicializuj box
    on(startBtn, "click", () => setTimeout(() => { initCalcUI(); resetCalcBox(); }, 0));

    // pokud už je practice viditelný (např. po reloadu), inicializuj hned
    if (practice && !practice.classList.contains("hidden")) {
      initCalcUI();
    }

    // nový příklad resetuje jen hodnoty v boxu
    on(newBtn, "click", () => setTimeout(resetCalcBox, 0));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWhenVisible);
  } else {
    initWhenVisible();
  }
})();
