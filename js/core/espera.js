// Sala de espera: clientes de faz de conta que "chegam sozinhos" pedindo atendimento.
// Cada cliente vem de um caso de `prof.sorteios` (guardamos só o índice e um emoji).
import { getEstado, salvar } from './storage.js';
import { porId } from '../professions/index.js';
import { entidadeDe } from './modelo.js';

export const MAX_ESPERA = 3;
const EMOJIS = ['🐱', '🐶', '🐰', '🐻', '🐼', '🦊', '🦄', '🐢', '🧸', '👵', '🧒', '🐸'];
const sorteie = (n) => Math.floor(Math.random() * n);

// Clientes esperando em uma profissão (ignora índices que não existem mais).
export function fila(profId) {
  const p = porId(profId);
  const n = p && p.sorteios ? p.sorteios.length : 0;
  return getEstado().espera.filter((x) => x.prof === profId && x.i >= 0 && x.i < n);
}

export function chegar(prof) {
  const casos = prof.sorteios || [];
  const atual = fila(prof.id);
  if (!casos.length || atual.length >= MAX_ESPERA) return null;
  const usados = new Set(atual.map((x) => x.i));
  const livres = casos.map((_, i) => i).filter((i) => !usados.has(i));
  if (!livres.length) return null;
  const cliente = { prof: prof.id, i: livres[sorteie(livres.length)], emoji: EMOJIS[sorteie(EMOJIS.length)], em: new Date().toISOString() };
  getEstado().espera.push(cliente);
  salvar();
  return cliente;
}

export function remover(cliente) {
  const e = getEstado();
  e.espera = e.espera.filter((x) => x !== cliente);
  salvar();
}

export const casoDe = (prof, cliente) => prof.sorteios[cliente.i];

// Nome para mostrar: o título do cadastro principal do caso (ex.: "Ursinho Teddy").
export function nomeDoCliente(prof, caso) {
  const t = entidadeDe(prof, caso.tipo).titulo;
  return (typeof t === 'string' && caso.dados[t]) || 'Alguém';
}
