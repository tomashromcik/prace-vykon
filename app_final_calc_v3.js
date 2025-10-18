
/*
  app_final_calc_v3.js
  ------------------------------------------------------------
  Čistá verze výpočetní části (bez duplikovaných polí).
  - Původní inputy skryty
  - Dvoupólové rozložení LHS = RHS
  - Live validace + barevné orámování
  - Modální shrnutí s hodnocením
  ------------------------------------------------------------
*/

(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const mark = (el, state) => {
    if (!el) return;
    el.classList.remove("border-green-500", "border-red-500");
    if (state === "ok") el.classList.add("border-green-500");
    else if (state === "bad") el.classList.add("border-red-500");
  };

  function buildRow(anchor, key, lhsPH, rhsPH) {
    if (!anchor) return;
    anchor.style.display = "none";
    const row = document.createElement("div");
    row.className = "flex items-center gap-3 my-1";

    const lhs = document.createElement("input");
    lhs.id = `${key}-lhs`;
    lhs.type = "text";
    lhs.placeholder = lhsPH;
    lhs.className = "p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 w-24";

    const eq = document.createElement("span");
    eq.textContent = "=";
    eq.className = "text-xl font-bold text-gray-300 select-none";

    const rhs = document.createElement("input");
    rhs.id = `${key}-rhs`;
    rhs.type = "text";
    rhs.placeholder = rhsPH;
    rhs.className = "p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 flex-1";

    anchor.parentElement.insertBefore(row, anchor.nextSibling);
    row.append(lhs, eq, rhs);
    return { lhs, rhs };
  }

  function ensureModal() {
    if ($("#calc-modal")) return;
    const wrap = document.createElement("div");
    wrap.id = "calc-modal";
    wrap.className = "hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4";
    wrap.innerHTML = `
      <div class="bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-xl space-y-4 relative">
        <button id="calc-modal-close" class="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        <h3 class="text-xl font-semibold text-white">Shrnutí & hodnocení</h3>
        <div id="calc-modal-content" class="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap"></div>
      </div>`;
    document.body.appendChild(wrap);
    on($("#calc-modal-close"), "click", () => wrap.classList.add("hidden"));
    on(wrap, "click", (e) => { if (e.target === wrap) wrap.classList.add("hidden"); });
  }

  function showModal(text) {
    ensureModal();
    $("#calc-modal-content").textContent = text;
    $("#calc-modal").classList.remove("hidden");
  }

  function initCalc() {
    const f0 = $("#formula-input");
    const s0 = $("#substitution-input");
    const r0 = $("#user-answer");
    if (!f0 || !s0 || !r0) return;

    if ($("#formula-lhs")) return; // už inicializováno

    const f = buildRow(f0, "formula", "např. W", "např. F * s");
    const s = buildRow(s0, "subs", "např. W", "např. 1000 * 2");
    const r = buildRow(r0, "result", "např. W", "např. 2000");
    const unit = $("#unit-select");
    if (unit) {
      r0.parentElement.appendChild(unit);
      unit.classList.add("ml-3");
    }

    function validate(row, type) {
      const L = row.lhs.value.trim();
      const R = row.rhs.value.trim();
      if (!L && !R) { mark(row.lhs); mark(row.rhs); return; }
      let okL = /^[WwFfSsPp]$/.test(L);
      let okR = type === "result" ? !isNaN(parseFloat(R)) : R.length > 0;
      mark(row.lhs, okL ? "ok" : "bad");
      mark(row.rhs, okR ? "ok" : "bad");
    }

    [f.lhs, f.rhs].forEach(el => on(el, "input", () => validate(f, "formula")));
    [s.lhs, s.rhs].forEach(el => on(el, "input", () => validate(s, "subs")));
    [r.lhs, r.rhs].forEach(el => on(el, "input", () => validate(r, "result")));

    on($("#check-calculation-button"), "click", () => {
      const summary = `Souhrn výpočtu:
${f.lhs.value} = ${f.rhs.value}
${s.lhs.value} = ${s.rhs.value}
${r.lhs.value} = ${r.rhs.value} ${unit?.value || ""}`;

      let tips = [];
      if (!/^[Ww]$/.test(f.lhs.value)) tips.push("Vzorec by měl začínat hledanou veličinou (W).");
      if (!/[0-9]/.test(s.rhs.value)) tips.push("V dosazení uveďte číselné hodnoty.");
      if (isNaN(parseFloat(r.rhs.value))) tips.push("Do výsledku zadejte číslo.");

      let verdict = "ℹ️ Zkontrolujte výpočet a jednotky.";
      try {
        const exp = window.currentProblem?.result;
        const val = parseFloat(r.rhs.value);
        if (typeof exp === "number" && !isNaN(val)) {
          if (Math.abs(val - exp) <= 1) verdict = "✅ Výsledek je správně!";
          else verdict = `❌ Očekávaný výsledek je cca ${exp}.`;
        }
      } catch {}

      showModal(`${summary}\n\nDoporučení:\n- ${tips.join("\n- ")}\n\n${verdict}`);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const start = $("#start-button");
    if (start) on(start, "click", () => setTimeout(initCalc, 300));
    else initCalc();
  });
})();
