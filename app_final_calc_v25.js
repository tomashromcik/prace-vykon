// ====================================================================
// app_final_calc_v25.js — safe fix
// - NIC nemaže: staré pole jen skrývá (neodpojí se tlačítka/modály)
// - znovu naváže vlastní handlery na tlačítka (Obrázek/Vzorec/Nápověda/Kalkulačka)
// - vytvoří "nový" výpočetní box ve stylu zápisu po "Zkontrolovat zápis"
// - jednotky na 3. řádku = nový select (dark UI), interně sync s #unit-select
// - plné logování, ať vidíme krok za krokem
// ====================================================================

console.log("🧩 Načítání app_final_calc_v25.js ...");

(function () {
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  // ---- vzhled nové výpočetní části (sjednocený se „zápis“) ----
  const baseRowClass = "grid items-center gap-2 mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";
  const rowCols      = "grid-cols-[5.5rem,auto,1fr,auto] sm:grid-cols-[6rem,auto,1fr,auto]";
  const inputClass   = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white";
  const lhsClass     = inputClass + " text-center w-20 sm:w-24";
  const rhsClass     = inputClass + " w-full";
  const selectClass  = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white";

  function injectStyleOnce() {
    if ($("#calc-v25-style")) return;
    const css = document.createElement("style");
    css.id = "calc-v25-style";
    css.textContent = `
      .eq-sign-v25 { min-width:1.25rem; text-align:center; color:#d1d5db; }
      .calc-row-v25 input::placeholder { color:#9ca3af; }
      @media (max-width:640px){
        .calc-row-v25 input::placeholder { font-size:.9rem; }
      }
    `;
    document.head.appendChild(css);
  }

  // ---- místo mazání jen "safe hide" starých vstupů ----
  function hideOldCalcUI() {
    // Původní pole, která app_cleaned_v11.js očekává (necháme existovat, jen skryjeme)
    ["formula-input","substitution-input","user-answer","unit-select"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = "none";
      }
    });

    // případné osiřelé textové "=", z minulých buildů jen skryjeme
    $$("#vypocet-step > *").forEach(node => {
      const t = (node.textContent || "").trim();
      if (t === "=") node.style.display = "none";
    });
  }

  // ---- stav + bezpečné navázání tlačítek (kdyby původní nenajely) ----
  function ensureToolButtons() {
    // Modály
    const calcModal = $("#calculator-modal");
    const formulaModal = $("#formula-modal");
    const helpModal = $("#help-modal");
    const diagramModal = $("#diagram-modal");

    function toggle(m, show) { m && m.classList.toggle("hidden", !show); }

    // obsah pro vzorec (SVG)
    function renderFormula() {
      const c = $("#formula-svg-container");
      if (!c) return;
      c.innerHTML = `
        <svg width="240" height="180" viewBox="0 0 240 180">
          <polygon points="120,15 25,165 215,165" fill="none" stroke="white" stroke-width="2"/>
          <line x1="52" y1="112" x2="188" y2="112" stroke="white" stroke-width="2"/>
          <text x="120" y="70"  fill="white" font-size="36" text-anchor="middle">W</text>
          <text x="120" y="150" fill="white" font-size="26" text-anchor="middle">F · s</text>
        </svg>`;
    }

    // jednoduchý diagram z aktuální úlohy (pokud existuje window.currentProblem)
    function renderDiagram() {
      const c = $("#diagram-svg-container");
      if (!c) return;
      const prob = window.currentProblem;
      if (!prob) {
        c.innerHTML = `<p class="text-gray-400 text-sm">Nejprve spusťte příklad.</p>`;
        return;
      }
      const F = prob.givens?.find(g => g.symbol==="F") || {};
      const s = prob.givens?.find(g => g.symbol==="s") || {};
      c.innerHTML = `
        <svg width="340" height="190" viewBox="0 0 340 190">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="red"/>
            </marker>
            <marker id="arrowhead2" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="orange"/>
            </marker>
          </defs>
          <rect x="25" y="160" width="290" height="8" fill="#777"/>
          <rect x="85" y="115" width="90" height="42" fill="#00AEEF" stroke="white" stroke-width="2"/>
          <circle cx="103" cy="160" r="9" fill="#333"/>
          <circle cx="155" cy="160" r="9" fill="#333"/>
          <line x1="175" y1="130" x2="255" y2="130" stroke="red" stroke-width="3" marker-end="url(#arrowhead)"/>
          <text x="215" y="118" fill="red" font-size="16" text-anchor="middle">F = ${F.value ?? "?"} ${F.unit ?? ""}</text>
          <line x1="85" y1="175" x2="255" y2="175" stroke="orange" stroke-width="2" marker-end="url(#arrowhead2)"/>
          <text x="170" y="190" fill="orange" font-size="14" text-anchor="middle">s = ${s.value ?? "?"} ${s.unit ?? ""}</text>
        </svg>`;
    }

    function renderHelp() {
      const c = $("#help-content");
      if (!c) return;
      c.innerHTML = `
        <div class="space-y-2 text-left">
          <p>• Zapište známé veličiny (F, s) a označte hledanou (W).</p>
          <p>• Převeďte násobky (kN → N, km → m).</p>
          <p>• Použijte vzorec <b>W = F · s</b>.</p>
        </div>`;
    }

    // Navázat (idempotentně) kliky
    const openDiagram = $("#open-diagram-button");
    const openFormula = $("#open-formula-button");
    const openHelp    = $("#open-help-button");
    const openCalc    = $("#open-calculator-button");

    const closeDiagram = $("#close-diagram-button");
    const closeFormula = $("#close-formula-button");
    const closeHelp    = $("#close-help-button");
    const closeCalc    = $("#close-calculator-button");

    // otevření
    on(openDiagram, "click", () => { renderDiagram(); toggle(diagramModal, true); });
    on(openFormula, "click", ()  => { renderFormula(); toggle(formulaModal, true); });
    on(openHelp,    "click", ()  => { renderHelp(); toggle(helpModal, true); });
    on(openCalc,    "click", ()  => { renderCalculator(); toggle(calcModal, true); });

    // zavření (X i klik mimo)
    on(closeDiagram, "click", () => toggle(diagramModal, false));
    on(closeFormula, "click", () => toggle(formulaModal, false));
    on(closeHelp,    "click", () => toggle(helpModal, false));
    on(closeCalc,    "click", () => toggle(calcModal, false));

    [diagramModal, formulaModal, helpModal, calcModal].forEach(m => {
      on(m, "click", (e) => { if (e.target === m) toggle(m, false); });
    });

    // Kalkulačka (jednoduchá, dvouřádek, kopírování)
    function renderCalculator() {
      const display = $("#calculator-display");
      const history = $("#calculator-history");
      const btns = $("#calculator-buttons");
      if (!display || !history || !btns) return;

      btns.innerHTML = "";
      const keys = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+","C","⌫","Copy"];
      keys.forEach(k => {
        const b = document.createElement("button");
        b.textContent = k;
        b.className = "bg-gray-700 text-white py-2 rounded hover:bg-gray-600";
        btns.appendChild(b);
      });

      let current = "";
      function update(){ display.textContent = current || "0"; }
      update();

      btns.onclick = e => {
        const t = e.target.textContent;
        if (t==="C"){ current=""; history.textContent=""; }
        else if (t==="⌫"){ current = current.slice(0,-1); }
        else if (t==="="){
          try {
            const r = eval(current);
            history.textContent = `${current} =`;
            current = String(r);
          } catch { current = "Error"; }
        } else if (t==="Copy"){
          navigator.clipboard?.writeText(display.textContent);
        } else {
          current += t;
        }
        update();
      };
    }

    console.log("✅ v25: tool buttons (Obrázek/Vzorec/Nápověda/Kalkulačka) připraveny.");
  }

  // ---- vytvoření nového calc boxu (3 řádky) ----
  function buildRow(key, lhsPh, rhsPh, withUnit = false) {
    const row = document.createElement("div");
    row.className = `${baseRowClass} ${rowCols} calc-row-v25`;

    const lhs = document.createElement("input");
    lhs.type = "text";
    lhs.id = `${key}-lhs`;
    lhs.maxLength = 2;
    lhs.placeholder = lhsPh;
    lhs.className = lhsClass;

    const eq = document.createElement("div");
    eq.className = "eq-sign-v25";
    eq.textContent = "=";

    const rhs = document.createElement("input");
    rhs.type = "text";
    rhs.id = `${key}-rhs`;
    rhs.placeholder = rhsPh;
    rhs.className = rhsClass;

    row.append(lhs, eq, rhs);

    if (withUnit) {
      const unitSlot = document.createElement("div");
      unitSlot.className = "unit-slot-v25";
      const unit = document.createElement("select");
      unit.id = "unit-select-v25";
      unit.className = selectClass;
      ["J","kJ","MJ"].forEach(u=>{
        const o = document.createElement("option");
        o.value = u; o.textContent = u;
        unit.appendChild(o);
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

    // staré pole pouze skryj — NEmazat!
    hideOldCalcUI();

    // vytvářej pouze jednou
    if ($("#calc-box-v25", step)) return $("#calc-box-v25", step);

    const wrap = document.createElement("div");
    wrap.id = "calc-box-v25";
    wrap.className = "mt-4";

    wrap.appendChild(buildRow("formula","např. W","např. F * s"));
    wrap.appendChild(buildRow("subs","např. W","např. 1000 * 2"));
    wrap.appendChild(buildRow("result","např. W","např. 2000", true));

    // vlož před tlačítko „Ověřit výpočet“
    anchor.parentElement.insertBefore(wrap, anchor);

    wireMirrors();   // napojení na interní validace
    ensureToolButtons(); // pro jistotu (idempotentní)
    console.log("✅ v25: nový výpočetní box vytvořen.");
    return wrap;
  }

  // ---- zrcadlení do skrytých single-inputů (kvůli validaci) ----
  function wireMirrors() {
    const fL = $("#formula-lhs"), fR = $("#formula-rhs");
    const sL = $("#subs-lhs"),    sR = $("#subs-rhs");
    const rL = $("#result-lhs"),  rR = $("#result-rhs");
    const uN = $("#unit-select-v25");

    const singleF = $("#formula-input");
    const singleS = $("#substitution-input");
    const singleR = $("#user-answer");
    const unitOld = $("#unit-select");

    [singleF,singleS,singleR,unitOld].forEach(el => el && (el.style.display="none"));

    function mirrorPair(L, R, single) {
      if (!single) return;
      const l = (L?.value || "").trim();
      const r = (R?.value || "").trim();
      single.value = (l && r) ? `${l} = ${r}` : "";
      single.dispatchEvent(new Event("input", {bubbles:true}));
    }
    function mirrorResult(R, single) {
      if (!single) return;
      single.value = (R?.value || "").trim();
      single.dispatchEvent(new Event("input", {bubbles:true}));
    }
    function mirrorUnit(uNew, uOld) {
      if (!uNew || !uOld) return;
      uOld.value = uNew.value;
      uOld.dispatchEvent(new Event("change", {bubbles:true}));
    }

    if (fL && fR && singleF) {
      on(fL,"input",()=>mirrorPair(fL,fR,singleF));
      on(fR,"input",()=>mirrorPair(fL,fR,singleF));
    }
    if (sL && sR && singleS) {
      on(sL,"input",()=>mirrorPair(sL,sR,singleS));
      on(sR,"input",()=>mirrorPair(sL,sR,singleS));
    }
    if (rR && singleR) {
      on(rR,"input",()=>mirrorResult(rR,singleR));
    }
    if (uN && unitOld) {
      on(uN,"change",()=>mirrorUnit(uN,unitOld));
      // inicializační srovnání
      mirrorUnit(uN,unitOld);
    }

    console.log("🔁 v25: mirrors → single inputs (pro validace) navázány.");
  }

  // ---- napojení na „Zkontrolovat zápis“ (po přepnutí do výpočtu) ----
  function hookZapisToCalc() {
    const btn = $("#check-zapis-button");
    if (!btn) return;
    on(btn,"click",()=>{
      // Po validaci zápisu app_cleaned_v11 přepne na #vypocet-step – chvíli počkej:
      setTimeout(()=>{
        const step = $("#vypocet-step");
        if (step && !step.classList.contains("hidden")) {
          injectStyleOnce();
          buildCalcBox();
        }
      },60);
    });
    console.log("🔗 v25: napojení na Zkontrolovat zápis přidáno.");
  }

  // ---- inicializace po „Spustit“ (pro jistotu připrav nástroje) ----
  function hookStart() {
    const start = $("#start-button");
    on(start,"click",()=>{
      setTimeout(()=>{
        ensureToolButtons();
      },50);
    });
  }

  // ---- reinit při nové úloze (když uživatel klikne „Nový příklad“) ----
  document.addEventListener("problem:updated", ()=>{
    // nic mazat netřeba; pokud byl box, zůstane – ale stejně se používá nový zápis
    // kdyby bylo třeba vynutit reset, lze odkomentovat:
    // const box = $("#calc-box-v25"); if (box) box.remove();
  });

  // ---- start ----
  window.addEventListener("load", ()=>{
    console.log("✅ v25: DOM ready.");
    ensureToolButtons();
    hookZapisToCalc();
    hookStart();
  });
})();
