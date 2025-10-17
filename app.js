
/*
  app_vypocet_patch.js
  Nekonfliktní doplněk výpočetní části:
  - NIC NEMĚNÍ v existující logice aplikace
  - pouze přidá dvoupólová pole (LHS = RHS) pro Vzorec / Dosazení / Výsledek
  - hodnoty z nových polí zrcadlí do původních inputů (#formula-input, #substitution-input, #user-answer)
  - volá existující live-validace, pokud jsou definované (formulaLiveValidate, substitutionLiveValidate, resultLiveValidate)
  - resetuje se při „Nový příklad“ i po startu
*/

(function () {
  const READY = () => document.readyState === "complete" || document.readyState === "interactive";

  function $(id) { return document.getElementById(id); }
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }

  function buildTwoFieldRow(originalInput, opts) {
    // Pokud chybí původní input nebo už existuje dvoupólová řádka, nic nedělej
    if (!originalInput || document.getElementById(`tf-${opts.key}-lhs`)) return null;

    // Skryj původní input (zůstává pro starou logiku/validaci)
    originalInput.classList.add("hidden");

    // Kontejner (flex, aby šla šířka pravého vstupu natáhnout)
    const row = document.createElement("div");
    row.className = "flex items-center gap-2 mt-2";

    // Levý input (LHS) – krátký
    const lhs = document.createElement("input");
    lhs.type = "text";
    lhs.id = `tf-${opts.key}-lhs`;
    lhs.placeholder = opts.placeholderLHS || "";
    lhs.className = "p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 w-20";

    // "="
    const eq = document.createElement("span");
    eq.textContent = "=";
    eq.className = "px-1 text-xl font-bold text-gray-300 select-none";

    // Pravý input (RHS) – roztažitelný
    const rhs = document.createElement("input");
    rhs.type = "text";
    rhs.id = `tf-${opts.key}-rhs`;
    rhs.placeholder = opts.placeholderRHS || "";
    rhs.className = "p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 flex-1";

    // Vložení hned ZA původní input, aby rozložení nepadalo
    originalInput.parentElement.insertBefore(row, originalInput.nextSibling);
    row.appendChild(lhs);
    row.appendChild(eq);
    row.appendChild(rhs);

    // Zrcadlení do původního inputu + live validace (pokud existují)
    function mirror() {
      const L = (lhs.value || "").trim();
      const R = (rhs.value || "").trim();

      if (opts.key === "result") {
        // do #user-answer zapisujeme jen číselnou hodnotu z RHS
        originalInput.value = R;
        originalInput.dispatchEvent(new Event("input", { bubbles: true }));
        if (typeof window.resultLiveValidate === "function") window.resultLiveValidate();
      } else {
        originalInput.value = (L && R) ? `${L} = ${R}` : "";
        originalInput.dispatchEvent(new Event("input", { bubbles: true }));
        if (opts.key === "formula" && typeof window.formulaLiveValidate === "function") window.formulaLiveValidate();
        if (opts.key === "subs" && typeof window.substitutionLiveValidate === "function") window.substitutionLiveValidate();
      }
    }
    on(lhs, "input", mirror);
    on(rhs, "input", mirror);

    // Reset placeholderů: není nic napevno, žák přepíše hodnoty
    on(lhs, "focus", () => { if (lhs.value === "") lhs.placeholder = ""; });
    on(rhs, "focus", () => { if (rhs.value === "") rhs.placeholder = ""; });

    return { row, lhs, rhs };
  }

  function attachTwoFieldCalc() {
    // Najdi původní inputy – NEPŘEJMENUJEME!
    const formulaInput = $("formula-input");
    const substitutionInput = $("substitution-input");
    const userAnswerInput = $("user-answer");

    // Vytvoř dvoupólové řádky (jen jednou)
    buildTwoFieldRow(formulaInput, {
      key: "formula",
      placeholderLHS: "např. W",
      placeholderRHS: "F * s"
    });

    buildTwoFieldRow(substitutionInput, {
      key: "subs",
      placeholderLHS: "např. W",
      placeholderRHS: "např. 1000 * 2"
    });

    buildTwoFieldRow(userAnswerInput, {
      key: "result",
      placeholderLHS: "např. W",
      placeholderRHS: "např. 2000"
    });
  }

  function resetTwoFieldCalc() {
    ["formula", "subs", "result"].forEach(key => {
      const lhs = document.getElementById(`tf-${key}-lhs`);
      const rhs = document.getElementById(`tf-${key}-rhs`);
      if (lhs) lhs.value = "";
      if (rhs) rhs.value = "";
    });
  }

  function wireResets() {
    // Reset na „Nový příklad“ (pokud existuje tlačítko)
    const np = document.getElementById("new-problem-button");
    on(np, "click", () => setTimeout(resetTwoFieldCalc, 0));

    // Reset po startu
    const start = document.getElementById("start-button");
    on(start, "click", () => setTimeout(() => {
      attachTwoFieldCalc();
      resetTwoFieldCalc();
    }, 0));

    // Pokud app někde vyvolává vlastní událost, zachytíme ji
    document.addEventListener("app:new-problem", resetTwoFieldCalc);
  }

  function initWhenReady() {
    if (!READY()) return;
    try {
      attachTwoFieldCalc();
      wireResets();
      console.log("🧮 two-field calc patch attached.");
    } catch (e) {
      console.warn("[two-field-calc] init error:", e);
    }
  }

  if (READY()) initWhenReady();
  else document.addEventListener("DOMContentLoaded", initWhenReady);
})();
