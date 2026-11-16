// Armazenamento local com versão de esquema e migrações.
// Tudo fica em UMA chave do localStorage (um objeto JSON).

const CHAVE = 'cidade-das-profissoes';
export const VERSAO = 1;
export const TEMAS = ['claro', 'escuro'];
export const CORES = ['rosa', 'lilas', 'azul', 'verde', 'laranja'];

let estado = null;
let avisouErro = false;
const ouvintesErro = [];

export function estadoInicial() {
  return {
    schema: VERSAO,
    config: { jogadora: '', escritorio: 'Cidade das Profissões', tema: 'claro', cor: 'rosa', avisoVisto: false },
    selos: {},
    contadores: { documentos: {} },
    registros: [],
    recentes: [],
  };
}

// Migrações: chave = versão de origem; função devolve o estado já na versão seguinte.
// Exemplo futuro:  1: (e) => { e.schema = 2; /* ...ajustes... */ return e; }
const migracoes = {};

function texto(v, max, padrao) {
  return typeof v === 'string' ? v.slice(0, max) : padrao;
}

// Garante que o estado tenha todas as chaves esperadas e valores válidos.
function completar(e) {
  const base = estadoInicial();
  const c = (e && e.config) || {};
  return {
    schema: VERSAO,
    config: {
      jogadora: texto(c.jogadora, 40, base.config.jogadora),
      escritorio: texto(c.escritorio, 60, base.config.escritorio) || base.config.escritorio,
      tema: TEMAS.includes(c.tema) ? c.tema : base.config.tema,
      cor: CORES.includes(c.cor) ? c.cor : base.config.cor,
      avisoVisto: c.avisoVisto === true,
    },
    selos: e && e.selos && typeof e.selos === 'object' ? e.selos : {},
    contadores: {
      documentos: (e && e.contadores && e.contadores.documentos) || {},
    },
    registros: Array.isArray(e && e.registros) ? e.registros : [],
    recentes: Array.isArray(e && e.recentes) ? e.recentes : [],
  };
}

export function migrar(e) {
  if (typeof e.schema !== 'number') e.schema = 1;
  while (e.schema < VERSAO) {
    const passo = migracoes[e.schema];
    if (!passo) break;
    e = passo(e);
  }
  return completar(e);
}

export function aoErro(fn) {
  ouvintesErro.push(fn);
}

function avisar(mensagem) {
  if (avisouErro) return;
  avisouErro = true;
  ouvintesErro.forEach((fn) => fn(mensagem));
}

export function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) {
      try {
        estado = migrar(JSON.parse(bruto));
      } catch (err) {
        // Dados corrompidos: guarda uma cópia e começa do zero, sem perder nada.
        try { localStorage.setItem(CHAVE + '-corrompido', bruto); } catch (e2) { /* ignora */ }
        estado = null;
        avisar('Os dados salvos estavam estranhos, então começamos um escritório novo. Uma cópia ficou guardada.');
      }
    }
  } catch (err) {
    avisar('Este navegador não deixa salvar os dados. Dá para brincar, mas faça um backup antes de sair!');
  }
  if (!estado) estado = estadoInicial();
  return estado;
}

export function getEstado() {
  if (!estado) carregar();
  return estado;
}

export function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(getEstado()));
    return true;
  } catch (err) {
    const cheio = err && (err.name === 'QuotaExceededError' || err.code === 22);
    avisar(cheio
      ? 'O espaço para salvar acabou! Faça um backup nas Configurações e apague o que não precisa mais.'
      : 'Não consegui salvar neste aparelho. Faça um backup nas Configurações para não perder nada.');
    return false;
  }
}

export function substituirEstado(novo) {
  estado = migrar(novo);
  avisouErro = false;
  return salvar();
}

export function apagarTudo() {
  estado = estadoInicial();
  avisouErro = false;
  return salvar();
}
