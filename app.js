
/*
  app_calc_stable.js
  Stabilní verze s rozšířenou výpočetní částí a live validací
*/

console.log("Načítání app_calc_stable.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");

  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");
  const startButton = document.getElementById("start-button");
  const backButton = document.getElementById("back-button");
  const newProblemButton = document.getElementById("new-problem-button");
  const problemText = document.getElementById("problem-text");
  const checkCalculationButton = document.getElementById("check-calculation-button");
  const feedbackContainer = document.getElementById("vypocet-feedback-container");

  let selectedMode = null;
  let selectedLevel = null;
  let selectedTopic = "prace";
  let currentProblem = null;

  const modeButtons = document.querySelectorAll('[id^="mode-"]');
  const levelButtons = document.querySelectorAll('[id^="level-"]');
  const topicSelect = document.getElementById("topic-select");

  function updateStartButtonState() {
    if (selectedMode && selectedLevel && selectedTopic) {
      startButton.disabled = false;
      startButton.classList.remove("btn-disabled");
    } else {
      startButton.disabled = true;
      startButton.classList.add("btn-disabled");
    }
  }

  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      modeButtons.forEach(x => x.classList.remove("ring-2", "ring-blue-500"));
      btn.classList.add("ring-2", "ring-blue-500");
      selectedMode = btn.id.includes("practice") ? "practice" : "test";
      console.log("🎓 Režim zvolen:", selectedMode);
      updateStartButtonState();
    });
  });

  levelButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      levelButtons.forEach(x => x.classList.remove("ring-2", "ring-blue-500"));
      btn.classList.add("ring-2", "ring-blue-500");
      selectedLevel = btn.id.replace("level-", "");
      console.log("🎯 Obtížnost zvolena:", selectedLevel);
      updateStartButtonState();
    });
  });

  topicSelect.addEventListener("change", e => {
    selectedTopic = e.target.value;
    updateStartButtonState();
  });

  startButton.addEventListener("click", () => {
    setupScreen.classList.add("hidden");
    practiceScreen.classList.remove("hidden");
    generateNewProblem();
  });

  backButton.addEventListener("click", () => {
    practiceScreen.classList.add("hidden");
    setupScreen.classList.remove("hidden");
  });

  newProblemButton.addEventListener("click", () => {
    generateNewProblem();
  });

  // ===== Generátor příkladů =====
  const topics = {
    prace: {
      examples: [
        { text: "Těleso bylo přesunuto silou 4 kN po dráze 2 m. Jaká práce byla vykonána?", givens: { F: 4000, s: 2 }, result: 8000, unit: "J" },
        { text: "Auto jelo rovnoměrným přímočarým pohybem po dráze 5 km. Tahová síla motoru byla 1300 N.", givens: { s: 5000, F: 1300 }, result: 6500000, unit: "J" }
      ]
    }
  };

  function generateNewProblem() {
    const ex = topics[selectedTopic].examples[Math.floor(Math.random() * topics[selectedTopic].examples.length)];
    currentProblem = ex;
    problemText.textContent = ex.text;
    resetCalculationFields();
    console.log("🆕 Nový příklad:", ex.text);
  }

  // ===== Výpočetní část =====
  const fields = {
    formula: ["formula-input-left", "formula-input-right"],
    substitution: ["substitution-input-left", "substitution-input-right"],
    result: ["result-input-left", "result-input-right"]
  };

  Object.values(fields).flat().forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", rowLiveValidate);
  });

  function rowLiveValidate() {
    const fL = document.getElementById(fields.formula[0]).value.trim();
    const fR = document.getElementById(fields.formula[1]).value.trim();
    const sL = document.getElementById(fields.substitution[0]).value.trim();
    const sR = document.getElementById(fields.substitution[1]).value.trim();
    const rL = document.getElementById(fields.result[0]).value.trim();
    const rR = document.getElementById(fields.result[1]).value.trim();

    if (fL && fR) console.log(`📐 Vzorec: ${fL} = ${fR}`);
    if (sL && sR) console.log(`🧾 Dosazení: ${sL} = ${sR}`);
    if (rL && rR) console.log(`🧮 Výsledek: ${rL} = ${rR}`);
  }

  function resetCalculationFields() {
    Object.values(fields).flat().forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    feedbackContainer.innerHTML = "";
  }

  // ===== Kontrola výpočtu =====
  checkCalculationButton.addEventListener("click", () => {
    const rVal = parseFloat(document.getElementById(fields.result[1]).value);
    if (isNaN(rVal)) {
      feedbackContainer.innerHTML = `<p class='text-red-400 font-semibold'>❌ Zadejte číselný výsledek!</p>`;
      return;
    }
    const correct = Math.abs(rVal - currentProblem.result) < 1;
    if (correct) {
      feedbackContainer.innerHTML = `<p class='text-green-400 font-semibold'>✅ Správně! ${currentProblem.result} ${currentProblem.unit}</p>`;
    } else {
      feedbackContainer.innerHTML = `<p class='text-yellow-400 font-semibold'>ℹ️ Správný výsledek: ${currentProblem.result} ${currentProblem.unit}</p>`;
    }
  });

  console.log("✅ Logika aplikace úspěšně načtena.");
});
