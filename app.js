console.log("Načítání app.js ...");

// Hlavní inicializační blok
window.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");
{
  console.log("✅ DOM načten, inicializace aplikace...");

  const startButton = document.getElementById("start-button");
  const topicSelect = document.getElementById("topic-select");
  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");

  // Bezpečná kontrola, zda tlačítko existuje
  if (!startButton) {
    console.error("❌ Element start-button nebyl nalezen. Zkontroluj id v index.html!");
    return;
  }

  // Příklad jednoduchého listeneru
  startButton.addEventListener("click", () => {
    console.log("▶️ Klik na tlačítko Spustit");
    setupScreen?.classList.add("hidden");
    practiceScreen?.classList.remove("hidden");
  });

  // Tady pokračuje zbytek tvého kódu…
});


// --- REŽIM A OBTÍŽNOST ---


  const modeButtons = document.querySelectorAll('[id^="mode-"]');
  const levelButtons = document.querySelectorAll('[id^="level-"]');

  if (modeButtons.length === 0) console.warn("⚠️ Nebyla nalezena žádná tlačítka režimu.");
  if (levelButtons.length === 0) console.warn("⚠️ Nebyla nalezena žádná tlačítka úrovně.");

  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      console.log(`Režim zvolen: ${btn.id}`);
      modeButtons.forEach(b => b.classList.remove("ring-2", "ring-blue-500"));
      btn.classList.add("ring-2", "ring-blue-500");
      selectedMode = btn.id.includes("practice") ? "practice" : "test";
      updateStartButtonState();
    });
  });

  levelButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      console.log(`Obtížnost zvolena: ${btn.id}`);
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
    console.log("Téma:", selectedTopic);
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

  // --- START / ZPĚT / NOVÝ ---
  if (startButton) {
    startButton.addEventListener("click", () => {
      console.log("▶️ Spuštěno");
      setupScreen.classList.add("hidden");
      practiceScreen.classList.remove("hidden");
      generateNewProblem();
    });
  } else {
    console.warn("⚠️ Nenalezen startButton");
  }

  backButton?.addEventListener("click", () => {
    console.log("⬅️ Zpět na úvod");
    setupScreen.classList.remove("hidden");
    practiceScreen.classList.add("hidden");
  });

  newProblemButton?.addEventListener("click", generateNewProblem);


  // ====================================================================
  //  GENERÁTOR PŘÍKLADŮ
  // ====================================================================
  const problemText = document.getElementById("problem-text");
  const resultLabel = document.getElementById("result-label");
  const unitSelect = document.getElementById("unit-select");

  const checkCalculationButton = document.getElementById("check-calculation-button");
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

    // jednotky
    unitSelect.innerHTML = "";
    data.units.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u;
      opt.textContent = u;
      unitSelect.appendChild(opt);
    });

    // reset polí
    feedbackContainer.innerHTML = "";
    document.getElementById("user-answer").value = "";
    document.getElementById("formula-input").value = "";
    document.getElementById("substitution-input").value = "";
  }

  // ====================================================================
  //  OVĚŘENÍ VÝPOČTU
  // ====================================================================
  checkCalculationButton.addEventListener("click", () => {
    const answer = parseFloat(document.getElementById("user-answer").value);
    if (isNaN(answer)) {
      showFeedback("Zadejte číselný výsledek.", false);
      return;
    }

    const correct = Math.abs(answer - currentProblem.result) < 1;
    if (correct) showFeedback("✅ Správně!", true);
    else showFeedback(`❌ Špatně. Správný výsledek je přibližně ${currentProblem.result.toFixed(1)} ${unitSelect.value}.`, false);
  });

  function showFeedback(msg, isCorrect) {
    feedbackContainer.innerHTML = `<div class="${isCorrect ? "feedback-correct" : "feedback-wrong"}">${msg}</div>`;
  }

  // ====================================================================
  //  MODÁLY (Kalkulačka, Vzorec, Schéma)
  // ====================================================================
  const modalMap = {
    "open-calculator-button": "calculator-modal",
    "open-formula-button": "formula-modal",
    "open-diagram-button": "diagram-modal",
  };
  Object.entries(modalMap).forEach(([openId, modalId]) => {
    const openBtn = document.getElementById(openId);
    const modal = document.getElementById(modalId);
    const closeBtn = modal?.querySelector("button[id^='close']");
    if (openBtn && modal && closeBtn) {
      openBtn.addEventListener("click", () => modal.classList.remove("hidden"));
      closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
      modal.addEventListener("click", e => {
        if (e.target === modal) modal.classList.add("hidden");
      });
    }
  });

  // ====================================================================
  //  KALKULAČKA
  // ====================================================================
  const calcDisplay = document.getElementById("calculator-display");
  const calcButtonsContainer = document.getElementById("calculator-buttons");
  const calcHistory = document.getElementById("calculator-history");
  if (calcButtonsContainer) {
    const buttons = [
      "7","8","9","/",
      "4","5","6","*",
      "1","2","3","-",
      "0",".","=","+",
      "C"
    ];
    buttons.forEach(b => {
      const btn = document.createElement("button");
      btn.textContent = b;
      calcButtonsContainer.appendChild(btn);
      btn.addEventListener("click", () => handleCalcButton(b));
    });
  }
  let calcCurrent = "";
  function handleCalcButton(value) {
    if (value === "C") {
      calcCurrent = "";
      calcDisplay.textContent = "0";
      calcHistory.textContent = "";
      return;
    }
    if (value === "=") {
      try {
        const result = eval(calcCurrent);
        calcHistory.textContent = calcCurrent + " =";
        calcDisplay.textContent = result;
        calcCurrent = result.toString();
      } catch {
        calcDisplay.textContent = "Chyba";
      }
      return;
    }
    calcCurrent += value;
    calcDisplay.textContent = calcCurrent;
  }

  // ====================================================================
  //  TUTORIÁL (zjednodušená verze)
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

  startTutorialButton.addEventListener("click", startTutorial);
  tutorialNext.addEventListener("click", nextTutorialStep);
  tutorialEnd.addEventListener("click", endTutorial);

  function startTutorial() {
    tutorialOverlay.classList.remove("hidden");
    tutorialBox.classList.remove("hidden");
    tutorialIndex = 0;
    showTutorialStep();
  }
  function showTutorialStep() {
    tutorialText.textContent = tutorialSteps[tutorialIndex];
    tutorialCounter.textContent = `Krok ${tutorialIndex + 1}/${tutorialSteps.length}`;
  }
  function nextTutorialStep() {
    tutorialIndex++;
    if (tutorialIndex >= tutorialSteps.length) endTutorial();
    else showTutorialStep();
  }
  function endTutorial() {
    tutorialOverlay.classList.add("hidden");
    tutorialBox.classList.add("hidden");
  }

  // ====================================================================
  console.log("Logika načtena.");
});
