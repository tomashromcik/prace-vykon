// ====================================================================
//  app.js — Fyzika: Práce a výkon (2025-10-22, verze s přepínáním obrazovek)
// ====================================================================

console.log("Načítání app.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");

  let selectedMode = null;
  let selectedLevel = null;
  let currentProblem = null;

  // --- ZÁKLADNÍ ELEMENTY ---
  const startButton = document.getElementById("start-button");
  const newProblemButton = document.getElementById("new-problem-button");
  const addRowBtn = document.getElementById("add-zapis-row-button");
  const checkZapisBtn = document.getElementById("check-zapis-button");
  const problemTextEl = document.getElementById("problem-text");
  const zapisContainer = document.getElementById("zapis-container");
  const zapisFeedback = document.getElementById("zapis-feedback-container");

  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");

  // --- VÝBĚR OBTÍŽNOSTI A REŽIMU ---
  document.querySelectorAll('[id^="mode-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      selectedMode = btn.id.includes("practice") ? "practice" : "test";
      console.log(`🎓 Režim zvolen: ${selectedMode}`);
      startButton.disabled = false;
    });
  });

  document.querySelectorAll('[id^="level-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      selectedLevel = btn.id.includes("normal") ? "normal" : "easy";
      console.log(`🎯 Obtížnost zvolena: ${selectedLevel}`);
      startButton.disabled = false;
    });
  });

  startButton.addEventListener("click", () => {
    generateProblem();
    resetZapis();
    console.log("▶️ Spuštěno");

    // 🔧 přepnutí obrazovek:
    setupScreen?.classList.add("hidden");
    practiceScreen?.classList.remove("hidden");
  });

  newProblemButton.addEventListener("click", () => {
    generateProblem();
    resetZapis();
    setupScreen?.classList.add("hidden");
    practiceScreen?.classList.remove("hidden");
  });

  addRowBtn.addEventListener("click", () => addZapisRow());

  // -------------------- GENERÁTOR PŘÍKLADŮ --------------------
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
    problemTextEl.textContent = text;
    console.log("🆕 Nový příklad:", text);
  }

  // -------------------- TVORBA ŘÁDKU ZÁPISU --------------------
  function addZapisRow(symbol = "-", value = "", unit = "-", baseHint = false) {
    const symbols = ["-","F","s","W"];
    const units = ["-","mm","cm","m","km","J","kJ","MJ","N","kN","MN"];

    const row = document.createElement("div");
    row.className = "grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";

    const sSel = createSelect(symbols, symbol, "zapis-symbol");
    const val = createInput(value);
    const uSel = createSelect(units, unit, "zapis-unit");

    const lab = document.createElement("label");
    lab.className = "flex items-center gap-2 text-sm text-gray-300";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "zapis-unknown h-4 w-4";
    const sp = document.createElement("span");
    sp.textContent = "Hledaná veličina";
    lab.append(cb, sp);

    cb.addEventListener("change", () => {
      val.value = cb.checked ? "?" : "";
      val.disabled = cb.checked;
      rowLiveValidate(row);
    });

    [sSel, val, uSel].forEach(el => el.addEventListener("input", () => rowLiveValidate(row)));

    row.append(sSel, val, uSel, lab);
    zapisContainer.appendChild(row);

    if (baseHint) {
      const hint = document.createElement("div");
      hint.className = "text-sm text-yellow-400 mt-1 italic col-span-4";
      hint.textContent = "💡 Převeď tuto veličinu na základní jednotku.";
      zapisContainer.appendChild(hint);
    }
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

  // -------------------- JEDNOTKY A FAKTORY --------------------
  const symbolToKind = { s:"length", F:"force", W:"energy" };
  const baseUnit = { length:"m", force:"N", energy:"J" };
  const unitToBase = {
    mm:1/1000, cm:1/100, m:1, km:1000,
    N:1, kN:1000, MN:1_000_000,
    J:1, kJ:1000, MJ:1_000_000
  };

  function parseNum(s) {
    if (!s) return NaN;
    return parseFloat(String(s).replace(",", "."));
  }

  function almostEqual(a, b, rel = 0.05) {
    return Math.abs(a - b) <= Math.abs(b) * rel;
  }

  // -------------------- LIVE VALIDACE --------------------
  function rowLiveValidate(row) {
    row.classList.remove("ring-2","ring-red-500","ring-green-500");
    zapisFeedback.innerHTML = "";

    const symbol = row.querySelector(".zapis-symbol").value;
    const valueStr = row.querySelector(".zapis-value").value.trim();
    const unit = row.querySelector(".zapis-unit").value;
    const unknown = row.querySelector(".zapis-unknown").checked;

    if (symbol === "-" || unit === "-" || (!unknown && valueStr === "")) return;
    const kind = symbolToKind[symbol];
    if (!kind) return;

    const given = currentProblem?.givens?.find(g => g.symbol === symbol);
    if (!given) return;

    const factor = unitToBase[unit];
    if (!factor) return;

    if (!unknown) {
      const val = parseNum(valueStr);
      if (isNaN(val)) {
        row.classList.add("ring-2","ring-red-500");
        toast("❌ Hodnota musí být číslo.");
        return;
      }

      const inBase = val * factor;
      const expected = given.value;

      if (almostEqual(inBase, expected)) {
        row.classList.add("ring-2","ring-green-500");
      } else {
        row.classList.add("ring-2","ring-red-500");
        toast(`❌ Hodnota ${symbol} neodpovídá zadání (${val}${unit} ≠ ${expected}${given.unit}).`);
      }

      if (unit !== given.unit) maybeAddBaseConversionRow(symbol, given.unit);
    }
  }

  // -------------------- AUTO PŘEVOD --------------------
  function maybeAddBaseConversionRow(symbol, baseU) {
    const rows = [...document.querySelectorAll(".zapis-row")];
    const exist = rows.some(r =>
      r.querySelector(".zapis-symbol").value === symbol &&
      r.querySelector(".zapis-unit").value === baseU
    );
    if (!exist) {
      addZapisRow(symbol, "", baseU, true);
      toast(`💡 Přidej převod ${symbol} na ${baseU}.`);
    }
  }

  // -------------------- TOAST FUNKCE --------------------
  function toast(msg) {
    const d = document.createElement("div");
    d.className = "text-yellow-300 text-sm mt-1 transition-opacity duration-500";
    d.textContent = msg;
    zapisFeedback.appendChild(d);
    setTimeout(() => d.remove(), 5000);
  }

  function resetZapis() {
    zapisContainer.innerHTML = "";
    zapisFeedback.innerHTML = "";
    addZapisRow();
  }

  console.log("✅ Logika aplikace úspěšně načtena.");
});
