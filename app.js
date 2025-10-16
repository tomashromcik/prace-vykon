// ====================================================================
//  app.js — Fyzika: Práce a výkon
//  2025-10-18 • kontrola zápisu -> výpočet, sloučené převody v přepisu,
//                 kontrola "Hledaná veličina", úlohy kN/km pro „Normal“
// ====================================================================

console.log("Načítání app.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");

  // ---------- Stav ----------
  let selectedMode = null;     // "practice" | "test"
  let selectedLevel = null;    // "easy" | "normal" | "hard"
  let selectedTopic = "prace"; // necháváme pro kompatibilitu
  let currentProblem = null;

  // ---------- DOM ----------
  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");

  const startButton = document.getElementById("start-button");
  const backButton = document.getElementById("back-button");
  const newProblemButton = document.getElementById("new-problem-button");
  const topicSelect = document.getElementById("topic-select");

  const addRowBtn = document.getElementById("add-zapis-row-button");
  const checkZapisBtn = document.getElementById("check-zapis-button");

  const zapisStep = document.getElementById("zapis-step");
  const vypocetStep = document.getElementById("vypocet-step");
  const resultStep = document.getElementById("result-step");

  const problemTextEl = document.getElementById("problem-text");
  const zapisContainer = document.getElementById("zapis-container");
  const zapisFeedback = document.getElementById("zapis-feedback-container");
  const zapisReview = document.getElementById("zapis-review-container");

  // ---------- Volba režimu / obtížnosti ----------
  document.querySelectorAll('[id^="mode-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll('[id^="mode-"]').forEach(b => b.classList.remove("ring-2","ring-blue-500"));
      btn.classList.add("ring-2","ring-blue-500");
      selectedMode = btn.id.includes("practice") ? "practice" : "test";
      updateStartButtonState();
      console.log(`🎓 Režim zvolen: ${selectedMode}`);
    });
  });

  document.querySelectorAll('[id^="level-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll('[id^="level-"]').forEach(b => b.classList.remove("ring-2","ring-blue-500"));
      btn.classList.add("ring-2","ring-blue-500");
      if (btn.id.includes("easy")) selectedLevel = "easy";
      if (btn.id.includes("normal")) selectedLevel = "normal";
      if (btn.id.includes("hard")) selectedLevel = "hard";
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

  // ---------- Spustit ----------
  startButton?.addEventListener("click", () => {
    console.log("▶️ Kliknuto na Spustit");
    setupScreen.classList.add("hidden");
    practiceScreen.classList.remove("hidden");
    resetToZapis(true);
    generateProblem();
  });

  // ---------- Zpět na výběr ----------
  backButton?.addEventListener("click", () => {
    console.log("↩️ Zpět na výběr");
    practiceScreen.classList.add("hidden");
    setupScreen.classList.remove("hidden");
    clearPractice();
  });

  // ---------- Nový příklad ----------
  newProblemButton?.addEventListener("click", () => {
    console.log("🆕 Klik: Nový příklad");
    generateProblem();
    resetToZapis(true);
  });

  // ---------- Přidat řádek ----------
  addRowBtn?.addEventListener("click", () => addZapisRow());

  // ---------- Kontrola zápisu ----------
  checkZapisBtn?.addEventListener("click", () => {
    console.log("🧪 Klik: Zkontrolovat zápis");

    const rows = collect();
    const check = validateZapisFull(rows); // plná kontrola pro tlačítko
    renderSummary(mergedSummary(rows));     // sloučené převody na jeden řádek
    renderIssues(check.errors, check.warnings);

    // nabídni/doplň převody (base řádky), pokud chybí
    if (check.conversions.length > 0) {
      const existing = rows.map(r => `${r.symbol}:${r.unit}`).join("|");
      check.conversions.forEach(c => {
        const key = `${c.symbol}:${c.base}`;
        if (!existing.includes(key)) addZapisRow(c.symbol, "", c.base, true);
      });
    }

    // pokud vše OK -> přejdi na Výpočet
    if (check.errors.length === 0) {
      console.log("✅ Zápis OK — přechod na Výpočet");
      zapisStep?.classList.add("hidden");
      vypocetStep?.classList.remove("hidden");
      // zobraz přepis i ve „review“
      if (zapisReview) {
        zapisReview.innerHTML = `
          <div class="p-3 bg-gray-900 border border-gray-700 rounded">
            <div class="font-semibold mb-2 text-gray-300">Souhrn zápisu:</div>
            <pre class="text-gray-200 text-sm whitespace-pre-wrap">${mergedSummary(rows)}</pre>
          </div>
        `;
      }
    }
  });

  // ====================================================================
  //  GENERÁTOR ÚLOH — jen dvě nové úlohy pro "Normální"
  // ====================================================================

  function randInt(min, maxInclusive) {
    return Math.floor(Math.random() * (maxInclusive - min + 1)) + min;
  }

  function generateProblem() {
    let text, givens, result;

    if (selectedLevel === "normal") {
      const variant = randInt(1, 2);

      if (variant === 1) {
        // 1) F = x kN, s = 2 m
        const FkN = randInt(1, 9);      // 1–9 kN
        const s_m = 2;
        text = `Těleso bylo přesunuto silou ${FkN} kN po dráze ${s_m} m. Jaká práce byla vykonána?`;
        givens = [
          { symbol: "F", value: FkN, unit: "kN" },
          { symbol: "s", value: s_m, unit: "m" }
        ];
        result = (FkN * 1000) * s_m;    // W = F*s (N*m)
      } else {
        // 2) s = x km, F = x N
        const s_km = randInt(1, 5);       // 1–5 km
        const F_N  = randInt(1000, 5000); // 1000–5000 N
        text = `Auto jelo rovnoměrným přímočarým pohybem po dráze ${s_km} km. Tahová síla motoru byla ${F_N} N.`;
        givens = [
          { symbol: "s", value: s_km, unit: "km" },
          { symbol: "F", value: F_N, unit: "N" }
        ];
        result = (s_km * 1000) * F_N;     // W = F*s (N*m)
      }
    } else {
      // fallback pro easy/hard — udržím kN/km, aby se nevracely staré úlohy
      const FkN = randInt(1, 3);
      const s_km = randInt(1, 2);
      text = `Zjednodušené: Síla ${FkN} kN a dráha ${s_km} km. Určete práci.`;
      givens = [
        { symbol: "F", value: FkN, unit: "kN" },
        { symbol: "s", value: s_km, unit: "km" }
      ];
      result = (FkN * 1000) * (s_km * 1000);
    }

    currentProblem = { text, givens, result };
    problemTextEl.textContent = text;
    console.log("🆕 Nový příklad:", text);
  }

  // ====================================================================
  //  ZÁPIS — přidávání řádků + živá validace + hinty na převod
  // ====================================================================

  function addZapisRow(symbol = "-", value = "", unit = "-", baseHint = false) {
    if (!zapisContainer) return;

    const symBase = ["-","F","s","W"];
    const unitBase = ["-","mm","cm","m","km","J","kJ","MJ","N","kN","MN","W","kW","MW","g","kg","t","s","min","h"];

    const sy = (selectedLevel === "normal" || selectedLevel === "hard") ? ["-","F","s","W","P","t","m"] : symBase;
    const un = (selectedLevel === "normal" || selectedLevel === "hard") ? unitBase : ["-","cm","m","km","J","kJ","MJ","N","kN","MN"];

    const row = document.createElement("div");
    row.className = "grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";

    const sSel = document.createElement("select");
    sSel.className = "zapis-symbol p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500";
    sy.forEach(x => { const o=document.createElement("option"); o.value=x; o.textContent=x; sSel.appendChild(o); });
    sSel.value = symbol;

    const val = document.createElement("input");
    val.type = "text"; val.placeholder = "Hodnota"; val.value = value;
    val.className = "zapis-value p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500";

    const uSel = document.createElement("select");
    uSel.className = "zapis-unit p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500";
    un.forEach(x => { const o=document.createElement("option"); o.value=x; o.textContent=x; uSel.appendChild(o); });
    uSel.value = unit;

    const lab = document.createElement("label");
    lab.className = "flex items-center gap-2 text-sm text-gray-300";
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.className = "zapis-unknown h-4 w-4";
    const sp = document.createElement("span"); sp.textContent = "Hledaná veličina";
    lab.append(cb, sp);

    cb.addEventListener("change", () => {
      if (cb.checked) { val.value = "?"; val.disabled = true; }
      else { if (val.value === "?") val.value = ""; val.disabled = false; }
      liveValidate();
    });

    [sSel, val, uSel].forEach(el => {
      el.addEventListener("input", () => liveValidate());
      el.addEventListener("change", () => liveValidate());
    });

    row.append(sSel, val, uSel, lab);
    zapisContainer.appendChild(row);

    if (baseHint) {
      const hint = document.createElement("div");
      hint.className = "text-sm text-yellow-400 mt-1 italic col-span-4";
      hint.textContent = "💡 Převeď tuto veličinu na základní jednotku.";
      zapisContainer.appendChild(hint);
    }
  }

  function liveValidate() {
    const rows = collect();
    const { errors, warnings, conversions } = validateZapisLive(rows);
    renderLiveIssues(errors, warnings);

    if (conversions.length > 0) {
      const existing = rows.map(r => `${r.symbol}:${r.unit}`).join("|");
      conversions.forEach(c => {
        const key = `${c.symbol}:${c.base}`;
        if (!existing.includes(key)) addZapisRow(c.symbol, "", c.base, true);
      });
    }
  }

  // ====================================================================
  //  VALIDACE A PŘEVODY
  // ====================================================================

  const unitSets = {
    length: ["mm","cm","m","km"],
    energy: ["J","kJ","MJ"],
    force:  ["N","kN","MN"],
    power:  ["W","kW","MW"],
    mass:   ["g","kg","t"],
    time:   ["s","min","h"]
  };
  const symbolToKind = { s:"length", W:"energy", F:"force", P:"power", m:"mass", t:"time" };
  const baseUnit = { length:"m", energy:"J", force:"N", power:"W", mass:"kg", time:"s" };

  function toBase(v, u, k) {
    v = Number(v); if (!isFinite(v)) return null;
    switch (k) {
      case "length": if (u==="mm") return v/1000; if (u==="cm") return v/100; if (u==="km") return v*1000; return v;
      case "energy": if (u==="kJ") return v*1000; if (u==="MJ") return v*1e6; return v;
      case "force":  if (u==="kN") return v*1000; if (u==="MN") return v*1e6; return v;
      case "power":  if (u==="kW") return v*1000; if (u==="MW") return v*1e6; return v;
      case "mass":   if (u==="g")  return v/1000; if (u==="t")  return v*1000; return v;
      case "time":   if (u==="min")return v*60;   if (u==="h")  return v*3600; return v;
    }
    return v;
  }

  const nearly = (a,b) => Math.abs(a-b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

  function collect() {
    return [...document.querySelectorAll("#zapis-container .zapis-row")].map(r => {
      const s = r.querySelector(".zapis-symbol").value.trim();
      const u = r.querySelector(".zapis-unit").value.trim();
      const raw = r.querySelector(".zapis-value").value.trim();
      const unk = r.querySelector(".zapis-unknown").checked;
      const val = (!unk && raw && raw!=="?") ? Number(raw.replace(",", ".")) : null;
      return { symbol: s, unit: u, value: val, raw, unknown: unk, row: r };
    });
  }

  // ŽIVÁ kontrola – mírnější (nevyžaduje hned, aby base řádek měl hodnotu)
  function validateZapisLive(rows) {
    const errors = [];
    const warnings = [];
    const conversions = [];

    // 1) Veličina × jednotka
    rows.forEach(r => {
      const kind = symbolToKind[r.symbol];
      if (!kind) return;
      if (!unitSets[kind].includes(r.unit)) {
        errors.push(`Veličina ${r.symbol} neodpovídá jednotce ${r.unit}.`);
      }
    });

    // 2) Upozorni na převod (nabídnout base řádek)
    rows.forEach(r => {
      const kind = symbolToKind[r.symbol];
      if (!kind) return;
      const base = baseUnit[kind];
      if (r.unit !== "-" && r.unit !== base) {
        warnings.push(`${r.symbol} je v ${r.unit} — převeď na ${base}.`);
        conversions.push({ symbol: r.symbol, base });
      }
    });

    // 3) alespoň jedna hledaná veličina – pouze varování v live
    const hasUnknown = rows.some(r => r.unknown);
    if (!hasUnknown) warnings.push("Označ 'Hledanou veličinu' (alespoň jednu).");

    return { errors, warnings, conversions };
  }

  // TLAČÍTKOVÁ kontrola – přísnější (vyžaduje skutečný převod + hodnoty)
  function validateZapisFull(rows) {
    const errors = [];
    const warnings = [];
    const conversions = [];

    if (rows.length === 0) {
      errors.push("Zápis je prázdný – přidej alespoň jednu veličinu.");
      return { errors, warnings, conversions };
    }

    // 1) Veličina × jednotka
    rows.forEach(r => {
      const kind = symbolToKind[r.symbol];
      if (!kind) return;
      if (!unitSets[kind].includes(r.unit)) {
        errors.push(`Veličina ${r.symbol} neodpovídá jednotce ${r.unit}.`);
      }
    });

    // 2) alespoň jedna hledaná veličina
    const hasUnknown = rows.some(r => r.unknown);
    if (!hasUnknown) {
      errors.push("Označ 'Hledanou veličinu' (alespoň jednu).");
    }

    // 3) Povinný převod do základní jednotky (pokud student použil odvozenou)
    //    -> musí existovat i řádek se stejným symbolem v base jednotce + správná hodnota
    const grouped = groupBy(rows, r => r.symbol);
    Object.entries(grouped).forEach(([symbol, arr]) => {
      const kind = symbolToKind[symbol];
      if (!kind) return;
      const base = baseUnit[kind];

      // má-li student řádek v jiné než základní jednotce, vynucujeme převod
      const nonBase = arr.filter(r => r.unit !== "-" && r.unit !== base);
      if (nonBase.length > 0) {
        const baseRows = arr.filter(r => r.unit === base);
        if (baseRows.length === 0) {
          errors.push(`Doplň převod pro ${symbol} na základní jednotku (${base}).`);
          conversions.push({ symbol, base });
        } else {
          // zkontroluj hodnoty (pokud jsou vyplněny)
          const nb = nonBase[0];
          const br = baseRows[0];
          if (nb.value != null && br.value != null) {
            const conv = toBase(nb.value, nb.unit, kind); // očekávaná base hodnota
            if (conv == null || !nearly(conv, br.value)) {
              const exp = (conv != null) ? `${pretty(conv)} ${base}` : `správný převod`;
              errors.push(`Převod ${symbol} není správně. Očekává se ${exp}.`);
            }
          } else {
            warnings.push(`Doplň hodnotu převodu pro ${symbol} v ${base}.`);
          }
        }
      }
    });

    return { errors, warnings, conversions };
  }

  function groupBy(arr, keyFn) {
    return arr.reduce((acc, x) => {
      const k = keyFn(x);
      (acc[k] ||= []).push(x);
      return acc;
    }, {});
  }

  function pretty(x) {
    // zobraz pěkně celá čísla bez .0
    return (Math.abs(x - Math.round(x)) < 1e-9) ? String(Math.round(x)) : String(x);
  }

  // ====================================================================
  //  VÝSTUPY / FEEDBACK
  // ====================================================================

  // Sloučený přepis: F=2 kN a F=2000 N -> "F = 2 kN = 2000 N"
  function mergedSummary(rows) {
    const grouped = groupBy(rows, r => r.symbol);
    const lines = [];

    Object.entries(grouped).forEach(([symbol, arr]) => {
      const kind = symbolToKind[symbol];
      if (!kind) {
        // symbol "-" apod.
        arr.forEach(r => lines.push(`${symbol} = ${r.unknown ? "?" : (r.raw || "")} ${r.unit}`.trim()));
        return;
      }
      const base = baseUnit[kind];
      const nonBase = arr.filter(r => r.unit !== "-" && r.unit !== base);
      const baseRows = arr.filter(r => r.unit === base);

      if (nonBase.length > 0 || baseRows.length > 0) {
        // poskládej řetězce ve tvaru val unit
        const parts = [];
        // pro stabilitu řadíme: nejprve všechny non-base (podle "síly" jednotky neurčujeme, jen pořadí zadání),
        // nakonec base
        nonBase.forEach(r => parts.push(`${r.unknown ? "?" : (r.raw || "")} ${r.unit}`.trim()));
        baseRows.forEach(r => parts.push(`${r.unknown ? "?" : (r.raw || "")} ${r.unit}`.trim()));

        // Odstraň prázdné části
        const clean = parts.filter(p => p && p !== "? " && p !== "?");
        if (clean.length > 0) {
          lines.push(`${symbol} = ${clean.join(" = ")}`.trim());
        } else {
          // fallback
          arr.forEach(r => lines.push(`${symbol} = ${r.unknown ? "?" : (r.raw || "")} ${r.unit}`.trim()));
        }
      } else {
        // žádné jednotky -> vypsat vše, co je
        arr.forEach(r => lines.push(`${symbol} = ${r.unknown ? "?" : (r.raw || "")} ${r.unit}`.trim()));
      }
    });

    return lines.join("\n");
  }

  function renderSummary(text) {
    if (!zapisFeedback) return;
    zapisFeedback.innerHTML = `
      <div class="p-3 bg-gray-900 border border-gray-700 rounded mb-3">
        <div class="font-semibold mb-2 text-gray-300">Souhrn zápisu:</div>
        <pre class="text-gray-200 text-sm whitespace-pre-wrap">${text}</pre>
      </div>
    `;
  }

  function renderIssues(errors, warnings) {
    if (!zapisFeedback) return;
    const parts = [];
    if (errors.length) {
      parts.push(`<div class="feedback-wrong"><b>Chyby:</b><ul>${errors.map(e=>`<li>${e}</li>`).join("")}</ul></div>`);
    }
    if (warnings.length) {
      parts.push(`<div class="feedback-correct"><b>Upozornění:</b><ul>${warnings.map(w=>`<li>${w}</li>`).join("")}</ul></div>`);
    }
    if (!errors.length && !warnings.length) {
      parts.push(`<div class="feedback-correct">✅ Zápis je v pořádku.</div>`);
    }
    // issues zobraz POD souhrnem:
    zapisFeedback.insertAdjacentHTML("beforeend", parts.join("\n"));
  }

  function renderLiveIssues(errors, warnings) {
    if (!zapisFeedback) return;
    const parts = [];
    if (errors.length) {
      parts.push(`<div class="feedback-wrong"><b>Chyby:</b><ul>${errors.map(e=>`<li>${e}</li>`).join("")}</ul></div>`);
    }
    if (warnings.length) {
      parts.push(`<div class="feedback-correct"><b>Upozornění:</b><ul>${warnings.map(w=>`<li>${w}</li>`).join("")}</ul></div>`);
    }
    if (!errors.length && !warnings.length) {
      parts.push(`<div class="feedback-correct">✅ Zápis je zatím v pořádku.</div>`);
    }
    zapisFeedback.innerHTML = parts.join("\n");
  }

  // ====================================================================
  //  POMOCNÉ
  // ====================================================================

  function resetToZapis(addFirstRow = false) {
    zapisStep?.classList.remove("hidden");
    vypocetStep?.classList.add("hidden");
    resultStep?.classList.add("hidden");
    if (zapisContainer) zapisContainer.innerHTML = "";
    if (zapisFeedback) zapisFeedback.innerHTML = "";
    if (zapisReview) zapisReview.innerHTML = "";
    if (addFirstRow) addZapisRow();
  }

  function clearPractice() {
    resetToZapis(false);
    currentProblem = null;
    if (problemTextEl) problemTextEl.textContent = "";
  }

  console.log("✅ Logika aplikace úspěšně načtena.");
});
