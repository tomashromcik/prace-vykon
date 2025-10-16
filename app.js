// ====================================================================
//  app.js — Fyzika: Práce a výkon (dynamické řádky + kontrola zápisu)
// ====================================================================

console.log("Načítání app.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");

  // --- HLAVNÍ ELEMENTY ---
  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");
  const startButton = document.getElementById("start-button");
  const topicSelect = document.getElementById("topic-select");
  const backButton = document.getElementById("back-button");
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
    if (selectedMode && selectedLevel && selectedTopic) {
      startButton.disabled = false;
      startButton.classList.remove("btn-disabled");
      console.log("✅ Start povolen");
    } else {
      startButton.disabled = true;
      startButton.classList.add("btn-disabled");
    }
  }

  // --- START ---
  if (startButton) {
    startButton.addEventListener("click", () => {
      console.log("▶️ Kliknuto na Spustit");
      setupScreen?.classList.add("hidden");
      practiceScreen?.classList.remove("hidden");
      generateNewProblem();
      attachPracticeListeners();
    });
  }

  // ====================================================================
  //  INTERAKCE V REŽIMU PŘÍKLADŮ
  // ====================================================================

  function attachPracticeListeners() {
    console.log("🧩 Aktivace tlačítek v režimu příkladů...");

    const container = document.getElementById("practice-screen");
    if (!container) {
      console.error("❌ practice-screen nenalezen!");
      return;
    }

    // Delegace událostí: nasloucháme klikům v celé sekci
    container.addEventListener("click", (e) => {
      const target = e.target.closest("button");
      if (!target) return;

      const id = target.id || "(bez ID)";
      console.log(`🟢 Klik: ${id}`);

      switch (id) {
        // === Přidání řádku zápisu ===
        case "add-zapis-row-button": {
          console.log("➕ Přidat novou veličinu do zápisu");

          const zapisContainer = document.getElementById("zapis-container");
          if (!zapisContainer) {
            console.error("❌ Není nalezen #zapis-container");
            break;
          }

          // Seznamy veličin a jednotek podle obtížnosti
          const veličinyEasy = ["-", "F", "s", "W"];
          const jednotkyEasy = ["-", "cm", "m", "km", "J", "kJ", "MJ", "N", "kN", "MN"];

          let availableSymbols = veličinyEasy;
          let availableUnits = jednotkyEasy;
          if (selectedLevel === "hard") {
            availableSymbols = ["-", "F", "s", "W", "P", "t", "v", "m"];
            availableUnits = ["-", "mm", "cm", "m", "km", "J", "kJ", "MJ", "N", "kN", "MN", "W", "kW", "MW", "kg", "g"];
          }

          const symOptions = availableSymbols.map(v => `<option value="${v}">${v}</option>`).join("");
          const unitOptions = availableUnits.map(u => `<option value="${u}">${u}</option>`).join("");

          const row = document.createElement("div");
          row.className = "grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";

          row.innerHTML = `
            <select class="p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 zapis-symbol">
              ${symOptions}
            </select>
            <input type="text" placeholder="Hodnota" 
                   class="p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 zapis-value">
            <select class="p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 zapis-unit">
              ${unitOptions}
            </select>
            <label class="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" class="zapis-unknown h-4 w-4">
              <span>Hledaná veličina</span>
            </label>
            <div class="col-span-1 sm:col-span-4 text-xs text-blue-300 italic hidden row-hint"></div>
          `;

          // reakce na checkbox (hledaná veličina)
          const valueInput = row.querySelector(".zapis-value");
          const unitSelect = row.querySelector(".zapis-unit");
          const unknownCb = row.querySelector(".zapis-unknown");

          unknownCb.addEventListener("change", () => {
            if (unknownCb.checked) {
              valueInput.value = "?";
              valueInput.setAttribute("disabled", "disabled");
            } else {
              if (valueInput.value === "?") valueInput.value = "";
              valueInput.removeAttribute("disabled");
            }
          });

          zapisContainer.appendChild(row);
          console.log("✅ Nový řádek zápisu přidán");
          break;
        }

        // === Kontrola zápisu ===
        case "check-zapis-button": {
          console.log("🧪 Kontrola zápisu");
          const { errors, warnings, summaryLines } = validateZapis();
          renderZapisFeedback(errors, warnings, summaryLines);

          if (errors.length === 0) {
            // přesun na krok Výpočet až když nejsou chyby v zápisu
            console.log("✅ Zápis v pořádku — přechod na výpočet");
            document.getElementById("zapis-step")?.classList.add("hidden");
            document.getElementById("vypocet-step")?.classList.remove("hidden");
          } else {
            console.log("❌ Zápis obsahuje chyby — zůstaneme v kroku Zápis");
          }
          break;
        }

        // === Ověření výpočtů (zatím placeholder) ===
        case "check-calculation-button":
        case "check-work-calculation-button":
        case "check-mass-calculation-button":
        case "check-force-calculation-button":
          console.log(`✅ Ověření výpočtu: ${id}`);
          showMainFeedback(`Zatím testovací ověření pro ${id}`, true);
          break;

        // === Další příklad ===
        case "next-button":
          console.log("🔁 Další příklad (reset kroků)");
          document.getElementById("zapis-step")?.classList.remove("hidden");
          document.getElementById("vypocet-step")?.classList.add("hidden");
          document.getElementById("result-step")?.classList.add("hidden");
          clearZapis();
          generateNewProblem();
          break;

        // === Modální okna ===
        case "open-calculator-button":
          toggleModal("calculator-modal", true);
          break;
        case "open-formula-button":
          toggleModal("formula-modal", true);
          break;
        case "open-diagram-button":
          toggleModal("diagram-modal", true);
          break;
        case "open-help-button":
          alert("🧠 Nápověda: zapište známé veličiny z textu (v základních jednotkách), hledanou zaškrtněte.");
          break;

        // === Zavírání modálů ===
        case "close-calculator-button":
        case "close-formula-button":
        case "close-diagram-button":
          toggleModal(target.closest(".fixed")?.id, false);
          break;

        // === Nový příklad (rychlé vygenerování) ===
        case "new-problem-button":
          console.log("🔁 Nový příklad");
          clearZapis();
          generateNewProblem();
          break;

        default:
          break;
      }
    });
  }

  // ====================================================================
  //  POMOCNÉ FUNKCE UI
  // ====================================================================
  function toggleModal(id, show) {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (show) modal.classList.remove("hidden");
    else modal.classList.add("hidden");
  }

  function showMainFeedback(msg, isCorrect) {
    const feedbackContainer = document.getElementById("vypocet-feedback-container");
    if (!feedbackContainer) return;
    feedbackContainer.innerHTML = `<div class="${isCorrect ? "feedback-correct" : "feedback-wrong"} mt-2">${msg}</div>`;
  }

  function clearZapis() {
    document.getElementById("zapis-container").innerHTML = "";
    document.getElementById("zapis-feedback-container").innerHTML = "";
    document.getElementById("zapis-review-container").innerHTML = "";
  }

  // ====================================================================
  //  GENERÁTOR PŘÍKLADŮ + DATA ZE ZADÁNÍ
  // ====================================================================
  const problemText = document.getElementById("problem-text");
  const unitSelect = document.getElementById("unit-select");
  const feedbackContainer = document.getElementById("vypocet-feedback-container");

  // Každý příklad má navíc "givens": pole známých veličin a hodnot ze zadání
  const topics = {
    prace: {
      units: ["J", "kJ"],
      examples: [
        {
          text: "Dělník zvedl břemeno o hmotnosti 50 kg do výšky 2 m. Vypočítej práci.",
          result: 50 * 10 * 2,
          givens: [
            { symbol: "s", value: 2, unit: "m" }, // dráha 2 m je explicitně v zadání
            // m = 50 kg je v zadání, ale v úrovni easy/normal nezapisujeme m (spíš F nebo W jako hledaná)
          ],
          baseHints: { s: "m" }
        },
        {
          text: "Auto působí silou 2 000 N na vzdálenost 5 m. Jakou práci vykoná?",
          result: 2000 * 5,
          givens: [
            { symbol: "F", value: 2000, unit: "N" },
            { symbol: "s", value: 5, unit: "m" },
          ],
          baseHints: { F: "N", s: "m" }
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
          baseHints: { W: "J", t: "s" }
        },
        {
          text: "Čerpadlo vykonává práci 24 kJ za 8 s. Jaký je výkon?",
          result: 24000 / 8,
          givens: [
            { symbol: "W", value: 24000, unit: "J" }, // 24 kJ = 24000 J (už normalizováno)
            { symbol: "t", value: 8, unit: "s" },
          ],
          baseHints: { W: "J", t: "s" }
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
    document.getElementById("user-answer").value = "";
    document.getElementById("formula-input").value = "";
    document.getElementById("substitution-input").value = "";

    // vždyť chceme mít zadání viditelné ve všech krocích — to už zajišťuje #problem-text
  }

  // ====================================================================
  //  KONTROLA ZÁPISU (logika dle požadavků)
  // ====================================================================

  // mapy kompatibility veličina ↔ jednotky
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
    W: "energy",   // práce
    F: "force",
    P: "power",
    m: "mass",
    t: "time",
    v: "length"    // záměrně pro hard, pokud by se objevilo
  };
  const baseUnit = { length: "m", energy: "J", force: "N", power: "W", mass: "kg", time: "s" };

  // převody -> na základní jednotky
  function toBase(value, unit, kind) {
    if (value == null || unit == null || kind == null) return null;
    const v = Number(value);
    if (!isFinite(v)) return null;

    switch (kind) {
      case "length":
        if (unit === "mm") return v / 1000;
        if (unit === "cm") return v / 100;
        if (unit === "m") return v;
        if (unit === "km") return v * 1000;
        return null;
      case "energy":
        if (unit === "J") return v;
        if (unit === "kJ") return v * 1000;
        if (unit === "MJ") return v * 1_000_000;
        return null;
      case "force":
        if (unit === "N") return v;
        if (unit === "kN") return v * 1000;
        if (unit === "MN") return v * 1_000_000;
        return null;
      case "power":
        if (unit === "W") return v;
        if (unit === "kW") return v * 1000;
        if (unit === "MW") return v * 1_000_000;
        return null;
      case "mass":
        if (unit === "g") return v / 1000;
        if (unit === "kg") return v;
        if (unit === "t") return v * 1000;
        return null;
      case "time":
        if (unit === "s") return v;
        if (unit === "min") return v * 60;
        if (unit === "h") return v * 3600;
        return null;
      default:
        return null;
    }
  }

  function nearlyEqual(a, b, tol = 1e-6) {
    if (a == null || b == null) return false;
    return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
  }

  function collectZapis() {
    const rows = Array.from(document.querySelectorAll("#zapis-container .zapis-row"));
    return rows.map(row => {
      const sym = row.querySelector(".zapis-symbol")?.value?.trim();
      const valRaw = row.querySelector(".zapis-value")?.value?.trim();
      const unt = row.querySelector(".zapis-unit")?.value?.trim();
      const unknown = row.querySelector(".zapis-unknown")?.checked ?? false;

      let val = null;
      if (!unknown && valRaw && valRaw !== "?") {
        val = Number(valRaw.replace(",", "."));
      }

      return { symbol: sym || "-", value: val, valueRaw: valRaw, unit: unt || "-", unknown };
    });
  }

  function validateZapis() {
    const errors = [];
    const warnings = [];
    const summaryLines = [];

    const zapis = collectZapis();

    // textový souhrn zápisu (5)
    zapis.forEach((r, idx) => {
      const valPart = r.unknown ? "?" : (r.valueRaw || "");
      summaryLines.push(`${idx + 1}. ${r.symbol} = ${valPart} ${r.unit}`);
    });

    // 1) kompatibilita veličina↔jednotka
    for (const r of zapis) {
      if (r.symbol === "-" || r.unit === "-") continue; // ignorujeme prázdné
      const kind = symbolToKind[r.symbol];
      if (!kind) continue; // symbol, který teď neřešíme
      const allowed = unitSets[kind] || [];
      if (!allowed.includes(r.unit)) {
        errors.push(`Veličina **${r.symbol}** neodpovídá jednotce **${r.unit}**. Opravte prosím jednotku.`);
      }
    }

    // 2–4) porovnání se zadáním (včetně převodů a výzvy k převodu na základní jednotky)
    const givens = currentProblem?.givens || [];
    for (const g of givens) {
      // najdi řádek v zápisu se stejným symbolem
      const row = zapis.find(r => r.symbol === g.symbol && !r.unknown);
      if (!row) continue; // žák nemusí zapsat vše; nevyhazujeme chybu

      const kind = symbolToKind[g.symbol];
      if (!kind) continue;

      const baseGiven = toBase(g.value, g.unit, kind);
      const baseRow = toBase(row.value, row.unit, kind);

      if (row.valueRaw === "?" || row.value == null) {
        errors.push(`V řádku **${g.symbol}** chybí hodnota.`);
        continue;
      }

      if (baseGiven == null || baseRow == null) continue;

      // 3) akceptuj převedené (např. 10 km == 10000 m)
      if (nearlyEqual(baseGiven, baseRow)) {
        // 4) pokud žák použil stejnou ne-základní jednotku jako v zadání → varování k převodu
        const isGivenBase = (g.unit === baseUnit[kind]);
        const isRowBase = (row.unit === baseUnit[kind]);
        if (!isGivenBase && row.unit === g.unit && !isRowBase) {
          warnings.push(`Veličina **${g.symbol}** je zapsaná jako **${g.value} ${g.unit}**. Převeďte ji prosím na základní jednotku **${baseUnit[kind]}**.`);
        }
      } else {
        // 2) neodpovídá hodnota ze zadání
        errors.push(`Veličina **${g.symbol}** neodpovídá zadání. Zkontrolujte hodnotu a jednotky.`);
      }
    }

    return { errors, warnings, summaryLines };
  }

  function renderZapisFeedback(errors, warnings, summaryLines) {
    const fb = document.getElementById("zapis-feedback-container");
    const rev = document.getElementById("zapis-review-container");

    // Souhrn zápisu (textem)
    rev.innerHTML = `
      <div class="p-3 rounded-lg bg-gray-900 border border-gray-700">
        <div class="text-sm text-gray-300 font-semibold mb-2">Souhrn zápisu:</div>
        <pre class="text-gray-200 text-sm whitespace-pre-wrap">${summaryLines.join("\n")}</pre>
      </div>
    `;

    // Chyby a varování
    const parts = [];
    if (errors.length) {
      parts.push(`
        <div class="feedback-wrong">
          <div class="font-semibold mb-1">Chyby v zápisu:</div>
          <ul class="list-disc pl-5">
            ${errors.map(e => `<li>${e}</li>`).join("")}
          </ul>
        </div>
      `);
    }
    if (warnings.length) {
      parts.push(`
        <div class="feedback-correct">
          <div class="font-semibold mb-1">Doporučení:</div>
          <ul class="list-disc pl-5">
            ${warnings.map(w => `<li>${w}</li>`).join("")}
          </ul>
        </div>
      `);
    }
    if (!errors.length && !warnings.length) {
      parts.push(`<div class="feedback-correct">👍 Zápis vypadá v pořádku.</div>`);
    }

    fb.innerHTML = parts.join("\n");
    fb.scrollIntoView({ behavior: "smooth", block: "center" });
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
