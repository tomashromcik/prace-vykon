/* ==========================================================
   app_main_v31_unified.js
   (1) UI: režimy, start, nový příklad, reset obrazovky
   (2) Zápis: řádky, live kontrola, souhrn, přechod do výpočtu
   (3) Výpočet: 3 řádky (vzorec / dosazení / výsledek) + kontrola
   (4) Nástroje: obrázek / vzorec / nápověda / kalkulačka (modály)
   (5) Generátor úloh v29 s REALISTICKÝMI rozsahy pro typy
   (6) Fix výsledku: vždy počítáme očekávanou hodnotu z daných veličin
   ========================================================== */

console.log("🧩 Načítání app_main_v31_unified.js  patched...");

// -------------------- Pomocné zkratky --------------------
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const el = (tag, cls="") => { const n=document.createElement(tag); if(cls) n.className=cls; return n; };

const NUM = (s) => {
  if (s==null) return NaN;
  const t = String(s).replace(",", ".").trim();
  if (t==="") return NaN;
  return Number(t);
};
const almostEqual = (a,b,rel=0.05) => {
  if (!isFinite(a) || !isFinite(b)) return false;
  if (b === 0) return Math.abs(a) < 1e-9;
  return Math.abs(a-b) <= Math.abs(b)*rel;
};

function markOK(input)  { input.classList.remove("ring-2","ring-red-500"); input.classList.add("ring-2","ring-green-500"); }
function markBAD(input) { input.classList.remove("ring-2","ring-green-500"); input.classList.add("ring-2","ring-red-500");  }

// -------------------- Stav --------------------
let selectedMode  = null;
let selectedLevel = null;
let selectedTopic = "prace"; // zatím práce
let currentProblem = null;   // {text, givens:[{symbol,value,unit}], result, askFor}

// -------------------- DOM --------------------
const setupScreen      = $("#setup-screen");
const practiceScreen   = $("#practice-screen");
const practiceTitle    = $("#practice-title");

const startButton      = $("#start-button");
const backButton       = $("#back-button");
const newProblemButton = $("#new-problem-button");
const topicSelect      = $("#topic-select");

const problemTextEl    = $("#problem-text");

// nástroje (modály)
const btnDiagram = $("#open-diagram-button");
const btnFormula = $("#open-formula-button");
const btnHelp    = $("#open-help-button");
const btnCalc    = $("#open-calculator-button");

const modalDiagram = $("#diagram-modal");
const modalFormula = $("#formula-modal");
const modalHelp    = $("#help-modal");
const modalCalc    = $("#calculator-modal");

const closeDiagram = $("#close-diagram-button");
const closeFormula = $("#close-formula-button");
const closeHelp    = $("#close-help-button");
const closeCalc    = $("#close-calculator-button");

const diagramSvgContainer = $("#diagram-svg-container");
const formulaSvgContainer = $("#formula-svg-container");
const helpContent = $("#help-content");
const calcDisplay = $("#calculator-display");
const calcHistory = $("#calculator-history");
const calcButtons = $("#calculator-buttons");

// zápis + výpočet
const zapisStep       = $("#zapis-step");
const zapisContainer  = $("#zapis-container");
const checkZapisBtn   = $("#check-zapis-button");
const addRowBtn       = $("#add-zapis-row-button");
const zapisFeedback   = $("#zapis-feedback-container");
const zapisReview     = $("#zapis-review-container");

const vypocetStep     = $("#vypocet-step");
const formulaLHS      = $("#formula-lhs");
const formulaRHS      = $("#formula-rhs");
const subsLHS         = $("#subs-lhs");
const subsRHS         = $("#subs-rhs");
const resultLHS       = $("#result-lhs");
const resultRHS       = $("#result-rhs");
const unitSelect      = $("#unit-select");
const checkCalcBtn    = $("#check-calculation-button");
const vypocetFeedback = $("#vypocet-feedback-container");

// -------------------- Aktivní volby (setup) --------------------
function markActive(groupSelector, btn) {
  $$(groupSelector).forEach(b=>{
    b.classList.remove("ring-2","ring-blue-500","bg-blue-600","text-white");
    b.classList.add("btn-secondary");
  });
  btn.classList.add("ring-2","ring-blue-500","bg-blue-600","text-white");
}

$$('[id^="mode-"]').forEach(btn=>{
  btn.addEventListener("click", ()=>{
    selectedMode = btn.id.includes("practice") ? "practice" : "test";
    markActive('[id^="mode-"]', btn);
    updateStartButtonState();
    console.log(`🎓 Režim zvolen: ${selectedMode}`);
  });
});

$$('[id^="level-"]').forEach(btn=>{
  btn.addEventListener("click", ()=>{
    selectedLevel = btn.id.includes("normal") ? "normal" :
                    btn.id.includes("hard")   ? "hard"   : "easy";
    markActive('[id^="level-"]', btn);
    updateStartButtonState();
    console.log(`🎯 Obtížnost zvolena: ${selectedLevel}`);
  });
});

