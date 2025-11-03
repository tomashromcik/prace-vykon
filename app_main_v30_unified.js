/*
  Fyzika – Práce (W = F * s) v30 — unified script
  - Spolehlivý autostart (practice i po přepnutí ze setupu)
  - Binding všech tlačítek a modálů + kontrola ID
  - Reset UI do ZÁPISU při „Nový příklad“
  - Generátor příkladů (kladka/silák/auto/obecný) s realistickými rozsahy
  - Live validace vzorce/dosazení/výsledku, převody jednotek, tolerance ±5 %
*/
(function () {
  'use strict';

  const $ = (sel) => /** @type {HTMLElement|null} */(document.querySelector(sel));
  const $$ = (sel) => /** @type {NodeListOf<HTMLElement>} */(document.querySelectorAll(sel));
  const exists = (el) => !!el;

  const isVisible = (el) => {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && !el.classList.contains('hidden');
  };

  const randRange = (min, max, decimals = 0) => {
    const n = Math.random() * (max - min) + min;
    return +n.toFixed(decimals);
  };
  const parseNumber = (str) => {
    if (typeof str === 'number') return str;
    if (!str) return NaN;
    return Number(String(str).replace(/\s/g, '').replace(',', '.'));
  };
  const nearlyEqual = (a, b, tol = 0.05) => {
    if (!isFinite(a) || !isFinite(b)) return false;
    if (b === 0) return Math.abs(a) < tol; // fallback
    return Math.abs((a - b) / b) <= tol;
  };

  const units = { m:1, km:1000, N:1, kN:1000, J:1, kJ:1000, MJ:1000000 };
  const toBase = (value, unit) => units[unit] ? value * units[unit] : NaN;
  const fromBase = (value, unit) => units[unit] ? value / units[unit] : NaN;

  const App = {
    els: {},
    state: {
      stage: 'zapis', // 'zapis' | 'vypocet'
      askFor: /** @type {'W'|'F'|'s'|null} */(null),
      problem: /** @type {null|{type:string, askFor:'W'|'F'|'s', givens:{F:number,s:number,W:number}, text:string}} */(null),
    },
    _started: false,

    init() {
      this.cacheEls();
      this.verifyIDs();
      this.bindUI();
      this.autostart();
    },

    cacheEls() {
      this.els.setupScreen = $('#setup-screen');
      this.els.practiceScreen = $('#practice-screen');

      this.els.problemText = $('#problem-text');
      this.els.newProblemBtn = $('#new-problem-button');

      // zápis
      this.els.zapisContainer = $('#zapis-container');
      this.els.addZapisRowBtn = $('#add-zapis-row-button');
      this.els.checkZapisBtn = $('#check-zapis-button');
      this.els.zapisErrors = $('#zapis-errors');

      // výpočet
      this.els.vypocetStep = $('#vypocet-step');
      this.els.formulaLHS = /** @type {HTMLInputElement|null} */($('#formula-lhs'));
      this.els.formulaRHS = /** @type {HTMLInputElement|null} */($('#formula-rhs'));
      this.els.subsLHS = /** @type {HTMLInputElement|null} */($('#subs-lhs'));
      this.els.subsRHS = /** @type {HTMLInputElement|null} */($('#subs-rhs'));
      this.els.resultLHS = /** @type {HTMLInputElement|null} */($('#result-lhs'));
      this.els.resultRHS = /** @type {HTMLInputElement|null} */($('#result-rhs'));
      this.els.unitSelect = /** @type {HTMLSelectElement|null} */($('#unit-select'));
      this.els.vypocetTips = $('#vypocet-tips');
      this.els.vypocetFeedback = $('#vypocet-feedback-container');

      // modály
      this.els.openDiagramBtn = $('#open-diagram-button');
      this.els.openFormulaBtn = $('#open-formula-button');
      this.els.openHelpBtn = $('#open-help-button');
      this.els.openCalcBtn = $('#open-calculator-button');

      this.els.diagramModal = /** @type {HTMLDialogElement|null} */($('#diagram-modal'));
      this.els.formulaModal = /** @type {HTMLDialogElement|null} */($('#formula-modal'));
      this.els.helpModal = /** @type {HTMLDialogElement|null} */($('#help-modal'));
      this.els.calcModal = /** @type {HTMLDialogElement|null} */($('#calculator-modal'));
      this.els.calcDisplay = /** @type {HTMLInputElement|null} */($('#calc-display'));
      this.els.calcHistory = $('#calc-history');
      this.els.calcEval = $('#calc-btn-eval');
      this.els.calcCopy = $('#calc-btn-copy');
      this.els.calcBack = $('#calc-btn-back');
      this.els.calcClear = $('#calc-btn-clear');
    },

    verifyIDs() {
      const ids = [
        '#practice-screen', '#problem-text', '#new-problem-button',
        '#zapis-container', '#add-zapis-row-button', '#check-zapis-button', '#zapis-errors',
        '#vypocet-step', '#formula-lhs', '#formula-rhs', '#subs-lhs', '#subs-rhs', '#result-lhs', '#result-rhs', '#unit-select', '#vypocet-tips',
        '#open-diagram-button', '#open-formula-button', '#open-help-button', '#open-calculator-button',
        '#diagram-modal', '#formula-modal', '#help-modal', '#calculator-modal'
      ];
      ids.forEach((id) => { if (!document.querySelector(id)) console.warn('[App] Missing element:', id); });
    },

    bindUI() {
      this.els.newProblemBtn?.addEventListener('click', () => this.newProblem());
      this.els.addZapisRowBtn?.addEventListener('click', () => this.addZapisRow());
      this.els.checkZapisBtn?.addEventListener('click', () => {
        const ok = this.validateZapis();
        if (ok) this.enterVypocet();
      });

      this.els.openDiagramBtn?.addEventListener('click', () => this.modalOpen('diagram'));
      this.els.openFormulaBtn?.addEventListener('click', () => this.modalOpen('formula'));
      this.els.openHelpBtn?.addEventListener('click', () => this.modalOpen('help'));
      this.els.openCalcBtn?.addEventListener('click', () => this.modalOpen('calculator'));

      const live = () => this.validateVypocetLive();
      [this.els.formulaLHS, this.els.formulaRHS, this.els.subsLHS, this.els.subsRHS, this.els.resultLHS, this.els.resultRHS].forEach(el => el?.addEventListener('input', live));
      this.els.unitSelect?.addEventListener('change', live);

      // kalkulačka
      this.els.calcEval?.addEventListener('click', () => this.calcEval());
      this.els.calcCopy?.addEventListener('click', () => this.calcCopy());
      this.els.calcBack?.addEventListener('click', () => this.calcBackspace());
      this.els.calcClear?.addEventListener('click', () => this.calcClear());
      this.els.calcDisplay?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.calcEval(); } });
      // observer pro practice-screen (pokud se zviditelní až po kliknutí na „Spustit“)
      const target = this.els.practiceScreen;
      if (target) {
        const maybeStart = () => {
          if (isVisible(target) && !this._started) {
            this._started = true;
            this.newProblem();
          }
        };
        maybeStart();
        const mo = new MutationObserver(maybeStart);
        mo.observe(target, { attributes: true, attributeFilter: ['class'] });
      }
    },

    autostart() {
      const tryStart = () => {
        if (!this._started && isVisible(this.els.practiceScreen)) {
          this._started = true;
          this.newProblem();
        }
      };
      // 1) pokud je rovnou na practice
      tryStart();
      // 2) load
      window.addEventListener('load', tryStart);
      // 3) timeout
      setTimeout(tryStart, 800);
      // 4) když se vrátí do záložky
      document.addEventListener('visibilitychange', () => { if (!document.hidden) tryStart(); });
    },

    // ---------- GENERÁTOR ----------
    generateProblem() {
      const types = ['kladka', 'silak', 'auto', 'obecny'];
      const type = types[Math.floor(Math.random() * types.length)];
      const askPool = /** @type {('W'|'F'|'s')[]} */(['W', 'F', 's']);
      const askFor = askPool[Math.floor(Math.random() * askPool.length)];

      let F, s, text;
      if (type === 'kladka') {
        F = randRange(200, 800, 0);
        s = randRange(1, 5, 1);
        text = `Zedník zvedá břemeno pomocí pevné kladky silou ${F} N po dráze ${s} m. Urči ${askFor === 'W' ? 'vykonanou práci W' : askFor === 'F' ? 'sílu F' : 'dráhu s'}.`;
      } else if (type === 'silak') {
        F = randRange(500, 1500, 0);
        s = randRange(0.2, 1.5, 1);
        text = `Silák zvedne činku silou ${F} N do výšky ${s} m. Urči ${askFor === 'W' ? 'vykonanou práci W' : askFor === 'F' ? 'sílu F' : 'dráhu s'}.`;
      } else if (type === 'auto') {
        F = randRange(800, 5000, 0);
        const s_km = randRange(0.5, 10, 1);
        s = +(s_km * 1000).toFixed(0); // v m
        text = `Tahová síla motoru auta je ${F} N a auto jede po dráze ${s_km} km. Urči ${askFor === 'W' ? 'vykonanou práci W' : askFor === 'F' ? 'sílu F' : 'dráhu s'} (počítej v základních jednotkách).`;
      } else {
        F = randRange(200, 3000, 0);
        s = randRange(1, 3000, 0);
        text = `Těleso je přesunuto silou ${F} N po dráze ${s} m. Urči ${askFor === 'W' ? 'vykonanou práci W' : askFor === 'F' ? 'sílu F' : 'dráhu s'}.`;
      }
      const givens = { F, s, W: F * s };
      return { type, askFor, givens, text };
    },

    // ---------- NOVÝ PŘÍKLAD ----------
    newProblem() {
      this.resetUIToZapis();
      const p = this.generateProblem();
      this.state.problem = p;
      this.state.askFor = p.askFor;
      if (this.els.problemText) this.els.problemText.textContent = p.text;
      this.clearVypocetInputs();
      this.resetZapisRows();
      this.renderZapisHint("Zapiš známé veličiny v základních jednotkách (N, m, J). Hledanou veličinu nech bez hodnoty.");
    },

    // ---------- ZÁPIS ----------
    resetZapisRows() {
      const c = this.els.zapisContainer; if (!c) return;
      c.innerHTML = '';
      this.addZapisRow();
    },
    addZapisRow(prefill) {
      const c = this.els.zapisContainer; if (!c) return;
      const row = document.createElement('div');
      row.className = 'zapis-row';
      row.innerHTML = `
        <input class="zapis-symbol" placeholder="Symbol (W/F/s)">
        <input class="zapis-value" placeholder="Hodnota">
        <select class="zapis-unit">
          <option value="">jednotka</option>
          <option value="N">N</option>
          <option value="kN">kN</option>
          <option value="m">m</option>
          <option value="km">km</option>
          <option value="J">J</option>
          <option value="kJ">kJ</option>
          <option value="MJ">MJ</option>
        </select>
        <button class="zapis-dup secondary" title="Duplikovat do základní jednotky">↳ převod</button>
      `;
      c.appendChild(row);

      if (prefill) {
        row.querySelector('.zapis-symbol').value = prefill.symbol || '';
        row.querySelector('.zapis-value').value = prefill.value ?? '';
        row.querySelector('.zapis-unit').value = prefill.unit || '';
      }

      const onInput = () => this.handleZapisRowChange(row);
      row.querySelectorAll('input,select').forEach((el) => el.addEventListener('input', onInput));
      row.querySelector('.zapis-dup').addEventListener('click', () => this.duplicateToBase(row));
    },
    handleZapisRowChange(row) {
      const unit = row.querySelector('.zapis-unit').value;
      if (['kN', 'km', 'kJ', 'MJ'].includes(unit)) {
        this.renderZapisHint('Používáš násobnou jednotku — přidej převod na základní jednotku.');
      }
    },
    duplicateToBase(row) {
      const sym = row.querySelector('.zapis-symbol').value.trim();
      const valStr = row.querySelector('.zapis-value').value;
      const unit = row.querySelector('.zapis-unit').value;
      const v = parseNumber(valStr);
      const base = toBase(v, unit);
      if (!isFinite(base)) return;
      this.addZapisRow({ symbol: sym, value: base, unit: (sym === 'F' ? 'N' : sym === 's' ? 'm' : 'J') });
    },
    collectZapis() {
      const rows = [...(this.els.zapisContainer?.querySelectorAll('.zapis-row') || [])];
      const out = [];
      for (const r of rows) {
        const sym = r.querySelector('.zapis-symbol')?.value?.trim();
        const valStr = r.querySelector('.zapis-value')?.value;
        const unit = r.querySelector('.zapis-unit')?.value;
        if (!sym) continue;
        const val = valStr ? parseNumber(valStr) : undefined;
        out.push({ sym, val, unit });
      }
      return out;
    },
    validateZapis() {
      const p = this.state.problem; if (!p) return false;
      const rows = this.collectZapis();
      const errs = [];

      const got = { F: null, s: null, W: null };
      for (const r of rows) {
        if (!['F', 's', 'W'].includes(r.sym)) continue;
        if (r.val == null || r.val === '' || Number.isNaN(r.val)) {
          got[r.sym] = got[r.sym] ?? { empty: true };
        } else {
          const base = toBase(r.val, r.unit || (r.sym === 'F' ? 'N' : r.sym === 's' ? 'm' : 'J'));
          got[r.sym] = { value: base };
        }
      }

      const ask = this.state.askFor;
      if (!got[ask] || !got[ask].empty) errs.push(`Hledaná veličina ${ask} má být uvedena bez hodnoty.`);

      const tol = 0.05;
      if (ask !== 'F') {
        if (!got.F || got.F.value == null) errs.push('Chybí síla F v základních jednotkách.');
        else if (!nearlyEqual(got.F.value, p.givens.F, tol)) errs.push('Síla F není v základních jednotkách nebo mimo toleranci.');
      }
      if (ask !== 's') {
        if (!got.s || got.s.value == null) errs.push('Chybí dráha s v základních jednotkách.');
        else if (!nearlyEqual(got.s.value, p.givens.s, tol)) errs.push('Dráha s není v základních jednotkách nebo mimo toleranci.');
      }
      if (ask !== 'W') {
        if (!got.W || got.W.value == null) errs.push('Chybí práce W v základních jednotkách (J).');
        else if (!nearlyEqual(got.W.value, p.givens.W, tol)) errs.push('Práce W není v základních jednotkách nebo mimo toleranci.');
      }

      if (errs.length) { this.renderZapisErrors(errs); return false; }
      this.renderZapisErrors([]);
      return true;
    },
    renderZapisErrors(errs) {
      const box = this.els.zapisErrors; if (!box) return;
      if (!errs.length) { box.innerHTML = ''; box.classList.add('hidden'); return; }
      box.classList.remove('hidden');
      box.innerHTML = '<ul>' + errs.map((e) => `<li>${e}</li>`).join('') + '</ul>';
    },
    renderZapisHint(msg) {
      const box = this.els.zapisErrors; if (!box || !msg) return;
      box.classList.remove('hidden');
      box.innerHTML = `<div class="hint">${msg}</div>`;
    },

    // ---------- VÝPOČET ----------
    enterVypocet() {
      this.state.stage = 'vypocet';
      this.toggleStages();
      this.seedVypocetFields();
      this.validateVypocetLive();
    },
    seedVypocetFields() {
      const ask = this.state.askFor; if (!ask) return;
      if (this.els.formulaLHS) this.els.formulaLHS.value = ask;
      if (this.els.formulaRHS) this.els.formulaRHS.value = '';
      if (this.els.subsLHS) this.els.subsLHS.value = ask;
      if (this.els.subsRHS) this.els.subsRHS.value = '';
      if (this.els.resultLHS) this.els.resultLHS.value = ask;
      if (this.els.resultRHS) this.els.resultRHS.value = '';
      if (this.els.unitSelect) this.els.unitSelect.value = ask === 'W' ? 'J' : ask === 'F' ? 'N' : 'm';
      this.renderVypocetTips('Vzorec trojúhelník: W nahoře, F·s dole. Pro ' + ask + ' zvol správný tvar.');
    },
    validateVypocetLive() {
      const p = this.state.problem; if (!p) return;
      const ask = this.state.askFor; if (!ask) return;

      const lhs = this.els.formulaLHS?.value.trim();
      const rhs = (this.els.formulaRHS?.value.trim() || '').replace(/\s+/g, '');
      const okFormula = this.validateFormula(ask, lhs, rhs);

      const subsL = this.els.subsLHS?.value.trim();
      const subsR = (this.els.subsRHS?.value.trim() || '').replace(/\s+/g, '');
      const okSubs = this.validateSubstitution(ask, subsL, subsR, p.givens);

      const resL = this.els.resultLHS?.value.trim();
      const resRVal = parseNumber(this.els.resultRHS?.value || '');
      const unit = this.els.unitSelect?.value || (ask === 'W' ? 'J' : ask === 'F' ? 'N' : 'm');
      const okRes = this.validateResult(ask, resL, resRVal, unit, p.givens);

      if (!okFormula) this.renderVypocetTips('Zkontroluj tvar vzorce. Pro W: W=F·s, pro F: F=W/s, pro s: s=W/F.');
      else if (!okSubs) this.renderVypocetTips('Zkontroluj dosazení (čísla v základních jednotkách, pro W komutativně F·s nebo s·F).');
      else if (!okRes) this.renderVypocetTips('Výsledek je mimo toleranci nebo špatná jednotka.');
      else this.renderVypocetTips('✅ Vše v pořádku.');
    },
    validateFormula(ask, lhs, rhs) {
      if (lhs !== ask) return false;
      const mult = '[*.·]';
      const patterns = {
        W: new RegExp(`^F${mult}?s$|^s${mult}?F$`),
        F: /^W\/?s$/,
        s: /^W\/?F$/,
      };
      return patterns[ask].test(rhs || '');
    },
    validateSubstitution(ask, lhs, rhs, givens) {
      if (lhs !== ask) return false;
      const F = givens.F, s = givens.s, W = givens.W;
      try {
        const expr = rhs.replace(/[A-Za-z]+/g, '').replace(/,/, '.');
        const val = Function('"use strict";return (' + expr + ')')();
        if (!isFinite(val)) return false;
        if (ask === 'W') return nearlyEqual(val, F * s, 1e-6);
        if (ask === 'F') return nearlyEqual(val, W / s, 1e-6);
        if (ask === 's') return nearlyEqual(val, W / F, 1e-6);
      } catch { return false; }
      return false;
    },
    validateResult(ask, lhs, value, unit, givens) {
      if (lhs !== ask) return false;
      const targetBase = (ask === 'W') ? givens.W : (ask === 'F') ? givens.F : givens.s;
      const userBase = (ask === 'W') ? toBase(value, unit) : value; // F a s očekáváme v N a m
      const tol = 0.05;
      if (!isFinite(userBase)) return false;
      return nearlyEqual(userBase, targetBase, tol);
    },
    renderVypocetTips(msg) { const box = this.els.vypocetTips; if (box) box.textContent = msg || ''; },
    clearVypocetInputs() {
      ['formulaLHS','formulaRHS','subsLHS','subsRHS','resultLHS','resultRHS'].forEach(k => { if (this.els[k]) this.els[k].value = ''; });
      if (this.els.unitSelect) this.els.unitSelect.value = 'J';
      if (this.els.vypocetFeedback) this.els.vypocetFeedback.innerHTML = '';
    },

    // ---------- STAVY ----------
    resetUIToZapis() {
      this.state.stage = 'zapis';
      this.toggleStages();
      this.renderZapisErrors([]);
    },
    toggleStages() {
      const inZapis = this.state.stage === 'zapis';
      if (this.els.vypocetStep) this.els.vypocetStep.classList.toggle('hidden', inZapis);
      // schovat/ukázat pouze wrapper zápisu = parent zapis-containeru
      const zapisWrap = this.els.zapisContainer?.parentElement;
      if (zapisWrap) zapisWrap.classList.toggle('hidden', !inZapis);
    },

    // ---------- MODÁLY ----------
    modalOpen(which) {
      const map = { diagram: this.els.diagramModal, formula: this.els.formulaModal, help: this.els.helpModal, calculator: this.els.calcModal };
      const el = map[which];
      if (!el) return;
      if ('showModal' in el) { try { el.showModal(); } catch {} } else { el.classList.remove('hidden'); }
    },

    // ---------- Kalkulačka ----------
    calcEval() {
      const inp = this.els.calcDisplay; if (!inp) return;
      const expr = (inp.value || '').trim();
      if (!expr) return;
      try {
        const safe = expr.replace(/[^0-9+\-*/()., ]/g, '');
        const js = safe.replace(/,/g, '.');
        const val = Function('"use strict";return (' + js + ')')();
        if (!isFinite(val)) return;
        const line = `${expr} = ${val}`;
        if (this.els.calcHistory) this.els.calcHistory.textContent = line;
        inp.value = String(val);
      } catch {}
    },
    calcCopy() {
      const inp = this.els.calcDisplay; if (!inp) return;
      navigator.clipboard?.writeText(inp.value || '');
    },
    calcBackspace() {
      const inp = this.els.calcDisplay; if (!inp) return;
      inp.value = inp.value.slice(0, -1);
    },
    calcClear() {
      const inp = this.els.calcDisplay; if (!inp) return;
      inp.value = '';
      if (this.els.calcHistory) this.els.calcHistory.textContent = '';
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

  // pro ladění v konzoli
  window.__FyzikaApp = App;
})();