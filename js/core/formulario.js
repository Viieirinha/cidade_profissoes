// Gera formulários, lê valores e formata dados a partir da configuração dos campos.
import { esc, hoje, fmtData, dataEstelar } from './ui.js';

// ---- Odontograma ----
export const ESTADOS_DENTE = {
  s: ['🦷', 'saudável'],
  b: ['✨', 'brilhando'],
  e: ['🪥', 'precisa de escovinha'],
  o: ['💎', 'obturação de faz de conta'],
  f: ['🧚', 'dentinho que caiu (fada do dente!)'],
};
const CICLO = ['s', 'b', 'e', 'o', 'f'];

export function htmlOdontograma(estados, interativo) {
  const arr = Array.isArray(estados) && estados.length === 32 ? estados : Array(32).fill('s');
  const dente = (i) => {
    const [em, nome] = ESTADOS_DENTE[arr[i]] || ESTADOS_DENTE.s;
    if (interativo) {
      return `<button type="button" class="dente" data-dente data-estado="${esc(arr[i])}" aria-label="Dente ${i + 1}: ${esc(nome)}"><span aria-hidden="true">${em}</span><small>${i + 1}</small></button>`;
    }
    return `<span class="dente" title="Dente ${i + 1}: ${esc(nome)}"><span aria-hidden="true">${em}</span><small>${i + 1}</small></span>`;
  };
  const linha = (de) => Array.from({ length: 16 }, (_, k) => dente(de + k)).join('');
  const legenda = CICLO.map((k) => `<li><span aria-hidden="true">${ESTADOS_DENTE[k][0]}</span> ${esc(ESTADOS_DENTE[k][1])}</li>`).join('');
  return `<div class="odonto">
    <p class="odonto-rotulo">Em cima</p><div class="odonto-linha">${linha(0)}</div>
    <p class="odonto-rotulo">Embaixo</p><div class="odonto-linha">${linha(16)}</div>
    <ul class="odonto-legenda">${legenda}</ul>
    ${interativo ? '<p class="ajuda">Toque num dente para mudar como ele está.</p><p class="sr-only" role="status" data-odonto-aviso></p>' : ''}
  </div>`;
}

// ---- Valores padrão e formatação ----
export function valorPadrao(c) {
  if (c.padrao === 'hoje') return hoje();
  if (c.padrao === 'estelar') return dataEstelar();
  if (c.padrao !== undefined) return c.padrao;
  if (c.tipo === 'chips' || c.tipo === 'refmulti') return [];
  if (c.tipo === 'odontograma') return Array(32).fill('s');
  if (c.tipo === 'itens') return {};
  return '';
}

const vazio = (v) =>
  v === undefined || v === null || v === '' ||
  (Array.isArray(v) && !v.length) ||
  (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);

// Devolve TEXTO PURO (quem usa deve escapar).
export function formatarValor(c, v, nomeDe = (x) => x) {
  if (vazio(v)) return '';
  switch (c.tipo) {
    case 'chips': return v.join(', ');
    case 'refmulti': return v.map(nomeDe).join(', ');
    case 'ref': return nomeDe(v);
    case 'itens': return Object.entries(v).map(([id, q]) => `${nomeDe(id)} ×${q}`).join(', ');
    case 'date': return fmtData(v);
    case 'number': return c.unidade ? `${v} ${c.unidade}` : String(v);
    case 'odontograma': {
      const n = {};
      v.forEach((k) => { n[k] = (n[k] || 0) + 1; });
      return CICLO.filter((k) => n[k]).map((k) => `${ESTADOS_DENTE[k][0]} ${n[k]}`).join('  ');
    }
    default: return String(v);
  }
}

// ---- Geração dos campos ----
function chipHtml(nome, valor, marcado, rotulo) {
  return `<label class="chip"><input type="checkbox" name="${esc(nome)}" value="${esc(valor)}"${marcado ? ' checked' : ''}><span>${esc(rotulo ?? valor)}</span></label>`;
}

function sugestoesTexto(c, id) {
  if (!c.sugestoes || !c.sugestoes.length) return '';
  return `<div class="sugestoes" role="group" aria-label="Ideias para ${esc(c.rotulo)}">${c.sugestoes
    .map((s) => `<button type="button" class="chip-btn" data-sug="${esc(s)}" data-alvo="${id}">${esc(s)}</button>`).join('')}</div>`;
}

