
/*
  app_final_calc_v5.js
  ------------------------------------------------------------
  Přidává samostatný rámeček „Výpočetní část“ (LHS = RHS),
  živou validaci a modální shrnutí. Zároveň skryje původní
  single‑input výpočtovou část z app.js, aby nedocházelo
  k duplikaci UI. Navrženo pro GitHub Pages.
  ------------------------------------------------------------
*/

(function () {
  console.log("🧩 Iniciuji v5 výpočetní modul...");

  // ---------- Pomocné funkce ----------
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  const addClasses    = (el, ...cls) => el && cls.forEach(c => el.classList.add(c));
  const removeClasses = (el, ...cls) => el && cls.forEach(c => el.classList.remove(c));

  const markOK  = el => { removeClasses(el, "border-red-500"); addClasses(el, "border-green-500"); };
  const markBAD = el => { removeClasses(el, "border-green-500"); addClasses(el, "border-red-500"); };
  const markNEU = el => { removeClasses(el, "border-green-500","border-red-500"); };

  // ---------- Responzivní CSS pro box ----------
  function ensureResponsiveCSS() {
    if ($('#calc-box-v5-responsive-style')) return;
    const style = document.createElement('style');
    style.id = 'calc-box-v5-responsive-style';
    style.textContent = `
      /* mobilní vychytávky */
      @media (max-width: 640px) {
        #calc-box-v5 .calc-row { flex-direction: column; align-items: stretch; }
        #calc-box-v5 .calc-row .calc-lhs { width: 100% !important; }
        #calc-box-v5 .calc-row .calc-eq  { display:none; }
        #calc-box-v5 .calc-row .calc-rhs { width: 100% !important; }
        #calc-box-v5 .calc-row .unit-slot { width: 100%; margin-top: .5rem; }
      }
    `;
    document.head.appendChild(style);
    console.log("📱 Responzivní CSS pro výpočetní část přidáno.");
  }

  // ---------- Modal ----------
  function ensureSummaryModal() {
    if ($("#calc-modal-v5")) return;
    const wrap = document.createElement("div");
    wrap.id = "calc-modal-v5";
    wrap.className = "hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4";
    wrap.innerHTML = `
      <div class="bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-xl space-y-4 relative">
        <button id="calc-modal-v5-close" class="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        <h3 class="text-xl font-semibold text-white">Shrnutí & hodnocení</h3>
        <div id="calc-modal-v5-content" class="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap"></div>
      </div>`;
    document.body.appendChild(wrap);
    on($("#calc-modal-v5-close"), "click", () => wrap.classList.add("hidden"));
    on(wrap, "click", (e) => { if (e.target === wrap) wrap.classList.add("hidden"); });
  }
  function showSummaryModal(text) {
    ensureSummaryModal();
    $("#calc-modal-v5-content").textContent = text;
    $("#calc-modal-v5").classList.remove("hidden");
  }

  // ---------- Skrytí staré (legacy) výpočetní části z app.js ----------
  function hideLegacyCalc() {
    const container = $("#main-calculation-step");
    if (!container) return;

    // Schovej původní single‑input ovládací prvky (ale necháme sekci i tlačítko)
    ["formula-input","substitution-input","user-answer"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    // Schovej řádky, které drží tyto inputy (label + input)
    // typicky jsou ve flex/space-y blocích, schováme jejich nejbližší rodiče s třídou "space-y-4" nebo "space-y-2"
    const rows = $$(".space-y-4 > div, .space-y-2 > div", container);
    rows.forEach(row => {
      // nechceme schovat tlačítko "Ověřit výpočet" ani kontejner s feedbackem
      if (row.querySelector("#check-calculation-button") || row.querySelector("#vypocet-feedback-container")) return;
      if (row.querySelector("#formula-input") || row.querySelector("#substitution-input") || row.querySelector("#user-answer")) {
        row.style.display = "none";
      }
    });

    console.log("🧹 Původní single‑input řádky výpočtu skryty.");
  }

  // ---------- Vytvoření UI boxu ----------
  function ensureCalcBox() {
    const mainStep = $("#main-calculation-step");
    if (!mainStep) return null;

    let box = $("#calc-box-v5", mainStep);
    if (box) return box;

    // Hlavní box
    box = document.createElement("div");
    box.id = "calc-box-v5";
    box.className = "mt-6 bg-blue-950/40 border border-blue-700/40 rounded-xl p-4 space-y-4";

    box.innerHTML = `
      <div class="flex items-center gap-2 mb-2">
        <span class="text-yellow-300 text-xl">💡</span>
        <h4 class="text-lg font-semibold text-blue-300">Výpočetní část</h4>
      </div>

      <!-- Vzorec -->
      <div class="calc-row flex items-center gap-3">
        <input id="calc-formula-lhs" type="text" placeholder="např. W"
               class="calc-lhs p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 w-24">
        <span class="calc-eq text-xl font-bold text-gray-300 select-none">=</span>
        <input id="calc-formula-rhs" type="text" placeholder="např. F * s"
               class="calc-rhs p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 flex-1">
      </div>

      <!-- Dosazení -->
      <div class="calc-row flex items-center gap-3">
        <input id="calc-subs-lhs" type="text" placeholder="např. W"
               class="calc-lhs p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 w-24">
        <span class="calc-eq text-xl font-bold text-gray-300 select-none">=</span>
        <input id="calc-subs-rhs" type="text" placeholder="např. 1000 * 2"
               class="calc-rhs p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 flex-1">
      </div>

      <!-- Výsledek -->
      <div class="calc-row flex items-center gap-3">
        <input id="calc-result-lhs" type="text" placeholder="např. W"
               class="calc-lhs p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 w-24">
        <span class="calc-eq text-xl font-bold text-gray-300 select-none">=</span>
        <input id="calc-result-rhs" type="text" placeholder="např. 2000"
               class="calc-rhs p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 flex-1">
        <div class="unit-slot" id="calc-unit-slot"></div>
      </div>
    `;

    mainStep.appendChild(box);

    // Přestěhuj select jednotek do slotu na řádku výsledku
    const unit = $("#unit-select");
    const slot = $("#calc-unit-slot", box);
    if (unit && slot) {
      slot.appendChild(unit);
      addClasses(unit, "ml-1","mt-0");
    }

    ensureResponsiveCSS();
    console.log("✅ Výpočetní box (v5) vykreslen.");
    return box;
  }

  // ---------- Validace a napojení na tlačítko ----------
  function attachValidationAndActions() {
    const fL = $("#calc-formula-lhs");
    const fR = $("#calc-formula-rhs");
    const sL = $("#calc-subs-lhs");
    const sR = $("#calc-subs-rhs");
    const rL = $("#calc-result-lhs");
    const rR = $("#calc-result-rhs");
    const unit = $("#unit-select");

    // zrcadlení do původních (skrytých) inputů – kvůli kompatibilitě, pokud je app.js stále používá
    const singleFormula = $("#formula-input");
    const singleSubs    = $("#substitution-input");
    const singleResult  = $("#user-answer");

    function mirrorSingles() {
      if (singleFormula) singleFormula.value = (fL.value && fR.value) ? `${fL.value} = ${fR.value}` : "";
      if (singleSubs)    singleSubs.value    = (sL.value && sR.value) ? `${sL.value} = ${sR.value}` : "";
      if (singleResult)  singleResult.value  = (rR.value || "").trim();
    }

    function vFormula() {
      const L = (fL.value || "").trim();
      const R = (fR.value || "").trim();
      if (!L && !R) { markNEU(fL); markNEU(fR); return; }

      const lhsOK = /^[WwPpFfSs]$/.test(L);
      const rhsOK = /^([Ff]\s*\*\s*[sS]|[sS]\s*\*\s*[Ff])$/.test(R) || R.length > 1;
      lhsOK ? markOK(fL) : markBAD(fL);
      rhsOK ? markOK(fR) : markBAD(fR);
      mirrorSingles();
    }
    function vSubs() {
      const L = (sL.value || "").trim();
      const R = (sR.value || "").trim();
      if (!L && !R) { markNEU(sL); markNEU(sR); return; }

      const lhsOK = /^[WwPpFfSs]$/.test(L);
      const rhsOK = /[0-9]/.test(R);
      lhsOK ? markOK(sL) : markBAD(sL);
      rhsOK ? markOK(sR) : markBAD(sR);
      mirrorSingles();
    }
    function vRes() {
      const L = (rL.value || "").trim();
      const R = (rR.value || "").trim();
      if (!L && !R) { markNEU(rL); markNEU(rR); return; }

      const lhsOK = /^[WwPpFfSs]$/.test(L);
      const rhsOK = !isNaN(parseFloat(R));
      lhsOK ? markOK(rL) : markBAD(rL);
      rhsOK ? markOK(rR) : markBAD(rR);
      mirrorSingles();
    }

    [fL,fR].forEach(el => on(el, "input", vFormula));
    [sL,sR].forEach(el => on(el, "input", vSubs));
    [rL,rR].forEach(el => on(el, "input", vRes));

    // reset při novém příkladu
    on($("#new-problem-button"), "click", () => {
      [fL,fR,sL,sR,rL,rR].forEach(el => { el.value = ""; markNEU(el); });
      mirrorSingles();
    });

    // tlačítko ověření
    on($("#check-calculation-button"), "click", () => {
      const u = unit?.value || "";
      const formulaTxt = `${fL.value || "…"} = ${fR.value || "…"}`;
      const subsTxt    = `${sL.value || "…"} = ${sR.value || "…"}`;
      const resTxt     = `${rL.value || "…"} = ${rR.value || "…"} ${u}`;

      let advice = [];
      if (!/^[Ww]$/.test((fL.value || "").trim())) advice.push("Vzorec začínejte hledanou veličinou (např. W).");
      if (!/^([Ff]\s*\*\s*[sS]|[sS]\s*\*\s*[Ff])$/.test((fR.value || "").trim())) advice.push("Na pravé straně vzorce použijte součin F * s (pořadí nevadí).");
      if (!/[0-9]/.test((sR.value || ""))) advice.push("V dosazení uveďte číselné hodnoty (např. 1000 * 2).");
      if (isNaN(parseFloat(rR.value))) advice.push("Do výsledku zadejte číslo.");

      let verdict = "ℹ️ Zkontrolujte kroky a jednotky.";
      try {
        const expected = window.currentProblem?.result;
        const numeric  = parseFloat(rR.value);
        if (typeof expected === "number" && !isNaN(numeric)) {
          verdict = Math.abs(numeric - expected) <= 1
            ? "✅ Výsledek je správně!"
            : `❌ Očekávaný výsledek je přibližně ${expected}.`;
        }
      } catch {}

      let summary = `Souhrn výpočtu:\n${formulaTxt}\n${subsTxt}\n${resTxt}\n\n`;
      if (advice.length) summary += "Doporučení:\n- " + advice.join("\n- ") + "\n\n";
      summary += verdict;
      showSummaryModal(summary);
    });
  }

  // ---------- Inicializace po zobrazení practice‑screen ----------
  function initWhenPracticeVisible() {
    const practiceVisible = $("#practice-screen:not(.hidden)");
    if (!practiceVisible) return;

    hideLegacyCalc();
    const box = ensureCalcBox();
    if (box) attachValidationAndActions();
  }

  // Sleduj DOM a inicializuj, jakmile se practice‑screen zobrazí
  const observer = new MutationObserver(() => {
    if ($("#practice-screen:not(.hidden)")) {
      initWhenPracticeVisible();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Pokud už je viditelný (třeba po reloadu na této obrazovce), inicializuj okamžitě
  if ($("#practice-screen") && !$("#practice-screen").classList.contains("hidden")) {
    initWhenPracticeVisible();
  }

  console.log("✅ app_final_calc_v5.js načten a připraven.");
    // 💡 Nouzová inicializace po kliknutí na tlačítko "Spustit"
  window.addEventListener("load", () => {
    const startBtn = document.querySelector("#start-button");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        console.log("▶️ Vynucená inicializace v5 po kliknutí na Spustit...");
        setTimeout(() => initWhenPracticeVisible(), 400); // zpoždění, než se DOM překreslí
      });
    }
  });

})();
