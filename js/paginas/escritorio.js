// Páginas de uma profissão: escritório, detalhe de registro, formulário e documento.
import { porId } from '../professions/index.js';
import { getEstado } from '../core/storage.js';
import { listar, obter, criar, atualizar, apagar, maisRecentes, registrarRecente, contarDocumento } from '../core/entidades.js';
import { entidadeDe, tituloReg, subtituloReg, nomeDe, criarCtx } from '../core/modelo.js';
import { htmlFormulario, lerFormulario, ligarFormulario, formatarValor, htmlOdontograma, valorPadrao } from '../core/formulario.js';
import { htmlFolha, imprimir } from '../core/imprimir.js';
import { verificarSelos, incentivo } from '../core/selos.js';
import { navegar } from '../core/roteador.js';
import { esc, toast, confirmar, fmtRelativo } from '../core/ui.js';

const app = () => document.getElementById('app');
const novoRotulo = (en) => `${en.f ? 'Nova' : 'Novo'} ${en.nome.toLowerCase()}`;

function naoEncontrado() {
  app().innerHTML = `<section class="vazio"><h1 tabindex="-1">Não achei isso 🔎</h1>
    <p>Talvez tenha sido apagado.</p><p><a class="btn btn-primario" href="#/">Voltar ao início</a></p></section>`;
}

function aviso(prof) {
  return prof.aviso ? `<p class="aviso-suave" role="note">💛 ${esc(prof.aviso)}</p>` : '';
}

function textoBusca(prof, reg) {
  const en = entidadeDe(prof, reg.tipo);
  const partes = [tituloReg(prof, reg), subtituloReg(prof, reg)];
  en.campos.forEach((c) => { if (c.tipo !== 'secao') partes.push(formatarValor(c, reg.dados[c.nome], nomeDe)); });
  return partes.join(' ').toLowerCase();
}

function itemCartao(prof, reg, extra = '') {
  const en = entidadeDe(prof, reg.tipo);
  const sub = subtituloReg(prof, reg);
  return `<li data-busca="${esc(textoBusca(prof, reg))}"><div class="cartao-item" style="--cor:${prof.cor}">
    <a class="item-link" href="#/p/${prof.id}/r/${reg.id}">
      <span class="item-emoji" aria-hidden="true">${esc((reg.dados.emoji) || en.emoji)}</span>
      <span class="item-texto"><strong>${esc(tituloReg(prof, reg))}</strong>${sub ? `<small>${esc(sub)}</small>` : ''}</span>
    </a>${extra}</div></li>`;
}

function botoesDoc(prof, reg, pequeno = true) {
  return prof.documentos.filter((d) => d.de === reg.tipo)
    .map((d) => `<a class="btn ${pequeno ? 'btn-pequeno' : ''} btn-doc" href="#/p/${prof.id}/d/${reg.id}/${d.id}">${esc(d.botao || '🖨️ ' + d.titulo)}</a>`).join('');
}

function criarExemplo(prof) {
  const semear = (item, pai) => {
    const en = entidadeDe(prof, item.tipo);
    const dados = { ...item.dados };
    en.campos.forEach((c) => {
      if (c.tipo !== 'secao' && (dados[c.nome] === undefined || dados[c.nome] === '')) {
        const p = valorPadrao(c);
        if (p !== '') dados[c.nome] = p;
      }
    });
    const reg = criar(prof.id, item.tipo, dados, pai);
    (item.filhos || []).forEach((f) => semear(f, reg.id));
    return reg;
  };
  prof.exemplo.forEach((i) => semear(i));
}

