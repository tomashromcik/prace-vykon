// ====================================================================
// app.js — Fyzika: Práce a výkon
// Verze: dvoupólové řádky (LHS = RHS) + modální hodnocení
// Zachována funkčnost: zvýraznění voleb, auto převody, generátor úloh,
// live validace a souhrn v modálním okně.
// ====================================================================

console.log("Načítání app.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");

  // -------------------- Stav --------------------
  let selectedMode = null;
  let selectedLevel = null;
  let currentProblem = null;

  // -------------------- Prvky UI --------------------
  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");
  const startButton = document.getElementById("start-button");
  const newProblemButton = document.getElementById("new-problem-button");

  const problemTextEl = document.getElementById("problem-text");

  // Zápis
  const zapisContainer = document.getElementById("zapis-container");
  const checkZapisBtn = document.getElementById("check-zapis-button");
  const addZapisRowBtn = document.getElementById("add-zapis-row-button");

  // Výpočet
  const vypocetStep = document.getElementById("vypocet-step");
  const zapisStep = document.getElementById("zapis-step");
  const zapisReview = document.getElementById("zapis-review-container");
  const checkCalcBtn = document.getElementById("check-calculation-button");
  const unitSelectFinal = document.getElementById("unit-select");

  // -------------------- Modal hodnocení --------------------
  initResultModal();

  // -------------------- Ovládání režimů/úrovní --------------------
  document.querySelectorAll('[id^="mode-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      selectedMode = btn.id.includes("practice") ? "practice" : "test";
      document.querySelectorAll('[id^="mode-"]').forEach(b => b.classList.remove("ring-2","ring-blue-500"));
      btn.classList.add("ring-2","ring-blue-500");
      enableStartIfReady();
      console.log("🎓 Režim zvolen:", selectedMode);
    });
  });

  document.querySelectorAll('[id^="level-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      selectedLevel = btn.id.includes("normal") ? "normal" : (btn.id.includes("hard") ? "hard" : "easy");
      document.querySelectorAll('[id^="level-"]').forEach(b => b.classList.remove("ring-2","ring-blue-500"));
      btn.classList.add("ring-2","ring-blue-500");
      enableStartIfReady();
      console.log("🎯 Obtížnost zvolena:", selectedLevel);
    });
  });

  function enableStartIfReady(){
    if(selectedMode && selectedLevel){
      startButton.disabled = false;
      startButton.classList.remove("btn-disabled");
      console.log("✅ Start povolen");
    }
  }

  startButton.addEventListener("click", () => {
    console.log("▶️ Kliknuto na Spustit");
    setupScreen.classList.add("hidden");
    practiceScreen.classList.remove("hidden");
    generateProblem();
    resetAll();
  });

  newProblemButton.addEventListener("click", () => {
    console.log("🔁 Nový příklad");
    generateProblem();
    resetAll();
  });

  // -------------------- Generátor příkladů --------------------
  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

  function generateProblem(){
    const variant = randInt(1,2);
    let text, givens, result;
    if(variant===1){
      const FkN = randInt(1,9);
      const s_m = 2;
      text = `Těleso bylo přesunuto silou ${FkN} kN po dráze ${s_m} m. Jaká práce byla vykonána?`;
      givens = [
        {symbol:"F", value: FkN*1000, unit:"N"},
        {symbol:"s", value: s_m, unit:"m"}
      ];
      result = (FkN*1000) * s_m; // J
    } else {
      const s_km = randInt(1,5);
      const F_N = randInt(800,2000);
      text = `Auto jelo rovnoměrným přímočarým pohybem po dráze ${s_km} km. Tahová síla motoru byla ${F_N} N.`;
      givens = [
        {symbol:"s", value: s_km*1000, unit:"m"},
        {symbol:"F", value: F_N, unit:"N"}
      ];
      result = (s_km*1000) * F_N; // J
    }
    currentProblem = { text, givens, result };
    problemTextEl.textContent = text;
    console.log("🆕 Nový příklad:", text);
  }

  // -------------------- Jednotky & pomocné --------------------
  const unitToBase = {
    mm:1/1000, cm:1/100, m:1, km:1000,
    N:1, kN:1000, MN:1_000_000,
    J:1, kJ:1000, MJ:1_000_000
  };
  const baseBySymbol = { F:"N", s:"m", W:"J" };
  function parseNum(x){ if(x==null) return NaN; return parseFloat(String(x).replace(",", ".")); }
  function almostEqual(a,b,rel=0.05){ return Math.abs(a-b) <= Math.abs(b)*rel; }
  function normSym(s){ return (s||"").trim().replace(/[^A-Za-z]/g,""); }

  // -------------------- Zápis: dvoupólové řádky --------------------
  addZapisRowBtn.addEventListener("click", () => addZapisRow());

  function addZapisRow(lhs="", rhs="", unit="-", unknown=false){
    const row = document.createElement("div");
    row.className = "grid grid-cols-1 sm:grid-cols-6 gap-2 zapis-row p-2 rounded-lg bg-gray-800 border border-gray-700";

    // LHS (symbol)
    const lhsInput = document.createElement("input");
    lhsInput.type = "text";
    lhsInput.maxLength = 2;
    lhsInput.placeholder = "W/F/s";
    lhsInput.value = lhs;
    lhsInput.className = "zapis-lhs p-2 rounded-md bg-gray-900 border border-gray-700 text-white w-16";

    // "="
    const eq = document.createElement("div");
    eq.className = "flex items-center justify-center text-gray-300";
    eq.textContent = "=";

    // RHS (hodnota / ?)
    const rhsInput = document.createElement("input");
    rhsInput.type = "text";
    rhsInput.placeholder = "Hodnota nebo ?";
    rhsInput.value = rhs;
    rhsInput.className = "zapis-rhs p-2 rounded-md bg-gray-900 border border-gray-700 text-white";

    // Jednotka
    const unitSel = document.createElement("select");
    ["-","mm","cm","m","km","J","kJ","MJ","N","kN","MN"].forEach(u=>{
      const opt = document.createElement("option");
      opt.value = u; opt.textContent = u; unitSel.appendChild(opt);
    });
    unitSel.value = unit;
    unitSel.className = "zapis-unit p-2 rounded-md bg-gray-900 border border-gray-700 text-white";

    // Hledaná veličina
    const lab = document.createElement("label");
    lab.className = "flex items-center gap-2 text-sm text-gray-300";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "zapis-unknown h-4 w-4";
    cb.checked = unknown;
    lab.append(cb, document.createTextNode("Hledaná veličina"));

    // placeholder pro feedback řádku
    const fb = document.createElement("div");
    fb.className = "col-span-1 sm:col-span-6 text-xs text-gray-400";

    row.append(lhsInput, eq, rhsInput, unitSel, lab, fb);
    zapisContainer.appendChild(row);

    const onChange = () => rowLiveValidate(row, fb);
    [lhsInput, rhsInput, unitSel, cb].forEach(el => el.addEventListener("input", onChange));
    onChange();
  }

  function rowLiveValidate(row, fb){
    row.classList.remove("ring-2","ring-green-500","ring-red-500","ring-blue-500");
    fb.textContent = "";
    const lhs = normSym(row.querySelector(".zapis-lhs").value.toUpperCase());
    const rhsStr = (row.querySelector(".zapis-rhs").value||"").trim();
    const unit = row.querySelector(".zapis-unit").value;
    const unknown = row.querySelector(".zapis-unknown").checked;

    if(!lhs || lhs==="-" || unit==="-") return;
    const given = (currentProblem?.givens||[]).find(g => g.symbol===lhs);
    if(!given){ fb.textContent = "Neznámá veličina – povoleno: F, s, W."; row.classList.add("ring-2","ring-red-500"); return; }

    if(unknown){
      if(rhsStr !== "?"){
        fb.textContent = "U hledané veličiny zapiš hodnotu jako „?“.";
        row.classList.add("ring-2","ring-red-500");
      }else{
        fb.textContent = "OK – hledaná veličina.";
        row.classList.add("ring-2","ring-green-500");
      }
      return;
    }

    if(rhsStr===""){ return; }

    const val = parseNum(rhsStr);
    if(Number.isNaN(val)){ fb.textContent = "Zadej číslo nebo „?“."; row.classList.add("ring-2","ring-red-500"); return; }

    // převod na základní jednotku
    const factor = unitToBase[unit] || 1;
    const inBase = val * factor;
    const expected = given.value; // v základní jednotce

    if(almostEqual(inBase, expected)){
      fb.textContent = "✅ Zápis sedí.";
      row.classList.add("ring-2","ring-green-500");
    } else {
      row.classList.add("ring-2","ring-red-500");

      // Automatický doplněk řádku s převodem do základní jednotky (pokud chybí)
      const baseU = baseBySymbol[lhs] || unit;
      const hasBaseRow = [...zapisContainer.querySelectorAll(".zapis-row")].some(r => {
        const L = normSym(r.querySelector(".zapis-lhs").value.toUpperCase());
        const U = r.querySelector(".zapis-unit").value;
        const R = r.querySelector(".zapis-rhs").value.trim();
        return L===lhs && U===baseU && R!=="" && R!=="?";
      });
      if(unit!==baseU && !hasBaseRow){
        const converted = expected / (unitToBase[unit]||1);
        addZapisRow(lhs, converted.toFixed(2), baseU, false);
        fb.textContent = "ℹ️ Přidán řádek s převodem na základní jednotku.";
        row.classList.add("ring-2","ring-blue-500");
      } else {
        fb.textContent = "❌ Hodnota nekoresponduje se zadáním.";
      }
    }
  }

  function validateWholeZapis(){
    const rows = [...zapisContainer.querySelectorAll(".zapis-row")];
    if(rows.length===0) return false;

    let ok = true;
    // musí existovat zápisy pro F a s (hodnoty), a „?“ u W
    const need = {F:false, s:false, W:false};
    rows.forEach(r=>{
      const lhs = normSym(r.querySelector(".zapis-lhs").value.toUpperCase());
      const rhsStr = r.querySelector(".zapis-rhs").value.trim();
      const unit = r.querySelector(".zapis-unit").value;
      const unknown = r.querySelector(".zapis-unknown").checked;

      if(lhs==="F" && rhsStr && unit!=="-" && !unknown) need.F = true;
      if(lhs==="s" && rhsStr && unit!=="-" && !unknown) need.s = true;
      if(lhs==="W" && unknown && rhsStr==="?") need.W = true;

      // finální revalidace pro barvu rámečku
      const fb = r.querySelector(".col-span-1.sm\\:col-span-6") || r.lastElementChild;
      rowLiveValidate(r, fb);
      if(r.classList.contains("ring-red-500")) ok = false;
    });

    return ok && need.F && need.s && need.W;
  }

  checkZapisBtn.addEventListener("click", () => {
    console.log("🧪 Klik: Zkontrolovat zápis");
    const valid = validateWholeZapis();
    if(!valid){
      toast("Doplň nebo oprav zápis: potřebuješ F a s (čísla + správné jednotky) a W jako hledanou veličinu „?“.");
      return;
    }
    // přepnout do výpočtu
    renderZapisReview();
    zapisStep.classList.add("hidden");
    vypocetStep.classList.remove("hidden");
  });

  function renderZapisReview(){
    const lines = [...zapisContainer.querySelectorAll(".zapis-row")].map(r=>{
      const L = r.querySelector(".zapis-lhs").value.trim();
      const R = r.querySelector(".zapis-rhs").value.trim();
      const U = r.querySelector(".zapis-unit").value;
      return `${L} = ${R}${U && U!=="-" ? " "+U : ""}`;
    });
    zapisReview.innerHTML = `<h4 class="text-lg font-semibold mb-2">Souhrn zápisu:</h4><p>${lines.join("<br>")}</p>`;
    // naplnění jednotek do výsledku
    unitSelectFinal.innerHTML = ""; ["J","kJ","MJ"].forEach(u=>{
      const opt = document.createElement("option"); opt.value=u; opt.textContent=u; unitSelectFinal.appendChild(opt);
    });
  }

  // -------------------- Výpočet: dvoupólové řádky --------------------
  // Vytvoříme tři řádky: Vzorec, Dosazení, Výsledek (LHS = RHS)
  ensureCalcRows();

  function ensureCalcRows(){
    // Pokud existují staré inputy, zanecháme je; jinak vytvoříme
    if(!document.getElementById("formula-lhs")){
      createCalcRow("Vzorec", "formula", {lhs:"W", rhs:"F * s"});
    }
    if(!document.getElementById("subs-lhs")){
      createCalcRow("Dosazení", "subs", {lhs:"W", rhs:"1000 * 2"});
    }
    if(!document.getElementById("result-lhs")){
      createCalcRow("Výsledek", "result", {lhs:"W", rhs:""}); // RHS je číslo
    }
  }

  function createCalcRow(labelText, key, defaults){
    const container = document.getElementById("main-calculation-step");
    const wrap = document.createElement("div");
    wrap.className = "space-y-1 mb-3";

    const lab = document.createElement("label");
    lab.className = "block text-sm text-gray-400";
    lab.textContent = labelText + ":";

    const row = document.createElement("div");
    row.className = "grid grid-cols-1 sm:grid-cols-6 gap-2 items-center";

    const lhs = document.createElement("input");
    lhs.type = "text"; lhs.maxLength = 2; lhs.placeholder = "W/F/s";
    lhs.value = defaults.lhs || "";
    lhs.id = `${key}-lhs`;
    lhs.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white w-16";

    const eq = document.createElement("div");
    eq.className = "flex items-center justify-center text-gray-300";
    eq.textContent = "=";

    const rhs = document.createElement("input");
    rhs.type = "text"; rhs.placeholder = key==="result" ? "Číslo" : (key==="formula" ? "F * s" : "1000 * 2");
    rhs.value = defaults.rhs || "";
    rhs.id = `${key}-rhs`;
    rhs.className = "p-2 rounded-md bg-gray-900 border border-gray-700 text-white";

    row.append(lhs, eq, rhs);

    // u výsledku přidáme výběr jednotky v samostatném řádku (už existuje unitSelectFinal)
    wrap.append(lab, row);
    container.insertBefore(wrap, document.getElementById("check-calculation-button"));

    // live validace
    const onChange = () => calcRowValidate(key);
    [lhs, rhs].forEach(el => el.addEventListener("input", onChange));
    onChange();
  }

  function calcRowValidate(key){
    const lhs = normSym((document.getElementById(`${key}-lhs`)?.value||"").toUpperCase());
    const rhs = (document.getElementById(`${key}-rhs`)?.value||"").trim();
    const line = document.getElementById(`${key}-rhs`);

    if(!lhs || !rhs){ setLineNeutral(line); return; }

    if(key==="formula"){
      // Pro tuto aplikaci očekáváme W = F*s (příp. s*F)
      const okLhs = lhs==="W";
      const r = rhs.replace(/\s+/g,"").replace("·","*").toUpperCase();
      const okRhs = (r==="F*S" || r==="S*F");
      setLineState(line, okLhs && okRhs);
      return;
    }

    if(key==="subs"){
      // začíná hledanou veličinou; RHS obsahuje čísla odpovídající zadání (pořadí nemusí být)
      const nums = rhs.replace(/\s+/g,"").split("*").map(x=>parseNum(x));
      const gF = currentProblem.givens.find(g=>g.symbol==="F")?.value ?? NaN;
      const gs = currentProblem.givens.find(g=>g.symbol==="s")?.value ?? NaN;

      const hasF = nums.some(n=>almostEqual(n, gF));
      const hass = nums.some(n=>almostEqual(n, gs));
      setLineState(line, lhs==="W" && hasF && hass);
      return;
    }

    if(key==="result"){
      // LHS musí být hledaná veličina (W). RHS číslo; posoudíme až při finální kontrole.
      const okLhs = lhs==="W";
      const num = parseNum(rhs);
      setLineState(line, okLhs && !Number.isNaN(num));
      return;
    }
  }

  function setLineState(inputEl, ok){
    inputEl.classList.remove("ring-2","ring-green-500","ring-red-500");
    inputEl.classList.add("ring-2", ok ? "ring-green-500" : "ring-red-500");
  }
  function setLineNeutral(inputEl){
    inputEl.classList.remove("ring-2","ring-green-500","ring-red-500");
  }

  // -------------------- Tlačítko ověřit výpočet -> modál --------------------
  checkCalcBtn.addEventListener("click", () => {
    const fL = normSym((document.getElementById("formula-lhs").value||"").toUpperCase());
    const fR = (document.getElementById("formula-rhs").value||"").trim();
    const sL = normSym((document.getElementById("subs-lhs").value||"").toUpperCase());
    const sR = (document.getElementById("subs-rhs").value||"").trim();
    const rL = normSym((document.getElementById("result-lhs").value||"").toUpperCase());
    const rR = (document.getElementById("result-rhs").value||"").trim();
    const rU = unitSelectFinal.value;

    const expected = currentProblem.result; // v J
    const userValBase = parseNum(rR) * (unitToBase[rU]||1);
    const formulaOK = (fL==="W") && (fR.replace(/\s+/g,"").replace("·","*").toUpperCase() === "F*S" || fR.replace(/\s+/g,"").replace("·","*").toUpperCase() === "S*F");
    const subsNums = sR.replace(/\s+/g,"").split("*").map(x=>parseNum(x));
    const gF = currentProblem.givens.find(g=>g.symbol==="F")?.value ?? NaN;
    const gs = currentProblem.givens.find(g=>g.symbol==="s")?.value ?? NaN;
    const subsOK = (sL==="W") && subsNums.some(n=>almostEqual(n,gF)) && subsNums.some(n=>almostEqual(n,gs));
    const resOK = (rL==="W") && almostEqual(userValBase, expected);

    const orderNote = (()=>{
      const rightOrder = fR.replace(/\s+/g,"").toUpperCase()==="F*S";
      if(!rightOrder) return "ℹ️ Pořadí dosazení můžeš psát v pořadí podle vzorce (F*s).";
      return "";
    })();

    const content = document.getElementById("result-modal-content");
    const linesZapis = [...zapisContainer.querySelectorAll(".zapis-row")].map(r=>{
      const L = r.querySelector(".zapis-lhs").value.trim();
      const R = r.querySelector(".zapis-rhs").value.trim();
      const U = r.querySelector(".zapis-unit").value;
      return `${L} = ${R}${U && U!=="-" ? " "+U : ""}`;
    }).join("<br>");

    content.innerHTML = `
      <div class="bg-gray-900 border border-gray-700 rounded p-3"><b>Zadání:</b><br>${currentProblem.text}</div>
      <div class="bg-gray-900 border border-gray-700 rounded p-3"><b>Zápis:</b><br>${linesZapis}</div>
      <div class="bg-gray-900 border border-gray-700 rounded p-3">
        <b>Vzorec:</b> ${document.getElementById("formula-lhs").value} = ${document.getElementById("formula-rhs").value}
        <div class="${formulaOK?'text-green-400':'text-red-400'} mt-1">${formulaOK?'✅ Vzorec v pořádku':'❌ Zkontroluj tvar vzorce (W = F * s)'}</div>
      </div>
      <div class="bg-gray-900 border border-gray-700 rounded p-3">
        <b>Dosazení:</b> ${document.getElementById("subs-lhs").value} = ${document.getElementById("subs-rhs").value}
        <div class="${subsOK?'text-green-400':'text-red-400'} mt-1">${subsOK?'✅ Dosazení odpovídá zadání':'❌ Dosazení nekoresponduje se zadáním'}</div>
        ${orderNote?`<div class="text-yellow-400">${orderNote}</div>`:""}
      </div>
      <div class="bg-gray-900 border border-gray-700 rounded p-3">
        <b>Výsledek:</b> ${document.getElementById("result-lhs").value} = ${document.getElementById("result-rhs").value} ${rU}
        <div class="${resOK?'text-green-400':'text-red-400'} mt-1">${resOK?'✅ Výsledek správně':'❌ Výsledek nesouhlasí – zkontroluj převody a dosazení'}</div>
      </div>
    `;

    openResultModal();
  });

  // -------------------- Modal --------------------
  function initResultModal(){
    if(document.getElementById("result-modal")) return;
    const modal = document.createElement("div");
    modal.id = "result-modal";
    modal.className = "hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4";
    modal.innerHTML = `
      <div class="bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-2xl space-y-4 relative text-left">
        <button id="close-result-button" class="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        <h3 class="text-xl font-semibold text-white mb-2">📊 Shrnutí a hodnocení</h3>
        <div id="result-modal-content" class="text-gray-200 text-sm leading-relaxed space-y-3"></div>
        <div class="flex justify-end gap-3 pt-2">
          <button id="result-new" class="btn btn-secondary">Nový příklad</button>
          <button id="result-close" class="btn btn-primary">Zavřít</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById("close-result-button").onclick = closeResultModal;
    document.getElementById("result-close").onclick = closeResultModal;
    document.getElementById("result-new").onclick = () => { closeResultModal(); generateProblem(); resetAll(); };
  }
  function openResultModal(){ document.getElementById("result-modal").classList.remove("hidden"); }
  function closeResultModal(){ document.getElementById("result-modal").classList.add("hidden"); }

  // -------------------- Reset --------------------
  function resetAll(){
    // reset zápisu
    zapisContainer.innerHTML = "";
    addZapisRow("F","","-");
    addZapisRow("s","","-");
    addZapisRow("W","?","-", true);

    // reset výpočtu
    document.getElementById("formula-lhs").value = "W";
    document.getElementById("formula-rhs").value = "F * s";
    document.getElementById("subs-lhs").value = "W";
    document.getElementById("subs-rhs").value = "";
    document.getElementById("result-lhs").value = "W";
    document.getElementById("result-rhs").value = "";
    renderZapisReview();
    // obnov validace
    ["formula","subs","result"].forEach(calcRowValidate);
  }

  // -------------------- Malá utilita: toast --------------------
  function toast(msg){
    const t = document.createElement("div");
    t.textContent = msg;
    t.className = "fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 text-gray-100 border border-gray-700 px-4 py-2 rounded-lg shadow z-[100]";
    document.body.appendChild(t);
    setTimeout(()=>{ t.remove(); }, 3500);
  }

  console.log("✅ Logika aplikace úspěšně načtena.");
});
