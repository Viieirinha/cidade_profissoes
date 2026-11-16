// Exportar e importar backup em JSON.
import { getEstado, migrar, VERSAO } from './storage.js';

const MARCA = 'cidade-das-profissoes';
const LIMITE = 8 * 1024 * 1024;

export function exportarBackup() {
  const dados = { app: MARCA, exportadoEm: new Date().toISOString(), ...getEstado() };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cidade-das-profissoes-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function invalido(msg) {
  return new Error(msg || 'Esse arquivo não parece um backup da Cidade das Profissões.');
}

export function validar(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) throw invalido();
  if (d.app !== MARCA) throw invalido();
  if (!Array.isArray(d.registros)) throw invalido();
  if (typeof d.schema === 'number' && d.schema > VERSAO) {
    throw invalido('Esse backup é de uma versão mais nova do sistema. Atualize o sistema antes de importar.');
  }
  for (const r of d.registros) {
    if (!r || typeof r.id !== 'string' || typeof r.prof !== 'string' || typeof r.tipo !== 'string' ||
        !r.dados || typeof r.dados !== 'object') {
      throw invalido('O backup tem registros com problema. Nada foi alterado.');
    }
  }
  return d;
}

// Lê o arquivo, valida e devolve o novo estado já migrado (não grava nada).
export async function lerBackup(arquivo) {
  if (!arquivo) throw invalido('Nenhum arquivo escolhido.');
  if (arquivo.size > LIMITE) throw invalido('O arquivo é grande demais para ser um backup.');
  let json;
  try {
    json = JSON.parse(await arquivo.text());
  } catch (err) {
    throw invalido();
  }
  return migrar(validar(json));
}
