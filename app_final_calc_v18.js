
/*
  app_final_calc_v18.js
  ------------------------------------------------------------
  - Opravuje nefunkční tlačítka „+ Přidat veličinu“ a „Zkontrolovat zápis“
    (nezávisle na hlavním skriptu – přidává vlastní obsluhy).
  - Live checking zápisu po řádcích (při psaní) + souhrnné ověření.
  - Po úspěšném ověření zápisu zobrazí Výpočetní část (LHS = RHS + jednotka).
  - Ověření výpočtu vypisuje chyby/tipy do samostatného výsledkového boxu.
  - Reaguje na „Nový příklad“: resetuje a znovu skryje výpočetní box.
  ------------------------------------------------------------
*/

console.log("v18: start");

(function () {
  // ---------- Helpers ----------
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  const clsAdd = (el, ...k) => el && el.classList.add(...k);
  const clsRem = (el, ...k) => el && el.classList.remove(...k);

  // feedback edge colors (Tailwind-ish)
  const markOK  = el => { if(!el) return; clsRem(el, "ring-2","ring-red-500"); clsAdd(el, "ring-2","ring-green-500"); };
  const markBAD = el => { if(!el) return; clsRem(el, "ring-2","ring-green-500"); clsAdd(el, "ring-2","ring-red-500"); };
  const markNEU = el => { if(!el) return; clsRem(el, "ring-2","ring-green-500","ring-red-500"); };

  const unitToBaseFactor = {
    // délka
    mm: 1/1000, cm: 1/100, m: 1, km: 1000,
    // práce/energie
    J: 1, kJ: 1000, MJ: 1_000_000,
    // síla
    N: 1, kN: 1000, MN: 1_000_000
  };
  const symbolToKind = { s:"length", F:"force", W:"energy" };
  const unitSets = { length:["mm","cm","m","km"], energy:["J","kJ","MJ"], force:["N","kN","MN"] };

  function parseNum(s) {
    if (s == null) return NaN;
    const t = String(s).replace(",", ".").trim();
    if (t === "") return NaN;
    return Number(t);
  }
  function almostEqual(a, b, rel = 0.05) {
    if (!isFinite(a) || !isFinite(b)) return false;
    if (b === 0) return Math.abs(a) < 1e-9;
    return Math.abs(a - b) <= Math.abs(b) * rel;
  }

  function getProblem() {
    return window.currentProblem || null;
  }

  // ---------- ZÁPIS ----------

  function createRow({symbol="-", value="", unit="-", unknown=false}={}) {
    const row = document.createElement("div");
    row.className = "grid grid-cols-1 sm:grid-cols-4 gap-2 zapis-row mt-2 p-2 rounded-lg bg-gray-800 border border-gray-700";

    const symbols = ["-","F","s","W"];
    const sSel = document.createElement("select");
    sSel.className = "zapis-symbol p-2 rounded-md bg-gray-900 border border-gray-700 text-white";
    symbols.forEach(x => { const o=document.createElement("option"); o.value=x; o.textContent=x; sSel.appendChild(o); });
    sSel.value = symbol;

    const val = document.createElement("input");
    val.type = "text";
    val.value = value;
    val.placeholder = "Hodnota";
    val.className = "zapis-value p-2 rounded-md bg-gray-900 border border-gray-700 text-white";

    const units = ["-","mm","cm","m","km","J","kJ","MJ","N","kN","MN"];
    const uSel = document.createElement("select");
    uSel.className = "zapis-unit p-2 rounded-md bg-gray-900 border border-gray-700 text-white";
    units.forEach(x => { const o=document.createElement("option"); o.value=x; o.textContent=x; uSel.appendChild(o); });
    uSel.value = unit;

    const lab = document.createElement("label");
    lab.className = "flex items-center gap-2 text-sm text-gray-300";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "zapis-unknown h-4 w-4";
    cb.checked = !!unknown;
    const sp = document.createElement("span"); sp.textContent = "Hledaná veličina";
    lab.append(cb, sp);

    row.append(sSel, val, uSel, lab);

    // live validate for row
    const live = () => rowLiveValidate(row);
    on(sSel,"change",live); on(val,"input",live); on(uSel,"change",live); on(cb,"change", () => {
      val.disabled = cb.checked; if (cb.checked) { val.value = "?"; } else if (val.value === "?") { val.value=""; }
      live();
    });
    return row;
  }

  function rowLiveValidate(row) {
    markNEU(row);
    const symbol  = $(".zapis-symbol", row)?.value || "-";
    const valStr  = $(".zapis-value",  row)?.value?.trim() ?? "";
    const unit    = $(".zapis-unit",   row)?.value || "-";
    const unknown = $(".zapis-unknown",row)?.checked || false;

    if (symbol === "-" || unit === "-" || (!unknown && valStr==="")) return; // zatím nehodnotit

    const prob = getProblem();
    const kind = symbolToKind[symbol];
    if (!kind || !unitSets[kind].includes(unit)) { markBAD(row); return; }

    // neznámá veličina = formálně OK
    if (unknown) { markOK(row); return; }

    const given = prob?.givens?.find(g => g.symbol === symbol);
    if (!given) { markOK(row); return; } // není v zadání -> nechme projít

    const val = parseNum(valStr);
    const factor = unitToBaseFactor[unit] ?? NaN;
    if (!isFinite(val) || !isFinite(factor)) { markBAD(row); return; }
    const inBase = val * factor;
    if (almostEqual(inBase, given.value)) markOK(row); else markBAD(row);
  }

  function collectRows() {
    return $$(".zapis-row").map(r => ({
      symbol:  $(".zapis-symbol",r)?.value || "-",
      raw:     $(".zapis-value", r)?.value?.trim() ?? "",
      unit:    $(".zapis-unit",  r)?.value || "-",
      unknown: $(".zapis-unknown",r)?.checked || false
    }));
  }

  function ensureZapisHandlers() {
    const addBtn = $("#add-zapis-row-button");
    const checkBtn = $("#check-zapis-button");
    const cont = $("#zapis-container");
    const fb = $("#zapis-feedback-container");
    const review = $("#zapis-review-container");

    if (!cont) return;

    // bezpečné dvojité připojení – hlídáme příznak
    if (!addBtn?._v18_bound) {
      addBtn._v18_bound = true;
      on(addBtn,"click", () => {
        cont.appendChild(createRow());
      });
    }
    if (!checkBtn?._v18_bound) {
      checkBtn._v18_bound = true;
      on(checkBtn,"click", () => {
        // smaž staré feedbacky
        if (fb) fb.innerHTML = "";
        if (review) review.innerHTML = "";

        const ok = validateZapisShowIssues();
        if (ok) {
          renderZapisSummaryInto(review);
          // odhal výpočetní část
          ensureCalcBox();
          $("#main-calculation-step")?.classList.remove("hidden");
        }
      });
    }

    // pokud není žádný řádek, přidej jeden
    if ($$(".zapis-row", cont).length === 0) {
      cont.appendChild(createRow());
    }
  }

  function validateZapisShowIssues() {
    const fb = $("#zapis-feedback-container");
    const rows = collectRows();
    const prob = getProblem();
    const errors = [];

    if (!rows.some(r => r.unknown)) errors.push("Označ jednu veličinu jako hledanou (zaškrtni „Hledaná veličina“).");

    // Každá daná veličina ze zadání musí být zapsána korektně (s případným převodem)
    for (const g of (prob?.givens || [])) {
      const r = rows.find(x => x.symbol === g.symbol && !x.unknown && x.unit !== "-" && x.raw !== "");
      if (!r) { errors.push(`Chybí veličina ${g.symbol}.`); continue; }
      const val = parseNum(r.raw);
      const factor = unitToBaseFactor[r.unit] ?? NaN;
      if (!isFinite(val) || !isFinite(factor)) { errors.push(`U ${g.symbol} zadej číselnou hodnotu a jednotku.`); continue; }
      const inBase = val * factor;
      if (!almostEqual(inBase, g.value)) {
        errors.push(`${g.symbol}: očekává se ≈ ${g.value} ${g.unit}, máš ${val} ${r.unit} (≈ ${inBase} ${g.unit}).`);
      }
    }

    // vizuál + zprávy
    if (fb) {
      if (errors.length) {
        const box = document.createElement("div");
        box.className = "mt-2 p-3 rounded-lg bg-red-900/40 border border-red-600 text-red-100 text-sm";
        box.innerHTML = `<b>Chyby v zápisu:</b><ul class="list-disc pl-5 mt-1">${errors.map(e=>`<li>${e}</li>`).join("")}</ul>`;
        fb.appendChild(box);
      } else {
        const ok = document.createElement("div");
        ok.className = "mt-2 p-2 rounded bg-green-900/30 border border-green-700 text-green-200 text-sm";
        ok.textContent = "Zápis je v pořádku. Pokračujte na výpočet.";
        fb.appendChild(ok);
      }
    }
    return errors.length === 0;
  }

  function renderZapisSummaryInto(target) {
    if (!target) return;
    const rows = collectRows();
    const order = [];
    const by = {};
    rows.forEach(r => {
      if (!r.symbol || r.symbol === "-") return;
      if (!by[r.symbol]) { by[r.symbol] = []; order.push(r.symbol); }
      const part = r.unknown ? `? ${r.unit}` : `${r.raw} ${r.unit}`;
      if (!by[r.symbol].includes(part)) by[r.symbol].push(part);
    });
    const summary = order.map(sym => `${sym} = ${by[sym].join(" = ")}`).join("\n");

    target.innerHTML = `
      <div class="p-3 bg-gray-900 border border-gray-700 rounded">
        <div class="font-semibold mb-2 text-gray-300">Souhrn zápisu:</div>
        <pre class="text-gray-200 text-sm whitespace-pre-wrap">${summary}</pre>
      </div>`;
  }

  // ---------- VÝPOČET ----------

  function ensureCalcBox() {
    let box = $("#calc-box-v18");
    if (box) return box;

    const step = document.createElement("div");
    step.id = "main-calculation-step"; // kvůli kompatibilitě
    step.className = "mt-6";
    $("#vypocet-step")?.classList.add("hidden"); // starý blok skryjeme

    box = document.createElement("div");
    box.id = "calc-box-v18";
    box.className = "mt-4 bg-gray-900 border border-gray-700 rounded-xl p-4";

    box.innerHTML = `
      <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
        <span class="text-blue-300">3</span> Finální výpočet
      </h3>

      <div class="space-y-3">
        <!-- VZOREC -->
        <div class="grid grid-cols-[auto_24px_1fr] gap-2 items-center">
          <input id="calcL_formula" type="text" placeholder="např. W" class="p-2 rounded bg-gray-800 border border-gray-700 text-white w-24">
          <div class="text-center text-gray-400">=</div>
          <input id="calcR_formula" type="text" placeholder="např. F * s" class="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full">
        </div>
        <!-- DOSAZENÍ -->
        <div class="grid grid-cols-[auto_24px_1fr] gap-2 items-center">
          <input id="calcL_subs" type="text" placeholder="např. W" class="p-2 rounded bg-gray-800 border border-gray-700 text-white w-24">
          <div class="text-center text-gray-400">=</div>
          <input id="calcR_subs" type="text" placeholder="např. 1000 * 2" class="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full">
        </div>
        <!-- VÝSLEDEK -->
        <div class="grid grid-cols-[auto_24px_1fr_auto] gap-2 items-center">
          <input id="calcL_res" type="text" placeholder="např. W" class="p-2 rounded bg-gray-800 border border-gray-700 text-white w-24">
          <div class="text-center text-gray-400">=</div>
          <input id="calcR_res" type="text" placeholder="např. 2000" class="p-2 rounded bg-gray-800 border border-gray-700 text-white w-full">
          <select id="calc_unit" class="p-2 rounded bg-gray-800 border border-gray-700 text-white w-24">
            <option>J</option><option>kJ</option><option>MJ</option>
          </select>
        </div>
        <div class="flex justify-end">
          <button id="btnCheckCalc" class="btn btn-primary px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white">Ověřit výpočet</button>
        </div>
      </div>

      <!-- Výsledkový box -->
      <div id="calc-result-box" class="mt-4 hidden p-3 rounded border"></div>
    `;

    // vložit za sekci zápisu
    const anchor = $("#zapis-step") || $("#practice-screen") || document.body;
    anchor.parentElement.insertBefore(step, anchor.nextSibling);
    step.appendChild(box);

    // live validace
    const fL = $("#calcL_formula"), fR=$("#calcR_formula");
    const sL = $("#calcL_subs"),    sR=$("#calcR_subs");
    const rL = $("#calcL_res"),     rR=$("#calcR_res");
    const unit = $("#calc_unit");
    [fL,fR].forEach(el => on(el,"input", liveFormula));
    [sL,sR].forEach(el => on(el,"input", liveSubs));
    [rL,rR,unit].forEach(el => on(el,"input", liveResult));

    function liveFormula() {
      [fL,fR].forEach(markNEU);
      const L = (fL.value||"").trim(); const R = (fR.value||"").trim();
      if (!L && !R) return;
      const unknown = getUnknownFromZapis() || "W";
      let ok=false;
      const compact = `${L}=${R}`.replace(/\s+/g,"");
      if (unknown==="W") ok = /^W=(F[*·]s|s[*·]F)$/i.test(compact);
      else if (unknown==="F") ok = /^F=W\/s$/i.test(compact);
      else if (unknown==="s") ok = /^s=W\/F$/i.test(compact);
      (ok?markOK:markBAD)(fL); (ok?markOK:markBAD)(fR);
    }
    function liveSubs() {
      [sL,sR].forEach(markNEU);
      const L = (sL.value||"").trim(); const R = (sR.value||"").trim();
      if (!L && !R) return;
      const unknown = getUnknownFromZapis() || "W";
      const prob = getProblem(); const Fg = prob?.givens?.find(g=>g.symbol==="F"); const sg = prob?.givens?.find(g=>g.symbol==="s");
      let ok=false, orderNote="";
      if (unknown==="W" && Fg && sg) {
        const m = R.replace(/\s+/g,"").match(/^(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/);
        if (L.replace(/\s+/g,"")==="W" && m) {
          const a=parseNum(m[1]), b=parseNum(m[2]);
          ok = (almostEqual(a,Fg.value) && almostEqual(b,sg.value)) || (almostEqual(a,sg.value) && almostEqual(b,Fg.value));
          if (/^W\s*=\s*F\s*[*·]\s*s$/i.test(`${$("#calcL_formula").value}=${$("#calcR_formula").value}`.replace(/\s+/g,"")) &&
              !(almostEqual(a,Fg.value) && almostEqual(b,sg.value))) orderNote = "Pořadí v dosazení by mělo odpovídat vzorci (F pak s).";
        }
      }
      (ok?markOK:markBAD)(sL); (ok?markOK:markBAD)(sR);
      if (orderNote) hint(orderNote);
    }
    function liveResult() {
      [rL,rR].forEach(markNEU);
      const L=(rL.value||"").trim(); const R=(rR.value||"").trim();
      if (!L && !R) return;
      const unknown = getUnknownFromZapis() || "W";
      let ok=false;
      if (unknown==="W") {
        const num = parseNum(R); const f = unitToBaseFactor[unit.value] ?? 1;
        const J = num*f; const exp = getProblem()?.result;
        ok = isFinite(num) && isFinite(exp) && almostEqual(J,exp);
      } else {
        ok = !!R; // mimo rozsah – formálně OK
      }
      (ok?markOK:markBAD)(rL); (ok?markOK:markBAD)(rR);
    }

    // ověřit výpočet
    on($("#btnCheckCalc"), "click", () => {
      const box = $("#calc-result-box");
      const msgs = [];
      // znovu zhodnotit
      const prevState = [$$("#calcL_formula,#calcR_formula,#calcL_subs,#calcR_subs,#calcL_res,#calcR_res")];
      liveFormula(); liveSubs(); liveResult();

      // formula
      if (!($("#calcL_formula").classList.contains("ring-green-500"))) msgs.push("Upravte vzorec (dbej na velikost písmen a tvary: W = F * s, F = W / s, s = W / F).");
      // substitution
      if (!($("#calcL_subs").classList.contains("ring-green-500"))) msgs.push("Zkontrolujte dosazení (čísla musí odpovídat zadání; pořadí má navazovat na vzorec).");
      // result
      if (!($("#calcL_res").classList.contains("ring-green-500"))) msgs.push("Výsledek neodpovídá. Zadejte správné číslo a zvolte jednotky.");

      if (!box) return;
      box.className = "mt-4 p-3 rounded border " + (msgs.length? "bg-red-900/40 border-red-600 text-red-100":"bg-green-900/30 border-green-700 text-green-100");
      box.innerHTML = msgs.length
        ? `<b>Ještě upravit:</b><ul class="list-disc pl-5 mt-1">${msgs.map(m=>`<li>${m}</li>`).join("")}</ul>`
        : `✅ Skvělé! Výpočet je v pořádku.`;
      box.classList.remove("hidden");
    });

    console.log("v18: calc box created");
    return box;
  }

  function getUnknownFromZapis() {
    const r = $$(".zapis-row").find(x => $(".zapis-unknown", x)?.checked);
    const sym = r && $(".zapis-symbol", r)?.value;
    return (sym && sym !== "-") ? sym : "W";
  }

  function hint(msg){
    const out = $("#vypocet-feedback-container") || $("#calc-result-box") || $("#practice-screen");
    if (!out) return;
    const d = document.createElement("div");
    d.className = "text-blue-300 text-sm mt-1";
    d.textContent = msg;
    out.appendChild(d);
    setTimeout(()=>d.remove(), 5000);
  }

  // ---------- BOOT ----------
  function init() {
    // naváže obsluhy na zápis
    ensureZapisHandlers();

    // Nový příklad = reset výpočtu
    on($("#new-problem-button"), "click", () => {
      $("#calc-box-v18")?.remove();
      $("#main-calculation-step")?.remove();
      // vyčistit feedback
      const fb = $("#zapis-feedback-container"); if (fb) fb.innerHTML = "";
      const rv = $("#zapis-review-container");   if (rv) rv.innerHTML = "";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  console.log("v18: prepared.");
})();