// ---------- Escritório ----------
export function paginaEscritorio({ params }) {
  const prof = porId(params.prof);
  if (!prof) return naoEncontrado();
  const raiz = prof.entidades[0];
  const atend = prof.entidades[1];
  const regs = listar(prof.id, raiz.id).sort(maisRecentes);
  const recentes = atend ? listar(prof.id, atend.id).sort(maisRecentes).slice(0, 4) : [];

  app().innerHTML = `<section class="escritorio" style="--cor:${prof.cor}; --destaque:${prof.cor}; --sobre-destaque:#fff">
    <nav class="migalhas" aria-label="Você está aqui"><a href="#/">🏠 Início</a> › <span>${esc(prof.nome)}</span></nav>
    <h1 tabindex="-1"><span aria-hidden="true">${prof.emoji}</span> Escritório: ${esc(prof.nome)}</h1>
    <p class="subtitulo">${esc(prof.descricao || '')}</p>
    ${aviso(prof)}
    <div class="acoes">
      <a class="btn btn-primario" href="#/p/${prof.id}/novo/${raiz.id}">＋ ${esc(novoRotulo(raiz))}</a>
      ${regs.length === 0 && prof.exemplo ? '<button class="btn" id="exemplo" type="button">✨ Criar um exemplo</button>' : ''}
    </div>
    <h2>${esc(raiz.plural)} (${regs.length})</h2>
    ${regs.length ? `<div class="campo busca"><label for="busca">Buscar</label><input id="busca" type="search" placeholder="🔍 Buscar em ${esc(raiz.plural.toLowerCase())}…"></div>` : ''}
    ${regs.length ? `<ul class="lista-itens" id="lista">${regs.map((r) => itemCartao(prof, r)).join('')}</ul>
      <p class="vazio-texto" id="sem-resultado" hidden>Nada encontrado 🤔</p>`
      : `<p class="vazio-texto">Ainda não há ${esc(raiz.plural.toLowerCase())}. Que tal começar agora? 🎈</p>`}
    ${recentes.length ? `<h2>${esc(atend.plural)} recentes</h2><ul class="lista-itens">${recentes.map((r) => itemCartao(prof, r)).join('')}</ul>` : ''}
  </section>`;

  const ex = document.getElementById('exemplo');
  if (ex) ex.addEventListener('click', () => { criarExemplo(prof); verificarSelos(); toast('Exemplo criado! ' + incentivo()); paginaEscritorio({ params }); });

  const busca = document.getElementById('busca');
  if (busca) {
    busca.addEventListener('input', () => {
      const t = busca.value.trim().toLowerCase();
      let achou = 0;
      document.querySelectorAll('#lista > li').forEach((li) => {
        const ok = !t || li.dataset.busca.includes(t);
        li.hidden = !ok;
        if (ok) achou++;
      });
      document.getElementById('sem-resultado').hidden = achou > 0;
    });
  }
}

// ---------- Detalhe de um registro ----------
export function paginaDetalhe({ params }) {
  const reg = obter(params.id);
  const prof = reg && porId(reg.prof);
  if (!reg || !prof) return naoEncontrado();
  const en = entidadeDe(prof, reg.tipo);
  const pai = reg.pai ? obter(reg.pai) : null;
  const filhos = prof.entidades.filter((x) => x.pai === en.id);
  const ctx = criarCtx(prof, reg);

  const dl = en.campos.filter((c) => c.tipo !== 'secao').map((c) => {
    if (c.tipo === 'odontograma') return `<div class="dado dado-largo"><dt>${esc(c.rotulo)}</dt><dd>${htmlOdontograma(reg.dados[c.nome], false)}</dd></div>`;
    const t = formatarValor(c, reg.dados[c.nome], nomeDe);
    return t ? `<div class="dado"><dt>${esc(c.rotulo)}</dt><dd>${esc(t).replace(/\n/g, '<br>')}</dd></div>` : '';
  }).join('');

  const painel = prof.paineis && prof.paineis[en.id] ? prof.paineis[en.id](ctx) : '';

  const secoes = filhos.map((f) => {
    const itens = listar(prof.id, f.id, reg.id).sort(maisRecentes);
    return `<section class="filhos" aria-labelledby="h-${f.id}">
      <div class="filhos-cab"><h2 id="h-${f.id}">${esc(f.plural)} (${itens.length})</h2>
        <a class="btn btn-primario btn-pequeno" href="#/p/${prof.id}/novo/${f.id}?pai=${reg.id}">＋ ${esc(novoRotulo(f))}</a></div>
      ${itens.length ? `<ul class="lista-itens">${itens.map((r) => itemCartao(prof, r, `<div class="item-acoes">${botoesDoc(prof, r)}</div>`)).join('')}</ul>`
        : `<p class="vazio-texto">Nada por aqui ainda.</p>`}
    </section>`;
  }).join('');

  const voltar = pai ? `#/p/${prof.id}/r/${pai.id}` : `#/p/${prof.id}`;
  app().innerHTML = `<section class="detalhe" style="--cor:${prof.cor}; --destaque:${prof.cor}; --sobre-destaque:#fff">
    <nav class="migalhas" aria-label="Você está aqui"><a href="#/">🏠 Início</a> › <a href="#/p/${prof.id}">${esc(prof.nome)}</a>${pai ? ` › <a href="${voltar}">${esc(tituloReg(prof, pai))}</a>` : ''} › <span>${esc(tituloReg(prof, reg))}</span></nav>
    <h1 tabindex="-1"><span aria-hidden="true">${esc(reg.dados.emoji || en.emoji)}</span> ${esc(tituloReg(prof, reg))}</h1>
    ${aviso(prof)}
    <div class="acoes">
      ${botoesDoc(prof, reg, false)}
      <a class="btn" href="#/p/${prof.id}/e/${reg.id}">✏️ Editar</a>
      <button class="btn btn-perigo-suave" id="apagar" type="button">🗑️ Apagar</button>
    </div>
    ${dl ? `<dl class="dados">${dl}</dl>` : ''}
    ${painel}
    ${secoes}
  </section>`;

  document.getElementById('apagar').addEventListener('click', async () => {
    const extra = filhos.length ? ' Tudo que está dentro dele(a) também será apagado.' : '';
    if (await confirmar(`Apagar “${tituloReg(prof, reg)}”?${extra}`, { sim: 'Apagar', perigo: true })) {
      apagar(reg.id);
      toast('Apagado.');
      navegar(voltar.slice(1));
    }
  });
}

