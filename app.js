// === FINAL FIXED VERSION (single-input fields removed) ===
// ====================================================================
//  app.js — Fyzika: Práce a výkon (výpočetní část + live validace)
//  - Aktivní volby, přepínání obrazovek, funkční modály
//  - Zápis: live validace proti zadání + převody (±5 % tolerance)
//  - Výpočet: live validace vzorce, dosazení, výsledku; komutativita pro W=F*s
//  - Kontrola: souhrn zadání, zápisu, výpočtu a slovní hodnocení
// ====================================================================

console.log("Načítání app.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");

  // -------------------- STAV --------------------
  let selectedMode = null;
  let selectedLevel = null;
  let selectedTopic = "prace";
  let currentProblem = null;

  // -------------------- DOM ELEMENTY --------------------
  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");
  const practiceTitle = document.getElementById("practice-title");

  const startButton = document.getElementById("start-button");
  const backButton = document.getElementById("back-button");
  const newProblemButton = document.getElementById("new-problem-button");
  const topicSelect = document.getElementById("topic-select");

  const problemTextEl = document.getElementById("problem-text");

  const tools = {
    openCalc: document.getElementById("open-calculator-button"),
    openFormula: document.getElementById("open-formula-button"),
    openHelp: document.getElementById("open-help-button"),
    openDiagram: document.getElementById("open-diagram-button"),
    modalCalc: document.getElementById("calculator-modal"),
    modalFormula: document.getElementById("formula-modal"),
    modalHelp: document.getElementById("help-modal"),
    modalDiagram: document.getElementById("diagram-modal"),
    closeCalc: document.getElementById("close-calculator-button"),
    closeFormula: document.getElementById("close-formula-button"),
    closeHelp: document.getElementById("close-help-button"),
    closeDiagram: document.getElementById("close-diagram-button"),
    helpContent: document.getElementById("help-content"),
    formulaSvgContainer: document.getElementById("formula-svg-container"),
    diagramSvgContainer: document.getElementById("diagram-svg-container"),
    calcDisplay: document.getElementById("calculator-display"),
    calcHistory: document.getElementById("calculator-history"),
    calcButtons: document.getElementById("calculator-buttons"),
  };

  const zapisStep = document.getElementById("zapis-step");
  const vypocetStep = document.getElementById("vypocet-step");
  const zapisContainer = document.getElementById("zapis-container");
  const zapisFeedback = document.getElementById("zapis-feedback-container");
  const zapisReview = document.getElementById("zapis-review-container");
  const addRowBtn = document.getElementById("add-zapis-row-button");
  const checkZapisBtn = document.getElementById("check-zapis-button");

  const unitSelect = document.getElementById("unit-select");
  const checkCalcBtn = document.getElementById("check-calculation-button");
  const vypocetFeedback = document.getElementById("vypocet-feedback-container");
  const formulaInput = document.getElementById("formula-input");
  const substitutionInput = document.getElementById("substitution-input");
  const userAnswerInput = document.getElementById("user-answer");

  // -------------------- AKTIVNÍ ZVÝRAZNĚNÍ TLAČÍTEK --------------------
  function markActive(groupSelector, activeBtn) {
    document.querySelectorAll(groupSelector).forEach(b => {
      b.classList.remove("ring-2", "ring-blue-500", "bg-blue-600", "text-white");
      b.classList.add("btn-secondary");
    });
    activeBtn.classList.add("ring-2", "ring-blue-500", "bg-blue-600", "text-white");
  }

  document.querySelectorAll('[id^="mode-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      selectedMode = btn.id.includes("practice") ? "practice" : "test";
      markActive('[id^="mode-"]', btn);
      updateStartButtonState();
      console.log(`🎓 Režim zvolen: ${selectedMode}`);
    });
  });

  document.querySelectorAll('[id^="level-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      selectedLevel = btn.id.includes("normal") ? "normal" :
                      btn.id.includes("hard") ? "hard" : "easy";
      markActive('[id^="level-"]', btn);
      updateStartButtonState();
      console.log(`🎯 Obtížnost zvolena: ${selectedLevel}`);
    });
  });

  topicSelect?.addEventListener("change", e => {
    selectedTopic = e.target.value;
    updateStartButtonState();
  });

  function updateStartButtonState() {
    const ready = selectedMode && selectedLevel && selectedTopic;
    startButton.disabled = !ready;
    startButton.classList.toggle("btn-disabled", !ready);
    if (ready) {
      console.log("✅ Start povolen");
    }
  }

  // -------------------- PŘEPÍNAČ OBRAZOVEK --------------------
  function showPractice() {
    setupScreen?.classList.add("hidden");
    practiceScreen?.classList.remove("hidden");
    practiceTitle.textContent = `Téma: ${selectedTopic === "vykon" ? "Výkon" : "Práce"}`;
  }
  function showSetup() {
    practiceScreen?.classList.add("hidden");
    setupScreen?.classList.remove("hidden");
  }

  // -------------------- OVLÁDÁNÍ --------------------
  startButton?.addEventListener("click", () => {
    showPractice();
    resetToZapis(true);
    generateProblem();
    prepareUnitsForTopic();
    console.log("▶️ Kliknuto na Spustit");
  });

  backButton?.addEventListener("click", () => {
    showSetup();
    clearPractice();
  });

  newProblemButton?.addEventListener("click", () => {
    showPractice();
    resetToZapis(true);
    generateProblem();
    prepareUnitsForTopic();
  });

  addRowBtn?.addEventListener("click", () => addZapisRow());

  // -------------------- GENERÁTOR ÚLOH --------------------
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function generateProblem() {
    const variant = randInt(1, 2);
    let text, givens, result;

    if (selectedTopic === "vykon") {
      // prozatím držíme příklady pro práci
      selectedTopic = "prace";
    }

    if (variant === 1) {
      const FkN = randInt(1, 9);
      const s_m = 2;
      text = `Těleso bylo přesunuto silou ${FkN} kN po dráze ${s_m} m. Jaká práce byla vykonána?`;
      givens = [
        { symbol: "F", value: FkN * 1000, unit: "N" },
        { symbol: "s", value: s_m, unit: "m" }
      ];
      result = (FkN * 1000) * s_m;
    } else {
      const s_km = randInt(1, 5);
      const F_N = randInt(800, 2000);
      text = `Auto jelo rovnoměrným přímočarým pohybem po dráze ${s_km} km. Tahová síla motoru byla ${F_N} N.`;
      givens = [
        { symbol: "s", value: s_km * 1000, unit: "m" },
        { symbol: "F", value: F_N, unit: "N" }
      ];
      result = (s_km * 1000) * F_N;
    }

    currentProblem = { text, givens, result };
    problemTextEl.textContent = text;
    console.log("🆕 Nový příklad:", text);
  }

  function prepareUnitsForTopic() {
    unitSelect.innerHTML = "";
    const units = selectedTopic === "vykon" ? ["W","kW","MW"] : ["J","kJ","MJ"];
    units.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u; opt.textContent = u;
      unitSelect.appendChild(opt);
    });
  }

  // -------------------- ZÁPIS: UI ŘÁDEK --------------------
  function addZapisRow(symbol = "-", value = "", unit = "-", baseHint = false) {
    const symbols = ["-","F","s","W"];
    const units = ["-","mm","cm","m","km","J","kJ","MJ","N","kN","MN"];

    const row = document.createElement("div");
    row.className = "grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";

    const sSel = createSelect(symbols, symbol, "zapis-symbol");
    const val  = createInput(value);
    const uSel = createSelect(units, unit, "zapis-unit");

    const lab = document.createElement("label");
    lab.className = "flex items-center gap-2 text-sm text-gray-300";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "zapis-unknown h-4 w-4";
    const sp = document.createElement("span");
    sp.textContent = "Hledaná veličina";
    lab.append(cb, sp);

    cb.addEventListener("change", () => {
      val.value = cb.checked ? "?" : "";
      val.disabled = cb.checked;
      rowLiveValidate(row);
      formulaLiveValidate(); // aby výpočet věděl, co je hledané
      substitutionLiveValidate();
      resultLiveValidate();
    });
    sSel.addEventListener("change", () => { rowLiveValidate(row); formulaLiveValidate(); });
    uSel.addEventListener("change", () => rowLiveValidate(row));
    val.addEventListener("input", () => rowLiveValidate(row));

    row.append(sSel, val, uSel, lab);
    zapisContainer.appendChild(row);

    if (baseHint) {
      const hint = document.createElement("div");
      hint.className = "text-sm text-yellow-400 mt-1 italic col-span-4";
      hint.textContent = "💡 Převeď tuto veličinu na základní jednotku.";
      zapisContainer.appendChild(hint);
    }
  }

  function createSelect(options, value, cls) {
    const s = document.createElement("select");
    s.className = `${cls} p-2 rounded-md bg-gray-900 border border-gray-700 text-white`;
    options.forEach(o => {
      const opt = document.createElement("option");
      opt.value = o; opt.textContent = o;
      s.appendChild(opt);
    });
    s.value = value;
    return s;
  }
  function createInput(value) {
    const i = document.createElement("input");
    i.type = "text";
    i.placeholder = "Hodnota";
    i.value = value;
    i.className = "zapis-value p-2 rounded-md bg-gray-900 border border-gray-700 text-white";
    return i;
  }

  // -------------------- Jednotky / převody --------------------
  const symbolToKind = { s:"length", F:"force", W:"energy" };
  const baseUnit    = { length:"m", force:"N", energy:"J" };
  const unitSets = {
    length:["mm","cm","m","km"],
    energy:["J","kJ","MJ"],
    force:["N","kN","MN"]
  };
  const unitToBaseFactor = {
    mm: 1/1000, cm: 1/100, m: 1, km: 1000,
    J: 1, kJ: 1000, MJ: 1_000_000,
    N: 1, kN: 1000, MN: 1_000_000
  };

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

  // -------------------- Live validace řádku (ZÁPIS) --------------------
  function rowLiveValidate(row) {
    row.classList.remove("ring-2","ring-red-500","ring-green-500");
    const symbol  = row.querySelector(".zapis-symbol").value;
    const unit    = row.querySelector(".zapis-unit").value;
    const unknown = row.querySelector(".zapis-unknown").checked;
    const rawStr  = row.querySelector(".zapis-value").value.trim();

    // validovat až když je řádek vyplněný
    if (symbol === "-" || unit === "-" || (!unknown && rawStr === "")) return;
    const kind = symbolToKind[symbol];
    if (!kind) return;

    if (!unitSets[kind].includes(unit)) {
      row.classList.add("ring-2","ring-red-500");
      toast(`❌ ${symbol} neodpovídá jednotce ${unit}.`);
      return;
    }

    const given = currentProblem?.givens?.find(g => g.symbol === symbol);
    if (!given) {
      row.classList.add("ring-2","ring-green-500");
      return;
    }

    if (!unknown) {
      const val = parseNum(rawStr);
      if (!isFinite(val)) {
        row.classList.add("ring-2","ring-red-500");
        toast("❌ Hodnota musí být číslo.");
        return;
      }
      const inBase = val * (unitToBaseFactor[unit] ?? NaN);
      if (!isFinite(inBase)) {
        row.classList.add("ring-2","ring-red-500");
        toast(`❌ Neznámý převod pro jednotku ${unit}.`);
        return;
      }
      const expected = given.value;
      if (almostEqual(inBase, expected)) {
        row.classList.add("ring-2","ring-green-500");
      } else {
        row.classList.add("ring-2","ring-red-500");
        toast(`❌ ${symbol}: očekává se ≈ ${expected} ${given.unit}, máš ${val} ${unit} (≈ ${inBase} ${given.unit}).`);
      }
      if (unit !== given.unit) maybeAddBaseConversionRow(symbol, given.unit);
    } else {
      row.classList.add("ring-2","ring-green-500");
    }
  }

  function maybeAddBaseConversionRow(symbol, baseUnitCode) {
    const rows = [...document.querySelectorAll(".zapis-row")];
    const hasBase = rows.some(r =>
      r.querySelector(".zapis-symbol")?.value === symbol &&
      r.querySelector(".zapis-unit")?.value === baseUnitCode
    );
    if (hasBase) return;
    addZapisRow(symbol, "", baseUnitCode, true);
    toast(`ℹ️ Přidej převod: ${symbol} na ${baseUnitCode}.`);
  }

  function getUnknownSymbolFromZapis() {
    const r = [...document.querySelectorAll(".zapis-row")].find(x => x.querySelector(".zapis-unknown")?.checked);
    const sym = r?.querySelector(".zapis-symbol")?.value;
    return (sym && sym !== "-") ? sym : "W"; // default W
    }

  // -------------------- Kontrola zápisu → přechod do výpočtu --------------------
  checkZapisBtn?.addEventListener("click", () => {
    if (!currentProblem) return;
    const rows = collectRows();
    // musí existovat hledaná veličina
    if (!rows.some(r => r.unknown)) {
      toast("⚠️ Označ hledanou veličinu.");
      return;
    }
    // každá daná veličina ze zadání musí být zapsána a správná
    const errs = [];
    for (const g of currentProblem.givens) {
      const r = rows.find(x => x.symbol === g.symbol && !x.unknown && x.unit !== "-" && x.raw !== "");
      if (!r) { errs.push(`❌ Chybí veličina ${g.symbol}.`); continue; }
      const val = parseNum(r.raw);
      const factor = unitToBaseFactor[r.unit] ?? NaN;
      if (!isFinite(val) || !isFinite(factor)) { errs.push(`❌ ${g.symbol}: neplatná hodnota/jednotka.`); continue; }
      const inBase = val * factor;
      if (!almostEqual(inBase, g.value)) {
        errs.push(`❌ ${g.symbol}: očekává se ≈ ${g.value} ${g.unit}, máš ${val} ${r.unit} (≈ ${inBase} ${g.unit}).`);
      }
    }
    if (errs.length) { renderIssues(errs); return; }

    // souhrn a přechod
    const summary = mergedSummary(rows);
    zapisReview.innerHTML = `
      <div class="p-3 bg-gray-900 border border-gray-700 rounded">
        <div class="font-semibold mb-2 text-gray-300">Souhrn zápisu:</div>
        <pre class="text-gray-200 text-sm whitespace-pre-wrap">${summary}</pre>
      </div>`;
    zapisStep.classList.add("hidden");
    vypocetStep.classList.remove("hidden");

    // připrav live validace výpočtu
    formulaLiveValidate();
    substitutionLiveValidate();
    resultLiveValidate();
  });

  function collectRows() {
    return [...document.querySelectorAll(".zapis-row")].map(r => ({
      symbol:  r.querySelector(".zapis-symbol").value,
      unit:    r.querySelector(".zapis-unit").value,
      raw:     r.querySelector(".zapis-value").value.trim(),
      unknown: r.querySelector(".zapis-unknown").checked
    }));
  }

  function mergedSummary(rows) {
    const order = [];
    const bySym = {};
    rows.forEach(r => {
      if (!r.symbol || r.symbol === "-") return;
      if (!bySym[r.symbol]) { bySym[r.symbol] = []; order.push(r.symbol); }
      const part = r.unknown ? `? ${r.unit}` : `${r.raw} ${r.unit}`;
      if (!bySym[r.symbol].includes(part)) bySym[r.symbol].push(part);
    });
    return order.map(sym => `${sym} = ${bySym[sym].join(" = ")}`).join("\n");
  }

  function renderIssues(errors) {
    const html = `<div class="feedback-wrong"><b>Chyby:</b><ul class="list-disc pl-5 mt-1">${errors.map(e=>`<li>${e}</li>`).join("")}</ul></div>`;
    zapisFeedback.insertAdjacentHTML("beforeend", html);
  }

  function resetToZapis(addFirstRow = false) {
    zapisStep.classList.remove("hidden");
    vypocetStep.classList.add("hidden");
    zapisContainer.innerHTML = "";
    zapisFeedback.innerHTML = "";
    zapisReview.innerHTML = "";
    formulaInput.value = "";
    substitutionInput.value = "";
    userAnswerInput.value = "";
    vypocetFeedback.innerHTML = "";
    if (addFirstRow) addZapisRow();
  }

  function clearPractice() {
    resetToZapis(false);
    currentProblem = null;
    problemTextEl.textContent = "";
  }

  // -------------------- MODÁLY --------------------
  function toggleModal(id, show) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.toggle("hidden", !show);
  }

  tools.openCalc?.addEventListener("click", () => { renderCalculator(); toggleModal("calculator-modal", true); });
  tools.openFormula?.addEventListener("click", () => { renderFormulaTriangle(); toggleModal("formula-modal", true); });
  tools.openHelp?.addEventListener("click", () => { renderHelp(); toggleModal("help-modal", true); });
  tools.openDiagram?.addEventListener("click", () => { renderDiagram(); toggleModal("diagram-modal", true); });

  tools.closeCalc?.addEventListener("click", () => toggleModal("calculator-modal", false));
  tools.closeFormula?.addEventListener("click", () => toggleModal("formula-modal", false));
  tools.closeHelp?.addEventListener("click", () => toggleModal("help-modal", false));
  tools.closeDiagram?.addEventListener("click", () => toggleModal("diagram-modal", false));

  ["calculator-modal","formula-modal","help-modal","diagram-modal"].forEach(id => {
    const modal = document.getElementById(id);
    modal?.addEventListener("click", (e) => { if (e.target === modal) toggleModal(id, false); });
  });

  // -------------------- FORMULE (SVG) --------------------
  function renderFormulaTriangle() {
    const c = tools.formulaSvgContainer;
    if (!c) return;
    c.innerHTML = `
      <svg width="240" height="180" viewBox="0 0 240 180">
        <polygon points="120,15 25,165 215,165" fill="none" stroke="white" stroke-width="2"/>
        <line x1="52" y1="112" x2="188" y2="112" stroke="white" stroke-width="2"/>
        <text x="120" y="70"  fill="white" font-size="36" text-anchor="middle">W</text>
        <text x="120" y="150" fill="white" font-size="26" text-anchor="middle">F · s</text>
      </svg>`;
  }

  // -------------------- DIAGRAM (SVG) --------------------
  function renderDiagram() {
    const c = tools.diagramSvgContainer;
    if (!c) return;
    if (!currentProblem) {
      c.innerHTML = `<p class="text-gray-400 text-sm">Nejdříve spusťte příklad.</p>`;
      return;
    }
    const F = currentProblem.givens.find(g => g.symbol === "F") || {};
    const s = currentProblem.givens.find(g => g.symbol === "s") || {};
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

  // -------------------- NÁPOVĚDA --------------------
  function renderHelp() {
    if (!tools.helpContent) return;
    tools.helpContent.innerHTML = `
      <div class="space-y-3 text-gray-300 text-sm text-left">
        <p>💡 <b>Tip:</b> Zapište všechny <b>známé veličiny</b> a <b>označte hledanou</b> (otazníkem).</p>
        <p>🧭 Pokud je hodnota v násobcích (kN, km, kJ…), aplikace vám <b>nabídne převod</b> na základní jednotku.</p>
        <p>✅ Do výpočtu se dostanete, až když budou <b>všechny veličiny</b> ze zadání zapsané správně.</p>
      </div>`;
  }

  // -------------------- KALKULAČKA --------------------
  function renderCalculator() {
    const display = tools.calcDisplay;
    const history = tools.calcHistory;
    const btns = tools.calcButtons;
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

    btns.addEventListener("click", e => {
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
    });

    document.addEventListener("keydown", e => {
      if (!tools.modalCalc || tools.modalCalc.classList.contains("hidden")) return;
      if (/[0-9+\-*/.]/.test(e.key)) { current += e.key; update(); }
      else if (e.key === "Enter") {
        try {
          const r = eval(current);
          history.textContent = `${current} =`;
          current = String(r);
        } catch { current = "Error"; }
        update();
      } else if (e.key === "Backspace") {
        current = current.slice(0,-1); update();
      }
    });
  }

  // -------------------- VÝPOČET: Live validace --------------------
  formulaInput?.addEventListener("input", formulaLiveValidate);
  substitutionInput?.addEventListener("input", substitutionLiveValidate);
  userAnswerInput?.addEventListener("input", resultLiveValidate);
  unitSelect?.addEventListener("change", resultLiveValidate);

  function formulaLiveValidate() {
    if (!formulaInput) return;
    formulaInput.classList.remove("ring-2","ring-red-500","ring-green-500");
    const txt = (formulaInput.value || "").replace(/\s+/g, "");
    const unknown = getUnknownSymbolFromZapis(); // "W" (default), "F" nebo "s"

    let ok = false;
    if (unknown === "W") {
      ok = /^W=(F[*·]s|s[*·]F)$/.test(txt);
    } else if (unknown === "F") {
      ok = /^F=W\/s$/.test(txt);
    } else if (unknown === "s") {
      ok = /^s=W\/F$/.test(txt);
    }
    if (ok) formulaInput.classList.add("ring-2","ring-green-500");
    else if (txt.length) formulaInput.classList.add("ring-2","ring-red-500");
  }

  function substitutionLiveValidate() {
    if (!substitutionInput) return;
    substitutionInput.classList.remove("ring-2","ring-red-500","ring-green-500");
    const txt = substitutionInput.value.replace(/\s+/g, "");
    if (!txt) return;

    const unknown = getUnknownSymbolFromZapis();
    const Fg = currentProblem?.givens.find(g=>g.symbol==="F");
    const sg = currentProblem?.givens.find(g=>g.symbol==="s");
    const Wval = currentProblem?.result;

    // toleranční porovnání dvou čísel bez ohledu na pořadí
    const num = (s) => parseNum(s);
    const pairOK = (a,b,x,y) => (almostEqual(a,x) && almostEqual(b,y)) || (almostEqual(a,y) && almostEqual(b,x));

    let ok = false;
    let orderNote = "";

    if (unknown === "W") {
      // očekáváme: W = F * s (komutativně)
      const m = txt.match(/^W=(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/);
      if (m && Fg && sg) {
        const a = num(m[1]), b = num(m[2]);
        if (isFinite(a) && isFinite(b)) {
          ok = pairOK(a,b,Fg.value,sg.value);
          // zkontroluj pořadí vůči vzorci, pokud byl zadán ve formátu W=F*s
          if (/^W\s*=\s*F\s*[*·]\s*s$/i.test(formulaInput.value)) {
            if (!(almostEqual(a,Fg.value) && almostEqual(b,sg.value))) {
              orderNote = "ℹ️ Pořadí dosazení by mělo odpovídat vzorci (F pak s).";
            }
          }
        }
      }
    } else if (unknown === "F") {
      // F = W / s
      const m = txt.match(/^F=(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
      if (m && sg && isFinite(Wval)) {
        const a = num(m[1]), b = num(m[2]);
        if (isFinite(a) && isFinite(b)) {
          ok = almostEqual(a,Wval) && almostEqual(b,sg.value);
        }
      }
    } else if (unknown === "s") {
      // s = W / F
      const m = txt.match(/^s=(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
      if (m && Fg && isFinite(Wval)) {
        const a = num(m[1]), b = num(m[2]);
        if (isFinite(a) && isFinite(b)) {
          ok = almostEqual(a,Wval) && almostEqual(b,Fg.value);
        }
      }
    }

    if (ok) {
      substitutionInput.classList.add("ring-2","ring-green-500");
      if (orderNote) info(orderNote);
    } else {
      substitutionInput.classList.add("ring-2","ring-red-500");
    }
  }

  function resultLiveValidate() {
    if (!userAnswerInput) return;
    userAnswerInput.classList.remove("ring-2","ring-red-500","ring-green-500");
    if (!userAnswerInput.value) return;

    const unknown = getUnknownSymbolFromZapis();
    const ans = parseNum(userAnswerInput.value);
    const unit = unitSelect?.value || "J";

    if (!isFinite(ans)) { userAnswerInput.classList.add("ring-2","ring-red-500"); return; }

    if (unknown === "W") {
      const factor = unitToBaseFactor[unit] ?? 1;
      const inJ = ans * factor;
      const ok = almostEqual(inJ, currentProblem.result);
      userAnswerInput.classList.add("ring-2", ok ? "ring-green-500" : "ring-red-500");
    } else {
      // jiné neřešíme v aktuálních úlohách – jen formální OK
      userAnswerInput.classList.add("ring-2","ring-green-500");
    }
  }

  // -------------------- FINÁLNÍ KONTROLA VÝPOČTU --------------------
  checkCalcBtn?.addEventListener("click", () => {
    vypocetFeedback.innerHTML = "";

    const unknown = getUnknownSymbolFromZapis();
    const fTxt = (formulaInput.value || "").trim();
    const sTxt = (substitutionInput.value || "").trim();
    const resVal = parseNum(userAnswerInput.value);
    const resUnit = unitSelect.value;

    // 1) zhodnocení vzorce
    let formulaOK = false;
    const compact = fTxt.replace(/\s+/g, "");
    if (unknown === "W") formulaOK = /^W=(F[*·]s|s[*·]F)$/.test(compact);
    else if (unknown === "F") formulaOK = /^F=W\/s$/.test(compact);
    else if (unknown === "s") formulaOK = /^s=W\/F$/.test(compact);

    // 2) zhodnocení dosazení
    let substOK = false;
    let substOrderNote = "";
    const Fg = currentProblem?.givens.find(g=>g.symbol==="F");
    const sg = currentProblem?.givens.find(g=>g.symbol==="s");
    const num = (x)=>parseNum(x);

    if (unknown === "W") {
      const m = sTxt.replace(/\s+/g,"").match(/^W=(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/);
      if (m && Fg && sg) {
        const a = num(m[1]), b = num(m[2]);
        if (isFinite(a) && isFinite(b)) {
          substOK = (almostEqual(a,Fg.value) && almostEqual(b,sg.value)) ||
                    (almostEqual(a,sg.value) && almostEqual(b,Fg.value));
          if (/^W\s*=\s*F\s*[*·]\s*s$/i.test(fTxt) && !(almostEqual(a,Fg.value) && almostEqual(b,sg.value))) {
            substOrderNote = "ℹ️ Pořadí v dosazení by mělo odpovídat vzorci (F pak s).";
          }
        }
      }
    } else if (unknown === "F" && sg) {
      const Wv = currentProblem?.result;
      const m = sTxt.replace(/\s+/g,"").match(/^F=(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
      if (m && isFinite(Wv)) {
        substOK = almostEqual(num(m[1]), Wv) && almostEqual(num(m[2]), sg.value);
      }
    } else if (unknown === "s" && Fg) {
      const Wv = currentProblem?.result;
      const m = sTxt.replace(/\s+/g,"").match(/^s=(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
      if (m && isFinite(Wv)) {
        substOK = almostEqual(num(m[1]), Wv) && almostEqual(num(m[2]), Fg.value);
      }
    }

    // 3) zhodnocení výsledku
    let resultOK = false;
    let resultNote = "";
    if (unknown === "W") {
      const factor = unitToBaseFactor[resUnit] ?? 1;
      const inJ = resVal * factor;
      resultOK = isFinite(resVal) && almostEqual(inJ, currentProblem.result);
      if (!isFinite(resVal)) resultNote = "❌ Výsledek musí být číslo.";
    } else {
      // mimo rozsah současných úloh
      resultOK = isFinite(resVal);
    }

    // -------------------- VÝSTUP A HODNOCENÍ --------------------
    const summaryZapis = mergedSummary(collectRows());
    const finalMsg = [];
    if (formulaOK) finalMsg.push("✅ Vzorec v pořádku.");
    else finalMsg.push("❌ Uprav vzorec (dbej na velikost písmen a tvary: W=F*s, F=W/s, s=W/F).");

    if (substOK) finalMsg.push("✅ Správné dosazení.");
    else finalMsg.push("❌ Zkontroluj dosazení (čísla musí vycházet ze zadání).");
    if (substOrderNote) finalMsg.push(substOrderNote);

    if (resultOK) finalMsg.push("✅ Výsledek vypočten správně.");
    else finalMsg.push("❌ Výsledek neodpovídá. Zkus projít kroky znovu.");

    const html = `
      <div class="space-y-4">
        <div class="p-3 bg-gray-900 border border-gray-700 rounded">
          <div class="font-semibold text-gray-300 mb-1">Zadání:</div>
          <div class="text-gray-200">${currentProblem.text}</div>
        </div>

        <div class="p-3 bg-gray-900 border border-gray-700 rounded">
          <div class="font-semibold text-gray-300 mb-1">Tvůj zápis:</div>
          <pre class="text-gray-200 whitespace-pre-wrap text-sm">${summaryZapis}</pre>
        </div>

        <div class="p-3 bg-gray-900 border border-gray-700 rounded">
          <div class="font-semibold text-gray-300 mb-1">Tvoje řešení:</div>
          <div class="text-gray-200 text-sm">
            <div><b>Vzorec:</b> ${escapeHtml(fTxt)}</div>
            <div><b>Dosazení:</b> ${escapeHtml(sTxt)}</div>
            <div><b>Výsledek:</b> ${isFinite(resVal) ? resVal : "—"} ${resUnit}</div>
          </div>
        </div>

        <div class="p-3 bg-gray-900 border border-gray-700 rounded">
          <div class="font-semibold text-gray-300 mb-1">Hodnocení:</div>
          <ul class="list-disc pl-5 text-gray-200 text-sm">
            ${finalMsg.map(m => `<li>${m}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;
    vypocetFeedback.innerHTML = html;
  });

  // -------------------- POMOCNÉ FUNKCE --------------------
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }

  function toast(msg) {
    const d = document.createElement("div");
    d.className = "text-yellow-300 text-sm mt-1";
    d.textContent = msg;
    zapisFeedback.appendChild(d);
    setTimeout(() => d.remove(), 5000);
  }
  function info(msg) {
    const d = document.createElement("div");
    d.className = "text-blue-300 text-sm mt-1";
    d.textContent = msg;
    vypocetFeedback.appendChild(d);
    setTimeout(() => d.remove(), 5000);
  }

  
  // ====== [ADDED] Dvoupólové řádky pro výpočty (LHS = RHS) se zrcadlením do původních polí ======
  (function initTwoFieldCalc(){
    try {
      // Původní single-input prvky (ponechány kvůli původní logice)
      const formulaInput = document.getElementById("formula-input");
      const substitutionInput = document.getElementById("substitution-input");
      const userAnswerInput = document.getElementById("user-answer");
      const unitSelect = document.getElementById("unit-select");

      // Pokud už byly vytvořeny, nespouštět znovu
      if (document.getElementById("formula-lhs")) return;

      // Pomocná funkce – vytvoří dvojici vstupů s rovnítkem a zrcadlením
      function buildTwoFieldRow(whereEl, key, lhsDefault, rhsPlaceholder){
        if (!whereEl) return null;
        const row = document.createElement("div");
        row.className = "grid grid-cols-1 sm:grid-cols-6 gap-2 items-center mt-2";

        const lhs = document.createElement("input");
        lhs.type = "text"; lhs.maxLength = 2; lhs.id = key+"-lhs";
        lhs.placeholder = "W/F/s"; lhs.value = lhsDefault || "";
        lhs.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white w-16";

        const eq = document.createElement("div");
        eq.className = "flex items-center justify-center text-gray-300";
        eq.textContent = "=";

        const rhs = document.createElement("input");
        rhs.type = "text"; rhs.id = key+"-rhs";
        rhs.placeholder = rhsPlaceholder || "";
        rhs.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white";

        row.append(lhs, eq, rhs);
        whereEl.parentElement.insertBefore(row, whereEl.nextSibling);

        // Zrcadlení hodnot do původních vstupů (aby původní validace/ověření zůstalo funkční)
        function mirror(){
          const L = (lhs.value || "").trim();
          const R = (rhs.value || "").trim();
          if (key === "formula" && formulaInput){
            formulaInput.value = (L && R) ? (L + " = " + R) : "";
            formulaInput.dispatchEvent(new Event("input", {bubbles:true}));
          }
          if (key === "subs" && substitutionInput){
            substitutionInput.value = (L && R) ? (L + " = " + R) : "";
            substitutionInput.dispatchEvent(new Event("input", {bubbles:true}));
          }
          if (key === "result" && userAnswerInput){
            // do původního pole jde jen číselná hodnota (RHS)
            userAnswerInput.value = R;
            userAnswerInput.dispatchEvent(new Event("input", {bubbles:true}));
          }
        }
        lhs.addEventListener("input", mirror);
        rhs.addEventListener("input", mirror);

        return {lhs, rhs, row};
      }

      // Najdi původní řádky
      const formulaWrap = formulaInput ? formulaInput : null;
      const subsWrap = substitutionInput ? substitutionInput : null;
      // Výsledek – původně bylo input + select v řádku; vložíme dvoupólovou variantu těsně NAD něj
      let resultAnchor = null;
      if (userAnswerInput){
        // typicky je userAnswerInput inside a flex with unit select
        resultAnchor = userAnswerInput.closest("div") || userAnswerInput;
      }

      // Schovej původní single inputy (vizuálně), ponech hodnoty pro původní logiku
      if (formulaInput) formulaInput.style.display = "none";
      if (substitutionInput) substitutionInput.style.display = "none";
      if (userAnswerInput) userAnswerInput.style.display = "none";

      // Vytvoř tři dvoupólové řádky
      const f = buildTwoFieldRow(formulaWrap, "formula", "W", "F * s");
      const s = buildTwoFieldRow(subsWrap, "subs", "W", "např. 1000 * 2");
      if (resultAnchor) {
        // vlož nad blok s původním výsledkem
        const holder = document.createElement("div");
        holder.className = "mt-2";
        resultAnchor.parentElement.insertBefore(holder, resultAnchor);
        const r = buildTwoFieldRow(holder, "result", "W", "číslo");
      }

      // Reset při každém startu příkladu (pokud existuje funkce startNewProblem nebo ekvivalent)
      const originalStart = window.startNewProblem;
      window.startNewProblem = function(){
        if (typeof originalStart === "function") originalStart();
        const fl = document.getElementById("formula-lhs"); const fr = document.getElementById("formula-rhs");
        const sl = document.getElementById("subs-lhs"); const sr = document.getElementById("subs-rhs");
        const rl = document.getElementById("result-lhs"); const rr = document.getElementById("result-rhs");
        if (fl) fl.value = "W"; if (fr) fr.value = "F * s";
        if (sl) sl.value = "W"; if (sr) sr.value = "";
        if (rl) rl.value = "W"; if (rr) rr.value = "";
        // Promítnout do původních vstupů
        if (fl && fr && formulaInput){ formulaInput.value = fl.value + " = " + fr.value; }
        if (sl && sr && substitutionInput){ substitutionInput.value = sl.value + " = " + sr.value; }
        if (rr && userAnswerInput){ userAnswerInput.value = rr.value; }
      };

    } catch(e){
      console.warn("[two-field-calc] init error:", e);
    }
  })();
  // ====== [/ADDED] ======
console.log("✅ Logika aplikace úspěšně načtena.");
});
