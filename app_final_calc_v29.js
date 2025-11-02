// app_final_calc_v29.js
// v29 – generátor příkladů pro téma PRÁCE (W = F * s)
// - Konteksty T1–T6 (těleso, zedník+kladka, auto, jeřáb, výtah, sportovec)
// - Náhodně se dopočítává W / F / s
// - easy: bez převodů, pěkná čísla; normal: převody (kN, km, kJ), vše v základních jednotkách omezeno na max 100000
// - Výstup kompatibilní s existující aplikací: { text, givens, result, askFor }

(function () {
  console.log("🧩 Načítání app_final_calc_v29.js ...");

  const factor = {
    N: 1,
    kN: 1000,
    m: 1,
    km: 1000,
    J: 1,
    kJ: 1000
  };

  // Bezpečný náhodný integer / float
  const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const randFloat = (a, b, dec = 0) => {
    const x = Math.random() * (b - a) + a;
    return dec > 0 ? Number(x.toFixed(dec)) : Math.round(x);
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Kontextové šablony – pro každou hledanou veličinu varianta textu
  const contexts = [
    {
      id: "teleso",
      textW: "Těleso bylo přesunuto silou {F}{Fu} po dráze {s}{su}. Jaká práce byla vykonána?",
      textF: "Těleso bylo přesunuto po dráze {s}{su}. Byla vykonána práce {W}{Wu}. Jaká síla působila?",
      textS: "Těleso bylo taženo silou {F}{Fu}. Byla vykonána práce {W}{Wu}. Jakou dráhu urazilo?"
    },
    {
      id: "zednik",
      textW: "Zedník zvedl těleso pomocí pevné kladky silou {F}{Fu} do výšky {s}{su}. Jaká práce byla vykonána?",
      textF: "Zedník zvedl těleso do výšky {s}{su} a vykonal práci {W}{Wu}. Jakou silou působil?",
      textS: "Při zvedání tělesa působil zedník silou {F}{Fu} a vykonal práci {W}{Wu}. Jakou výšku těleso získalo?"
    },
    {
      id: "auto",
      textW: "Auto jelo rovnoměrným přímočarým pohybem po dráze {s}{su}. Tahová síla motoru byla {F}{Fu}. Jaká práce byla vykonána?",
      textF: "Auto vykonalo práci {W}{Wu} při jízdě po dráze {s}{su}. Jaká byla tahová síla motoru?",
      textS: "Auto táhlo přívěs silou {F}{Fu} a vykonalo práci {W}{Wu}. Jakou dráhu ujelo?"
    },
    {
      id: "jerab",
      textW: "Jeřáb zvedal těleso do výšky {s}{su} silou {F}{Fu}. Jaká práce byla vykonána?",
      textF: "Jeřáb zvedl těleso do výšky {s}{su}. Byla vykonána práce {W}{Wu}. Jakou silou působil jeřáb?",
      textS: "Jeřáb působil silou {F}{Fu} a vykonal práci {W}{Wu}. Jakou výšku těleso získalo?"
    },
    {
      id: "vytah",
      textW: "Výtah zvedl náklad do výšky {s}{su} silou {F}{Fu}. Jaká práce byla vykonána?",
      textF: "Výtah vykonal práci {W}{Wu} při zvednutí nákladu do výšky {s}{su}. Jaká síla působila?",
      textS: "Výtah působil silou {F}{Fu} a vykonal práci {W}{Wu}. Jakou výšku získal náklad?"
    },
    {
      id: "sport",
      textW: "Silák působil na činku silou {F}{Fu} a zvedl ji o {s}{su}. Jaká práce byla vykonána?",
      textF: "Při zvednutí činky o {s}{su} byla vykonána práce {W}{Wu}. Jakou silou silák působil?",
      textS: "Silák působil na činku silou {F}{Fu} a vykonal práci {W}{Wu}. O jakou dráhu činku zvedl?"
    }
  ];

  // Formátování čísel (hezké bez zbytečných nul)
  const fmt = (x) => {
    if (Math.abs(x) >= 1000) return Math.round(x).toString();
    const s = x.toFixed(2);
    return s.replace(/\.00$/, "").replace(/,00$/, "");
  };

  // Zobrazení v textu: rozhodne jednotku a hodnotu pro text (givens zůstávají v základu!)
  function displayFor(level, kind, baseValue) {
    if (level === "easy") {
      // vždy základ
      if (kind === "F") return { val: baseValue, unit: " N" };
      if (kind === "s") return { val: baseValue, unit: " m" };
      if (kind === "W") return { val: baseValue, unit: " J" };
    } else {
      // normal: část příkladů se zobrazí v násobcích
      if (kind === "F") {
        const usekN = Math.random() < 0.5 && baseValue % 1000 === 0;
        return usekN
          ? { val: baseValue / 1000, unit: " kN" }
          : { val: baseValue, unit: " N" };
      }
      if (kind === "s") {
        const useKm = Math.random() < 0.35 && baseValue % 1000 === 0 && baseValue >= 1000;
        return useKm
          ? { val: baseValue / 1000, unit: " km" }
          : { val: baseValue, unit: " m" };
      }
      if (kind === "W") {
        const usekJ = Math.random() < 0.45 && baseValue >= 1000 && baseValue % 1000 === 0;
        return usekJ
          ? { val: baseValue / 1000, unit: " kJ" }
          : { val: baseValue, unit: " J" };
      }
    }
    // fallback
    return { val: baseValue, unit: kind === "F" ? " N" : kind === "s" ? " m" : " J" };
  }

  // Vytváření hodnot v base tak, aby žádná nebyla > 100000 (pro normal), easy jsou menší a hezká čísla
  function generateTriple(level, askFor) {
    // vrací { F, s, W } v základních jednotkách (N, m, J)
    // normal: vše <= 100000
    // easy: přívětivé hodnoty

    let F, s, W;

    if (level === "easy") {
      // jednoduchá – celé hezké násobky
      // volíme tak, aby W nebylo extrémní
      F = randInt(200, 1200);         // N
      s = randInt(1, 6);              // m
      W = F * s;                      // J
      return { F, s, W };
    }

    // NORMAL – budeme generovat tak, aby každá veličina v základu nepřekročila 100000
    // Zvolíme postup podle toho, co se má počítat, abychom drželi limity hezky pod kontrolou.
    const MAX = 100000;

    // Bezpečné opakování
    for (let k = 0; k < 200; k++) {
      if (askFor === "W") {
        // Vybereme F a s (v základu) a spočítáme W
        F = randInt(500, 50000);  // N
        s = randInt(1, 200);      // m
        W = F * s;
        if (W <= MAX && F <= MAX && s <= MAX) return { F, s, W };
      } else if (askFor === "F") {
        // Vybereme W a s, dopočítáme F
        W = randInt(2000, MAX);   // J
        s = randInt(1, 500);      // m
        F = Math.round(W / s);
        if (F >= 1 && F <= MAX && s <= MAX && W <= MAX) return { F, s, W };
      } else if (askFor === "s") {
        // Vybereme W a F, dopočítáme s
        W = randInt(2000, MAX);   // J
        F = randInt(200, 50000);  // N
        s = Math.round(W / F);
        if (s >= 1 && s <= MAX && F <= MAX && W <= MAX) return { F, s, W };
      }
    }

    // Fallback – kdyby se po 200 pokusech nepovedlo, vrať něco rozumného pod limity
    F = 3000; s = 10; W = F * s;
    return { F, s, W };
  }

  // Poskládá finální text a "givens" podle hledané veličiny
  function buildProblem(level, ctx, askFor, Fbase, sbase, Wbase) {
    // Display values (pro text) – mohou být v kN/km/kJ dle úrovně
    const Fd = displayFor(level, "F", Fbase);
    const sd = displayFor(level, "s", sbase);
    const Wd = displayFor(level, "W", Wbase);

    const repl = (tmpl) => tmpl
      .replace("{F}", fmt(Fd.val))  .replace("{Fu}", Fd.unit)
      .replace("{s}", fmt(sd.val))  .replace("{su}", sd.unit)
      .replace("{W}", fmt(Wd.val))  .replace("{Wu}", Wd.unit);

    let text;
    if (askFor === "W") text = repl(ctx.textW);
    else if (askFor === "F") text = repl(ctx.textF);
    else text = repl(ctx.textS);

    // Givens: v základních jednotkách!
    // App očekává v currentProblem.givens jen známé veličiny v base, a currentProblem.result = W (v J).
    let givens = [];
    if (askFor === "W") {
      givens.push({ symbol: "F", value: Fbase, unit: "N" });
      givens.push({ symbol: "s", value: sbase, unit: "m" });
    } else if (askFor === "F") {
      givens.push({ symbol: "W", value: Wbase, unit: "J" });
      givens.push({ symbol: "s", value: sbase, unit: "m" });
    } else if (askFor === "s") {
      givens.push({ symbol: "W", value: Wbase, unit: "J" });
      givens.push({ symbol: "F", value: Fbase, unit: "N" });
    }

    // Výsledek: držíme kompatibilitu se stávajícím ověřováním → vždy ukládáme W v joulech
    const result = Wbase;

    return { text, givens, result, askFor };
  }

  // Hlavní veřejná funkce
  function generate(level = "easy") {
    // 1) kontext
    const ctx = pick(contexts);
    // 2) co se počítá
    const askFor = pick(["W", "F", "s"]);
    // 3) trojice hodnot v base
    const { F, s, W } = generateTriple(level, askFor);
    // 4) postavit úlohu
    const problem = buildProblem(level, ctx, askFor, F, s, W);

    console.log("v29 ▶︎", { level, askFor, context: ctx.id, base: { F, s, W }, text: problem.text });
    return problem;
  }

  // Export do window
  window.workGenV29 = { generate };

  console.log("✅ app_final_calc_v29.js připraven (workGenV29.generate(level)).");
})();