topicSelect?.addEventListener("change",(e)=>{
  selectedTopic = e.target.value;
  updateStartButtonState();
});

function updateStartButtonState(){
  const ready = selectedMode && selectedLevel && selectedTopic;
  startButton.disabled = !ready;
  startButton.classList.toggle("btn-disabled", !ready);
  if (ready) console.log("✅ Start povolen");
}

// -------------------- Přepínač obrazovek --------------------
function showPractice(){
  setupScreen?.classList.add("hidden");
  practiceScreen?.classList.remove("hidden");
  practiceTitle.textContent = `Téma: ${selectedTopic === "vykon" ? "Výkon" : "Práce"}`;
}
function showSetup(){
  practiceScreen?.classList.add("hidden");
  setupScreen?.classList.remove("hidden");
}

// -------------------- Reset & start --------------------
startButton?.addEventListener("click", ()=>{
  showPractice();
  fullReset();
  generateProblem();
  prepareUnitsForAsk();
  console.log("▶️ Kliknuto na Spustit");
});

backButton?.addEventListener("click", ()=>{
  showSetup();
  fullReset(true);
});

newProblemButton?.addEventListener("click", ()=>{
  fullReset();
  generateProblem();
  prepareUnitsForAsk();
});

// -------------------- Reset obrazovky --------------------
function resetZapis(addBaseRow=false){
  zapisStep.classList.remove("hidden");
  vypocetStep.classList.add("hidden");

  zapisContainer.innerHTML = "";
  zapisFeedback.innerHTML = "";
  zapisReview.innerHTML = "";

  if (addBaseRow) addZapisRow();

  // vyprázdni výpočet
  try { formulaLHS.value = ""; } catch {}
  try { formulaRHS.value = ""; } catch {}
  try { subsLHS.value = ""; } catch {}
  try { subsRHS.value = ""; } catch {}
  try { resultLHS.value = ""; } catch {}
  try { resultRHS.value = ""; } catch {}
  try { unitSelect.value = "J"; } catch {}
  try { vypocetFeedback.innerHTML = ""; } catch {}
}

function fullReset(hard=false){
  resetZapis(true);
  if (hard){
    currentProblem = null;
    problemTextEl.textContent = "";
  }
}

// -------------------- Generátor úloh v29 (REALISTIC) --------------------
/*
  Typy (pro easy/normal – vše v base jednotkách):
  - A: Auto / tahová síla motoru: F = 800–3000 N, s = 0.5–5 km
  - B: Zedník s pevnou kladkou:  F = 200–1000 N, h = 1–5 m
  - C: Silák + činka:            F = 500–2000 N, h = 0.3–1.0 m
  - D: Těleso přesunuto silou kN po dráze 2 m (pro pestrost a převody): F = 1–9 kN, s = 2 m
  Vždy náhodně zvolíme hledanou veličinu W/F/s, pokud je to smysluplné.
*/

function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function randFrom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function round1(x){ return Math.round(x*10)/10; }

