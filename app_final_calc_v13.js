// ===============================================================
// app_final_calc_v13.js — výpočetní část (tmavé schéma, sjednocené barvy)
// ---------------------------------------------------------------
// • Tři dvoupólové řádky (vzorec, dosazení, výsledek)
// • Jednotka zarovnaná na konci řádku
// • Kompatibilní s app_cleaned_v11.js
// ===============================================================

console.log("🧩 Načítání app_final_calc_v13.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ app_final_calc_v13.js inicializován.");

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  function initCalcUI() {
    const parent = document.getElementById("vypocet-step");
    if (!parent || $("#calc-box-v13")) return;

    console.log("🧩 Inicializace výpočetního boxu v13...");

    const box = document.createElement("div");
    box.id = "calc-box-v13";
    box.className = "mt-6 bg-[#0f172a] border border-gray-700 rounded-xl p-4 fade-in space-y-4 text-gray-100";

    box.innerHTML = `
      <h3 class="text-lg font-semibold text-blue-300 mb-2">💡 Výpočetní část</h3>

      <div class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <input id="formula-lhs" type="text" placeholder="např. W" maxlength="3" class="calc-input w-20" />
          <span class="calc-equal">=</span>
          <input id="formula-rhs" type="text" placeholder="např. F * s" class="calc-input flex-1 min-w-[180px]" />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <input id="subs-lhs" type="text" placeholder="např. W" maxlength="3" class="calc-input w-20" />
          <span class="calc-equal">=</span>
          <input id="subs-rhs" type="text" placeholder="např. 1000 * 2" class="calc-input flex-1 min-w-[180px]" />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <input id="result-lhs" type="text" placeholder="např. W" maxlength="3" class="calc-input w-20" />
          <span class="calc-equal">=</span>
          <input id="result-rhs" type="text" placeholder="např. 2000" class="calc-input flex-1 min-w-[180px]" />
          <select id="unit-select" class="calc-select ml-2">
            <option>J</option><option>kJ</option><option>MJ</option>
          </select>
        </div>
      </div>

      <div class="text-right mt-4">
        <button id="check-calculation-button" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md">
          Ověřit výpočet
        </button>
      </div>

      <div id="calc-feedback" class="text-sm text-gray-300 mt-3"></div>
    `;

    parent.appendChild(box);

    if (!$("#calc-style")) {
      const style = document.createElement("style");
      style.id = "calc-style";
      style.textContent = `
        .fade-in { animation: fadeIn 0.6s ease-in-out; }
        @keyframes fadeIn { from {opacity:0; transform:translateY(8px);} to {opacity:1; transform:translateY(0);} }
        .calc-input { padding: 0.5rem 0.75rem; background-color: #1e293b; color: #f1f5f9; border: 1px solid #334155; border-radius: 0.5rem; }
        .calc-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px #3b82f6; }
        .calc-equal { font-weight: bold; color: #e2e8f0; font-size: 1.25rem; }
        .calc-select { padding: 0.5rem; background-color: #1e293b; color: #f1f5f9; border: 1px solid #334155; border-radius: 0.5rem; }
      `;
      document.head.appendChild(style);
    }

    const formulaInput = document.getElementById("formula-input");
    const substitutionInput = document.getElementById("substitution-input");
    const userAnswerInput = document.getElementById("user-answer");

    const mirror = () => {
      const fl = $("#formula-lhs")?.value.trim() || "";
      const fr = $("#formula-rhs")?.value.trim() || "";
      const sl = $("#subs-lhs")?.value.trim() || "";
      const sr = $("#subs-rhs")?.value.trim() || "";
      const rl = $("#result-lhs")?.value.trim() || "";
      const rr = $("#result-rhs")?.value.trim() || "";

      if (formulaInput) formulaInput.value = fl && fr ? `${fl} = ${fr}` : "";
      if (substitutionInput) substitutionInput.value = sl && sr ? `${sl} = ${sr}` : "";
      if (userAnswerInput) userAnswerInput.value = rr || "";
    };

    ["formula-lhs","formula-rhs","subs-lhs","subs-rhs","result-lhs","result-rhs"]
      .forEach(id => on($("#" + id), "input", mirror));

    on($("#check-calculation-button"), "click", () => {
      const f = $("#formula-lhs").value + " = " + $("#formula-rhs").value;
      const s = $("#subs-lhs").value + " = " + $("#subs-rhs").value;
      const r = $("#result-lhs").value + " = " + $("#result-rhs").value + " " + $("#unit-select").value;

      $("#calc-feedback").innerHTML = `
        <div class="mt-2 p-3 bg-gray-800 border border-gray-700 rounded-md">
          <b>Souhrn:</b><br>
          ${f}<br>${s}<br>${r}<br><br>
          ✅ Zkontroluj, zda jednotky i pořadí odpovídají zadání.
        </div>`;
    });

    console.log("✅ Výpočetní box v13 byl vytvořen.");
  }

  const startBtn = document.getElementById("start-button");
  on(startBtn, "click", () => setTimeout(initCalcUI, 500));

  console.log("✅ v13: připraven (čeká na spuštění procvičování).");
});
