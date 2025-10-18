/*
  app_final_calc_v5.js
  ------------------------------------------------------------
  Vylepšené dvoupólové výpočetní pole (LHS = RHS), placeholdery
  "např.", zarovnání, jednotka na stejném řádku, live kontrola,
  a modální shrnutí. Zachovává původní logiku z app.js.
  ------------------------------------------------------------
*/

(function () {
  console.log("✅ app_final_calc_v5.js načten a spuštěn!");

  const $ = (s, c=document) => c.querySelector(s);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const cls = (n, add, rem=[]) => {
    if (!n) return;
    (Array.isArray(rem) ? rem : [rem]).filter(Boolean).forEach(r => n.classList.remove(r));
    (Array.isArray(add) ? add : [add]).filter(Boolean).forEach(a => n.classList.add(a));
  };

  const markOK  = el => cls(el, "border-green-500", ["border-red-500"]);
  const markBAD = el => cls(el, "border-red-500",  ["border-green-500"]);
  const markNEU = el => cls(el, [], ["border-green-500","border-red-500"]);

  function hideOldCalcInputs() {
    ["formula-input","substitution-input","user-answer"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });
  }

  function buildCalcBox() {
    const mainStep = document.querySelector("#vypocet-step");
    if (!mainStep) return null;

    if ($("#calc-box-v5", mainStep)) return;

    const box = document.createElement("div");
    box.id = "calc-box-v5";
    box.className = "mt-6 bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 space-y-5";

    box.innerHTML = `
      <h4 class="text-lg font-semibold text-blue-300 mb-2">💡 Výpočetní část</h4>

      <div id="row-formula" class="flex items-center gap-3">
        <input id="calc-formula-lhs" type="text" placeholder="např. W"
          class="w-20 p-2 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 text-center">
        <span class="text-xl font-bold text-gray-300 select-none">=</span>
        <input id="calc-formula-rhs" type="text" placeholder="např. F * s"
          class="flex-1 p-2 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500">
      </div>

      <div id="row-subs" class="flex items-center gap-3">
        <input id="calc-subs-lhs" type="text" placeholder="např. W"
          class="w-20 p-2 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 text-center">
        <span class="text-xl font-bold text-gray-300 select-none">=</span>
        <input id="calc-subs-rhs" type="text" placeholder="např. 1000 * 2"
          class="flex-1 p-2 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500">
      </div>

      <div id="row-result" class="flex items-center gap-3">
        <input id="calc-result-lhs" type="text" placeholder="např. W"
          class="w-20 p-2 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 text-center">
        <span class="text-xl font-bold text-gray-300 select-none">=</span>
        <input id="calc-result-rhs" type="text" placeholder="např. 2000"
          class="flex-1 p-2 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500">
        <div id="calc-unit-slot"></div>
      </div>
    `;

    mainStep.appendChild(box);

    const unitSelect = $("#unit-select");
    const slot = $("#calc-unit-slot", box);
    if (unitSelect && slot) {
      slot.appendChild(unitSelect);
      unitSelect.classList.add("ml-1");
      unitSelect.style.marginTop = "0";
    }
    return box;
  }

  function showModal(text) {
    let modal = $("#calc-modal-v5");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "calc-modal-v5";
      modal.className = "hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4";
      modal.innerHTML = `
        <div class="bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-xl space-y-4 relative">
          <button id="calc-modal-close" class="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
          <h3 class="text-xl font-semibold text-white">Shrnutí & hodnocení</h3>
          <div id="calc-modal-content" class="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap"></div>
        </div>`;
      document.body.appendChild(modal);
      on($("#calc-modal-close"), "click", () => modal.classList.add("hidden"));
      on(modal, "click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });
    }
    $("#calc-modal-content").textContent = text;
    modal.classList.remove("hidden");
  }

  function attachLogic() {
    const fL = $("#calc-formula-lhs");
    const fR = $("#calc-formula-rhs");
    const sL = $("#calc-subs-lhs");
    const sR = $("#calc-subs-rhs");
    const rL = $("#calc-result-lhs");
    const rR = $("#calc-result-rhs");
    const unit = $("#unit-select");

    const validate = (L, R, patternL, patternR) => {
      const okL = patternL.test(L.value.trim());
      const okR = patternR.test(R.value.trim());
      (okL ? markOK : markBAD)(L);
      (okR ? markOK : markBAD)(R);
    };

    const vFormula = () => validate(fL, fR, /^[WwPpFfSs]$/, /^([Ff]\s*\*\s*[sS]|[sS]\s*\*\s*[Ff])$/);
    const vSubs    = () => validate(sL, sR, /^[WwPpFfSs]$/, /[0-9]/);
    const vRes     = () => validate(rL, rR, /^[WwPpFfSs]$/, /^\d+(\.\d+)?$/);

    [fL,fR].forEach(e => on(e,"input",vFormula));
    [sL,sR].forEach(e => on(e,"input",vSubs));
    [rL,rR].forEach(e => on(e,"input",vRes));

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
      showModal(summary);
    });
  }

  function init() {
    console.log("🧩 Iniciuji v5 výpočetní modul...");
    hideOldCalcInputs();
    const box = buildCalcBox();
    if (!box) return;
    attachLogic();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();