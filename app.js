// ====================================================================
//  app.js — Fyzika: Práce a výkon (2025-10-21, stabilní build)
//  ✓ Kontrola zápisu podle zadání (všechny veličiny povinné)
//  ✓ Tolerance ±5 %, převody na základní jednotky (km→m, kN→N, …)
//  ✓ Auto-řádek pro převod, toast hlášky
//  ✓ SVG trojúhelník (W / (F · s)) s vodorovnou příčkou a centrovaným textem
//  ✓ Kalkulačka (2ř disp., kopírování), modály, nápověda s fallbackem
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
  const zapisStep = document.getElementById("zapis-step");
  const vypocetStep = document.getElementById("vypocet-step");
  const zapisContainer = document.getElementById("zapis-container");
  const zapisFeedback = document.getElementById("zapis-feedback-container");
  const zapisReview = document.getElementById("zapis-review-container");

  // -------------------- REŽIM A OBTÍŽNOST --------------------
  document.querySelectorAll('[id^="mode-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll('[id^="mode-"]').forEach(b => b.classList.remove("ring-2","ring-blue-500"));
      btn.classList.add("ring-2","ring-blue-500");
      selectedMode = btn.id.includes("practice") ? "practice" : "test";
      updateStartButtonState();
      console.log(`🎓 Režim zvolen: ${selectedMode}`);
    });
  });

  document.querySelectorAll('[id^="level-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll('[id^="level-"]').forEach(b => b.classList.remove("ring-2","ring-blue-500"));
      btn.classList.add("ring-2","ring-blue-500");
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

  // Givens v základních jednotkách (N, m) pro jasné porovnání
  function generateProblem() {
    const variant = randInt(1, 2);
    let text, givens, result;

    if (variant === 1) {
      const FkN = randInt(1, 9);    // 1–9 kN
      const s_m = 2;                // 2 m
      text = `Těleso bylo přesunuto silou ${FkN} kN po dráze ${s_m} m. Jaká práce byla vykonána?`;
      givens = [
        { symbol: "F", value: FkN * 1000, unit: "N" },
        { symbol: "s", value: s_m,       unit: "m" }
      ];
      result = (FkN * 1000) * s_m;
      selectedTopic = "prace";
    } else {
      const s_km = randInt(1, 5);    // 1–5 km
      const F_N = randInt(800, 2000);// 800–2000 N
      text = `Auto jelo rovnoměrným přímočarým pohybem po dráze ${s_km} km. Tahová síla motoru byla ${F_N} N.`;
      givens = [
        { symbol: "s", value: s_km * 1000, unit: "m" },
        { symbol: "F", value: F_N,         unit: "N" }
      ];
      result = (s_km * 1000) * F_N;
      selectedTopic = "prace";
    }

    currentProblem = { text, givens, result };
    problemTextEl.textContent = text;
    console.log("🆕 Nový příklad:", text);
  }

  // -------------------- ZÁPIS: UI řádek --------------------
  function addZapisRow(symbol = "-", value = "", unit = "-", baseHint = false) {
    const sy = ["-","F","s","W","P","t","m"];
    const un = ["-","mm","cm","m","km","J","kJ","MJ","N","kN","MN","W","kW","MW","g","kg","t","s","min","h"];

    const row = document.createElement("div");
    row.className = "grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";

    const sSel = createSelect(sy, symbol, "zapis-symbol");
    const val  = createInput(value);
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
  const symbolToKind = { s:"length", W:"energy", F:"force", P:"power", m:"mass", t:"time" };
  const baseUnit    = { length:"m", energy:"J", force:"N", power:"W", mass:"kg", time:"s" };
  const unitSets = {
    length:["mm","cm","m","km"],
    energy:["J","kJ","MJ"],
    force:["N","kN","MN"],
    power:["W","kW","MW"],
    mass:["g","kg","t"],
    time:["s","min","h"]
  };
  const unitToBaseFactor = {
    // length
    mm: 1/1000, cm: 1/100, m: 1, km: 1000,
    // energy
    J: 1, kJ: 1000, MJ: 1_000_000,
    // force
    N: 1, kN: 1000, MN: 1_000_000,
    // power
    W: 1, kW: 1000, MW: 1_000_000,
    // mass
    g: 1/1000, kg: 1, t: 1000,
    // time
    s: 1, min: 60, h: 3600
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
    const symbol  = row.querySelector(".zapis-symbol").value;
    const unit    = row.querySelector(".zapis-unit").value;
    const unknown = row.querySelector(".zapis-unknown").checked;
    const rawStr  = row.querySelector(".zapis-value").value.trim();

    // validate only when row is complete (jak jsi chtěl)
    if (symbol === "-" || unit === "-" || (!unknown && rawStr === "")) return;

    const kind = symbolToKind[symbol];
    if (!kind) return;

    if (!unitSets[kind].includes(unit)) {
      row.classList.add("ring-2","ring-red-500");
      toast(`❌ ${symbol} neodpovídá jednotce ${unit}.`);
      return;
    }

    row.classList.add("ring-2","ring-green-500");

    // Auto-nabídka převodu na základní jednotku
    const base = baseUnit[kind];
    if (!unknown && unit !== base) {
      maybeAddBaseConversionRow(symbol, base);
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

  // -------------------- Kontrola zápisu tlačítkem --------------------
  checkZapisBtn?.addEventListener("click", () => {
    if (!currentProblem) return;

    const rows = collectRows();
    const requiredSymbols = currentProblem.givens.map(g => g.symbol);

    // 1) Musí existovat označená hledaná veličina
    const hasUnknown = rows.some(r => r.unknown);
    if (!hasUnknown) {
      toast("⚠️ Označ hledanou veličinu (zaškrtni řádek s „?“).");
      return;
    }

    // 2) Každá vyžadovaná veličina musí být v zápisu, vyplněná a s jednotkou
    for (const sym of requiredSymbols) {
      const candidate = rows.find(r => r.symbol === sym && !r.unknown && r.unit !== "-" && r.raw.trim() !== "");
      if (!candidate) {
        toast(`❌ Chybí veličina ${sym} nebo není vyplněna.`);
        return;
      }
    }

    // 3) Hodnoty musí odpovídat zadání (s tolerancí a převody)
    //    Zadání máme v základních jednotkách (viz generateProblem)
    const errors = [];
    for (const g of currentProblem.givens) {
      const r = rows.find(x => x.symbol === g.symbol && !x.unknown);
      if (!r) { errors.push(`Veličina ${g.symbol} chybí.`); continue; }

      const k = symbolToKind[g.symbol];
      const base = baseUnit[k];
      const raw = parseNum(r.raw);
      if (!isFinite(raw)) { errors.push(`Veličina ${g.symbol}: hodnota musí být číslo.`); continue; }

      const factor = unitToBaseFactor[r.unit] ?? NaN;
      if (!isFinite(factor)) { errors.push(`Neznámý převod pro jednotku ${r.unit}.`); continue; }

      const inBase = raw * factor;       // převedeno do základní jednotky
      const expected = g.value;          // očekávaná hodnota v základní jednotce
      if (!almostEqual(inBase, expected, 0.05)) {
        errors.push(`❌ ${g.symbol}: očekává se ≈ ${expected} ${base}, zapsáno ${raw} ${r.unit} (≈ ${inBase} ${base}).`);
      }
    }

    if (errors.length) {
      renderIssues(errors);
      return;
    }

    // 4) Souhrn + přechod do výpočtu
    renderSummary(mergedSummary(rows));
    zapisReview.innerHTML = `
      <div class="p-3 bg-gray-900 border border-gray-700 rounded">
        <pre class="text-gray-200 text-sm whitespace-pre-wrap">${mergedSummary(rows)}</pre>
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

  // Textový souhrn: „F = 2 kN = 2000 N“
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

  function renderSummary(text) {
    zapisFeedback.innerHTML = `
      <div class="p-3 bg-gray-900 border border-gray-700 rounded mb-3">
        <div class="font-semibold mb-2 text-gray-300">Souhrn zápisu:</div>
        <pre class="text-gray-200 text-sm whitespace-pre-wrap">${text}</pre>
      </div>`;
  }

  function renderIssues(errors) {
    const html = `<div class="feedback-wrong"><b>Chyby:</b><ul>${errors.map(e=>`<li>${e}</li>`).join("")}</ul></div>`;
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

  const btnMap = {
    "open-calculator-button": "calculator-modal",
    "open-formula-button": "formula-modal",
    "open-diagram-button": "diagram-modal",
    "open-help-button": "help-modal"
  };
  Object.entries(btnMap).forEach(([btnId, modalId]) => {
    document.getElementById(btnId)?.addEventListener("click", () => {
      if (btnId === "open-formula-button") renderFormulaTriangle();
      if (btnId === "open-diagram-button") renderDiagram();
      if (btnId === "open-help-button") renderHelp();
      if (btnId === "open-calculator-button") renderCalculator();
      toggleModal(metalIdSafe(modalId), true);
    });
  });
  ["calculator","formula","diagram","help"].forEach(name => {
    const modalId = `${name}-modal`;
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(`close-${name}-button`);
    if (modal && closeBtn) {
      closeBtn.addEventListener("click", () => toggleModal(modalId, false));
      modal.addEventListener("click", e => { if (e.target === modal) toggleModal(modalId, false); });
    }
  });
  function metalIdSafe(id) { return id; } // placeholder (kvůli minifikaci nic nedělá)

  // -------------------- SVG FORMULE (trojúhelník) --------------------
  function renderFormulaTriangle() {
    const c = document.getElementById("formula-svg-container");
    if (!c) return;
    // Rozměry a pozice zvoleny tak, aby příčka byla jasně VODOROVNÁ a mezi odvěsnami
    c.innerHTML = `
      <svg width="240" height="180" viewBox="0 0 240 180">
        <!-- trojúhelník -->
        <polygon points="120,15 25,165 215,165" fill="none" stroke="white" stroke-width="2"/>
        <!-- příčka (horizontální mezi stranami, bez přesahu) -->
        <line x1="52" y1="112" x2="188" y2="112" stroke="white" stroke-width="2"/>
        <!-- texty centrované -->
        <text x="120" y="70"  fill="white" font-size="36" text-anchor="middle">W</text>
        <text x="120" y="150" fill="white" font-size="26" text-anchor="middle">F · s</text>
      </svg>`;
  }

  // -------------------- SVG DIAGRAM --------------------
  function renderDiagram() {
    const c = document.getElementById("diagram-svg-container");
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

  // -------------------- KALKULAČKA --------------------
  function renderCalculator() {
    const displayMain = document.getElementById("calculator-display");
    const historyEl   = document.getElementById("calculator-history");
    const btns        = document.getElementById("calculator-buttons");
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
      if (t==="C"){ current=""; historyEl.textContent=""; }
      else if (t==="⌫"){ current=current.slice(0,-1); }
      else if (t==="="){
        try{
          const r = eval(current);
          historyEl.textContent = `${current} =`;
          current = String(r);
        } catch {
          current = "Error";
        }
      }
      else if (t==="Copy"){
        navigator.clipboard?.writeText(displayMain.textContent);
      }
      else { current += t; }
      updateDisplay();
    });

    document.addEventListener("keydown", e=>{
      if(/[0-9\+\-\*\/\.]/.test(e.key)){ current+=e.key; updateDisplay(); }
      else if(e.key==="Enter"){
        try{
          const r=eval(current);
          historyEl.textContent=`${current} =`;
          current=String(r);
        }catch{ current="Error"; }
        updateDisplay();
      }
      else if(e.key==="Backspace"){ current=current.slice(0,-1); updateDisplay(); }
    });
  }

  // -------------------- NÁPOVĚDA (fallback, když chybí .help-content) --------------------
  function renderHelp() {
    const modal = document.getElementById("help-modal");
    if (!modal) return;
    let box = modal.querySelector(".help-content");
    if (!box) {
      box = document.createElement("div");
      box.className = "help-content";
      modal.querySelector(".bg-gray-800, .bg-gray-900, .p-6")?.appendChild(box) || modal.appendChild(box);
    }
    box.innerHTML = `
      <div class="space-y-3 text-gray-300 text-sm">
        <p>💡 <b>Tip:</b> Nejprve si napiš <b>zápis</b> – všechny známé veličiny a <b>označ hledanou</b> (otazníkem).</p>
        <p>🧭 Hodnoty zapisuj v jednotkách ze zadání. Pokud jsou v násobcích (kN, km…), systém ti <b>přidá řádek pro převod</b> na základní jednotku.</p>
        <p>✅ Do výpočtu tě aplikace pustí až ve chvíli, kdy <b>všechny veličiny</b> ze zadání budou správně zapsané (včetně převodů).</p>
      </div>`;
  }

  console.log("✅ Logika aplikace úspěšně načtena.");
});
