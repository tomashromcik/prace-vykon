// ====================================================================
// app.js — Fyzika: Práce a výkon
// Final: výpočet = dvoupólové řádky (LHS = RHS) + modální shrnutí
// Zachována funkčnost: režimy/úrovně, generátor příkladů, zápis s validací
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
  const backButton = document.getElementById("back-button");

  // Zadání
  const problemTextEl = document.getElementById("problem-text");

  // Zápis
  const zapisStep = document.getElementById("zapis-step");
  const zapisContainer = document.getElementById("zapis-container");
  const checkZapisBtn = document.getElementById("check-zapis-button");
  const addZapisRowBtn = document.getElementById("add-zapis-row-button");
  const zapisFeedback = document.getElementById("zapis-feedback-container");

  // Výpočet
  const vypocetStep = document.getElementById("vypocet-step");
  const checkCalcBtn = document.getElementById("check-calculation-button");
  const unitSelectFinal = document.getElementById("unit-select");
  const zapisReview = document.getElementById("zapis-review-container");

  // -------------------- Units helpers --------------------
  const unitToBase = {
    mm:1/1000, cm:1/100, m:1, km:1000,
    N:1, kN:1000, MN:1_000_000,
    J:1, kJ:1000, MJ:1_000_000
  };
  const baseBySymbol = { F:"N", s:"m", W:"J" };
  const allowedSymbols = ["F","s","W"];

  const parseNum = (x)=>{
    if(x==null) return NaN;
    const s = String(x).replace(",",".").trim();
    if(s==="") return NaN;
    return Number(s);
  };
  const almostEqual = (a,b,rel=0.05)=> Math.abs(a-b) <= Math.abs(b)*rel;
  const normSym = s => (s||"").replace(/[^A-Za-z]/g,"").toUpperCase();

  // -------------------- Režimy/úrovně --------------------
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
      selectedLevel = btn.id.includes("hard") ? "hard" : (btn.id.includes("normal") ? "normal" : "easy");
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

  startButton?.addEventListener("click", () => {
    console.log("▶️ Kliknuto na Spustit");
    setupScreen?.classList.add("hidden");
    practiceScreen?.classList.remove("hidden");
    startNewProblem();
  });

  backButton?.addEventListener("click", () => {
    practiceScreen?.classList.add("hidden");
    setupScreen?.classList.remove("hidden");
  });

  newProblemButton?.addEventListener("click", () => {
    console.log("🔁 Nový příklad");
    startNewProblem();
  });

  function startNewProblem(){
    generateProblem();
    resetZapis();
    prepareUnitsForTopic();
    ensureCalcRows();
    resetCalcRows();
  }

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

  // -------------------- Zápis (ponechán, ale stabilizován) --------------------
  addZapisRowBtn?.addEventListener("click", () => addZapisRow());

  function addZapisRow(symbol="-", value="", unit="-", unknown=false){
    const row = document.createElement("div");
    row.className = "grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row p-2 rounded-lg bg-gray-800 border border-gray-700";

    // symbol
    const symSel = document.createElement("select");
    ["-","F","s","W"].forEach(u=>{
      const o=document.createElement("option"); o.value=u; o.textContent=u; symSel.appendChild(o);
    });
    symSel.value = symbol;
    symSel.className = "zapis-symbol p-2 rounded-md bg-gray-900 border border-gray-700 text-white";

    // hodnota
    const val = document.createElement("input");
    val.type = "text"; val.placeholder = "Hodnota nebo ?"; val.value = value;
    val.className = "zapis-value p-2 rounded-md bg-gray-900 border border-gray-700 text-white";

    // jednotka
    const unitSel = document.createElement("select");
    ["-","mm","cm","m","km","J","kJ","MJ","N","kN","MN"].forEach(u=>{
      const o=document.createElement("option"); o.value=u; o.textContent=u; unitSel.appendChild(o);
    });
    unitSel.value = unit;
    unitSel.className = "zapis-unit p-2 rounded-md bg-gray-900 border border-gray-700 text-white";

    // hledaná?
    const lab = document.createElement("label");
    lab.className = "flex items-center gap-2 text-sm text-gray-300";
    const cb = document.createElement("input"); cb.type="checkbox"; cb.className="zapis-unknown h-4 w-4"; cb.checked=unknown;
    lab.append(cb, document.createTextNode("Hledaná veličina"));

    row.append(symSel, val, unitSel, lab);
    zapisContainer.appendChild(row);

    const onChange = ()=> rowLiveValidate(row);
    [symSel, val, unitSel, cb].forEach(el => el.addEventListener("input", onChange));
    onChange();
  }

  function rowLiveValidate(row){
    row.classList.remove("ring-2","ring-green-500","ring-red-500","ring-blue-500");

    const sym = normSym(row.querySelector(".zapis-symbol").value);
    const valStr = (row.querySelector(".zapis-value").value||"").trim();
    const unit = row.querySelector(".zapis-unit").value;
    const unknown = row.querySelector(".zapis-unknown").checked;

    if(sym==="" || sym==="-" || unit==="-") return;
    if(!allowedSymbols.includes(sym)){ row.classList.add("ring-2","ring-red-500"); return; }

    const given = (currentProblem?.givens||[]).find(g=>g.symbol===sym);
    if(!given){ row.classList.add("ring-2","ring-red-500"); return; }

    if(unknown){
      if(valStr!=="?"){ row.classList.add("ring-2","ring-red-500"); return; }
      row.classList.add("ring-2","ring-green-500"); return;
    }

    if(valStr===""){ return; }
    const val = parseNum(valStr);
    if(Number.isNaN(val)){ row.classList.add("ring-2","ring-red-500"); return; }

    const inBase = val * (unitToBase[unit]||1);
    const expected = given.value;

    if(almostEqual(inBase, expected)){
      row.classList.add("ring-2","ring-green-500");
    } else {
      // přidej pomocný převodní řádek do základní jednotky, pokud ještě není
      const baseU = baseBySymbol[sym] || unit;
      const hasBase = [...zapisContainer.querySelectorAll(".zapis-row")].some(r=>{
        const s = normSym(r.querySelector(".zapis-symbol").value);
        const u = r.querySelector(".zapis-unit").value;
        const v = r.querySelector(".zapis-value").value.trim();
        return s===sym && u===baseU && v!=="" && v!=="?";
      });
      if(unit!==baseU && !hasBase){
        const converted = expected / (unitToBase[unit]||1);
        addZapisRow(sym, String(converted.toFixed(2)), baseU, false);
        row.classList.add("ring-2","ring-blue-500");
      } else {
        row.classList.add("ring-2","ring-red-500");
      }
    }
  }

  function validateWholeZapis(){
    const rows = [...zapisContainer.querySelectorAll(".zapis-row")];
    if(rows.length===0) return false;
    let need = {F:false, s:false, W:false};
    let ok = true;

    rows.forEach(r=>{
      const s = normSym(r.querySelector(".zapis-symbol").value);
      const v = (r.querySelector(".zapis-value").value||"").trim();
      const u = r.querySelector(".zapis-unit").value;
      const unk = r.querySelector(".zapis-unknown").checked;

      // revalidace
      rowLiveValidate(r);
      if(r.classList.contains("ring-red-500")) ok = false;

      if(s==="F" && v && u!=="-" && !unk) need.F=true;
      if(s==="s" && v && u!=="-" && !unk) need.s=true;
      if(s==="W" && v==="?" && unk) need.W=true;
    });

    return ok && need.F && need.s && need.W;
  }

  checkZapisBtn?.addEventListener("click", () => {
    console.log("🧪 Kontrola zápisu");
    zapisFeedback.innerHTML = "";
    if(!validateWholeZapis()){
      toast("Doplň/opravi zápis: potřebuješ F a s (čísla + správná jednotka) a W jako hledanou veličinu „?“.");
      return;
    }
    renderZapisReview();
    zapisStep?.classList.add("hidden");
    vypocetStep?.classList.remove("hidden");
  });

  function renderZapisReview(){
    const lines = [...zapisContainer.querySelectorAll(".zapis-row")].map(r=>{
      const s = (r.querySelector(".zapis-symbol").value||"").trim();
      const v = (r.querySelector(".zapis-value").value||"").trim();
      const u = r.querySelector(".zapis-unit").value;
      return `${s} = ${v}${u && u!=="-" ? " "+u : ""}`;
    });
    zapisReview.innerHTML = `<h4 class="text-lg font-semibold mb-2">Souhrn zápisu:</h4>${lines.map(l=>`<div>${l}</div>`).join("")}`;
  }

  function resetZapis(){
    if(!zapisContainer) return;
    zapisContainer.innerHTML = "";
    addZapisRow("F","", "-");
    addZapisRow("s","", "-");
    addZapisRow("W","?","-", true);
    zapisFeedback.innerHTML = "";
    zapisStep?.classList.remove("hidden");
    vypocetStep?.classList.add("hidden");
  }

  function prepareUnitsForTopic(){
    if(!unitSelectFinal) return;
    unitSelectFinal.innerHTML = "";
    ["J","kJ","MJ"].forEach(u=>{
      const o=document.createElement("option"); o.value=u; o.textContent=u; unitSelectFinal.appendChild(o);
    });
  }

  // -------------------- VÝPOČET: dvoupólové řádky --------------------
  // vytvoříme řádky dynamicky jen pro výpočet; zápis ponechaný
  function ensureCalcRows(){
    // pokud už existují, nenecháme duplikovat
    if(document.getElementById("formula-lhs")) return;

    createCalcRow("Vzorec", "formula", {lhs:"W", rhs:"F * s"});
    createCalcRow("Dosazení", "subs", {lhs:"W", rhs:""});
    createCalcRow("Výsledek", "result", {lhs:"W", rhs:""});
  }

  function resetCalcRows(){
    const fL = document.getElementById("formula-lhs"); const fR = document.getElementById("formula-rhs");
    const sL = document.getElementById("subs-lhs"); const sR = document.getElementById("subs-rhs");
    const rL = document.getElementById("result-lhs"); const rR = document.getElementById("result-rhs");
    if(fL) fL.value = "W";
    if(fR) fR.value = "F * s";
    if(sL) sL.value = "W";
    if(sR) sR.value = "";
    if(rL) rL.value = "W";
    if(rR) rR.value = "";
    ["formula","subs","result"].forEach(calcRowValidate);
  }

  function createCalcRow(labelText, key, defaults){
    const container = document.getElementById("main-calculation-step") || vypocetStep;
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
    wrap.append(lab, row);
    container.insertBefore(wrap, checkCalcBtn);

    // live validace
    const onChange = () => calcRowValidate(key);
    [lhs, rhs].forEach(el => el.addEventListener("input", onChange));
  }

  function calcRowValidate(key){
    const lhs = normSym((document.getElementById(`${key}-lhs`)?.value||"").toUpperCase());
    const rhs = (document.getElementById(`${key}-rhs`)?.value||"").trim();
    const line = document.getElementById(`${key}-rhs`);
    if(!line) return;

    const setOk = (ok)=>{
      line.classList.remove("ring-2","ring-green-500","ring-red-500");
      if(rhs===""){ return; }
      line.classList.add("ring-2", ok ? "ring-green-500" : "ring-red-500");
    };

    if(!lhs || !rhs){ line.classList.remove("ring-2","ring-green-500","ring-red-500"); return; }

    if(key==="formula"){
      const okLhs = lhs==="W";
      const r = rhs.replace(/\s+/g,"").replace("·","*").toUpperCase();
      const okRhs = (r==="F*S" || r==="S*F");
      setOk(okLhs && okRhs);
      return;
    }
    if(key==="subs"){
      const r = rhs.replace(/\s+/g,"");
      const nums = r.split("*").map(x=>parseNum(x));
      const gF = currentProblem?.givens?.find(g=>g.symbol==="F")?.value;
      const gs = currentProblem?.givens?.find(g=>g.symbol==="s")?.value;
      const ok = lhs==="W" && nums.some(n=>almostEqual(n,gF)) && nums.some(n=>almostEqual(n,gs));
      setOk(ok);
      return;
    }
    if(key==="result"){
      const rNum = parseNum(rhs);
      setOk(lhs==="W" && !Number.isNaN(rNum));
      return;
    }
  }

  // -------------------- MODÁLNÍ HODNOCENÍ --------------------
  initResultModal();

  checkCalcBtn?.addEventListener("click", () => {
    const fL = normSym((document.getElementById("formula-lhs")?.value||"").toUpperCase());
    const fR = (document.getElementById("formula-rhs")?.value||"").trim();
    const sL = normSym((document.getElementById("subs-lhs")?.value||"").toUpperCase());
    const sR = (document.getElementById("subs-rhs")?.value||"").trim();
    const rL = normSym((document.getElementById("result-lhs")?.value||"").toUpperCase());
    const rR = (document.getElementById("result-rhs")?.value||"").trim();
    const rU = unitSelectFinal?.value || "J";

    const expected = currentProblem?.result ?? NaN;
    const userValBase = parseNum(rR) * (unitToBase[rU]||1);

    const formulaOK = (fL==="W") && (fR.replace(/\s+/g,"").replace("·","*").toUpperCase()==="F*S" || fR.replace(/\s+/g,"").replace("·","*").toUpperCase()==="S*F");
    const nums = sR.replace(/\s+/g,"").split("*").map(x=>parseNum(x));
    const gF = currentProblem?.givens?.find(g=>g.symbol==="F")?.value ?? NaN;
    const gs = currentProblem?.givens?.find(g=>g.symbol==="s")?.value ?? NaN;
    const subsOK = (sL==="W") && nums.some(n=>almostEqual(n,gF)) && nums.some(n=>almostEqual(n,gs));
    const resOK = (rL==="W") && almostEqual(userValBase, expected);

    const orderNote = (()=>{
      const rightOrder = fR.replace(/\s+/g,"").toUpperCase()==="F*S";
      return rightOrder ? "" : "ℹ️ Pořadí dosazení doporučujeme psát v pořadí podle vzorce (F*s).";
    })();

    const content = document.getElementById("result-modal-content");
    const linesZapis = [...zapisContainer.querySelectorAll(".zapis-row")].map(r=>{
      const s = (r.querySelector(".zapis-symbol").value||"").trim();
      const v = (r.querySelector(".zapis-value").value||"").trim();
      const u = r.querySelector(".zapis-unit").value;
      return `${s} = ${v}${u && u!=="-" ? " "+u : ""}`;
    }).join("<br>");

    content.innerHTML = `
      <div class="bg-gray-900 border border-gray-700 rounded p-3"><b>Zadání:</b><br>${currentProblem?.text||""}</div>
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
    document.getElementById("result-new").onclick = () => { closeResultModal(); startNewProblem(); };
  }
  function openResultModal(){ document.getElementById("result-modal")?.classList.remove("hidden"); }
  function closeResultModal(){ document.getElementById("result-modal")?.classList.add("hidden"); }

  // -------------------- Toast --------------------
  function toast(msg){
    const t = document.createElement("div");
    t.textContent = msg;
    t.className = "fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 text-gray-100 border border-gray-700 px-4 py-2 rounded-lg shadow z-[100]";
    document.body.appendChild(t);
    setTimeout(()=> t.remove(), 3500);
  }

  
  // -------------------- Modální okna (obrázek / vzorec / nápověda / kalkulačka) --------------------
  (function wireModals(){
    const pairs = [
      ["open-diagram-button","diagram-modal","close-diagram-button"],
      ["open-formula-button","formula-modal","close-formula-button"],
      ["open-help-button","help-modal","close-help-button"],
      ["open-calculator-button","calculator-modal","close-calculator-button"],
    ];
    pairs.forEach(([openId, modalId, closeId]) => {
      const openBtn = document.getElementById(openId);
      const modal = document.getElementById(modalId);
      const closeBtn = document.getElementById(closeId);
      if (!modal || !openBtn || !closeBtn) return;
      const show = () => modal.classList.remove("hidden");
      const hide = () => modal.classList.add("hidden");
      openBtn.addEventListener("click", show);
      closeBtn.addEventListener("click", hide);
      modal.addEventListener("click", (e)=> { if (e.target === modal) hide(); });
      document.addEventListener("keydown", (e)=> { if (e.key === "Escape") hide(); });
    });
  })();

  console.log("✅ Logika aplikace úspěšně načtena.");
});
