// ====================================================================
// app.js — Fyzika: Práce a výkon (stabilní verze)
// - Zápis: beze změny (live validace, auto-převodní řádek)
// - Výpočet: dvoupólové řádky (LHS = RHS) + live validace
// - Funkční tlačítka a přechody + modální shrnutí
// - Modály: Kalkulačka / Vzorec / Obrázek / Nápověda (jednoduché)
// ====================================================================

console.log("Načítání app.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");

  let selectedMode = null;
  let selectedLevel = null;
  let currentProblem = null;

  const $ = (id)=>document.getElementById(id);

  // --- Root elements
  const setupScreen = $("setup-screen");
  const practiceScreen = $("practice-screen");
  const startButton = $("start-button");
  const newProblemButton = $("new-problem-button");
  const backButton = $("back-button");

  const problemTextEl = $("problem-text");

  // Zápis
  const zapisStep = $("zapis-step");
  const zapisContainer = $("zapis-container");
  const checkZapisBtn = $("check-zapis-button");
  const addZapisRowBtn = $("add-zapis-row-button");
  const zapisFeedback = $("zapis-feedback-container");

  // Výpočet
  const vypocetStep = $("vypocet-step");
  const checkCalcBtn = $("check-calculation-button");
  const unitSelectFinal = $("unit-select");
  const zapisReview = $("zapis-review-container");
  const mainCalcStep = $("main-calculation-step");

  // Tools
  const openCalcBtn = $("open-calculator-button");
  const openFormulaBtn = $("open-formula-button");
  const openDiagramBtn = $("open-diagram-button");
  const openHelpBtn = $("open-help-button");

  const calcModal = $("calculator-modal");
  const formulaModal = $("formula-modal");
  const diagramModal = $("diagram-modal");
  const helpModal = $("help-modal");

  const closeCalcBtn = $("close-calculator-button");
  const closeFormulaBtn = $("close-formula-button");
  const closeDiagramBtn = $("close-diagram-button");
  const closeHelpBtn = $("close-help-button");

  // Units / helpers
  const unitToBase = { mm:1/1000, cm:1/100, m:1, km:1000, N:1, kN:1000, MN:1_000_000, J:1, kJ:1000, MJ:1_000_000 };
  const baseBySymbol = { F:"N", s:"m", W:"J" };
  const allowedSymbols = ["F","s","W"];
  const parseNum = (x)=>{ if(x==null) return NaN; const s=String(x).replace(",",".").trim(); return s===""?NaN:Number(s); };
  const almostEqual = (a,b,rel=0.05)=> Math.abs(a-b) <= Math.abs(b)*rel;
  const normSym = s => (s||"").replace(/[^A-Za-z]/g,"").toUpperCase();

  // --- Mode / Level
  document.querySelectorAll('[id^="mode-"]').forEach(btn=>{
    btn.addEventListener("click",()=>{
      selectedMode = btn.id.includes("practice")?"practice":"test";
      document.querySelectorAll('[id^="mode-"]').forEach(b=>b.classList.remove("ring-2","ring-blue-500"));
      btn.classList.add("ring-2","ring-blue-500");
      enableStartIfReady();
      console.log("🎓 Režim zvolen:", selectedMode);
    });
  });
  document.querySelectorAll('[id^="level-"]').forEach(btn=>{
    btn.addEventListener("click",()=>{
      selectedLevel = btn.id.includes("hard")?"hard":(btn.id.includes("normal")?"normal":"easy");
      document.querySelectorAll('[id^="level-"]').forEach(b=>b.classList.remove("ring-2","ring-blue-500"));
      btn.classList.add("ring-2","ring-blue-500");
      enableStartIfReady();
      console.log("🎯 Obtížnost zvolena:", selectedLevel);
    });
  });
  function enableStartIfReady(){ if(selectedMode&&selectedLevel){ startButton.disabled=false; startButton.classList.remove("btn-disabled"); console.log("✅ Start povolen"); }}

  startButton?.addEventListener("click",()=>{ console.log("▶️ Kliknuto na Spustit"); setupScreen?.classList.add("hidden"); practiceScreen?.classList.remove("hidden"); startNewProblem(); });
  backButton?.addEventListener("click",()=>{ practiceScreen?.classList.add("hidden"); setupScreen?.classList.remove("hidden"); });
  newProblemButton?.addEventListener("click",()=>{ console.log("🔁 Nový příklad"); startNewProblem(); });

  // --- Problem gen
  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function generateProblem(){
    const variant = randInt(1,2);
    let text,givens,result;
    if(variant===1){
      const FkN=randInt(1,9), s_m=2;
      text=`Těleso bylo přesunuto silou ${FkN} kN po dráze ${s_m} m. Jaká práce byla vykonána?`;
      givens=[{symbol:"F",value:FkN*1000,unit:"N"},{symbol:"s",value:s_m,unit:"m"}];
      result=(FkN*1000)*s_m;
    }else{
      const s_km=randInt(1,5), F_N=randInt(800,2000);
      text=`Auto jelo rovnoměrným přímočarým pohybem po dráze ${s_km} km. Tahová síla motoru byla ${F_N} N.`;
      givens=[{symbol:"s",value:s_km*1000,unit:"m"},{symbol:"F",value:F_N,unit:"N"}];
      result=(s_km*1000)*F_N;
    }
    currentProblem={text,givens,result};
    problemTextEl.textContent=text;
    console.log("🆕 Nový příklad:",text);
  }

  function startNewProblem(){
    generateProblem();
    resetZapis();
    prepareUnitsForTopic();
    ensureCalcRows();
    resetCalcRows();
  }

  // --- Zápis (beze změny)
  addZapisRowBtn?.addEventListener("click",()=>addZapisRow());
  function addZapisRow(symbol="-", value="", unit="-", unknown=false){
    const row=document.createElement("div");
    row.className="grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row p-2 rounded-lg bg-gray-800 border border-gray-700";

    const symSel=document.createElement("select");
    ["-","F","s","W"].forEach(u=>{const o=document.createElement("option");o.value=u;o.textContent=u;symSel.appendChild(o);});
    symSel.value=symbol; symSel.className="zapis-symbol p-2 rounded-md bg-gray-900 border border-gray-700 text-white";

    const val=document.createElement("input");
    val.type="text"; val.placeholder="Hodnota nebo ?"; val.value=value;
    val.className="zapis-value p-2 rounded-md bg-gray-900 border border-gray-700 text-white";

    const unitSel=document.createElement("select");
    ["-","mm","cm","m","km","J","kJ","MJ","N","kN","MN"].forEach(u=>{const o=document.createElement("option");o.value=u;o.textContent=u;unitSel.appendChild(o);});
    unitSel.value=unit; unitSel.className="zapis-unit p-2 rounded-md bg-gray-900 border border-gray-700 text-white";

    const lab=document.createElement("label"); lab.className="flex items-center gap-2 text-sm text-gray-300";
    const cb=document.createElement("input"); cb.type="checkbox"; cb.className="zapis-unknown h-4 w-4"; cb.checked=unknown;
    lab.append(cb,document.createTextNode("Hledaná veličina"));

    row.append(symSel,val,unitSel,lab);
    zapisContainer.appendChild(row);

    const onChange=()=>rowLiveValidate(row);
    [symSel,val,unitSel,cb].forEach(el=>el.addEventListener("input",onChange));
    onChange();
  }

  function rowLiveValidate(row){
    row.classList.remove("ring-2","ring-green-500","ring-red-500","ring-blue-500");
    const sym=normSym(row.querySelector(".zapis-symbol").value);
    const valStr=(row.querySelector(".zapis-value").value||"").trim();
    const unit=row.querySelector(".zapis-unit").value;
    const unknown=row.querySelector(".zapis-unknown").checked;

    if(sym===""||sym==="-"||unit==="-") return;
    if(!allowedSymbols.includes(sym)){ row.classList.add("ring-2","ring-red-500"); return; }

    const given=(currentProblem?.givens||[]).find(g=>g.symbol===sym);
    if(!given){ row.classList.add("ring-2","ring-red-500"); return; }

    if(unknown){
      if(valStr!=="?"){ row.classList.add("ring-2","ring-red-500"); return; }
      row.classList.add("ring-2","ring-green-500"); return;
    }

    if(valStr===""){ return; }
    const val=parseNum(valStr);
    if(Number.isNaN(val)){ row.classList.add("ring-2","ring-red-500"); return; }

    const inBase=val*(unitToBase[unit]||1);
    const expected=given.value;

    if(almostEqual(inBase,expected)){
      row.classList.add("ring-2","ring-green-500");
    }else{
      const baseU=baseBySymbol[sym]||unit;
      const hasBase=[...zapisContainer.querySelectorAll(".zapis-row")].some(r=>{
        const s=normSym(r.querySelector(".zapis-symbol").value);
        const u=r.querySelector(".zapis-unit").value;
        const v=(r.querySelector(".zapis-value").value||"").trim();
        return s===sym && u===baseU && v!=="" && v!=="?";
      });
      if(unit!==baseU && !hasBase){
        const converted=expected/(unitToBase[unit]||1);
        addZapisRow(sym,String(converted.toFixed(2)),baseU,false);
        row.classList.add("ring-2","ring-blue-500");
      }else{
        row.classList.add("ring-2","ring-red-500");
      }
    }
  }

  function validateWholeZapis(){
    const rows=[...zapisContainer.querySelectorAll(".zapis-row")];
    if(rows.length===0) return false;
    let need={F:false,s:false,W:false}; let ok=true;
    rows.forEach(r=>{
      const s=normSym(r.querySelector(".zapis-symbol").value);
      const v=(r.querySelector(".zapis-value").value||"").trim();
      const u=r.querySelector(".zapis-unit").value;
      const unk=r.querySelector(".zapis-unknown").checked;
      rowLiveValidate(r);
      if(r.classList.contains("ring-red-500")) ok=false;
      if(s==="F"&&v&&u!=="-"&&!unk) need.F=true;
      if(s==="s"&&v&&u!=="-"&&!unk) need.s=true;
      if(s==="W"&&v==="?"&&unk) need.W=true;
    });
    return ok && need.F && need.s && need.W;
  }

  checkZapisBtn?.addEventListener("click",()=>{
    console.log("🧪 Kontrola zápisu");
    zapisFeedback.innerHTML="";
    if(!validateWholeZapis()){
      toast("Doplň/opravi zápis: potřebuješ F a s (čísla + správná jednotka) a W jako hledanou veličinu „?“.");
      return;
    }
    renderZapisReview();
    zapisStep?.classList.add("hidden");
    vypocetStep?.classList.remove("hidden");
  });

  function renderZapisReview(){
    const lines=[...zapisContainer.querySelectorAll(".zapis-row")].map(r=>{
      const s=(r.querySelector(".zapis-symbol").value||"").trim();
      const v=(r.querySelector(".zapis-value").value||"").trim();
      const u=r.querySelector(".zapis-unit").value;
      return `${s} = ${v}${u && u!=="-" ? " "+u : ""}`;
    });
    zapisReview.innerHTML=`<h4 class="text-lg font-semibold mb-2">Souhrn zápisu:</h4>${lines.map(l=>`<div>${l}</div>`).join("")}`;
  }

  function resetZapis(){
    if(!zapisContainer) return;
    zapisContainer.innerHTML="";
    addZapisRow("F","", "-");
    addZapisRow("s","", "-");
    addZapisRow("W","?","-", true);
    zapisFeedback.innerHTML="";
    zapisStep?.classList.remove("hidden");
    vypocetStep?.classList.add("hidden");
  }

  function prepareUnitsForTopic(){
    if(!unitSelectFinal) return;
    unitSelectFinal.innerHTML="";
    ["J","kJ","MJ"].forEach(u=>{const o=document.createElement("option"); o.value=u; o.textContent=u; unitSelectFinal.appendChild(o);});
  }

  // --- Výpočet: dvoupólové řádky
  function ensureCalcRows(){
    if(document.getElementById("formula-lhs")) return;
    createCalcRow("Vzorec","formula",{lhs:"W",rhs:"F * s"});
    createCalcRow("Dosazení","subs",{lhs:"W",rhs:""});
    createCalcRow("Výsledek","result",{lhs:"W",rhs:""});
  }
  function resetCalcRows(){
    const ids=["formula-lhs","formula-rhs","subs-lhs","subs-rhs","result-lhs","result-rhs"];
    ids.forEach(id=>{ const el=$(id); if(!el) return; if(id.endsWith("lhs")) el.value="W"; else el.value=(id==="formula-rhs"?"F * s":""); });
    ["formula","subs","result"].forEach(calcRowValidate);
  }
  function createCalcRow(labelText,key,defaults){
    const container=mainCalcStep||vypocetStep;
    const wrap=document.createElement("div"); wrap.className="space-y-1 mb-3";
    const lab=document.createElement("label"); lab.className="block text-sm text-gray-400"; lab.textContent=labelText+":";

    const row=document.createElement("div"); row.className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center";
    const lhs=document.createElement("input"); lhs.type="text"; lhs.maxLength=2; lhs.placeholder="W/F/s"; lhs.value=defaults.lhs||""; lhs.id=`${key}-lhs`; lhs.className="p-2 rounded-md bg-gray-900 border border-gray-700 text-white w-16";
    const eq=document.createElement("div"); eq.className="flex items-center justify-center text-gray-300"; eq.textContent="=";
    const rhs=document.createElement("input"); rhs.type="text"; rhs.placeholder= key==="result"?"Číslo":(key==="formula"?"F * s":"1000 * 2"); rhs.value=defaults.rhs||""; rhs.id=`${key}-rhs`; rhs.className="p-2 rounded-md bg-gray-900 border border-gray-700 text-white";

    row.append(lhs,eq,rhs); wrap.append(lab,row); container.insertBefore(wrap,checkCalcBtn);
    const onChange=()=>calcRowValidate(key); [lhs,rhs].forEach(el=>el.addEventListener("input",onChange));
  }
  function calcRowValidate(key){
    const lhs=normSym((($(key+"-lhs")?.value)||"").toUpperCase());
    const rhs=( $(key+"-rhs")?.value||"").trim();
    const line=$(key+"-rhs"); if(!line) return;
    const setOk=(ok)=>{ line.classList.remove("ring-2","ring-green-500","ring-red-500"); if(rhs==="") return; line.classList.add("ring-2", ok?"ring-green-500":"ring-red-500"); };
    if(!lhs||!rhs){ line.classList.remove("ring-2","ring-green-500","ring-red-500"); return; }

    if(key==="formula"){
      const okLhs = lhs==="W";
      const r = rhs.replace(/\s+/g,"").replace("·","*").toUpperCase();
      const okRhs = (r==="F*S" || r==="S*F");
      setOk(okLhs && okRhs); return;
    }
    if(key==="subs"){
      const r = rhs.replace(/\s+/g,"");
      const nums = r.split("*").map(x=>parseNum(x));
      const gF = currentProblem?.givens?.find(g=>g.symbol==="F")?.value;
      const gs = currentProblem?.givens?.find(g=>g.symbol==="s")?.value;
      const ok = (lhs==="W") && nums.some(n=>almostEqual(n,gF)) && nums.some(n=>almostEqual(n,gs));
      setOk(ok); return;
    }
    if(key==="result"){
      const rNum = parseNum(rhs);
      setOk(lhs==="W" && !Number.isNaN(rNum)); return;
    }
  }

  // --- Shrnutí v modálu
  initResultModal();
  checkCalcBtn?.addEventListener("click",()=>{
    const fL=normSym((($("formula-lhs")?.value)||"").toUpperCase());
    const fR=( $("formula-rhs")?.value||"").trim();
    const sL=normSym((($("subs-lhs")?.value)||"").toUpperCase());
    const sR=( $("subs-rhs")?.value||"").trim();
    const rL=normSym((($("result-lhs")?.value)||"").toUpperCase());
    const rR=( $("result-rhs")?.value||"").trim();
    const rU=unitSelectFinal?.value||"J";

    const expected=currentProblem?.result??NaN;
    const userValBase = parseNum(rR)*(unitToBase[rU]||1);

    const formulaOK=(fL==="W") && (fR.replace(/\s+/g,"").replace("·","*").toUpperCase()==="F*S" || fR.replace(/\s+/g,"").replace("·","*").toUpperCase()==="S*F");
    const nums=sR.replace(/\s+/g,"").split("*").map(x=>parseNum(x));
    const gF=currentProblem?.givens?.find(g=>g.symbol==="F")?.value??NaN;
    const gs=currentProblem?.givens?.find(g=>g.symbol==="s")?.value??NaN;
    const subsOK=(sL==="W") && nums.some(n=>almostEqual(n,gF)) && nums.some(n=>almostEqual(n,gs));
    const resOK=(rL==="W") && almostEqual(userValBase,expected);

    const orderNote=(()=>{ const rightOrder=fR.replace(/\s+/g,"").toUpperCase()==="F*S"; return rightOrder?"":"ℹ️ Pořadí dosazení doporučujeme psát v pořadí podle vzorce (F*s)."; })();

    const content=$("result-modal-content");
    const linesZapis=[...zapisContainer.querySelectorAll(".zapis-row")].map(r=>{
      const s=(r.querySelector(".zapis-symbol").value||"").trim();
      const v=(r.querySelector(".zapis-value").value||"").trim();
      const u=r.querySelector(".zapis-unit").value;
      return `${s} = ${v}${u && u!=="-" ? " "+u : ""}`;
    }).join("<br>");

    content.innerHTML=`
      <div class="bg-gray-900 border border-gray-700 rounded p-3"><b>Zadání:</b><br>${currentProblem?.text||""}</div>
      <div class="bg-gray-900 border border-gray-700 rounded p-3"><b>Zápis:</b><br>${linesZapis}</div>
      <div class="bg-gray-900 border border-gray-700 rounded p-3">
        <b>Vzorec:</b> ${$("formula-lhs").value} = ${$("formula-rhs").value}
        <div class="${formulaOK?'text-green-400':'text-red-400'} mt-1">${formulaOK?'✅ Vzorec v pořádku':'❌ Zkontroluj tvar vzorce (W = F * s)'}</div>
      </div>
      <div class="bg-gray-900 border border-gray-700 rounded p-3">
        <b>Dosazení:</b> ${$("subs-lhs").value} = ${$("subs-rhs").value}
        <div class="${subsOK?'text-green-400':'text-red-400'} mt-1">${subsOK?'✅ Dosazení odpovídá zadání':'❌ Dosazení nekoresponduje se zadáním'}</div>
        ${orderNote?`<div class="text-yellow-400">${orderNote}</div>`:""}
      </div>
      <div class="bg-gray-900 border border-gray-700 rounded p-3">
        <b>Výsledek:</b> ${$("result-lhs").value} = ${$("result-rhs").value} ${rU}
        <div class="${resOK?'text-green-400':'text-red-400'} mt-1">${resOK?'✅ Výsledek správně':'❌ Výsledek nesouhlasí – zkontroluj převody a dosazení'}</div>
      </div>`;
    openResultModal();
  });

  function initResultModal(){
    if($("result-modal")) return;
    const modal=document.createElement("div");
    modal.id="result-modal";
    modal.className="hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4";
    modal.innerHTML=`
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
    $("close-result-button").onclick=closeResultModal;
    $("result-close").onclick=closeResultModal;
    $("result-new").onclick=()=>{ closeResultModal(); startNewProblem(); };
  }
  function openResultModal(){ $("result-modal")?.classList.remove("hidden"); }
  function closeResultModal(){ $("result-modal")?.classList.add("hidden"); }

  // --- Modály nástrojů
  function show(modal){ modal?.classList.remove("hidden"); }
  function hide(modal){ modal?.classList.add("hidden"); }
  openCalcBtn?.addEventListener("click",()=>{ buildCalculator(); show(calcModal); });
  openFormulaBtn?.addEventListener("click",()=>{ renderFormula(); show(formulaModal); });
  openDiagramBtn?.addEventListener("click",()=>{ renderDiagram(); show(diagramModal); });
  openHelpBtn?.addEventListener("click",()=>{ renderHelp(); show(helpModal); });

  closeCalcBtn?.addEventListener("click",()=>hide(calcModal));
  closeFormulaBtn?.addEventListener("click",()=>hide(formulaModal));
  closeDiagramBtn?.addEventListener("click",()=>hide(diagramModal));
  closeHelpBtn?.addEventListener("click",()=>hide(helpModal));

  [calcModal,formulaModal,diagramModal,helpModal].forEach(m=>{
    m?.addEventListener("click",(e)=>{ if(e.target===m) hide(m); });
  });

  // --- Kalkulačka (jednoduchá)
  function buildCalculator(){
    const disp=$("calculator-display");
    const hist=$("calculator-history");
    const grid=$("calculator-buttons");
    if(!disp || !grid) return;
    if(grid.dataset.ready==="1") return; // už je připraveno

    const keys=["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+","C","⌫","Copy"];
    keys.forEach(k=>{
      const b=document.createElement("button");
      b.textContent=k; b.className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600";
      b.addEventListener("click",()=>calcPress(k));
      grid.appendChild(b);
    });
    grid.dataset.ready="1";
    let cur="";

    function calcPress(k){
      if(k==="C"){ cur=""; disp.textContent="0"; hist.textContent=""; return; }
      if(k==="⌫"){ cur=cur.slice(0,-1); disp.textContent=cur||"0"; return; }
      if(k==="="){
        try{ const r=Function(`"use strict";return (${cur||"0"})`)(); hist.textContent=cur+" ="; disp.textContent=String(r); cur=String(r); }
        catch{ disp.textContent="Chyba"; }
        return;
      }
      if(k==="Copy"){
        navigator.clipboard?.writeText(disp.textContent||"").then(()=>toast("Zkopírováno do schránky"));
        return;
      }
      cur+=k; disp.textContent=cur;
    }
  }

  // --- Vzorec (trojúhelník)
  function renderFormula(){
    const c=document.getElementById("formula-svg-container");
    if(!c) return;
    c.innerHTML = `
      <svg width="280" height="200" viewBox="0 0 280 200">
        <defs>
          <clipPath id="triClip">
            <polygon points="140,20 20,180 260,180" />
          </clipPath>
        </defs>
        <polygon points="140,20 20,180 260,180" fill="none" stroke="white" stroke-width="2"/>
        <!-- vodorovná příčka, nekoliduje s odvěsnami (uvnitř pomocí clipPath) -->
        <rect x="40" y="115" width="200" height="2" fill="#6EE7F9" clip-path="url(#triClip)"/>
        <text x="140" y="80" fill="#FACC15" font-size="28" text-anchor="middle">W</text>
        <text x="140" y="155" fill="#60A5FA" font-size="24" text-anchor="middle">F * s</text>
      </svg>
    `;
  }

  // --- Obrázek (schematický)
  function renderDiagram(){
    const c=document.getElementById("diagram-svg-container"); if(!c) return;
    const F = currentProblem?.givens?.find(g=>g.symbol==="F") || {};
    const s = currentProblem?.givens?.find(g=>g.symbol==="s") || {};
    c.innerHTML = `
      <svg width="320" height="190" viewBox="0 0 320 190">
        <defs>
          <marker id="arrowR" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="red"/>
          </marker>
          <marker id="arrowO" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="orange"/>
          </marker>
        </defs>
        <rect x="20" y="160" width="280" height="8" fill="#555"/>
        <rect x="80" y="115" width="80" height="45" fill="#00AEEF" stroke="white" stroke-width="2"/>
        <circle cx="95" cy="160" r="9" fill="#333"/>
        <circle cx="145" cy="160" r="9" fill="#333"/>
        <line x1="160" y1="135" x2="245" y2="135" stroke="red" stroke-width="3" marker-end="url(#arrowR)"/>
        <text x="202" y="125" fill="red" font-size="14" text-anchor="middle">F = ${F.value||"?"} ${F.unit||""}</text>
        <line x1="80" y1="175" x2="245" y2="175" stroke="orange" stroke-width="2" marker-end="url(#arrowO)"/>
        <text x="160" y="188" fill="orange" font-size="13" text-anchor="middle">s = ${s.value||"?"} ${s.unit||""}</text>
      </svg>
    `;
  }

  // --- Nápověda
  function renderHelp(){
    const box=document.getElementById("help-content"); if(!box) return;
    box.innerHTML = `
      <div class="text-left space-y-2">
        <p><b>Tip:</b> Začni zápisem známých veličin (F, s) a označ W jako hledanou.</p>
        <p>Vzorec pro práci: <code>W = F * s</code> (pořadí může být i <code>s * F</code>).</p>
        <p>Jednotky: <code>F</code> v newtonech (N), <code>s</code> v metrech (m), <code>W</code> v joulech (J).</p>
        <p>Jestli píšeš např. <code>F = 2 kN</code>, převeď i do základní jednotky: <code>F = 2000 N</code>.</p>
      </div>`;
  }

  // --- Toast
  function toast(msg){
    const t=document.createElement("div");
    t.textContent=msg;
    t.className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 text-gray-100 border border-gray-700 px-4 py-2 rounded-lg shadow z-[100]";
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),3500);
  }

  console.log("✅ Logika aplikace úspěšně načtena.");
});
