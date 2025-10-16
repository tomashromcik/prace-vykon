// ====================================================================
//  app.js — Fyzika: Práce a výkon (řádky + checkbox + kontrola zápisu)
// ====================================================================

console.log("Načítání app.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");

  // --- HLAVNÍ ELEMENTY ---
  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");
  const startButton = document.getElementById("start-button");
  const topicSelect = document.getElementById("topic-select");
  const startTutorialButton = document.getElementById("start-tutorial-button");

  // --- STAVY ---
  let selectedMode = null;
  let selectedLevel = null;
  let selectedTopic = "prace";
  let currentProblem = null;

  // --- REŽIM A OBTÍŽNOST ---
  const modeButtons = document.querySelectorAll('[id^="mode-"]');
  const levelButtons = document.querySelectorAll('[id^="level-"]');

  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      console.log(`🎓 Režim zvolen: ${btn.id}`);
      modeButtons.forEach(b => b.classList.remove("ring-2", "ring-blue-500"));
      btn.classList.add("ring-2", "ring-blue-500");
      selectedMode = btn.id.includes("practice") ? "practice" : "test";
      updateStartButtonState();
    });
  });

  levelButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      console.log(`🎯 Obtížnost zvolena: ${btn.id}`);
      levelButtons.forEach(b => b.classList.remove("ring-2", "ring-blue-500"));
      btn.classList.add("ring-2", "ring-blue-500");
      if (btn.id.includes("easy")) selectedLevel = "easy";
      if (btn.id.includes("normal")) selectedLevel = "normal";
      if (btn.id.includes("hard")) selectedLevel = "hard";
      updateStartButtonState();
    });
  });

  topicSelect?.addEventListener("change", e => {
    selectedTopic = e.target.value;
    console.log("📘 Téma:", selectedTopic);
    updateStartButtonState();
  });

  function updateStartButtonState() {
    const ok = selectedMode && selectedLevel && selectedTopic;
    startButton.disabled = !ok;
    startButton.classList.toggle("btn-disabled", !ok);
    if (ok) console.log("✅ Start povolen");
  }

  // --- START ---
  startButton?.addEventListener("click", () => {
    console.log("▶️ Kliknuto na Spustit");
    setupScreen?.classList.add("hidden");
    practiceScreen?.classList.remove("hidden");
    clearZapis();
    generateNewProblem();
    attachPracticeListeners();
  });

  // ====================================================================
  //  INTERAKCE V REŽIMU PŘÍKLADŮ (delegace událostí)
  // ====================================================================
  function attachPracticeListeners() {
    console.log("🧩 Aktivace tlačítek v režimu příkladů...");
    const container = document.getElementById("practice-screen");
    if (!container) return;

    container.addEventListener("click", (e) => {
      const target = e.target.closest("button");
      if (!target) return;
      const id = target.id || "(bez ID)";
      console.log(`🟢 Klik: ${id}`);

      switch (id) {
        // =========== ZÁPIS ===========
        case "add-zapis-row-button": {
          const box = makeZapisRow();
          document.getElementById("zapis-container")?.appendChild(box);
          console.log("✅ Nový řádek zápisu přidán");
          break;
        }

        case "check-zapis-button": {
          console.log("🧪 Kontrola zápisu");
          const { errors, warnings, summaryText } = validateZapis();
          // souhrn zobraz v Zápisu (vždy)
          renderSummaryInZapis(summaryText);
          renderZapisIssues(errors, warnings);

          if (errors.length === 0) {
            console.log("✅ Zápis v pořádku — přechod na výpočet");
            // navíc zkopíruj souhrn i do recenzního boxu u Výpočtu
            renderSummaryInReview(summaryText);
            document.getElementById("zapis-step")?.classList.add("hidden");
            document.getElementById("vypocet-step")?.classList.remove("hidden");
          } else {
            console.log("❌ Zápis obsahuje chyby — zůstávám v kroku Zápis");
          }
          break;
        }

        // ========== VÝPOČET (zatím placeholder) ==========
        case "check-calculation-button":
        case "check-work-calculation-button":
        case "check-mass-calculation-button":
        case "check-force-calculation-button":
          showMainFeedback("Zatím testovací ověření výpočtu.", true);
          break;

        // ========== MODÁLY ==========
        case "open-calculator-button": toggleModal("calculator-modal", true); break;
        case "open-formula-button":    toggleModal("formula-modal", true);    break;
        case "open-diagram-button":    toggleModal("diagram-modal", true);    break;
        case "close-calculator-button":
        case "close-formula-button":
        case "close-diagram-button":
          toggleModal(target.closest(".fixed")?.id, false);
          break;

        // ========== DALŠÍ / NOVÝ ==========
        case "new-problem-button":
          clearZapis();
          generateNewProblem();
          break;

        default: break;
      }
    });
  }

  // vytvoří DOM uzel jednoho řádku zápisu (select veličina, hodnota, jednotka, checkbox)
  function makeZapisRow() {
    // sady podle obtížnosti
    const symEasy = ["-", "F", "s", "W"];
    const unitEasy = ["-", "cm", "m", "km", "J", "kJ", "MJ", "N", "kN", "MN"];
    let symbols = symEasy, units = unitEasy;
    if (selectedLevel === "hard") {
      symbols = ["-", "F", "s", "W", "P", "t", "m"];
      units = ["-", "mm", "cm", "m", "km", "J", "kJ", "MJ", "N", "kN", "MN", "W", "kW", "MW", "g", "kg", "t", "s", "min", "h"];
    }

    const row = document.createElement("div");
    row.className = "grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";

    row.innerHTML = `
      <select class="zapis-symbol p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500">
        ${symbols.map(v => `<option value="${v}">${v}</option>`).join("")}
      </select>
      <input type="text" placeholder="Hodnota" class="zapis-value p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500">
      <select class="zapis-unit p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500">
        ${units.map(u => `<option value="${u}">${u}</option>`).join("")}
      </select>
      <label class="flex items-center gap-2 text-sm text-gray-300">
        <input type="checkbox" class="zapis-unknown h-4 w-4">
        <span>Hledaná veličina</span>
      </label>
      <div class="col-span-1 sm:col-span-4 text-xs text-blue-300 italic hidden row-hint"></div>
    `;

    // logika checkboxu
    const val = row.querySelector(".zapis-value");
    const cb  = row.querySelector(".zapis-unknown");
    cb.addEventListener("change", () => {
      if (cb.checked) {
        val.value = "?";
        val.setAttribute("disabled", "disabled");
      } else {
        if (val.value === "?") val.value = "";
        val.removeAttribute("disabled");
      }
    });

    return row;
    }

  // ====================================================================
  //  POMOCNÉ FUNKCE (UI)
  // ====================================================================
  function toggleModal(id, show) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.toggle("hidden", !show);
  }

  function showMainFeedback(msg, isCorrect) {
    const box = document.getElementById("vypocet-feedback-container");
    if (!box) return;
    box.innerHTML = `<div class="${isCorrect ? "feedback-correct" : "feedback-wrong"} mt-2">${msg}</div>`;
  }

  function renderSummaryInZapis(text) {
    // ukázat souhrn v kroku Zápis (aby ho žák viděl hned)
    const fb = document.getElementById("zapis-feedback-container");
    if (!fb) return;
    fb.innerHTML = `
      <div class="p-3 rounded-lg bg-gray-900 border border-gray-700 mb-3">
        <div class="text-sm text-gray-300 font-semibold mb-2">Souhrn zápisu:</div>
        <pre class="text-gray-200 text-sm whitespace-pre-wrap">${text}</pre>
      </div>
    `;
  }

  function renderSummaryInReview(text) {
    // kopie souhrnu do boxu nad výpočtem
    const rev = document.getElementById("zapis-review-container");
    if (!rev) return;
    rev.innerHTML = `
      <div class="p-3 rounded-lg bg-gray-900 border border-gray-700">
        <div class="text-sm text-gray-300 font-semibold mb-2">Souhrn zápisu:</div>
        <pre class="text-gray-200 text-sm whitespace-pre-wrap">${text}</pre>
      </div>
    `;
  }

  function renderZapisIssues(errors, warnings) {
    const fb = document.getElementById("zapis-feedback-container");
    if (!fb) return;
    const parts = [];
    if (errors.length) {
      parts.push(`
        <div class="feedback-wrong mb-2">
          <div class="font-semibold mb-1">Chyby v zápisu:</div>
          <ul class="list-disc pl-5">${errors.map(e => `<li>${e}</li>`).join("")}</ul>
        </div>
      `);
    }
    if (warnings.length) {
      parts.push(`
        <div class="feedback-correct">
          <div class="font-semibold mb-1">Doporučení:</div>
          <ul class="list-disc pl-5">${warnings.map(w => `<li>${w}</li>`).join("")}</ul>
        </div>
      `);
    }
    fb.insertAdjacentHTML("beforeend", parts.join("\n"));
    fb.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function clearZapis() {
    const z = document.getElementById("zapis-container");
    const fb = document.getElementById("zapis-feedback-container");
    const rev = document.getElementById("zapis-review-container");
    if (z) z.innerHTML = "";
    if (fb) fb.innerHTML = "";
    if (rev) rev.innerHTML = "";
  }

  // ====================================================================
  //  GENERÁTOR PŘÍKLADŮ + „givens“ (hodnoty ze zadání)
  // ====================================================================
  const problemText = document.getElementById("problem-text");
  const unitSelect = document.getElementById("unit-select");
  const feedbackContainer = document.getElementById("vypocet-feedback-container");

  const topics = {
    prace: {
      units: ["J", "kJ"],
      examples: [
        {
          text: "Auto působí silou 2 000 N na vzdálenost 5 m. Jakou práci vykoná?",
          result: 2000 * 5,
          givens: [
            { symbol: "F", value: 2000, unit: "N" },
            { symbol: "s", value: 5, unit: "m" },
          ],
        },
        {
          text: "Dělník zvedl břemeno o hmotnosti 50 kg do výšky 2 m. Vypočítej práci.",
          result: 50 * 10 * 2,
          givens: [
            { symbol: "s", value: 2, unit: "m" },
            // síla se zde odvozuje (m*g), pro zápis necháme na žákovi
          ],
        },
      ],
    },
    vykon: {
      units: ["W", "kW"],
      examples: [
        {
          text: "Motor vykonal práci 12 000 J za 4 s. Jaký byl výkon?",
          result: 12000 / 4,
          givens: [
            { symbol: "W", value: 12000, unit: "J" },
            { symbol: "t", value: 4, unit: "s" },
          ],
        },
        {
          text: "Čerpadlo vykonává práci 24 kJ za 8 s. Jaký je výkon?",
          result: 24000 / 8,
          givens: [
            { symbol: "W", value: 24000, unit: "J" }, // 24 kJ převedeno
            { symbol: "t", value: 8, unit: "s" },
          ],
        },
      ],
    },
  };

  function generateNewProblem() {
    const data = topics[selectedTopic];
    const example = data.examples[Math.floor(Math.random() * data.examples.length)];
    currentProblem = example;
    problemText.textContent = example.text;

    unitSelect.innerHTML = "";
    data.units.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u;
      opt.textContent = u;
      unitSelect.appendChild(opt);
    });

    feedbackContainer.innerHTML = "";
    const ua = document.getElementById("user-answer");
    const fi = document.getElementById("formula-input");
    const si = document.getElementById("substitution-input");
    if (ua) ua.value = "";
    if (fi) fi.value = "";
    if (si) si.value = "";
  }

  // ====================================================================
  //  KONTROLA ZÁPISU — LOGIKA
  // ====================================================================
  const unitSets = {
    length: ["mm", "cm", "m", "km"],
    energy: ["J", "kJ", "MJ"],
    force:  ["N", "kN", "MN"],
    power:  ["W", "kW", "MW"],
    mass:   ["g", "kg", "t"],
    time:   ["s", "min", "h"]
  };
  const symbolToKind = {
    s: "length",
    W: "energy", // práce
    F: "force",
    P: "power",
    m: "mass",
    t: "time",
  };
  const baseUnit = { length: "m", energy: "J", force: "N", power: "W", mass: "kg", time: "s" };

  function toBase(value, unit, kind) {
    if (value == null || unit == null || kind == null) return null;
    const v = Number(value);
    if (!isFinite(v)) return null;

    switch (kind) {
      case "length":
        if (unit === "mm") return v / 1000;
        if (unit === "cm") return v / 100;
        if (unit === "m")  return v;
        if (unit === "km") return v * 1000;
        return null;
      case "energy":
        if (unit === "J")  return v;
        if (unit === "kJ") return v * 1000;
        if (unit === "MJ") return v * 1_000_000;
        return null;
      case "force":
        if (unit === "N")  return v;
        if (unit === "kN") return v * 1000;
        if (unit === "MN") return v * 1_000_000;
        return null;
      case "power":
        if (unit === "W")  return v;
        if (unit === "kW") return v * 1000;
        if (unit === "MW") return v * 1_000_000;
        return null;
      case "mass":
        if (unit === "g")  return v / 1000;
        if (unit === "kg") return v;
        if (unit === "t")  return v * 1000;
        return null;
      case "time":
        if (unit === "s")  return v;
        if (unit === "min")return v * 60;
        if (unit === "h")  return v * 3600;
        return null;
      default:
        return null;
    }
  }

  function nearlyEqual(a, b, tol = 1e-9) {
    if (a == null || b == null) return false;
    return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function collectZapis() {
    const rows = Array.from(document.querySelectorAll("#zapis-container .zapis-row"));
    return rows.map(row => {
      const symbol = row.querySelector(".zapis-symbol")?.value?.trim() || "-";
      const unit   = row.querySelector(".zapis-unit")?.value?.trim()   || "-";
      const raw    = row.querySelector(".zapis-value")?.value?.trim()  || "";
      const unknown= row.querySelector(".zapis-unknown")?.checked ?? false;

      let value = null;
      if (!unknown && raw && raw !== "?") value = Number((raw+"").replace(",", "."));

      return { symbol, unit, value, raw, unknown };
    });
  }

  function validateZapis() {
    const errors = [];
    const warnings = [];
    const zapis = collectZapis();

    // 5) Souhrn textem (vždy)
    const summaryLines = zapis.map((r, i) => `${i+1}. ${r.symbol} = ${r.unknown ? "?" : (r.raw || "")} ${r.unit}` );
    const summaryText = summaryLines.join("\n");

    // 1) Kompatibilita veličina ↔ jednotka
    for (const r of zapis) {
      if (r.symbol === "-" || r.unit === "-") continue;
      const kind = symbolToKind[r.symbol];
      if (!kind) continue;
      if (!unitSets[kind].includes(r.unit)) {
        errors.push(`Veličina **${r.symbol}** neodpovídá jednotce **${r.unit}**. Opravte prosím jednotku.`);
      }
    }

    // 2–4) Porovnání s „givens“ (hodnoty ze zadání)
    const givens = currentProblem?.givens || [];
    for (const g of givens) {
      const kind = symbolToKind[g.symbol];
      const row = zapis.find(r => r.symbol === g.symbol && !r.unknown);
      if (!row) continue; // není zapsáno → nevyhazujeme chybu (může dopsat později)

      if (row.raw === "?" || row.value == null) {
        errors.push(`V řádku **${g.symbol}** chybí hodnota.`);
        continue;
      }

      const baseGiven = toBase(g.value, g.unit, kind);
      const baseRow   = toBase(row.value, row.unit, kind);
      if (baseGiven == null || baseRow == null) continue;

      if (nearlyEqual(baseGiven, baseRow)) {
        // 4) stejné nezákladní jednotky jako v zadání → doporučení převést
        const base = baseUnit[kind];
        const isGivenBase = (g.unit === base);
        const isRowBase   = (row.unit === base);
        if (!isGivenBase && row.unit === g.unit && !isRowBase) {
          warnings.push(`Veličina **${g.symbol}** je zapsaná jako **${g.value} ${g.unit}**. Převeďte ji prosím na základní jednotku **${base}**.`);
        }
      } else {
        errors.push(`Veličina **${g.symbol}** neodpovídá zadání. Zkontrolujte hodnotu a jednotky.`);
      }
    }

    return { errors, warnings, summaryText };
  }

  // ====================================================================
  //  TUTORIÁL (beze změn)
  // ====================================================================
  const tutorialOverlay = document.getElementById("tutorial-overlay");
  const tutorialBox = document.getElementById("tutorial-message-box");
  const tutorialText = document.getElementById("tutorial-message-text");
  const tutorialNext = document.getElementById("tutorial-next-button");
  const tutorialEnd = document.getElementById("tutorial-end-button");
  const tutorialCounter = document.getElementById("tutorial-step-counter");

  const tutorialSteps = [
    "Vítejte! Tato ukázka vám vysvětlí, jak postupovat při řešení.",
    "Nejprve si přečtěte zadání a určete, co je známo a co se hledá.",
    "Poté proveďte zápis a vyberte vhodný vzorec.",
    "Nakonec vypočítejte výsledek a ověřte ho.",
  ];

  let tutorialIndex = 0;

  startTutorialButton?.addEventListener("click", startTutorial);
  tutorialNext?.addEventListener("click", nextTutorialStep);
  tutorialEnd?.addEventListener("click", endTutorial);

  function startTutorial() {
    tutorialOverlay?.classList.remove("hidden");
    tutorialBox?.classList.remove("hidden");
    tutorialIndex = 0;
    showTutorialStep();
  }
  function showTutorialStep() {
    if (tutorialText) tutorialText.textContent = tutorialSteps[tutorialIndex];
    if (tutorialCounter) tutorialCounter.textContent = `Krok ${tutorialIndex + 1}/${tutorialSteps.length}`;
  }
  function nextTutorialStep() {
    tutorialIndex++;
    if (tutorialIndex >= tutorialSteps.length) endTutorial();
    else showTutorialStep();
  }
  function endTutorial() {
    tutorialOverlay?.classList.add("hidden");
    tutorialBox?.classList.add("hidden");
  }

  // ====================================================================
  console.log("✅ Logika aplikace úspěšně načtena.");
});
