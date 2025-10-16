// ====================================================================
//  app.js — Fyzika: Práce a výkon (verze 2025-10-19)
//  + SVG kouzelný trojúhelník, kalkulačka, nápověda, obrázek
// ====================================================================

console.log("Načítání app.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");

  // ---------- STAV ----------
  let selectedMode = null;
  let selectedLevel = null;
  let selectedTopic = "prace";
  let currentProblem = null;

  // ---------- DOM ----------
  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");
  const startButton = document.getElementById("start-button");
  const backButton = document.getElementById("back-button");
  const newProblemButton = document.getElementById("new-problem-button");
  const topicSelect = document.getElementById("topic-select");
  const addRowBtn = document.getElementById("add-zapis-row-button");
  const checkZapisBtn = document.getElementById("check-zapis-button");
  const problemTextEl = document.getElementById("problem-text");
  const zapisContainer = document.getElementById("zapis-container");
  const zapisStep = document.getElementById("zapis-step");
  const vypocetStep = document.getElementById("vypocet-step");
  const zapisFeedback = document.getElementById("zapis-feedback-container");
  const zapisReview = document.getElementById("zapis-review-container");

  // ---------- REŽIM A ÚROVEŇ ----------
  document.querySelectorAll('[id^="mode-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll('[id^="mode-"]').forEach(b => b.classList.remove("ring-2", "ring-blue-500"));
      btn.classList.add("ring-2", "ring-blue-500");
      selectedMode = btn.id.includes("practice") ? "practice" : "test";
      updateStartButtonState();
      console.log(`🎓 Režim zvolen: ${selectedMode}`);
    });
  });

  document.querySelectorAll('[id^="level-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll('[id^="level-"]').forEach(b => b.classList.remove("ring-2", "ring-blue-500"));
      btn.classList.add("ring-2", "ring-blue-500");
      selectedLevel = btn.id.includes("normal") ? "normal" :
                      btn.id.includes("hard") ? "hard" : "easy";
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
    if (ready) console.log("✅ Start povolen");
  }

  // ---------- OVLÁDÁNÍ ----------
  startButton?.addEventListener("click", () => {
    console.log("▶️ Kliknuto na Spustit");
    setupScreen.classList.add("hidden");
    practiceScreen.classList.remove("hidden");
    resetToZapis(true);
    generateProblem();
  });

  backButton?.addEventListener("click", () => {
    practiceScreen.classList.add("hidden");
    setupScreen.classList.remove("hidden");
    clearPractice();
  });

  newProblemButton?.addEventListener("click", () => {
    console.log("🆕 Klik: Nový příklad");
    generateProblem();
    resetToZapis(true);
  });

  addRowBtn?.addEventListener("click", () => addZapisRow());

  // ---------- GENERÁTOR ÚLOH ----------
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function generateProblem() {
    const variant = randInt(1, 2);
    let text, givens, result;

    if (variant === 1) {
      const FkN = randInt(1, 9);
      const s_m = 2;
      text = `Těleso bylo přesunuto silou ${FkN} kN po dráze ${s_m} m. Jaká práce byla vykonána?`;
      givens = [{ symbol: "F", value: FkN, unit: "kN" }, { symbol: "s", value: s_m, unit: "m" }];
      result = (FkN * 1000) * s_m;
    } else {
      const s_km = randInt(1, 5);
      const F_N = randInt(800, 2000);
      text = `Auto jelo rovnoměrným přímočarým pohybem po dráze ${s_km} km. Tahová síla motoru byla ${F_N} N.`;
      givens = [{ symbol: "s", value: s_km, unit: "km" }, { symbol: "F", value: F_N, unit: "N" }];
      result = (s_km * 1000) * F_N;
    }

    currentProblem = { text, givens, result };
    problemTextEl.textContent = text;
    console.log("🆕 Nový příklad:", text);
  }

  // ---------- TVORBA ŘÁDKŮ ----------
  function addZapisRow(symbol = "-", value = "", unit = "-", baseHint = false) {
    const sy = ["-","F","s","W","P","t","m"];
    const un = ["-","mm","cm","m","km","J","kJ","MJ","N","kN","MN","W","kW","MW","g","kg","t","s","min","h"];

    const row = document.createElement("div");
    row.className = "grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";

    const sSel = createSelect(sy, symbol, "zapis-symbol");
    const val = createInput(value);
    const uSel = createSelect(un, unit, "zapis-unit");

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
    });

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
      opt.value = o;
      opt.textContent = o;
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

  // ---------- VALIDACE + ZOBRAZENÍ ----------
  const symbolToKind = { s:"length", W:"energy", F:"force", P:"power", m:"mass", t:"time" };
  const baseUnit = { length:"m", energy:"J", force:"N", power:"W", mass:"kg", time:"s" };
  const unitSets = {
    length:["mm","cm","m","km"],
    energy:["J","kJ","MJ"],
    force:["N","kN","MN"],
    power:["W","kW","MW"],
    mass:["g","kg","t"],
    time:["s","min","h"]
  };

  checkZapisBtn?.addEventListener("click", () => {
    const rows = collect();
    const result = validateZapisFull(rows);
    renderSummary(mergedSummary(rows));
    renderIssues(result.errors, result.warnings);

    if (result.errors.length === 0) {
      zapisStep.classList.add("hidden");
      vypocetStep.classList.remove("hidden");
      zapisReview.innerHTML = `
        <div class="p-3 bg-gray-900 border border-gray-700 rounded">
          <pre class="text-gray-200 text-sm whitespace-pre-wrap">${mergedSummary(rows)}</pre>
        </div>
      `;
    }
  });

  function collect() {
    return [...document.querySelectorAll(".zapis-row")].map(r => ({
      symbol: r.querySelector(".zapis-symbol").value,
      unit: r.querySelector(".zapis-unit").value,
      raw: r.querySelector(".zapis-value").value.trim(),
      unknown: r.querySelector(".zapis-unknown").checked
    }));
  }

  function validateZapisFull(rows) {
    const errors = [];
    const warnings = [];
    const conversions = [];

    if (rows.length === 0) errors.push("Zápis je prázdný.");

    const hasUnknown = rows.some(r => r.unknown);
    if (!hasUnknown) errors.push("Označ 'Hledanou veličinu'.");

    rows.forEach(r => {
      const k = symbolToKind[r.symbol];
      if (!k) return;
      if (!unitSets[k].includes(r.unit))
        errors.push(`Veličina ${r.symbol} neodpovídá jednotce ${r.unit}.`);

      const base = baseUnit[k];
      if (r.unit !== "-" && r.unit !== base)
        conversions.push({ symbol: r.symbol, base });
    });

    return { errors, warnings, conversions };
  }

  function mergedSummary(rows) {
    const map = {};
    rows.forEach(r => {
      if (!r.symbol || r.symbol === "-") return;
      map[r.symbol] ??= [];
      const part = r.unknown ? "? " + r.unit : `${r.raw} ${r.unit}`;
      if (!map[r.symbol].includes(part)) map[r.symbol].push(part);
    });
    return Object.entries(map).map(([s, vals]) => `${s} = ${vals.join(" = ")}`).join("\n");
  }

  function renderSummary(text) {
    zapisFeedback.innerHTML = `
      <div class="p-3 bg-gray-900 border border-gray-700 rounded mb-3">
        <div class="font-semibold mb-2 text-gray-300">Souhrn zápisu:</div>
        <pre class="text-gray-200 text-sm whitespace-pre-wrap">${text}</pre>
      </div>`;
  }

  function renderIssues(errors) {
    const parts = [];
    if (errors.length)
      parts.push(`<div class="feedback-wrong"><b>Chyby:</b><ul>${errors.map(e=>`<li>${e}</li>`).join("")}</ul></div>`);
    if (!errors.length)
      parts.push(`<div class="feedback-correct">✅ Zápis je v pořádku.</div>`);
    zapisFeedback.insertAdjacentHTML("beforeend", parts.join("\n"));
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

  // ---------- MODÁLY ----------
  function toggleModal(id, show) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.toggle("hidden", !show);
  }

  // Otevření modálů
  document.getElementById("open-calculator-button").onclick = () => toggleModal("calculator-modal", true);
  document.getElementById("open-formula-button").onclick = () => {
    renderFormulaTriangle();
    toggleModal("formula-modal", true);
  };
  document.getElementById("open-diagram-button").onclick = () => {
    renderDiagram();
    toggleModal("diagram-modal", true);
  };
  document.getElementById("open-help-button").onclick = () => {
    renderHelp();
    toggleModal("help-modal", true);
  };

  // Zavření modálů
  ["calculator", "formula", "diagram", "help"].forEach(name => {
    const modal = document.getElementById(`${name}-modal`);
    const closeBtn = document.getElementById(`close-${name}-button`);
    closeBtn.addEventListener("click", () => toggleModal(`${name}-modal`, false));
    modal.addEventListener("click", e => { if (e.target === modal) toggleModal(`${name}-modal`, false); });
  });

  // ---------- SVG TROJÚHELNÍK ----------
  function renderFormulaTriangle() {
    const c = document.getElementById("formula-svg-container");
    c.innerHTML = `
      <svg width="200" height="160" viewBox="0 0 200 160">
        <polygon points="100,10 10,150 190,150" fill="none" stroke="white" stroke-width="2"/>
        <line x1="45" y1="100" x2="155" y2="100" stroke="white" stroke-width="2"/>
        <text x="100" y="60" fill="white" font-size="32" text-anchor="middle">W</text>
        <text x="65" y="135" fill="white" font-size="28" text-anchor="middle">F</text>
        <text x="135" y="135" fill="white" font-size="28" text-anchor="middle">s</text>
      </svg>`;
  }

  // ---------- SVG OBRÁZEK ----------
  function renderDiagram() {
    const c = document.getElementById("diagram-svg-container");
    c.innerHTML = `
      <svg width="250" height="160" viewBox="0 0 250 160">
        <rect x="20" y="120" width="210" height="8" fill="#888"/>
        <rect x="60" y="90" width="60" height="30" fill="#00AEEF" stroke="white" stroke-width="2"/>
        <circle cx="70" cy="125" r="8" fill="#333"/>
        <circle cx="110" cy="125" r="8" fill="#333"/>
        <text x="130" y="80" fill="white" font-size="14">F</text>
        <line x1="130" y1="75" x2="180" y2="75" stroke="red" stroke-width="2" marker-end="url(#arrowhead)"/>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="red"/>
          </marker>
        </defs>
      </svg>`;
  }

  // ---------- NÁPOVĚDA ----------
  function renderHelp() {
    const c = document.getElementById("help-content");
    if (selectedMode === "practice") {
      const rows = collect();
      const next = rows.find(r => r.symbol === "-" || r.raw === "");
      if (next)
        c.innerHTML = "💬 Zkus doplnit další veličinu podle zadání (např. F, s nebo W).";
      else
        c.innerHTML = "✅ Výborně! Zápis vypadá kompletní.";
    } else {
      c.innerHTML = "Nápověda je k dispozici pouze v režimu procvičování.";
    }
  }

  console.log("✅ Logika aplikace úspěšně načtena.");
});
