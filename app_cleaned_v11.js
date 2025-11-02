// ===============================================================
// app_cleaned_v11.js — hlavní logika aplikace (tmavé schéma)
// ---------------------------------------------------------------
// • Přepínání mezi úvodní a procvičovací obrazovkou
// • Volba režimu, obtížnosti a tématu (Práce/Výkon)
// • Generování příkladů a *globální* zpřístupnění currentProblem
// • Vyvolává custom událost 'problem:updated' pro navazující moduly
// • Kompatibilní s app_final_calc_v22.js (fallback zápis + modály)
// ===============================================================

console.log("Načítání app_cleaned_v11.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace app_cleaned_v11...");

  // -------------------- STAV --------------------
  let selectedMode = null;
  let selectedLevel = null;
  let selectedTopic = "prace";
  let currentProblem = null;   // ← exportujeme na window

  // -------------------- DOM ELEMENTY --------------------
  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");
  const practiceTitle = document.getElementById("practice-title");

  const startButton = document.getElementById("start-button");
  const backButton = document.getElementById("back-button");
  const newProblemButton = document.getElementById("new-problem-button");
  const topicSelect = document.getElementById("topic-select");
  const problemTextEl = document.getElementById("problem-text");
  const unitSelect = document.getElementById("unit-select");

  // -------------------- OVLÁDÁNÍ MODŮ --------------------
  function markActive(groupSelector, activeBtn) {
    document.querySelectorAll(groupSelector).forEach(b => {
      b.classList.remove("ring-2", "ring-blue-500", "bg-blue-600", "text-white");
      b.classList.add("btn-secondary");
    });
    activeBtn.classList.add("ring-2", "ring-blue-500", "bg-blue-600", "text-white");
  }

  document.querySelectorAll('[id^="mode-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      selectedMode = btn.id.includes("practice") ? "practice" : "test";
      markActive('[id^="mode-"]', btn);
      updateStartButtonState();
      console.log(`🎓 Režim zvolen: ${selectedMode}`);
    });
  });

  document.querySelectorAll('[id^="level-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      selectedLevel = btn.id.includes("normal") ? "normal" :
                      btn.id.includes("hard") ? "hard" : "easy";
      markActive('[id^="level-"]', btn);
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

  // -------------------- PŘEPÍNAČ OBRAZOVEK --------------------
  function showPractice() {
    setupScreen?.classList.add("hidden");
    practiceScreen?.classList.remove("hidden");
    practiceTitle.textContent = `Téma: ${selectedTopic === "vykon" ? "Výkon" : "Práce"}`;
  }
  function showSetup() {
    practiceScreen?.classList.add("hidden");
    setupScreen?.classList.remove("hidden");
  }

  // -------------------- GENERÁTOR ÚLOH --------------------
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function generateProblem() {
    const variant = randInt(1, 2);
    let text, givens, result;

    if (selectedTopic === "vykon") selectedTopic = "prace"; // zatím držíme jen práci

    if (variant === 1) {
      const FkN = randInt(1, 9);
      const s_m = 2;
      text = `Těleso bylo přesunuto silou ${FkN} kN po dráze ${s_m} m. Jaká práce byla vykonána?`;
      givens = [
        { symbol: "F", value: FkN * 1000, unit: "N" },
        { symbol: "s", value: s_m, unit: "m" }
      ];
      result = (FkN * 1000) * s_m;
    } else {
      const s_km = randInt(1, 5);
      const F_N = randInt(800, 2000);
      text = `Auto jelo rovnoměrným přímočarým pohybem po dráze ${s_km} km. Tahová síla motoru byla ${F_N} N.`;
      givens = [
        { symbol: "s", value: s_km * 1000, unit: "m" },
        { symbol: "F", value: F_N, unit: "N" }
      ];
      result = (s_km * 1000) * F_N;
    }

    currentProblem = { text, givens, result };
    problemTextEl.textContent = text;

    // 🔴 DŮLEŽITÉ: vystavit pro externí moduly
    window.currentProblem = currentProblem;

    // 🔵 Informativní událost pro moduly (vzorec/obrázek apod.)
    document.dispatchEvent(new CustomEvent("problem:updated", { detail: currentProblem }));

    console.log("🆕 Nový příklad:", text);
  }

  function prepareUnitsForTopic() {
    if (!unitSelect) return;
    unitSelect.innerHTML = "";
    const units = selectedTopic === "vykon" ? ["W","kW","MW"] : ["J","kJ","MJ"];
    units.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u; opt.textContent = u;
      unitSelect.appendChild(opt);
    });
  }

  // -------------------- OVLÁDÁNÍ TLAČÍTEK --------------------
  startButton?.addEventListener("click", () => {
    showPractice();
    generateProblem();
    prepareUnitsForTopic();
    console.log("▶️ Kliknuto na Spustit");
  });

  backButton?.addEventListener("click", () => {
    showSetup();
  });

  newProblemButton?.addEventListener("click", () => {
    generateProblem();
  });

  // -------------------- FINISH --------------------
  console.log("✅ app_cleaned_v11.js připraven (currentProblem exportován na window).");
});
