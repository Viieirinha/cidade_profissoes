// Cria registros a partir de um "molde" (exemplo ou caso sorteado) e sorteia casos.
import { criar } from './entidades.js';
import { valorPadrao } from './formulario.js';
import { entidadeDe } from './modelo.js';

// molde = { tipo, dados, filhos?: [molde] }. Campos vazios recebem o valor padrão (ex.: data de hoje).
export function semear(prof, molde, pai) {
  const en = entidadeDe(prof, molde.tipo);
  const dados = { ...molde.dados };
  en.campos.forEach((c) => {
    if (c.tipo !== 'secao' && (dados[c.nome] === undefined || dados[c.nome] === '')) {
      const p = valorPadrao(c);
      if (p !== '') dados[c.nome] = p;
    }
  });
  const reg = criar(prof.id, molde.tipo, dados, pai);
  (molde.filhos || []).forEach((f) => semear(prof, f, reg.id));
  return reg;
}

const ultimo = {};

// Sorteia um caso diferente do anterior.
export function sortear(prof) {
  const lista = prof.sorteios || [];
  if (!lista.length) return null;
  let i;
  do { i = Math.floor(Math.random() * lista.length); } while (lista.length > 1 && i === ultimo[prof.id]);
  ultimo[prof.id] = i;
  return lista[i];
}
