// ====================================================================
//  app.js — Fyzika: Práce a výkon (verze 2025-10-18, s novými zadáními)
// ====================================================================

console.log("Načítání app.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");

  let selectedMode = null;
  let selectedLevel = null;
  let selectedTopic = "prace";
  let currentProblem = null;

  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");
  const startButton = document.getElementById("start-button");
  const topicSelect = document.getElementById("topic-select");

  // ---------- Volba režimu / obtížnosti ----------
  document.querySelectorAll('[id^="mode-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll('[id^="mode-"]').forEach(b => b.classList.remove("ring-2", "ring-blue-500"));
      btn.classList.add("ring-2", "ring-blue-500");
      selectedMode = btn.id.includes("practice") ? "practice" : "test";
      updateStartButtonState();
    });
  });

  document.querySelectorAll('[id^="level-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll('[id^="level-"]').forEach(b => b.classList.remove("ring-2", "ring-blue-500"));
      btn.classList.add("ring-2", "ring-blue-500");
      if (btn.id.includes("easy")) selectedLevel = "easy";
      if (btn.id.includes("normal")) selectedLevel = "normal";
      if (btn.id.includes("hard")) selectedLevel = "hard";
      updateStartButtonState();
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

  // ---------- Spuštění ----------
  startButton?.addEventListener("click", () => {
    setupScreen.classList.add("hidden");
    practiceScreen.classList.remove("hidden");
    resetToZapis(true);
    generateProblem();
  });

  // ---------- Přidávání řádku ----------
  document.getElementById("add-zapis-row-button")?.addEventListener("click", () => {
    addZapisRow();
  });

  function addZapisRow(symbol = "-", value = "", unit = "-", baseHint = false) {
    const c = document.getElementById("zapis-container");
    if (!c) return;

    const symEasy = ["-", "F", "s", "W"];
    const unitEasy = ["-", "cm", "m", "km", "J", "kJ", "MJ", "N", "kN", "MN"];
    let sy = symEasy, un = unitEasy;

    if (selectedLevel === "hard" || selectedLevel === "normal") {
      sy = ["-", "F", "s", "W", "P", "t", "m"];
      un = ["-", "mm", "cm", "m", "km", "J", "kJ", "MJ", "N", "kN", "MN", "W", "kW", "MW", "g", "kg", "t", "s", "min", "h"];
    }

    const row = document.createElement("div");
    row.className = "grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";

    const sSel = document.createElement("select");
    sSel.className = "zapis-symbol p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500";
    sy.forEach(x => { const o = document.createElement("option"); o.value = x; o.textContent = x; sSel.appendChild(o); });
    sSel.value = symbol;

    const val = document.createElement("input");
    val.type = "text"; val.placeholder = "Hodnota"; val.value = value;
    val.className = "zapis-value p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500";

    const uSel = document.createElement("select");
    uSel.className = "zapis-unit p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500";
    un.forEach(x => { const o = document.createElement("option"); o.value = x; o.textContent = x; uSel.appendChild(o); });
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
    });

    [sSel, val, uSel, cb].forEach(el => {
      el.addEventListener("input", () => validateAndRender());
      el.addEventListener("change", () => validateAndRender());
    });

    row.append(sSel, val, uSel, lab);
    c.appendChild(row);

    if (baseHint) {
      const hint = document.createElement("div");
      hint.className = "text-sm text-yellow-400 mt-1 italic col-span-4";
      hint.textContent = "💡 Převeď tuto veličinu na základní jednotku.";
      c.appendChild(hint);
    }
  }

  // ---------- Nový příklad ----------
  document.getElementById("new-problem-button")?.addEventListener("click", () => {
    generateProblem();
    resetToZapis(true);
  });

  // ---------- Databáze příkladů ----------
  const topics = {
    prace: {
      units: ["J", "kJ"],
      examples: [
        { text: "Auto působí silou 2 000 N na vzdálenost 5 m. Jakou práci vykoná?", givens: [{ symbol: "F", value: 2000, unit: "N" }, { symbol: "s", value: 5, unit: "m" }], result: 2000 * 5 },
        { text: "Dělník zvedl břemeno 50 kg do výšky 2 m. Vypočítej práci.", givens: [{ symbol: "s", value: 2, unit: "m" }], result: 50 * 10 * 2 }
      ]
    },
    vykon: {
      units: ["W", "kW"],
      examples: [
        // === Nové dynamické úlohy pro úroveň normální ===
        {
          text: () => {
            const F = Math.floor(1 + Math.random() * 9); // 1–9 kN
            return `Těleso bylo přesunuto silou ${F} kN po dráze 2 m. Jaká práce byla vykonána?`;
          },
          givens: [{ symbol: "F", value: 0, unit: "N" }, { symbol: "s", value: 2, unit: "m" }],
          generator: (F) => F * 1000 * 2
        },
        {
          text: () => {
            const s = Math.floor(1 + Math.random() * 5); // 1–5 km
            const F = Math.floor(1000 + Math.random() * 4000); // 1000–5000 N
            return `Auto jelo rovnoměrným přímočarým pohybem po dráze ${s} km. Tahová síla motoru byla ${F} N.`;
          },
          givens: [{ symbol: "s", value: 0, unit: "m" }, { symbol: "F", value: 0, unit: "N" }],
          generator: (s, F) => (s * 1000) * F
        }
      ]
    }
  };

  function generateProblem() {
    const d = topics[selectedTopic];
    const base = d.examples[Math.floor(Math.random() * d.examples.length)];

    if (typeof base.text === "function") {
      // dynamické příklady
      const t = base.text();
      let F = (t.includes("kN")) ? parseInt(t.match(/(\d+)\s*kN/)[1]) : null;
      let s = (t.includes("km")) ? parseInt(t.match(/(\d+)\s*km/)[1]) : 2;

      const result = base.generator ? base.generator(s, F || s) : 0;
      currentProblem = { text: t, givens: base.givens, result };
    } else {
      currentProblem = base;
    }

    document.getElementById("problem-text").textContent = currentProblem.text;
    console.log("🆕 Nový příklad:", currentProblem.text);
  }

  // ---------- Validace ----------
  const unitSets = {
    length: ["mm", "cm", "m", "km"],
    energy: ["J", "kJ", "MJ"],
    force: ["N", "kN", "MN"],
    power: ["W", "kW", "MW"],
    mass: ["g", "kg", "t"],
    time: ["s", "min", "h"]
  };
  const symbolToKind = { s: "length", W: "energy", F: "force", P: "power", m: "mass", t: "time" };
  const baseUnit = { length: "m", energy: "J", force: "N", power: "W", mass: "kg", time: "s" };

  function toBase(v, u, k) {
    v = Number(v); if (!isFinite(v)) return null;
    switch (k) {
      case "length": if (u == "mm") return v / 1000; if (u == "cm") return v / 100; if (u == "km") return v * 1000; return v;
      case "energy": if (u == "kJ") return v * 1000; if (u == "MJ") return v * 1e6; return v;
      case "force": if (u == "kN") return v * 1000; if (u == "MN") return v * 1e6; return v;
      default: return v;
    }
  }

  function nearly(a, b) { return Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)); }

  function collect() {
    return [...document.querySelectorAll("#zapis-container .zapis-row")].map(r => {
      const s = r.querySelector(".zapis-symbol").value.trim();
      const u = r.querySelector(".zapis-unit").value.trim();
      const raw = r.querySelector(".zapis-value").value.trim();
      const unk = r.querySelector(".zapis-unknown").checked;
      const val = (!unk && raw && raw != "?") ? Number(raw.replace(",", ".")) : null;
      return { symbol: s, unit: u, value: val, raw, unknown: unk, row: r };
    });
  }

  function validateZapis() {
    const z = collect(), errors = [], warnings = [], conversions = [];
    const summary = z.map((r, i) => `${i + 1}. ${r.symbol} = ${r.unknown ? "?" : r.raw || ""} ${r.unit}`).join("\n");

    z.forEach(r => {
      const k = symbolToKind[r.symbol];
      if (k && !unitSets[k].includes(r.unit))
        errors.push(`Veličina ${r.symbol} neodpovídá jednotce ${r.unit}.`);
    });

    z.forEach(r => {
      const k = symbolToKind[r.symbol];
      if (!k || !r.value) return;
      const base = baseUnit[k];
      if (r.unit !== base) {
        warnings.push(`${r.symbol} je v ${r.unit} – převeď na ${base}.`);
        conversions.push({ symbol: r.symbol, base });
      }
    });

    return { errors, warnings, summary, conversions };
  }

  function validateAndRender() {
    const { errors, warnings, conversions } = validateZapis();
    renderLiveIssues(errors, warnings);
    if (conversions.length > 0) {
      conversions.forEach(c => addZapisRow(c.symbol, "", c.base, true));
    }
  }

  // ---------- Zpětná vazba ----------
  function renderLiveIssues(errors, warnings) {
    const fb = document.getElementById("zapis-feedback-container");
    if (!fb) return;
    fb.innerHTML = "";
    if (errors.length === 0 && warnings.length === 0) {
      fb.innerHTML = `<div class="feedback-correct">✅ Zápis je zatím v pořádku.</div>`;
      return;
    }
    const html = [];
    if (errors.length)
      html.push(`<div class="feedback-wrong"><b>Chyby:</b><ul>${errors.map(e => `<li>${e}</li>`).join("")}</ul></div>`);
    if (warnings.length)
      html.push(`<div class="feedback-correct"><b>Upozornění:</b><ul>${warnings.map(w => `<li>${w}</li>`).join("")}</ul></div>`);
    fb.innerHTML = html.join("");
  }

  function resetToZapis(addRow = false) {
    document.getElementById("zapis-step")?.classList.remove("hidden");
    document.getElementById("vypocet-step")?.classList.add("hidden");
    const c = document.getElementById("zapis-container");
    const fb = document.getElementById("zapis-feedback-container");
    if (c) c.innerHTML = "";
    if (fb) fb.innerHTML = "";
    if (addRow) addZapisRow();
  }

  console.log("✅ Logika aplikace úspěšně načtena.");
});
