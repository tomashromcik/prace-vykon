// ====================================================================
//  app.js — Fyzika: Práce a výkon (kompatibilní s dodaným HTML)
//  - Aktivní zvýraznění tlačítek režimu/obtížnosti
//  - Přepínání obrazovek (setup ↔ practice)
//  - Funkční modály (kalkulačka, vzorec, nápověda, obrázek)
//  - Zápis: live validace + kontrola proti zadání (s převody, ±5 % tolerance)
//  - 'Zkontrolovat zápis' → přepnutí do kroku Výpočet + textový souhrn
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
      // (Pro případný budoucí režim výkonu – teď držíme "práci")
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
    });
    sSel.addEventListener("change", () => rowLiveValidate(row));
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

  // -------------------- Live validace řádku --------------------
  function rowLiveValidate(row) {
    row.classList.remove("ring-2","ring-red-500","ring-green-500");
    // nečistíme global feedback při každém stisku, necháme více hlášek

    const symbol  = row.querySelector(".zapis-symbol").value;
    const unit    = row.querySelector(".zapis-unit").value;
    const unknown = row.querySelector(".zapis-unknown").checked;
    const rawStr  = row.querySelector(".zapis-value").value.trim();

    // validovat až když je řádek vyplněný (jak jsi chtěl)
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
      // neznámá veličina v zadání – jen formální ok
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
      const expected = given.value; // v základních jednotkách

      if (almostEqual(inBase, expected)) {
        row.classList.add("ring-2","ring-green-500");
      } else {
        row.classList.add("ring-2","ring-red-500");
        toast(`❌ ${symbol}: očekává se ≈ ${expected} ${given.unit}, zapsáno ${val} ${unit} (≈ ${inBase} ${given.unit}).`);
      }

      // nabídka převodu na základní jednotku
      if (unit !== given.unit) maybeAddBaseConversionRow(symbol, given.unit);
    } else {
      // hledaná veličina
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

  // -------------------- Kontrola zápisu → přechod do výpočtu --------------------
  checkZapisBtn?.addEventListener("click", () => {
    if (!currentProblem) return;
    const rows = collectRows();
    const required = currentProblem.givens.map(g => g.symbol);

    // musí existovat hledaná veličina
    if (!rows.some(r => r.unknown)) {
      toast("⚠️ Označ hledanou veličinu.");
      return;
    }

    // každá požadovaná veličina musí být vyplněná a správná (včetně převodu)
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

  // -------------------- POMOCNÉ FUNKCE --------------------
  function toast(msg) {
    const d = document.createElement("div");
    d.className = "text-yellow-300 text-sm mt-1";
    d.textContent = msg;
    zapisFeedback.appendChild(d);
    setTimeout(() => d.remove(), 5000);
  }

  console.log("✅ Logika aplikace úspěšně načtena.");
});
