// ====================================================================
//  app.js — Fyzika: Práce a výkon (verze 2025-10, dynamické řádky zápisu)
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
        // === Přepínání kroků ===
        case "check-zapis-button":
          console.log("➡️ Přechod na krok: výpočet");
          document.getElementById("zapis-step")?.classList.add("hidden");
          document.getElementById("vypocet-step")?.classList.remove("hidden");
          break;

        case "check-calculation-button":
        case "check-work-calculation-button":
        case "check-mass-calculation-button":
        case "check-force-calculation-button":
          console.log(`✅ Ověření výpočtu: ${id}`);
          showFeedback(`Zatím testovací ověření pro ${id}`, true);
          break;

        case "next-button":
          console.log("🔁 Další příklad (reset kroků)");
          document.getElementById("zapis-step")?.classList.remove("hidden");
          document.getElementById("vypocet-step")?.classList.add("hidden");
          document.getElementById("result-step")?.classList.add("hidden");
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
          alert("🧠 Tady bude nápověda!");
          break;

        // === Zavírání modálů ===
        case "close-calculator-button":
        case "close-formula-button":
        case "close-diagram-button":
          toggleModal(target.closest(".fixed")?.id, false);
          break;

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
            availableUnits = ["-", "mm", "cm", "m", "km", "J", "kJ", "MJ", "N", "kN", "MN", "W", "kW", "MW"];
          }

          const veličinyHTML = availableSymbols.map(v => `<option value="${v}">${v}</option>`).join("");
          const jednotkyHTML = availableUnits.map(u => `<option value="${u}">${u}</option>`).join("");

          const row = document.createElement("div");
          row.className = "grid grid-cols-1 sm:grid-cols-3 gap-2 zapis-row mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";

          row.innerHTML = `
            <select class="p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500">
              ${veličinyHTML}
            </select>
            <input type="number" placeholder="Hodnota" 
                   class="p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500">
            <select class="p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500">
              ${jednotkyHTML}
            </select>
          `;

          zapisContainer.appendChild(row);
          console.log("✅ Nový řádek zápisu přidán");
          break;
        }

        case "new-problem-button":
          console.log("🔁 Nový příklad");
          generateNewProblem();
          break;

        default:
          break;
      }
    });
  }

  // ====================================================================
  //  POMOCNÉ FUNKCE
  // ====================================================================
  function toggleModal(id, show) {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (show) modal.classList.remove("hidden");
    else modal.classList.add("hidden");
  }

  function showFeedback(msg, isCorrect) {
    const feedbackContainer = document.getElementById("vypocet-feedback-container");
    if (!feedbackContainer) return;
    feedbackContainer.innerHTML = `<div class="${isCorrect ? "feedback-correct" : "feedback-wrong"} mt-2">${msg}</div>`;
  }

  // ====================================================================
  //  GENERÁTOR PŘÍKLADŮ
  // ====================================================================
  const problemText = document.getElementById("problem-text");
  const unitSelect = document.getElementById("unit-select");
  const feedbackContainer = document.getElementById("vypocet-feedback-container");

  const topics = {
    prace: {
      units: ["J", "kJ"],
      examples: [
        { text: "Dělník zvedl břemeno o hmotnosti 50 kg do výšky 2 m. Vypočítej práci.", result: 50 * 10 * 2 },
        { text: "Auto působí silou 2 000 N na vzdálenost 5 m. Jakou práci vykoná?", result: 2000 * 5 },
      ],
    },
    vykon: {
      units: ["W", "kW"],
      examples: [
        { text: "Motor vykonal práci 12 000 J za 4 s. Jaký byl výkon?", result: 12000 / 4 },
        { text: "Čerpadlo vykonává práci 24 kJ za 8 s. Jaký je výkon?", result: 24000 / 8 },
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
  }

  // ====================================================================
  //  TUTORIÁL
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
