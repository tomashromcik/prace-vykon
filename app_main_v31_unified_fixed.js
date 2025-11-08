/*! app_main_v31_unified_fixed.js
 * Fyzika – Práce (W = F * s) – jednotný skript
 * v31 fixed: integrované UI zvýraznění mode/level + spolehlivý Start->Practice přechod
 * + askFor-aware výpočetní část + vynucení základních jednotek.
 */
(function(){
  'use strict';

  // ---------- helpers ----------
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const parseNum = (s) => Number(String(s||'').replace(/\s+/g,'').replace(',','.'));
  const units = { m:1, km:1000, N:1, kN:1000, J:1, kJ:1000, MJ:1000000 };
  const toBase = (v,u) => (u in units) ? v*units[u] : NaN;
  const nearly = (a,b,tol=0.05) => (isFinite(a)&&isFinite(b)) && (b===0?Math.abs(a)<tol:Math.abs((a-b)/b)<=tol);

  const activeRing = ['ring-2','ring-blue-500'];

  // ---------- App ----------
  const App = {
    els: {},
    state: { mode:'practice', level:'normal', askFor:null, problem:null, started:false },

    init(){
      console.log('🧩 Načítání app_main_v31_unified.js …');
      this.cacheEls();
      this.bindSetup();
      this.bindPractice();
      this.autostart();
      console.log('✅ app_main_v31_unified.js připraven.');
    },

    cacheEls(){
      // setup
      this.els.setup = $('#setup-screen');
      this.els.practice = $('#practice-screen');
      this.els.btnStart = $('#start-button');
      this.els.btnPractice = $('#mode-practice');
      this.els.btnTest = $('#mode-test');
      this.els.btnEasy = $('#level-easy');
      this.els.btnNormal = $('#level-normal');
      this.els.btnHard = $('#level-hard');
      this.els.topic = $('#topic-select');

      // practice
      this.els.problemText = $('#problem-text');
      this.els.btnNew = $('#new-problem-button');
      this.els.btnBack = $('#back-button');

      // zapis
      this.els.zapisStep = $('#zapis-step');
      this.els.zapisContainer = $('#zapis-container');
      this.els.btnAddRow = $('#add-zapis-row-button');
      this.els.btnCheckZapis = $('#check-zapis-button');
      this.els.zapisFeedback = $('#zapis-feedback-container');

      // vypocet
      this.els.vypocetStep = $('#vypocet-step');
      this.els.zapisReview = $('#zapis-review-container');
      this.els.formulaLHS = $('#formula-lhs');
      this.els.formulaRHS = $('#formula-rhs');
      this.els.subsLHS = $('#subs-lhs');
      this.els.subsRHS = $('#subs-rhs');
      this.els.resultLHS = $('#result-lhs');
      this.els.resultRHS = $('#result-rhs');
      this.els.unitSelect = $('#unit-select');
      this.els.vypocetTips = $('#vypocet-tips');
      this.els.btnCheckCalc = $('#check-calculation-button');

      // modals
      this.els.modalCalc = $('#calculator-modal');
      this.els.modalFormula = $('#formula-modal');
      this.els.modalDiagram = $('#diagram-modal');
      this.els.modalHelp = $('#help-modal');
      this.els.btnOpenCalc = $('#open-calculator-button');
      this.els.btnOpenFormula = $('#open-formula-button');
      this.els.btnOpenDiagram = $('#open-diagram-button');
      this.els.btnOpenHelp = $('#open-help-button');
      this.els.btnCloseCalc = $('#close-calculator-button');
      this.els.btnCloseFormula = $('#close-formula-button');
      this.els.btnCloseDiagram = $('#close-diagram-button');
      this.els.btnCloseHelp = $('#close-help-button');
    },

    // ---------- setup & navigation ----------
    bindSetup(){
      const applyModeUI = ()=>{
        [this.els.btnPractice,this.els.btnTest].forEach(b=> b&&b.classList.remove(...activeRing));
        if (this.state.mode==='practice') this.els.btnPractice?.classList.add(...activeRing);
        if (this.state.mode==='test') this.els.btnTest?.classList.add(...activeRing);
      };
      const applyLevelUI = ()=>{
        [this.els.btnEasy,this.els.btnNormal,this.els.btnHard].forEach(b=> b&&b.classList.remove(...activeRing));
        (this.state.level==='easy'?this.els.btnEasy:this.state.level==='normal'?this.els.btnNormal:this.els.btnHard)?.classList.add(...activeRing);
      };

      this.els.btnPractice?.addEventListener('click', ()=>{ this.state.mode='practice'; applyModeUI(); });
      this.els.btnTest?.addEventListener('click', ()=>{ this.state.mode='test'; applyModeUI(); });
      this.els.btnEasy?.addEventListener('click', ()=>{ this.state.level='easy'; applyLevelUI(); });
      this.els.btnNormal?.addEventListener('click', ()=>{ this.state.level='normal'; applyLevelUI(); });
      this.els.btnHard?.addEventListener('click', ()=>{ this.state.level='hard'; applyLevelUI(); });

      // defaults
      applyModeUI(); applyLevelUI();

      // start
      this.els.btnStart?.addEventListener('click', ()=>{
        this.showPractice();
        // zajistí reset a nové zadání
        this.fullReset();
        this.newProblem();
      });
    },

    bindPractice(){
      this.els.btnBack?.addEventListener('click', ()=>{
        this.els.practice?.classList.add('hidden');
        this.els.setup?.classList.remove('hidden');
      });
      this.els.btnNew?.addEventListener('click', ()=>this.newProblem());
      this.els.btnAddRow?.addEventListener('click', ()=>this.addZapisRow());
      this.els.btnCheckZapis?.addEventListener('click', ()=>{ if (this.validateZapis()) this.enterVypocet(); });

      [this.els.formulaLHS,this.els.formulaRHS,this.els.subsLHS,this.els.subsRHS,this.els.resultLHS,this.els.resultRHS,this.els.unitSelect]
        .forEach(el=> el?.addEventListener('input', ()=>this.validateVypocetLive()));
      this.els.btnCheckCalc?.addEventListener('click', ()=> this.validateVypocetLive());
    
      // exklusivní výběr "Hledaná veličina" v zápisu
      this.els.zapisContainer?.addEventListener('change', (ev)=>{
        const t = ev.target;
        if (t && t.classList && t.classList.contains('z-ask')){
          if (t.checked){
            // odškrtnout ostatní
            $$('#zapis-container .z-ask').forEach(cb => { if (cb!==t) cb.checked=false; });
            const row = t.closest('.grid');
            const sym = $('.z-sym', row)?.value || this.state.askFor || 'W';
            this.state.askFor = sym;
          }
        }
      });
    },

    showPractice(){ this.els.setup?.classList.add('hidden'); this.els.practice?.classList.remove('hidden'); },

    autostart(){
      console.log('🛟 Autostart fallback aktivní');
      const tryStart = ()=>{
        if (this.state.started) return;
        if (this.els.practice && !this.els.practice.classList.contains('hidden')){
          this.state.started = true;
          this.fullReset();
          this.newProblem();
        }
      };
      // když user otevře rovnou practice (např. jiným indexem), vygeneruj
      window.addEventListener('load', tryStart);
      setTimeout(tryStart, 700);
    },

    // ---------- generátor ----------
    rand(min,max,dec=0){ return +((Math.random()*(max-min)+min).toFixed(dec)); },
    generateProblem(){
      const types=['kladka','silak','auto','obecny'];
      const type=types[Math.floor(Math.random()*types.length)];
      const askPool=['W','F','s']; const askFor=askPool[Math.floor(Math.random()*askPool.length)];
      let F,s,text;
      if (type==='kladka'){ F=this.rand(200,800,0); s=this.rand(1,5,1); text=`Zedník zvedl těleso pomocí pevné kladky silou ${F} N do výšky ${s} m.`; }
      else if (type==='silak'){ F=this.rand(500,1500,0); s=this.rand(0.2,1.5,1); text=`Silák působí silou ${F} N a zvedá činku do výšky ${s} m.`; }
      else if (type==='auto'){ F=this.rand(800,5000,0); const km=this.rand(0.5,10,1); s=Math.round(km*1000); text=`Tahová síla motoru auta byla ${F} N a auto jelo po dráze ${km} km.`; }
      else { F=this.rand(200,3000,0); s=this.rand(1,3000,0); text=`Těleso bylo přesunuto silou ${F} N po dráze ${s} m.`; }
      const givens={F,s,W:F*s};
      const question = (askFor==='W')?'Jaká práce byla vykonána?':(askFor==='F')?'Jaká síla působila?':'Jaká dráha byla uražena?';
      return { type, askFor, givens, text: `${text} ${question}` };
    },

    // ---------- resety ----------
    fullReset(){
      this.resetZapis();
      this.clearCalcInputs();
      if (this.els.vypocetTips) this.els.vypocetTips.textContent='';
      this.els.zapisStep?.classList.remove('hidden');
      this.els.vypocetStep?.classList.add('hidden');
    },
    resetZapis(){
      const c=this.els.zapisContainer; if(!c) return;
      c.innerHTML='';
      ['F','s','W'].forEach(sym=> this.addZapisRow(sym));
      this.els.zapisFeedback.innerHTML='';
    },
    addZapisRow(sym='F'){
      const c=this.els.zapisContainer; if(!c) return;
      const row=document.createElement('div');
      row.className='grid grid-cols-12 gap-2 items-center bg-gray-900 border border-gray-700 rounded-xl p-2';
      row.innerHTML=`
        <div class="col-span-2">
          <select class="z-sym w-full p-2 rounded-md bg-gray-800 border border-gray-700">
            <option value="F"${sym==='F'?' selected':''}>F</option>
            <option value="s"${sym==='s'?' selected':''}>s</option>
            <option value="W"${sym==='W'?' selected':''}>W</option>
          </select>
        </div>
        <div class="col-span-5">
          <input class="z-val w-full p-2 rounded-md bg-gray-800 border border-gray-700" placeholder="${sym==='W'?'?':''}">
        </div>
        <div class="col-span-3">
          <select class="z-unit w-full p-2 rounded-md bg-gray-800 border border-gray-700">
            <option value="">-</option>
            <option value="N">N</option>
            <option value="kN">kN</option>
            <option value="m">m</option>
            <option value="km">km</option>
            <option value="J">J</option>
            <option value="kJ">kJ</option>
            <option value="MJ">MJ</option>
          </select>
        </div>
        <label class="col-span-2 flex items-center gap-2 text-sm text-gray-400">
          <input type="checkbox" class="z-ask accent-blue-500"> Hledaná veličina
        </label>`;
      c.appendChild(row);
    },
    clearCalcInputs(){
      ['formulaLHS','formulaRHS','subsLHS','subsRHS','resultLHS','resultRHS'].forEach(k=> this.els[k] && (this.els[k].value=''));
      if (this.els.unitSelect) this.els.unitSelect.innerHTML='';
    },

    // ---------- nový příklad ----------
    newProblem(){
      const p=this.generateProblem();
      this.state.problem=p; this.state.askFor=p.askFor;
      if (this.els.problemText) this.els.problemText.textContent=p.text;
      // reset kroků a zápisu
      this.resetZapis();
      const rows=$$('#zapis-container .grid');
      rows.forEach(r=>{
        const sym=$('.z-sym',r).value;
        const val=$('.z-val',r); const unit=$('.z-unit',r); const ask=$('.z-ask',r);
        if(sym==='F'){ val.value=p.givens.F; unit.value='N'; }
        if(sym==='s'){ val.value=p.givens.s; unit.value='m'; }
        if(sym==='W'){ val.value=''; val.placeholder='?'; unit.value='J'; }
        ask.checked = (sym===p.askFor);
        if (sym!==p.askFor) { /* jistota: jen jeden */ }
      });
    },

    // ---------- validace zápisu ----------
    validateZapis(){
      const rows=$$('#zapis-container .grid'); const g={}; let asked=null; let askCount=0;
      rows.forEach(r=>{
        const sym=$('.z-sym',r).value;
        const isAsk=$('.z-ask',r).checked;
        const unit=$('.z-unit',r).value;
        const valStr=$('.z-val',r).value;
        if(isAsk){ asked=sym; askCount++; } else {
        const val=parseNum(valStr);
        const base=toBase(val, unit|| (sym==='F'?'N':sym==='s'?'m':'J'));
        g[sym]=base; }
      });
      if (askCount!==1) errs.push('Označte právě jednu hledanou veličinu.');
      if (!asked) asked=this.state.askFor;
      const p=this.state.problem;
      const errs=[];
      if(asked!==this.state.askFor) errs.push('Označte správnou hledanou veličinu.');
      if(!nearly(g.F, p.givens.F)) errs.push('Síla F musí být v základních jednotkách (N).');
      if(!nearly(g.s, p.givens.s)) errs.push('Dráha s musí být v základních jednotkách (m).');
      if(!nearly(g.W, p.givens.W)) errs.push('Práce W musí být v základních jednotkách (J).');
      this.els.zapisFeedback.innerHTML= errs.length? `<div class="feedback-wrong"><ul class="list-disc pl-5">${errs.map(e=>`<li>${e}</li>`).join('')}</ul></div>` : '';
      return errs.length===0;
    },

    // ---------- vstup do výpočtu ----------
    enterVypocet(){
      this.els.zapisStep?.classList.add('hidden');
      this.els.vypocetStep?.classList.remove('hidden');
      this.seedVypocetFields();
      this.validateVypocetLive();
    },
    attachOverwrite(input, initValue){
      if(!input) return;
      input.value=initValue; input.dataset.pristine='1';
      input.addEventListener('focus', ()=>input.select(), {once:true});
      input.addEventListener('keydown', (e)=>{
        if(input.dataset.pristine==='1'){
          if(e.key.length===1){ input.value=e.key; input.dataset.pristine='0'; e.preventDefault(); }
          else { input.dataset.pristine='0'; }
        }
      });
      input.addEventListener('input', ()=>{ input.dataset.pristine='0'; }, {once:true});
    },
    setUnitOptions(ask){
      const sel=this.els.unitSelect; if(!sel) return;
      sel.innerHTML='';
      if(ask==='W'){ ['J','kJ','MJ'].forEach(u=>{ const o=document.createElement('option'); o.value=u; o.textContent=u; sel.appendChild(o); }); sel.value='J'; }
      else if(ask==='F'){ const o=document.createElement('option'); o.value='N'; o.textContent='N'; sel.appendChild(o); sel.value='N'; }
      else { const o=document.createElement('option'); o.value='m'; o.textContent='m'; sel.appendChild(o); sel.value='m'; }
    },
    seedVypocetFields(){
      const ask=this.state.askFor || 'W';
      const rhsHint={W:'F*s', F:'W/s', s:'W/F'}[ask];
      const subsHint={W:'např. 500*2 nebo 1000*2', F:'např. 1000/2', s:'např. 1000/500'}[ask];
      this.attachOverwrite(this.els.formulaLHS, ask);
      if (this.els.formulaRHS){ this.els.formulaRHS.value=''; this.els.formulaRHS.placeholder=rhsHint; }
      this.attachOverwrite(this.els.subsLHS, ask);
      if (this.els.subsRHS){ this.els.subsRHS.value=''; this.els.subsRHS.placeholder=subsHint; }
      this.attachOverwrite(this.els.resultLHS, ask);
      if (this.els.resultRHS) this.els.resultRHS.value='';
      this.setUnitOptions(ask);
      if (this.els.vypocetTips) this.els.vypocetTips.textContent='Počítejte v základních jednotkách: F v N, s v m, W v J.';
    },

    // ---------- validace výpočtu ----------
    validateFormula(ask, lhs, rhs){
      if (lhs!==ask) return false;
      const m='[*.·]'; const r=(rhs||'').replace(/\s+/g,'');
      const map={ W:new RegExp(`^(F${m}?s|s${m}?F)$`), F:/^W\/?s$/, s:/^W\/?F$/ };
      return map[ask].test(r);
    },
    validateSubstitution(ask, lhs, rhs){
      if (lhs!==ask) return false;
      const g=this.state.problem.givens;
      const target = (ask==='W')? g.F*g.s : (ask==='F')? g.W/g.s : g.W/g.F;
      const expr=(rhs||'').replace(/[^\d\/*+().,\-]/g,'').replace(',', '.');
      let val; try { val=Function('"use strict";return ('+expr+')')(); } catch { return false; }
      return nearly(val, target, 1e-9);
    },
    validateResult(ask, lhs, valueStr, unit){
      if (lhs!==ask) return false;
      const g=this.state.problem.givens;
      const value=parseNum(valueStr);
      let targetBase, userBase;
      if (ask==='W'){ targetBase=g.W; userBase=toBase(value, unit||'J'); }
      else if (ask==='F'){ targetBase=g.F; if(unit && unit!=='N') return false; userBase=value; }
      else { targetBase=g.s; if(unit && unit!=='m') return false; userBase=value; }
      return nearly(userBase, targetBase, 0.05);
    },
    validateVypocetLive(){
      const ask=this.state.askFor || 'W';
      const okF=this.validateFormula(ask, this.els.formulaLHS.value.trim(), this.els.formulaRHS.value.trim());
      const okS=this.validateSubstitution(ask, this.els.subsLHS.value.trim(), this.els.subsRHS.value.trim());
      const okR=this.validateResult(ask, this.els.resultLHS.value.trim(), this.els.resultRHS.value.trim(), this.els.unitSelect.value);
      let tip='';
      if(!okF) tip=`Zkontrolujte tvar: ${ask==='W'?'W=F·s':ask==='F'?'F=W/s':'s=W/F'}.`;
      else if(!okS) tip='Dosazujte v základních jednotkách (N, m, J).';
      else if(!okR) tip='Výsledek mimo toleranci nebo špatná jednotka.';
      else tip='✅ Vše v pořádku.';
      if (this.els.vypocetTips) this.els.vypocetTips.textContent=tip;
      return okF && okS && okR;
    },

    // ---------- modals (placeholder) ----------
    openModal(m){ m?.classList.remove('hidden'); }
    ,closeModal(m){ m?.classList.add('hidden'); }
  };

  // Expose for compatibility
  window.App = App;
  window.resetZapis = App.resetZapis.bind(App);
  window.fullReset  = App.fullReset.bind(App);

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>App.init());
  else App.init();
})();
