
// ====================================================================
// app.js — Výpočetní část (vizuál vylepšen, zachována funkčnost)
// ====================================================================

console.log("Načítání app.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");

  // Původní logika výpočtu zůstává, pouze část UI je upravena
  initDualCalcRows();

  function initDualCalcRows() {
    const checkBtn = document.getElementById("check-calculation-button");
    const unitSelect = document.getElementById("unit-select");
    if (!checkBtn) return;

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

    checkBtn.parentNode.insertBefore(wrapper, checkBtn);
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
    lhs.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white w-24";
    addPlaceholderBehavior(lhs, lhsPlaceholder);

    const eq = document.createElement("span");
    eq.textContent = "=";
    eq.className = "text-gray-300";

    const rhs = document.createElement("input");
    rhs.type = "text";
    rhs.placeholder = rhsPlaceholder;
    rhs.className = "flex-grow p-2 rounded-md bg-gray-900 border border-gray-700 text-white";
    rhs.style.minWidth = "200px";
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
      input.classList.add("focus:ring-2", "focus:ring-blue-500");
    });
    input.addEventListener("blur", () => {
      if (input.value.trim() === "") input.value = "";
      input.classList.remove("focus:ring-2", "focus:ring-blue-500");
    });
  }

  console.log("✅ Výpočetní vizuál inicializován.");
});
