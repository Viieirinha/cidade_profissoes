// CRUD genérico de registros: { id, prof, tipo, pai?, criadoEm, atualizadoEm, dados }
import { getEstado, salvar } from './storage.js';

const agora = () => new Date().toISOString();
const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function listar(prof, tipo, pai) {
  return getEstado().registros.filter(
    (r) => r.prof === prof && r.tipo === tipo && (pai === undefined || r.pai === pai)
  );
}

export function obter(id) {
  return getEstado().registros.find((r) => r.id === id) || null;
}

export function maisRecentes(a, b) {
  return (b.atualizadoEm || '').localeCompare(a.atualizadoEm || '');
}

export function criar(prof, tipo, dados, pai) {
  const reg = { id: novoId(), prof, tipo, criadoEm: agora(), atualizadoEm: agora(), dados };
  if (pai) reg.pai = pai;
  getEstado().registros.push(reg);
  salvar();
  return reg;
}

export function atualizar(id, dados) {
  const reg = obter(id);
  if (!reg) return null;
  reg.dados = dados;
  reg.atualizadoEm = agora();
  salvar();
  return reg;
}

// Apaga o registro e tudo que depende dele (filhos).
export function apagar(id) {
  const e = getEstado();
  const ids = new Set([id]);
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const r of e.registros) {
      if (r.pai && ids.has(r.pai) && !ids.has(r.id)) { ids.add(r.id); mudou = true; }
    }
  }
  e.registros = e.registros.filter((r) => !ids.has(r.id));
  e.recentes = e.recentes.filter((x) => !ids.has(x.id));
  salvar();
}

export function contar(prof, tipo) {
  return listar(prof, tipo).length;
}

export function registrarRecente(prof, id, doc) {
  const e = getEstado();
  e.recentes = e.recentes.filter((x) => !(x.id === id && x.doc === doc));
  e.recentes.unshift({ prof, id, doc, em: agora() });
  e.recentes = e.recentes.slice(0, 12);
  salvar();
}

export function contarDocumento(prof) {
  const c = getEstado().contadores.documentos;
  c[prof] = (c[prof] || 0) + 1;
  salvar();
}
