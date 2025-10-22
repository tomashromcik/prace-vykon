
/*
  app_final_calc_v21.js
  ------------------------------------------------------------
  Stabilní výpočetní modul (v21) kompatibilní s app_cleaned_v11.js
  - Vytvoří samostatný box s dvoupólovými poli (LHS = RHS)
  - Live validace (vzorec, dosazení, výsledek) + výsledkový box
  - Nezasahuje do logiky generování příkladů ani zápisu
  - Přidává jemný fade-in při přechodu do výpočtu
  - Nepřebírá kontrolu nad existujícími modály (pouze doplňuje)
  ------------------------------------------------------------
*/

(function () {
  console.log("🧩 Načítání app_final_calc_v21.js ...");

  // ---------- Helpers ----------
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const addC = (n, ...cls) => n && n.classList.add(...cls);
  const remC = (n, ...cls) => n && n.classList.remove(...cls);

  const markOK  = el => { remC(el, "ring-red-500"); addC(el, "ring-2","ring-green-500"); };
  const markBAD = el => { remC(el, "ring-green-500"); addC(el, "ring-2","ring-red-500");  };
  const markNEU = el => { remC(el, "ring-green-500","ring-red-500","ring-2"); };

  function parseNum(s) {
    if (s == null) return NaN;
    const t = String(s).replace(",", ".").trim();
    if (t === "") return NaN;
    return Number(t);
  }
  function almostEqual(a, b, rel = 0.05) {
    if (!isFinite(a) || !isFinite(b)) return false;
    if (b === 0) return Math.abs(a) < 1e-9;
    return Math.abs(a - b) <= Math.abs(b) * rel;
  }

  // Jednotky (shodné s app_cleaned_v11.js)
  const unitToBaseFactor = {
    mm: 1/1000, cm: 1/100, m: 1, km: 1000,
    J: 1, kJ: 1000, MJ: 1_000_000,
    N: 1, kN: 1000, MN: 1_000_000
  };

  // Zjištění hledané veličiny z řádků zápisu
  function getUnknownSymbolFromZapis() {
    const r = $$(".zapis-row").find(x => x.querySelector(".zapis-unknown")?.checked);
    const sym = r?.querySelector(".zapis-symbol")?.value;
    return (sym && sym !== "-") ? sym : "W"; // default W
  }

  // ---------- Vytvoření výpočetního boxu ----------
  function ensureCalcUI() {
    const host = $("#vypocet-step");
    if (!host) return null;

    // Pokud už existuje, vrátíme
    let box = $("#calc-box-v21", host);
    if (box) return box;

    // Skryj staré single inputy, pokud by někde byly
    ["formula-input","substitution-input","user-answer"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    // Vytvoření boxu
    box = document.createElement("div");
    box.id = "calc-box-v21";
    box.className = "mt-4 bg-gray-900/60 border border-gray-700 rounded-xl p-4 space-y-4 transition-opacity duration-300 opacity-0";
    box.innerHTML = `
      <h4 class="text-lg font-semibold text-blue-300">Výpočetní část</h4>

      <!-- řádek 1: vzorec -->
      <div class="flex items-center gap-3 calc-row">
        <input id="calc21-formula-lhs" maxlength="2" placeholder="např. W"
               class="p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 w-28">
        <span class="text-xl font-bold text-gray-300 select-none">=</span>
        <input id="calc21-formula-rhs" placeholder="např. F * s"
               class="p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 flex-1">
      </div>

      <!-- řádek 2: dosazení -->
      <div class="flex items-center gap-3 calc-row">
        <input id="calc21-subs-lhs" maxlength="2" placeholder="např. W"
               class="p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 w-28">
        <span class="text-xl font-bold text-gray-300 select-none">=</span>
        <input id="calc21-subs-rhs" placeholder="např. 1000 * 2"
               class="p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 flex-1">
      </div>

      <!-- řádek 3: výsledek -->
      <div class="flex items-center gap-3 calc-row">
        <input id="calc21-result-lhs" maxlength="2" placeholder="např. W"
               class="p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 w-28">
        <span class="text-xl font-bold text-gray-300 select-none">=</span>
        <input id="calc21-result-rhs" placeholder="např. 2000"
               class="p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 flex-1">
        <select id="calc21-unit" class="p-3 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 w-28">
          <option>J</option><option>kJ</option><option>MJ</option>
        </select>
      </div>

      <button id="calc21-check" class="btn btn-primary w-full mt-2">Ověřit výpočet</button>

      <!-- výsledkový box -->
      <div id="calc21-result-box" class="mt-3 hidden p-3 bg-gray-900 border border-gray-700 rounded-xl"></div>
    `;

    host.appendChild(box);

    // Fade-in
    requestAnimationFrame(() => {
      box.style.opacity = "1";
    });

    // Přesun unit-selectu, pokud existuje původní
    const legacyUnit = $("#unit-select");
    if (legacyUnit) { legacyUnit.style.display = "none"; }

    // Napojení live validací
    attachLiveValidation(box);

    // Napojení na tlačítko ověřit
    const checkBtn = $("#calc21-check", box);
    on(checkBtn, "click", () => doFinalCheck(box));

    return box;
  }

  // ---------- Live validace ----------
  function attachLiveValidation(box) {
    const fL = $("#calc21-formula-lhs", box);
    const fR = $("#calc21-formula-rhs", box);
    const sL = $("#calc21-subs-lhs", box);
    const sR = $("#calc21-subs-rhs", box);
    const rL = $("#calc21-result-lhs", box);
    const rR = $("#calc21-result-rhs", box);
    const u  = $("#calc21-unit", box);

    function vFormula() {
      const unknown = getUnknownSymbolFromZapis();
      const L = (fL.value || "").trim();
      const R = (fR.value || "").replace(/\s+/g,"");
      let ok = false;
      if (unknown === "W") ok = /^[W]$/.test(L) && /^(F[*·]s|s[*·]F)$/i.test(R);
      else if (unknown === "F") ok = /^[F]$/.test(L) && /^W\/s$/i.test(R);
      else if (unknown === "s") ok = /^[sS]$/.test(L) && /^W\/F$/i.test(R);

      if (!L && !fR.value) { markNEU(fL); markNEU(fR); return; }
      (ok ? markOK : markBAD)(fL);
      (ok ? markOK : markBAD)(fR);
    }

    function vSubs() {
      const unknown = getUnknownSymbolFromZapis();
      const Fg = window.currentProblem?.givens?.find(g=>g.symbol==="F");
      const sg = window.currentProblem?.givens?.find(g=>g.symbol==="s");
      const Wv = window.currentProblem?.result;
      const L = (sL.value || "").trim();
      const R = (sR.value || "").replace(/\s+/g,"");

      let ok = false;
      if (unknown === "W" && Fg && sg) {
        const m = R.match(/^(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/);
        if (m && /^[W]$/.test(L)) {
          const a = parseNum(m[1]), b = parseNum(m[2]);
          ok = (almostEqual(a,Fg.value) && almostEqual(b,sg.value)) ||
               (almostEqual(a,sg.value) && almostEqual(b,Fg.value));
        }
      } else if (unknown === "F" && isFinite(Wv) && sg) {
        const m = R.match(/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
        if (m && /^[F]$/.test(L)) {
          ok = almostEqual(parseNum(m[1]), Wv) && almostEqual(parseNum(m[2]), sg.value);
        }
      } else if (unknown === "s" && isFinite(Wv)) {
        const Fg2 = window.currentProblem?.givens?.find(g=>g.symbol==="F");
        const m = R.match(/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
        if (m && /^[sS]$/.test(L) && Fg2) {
          ok = almostEqual(parseNum(m[1]), Wv) && almostEqual(parseNum(m[2]), Fg2.value);
        }
      }

      if (!L && !sR.value) { markNEU(sL); markNEU(sR); return; }
      (ok ? markOK : markBAD)(sL);
      (ok ? markOK : markBAD)(sR);
    }

    function vResult() {
      const unknown = getUnknownSymbolFromZapis();
      const L = (rL.value || "").trim();
      const val = parseNum(rR.value);
      const unit = u?.value || "J";

      let ok = false;
      if (unknown === "W") {
        const f = unitToBaseFactor[unit] ?? 1;
        const inBase = val * f;
        ok = isFinite(val) && almostEqual(inBase, window.currentProblem?.result ?? NaN);
        if (/^[W]$/.test(L) === false) ok = false;
      } else {
        ok = /^[FfSs]$/.test(L) && isFinite(val);
      }

      if (!L && !rR.value) { markNEU(rL); markNEU(rR); return; }
      (ok ? markOK : markBAD)(rL);
      (ok ? markOK : markBAD)(rR);
    }

    [fL,fR].forEach(el => on(el, "input", vFormula));
    [sL,sR].forEach(el => on(el, "input", vSubs));
    [rL,rR,u].forEach(el => on(el, "input", vResult));
  }

  // ---------- Finální kontrola + výsledkový box ----------
  function doFinalCheck(box) {
    const out = $("#calc21-result-box", box);
    if (!out) return;

    const fL = $("#calc21-formula-lhs", box).value.trim();
    const fR = $("#calc21-formula-rhs", box).value.trim();
    const sL = $("#calc21-subs-lhs", box).value.trim();
    const sR = $("#calc21-subs-rhs", box).value.trim();
    const rL = $("#calc21-result-lhs", box).value.trim();
    const rR = $("#calc21-result-rhs", box).value.trim();
    const unit = $("#calc21-unit", box)?.value || "J";

    const unknown = getUnknownSymbolFromZapis();
    const errs = [];
    const tips = [];

    // Vzorec
    const compact = fR.replace(/\s+/g,"");
    if (unknown === "W") {
      if (!(fL === "W" && /^(F[*·]s|s[*·]F)$/i.test(compact))) {
        errs.push("Vzorec očekává tvar: W = F * s (pořadí F a s nevadí).");
      }
    } else if (unknown === "F") {
      if (!(fL === "F" && /^W\/s$/i.test(compact))) {
        errs.push("Vzorec očekává tvar: F = W / s.");
      }
    } else if (unknown === "s") {
      if (!((fL === "s" || fL === "S") && /^W\/F$/i.test(compact))) {
        errs.push("Vzorec očekává tvar: s = W / F.");
      }
    }

    // Dosazení
    const Fg = window.currentProblem?.givens?.find(g=>g.symbol==="F");
    const sg = window.currentProblem?.givens?.find(g=>g.symbol==="s");
    const Wv = window.currentProblem?.result;

    if (unknown === "W") {
      const m = sR.replace(/\s+/g,"").match(/^(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/);
      if (!(sL === "W" && m && Fg && sg)) {
        errs.push("Dosazení očekává tvar: W = (číslo) * (číslo).");
      } else {
        const a = parseNum(m[1]), b = parseNum(m[2]);
        if (!((almostEqual(a,Fg.value) && almostEqual(b,sg.value)) || (almostEqual(a,sg.value) && almostEqual(b,Fg.value)))) {
          errs.push("Dosazení musí vycházet ze zadaných hodnot F a s.");
          if (/^W\s*=\s*F\s*[*·]\s*s$/i.test(fL + "=" + fR) && !(almostEqual(a,Fg.value) && almostEqual(b,sg.value))) {
            tips.push("Pořadí v dosazení by mělo odpovídat vzorci (F pak s).");
          }
        }
      }
    } else if (unknown === "F" && isFinite(Wv) && sg) {
      const m = sR.replace(/\s+/g,"").match(/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
      if (!(sL === "F" && m && almostEqual(parseNum(m[1]), Wv) && almostEqual(parseNum(m[2]), sg.value))) {
        errs.push("Dosazení očekává tvar: F = W / s (s konkrétními čísly ze zadání).");
      }
    } else if (unknown === "s" && isFinite(Wv)) {
      const Fg2 = window.currentProblem?.givens?.find(g=>g.symbol==="F");
      const m = sR.replace(/\s+/g,"").match(/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
      if (!((sL === "s" || sL === "S") && m && almostEqual(parseNum(m[1]), Wv) && almostEqual(parseNum(m[2]), Fg2.value))) {
        errs.push("Dosazení očekává tvar: s = W / F (s konkrétními čísly ze zadání).");
      }
    }

    // Výsledek
    const numeric = parseNum(rR);
    if (!isFinite(numeric)) {
      errs.push("Výsledek musí být číslo.");
    } else if (unknown === "W") {
      const f = unitToBaseFactor[unit] ?? 1;
      const inBase = numeric * f;
      if (!almostEqual(inBase, Wv)) {
        errs.push(`Výsledek neodpovídá. Očekává se přibližně ${Wv} J.`);
        tips.push("Zkontroluj převody jednotek a aritmetiku.");
      }
      if (rL !== "W") errs.push("Výsledek musí začínat hledanou veličinou: W = ...");
    } else {
      if (!/^[FfSs]$/.test(rL)) errs.push("Výsledek musí začínat hledanou veličinou (F nebo s).");
    }

    // Vykreslení výsledkového boxu
    out.classList.remove("hidden");
    const ok = errs.length === 0;
    const summaryZapis = mergedSummarySafe(); // textový přepis zápisu

    out.innerHTML = `
      <div class="${ok ? "feedback-correct" : "feedback-wrong"}">
        <div class="font-semibold mb-1">${ok ? "✅ Správně!" : "❌ Máme tu nějaké potíže:"}</div>
        ${ok ? "<div>Skvělá práce – postup i výsledek dávají smysl. 👏</div>" :
          `<ul class="list-disc pl-5 space-y-1">${errs.map(e=>`<li>${e}</li>`).join("")}</ul>`}
        ${tips.length ? `<div class="mt-3 text-sm text-blue-200"><b>Tipy:</b><ul class="list-disc pl-5">${tips.map(t=>`<li>${t}</li>`).join("")}</ul></div>` : ""}
      </div>

      <div class="mt-3 p-3 bg-gray-900 rounded border border-gray-700">
        <div class="font-semibold text-gray-300 mb-1">Souhrn zápisu:</div>
        <pre class="text-gray-200 whitespace-pre-wrap text-sm">${summaryZapis}</pre>
      </div>
    `;
  }

  // Bezpečné získání textového souhrnu zápisu (fallback, pokud hlavní app nevykreslí)
  function mergedSummarySafe() {
    try {
      const rows = $$(".zapis-row").map(r => ({
        symbol:  r.querySelector(".zapis-symbol")?.value ?? "-",
        unit:    r.querySelector(".zapis-unit")?.value ?? "-",
        raw:     r.querySelector(".zapis-value")?.value.trim() ?? "",
        unknown: !!r.querySelector(".zapis-unknown")?.checked
      }));
      const order = [];
      const bySym = {};
      rows.forEach(r => {
        if (!r.symbol || r.symbol === "-") return;
        if (!bySym[r.symbol]) { bySym[r.symbol] = []; order.push(r.symbol); }
        const part = r.unknown ? `? ${r.unit}` : `${r.raw} ${r.unit}`;
        if (!bySym[r.symbol].includes(part)) bySym[r.symbol].push(part);
      });
      return order.map(sym => `${sym} = ${bySym[sym].join(" = ")}`).join("\n") || "(prázdný zápis)";
    } catch {
      return "(souhrn zápisu není k dispozici)";
    }
  }

  // ---------- Přechod Zápis → Výpočet ----------
  function armZapisCheckHook() {
    const btn = $("#check-zapis-button");
    if (!btn) return;
    // Jen přidáme „po-akci“ – existující logiku nenahrazujeme
    on(btn, "click", () => {
      setTimeout(() => {
        // Pokud hlavní app nepřepnula, jemně vynutíme
        const z = $("#zapis-step");
        const v = $("#vypocet-step");
        if (z && v && !v.classList.contains("hidden")) {
          // už zobrazeno → jen ensure kalkulační box
          ensureCalcUI();
        } else if (z && v && v.classList.contains("hidden")) {
          // ještě skryto? nic neděláme – předpokládáme, že zápis nebyl validní
        } else if (z && v) {
          // fallback – zobrazíme výpočet
          addC(v, "opacity-0");
          v.classList.remove("hidden");
          z.classList.add("hidden");
          ensureCalcUI();
          requestAnimationFrame(()=>remC(v,"opacity-0"));
        }
      }, 50);
    });
  }

  // ---------- Připravíme i tlačítka nástrojů (bez rušení stávajících handlerů) ----------
  function armTools() {
    const map = [
      ["open-calculator-button","calculator-modal"],
      ["open-formula-button","formula-modal"],
      ["open-help-button","help-modal"],
      ["open-diagram-button","diagram-modal"],
    ];
    map.forEach(([btnId, modalId]) => {
      const b = document.getElementById(btnId);
      if (b) on(b, "click", () => toggleModal(modalId, true));
    });
    const closers = [
      ["close-calculator-button","calculator-modal"],
      ["close-formula-button","formula-modal"],
      ["close-help-button","help-modal"],
      ["close-diagram-button","diagram-modal"],
    ];
    closers.forEach(([btnId, modalId]) => {
      const b = document.getElementById(btnId);
      if (b) on(b, "click", () => toggleModal(modalId, false));
    });
  }
  function toggleModal(id, show){
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.toggle("hidden", !show);
  }

  // ---------- Inicializace při zobrazení practice UI ----------
  function initWhenPracticeVisible() {
    const practice = $("#practice-screen");
    if (!practice) return;

    const start = $("#start-button");
    const again = $("#new-problem-button");
    on(start, "click", () => setTimeout(() => { ensureCalcUI(); }, 0));
    on(again, "click", () => setTimeout(() => {
      const box = ensureCalcUI();
      if (!box) return;
      ["calc21-formula-lhs","calc21-formula-rhs","calc21-subs-lhs","calc21-subs-rhs","calc21-result-lhs","calc21-result-rhs"]
        .forEach(id => { const el = document.getElementById(id); if (el){ el.value=""; markNEU(el);} });
      const out = $("#calc21-result-box"); if (out) out.classList.add("hidden");
    }, 0));

    armTools();
    armZapisCheckHook();
  }

  // Run
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWhenPracticeVisible);
  } else {
    initWhenPracticeVisible();
  }

  console.log("✅ app_final_calc_v21.js připraven.");
})();
