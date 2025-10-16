// ====================================================================
//  app.js — Fyzika: Práce a výkon (verze 2025-10-17, stabilní + živá validace)
// ====================================================================

console.log("Načítání app.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");

  // ---------- Globální proměnné ----------
  let selectedMode = null;
  let selectedLevel = null;
  let selectedTopic = "prace";
  let currentProblem = null;

  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");
  const startButton = document.getElementById("start-button");
  const topicSelect = document.getElementById("topic-select");

  // ---------- Režim a obtížnost ----------
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

  // ---------- Spuštění aplikace ----------
  startButton?.addEventListener("click", () => {
    setupScreen.classList.add("hidden");
    practiceScreen.classList.remove("hidden");
    resetToZapis(true);
    generateProblem();
  });

  // ---------- Přidávání řádku ----------
  document.getElementById("add-zapis-row-button")?.addEventListener("click", () => {
    const c = document.getElementById("zapis-container");
    if (!c) return;

    const symEasy = ["-", "F", "s", "W"];
    const unitEasy = ["-", "cm", "m", "km", "J", "kJ", "MJ", "N", "kN", "MN"];
    let sy = symEasy, un = unitEasy;

    if (selectedLevel === "hard") {
      sy = ["-", "F", "s", "W", "P", "t", "m"];
      un = ["-", "mm", "cm", "m", "km", "J", "kJ", "MJ", "N", "kN", "MN", "W", "kW", "MW", "g", "kg", "t", "s", "min", "h"];
    }

    const row = document.createElement("div");
    row.className = "grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";

    const sSel = document.createElement("select");
    sSel.className = "zapis-symbol p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500";
    sy.forEach(x => { const o = document.createElement("option"); o.value = x; o.textContent = x; sSel.appendChild(o); });

    const val = document.createElement("input");
    val.type = "text"; val.placeholder = "Hodnota";
    val.className = "zapis-value p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500";

    const uSel = document.createElement("select");
    uSel.className = "zapis-unit p-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500";
    un.forEach(x => { const o = document.createElement("option"); o.value = x; o.textContent = x; uSel.appendChild(o); });

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

    row.append(sSel, val, uSel, lab);
    c.appendChild(row);
    // Aktivace validace pro nové prvky
[sSel, val, uSel, cb].forEach(el => {
  el.addEventListener("input", () => {
    const { errors, warnings } = validateZapis();
    renderLiveIssues(errors, warnings);
  });
  el.addEventListener("change", () => {
    const { errors, warnings } = validateZapis();
    renderLiveIssues(errors, warnings);
  });
});

  });

  // ---------- Nový příklad ----------
  document.getElementById("new-problem-button")?.addEventListener("click", () => {
    generateProblem();
    resetToZapis(true);
  });

  // ---------- Kontrola zápisu ----------
  document.getElementById("check-zapis-button")?.addEventListener("click", () => {
    const { errors, warnings, summary } = validateZapis();
    renderSummary(summary);
    renderIssues(errors, warnings);
    if (errors.length === 0) {
      feedback("✅ Zápis v pořádku! Pokračuj na výpočet.", true);
      document.getElementById("zapis-step")?.classList.add("hidden");
      document.getElementById("vypocet-step")?.classList.remove("hidden");
      renderReview(summary);
    } else {
      feedback("❌ Zápis obsahuje chyby – oprav je, než budeš pokračovat.", false);
    }
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
        { text: "Motor vykonal práci 12 000 J za 4 s. Jaký byl výkon?", givens: [{ symbol: "W", value: 12000, unit: "J" }, { symbol: "t", value: 4, unit: "s" }], result: 12000 / 4 },
        { text: "Čerpadlo vykonává práci 24 kJ za 8 s. Jaký je výkon?", givens: [{ symbol: "W", value: 24000, unit: "J" }, { symbol: "t", value: 8, unit: "s" }], result: 24000 / 8 }
      ]
    }
  };

  function generateProblem() {
    const d = topics[selectedTopic];
    const ex = d.examples[Math.floor(Math.random() * d.examples.length)];
    currentProblem = ex;
    document.getElementById("problem-text").textContent = ex.text;
  }

  // ---------- Validace zápisu ----------
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
      case "power": if (u == "kW") return v * 1000; if (u == "MW") return v * 1e6; return v;
      case "mass": if (u == "g") return v / 1000; if (u == "t") return v * 1000; return v;
      case "time": if (u == "min") return v * 60; if (u == "h") return v * 3600; return v;
    }
    return null;
  }

  function nearly(a, b) { return Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)); }

  function collect() {
    return [...document.querySelectorAll("#zapis-container .zapis-row")].map(r => {
      const s = r.querySelector(".zapis-symbol").value.trim();
      const u = r.querySelector(".zapis-unit").value.trim();
      const raw = r.querySelector(".zapis-value").value.trim();
      const unk = r.querySelector(".zapis-unknown").checked;
      const val = (!unk && raw && raw != "?") ? Number(raw.replace(",", ".")) : null;
      return { symbol: s, unit: u, value: val, raw, unknown: unk };
    });
  }

  function validateZapis() {
    const z = collect(), errors = [], warnings = [];
    const summary = z.map((r, i) => `${i + 1}. ${r.symbol} = ${r.unknown ? "?" : r.raw || ""} ${r.unit}`).join("\n");
    z.forEach(r => {
      const k = symbolToKind[r.symbol];
      if (k && !unitSets[k].includes(r.unit)) errors.push(`Veličina ${r.symbol} neodpovídá jednotce ${r.unit}.`);
    });
    const g = currentProblem?.givens || [];
    g.forEach(gv => {
      const k = symbolToKind[gv.symbol];
      const r = z.find(x => x.symbol == gv.symbol && !x.unknown);
      if (!r) return;
      if (r.raw == "?" || r.value == null) { errors.push(`U ${gv.symbol} chybí hodnota.`); return; }
      const bg = toBase(gv.value, gv.unit, k), br = toBase(r.value, r.unit, k);
      if (bg == null || br == null) return;
      if (nearly(bg, br)) {
        const base = baseUnit[k];
        if (gv.unit !== base && r.unit === gv.unit)
          warnings.push(`${gv.symbol} je v ${r.unit} – převeď na ${base}.`);
      } else errors.push(`${gv.symbol} neodpovídá zadání.`);
    });
    if (z.length === 0) errors.push("Zápis je prázdný – přidej alespoň jednu veličinu.");
    return { errors, warnings, summary };
  }

  // ---------- ŽIVÁ VALIDACE ----------
  function attachLiveValidation() {
    const container = document.getElementById("zapis-container");
    if (!container) return;
    container.addEventListener("input", debounce(() => {
      const { errors, warnings } = validateZapis();
      renderLiveIssues(errors, warnings);
    }, 400));
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
  }

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

  // ---------- Pomocné funkce ----------
  function renderSummary(text) {
    const fb = document.getElementById("zapis-feedback-container");
    fb.innerHTML = `<div class="p-3 bg-gray-900 border border-gray-700 rounded mb-3">
      <div class="font-semibold mb-2 text-gray-300">Souhrn zápisu:</div>
      <pre class="text-gray-200 text-sm whitespace-pre-wrap">${text}</pre>
    </div>`;
  }

  function renderIssues(errors, warnings) {
    const fb = document.getElementById("zapis-feedback-container");
    const arr = [];
    if (errors.length)
      arr.push(`<div class="feedback-wrong"><b>Chyby:</b><ul>${errors.map(e => `<li>${e}</li>`).join("")}</ul></div>`);
    if (warnings.length)
      arr.push(`<div class="feedback-correct"><b>Doporučení:</b><ul>${warnings.map(w => `<li>${w}</li>`).join("")}</ul></div>`);
    if (!errors.length && !warnings.length)
      arr.push(`<div class="feedback-correct">👍 Zápis je v pořádku.</div>`);
    fb.insertAdjacentHTML("beforeend", arr.join(""));
  }

  function renderReview(text) {
    const r = document.getElementById("zapis-review-container");
    r.innerHTML = `<div class="p-3 bg-gray-900 border border-gray-700 rounded">
      <div class="font-semibold mb-2 text-gray-300">Souhrn zápisu:</div>
      <pre class="text-gray-200 text-sm whitespace-pre-wrap">${text}</pre>
    </div>`;
  }

  function resetToZapis(addRow = false) {
    document.getElementById("zapis-step")?.classList.remove("hidden");
    document.getElementById("vypocet-step")?.classList.add("hidden");
    document.getElementById("result-step")?.classList.add("hidden");
    const c = document.getElementById("zapis-container");
    const fb = document.getElementById("zapis-feedback-container");
    const rv = document.getElementById("zapis-review-container");
    if (c) c.innerHTML = "";
    if (fb) fb.innerHTML = "";
    if (rv) rv.innerHTML = "";
    if (addRow) document.getElementById("add-zapis-row-button")?.click();
  }

  function feedback(msg, ok) {
    const fb = document.getElementById("zapis-feedback-container");
    if (!fb) return;
    const el = document.createElement("div");
    el.className = ok ? "feedback-correct mt-2" : "feedback-wrong mt-2";
    el.textContent = msg;
    fb.appendChild(el);
    const step = document.getElementById("zapis-step");
    if (step) {
      step.classList.add("ring-2", ok ? "ring-green-500" : "ring-red-500");
      setTimeout(() => step.classList.remove("ring-2", "ring-green-500", "ring-red-500"), 600);
    }
  }

 // attachLiveValidation();
  console.log("✅ Logika aplikace úspěšně načtena.");
});
