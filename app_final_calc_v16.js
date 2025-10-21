/* ============================================================
   app_final_calc_v16.js
   Výpočetní modul (verze 16)
   - Plná kompatibilita s app_cleaned_v11.js
   - Live checking + výsledkový box s nápovědou
   - Tmavé schéma s fade-in efektem
   ============================================================ */

console.log("🧩 Načítání app_final_calc_v16.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace v16...");

  const $ = (s, c=document) => c.querySelector(s);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const cls = (el, add=[], rem=[]) => {
    if (!el) return;
    rem.forEach(r => el.classList.remove(r));
    add.forEach(a => el.classList.add(a));
  };

  const markOK = el => cls(el, ["border-green-500"], ["border-red-500"]);
  const markBAD = el => cls(el, ["border-red-500"], ["border-green-500"]);
  const markNEU = el => cls(el, [], ["border-green-500","border-red-500"]);

  function ensureCalcBox(){
    const container = $("#vypocet-step");
    if (!container) return;

    if ($("#calc-box-v16")) return $("#calc-box-v16");

    const box = document.createElement("div");
    box.id = "calc-box-v16";
    box.className = "mt-4 bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-4 text-gray-200 shadow-lg";
    box.innerHTML = `
      <h3 class="text-lg font-semibold text-blue-300">🔹 Výpočetní část</h3>
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <input id="calc-formula-lhs" class="bg-gray-900 border border-gray-700 p-2 rounded-md w-16" placeholder="např. W">
          <span class="text-lg">=</span>
          <input id="calc-formula-rhs" class="flex-1 bg-gray-900 border border-gray-700 p-2 rounded-md" placeholder="např. F * s">
        </div>
        <div class="flex items-center gap-2">
          <input id="calc-subs-lhs" class="bg-gray-900 border border-gray-700 p-2 rounded-md w-16" placeholder="např. W">
          <span class="text-lg">=</span>
          <input id="calc-subs-rhs" class="flex-1 bg-gray-900 border border-gray-700 p-2 rounded-md" placeholder="např. 1000 * 2">
        </div>
        <div class="flex items-center gap-2">
          <input id="calc-result-lhs" class="bg-gray-900 border border-gray-700 p-2 rounded-md w-16" placeholder="např. W">
          <span class="text-lg">=</span>
          <input id="calc-result-rhs" class="flex-1 bg-gray-900 border border-gray-700 p-2 rounded-md" placeholder="např. 2000">
          <select id="unit-select" class="bg-gray-900 border border-gray-700 p-2 rounded-md ml-2">
            <option>J</option>
            <option>kJ</option>
            <option>MJ</option>
          </select>
        </div>
      </div>
      <button id="check-calculation-button" class="mt-3 bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg">Ověřit výpočet</button>
      <div id="calc-result-box" class="hidden opacity-0 transition-opacity duration-300 ease-in-out mt-4"></div>
    `;
    container.appendChild(box);
    return box;
  }

  function showResultBox(html, ok=true){
    const box = $("#calc-result-box");
    if (!box) return;
    box.innerHTML = html;
    box.classList.remove("hidden");
    box.classList.remove("opacity-0");
    box.classList.add("opacity-100");
    box.className = ok
      ? "mt-4 p-4 rounded-lg bg-green-900/60 border border-green-600 text-green-200 opacity-100 transition-all"
      : "mt-4 p-4 rounded-lg bg-red-900/60 border border-red-600 text-red-200 opacity-100 transition-all";
    box.scrollIntoView({behavior:"smooth", block:"center"});
  }

  function attachValidation(){
    const fL=$("#calc-formula-lhs"), fR=$("#calc-formula-rhs");
    const sL=$("#calc-subs-lhs"), sR=$("#calc-subs-rhs");
    const rL=$("#calc-result-lhs"), rR=$("#calc-result-rhs");
    const unit=$("#unit-select");

    function vFormula(){
      const L=fL.value.trim(), R=fR.value.trim();
      if(!L && !R){markNEU(fL);markNEU(fR);return;}
      const okL=/^[WwFfSs]$/.test(L);
      const okR=/F.*s|s.*F/.test(R);
      (okL?markOK:markBAD)(fL); (okR?markOK:markBAD)(fR);
    }
    function vSubs(){
      const L=sL.value.trim(), R=sR.value.trim();
      if(!L && !R){markNEU(sL);markNEU(sR);return;}
      const okL=/^[WwFfSs]$/.test(L);
      const okR=/[0-9]/.test(R);
      (okL?markOK:markBAD)(sL); (okR?markOK:markBAD)(sR);
    }
    function vRes(){
      const L=rL.value.trim(), R=rR.value.trim();
      if(!L && !R){markNEU(rL);markNEU(rR);return;}
      const okL=/^[WwFfSs]$/.test(L);
      const okR=!isNaN(parseFloat(R));
      (okL?markOK:markBAD)(rL); (okR?markOK:markBAD)(rR);
    }

    [fL,fR].forEach(e=>on(e,"input",vFormula));
    [sL,sR].forEach(e=>on(e,"input",vSubs));
    [rL,rR].forEach(e=>on(e,"input",vRes));

    on($("#check-calculation-button"),"click",()=>{
      let tips=[]; let ok=true;
      if(!/^[Ww]$/.test(fL.value.trim())){tips.push("Vzorec musí začínat hledanou veličinou (např. W)."); ok=false;}
      if(!/F.*s|s.*F/.test(fR.value.trim())){tips.push("Použij tvar F * s nebo s * F."); ok=false;}
      if(!/[0-9]/.test(sR.value.trim())){tips.push("V dosazení uveď číselné hodnoty."); ok=false;}
      if(isNaN(parseFloat(rR.value))){tips.push("Zadej číselný výsledek."); ok=false;}

      if(ok){
        showResultBox(`✅ <b>Správně!</b><br>${fL.value} = ${fR.value}<br>${sL.value} = ${sR.value}<br>${rL.value} = ${rR.value} ${unit.value}`,true);
      } else {
        const msg = `<b>❌ Chyba ve výpočtu:</b><br><ul class="list-disc pl-5">${tips.map(t=>`<li>${t}</li>`).join("")}</ul>`;
        showResultBox(msg,false);
      }
    });
  }

  function init(){
    console.log("🧩 Inicializace výpočetního boxu v16...");
    const box=ensureCalcBox();
    if(box) attachValidation();
    console.log("✅ Výpočetní box v16 byl vytvořen.");
  }

  init();
});
