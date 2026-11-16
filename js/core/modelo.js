// Ponte entre registros e configuração das profissões (títulos, contexto de documentos).
import { obter, listar } from './entidades.js';
import { porId } from '../professions/index.js';
import { esc, par, fmtData, fmtMoeda } from './ui.js';

export function entidadeDe(prof, tipo) {
  return prof.entidades.find((e) => e.id === tipo);
}

export function nomeDe(id) {
  const r = obter(id);
  if (!r) return '(apagado)';
  const p = porId(r.prof);
  return p ? tituloReg(p, r) : '(?)';
}

export function tituloReg(prof, reg) {
  const en = entidadeDe(prof, reg.tipo);
  if (!en) return '(?)';
  const t = en.titulo;
  const s = typeof t === 'function' ? t(reg.dados, nomeDe) : reg.dados[t];
  return s || en.nome;
}

export function subtituloReg(prof, reg) {
  const en = entidadeDe(prof, reg.tipo);
  return en && en.subtitulo ? en.subtitulo(reg.dados, nomeDe) || '' : '';
}

const porData = (a, b) => String(a.dados.data || a.criadoEm).localeCompare(String(b.dados.data || b.criadoEm));

// Contexto entregue aos modelos de documento. Os modelos devem usar ctx.e() / ctx.par()
// (ou os helpers abaixo) para qualquer texto digitado.
export function criarCtx(prof, reg) {
  const pai = reg.pai ? obter(reg.pai) : null;
  const vazio = (v) => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
  return {
    prof, reg, d: reg.dados, pai, dp: pai ? pai.dados : {},
    e: esc, par, data: fmtData, moeda: fmtMoeda, nome: nomeDe,
    filhos: (tipo, paiId = reg.id) => listar(prof.id, tipo, paiId).sort(porData),
    campo: (rotulo, v) => vazio(v) ? '' :
      `<p class="doc-campo"><strong>${esc(rotulo)}:</strong> ${Array.isArray(v) ? esc(v.join(', ')) : par(v)}</p>`,
    ul: (arr) => arr && arr.length ? `<ul class="doc-lista">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '',
    bloco: (titulo, texto) => vazio(texto) ? '' :
      `<section class="doc-bloco"><h4>${esc(titulo)}</h4><p>${par(texto)}</p></section>`,
  };
}