function generateProblem(){
  const variant = randFrom(["A","B","C","D"]);
  let text = "", givens = [], askFor = "W", result = NaN, diagram="generic";

  if (variant==="A"){
    // Auto – síla motoru + dráha v km  => s převodem do m
    const F = randInt(800,3000);             // N
    const s_km = randInt(1,5)/2 + 0.5;       // 0.5–3.0 km (po 0.5 km)
    const s_m = Math.round(s_km*1000);
    const asks = ["W","F","s"];
    askFor = randFrom(asks);
    givens = [];
    if (askFor!=="F") givens.push({symbol:"F", value:F, unit:"N"});
    if (askFor!=="s") givens.push({symbol:"s", value:s_m, unit:"m"});
    // výsledek (v base)
    const W = F*s_m;
    if (askFor==="W")      result = W;
    else if (askFor==="F") result = W;  // uložíme W – použijeme při validaci F = W/s
    else if (askFor==="s") result = W;  // uložíme W – použijeme při validaci s = W/F
    text = `Tahová síla motoru auta byla ${Math.round(F/100)/10} kN a auto jelo po dráze ${s_m/1000} km. Jaká ${askFor==="W"?"práce byla vykonána?":(askFor==="F"?"síla působila?":"dráha byla uražena?")}`;
    diagram="auto";
  }
  else if (variant==="B"){
    // Zedník s pevnou kladkou
    const F = randInt(200,1000); // N
    const h = randInt(1,5);      // m
    askFor = randFrom(["W","F","s"]);
    givens = [];
    if (askFor!=="F") givens.push({symbol:"F", value:F, unit:"N"});
    if (askFor!=="s") givens.push({symbol:"s", value:h, unit:"m"});
    const W = F*h;
    if (askFor==="W") result = W;
    else result = W; // viz validace
    text = `Zedník zvedl těleso pomocí pevné kladky silou ${F} N do výšky ${h} m. ${askFor==="W"?"Jaká práce byla vykonána?":(askFor==="F"?"Jaká síla působila?":"Do jaké výšky těleso zvedl?")}`;
    diagram="pulley";
  }
  else if (variant==="C"){
    // Silák s činkou – realistické
    const F = randInt(500,2000);         // N
    const h = Math.round((randInt(3,10)/10)*10)/10; // 0.3–1.0 m
    askFor = randFrom(["W","F","s"]);
    givens = [];
    if (askFor!=="F") givens.push({symbol:"F", value:F, unit:"N"});
    if (askFor!=="s") givens.push({symbol:"s", value:h, unit:"m"});
    const W = F*h;
    if (askFor==="W") result=W; else result=W;
    text = `Silák působil silou ${F} N a vykonal práci ${Math.round(W)} J. Do jaké výšky zvedl činku?`;
    if (askFor==="W") text = `Silák působil silou ${F} N a zvedl činku do výšky ${h} m. Jakou práci vykonal?`;
    if (askFor==="F") text = `Silák zvedl činku do výšky ${h} m a vykonal práci ${Math.round(W)} J. Jakou silou působil?`;
    diagram="strongman";
  }
  else {
    // D: kN a 2 m (převody)
    const FkN = randInt(1,9);
    const s = 2;
    askFor = randFrom(["W","F","s"]);
    givens = [];
    if (askFor!=="F") givens.push({symbol:"F", value:FkN*1000, unit:"N"});
    if (askFor!=="s") givens.push({symbol:"s", value:s, unit:"m"});
    const W = FkN*1000*s;
    if (askFor==="W") result=W; else result=W;
    text = `Těleso bylo přesunuto silou ${FkN} kN po dráze ${s} m. ${askFor==="W"?"Jaká práce byla vykonána?":(askFor==="F"?"Jaká síla působila?":"Jaká byla dráha?")}`;
    diagram="generic";
  }

  currentProblem = {text, givens, result, askFor, diagram};
  problemTextEl.textContent = text;
  console.log("🆕 Nový příklad (v29):", currentProblem);
  renderDiagram(); // předvyplnit dle typu
  renderHelp();
  renderFormulaTriangle();
}

function prepareUnitsForAsk(){
  if (!currentProblem) return;
  // pro práci výchozí jednotky
  unitSelect.innerHTML = "";
  ["J","kJ","MJ"].forEach(u=>{
    const o = el("option");
    o.value=u; o.textContent=u;
    unitSelect.appendChild(o);
  });
}

// -------------------- Zápis: UI řádky --------------------
const symbolToKind = { s:"length", F:"force", W:"energy" };
const unitSets     = {
  length:["mm","cm","m","km"],
  energy:["J","kJ","MJ"],
  force:["N","kN","MN"]
};
const unitToBase   = { mm:1/1000, cm:1/100, m:1, km:1000, J:1, kJ:1000, MJ:1_000_000, N:1, kN:1000, MN:1_000_000 };

function createSelect(options, value, cls){
  const s = el("select", `${cls} p-2 rounded-md bg-gray-900 border border-gray-700 text-white`);
  options.forEach(o=>{ const op = el("option"); op.value = o; op.textContent = o; s.appendChild(op);});
  if (value) s.value = value;
  return s;
}
function createInput(value){
  const i = el("input","zapis-value p-2 rounded-md bg-gray-900 border border-gray-700 text-white");
  i.type="text"; i.placeholder="Hodnota"; i.value = value || "";
  return i;
}

function addZapisRow(symbol="-", value="", unit="-", baseHint=false){
  const row = el("div","grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700");

  const sSel = createSelect(["-","F","s","W"], symbol, "zapis-symbol");
  const val  = createInput(value);
  const uSel = createSelect(["-","mm","cm","m","km","J","kJ","MJ","N","kN","MN"], unit, "zapis-unit");

  const lab  = el("label","flex items-center gap-2 text-sm text-gray-300");
  const cb   = el("input","zapis-unknown h-4 w-4"); cb.type = "checkbox";
  const sp   = el("span"); sp.textContent = "Hledaná veličina";
  lab.append(cb, sp);

  cb.addEventListener("change", ()=>{
    val.value = cb.checked ? "?" : "";
    val.disabled = cb.checked;
    rowLiveValidate(row);
    formulaLiveValidate(); 
    substitutionLiveValidate();
    resultLiveValidate();
  });
  sSel.addEventListener("change", ()=>{ rowLiveValidate(row); formulaLiveValidate(); });
  uSel.addEventListener("change", ()=> rowLiveValidate(row));
  val.addEventListener("input", ()=> rowLiveValidate(row));

  row.append(sSel,val,uSel,lab);
  zapisContainer.appendChild(row);

  if (baseHint){
    const hint = el("div","text-sm text-yellow-400 mt-1 italic col-span-4");
    hint.textContent = "💡 Převeď tuto veličinu na základní jednotku.";
    zapisContainer.appendChild(hint);
  }
}

