
/*
  app_final_calc_v14.js
  ------------------------------------------------------------
  Samostatný výpočetní modul s tmavě-šedým vzhledem, modálními
  okny (Nápověda, Kalkulačka, Vzorec, Diagram) a ikonami vpravo
  nahoře s fade animací.
  ------------------------------------------------------------
*/

console.log("🧩 Načítání app_final_calc_v14.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ app_final_calc_v14.js inicializován.");

  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  function createModal(id, title, content) {
    const modal = document.createElement("div");
    modal.id = id;
    modal.className = "hidden fixed inset-0 bg-black/70 flex items-center justify-center z-50 opacity-0 transition-opacity duration-300";
    modal.innerHTML = `
      <div class='bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 text-gray-100 relative fade'>
        <button class='absolute top-3 right-4 text-2xl text-gray-400 hover:text-blue-300'>&times;</button>
        <h2 class='text-xl font-semibold mb-3 text-blue-300'>${title}</h2>
        <div class='text-sm leading-relaxed'>${content}</div>
      </div>
    `;
    document.body.appendChild(modal);
    const closeBtn = modal.querySelector("button");
    on(closeBtn, "click", () => hideModal(modal));
    on(modal, "click", (e) => { if (e.target === modal) hideModal(modal); });
    return modal;
  }

  function showModal(m) {
    m.classList.remove("hidden");
    requestAnimationFrame(() => m.classList.add("opacity-100"));
  }
  function hideModal(m) {
    m.classList.remove("opacity-100");
    setTimeout(() => m.classList.add("hidden"), 300);
  }

  function createCalcBox() {
    const container = document.getElementById("practice-screen") || document.body;
    const box = document.createElement("div");
    box.className = "relative mt-6 bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-lg max-w-2xl mx-auto text-gray-200";

    box.innerHTML = `
      <h3 class='text-lg font-semibold text-blue-300 mb-3'>Výpočetní část</h3>
      <div class='absolute top-3 right-3 flex gap-2'>
        <button id='btn-help' title='Nápověda' class='p-2 hover:bg-gray-800 rounded-full'>💡</button>
        <button id='btn-formula' title='Vzorec' class='p-2 hover:bg-gray-800 rounded-full'>📐</button>
        <button id='btn-diagram' title='Diagram' class='p-2 hover:bg-gray-800 rounded-full'>📊</button>
        <button id='btn-calc' title='Kalkulačka' class='p-2 hover:bg-gray-800 rounded-full'>🔢</button>
      </div>
      <div class='space-y-3'>
        <div class='flex items-center gap-3'>
          <input id='lhs1' class='bg-gray-800 border border-gray-700 rounded-lg p-2 w-24 text-center text-gray-100' placeholder='např. W'>
          <span class='text-xl text-gray-300'>=</span>
          <input id='rhs1' class='flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-100' placeholder='např. F * s'>
        </div>
        <div class='flex items-center gap-3'>
          <input id='lhs2' class='bg-gray-800 border border-gray-700 rounded-lg p-2 w-24 text-center text-gray-100' placeholder='např. W'>
          <span class='text-xl text-gray-300'>=</span>
          <input id='rhs2' class='flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-100' placeholder='např. 1000 * 2'>
        </div>
        <div class='flex items-center gap-3'>
          <input id='lhs3' class='bg-gray-800 border border-gray-700 rounded-lg p-2 w-24 text-center text-gray-100' placeholder='např. W'>
          <span class='text-xl text-gray-300'>=</span>
          <input id='rhs3' class='flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-100' placeholder='např. 2000'>
          <select id='unit' class='bg-gray-800 border border-gray-700 rounded-lg p-2 text-gray-100'>
            <option>J</option>
            <option>kJ</option>
            <option>MJ</option>
          </select>
        </div>
      </div>
      <div class='mt-5 flex justify-end'>
        <button id='btn-check' class='bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg text-white font-semibold'>Ověřit výpočet</button>
      </div>
    `;
    container.appendChild(box);

    // Modály
    const modalHelp = createModal("m-help", "Nápověda", "Zapiš vzorec, dosazení a výsledek. Používej správné jednotky.");
    const modalFormula = createModal("m-formula", "Vzorec", "<b>W = F · s</b> – práce je součin síly a dráhy.");
    const modalDiagram = createModal("m-diagram", "Diagram", "<svg width='240' height='120'><rect x='20' y='80' width='200' height='10' fill='gray'/><line x1='40' y1='60' x2='180' y2='60' stroke='orange' stroke-width='3' marker-end='url(#arrow)'/></svg>");
    const modalCalc = createModal("m-calc", "Kalkulačka", "<input id='calc-display' class='w-full bg-gray-900 text-white p-2 mb-3 rounded'><div id='calc-buttons' class='grid grid-cols-4 gap-2'></div>");

    const buttons = "789/456*123-0.=+".split("");
    const btns = modalCalc.querySelector("#calc-buttons");
    buttons.forEach(ch => {
      const b = document.createElement("button");
      b.textContent = ch;
      b.className = "bg-gray-700 hover:bg-gray-600 text-white rounded p-2";
      btns.appendChild(b);
    });

    const disp = modalCalc.querySelector("#calc-display");
    on(btns, "click", e => {
      if (!e.target.textContent) return;
      const c = e.target.textContent;
      if (c === "=") { try { disp.value = eval(disp.value); } catch { disp.value = "Chyba"; } }
      else disp.value += c;
    });

    on($("#btn-help", box), "click", () => showModal(modalHelp));
    on($("#btn-formula", box), "click", () => showModal(modalFormula));
    on($("#btn-diagram", box), "click", () => showModal(modalDiagram));
    on($("#btn-calc", box), "click", () => showModal(modalCalc));

    on($("#btn-check", box), "click", () => alert("✅ Výpočet zkontrolován (demo)."));

    console.log("✅ Výpočetní box v14 vytvořen.");
  }

  createCalcBox();
});
