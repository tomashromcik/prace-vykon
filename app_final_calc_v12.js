// app_final_calc_v12.js
console.log("Načítání app_final_calc_v12.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace v12...");

  // ---------- Stav ----------
  let selectedMode = null;
  let selectedLevel = null;
  let selectedTopic = "prace";
  let currentProblem = null;

  // ---------- DOM ----------
  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");
  const practiceTitle = document.getElementById("practice-title");

  const startButton = document.getElementById("start-button");
  const backButton = document.getElementById("back-button");
  const newProblemButton = document.getElementById("new-problem-button");
  const topicSelect = document.getElementById("topic-select");

  const problemTextEl = document.getElementById("problem-text");

  const tools = {
    openCalc: document.getElementById("open-calculator-button"),
    openFormula: document.getElementById("open-formula-button"),
    openHelp: document.getElementById("open-help-button"),
    openDiagram: document.getElementById("open-diagram-button"),
    modalCalc: document.getElementById("calculator-modal"),
    modalFormula: document.getElementById("formula-modal"),
    modalHelp: document.getElementById("help-modal"),
    modalDiagram: document.getElementById("diagram-modal"),
    closeCalc: document.getElementById("close-calculator-button"),
    closeFormula: document.getElementById("close-formula-button"),
    closeHelp: document.getElementById("close-help-button"),
    closeDiagram: document.getElementById("close-diagram-button"),
    helpContent: document.getElementById("help-content"),
    formulaSvgContainer: document.getElementById("formula-svg-container"),
    diagramSvgContainer: document.getElementById("diagram-svg-container"),
    calcDisplay: document.getElementById("calculator-display"),
    calcHistory: document.getElementById("calculator-history"),
    calcButtons: document.getElementById("calculator-buttons"),
  };

  const zapisStep = document.getElementById("zapis-step");
  const vypocetStep = document.getElementById("vypocet-step");
  const zapisContainer = document.getElementById("zapis-container");
  const zapisFeedback = document.getElementById("zapis-feedback-container");
  const zapisReview = document.getElementById("zapis-review-container");
  const addRowBtn = document.getElementById("add-zapis-row-button");
  const checkZapisBtn = document.getElementById("check-zapis-button");

  // Výpočet – dvoupólová pole
  const fL = document.getElementById("formula-lhs");
  const fR = document.getElementById("formula-rhs");
  const sL = document.getElementById("subs-lhs");
  const sR = document.getElementById("subs-rhs");
  const rL = document.getElementById("result-lhs");
  const rR = document.getElementById("result-rhs");
  const unitSelect = document.getElementById("unit-select");
  const checkCalcBtn = document.getElementById("check-calculation-button");
  const vypocetFeedback = document.getElementById("vypocet-feedback-container");

  // ---------- Pomůcky ----------
  function cls(node, add = [], rem = []) {
    if (!node) return;
    (Array.isArray(rem) ? rem : [rem]).filter(Boolean).forEach(r => node.classList.remove(r));
    (Array.isArray(add) ? add : [add]).filter(Boolean).forEach(a => node.classList.add(a));
  }
  const markOK  = (el)=>cls(el,["ring-2","ring-green-500"],["ring-2","ring-red-500"]);
  const markBAD = (el)=>cls(el,["ring-2","ring-red-500"],["ring-2","ring-green-500"]);
  const markNEU = (el)=>cls(el,[],["ring-2","ring-green-500","ring-red-500"]);

  const symbolToKind = { s:"length", F:"force", W:"energy" };
  const unitSets = { length:["mm","cm","m","km"], energy:["J","kJ","MJ"], force:["N","kN","MN"] };
  const unitToBaseFactor = { mm:1/1000, cm:1/100, m:1, km:1000, J:1, kJ:1000, MJ:1_000_000, N:1, kN:1000, MN:1_000_000 };
  function parseNum(s) { if (s==null) return NaN; const t=String(s).replace(",",".").trim(); return t===""?NaN:Number(t); }
  function almostEqual(a,b,rel=0.05){ if(!isFinite(a)||!isFinite(b))return false; if(b===0)return Math.abs(a)<1e-9; return Math.abs(a-b)<=Math.abs(b)*rel; }
  function toast(msg){ const d=document.createElement("div"); d.className="text-yellow-300 text-sm mt-1"; d.textContent=msg; zapisFeedback.appendChild(d); setTimeout(()=>d.remove(),5000); }
  function info(msg){ const d=document.createElement("div"); d.className="text-blue-300 text-sm mt-1"; d.textContent=msg; vypocetFeedback.appendChild(d); setTimeout(()=>d.remove(),5000); }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }

  // ---------- Aktivní volby ----------
  function markActive(groupSelector, activeBtn) {
    document.querySelectorAll(groupSelector).forEach(b => b.classList.remove("active-pick"));
    activeBtn.classList.add("active-pick");
  }
  document.querySelectorAll('[id^="mode-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      selectedMode = btn.id.includes("practice") ? "practice" : "test";
      markActive('[id^="mode-"]', btn);
      updateStartButtonState();
      console.log(`🎓 Režim zvolen: ${selectedMode}`);
    });
  });
  document.querySelectorAll('[id^="level-"]').forEach(btn => {
    btn.addEventListener("click", () => {
      selectedLevel = btn.id.includes("normal") ? "normal" : btn.id.includes("hard") ? "hard" : "easy";
      markActive('[id^="level-"]', btn);
      updateStartButtonState();
      console.log(`🎯 Obtížnost zvolena: ${selectedLevel}`);
    });
  });
  topicSelect?.addEventListener("change", e => { selectedTopic = e.target.value; updateStartButtonState(); });
  function updateStartButtonState(){ const ready = selectedMode && selectedLevel && selectedTopic; startButton.disabled=!ready; startButton.classList.toggle("btn-disabled",!ready); if(ready) console.log("✅ Start povolen"); }

  // ---------- Přepínání obrazovek ----------
  function showPractice(){ setupScreen?.classList.add("hidden"); practiceScreen?.classList.remove("hidden"); practiceTitle.textContent = `Téma: ${selectedTopic==="vykon"?"Výkon":"Práce"}`; }
  function showSetup(){ practiceScreen?.classList.add("hidden"); setupScreen?.classList.remove("hidden"); }

  startButton?.addEventListener("click", () => { showPractice(); resetToZapis(true); generateProblem(); prepareUnitsForTopic(); initCalcRows(); console.log("▶️ Kliknuto na Spustit"); });
  backButton?.addEventListener("click", () => { showSetup(); clearPractice(); });
  newProblemButton?.addEventListener("click", () => { showPractice(); resetToZapis(true); generateProblem(); prepareUnitsForTopic(); initCalcRows(); });
  addRowBtn?.addEventListener("click", () => addZapisRow());

  // ---------- Generátor úloh ----------
  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function generateProblem(){
    const variant = randInt(1,2);
    let text,givens,result;
    if(selectedTopic==="vykon") selectedTopic="prace";
    if(variant===1){
      const FkN=randInt(1,9), s_m=2;
      text=`Těleso bylo přesunuto silou ${FkN} kN po dráze ${s_m} m. Jaká práce byla vykonána?`;
      givens=[{symbol:"F",value:FkN*1000,unit:"N"},{symbol:"s",value:s_m,unit:"m"}];
      result=(FkN*1000)*s_m;
    } else {
      const s_km=randInt(1,5), F_N=randInt(800,2000);
      text=`Auto jelo rovnoměrným přímočarým pohybem po dráze ${s_km} km. Tahová síla motoru byla ${F_N} N.`;
      givens=[{symbol:"s",value:s_km*1000,unit:"m"},{symbol:"F",value:F_N,unit:"N"}];
      result=(s_km*1000)*F_N;
    }
    currentProblem={text,givens,result};
    problemTextEl.textContent=text;
    console.log("🆕 Nový příklad:",text);
  }
  function prepareUnitsForTopic(){
    unitSelect.innerHTML="";
    (selectedTopic==="vykon"?["W","kW","MW"]:["J","kJ","MJ"]).forEach(u=>{
      const o=document.createElement("option"); o.value=o.textContent=u; unitSelect.appendChild(o);
    });
  }

  // ---------- Zápis ----------
  function createSelect(options,value,clsName){ const s=document.createElement("select"); s.className=`${clsName} p-2 rounded-md bg-gray-900 border border-gray-700 text-white`; options.forEach(o=>{ const opt=document.createElement("option"); opt.value=o; opt.textContent=o; s.appendChild(opt); }); s.value=value; return s; }
  function createInput(value){ const i=document.createElement("input"); i.type="text"; i.placeholder="Hodnota"; i.value=value; i.className="zapis-value p-2 rounded-md bg-gray-900 border border-gray-700 text-white"; return i; }
  function addZapisRow(symbol="-", value="", unit="-", baseHint=false){
    const symbols=["-","F","s","W"]; const units=["-","mm","cm","m","km","J","kJ","MJ","N","kN","MN"];
    const row=document.createElement("div"); row.className="grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";
    const sSel=createSelect(symbols,symbol,"zapis-symbol"); const val=createInput(value); const uSel=createSelect(units,unit,"zapis-unit");
    const lab=document.createElement("label"); lab.className="flex items-center gap-2 text-sm text-gray-300";
    const cb=document.createElement("input"); cb.type="checkbox"; cb.className="zapis-unknown h-4 w-4";
    const sp=document.createElement("span"); sp.textContent="Hledaná veličina"; lab.append(cb,sp);
    cb.addEventListener("change",()=>{ val.value=cb.checked?"?":""; val.disabled=cb.checked; rowLiveValidate(row); vFormula(); vSubs(); vRes(); });
    sSel.addEventListener("change",()=>{ rowLiveValidate(row); vFormula(); }); uSel.addEventListener("change",()=>rowLiveValidate(row)); val.addEventListener("input",()=>rowLiveValidate(row));
    row.append(sSel,val,uSel,lab); zapisContainer.appendChild(row);
    if(baseHint){ const hint=document.createElement("div"); hint.className="text-sm text-yellow-400 mt-1 italic col-span-4"; hint.textContent="💡 Převeď tuto veličinu na základní jednotku."; zapisContainer.appendChild(hint); }
  }
  function getUnknownSymbolFromZapis(){ const r=[...document.querySelectorAll(".zapis-row")].find(x=>x.querySelector(".zapis-unknown")?.checked); const sym=r?.querySelector(".zapis-symbol")?.value; return (sym&&sym!=="-")?sym:"W"; }
  function rowLiveValidate(row){
    row.classList.remove("ring-2","ring-red-500","ring-green-500");
    const symbol=row.querySelector(".zapis-symbol").value; const unit=row.querySelector(".zapis-unit").value; const unknown=row.querySelector(".zapis-unknown").checked; const rawStr=row.querySelector(".zapis-value").value.trim();
    if (symbol==="-" || unit==="-" || (!unknown && rawStr==="")) return;
    const kind=symbolToKind[symbol]; if(!kind) return;
    if (!unitSets[kind].includes(unit)) { row.classList.add("ring-2","ring-red-500"); toast(`❌ ${symbol} neodpovídá jednotce ${unit}.`); return; }
    const given=currentProblem?.givens?.find(g=>g.symbol===symbol); if(!given){ row.classList.add("ring-2","ring-green-500"); return; }
    if (!unknown){
      const val=parseNum(rawStr); if(!isFinite(val)){ row.classList.add("ring-2","ring-red-500"); toast("❌ Hodnota musí být číslo."); return; }
      const inBase=val*(unitToBaseFactor[unit]??NaN); if(!isFinite(inBase)){ row.classList.add("ring-2","ring-red-500"); toast(`❌ Neznámý převod pro jednotku ${unit}.`); return; }
      if (almostEqual(inBase,given.value)){ row.classList.add("ring-2","ring-green-500"); } else { row.classList.add("ring-2","ring-red-500"); toast(`❌ ${symbol}: očekává se ≈ ${given.value} ${given.unit}, máš ${val} ${unit} (≈ ${inBase} ${given.unit}).`); }
      if (unit!==given.unit) maybeAddBaseConversionRow(symbol,given.unit);
    } else { row.classList.add("ring-2","ring-green-500"); }
  }
  function maybeAddBaseConversionRow(symbol,baseUnitCode){
    const rows=[...document.querySelectorAll(".zapis-row")];
    const hasBase=rows.some(r=>r.querySelector(".zapis-symbol")?.value===symbol && r.querySelector(".zapis-unit")?.value===baseUnitCode);
    if(!hasBase){ addZapisRow(symbol,"",baseUnitCode,true); toast(`ℹ️ Přidej převod: ${symbol} na ${baseUnitCode}.`); }
  }
  function collectRows(){ return [...document.querySelectorAll(".zapis-row")].map(r=>({symbol:r.querySelector(".zapis-symbol").value, unit:r.querySelector(".zapis-unit").value, raw:r.querySelector(".zapis-value").value.trim(), unknown:r.querySelector(".zapis-unknown").checked})); }
  function mergedSummary(rows){ const order=[]; const bySym={}; rows.forEach(r=>{ if(!r.symbol||r.symbol===" -")return; if(!bySym[r.symbol]){bySym[r.symbol]=[]; order.push(r.symbol);} const part=r.unknown?`? ${r.unit}`:`${r.raw} ${r.unit}`; if(!bySym[r.symbol].includes(part)) bySym[r.symbol].push(part); }); return order.map(sym=>`${sym} = ${bySym[sym].join(" = ")}`).join("\n"); }

  checkZapisBtn?.addEventListener("click",()=>{
    if(!currentProblem) return;
    const rows=collectRows();
    if(!rows.some(r=>r.unknown)){ toast("⚠️ Označ hledanou veličinu."); return; }
    const errs=[];
    for (const g of currentProblem.givens){
      const r=rows.find(x=>x.symbol===g.symbol && !x.unknown && x.unit!=="-" && x.raw!=="");
      if(!r){ errs.push(`❌ Chybí veličina ${g.symbol}.`); continue; }
      const val=parseNum(r.raw); const factor=unitToBaseFactor[r.unit]??NaN; if(!isFinite(val)||!isFinite(factor)){ errs.push(`❌ ${g.symbol}: neplatná hodnota/jednotka.`); continue; }
      const inBase=val*factor; if(!almostEqual(inBase,g.value)){ errs.push(`❌ ${g.symbol}: očekává se ≈ ${g.value} ${g.unit}, máš ${val} ${r.unit} (≈ ${inBase} ${g.unit}).`); }
    }
    if (errs.length){ renderIssues(errs); return; }

    const summary=mergedSummary(rows);
    zapisReview.innerHTML = `<div class="p-3 bg-gray-900 border border-gray-700 rounded"><div class="font-semibold mb-2 text-gray-300">Souhrn zápisu:</div><pre class="text-gray-200 text-sm whitespace-pre-wrap">${summary}</pre></div>`;
    zapisStep.classList.add("hidden");
    vypocetStep.classList.remove("hidden");
    initCalcRows();
  });
  function renderIssues(errors){ const html=`<div class="feedback-wrong"><b>Chyby:</b><ul class="list-disc pl-5 mt-1">${errors.map(e=>`<li>${e}</li>`).join("")}</ul></div>`; zapisFeedback.insertAdjacentHTML("beforeend",html); }
  function resetToZapis(addFirstRow=false){ zapisStep.classList.remove("hidden"); vypocetStep.classList.add("hidden"); zapisContainer.innerHTML=""; zapisFeedback.innerHTML=""; zapisReview.innerHTML=""; vypocetFeedback.innerHTML=""; if(addFirstRow) addZapisRow(); }
  function clearPractice(){ resetToZapis(false); currentProblem=null; problemTextEl.textContent=""; }

  // ---------- Výpočet dvoupólově ----------
  function initCalcRows(){
    fL.value=""; fL.placeholder="např. W";
    fR.value=""; fR.placeholder="např. F * s";
    sL.value=""; sL.placeholder="např. W";
    sR.value=""; sR.placeholder="např. 1000 * 2";
    rL.value=""; rL.placeholder="např. W";
    rR.value=""; rR.placeholder="např. 2000";
    [fL,fR,sL,sR,rL,rR].forEach(markNEU);
    [fL,fR].forEach(el=>el.oninput=vFormula);
    [sL,sR].forEach(el=>el.oninput=vSubs);
    [rL,rR].forEach(el=>el.oninput=vRes);
    unitSelect.onchange=vRes;
  }
  function vFormula(){
    const L=(fL.value||"").trim(), R=(fR.value||"").trim();
    if(!L&&!R){ markNEU(fL); markNEU(fR); return; }
    const unknown=getUnknownSymbolFromZapis();
    const compact=`${L}=${R}`.replace(/\s+/g,"");
    let ok=false;
    if(unknown==="W") ok=/^W=(F[*·]s|s[*·]F)$/i.test(compact);
    else if(unknown==="F") ok=/^F=W\/s$/i.test(compact);
    else if(unknown==="s") ok=/^s=W\/F$/i.test(compact);
    (ok?markOK:markBAD)(fL); (ok?markOK:markBAD)(fR);
  }
  function vSubs(){
    const L=(sL.value||"").trim(), R=(sR.value||"").trim();
    if(!L&&!R){ markNEU(sL); markNEU(sR); return; }
    const unknown=getUnknownSymbolFromZapis();
    const Fg=currentProblem?.givens.find(g=>g.symbol==="F");
    const sg=currentProblem?.givens.find(g=>g.symbol==="s");
    const Wv=currentProblem?.result;
    let ok=false; let orderNote="";
    if(unknown==="W"){
      const m=`${L}=${R}`.replace(/\s+/g,"").match(/^W=(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/i);
      if(m&&Fg&&sg){ const a=parseNum(m[1]), b=parseNum(m[2]);
        ok=(almostEqual(a,Fg.value)&&almostEqual(b,sg.value))||(almostEqual(a,sg.value)&&almostEqual(b,Fg.value));
        if(/^W\s*=\s*F\s*[*·]\s*s$/i.test(`${fL.value}=${fR.value}`) && !(almostEqual(a,Fg.value)&&almostEqual(b,sg.value))){ orderNote="ℹ️ Pořadí dosazení by mělo odpovídat vzorci (F pak s)."; }
      }
    } else if(unknown==="F" && sg){
      const m=`${L}=${R}`.replace(/\s+/g,"").match(/^F=(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/i);
      if(m&&isFinite(Wv)){ ok=almostEqual(parseNum(m[1]),Wv)&&almostEqual(parseNum(m[2]),sg.value); }
    } else if(unknown==="s" && Fg){
      const m=`${L}=${R}`.replace(/\s+/g,"").match(/^s=(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/i);
      if(m&&isFinite(Wv)){ ok=almostEqual(parseNum(m[1]),Wv)&&almostEqual(parseNum(m[2]),Fg.value); }
    }
    (ok?markOK:markBAD)(sL); (ok?markOK:markBAD)(sR); if(orderNote) info(orderNote);
  }
  function vRes(){
    const L=(rL.value||"").trim(), R=(rR.value||"").trim();
    if(!L&&!R){ markNEU(rL); markNEU(rR); return; }
    const unknown=getUnknownSymbolFromZapis();
    let ok=false;
    if(unknown==="W"){
      const ans=parseNum(R); if(!isFinite(ans)){ markBAD(rL); markBAD(rR); return; }
      const factor=unitSelect? (unitToBaseFactor[unitSelect.value] ?? 1) : 1;
      ok=almostEqual(ans*factor,currentProblem.result);
    } else { ok=!!R; }
    (ok?markOK:markBAD)(rL); (ok?markOK:markBAD)(rR);
  }

  // ---------- Kontrola výpočtu ----------
  checkCalcBtn?.addEventListener("click",()=>{
    vypocetFeedback.innerHTML="";
    const L1=(fL.value||"").trim(), R1=(fR.value||"").trim();
    const L2=(sL.value||"").trim(), R2=(sR.value||"").trim();
    const L3=(rL.value||"").trim(), R3=(rR.value||"").trim();
    const resUnit=unitSelect.value;
    const unknown=getUnknownSymbolFromZapis();
    const compact=`${L1}=${R1}`.replace(/\s+/g,"");
    let formulaOK=false;
    if(unknown==="W") formulaOK=/^W=(F[*·]s|s[*·]F)$/i.test(compact);
    else if(unknown==="F") formulaOK=/^F=W\/s$/i.test(compact);
    else if(unknown==="s") formulaOK=/^s=W\/F$/i.test(compact);

    let substOK=false; let substOrderNote="";
    const Fg=currentProblem?.givens.find(g=>g.symbol==="F");
    const sg=currentProblem?.givens.find(g=>g.symbol==="s");
    const Wv=currentProblem?.result;
    if(unknown==="W"){
      const m=`${L2}=${R2}`.replace(/\s+/g,"").match(/^W=(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/i);
      if(m&&Fg&&sg){ const a=parseNum(m[1]), b=parseNum(m[2]);
        substOK=(almostEqual(a,Fg.value)&&almostEqual(b,sg.value))||(almostEqual(a,sg.value)&&almostEqual(b,Fg.value));
        if(/^W\s*=\s*F\s*[*·]\s*s$/i.test(`${L1}=${R1}`) && !(almostEqual(a,Fg.value)&&almostEqual(b,sg.value))){ substOrderNote="ℹ️ Pořadí v dosazení by mělo odpovídat vzorci (F pak s)."; }
      }
    } else if(unknown==="F" && sg){
      const m=`${L2}=${R2}`.replace(/\s+/g,"").match(/^F=(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/i);
      if(m&&isFinite(Wv)){ substOK=almostEqual(parseNum(m[1]),Wv)&&almostEqual(parseNum(m[2]),sg.value); }
    } else if(unknown==="s" && Fg){
      const m=`${L2}=${R2}`.replace(/\s+/g,"").match(/^s=(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/i);
      if(m&&isFinite(Wv)){ substOK=almostEqual(parseNum(m[1]),Wv)&&almostEqual(parseNum(m[2]),Fg.value); }
    }

    let resultOK=false; let resNote="";
    if(unknown==="W"){
      const ans=parseNum(R3);
      if(isFinite(ans)){ const factor=unitToBaseFactor[resUnit] ?? 1; resultOK=almostEqual(ans*factor,currentProblem.result); } else resNote="❌ Výsledek musí být číslo.";
    } else { resultOK=!!R3; }

    const summaryZapis=mergedSummary(collectRows());
    const msg=[];
    msg.push(formulaOK?"✅ Vzorec v pořádku.":"❌ Uprav vzorec (W=F*s / F=W/s / s=W/F).");
    msg.push(substOK?"✅ Správné dosazení.":"❌ Zkontroluj dosazení (čísla musí vycházet ze zadání).");
    if(substOrderNote) msg.push(substOrderNote);
    msg.push(resultOK?"✅ Výsledek vypočten správně.":"❌ Výsledek neodpovídá. Zkus projít kroky znovu.");
    if(resNote) msg.push(resNote);

    const html = `
      <div class="space-y-4">
        <div class="p-3 bg-gray-900 border border-gray-700 rounded">
          <div class="font-semibold text-gray-300 mb-1">Zadání:</div>
          <div class="text-gray-200">${currentProblem.text}</div>
        </div>
        <div class="p-3 bg-gray-900 border border-gray-700 rounded">
          <div class="font-semibold text-gray-300 mb-1">Tvůj zápis:</div>
          <pre class="text-gray-200 whitespace-pre-wrap text-sm">${summaryZapis}</pre>
        </div>
        <div class="p-3 bg-gray-900 border border-gray-700 rounded">
          <div class="font-semibold text-gray-300 mb-1">Tvoje řešení:</div>
          <div class="text-gray-200 text-sm">
            <div><b>Vzorec:</b> ${escapeHtml(`${L1} = ${R1}`)}</div>
            <div><b>Dosazení:</b> ${escapeHtml(`${L2} = ${R2}`)}</div>
            <div><b>Výsledek:</b> ${escapeHtml(`${L3} = ${R3} ${resUnit}`)}</div>
          </div>
        </div>
        <div class="p-3 bg-gray-900 border border-gray-700 rounded">
          <div class="font-semibold text-gray-300 mb-1">Hodnocení:</div>
          <ul class="list-disc pl-5 text-gray-200 text-sm">${msg.map(m=>`<li>${m}</li>`).join("")}</ul>
        </div>
      </div>`;
    vypocetFeedback.innerHTML=html;
  });

  // ---------- Modály ----------
  function toggleModal(id,show){ const m=document.getElementById(id); if(!m) return; m.classList.toggle("hidden",!show); }
  tools.openCalc?.addEventListener("click",()=>{ renderCalculator(); toggleModal("calculator-modal",true); });
  tools.openFormula?.addEventListener("click",()=>{ renderFormulaTriangle(); toggleModal("formula-modal",true); });
  tools.openHelp?.addEventListener("click",()=>{ renderHelp(); toggleModal("help-modal",true); });
  tools.openDiagram?.addEventListener("click",()=>{ renderDiagram(); toggleModal("diagram-modal",true); });
  tools.closeCalc?.addEventListener("click",()=>toggleModal("calculator-modal",false));
  tools.closeFormula?.addEventListener("click",()=>toggleModal("formula-modal",false));
  tools.closeHelp?.addEventListener("click",()=>toggleModal("help-modal",false));
  tools.closeDiagram?.addEventListener("click",()=>toggleModal("diagram-modal",false));
  ["calculator-modal","formula-modal","help-modal","diagram-modal"].forEach(id=>{
    const m=document.getElementById(id);
    m?.addEventListener("click",(e)=>{ if(e.target===m) toggleModal(id,false); });
  });

  // ---------- Kalkulačka ----------
  function renderCalculator(){
    const display=tools.calcDisplay, history=tools.calcHistory, btns=tools.calcButtons;
    if(!display||!history||!btns)return;
    btns.innerHTML="";
    const keys=["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+","C","⌫","Copy"];
    keys.forEach(k=>{ const b=document.createElement("button"); b.textContent=k; b.className="bg-gray-700 text-white py-2 rounded hover:bg-gray-600"; btns.appendChild(b); });
    let current=""; function update(){ display.textContent=current||"0"; } update();
    btns.addEventListener("click",e=>{
      const t=e.target.textContent;
      if(t==="C"){ current=""; history.textContent=""; }
      else if(t==="⌫"){ current=current.slice(0,-1); }
      else if(t==="="){ try{ const r=eval(current); history.textContent=`${current} =`; current=String(r);}catch{current="Error";} }
      else if(t==="Copy"){ navigator.clipboard?.writeText(display.textContent); }
      else { current+=t; }
      update();
    });
    document.addEventListener("keydown",e=>{
      if(!tools.modalCalc || tools.modalCalc.classList.contains("hidden"))return;
      if(/[0-9+\-*/.]/.test(e.key)){ current+=e.key; update(); }
      else if(e.key==="Enter"){ try{ const r=eval(current); history.textContent=`${current} =`; current=String(r);}catch{current="Error";} update(); }
      else if(e.key==="Backspace"){ current=current.slice(0,-1); update(); }
    });
  }

  // ---------- Vzorec (trojúhelník) ----------
  function renderFormulaTriangle(){
    const c=tools.formulaSvgContainer; if(!c) return;
    c.innerHTML=`
      <svg width="240" height="180" viewBox="0 0 240 180">
        <polygon points="120,15 25,165 215,165" fill="none" stroke="white" stroke-width="2"/>
        <line x1="52" y1="112" x2="188" y2="112" stroke="white" stroke-width="2"/>
        <text x="120" y="70"  fill="white" font-size="36" text-anchor="middle">W</text>
        <text x="120" y="150" fill="white" font-size="26" text-anchor="middle">F · s</text>
      </svg>`;
  }

  // ---------- Diagram ----------
  function renderDiagram(){
    const c=tools.diagramSvgContainer; if(!c) return;
    if(!currentProblem){ c.innerHTML=`<p class="text-gray-400 text-sm">Nejdříve spusťte příklad.</p>`; return; }
    const F=currentProblem.givens.find(g=>g.symbol==="F")||{};
    const s=currentProblem.givens.find(g=>g.symbol==="s")||{};
    c.innerHTML=`
      <svg width="340" height="190" viewBox="0 0 340 190">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="red"/>
          </marker>
          <marker id="arrowhead2" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="orange"/>
          </marker>
        </defs>
        <rect x="25" y="160" width="290" height="8" fill="#777"/>
        <rect x="85" y="115" width="90" height="42" fill="#00AEEF" stroke="white" stroke-width="2"/>
        <circle cx="103" cy="160" r="9" fill="#333"/>
        <circle cx="155" cy="160" r="9" fill="#333"/>
        <line x1="175" y1="130" x2="255" y2="130" stroke="red" stroke-width="3" marker-end="url(#arrowhead)"/>
        <text x="215" y="118" fill="red" font-size="16" text-anchor="middle">F = ${F.value ?? "?"} ${F.unit ?? ""}</text>
        <line x1="85" y1="175" x2="255" y2="175" stroke="orange" stroke-width="2" marker-end="url(#arrowhead2)"/>
        <text x="170" y="190" fill="orange" font-size="14" text-anchor="middle">s = ${s.value ?? "?"} ${s.unit ?? ""}</text>
      </svg>`;
  }

  console.log("✅ v12 připraveno.");
});