addRowBtn?.addEventListener("click", ()=> addZapisRow());

function rowLiveValidate(row){
  row.classList.remove("ring-2","ring-red-500","ring-green-500");
  const symbol  = row.querySelector(".zapis-symbol").value;
  const unit    = row.querySelector(".zapis-unit").value;
  const unknown = row.querySelector(".zapis-unknown").checked;
  const raw     = row.querySelector(".zapis-value").value.trim();

  if (symbol==="-" || unit==="-" || (!unknown && raw==="")) return;
  const kind = symbolToKind[symbol]; if (!kind) return;

  if (!unitSets[kind].includes(unit)){
    row.classList.add("ring-2","ring-red-500");
    return;
  }
  const given = currentProblem?.givens?.find(g=> g.symbol===symbol);
  if (!given){ row.classList.add("ring-2","ring-green-500"); return; }

  if (!unknown){
    const v = NUM(raw);
    if (!isFinite(v)){ row.classList.add("ring-2","ring-red-500"); return; }
    const inBase = v * (unitToBase[unit] ?? NaN);
    if (!isFinite(inBase)){ row.classList.add("ring-2","ring-red-500"); return; }
    if (almostEqual(inBase, given.value)) row.classList.add("ring-2","ring-green-500");
    else row.classList.add("ring-2","ring-red-500");

    // nabídnout převodový řádek, pokud žák použil kN/km apod.
    if (unit !== given.unit) maybeAddBaseConversionRow(symbol, given.unit);
  } else {
    row.classList.add("ring-2","ring-green-500");
  }
}

function maybeAddBaseConversionRow(symbol, baseUnit){
  const rows = $$(".zapis-row");
  const hasBase = rows.some(r=>{
    const s = r.querySelector(".zapis-symbol")?.value;
    const u = r.querySelector(".zapis-unit")?.value;
    return s===symbol && u===baseUnit;
  });
  if (!hasBase) addZapisRow(symbol,"",baseUnit,true);
}

function collectRows(){
  return $$(".zapis-row").map(r=>({
    symbol:  r.querySelector(".zapis-symbol").value,
    unit:    r.querySelector(".zapis-unit").value,
    raw:     r.querySelector(".zapis-value").value.trim(),
    unknown: r.querySelector(".zapis-unknown").checked
  }));
}
function mergedSummary(rows){
  const order=[], by={};
  rows.forEach(r=>{
    if (!r.symbol || r.symbol==="-" ) return;
    if (!by[r.symbol]){ by[r.symbol]=[]; order.push(r.symbol); }
    const part = r.unknown ? `? ${r.unit}` : `${r.raw} ${r.unit}`;
    if (!by[r.symbol].includes(part)) by[r.symbol].push(part);
  });
  return order.map(sym => `${sym} = ${by[sym].join(" = ")}`).join("\n");
}

function getUnknownSymbolFromZapis(){
  const r = $$(".zapis-row").find(x => x.querySelector(".zapis-unknown")?.checked);
  const sym = r?.querySelector(".zapis-symbol")?.value;
  return (sym && sym!=="-") ? sym : (currentProblem?.askFor || "W");
}

checkZapisBtn?.addEventListener("click", ()=>{
  if (!currentProblem){ alert("Nejprve spusťte příklad."); return; }
  const rows = collectRows();
  if (!rows.some(r=>r.unknown)){ zapisFeedback.innerHTML = `<div class="feedback-wrong">Označ hledanou veličinu.</div>`; return; }

  const errs=[];
  for (const g of currentProblem.givens){
    const r = rows.find(x=> x.symbol===g.symbol && !x.unknown && x.unit!=="-" && x.raw!=="");
    if (!r){ errs.push(`Chybí veličina ${g.symbol}.`); continue; }
    const val = NUM(r.raw);
    const factor = unitToBase[r.unit] ?? NaN;
    if (!isFinite(val) || !isFinite(factor)){ errs.push(`Neplatná hodnota/jednotka u ${g.symbol}.`); continue; }
    const inBase = val*factor;
    if (!almostEqual(inBase, g.value)){
      errs.push(`${g.symbol}: očekává se ≈ ${g.value} ${g.unit}, máš ${val} ${r.unit} (≈ ${inBase} ${g.unit}).`);
    }
  }
  if (errs.length){
    zapisFeedback.innerHTML = `<div class="feedback-wrong"><b>Chyby:</b><ul class="list-disc pl-5 mt-1">${errs.map(e=>`<li>${e}</li>`).join("")}</ul></div>`;
    return;
  }
  // souhrn
  const summary = mergedSummary(rows);
  zapisReview.innerHTML = `
    <div class="p-3 bg-gray-900 border border-gray-700 rounded">
      <div class="font-semibold mb-2 text-gray-300">Souhrn zápisu:</div>
      <pre class="text-gray-200 text-sm whitespace-pre-wrap">${summary}</pre>
    </div>
  `;
  // přechod do výpočtu
  zapisStep.classList.add("hidden");
  vypocetStep.classList.remove("hidden");

  // předvyplnit LHS podle hledané veličiny
  const u = getUnknownSymbolFromZapis();
  formulaLHS.value = u;
  resultLHS.value  = u;
  subsLHS.value    = u;
  if (u==="W")      formulaRHS.value="F*s";
  else if (u==="F") formulaRHS.value="W/s";
  else              formulaRHS.value="W/F";

  subsRHS.value = "";
  resultRHS.value = "";
  unitSelect.value="J";
});

