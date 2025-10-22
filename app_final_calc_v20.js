/* ============================================================
   app_final_calc_v20.js
   ------------------------------------------------------------
   - Forward tlačítek (Vzorec, Nápověda, Obrázek, Kalkulačka)
   - Lazy init po zobrazení #practice-screen
   - Zachována logika z v19 (výpočty, validace, feedback)
   ============================================================ */

console.log("🧩 Načítání app_final_calc_v20.js ...");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM načten, inicializace v20...");

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  let practiceReady = false;

  // Čekání na aktivaci practice-screen
  const waitForPractice = setInterval(() => {
    const practice = $("#practice-screen");
    if (practice && !practice.classList.contains("hidden")) {
      clearInterval(waitForPractice);
      practiceReady = true;
      console.log("✅ v20: Practice screen aktivní – připravuji tlačítka...");
      attachButtonForwarders();
    }
  }, 500);

  function attachButtonForwarders() {
    const forwardMap = {
      "calc": "#open-calculator-button",
      "help": "#open-help-button",
      "formula": "#open-formula-button",
      "diagram": "#open-diagram-button"
    };

    const calcStep = $("#vypocet-step");
    if (!calcStep) {
      console.warn("⚠️ Nenalezen #vypocet-step – připojení tlačítek odloženo.");
      return;
    }

    let localTools = $("#local-tools");
    if (!localTools) {
      localTools = document.createElement("div");
      localTools.id = "local-tools";
      localTools.className = "flex justify-end flex-wrap gap-2 mb-3";
      localTools.innerHTML = `
        <button data-action="diagram" class="btn btn-secondary text-sm py-1 px-3">🖼 Obrázek</button>
        <button data-action="formula" class="btn btn-secondary text-sm py-1 px-3">📐 Vzorec</button>
        <button data-action="help" class="btn btn-secondary text-sm py-1 px-3">💡 Nápověda</button>
        <button data-action="calc" class="btn btn-secondary text-sm py-1 px-3">🧮 Kalkulačka</button>`;
      calcStep.prepend(localTools);
    }

    localTools.querySelectorAll("button[data-action]").forEach(btn => {
      on(btn, "click", () => {
        const act = btn.dataset.action;
        const targetSel = forwardMap[act];
        const targetBtn = $(targetSel);
        if (targetBtn) {
          console.log(`🔁 forward: clicked ${targetSel}`);
          targetBtn.click();
        } else {
          console.warn(`⚠️ forward: selektor ${targetSel} nenalezen.`);
        }
      });
    });

    console.log("✅ v20: Forward tlačítka připravena.");
  }

  console.log("✅ v20 připraveno (čeká na validní zápis & klik na 'Zkontrolovat zápis').");
});
