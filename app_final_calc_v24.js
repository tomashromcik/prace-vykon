// ====================================================================
// app_final_calc_v24.js — sjednocený výpočetní box + odstranění starého
// - jeden soubor: nahrazuje v22+v23
// - po "Zkontrolovat zápis" smaže staré prvky a vloží nový box (3 řádky)
// - nový select jednotek vypadá jako zbytek UI (tmavý, zaoblený)
// - zachována kompatibilita s app_cleaned_v11.js (validace, logika)
// ====================================================================

console.log("🧩 Načítání app_final_calc_v24.js ...");

(function () {
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  // --- vzhled kompatibilní se "zápis" částí ---
  const baseRowClass = "grid items-center gap-2 mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";
  const rowCols      = "grid-cols-[5.5rem,auto,1fr,auto] sm:grid-cols-[6rem,auto,1fr,auto]";
  const inputClass   = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white";
  const lhsClass     = inputClass + " text-center w-20 sm:w-24";
  const rhsClass     = inputClass + " w-full";
  const selectClass  = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white";

  function injectStyleOnce() {
    if ($("#calc-v24-style")) return;
    const css = document.createElement("style");
    css.id = "calc-v24-style";
    css.textContent = `
      .eq-sign-v24 { min-width: 1.25rem; text-align: center; color: #d1d5db; }
      @media (max-width: 640px){
        .calc-row-v24 input::placeholder { font-size: .9rem; }
      }
    `;
    document.head.appendChild(css);
  }

  // --- odstranění/staré skrytí staré výpočetní části ---
  function nukeOldCalcUI() {
    // staré inputy (zůstávaly nad naším boxem)
    const ids = ["formula-input", "substitution-input", "user-answer", "unit-select"];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      // pokud má rodiče – odstranit co nejvýš, ale bezpečně
      let p = el;
      for (let i = 0; i < 3 && p && p.parentElement; i++) p = p.parentElement;
      (p || el).remove();
    });

    // případné osiřelé řádky se samotným '=' (z minulých HTML verzí)
    $$("#vypocet-step > *").forEach(node => {
      if (node && node.textContent && node.textContent.trim() === "=") node.remove();
    });
  }

  function buildRow(key, lhsPh, rhsPh, withUnit = false) {
    const row = document.createElement("div");
    row.className = `${baseRowClass} ${rowCols} calc-row-v24`;

    const lhs = document.createElement("input");
    lhs.type = "text";
    lhs.id = `${key}-lhs`;
    lhs.maxLength = 2;
    lhs.placeholder = lhsPh;
    lhs.className = lhsClass;

    const eq = document.createElement("div");
    eq.className = "eq-sign-v24";
    eq.textContent = "=";

    const rhs = document.createElement("input");
    rhs.type = "text";
    rhs.id = `${key}-rhs`;
    rhs.placeholder = rhsPh;
    rhs.className = rhsClass;

    row.append(lhs, eq, rhs);

    if (withUnit) {
      const unitSlot = document.createElement("div");
      unitSlot.className = "unit-slot-v24";
      // nový hezký select
      const unit = document.createElement("select");
      unit.id = "unit-select-v24";
      unit.className = selectClass;
      ["J", "kJ", "MJ"].forEach(u => {
        const opt = document.createElement("option");
        opt.value = u; opt.textContent = u;
        unit.appendChild(opt);
      });
      unitSlot.appendChild(unit);
      row.appendChild(unitSlot);
    } else {
      const spacer = document.createElement("div");
      spacer.style.minWidth = "0.5rem";
      row.appendChild(spacer);
    }

    return row;
  }

  function buildCalcBox() {
    const step   = $("#vypocet-step");
    const anchor = $("#check-calculation-button");
    if (!step || !anchor) return null;

    // smazat staré UI
    nukeOldCalcUI();

    // když už existuje, vrat
    if ($("#calc-box-v24", step)) return $("#calc-box-v24", step);

    const wrap = document.createElement("div");
    wrap.id = "calc-box-v24";
    wrap.className = "mt-4";

    wrap.appendChild(buildRow("formula", "např. W", "např. F * s"));
    wrap.appendChild(buildRow("subs",    "např. W", "např. 1000 * 2"));
    const r = buildRow("result", "např. W", "např. 2000", true);
    wrap.appendChild(r);

    // vložit před tlačítko "Ověřit výpočet"
    anchor.parentElement.insertBefore(wrap, anchor);

    wireMirrors(); // napojení na interní validace
    console.log("✅ v24: nový výpočetní box byl vložen a starý odstraněn.");
    return wrap;
  }

  function wireMirrors() {
    // naše nové prvky
    const fL = $("#formula-lhs"), fR = $("#formula-rhs");
    const sL = $("#subs-lhs"),    sR = $("#subs-rhs");
    const rL = $("#result-lhs"),  rR = $("#result-rhs");
    const uN = $("#unit-select-v24");

    // staré (skryté) vstupy, které čeká app_cleaned_v11.js
    const singleF = $("#formula-input");
    const singleS = $("#substitution-input");
    const singleR = $("#user-answer");
    const unitOld = $("#unit-select");

    // pokud někde ještě existují (např. jiná verze HTML), raději je skryjeme
    [singleF, singleS, singleR, unitOld].forEach(el => el && (el.style.display = "none"));

    function mirrorPair(L, R, single) {
      if (!single) return;
      const l = (L?.value || "").trim();
      const r = (R?.value || "").trim();
      single.value = (l && r) ? `${l} = ${r}` : "";
      single.dispatchEvent(new Event("input", { bubbles: true }));
    }
    function mirrorResult(R, single) {
      if (!single) return;
      single.value = (R?.value || "").trim();
      single.dispatchEvent(new Event("input", { bubbles: true }));
    }
    function mirrorUnit(uNew, uOld) {
      if (!uNew || !uOld) return;
      uOld.value = uNew.value;
      uOld.dispatchEvent(new Event("change", { bubbles: true }));
    }

    // napoj vstupy
    if (fL && fR && singleF) {
      on(fL, "input", () => mirrorPair(fL, fR, singleF));
      on(fR, "input", () => mirrorPair(fL, fR, singleF));
    }
    if (sL && sR && singleS) {
      on(sL, "input", () => mirrorPair(sL, sR, singleS));
      on(sR, "input", () => mirrorPair(sL, sR, singleS));
    }
    if (rR && singleR) {
      on(rR, "input", () => mirrorResult(rR, singleR));
    }
    if (uN && unitOld) {
      on(uN, "change", () => mirrorUnit(uN, unitOld));
      // inicializační srovnání
      mirrorUnit(uN, unitOld);
    }
  }

  // re-aplikuj po kliku na "Zkontrolovat zápis" (po přechodu do výpočtu)
  on($("#check-zapis-button"), "click", () => {
    setTimeout(() => {
      const step = $("#vypocet-step");
      if (step && !step.classList.contains("hidden")) {
        injectStyleOnce();
        buildCalcBox();
      }
    }, 50);
  });

  // pro jistotu i při změnách
  document.addEventListener("problem:updated", () => {
    // nová úloha → znovu až po validaci zápisu
    const old = $("#calc-box-v24");
    if (old) old.remove();
  });

  window.addEventListener("load", () => {
    console.log("✅ app_final_calc_v24.js připraven.");
  });
})();