// -------------------- Výpočet: Live validace --------------------
[formulaLHS, formulaRHS].forEach(i=> i?.addEventListener("input", formulaLiveValidate));
[subsLHS, subsRHS].forEach(i=> i?.addEventListener("input", substitutionLiveValidate));
[resultLHS, resultRHS].forEach(i=> i?.addEventListener("input", resultLiveValidate));
unitSelect?.addEventListener("change", resultLiveValidate);

function formulaLiveValidate(){
  if (!formulaLHS || !formulaRHS) return;
  [formulaLHS, formulaRHS].forEach(n=> n.classList.remove("ring-2","ring-red-500","ring-green-500"));
  const lhs = (formulaLHS.value||"").replace(/\s+/g,"");
  const rhs = (formulaRHS.value||"").replace(/\s+/g,"");
  const unknown = getUnknownSymbolFromZapis();

  let ok=false;
  if (unknown==="W") ok = (lhs==="W" && /^(F[*·]s|s[*·]F)$/.test(rhs));
  else if (unknown==="F") ok = (lhs==="F" && rhs==="W/s");
  else if (unknown==="s") ok = (lhs==="s" && rhs==="W/F");
  if (ok) { markOK(formulaLHS); markOK(formulaRHS); }
  else if (lhs || rhs) { markBAD(formulaLHS); markBAD(formulaRHS); }
}

function substitutionLiveValidate(){
  if (!subsLHS || !subsRHS) return;
  [subsLHS, subsRHS].forEach(n=> n.classList.remove("ring-2","ring-red-500","ring-green-500"));
  const lhs = (subsLHS.value||"").replace(/\s+/g,"");
  const txt = (subsRHS.value||"").replace(/\s+/g,"");
  const unknown = getUnknownSymbolFromZapis();
  const Fg = currentProblem?.givens.find(g=>g.symbol==="F");
  const sg = currentProblem?.givens.find(g=>g.symbol==="s");
  const Wval = currentProblem?.result;

  let ok=false;
  if (unknown==="W") {
    if (lhs==="W"){
      const m = txt.match(/^(\d+(?:[.,]\d+)?)[*×](\d+(?:[.,]\d+)?)$/);
      if (m && Fg && sg){
        const a=NUM(m[1]), b=NUM(m[2]);
        ok = (almostEqual(a,Fg.value) && almostEqual(b,sg.value)) ||
             (almostEqual(a,sg.value) && almostEqual(b,Fg.value));
      }
    }
  } else if (unknown==="F") {
    if (lhs==="F"){
      const m = txt.match(/^(\d+(?:[.,]\d+)?)[/:](\d+(?:[.,]\d+)?)$/);
      if (m && sg && isFinite(Wval)){
        ok = almostEqual(NUM(m[1]), Wval) && almostEqual(NUM(m[2]), sg.value);
      }
    }
  } else if (unknown==="s"){
    if (lhs==="s"){
      const m = txt.match(/^(\d+(?:[.,]\d+)?)[/:](\d+(?:[.,]\d+)?)$/);
      if (m && Fg && isFinite(Wval)){
        ok = almostEqual(NUM(m[1]), Wval) && almostEqual(NUM(m[2]), Fg.value);
      }
    }
  }
  if (ok) { markOK(subsLHS); markOK(subsRHS); }
  else if (lhs || txt) { markBAD(subsLHS); markBAD(subsRHS); }
}

