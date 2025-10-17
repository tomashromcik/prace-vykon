// ====================================================================
//  app.js — Fyzika: Práce a výkon (stabilní verze + modální hodnocení + symbolický výsledek)
// ====================================================================

console.log("Načítání app.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");

  let selectedMode = null;
  let selectedLevel = null;
  let currentProblem = null;

  const startButton = document.getElementById("start-button");
  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");
  const newProblemButton = document.getElementById("new-problem-button");
  const checkZapisBtn = document.getElementById("check-zapis-button");
  const addZapisRowBtn = document.getElementById("add-zapis-row-button");
  const checkCalculationButton = document.getElementById("check-calculation-button");
  const problemText = document.getElementById("problem-text");
  const zapisContainer = document.getElementById("zapis-container");
  const resultModal = document.createElement("div");

  // ============================ MODÁLNÍ HODNOCENÍ ============================
  resultModal.id = "result-modal";
  resultModal.className = "hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4";
  resultModal.innerHTML = `
    <div class="bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-2xl space-y-4 relative text-center">
      <button id="close-result-button" class="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
      <h3 class="text-xl font-semibold text-white mb-4">📊 Shrnutí a hodnocení</h3>
      <div id="result-modal-content" class="text-gray-200 text-sm leading-relaxed text-left space-y-2"></div>
      <div class="flex justify-center gap-4 mt-6">
        <button id="result-close" class="btn btn-secondary">Zavřít</button>
        <button id="result-new" class="btn btn-primary">Nový příklad</button>
      </div>
    </div>`;
  document.body.appendChild(resultModal);

  // ============================ ZVOLENÍ REŽIMU A ÚROVNĚ ============================
  document.querySelectorAll('[id^="mode-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      selectedMode = btn.id.includes("practice") ? "practice" : "test";
      document.querySelectorAll('[id^="mode-"]').forEach(b => b.classList.remove("ring-2", "ring-blue-500"));
      btn.classList.add("ring-2", "ring-blue-500");
      startButton.disabled = false;
      console.log(`🎓 Režim zvolen: ${selectedMode}`);
    });
  });

  document.querySelectorAll('[id^="level-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      selectedLevel = btn.id.includes("normal") ? "normal" : "easy";
      document.querySelectorAll('[id^="level-"]').forEach(b => b.classList.remove("ring-2", "ring-blue-500"));
      btn.classList.add("ring-2", "ring-blue-500");
      startButton.disabled = false;
      console.log(`🎯 Obtížnost zvolena: ${selectedLevel}`);
    });
  });

  startButton.addEventListener("click", () => {
    console.log("▶️ Kliknuto na Spustit");
    setupScreen.classList.add("hidden");
    practiceScreen.classList.remove("hidden");
    generateProblem();
    resetZapis();
  });

  newProblemButton.addEventListener("click", () => {
    console.log("🔁 Nový příklad");
    generateProblem();
    resetZapis();
  });

  addZapisRowBtn.addEventListener("click", addZapisRow);
  checkZapisBtn.addEventListener("click", validateZapis);
  checkCalculationButton.addEventListener("click", showFinalModal);

  // ============================ GENERÁTOR PŘÍKLADŮ ============================
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function generateProblem() {
    const variant = randInt(1, 2);
    let text, givens, result;
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
    problemText.textContent = text;
    console.log("🆕 Nový příklad:", text);
  }

  // ============================ NÁSTROJE PRO ZÁPIS ============================
  const unitToBase = {
    mm: 1 / 1000, cm: 1 / 100, m: 1, km: 1000,
    N: 1, kN: 1000, MN: 1_000_000,
    J: 1, kJ: 1000, MJ: 1_000_000
  };

  function addZapisRow() {
    const symbols = ["-", "F", "s", "W"];
    const units = ["-", "mm", "cm", "m", "km", "J", "kJ", "MJ", "N", "kN", "MN"];
    const row = document.createElement("div");
    row.className = "grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row p-2 rounded-lg bg-gray-800 border border-gray-700";

    const symbolSel = createSelect(symbols, "-", "zapis-symbol");
    const valInput = createInput("");
    const unitSel = createSelect(units, "-", "zapis-unit");
    const chkBox = document.createElement("input");
    chkBox.type = "checkbox";
    chkBox.className = "zapis-unknown h-4 w-4";
    const label = document.createElement("label");
    label.className = "flex items-center gap-2 text-sm text-gray-300";
    label.append(chkBox, document.createTextNode("Hledaná veličina"));

    row.append(symbolSel, valInput, unitSel, label);
    zapisContainer.appendChild(row);

    [symbolSel, valInput, unitSel].forEach(el => el.addEventListener("input", () => rowLiveValidate(row)));
    chkBox.addEventListener("change", () => {
      valInput.value = chkBox.checked ? "?" : "";
      valInput.disabled = chkBox.checked;
    });
  }

  function createSelect(options, value, cls) {
    const s = document.createElement("select");
    s.className = `${cls} p-2 rounded-md bg-gray-900 border border-gray-700 text-white`;
    options.forEach(o => {
      const opt = document.createElement("option");
      opt.value = o;
      opt.textContent = o;
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

  function parseNum(s) {
    if (!s) return NaN;
    return parseFloat(String(s).replace(",", "."));
  }

  function almostEqual(a, b, rel = 0.05) {
    return Math.abs(a - b) <= Math.abs(b) * rel;
  }

  function rowLiveValidate(row) {
    row.classList.remove("ring-2", "ring-green-500", "ring-red-500");
    const symbol = row.querySelector(".zapis-symbol").value;
    const valueStr = row.querySelector(".zapis-value").value.trim();
    const unit = row.querySelector(".zapis-unit").value;
    if (symbol === "-" || unit === "-" || valueStr === "") return;

    const given = currentProblem?.givens?.find(g => g.symbol === symbol);
    if (!given) return;

    const val = parseNum(valueStr);
    if (isNaN(val)) {
      row.classList.add("ring-2", "ring-red-500");
      return;
    }

    const inBase = val * (unitToBase[unit] || 1);
    const expected = given.value;

    if (almostEqual(inBase, expected)) {
      row.classList.add("ring-2", "ring-green-500");
    } else {
      row.classList.add("ring-2", "ring-red-500");

      // Automatický převod jednotky
      if (Math.abs(inBase - expected) / expected > 0.05) {
        const converted = expected / (unitToBase[unit] || 1);
        const newRow = row.cloneNode(true);
        newRow.querySelector(".zapis-value").value = converted.toFixed(2);
        newRow.querySelector(".zapis-unit").value = unit;
        newRow.classList.add("ring-2", "ring-blue-500");
        zapisContainer.appendChild(newRow);
      }
    }
  }

  function validateZapis() {
    const rows = [...document.querySelectorAll(".zapis-row")];
    const valid = rows.every(r => {
      const s = r.querySelector(".zapis-symbol").value;
      const v = r.querySelector(".zapis-value").value.trim();
      const u = r.querySelector(".zapis-unit").value;
      return s !== "-" && u !== "-" && v !== "";
    });
    if (valid) {
      document.getElementById("zapis-step").classList.add("hidden");
      document.getElementById("vypocet-step").classList.remove("hidden");
    }
  }

  // ============================ MODÁLNÍ HODNOCENÍ ============================
  function showFinalModal() {
    const formula = document.getElementById("formula-input").value.trim();
    const subs = document.getElementById("substitution-input").value.trim();
    const ans = document.getElementById("user-answer").value.trim();
    const uSel = document.getElementById("unit-select").value;
    const modal = document.getElementById("result-modal");
    const content = document.getElementById("result-modal-content");

    const expected = currentProblem.result;
    const userNum = parseNum(ans.replace(/[A-Za-z=]/g, ""));
    const correct = almostEqual(userNum * (unitToBase[uSel] || 1), expected);

    let feedback = `<p><strong>Zadání:</strong> ${currentProblem.text}</p><hr class='my-2 border-gray-600'>`;
    feedback += `<p><strong>Tvůj zápis:</strong></p>`;

    [...document.querySelectorAll(".zapis-row")].forEach(r => {
      const s = r.querySelector(".zapis-symbol").value;
      const v = r.querySelector(".zapis-value").value.trim();
      const u = r.querySelector(".zapis-unit").value;
      feedback += `<p>${s} = ${v} ${u}</p>`;
    });

    feedback += `<hr class='my-2 border-gray-600'>`;
    feedback += `<p><strong>Vzorec:</strong> ${formula}</p>`;
    feedback += `<p><strong>Dosazení:</strong> ${subs}</p>`;
    feedback += `<p><strong>Výsledek:</strong> ${ans.startsWith("W=") || ans.startsWith("F=") || ans.startsWith("s=") ? ans : "⚠️ Výsledek by měl začínat hledanou veličinou!"} ${uSel}</p>`;

    if (correct)
      feedback += `<p class='text-green-400 font-semibold mt-2'>✅ Správný výsledek! Skvělá práce.</p>`;
    else
      feedback += `<p class='text-red-400 font-semibold mt-2'>❌ Výsledek není správný. Zkontroluj převody jednotek nebo dosazení.</p>`;

    content.innerHTML = feedback;
    modal.classList.remove("hidden");

    document.getElementById("result-close").onclick = () => modal.classList.add("hidden");
    document.getElementById("close-result-button").onclick = () => modal.classList.add("hidden");
    document.getElementById("result-new").onclick = () => {
      modal.classList.add("hidden");
      generateProblem();
      resetZapis();
    };
  }

  // ============================ RESET ZÁPISU ============================
  function resetZapis() {
    zapisContainer.innerHTML = "";
    addZapisRow();
  }

  console.log("✅ Logika aplikace úspěšně načtena.");
});
