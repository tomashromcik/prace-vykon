// app_final_calc_v20.js (fixed)
// Výpočetní část: pracuje s dvoupólovými poli (#formula-*, #subs-*, #result-*),
// live kontrola + "Ověřit výpočet" s výsledkovým boxem.

console.log("🧩 Načítání app_final_calc_v20.js ...");

(function(){
  function $(s, c=document){ return c.querySelector(s); }
  function on(el, ev, fn){ if (el) el.addEventListener(ev, fn); }

  document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM načten, inicializace v20...");

    // Čekáme, až je practice screen k dispozici
    const practiceScreen = $("#practice-screen");
    if (!practiceScreen) return;

    // Připrav po každém novém zadání i po úspěšné kontrole zápisu
    document.addEventListener("problem:new", resetCalcUI);
    document.addEventListener("zapis:ok", buildCalcValidation);

    // Při načtení stránky jen připrav stavy
    console.log("✅ v20 připraveno (čeká na validní zápis & klik na 'Zkontrolovat zápis').");
  });

  function resetCalcUI() {
    const ids = ["formula-lhs","formula-rhs","subs-lhs","subs-rhs","result-lhs","result-rhs"];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    const vf = $("#vypocet-feedback-container"); if (vf) vf.innerHTML = "";
  }

  function buildCalcValidation() {
    console.log("✅ v20: start validací pro výpočet.");
    const fL = $("#formula-lhs"), fR = $("#formula-rhs");
    const sL = $("#subs-lhs"),    sR = $("#subs-rhs");
    const rL = $("#result-lhs"),  rR = $("#result-rhs");
    const unit = $("#unit-select");
    const btnCheck = $("#check-calculation-button");
    const feedback = $("#vypocet-feedback-container");

    const addOK  = el => el?.classList.add("ring-2","ring-green-500");
    const addBAD = el => el?.classList.add("ring-2","ring-red-500");
    const clr    = el => el?.classList.remove("ring-2","ring-red-500","ring-green-500");

    function parseNum(s){ const t=String(s||"").replace(",",".").trim(); if (t==="") return NaN; return Number(t); }
    function almostEqual(a,b,rel=0.05){ if(!isFinite(a)||!isFinite(b)) return false; if(b===0) return Math.abs(a)<1e-9; return Math.abs(a-b)<=Math.abs(b)*rel; }

    function unknownSym(){
      // z pokročilého zápisu (hledaná)
      try{
        const st = window.getZapisState?.();
        const r = st?.rows?.find(x => x.unknown);
        return (r && r.symbol && r.symbol !== "-") ? r.symbol : "W";
      }catch{return "W";}
    }

    function vFormula(){
      [fL,fR].forEach(clr);
      const L = (fL?.value||"").trim();
      const R = (fR?.value||"").trim().replace(/\s+/g,"");
      const u = unknownSym();
      let ok=false;
      if(u==="W") ok = /^[Ww]$/.test(L) && /^(F[*·]s|s[*·]F)$/i.test(R);
      else if(u==="F") ok = /^[Ff]$/.test(L) && /^W\/s$/i.test(R);
      else if(u==="s") ok = /^[sS]$/.test(L) && /^W\/F$/i.test(R);
      (ok?addOK:addBAD)(fL); (ok?addOK:addBAD)(fR);
    }

    function vSubs(){
      [sL,sR].forEach(clr);
      const L=(sL?.value||"").trim(); const R=(sR?.value||"").trim().replace(/\s+/g,"");
      const u=unknownSym(); const cp=window.currentProblem;
      let ok=false, orderNote="";
      const Fg=cp?.givens?.find(g=>g.symbol==="F"); const sg=cp?.givens?.find(g=>g.symbol==="s");
      const Wv=cp?.result;

      if(u==="W"){
        const m = R.match(/^(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/);
        const a=parseNum(m?.[1]), b=parseNum(m?.[2]);
        if (isFinite(a)&&isFinite(b)&&Fg&&sg){
          ok = (almostEqual(a,Fg.value)&&almostEqual(b,sg.value))||(almostEqual(a,sg.value)&&almostEqual(b,Fg.value));
          if (/^W$/i.test(L) && /^F[*·]s$/i.test(($("#formula-rhs")?.value||"").replace(/\s+/g,""))) {
            if(!(almostEqual(a,Fg.value)&&almostEqual(b,sg.value))) orderNote="ℹ️ Pořadí by mělo odpovídat vzorci (F, pak s).";
          }
        }
      } else if (u==="F"){
        const m = R.match(/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
        const a=parseNum(m?.[1]), b=parseNum(m?.[2]);
        if (isFinite(a)&&isFinite(b)&&sg&&isFinite(Wv)) ok = almostEqual(a,Wv)&&almostEqual(b,sg.value);
      } else if (u==="s"){
        const m = R.match(/^(\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
        const a=parseNum(m?.[1]), b=parseNum(m?.[2]);
        const Fg2=Fg;
        if (isFinite(a)&&isFinite(b)&&Fg2&&isFinite(Wv)) ok = almostEqual(a,Wv)&&almostEqual(b,Fg2.value);
      }

      (ok?addOK:addBAD)(sL); (ok?addOK:addBAD)(sR);
      if (orderNote) note(orderNote);
    }

    function vResult(){
      [rL,rR].forEach(clr);
      const L=(rL?.value||"").trim(); const Rn=parseNum(rR?.value);
      const u=unknownSym(); const cp=window.currentProblem;
      const unitSel = unit?.value || "J";
      const factor = ({J:1,kJ:1000,MJ:1_000_000}[unitSel] ?? 1);
      let ok=false;
      if(u==="W"){
        ok = isFinite(Rn) && almostEqual(Rn*factor, cp?.result);
      } else {
        ok = isFinite(Rn);
      }
      (ok?addOK:addBAD)(rL); (ok?addOK:addBAD)(rR);
    }

    [fL,fR].forEach(el => on(el, "input", vFormula));
    [sL,sR].forEach(el => on(el, "input", vSubs));
    [rL,rR].forEach(el => on(el, "input", vResult));
    on(unit, "change", vResult);

    on(btnCheck, "click", () => {
      feedback.innerHTML = "";
      vFormula(); vSubs(); vResult();
      const bad = [fL,fR,sL,sR,rL,rR].some(el => el?.classList.contains("ring-red-500"));
      const box = document.createElement("div");
      box.className = "mt-3 p-3 rounded-xl border";
      if (!bad) {
        box.classList.add("border-green-600","bg-green-900/30","text-green-200");
        box.innerHTML = "<b>✅ Skvělé!</b> Všechny kroky výpočtu vypadají správně. Jen nezapomeň na jednotky a zaokrouhlení.";
      } else {
        box.classList.add("border-red-600","bg-red-900/30","text-red-200");
        const tips = [];
        if (fL.classList.contains("ring-red-500")||fR.classList.contains("ring-red-500")) tips.push("Uprav vzorec – začínej hledanou veličinou a používej tvary W=F*s, F=W/s, s=W/F.");
        if (sL.classList.contains("ring-red-500")||sR.classList.contains("ring-red-500")) tips.push("Zkontroluj dosazení – čísla musí odpovídat zadání (pozor na pořadí).");
        if (rL.classList.contains("ring-red-500")||rR.classList.contains("ring-red-500")) tips.push("Zkontroluj výsledek – správně převést jednotky a spočítat číslo.");
        box.innerHTML = "<b>❌ Něco nesedí:</b><ul class='list-disc pl-5 mt-2'>" + tips.map(t=>`<li>${t}</li>`).join("") + "</ul>";
      }
      feedback.appendChild(box);
    });

    console.log("✅ v20: validace a tlačítko Ověřit výpočet připraveny.");
  }
})();