// FIX – výpočet očekávání vždy z daných veličin (ne z resultu v kN/km)
function resultLiveValidate(){
  if (!resultRHS) return;
  resultRHS.classList.remove("ring-2","ring-red-500","ring-green-500");

  const unknown = getUnknownSymbolFromZapis() || currentProblem?.askFor || "W";
  const ans = NUM(resultRHS.value);
  const unit = (unitSelect?.value || "J").trim();
  if (!isFinite(ans)){ markBAD(resultRHS); return; }

  const Fg = currentProblem?.givens.find(g=>g.symbol==="F");
  const sg = currentProblem?.givens.find(g=>g.symbol==="s");
  const Wg = currentProblem?.givens.find(g=>g.symbol==="W");

  const factor = {J:1, kJ:1000, MJ:1_000_000}[unit] ?? 1;
  let ansBase = ans;
  let expected = NaN;

  if (unknown==="W" && Fg && sg){
    expected = Fg.value * sg.value;
    ansBase = ans * factor; // převod do J
  } else if (unknown==="F" && sg){
    const Wbase = (Wg?.value ?? currentProblem?.result ?? NaN);
    expected = Wbase / sg.value;  // v N
    ansBase = ans;                // už v N
  } else if (unknown==="s" && Fg){
    const Wbase = (Wg?.value ?? currentProblem?.result ?? NaN);
    expected = Wbase / Fg.value;  // v m
    ansBase = ans;
  }

  if (isFinite(expected) && almostEqual(ansBase, expected)) markOK(resultRHS);
  else markBAD(resultRHS);
}

// -------------------- Finální kontrola výpočtu --------------------
checkCalcBtn?.addEventListener("click", ()=>{
  vypocetFeedback.innerHTML = "";
  const unknown = getUnknownSymbolFromZapis();

  // 1) Vzorec
  const fL = (formulaLHS.value||"").replace(/\s+/g,"");
  const fR = (formulaRHS.value||"").replace(/\s+/g,"");
  let formulaOK=false;
  if (unknown==="W") formulaOK = (fL==="W" && /^(F[*·]s|s[*·]F)$/.test(fR));
  else if (unknown==="F") formulaOK = (fL==="F" && fR==="W/s");
  else if (unknown==="s") formulaOK = (fL==="s" && fR==="W/F");

  // 2) Dosazení
  const sL = (subsLHS.value||"").replace(/\s+/g,"");
  const sR = (subsRHS.value||"").replace(/\s+/g,"");

  const Fg = currentProblem?.givens.find(g=>g.symbol==="F");
  const sg = currentProblem?.givens.find(g=>g.symbol==="s");
  const Wval = currentProblem?.result;

  let substOK=false;
  if (unknown==="W"){
    if (sL==="W"){
      const m = sR.match(/^(\d+(?:[.,]\d+)?)[*×](\d+(?:[.,]\d+)?)$/);
      if (m && Fg && sg){
        const a=NUM(m[1]), b=NUM(m[2]);
        substOK = (almostEqual(a,Fg.value) && almostEqual(b,sg.value)) ||
                  (almostEqual(a,sg.value) && almostEqual(b,Fg.value));
      }
    }
  } else if (unknown==="F"){
    if (sL==="F"){
      const m = sR.match(/^(\d+(?:[.,]\d+)?)[/:](\d+(?:[.,]\d+)?)$/);
      if (m && sg && isFinite(Wval)){
        substOK = almostEqual(NUM(m[1]), Wval) && almostEqual(NUM(m[2]), sg.value);
      }
    }
  } else if (unknown==="s"){
    if (sL==="s"){
      const m = sR.match(/^(\d+(?:[.,]\d+)?)[/:](\d+(?:[.,]\d+)?)$/);
      if (m && Fg && isFinite(Wval)){
        substOK = almostEqual(NUM(m[1]), Wval) && almostEqual(NUM(m[2]), Fg.value);
      }
    }
  }

  // 3) Výsledek – FIX: vždy z givens
  const unit = (unitSelect?.value || "J").trim();
  const factor = {J:1, kJ:1000, MJ:1_000_000}[unit] ?? 1;
  const ansVal = NUM(resultRHS?.value);
  let resultOK=false, resultTip="";

  (function(){
    let expected=NaN, ansBase=ansVal;
    if (unknown==="W" && Fg && sg){
      expected = Fg.value * sg.value;
      ansBase = ansVal * factor;
    } else if (unknown==="F" && sg){
      const Wbase = (currentProblem?.givens.find(g=>g.symbol==="W")?.value ?? currentProblem?.result ?? NaN);
      expected = Wbase/sg.value; ansBase=ansVal;
    } else if (unknown==="s" && Fg){
      const Wbase = (currentProblem?.givens.find(g=>g.symbol==="W")?.value ?? currentProblem?.result ?? NaN);
      expected = Wbase/Fg.value; ansBase=ansVal;
    }
    resultOK = isFinite(ansBase) && isFinite(expected) && almostEqual(ansBase, expected);
    if (!resultOK) resultTip = "Výsledek neodpovídá (zkontroluj číslo a jednotku).";
  })();

  const msgs=[];
  msgs.push(formulaOK ? "✅ Vzorec v pořádku." : "❌ Oprav vzorec (použij tvary W=F*s, F=W/s, s=W/F).");
  msgs.push(substOK  ? "✅ Správné dosazení." : "❌ Zkontroluj dosazení (čísla musí odpovídat zadání).");
  msgs.push(resultOK ? "✅ Výsledek je správně." : `❌ ${resultTip}`);

  vypocetFeedback.innerHTML = `
    <div class="p-3 bg-gray-900 border border-gray-700 rounded">
      <div class="font-semibold text-gray-300 mb-2">Výsledky & tipy</div>
      <ul class="list-disc pl-5 text-gray-200 text-sm">${msgs.map(m=>`<li>${m}</li>`).join("")}</ul>
    </div>
  `;
});

