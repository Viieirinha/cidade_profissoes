// Atalhos para declarar campos de formulário nas profissões.
export const secao = (rotulo) => ({ tipo: 'secao', nome: 's-' + rotulo, rotulo });
export const txt = (nome, rotulo, x = {}) => ({ nome, rotulo, tipo: 'text', ...x });
export const area = (nome, rotulo, x = {}) => ({ nome, rotulo, tipo: 'textarea', ...x });
export const num = (nome, rotulo, x = {}) => ({ nome, rotulo, tipo: 'number', ...x });
export const data = (nome, rotulo, x = {}) => ({ nome, rotulo, tipo: 'date', ...x });
export const hora = (nome, rotulo, x = {}) => ({ nome, rotulo, tipo: 'time', ...x });
export const sel = (nome, rotulo, opcoes, x = {}) => ({ nome, rotulo, tipo: 'select', opcoes, ...x });
export const chips = (nome, rotulo, sugestoes, x = {}) => ({ nome, rotulo, tipo: 'chips', sugestoes, ...x });
export const emoji = (nome, rotulo, opcoes, x = {}) => ({ nome, rotulo, tipo: 'emoji', opcoes, ...x });
export const ref = (nome, rotulo, entidade, x = {}) => ({ nome, rotulo, tipo: 'ref', entidade, ...x });
export const refmulti = (nome, rotulo, entidade, x = {}) => ({ nome, rotulo, tipo: 'refmulti', entidade, ...x });
export const itens = (nome, rotulo, entidade, x = {}) => ({ nome, rotulo, tipo: 'itens', entidade, ...x });
export const odontograma = (nome, rotulo) => ({ nome, rotulo, tipo: 'odontograma' });
