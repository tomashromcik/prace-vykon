// ====================================================================
//  app.js — Fyzika: Práce a výkon (verze 2025-10-20, fix řádkové kontroly,
//  auto-převodu a SVG trojúhelníku s „F · s“)
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

  // -------------------- REŽIM A ÚROVEŇ --------------------
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

  // -------------------- OVLÁDÁNÍ --------------------
  startButton?.addEventListener("click", () => {
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
    generateProblem();
    resetToZapis(true);
  });

  addRowBtn?.addEventListener("click", () => addZapisRow());

  // -------------------- GENERÁTOR ÚLOH --------------------
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
      selectedTopic = "prace";
    } else {
      const s_km = randInt(1, 5);
      const F_N = randInt(800, 2000);
      text = `Auto jelo rovnoměrným přímočarým pohybem po dráze ${s_km} km. Tahová síla motoru byla ${F_N} N.`;
      givens = [{ symbol: "s", value: s_km, unit: "km" }, { symbol: "F", value: F_N, unit: "N" }];
      result = (s_km * 1000) * F_N;
      selectedTopic = "prace";
    }

    currentProblem = { text, givens, result };
    problemTextEl.textContent = text;
    console.log("🆕 Nový příklad:", text);
  }

  // -------------------- ZÁPIS --------------------
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
      // živá kontrola při změně checkboxu
      rowLiveValidateAndMaybeConvert(row);
    });

    // Živá kontrola: při změně kterékoli části řádku
    sSel.addEventListener("change", () => rowLiveValidateAndMaybeConvert(row));
    uSel.addEventListener("change", () => rowLiveValidateAndMaybeConvert(row));
    val.addEventListener("input", () => rowLiveValidateAndMaybeConvert(row));

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

  // -------------------- VALIDACE (mapy jednotek) --------------------
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

  // převodní koeficienty -> na základní jednotku
  const unitToBaseFactor = {
    // délka
    mm: 1/1000, cm: 1/100, m: 1, km: 1000,
    // energie
    J: 1, kJ: 1000, MJ: 1_000_000,
    // síla
    N: 1, kN: 1000, MN: 1_000_000,
    // výkon
    W: 1, kW: 1000, MW: 1_000_000,
    // hmotnost
    g: 1/1000, kg: 1, t: 1000,
    // čas
    s: 1, min: 60, h: 3600
  };

  function isRowComplete(row) {
    const symbol = row.querySelector(".zapis-symbol").value;
    const unit = row.querySelector(".zapis-unit").value;
    const unknown = row.querySelector(".zapis-unknown").checked;
    const raw = row.querySelector(".zapis-value").value.trim();
    return symbol !== "-" && unit !== "-" && (unknown || raw !== "");
  }

  function rowLiveValidateAndMaybeConvert(row) {
    // reset vizuálních stavů
    row.classList.remove("ring-2", "ring-red-500", "ring-green-500");

    if (!isRowComplete(row)) {
      // Nevalidovat, dokud není kompletní (jak sis přál)
      return;
    }

    const symbol = row.querySelector(".zapis-symbol").value;
    const unit = row.querySelector(".zapis-unit").value;
    const unknown = row.querySelector(".zapis-unknown").checked;
    const raw = row.querySelector(".zapis-value").value.trim();

    const kind = symbolToKind[symbol];
    if (!kind) {
      // např. když někdo zvolí "-" a pak doplní zbytek – nechat být
      return;
    }

    // 1) kontrola shody veličina ↔ jednotka
    if (!unitSets[kind].includes(unit)) {
      row.classList.add("ring-2", "ring-red-500");
      toast(`❌ ${symbol} neodpovídá jednotce ${unit}.`);
      return;
    }

    // 2) pro známé hodnoty zkus číselnost
    if (!unknown && raw !== "" && !isFinite(Number(raw))) {
      row.classList.add("ring-2", "ring-red-500");
      toast(`❌ ${symbol}: hodnota musí být číslo nebo zaškrtni "Hledaná veličina".`);
      return;
    }

    row.classList.add("ring-2", "ring-green-500");

    // 3) automatické nabídnutí řádku pro převod (pokud není v základní jednotce)
    const base = baseUnit[kind];
    if (!unknown && unit !== base) {
      maybeAddBaseConversionRow(symbol, base);
    }
  }

  function maybeAddBaseConversionRow(symbol, baseUnitCode) {
    // zda už existuje řádek pro stejný symbol v základní jednotce
    const rows = [...document.querySelectorAll(".zapis-row")];
    const hasBase = rows.some(r =>
      r.querySelector(".zapis-symbol")?.value === symbol &&
      r.querySelector(".zapis-unit")?.value === baseUnitCode
    );
    if (hasBase) return;

    // vlož nový řádek pro převod
    addZapisRow(symbol, "", baseUnitCode, true);
    toast(`ℹ️ Přidej převod: ${symbol} na ${baseUnitCode}.`);
  }

  function toast(msg) {
    // jednoduchá nenáročná hláška do feedbacku (bez duplicit)
    const p = document.createElement("div");
    p.className = "text-sm text-yellow-300 mt-1";
    p.textContent = msg;
    zapisFeedback.appendChild(p);
    // po 6s zmizí
    setTimeout(() => p.remove(), 6000);
  }

  // -------------------- KONTROLA ZÁPISU (tlačítkem) --------------------
  checkZapisBtn?.addEventListener("click", () => {
    const rows = collect();
    const result = validateZapisFull(rows);
    renderSummary(mergedSummary(rows));
    renderIssues(result.errors);

    // pokud jsou známé veličiny v násobcích (kN, km, ...), zajistí vložení řádku pro převod
    rows.forEach(r => {
      if (!r.symbol || r.symbol === "-" || r.unknown) return;
      const kind = symbolToKind[r.symbol];
      if (!kind) return;
      const base = baseUnit[kind];
      if (r.unit !== "-" && r.unit !== base) {
        maybeAddBaseConversionRow(r.symbol, base);
      }
    });

    if (result.errors.length === 0) {
      zapisStep.classList.add("hidden");
      vypocetStep.classList.remove("hidden");
      zapisReview.innerHTML = `
        <div class="p-3 bg-gray-900 border border-gray-700 rounded">
          <pre class="text-gray-200 text-sm whitespace-pre-wrap">${mergedSummary(rows)}</pre>
        </div>`;
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
    if (rows.length === 0) errors.push("Zápis je prázdný.");
    const hasUnknown = rows.some(r => r.unknown);
    if (!hasUnknown) errors.push("Označ hledanou veličinu.");

    rows.forEach(r => {
      if (!r.symbol || r.symbol === "-" || r.unit === "-") return;
      const k = symbolToKind[r.symbol];
      if (!k) return;
      if (!unitSets[k].includes(r.unit)) {
        errors.push(`Veličina ${r.symbol} neodpovídá jednotce ${r.unit}.`);
      }
      if (!r.unknown && r.raw !== "" && !isFinite(Number(r.raw))) {
        errors.push(`Veličina ${r.symbol}: hodnota musí být číslo.`);
      }
    });
    return { errors };
  }

  // -------------------- SOUHRN (např. „F = 2 kN = 2000 N“) --------------------
  function mergedSummary(rows) {
    // Poskládáme podle symbolů postupně tak, jak jsou seřazeny v zápisu
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
    else
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

  // -------------------- MODÁLY --------------------
  function toggleModal(id, show) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.toggle("hidden", !show);
  }

  const btnMap = {
    "open-calculator-button": "calculator-modal",
    "open-formula-button": "formula-modal",
    "open-diagram-button": "diagram-modal",
    "open-help-button": "help-modal"
  };

  Object.entries(btnMap).forEach(([btnId, modalId]) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener("click", () => {
        if (btnId === "open-formula-button") renderFormulaTriangle();
        if (btnId === "open-diagram-button") renderDiagram();
        if (btnId === "open-help-button") renderHelp();
        if (btnId === "open-calculator-button") renderCalculator();
        toggleModal(modalId, true);
      });
    }
  });

  ["calculator", "formula", "diagram", "help"].forEach(name => {
    const modal = document.getElementById(`${name}-modal`);
    const closeBtn = document.getElementById(`close-${name}-button`);
    if (modal && closeBtn) {
      closeBtn.addEventListener("click", () => toggleModal(`${name}-modal`, false));
      modal.addEventListener("click", e => {
        if (e.target === modal) toggleModal(`${name}-modal`, false);
      });
    }
  });

  // -------------------- SVG VZOREC (opravena příčka a „F · s“) --------------------
  function renderFormulaTriangle() {
    const c = document.getElementById("formula-svg-container");
    const svg = (selectedTopic === "vykon")
      ? `
        <svg width="220" height="170" viewBox="0 0 220 170">
          <polygon points="110,12 20,158 200,158" fill="none" stroke="white" stroke-width="2"/>
          <!-- příčka: jasně vodorovná mezi odvěsnami -->
          <line x1="40" y1="102" x2="180" y2="102" stroke="white" stroke-width="2"/>
          <text x="110" y="63" fill="white" font-size="34" text-anchor="middle">P</text>
          <text x="72"  y="140" fill="white" font-size="28" text-anchor="middle">W</text>
          <text x="148" y="140" fill="white" font-size="28" text-anchor="middle">t</text>
        </svg>`
      : `
        <svg width="220" height="170" viewBox="0 0 220 170">
          <polygon points="110,12 20,158 200,158" fill="none" stroke="white" stroke-width="2"/>
          <!-- příčka: jasně vodorovná mezi odvěsnami -->
          <line x1="40" y1="102" x2="180" y2="102" stroke="white" stroke-width="2"/>
          <text x="110" y="63" fill="white" font-size="34" text-anchor="middle">W</text>
          <text x="72"  y="140" fill="white" font-size="26" text-anchor="middle">F · s</text>
        </svg>`;
    c.innerHTML = svg;
  }

  // -------------------- SVG OBRÁZEK --------------------
  function renderDiagram() {
    const c = document.getElementById("diagram-svg-container");
    if (!currentProblem) {
      c.innerHTML = `<p class="text-gray-400 text-sm">Nejdříve spusťte příklad.</p>`;
      return;
    }

    const F = currentProblem.givens.find(g => g.symbol === "F") || {};
    const s = currentProblem.givens.find(g => g.symbol === "s") || {};

    c.innerHTML = `
      <svg width="320" height="180" viewBox="0 0 320 180">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="red"/>
          </marker>
          <marker id="arrowhead2" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="orange"/>
          </marker>
        </defs>
        <rect x="20" y="150" width="280" height="8" fill="#777"/>
        <rect x="80" y="110" width="80" height="40" fill="#00AEEF" stroke="white" stroke-width="2"/>
        <circle cx="95" cy="150" r="9" fill="#333"/>
        <circle cx="145" cy="150" r="9" fill="#333"/>
        <line x1="160" y1="130" x2="240" y2="130" stroke="red" stroke-width="3" marker-end="url(#arrowhead)"/>
        <text x="200" y="120" fill="red" font-size="16" text-anchor="middle">F = ${F.value || "?"} ${F.unit || ""}</text>
        <line x1="80" y1="165" x2="240" y2="165" stroke="orange" stroke-width="2" marker-end="url(#arrowhead2)"/>
        <text x="160" y="180" fill="orange" font-size="14" text-anchor="middle">s = ${s.value || "?"} ${s.unit || ""}</text>
      </svg>
    `;
  }

  // -------------------- KALKULAČKA --------------------
  function renderCalculator() {
    const displayMain = document.getElementById("calculator-display");
    const historyEl = document.getElementById("calculator-history");
    const btns = document.getElementById("calculator-buttons");
    if (!displayMain || !historyEl || !btns) return;

    btns.innerHTML = "";
    const keys = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+","C","⌫","Copy"];
    keys.forEach(k => {
      const b = document.createElement("button");
      b.textContent = k;
      b.className = "bg-gray-700 text-white py-2 rounded hover:bg-gray-600";
      btns.appendChild(b);
    });

    let current = "";
    function updateDisplay(){ displayMain.textContent = current || "0"; }
    updateDisplay();

    btns.addEventListener("click", e => {
      const t = e.target.textContent;
      if (t==="C"){current="";historyEl.textContent="";}
      else if (t==="⌫"){current=current.slice(0,-1);}
      else if (t==="="){
        try{
          const r=eval(current);
          historyEl.textContent=`${current} =`;
          current=String(r);
        }catch{
          current="Error";
        }
      }
      else if (t==="Copy"){
        navigator.clipboard.writeText(displayMain.textContent);
      }
      else {
        current+=t;
      }
      updateDisplay();
    });

    document.addEventListener("keydown", e=>{
      if(/[0-9\+\-\*\/\.]/.test(e.key)){current+=e.key;updateDisplay();}
      else if(e.key==="Enter"){
        try{
          const r=eval(current);
          historyEl.textContent=`${current} =`;
          current=String(r);
          updateDisplay();
        }catch{
          current="Error";
          updateDisplay();
        }
      }
      else if(e.key==="Backspace"){current=current.slice(0,-1);updateDisplay();}
    });
  }

  // -------------------- NÁPOVĚDA --------------------
  function renderHelp() {
    const c = document.getElementById("help-modal");
    if (!c) return;
    c.querySelector(".help-content").innerHTML = `
      <div class="space-y-3 text-gray-300 text-sm">
        <p>💡 <b>Tip:</b> Při řešení vždy vycházej z textu zadání.</p>
        <p>1️⃣ Vyber známé veličiny a doplň jejich hodnoty i jednotky.</p>
        <p>2️⃣ Označ <b>hledanou veličinu</b> pomocí checkboxu.</p>
        <p>3️⃣ Pokud je hodnota v násobcích (např. kN, km), proveď převod na základní jednotku (automatický řádek se nabídne).</p>
      </div>`;
  }

  console.log("✅ Logika aplikace úspěšně načtena.");
});
