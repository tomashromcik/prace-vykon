// ====================================================================
//  app.js — Fyzika: Práce a výkon (kompletní verze s checkboxem a kontrolou)
// ====================================================================

console.log("Načítání app.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace aplikace...");

  // ---------- Globální proměnné ----------
  let selectedMode = null;
  let selectedLevel = null;
  let selectedTopic = "prace";
  let currentProblem = null;

  const setupScreen = document.getElementById("setup-screen");
  const practiceScreen = document.getElementById("practice-screen");
  const startButton = document.getElementById("start-button");
  const topicSelect = document.getElementById("topic-select");

  // ---------- Volba režimu / obtížnosti ----------
  document.querySelectorAll('[id^="mode-"]').forEach(b=>{
    b.addEventListener("click",()=>{
      document.querySelectorAll('[id^="mode-"]').forEach(x=>x.classList.remove("ring-2","ring-blue-500"));
      b.classList.add("ring-2","ring-blue-500");
      selectedMode = b.id.includes("practice")?"practice":"test";
      updateStart();
    });
  });
  document.querySelectorAll('[id^="level-"]').forEach(b=>{
    b.addEventListener("click",()=>{
      document.querySelectorAll('[id^="level-"]').forEach(x=>x.classList.remove("ring-2","ring-blue-500"));
      b.classList.add("ring-2","ring-blue-500");
      if(b.id.includes("easy"))selectedLevel="easy";
      if(b.id.includes("normal"))selectedLevel="normal";
      if(b.id.includes("hard"))selectedLevel="hard";
      updateStart();
    });
  });
  topicSelect?.addEventListener("change",e=>{
    selectedTopic=e.target.value;
    updateStart();
  });

  function updateStart(){
    const ok=selectedMode&&selectedLevel&&selectedTopic;
    startButton.disabled=!ok;
    startButton.classList.toggle("btn-disabled",!ok);
    if(ok)console.log("✅ Start povolen");
  }

  // ---------- Spuštění ----------
  startButton?.addEventListener("click",()=>{
    setupScreen.classList.add("hidden");
    practiceScreen.classList.remove("hidden");
    clearZapis();
    generateProblem();
  });

  // ---------- Přidávání řádku ----------
  document.getElementById("add-zapis-row-button")?.addEventListener("click",()=>{
    const c=document.getElementById("zapis-container");
    if(!c)return;
    const symEasy=["-","F","s","W"];
    const unitEasy=["-","cm","m","km","J","kJ","MJ","N","kN","MN"];
    let sy=symEasy,un=unitEasy;
    if(selectedLevel==="hard"){
      sy=["-","F","s","W","P","t","m"];
      un=["-","mm","cm","m","km","J","kJ","MJ","N","kN","MN","W","kW","MW","g","kg","t","s","min","h"];
    }
    const row=document.createElement("div");
    row.className="grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";
    const sSel=document.createElement("select");
    sSel.className="zapis-symbol p-2 rounded-md bg-gray-900 border border-gray-700 text-white";
    sy.forEach(x=>{const o=document.createElement("option");o.value=x;o.textContent=x;sSel.appendChild(o);});
    const val=document.createElement("input");
    val.type="text";val.placeholder="Hodnota";
    val.className="zapis-value p-2 rounded-md bg-gray-900 border border-gray-700 text-white";
    const uSel=document.createElement("select");
    uSel.className="zapis-unit p-2 rounded-md bg-gray-900 border border-gray-700 text-white";
    un.forEach(x=>{const o=document.createElement("option");o.value=x;o.textContent=x;uSel.appendChild(o);});
    const lab=document.createElement("label");
    lab.className="flex items-center gap-2 text-sm text-gray-300";
    const cb=document.createElement("input");
    cb.type="checkbox";cb.className="zapis-unknown h-4 w-4";
    const sp=document.createElement("span");sp.textContent="Hledaná veličina";
    lab.append(cb,sp);
    cb.addEventListener("change",()=>{
      if(cb.checked){val.value="?";val.disabled=true;}else{if(val.value=="?")val.value="";val.disabled=false;}
    });
    row.append(sSel,val,uSel,lab);
    c.appendChild(row);
  });

  // ---------- Kontrola zápisu ----------
  document.getElementById("check-zapis-button")?.addEventListener("click",()=>{
    const {errors,warnings,summary}=validateZapis();
    renderSummary(summary);
    renderIssues(errors,warnings);
    if(errors.length===0){
      document.getElementById("zapis-step")?.classList.add("hidden");
      document.getElementById("vypocet-step")?.classList.remove("hidden");
      renderReview(summary);
    }
  });

  // ---------- Databáze příkladů ----------
  const topics={
    prace:{
      units:["J","kJ"],
      examples:[
        {text:"Auto působí silou 2 000 N na vzdálenost 5 m. Jakou práci vykoná?",
         givens:[{symbol:"F",value:2000,unit:"N"},{symbol:"s",value:5,unit:"m"}],
         result:2000*5},
        {text:"Dělník zvedl břemeno 50 kg do výšky 2 m. Vypočítej práci.",
         givens:[{symbol:"s",value:2,unit:"m"}],
         result:50*10*2}
      ]
    },
    vykon:{
      units:["W","kW"],
      examples:[
        {text:"Motor vykonal práci 12 000 J za 4 s. Jaký byl výkon?",
         givens:[{symbol:"W",value:12000,unit:"J"},{symbol:"t",value:4,unit:"s"}],
         result:12000/4},
        {text:"Čerpadlo vykonává práci 24 kJ za 8 s. Jaký je výkon?",
         givens:[{symbol:"W",value:24000,unit:"J"},{symbol:"t",value:8,unit:"s"}],
         result:24000/8}
      ]
    }
  };

  function generateProblem(){
    const d=topics[selectedTopic];
    const ex=d.examples[Math.floor(Math.random()*d.examples.length)];
    currentProblem=ex;
    document.getElementById("problem-text").textContent=ex.text;
  }

  // ---------- Kontrola zápisu ----------
  const unitSets={
    length:["mm","cm","m","km"],energy:["J","kJ","MJ"],
    force:["N","kN","MN"],power:["W","kW","MW"],
    mass:["g","kg","t"],time:["s","min","h"]
  };
  const symbolToKind={s:"length",W:"energy",F:"force",P:"power",m:"mass",t:"time"};
  const baseUnit={length:"m",energy:"J",force:"N",power:"W",mass:"kg",time:"s"};

  function toBase(v,u,k){
    v=Number(v);if(!isFinite(v))return null;
    switch(k){
      case"length":if(u=="mm")return v/1000;if(u=="cm")return v/100;if(u=="m")return v;if(u=="km")return v*1000;break;
      case"energy":if(u=="J")return v;if(u=="kJ")return v*1000;if(u=="MJ")return v*1e6;break;
      case"force":if(u=="N")return v;if(u=="kN")return v*1000;if(u=="MN")return v*1e6;break;
      case"power":if(u=="W")return v;if(u=="kW")return v*1000;if(u=="MW")return v*1e6;break;
      case"mass":if(u=="g")return v/1000;if(u=="kg")return v;if(u=="t")return v*1000;break;
      case"time":if(u=="s")return v;if(u=="min")return v*60;if(u=="h")return v*3600;break;
    }return null;
  }
  const nearly=(a,b)=>Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b));

  function collect(){
    return [...document.querySelectorAll("#zapis-container .zapis-row")].map(r=>{
      const s=r.querySelector(".zapis-symbol").value.trim();
      const u=r.querySelector(".zapis-unit").value.trim();
      const raw=r.querySelector(".zapis-value").value.trim();
      const unk=r.querySelector(".zapis-unknown").checked;
      const val=(!unk&&raw&&raw!="?")?Number(raw.replace(",",".")):null;
      return{symbol:s,unit:u,value:val,raw,unknown:unk};
    });
  }

  function validateZapis(){
    const z=collect(),errors=[],warn=[];
    const sum=z.map((r,i)=>`${i+1}. ${r.symbol} = ${r.unknown?"?":r.raw||""} ${r.unit}`).join("\n");
    // 1) veličina↔jednotka
    z.forEach(r=>{
      const k=symbolToKind[r.symbol];
      if(k&&!unitSets[k].includes(r.unit))
        errors.push(`Veličina **${r.symbol}** neodpovídá jednotce **${r.unit}**.`);
    });
    // 2–4) kontrola proti zadání
    const g=currentProblem?.givens||[];
    g.forEach(gv=>{
      const k=symbolToKind[gv.symbol];
      const r=z.find(x=>x.symbol==gv.symbol&&!x.unknown);
      if(!r)return;
      if(r.raw=="?"||r.value==null){errors.push(`V řádku **${gv.symbol}** chybí hodnota.`);return;}
      const bg=toBase(gv.value,gv.unit,k),br=toBase(r.value,r.unit,k);
      if(bg==null||br==null)return;
      if(nearly(bg,br)){
        const base=baseUnit[k];
        if(gv.unit!==base&&r.unit===gv.unit)
          warn.push(`**${gv.symbol}** je v ${r.unit} – převeďte na ${base}.`);
      }else errors.push(`**${gv.symbol}** neodpovídá zadání.`);
    });
    return{errors,warnings:warn,summary:sum};
  }

  function renderSummary(t){
    const fb=document.getElementById("zapis-feedback-container");
    fb.innerHTML=`<div class="p-3 bg-gray-900 border border-gray-700 rounded mb-3">
      <div class="font-semibold mb-2 text-gray-300">Souhrn zápisu:</div>
      <pre class="text-gray-200 text-sm whitespace-pre-wrap">${t}</pre>
    </div>`;
  }
  function renderIssues(err,warn){
    const fb=document.getElementById("zapis-feedback-container");
    const a=[];
    if(err.length)a.push(`<div class="feedback-wrong"><b>Chyby:</b><ul>${err.map(e=>`<li>${e}</li>`).join("")}</ul></div>`);
    if(warn.length)a.push(`<div class="feedback-correct"><b>Doporučení:</b><ul>${warn.map(w=>`<li>${w}</li>`).join("")}</ul></div>`);
    if(!err.length&&!warn.length)a.push(`<div class="feedback-correct">👍 Zápis je v pořádku.</div>`);
    fb.insertAdjacentHTML("beforeend",a.join(""));
  }
  function renderReview(t){
    const r=document.getElementById("zapis-review-container");
    r.innerHTML=`<div class="p-3 bg-gray-900 border border-gray-700 rounded">
      <div class="font-semibold mb-2 text-gray-300">Souhrn zápisu:</div>
      <pre class="text-gray-200 text-sm whitespace-pre-wrap">${t}</pre>
    </div>`;
  }
  function clearZapis(){
    ["zapis-container","zapis-feedback-container","zapis-review-container"].forEach(id=>{
      const e=document.getElementById(id);if(e)e.innerHTML="";
    });
  }

  console.log("✅ Logika aplikace úspěšně načtena.");
});
