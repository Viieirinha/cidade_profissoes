// Sons suaves gerados no próprio aparelho (Web Audio, sem arquivos). Desligados por padrão.
import { getEstado } from './storage.js';

let ctx = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => { /* sem gesto do usuário: segue em silêncio */ });
  return ctx;
}

// Uma notinha curta com entrada e saída suaves (volume baixinho).
function nota(freq, inicio, dur, { tipo = 'sine', vol = 0.05, ate = null } = {}) {
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime + inicio;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, t0);
  if (ate) osc.frequency.exponentialRampToValueAtTime(ate, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

const SONS = {
  salvar: () => { nota(660, 0, 0.12); nota(880, 0.09, 0.2); },
  sino: () => { nota(988, 0, 0.5, { tipo: 'triangle' }); nota(1319, 0.2, 0.6, { tipo: 'triangle' }); },
  selo: () => [523, 659, 784, 1047].forEach((f, i) => nota(f, i * 0.1, 0.25, { tipo: 'triangle', vol: 0.055 })),
  carimbo: () => nota(150, 0, 0.18, { tipo: 'sine', vol: 0.12, ate: 55 }),
  sorteio: () => [0, 1, 2, 3, 4].forEach((i) => nota(500 + Math.random() * 500, i * 0.07, 0.06, { tipo: 'triangle', vol: 0.03 })),
};

export const NOMES_SONS = Object.keys(SONS);

// `forcar` toca mesmo com os sons desligados (usado no botão "Testar sons").
export function tocar(nome, forcar = false) {
  if (!forcar && !getEstado().config.sons) return;
  try { if (SONS[nome]) SONS[nome](); } catch (e) { /* som nunca pode quebrar o app */ }
}
