
/*! app_main_v31_unified.js
 *  Fyzika – Práce (W = F * s) – interaktivní procvičování
 *  v31: stabilní start, korektní výpočetní část (askFor-aware), vynucení základních jednotek
 */
(function(){
  'use strict';

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const units = { m:1, km:1000, N:1, kN:1000, J:1, kJ:1000, MJ:1000000 };
  const toBase = (v,u) => (u in units) ? v*units[u] : NaN;
  const parseNum = (s) => Number(String(s||'').replace(/\s+/g,'').replace(',','.'));

  const nearly = (a,b, tol=0.05) => {
    if (!isFinite(a) || !isFinite(b)) return false;
    if (b===0) return Math.abs(a) < tol;
    return Math.abs((a-b)/b) <= tol;
  };

  const App = {
    els: {},
    state: {
      mode: 'practice',
      level: 'normal',
      askFor: null,   // 'W' | 'F' | 's'
      problem: null,  // { text, givens:{F,s,W}, type }
      started: false
    },

    init() {
      this.cacheEls();
      this.bindSetup();
      this.bindPractice();
      this.autostart();
      console.log('app_main_v31_unified.js připraven.');
    },

    cacheEls() {
      this.els.setup = $('#setup-screen');
      this.els.practice = $('#practice-screen');

      this.els.btnStart = $('#start-button');
      this.els.btnPractice = $('#mode-practice');
      this.els.btnTest = $('#mode-test');
      this.els.btnEasy = $('#level-easy');
      this.els.btnNormal = $('#level-normal');
      this.els.btnHard = $('#level-hard');
      this.els.topic = $('#topic-select');

      this.els.title = $('#practice-title');
      this.els.btnBack = $('#back-button');
      this.els.btnNew = $('#new-problem-button');
      this.els.problemText = $('#problem-text');

      this.els.zapisContainer = $('#zapis-container');
      this.els.btnAddRow = $('#add-zapis-row-button');
      this.els.btnCheckZapis = $('#check-zapis-button');
      this.els.zapisFeedback = $('#zapis-feedback-container');

      this.els.vypocet = $('#vypocet-step');
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

    // ---------- Setup screen ----------
    bindSetup() {
      const setMode = (m) => { this.state.mode = m; this.updateStartEnabled(); };
      const setLevel = (l) => { this.state.level = l; this.updateStartEnabled(); };

      this.els.btnPractice?.addEventListener('click', () => setMode('practice'));
      this.els.btnTest?.addEventListener('click', () => setMode('test'));
      this.els.btnEasy?.addEventListener('click', () => setLevel('easy'));
      this.els.btnNormal?.addEventListener('click', () => setLevel('normal'));
      this.els.btnHard?.addEventListener('click', () => setLevel('hard'));
      this.els.topic?.addEventListener('change', () => this.updateStartEnabled());
      this.els.btnStart?.addEventListener('click', () => {
        this.showPractice();
        this.newProblem();
      });
    },

    updateStartEnabled() {
      if (this.els.btnStart) {
        this.els.btnStart.disabled = false;
        this.els.btnStart.classList.remove('btn-disabled');
      }
    },

    showPractice() {
      this.els.setup?.classList.add('hidden');
      this.els.practice?.classList.remove('hidden');
    },

    // ---------- Practice screen ----------
    bindPractice() {
      this.els.btnBack?.addEventListener('click', () => {
        this.els.practice?.classList.add('hidden');
        this.els.setup?.classList.remove('hidden');
      });

      this.els.btnNew?.addEventListener('click', () => this.newProblem());

      this.els.btnAddRow?.addEventListener('click', () => this.addZapisRow());
      this.els.btnCheckZapis?.addEventListener('click', () => {
        if (this.validateZapis()) this.enterVypocet();
      });

      this.els.btnOpenCalc?.addEventListener('click', () => this.openModal(this.els.modalCalc));
      this.els.btnOpenFormula?.addEventListener('click', () => this.openModal(this.els.modalFormula));
      this.els.btnOpenDiagram?.addEventListener('click', () => this.openModal(this.els.modalDiagram));
      this.els.btnOpenHelp?.addEventListener('click', () => this.openModal(this.els.modalHelp));
      this.els.btnCloseCalc?.addEventListener('click', () => this.closeModal(this.els.modalCalc));
      this.els.btnCloseFormula?.addEventListener('click', () => this.closeModal(this.els.modalFormula));
      this.els.btnCloseDiagram?.addEventListener('click', () => this.closeModal(this.els.modalDiagram));
      this.els.btnCloseHelp?.addEventListener('click', () => this.closeModal(this.els.modalHelp));

      this.els.btnCheckCalc?.addEventListener('click', () => this.checkCalculation());
      // live validation
      [this.els.formulaLHS,this.els.formulaRHS,this.els.subsLHS,this.els.subsRHS,this.els.resultLHS,this.els.resultRHS,this.els.unitSelect]
        .forEach(el => el?.addEventListener('input', () => this.validateCalcLive()));
    },

    autostart() {
      const tryStart = () => {
        if (this.state.started) return;
        if (this.els.practice && getComputedStyle(this.els.practice).display !== 'none' && !this.els.practice.classList.contains('hidden')) {
          this.state.started = true;
          this.newProblem();
        }
      };
      window.addEventListener('load', tryStart);
      setTimeout(tryStart, 600);
    },

    // ---------- Problem generator ----------
    rand(min,max,dec=0){ return +((Math.random()*(max-min)+min).toFixed(dec)); },

    generateProblem(){
      const types = ['kladka','silak','auto','obecny'];
      const type = types[Math.floor(Math.random()*types.length)];
      const askPool = ['W','F','s'];
      const askFor = askPool[Math.floor(Math.random()*askPool.length)];

      let F, s, text;
      if (type==='kladka'){ F=this.rand(200,800,0); s=this.rand(1,5,1); text=`Zedník zvedl těleso pomocí pevné kladky silou ${F} N do výšky ${s} m. Do jaké výšky těleso zvedl?`; }
      if (type==='silak'){ F=this.rand(500,1500,0); s=this.rand(0.2,1.5,1); text=`Silák působí silou ${F} N a zvedá činku do výšky ${s} m. Vypočítej práci/sílu/dráhu dle zadání.`; }
      if (type==='auto'){ F=this.rand(800,5000,0); const km=this.rand(0.5,10,1); s=Math.round(km*1000); text=`Tahová síla motoru auta byla ${F} N a auto jelo po dráze ${km} km. Urči chybějící veličinu.`; }
      if (type==='obecny'){ F=this.rand(200,3000,0); s=this.rand(1,3000,0); text=`Těleso bylo přesunuto silou ${F} N po dráze ${s} m. Urči chybějící veličinu.`; }

      const givens = { F, s, W: F*s };
      return { type, askFor, text, givens };
    },

    // ---------- New problem & reset ----------
    newProblem(){
      // reset UI to ZÁPIS
      this.els.vypocet?.classList.add('hidden');
      $('#zapis-step')?.classList.remove('hidden');
      this.els.zapisFeedback.innerHTML='';
      this.els.vypocetTips.textContent='';
      // clear calc
      ['formulaLHS','formulaRHS','subsLHS','subsRHS','resultLHS','resultRHS'].forEach(k=>this.els[k] && (this.els[k].value=''));

      const p = this.generateProblem();
      this.state.problem = p;
      this.state.askFor = p.askFor;
      this.els.problemText.textContent = this.buildProblemText(p);
      this.resetZapisRows(p);
    },

    buildProblemText(p){
      // přizpůsobíme otázku podle askFor pro srozumitelnost
      if (p.type==='auto'){
        const km = (p.givens.s/1000).toFixed(1);
        if (p.askFor==='W') return `Tahová síla motoru auta byla ${p.givens.F} N a auto jelo po dráze ${km} km. Jaká práce byla vykonána?`;
        if (p.askFor==='F') return `Auto jelo po dráze ${km} km a vykonaná práce byla ${p.givens.W} J. Jaká síla působila?`;
        return `Tahová síla motoru auta byla ${p.givens.F} N a auto jelo po dráze ${km} km. Jaká dráha byla uražena?`;
      }
      if (p.askFor==='W') return `Síla působila ${p.givens.F} N po dráze ${p.givens.s} m. Jaká práce byla vykonána?`;
      if (p.askFor==='F') return `Těleso bylo přesunuto po dráze ${p.givens.s} m a vykonaná práce je ${p.givens.W} J. Jaká síla působila?`;
      return `Těleso bylo přesunuto silou ${p.givens.F} N po dráze ${p.givens.s} m. Jaká dráha byla uražena?`;
    },

    resetZapisRows(p){
      const c = this.els.zapisContainer;
      c.innerHTML = '';
      // tři řádky
      ['F','s','W'].forEach(sym => {
        const row = document.createElement('div');
        row.className = 'grid grid-cols-12 gap-2 items-center bg-gray-900 border border-gray-700 rounded-xl p-2';
        row.innerHTML = `
          <div class="col-span-2">
            <select class="z-sym w-full p-2 rounded-md bg-gray-800 border border-gray-700">
              <option value="F"${sym==='F'?' selected':''}>F</option>
              <option value="s"${sym==='s'?' selected':''}>s</option>
              <option value="W"${sym==='W'?' selected':''}>W</option>
            </select>
          </div>
          <div class="col-span-5"><input class="z-val w-full p-2 rounded-md bg-gray-800 border border-gray-700" placeholder="${sym==='W'?'?':''}"></div>
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
      });
      // předvyplníme podle givens a askFor – a nutíme základní jednotky
      const rows = $$('.grid', c);
      const g = p.givens;
      rows.forEach(r => {
        const sym = $('.z-sym', r).value;
        const v = $('.z-val', r);
        const u = $('.z-unit', r);
        const ask = $('.z-ask', r);

        if (sym==='F'){ v.value = g.F; u.value = 'N'; }
        if (sym==='s'){ v.value = g.s; u.value = 'm'; }
        if (sym==='W'){ v.value = ''; v.placeholder='?'; u.value = 'J'; }

        ask.checked = (sym===p.askFor);
      });
    },

    // ---------- Zápis validation ----------
    validateZapis(){
      const rows = $$('#zapis-container .grid');
      const given = {};
      rows.forEach(r => {
        const sym = $('.z-sym', r).value;
        const str = $('.z-val', r).value.trim();
        const unit = $('.z-unit', r).value;
        const isAsk = $('.z-ask', r).checked;
        if (isAsk){ given.ask = sym; return; }
        const val = parseNum(str);
        given[sym] = toBase(val, unit || (sym==='F'?'N':sym==='s'?'m':'J'));
      });

      const p = this.state.problem;
      const errs = [];
      if (!given.ask || given.ask !== this.state.askFor) errs.push('Označte správnou hledanou veličinu.');
      if (!nearly(given.F, p.givens.F)) errs.push('Síla F musí být v základní jednotce N (v toleranci).');
      if (!nearly(given.s, p.givens.s)) errs.push('Dráha s musí být v základní jednotce m (v toleranci).');
      if (!nearly(given.W, p.givens.W)) errs.push('Práce W musí být v joulech (J) – v základní jednotce.');

      this.els.zapisFeedback.innerHTML = errs.length ? `<div class="feedback-wrong"><ul class="list-disc pl-5">${errs.map(e=>`<li>${e}</li>`).join('')}</ul></div>` : '';
      return errs.length===0;
    },

    // ---------- Enter calc ----------
    enterVypocet(){
      $('#zapis-step')?.classList.add('hidden');
      this.els.vypocet?.classList.remove('hidden');
      this.seedCalc();
      this.validateCalcLive();
    },

    attachOverwrite(input, initValue){
      if (!input) return;
      input.value = initValue;
      input.dataset.pristine = '1';
      input.addEventListener('focus', () => input.select(), { once:true });
      input.addEventListener('keydown', (e) => {
        if (input.dataset.pristine==='1'){
          if (e.key.length===1){ input.value = e.key; input.dataset.pristine='0'; e.preventDefault(); }
          else { input.dataset.pristine='0'; }
        }
      });
      input.addEventListener('input', () => { input.dataset.pristine='0'; }, { once:true });
    },

    setUnitOptions(ask){
      const sel = this.els.unitSelect;
      if (!sel) return;
      sel.innerHTML = '';
      if (ask==='W'){
        ['J','kJ','MJ'].forEach(u=>{ const o=document.createElement('option'); o.value=u; o.textContent=u; sel.appendChild(o); });
        sel.value='J';
      } else if (ask==='F'){
        const o=document.createElement('option'); o.value='N'; o.textContent='N'; sel.appendChild(o); sel.value='N';
      } else {
        const o=document.createElement('option'); o.value='m'; o.textContent='m'; sel.appendChild(o); sel.value='m';
      }
    },

    seedCalc(){
      const ask = this.state.askFor || 'W';
      const rhsHint = { W:'F*s', F:'W/s', s:'W/F' }[ask];
      const subsHint = { W:'např. 500*2 nebo 1000*2', F:'např. 1000/2', s:'např. 1000/500' }[ask];

      this.attachOverwrite(this.els.formulaLHS, ask);
      this.els.formulaRHS.value=''; this.els.formulaRHS.placeholder=rhsHint;

      this.attachOverwrite(this.els.subsLHS, ask);
      this.els.subsRHS.value=''; this.els.subsRHS.placeholder=subsHint;

      this.attachOverwrite(this.els.resultLHS, ask);
      this.els.resultRHS.value='';
      this.setUnitOptions(ask);

      this.els.vypocetTips.textContent = 'Počítejte v základních jednotkách: F v N, s v m, W v J.';
    },

    validateFormula(ask, LHS, RHS){
      if (LHS !== ask) return false;
      const m = '[*.·]';
      const map = { W: new RegExp(`^(F${m}?s|s${m}?F)$`), F:/^W\/?s$/, s:/^W\/?F$/ };
      return map[ask].test((RHS||'').replace(/\s+/g,''));
    },

    validateSubstitution(ask, LHS, RHS){
      if (LHS !== ask) return false;
      const g = this.state.problem.givens;
      // očekáváme výpočty v základních jednotkách
      const target = (ask==='W') ? g.F*g.s : (ask==='F') ? g.W/g.s : g.W/g.F;
      // povolíme jen čísla a operátory * / . ,
      const expr = (RHS||'').replace(/[^\d\/*+().,\-]/g, '').replace(',', '.');
      let val; try { /* eslint no-new-func:0 */ val = Function('"use strict";return ('+expr+')')(); } catch { return false; }
      return nearly(val, target, 1e-9);
    },

    validateResult(ask, LHS, valueStr, unit){
      if (LHS !== ask) return false;
      const value = parseNum(valueStr);
      const g = this.state.problem.givens;
      let targetBase, userBase;

      if (ask==='W'){
        targetBase = g.W;
        userBase = toBase(value, unit||'J');
      } else if (ask==='F'){
        targetBase = g.F;
        if (unit && unit!=='N') return false; // vynutit N
        userBase = value;
      } else {
        targetBase = g.s;
        if (unit && unit!=='m') return false; // vynutit m
        userBase = value;
      }
      return nearly(userBase, targetBase, 0.05);
    },

    validateCalcLive(){
      const ask = this.state.askFor || 'W';
      const okFormula = this.validateFormula(ask, this.els.formulaLHS.value.trim(), this.els.formulaRHS.value.trim());
      const okSubs = this.validateSubstitution(ask, this.els.subsLHS.value.trim(), this.els.subsRHS.value.trim());
      const okRes  = this.validateResult(ask, this.els.resultLHS.value.trim(), this.els.resultRHS.value.trim(), this.els.unitSelect.value);

      let tip = '';
      if (!okFormula) tip = `Zkontrolujte tvar: ${ask==='W'?'W=F·s':ask==='F'?'F=W/s':'s=W/F'}.`;
      else if (!okSubs) tip = 'Dosazujte v základních jednotkách (N, m, J).';
      else if (!okRes) tip = 'Výsledek mimo toleranci nebo špatná jednotka.';
      else tip = '✅ Vše v pořádku.';
      this.els.vypocetTips.textContent = tip;
    },

    checkCalculation(){
      this.validateCalcLive();
    },

    // ---------- Utils ----------
    openModal(m){ m?.classList.remove('hidden'); },
    closeModal(m){ m?.classList.add('hidden'); },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => App.init());
  else App.init();
  window.__FyzikaApp = App;
})();