// ---------- Formulário (novo / editar) ----------
export function paginaForm({ params, query }) {
  const editando = !!params.id;
  const reg = editando ? obter(params.id) : null;
  const prof = porId(editando ? reg && reg.prof : params.prof);
  if (!prof || (editando && !reg)) return naoEncontrado();
  const tipo = editando ? reg.tipo : params.tipo;
  const en = entidadeDe(prof, tipo);
  if (!en) return naoEncontrado();
  const paiId = editando ? reg.pai : query.pai;
  const pai = paiId ? obter(paiId) : null;
  if (en.pai && !pai) return naoEncontrado();

  const ctxRef = {
    opcoes: (c) => {
      const base = c.escopo === 'proprios' ? (editando ? reg.id : null) : paiId;
      if (!base) return [];
      const alvo = entidadeDe(prof, c.entidade);
      return listar(prof.id, c.entidade, base).map((r) => ({
        id: r.id, rotulo: tituloReg(prof, r), detalhe: alvo && alvo.subtitulo ? alvo.subtitulo(r.dados, nomeDe) : '',
      }));
    },
  };

  const voltar = editando ? `#/p/${prof.id}/r/${reg.id}` : (pai ? `#/p/${prof.id}/r/${pai.id}` : `#/p/${prof.id}`);
  const titulo = editando ? `Editar ${en.nome.toLowerCase()}` : novoRotulo(en);
  app().innerHTML = `<section class="formulario" style="--cor:${prof.cor}; --destaque:${prof.cor}; --sobre-destaque:#fff">
    <nav class="migalhas" aria-label="Você está aqui"><a href="#/">🏠 Início</a> › <a href="#/p/${prof.id}">${esc(prof.nome)}</a>${pai ? ` › <a href="#/p/${prof.id}/r/${pai.id}">${esc(tituloReg(prof, pai))}</a>` : ''}</nav>
    <h1 tabindex="-1"><span aria-hidden="true">${en.emoji}</span> ${esc(titulo[0].toUpperCase() + titulo.slice(1))}</h1>
    ${aviso(prof)}
    <p class="privacidade-mini">🔒 Use apelidos: nada de sobrenome, endereço, telefone ou foto de verdade.</p>
    <form id="form" autocomplete="off">
      ${htmlFormulario(en.campos, editando ? reg.dados : {}, ctxRef)}
      <div class="acoes acoes-form">
        <button class="btn btn-primario" type="submit">💾 Salvar</button>
        <a class="btn" href="${voltar}">Cancelar</a>
      </div>
    </form>
  </section>`;

  const form = document.getElementById('form');
  ligarFormulario(form);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!form.reportValidity()) return;
    const dados = lerFormulario(form, en.campos);
    const salvo = editando ? atualizar(reg.id, dados) : criar(prof.id, tipo, dados, paiId || undefined);
    verificarSelos();
    const nome = getEstado().config.jogadora;
    toast(`${editando ? 'Salvo!' : 'Cadastrado!'} ${incentivo()}${nome ? ' ' + nome : ''}`.trim());
    navegar(`/p/${prof.id}/r/${salvo.id}`);
  });
}

// ---------- Documento imprimível ----------
export function paginaDocumento({ params }) {
  const reg = obter(params.id);
  const prof = reg && porId(reg.prof);
  const doc = prof && prof.documentos.find((d) => d.id === params.doc);
  if (!reg || !prof || !doc) return naoEncontrado();
  const ctx = criarCtx(prof, reg);
  registrarRecente(prof.id, reg.id, doc.id);
  const voltar = `#/p/${prof.id}/r/${reg.id}`;

  app().innerHTML = `<section class="pagina-doc" style="--cor:${prof.cor}; --destaque:${prof.cor}; --sobre-destaque:#fff">
    <div class="barra-doc nao-imprimir">
      <a class="btn" href="${voltar}">← Voltar</a>
      <label class="papel">Papel
        <select id="papel"><option>A4</option><option>A5</option></select></label>
      <button class="btn btn-primario" id="imprimir" type="button">🖨️ Imprimir ou salvar PDF</button>
    </div>
    <h1 class="sr-only" tabindex="-1">${esc(doc.titulo)}</h1>
    ${aviso(prof) ? `<div class="nao-imprimir">${aviso(prof)}</div>` : ''}
    ${htmlFolha(prof, doc.titulo, doc.render(ctx))}
  </section>`;

  document.getElementById('imprimir').addEventListener('click', () => {
    imprimir(document.getElementById('papel').value);
    contarDocumento(prof.id);
    verificarSelos();
  });
}
