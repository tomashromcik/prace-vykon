// --- Navigační menu ---
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

menuToggle.addEventListener('click', () => {
  mobileMenu.classList.toggle('active');
});

// Reakce na kliknutí v menu
document.querySelectorAll('.menu-link').forEach(btn => {
  btn.addEventListener('click', e => {
    const action = e.target.dataset.action;
    mobileMenu.classList.remove('active'); // zavři po výběru
    switch (action) {
      case 'back': return goToSetupScreen();
      case 'new': return generateNewProblem();
      case 'help': return showHint();
      case 'formula': return openFormulaModal();
      case 'calc': return openCalculatorModal();
    }
  });
});
