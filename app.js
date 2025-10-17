
// ====================================================================
// app.js — Upravená verze: Výpočet rozdělen na dvě pole (LHS = RHS)
// Zachována plná funkčnost zápisu, převodů, validací a modálních oken
// ====================================================================

console.log("Načítání app.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");

  // -------------------- Globální proměnné --------------------
  let currentProblem = null;
  let selectedLevel = null;
  let selectedMode = null;

  // -------------------- Výběr režimu / úrovně --------------------
  const modeButtons = document.querySelectorAll('[id^="mode-"]');
  const levelButtons = document.querySelectorAll('[id^="level-"]');
  const startButton = document.getElementById("start-button");
  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");

  modeButtons.forEach(b => {
    b.addEventListener("click", () => {
      selectedMode = b.id.includes("practice") ? "practice" : "test";
      modeButtons.forEach(x => x.classList.remove("ring-2", "ring-blue-500"));
      b.classList.add("ring-2", "ring-blue-500");
      enableStart();
    });
  });

  levelButtons.forEach(b => {
    b.addEventListener("click", () => {
      if (b.id.includes("easy")) selectedLevel = "easy";
      if (b.id.includes("normal")) selectedLevel = "normal";
      if (b.id.includes("hard")) selectedLevel = "hard";
      levelButtons.forEach(x => x.classList.remove("ring-2", "ring-blue-500"));
      b.classList.add("ring-2", "ring-blue-500");
      enableStart();
    });
  });

  function enableStart() {
    if (selectedMode && selectedLevel) {
      startButton.disabled = false;
      startButton.classList.remove("btn-disabled");
    }
  }

  startButton.addEventListener("click", () => {
    setupScreen.classList.add("hidden");
    practiceScreen.classList.remove("hidden");
    generateProblem();
  });

  // -------------------- Generátor příkladů --------------------
  function generateProblem() {
    const variant = Math.random() < 0.5 ? 1 : 2;
    if (variant === 1) {
      const FkN = Math.floor(Math.random() * 9) + 1;
      const s = 2;
      currentProblem = {
        text: `Těleso bylo přesunuto silou ${FkN} kN po dráze ${s} m. Jaká práce byla vykonána?`,
        givens: [
          { symbol: "F", value: FkN * 1000, unit: "N" },
          { symbol: "s", value: s, unit: "m" }
        ],
        result: FkN * 1000 * s
      };
    } else {
      const sKm = Math.floor(Math.random() * 5) + 1;
      const FN = Math.floor(Math.random() * 1200) + 800;
      currentProblem = {
        text: `Auto jelo rovnoměrným přímočarým pohybem po dráze ${sKm} km. Tahová síla motoru byla ${FN} N.`,
        givens: [
          { symbol: "s", value: sKm * 1000, unit: "m" },
          { symbol: "F", value: FN, unit: "N" }
        ],
        result: sKm * 1000 * FN
      };
    }
    document.getElementById("problem-text").textContent = currentProblem.text;
  }

  // -------------------- Sekce výpočtu --------------------
  const checkButton = document.getElementById("check-calculation-button");
  const feedbackContainer = document.getElementById("vypocet-feedback-container");

  // přidání dvoupólových řádků (LHS = RHS)
  createCalcRow("formula", "Vzorec", "W", "F * s");
  createCalcRow("substitution", "Dosazení", "W", "1000 * 2");
  createCalcRow("result", "Výsledek", "W", "");

  function createCalcRow(key, label, lhsDefault, rhsDefault) {
    const container = document.getElementById("vypocet-step");
    const wrap = document.createElement("div");
    wrap.className = "mb-4";

    const labelEl = document.createElement("label");
    labelEl.textContent = label + ":";
    labelEl.className = "block text-gray-300 mb-1";
    wrap.appendChild(labelEl);

    const row = document.createElement("div");
    row.className = "grid grid-cols-1 sm:grid-cols-6 gap-2 items-center";

    const lhsInput = document.createElement("input");
    lhsInput.type = "text";
    lhsInput.value = lhsDefault;
    lhsInput.maxLength = 2;
    lhsInput.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white w-16";
    lhsInput.id = `${key}-lhs`;

    const eq = document.createElement("div");
    eq.textContent = "=";
    eq.className = "text-center text-gray-300";

    const rhsInput = document.createElement("input");
    rhsInput.type = "text";
    rhsInput.value = rhsDefault;
    rhsInput.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white";
    rhsInput.id = `${key}-rhs`;

    row.append(lhsInput, eq, rhsInput);
    wrap.appendChild(row);
    container.insertBefore(wrap, checkButton);
  }

  // -------------------- Ověření výpočtu --------------------
  checkButton.addEventListener("click", () => {
    feedbackContainer.innerHTML = "";

    const lhsFormula = document.getElementById("formula-lhs").value.trim().toUpperCase();
    const rhsFormula = document.getElementById("formula-rhs").value.trim().replace(/\s+/g, "");
    const lhsSubs = document.getElementById("substitution-lhs").value.trim().toUpperCase();
    const rhsSubs = document.getElementById("substitution-rhs").value.trim();
    const lhsRes = document.getElementById("result-lhs").value.trim().toUpperCase();
    const rhsRes = document.getElementById("result-rhs").value.trim();

    let msg = "";

    // kontrola vzorce
    if (lhsFormula === "W" && (rhsFormula === "F*S" || rhsFormula === "S*F")) {
      msg += "<div class='text-green-400'>✅ Vzorec je správný.</div>";
    } else {
      msg += "<div class='text-red-400'>❌ Zkontroluj tvar vzorce (W = F * s).</div>";
    }

    // kontrola dosazení
    const nums = rhsSubs.replace(/\s+/g, "").split("*").map(x => parseFloat(x));
    const gF = currentProblem.givens.find(g => g.symbol === "F").value;
    const gs = currentProblem.givens.find(g => g.symbol === "s").value;
    if (lhsSubs === "W" && nums.some(n => Math.abs(n - gF) / gF < 0.05) && nums.some(n => Math.abs(n - gs) / gs < 0.05)) {
      msg += "<div class='text-green-400'>✅ Dosazení odpovídá zadání.</div>";
    } else {
      msg += "<div class='text-red-400'>❌ Dosazení nekoresponduje se zadáním.</div>";
    }

    // kontrola výsledku
    const resultVal = parseFloat(rhsRes);
    const expected = currentProblem.result;
    if (lhsRes === "W" && Math.abs(resultVal - expected) / expected < 0.05) {
      msg += "<div class='text-green-400'>✅ Výsledek správný!</div>";
    } else {
      msg += "<div class='text-red-400'>❌ Výsledek nesouhlasí.</div>";
    }

    feedbackContainer.innerHTML = msg;
  });

  console.log("✅ Logika aplikace úspěšně načtena.");
});
