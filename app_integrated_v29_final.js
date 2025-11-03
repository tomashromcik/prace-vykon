/* app_integrated_v29_final.js
   --------------------------------------------------------------
   Jeden stabilní skript (nahraď všechny staré app_*.js tímto):
   - Úvodní výběr režimu/obtížnosti/tématu (vizuál zachován)
   - Generátor příkladů v29 (realistické rozsahy, max ~100000 v zákl. j.) + scéna: auto/kladka/silak/obecne
   - Zápis: živá validace, návrh převodu do základní jednotky (N, m, J)
   - Přechod do výpočtu po „Zkontrolovat zápis“
   - Výpočetní část s dvoupólovými poli (LHS = RHS) + live checking + výsledkový box
   - Reset všeho při „Nový příklad“
   - Funkční modály: Obrázek / Vzorec / Nápověda / Kalkulačka
   - Jednotky výsledku podle hledané veličiny (W/F/s), jednotkový select se vytvoří/naplní sám
   -------------------------------------------------------------- */

console.log("🧩 Načítání app_integrated_v29_final.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace…");

  // ---------- STAV ----------
  let selectedMode = null;       // 'practice' | 'test'
  let selectedLevel = null;      // 'easy' | 'normal' | 'hard'
  let selectedTopic = "prace";   // držíme "prace"
  let currentProblem = null;     // { text, givens[{symbol,value,unit}], result, askFor, scene }
  window.currentProblem = null;  // pro diagramy aj.

  // ---------- DOM ----------
  const setupScreen = $("#setup-screen");
  const practiceScreen = $("#practice-screen");
  const practiceTitle = $("#practice-title");

  const startButton = $("#start-button");
  const backButton = $("#back-button");
  const newProblemButton = $("#new-problem-button");
  const topicSelect = $("#topic-select");

  const problemTextEl = $("#problem-text");

  const zapisStep = $("#zapis-step");
  const vypocetStep = $("#vypocet-step");
  const zapisContainer = $("#zapis-container");
  const zapisFeedback = $("#zapis-feedback-container");
  const zapisReview = $("#zapis-review-container");
  const addRowBtn = $("#add-zapis-row-button");
  const checkZapisBtn = $("#check-zapis-button");

  const vypocetFeedback = $("#vypocet-feedback-container");

  // modály + nástroje
  const tools = {
    openCalc: $("#open-calculator-button"),
    openFormula: $("#open-formula-button"),
    openHelp: $("#open-help-button"),
    openDiagram: $("#open-diagram-button"),
    modalCalc: $("#calculator-modal"),
    modalFormula: $("#formula-modal"),
    modalHelp: $("#help-modal"),
    modalDiagram: $("#diagram-modal"),
    closeCalc: $("#close-calculator-button"),
    closeFormula: $("#close-formula-button"),
    closeHelp: $("#close-help-button"),
    closeDiagram: $("#close-diagram-button"),
    helpContent: $("#help-content"),
    formulaSvgContainer: $("#formula-svg-container"),
    diagramSvgContainer: $("#diagram-svg-container"),
    diagramTitle: $("#diagram-title"),
    calcDisplay: $("#calculator-display"),
    calcHistory: $("#calculator-history"),
    calcButtons: $("#calculator-buttons"),
  };

  // ---------- Pomocné ----------
  const symbolToKind = { s: "length", F: "force", W: "energy" };
  const baseUnit = { length: "m", force: "N", energy: "J" };
  const unitSets = {
    length: ["mm","cm","m","km"],
    energy: ["J","kJ","MJ"],
    force:  ["N","kN","MN"]
  };
  const unitToBaseFactor = {
    mm: 1/1000, cm: 1/100, m: 1, km: 1000,
    J: 1, kJ: 1000, MJ: 1_000_000,
    N: 1, kN: 1000, MN: 1_000_000
  };

  const parseNum = (s) => {
    if (s == null) return NaN;
    const t = String(s).replace(",", ".").trim();
    if (t === "") return NaN;
    return Number(t);
  };
  const almostEqual = (a, b, rel = 0.05) => {
    if (!isFinite(a) || !isFinite(b)) return false;
    if (b === 0) return Math.abs(a) < 1e-9;
    return Math.abs(a - b) <= Math.abs(b) * rel;
  };

  function $(s, c=document){ return c.querySelector(s); }
  function on(el, ev, fn){ el && el.addEventListener(ev, fn); }
  function toast(msg) {
    const d = document.createElement("div");
    d.className = "text-yellow-300 text-sm mt-1";
    d.textContent = msg;
    zapisFeedback.appendChild(d);
    setTimeout(()=>d.remove(), 4000);
  }
  function markOK(el){ el && el.classList.add("ring-2","ring-green-500"); el && el.classList.remove("ring-red-500"); }
  function markBAD(el){ el && el.classList.add("ring-2","ring-red-500"); el && el.classList.remove("ring-green-500"); }
  function clearMarks(el){ el && el.classList.remove("ring-2","ring-red-500","ring-green-500"); }

  // ---------- Vzhled aktivních tlačítek ----------
  function markActive(groupSelector, activeBtn) {
    document.querySelectorAll(groupSelector).forEach(b => {
      b.classList.remove("ring-2","ring-blue-500","bg-blue-600","text-white");
      b.classList.add("btn-secondary");
    });
    activeBtn.classList.add("ring-2","ring-blue-500","bg-blue-600","text-white");
  }

  document.querySelectorAll('[id^="mode-"]').forEach(btn => {
    on(btn, "click", () => {
      selectedMode = btn.id.includes("practice") ? "practice" : "test";
      markActive('[id^="mode-"]', btn);
      updateStartButtonState();
      console.log(`🎓 Režim zvolen: ${selectedMode}`);
    });
  });

  document.querySelectorAll('[id^="level-"]').forEach(btn => {
    on(btn, "click", () => {
      selectedLevel = btn.id.includes("normal") ? "normal" :
                      btn.id.includes("hard") ? "hard" : "easy";
      markActive('[id^="level-"]', btn);
      updateStartButtonState();
      console.log(`🎯 Obtížnost zvolena: ${selectedLevel}`);
    });
  });

  on(topicSelect, "change", e => {
    selectedTopic = e.target.value;
    updateStartButtonState();
  });

  function updateStartButtonState(){
    const ready = selectedMode && selectedLevel && selectedTopic;
    startButton.disabled = !ready;
    startButton.classList.toggle("btn-disabled", !ready);
    if (ready) console.log("✅ Start povolen");
  }

  // ---------- Přepínání obrazovek ----------
  function showPractice(){
    setupScreen?.classList.add("hidden");
    practiceScreen?.classList.remove("hidden");
    practiceTitle.textContent = `Téma: ${selectedTopic === "vykon" ? "Výkon" : "Práce"}`;
  }
  function showSetup(){
    practiceScreen?.classList.add("hidden");
    setupScreen?.classList.remove("hidden");
  }

  // ---------- Ovládání ----------
  on(startButton, "click", () => {
    showPractice();
    resetAll(true);
    generateProblem_v29();
    console.log("▶️ Kliknuto na Spustit");
  });

  on(backButton, "click", () => {
    showSetup();
    clearPractice();
  });

  on(newProblemButton, "click", () => {
    showPractice();
    resetAll(true);
    generateProblem_v29();
  });

  on(addRowBtn, "click", () => addZapisRow());

  // =========================================================
  //     GENERÁTOR v29 – REALISTICKÉ ROZSAHY + SCÉNY
  // =========================================================
  const workGenV29 = {
    ri(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    pickDistance(level) {
      if (level === "easy") {
        return Math.random() < 0.75 ? {v:this.ri(2,20), u:"m"} : {v:this.ri(1,5), u:"km"};
      }
      return Math.random() < 0.5 ? {v:this.ri(5,80), u:"m"} : {v:this.ri(1,30), u:"km"};
    },
    pickForce(level) {
      if (level === "easy") {
        return Math.random() < 0.75 ? {v:this.ri(50,2000), u:"N"} : {v:this.ri(1,8), u:"kN"};
      }
      return Math.random() < 0.5 ? {v:this.ri(800,12000), u:"N"} : {v:this.ri(1,30), u:"kN"};
    },
    pickWork(level) {
      if (level === "easy") {
        return Math.random() < 0.75 ? {v:this.ri(200,5000), u:"J"} : {v:this.ri(1,20), u:"kJ"};
      }
      return Math.random() < 0.5 ? {v:this.ri(2000,80000), u:"J"} : {v:this.ri(3,80), u:"kJ"};
    },
    toBase(v,u){
      if (u==="km") return v*1000;
      if (u==="kN") return v*1000;
      if (u==="kJ") return v*1000;
      return v;
    },
    fmt(val,u){ return `${val} ${u}`; },

    generate(level="normal"){
      const askIndex = this.ri(0,2);  // 0->W,1->F,2->s
      const sceneIndex = this.ri(0,3); // 0->auto,1->kladka,2->silak,3->obecne
      const askFor = ["W","F","s"][askIndex];
      const scene = ["auto","kladka","silak","obecne"][sceneIndex];

      let sPick = this.pickDistance(level);
      let fPick = this.pickForce(level);

      const sBase = this.toBase(sPick.v, sPick.u);
      const fBase = this.toBase(fPick.v, fPick.u);

      let text = "";
      let givens = [];
      let result = 0;

      const sceneTexts = {
        auto: {
          W: (F,s)=>`Tahová síla motoru auta byla ${this.fmt(F.v,F.u)} a auto jelo po dráze ${this.fmt(s.v,s.u)}. Jaká práce byla vykonána?`,
          F: (W,s)=>`Auto ujelo dráhu ${this.fmt(s.v,s.u)} a vykonaná práce byla ${this.fmt(W.v,W.u)}. Jaká byla tahová síla motoru?`,
          s: (W,F)=>`Tahová síla motoru byla ${this.fmt(F.v,F.u)} a vykonaná práce ${this.fmt(W.v,W.u)}. Jakou dráhu auto ujelo?`
        },
        kladka: {
          W: (F,s)=>`Zedník zvedl těleso pomocí pevné kladky silou ${this.fmt(F.v,F.u)} do výšky ${this.fmt(s.v,s.u)}. Jaká práce byla vykonána?`,
          F: (W,s)=>`Těleso bylo zvednuto pomocí pevné kladky do výšky ${this.fmt(s.v,s.u)}, vykonaná práce byla ${this.fmt(W.v,W.u)}. Jaká byla síla?`,
          s: (W,F)=>`Pomocí pevné kladky působil zedník silou ${this.fmt(F.v,F.u)} a vykonal práci ${this.fmt(W.v,W.u)}. Do jaké výšky zvedl těleso?`
        },
        silak: {
          W: (F,s)=>`Silák zvedl činku silou ${this.fmt(F.v,F.u)} do výšky ${this.fmt(s.v,s.u)}. Jaká práce byla vykonána?`,
          F: (W,s)=>`Silák zvedl činku do výšky ${this.fmt(s.v,s.u)} a vykonal práci ${this.fmt(W.v,W.u)}. Jak velká byla působící síla?`,
          s: (W,F)=>`Silák působil silou ${this.fmt(F.v,F.u)} a vykonal práci ${this.fmt(W.v,W.u)}. Do jaké výšky zvedl činku?`
        },
        obecne: {
          W: (F,s)=>`Těleso bylo přesunuto silou ${this.fmt(F.v,F.u)} po dráze ${this.fmt(s.v,s.u)}. Jaká práce byla vykonána?`,
          F: (W,s)=>`Těleso bylo přesunuto po dráze ${this.fmt(s.v,s.u)} a vykonaná práce byla ${this.fmt(W.v,W.u)}. Jak velká byla působící síla?`,
          s: (W,F)=>`Na těleso působila síla ${this.fmt(F.v,F.u)} a byla vykonána práce ${this.fmt(W.v,W.u)}. Jaká byla dráha?`
        }
      };

      if (askFor === "W") {
        text = sceneTexts[scene].W(fPick, sPick);
        givens = [
          {symbol:"F", value:fBase, unit:"N"},
          {symbol:"s", value:sBase, unit:"m"}
        ];
        result = fBase * sBase; // J
      } else if (askFor === "F") {
        const wPick = this.pickWork(level);
        const wBase = this.toBase(wPick.v, wPick.u);
        text = sceneTexts[scene].F(wPick, sPick);
        givens = [
          {symbol:"W", value:wBase, unit:"J"},
          {symbol:"s", value:sBase, unit:"m"}
        ];
        result = wBase / sBase; // N
      } else {
        const wPick = this.pickWork(level);
        const wBase = this.toBase(wPick.v, wPick.u);
        text = sceneTexts[scene].s(wPick, fPick);
        givens = [
          {symbol:"W", value:wBase, unit:"J"},
          {symbol:"F", value:fBase, unit:"N"}
        ];
        result = wBase / fBase; // m
      }

      // držet v rozumných mezích (max ~100000 v zákl. jednotkách)
      result = Math.min(result, 100000);

      return { text, givens, result, askFor, scene };
    }
  };

  // ---------- Jednotkový select (odolné vytvoření) ----------
  function getOrCreateUnitSelect() {
    let sel = $("#unit-select");
    if (sel) return sel;
    const resultRow = $("#calc-row-result");
    if (!resultRow) return null;
    sel = document.createElement("select");
    sel.id = "unit-select";
    sel.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white";
    resultRow.appendChild(sel);
    return sel;
  }
  function prepareUnitOptionsForAsk(askFor) {
    const sel = getOrCreateUnitSelect();
    if (!sel) return;
    sel.innerHTML = "";
    let units = ["J","kJ","MJ"];
    if (askFor === "F") units = ["N","kN","MN"];
    if (askFor === "s") units = ["m","km"];
    units.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u; opt.textContent = u;
      sel.appendChild(opt);
    });
  }

  // =========================================================
  //                 ZÁPIS – UI + LIVE VALIDACE
  // =========================================================
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

  function rowLiveValidate(row) {
    row.classList.remove("ring-2","ring-red-500","ring-green-500");

    if (!currentProblem) {
      toast("⚠️ Nejprve spusťte příklad.");
      return;
    }
    const symbol  = row.querySelector(".zapis-symbol").value;
    const unit    = row.querySelector(".zapis-unit").value;
    const unknown = row.querySelector(".zapis-unknown").checked;
    const rawStr  = row.querySelector(".zapis-value").value.trim();

    if (symbol === "-" || unit === "-" || (!unknown && rawStr === "")) return;
    const kind = symbolToKind[symbol];
    if (!kind) return;

    if (!unitSets[kind].includes(unit)) {
      row.classList.add("ring-2","ring-red-500");
      toast(`❌ ${symbol} neodpovídá jednotce ${unit}.`);
      return;
    }

    const given = currentProblem?.givens?.find(g => g.symbol === symbol);

    if (unknown) {
      row.classList.add("ring-2","ring-green-500");
      return;
    }

    if (!given) {
      row.classList.add("ring-2","ring-green-500");
      return;
    }

    const val = parseNum(rawStr);
    if (!isFinite(val)) {
      row.classList.add("ring-2","ring-red-500");
      toast("❌ Hodnota musí být číslo.");
      return;
    }
    const factor = unitToBaseFactor[unit] ?? NaN;
    const inBase = val * factor;
    if (!isFinite(inBase)) {
      row.classList.add("ring-2","ring-red-500");
      toast(`❌ Neznámý převod pro jednotku ${unit}.`);
      return;
    }
    if (almostEqual(inBase, given.value)) {
      row.classList.add("ring-2","ring-green-500");
    } else {
      row.classList.add("ring-2","ring-red-500");
      toast(`❌ ${symbol}: očekává se ≈ ${given.value} ${given.unit}, máš ${val} ${unit} (≈ ${inBase} ${given.unit}).`);
    }

    const baseU = baseUnit[symbolToKind[symbol]];
    if (unit !== baseU) maybeAddBaseConversionRow(symbol, baseU);
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

  // ---------- Kontrola zápisu → přechod do výpočtu ----------
  on(checkZapisBtn, "click", () => {
    if (!currentProblem) {
      toast("⚠️ Nejprve spusťte příklad.");
      return;
    }
    const rows = collectRows();
    const unknownRows = rows.filter(r => r.unknown && r.symbol !== "-");
    if (unknownRows.length !== 1) {
      toast("⚠️ Označte právě jednu hledanou veličinu.");
      return;
    }
    const unknownSym = unknownRows[0].symbol;
    if (unknownSym !== currentProblem.askFor) {
      toast(`⚠️ Hledaná veličina má být ${currentProblem.askFor}.`);
      return;
    }

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

    if (errs.length) {
      zapisFeedback.innerHTML = `<div class="feedback-wrong"><b>Chyby:</b><ul class="list-disc pl-5 mt-1">${errs.map(e=>`<li>${e}</li>`).join("")}</ul></div>`;
      return;
    }

    const summary = mergedSummary(rows);
    zapisReview.innerHTML = `
      <div class="p-3 bg-gray-900 border border-gray-700 rounded">
        <div class="font-semibold mb-2 text-gray-300">Souhrn zápisu:</div>
        <pre class="text-gray-200 text-sm whitespace-pre-wrap">${summary}</pre>
      </div>`;

    // přepnout do výpočtu
    zapisStep.classList.add("hidden");
    buildCalcBox();            // vytvoř dvoupólový box (a schovej starý)
    resetCalcInputs();
    prepareUnitOptionsForAsk(currentProblem.askFor);
    vypocetStep.classList.remove("hidden");
  });

  // =========================================================
  //         VÝPOČET – DVOUPÓLOVÉ ŘÁDKY + LIVE CHECK
  // =========================================================
  function buildCalcBox(){
    // 1) Schovej staré řádky, pokud v HTML existují
    document.querySelectorAll("#vypocet-step > .calc-row, #vypocet-step > #unit-select, #vypocet-step > button#check-calculation-button")
      .forEach(n => n.classList.add("hidden"));

    // 2) Pokud už náš box existuje, nepřidávej
    if ($("#calc-box")) return;

    const box = document.createElement("div");
    box.id = "calc-box";
    box.className = "space-y-2 mb-2";

    // řádek 1: vzorec
    box.appendChild(buildCalcRow("formula", "např. W", "např. F * s"));
    // řádek 2: dosazení
    box.appendChild(buildCalcRow("subs", "např. W", "např. 1000 * 2"));
    // řádek 3: výsledek
    const rrow = buildCalcRow("result", "např. W", "např. 2000");
    const unitSlot = document.createElement("select");
    unitSlot.id = "unit-select";
    unitSlot.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white";
    rrow.appendChild(unitSlot);
    box.appendChild(rrow);

    // výsledkový box
    const resultBox = document.createElement("div");
    resultBox.id = "calc-result-box";
    resultBox.className = "p-3 bg-gray-900 border border-gray-700 rounded space-y-2";
    resultBox.innerHTML = `<div class="font-semibold text-gray-300">Výsledky & tipy</div>
                           <div id="calc-result-messages" class="text-sm text-gray-200 space-y-1"></div>`;
    box.appendChild(resultBox);

    // tlačítko ověření
    const btn = document.createElement("button");
    btn.id = "check-calculation-button";
    btn.className = "btn btn-primary w-full mt-2";
    btn.textContent = "Ověřit výpočet";
    box.appendChild(btn);

    // vložit na konec vypocet-step (za #zapis-review-container)
    vypocetStep.appendChild(box);

    on($("#formula-lhs"), "input", liveFormula);
    on($("#formula-rhs"), "input", liveFormula);
    on($("#subs-lhs"), "input", liveSubs);
    on($("#subs-rhs"), "input", liveSubs);
    on($("#result-lhs"), "input", liveRes);
    on($("#result-rhs"), "input", liveRes);
    on(btn, "click", finalCheck);
  }

  function buildCalcRow(key, lhsPH, rhsPH){
    const row = document.createElement("div");
    row.className = "calc-row grid grid-cols-[6rem_2rem_1fr] sm:grid-cols-[6rem_2rem_1fr] items-center gap-2";
    row.id = `calc-row-${key}`;

    const lhs = document.createElement("input");
    lhs.type = "text"; lhs.maxLength = 2;
    lhs.id = `${key}-lhs`;
    lhs.placeholder = lhsPH;
    lhs.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white w-24";

    const eq = document.createElement("div");
    eq.textContent = "=";
    eq.className = "eq-sign text-center text-gray-300";

    const rhs = document.createElement("input");
    rhs.type = "text";
    rhs.id = `${key}-rhs`;
    rhs.placeholder = rhsPH;
    rhs.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white";

    row.append(lhs, eq, rhs);
    return row;
  }

  function resetCalcInputs(){
    ["formula-lhs","formula-rhs","subs-lhs","subs-rhs","result-lhs","result-rhs"].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = "";
      clearMarks(el);
    });
    const msgs = $("#calc-result-messages");
    if (msgs) msgs.innerHTML = "";
  }

  function liveFormula(){
    const L = ($("#formula-lhs")?.value || "").trim();
    const R = ($("#formula-rhs")?.value || "").trim();
    const lhsOK = /^[WwFfSs]$/.test(L);
    const unknown = getUnknownSymbolFromZapis() || currentProblem?.askFor || "W";
    let rhsOK = false;
    const rNoSpace = R.replace(/\s+/g,"");

    if (unknown === "W") rhsOK = /^F[*·]s$|^s[*·]F$/i.test(rNoSpace);
    else if (unknown === "F") rhsOK = /^W\/s$/i.test(rNoSpace);
    else if (unknown === "s") rhsOK = /^W\/F$/i.test(rNoSpace);

    (lhsOK ? markOK : markBAD)($("#formula-lhs"));
    (rhsOK ? markOK : markBAD)($("#formula-rhs"));
  }

  function liveSubs(){
    const L = ($("#subs-lhs")?.value || "").trim();
    const R = ($("#subs-rhs")?.value || "").trim();
    const lhsOK = /^[WwFfSs]$/.test(L);
    let rhsOK = false;

    const Fg = currentProblem?.givens.find(g=>g.symbol==="F");
    const sg = currentProblem?.givens.find(g=>g.symbol==="s");
    const Wv = currentProblem?.result;

    const unknown = getUnknownSymbolFromZapis() || currentProblem?.askFor || "W";
    const txt = R.replace(/\s+/g,"");

    const num = (s)=>parseNum(s);
    const pairOK = (a,b,x,y)=> (almostEqual(a,x)&&almostEqual(b,y))||(almostEqual(a,y)&&almostEqual(b,x));

    if (unknown === "W" && Fg && sg) {
      const m = txt.match(/^(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/);
      if (m) {
        const a = num(m[1]), b = num(m[2]);
        rhsOK = isFinite(a)&&isFinite(b) && pairOK(a,b,Fg.value,sg.value);
      }
    } else if (unknown === "F" && sg && isFinite(Wv)) {
      const m = txt.match(/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
      if (m) {
        rhsOK = almostEqual(num(m[1]), Wv) && almostEqual(num(m[2]), sg.value);
      }
    } else if (unknown === "s" && Fg && isFinite(Wv)) {
      const m = txt.match(/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
      if (m) {
        rhsOK = almostEqual(num(m[1]), Wv) && almostEqual(num(m[2]), Fg.value);
      }
    }

    (lhsOK ? markOK : markBAD)($("#subs-lhs"));
    (rhsOK ? markOK : markBAD)($("#subs-rhs"));
  }

  function liveRes(){
    const L = ($("#result-lhs")?.value || "").trim();
    const R = ($("#result-rhs")?.value || "").trim();
    const lhsOK = /^[WwFfSs]$/.test(L);
    let rhsOK = false;

    const val = parseNum(R);
    if (isFinite(val)) {
      const unknown = getUnknownSymbolFromZapis() || currentProblem?.askFor || "W";
      if (unknown === "W") {
        const unitSel = $("#unit-select");
        const unit = unitSel?.value || "J";
        const factor = unitToBaseFactor[unit] ?? 1;
        const inBase = val * factor;
        rhsOK = almostEqual(inBase, currentProblem.result);
      } else {
        rhsOK = almostEqual(val, currentProblem.result);
      }
    }

    (lhsOK ? markOK : markBAD)($("#result-lhs"));
    (rhsOK ? markOK : markBAD)($("#result-rhs"));
  }

  function finalCheck(){
    const msgs = $("#calc-result-messages");
    if (msgs) msgs.innerHTML = "";

    const fL = ($("#formula-lhs")?.value||"").trim();
    const fR = ($("#formula-rhs")?.value||"").trim();
    const sL = ($("#subs-lhs")?.value||"").trim();
    const sR = ($("#subs-rhs")?.value||"").trim();
    const rL = ($("#result-lhs")?.value||"").trim();
    const rR = ($("#result-rhs")?.value||"").trim();

    const unknown = getUnknownSymbolFromZapis() || currentProblem?.askFor || "W";

    let formulaOK=false, subsOK=false, resOK=false;

    // vzorec
    const rNo = fR.replace(/\s+/g,"");
    if (unknown==="W") formulaOK = /^F[*·]s$|^s[*·]F$/i.test(rNo) && /^[Ww]$/.test(fL);
    if (unknown==="F") formulaOK = /^W\/s$/i.test(rNo) && /^[Ff]$/.test(fL);
    if (unknown==="s") formulaOK = /^W\/F$/i.test(rNo) && /^[sS]$/.test(fL);

    // dosazení
    (function(){
      const txt = sR.replace(/\s+/g,"");
      const Fg = currentProblem?.givens.find(g=>g.symbol==="F");
      const sg = currentProblem?.givens.find(g=>g.symbol==="s");
      const Wv = currentProblem?.result;
      const num = (x)=>parseNum(x);
      const pairOK = (a,b,x,y)=> (almostEqual(a,x)&&almostEqual(b,y))||(almostEqual(a,y)&&almostEqual(b,x));

      if (unknown==="W" && Fg && sg) {
        const m=txt.match(/^(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/);
        if (m) subsOK = pairOK(num(m[1]),num(m[2]),Fg.value,sg.value) && /^[Ww]$/.test(sL);
      } else if (unknown==="F" && sg && isFinite(Wv)) {
        const m=txt.match(/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
        if (m) subsOK = almostEqual(num(m[1]),Wv)&&almostEqual(num(m[2]),sg.value) && /^[Ff]$/.test(sL);
      } else if (unknown==="s" && Fg && isFinite(Wv)) {
        const m=txt.match(/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
        if (m) subsOK = almostEqual(num(m[1]),Wv)&&almostEqual(num(m[2]),Fg.value) && /^[sS]$/.test(sL);
      }
    })();

    // výsledek
    const val = parseNum(rR);
    if (isFinite(val)) {
      if (unknown==="W") {
        const unitSel = $("#unit-select");
        const unit = unitSel?.value || "J";
        const factor = unitToBaseFactor[unit] ?? 1;
        resOK = almostEqual(val*factor, currentProblem.result) && /^[Ww]$/.test(rL);
      } else if (unknown==="F") {
        resOK = /^[Ff]$/.test(rL) && almostEqual(val, currentProblem.result);
      } else {
        resOK = /^[sS]$/.test(rL) && almostEqual(val, currentProblem.result);
      }
    }

    // výstup
    const lines = [];
    lines.push(formulaOK ? "✅ Vzorec v pořádku." : "❌ Uprav vzorec (W=F*s | F=W/s | s=W/F).");
    lines.push(subsOK   ? "✅ Správné dosazení." : "❌ Dosazení neodpovídá zadaným hodnotám.");
    lines.push(resOK    ? "✅ Výsledek je správně." : "❌ Výsledek neodpovídá (zkontroluj číslo a jednotku).");

    msgs && lines.forEach(t=>{ const p=document.createElement("div"); p.textContent=t; msgs.appendChild(p); });
  }

  // ---------------------------------------------------------
  // Pomocné pro výpočet – hledaná veličina ze zápisu
  // ---------------------------------------------------------
  function getUnknownSymbolFromZapis() {
    const r = [...document.querySelectorAll(".zapis-row")].find(x => x.querySelector(".zapis-unknown")?.checked);
    const sym = r?.querySelector(".zapis-symbol")?.value;
    return (sym && sym !== "-") ? sym : (currentProblem?.askFor || "W");
  }

  // =========================================================
  //                     MODÁLY A OBSAH
  // =========================================================
  function toggleModal(id, show) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.toggle("hidden", !show);
  }

  on(tools.openCalc,    "click", () => { renderCalculator(); toggleModal("calculator-modal", true); });
  on(tools.openFormula, "click", () => { renderFormulaTriangle(); toggleModal("formula-modal", true); });
  on(tools.openHelp,    "click", () => { renderHelp(); toggleModal("help-modal", true); });
  on(tools.openDiagram, "click", () => { renderDiagram(); toggleModal("diagram-modal", true); });

  on(tools.closeCalc,    "click", () => toggleModal("calculator-modal", false));
  on(tools.closeFormula, "click", () => toggleModal("formula-modal", false));
  on(tools.closeHelp,    "click", () => toggleModal("help-modal", false));
  on(tools.closeDiagram, "click", () => toggleModal("diagram-modal", false));

  ["calculator-modal","formula-modal","help-modal","diagram-modal"].forEach(id => {
    const m = document.getElementById(id);
    m?.addEventListener("click", (e) => { if (e.target === m) toggleModal(id, false); });
  });

  // --- Vzorec (SVG) ---
  function renderFormulaTriangle() {
    const c = tools.formulaSvgContainer;
    if (!c) return;
    const ask = currentProblem?.askFor || "W";
    let top="W", bottom="F · s";
    if (ask==="F"){ top="F"; bottom="W / s"; }
    if (ask==="s"){ top="s"; bottom="W / F"; }
    c.innerHTML = `
      <svg width="260" height="190" viewBox="0 0 260 190">
        <polygon points="130,15 30,175 230,175" fill="none" stroke="white" stroke-width="2"/>
        <line x1="52" y1="120" x2="208" y2="120" stroke="white" stroke-width="2"/>
        <text x="130" y="75"  fill="white" font-size="36" text-anchor="middle">${top}</text>
        <text x="130" y="155" fill="white" font-size="24" text-anchor="middle">${bottom}</text>
      </svg>`;
  }

  // --- Nápověda ---
  function renderHelp() {
    if (!tools.helpContent) return;
    const ask = currentProblem?.askFor || "W";
    const formula =
      ask === "W" ? "W = F · s" :
      ask === "F" ? "F = W / s" :
                    "s = W / F";
    tools.helpContent.innerHTML = `
      <div class="space-y-3 text-gray-300 text-sm text-left">
        <p>💡 <b>Nejprve zapiš známé veličiny</b> přesně podle zadání a <b>označ hledanou</b>.</p>
        <p>🔁 Pokud je hodnota v kN / km / kJ, <b>přidej převod</b> do základní jednotky (N, m, J).</p>
        <p>📐 Pro výpočet použij vzorec: <b>${formula}</b>.</p>
        <p>✅ Do dalšího kroku se dostaneš, až budou <b>všechny zadané veličiny správně</b>.</p>
      </div>`;
  }

  // --- Obrázek (SVG scény) ---
  function renderDiagram() {
    const c = tools.diagramSvgContainer;
    if (!c) return;
    if (!currentProblem) {
      c.innerHTML = `<p class="text-gray-400 text-sm">Nejdříve spusťte příklad.</p>`;
      return;
    }
    const F = currentProblem.givens.find(g => g.symbol === "F") || {};
    const s = currentProblem.givens.find(g => g.symbol === "s") || {};
    const scene = currentProblem.scene || guessSceneFromText(currentProblem.text);
    tools.diagramTitle && (tools.diagramTitle.textContent = "Obrázek – znázornění situace");

    if (scene === "auto")      c.innerHTML = autoSVG(F, s);
    else if (scene === "kladka") c.innerHTML = kladkaSVG(F, s);
    else if (scene === "silak")  c.innerHTML = silakSVG(F, s);
    else                          c.innerHTML = obecneSVG(F, s);
  }

  function guessSceneFromText(t="") {
    const low = t.toLowerCase();
    if (low.includes("motor") || low.includes("auto")) return "auto";
    if (low.includes("kladk")) return "kladka";
    if (low.includes("silák") || low.includes("silak") || low.includes("činku") || low.includes("cinku")) return "silak";
    return "obecne";
  }

  function autoSVG(F, s) {
    return `
      <svg width="360" height="200" viewBox="0 0 360 200">
        <defs>
          <marker id="ah1" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="red"/>
          </marker>
          <marker id="ah2" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="orange"/>
          </marker>
        </defs>
        <rect x="20" y="170" width="320" height="6" fill="#777"/>
        <rect x="80" y="125" width="80" height="35" fill="#00AEEF" stroke="white" stroke-width="2"/>
        <circle cx="100" cy="170" r="8" fill="#333"/>
        <circle cx="150" cy="170" r="8" fill="#333"/>
        <line x1="170" y1="140" x2="260" y2="140" stroke="red" stroke-width="3" marker-end="url(#ah1)"/>
        <text x="215" y="128" fill="red" font-size="14" text-anchor="middle">F = ${F.value ?? "?"} ${F.unit ?? ""}</text>
        <line x1="80" y1="185" x2="260" y2="185" stroke="orange" stroke-width="2" marker-end="url(#ah2)"/>
        <text x="170" y="198" fill="orange" font-size="12" text-anchor="middle">s = ${s.value ?? "?"} ${s.unit ?? ""}</text>
      </svg>`;
  }

  function kladkaSVG(F, s) {
    return `
      <svg width="360" height="220" viewBox="0 0 360 220">
        <circle cx="180" cy="70" r="22" fill="#888" stroke="#fff" stroke-width="2"/>
        <rect x="172" y="10" width="16" height="20" fill="#aaa"/>
        <line x1="180" y1="92" x2="180" y2="160" stroke="#ddd" stroke-width="3"/>
        <rect x="165" y="160" width="30" height="28" fill="#4b5563"/>
        <text x="220" y="70" fill="red" font-size="14">F = ${F.value ?? "?"} ${F.unit ?? ""}</text>
        <text x="220" y="95" fill="orange" font-size="14">s = ${s.value ?? "?"} ${s.unit ?? ""}</text>
        <rect x="20" y="188" width="320" height="6" fill="#777"/>
      </svg>`;
  }

  function silakSVG(F, s) {
    return `
      <svg width="360" height="220" viewBox="0 0 360 220">
        <rect x="170" y="90" width="20" height="50" fill="#a78bfa"/>
        <rect x="150" y="140" width="60" height="60" fill="#6366f1"/>
        <line x1="140" y1="90" x2="220" y2="90" stroke="#ddd" stroke-width="6"/>
        <circle cx="135" cy="90" r="10" fill="#999"/>
        <circle cx="225" cy="90" r="10" fill="#999"/>
        <text x="260" y="80" fill="red" font-size="14">F = ${F.value ?? "?"} ${F.unit ?? ""}</text>
        <text x="260" y="100" fill="orange" font-size="14">s = ${s.value ?? "?"} ${s.unit ?? ""}</text>
        <rect x="20" y="200" width="320" height="6" fill="#777"/>
      </svg>`;
  }

  function obecneSVG(F, s) {
    return `
      <svg width="360" height="200" viewBox="0 0 360 200">
        <defs>
          <marker id="ag1" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="red"/>
          </marker>
          <marker id="ag2" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="orange"/>
          </marker>
        </defs>
        <rect x="20" y="170" width="320" height="6" fill="#777"/>
        <rect x="80" y="125" width="80" height="35" fill="#6b7280" stroke="white" stroke-width="2"/>
        <line x1="170" y1="140" x2="260" y2="140" stroke="red" stroke-width="3" marker-end="url(#ag1)"/>
        <text x="215" y="128" fill="red" font-size="14" text-anchor="middle">F = ${F.value ?? "?"} ${F.unit ?? ""}</text>
        <line x1="80" y1="185" x2="260" y2="185" stroke="orange" stroke-width="2" marker-end="url(#ag2)"/>
        <text x="170" y="198" fill="orange" font-size="12" text-anchor="middle">s = ${s.value ?? "?"} ${s.unit ?? ""}</text>
      </svg>`;
  }

  // --- Kalkulačka ---
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

    btns.onclick = (e) => {
      const t = e.target.textContent;
      if (t==="C"){ current=""; history.textContent=""; }
      else if (t==="⌫"){ current = current.slice(0,-1); }
      else if (t==="="){
        try {
          // bezpečné vyhodnocení jen základních operací
          if (/^[0-9+\-*/.()\s]+$/.test(current)) {
            const r = Function(`"use strict";return (${current})`)();
            history.textContent = `${current} =`;
            current = String(r);
          } else {
            current = "Error";
          }
        } catch { current = "Error"; }
      } else if (t==="Copy"){
        navigator.clipboard?.writeText(display.textContent);
      } else {
        current += t;
      }
      update();
    };

    document.addEventListener("keydown", e => {
      if (!tools.modalCalc || tools.modalCalc.classList.contains("hidden")) return;
      if (/[0-9+\-*/.()]/.test(e.key)) { current += e.key; update(); }
      else if (e.key === "Enter") {
        try {
          if (/^[0-9+\-*/.()\s]+$/.test(current)) {
            const r = Function(`"use strict";return (${current})`)();
            history.textContent = `${current} =`;
            current = String(r);
          } else {
            current = "Error";
          }
        } catch { current = "Error"; }
        update();
      } else if (e.key === "Backspace") {
        current = current.slice(0,-1); update();
      }
    });
  }

  // =========================================================
  //                   RESET A GENEROVÁNÍ
  // =========================================================
  function resetAll(addFirstRow = false) {
    zapisStep.classList.remove("hidden");
    vypocetStep.classList.add("hidden");
    zapisContainer.innerHTML = "";
    zapisFeedback.innerHTML = "";
    zapisReview.innerHTML = "";
    vypocetFeedback.innerHTML = "";
    // schovej staré ruční řádky (pokud v HTML existují)
    document.querySelectorAll("#vypocet-step > .calc-row, #vypocet-step > #unit-select, #vypocet-step > button#check-calculation-button")
      .forEach(n => n.classList.add("hidden"));
    // zrušit náš box
    $("#calc-box")?.remove();
    if (addFirstRow) addZapisRow();
  }

  function clearPractice() {
    resetAll(false);
    currentProblem = null;
    window.currentProblem = null;
    problemTextEl.textContent = "";
  }

  function generateProblem_v29() {
    const level = selectedLevel || "normal";
    currentProblem = workGenV29.generate(level);
    window.currentProblem = currentProblem;
    problemTextEl.textContent = currentProblem.text;
    console.log("🆕 Nový příklad (v29):", currentProblem);
  }

});
