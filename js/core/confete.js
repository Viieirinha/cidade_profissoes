// Chuva de confete curtinha (some sozinha; não roda se a pessoa pediu menos movimento).
const CORES = ['#c2185b', '#7b1fa2', '#1565c0', '#2e7d32', '#f9a825', '#ef6c00'];
const FORMAS = ['⭐', '🎉', '✨', '💖', '🌈', '🎈'];

export function confete(qtd = 36) {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  } catch (e) { /* segue */ }
  const area = document.createElement('div');
  area.className = 'confete';
  area.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < qtd; i++) {
    const p = document.createElement('span');
    const emoji = i % 3 === 0;
    p.textContent = emoji ? FORMAS[i % FORMAS.length] : '';
    if (!emoji) p.style.background = CORES[i % CORES.length];
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDelay = Math.random() * 0.6 + 's';
    p.style.animationDuration = 1.8 + Math.random() * 1.4 + 's';
    p.style.setProperty('--giro', Math.round(Math.random() * 720 - 360) + 'deg');
    area.appendChild(p);
  }
  document.body.appendChild(area);
  setTimeout(() => area.remove(), 3800);
}
