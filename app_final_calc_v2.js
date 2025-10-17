
/*
  app_final_calc_v2.js
  ------------------------------------------------------------
  Nekonfliktní rozšíření výpočetní části:
  - zachová stávající logiku a UI (zápis, přechody, modály…)
  - ve "Finální výpočet" vytvoří dvoupólové řádky LHS = RHS
  - placeholdery ve tvaru "např. …", nic není napevno
  - live kontrola po řádcích (okraje + tooltip text)
  - výsledné číslo porovnává s currentProblem.result (tolerance ±1)
  - zobrazuje modální shrnutí a hodnocení
  - při "Nový příklad" a "Spustit" provede reset
  ------------------------------------------------------------
*/

(function () {
  // Helpers
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const exists = id => document.getElementById(id) != null;

  // Basic feedback pills
  const markOK = el => { if(el){ el.classList.remove("border-red-500"); el.classList.add("border-green-500"); } };
  const markBAD = el => { if(el){ el.classList.remove("border-green-500"); el.classList.add("border-red-500"); } };
  const markNEU = el => { if(el){ el.classList.remove("border-green-500","border-red-500"); } };

  function buildTwoFieldRow({anchorInput, key, lhsPH, rhsPH}) {
    if (!anchorInput) return null;
    // skryj původní single input (zůstává pro backward-kompatibilitu, ale nepoužívá se)
    anchorInput.style.display = "none";

    // řádek
    const row = document.createElement("div");
    row.className = "flex items-center gap-3";

    // levé pole (LHS) – krátké
    const lhs = document.createElement("input");
    lhs.id = `calc-${key}-lhs`;
    lhs.type = "text";
    lhs.placeholder = lhsPH;
    lhs.className = "p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 w-24";

    // "="
    const eq = document.createElement("span");
    eq.textContent = "=";
    eq.className = "text-xl font-bold text-gray-300 select-none";

    // pravé pole (RHS) – široké
    const rhs = document.createElement("input");
    rhs.id = `calc-${key}-rhs`;
    rhs.type = "text";
    rhs.placeholder = rhsPH;
    rhs.className = "p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 flex-1";

    // vložit hned za původní input, aby seděl layout
    const parent = anchorInput.parentElement;
    parent.appendChild(row);
    row.appendChild(lhs);
    row.appendChild(eq);
    row.appendChild(rhs);

    return {row, lhs, rhs};
  }

  function ensureModal() {
    if (exists("calc-summary-modal")) return;
    const wrap = document.createElement("div");
    wrap.id = "calc-summary-modal";
    wrap.className = "hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4";
    wrap.innerHTML = `
      <div class="bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-xl space-y-4 relative">
        <button id="calc-summary-close" class="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        <h3 class="text-xl font-semibold text-white">Shrnutí & hodnocení</h3>
        <div id="calc-summary-content" class="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap"></div>
      </div>
    `;
    document.body.appendChild(wrap);
    on($('#calc-summary-close', wrap), 'click', () => wrap.classList.add('hidden'));
    on(wrap, 'click', (e) => { if (e.target === wrap) wrap.classList.add('hidden'); });
  }

  function showSummary(text) {
    ensureModal();
    $("#calc-summary-content").textContent = text;
    $("#calc-summary-modal").classList.remove("hidden");
  }

  function initCalcTwoFields() {
    // najdi původní inputy (ponechané v DOM)
    const formulaSingle = $("#formula-input");
    const subsSingle    = $("#substitution-input");
    const resultSingle  = $("#user-answer");

    if (!formulaSingle || !subsSingle || !resultSingle) return;

    // už jsme inicializovali? neduplikuj
    if (exists("calc-formula-lhs")) return;

    // vyrob nové řádky
    const f = buildTwoFieldRow({ anchorInput: formulaSingle, key: "formula", lhsPH: "např. W",     rhsPH: "např. F * s" });
    const s = buildTwoFieldRow({ anchorInput: subsSingle,    key: "subs",    lhsPH: "např. W",     rhsPH: "např. 1000 * 2" });
    const r = buildTwoFieldRow({ anchorInput: resultSingle,  key: "result",  lhsPH: "např. W",     rhsPH: "např. 2000" });

    const unitSelect = $("#unit-select");
    // přesuň select za výsledek (aby to sedělo vizuálně)
    if (unitSelect && r?.row && !r.row.nextSibling?.contains?.(unitSelect)) {
      r.row.parentElement.insertBefore(unitSelect, r.row.nextSibling);
      unitSelect.classList.add("ml-3","mt-2");
    }

    // live validace
    function validateFormula() {
      const L = f.lhs.value.trim();
      const R = f.rhs.value.trim();
      if (!L && !R) { markNEU(f.lhs); markNEU(f.rhs); return; }
      const lhsOK = /^[WwPpFfSs]$/.test(L); // jedna fyz. značka
      const rhsOK = /^([Ff]\s*\*\s*[sS]|[sS]\s*\*\s*[Ff])$/.test(R) || R.length > 1; // tolerujeme, aby to šlo dál
      (lhsOK ? markOK : markBAD)(f.lhs);
      (rhsOK ? markOK : markBAD)(f.rhs);
    }
    function validateSubs() {
      const L = s.lhs.value.trim();
      const R = s.rhs.value.trim();
      if (!L && !R) { markNEU(s.lhs); markNEU(s.rhs); return; }
      const lhsOK = /^[WwPpFfSs]$/.test(L);
      const rhsOK = /[0-9]/.test(R); // jednoduché: obsahuje čísla
      (lhsOK ? markOK : markBAD)(s.lhs);
      (rhsOK ? markOK : markBAD)(s.rhs);
    }
    function validateResult() {
      const L = r.lhs.value.trim();
      const R = r.rhs.value.trim();
      if (!L && !R) { markNEU(r.lhs); markNEU(r.rhs); return; }
      const lhsOK = /^[WwPpFfSs]$/.test(L);
      const rhsOK = !isNaN(parseFloat(R));
      (lhsOK ? markOK : markBAD)(r.lhs);
      (rhsOK ? markOK : markBAD)(r.rhs);
    }

    [f.lhs, f.rhs].forEach(el => on(el, "input", validateFormula));
    [s.lhs, s.rhs].forEach(el => on(el, "input", validateSubs));
    [r.lhs, r.rhs].forEach(el => on(el, "input", validateResult));

    // zrcadlení do původních polí (pro případ, že zbytek kódu je používá)
    function mirrorSingles() {
      formulaSingle.value = (f.lhs.value && f.rhs.value) ? `${f.lhs.value} = ${f.rhs.value}` : "";
      subsSingle.value    = (s.lhs.value && s.rhs.value) ? `${s.lhs.value} = ${s.rhs.value}` : "";
      resultSingle.value  = (r.rhs.value || "").trim();
    }
    [f.lhs, f.rhs, s.lhs, s.rhs, r.lhs, r.rhs].forEach(el => on(el, "input", mirrorSingles));

    // reset pro nový příklad / start
    function resetAll() {
      [f.lhs, f.rhs, s.lhs, s.rhs, r.lhs, r.rhs].forEach(el => { el.value = ""; markNEU(el); });
      mirrorSingles();
    }
    on($("#new-problem-button"), "click", () => setTimeout(resetAll, 0));
    on($("#start-button"), "click", () => setTimeout(resetAll, 0));

    // tlačítko "Ověřit výpočet"
    on($("#check-calculation-button"), "click", () => {
      const unit = $("#unit-select")?.value || "";
      // pokus o porovnání s currentProblem
      let summary = "Souhrn výpočtu:\n";
      summary += `Vzorec: ${f.lhs.value || "…"} = ${f.rhs.value || "…"}\n`;
      summary += `Dosazení: ${s.lhs.value || "…"} = ${s.rhs.value || "…"}\n`;
      summary += `Výsledek: ${r.lhs.value || "…"} = ${r.rhs.value || "…"} ${unit}\n\n`;

      let advice = [];
      // jednoduchá pravidla
      if (!/^[Ww]$/.test(f.lhs.value.trim())) advice.push("Ve vzorci začínejte hledanou veličinou (např. W).");
      if (!/^([Ff]\s*\*\s*[sS]|[sS]\s*\*\s*[Ff])$/.test(f.rhs.value.trim())) advice.push("Na pravé straně vzorce použijte součin F * s (pořadí nevadí).");
      if (!/[0-9]/.test(s.rhs.value)) advice.push("V dosazení uveďte číselné hodnoty (např. 1000 * 2).");
      if (isNaN(parseFloat(r.rhs.value))) advice.push("Do výsledku zadejte číslo.");
      
      // kontrola proti currentProblem.result (pokud existuje)
      let verdict = "";
      try {
        const expected = window.currentProblem?.result;
        const numeric = parseFloat(r.rhs.value);
        if (typeof expected === "number" && !isNaN(numeric)) {
          if (Math.abs(numeric - expected) <= 1) {
            verdict = "✅ Výsledek je správně.";
          } else {
            verdict = `ℹ️ Správný výsledek je přibližně ${expected}.`;
          }
        }
      } catch {}

      if (!verdict) verdict = "ℹ️ Zkontrolujte kroky a jednotky.";
      if (advice.length) summary += "Doporučení:\n- " + advice.join("\n- ") + "\n\n";
      summary += verdict;

      showSummary(summary);
    });

    // počáteční neutrál
    markNEU(f.lhs); markNEU(f.rhs);
    markNEU(s.lhs); markNEU(s.rhs);
    markNEU(r.lhs); markNEU(r.rhs);
  }

  function initWhenUIVisible() {
    // čekej, až je obrazovka procvičování v DOMu
    const screen = document.getElementById("practice-screen");
    if (!screen) return;
    // pokud je schovaná, počkáme na přepnutí (start-button to odhalí)
    if (screen.classList.contains("hidden")) {
      // připojit se na start-button pro jistotu
      on($("#start-button"), "click", () => setTimeout(initCalcTwoFields, 0));
    } else {
      initCalcTwoFields();
    }
    // i po novém příkladu jistota resetu
    on($("#new-problem-button"), "click", () => setTimeout(() => { /* nic navíc */ }, 0));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWhenUIVisible);
  } else {
    initWhenUIVisible();
  }
})();