// -------------------- Nástroje (modály) --------------------
function toggleModal(node, show){ if (!node) return; node.classList.toggle("hidden", !show); }

// Obrázek dle typu
function renderDiagram(){
  if (!diagramSvgContainer) return;
  diagramSvgContainer.innerHTML = "";
  if (!currentProblem) return;
  const d = currentProblem.diagram;
  const svg = el("div","");

  if (d==="auto"){
    svg.innerHTML = `
      <svg width="340" height="160" viewBox="0 0 340 160">
        <rect x="20" y="120" width="300" height="6" fill="#666"/>
        <rect x="60" y="90" width="110" height="30" rx="6" fill="#00AEEF" stroke="white"/>
        <circle cx="75" cy="120" r="8" fill="#333"/>
        <circle cx="150" cy="120" r="8" fill="#333"/>
        <line x1="180" y1="105" x2="270" y2="105" stroke="red" stroke-width="3" marker-end="url(#ah)"/>
        <text x="225" y="92" fill="red" font-size="14" text-anchor="middle">F = ${currentProblem.givens.find(g=>g.symbol==="F")?.value ?? "?"} N</text>
        <defs><marker id="ah" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="red"/></marker></defs>
        <line x1="60" y1="140" x2="270" y2="140" stroke="orange" stroke-width="2" marker-end="url(#ah2)"/>
        <text x="165" y="156" fill="orange" font-size="12" text-anchor="middle">s = ${currentProblem.givens.find(g=>g.symbol==="s")?.value ?? "?"} m</text>
        <defs><marker id="ah2" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="orange"/></marker></defs>
      </svg>`;
  } else if (d==="pulley"){
    svg.innerHTML = `
      <svg width="240" height="180" viewBox="0 0 240 180">
        <circle cx="120" cy="50" r="20" fill="#888" stroke="white"/>
        <rect x="110" y="70" width="20" height="50" fill="#bbb"/>
        <line x1="120" y1="0" x2="120" y2="35" stroke="#999" stroke-width="4"/>
        <rect x="105" y="125" width="30" height="20" fill="#00AEEF" stroke="white"/>
        <text x="120" y="170" fill="red" font-size="14" text-anchor="middle">F = ${currentProblem.givens.find(g=>g.symbol==="F")?.value ?? "?"} N</text>
        <text x="120" y="90" fill="orange" font-size="12" text-anchor="middle">s = ${currentProblem.givens.find(g=>g.symbol==="s")?.value ?? "?"} m</text>
      </svg>`;
  } else if (d==="strongman"){
    svg.innerHTML=`
      <svg width="280" height="180" viewBox="0 0 280 180">
        <rect x="120" y="80" width="40" height="60" fill="#00AEEF" stroke="white"/>
        <rect x="80" y="70" width="120" height="10" fill="#999"/>
        <rect x="70" y="65" width="10" height="20" fill="#999"/>
        <rect x="200" y="65" width="10" height="20" fill="#999"/>
        <text x="140" y="30" fill="red" font-size="14" text-anchor="middle">F = ${currentProblem.givens.find(g=>g.symbol==="F")?.value ?? "?"} N</text>
        <text x="140" y="50" fill="orange" font-size="12" text-anchor="middle">s = ${currentProblem.givens.find(g=>g.symbol==="s")?.value ?? "?"} m</text>
      </svg>`;
  } else {
    svg.innerHTML = `
      <svg width="280" height="140" viewBox="0 0 280 140">
        <rect x="20" y="110" width="240" height="6" fill="#666"/>
        <rect x="80" y="80" width="70" height="25" fill="#00AEEF" stroke="white"/>
        <line x1="160" y1="92" x2="230" y2="92" stroke="red" stroke-width="3" marker-end="url(#g1)"/>
        <text x="195" y="78" fill="red" font-size="12" text-anchor="middle">F</text>
        <defs><marker id="g1" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="red"/></marker></defs>
        <line x1="80" y1="125" x2="230" y2="125" stroke="orange" stroke-width="2" marker-end="url(#g2)"/>
        <text x="155" y="140" fill="orange" font-size="12" text-anchor="middle">s</text>
        <defs><marker id="g2" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="orange"/></marker></defs>
      </svg>`;
  }
  diagramSvgContainer.appendChild(svg);
}