export function htmlCampo(c, valor, ctx = {}) {
  if (c.tipo === 'secao') return `<h2 class="form-secao">${esc(c.rotulo)}</h2>`;
  const id = 'f-' + c.nome;
  const v = valor === undefined ? valorPadrao(c) : valor;
  const req = c.obrigatorio ? ' required' : '';
  const asterisco = c.obrigatorio ? ' <span class="obrig" aria-hidden="true">*</span>' : '';
  const ajuda = c.ajuda ? `<small class="ajuda" id="${id}-aj">${esc(c.ajuda)}</small>` : '';
  const desc = c.ajuda ? ` aria-describedby="${id}-aj"` : '';
  const rot = `<label for="${id}">${esc(c.rotulo)}${asterisco}</label>`;
  const ph = c.dica ? ` placeholder="${esc(c.dica)}"` : '';
  const larg = c.metade ? ' campo-metade' : '';

  switch (c.tipo) {
    case 'text':
    case 'date':
    case 'time':
      return `<div class="campo${larg}">${rot}<input id="${id}" name="${esc(c.nome)}" type="${c.tipo}" value="${esc(v)}" maxlength="${c.max || 120}"${ph}${req}${desc}>${c.tipo === 'text' ? sugestoesTexto(c, id) : ''}${ajuda}</div>`;
    case 'number':
      return `<div class="campo${larg}">${rot}<input id="${id}" name="${esc(c.nome)}" type="number" inputmode="decimal" value="${esc(v)}"${c.min !== undefined ? ` min="${c.min}"` : ''}${c.max !== undefined ? ` max="${c.max}"` : ''} step="${c.passo || 1}"${ph}${req}${desc}>${ajuda}</div>`;
    case 'textarea':
      return `<div class="campo">${rot}<textarea id="${id}" name="${esc(c.nome)}" rows="${c.linhas || 3}" maxlength="${c.max || 1200}"${ph}${req}${desc}>${esc(v)}</textarea>${sugestoesTexto(c, id)}${ajuda}</div>`;
    case 'select': {
      const ops = [...c.opcoes];
      if (v && !ops.includes(v)) ops.push(v);
      return `<div class="campo${larg}">${rot}<select id="${id}" name="${esc(c.nome)}"${req}${desc}>${c.obrigatorio ? '' : '<option value="">—</option>'}${ops.map((o) => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>${ajuda}</div>`;
    }
    case 'chips': {
      const sug = c.sugestoes || [];
      const extras = (v || []).filter((x) => !sug.includes(x));
      const todos = [...sug, ...extras];
      const novo = c.livre === false ? '' : `<div class="chip-novo" data-nome="${esc(c.nome)}"><input type="text" maxlength="60" aria-label="Adicionar outro em ${esc(c.rotulo)}" placeholder="Adicionar outro…"><button type="button" class="btn btn-pequeno" data-add aria-label="Adicionar">＋</button></div>`;
      return `<fieldset class="campo"><legend>${esc(c.rotulo)}</legend><div class="chips">${todos.map((o) => chipHtml(c.nome, o, (v || []).includes(o))).join('')}</div>${novo}${ajuda}</fieldset>`;
    }
    case 'emoji':
      return `<fieldset class="campo"><legend>${esc(c.rotulo)}</legend><div class="chips emojis">${c.opcoes.map((o, i) =>
        `<label class="chip chip-emoji"><input type="radio" name="${esc(c.nome)}" value="${esc(o)}"${(v ? o === v : i === 0) ? ' checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div></fieldset>`;
    case 'ref': {
      const ops = (ctx.opcoes ? ctx.opcoes(c) : []);
      const vazioMsg = ops.length ? '— escolha —' : (c.semOpcoes || '(nada cadastrado ainda)');
      return `<div class="campo${larg}">${rot}<select id="${id}" name="${esc(c.nome)}"${req}${desc}><option value="">${esc(vazioMsg)}</option>${ops.map((o) => `<option value="${esc(o.id)}"${o.id === v ? ' selected' : ''}>${esc(o.rotulo)}</option>`).join('')}</select>${ajuda}</div>`;
    }
    case 'refmulti': {
      const ops = (ctx.opcoes ? ctx.opcoes(c) : []);
      const corpo = ops.length
        ? `<div class="chips">${ops.map((o) => chipHtml(c.nome, o.id, (v || []).includes(o.id), o.rotulo)).join('')}</div>`
        : `<p class="ajuda">${esc(c.semOpcoes || '(nada cadastrado ainda)')}</p>`;
      return `<fieldset class="campo"><legend>${esc(c.rotulo)}</legend>${corpo}${ajuda}</fieldset>`;
    }
    case 'itens': {
      const ops = (ctx.opcoes ? ctx.opcoes(c) : []);
      const corpo = ops.length
        ? `<ul class="itens">${ops.map((o) => `<li><label for="${id}-${esc(o.id)}"><span>${esc(o.rotulo)}</span> <small>${esc(o.detalhe || '')}</small></label><input id="${id}-${esc(o.id)}" type="number" min="0" max="99" step="1" inputmode="numeric" data-item="${esc(o.id)}" value="${esc((v && v[o.id]) || 0)}" aria-label="Quantidade de ${esc(o.rotulo)}"></li>`).join('')}</ul>`
        : `<p class="ajuda">${esc(c.semOpcoes || '(nada cadastrado ainda)')}</p>`;
      return `<fieldset class="campo"><legend>${esc(c.rotulo)}</legend>${corpo}</fieldset>`;
    }
    case 'odontograma':
      return `<fieldset class="campo" data-odonto><legend>${esc(c.rotulo)}</legend>${htmlOdontograma(v, true)}</fieldset>`;
    default:
      return '';
  }
}

export function htmlFormulario(campos, dados = {}, ctx = {}) {
  return campos.map((c) => htmlCampo(c, dados[c.nome], ctx)).join('');
}

// ---- Leitura ----
export function lerFormulario(form, campos) {
  const dados = {};
  for (const c of campos) {
    if (c.tipo === 'secao') continue;
    const nome = c.nome;
    switch (c.tipo) {
      case 'chips':
      case 'refmulti':
        dados[nome] = [...form.querySelectorAll(`input[type="checkbox"][name="${nome}"]:checked`)].map((i) => i.value);
        break;
      case 'emoji': {
        const r = form.querySelector(`input[type="radio"][name="${nome}"]:checked`);
        dados[nome] = r ? r.value : '';
        break;
      }
      case 'itens': {
        const o = {};
        form.querySelectorAll('input[data-item]').forEach((i) => {
          const q = parseInt(i.value, 10);
          if (q > 0) o[i.dataset.item] = q;
        });
        dados[nome] = o;
        break;
      }
      case 'odontograma':
        dados[nome] = [...form.querySelectorAll('[data-dente]')].map((b) => b.dataset.estado);
        break;
      case 'number': {
        const el = form.elements[nome];
        dados[nome] = el && el.value !== '' ? Number(el.value) : '';
        break;
      }
      default: {
        const el = form.elements[nome];
        dados[nome] = el ? el.value.trim() : '';
      }
    }
  }
  return dados;
}

// ---- Interação (chips livres, sugestões, odontograma) ----
function adicionarChip(box) {
  const entrada = box.querySelector('input');
  const valor = entrada.value.trim();
  if (!valor) return;
  const cont = box.previousElementSibling;
  const jaTem = [...cont.querySelectorAll('input')].find((i) => i.value === valor);
  if (jaTem) { jaTem.checked = true; entrada.value = ''; return; }
  const label = document.createElement('label');
  label.className = 'chip';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.name = box.dataset.nome;
  input.value = valor;
  input.checked = true;
  const span = document.createElement('span');
  span.textContent = valor;
  label.append(input, span);
  cont.appendChild(label);
  entrada.value = '';
  entrada.focus();
}

export function ligarFormulario(form) {
  form.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-dente')) {
      const atual = CICLO.indexOf(b.dataset.estado);
      const prox = CICLO[(atual + 1) % CICLO.length];
      b.dataset.estado = prox;
      const [em, nome] = ESTADOS_DENTE[prox];
      b.firstElementChild.textContent = em;
      const texto = `Dente ${b.querySelector('small').textContent}: ${nome}`;
      b.setAttribute('aria-label', texto);
      const aviso = form.querySelector('[data-odonto-aviso]');
      if (aviso) aviso.textContent = texto;
    } else if (b.hasAttribute('data-add')) {
      adicionarChip(b.closest('.chip-novo'));
    } else if (b.dataset.sug !== undefined) {
      const alvo = form.querySelector('#' + b.dataset.alvo);
      if (!alvo) return;
      alvo.value = alvo.value.trim() ? alvo.value.trim() + ' ' + b.dataset.sug : b.dataset.sug;
      alvo.focus();
    }
  });
  form.addEventListener('keydown', (ev) => {
    const box = ev.target.closest && ev.target.closest('.chip-novo');
    if (box && ev.key === 'Enter') { ev.preventDefault(); adicionarChip(box); }
  });
}
