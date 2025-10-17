/*
  app_vypocet_final.js — stabilní verze
  ✅ Zachována původní logika
  ✅ Výpočetní část s dvoupólovými poli
*/

console.log("Načítání app_vypocet_final.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");

  // ===================== ÚVODNÍ NASTAVENÍ =====================
  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");
  const startButton = document.getElementById("start-button");
  const topicSelect = document.getElementById("topic-select");
  const newProblemButton = document.getElementById("new-problem-button");
  const backButton = document.getElementById("back-button");

  let selectedMode = null;
  let selectedLevel = null;
  let selectedTopic = "prace";
  let currentProblem = null;

  const modeButtons = document.querySelectorAll('[id^="mode-"]');
  const levelButtons = document.querySelectorAll('[id^="level-"]');

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
      modeButtons.forEach(b => b.classList.remove("ring-2", "ring-blue-500"));
      btn.classList.add("ring-2", "ring-blue-500");
      selectedMode = btn.id.includes("practice") ? "practice" : "test";
      console.log(`🎓 Režim zvolen: ${selectedMode}`);
      updateStartButtonState();
    });
  });

  levelButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      levelButtons.forEach(b => b.classList.remove("ring-2", "ring-blue-500"));
      btn.classList.add("ring-2", "ring-blue-500");
      if (btn.id.includes("easy")) selectedLevel = "easy";
      if (btn.id.includes("normal")) selectedLevel = "normal";
      if (btn.id.includes("hard")) selectedLevel = "hard";
      console.log(`🎯 Obtížnost zvolena: ${selectedLevel}`);
      updateStartButtonState();
    });
  });

  topicSelect?.addEventListener("change", e => {
    selectedTopic = e.target.value;
    updateStartButtonState();
  });

  startButton.addEventListener("click", () => {
    console.log("▶️ Spuštěno");
    setupScreen.classList.add("hidden");
    practiceScreen.classList.remove("hidden");
    generateNewProblem();
  });

  backButton.addEventListener("click", () => {
    practiceScreen.classList.add("hidden");
    setupScreen.classList.remove("hidden");
  });

  // ===================== GENERÁTOR PŘÍKLADŮ =====================
  const problemText = document.getElementById("problem-text");
  const unitSelect = document.getElementById("unit-select");

  const topics = {
    prace: {
      units: ["J", "kJ"],
      examples: [
        { text: "Těleso bylo přesunuto silou 5 kN po dráze 2 m. Jaká práce byla vykonána?", givens: { F: 5000, s: 2 }, result: 10000 },
        { text: "Auto jelo rovnoměrným přímočarým pohybem po dráze 5 km. Tahová síla motoru byla 1300 N.", givens: { F: 1300, s: 5000 }, result: 6500000 }
      ]
    }
  };

  function generateNewProblem() {
    const data = topics[selectedTopic];
    const example = data.examples[Math.floor(Math.random() * data.examples.length)];
    currentProblem = example;
    problemText.textContent = example.text;
    console.log(`🆕 Nový příklad: ${example.text}`);
  }

  // ===================== VÝPOČETNÍ KROK =====================
  const checkCalcBtn = document.getElementById("check-calculation-button");
  const feedbackContainer = document.getElementById("vypocet-feedback-container");

  // nová logika s dvoupólovými poli
  const formulaInputLHS = document.createElement("input");
  const formulaInputRHS = document.createElement("input");
  formulaInputLHS.placeholder = "např. W";
  formulaInputRHS.placeholder = "F * s";
  [formulaInputLHS, formulaInputRHS].forEach(el => {
    el.className = "w-full p-3 border rounded-xl bg-gray-900 border-gray-700 focus:ring-2 focus:ring-blue-500";
  });

  const formulaContainer = document.getElementById("formula-input").parentElement;
  formulaContainer.innerHTML = "";
  formulaContainer.appendChild(formulaInputLHS);
  formulaContainer.insertAdjacentHTML("beforeend", '<span class="px-2 text-xl font-bold">=</span>');
  formulaContainer.appendChild(formulaInputRHS);

  checkCalcBtn?.addEventListener("click", () => {
    const lhs = formulaInputLHS.value.trim();
    const rhs = formulaInputRHS.value.trim();
    if (!lhs || !rhs) {
      feedbackContainer.innerHTML = `<div class='text-red-400'>❌ Vyplňte obě pole.</div>`;
      return;
    }
    const expected = "W";
    if (lhs !== expected) {
      feedbackContainer.innerHTML = `<div class='text-yellow-400'>⚠️ Zkontrolujte, co počítáte (začněte hledanou veličinou).</div>`;
      return;
    }
    feedbackContainer.innerHTML = `<div class='text-green-400'>✅ Správně! Pokračujte k dosazení.</div>`;
  });

  console.log("✅ Logika aplikace úspěšně načtena.");
});