function renderFormulaTriangle(){
  if (!formulaSvgContainer) return;
  formulaSvgContainer.innerHTML = `
    <svg width="240" height="180" viewBox="0 0 240 180">
      <polygon points="120,15 25,165 215,165" fill="none" stroke="white" stroke-width="2"/>
      <line x1="52" y1="112" x2="188" y2="112" stroke="white" stroke-width="2"/>
      <text x="120" y="70"  fill="white" font-size="36" text-anchor="middle">W</text>
      <text x="120" y="150" fill="white" font-size="26" text-anchor="middle">F · s</text>
    </svg>`;
}

function renderHelp(){
  if (!helpContent) return;
  helpContent.innerHTML = `
    <div class="space-y-3 text-gray-300 text-sm text-left">
      <p>💡 <b>Tip:</b> Zapiš známé veličiny a označ hledanou (otazník). Používej základní jednotky N, m, J – pokud zadáš kN/km, přidej řádek s převodem.</p>
      <p>📐 Vzorce: W = F·s, F = W/s, s = W/F.</p>
      <p>✅ Do výpočtu přejdeš po správném zápisu všech daných veličin.</p>
    </div>`;
}

// Ovládání modálů
btnDiagram?.addEventListener("click", ()=>{ renderDiagram(); toggleModal(modalDiagram,true); });
btnFormula?.addEventListener("click", ()=>{ renderFormulaTriangle(); toggleModal(modalFormula,true); });
btnHelp?.addEventListener("click", ()=>{ renderHelp(); toggleModal(modalHelp,true); });
btnCalc?.addEventListener("click", ()=>{ renderCalculator(); toggleModal(modalCalc,true); });

[modalDiagram,modalFormula,modalHelp,modalCalc].forEach(m=>{
  m?.addEventListener("click",(e)=>{ if (e.target===m) toggleModal(m,false); });
});
closeDiagram?.addEventListener("click", ()=> toggleModal(modalDiagram,false));
closeFormula?.addEventListener("click", ()=> toggleModal(modalFormula,false));
closeHelp?.addEventListener("click", ()=> toggleModal(modalHelp,false));
closeCalc?.addEventListener("click", ()=> toggleModal(modalCalc,false));

// -------------------- Kalkulačka --------------------
function renderCalculator(){
  if (!calcButtons || !calcDisplay || !calcHistory) return;
  calcButtons.innerHTML="";
  const keys = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+","C","⌫","Copy"];
  keys.forEach(k=>{
    const b = el("button","bg-gray-700 text-white py-2 rounded hover:bg-gray-600");
    b.textContent=k; calcButtons.appendChild(b);
  });
  let cur="";
  function update(){ calcDisplay.textContent = cur || "0"; }
  update();
  calcButtons.addEventListener("click",(e)=>{
    const t = e.target.textContent;
    if (t==="C"){ cur=""; calcHistory.textContent=""; }
    else if (t==="⌫"){ cur=cur.slice(0,-1); }
    else if (t==="="){
      try{ const r = eval(cur); calcHistory.textContent = `${cur} =`; cur = String(r); }
      catch{ cur="Error"; }
    } else if (t==="Copy"){ navigator.clipboard?.writeText(calcDisplay.textContent); }
    else { cur+=t; }
    update();
  });
}

// -------------------- Hotovo --------------------
console.log("✅ app_main_v31_unified.js připraven.");

// --- Autostart fallback (bezpečně až po definicích funkcí) ---
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log("🛟 Autostart fallback aktivní");
    const practiceVisible =
      !document.querySelector('#practice-screen') ||
      !document.querySelector('#practice-screen').classList.contains('hidden');

    const btnNew = document.querySelector('#new-problem-button');
    if (btnNew) {
      btnNew.addEventListener('click', () => {
        if (typeof fullReset === 'function') fullReset();
        if (typeof generateProblem === 'function') generateProblem();
        if (typeof prepareUnitsForAsk === 'function') prepareUnitsForAsk();
      }, { once: false });
    }

    // první autogenerování, pokud už jsme na practice a nic ještě není
    if (practiceVisible && (!window.currentProblem || !document.querySelector('#problem-text')?.textContent.trim())) {
      if (typeof fullReset === 'function') fullReset();
      if (typeof generateProblem === 'function') generateProblem();
      if (typeof prepareUnitsForAsk === 'function') prepareUnitsForAsk();
      console.log("🚀 Autostart: první příklad byl vygenerován");
    }
  } catch (e) {
    console.warn("Autostart fallback: něco se nepovedlo", e);
  }
});



