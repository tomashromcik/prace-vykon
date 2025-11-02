// ====================================================================
// app_final_calc_v23.js  —  kosmetická úprava výpočetní části
// --------------------------------------------------------------------
// Cíl: zachovat funkčnost, ale zarovnat a nastylovat řádky výpočtu
// stejně jako zápis (stejné barvy/rámečky/spacing).
//
// Použití: Přidej do index.html ZA app_cleaned_v11.js a app_final_calc_v22.js
// <script src="app_final_calc_v23.js" defer></script>
//
// Script:
// - vytvoří 3 "zápis-like" řádky (vzorec / dosazení / výsledek)
// - ponechá původní logiku (mirroring do starých inputů, jednotky na 3. řádku)
// - rovnítko má úzký sloupec; vstupy jsou centrované a responsivní
// - placeholders: „např. W“, „např. F * s“, „např. 1000 * 2“, „např. 2000“
// ====================================================================

console.log("🧩 Načítání app_final_calc_v23.js ...");

(function () {
  const $  = (s, c=document) => c.querySelector(s);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  // Tailwind-like utility classes re-used from zápis (drží vzhled)
  const baseRowClass = "grid items-center gap-2 mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";
  // 4 sloupce: [lhs] [=] [rhs] [unit?]
  const rowCols = "grid-cols-[5.5rem,auto,1fr,auto] sm:grid-cols-[6rem,auto,1fr,auto]";
  const inputClass = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white";
  const lhsClass   = inputClass + " text-center w-20 sm:w-24";
  const rhsClass   = inputClass + " w-full";

  // Vloží jemnou kosmetiku (úzké "=" a mobilní placeholdery)
  function injectStyleOnce() {
    if ($("#calc-v23-style")) return;
    const css = document.createElement("style");
    css.id = "calc-v23-style";
    css.textContent = `
      .eq-sign-v23 { min-width: 1.25rem; text-align: center; color: #d1d5db; }
      @media (max-width: 640px){
        .calc-row-v23 input::placeholder { font-size: 0.9rem; }
      }
    `;
    document.head.appendChild(css);
  }

  function ensureBox() {
    const step = $("#vypocet-step");
    if (!step) return null;

    // Když už naše boxy existují, nezasahuj
    if ($("#calc-box-v23", step)) return $("#calc-box-v23", step);

    // Najdi kotvu – nad tlačítkem "Ověřit výpočet"
    const anchor = $("#check-calculation-button", step);
    if (!anchor) return null;

    // Skryj staré single-input prvky (ale nech je v DOM kvůli logice)
    ["formula-input","substitution-input","user-answer"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    // wrapper
    const wrap = document.createElement("div");
    wrap.id = "calc-box-v23";
    wrap.className = "mt-4";

    // --- řádek 1: vzorec ---
    wrap.appendChild(buildRow("formula", "např. W", "např. F * s"));

    // --- řádek 2: dosazení ---
    wrap.appendChild(buildRow("subs", "např. W", "např. 1000 * 2"));

    // --- řádek 3: výsledek --- (doplníme select jednotek)
    const resultRow = buildRow("result", "např. W", "např. 2000", true);
    wrap.appendChild(resultRow);

    // vlož před tlačítko "Ověřit výpočet"
    anchor.parentElement.insertBefore(wrap, anchor);

    // Přenést select jednotek do poslední buňky řádku
    const slot = resultRow.querySelector(".unit-slot-v23");
    const unitSel = $("#unit-select");
    if (slot && unitSel) {
      slot.appendChild(unitSel);
      unitSel.classList.add("ml-1");
    }

    // Live mirroring do původních inputů (aby zůstala funkčnost existujících validací)
    wireMirrors();

    return wrap;
  }

  function buildRow(key, lhsPh, rhsPh, withUnit = false) {
    const row = document.createElement("div");
    row.className = `${baseRowClass} ${rowCols} calc-row-v23`;

    const lhs = document.createElement("input");
    lhs.type = "text";
    lhs.id = `${key}-lhs`;
    lhs.maxLength = 2;
    lhs.placeholder = lhsPh;
    lhs.className = lhsClass;

    const eq = document.createElement("div");
    eq.className = "eq-sign-v23";
    eq.textContent = "=";

    const rhs = document.createElement("input");
    rhs.type = "text";
    rhs.id = `${key}-rhs`;
    rhs.placeholder = rhsPh;
    rhs.className = rhsClass;

    row.append(lhs, eq, rhs);

    if (withUnit) {
      const unitSlot = document.createElement("div");
      unitSlot.className = "unit-slot-v23";
      row.appendChild(unitSlot);
    } else {
      // aby grid seděl na 4 sloupce i bez jednotky, vlož prázdné místo
      const spacer = document.createElement("div");
      spacer.style.minWidth = "0.5rem";
      row.appendChild(spacer);
    }
    return row;
  }

  function wireMirrors() {
    const fL = $("#formula-lhs"), fR = $("#formula-rhs");
    const sL = $("#subs-lhs"),    sR = $("#subs-rhs");
    const rL = $("#result-lhs"),  rR = $("#result-rhs");

    const singleF = $("#formula-input");
    const singleS = $("#substitution-input");
    const singleR = $("#user-answer");

    function mirrorPair(L, R, single) {
      const l = (L?.value || "").trim();
      const r = (R?.value || "").trim();
      if (!single) return;
      single.value = (l && r) ? `${l} = ${r}` : "";
      single.dispatchEvent(new Event("input", { bubbles: true }));
    }
    function mirrorResult(L, R, single) {
      if (!single) return;
      single.value = (R?.value || "").trim();
      single.dispatchEvent(new Event("input", { bubbles: true }));
    }

    const map = [
      { a:fL, b:fR, s:singleF, fn:mirrorPair },
      { a:sL, b:sR, s:singleS, fn:mirrorPair },
      { a:rL, b:rR, s:singleR, fn:mirrorResult },
    ];
    map.forEach(({a,b,s,fn}) => {
      [a,b].forEach(el => el && el.addEventListener("input", () => fn(a,b,s)));
    });
  }

  // Sleduj, kdy je výpočetní krok viditelný a aplikuj úpravu právě jednou.
  let applied = false;
  function tryApply() {
    const step = $("#vypocet-step");
    if (!step) return;
    const visible = !step.classList.contains("hidden");
    if (visible && !applied) {
      injectStyleOnce();
      const box = ensureBox();
      if (box) {
        applied = true;
        console.log("✅ v23: Výpočetní řádky srovnány do stylu 'zápis'.");
      }
    }
  }

  // Reaguj na změnu příkladu i na kliknutí na "Zkontrolovat zápis"
  document.addEventListener("problem:updated", () => { applied = false; });
  on($("#check-zapis-button"), "click", () => setTimeout(tryApply, 30));

  // Když už je krok z nějakého důvodu zobrazen (po reloadu apod.)
  document.addEventListener("DOMContentLoaded", tryApply);
  window.addEventListener("load", tryApply);
  setInterval(tryApply, 400);
})();

console.log("✅ app_final_calc_v23.js připraven.");
