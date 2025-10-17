
// ====================================================================
// app.js — Finální verze
// Kombinuje původní funkční logiku + nový vizuál výpočtové části (LHS = RHS)
// ====================================================================

console.log("Načítání app.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");

  // -------------------- STAV --------------------
  let selectedMode = null;
  let selectedLevel = null;
  let selectedTopic = "prace";

  // -------------------- DOM ELEMENTY --------------------
  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");
  const startButton = document.getElementById("start-button");
  const backButton = document.getElementById("back-button");
  const newProblemButton = document.getElementById("new-problem-button");
  const topicSelect = document.getElementById("topic-select");
  const checkCalcBtn = document.getElementById("check-calculation-button");
  const unitSelect = document.getElementById("unit-select");

  // -------------------- VÝBĚR REŽIMŮ --------------------
  function markActive(groupSelector, activeBtn) {
    document.querySelectorAll(groupSelector).forEach(b => {
      b.classList.remove("ring-2","ring-blue-500","bg-blue-600","text-white");
      b.classList.add("btn-secondary");
    });
    activeBtn.classList.add("ring-2","ring-blue-500","bg-blue-600","text-white");
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
  startButton?.addEventListener("click", () => {
    setupScreen.classList.add("hidden");
    practiceScreen.classList.remove("hidden");
    console.log("▶️ Spuštěno");
  });

  backButton?.addEventListener("click", () => {
    practiceScreen.classList.add("hidden");
    setupScreen.classList.remove("hidden");
  });

  newProblemButton?.addEventListener("click", () => {
    console.log("🆕 Nový příklad");
  });

  // -------------------- VÝPOČET: NOVÝ VIZUÁL --------------------
  initDualCalcRows();

  function initDualCalcRows() {
    if (!checkCalcBtn) return;

    const wrapper = document.createElement("div");
    wrapper.id = "dual-calc-wrapper";
    wrapper.className = "space-y-4 mb-4";

    wrapper.appendChild(makeDualRow({
      key: "formula",
      label: "Vzorec",
      lhsPlaceholder: "např. W",
      rhsPlaceholder: "např. F * s"
    }));

    wrapper.appendChild(makeDualRow({
      key: "substitution",
      label: "Dosazení",
      lhsPlaceholder: "např. W",
      rhsPlaceholder: "např. 1000 * 2"
    }));

    wrapper.appendChild(makeDualRow({
      key: "result",
      label: "Výsledek",
      lhsPlaceholder: "např. W",
      rhsPlaceholder: "např. 2000",
      includeUnit: true,
      unitSelect
    }));

    checkCalcBtn.parentNode.insertBefore(wrapper, checkCalcBtn);
  }

  function makeDualRow({ key, label, lhsPlaceholder, rhsPlaceholder, includeUnit = false, unitSelect = null }) {
    const wrap = document.createElement("div");
    const lab = document.createElement("label");
    lab.className = "block text-sm text-gray-400 mb-1";
    lab.textContent = `${label}:`;
    wrap.appendChild(lab);

    const row = document.createElement("div");
    row.className = "flex items-center gap-2";

    const lhs = document.createElement("input");
    lhs.type = "text";
    lhs.placeholder = lhsPlaceholder;
    lhs.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white w-28";
    addPlaceholderBehavior(lhs, lhsPlaceholder);

    const eq = document.createElement("span");
    eq.textContent = "=";
    eq.className = "text-gray-300";

    const rhs = document.createElement("input");
    rhs.type = "text";
    rhs.placeholder = rhsPlaceholder;
    rhs.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white flex-grow";
    rhs.style.minWidth = "300px";
    addPlaceholderBehavior(rhs, rhsPlaceholder);

    row.append(lhs, eq, rhs);

    if (includeUnit && unitSelect) {
      const cloneSelect = unitSelect.cloneNode(true);
      cloneSelect.id = `${key}-unit`;
      cloneSelect.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white w-24";
      row.appendChild(cloneSelect);
    }

    wrap.appendChild(row);
    return wrap;
  }

  function addPlaceholderBehavior(input, placeholderText) {
    input.addEventListener("focus", () => {
      if (input.value === "" || input.value === placeholderText) input.value = "";
      input.classList.add("focus:ring-2","focus:ring-blue-500");
    });
    input.addEventListener("blur", () => {
      if (input.value.trim() === "") input.value = "";
      input.classList.remove("focus:ring-2","focus:ring-blue-500");
    });
  }

  console.log("✅ Finální logika + vizuál výpočtu načteny.");
});
