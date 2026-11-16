// Selos de incentivo (sem ranking, sem pressão): calculados a partir dos registros.
import { getEstado, salvar } from './storage.js';
import { listar } from './entidades.js';
import { PROFISSOES } from '../professions/index.js';
import { toast } from './ui.js';

const FRASES = [
  'Que trabalho lindo! ✨', 'Você está arrasando! 🌟', 'Mais um caso resolvido com carinho! 💖',
  'Que capricho! 👏', 'Muito bem! Continue brincando! 🎈', 'Seu escritório está cada vez melhor! 🏙️',
];
export const incentivo = () => FRASES[Math.floor(Math.random() * FRASES.length)];

function atendimentos(p) {
  const tipo = p.entidades[1] && p.entidades[1].id;
  return tipo ? listar(p.id, tipo).length : 0;
}

export function totalAtendimentos() {
  return PROFISSOES.reduce((s, p) => s + atendimentos(p), 0);
}

export function todosSelos() {
  const e = getEstado();
  const lista = [];
  for (const p of PROFISSOES) {
    const raiz = p.entidades[0];
    const at = atendimentos(p);
    const docs = e.contadores.documentos[p.id] || 0;
    const t = p.selos || {};
    lista.push(
      { id: `${p.id}-cadastro`, emoji: p.emoji, titulo: t.cadastro || `Primeiro cadastro em ${p.nome}!`, ok: listar(p.id, raiz.id).length >= 1 },
      { id: `${p.id}-atendimento`, emoji: '🌟', titulo: t.atendimento || `Primeiro atendimento em ${p.nome}!`, ok: at >= 1 },
      { id: `${p.id}-cinco`, emoji: '🏅', titulo: `5 atendimentos em ${p.nome}!`, ok: at >= 5 },
      { id: `${p.id}-documento`, emoji: '🖨️', titulo: `Primeiro documento impresso (${p.nome})!`, ok: docs >= 1 },
    );
  }
  const exploradas = PROFISSOES.filter((p) => listar(p.id, p.entidades[0].id).length > 0).length;
  const total = totalAtendimentos();
  lista.push(
    { id: 'g-10', emoji: '🎉', titulo: '10 atendimentos na cidade!', ok: total >= 10 },
    { id: 'g-3prof', emoji: '🏙️', titulo: 'Cidade movimentada: 3 profissões!', ok: exploradas >= 3 },
    { id: 'g-6prof', emoji: '🌈', titulo: 'Super cidade: 6 profissões!', ok: exploradas >= 6 },
  );
  return lista;
}

// Concede selos novos e avisa. Chamar depois de salvar/imprimir.
export function verificarSelos() {
  const e = getEstado();
  const novos = todosSelos().filter((s) => s.ok && !e.selos[s.id]);
  if (!novos.length) return [];
  novos.forEach((s) => { e.selos[s.id] = new Date().toISOString(); });
  salvar();
  novos.forEach((s, i) => setTimeout(() => toast(`${s.emoji} Selo novo: ${s.titulo}`, 5000), i * 600));
  return novos;
}
