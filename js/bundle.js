/* ARQUIVO GERADO por tools/gerar-bundle.mjs — não edite à mão. */
(function () {
'use strict';
const __defs = {};
const __cache = {};
function __r(id) {
  if (__cache[id]) return __cache[id];
  const m = {};
  __cache[id] = m;
  __defs[id](m, __r);
  return m;
}

// ---- js/app.js ----
__defs["js/app.js"] = function (__m, __r) {
// Ponto de entrada.
const { carregar, getEstado, salvar, aoErro } = __r("js/core/storage.js");
const { rota, iniciar } = __r("js/core/roteador.js");
const { toast, avisoModal } = __r("js/core/ui.js");
const { aplicarAparencia } = __r("js/core/aparencia.js");
const { paginaHome } = __r("js/paginas/home.js");
const { paginaRelatorio } = __r("js/paginas/relatorio.js");
const { paginaAlbum } = __r("js/paginas/album.js");
const { paginaConfig } = __r("js/paginas/config.js");
const { paginaEscritorio, paginaDetalhe, paginaForm, paginaDocumento } = __r("js/paginas/escritorio.js");

function primeiraAbertura() {
  const { config } = getEstado();
  if (config.avisoVisto) return;
  avisoModal('Bem-vinda à Cidade das Profissões! 🏙️', `
    <p>Aqui você brinca de ter profissões: médica, detetive, professora e muito mais.</p>
    <p>🔒 <strong>Seus dados ficam só neste aparelho.</strong> Nada vai para a internet.</p>
    <p>✏️ Use <strong>apelidos</strong> em vez de sobrenomes, endereços, telefones ou fotos reais.</p>
    <p>📄 Os documentos são de brincadeira e não valem nada de verdade.</p>`, 'Entendi, vamos brincar!')
    .then(() => { config.avisoVisto = true; salvar(); });
}

function iniciarApp() {
  aoErro((msg) => toast('⚠️ ' + msg, 9000));
  carregar();
  aplicarAparencia();

  rota('/', paginaHome);
  rota('/config', paginaConfig);
  rota('/relatorio', paginaRelatorio);
  rota('/album', paginaAlbum);
  rota('/p/:prof', paginaEscritorio);
  rota('/p/:prof/r/:id', paginaDetalhe);
  rota('/p/:prof/novo/:tipo', paginaForm);
  rota('/p/:prof/e/:id', paginaForm);
  rota('/p/:prof/d/:id/:doc', paginaDocumento);

  iniciar(() => {
    document.getElementById('app').innerHTML =
      '<section class="vazio"><h1 tabindex="-1">Página não encontrada 🔎</h1><p><a class="btn btn-primario" href="#/">Voltar ao início</a></p></section>';
  });
  primeiraAbertura();
}

iniciarApp();


};

// ---- js/core/storage.js ----
__defs["js/core/storage.js"] = function (__m, __r) {
// Armazenamento local com versão de esquema e migrações.
// Tudo fica em UMA chave do localStorage (um objeto JSON).

const { marcaPadrao, normalizarMarca } = __r("js/core/marca.js");

const CHAVE = 'cidade-das-profissoes';
const VERSAO = 1;
const TEMAS = ['claro', 'escuro'];
const CORES = ['rosa', 'lilas', 'azul', 'verde', 'laranja'];

let estado = null;
let avisouErro = false;
const ouvintesErro = [];

function estadoInicial() {
  return {
    schema: VERSAO,
    config: { jogadora: '', escritorio: 'Cidade das Profissões', tema: 'claro', cor: 'rosa', avisoVisto: false, marca: marcaPadrao(), sons: false, clientes: true },
    selos: {},
    contadores: { documentos: {} },
    registros: [],
    recentes: [],
    espera: [],
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
      marca: normalizarMarca(c.marca),
      sons: c.sons === true,
      clientes: c.clientes !== false,
    },
    selos: e && e.selos && typeof e.selos === 'object' ? e.selos : {},
    contadores: {
      documentos: (e && e.contadores && e.contadores.documentos) || {},
    },
    registros: Array.isArray(e && e.registros) ? e.registros : [],
    recentes: Array.isArray(e && e.recentes) ? e.recentes : [],
    espera: (Array.isArray(e && e.espera) ? e.espera : [])
      .filter((x) => x && typeof x.prof === 'string' && Number.isInteger(x.i) && typeof x.emoji === 'string')
      .map((x) => ({ prof: x.prof, i: x.i, emoji: [...x.emoji].slice(0, 4).join(''), em: typeof x.em === 'string' ? x.em : '' }))
      .slice(0, 30),
  };
}

function migrar(e) {
  if (typeof e.schema !== 'number') e.schema = 1;
  while (e.schema < VERSAO) {
    const passo = migracoes[e.schema];
    if (!passo) break;
    e = passo(e);
  }
  return completar(e);
}

function aoErro(fn) {
  ouvintesErro.push(fn);
}

function avisar(mensagem) {
  if (avisouErro) return;
  avisouErro = true;
  ouvintesErro.forEach((fn) => fn(mensagem));
}

function carregar() {
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

function getEstado() {
  if (!estado) carregar();
  return estado;
}

function salvar() {
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

function substituirEstado(novo) {
  estado = migrar(novo);
  avisouErro = false;
  return salvar();
}

function apagarTudo() {
  estado = estadoInicial();
  avisouErro = false;
  return salvar();
}

__m.estadoInicial = estadoInicial;
__m.migrar = migrar;
__m.aoErro = aoErro;
__m.carregar = carregar;
__m.getEstado = getEstado;
__m.salvar = salvar;
__m.substituirEstado = substituirEstado;
__m.apagarTudo = apagarTudo;
__m.VERSAO = VERSAO;
__m.TEMAS = TEMAS;
__m.CORES = CORES;
};

// ---- js/core/marca.js ----
__defs["js/core/marca.js"] = function (__m, __r) {
// "Marca" do escritório: avatar, logotipo, carimbo e papel timbrado personalizados.
// Tudo é validado aqui (cores só em #rrggbb, emojis curtos) porque vai parar em SVG/estilos.

const PALETA = [
  { cor: '#c2185b', nome: 'Rosa' },
  { cor: '#7b1fa2', nome: 'Lilás' },
  { cor: '#283593', nome: 'Azul-marinho' },
  { cor: '#1565c0', nome: 'Azul' },
  { cor: '#00796b', nome: 'Turquesa' },
  { cor: '#2e7d32', nome: 'Verde' },
  { cor: '#b34700', nome: 'Laranja' },
  { cor: '#c62828', nome: 'Vermelho' },
  { cor: '#5d4037', nome: 'Marrom' },
];
const FORMAS_LOGO = [['quadrado', 'Quadrado'], ['circulo', 'Redondo']];
const FORMAS_CARIMBO = [['redondo', 'Redondo'], ['oval', 'Oval'], ['retangular', 'Retangular'], ['festivo', 'Festivo']];
const TIMBRES = [['simples', 'Simples'], ['bolinhas', 'Bolinhas'], ['listras', 'Listras'], ['estrelas', 'Estrelas']];
const AVATARES = ['👩‍💼', '👩‍⚕️', '👩‍🏫', '👩‍🍳', '🕵️‍♀️', '👩‍🚀', '👩‍🔬', '👩‍⚖️', '🧑‍🎨', '🦸‍♀️', '🧙‍♀️', '🧚', '👸', '🐱', '🦄', '🐼'];
const EMOJIS_MARCA = ['⭐', '🌟', '💖', '🦋', '🌈', '🍀', '🌸', '🚀', '🦄', '🐾', '🎀', '👑'];

function marcaPadrao() {
  return {
    avatar: '👩‍💼',
    logoEmoji: '', logoForma: 'quadrado',
    corDocs: '',
    carimboForma: 'redondo', carimboCor: '', carimboEmoji: '', carimboFrase: '',
    timbre: 'simples',
  };
}

const cor = (v) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : '');
const emoji = (v, padrao) => (typeof v === 'string' ? [...v].slice(0, 12).join('') : padrao);
const opcao = (v, lista, padrao) => (lista.some(([k]) => k === v) ? v : padrao);

// Aceita qualquer coisa e devolve uma marca segura e completa.
function normalizarMarca(m) {
  const p = marcaPadrao();
  m = m && typeof m === 'object' ? m : {};
  return {
    avatar: emoji(m.avatar, p.avatar) || p.avatar,
    logoEmoji: emoji(m.logoEmoji, ''),
    logoForma: opcao(m.logoForma, FORMAS_LOGO, p.logoForma),
    corDocs: cor(m.corDocs),
    carimboForma: opcao(m.carimboForma, FORMAS_CARIMBO, p.carimboForma),
    carimboCor: cor(m.carimboCor),
    carimboEmoji: emoji(m.carimboEmoji, ''),
    carimboFrase: typeof m.carimboFrase === 'string' ? m.carimboFrase.replace(/[<>"'&]/g, '').trim().slice(0, 18) : '',
    timbre: opcao(m.timbre, TIMBRES, p.timbre),
  };
}

__m.marcaPadrao = marcaPadrao;
__m.normalizarMarca = normalizarMarca;
__m.PALETA = PALETA;
__m.FORMAS_LOGO = FORMAS_LOGO;
__m.FORMAS_CARIMBO = FORMAS_CARIMBO;
__m.TIMBRES = TIMBRES;
__m.AVATARES = AVATARES;
__m.EMOJIS_MARCA = EMOJIS_MARCA;
};

// ---- js/core/roteador.js ----
__defs["js/core/roteador.js"] = function (__m, __r) {
// Roteador simples por hash: #/p/medica/r/ID?x=1  (funciona em file:// e no GitHub Pages)

const rotas = [];
let naoEncontrada = null;
let primeiraVez = true;

function rota(padrao, tratador) {
  const nomes = [];
  const re = new RegExp('^' + padrao.replace(/:([a-z]+)/g, (_, n) => { nomes.push(n); return '([^/]+)'; }) + '$');
  rotas.push({ re, nomes, tratador });
}

function caminhoAtual() {
  const h = location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = h.split('?');
  return { path, query: Object.fromEntries(new URLSearchParams(qs)) };
}

function navegar(caminho) {
  if (location.hash === '#' + caminho) executar();
  else location.hash = '#' + caminho;
}

function executar() {
  const { path, query } = caminhoAtual();
  for (const r of rotas) {
    const m = r.re.exec(path);
    if (!m) continue;
    const params = {};
    r.nomes.forEach((n, i) => { params[n] = decodeURIComponent(m[i + 1]); });
    try {
      r.tratador({ params, query });
    } catch (err) {
      console.error(err);
      const app = document.getElementById('app');
      app.innerHTML = '<section class="vazio"><h1 tabindex="-1">Ops! Algo deu errado 🙈</h1><p><a class="btn btn-primario" href="#/">Voltar para o início</a></p></section>';
    }
    depois();
    return;
  }
  if (naoEncontrada) naoEncontrada();
  depois();
}

function depois() {
  window.scrollTo(0, 0);
  const eraPrimeira = primeiraVez;
  primeiraVez = false;
  const h1 = document.querySelector('#app h1');
  if (h1) {
    h1.setAttribute('tabindex', '-1');
    // Na carga inicial não rouba o foco (o primeiro Tab deve ir ao link "Pular para o conteúdo").
    if (!eraPrimeira) h1.focus({ preventScroll: true });
    const base = (document.getElementById('nome-escritorio') || {}).textContent || '';
    document.title = `${h1.textContent.replace(/\s+/g, ' ').trim()} · ${base}`;
  }
  const atual = location.hash.startsWith('#/config') ? '#/config' : (location.hash.replace(/^#/, '') || '/') === '/' ? '#/' : null;
  document.querySelectorAll('header nav a').forEach((a) => {
    if (a.getAttribute('href') === atual) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

function iniciar(fnNaoEncontrada) {
  naoEncontrada = fnNaoEncontrada;
  addEventListener('hashchange', executar);
  executar();
}

__m.rota = rota;
__m.caminhoAtual = caminhoAtual;
__m.navegar = navegar;
__m.executar = executar;
__m.iniciar = iniciar;
};

// ---- js/core/ui.js ----
__defs["js/core/ui.js"] = function (__m, __r) {
// Utilitários de interface: escape de HTML, datas, avisos e diálogos.

const MAPA = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Escapa TODO texto digitado antes de colocar em HTML.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => MAPA[c]);
// Escapa e preserva quebras de linha.
const par = (s) => esc(s).replace(/\r?\n/g, '<br>');

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];

function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtData(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(s || '');
}

function fmtMoeda(n) {
  const v = Number(n) || 0;
  return 'R$ ' + v.toFixed(2).replace('.', ',');
}

// "Data estelar" de brincadeira: ano.diaDoAno
function dataEstelar(iso = hoje()) {
  const d = new Date(iso + 'T12:00:00');
  const dia = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  return `${d.getFullYear()}.${String(dia).padStart(3, '0')}`;
}

function fmtRelativo(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ---- Avisos rápidos (toasts) ----
function toast(mensagem, ms = 3800) {
  let area = document.getElementById('toasts');
  if (!area) {
    area = document.createElement('div');
    area.id = 'toasts';
    area.setAttribute('aria-live', 'polite');
    document.body.appendChild(area);
  }
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = mensagem;
  area.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

// ---- Diálogos ----
function criarDialogo(conteudo) {
  const dlg = document.createElement('dialog');
  dlg.className = 'dialogo';
  dlg.innerHTML = conteudo;
  document.body.appendChild(dlg);
  dlg.addEventListener('close', () => setTimeout(() => dlg.remove(), 0));
  return dlg;
}

function confirmar(mensagem, { sim = 'Sim', nao = 'Cancelar', perigo = false } = {}) {
  return new Promise((resolve) => {
    const dlg = criarDialogo(`
      <form method="dialog">
        <p class="dialogo-texto">${esc(mensagem)}</p>
        <div class="dialogo-acoes">
          <button class="btn" value="nao">${esc(nao)}</button>
          <button class="btn ${perigo ? 'btn-perigo' : 'btn-primario'}" value="sim">${esc(sim)}</button>
        </div>
      </form>`);
    dlg.addEventListener('close', () => resolve(dlg.returnValue === 'sim'));
    dlg.showModal();
  });
}

// Pergunta com conteúdo em HTML (já escapado por quem chama) e botões com valores próprios.
// Devolve o value do botão clicado, ou '' se a pessoa fechar (Esc).
function perguntaHtml(titulo, htmlCorpo, botoes) {
  return new Promise((resolve) => {
    const dlg = criarDialogo(`
      <form method="dialog">
        <h2 class="dialogo-titulo">${esc(titulo)}</h2>
        <div class="dialogo-texto">${htmlCorpo}</div>
        <div class="dialogo-acoes">${botoes.map((b, i) =>
          `<button class="btn ${b.primario ? 'btn-primario' : ''}" value="${esc(b.valor)}"${i === botoes.length - 1 ? ' autofocus' : ''}>${esc(b.rotulo)}</button>`).join('')}</div>
      </form>`);
    dlg.addEventListener('close', () => resolve(dlg.returnValue || ''));
    dlg.showModal();
  });
}

function avisoModal(titulo, htmlCorpo, botao = 'Entendi!') {
  return new Promise((resolve) => {
    const dlg = criarDialogo(`
      <form method="dialog">
        <h2 class="dialogo-titulo">${esc(titulo)}</h2>
        <div class="dialogo-texto">${htmlCorpo}</div>
        <div class="dialogo-acoes"><button class="btn btn-primario" value="ok" autofocus>${esc(botao)}</button></div>
      </form>`);
    dlg.addEventListener('close', () => resolve());
    dlg.showModal();
  });
}

__m.hoje = hoje;
__m.fmtData = fmtData;
__m.fmtMoeda = fmtMoeda;
__m.dataEstelar = dataEstelar;
__m.fmtRelativo = fmtRelativo;
__m.toast = toast;
__m.confirmar = confirmar;
__m.perguntaHtml = perguntaHtml;
__m.avisoModal = avisoModal;
__m.esc = esc;
__m.par = par;
__m.$ = $;
__m.$$ = $$;
};

// ---- js/core/aparencia.js ----
__defs["js/core/aparencia.js"] = function (__m, __r) {
const { getEstado } = __r("js/core/storage.js");

// Aplica tema, cor de destaque e nome do escritório.
function aplicarAparencia() {
  const { config } = getEstado();
  document.documentElement.dataset.tema = config.tema;
  document.documentElement.dataset.cor = config.cor;
  const nome = document.getElementById('nome-escritorio');
  if (nome) nome.textContent = config.escritorio;
  document.title = config.escritorio;
}

__m.aplicarAparencia = aplicarAparencia;
};

// ---- js/paginas/home.js ----
__defs["js/paginas/home.js"] = function (__m, __r) {
const { PROFISSOES, porId } = __r("js/professions/index.js");
const { getEstado } = __r("js/core/storage.js");
const { obter, listar } = __r("js/core/entidades.js");
const { tituloReg } = __r("js/core/modelo.js");
const { todosSelos, totalAtendimentos } = __r("js/core/selos.js");
const { esc, fmtRelativo } = __r("js/core/ui.js");
const { htmlFigurinha } = __r("js/paginas/album.js");

function paginaHome() {
  const { config, recentes } = getEstado();
  const nome = config.jogadora;
  const selos = todosSelos();
  const ganhos = selos.filter((s) => s.ok);

  const predios = PROFISSOES.map((p) => {
    const n = p.entidades[1] ? listar(p.id, p.entidades[1].id).length : 0;
    return `<li><a class="predio" href="#/p/${p.id}" style="--cor:${p.cor}">
      <span class="predio-telhado" aria-hidden="true"></span>
      <span class="predio-emoji" aria-hidden="true">${p.emoji}</span>
      <span class="predio-nome">${esc(p.nome)}</span>
      <span class="predio-desc">${esc(p.descricao || '')}</span>
      <span class="predio-n">${n} ${n === 1 ? 'atendimento' : 'atendimentos'}</span>
    </a></li>`;
  }).join('');

  const docs = recentes.map((r) => {
    const reg = obter(r.id);
    const prof = porId(r.prof);
    const doc = prof && prof.documentos.find((d) => d.id === r.doc);
    if (!reg || !doc) return '';
    return `<li><a class="cartao-item" href="#/p/${prof.id}/d/${reg.id}/${doc.id}" style="--cor:${prof.cor}">
      <span class="item-emoji" aria-hidden="true">${prof.emoji}</span>
      <span class="item-texto"><strong>${esc(doc.titulo)}</strong><small>${esc(tituloReg(prof, reg))}</small></span>
      <small class="item-data">${esc(fmtRelativo(r.em))}</small></a></li>`;
  }).filter(Boolean).slice(0, 6).join('');

  document.getElementById('app').innerHTML = `
    <section class="hero">
      <h1 tabindex="-1"><span aria-hidden="true">${esc(config.marca.avatar)}</span> ${nome ? `Olá, ${esc(nome)}! 👋` : 'Bem-vinda à cidade! 👋'}</h1>
      <p>${esc(config.escritorio)} — escolha um prédio para começar a trabalhar.</p>
      <p class="acoes">${nome ? '' : '<a class="btn btn-primario" href="#/config">✏️ Dizer meu nome</a>'}<a class="btn" href="#/relatorio">📊 Relatório da cidade</a></p>
      <ul class="estatisticas" aria-label="Seu progresso">
        <li><strong>${totalAtendimentos()}</strong> ${totalAtendimentos() === 1 ? 'atendimento' : 'atendimentos'}</li>
        <li><strong>${ganhos.length}</strong> ${ganhos.length === 1 ? 'selo' : 'selos'}</li>
      </ul>
    </section>
    <section aria-labelledby="t-predios">
      <h2 id="t-predios">Profissões</h2>
      <ul class="grade-predios">${predios}</ul>
    </section>
    <section aria-labelledby="t-recentes">
      <h2 id="t-recentes">Meus documentos recentes</h2>
      ${docs ? `<ul class="lista-itens">${docs}</ul>` : '<p class="vazio-texto">Ainda não há documentos. Atenda alguém e abra uma receita, boletim ou relatório! 📄</p>'}
    </section>
    <section aria-labelledby="t-selos">
      <h2 id="t-selos">Meu álbum de selos</h2>
      ${ganhos.length ? `<ul class="figurinhas">${[...ganhos].sort((a, b) => (getEstado().selos[b.id] || '').localeCompare(getEstado().selos[a.id] || '')).slice(0, 6).map((s) => htmlFigurinha(s, (porId(s.grupo) || { cor: '#c2185b' }).cor)).join('')}</ul>`
        : '<p class="vazio-texto">As figurinhas aparecem aqui quando você atende e cria coisas. Sem pressa! 🌈</p>'}
      <p><a class="btn" href="#/album">🌟 Abrir meu álbum completo</a></p>
    </section>`;
}

__m.paginaHome = paginaHome;
};

// ---- js/professions/index.js ----
__defs["js/professions/index.js"] = function (__m, __r) {
// Lista de profissões. Para criar uma nova: copie um arquivo desta pasta,
// importe aqui e acrescente na lista abaixo.
const medica = __r("js/professions/medica.js").default;
const veterinaria = __r("js/professions/veterinaria.js").default;
const dentista = __r("js/professions/dentista.js").default;
const advogada = __r("js/professions/advogada.js").default;
const juiza = __r("js/professions/juiza.js").default;
const professora = __r("js/professions/professora.js").default;
const chef = __r("js/professions/chef.js").default;
const detetive = __r("js/professions/detetive.js").default;
const jornalista = __r("js/professions/jornalista.js").default;
const astronauta = __r("js/professions/astronauta.js").default;
const cientista = __r("js/professions/cientista.js").default;

const PROFISSOES = [
  medica, veterinaria, dentista, advogada, juiza, professora,
  chef, detetive, jornalista, astronauta, cientista,
];

// A primeira entidade é a "principal" (ex.: Paciente); as demais pertencem a ela (ex.: Consulta).
PROFISSOES.forEach((p) => {
  p.entidades.forEach((e, i) => { e.pai = i === 0 ? null : p.entidades[0].id; });
  p.documentos = p.documentos || [];
});

const porId = (id) => PROFISSOES.find((p) => p.id === id);

__m.PROFISSOES = PROFISSOES;
__m.porId = porId;
};

// ---- js/professions/medica.js ----
__defs["js/professions/medica.js"] = function (__m, __r) {
const { txt, area, num, data, sel, chips, secao } = __r("js/core/campos.js");
const { fmtData } = __r("js/core/ui.js");

const REMEDIOS = [
  'Abraço apertado 🤗', 'Suco de risadas 🧃', 'Soneca de 20 minutos 😴', 'Dançar por 5 minutos 💃',
  'Sopa de estrelinhas ✨', 'Cantar uma música 🎵', 'Dia de filme com pipoca 🍿', 'Cócegas de leve 🪶',
];

__m.default = {
  id: 'medica',
  nome: 'Médica',
  emoji: '🩺',
  cor: '#c2185b',
  local: 'Consultório da Dra.',
  cargo: 'Dra.',
  sigla: 'CRM-BRINCA',
  saude: true,
  aviso: 'Se alguém estiver doente de verdade, chame um adulto.',
  descricao: 'Consultas, sintomas e receitas de faz de conta',
  selos: { cadastro: 'Primeiro paciente cadastrado!', atendimento: 'Primeiro paciente atendido!' },
  entidades: [
    {
      id: 'paciente', nome: 'Paciente', plural: 'Pacientes', emoji: '🧸', titulo: 'nome',
      subtitulo: (d) => [d.tipo, d.idade !== '' && d.idade != null ? `${d.idade} anos` : ''].filter(Boolean).join(' · '),
      campos: [
        txt('nome', 'Apelido do paciente', { obrigatorio: true, dica: 'Ex.: Ursinho Teddy', ajuda: 'Use apelidos, nada de sobrenome real.' }),
        num('idade', 'Idade', { min: 0, max: 120, metade: true }),
        sel('tipo', 'Tipo de paciente', ['Amiga ou amigo', 'Ursinho de pelúcia', 'Boneca', 'Bichinho de pelúcia', 'Outro'], { metade: true }),
        area('obs', 'Anotações', { dica: 'Ex.: adora abraços e sopa de letrinhas' }),
      ],
    },
    {
      id: 'consulta', nome: 'Consulta', plural: 'Consultas', emoji: '📋', f: true,
      titulo: (d) => `Consulta de ${fmtData(d.data)}`,
      subtitulo: (d) => (d.diagnostico || '').slice(0, 60),
      campos: [
        data('data', 'Data da consulta', { padrao: 'hoje', obrigatorio: true }),
        secao('Sintomas'),
        chips('sintomas', 'O que o paciente sente?', [
          'Dor de barriga', 'Dor de cabeça', 'Tosse', 'Nariz escorrendo', 'Espirros', 'Sono demais', 'Cansaço',
          'Barriguinha roncando', 'Soluço de dragão', 'Pé dormente de tanto dançar', 'Saudade do brinquedo favorito', 'Cócegas nas orelhas',
        ]),
        area('sintomasLivre', 'Outros sintomas (conte com suas palavras)', { dica: 'Ex.: o ursinho perdeu um botão do olho…' }),
        secao('Sinais'),
        num('temperatura', 'Temperatura', { unidade: '°C', passo: 0.1, min: 30, max: 45, metade: true }),
        num('batimentos', 'Batimentos', { unidade: 'por minuto', min: 20, max: 250, metade: true }),
        num('peso', 'Peso', { unidade: 'kg', passo: 0.1, min: 0, max: 300, metade: true }),
        secao('Diagnóstico e receita'),
        area('diagnostico', 'Diagnóstico de brincadeira', {
          dica: 'Ex.: excesso de fofura',
          sugestoes: ['Excesso de fofura', 'Saudade de brincar', 'Fome de brigadeiro', 'Preguiça de domingo', 'Muita imaginação'],
        }),
        chips('receita', 'Receita de faz de conta', REMEDIOS, { ajuda: 'Só itens de brincadeira! Nada de remédio de verdade.' }),
        chips('recomendacoes', 'Recomendações', [
          'Descansar bastante', 'Brincar ao ar livre', 'Comer frutas coloridas', 'Contar uma história',
          'Dar um sorriso grande', 'Lavar as mãos antes do lanche',
        ]),
        data('retorno', 'Data de retorno'),
      ],
    },
  ],
  documentos: [
    {
      id: 'receita', titulo: 'Receita de brincadeira', de: 'consulta', botao: '🖨️ Receita',
      render: (c) => `
        ${c.campo('Paciente', c.dp.nome)}
        ${c.campo('Consulta', c.data(c.d.data))}
        ${c.campo('Sintomas', [...(c.d.sintomas || []), ...(c.d.sintomasLivre ? [c.d.sintomasLivre] : [])])}
        ${c.campo('Sinais', [
          c.d.temperatura !== '' && c.d.temperatura != null ? `${c.d.temperatura} °C` : '',
          c.d.batimentos !== '' && c.d.batimentos != null ? `${c.d.batimentos} batimentos/min` : '',
          c.d.peso !== '' && c.d.peso != null ? `${c.d.peso} kg` : '',
        ].filter(Boolean))}
        ${c.bloco('Diagnóstico de brincadeira', c.d.diagnostico)}
        <section class="doc-bloco"><h4>℞ Receita de faz de conta</h4>
          ${(c.d.receita || []).length ? `<ol class="doc-receita">${c.d.receita.map((r) => `<li>${c.e(r)}</li>`).join('')}</ol>` : '<p>—</p>'}
        </section>
        ${c.d.recomendacoes && c.d.recomendacoes.length ? `<section class="doc-bloco"><h4>Recomendações</h4>${c.ul(c.d.recomendacoes)}</section>` : ''}
        ${c.campo('Retorno', c.d.retorno ? c.data(c.d.retorno) : '')}`,
    },
    {
      id: 'cartao-retorno', titulo: 'Cartão de retorno', de: 'consulta', botao: '🖨️ Cartão de retorno',
      render: (c) => `<p style="text-align:center;font-size:2.6rem;margin:.2rem">📅</p>
        <p style="text-align:center;font-size:1.25rem"><strong>${c.e(c.dp.nome || '')}</strong>, a médica quer ver você de novo!</p>
        <p style="text-align:center;font-size:1.5rem;margin:.6rem 0">${c.d.retorno ? `Volte em <strong>${c.e(c.data(c.d.retorno))}</strong>` : 'Volte sempre que quiser brincar!'}</p>
        <p style="text-align:center">Traga um sorriso e o brinquedo favorito. 🧸</p>`,
    },
    {
      id: 'ficha', titulo: 'Ficha do paciente', de: 'paciente', botao: '🖨️ Ficha do paciente',
      render: (c) => {
        const cs = c.filhos('consulta');
        return `${c.campo('Paciente', c.d.nome)}${c.campo('Idade', c.d.idade !== '' && c.d.idade != null ? `${c.d.idade} anos` : '')}${c.campo('Tipo', c.d.tipo)}${c.bloco('Anotações', c.d.obs)}
          <section class="doc-bloco"><h4>Histórico de consultas</h4>
          <table class="doc-tabela"><thead><tr><th>Data</th><th>Sintomas</th><th>Diagnóstico</th></tr></thead><tbody>
          ${cs.length ? cs.map((x) => `<tr><td>${c.e(c.data(x.dados.data))}</td><td>${c.e((x.dados.sintomas || []).join(', '))}</td><td>${c.e(x.dados.diagnostico || '')}</td></tr>`).join('') : '<tr><td colspan="3">Nenhuma consulta ainda.</td></tr>'}
          </tbody></table></section>`;
      },
    },
  ],
  sorteios: [
    { pitch: 'Ursinho Teddy perdeu um botão do olho e está muito chateado. 🧸', tipo: 'paciente', dados: { nome: 'Ursinho Teddy', idade: 5, tipo: 'Ursinho de pelúcia', obs: 'Adora abraços.' }, filhos: [{ tipo: 'consulta', dados: { sintomas: ['Saudade do brinquedo favorito'], sintomasLivre: 'Perdeu um botão do olho.', temperatura: 36.5, batimentos: 90, peso: 1.2 } }] },
    { pitch: 'A boneca Margarida está com soluço de dragão desde o café da manhã. 🐉', tipo: 'paciente', dados: { nome: 'Boneca Margarida', idade: 8, tipo: 'Boneca' }, filhos: [{ tipo: 'consulta', dados: { sintomas: ['Soluço de dragão', 'Cócegas nas orelhas'], temperatura: 36.7, batimentos: 95 } }] },
    { pitch: 'O dinossauro Beto comeu 10 brigadeiros imaginários e a barriguinha está roncando. 🦕', tipo: 'paciente', dados: { nome: 'Dino Beto', idade: 6, tipo: 'Bichinho de pelúcia' }, filhos: [{ tipo: 'consulta', dados: { sintomas: ['Barriguinha roncando', 'Sono demais'], peso: 3.4 } }] },
    { pitch: 'Vovó Lu dançou o dia inteiro e está com os pés dormentes de tanto balançar. 💃', tipo: 'paciente', dados: { nome: 'Vovó Lu', idade: 70, tipo: 'Amiga ou amigo' }, filhos: [{ tipo: 'consulta', dados: { sintomas: ['Pé dormente de tanto dançar', 'Cansaço'], temperatura: 36.4 } }] },
    { pitch: 'O coelho Pipoca está com o nariz escorrendo e muitos espirros de glitter. 🐰', tipo: 'paciente', dados: { nome: 'Coelho Pipoca', idade: 3, tipo: 'Bichinho de pelúcia' }, filhos: [{ tipo: 'consulta', dados: { sintomas: ['Nariz escorrendo', 'Espirros'], temperatura: 36.8 } }] },
    { pitch: 'A Capitã Estrela voltou da Lua com muito sono e saudade da Terra. 🌙', tipo: 'paciente', dados: { nome: 'Capitã Estrela', idade: 9, tipo: 'Boneca' }, filhos: [{ tipo: 'consulta', dados: { sintomas: ['Sono demais', 'Saudade do brinquedo favorito'], batimentos: 80 } }] },
  ],
  exemplo: [
    {
      tipo: 'paciente',
      dados: { nome: 'Ursinho Teddy', idade: 5, tipo: 'Ursinho de pelúcia', obs: 'Adora abraços.' },
      filhos: [{
        tipo: 'consulta',
        dados: {
          data: '', sintomas: ['Barriguinha roncando', 'Saudade do brinquedo favorito'], sintomasLivre: 'Perdeu um botão do olho.',
          temperatura: 36.5, batimentos: 90, peso: 1.2, diagnostico: 'Fome de brigadeiro',
          receita: ['Abraço apertado 🤗', 'Suco de risadas 🧃'], recomendacoes: ['Contar uma história'], retorno: '',
        },
      }],
    },
  ],
};


};

// ---- js/core/campos.js ----
__defs["js/core/campos.js"] = function (__m, __r) {
// Atalhos para declarar campos de formulário nas profissões.
const secao = (rotulo) => ({ tipo: 'secao', nome: 's-' + rotulo, rotulo });
const txt = (nome, rotulo, x = {}) => ({ nome, rotulo, tipo: 'text', ...x });
const area = (nome, rotulo, x = {}) => ({ nome, rotulo, tipo: 'textarea', ...x });
const num = (nome, rotulo, x = {}) => ({ nome, rotulo, tipo: 'number', ...x });
const data = (nome, rotulo, x = {}) => ({ nome, rotulo, tipo: 'date', ...x });
const hora = (nome, rotulo, x = {}) => ({ nome, rotulo, tipo: 'time', ...x });
const sel = (nome, rotulo, opcoes, x = {}) => ({ nome, rotulo, tipo: 'select', opcoes, ...x });
const chips = (nome, rotulo, sugestoes, x = {}) => ({ nome, rotulo, tipo: 'chips', sugestoes, ...x });
const emoji = (nome, rotulo, opcoes, x = {}) => ({ nome, rotulo, tipo: 'emoji', opcoes, ...x });
const ref = (nome, rotulo, entidade, x = {}) => ({ nome, rotulo, tipo: 'ref', entidade, ...x });
const refmulti = (nome, rotulo, entidade, x = {}) => ({ nome, rotulo, tipo: 'refmulti', entidade, ...x });
const itens = (nome, rotulo, entidade, x = {}) => ({ nome, rotulo, tipo: 'itens', entidade, ...x });
const odontograma = (nome, rotulo) => ({ nome, rotulo, tipo: 'odontograma' });

__m.secao = secao;
__m.txt = txt;
__m.area = area;
__m.num = num;
__m.data = data;
__m.hora = hora;
__m.sel = sel;
__m.chips = chips;
__m.emoji = emoji;
__m.ref = ref;
__m.refmulti = refmulti;
__m.itens = itens;
__m.odontograma = odontograma;
};

// ---- js/professions/veterinaria.js ----
__defs["js/professions/veterinaria.js"] = function (__m, __r) {
const { txt, area, num, data, sel, chips, emoji, secao } = __r("js/core/campos.js");
const { fmtData } = __r("js/core/ui.js");

__m.default = {
  id: 'veterinaria',
  nome: 'Veterinária',
  emoji: '🐾',
  cor: '#00796b',
  local: 'Clínica Veterinária da Dra.',
  cargo: 'Dra. Vet',
  sigla: 'VET-BRINCA',
  saude: true,
  aviso: 'Se um bichinho de verdade estiver doente, chame um adulto.',
  descricao: 'Pets, ursinhos de pelúcia e carteirinha de vacinação',
  selos: { cadastro: 'Primeiro bichinho cadastrado!', atendimento: 'Primeiro bichinho atendido!' },
  entidades: [
    {
      id: 'pet', nome: 'Pet', plural: 'Pets e pelúcias', emoji: '🐶', titulo: 'nome',
      subtitulo: (d) => [d.especie, d.tutor ? `tutor(a): ${d.tutor}` : ''].filter(Boolean).join(' · '),
      campos: [
        txt('nome', 'Nome do bichinho', { obrigatorio: true, dica: 'Ex.: Mingau' }),
        emoji('emoji', 'Carinha', ['🐱', '🐶', '🐰', '🐹', '🐦', '🧸', '🐉', '🐢', '🦄']),
        sel('especie', 'Espécie', ['Gato', 'Cachorro', 'Coelho', 'Hamster', 'Passarinho', 'Ursinho de pelúcia', 'Dragão de faz de conta', 'Outro'], { metade: true }),
        txt('tutor', 'Tutor(a) (apelido)', { metade: true, dica: 'Ex.: Vovó Lu' }),
        num('idade', 'Idade (anos)', { min: 0, max: 100, metade: true }),
        area('obs', 'Anotações', { dica: 'Ex.: adora bolinha e dormir no sol' }),
      ],
    },
    {
      id: 'consulta', nome: 'Consulta', plural: 'Consultas', emoji: '📋', f: true,
      titulo: (d) => `Consulta de ${fmtData(d.data)}`,
      subtitulo: (d) => (d.diagnostico || '').slice(0, 60),
      campos: [
        data('data', 'Data', { padrao: 'hoje', obrigatorio: true }),
        chips('sintomas', 'O que o bichinho tem?', [
          'Não quer brincar', 'Derrubou o vaso', 'Ronronando demais', 'Rabinho balançando sem parar', 'Costura soltinha (pelúcia)',
          'Latido de alegria', 'Quer colo o dia todo', 'Bigodinhos tortos',
        ]),
        area('sintomasLivre', 'Outros sintomas'),
        num('peso', 'Peso', { unidade: 'kg', passo: 0.1, min: 0, max: 300, metade: true }),
        area('diagnostico', 'Diagnóstico de brincadeira', { sugestoes: ['Muita energia', 'Saudade do dono', 'Travessura confirmada', 'Soneca atrasada'] }),
        chips('receita', 'Receita para o bichinho', [
          'Carinho na barriguinha 🐾', 'Passeio de 10 minutos 🌳', 'Petisco imaginário 🦴', 'Cama fofinha 🛏️',
          'Brincar com bolinha ⚽', 'Banho de espuma de mentirinha 🫧',
        ], { ajuda: 'Só itens de brincadeira! Nada de remédio de verdade.' }),
        data('retorno', 'Data de retorno'),
      ],
    },
    {
      id: 'vacina', nome: 'Vacina de brincadeira', plural: 'Carteirinha de vacinação', emoji: '⭐', f: true,
      titulo: 'nome', subtitulo: (d) => (d.data ? `em ${fmtData(d.data)}` : ''),
      campos: [
        txt('nome', 'Nome da vacina de faz de conta', { obrigatorio: true, sugestoes: ['Vacina do Pulo Alto', 'Vacina da Fofura', 'Vacina do Ronronar', 'Vacina da Coragem'] }),
        data('data', 'Data', { padrao: 'hoje' }),
        data('proxima', 'Próxima dose'),
      ],
    },
  ],
  documentos: [
    {
      id: 'receita', titulo: 'Receita para o bichinho', de: 'consulta', botao: '🖨️ Receita',
      render: (c) => `
        ${c.campo('Bichinho', `${c.dp.emoji || ''} ${c.dp.nome || ''}`)}
        ${c.campo('Espécie', c.dp.especie)}
        ${c.campo('Tutor(a)', c.dp.tutor)}
        ${c.campo('Consulta', c.data(c.d.data))}
        ${c.campo('Sintomas', [...(c.d.sintomas || []), ...(c.d.sintomasLivre ? [c.d.sintomasLivre] : [])])}
        ${c.campo('Peso', c.d.peso !== '' && c.d.peso != null ? `${c.d.peso} kg` : '')}
        ${c.bloco('Diagnóstico de brincadeira', c.d.diagnostico)}
        <section class="doc-bloco"><h4>℞ Receita de faz de conta</h4>
          ${(c.d.receita || []).length ? `<ol class="doc-receita">${c.d.receita.map((r) => `<li>${c.e(r)}</li>`).join('')}</ol>` : '<p>—</p>'}</section>
        ${c.campo('Retorno', c.d.retorno ? c.data(c.d.retorno) : '')}`,
    },
    {
      id: 'carteirinha', titulo: 'Carteirinha de vacinação divertida', de: 'pet', botao: '🖨️ Carteirinha',
      render: (c) => {
        const vs = c.filhos('vacina');
        return `
        <p class="doc-campo" style="font-size:1.4rem">${c.e(c.d.emoji || '🐾')} <strong>${c.e(c.d.nome)}</strong></p>
        ${c.campo('Espécie', c.d.especie)}${c.campo('Tutor(a)', c.d.tutor)}
        <table class="doc-tabela"><thead><tr><th>Vacina de brincadeira</th><th>Data</th><th>Próxima dose</th><th>Selo</th></tr></thead><tbody>
        ${vs.length ? vs.map((v) => `<tr><td>${c.e(v.dados.nome)}</td><td>${c.e(c.data(v.dados.data))}</td><td>${c.e(c.data(v.dados.proxima))}</td><td>⭐</td></tr>`).join('') : '<tr><td colspan="4">Nenhuma vacina de brincadeira ainda.</td></tr>'}
        </tbody></table>`;
      },
    },
    {
      id: 'ficha', titulo: 'Ficha do bichinho', de: 'pet', botao: '🖨️ Ficha do bichinho',
      render: (c) => {
        const cs = c.filhos('consulta');
        const vs = c.filhos('vacina');
        return `<p class="doc-campo" style="font-size:1.4rem">${c.e(c.d.emoji || '🐾')} <strong>${c.e(c.d.nome)}</strong></p>
          ${c.campo('Espécie', c.d.especie)}${c.campo('Tutor(a)', c.d.tutor)}${c.bloco('Anotações', c.d.obs)}
          <section class="doc-bloco"><h4>Consultas</h4>
          <table class="doc-tabela"><thead><tr><th>Data</th><th>Sintomas</th><th>Diagnóstico</th></tr></thead><tbody>
          ${cs.length ? cs.map((x) => `<tr><td>${c.e(c.data(x.dados.data))}</td><td>${c.e((x.dados.sintomas || []).join(', '))}</td><td>${c.e(x.dados.diagnostico || '')}</td></tr>`).join('') : '<tr><td colspan="3">Nenhuma consulta ainda.</td></tr>'}
          </tbody></table></section>
          <section class="doc-bloco"><h4>Vacinas de brincadeira</h4>${vs.length ? c.ul(vs.map((v) => `${v.dados.nome} (${c.data(v.dados.data)})`)) : '<p>—</p>'}</section>`;
      },
    },
    {
      id: 'medalha', titulo: 'Medalha de Bom Bichinho', de: 'pet', botao: '🖨️ Medalha',
      render: (c) => `<p style="text-align:center;font-size:4rem;margin:.2rem">🏅</p>
        <p style="text-align:center;font-size:1.3rem">A medalha de <strong>Bom Bichinho</strong> vai para</p>
        <p style="text-align:center;font-size:2rem;margin:.3rem 0">${c.e(c.d.emoji || '🐾')} <strong>${c.e(c.d.nome)}</strong></p>
        <p style="text-align:center">por ser muito fofo(a), corajoso(a) e ficar quietinho(a) na consulta!${c.d.tutor ? `<br>Tutor(a): ${c.e(c.d.tutor)}` : ''}</p>`,
    },
  ],
  sorteios: [
    { pitch: 'O gato Mingau derrubou o vaso e agora está com cara de inocente. 🐱', tipo: 'pet', dados: { nome: 'Mingau', emoji: '🐱', especie: 'Gato', tutor: 'Vovó Lu', idade: 3 }, filhos: [{ tipo: 'consulta', dados: { sintomas: ['Derrubou o vaso', 'Ronronando demais'], peso: 4.1 } }] },
    { pitch: 'A hamster Pipoca não quer mais brincar na rodinha. 🐹', tipo: 'pet', dados: { nome: 'Pipoca', emoji: '🐹', especie: 'Hamster', tutor: 'Lia', idade: 1 }, filhos: [{ tipo: 'consulta', dados: { sintomas: ['Não quer brincar'], peso: 0.1 } }] },
    { pitch: 'O cachorro Bolota está com latido de alegria e não para de abanar o rabinho! 🐶', tipo: 'pet', dados: { nome: 'Bolota', emoji: '🐶', especie: 'Cachorro', tutor: 'Theo', idade: 2 }, filhos: [{ tipo: 'consulta', dados: { sintomas: ['Latido de alegria', 'Rabinho balançando sem parar'], peso: 9 } }] },
    { pitch: 'O dragãozinho Fumaça está espirrando faíscas de mentirinha. 🐉', tipo: 'pet', dados: { nome: 'Fumaça', emoji: '🐉', especie: 'Dragão de faz de conta', tutor: 'Capitã Estrela', idade: 100 }, filhos: [{ tipo: 'consulta', dados: { sintomas: ['Bigodinhos tortos'], sintomasLivre: 'Espirra faíscas coloridas.' } }] },
    { pitch: 'O coelhinho de pelúcia Algodão está com a costura soltinha no bracinho. 🧸', tipo: 'pet', dados: { nome: 'Algodão', emoji: '🧸', especie: 'Ursinho de pelúcia', tutor: 'Bia', idade: 4 }, filhos: [{ tipo: 'consulta', dados: { sintomas: ['Costura soltinha (pelúcia)'], peso: 0.3 } }] },
  ],
  exemplo: [{
    tipo: 'pet',
    dados: { nome: 'Mingau', emoji: '🐱', especie: 'Gato', tutor: 'Vovó Lu', idade: 3, obs: 'Derruba vasos por esporte.' },
    filhos: [
      { tipo: 'consulta', dados: { sintomas: ['Derrubou o vaso', 'Ronronando demais'], diagnostico: 'Travessura confirmada', receita: ['Brincar com bolinha ⚽', 'Cama fofinha 🛏️'] } },
      { tipo: 'vacina', dados: { nome: 'Vacina do Ronronar' } },
    ],
  }],
};


};

// ---- js/professions/dentista.js ----
__defs["js/professions/dentista.js"] = function (__m, __r) {
const { txt, area, num, data, sel, chips, odontograma } = __r("js/core/campos.js");
const { htmlOdontograma } = __r("js/core/formulario.js");
const { fmtData } = __r("js/core/ui.js");

// Monta os 32 dentes: D({ 3: 'e' }) deixa o dente 3 "precisando de escovinha" e o resto saudável.
const D = (m) => Array.from({ length: 32 }, (_, i) => m[i + 1] || 's');

__m.default = {
  id: 'dentista',
  nome: 'Dentista',
  emoji: '🦷',
  cor: '#0277bd',
  local: 'Clínica Sorriso da Dra.',
  cargo: 'Dra.',
  sigla: 'CRO-BRINCA',
  saude: true,
  aviso: 'Se alguém estiver com dor de verdade, chame um adulto.',
  descricao: 'Odontograma clicável e atestado de coragem',
  selos: { cadastro: 'Primeiro sorriso cadastrado!', atendimento: 'Primeiro sorriso atendido!' },
  entidades: [
    {
      id: 'paciente', nome: 'Paciente', plural: 'Pacientes', emoji: '😁', titulo: 'nome',
      subtitulo: (d) => [d.tipo, d.idade !== '' && d.idade != null ? `${d.idade} anos` : ''].filter(Boolean).join(' · '),
      campos: [
        txt('nome', 'Apelido do paciente', { obrigatorio: true, dica: 'Ex.: Boneca Rosinha' }),
        num('idade', 'Idade', { min: 0, max: 120, metade: true }),
        sel('tipo', 'Tipo de paciente', ['Amiga ou amigo', 'Ursinho de pelúcia', 'Boneca', 'Dragão de faz de conta', 'Outro'], { metade: true }),
        odontograma('dentes', 'Odontograma (toque nos dentes)'),
        area('obs', 'Anotações'),
      ],
    },
    {
      id: 'consulta', nome: 'Consulta', plural: 'Consultas', emoji: '📋', f: true,
      titulo: (d) => `Consulta de ${fmtData(d.data)}`,
      subtitulo: (d) => (d.coragem ? `Coragem: ${d.coragem}` : ''),
      campos: [
        data('data', 'Data', { padrao: 'hoje', obrigatorio: true }),
        chips('motivo', 'Motivo da visita', ['Visita de rotina', 'Sorriso para a foto', 'Dentinho mole (fada do dente!)', 'Escova nova', 'Dentinho brilhando']),
        chips('plano', 'Plano de tratamento de brincadeira', [
          'Dança da escovação 🪥', 'Sorriso no espelho 😁', 'Escolher uma escova colorida 🌈', 'Conversar com a Fada do Dente 🧚', 'Contar até 10 de boca aberta 🔢',
        ], { ajuda: 'Tudo de faz de conta.' }),
        area('anotacoes', 'Anotações da dentista'),
        sel('coragem', 'Nível de coragem', ['Corajosa(o)', 'Muito corajosa(o)', 'Super-herói / super-heroína dos dentes'], { obrigatorio: true }),
        data('retorno', 'Data de retorno'),
      ],
    },
  ],
  documentos: [
    {
      id: 'atestado', titulo: 'Atestado de Coragem', de: 'consulta', botao: '🖨️ Atestado de coragem',
      render: (c) => `
        <p style="font-size:1.1rem;text-align:center;margin:1rem 0">Atesto, de brincadeira, que
          <strong>${c.e(c.dp.nome || '')}</strong> compareceu à consulta de ${c.e(c.data(c.d.data))} e foi
          <strong>${c.e((c.d.coragem || 'corajosa(o)').toLowerCase())}</strong> durante todo o atendimento! 🦷✨</p>
        <p style="text-align:center;font-size:3rem;margin:.4rem 0">🏅</p>
        ${c.d.plano && c.d.plano.length ? `<section class="doc-bloco"><h4>Plano de tratamento de brincadeira</h4>${c.ul(c.d.plano)}</section>` : ''}
        ${c.campo('Retorno', c.d.retorno ? c.data(c.d.retorno) : '')}`,
    },
    {
      id: 'ficha', titulo: 'Ficha do paciente', de: 'paciente', botao: '🖨️ Ficha e odontograma',
      render: (c) => `
        ${c.campo('Paciente', c.d.nome)}${c.campo('Idade', c.d.idade !== '' && c.d.idade != null ? `${c.d.idade} anos` : '')}${c.campo('Tipo', c.d.tipo)}
        <section class="doc-bloco"><h4>Odontograma</h4>${htmlOdontograma(c.d.dentes, false)}</section>
        ${c.bloco('Anotações', c.d.obs)}`,
    },
    {
      id: 'cartao-retorno', titulo: 'Cartão de retorno', de: 'consulta', botao: '🖨️ Cartão de retorno',
      render: (c) => `<p style="text-align:center;font-size:2.6rem;margin:.2rem">🦷</p>
        <p style="text-align:center;font-size:1.25rem"><strong>${c.e(c.dp.nome || '')}</strong>, seu próximo encontro com a Fada do Dente!</p>
        <p style="text-align:center;font-size:1.5rem;margin:.6rem 0">${c.d.retorno ? `Volte em <strong>${c.e(c.data(c.d.retorno))}</strong>` : 'Volte quando quiser exibir seu sorriso!'}</p>
        <p style="text-align:center">Não esqueça a escova e o melhor sorriso. 🪥😁</p>`,
    },
    {
      id: 'certificado-sorriso', titulo: 'Certificado Sorriso Brilhante', de: 'paciente', botao: '🖨️ Certificado de sorriso',
      render: (c) => `<p style="text-align:center;font-size:3.4rem;margin:.2rem">😁✨</p>
        <p style="text-align:center;font-size:1.2rem">Este certificado de brincadeira é entregue a</p>
        <p style="text-align:center;font-size:2rem;margin:.3rem 0"><strong>${c.e(c.d.nome)}</strong></p>
        <p style="text-align:center">pelo <strong>Sorriso Mais Brilhante</strong> da clínica! 🌟</p>`,
    },
  ],
  sorteios: [
    { pitch: 'A boneca Rosinha precisa de uma visita de rotina para o sorriso ficar brilhando. ✨', tipo: 'paciente', dados: { nome: 'Boneca Rosinha', idade: 7, tipo: 'Boneca', dentes: D({ 4: 'b', 5: 'b', 20: 'e' }) }, filhos: [{ tipo: 'consulta', dados: { motivo: ['Visita de rotina'] } }] },
    { pitch: 'O ursinho Teddy está com um dentinho mole e quer falar com a Fada do Dente. 🧚', tipo: 'paciente', dados: { nome: 'Ursinho Teddy', idade: 5, tipo: 'Ursinho de pelúcia', dentes: D({ 9: 'f', 24: 'f' }) }, filhos: [{ tipo: 'consulta', dados: { motivo: ['Dentinho mole (fada do dente!)'] } }] },
    { pitch: 'O dragão Chama vai tirar uma foto e quer um sorriso de cinema. 📸', tipo: 'paciente', dados: { nome: 'Dragão Chama', idade: 300, tipo: 'Dragão de faz de conta', dentes: D({ 1: 'e', 2: 'e', 16: 'e' }) }, filhos: [{ tipo: 'consulta', dados: { motivo: ['Sorriso para a foto'] } }] },
    { pitch: 'O vovô Beto ganhou uma escova nova colorida e quer testar. 🪥', tipo: 'paciente', dados: { nome: 'Vovô Beto', idade: 68, tipo: 'Amiga ou amigo', dentes: D({ 12: 'o', 13: 'b' }) }, filhos: [{ tipo: 'consulta', dados: { motivo: ['Escova nova'] } }] },
    { pitch: 'O leão Leo diz que seus dentes estão brilhando mais que o sol. ☀️', tipo: 'paciente', dados: { nome: 'Leão Leo', idade: 10, tipo: 'Bichinho de pelúcia', dentes: D({ 7: 'b', 8: 'b', 25: 'b', 26: 'b' }) }, filhos: [{ tipo: 'consulta', dados: { motivo: ['Dentinho brilhando'] } }] },
  ],
  exemplo: [{
    tipo: 'paciente',
    dados: { nome: 'Boneca Rosinha', idade: 7, tipo: 'Boneca', obs: 'Sorriso de estrela.' },
    filhos: [{ tipo: 'consulta', dados: { motivo: ['Visita de rotina'], plano: ['Dança da escovação 🪥'], coragem: 'Muito corajosa(o)' } }],
  }],
};


};

// ---- js/core/formulario.js ----
__defs["js/core/formulario.js"] = function (__m, __r) {
// Gera formulários, lê valores e formata dados a partir da configuração dos campos.
const { esc, hoje, fmtData, dataEstelar } = __r("js/core/ui.js");

// ---- Odontograma ----
const ESTADOS_DENTE = {
  s: ['🦷', 'saudável'],
  b: ['✨', 'brilhando'],
  e: ['🪥', 'precisa de escovinha'],
  o: ['💎', 'obturação de faz de conta'],
  f: ['🧚', 'dentinho que caiu (fada do dente!)'],
};
const CICLO = ['s', 'b', 'e', 'o', 'f'];

function htmlOdontograma(estados, interativo) {
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
function valorPadrao(c) {
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
function formatarValor(c, v, nomeDe = (x) => x) {
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

function htmlCampo(c, valor, ctx = {}) {
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

function htmlFormulario(campos, dados = {}, ctx = {}) {
  return campos.map((c) => htmlCampo(c, dados[c.nome], ctx)).join('');
}

// ---- Leitura ----
function lerFormulario(form, campos) {
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

function ligarFormulario(form) {
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

__m.htmlOdontograma = htmlOdontograma;
__m.valorPadrao = valorPadrao;
__m.formatarValor = formatarValor;
__m.htmlCampo = htmlCampo;
__m.htmlFormulario = htmlFormulario;
__m.lerFormulario = lerFormulario;
__m.ligarFormulario = ligarFormulario;
__m.ESTADOS_DENTE = ESTADOS_DENTE;
};

// ---- js/professions/advogada.js ----
__defs["js/professions/advogada.js"] = function (__m, __r) {
const { txt, area, data, hora, sel, chips } = __r("js/core/campos.js");
const { fmtData } = __r("js/core/ui.js");

__m.default = {
  id: 'advogada',
  nome: 'Advogada',
  emoji: '⚖️',
  cor: '#6a1b9a',
  local: 'Escritório de Advocacia da Dra.',
  cargo: 'Dra.',
  sigla: 'OAB-BRINCA',
  descricao: 'Clientes, casos, petições e audiências',
  selos: { cadastro: 'Primeiro cliente cadastrado!', atendimento: 'Primeiro caso aberto!' },
  entidades: [
    {
      id: 'cliente', nome: 'Cliente', plural: 'Clientes', emoji: '🧑‍💼', titulo: 'nome', subtitulo: (d) => d.tipo || '',
      campos: [
        txt('nome', 'Apelido do cliente', { obrigatorio: true, dica: 'Ex.: Dona Brigadeira' }),
        sel('tipo', 'Tipo de cliente', ['Amiga ou amigo', 'Ursinho de pelúcia', 'Bichinho', 'Boneca', 'Empresa de brigadeiro', 'Outro']),
        area('obs', 'Anotações'),
      ],
    },
    {
      id: 'caso', nome: 'Caso', plural: 'Casos', emoji: '📁', titulo: 'titulo', subtitulo: (d) => [d.autor, d.reu].filter(Boolean).join(' × '),
      campos: [
        txt('titulo', 'Título do caso', { obrigatorio: true, dica: 'Ex.: O sumiço do brigadeiro' }),
        txt('autor', 'Parte que pede (autor)', { metade: true, dica: 'Ex.: Dona Brigadeira' }),
        txt('reu', 'Parte acusada (réu)', { metade: true, dica: 'Ex.: Gato Mingau' }),
        area('fatos', 'Fatos (o que aconteceu?)', { dica: 'Ex.: o brigadeiro sumiu da bancada às três da tarde…' }),
        chips('provas', 'Provas', ['Foto do brigadeiro', 'Testemunha: o gato 🐱', 'Migalhas de chocolate', 'Pegadas de patinha', 'Bilhete misterioso']),
        area('pedido', 'O que se pede?', { sugestoes: ['Que o brigadeiro seja devolvido', 'Que seja feito um novo brigadeiro', 'Um pedido de desculpas com ronronar'] }),
      ],
    },
    {
      id: 'audiencia', nome: 'Audiência', plural: 'Agenda de audiências', emoji: '🗓️', f: true,
      titulo: (d) => `${fmtData(d.data)} ${d.hora || ''} — ${d.caso || ''}`.trim(), subtitulo: (d) => d.local || '',
      campos: [
        txt('caso', 'Qual caso?', { obrigatorio: true, dica: 'Nome do caso' }),
        data('data', 'Data', { padrao: 'hoje', obrigatorio: true, metade: true }),
        hora('hora', 'Hora', { metade: true }),
        txt('local', 'Local', { padrao: 'Sala dos Casos Fofos', dica: 'Ex.: Sala dos Casos Fofos' }),
      ],
    },
  ],
  documentos: [
    {
      id: 'peticao', titulo: 'Petição de faz de conta', de: 'caso', botao: '🖨️ Petição',
      render: (c) => `
        <p><strong>À EXCELENTÍSSIMA JUÍZA DA VARA DOS CASOS FOFOS</strong></p>
        <p style="text-align:right">Processo nº 0000-BRINCADEIRA (inventado)</p>
        <p style="margin-top:.8rem"><strong>${c.e(c.d.autor || c.dp.nome || '________')}</strong>, representado(a) pela advogada de brincadeira, vem, respeitosamente, apresentar esta petição contra
          <strong>${c.e(c.d.reu || '________')}</strong>, pelos motivos a seguir.</p>
        ${c.bloco('Dos fatos', c.d.fatos)}
        ${c.d.provas && c.d.provas.length ? `<section class="doc-bloco"><h4>Das provas</h4>${c.ul(c.d.provas)}</section>` : ''}
        ${c.bloco('Do pedido', c.d.pedido)}
        <p style="margin-top:1rem">Nestes termos, pede deferimento (e um abraço).</p>
        <p>${c.e(c.dp.nome ? 'Cliente: ' + c.dp.nome : '')}</p>`,
    },
    {
      id: 'agenda', titulo: 'Agenda de audiências', de: 'cliente', botao: '🖨️ Agenda',
      render: (c) => {
        const a = c.filhos('audiencia');
        return `<table class="doc-tabela"><thead><tr><th>Data</th><th>Hora</th><th>Caso</th><th>Local</th></tr></thead><tbody>
          ${a.length ? a.map((x) => `<tr><td>${c.e(c.data(x.dados.data))}</td><td>${c.e(x.dados.hora || '')}</td><td>${c.e(x.dados.caso)}</td><td>${c.e(x.dados.local || '')}</td></tr>`).join('') : '<tr><td colspan="4">Nenhuma audiência marcada.</td></tr>'}
          </tbody></table>`;
      },
    },
    {
      id: 'convite-audiencia', titulo: 'Convite para a audiência', de: 'audiencia', botao: '🖨️ Convite',
      render: (c) => `<p style="text-align:center;font-size:2.6rem;margin:.2rem">💌</p>
        <p style="text-align:center;font-size:1.2rem">Você está convidado(a) para a audiência do caso</p>
        <p style="text-align:center;font-size:1.5rem;margin:.3rem 0"><strong>${c.e(c.d.caso || '')}</strong></p>
        <p style="text-align:center;font-size:1.15rem">📅 ${c.e(c.data(c.d.data))}${c.d.hora ? ` às ${c.e(c.d.hora)}` : ''}<br>📍 ${c.e(c.d.local || 'Sala dos Casos Fofos')}</p>
        <p style="text-align:center">Traga suas provas e seu melhor sorriso.</p>`,
    },
    {
      id: 'contrato-amizade', titulo: 'Contrato de amizade e brincadeira', de: 'cliente', botao: '🖨️ Contrato de amizade',
      render: (c) => `<p>Pelo presente contrato de brincadeira, <strong>${c.e(c.d.nome)}</strong> e a advogada combinam que:</p>
        <ol class="doc-lista" style="font-size:1.05rem"><li>Os lanches serão divididos em partes iguais.</li><li>Segredos serão guardados a sete chaves.</li><li>Quem ganhar o jogo ajuda a guardar os brinquedos.</li><li>Pedir desculpas com um abraço resolve qualquer confusão.</li></ol>
        <div style="display:flex;gap:2rem;margin-top:1.6rem"><div style="flex:1;border-top:1.5px solid #1d1a22;padding-top:.2rem"><small>${c.e(c.d.nome)}</small></div><div style="flex:1;border-top:1.5px solid #1d1a22;padding-top:.2rem"><small>Testemunha (um ursinho)</small></div></div>`,
    },
  ],
  sorteios: [
    { pitch: 'O sumiço do brigadeiro: Dona Brigadeira acusa o gato Mingau. 🍫', tipo: 'cliente', dados: { nome: 'Dona Brigadeira', tipo: 'Empresa de brigadeiro' }, filhos: [{ tipo: 'caso', dados: { titulo: 'O sumiço do brigadeiro', autor: 'Dona Brigadeira', reu: 'Gato Mingau', fatos: 'O brigadeiro sumiu da bancada e só restaram migalhas de chocolate.', provas: ['Migalhas de chocolate', 'Pegadas de patinha'] } }] },
    { pitch: 'A bicicleta emprestada: Theo quer sua bicicleta de volta há uma semana. 🚲', tipo: 'cliente', dados: { nome: 'Theo', tipo: 'Amiga ou amigo' }, filhos: [{ tipo: 'caso', dados: { titulo: 'A bicicleta emprestada', autor: 'Theo', reu: 'Lia', fatos: 'A bicicleta foi emprestada para um passeio rápido e ainda não voltou.', provas: ['Bilhete misterioso'] } }] },
    { pitch: 'O pega-pega: quem tocou primeiro no pique? Ninguém concorda! 🏃', tipo: 'cliente', dados: { nome: 'Bia', tipo: 'Amiga ou amigo' }, filhos: [{ tipo: 'caso', dados: { titulo: 'Quem tocou primeiro no pique', autor: 'Bia', reu: 'Dudu', fatos: 'Na brincadeira de pega-pega, os dois dizem que chegaram primeiro.' } }] },
    { pitch: 'O bolo secreto: alguém contou a receita da vovó para a vizinhança inteira! 🎂', tipo: 'cliente', dados: { nome: 'Vovó Lu', tipo: 'Amiga ou amigo' }, filhos: [{ tipo: 'caso', dados: { titulo: 'A receita secreta do bolo', autor: 'Vovó Lu', reu: 'Papagaio Zeca', fatos: 'O papagaio repetiu a receita em voz alta na feira.', provas: ['Testemunha: o gato 🐱'] } }] },
    { pitch: 'O ursinho Teddy quer um quarto só para ele, mas os brinquedos não querem sair. 🧸', tipo: 'cliente', dados: { nome: 'Ursinho Teddy', tipo: 'Ursinho de pelúcia' }, filhos: [{ tipo: 'caso', dados: { titulo: 'O quarto dos brinquedos', autor: 'Ursinho Teddy', reu: 'Os brinquedos do baú', fatos: 'Todos querem dormir na cama de cima.' } }] },
  ],
  exemplo: [{
    tipo: 'cliente', dados: { nome: 'Dona Brigadeira', tipo: 'Empresa de brigadeiro' },
    filhos: [
      { tipo: 'caso', dados: { titulo: 'O sumiço do brigadeiro', autor: 'Dona Brigadeira', reu: 'Gato Mingau', fatos: 'O brigadeiro sumiu da bancada e só restaram migalhas de chocolate.', provas: ['Migalhas de chocolate', 'Pegadas de patinha'], pedido: 'Que seja feito um novo brigadeiro.' } },
      { tipo: 'audiencia', dados: { caso: 'O sumiço do brigadeiro', hora: '15:00', local: 'Sala dos Casos Fofos' } },
    ],
  }],
};


};

// ---- js/professions/juiza.js ----
__defs["js/professions/juiza.js"] = function (__m, __r) {
const { txt, area, data, sel } = __r("js/core/campos.js");
const { fmtData } = __r("js/core/ui.js");

__m.default = {
  id: 'juiza',
  nome: 'Juíza',
  emoji: '👩‍⚖️',
  cor: '#5d4037',
  local: 'Tribunal de Brincadeira da Juíza',
  cargo: 'Juíza',
  sigla: 'TJ-BRINCA',
  descricao: 'Pauta de casos, julgamento e sentença divertida',
  selos: { cadastro: 'Primeiro caso na pauta!', atendimento: 'Primeiro julgamento feito!' },
  entidades: [
    {
      id: 'caso', nome: 'Caso', plural: 'Pauta de casos', emoji: '📁', titulo: 'titulo',
      subtitulo: (d) => [d.status, d.data ? fmtData(d.data) : ''].filter(Boolean).join(' · '),
      campos: [
        txt('titulo', 'Título do caso', { obrigatorio: true, dica: 'Ex.: O gato e o vaso' }),
        txt('autor', 'Quem pede', { metade: true }),
        txt('reu', 'Quem é acusado', { metade: true }),
        area('resumo', 'Resumo do caso'),
        data('data', 'Data da audiência', { padrao: 'hoje', metade: true }),
        sel('status', 'Situação', ['Na pauta', 'Julgado'], { obrigatorio: true, metade: true }),
      ],
    },
    {
      id: 'julgamento', nome: 'Julgamento', plural: 'Julgamentos', emoji: '🔨',
      titulo: (d) => `Julgamento de ${fmtData(d.data)}`, subtitulo: (d) => (d.decisao || '').slice(0, 70),
      campos: [
        data('data', 'Data do julgamento', { padrao: 'hoje', obrigatorio: true }),
        area('relatorio', 'Relatório (o que aconteceu?)', { linhas: 4 }),
        area('fundamentos', 'Fundamentos (por que decidi assim?)', { linhas: 4, sugestoes: ['Considerando que a fofura é inocente.', 'Considerando as migalhas de chocolate encontradas.', 'Considerando que todos prometeram se desculpar.'] }),
        area('decisao', 'Decisão', { linhas: 3, sugestoes: ['O gato deverá pedir desculpas com um ronronar e ajudar a limpar o vaso (de mentirinha).', 'Todos devem dividir o brigadeiro em partes iguais.', 'Caso encerrado com um abraço coletivo.'] }),
      ],
    },
  ],
  documentos: [
    {
      id: 'sentenca', titulo: 'Sentença de brincadeira', de: 'julgamento', botao: '🖨️ Sentença',
      render: (c) => `
        ${c.campo('Caso', c.dp.titulo)}
        ${c.campo('Partes', [c.dp.autor, c.dp.reu].filter(Boolean).join(' × '))}
        ${c.campo('Data', c.data(c.d.data))}
        ${c.bloco('Relatório', c.d.relatorio)}
        ${c.bloco('Fundamentos', c.d.fundamentos)}
        ${c.bloco('Decisão', c.d.decisao)}
        <p style="margin-top:1rem"><em>Assim decido. Publique-se, registre-se e brinque-se!</em></p>`,
    },
    {
      id: 'convite-audiencia', titulo: 'Convite para a audiência', de: 'caso', botao: '🖨️ Convite',
      render: (c) => `<p style="text-align:center;font-size:2.6rem;margin:.2rem">🔔</p>
        <p style="text-align:center;font-size:1.2rem">A juíza convida as partes para a audiência do caso</p>
        <p style="text-align:center;font-size:1.5rem;margin:.3rem 0"><strong>${c.e(c.d.titulo)}</strong></p>
        <p style="text-align:center">${c.e([c.d.autor, c.d.reu].filter(Boolean).join(' × '))}</p>
        <p style="text-align:center;font-size:1.15rem">📅 ${c.e(c.data(c.d.data))}</p>
        <p style="text-align:center">Venham com calma e vontade de fazer as pazes. 🤝</p>`,
    },
    {
      id: 'ata', titulo: 'Ata do julgamento', de: 'julgamento', botao: '🖨️ Ata',
      render: (c) => `${c.campo('Caso', c.dp.titulo)}${c.campo('Partes', [c.dp.autor, c.dp.reu].filter(Boolean).join(' × '))}${c.campo('Data', c.data(c.d.data))}
        ${c.bloco('Decisão em destaque', c.d.decisao)}
        <p style="margin-top:.6rem">Todos ouviram com atenção e combinaram de fazer as pazes. 🤝</p>
        <div style="display:flex;gap:2rem;margin-top:1.6rem"><div style="flex:1;border-top:1.5px solid #1d1a22;padding-top:.2rem"><small>${c.e(c.dp.autor || 'Parte 1')}</small></div><div style="flex:1;border-top:1.5px solid #1d1a22;padding-top:.2rem"><small>${c.e(c.dp.reu || 'Parte 2')}</small></div></div>`,
    },
  ],
  sorteios: [
    { pitch: 'O gato e o vaso: o gato jura que foi o vento. 🐱', tipo: 'caso', dados: { titulo: 'O gato e o vaso', autor: 'Vovó Lu', reu: 'Gato Mingau', resumo: 'O vaso de flores apareceu no chão. O gato diz que foi o vento.', status: 'Na pauta' } },
    { pitch: 'Quem comeu o último pedaço de bolo? Duas pessoas dizem que não foram. 🍰', tipo: 'caso', dados: { titulo: 'O último pedaço de bolo', autor: 'Bia', reu: 'Theo', resumo: 'O prato ficou vazio e só sobrou um guardanapo com chocolate.', status: 'Na pauta' } },
    { pitch: 'O castelo de almofadas desabou na hora do filme. 🏰', tipo: 'caso', dados: { titulo: 'O castelo de almofadas', autor: 'Lia', reu: 'Dudu', resumo: 'O castelo caiu quando alguém passou correndo.', status: 'Na pauta' } },
    { pitch: 'A fila do escorregador: alguém furou a fila? 🛝', tipo: 'caso', dados: { titulo: 'A fila do escorregador', autor: 'Bia', reu: 'Pipoca, o coelho', resumo: 'O coelho pulou na frente de todo mundo.', status: 'Na pauta' } },
    { pitch: 'O desenho de giz na calçada foi pisado pelo cachorro. 🎨', tipo: 'caso', dados: { titulo: 'O desenho de giz', autor: 'Lia', reu: 'Cachorro Bolota', resumo: 'O desenho ficou com pegadas, mas o cachorro nega tudo.', status: 'Na pauta' } },
  ],
  exemplo: [{
    tipo: 'caso', dados: { titulo: 'O gato e o vaso', autor: 'Vovó Lu', reu: 'Gato Mingau', resumo: 'O vaso de flores apareceu no chão. O gato jura que foi o vento.', status: 'Na pauta' },
    filhos: [{ tipo: 'julgamento', dados: { relatorio: 'O vaso caiu e o gato estava por perto.', fundamentos: 'Considerando que todos prometeram se desculpar.', decisao: 'O gato deverá pedir desculpas com um ronronar.' } }],
  }],
};


};

// ---- js/professions/professora.js ----
__defs["js/professions/professora.js"] = function (__m, __r) {
const { txt, area, num, data, sel, chips, emoji, ref, refmulti } = __r("js/core/campos.js");
const { fmtData } = __r("js/core/ui.js");

const MATERIAS = ['Português', 'Matemática', 'Ciências', 'História', 'Geografia', 'Artes', 'Educação Física', 'Inglês', 'Música'];

__m.default = {
  id: 'professora',
  nome: 'Professora',
  emoji: '👩‍🏫',
  cor: '#b45309',
  local: 'Escola da Profa.',
  cargo: 'Profa.',
  sigla: 'MEC-BRINCA',
  descricao: 'Turmas, chamada, notas e boletim',
  selos: { cadastro: 'Primeira turma criada!', atendimento: 'Primeira aluna cadastrada!' },
  entidades: [
    {
      id: 'turma', nome: 'Turma', plural: 'Turmas', emoji: '🏫', f: true, titulo: 'nome', subtitulo: (d) => d.ano || '',
      campos: [
        txt('nome', 'Nome da turma', { obrigatorio: true, dica: 'Ex.: Turma das Estrelas' }),
        txt('ano', 'Ano ou série', { dica: 'Ex.: 5º ano' }),
        chips('materias', 'Matérias', MATERIAS),
      ],
    },
    {
      id: 'aluna', nome: 'Aluna', plural: 'Alunas', emoji: '🧒', f: true, titulo: 'nome',
      campos: [
        txt('nome', 'Apelido da aluna ou aluno', { obrigatorio: true, dica: 'Ex.: Lia' }),
        emoji('emoji', 'Carinha', ['🧒', '👧', '👦', '🧑', '🦸', '🧙', '🧚', '🐱']),
        area('obs', 'Anotações'),
      ],
    },
    {
      id: 'chamada', nome: 'Chamada', plural: 'Chamadas', emoji: '✅', f: true,
      titulo: (d) => `Chamada de ${fmtData(d.data)}`, subtitulo: (d) => `${(d.presentes || []).length} presentes`,
      campos: [
        data('data', 'Data', { padrao: 'hoje', obrigatorio: true }),
        refmulti('presentes', 'Quem veio hoje?', 'aluna', { semOpcoes: 'Cadastre as alunas primeiro.' }),
      ],
    },
    {
      id: 'nota', nome: 'Nota', plural: 'Notas', emoji: '📝', f: true,
      titulo: (d, nomeDe) => `${nomeDe(d.aluna)} — ${d.materia}: ${d.nota}`,
      subtitulo: (d) => d.bimestre || '',
      campos: [
        ref('aluna', 'Aluna', 'aluna', { obrigatorio: true, semOpcoes: 'Cadastre as alunas primeiro.' }),
        txt('materia', 'Matéria', { obrigatorio: true, sugestoes: MATERIAS }),
        num('nota', 'Nota (0 a 10)', { min: 0, max: 10, passo: 0.5, obrigatorio: true, metade: true }),
        sel('bimestre', 'Bimestre', ['1º bimestre', '2º bimestre', '3º bimestre', '4º bimestre'], { metade: true }),
      ],
    },
  ],
  documentos: [
    {
      id: 'boletim', titulo: 'Boletim', de: 'aluna', botao: '🖨️ Boletim',
      render: (c) => {
        const notas = c.filhos('nota', c.pai.id).filter((n) => n.dados.aluna === c.reg.id);
        const porMat = {};
        notas.forEach((n) => { (porMat[n.dados.materia] = porMat[n.dados.materia] || []).push(Number(n.dados.nota)); });
        const mats = Object.keys(porMat);
        const chamadas = c.filhos('chamada', c.pai.id);
        const presencas = chamadas.filter((x) => (x.dados.presentes || []).includes(c.reg.id)).length;
        const media = (a) => (a.reduce((s, x) => s + x, 0) / a.length);
        return `
          ${c.campo('Aluna', c.d.nome)}${c.campo('Turma', `${c.dp.nome || ''} ${c.dp.ano ? '(' + c.dp.ano + ')' : ''}`)}
          <table class="doc-tabela"><thead><tr><th>Matéria</th><th>Notas</th><th class="dir">Média</th></tr></thead><tbody>
          ${mats.length ? mats.map((m) => `<tr><td>${c.e(m)}</td><td>${porMat[m].map((x) => c.e(x)).join(' · ')}</td><td class="dir"><strong>${media(porMat[m]).toFixed(1).replace('.', ',')}</strong></td></tr>`).join('')
            : '<tr><td colspan="3">Ainda não há notas.</td></tr>'}
          </tbody></table>
          ${c.campo('Presença', chamadas.length ? `${presencas} de ${chamadas.length} aulas` : '')}
          <p style="margin-top:1rem">⭐ <em>Continue brilhando! A professora tem orgulho de você.</em></p>`;
      },
    },
    {
      id: 'lista-chamada', titulo: 'Lista de chamada', de: 'chamada', botao: '🖨️ Lista',
      render: (c) => {
        const alunas = c.filhos('aluna', c.pai.id);
        return `${c.campo('Turma', c.dp.nome)}${c.campo('Data', c.data(c.d.data))}
          <table class="doc-tabela"><thead><tr><th>Aluna</th><th>Presença</th></tr></thead><tbody>
          ${alunas.map((a) => `<tr><td>${c.e(a.dados.nome)}</td><td>${(c.d.presentes || []).includes(a.id) ? '✅ Presente' : '⬜ Faltou'}</td></tr>`).join('')}
          </tbody></table>`;
      },
    },
    {
      id: 'certificado', titulo: 'Certificado de Estrela da Turma', de: 'aluna', botao: '🖨️ Certificado',
      render: (c) => `<p style="text-align:center;font-size:3.4rem;margin:.2rem">⭐</p>
        <p style="text-align:center;font-size:1.2rem">Este certificado de brincadeira é entregue a</p>
        <p style="text-align:center;font-size:2rem;margin:.3rem 0">${c.e(c.d.emoji || '')} <strong>${c.e(c.d.nome)}</strong></p>
        <p style="text-align:center">da turma <strong>${c.e(c.dp.nome || '')}</strong>, por ser uma verdadeira <strong>Estrela da Turma</strong>! 🌟</p>`,
    },
    {
      id: 'bilhete', titulo: 'Bilhete para casa', de: 'aluna', botao: '🖨️ Bilhete para casa',
      render: (c) => `<p>Querida família de <strong>${c.e(c.d.nome)}</strong>,</p>
        <p>Hoje foi um dia muito especial na turma ${c.e(c.dp.nome || '')}. Escreva abaixo um recado da professora:</p>
        <div style="border-bottom:1.5px dotted #6b6278;height:2rem"></div><div style="border-bottom:1.5px dotted #6b6278;height:2rem"></div><div style="border-bottom:1.5px dotted #6b6278;height:2rem"></div>
        <p style="margin-top:.8rem">Com carinho, ${c.e(c.prof.cargo)} 💛</p>`,
    },
  ],
  sorteios: [
    { pitch: 'Nova turma: a Turma das Estrelas chegou animada! ⭐', tipo: 'turma', dados: { nome: 'Turma das Estrelas', ano: '5º ano', materias: ['Português', 'Matemática', 'Ciências'] }, filhos: [{ tipo: 'aluna', dados: { nome: 'Lia', emoji: '👧' } }, { tipo: 'aluna', dados: { nome: 'Theo', emoji: '👦' } }, { tipo: 'aluna', dados: { nome: 'Bia', emoji: '🧒' } }] },
    { pitch: 'Nova turma: a Turma dos Dinossauros adora aprender com fósseis! 🦖', tipo: 'turma', dados: { nome: 'Turma dos Dinossauros', ano: '4º ano', materias: ['Ciências', 'História', 'Artes'] }, filhos: [{ tipo: 'aluna', dados: { nome: 'Rex', emoji: '🦸' } }, { tipo: 'aluna', dados: { nome: 'Dudu', emoji: '👦' } }, { tipo: 'aluna', dados: { nome: 'Mia', emoji: '👧' } }] },
    { pitch: 'Nova turma: a Turma do Arco-íris tem aula de música hoje! 🌈', tipo: 'turma', dados: { nome: 'Turma do Arco-íris', ano: '6º ano', materias: ['Música', 'Português', 'Inglês'] }, filhos: [{ tipo: 'aluna', dados: { nome: 'Nina', emoji: '🧚' } }, { tipo: 'aluna', dados: { nome: 'Caio', emoji: '🧒' } }, { tipo: 'aluna', dados: { nome: 'Sol', emoji: '👧' } }] },
    { pitch: 'Nova turma: a Turma dos Super-Heróis precisa aprender frações! 🦸', tipo: 'turma', dados: { nome: 'Turma dos Super-Heróis', ano: '5º ano', materias: ['Matemática', 'Educação Física', 'Geografia'] }, filhos: [{ tipo: 'aluna', dados: { nome: 'Capitã Lu', emoji: '🦸' } }, { tipo: 'aluna', dados: { nome: 'Raio', emoji: '🧒' } }, { tipo: 'aluna', dados: { nome: 'Pipa', emoji: '👧' } }] },
  ],
  exemplo: [{
    tipo: 'turma', dados: { nome: 'Turma das Estrelas', ano: '5º ano', materias: ['Português', 'Matemática', 'Ciências'] },
    filhos: [{ tipo: 'aluna', dados: { nome: 'Lia', emoji: '👧' } }, { tipo: 'aluna', dados: { nome: 'Theo', emoji: '👦' } }],
  }],
};


};

// ---- js/professions/chef.js ----
__defs["js/professions/chef.js"] = function (__m, __r) {
const { txt, area, num, sel, emoji, itens } = __r("js/core/campos.js");
const { fmtMoeda } = __r("js/core/ui.js");

const CATEGORIAS = ['Entrada', 'Prato principal', 'Sobremesa', 'Bebida'];

__m.default = {
  id: 'chef',
  nome: 'Chef',
  emoji: '👩‍🍳',
  cor: '#c43e12',
  local: 'Restaurante da Chef',
  cargo: 'Chef',
  sigla: 'CHEF-BRINCA',
  descricao: 'Cardápio, comandas, contas e receitas',
  selos: { cadastro: 'Primeiro cardápio criado!', atendimento: 'Primeiro prato criado!' },
  entidades: [
    {
      id: 'cardapio', nome: 'Cardápio', plural: 'Cardápios', emoji: '📖', titulo: 'nome', subtitulo: (d) => d.tema || '',
      campos: [
        txt('nome', 'Nome do restaurante ou cardápio', { obrigatorio: true, dica: 'Ex.: Cantinho do Brigadeiro' }),
        txt('tema', 'Tema', { dica: 'Ex.: Festa junina de mentirinha' }),
      ],
    },
    {
      id: 'prato', nome: 'Prato', plural: 'Pratos', emoji: '🍽️', titulo: 'nome',
      subtitulo: (d) => [d.categoria, d.preco !== '' && d.preco != null ? fmtMoeda(d.preco) : ''].filter(Boolean).join(' · '),
      campos: [
        txt('nome', 'Nome do prato', { obrigatorio: true, dica: 'Ex.: Brigadeiro de colher' }),
        emoji('emoji', 'Emoji do prato', ['🍫', '🍕', '🍝', '🥗', '🍰', '🧁', '🍓', '🥞', '🍦', '🧃', '🌮', '🍪']),
        sel('categoria', 'Categoria', CATEGORIAS, { obrigatorio: true, metade: true }),
        num('preco', 'Preço (moedinhas de brincadeira)', { min: 0, max: 999, passo: 0.5, metade: true }),
        area('ingredientes', 'Ingredientes', { dica: 'Um por linha' }),
        area('modo', 'Modo de preparo', { linhas: 4 }),
      ],
    },
    {
      id: 'comanda', nome: 'Comanda', plural: 'Comandas', emoji: '🧾', f: true,
      titulo: (d) => `Mesa ${d.mesa}${d.cliente ? ' — ' + d.cliente : ''}`,
      subtitulo: (d) => `${Object.values(d.pedido || {}).reduce((s, q) => s + q, 0)} itens`,
      campos: [
        num('mesa', 'Número da mesa', { min: 1, max: 99, obrigatorio: true, metade: true }),
        txt('cliente', 'Cliente (apelido)', { metade: true }),
        itens('pedido', 'Pedido', 'prato', { semOpcoes: 'Crie alguns pratos primeiro.' }),
      ],
    },
  ],
  documentos: [
    {
      id: 'conta', titulo: 'Conta do restaurante', de: 'comanda', botao: '🖨️ Conta',
      render: (c) => {
        const linhas = Object.entries(c.d.pedido || {}).map(([id, q]) => {
          const p = c.pai && c.filhos('prato', c.pai.id).find((x) => x.id === id);
          const preco = p ? Number(p.dados.preco) || 0 : 0;
          return { nome: p ? `${p.dados.emoji || ''} ${p.dados.nome}` : '(prato apagado)', q, preco, sub: preco * q };
        });
        const total = linhas.reduce((s, l) => s + l.sub, 0);
        return `${c.campo('Mesa', c.d.mesa)}${c.campo('Cliente', c.d.cliente)}
          <table class="doc-tabela"><thead><tr><th>Item</th><th class="dir">Qtde</th><th class="dir">Preço</th><th class="dir">Subtotal</th></tr></thead><tbody>
          ${linhas.length ? linhas.map((l) => `<tr><td>${c.e(l.nome)}</td><td class="dir">${l.q}</td><td class="dir">${c.e(c.moeda(l.preco))}</td><td class="dir">${c.e(c.moeda(l.sub))}</td></tr>`).join('') : '<tr><td colspan="4">Nenhum item.</td></tr>'}
          <tr><th colspan="3" class="dir">Total (moedinhas de brincadeira)</th><th class="dir">${c.e(c.moeda(total))}</th></tr>
          </tbody></table>
          <p style="text-align:center;margin-top:1rem">Obrigada pela visita! Volte sempre 😋 (gorjeta de sorrisos aceita)</p>`;
      },
    },
    {
      id: 'receita', titulo: 'Receita culinária', de: 'prato', botao: '🖨️ Receita',
      render: (c) => `
        <p style="text-align:center;font-size:2.6rem;margin:.2rem">${c.e(c.d.emoji || '🍽️')}</p>
        <h4 style="text-align:center;margin:0 0 .6rem">${c.e(c.d.nome)}</h4>
        ${c.campo('Categoria', c.d.categoria)}
        <section class="doc-bloco"><h4>Ingredientes</h4>${c.ul((c.d.ingredientes || '').split('\n').map((x) => x.trim()).filter(Boolean))}</section>
        ${c.bloco('Modo de preparo', c.d.modo)}
        <p style="margin-top:.8rem"><em>Receita de brincadeira. Cozinhar de verdade só com um adulto por perto.</em></p>`,
    },
    {
      id: 'cardapio-doc', titulo: 'Cardápio', de: 'cardapio', botao: '🖨️ Cardápio',
      render: (c) => {
        const pratos = c.filhos('prato');
        return `<h4 style="text-align:center;font-size:1.4rem;margin:.2rem 0">${c.e(c.d.nome)}</h4>
          <p style="text-align:center">${c.e(c.d.tema || '')}</p>
          ${CATEGORIAS.map((cat) => {
            const l = pratos.filter((p) => p.dados.categoria === cat);
            return l.length ? `<section class="doc-bloco"><h4>${c.e(cat)}</h4><table class="doc-tabela"><tbody>${l.map((p) => `<tr><td>${c.e(p.dados.emoji || '')} ${c.e(p.dados.nome)}</td><td class="dir">${c.e(c.moeda(p.dados.preco))}</td></tr>`).join('')}</tbody></table></section>` : '';
          }).join('')}`;
      },
    },
    {
      id: 'selo-prato', titulo: 'Prato nota 10', de: 'prato', botao: '🖨️ Selo nota 10',
      render: (c) => `<p style="text-align:center;font-size:3.6rem;margin:.2rem">${c.e(c.d.emoji || '🍽️')}</p>
        <p style="text-align:center;font-size:1.8rem;margin:.2rem"><strong>${c.e(c.d.nome)}</strong></p>
        <p style="text-align:center;font-size:2.2rem;margin:.4rem 0">⭐⭐⭐⭐⭐ <strong>Nota 10!</strong></p>
        <p style="text-align:center">Aprovado pela chef e por todos os clientes famintos. 😋</p>`,
    },
    {
      id: 'convite', titulo: 'Convite para o restaurante', de: 'cardapio', botao: '🖨️ Convite',
      render: (c) => `<p style="text-align:center;font-size:2.6rem;margin:.2rem">🍽️🎉</p>
        <p style="text-align:center;font-size:1.2rem">Você está convidado(a) para jantar no</p>
        <p style="text-align:center;font-size:1.8rem;margin:.3rem 0"><strong>${c.e(c.d.nome)}</strong></p>
        <p style="text-align:center">${c.e(c.d.tema || '')}</p>
        <p style="text-align:center">Mesa reservada, guardanapo de pano e muita fome de alegria!</p>`,
    },
  ],
  sorteios: [
    { pitch: 'Abriu o Cantinho do Brigadeiro: doces de colher para todo mundo! 🍫', tipo: 'cardapio', dados: { nome: 'Cantinho do Brigadeiro', tema: 'Doces de mentirinha' }, filhos: [{ tipo: 'prato', dados: { nome: 'Brigadeiro de colher', emoji: '🍫', categoria: 'Sobremesa', preco: 6, ingredientes: 'Chocolate\nCarinho\nUma pitada de risada', modo: 'Misture tudo com capricho e sirva com um sorriso.' } }, { tipo: 'prato', dados: { nome: 'Suco de morango', emoji: '🍓', categoria: 'Bebida', preco: 4, ingredientes: 'Morangos\nGelo', modo: 'Bata tudo e sirva gelado.' } }] },
    { pitch: 'Abriu a Pizzaria da Lua: pizzas redondas como a lua cheia! 🌕', tipo: 'cardapio', dados: { nome: 'Pizzaria da Lua', tema: 'Pizzas espaciais' }, filhos: [{ tipo: 'prato', dados: { nome: 'Pizza Lua Cheia', emoji: '🍕', categoria: 'Prato principal', preco: 18, ingredientes: 'Massa\nQueijo\nTomate', modo: 'Abra a massa, cubra com queijo e tomate e asse com um adulto.' } }, { tipo: 'prato', dados: { nome: 'Suco de estrela', emoji: '🧃', categoria: 'Bebida', preco: 5, ingredientes: 'Maracujá\nBrilho de mentirinha', modo: 'Misture e sirva.' } }] },
    { pitch: 'Abriu a Sorveteria Polar: sorvetes para o dia mais quente! 🍦', tipo: 'cardapio', dados: { nome: 'Sorveteria Polar', tema: 'Sorvetes de pinguim' }, filhos: [{ tipo: 'prato', dados: { nome: 'Sorvete de morango', emoji: '🍦', categoria: 'Sobremesa', preco: 7, ingredientes: 'Morango\nLeite\nAçúcar', modo: 'Bata, congele e sirva em casquinha.' } }, { tipo: 'prato', dados: { nome: 'Banana split', emoji: '🍓', categoria: 'Sobremesa', preco: 9, ingredientes: 'Banana\nSorvete\nCalda', modo: 'Monte tudo no prato e capriche na calda.' } }] },
    { pitch: 'Abriu o Café das Panquecas: café da manhã o dia todo! 🥞', tipo: 'cardapio', dados: { nome: 'Café das Panquecas', tema: 'Panquecas fofas' }, filhos: [{ tipo: 'prato', dados: { nome: 'Panqueca de mel', emoji: '🥞', categoria: 'Prato principal', preco: 8, ingredientes: 'Farinha\nOvo\nLeite\nMel', modo: 'Misture, doure na frigideira com um adulto e cubra com mel.' } }, { tipo: 'prato', dados: { nome: 'Cookie gigante', emoji: '🍪', categoria: 'Sobremesa', preco: 5, ingredientes: 'Farinha\nChocolate\nManteiga', modo: 'Misture, modele e asse com um adulto.' } }] },
  ],
  exemplo: [{
    tipo: 'cardapio', dados: { nome: 'Cantinho do Brigadeiro', tema: 'Doces de mentirinha' },
    filhos: [
      { tipo: 'prato', dados: { nome: 'Brigadeiro de colher', emoji: '🍫', categoria: 'Sobremesa', preco: 6, ingredientes: 'Chocolate\nCarinho\nUma pitada de risada', modo: 'Misture tudo com muito capricho e sirva com um sorriso.' } },
      { tipo: 'prato', dados: { nome: 'Suco de morango', emoji: '🍓', categoria: 'Bebida', preco: 4, ingredientes: 'Morangos\nGelo', modo: 'Bata tudo e sirva gelado.' } },
    ],
  }],
};


};

// ---- js/professions/detetive.js ----
__defs["js/professions/detetive.js"] = function (__m, __r) {
const { txt, area, data, sel, emoji, ref } = __r("js/core/campos.js");
const { esc } = __r("js/core/ui.js");

__m.default = {
  id: 'detetive',
  nome: 'Detetive',
  emoji: '🕵️‍♀️',
  cor: '#37474f',
  local: 'Agência de Detetives',
  cargo: 'Detetive',
  sigla: 'DET-BRINCA',
  descricao: 'Casos, suspeitos, pistas e quadro de pistas',
  selos: { cadastro: 'Primeiro caso aberto!', atendimento: 'Primeiro suspeito investigado!' },
  entidades: [
    {
      id: 'caso', nome: 'Caso', plural: 'Casos', emoji: '🔍', titulo: 'titulo', subtitulo: (d) => d.status || '',
      campos: [
        txt('titulo', 'Título do caso', { obrigatorio: true, dica: 'Ex.: O mistério do brigadeiro sumido' }),
        area('resumo', 'O que aconteceu?'),
        txt('local', 'Onde foi?', { metade: true, dica: 'Ex.: Cozinha da vovó' }),
        data('data', 'Quando?', { padrao: 'hoje', metade: true }),
        sel('status', 'Situação', ['Investigando', 'Resolvido'], { obrigatorio: true }),
        ref('culpado', 'Quem foi? (cadastre os suspeitos antes)', 'suspeito', { escopo: 'proprios', semOpcoes: '(cadastre suspeitos e depois edite o caso)' }),
        area('conclusao', 'Conclusão do caso', { sugestoes: ['Foi só um mal-entendido e todos fizeram as pazes.', 'O culpado devolveu o brigadeiro e pediu desculpas.', 'Caso encerrado com um abraço!'] }),
      ],
    },
    {
      id: 'suspeito', nome: 'Suspeito', plural: 'Suspeitos', emoji: '🧐', titulo: 'nome', subtitulo: (d) => d.nivel ? `Suspeita ${d.nivel.toLowerCase()}` : '',
      campos: [
        txt('nome', 'Nome ou apelido', { obrigatorio: true, dica: 'Ex.: Gato Mingau' }),
        emoji('emoji', 'Carinha', ['🐱', '🐶', '🐭', '🦊', '🧑', '👵', '🧔', '🤖', '👻']),
        area('alibi', 'Álibi (onde estava?)', { dica: 'Ex.: estava tirando uma soneca no sofá' }),
        sel('nivel', 'Nível de suspeita', ['Baixa', 'Média', 'Alta'], { metade: true }),
      ],
    },
    {
      id: 'pista', nome: 'Pista', plural: 'Pistas', emoji: '🔎', f: true, titulo: 'descricao',
      subtitulo: (d, nomeDe) => (d.suspeito ? `aponta para ${nomeDe(d.suspeito)}` : 'pista solta'),
      campos: [
        txt('descricao', 'Descrição da pista', { obrigatorio: true, dica: 'Ex.: pegadas de patinha na farinha' }),
        emoji('emoji', 'Emoji da pista', ['🔎', '👣', '🍫', '🧤', '🗝️', '📜', '🧶', '🪶', '💡']),
        ref('suspeito', 'Aponta para quem?', 'suspeito', { semOpcoes: '(sem suspeitos ainda)' }),
      ],
    },
  ],
  paineis: {
    caso: (c) => {
      const suspeitos = c.filhos('suspeito');
      const pistas = c.filhos('pista');
      const nota = (p) => `<div class="post-it">${esc(p.dados.emoji || '🔎')} ${esc(p.dados.descricao)}</div>`;
      const colunas = suspeitos.map((s) => `<div class="quadro-col"><h3>${esc(s.dados.emoji || '🧐')} ${esc(s.dados.nome)}</h3>
        ${pistas.filter((p) => p.dados.suspeito === s.id).map(nota).join('') || '<small>Sem pistas ainda</small>'}</div>`);
      const soltas = pistas.filter((p) => !p.dados.suspeito || !suspeitos.find((s) => s.id === p.dados.suspeito));
      if (soltas.length) colunas.push(`<div class="quadro-col"><h3>🧩 Pistas soltas</h3>${soltas.map(nota).join('')}</div>`);
      return `<section aria-labelledby="t-quadro"><h2 id="t-quadro">📌 Quadro de pistas</h2>
        ${colunas.length ? `<div class="quadro">${colunas.join('')}</div>` : '<p class="vazio-texto">Cadastre suspeitos e pistas para montar o quadro.</p>'}</section>`;
    },
  },
  documentos: [
    {
      id: 'relatorio', titulo: 'Relatório final do caso', de: 'caso', botao: '🖨️ Relatório final',
      render: (c) => {
        const suspeitos = c.filhos('suspeito');
        const pistas = c.filhos('pista');
        return `
          ${c.campo('Caso', c.d.titulo)}${c.campo('Local', c.d.local)}${c.campo('Data', c.data(c.d.data))}${c.campo('Situação', c.d.status)}
          ${c.bloco('O que aconteceu', c.d.resumo)}
          <section class="doc-bloco"><h4>Suspeitos e álibis</h4>
            ${suspeitos.length ? `<table class="doc-tabela"><thead><tr><th>Suspeito</th><th>Álibi</th><th>Suspeita</th></tr></thead><tbody>${suspeitos.map((s) => `<tr><td>${c.e(s.dados.emoji || '')} ${c.e(s.dados.nome)}</td><td>${c.e(s.dados.alibi || '')}</td><td>${c.e(s.dados.nivel || '')}</td></tr>`).join('')}</tbody></table>` : '<p>—</p>'}</section>
          <section class="doc-bloco"><h4>Pistas encontradas</h4>
            ${pistas.length ? `<ul class="doc-lista">${pistas.map((p) => `<li>${c.e(p.dados.emoji || '')} ${c.e(p.dados.descricao)}${p.dados.suspeito ? ` — aponta para <strong>${c.e(c.nome(p.dados.suspeito))}</strong>` : ''}</li>`).join('')}</ul>` : '<p>—</p>'}</section>
          ${c.campo('Quem foi', c.d.culpado ? c.nome(c.d.culpado) : '')}
          ${c.bloco('Conclusão', c.d.conclusao)}`;
      },
    },
    {
      id: 'cracha', titulo: 'Crachá de detetive', de: 'caso', botao: '🖨️ Crachá de detetive',
      render: (c) => `<div style="max-width:320px;margin:.6rem auto;border:3px solid var(--cor);border-radius:18px;padding:1rem;text-align:center">
        <p style="margin:0;font-weight:700;letter-spacing:.1em;color:var(--cor)">DETETIVE DE BRINCADEIRA</p>
        <p style="font-size:3.4rem;margin:.3rem">🕵️‍♀️</p>
        <p style="font-size:1.4rem;margin:0"><strong>${c.e(c.prof.cargo)}</strong></p>
        <p style="margin:.2rem 0">Caso atual:<br><strong>${c.e(c.d.titulo)}</strong></p></div>`,
    },
    {
      id: 'ficha-suspeito', titulo: 'Ficha do suspeito', de: 'suspeito', botao: '🖨️ Ficha do suspeito',
      render: (c) => `<p style="font-size:3rem;margin:.2rem">${c.e(c.d.emoji || '🧐')}</p>
        ${c.campo('Nome', c.d.nome)}${c.campo('Caso', c.dp.titulo)}${c.campo('Nível de suspeita', c.d.nivel)}${c.bloco('Álibi', c.d.alibi)}
        <section class="doc-bloco"><h4>Pistas ligadas a este suspeito</h4>${c.ul(c.filhos('pista', c.pai.id).filter((p) => p.dados.suspeito === c.reg.id).map((p) => `${p.dados.emoji || ''} ${p.dados.descricao}`)) || '<p>—</p>'}</section>`,
    },
  ],
  sorteios: [
    { pitch: 'O mistério do brigadeiro sumido na cozinha da vovó. 🍫', tipo: 'caso', dados: { titulo: 'O mistério do brigadeiro sumido', resumo: 'O brigadeiro da panela desapareceu durante a tarde.', local: 'Cozinha da vovó', status: 'Investigando' }, filhos: [{ tipo: 'suspeito', dados: { nome: 'Gato Mingau', emoji: '🐱', alibi: 'Estava dormindo no sofá.', nivel: 'Média' } }, { tipo: 'suspeito', dados: { nome: 'Papagaio Zeca', emoji: '🤖', alibi: 'Estava cantando no quintal.', nivel: 'Baixa' } }, { tipo: 'pista', dados: { descricao: 'Pegadas de patinha na farinha', emoji: '👣' } }, { tipo: 'pista', dados: { descricao: 'Migalhas de chocolate no tapete', emoji: '🍫' } }] },
    { pitch: 'Quem escondeu os óculos da vovó? Eles estavam na cabeça dela! 👓', tipo: 'caso', dados: { titulo: 'Os óculos desaparecidos', resumo: 'A vovó procurou por toda a casa e não achou os óculos.', local: 'Sala de estar', status: 'Investigando' }, filhos: [{ tipo: 'suspeito', dados: { nome: 'Cachorro Bolota', emoji: '🐶', alibi: 'Estava no passeio.', nivel: 'Baixa' } }, { tipo: 'suspeito', dados: { nome: 'Neto Theo', emoji: '🧑', alibi: 'Estava lendo um gibi.', nivel: 'Média' } }, { tipo: 'pista', dados: { descricao: 'Uma lente brilhando no sofá', emoji: '🔎' } }] },
    { pitch: 'O sumiço do último biscoito do pote. 🍪', tipo: 'caso', dados: { titulo: 'O último biscoito', resumo: 'O pote estava cheio de manhã e à noite só tinha farelo.', local: 'Cozinha', status: 'Investigando' }, filhos: [{ tipo: 'suspeito', dados: { nome: 'Rato Queijinho', emoji: '🐭', alibi: 'Estava na casa de um amigo.', nivel: 'Média' } }, { tipo: 'suspeito', dados: { nome: 'Fantasma Fofo', emoji: '👻', alibi: 'Estava assustando a cortina.', nivel: 'Alta' } }, { tipo: 'pista', dados: { descricao: 'Farelos em fila indiana', emoji: '🪶' } }] },
    { pitch: 'Quem pintou as pegadas coloridas no corredor? 🎨', tipo: 'caso', dados: { titulo: 'As pegadas coloridas', resumo: 'Apareceram pegadas de tinta azul e rosa em todo o corredor.', local: 'Corredor da escola', status: 'Investigando' }, filhos: [{ tipo: 'suspeito', dados: { nome: 'Pintora Mia', emoji: '🧑', alibi: 'Estava na aula de artes.', nivel: 'Baixa' } }, { tipo: 'suspeito', dados: { nome: 'Gato Mingau', emoji: '🐱', alibi: 'Dormindo na mochila.', nivel: 'Média' } }, { tipo: 'pista', dados: { descricao: 'Pegadas de patinha pequena', emoji: '👣' } }] },
    { pitch: 'A chave do baú de brinquedos sumiu. 🗝️', tipo: 'caso', dados: { titulo: 'A chave do baú', resumo: 'O baú de brinquedos está trancado e ninguém acha a chave.', local: 'Quarto de brinquedos', status: 'Investigando' }, filhos: [{ tipo: 'suspeito', dados: { nome: 'Gatinho Tico', emoji: '🐱', alibi: 'Estava abraçando a Lia.', nivel: 'Baixa' } }, { tipo: 'pista', dados: { descricao: 'Um barbante com uma chave desenhada', emoji: '🗝️' } }] },
  ],
  exemplo: [{
    tipo: 'caso', dados: { titulo: 'O mistério do brigadeiro sumido', resumo: 'O brigadeiro da panela desapareceu durante a tarde.', local: 'Cozinha da vovó', status: 'Investigando' },
    filhos: [
      { tipo: 'suspeito', dados: { nome: 'Gato Mingau', emoji: '🐱', alibi: 'Estava dormindo no sofá.', nivel: 'Média' } },
      { tipo: 'pista', dados: { descricao: 'Pegadas de patinha na farinha', emoji: '👣' } },
    ],
  }],
};


};

// ---- js/professions/jornalista.js ----
__defs["js/professions/jornalista.js"] = function (__m, __r) {
const { txt, area, data, sel, emoji } = __r("js/core/campos.js");
const { fmtData } = __r("js/core/ui.js");

const EDITORIAS = ['Cidade', 'Esportes', 'Cultura', 'Ciência', 'Bichinhos', 'Culinária', 'Brincadeiras'];

__m.default = {
  id: 'jornalista',
  nome: 'Jornalista',
  emoji: '📰',
  cor: '#283593',
  local: 'Redação do Jornal',
  cargo: 'Jornalista',
  sigla: 'JORN-BRINCA',
  descricao: 'Matérias e a primeira página do seu jornal',
  selos: { cadastro: 'Primeira edição criada!', atendimento: 'Primeira matéria escrita!' },
  entidades: [
    {
      id: 'edicao', nome: 'Edição', plural: 'Edições do jornal', emoji: '🗞️', f: true, titulo: 'nome', subtitulo: (d) => (d.data ? fmtData(d.data) : ''),
      campos: [
        txt('nome', 'Nome do jornal', { obrigatorio: true, dica: 'Ex.: O Diário da Cidade' }),
        data('data', 'Data da edição', { padrao: 'hoje' }),
        txt('lema', 'Lema do jornal', { dica: 'Ex.: Notícias fofas todo dia' }),
      ],
    },
    {
      id: 'materia', nome: 'Matéria', plural: 'Matérias', emoji: '✍️', f: true, titulo: 'titulo', subtitulo: (d) => [d.editoria, d.destaque].filter(Boolean).join(' · '),
      campos: [
        txt('titulo', 'Título (manchete)', { obrigatorio: true, max: 90, dica: 'Ex.: Gato derruba vaso e jura inocência' }),
        txt('linhaFina', 'Linha fina (resumo curto)', { max: 140 }),
        area('texto', 'Texto da matéria', { linhas: 6, max: 2000 }),
        txt('cena', 'Foto desenhada com emojis', { max: 12, dica: 'Ex.: 🐱🌳☀️', ajuda: 'Monte uma cena com até 5 emojis.' }),
        sel('editoria', 'Editoria', EDITORIAS, { metade: true }),
        sel('destaque', 'Destaque', ['Matéria principal', 'Matéria secundária'], { metade: true }),
      ],
    },
  ],
  documentos: [
    {
      id: 'primeira-pagina', titulo: 'Primeira página', de: 'edicao', botao: '🖨️ Primeira página',
      render: (c) => {
        const ms = c.filhos('materia');
        const principal = ms.find((m) => m.dados.destaque === 'Matéria principal') || ms[0];
        const outras = ms.filter((m) => m !== principal);
        return `<h4 class="jornal-nome">${c.e(c.d.nome)}</h4>
          <div class="jornal-linha"><span>${c.e(c.data(c.d.data))}</span><span>${c.e(c.d.lema || '')}</span><span>Edição de brincadeira</span></div>
          ${principal ? `<div class="jornal-principal"><div class="jornal-foto" aria-hidden="true">${c.e(principal.dados.cena || '📰')}</div>
            <h4>${c.e(principal.dados.titulo)}</h4><p><em>${c.e(principal.dados.linhaFina || '')}</em></p><p>${c.par(principal.dados.texto || '')}</p></div>` : '<p>Escreva matérias para montar a página!</p>'}
          <div class="jornal-colunas">${outras.map((m) => `<article><div aria-hidden="true">${c.e(m.dados.cena || '')}</div><small>${c.e(m.dados.editoria || '')}</small>
            <h5>${c.e(m.dados.titulo)}</h5><p><em>${c.e(m.dados.linhaFina || '')}</em></p><p>${c.par(m.dados.texto || '')}</p></article>`).join('')}</div>`;
      },
    },
    {
      id: 'materia-doc', titulo: 'Matéria', de: 'materia', botao: '🖨️ Matéria',
      render: (c) => `<div class="jornal-principal"><div class="jornal-foto" aria-hidden="true">${c.e(c.d.cena || '📰')}</div>
        <h4>${c.e(c.d.titulo)}</h4><p><em>${c.e(c.d.linhaFina || '')}</em></p></div>
        <p>${c.par(c.d.texto || '')}</p>${c.campo('Editoria', c.d.editoria)}`,
    },
    {
      id: 'cartaz-extra', titulo: 'Extra! Extra!', de: 'materia', botao: '🖨️ Cartaz Extra!',
      render: (c) => `<p style="text-align:center;font-family:Georgia,serif;font-size:2.4rem;font-weight:700;margin:.2rem">EXTRA! EXTRA!</p>
        <p style="text-align:center;font-size:3.4rem;margin:.2rem">${c.e(c.d.cena || '📰')}</p>
        <p style="text-align:center;font-family:Georgia,serif;font-size:1.8rem;margin:.3rem 0"><strong>${c.e(c.d.titulo)}</strong></p>
        <p style="text-align:center"><em>${c.e(c.d.linhaFina || '')}</em></p>`,
    },
    {
      id: 'cracha-reporter', titulo: 'Crachá de repórter', de: 'edicao', botao: '🖨️ Crachá de repórter',
      render: (c) => `<div style="max-width:320px;margin:.6rem auto;border:3px solid var(--cor);border-radius:18px;padding:1rem;text-align:center">
        <p style="margin:0;font-weight:700;letter-spacing:.1em;color:var(--cor)">REPÓRTER DE BRINCADEIRA</p>
        <p style="font-size:3.4rem;margin:.3rem">📰</p>
        <p style="font-size:1.4rem;margin:0"><strong>${c.e(c.prof.cargo)}</strong></p>
        <p style="margin:.2rem 0">Jornal:<br><strong>${c.e(c.d.nome)}</strong></p></div>`,
    },
  ],
  sorteios: [
    { pitch: 'Primeira página: o gato derrubou o vaso, o bairro inteiro quer saber! 🐱', tipo: 'edicao', dados: { nome: 'O Diário da Cidade', lema: 'Notícias fofas todo dia' }, filhos: [{ tipo: 'materia', dados: { titulo: 'Gato derruba vaso e jura inocência', linhaFina: 'Testemunhas viram apenas um rabinho balançando.', cena: '🐱🌷', editoria: 'Bichinhos', destaque: 'Matéria principal' } }] },
    { pitch: 'Primeira página: o festival do brigadeiro bateu recorde! 🍫', tipo: 'edicao', dados: { nome: 'Gazeta Doce', lema: 'Doce de ler' }, filhos: [{ tipo: 'materia', dados: { titulo: 'Festival do brigadeiro bate recorde', linhaFina: 'Foram mais de mil colheres de alegria.', cena: '🍫🎉', editoria: 'Culinária', destaque: 'Matéria principal' } }] },
    { pitch: 'Primeira página: o time da escola ganhou o campeonato de pega-pega! 🏃', tipo: 'edicao', dados: { nome: 'Jornal da Escola', lema: 'Tudo que acontece no recreio' }, filhos: [{ tipo: 'materia', dados: { titulo: 'Time do 5º ano vence o grande pega-pega', linhaFina: 'A torcida pulou de alegria.', cena: '🏃🏆', editoria: 'Esportes', destaque: 'Matéria principal' } }] },
    { pitch: 'Primeira página: um foguete de papelão chegou à Lua do quintal! 🚀', tipo: 'edicao', dados: { nome: 'Folha Espacial', lema: 'Notícias de outro mundo' }, filhos: [{ tipo: 'materia', dados: { titulo: 'Foguete de papelão aterrissa no quintal', linhaFina: 'A tripulação voltou com sorrisos e muitas histórias.', cena: '🚀🌙', editoria: 'Ciência', destaque: 'Matéria principal' } }] },
  ],
  exemplo: [{
    tipo: 'edicao', dados: { nome: 'O Diário da Cidade', lema: 'Notícias fofas todo dia' },
    filhos: [
      { tipo: 'materia', dados: { titulo: 'Gato derruba vaso e jura inocência', linhaFina: 'Testemunhas viram apenas um rabinho balançando.', texto: 'Na tarde de ontem, um vaso de flores foi ao chão. O gato nega tudo.', cena: '🐱🌷', editoria: 'Bichinhos', destaque: 'Matéria principal' } },
      { tipo: 'materia', dados: { titulo: 'Festival do brigadeiro bate recorde', linhaFina: 'Foram mais de mil colheres de alegria.', texto: 'A festa foi um sucesso e ninguém saiu sem sorriso.', cena: '🍫🎉', editoria: 'Culinária', destaque: 'Matéria secundária' } },
    ],
  }],
};


};

// ---- js/professions/astronauta.js ----
__defs["js/professions/astronauta.js"] = function (__m, __r) {
const { txt, area, data, sel, chips, emoji } = __r("js/core/campos.js");

__m.default = {
  id: 'astronauta',
  nome: 'Astronauta',
  emoji: '🚀',
  cor: '#4527a0',
  local: 'Agência Espacial da Astronauta',
  cargo: 'Astronauta',
  sigla: 'AEB-BRINCA',
  descricao: 'Missões, tripulação e diário de bordo',
  selos: { cadastro: 'Primeira missão criada!', atendimento: 'Primeiro tripulante a bordo!' },
  entidades: [
    {
      id: 'missao', nome: 'Missão', plural: 'Missões', emoji: '🛰️', f: true, titulo: 'nome', subtitulo: (d) => d.destino || '',
      campos: [
        txt('nome', 'Nome da missão', { obrigatorio: true, dica: 'Ex.: Missão Estrela Cintilante' }),
        sel('destino', 'Destino', ['Lua', 'Marte', 'Saturno', 'Estrela Cintilante', 'Planeta de Brigadeiro', 'Galáxia dos Sorrisos'], { metade: true }),
        txt('nave', 'Nome da nave', { metade: true, dica: 'Ex.: Foguete Arco-íris' }),
        data('lancamento', 'Data de lançamento', { padrao: 'hoje' }),
        area('objetivo', 'Objetivo da missão'),
      ],
    },
    {
      id: 'tripulante', nome: 'Tripulante', plural: 'Tripulação', emoji: '🧑‍🚀', titulo: 'nome', subtitulo: (d) => d.funcao || '',
      campos: [
        txt('nome', 'Nome ou apelido', { obrigatorio: true }),
        emoji('emoji', 'Carinha', ['🧑‍🚀', '👩‍🚀', '👨‍🚀', '🐱', '🐶', '🤖', '👽', '🧸']),
        sel('funcao', 'Função', ['Comandante', 'Piloto', 'Engenheira', 'Cientista', 'Cozinheira espacial', 'Mascote'], { metade: true }),
      ],
    },
    {
      id: 'diario', nome: 'Registro do diário', plural: 'Diário de bordo', emoji: '📓', titulo: (d) => `Data estelar ${d.dataEstelar}`, subtitulo: (d) => (d.texto || '').slice(0, 70),
      campos: [
        txt('dataEstelar', 'Data estelar', { padrao: 'estelar', obrigatorio: true, ajuda: 'Gerada pela data de hoje. Pode inventar a sua!' }),
        chips('humor', 'Como está a tripulação?', ['😄 Animada', '🤩 Maravilhada', '😴 Sonolenta', '🍫 Com fome de doce', '🤗 Cheia de saudade']),
        area('texto', 'Diário de bordo', { linhas: 5, dica: 'O que aconteceu hoje no espaço?' }),
        chips('descobertas', 'Descobertas', ['Cometa de açúcar', 'Planeta que ri', 'Estrela com nome novo', 'Alienígena simpático', 'Chuva de meteoros colorida']),
      ],
    },
  ],
  documentos: [
    {
      id: 'diario-bordo', titulo: 'Diário de bordo', de: 'missao', botao: '🖨️ Diário de bordo',
      render: (c) => {
        const trip = c.filhos('tripulante');
        const regs = c.filhos('diario');
        return `${c.campo('Missão', c.d.nome)}${c.campo('Nave', c.d.nave)}${c.campo('Destino', c.d.destino)}${c.campo('Lançamento', c.data(c.d.lancamento))}
          ${c.bloco('Objetivo', c.d.objetivo)}
          <section class="doc-bloco"><h4>Tripulação</h4>${c.ul(trip.map((t) => `${t.dados.emoji || ''} ${t.dados.nome}${t.dados.funcao ? ' — ' + t.dados.funcao : ''}`))}</section>
          <section class="doc-bloco"><h4>Registros</h4>${regs.length ? regs.map((r) => `<div style="margin:.5rem 0;padding-bottom:.4rem;border-bottom:1px dotted #b9b0c4">
            <strong>Data estelar ${c.e(r.dados.dataEstelar)}</strong>${(r.dados.humor || []).length ? ` · ${c.e(r.dados.humor.join(', '))}` : ''}
            <p style="margin:.2rem 0">${c.par(r.dados.texto || '')}</p>${(r.dados.descobertas || []).length ? `<small>Descobertas: ${c.e(r.dados.descobertas.join(', '))}</small>` : ''}</div>`).join('') : '<p>—</p>'}</section>`;
      },
    },
    {
      id: 'certificado', titulo: 'Certificado de missão cumprida', de: 'missao', botao: '🖨️ Certificado',
      render: (c) => `<p style="text-align:center;font-size:3.4rem;margin:.2rem">🚀🌟</p>
        <p style="text-align:center;font-size:1.2rem">Este certificado de brincadeira comemora a</p>
        <p style="text-align:center;font-size:1.8rem;margin:.3rem 0"><strong>${c.e(c.d.nome)}</strong></p>
        <p style="text-align:center">rumo a ${c.e(c.d.destino || 'um lugar incrível')}${c.d.nave ? ` a bordo do ${c.e(c.d.nave)}` : ''}. Missão cumprida com muita coragem!</p>`,
    },
    {
      id: 'embarque', titulo: 'Cartão de embarque espacial', de: 'tripulante', botao: '🖨️ Cartão de embarque',
      render: (c) => `<div style="max-width:420px;margin:.6rem auto;border:3px dashed var(--cor);border-radius:18px;padding:1rem">
        <p style="margin:0;font-weight:700;letter-spacing:.1em;color:var(--cor)">EMBARQUE ESPACIAL</p>
        <p style="font-size:1.6rem;margin:.3rem 0">${c.e(c.d.emoji || '🧑‍🚀')} <strong>${c.e(c.d.nome)}</strong></p>
        ${c.campo('Função', c.d.funcao)}${c.campo('Missão', c.dp.nome)}${c.campo('Nave', c.dp.nave)}${c.campo('Destino', c.dp.destino)}</div>`,
    },
  ],
  sorteios: [
    { pitch: 'Missão Estrela Cintilante: descobrir de onde vêm as estrelas cadentes. ⭐', tipo: 'missao', dados: { nome: 'Missão Estrela Cintilante', destino: 'Estrela Cintilante', nave: 'Foguete Arco-íris', objetivo: 'Descobrir de onde vêm as estrelas cadentes.' }, filhos: [{ tipo: 'tripulante', dados: { nome: 'Capitã Lia', emoji: '👩‍🚀', funcao: 'Comandante' } }, { tipo: 'tripulante', dados: { nome: 'Gato Astro', emoji: '🐱', funcao: 'Mascote' } }] },
    { pitch: 'Missão Planeta de Brigadeiro: provar uma colher de espaço! 🍫', tipo: 'missao', dados: { nome: 'Missão Planeta de Brigadeiro', destino: 'Planeta de Brigadeiro', nave: 'Foguete Colher', objetivo: 'Descobrir se o planeta é mesmo doce.' }, filhos: [{ tipo: 'tripulante', dados: { nome: 'Chef Teo', emoji: '🧑‍🚀', funcao: 'Cozinheira espacial' } }, { tipo: 'tripulante', dados: { nome: 'Robô Beep', emoji: '🤖', funcao: 'Engenheira' } }] },
    { pitch: 'Missão Lua: plantar uma bandeira de sorrisos. 🌙', tipo: 'missao', dados: { nome: 'Missão Lua', destino: 'Lua', nave: 'Nave Lunar', objetivo: 'Plantar uma bandeira de sorrisos na Lua.' }, filhos: [{ tipo: 'tripulante', dados: { nome: 'Piloto Dudu', emoji: '👨‍🚀', funcao: 'Piloto' } }, { tipo: 'tripulante', dados: { nome: 'Dra. Mia', emoji: '👩‍🚀', funcao: 'Cientista' } }] },
    { pitch: 'Missão Saturno: contar quantos anéis o planeta tem. 🪐', tipo: 'missao', dados: { nome: 'Missão Saturno', destino: 'Saturno', nave: 'Foguete Anelzinho', objetivo: 'Contar os anéis e fazer um desenho.' }, filhos: [{ tipo: 'tripulante', dados: { nome: 'Capitão Raio', emoji: '🧑‍🚀', funcao: 'Comandante' } }, { tipo: 'tripulante', dados: { nome: 'Alien Gui', emoji: '👽', funcao: 'Mascote' } }] },
  ],
  exemplo: [{
    tipo: 'missao', dados: { nome: 'Missão Estrela Cintilante', destino: 'Estrela Cintilante', nave: 'Foguete Arco-íris', objetivo: 'Descobrir de onde vêm as estrelas cadentes.' },
    filhos: [
      { tipo: 'tripulante', dados: { nome: 'Capitã Lia', emoji: '👩‍🚀', funcao: 'Comandante' } },
      { tipo: 'diario', dados: { humor: ['🤩 Maravilhada'], texto: 'Hoje vimos um cometa feito de açúcar!', descobertas: ['Cometa de açúcar'] } },
    ],
  }],
};


};

// ---- js/professions/cientista.js ----
__defs["js/professions/cientista.js"] = function (__m, __r) {
const { txt, area, data, sel, chips } = __r("js/core/campos.js");
const { fmtData } = __r("js/core/ui.js");

__m.default = {
  id: 'cientista',
  nome: 'Cientista',
  emoji: '🔬',
  cor: '#2e7d32',
  local: 'Laboratório da Dra.',
  cargo: 'Cientista',
  sigla: 'CIEN-BRINCA',
  aviso: 'Experimentos de verdade só com um adulto por perto.',
  descricao: 'Experimentos, observações e relatório científico',
  selos: { cadastro: 'Primeiro experimento criado!', atendimento: 'Primeira observação anotada!' },
  entidades: [
    {
      id: 'experimento', nome: 'Experimento', plural: 'Experimentos', emoji: '🧪', titulo: 'titulo', subtitulo: (d) => d.resultado ? `Resultado: ${d.resultado}` : '',
      campos: [
        txt('titulo', 'Título do experimento', { obrigatorio: true, dica: 'Ex.: Será que a planta gosta de música?' }),
        area('hipotese', 'Hipótese (o que você acha que vai acontecer?)'),
        chips('materiais', 'Materiais', ['Lupa', 'Papel colorido', 'Copo transparente', 'Régua', 'Massinha', 'Balão', 'Sementes', 'Caderno de anotações']),
        sel('resultado', 'Deu certo?', ['Deu certo!', 'Deu mais ou menos', 'Não deu como esperado — e aprendi algo!'], { metade: true }),
        area('conclusao', 'Conclusão', { sugestoes: ['A hipótese estava certa!', 'Descobri que preciso testar de novo.', 'Aprendi algo que não esperava!'] }),
      ],
    },
    {
      id: 'observacao', nome: 'Observação', plural: 'Observações', emoji: '👀', f: true, titulo: (d) => `Observação de ${fmtData(d.data)}`, subtitulo: (d) => (d.texto || '').slice(0, 70),
      campos: [
        data('data', 'Data', { padrao: 'hoje', obrigatorio: true }),
        area('texto', 'O que você observou?', { obrigatorio: true, linhas: 4 }),
      ],
    },
  ],
  documentos: [
    {
      id: 'relatorio', titulo: 'Relatório científico', de: 'experimento', botao: '🖨️ Relatório',
      render: (c) => {
        const obs = c.filhos('observacao');
        return `${c.campo('Experimento', c.d.titulo)}
          ${c.bloco('Hipótese', c.d.hipotese)}
          ${c.d.materiais && c.d.materiais.length ? `<section class="doc-bloco"><h4>Materiais</h4>${c.ul(c.d.materiais)}</section>` : ''}
          <section class="doc-bloco"><h4>Observações</h4>${obs.length ? `<ol class="doc-lista">${obs.map((o) => `<li><strong>${c.e(c.data(o.dados.data))}:</strong> ${c.e(o.dados.texto)}</li>`).join('')}</ol>` : '<p>—</p>'}</section>
          ${c.campo('Resultado', c.d.resultado)}
          ${c.bloco('Conclusão', c.d.conclusao)}`;
      },
    },
    {
      id: 'cartaz', titulo: 'Cartaz da feira de ciências', de: 'experimento', botao: '🖨️ Cartaz da feira',
      render: (c) => `<p style="text-align:center;font-size:3rem;margin:.2rem">🔬</p>
        <p style="text-align:center;font-size:1.7rem;margin:.2rem"><strong>${c.e(c.d.titulo)}</strong></p>
        ${c.bloco('Minha hipótese', c.d.hipotese)}
        ${c.d.materiais && c.d.materiais.length ? `<section class="doc-bloco"><h4>Materiais</h4>${c.ul(c.d.materiais)}</section>` : ''}
        ${c.campo('Resultado', c.d.resultado)}${c.bloco('O que descobri', c.d.conclusao)}`,
    },
    {
      id: 'certificado', titulo: 'Certificado de Cientista Curiosa', de: 'experimento', botao: '🖨️ Certificado',
      render: (c) => `<p style="text-align:center;font-size:3.4rem;margin:.2rem">🧪🌟</p>
        <p style="text-align:center;font-size:1.2rem">Este certificado de brincadeira é entregue a quem fez o experimento</p>
        <p style="text-align:center;font-size:1.8rem;margin:.3rem 0"><strong>${c.e(c.d.titulo)}</strong></p>
        <p style="text-align:center">com curiosidade, paciência e muitas anotações! 📓</p>`,
    },
  ],
  sorteios: [
    { pitch: 'Será que a planta gosta de música? 🌱', tipo: 'experimento', dados: { titulo: 'Será que a planta gosta de música?', hipotese: 'Acho que a plantinha vai crescer mais feliz ouvindo música.', materiais: ['Sementes', 'Caderno de anotações'] } },
    { pitch: 'Qual objeto flutua e qual afunda na água? 💧', tipo: 'experimento', dados: { titulo: 'Flutua ou afunda?', hipotese: 'Acho que coisas leves flutuam e pesadas afundam.', materiais: ['Copo transparente', 'Caderno de anotações'] } },
    { pitch: 'O balão consegue ficar grudado na parede esfregando no cabelo? 🎈', tipo: 'experimento', dados: { titulo: 'O balão grudento', hipotese: 'Acho que o balão vai grudar na parede por alguns segundos.', materiais: ['Balão', 'Caderno de anotações'] } },
    { pitch: 'O que a lupa mostra de perto numa folha? 🔍', tipo: 'experimento', dados: { titulo: 'A folha de perto', hipotese: 'Acho que a folha tem muitos desenhos escondidos.', materiais: ['Lupa', 'Papel colorido', 'Caderno de anotações'] } },
    { pitch: 'A sombra muda de tamanho durante o dia? ☀️', tipo: 'experimento', dados: { titulo: 'A sombra que cresce', hipotese: 'Acho que a sombra é maior de manhã e à tarde.', materiais: ['Régua', 'Caderno de anotações'] } },
  ],
  exemplo: [{
    tipo: 'experimento', dados: { titulo: 'Será que a planta gosta de música?', hipotese: 'Acho que a plantinha vai crescer mais feliz ouvindo música.', materiais: ['Sementes', 'Caderno de anotações'] },
    filhos: [{ tipo: 'observacao', dados: { texto: 'A sementinha ainda está dormindo.' } }],
  }],
};


};

// ---- js/core/entidades.js ----
__defs["js/core/entidades.js"] = function (__m, __r) {
// CRUD genérico de registros: { id, prof, tipo, pai?, criadoEm, atualizadoEm, dados }
const { getEstado, salvar } = __r("js/core/storage.js");

const agora = () => new Date().toISOString();
const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function listar(prof, tipo, pai) {
  return getEstado().registros.filter(
    (r) => r.prof === prof && r.tipo === tipo && (pai === undefined || r.pai === pai)
  );
}

function obter(id) {
  return getEstado().registros.find((r) => r.id === id) || null;
}

function maisRecentes(a, b) {
  return (b.atualizadoEm || '').localeCompare(a.atualizadoEm || '');
}

function criar(prof, tipo, dados, pai) {
  const reg = { id: novoId(), prof, tipo, criadoEm: agora(), atualizadoEm: agora(), dados };
  if (pai) reg.pai = pai;
  getEstado().registros.push(reg);
  salvar();
  return reg;
}

function atualizar(id, dados) {
  const reg = obter(id);
  if (!reg) return null;
  reg.dados = dados;
  reg.atualizadoEm = agora();
  salvar();
  return reg;
}

// Apaga o registro e tudo que depende dele (filhos).
function apagar(id) {
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

function contar(prof, tipo) {
  return listar(prof, tipo).length;
}

function registrarRecente(prof, id, doc) {
  const e = getEstado();
  e.recentes = e.recentes.filter((x) => !(x.id === id && x.doc === doc));
  e.recentes.unshift({ prof, id, doc, em: agora() });
  e.recentes = e.recentes.slice(0, 12);
  salvar();
}

function contarDocumento(prof) {
  const c = getEstado().contadores.documentos;
  c[prof] = (c[prof] || 0) + 1;
  salvar();
}

__m.listar = listar;
__m.obter = obter;
__m.maisRecentes = maisRecentes;
__m.criar = criar;
__m.atualizar = atualizar;
__m.apagar = apagar;
__m.contar = contar;
__m.registrarRecente = registrarRecente;
__m.contarDocumento = contarDocumento;
};

// ---- js/core/modelo.js ----
__defs["js/core/modelo.js"] = function (__m, __r) {
// Ponte entre registros e configuração das profissões (títulos, contexto de documentos).
const { obter, listar } = __r("js/core/entidades.js");
const { porId } = __r("js/professions/index.js");
const { esc, par, fmtData, fmtMoeda } = __r("js/core/ui.js");

function entidadeDe(prof, tipo) {
  return prof.entidades.find((e) => e.id === tipo);
}

function nomeDe(id) {
  const r = obter(id);
  if (!r) return '(apagado)';
  const p = porId(r.prof);
  return p ? tituloReg(p, r) : '(?)';
}

function tituloReg(prof, reg) {
  const en = entidadeDe(prof, reg.tipo);
  if (!en) return '(?)';
  const t = en.titulo;
  const s = typeof t === 'function' ? t(reg.dados, nomeDe) : reg.dados[t];
  return s || en.nome;
}

function subtituloReg(prof, reg) {
  const en = entidadeDe(prof, reg.tipo);
  return en && en.subtitulo ? en.subtitulo(reg.dados, nomeDe) || '' : '';
}

const porData = (a, b) => String(a.dados.data || a.criadoEm).localeCompare(String(b.dados.data || b.criadoEm));

// Contexto entregue aos modelos de documento. Os modelos devem usar ctx.e() / ctx.par()
// (ou os helpers abaixo) para qualquer texto digitado.
function criarCtx(prof, reg) {
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

__m.entidadeDe = entidadeDe;
__m.nomeDe = nomeDe;
__m.tituloReg = tituloReg;
__m.subtituloReg = subtituloReg;
__m.criarCtx = criarCtx;
};

// ---- js/core/selos.js ----
__defs["js/core/selos.js"] = function (__m, __r) {
// Selos de incentivo (sem ranking, sem pressão): calculados a partir dos registros.
const { getEstado, salvar } = __r("js/core/storage.js");
const { listar } = __r("js/core/entidades.js");
const { PROFISSOES } = __r("js/professions/index.js");
const { toast } = __r("js/core/ui.js");
const { confete } = __r("js/core/confete.js");
const { tocar } = __r("js/core/som.js");

const FRASES = [
  'Que trabalho lindo! ✨', 'Você está arrasando! 🌟', 'Mais um caso resolvido com carinho! 💖',
  'Que capricho! 👏', 'Muito bem! Continue brincando! 🎈', 'Seu escritório está cada vez melhor! 🏙️',
];
const incentivo = () => FRASES[Math.floor(Math.random() * FRASES.length)];

function atendimentos(p) {
  const tipo = p.entidades[1] && p.entidades[1].id;
  return tipo ? listar(p.id, tipo).length : 0;
}

function totalAtendimentos() {
  return PROFISSOES.reduce((s, p) => s + atendimentos(p), 0);
}

function todosSelos() {
  const e = getEstado();
  const lista = [];
  for (const p of PROFISSOES) {
    const raiz = p.entidades[0];
    const at = atendimentos(p);
    const docs = e.contadores.documentos[p.id] || 0;
    const t = p.selos || {};
    lista.push(
      { grupo: p.id, id: `${p.id}-cadastro`, emoji: p.emoji, titulo: t.cadastro || `Primeiro cadastro em ${p.nome}!`, ok: listar(p.id, raiz.id).length >= 1 },
      { grupo: p.id, id: `${p.id}-atendimento`, emoji: '🌟', titulo: t.atendimento || `Primeiro atendimento em ${p.nome}!`, ok: at >= 1 },
      { grupo: p.id, id: `${p.id}-cinco`, emoji: '🏅', titulo: `5 atendimentos em ${p.nome}!`, ok: at >= 5 },
      { grupo: p.id, id: `${p.id}-documento`, emoji: '🖨️', titulo: `Primeiro documento impresso (${p.nome})!`, ok: docs >= 1 },
    );
  }
  const exploradas = PROFISSOES.filter((p) => listar(p.id, p.entidades[0].id).length > 0).length;
  const total = totalAtendimentos();
  lista.push(
    { grupo: 'geral', id: 'g-10', emoji: '🎉', titulo: '10 atendimentos na cidade!', ok: total >= 10 },
    { grupo: 'geral', id: 'g-3prof', emoji: '🏙️', titulo: 'Cidade movimentada: 3 profissões!', ok: exploradas >= 3 },
    { grupo: 'geral', id: 'g-6prof', emoji: '🌈', titulo: 'Super cidade: 6 profissões!', ok: exploradas >= 6 },
  );
  return lista;
}

// Concede selos novos e avisa. Chamar depois de salvar/imprimir.
function verificarSelos() {
  const e = getEstado();
  const novos = todosSelos().filter((s) => s.ok && !e.selos[s.id]);
  if (!novos.length) return [];
  novos.forEach((s) => { e.selos[s.id] = new Date().toISOString(); });
  salvar();
  novos.forEach((s, i) => setTimeout(() => toast(`${s.emoji} Figurinha nova: ${s.titulo}`, 5000), i * 600));
  confete();
  tocar('selo');
  return novos;
}

__m.totalAtendimentos = totalAtendimentos;
__m.todosSelos = todosSelos;
__m.verificarSelos = verificarSelos;
__m.incentivo = incentivo;
};

// ---- js/core/confete.js ----
__defs["js/core/confete.js"] = function (__m, __r) {
// Chuva de confete curtinha (some sozinha; não roda se a pessoa pediu menos movimento).
const CORES = ['#c2185b', '#7b1fa2', '#1565c0', '#2e7d32', '#f9a825', '#ef6c00'];
const FORMAS = ['⭐', '🎉', '✨', '💖', '🌈', '🎈'];

function confete(qtd = 36) {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  } catch (e) { /* segue */ }
  const area = document.createElement('div');
  area.className = 'confete';
  area.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < qtd; i++) {
    const p = document.createElement('span');
    const emoji = i % 3 === 0;
    p.textContent = emoji ? FORMAS[i % FORMAS.length] : '';
    if (!emoji) p.style.background = CORES[i % CORES.length];
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDelay = Math.random() * 0.6 + 's';
    p.style.animationDuration = 1.8 + Math.random() * 1.4 + 's';
    p.style.setProperty('--giro', Math.round(Math.random() * 720 - 360) + 'deg');
    area.appendChild(p);
  }
  document.body.appendChild(area);
  setTimeout(() => area.remove(), 3800);
}

__m.confete = confete;
};

// ---- js/core/som.js ----
__defs["js/core/som.js"] = function (__m, __r) {
// Sons suaves gerados no próprio aparelho (Web Audio, sem arquivos). Desligados por padrão.
const { getEstado } = __r("js/core/storage.js");

let ctx = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => { /* sem gesto do usuário: segue em silêncio */ });
  return ctx;
}

// Uma notinha curta com entrada e saída suaves (volume baixinho).
function nota(freq, inicio, dur, { tipo = 'sine', vol = 0.05, ate = null } = {}) {
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime + inicio;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, t0);
  if (ate) osc.frequency.exponentialRampToValueAtTime(ate, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

const SONS = {
  salvar: () => { nota(660, 0, 0.12); nota(880, 0.09, 0.2); },
  sino: () => { nota(988, 0, 0.5, { tipo: 'triangle' }); nota(1319, 0.2, 0.6, { tipo: 'triangle' }); },
  selo: () => [523, 659, 784, 1047].forEach((f, i) => nota(f, i * 0.1, 0.25, { tipo: 'triangle', vol: 0.055 })),
  carimbo: () => nota(150, 0, 0.18, { tipo: 'sine', vol: 0.12, ate: 55 }),
  sorteio: () => [0, 1, 2, 3, 4].forEach((i) => nota(500 + Math.random() * 500, i * 0.07, 0.06, { tipo: 'triangle', vol: 0.03 })),
};

const NOMES_SONS = Object.keys(SONS);

// `forcar` toca mesmo com os sons desligados (usado no botão "Testar sons").
function tocar(nome, forcar = false) {
  if (!forcar && !getEstado().config.sons) return;
  try { if (SONS[nome]) SONS[nome](); } catch (e) { /* som nunca pode quebrar o app */ }
}

__m.tocar = tocar;
__m.NOMES_SONS = NOMES_SONS;
};

// ---- js/paginas/album.js ----
__defs["js/paginas/album.js"] = function (__m, __r) {
// Álbum de figurinhas: os selos de todas as profissões, sem ranking e sem pressa.
const { PROFISSOES } = __r("js/professions/index.js");
const { getEstado } = __r("js/core/storage.js");
const { todosSelos } = __r("js/core/selos.js");
const { esc, fmtData } = __r("js/core/ui.js");

function htmlFigurinha(s, cor) {
  const data = s.ok ? getEstado().selos[s.id] : '';
  return s.ok
    ? `<li class="figurinha ganha" style="--cor:${cor}"><span class="fig-emoji" aria-hidden="true">${esc(s.emoji)}</span><span class="fig-titulo">${esc(s.titulo)}</span>${data ? `<small>${esc(fmtData(data))}</small>` : ''}</li>`
    : `<li class="figurinha bloqueada"><span class="fig-emoji" aria-hidden="true">❔</span><span class="fig-titulo">${esc(s.titulo)}</span><small>Ainda vai chegar!<span class="sr-only"> (você ainda não ganhou)</span></small></li>`;
}

function paginaAlbum() {
  const selos = todosSelos();
  const ganhos = selos.filter((s) => s.ok).length;
  const grupos = [
    ...PROFISSOES.map((p) => ({ id: p.id, titulo: `${p.emoji} ${p.nome}`, cor: p.cor })),
    { id: 'geral', titulo: '🏙️ A cidade toda', cor: '#c2185b' },
  ];
  document.getElementById('app').innerHTML = `<section class="album">
    <nav class="migalhas" aria-label="Você está aqui"><a href="#/">🏠 Início</a> › <span>Meu álbum</span></nav>
    <h1 tabindex="-1">🌟 Meu álbum de selos</h1>
    <p class="subtitulo">Você tem <strong>${ganhos}</strong> figurinhas. Elas aparecem quando você cadastra, atende e imprime. Sem pressa! 🌈</p>
    ${grupos.map((g) => {
      const lista = selos.filter((s) => s.grupo === g.id);
      if (!lista.length) return '';
      const n = lista.filter((s) => s.ok).length;
      return `<section aria-labelledby="g-${g.id}"><h2 id="g-${g.id}">${esc(g.titulo)} <small>${n} de ${lista.length}</small></h2>
        <ul class="figurinhas">${lista.map((s) => htmlFigurinha(s, g.cor)).join('')}</ul></section>`;
    }).join('')}
  </section>`;
}

__m.htmlFigurinha = htmlFigurinha;
__m.paginaAlbum = paginaAlbum;
};

// ---- js/paginas/relatorio.js ----
__defs["js/paginas/relatorio.js"] = function (__m, __r) {
// Relatório geral da cidade: resumo de todas as profissões, pronto para imprimir ou salvar em PDF.
const { PROFISSOES } = __r("js/professions/index.js");
const { getEstado } = __r("js/core/storage.js");
const { listar, maisRecentes } = __r("js/core/entidades.js");
const { tituloReg } = __r("js/core/modelo.js");
const { todosSelos, totalAtendimentos } = __r("js/core/selos.js");
const { htmlFolha, imprimir } = __r("js/core/imprimir.js");
const { esc, fmtData } = __r("js/core/ui.js");
const { tocar } = __r("js/core/som.js");

// "Profissional" fictícia só para o cabeçalho do relatório.
const CIDADE = {
  id: 'cidade', nome: 'Direção', emoji: '🏙️', cor: '#c2185b',
  local: 'Direção da Cidade das Profissões, gestão da', cargo: 'Diretora', sigla: 'CIDADE-BRINCA',
};

function paginaRelatorio() {
  const estado = getEstado();
  const linhas = PROFISSOES.map((p) => {
    const cadastros = listar(p.id, p.entidades[0].id).length;
    const atend = p.entidades[1] ? listar(p.id, p.entidades[1].id).length : 0;
    return { p, cadastros, atend, docs: estado.contadores.documentos[p.id] || 0 };
  });
  const ativas = linhas.filter((l) => l.cadastros > 0).length;
  const selos = todosSelos().filter((s) => s.ok);
  const totalDocs = linhas.reduce((s, l) => s + l.docs, 0);

  const recentes = PROFISSOES.flatMap((p) => p.entidades.slice(1, 2).flatMap((e) =>
    listar(p.id, e.id).map((r) => ({ p, r }))))
    .sort((a, b) => maisRecentes(a.r, b.r)).slice(0, 6);

  const corpo = `
    <p class="doc-campo"><strong>Cidade:</strong> ${esc(estado.config.escritorio)}</p>
    <ul class="relatorio-numeros">
      <li><strong>${ativas}</strong> de ${PROFISSOES.length} profissões em uso</li>
      <li><strong>${totalAtendimentos()}</strong> atendimentos</li>
      <li><strong>${totalDocs}</strong> documentos impressos</li>
      <li><strong>${selos.length}</strong> selos</li>
    </ul>
    <section class="doc-bloco"><h4>Profissões</h4>
      <table class="doc-tabela"><thead><tr><th>Profissão</th><th class="dir">Cadastros</th><th class="dir">Atendimentos</th><th class="dir">Documentos</th></tr></thead><tbody>
      ${linhas.map((l) => `<tr><td>${l.p.emoji} ${esc(l.p.nome)}</td><td class="dir">${l.cadastros}</td><td class="dir">${l.atend}</td><td class="dir">${l.docs}</td></tr>`).join('')}
      </tbody></table>
    </section>
    <section class="doc-bloco"><h4>Últimos atendimentos</h4>
      ${recentes.length ? `<ul class="doc-lista">${recentes.map(({ p, r }) => `<li>${p.emoji} ${esc(p.nome)}: ${esc(tituloReg(p, r))}</li>`).join('')}</ul>` : '<p>Ainda não há atendimentos.</p>'}
    </section>
    <section class="doc-bloco"><h4>Selos conquistados</h4>
      ${selos.length ? `<ul class="doc-lista doc-colunas">${selos.map((s) => `<li>${s.emoji} ${esc(s.titulo)} <small>(${esc(fmtData(estado.selos[s.id]))})</small></li>`).join('')}</ul>` : '<p>Ainda não há selos. Sem pressa! 🌈</p>'}
    </section>
    <p style="margin-top:.8rem"><em>Parabéns pelo trabalho! A cidade está cada dia mais animada. 🎉</em></p>`;

  document.getElementById('app').innerHTML = `<section class="pagina-doc prof" style="--cor:${CIDADE.cor}">
    <div class="barra-doc nao-imprimir">
      <a class="btn" href="#/">← Voltar</a>
      <label class="papel">Papel <select id="papel"><option>A4</option><option>A5</option></select></label>
      <button class="btn btn-primario" id="imprimir" type="button">🖨️ Imprimir ou salvar PDF</button>
    </div>
    <h1 class="sr-only" tabindex="-1">Relatório geral da cidade</h1>
    ${htmlFolha(CIDADE, 'Relatório geral da cidade', corpo)}
  </section>`;

  document.getElementById('imprimir').addEventListener('click', () => { tocar('carimbo'); imprimir(document.getElementById('papel').value); });
}

__m.paginaRelatorio = paginaRelatorio;
};

// ---- js/core/imprimir.js ----
__defs["js/core/imprimir.js"] = function (__m, __r) {
// Documentos imprimíveis: cabeçalho, logotipo SVG, carimbo e rodapé obrigatório de brincadeira.
const { getEstado } = __r("js/core/storage.js");
const { esc, fmtData, hoje } = __r("js/core/ui.js");

const AVISO = 'Documento de brincadeira. Não tem valor médico, legal ou oficial.';
const AVISO_SAUDE = 'Se alguém estiver doente de verdade, chame um adulto.';

const marcaAtual = () => getEstado().config.marca;

// Número de "registro profissional" sempre fictício (derivado do nome, só para enfeitar).
function numeroFicticio(prof, nome) {
  let h = 7;
  for (const ch of prof.id + (nome || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `${prof.sigla} ${String(h % 100000).padStart(5, '0')}`;
}

// Cor dos documentos: a escolhida pela jogadora ou a da profissão.
const corDocs = (prof, marca = marcaAtual()) => marca.corDocs || prof.cor;

function logoSVG(prof, tam = 56, marca = marcaAtual()) {
  const cor = corDocs(prof, marca);
  const forma = marca.logoForma === 'circulo'
    ? `<circle cx="32" cy="32" r="30" fill="${cor}"/>`
    : `<rect x="2" y="2" width="60" height="60" rx="16" fill="${cor}"/>`;
  return `<svg class="logo" width="${tam}" height="${tam}" viewBox="0 0 64 64" role="img" aria-label="Logotipo de ${esc(prof.nome)}">
    ${forma}
    <circle cx="32" cy="32" r="23" fill="#fff" opacity=".2"/>
    <text x="32" y="43" font-size="29" text-anchor="middle">${esc(marca.logoEmoji || prof.emoji)}</text>
  </svg>`;
}

// O carimbo SEMPRE diz "DE BRINCADEIRA"; só a primeira linha, o emoji, a forma e a cor mudam.
function carimboSVG(prof, marca = marcaAtual()) {
  const c = marca.carimboCor || corDocs(prof, marca);
  const frase = esc((marca.carimboFrase || 'CARIMBO').toUpperCase());
  const fs = (marca.carimboFrase || 'CARIMBO').length > 12 ? 7 : 10;
  const emoji = esc(marca.carimboEmoji || prof.emoji);
  const formas = {
    redondo: `<circle cx="60" cy="60" r="55" fill="none" stroke="${c}" stroke-width="4"/><circle cx="60" cy="60" r="46" fill="none" stroke="${c}" stroke-width="1.6" stroke-dasharray="4 3"/>`,
    oval: `<ellipse cx="60" cy="60" rx="56" ry="44" fill="none" stroke="${c}" stroke-width="4"/><ellipse cx="60" cy="60" rx="47" ry="35" fill="none" stroke="${c}" stroke-width="1.6" stroke-dasharray="4 3"/>`,
    retangular: `<rect x="4" y="14" width="112" height="92" rx="14" fill="none" stroke="${c}" stroke-width="4"/><rect x="11" y="21" width="98" height="78" rx="9" fill="none" stroke="${c}" stroke-width="1.6" stroke-dasharray="4 3"/>`,
    festivo: `<circle cx="60" cy="60" r="53" fill="none" stroke="${c}" stroke-width="8" stroke-dasharray="1 7" stroke-linecap="round"/><circle cx="60" cy="60" r="44" fill="none" stroke="${c}" stroke-width="2"/>`,
  };
  const baixo = marca.carimboForma === 'oval' ? 84 : 88;
  return `<svg class="carimbo" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    ${formas[marca.carimboForma] || formas.redondo}
    <text x="60" y="41" font-size="${fs}" font-weight="700" fill="${c}" text-anchor="middle">${frase}</text>
    <text x="60" y="54" font-size="9" font-weight="700" fill="${c}" text-anchor="middle">DE BRINCADEIRA</text>
    <text x="60" y="${baixo}" font-size="28" text-anchor="middle">${emoji}</text>
  </svg>`;
}

function nomeJogadora() {
  return getEstado().config.jogadora || 'Profissional Exemplo';
}

// Monta a folha completa. `corpo` já deve vir com todo texto escapado.
function htmlFolha(prof, titulo, corpo) {
  const jog = nomeJogadora();
  const temNome = !!getEstado().config.jogadora;
  const marca = marcaAtual();
  const avisoSaude = prof.saude ? `<p class="aviso-saude">${esc(AVISO_SAUDE)}</p>` : '';
  return `<article class="folha timbre-${esc(marca.timbre)}" style="--cor:${corDocs(prof, marca)}">
    <header class="folha-cab">
      ${logoSVG(prof, 60, marca)}
      <div class="folha-ident">
        <h2 class="folha-nome">${esc(prof.local)} ${esc(jog)}</h2>
        <p>${esc(prof.cargo)} ${esc(jog)} · ${esc(numeroFicticio(prof, jog))} <em>(registro fictício)</em></p>
      </div>
      <p class="folha-data">${esc(fmtData(hoje()))}</p>
    </header>
    <h3 class="folha-titulo">${esc(titulo)}</h3>
    <div class="folha-corpo">${corpo}</div>
    <div class="folha-assina">
      <div class="assinatura">
        <span class="linha"></span>
        <strong class="assinatura-nome">${temNome ? `${esc(prof.cargo)} ${esc(jog)}` : 'Nome da profissional'}</strong>
        <small>${esc(prof.nome)} · ${esc(numeroFicticio(prof, jog))} (registro fictício)</small>
      </div>
      ${carimboSVG(prof, marca)}
    </div>
    <footer class="folha-rodape">
      <p class="aviso-brincadeira">${esc(AVISO)}</p>
      ${avisoSaude}
    </footer>
  </article>`;
}

function imprimir(papel = 'A4') {
  let st = document.getElementById('estilo-pagina');
  if (!st) {
    st = document.createElement('style');
    st.id = 'estilo-pagina';
    document.head.appendChild(st);
  }
  st.textContent = `@page { size: ${papel === 'A5' ? 'A5' : 'A4'}; margin: 12mm; }`;
  document.documentElement.dataset.papel = papel;
  window.print();
}

__m.numeroFicticio = numeroFicticio;
__m.logoSVG = logoSVG;
__m.carimboSVG = carimboSVG;
__m.nomeJogadora = nomeJogadora;
__m.htmlFolha = htmlFolha;
__m.imprimir = imprimir;
__m.AVISO = AVISO;
__m.AVISO_SAUDE = AVISO_SAUDE;
__m.corDocs = corDocs;
};

// ---- js/paginas/config.js ----
__defs["js/paginas/config.js"] = function (__m, __r) {
const { getEstado, salvar, substituirEstado, apagarTudo, CORES } = __r("js/core/storage.js");
const { exportarBackup, lerBackup } = __r("js/core/backup.js");
const { todosSelos } = __r("js/core/selos.js");
const { PALETA, FORMAS_LOGO, FORMAS_CARIMBO, TIMBRES, AVATARES, EMOJIS_MARCA, normalizarMarca } = __r("js/core/marca.js");
const { logoSVG, carimboSVG } = __r("js/core/imprimir.js");
const { PROFISSOES } = __r("js/professions/index.js");
const { aplicarAparencia } = __r("js/core/aparencia.js");
const { esc, toast, confirmar } = __r("js/core/ui.js");
const { navegar } = __r("js/core/roteador.js");
const { tocar, NOMES_SONS } = __r("js/core/som.js");

const NOMES_COR = { rosa: '🌸 Rosa', lilas: '💜 Lilás', azul: '💙 Azul', verde: '💚 Verde', laranja: '🧡 Laranja' };

const radio = (nome, valor, atual, conteudo, extra = '') =>
  `<label class="chip${extra}"><input type="radio" name="${nome}" value="${esc(valor)}"${valor === atual ? ' checked' : ''}><span>${conteudo}</span></label>`;
const radiosCor = (nome, atual, rotuloVazio) =>
  radio(nome, '', atual, esc(rotuloVazio)) +
  PALETA.map((p) => radio(nome, p.cor, atual, `<i class="amostra" style="background:${p.cor}"></i>${esc(p.nome)}`)).join('');
const radiosEmoji = (nome, lista, atual, vazio) =>
  (vazio ? radio(nome, '', atual, esc(vazio)) : '') + lista.map((e) => radio(nome, e, atual, esc(e), ' chip-emoji')).join('');

function lerMarca(form) {
  const v = (n) => { const el = form.querySelector(`input[name="${n}"]:checked`); return el ? el.value : ''; };
  return normalizarMarca({
    avatar: v('avatar'), logoEmoji: v('logoEmoji'), logoForma: v('logoForma'), corDocs: v('corDocs'),
    carimboForma: v('carimboForma'), carimboCor: v('carimboCor'), carimboEmoji: v('carimboEmoji'),
    carimboFrase: form.querySelector('#c-frase').value, timbre: v('timbre'),
  });
}

function desenharPrevia(form) {
  const marca = lerMarca(form);
  const prof = PROFISSOES[0];
  const nome = form.querySelector('#c-jog').value.trim() || 'Profissional Exemplo';
  const cor = marca.corDocs || prof.cor;
  document.getElementById('previa').innerHTML = `<div class="folha timbre-${marca.timbre}" style="--cor:${cor}">
    <div class="folha-cab">${logoSVG(prof, 52, marca)}<div class="folha-ident"><h3 class="folha-nome">${esc(prof.local)} ${esc(nome)}</h3><p>${esc(prof.cargo)} ${esc(nome)}</p></div></div>
    <div class="folha-assina"><p style="margin:0"><small>Assim ficam seus documentos</small></p>${carimboSVG(prof, marca)}</div></div>`;
}

function paginaConfig() {
  const { config } = getEstado();
  const selos = todosSelos();
  document.getElementById('app').innerHTML = `
    <section class="config">
      <nav class="migalhas" aria-label="Você está aqui"><a href="#/">🏠 Início</a> › <span>Configurações</span></nav>
      <h1 tabindex="-1">⚙️ Configurações</h1>

      <form id="form-config" class="cartao-bloco">
        <h2>Sobre você</h2>
        <div class="campo"><label for="c-jog">Seu nome ou apelido</label>
          <input id="c-jog" type="text" maxlength="40" value="${esc(config.jogadora)}" placeholder="Ex.: Dra. Lia"></div>
        <div class="campo"><label for="c-esc">Nome da cidade ou do escritório</label>
          <input id="c-esc" type="text" maxlength="60" value="${esc(config.escritorio)}"></div>
        <fieldset class="campo"><legend>Modo de cores</legend>
          <div class="chips">
            <label class="chip"><input type="radio" name="tema" value="claro"${config.tema === 'claro' ? ' checked' : ''}><span>☀️ Claro</span></label>
            <label class="chip"><input type="radio" name="tema" value="escuro"${config.tema === 'escuro' ? ' checked' : ''}><span>🌙 Escuro</span></label>
          </div></fieldset>
        <fieldset class="campo"><legend>Cor de destaque</legend>
          <div class="chips">${CORES.map((c) => `<label class="chip"><input type="radio" name="cor" value="${c}"${config.cor === c ? ' checked' : ''}><span>${NOMES_COR[c]}</span></label>`).join('')}</div></fieldset>

        <h2>Brincadeiras</h2>
        <fieldset class="campo"><legend>O que acontece enquanto você brinca</legend>
          <div class="chips">
            <label class="chip"><input type="checkbox" name="clientes"${config.clientes ? ' checked' : ''}><span>🛎️ Clientes chegam sozinhos</span></label>
            <label class="chip"><input type="checkbox" name="sons"${config.sons ? ' checked' : ''}><span>🔔 Sons suaves</span></label>
          </div>
          <p class="ajuda">Os sons são baixinhos e vêm desligados. Use "Testar" para ouvir.</p>
          <div><button class="btn btn-pequeno" type="button" id="testar-sons">🔊 Testar sons</button></div>
        </fieldset>

        <h2>Meu escritório</h2>
        <p class="ajuda">Escolha como seu escritório aparece nos documentos. O carimbo sempre diz "de brincadeira".</p>
        <div id="previa" class="previa" aria-live="polite"></div>
        <fieldset class="campo"><legend>Meu avatar</legend><div class="chips">${radiosEmoji('avatar', AVATARES, config.marca.avatar)}</div></fieldset>
        <fieldset class="campo"><legend>Cor dos documentos</legend><div class="chips">${radiosCor('corDocs', config.marca.corDocs, 'Cada profissão tem a sua')}</div></fieldset>
        <fieldset class="campo"><legend>Logotipo: formato</legend><div class="chips">${FORMAS_LOGO.map(([k, n]) => radio('logoForma', k, config.marca.logoForma, n)).join('')}</div></fieldset>
        <fieldset class="campo"><legend>Logotipo: emoji</legend><div class="chips">${radiosEmoji('logoEmoji', EMOJIS_MARCA, config.marca.logoEmoji, 'Da profissão')}</div></fieldset>
        <fieldset class="campo"><legend>Papel timbrado</legend><div class="chips">${TIMBRES.map(([k, n]) => radio('timbre', k, config.marca.timbre, n)).join('')}</div></fieldset>
        <fieldset class="campo"><legend>Carimbo: formato</legend><div class="chips">${FORMAS_CARIMBO.map(([k, n]) => radio('carimboForma', k, config.marca.carimboForma, n)).join('')}</div></fieldset>
        <fieldset class="campo"><legend>Carimbo: cor</legend><div class="chips">${radiosCor('carimboCor', config.marca.carimboCor, 'Igual aos documentos')}</div></fieldset>
        <fieldset class="campo"><legend>Carimbo: emoji</legend><div class="chips">${radiosEmoji('carimboEmoji', EMOJIS_MARCA, config.marca.carimboEmoji, 'Da profissão')}</div></fieldset>
        <div class="campo"><label for="c-frase">Carimbo: frase (aparece acima de "DE BRINCADEIRA")</label>
          <input id="c-frase" type="text" maxlength="18" value="${esc(config.marca.carimboFrase)}" placeholder="Ex.: APROVADO"></div>
        <button class="btn btn-primario" type="submit">💾 Salvar</button>
      </form>

      <section class="cartao-bloco" aria-labelledby="t-backup">
        <h2 id="t-backup">Backup dos dados</h2>
        <p>Os dados ficam <strong>só neste aparelho</strong>. Guarde um backup para não perder nada ou para levar para outro aparelho.</p>
        <div class="acoes">
          <button class="btn" id="exportar" type="button">⬇️ Exportar backup</button>
          <label class="btn" for="importar">⬆️ Importar backup</label>
          <input id="importar" class="sr-only" type="file" accept="application/json,.json">
        </div>
        <p class="ajuda">Ao importar, os dados atuais deste aparelho são substituídos pelos do arquivo.</p>
      </section>

      <section class="cartao-bloco" aria-labelledby="t-selos">
        <h2 id="t-selos">Selos</h2>
        <p>Você tem <strong>${selos.filter((s) => s.ok).length}</strong> de ${selos.length} figurinhas no álbum.</p>
        <p><a class="btn" href="#/album">🌟 Abrir meu álbum de selos</a></p>
      </section>

      <section class="cartao-bloco" aria-labelledby="t-priv">
        <h2 id="t-priv">Privacidade</h2>
        <p>Nada é enviado pela internet. Use apelidos em vez de sobrenomes, endereços, telefones ou fotos reais.</p>
        <p>Este é um jogo de faz de conta: os documentos não têm valor médico, legal ou oficial.</p>
        <button class="btn btn-perigo-suave" id="apagar-tudo" type="button">🗑️ Apagar todos os dados</button>
      </section>
    </section>`;

  document.getElementById('form-config').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const c = getEstado().config;
    c.jogadora = f.querySelector('#c-jog').value.trim();
    c.escritorio = f.querySelector('#c-esc').value.trim() || 'Cidade das Profissões';
    c.tema = f.querySelector('input[name="tema"]:checked').value;
    c.cor = f.querySelector('input[name="cor"]:checked').value;
    c.marca = lerMarca(f);
    c.clientes = f.querySelector('input[name="clientes"]').checked;
    c.sons = f.querySelector('input[name="sons"]').checked;
    salvar();
    aplicarAparencia();
    toast('Configurações salvas! ✨');
  });
  // Mostra a mudança de cor/tema na hora, antes de salvar
  document.getElementById('testar-sons').addEventListener('click', () => {
    NOMES_SONS.forEach((n, i) => setTimeout(() => tocar(n, true), i * 900));
  });
  desenharPrevia(document.getElementById('form-config'));
  document.getElementById('form-config').addEventListener('input', (ev) => desenharPrevia(ev.currentTarget));
  document.getElementById('form-config').addEventListener('change', (ev) => {
    desenharPrevia(ev.currentTarget);
    if (ev.target.name === 'tema') document.documentElement.dataset.tema = ev.target.value;
    if (ev.target.name === 'cor') document.documentElement.dataset.cor = ev.target.value;
  });

  document.getElementById('exportar').addEventListener('click', () => { exportarBackup(); toast('Backup criado! Guarde o arquivo em um lugar seguro. 💾'); });

  document.getElementById('importar').addEventListener('change', async (ev) => {
    const arquivo = ev.target.files[0];
    ev.target.value = '';
    try {
      const novo = await lerBackup(arquivo);
      const n = novo.registros.length;
      if (!(await confirmar(`Importar este backup (${n} ${n === 1 ? 'registro' : 'registros'})? Os dados atuais serão substituídos.`, { sim: 'Importar', perigo: true }))) return;
      substituirEstado(novo);
      aplicarAparencia();
      toast('Backup restaurado! 🎉');
      paginaConfig();
    } catch (err) {
      toast('😕 ' + err.message, 6000);
    }
  });

  document.getElementById('apagar-tudo').addEventListener('click', async () => {
    if (await confirmar('Apagar TODOS os dados deste aparelho? Isso não dá para desfazer (a não ser com um backup).', { sim: 'Apagar tudo', perigo: true })) {
      apagarTudo();
      aplicarAparencia();
      toast('Tudo limpinho.');
      navegar('/');
    }
  });
}

__m.paginaConfig = paginaConfig;
};

// ---- js/core/backup.js ----
__defs["js/core/backup.js"] = function (__m, __r) {
// Exportar e importar backup em JSON.
const { getEstado, migrar, VERSAO } = __r("js/core/storage.js");

const MARCA = 'cidade-das-profissoes';
const LIMITE = 8 * 1024 * 1024;

function exportarBackup() {
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

function validar(d) {
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
async function lerBackup(arquivo) {
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

__m.exportarBackup = exportarBackup;
__m.validar = validar;
__m.lerBackup = lerBackup;
};

// ---- js/paginas/escritorio.js ----
__defs["js/paginas/escritorio.js"] = function (__m, __r) {
// Páginas de uma profissão: escritório, detalhe de registro, formulário e documento.
const { porId } = __r("js/professions/index.js");
const { getEstado } = __r("js/core/storage.js");
const { listar, obter, criar, atualizar, apagar, maisRecentes, registrarRecente, contarDocumento } = __r("js/core/entidades.js");
const { entidadeDe, tituloReg, subtituloReg, nomeDe, criarCtx } = __r("js/core/modelo.js");
const { htmlFormulario, lerFormulario, ligarFormulario, formatarValor, htmlOdontograma, valorPadrao } = __r("js/core/formulario.js");
const { htmlFolha, imprimir } = __r("js/core/imprimir.js");
const { verificarSelos, incentivo } = __r("js/core/selos.js");
const { semear, sortear } = __r("js/core/sorteio.js");
const { fila, chegar, remover, casoDe, nomeDoCliente, MAX_ESPERA } = __r("js/core/espera.js");
const { tocar } = __r("js/core/som.js");
const { navegar } = __r("js/core/roteador.js");
const { esc, toast, confirmar, perguntaHtml } = __r("js/core/ui.js");

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

// ---------- Sala de espera ----------
let timerChegada = null;

function htmlEspera(prof) {
  if (!(prof.sorteios || []).length) return '';
  const f = fila(prof.id);
  if (!getEstado().config.clientes && !f.length) return '';
  const itens = f.map((c) => {
    const caso = casoDe(prof, c);
    const nome = nomeDoCliente(prof, caso);
    const mostrarNome = !caso.pitch.toLowerCase().includes(nome.toLowerCase());
    return `<li class="cliente" data-i="${c.i}">
      <span class="cliente-emoji" aria-hidden="true">${esc(c.emoji)}</span>
      <div class="balao">${mostrarNome ? `<strong>${esc(nome)}</strong>` : ''}<p>${esc(caso.pitch)}</p></div>
      <div class="cliente-acoes">
        <button class="btn btn-primario btn-pequeno" type="button" data-atender="${c.i}">✅ Atender</button>
        <button class="btn btn-pequeno" type="button" data-adiar="${c.i}">⏳ Voltar depois</button>
      </div></li>`;
  }).join('');
  return `<section id="espera" class="espera-secao" aria-labelledby="t-espera">
    <h2 id="t-espera">🛎️ Sala de espera (${f.length})</h2>
    ${f.length ? `<ul class="espera">${itens}</ul>` : '<p class="vazio-texto">Ninguém esperando agora. Fique de olho: alguém pode chegar! 👀</p>'}
  </section>`;
}

function ligarEspera(prof) {
  const sec = document.getElementById('espera');
  if (!sec) return;
  sec.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    const idx = Number(b.dataset.atender ?? b.dataset.adiar);
    const cliente = fila(prof.id).find((x) => x.i === idx);
    if (!cliente) return;
    if (b.dataset.atender !== undefined) {
      const reg = semear(prof, casoDe(prof, cliente));
      remover(cliente);
      verificarSelos();
      tocar('salvar');
      toast('Cliente atendido! ' + incentivo());
      navegar(`/p/${prof.id}/r/${reg.id}`);
    } else {
      remover(cliente);
      toast('Tudo bem, volta outro dia! 💛');
      atualizarEspera(prof);
      agendarChegada(prof);
    }
  });
}

function atualizarEspera(prof) {
  const atual = document.getElementById('espera');
  if (!atual) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = htmlEspera(prof);
  atual.replaceWith(tmp.firstElementChild);
  ligarEspera(prof);
}

// Alguém novo chega de tempos em tempos enquanto a pessoa está no escritório (no máximo 3 esperando).
function agendarChegada(prof) {
  clearTimeout(timerChegada);
  if (!getEstado().config.clientes || !(prof.sorteios || []).length) return;
  const n = fila(prof.id).length;
  if (n >= MAX_ESPERA) return;
  const delay = n === 0 ? 4000 + Math.random() * 3000 : 20000 + Math.random() * 15000;
  timerChegada = setTimeout(() => {
    if (location.hash !== `#/p/${prof.id}`) return;
    if (!chegar(prof)) return;
    atualizarEspera(prof);
    toast('🛎️ Chegou alguém na sala de espera!');
    tocar('sino');
    agendarChegada(prof);
  }, delay);
}

// ---------- Escritório ----------
function paginaEscritorio({ params }) {
  const prof = porId(params.prof);
  if (!prof) return naoEncontrado();
  const raiz = prof.entidades[0];
  const atend = prof.entidades[1];
  const regs = listar(prof.id, raiz.id).sort(maisRecentes);
  const recentes = atend ? listar(prof.id, atend.id).sort(maisRecentes).slice(0, 4) : [];

  app().innerHTML = `<section class="escritorio prof" style="--cor:${prof.cor}">
    <nav class="migalhas" aria-label="Você está aqui"><a href="#/">🏠 Início</a> › <span>${esc(prof.nome)}</span></nav>
    <h1 tabindex="-1"><span aria-hidden="true">${prof.emoji}</span> Escritório: ${esc(prof.nome)}</h1>
    <p class="subtitulo">${esc(prof.descricao || '')}</p>
    ${aviso(prof)}
    <div class="acoes">
      <a class="btn btn-primario" href="#/p/${prof.id}/novo/${raiz.id}">＋ ${esc(novoRotulo(raiz))}</a>
      ${(prof.sorteios || []).length ? '<button class="btn" id="sortear" type="button">🎲 Sortear um caso</button>' : ''}
      ${regs.length === 0 && prof.exemplo ? '<button class="btn" id="exemplo" type="button">✨ Criar um exemplo</button>' : ''}
    </div>
    ${htmlEspera(prof)}
    <h2>${esc(raiz.plural)} (${regs.length})</h2>
    ${regs.length ? `<div class="campo busca"><label for="busca">Buscar</label><input id="busca" type="search" placeholder="🔍 Buscar em ${esc(raiz.plural.toLowerCase())}…"></div>` : ''}
    ${regs.length ? `<ul class="lista-itens" id="lista">${regs.map((r) => itemCartao(prof, r)).join('')}</ul>
      <p class="vazio-texto" id="sem-resultado" hidden>Nada encontrado 🤔</p>`
      : `<p class="vazio-texto">Ainda não há ${esc(raiz.plural.toLowerCase())}. Que tal começar agora? 🎈</p>`}
    ${recentes.length ? `<h2>${esc(atend.plural)} recentes</h2><ul class="lista-itens">${recentes.map((r) => itemCartao(prof, r)).join('')}</ul>` : ''}
  </section>`;

  clearTimeout(timerChegada);
  ligarEspera(prof);
  agendarChegada(prof);

  const ex = document.getElementById('exemplo');
  if (ex) ex.addEventListener('click', () => { prof.exemplo.forEach((m) => semear(prof, m)); verificarSelos(); toast('Exemplo criado! ' + incentivo()); paginaEscritorio({ params }); });

  const sorteio = document.getElementById('sortear');
  if (sorteio) {
    sorteio.addEventListener('click', async () => {
      tocar('sorteio');
      for (;;) {
        const caso = sortear(prof);
        const resp = await perguntaHtml('🎲 Chegou um caso novo!', `<p class="sorteio-pitch">${esc(caso.pitch)}</p><p class="ajuda">Você pode atender agora ou sortear outro.</p>`, [
          { valor: 'outro', rotulo: '🎲 Outro caso' },
          { valor: 'atender', rotulo: '✅ Atender!', primario: true },
        ]);
        if (resp === 'atender') {
          const reg = semear(prof, caso);
          verificarSelos();
          tocar('salvar');
          toast('Caso aceito! ' + incentivo());
          navegar(`/p/${prof.id}/r/${reg.id}`);
          return;
        }
        if (resp !== 'outro') return;
      }
    });
  }

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
function paginaDetalhe({ params }) {
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
  app().innerHTML = `<section class="detalhe prof" style="--cor:${prof.cor}">
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
function paginaForm({ params, query }) {
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
  app().innerHTML = `<section class="formulario prof" style="--cor:${prof.cor}">
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
    tocar('salvar');
    const nome = getEstado().config.jogadora;
    toast(`${editando ? 'Salvo!' : 'Cadastrado!'} ${incentivo()}${nome ? ' ' + nome : ''}`.trim());
    navegar(`/p/${prof.id}/r/${salvo.id}`);
  });
}

// ---------- Documento imprimível ----------
function paginaDocumento({ params }) {
  const reg = obter(params.id);
  const prof = reg && porId(reg.prof);
  const doc = prof && prof.documentos.find((d) => d.id === params.doc);
  if (!reg || !prof || !doc) return naoEncontrado();
  const ctx = criarCtx(prof, reg);
  registrarRecente(prof.id, reg.id, doc.id);
  const voltar = `#/p/${prof.id}/r/${reg.id}`;

  app().innerHTML = `<section class="pagina-doc prof" style="--cor:${prof.cor}">
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
    tocar('carimbo');
    imprimir(document.getElementById('papel').value);
    contarDocumento(prof.id);
    verificarSelos();
  });
}

__m.paginaEscritorio = paginaEscritorio;
__m.paginaDetalhe = paginaDetalhe;
__m.paginaForm = paginaForm;
__m.paginaDocumento = paginaDocumento;
};

// ---- js/core/sorteio.js ----
__defs["js/core/sorteio.js"] = function (__m, __r) {
// Cria registros a partir de um "molde" (exemplo ou caso sorteado) e sorteia casos.
const { criar } = __r("js/core/entidades.js");
const { valorPadrao } = __r("js/core/formulario.js");
const { entidadeDe } = __r("js/core/modelo.js");

// molde = { tipo, dados, filhos?: [molde] }. Campos vazios recebem o valor padrão (ex.: data de hoje).
function semear(prof, molde, pai) {
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
function sortear(prof) {
  const lista = prof.sorteios || [];
  if (!lista.length) return null;
  let i;
  do { i = Math.floor(Math.random() * lista.length); } while (lista.length > 1 && i === ultimo[prof.id]);
  ultimo[prof.id] = i;
  return lista[i];
}

__m.semear = semear;
__m.sortear = sortear;
};

// ---- js/core/espera.js ----
__defs["js/core/espera.js"] = function (__m, __r) {
// Sala de espera: clientes de faz de conta que "chegam sozinhos" pedindo atendimento.
// Cada cliente vem de um caso de `prof.sorteios` (guardamos só o índice e um emoji).
const { getEstado, salvar } = __r("js/core/storage.js");
const { porId } = __r("js/professions/index.js");
const { entidadeDe } = __r("js/core/modelo.js");

const MAX_ESPERA = 3;
const EMOJIS = ['🐱', '🐶', '🐰', '🐻', '🐼', '🦊', '🦄', '🐢', '🧸', '👵', '🧒', '🐸'];
const sorteie = (n) => Math.floor(Math.random() * n);

// Clientes esperando em uma profissão (ignora índices que não existem mais).
function fila(profId) {
  const p = porId(profId);
  const n = p && p.sorteios ? p.sorteios.length : 0;
  return getEstado().espera.filter((x) => x.prof === profId && x.i >= 0 && x.i < n);
}

function chegar(prof) {
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

function remover(cliente) {
  const e = getEstado();
  e.espera = e.espera.filter((x) => x !== cliente);
  salvar();
}

const casoDe = (prof, cliente) => prof.sorteios[cliente.i];

// Nome para mostrar: o título do cadastro principal do caso (ex.: "Ursinho Teddy").
function nomeDoCliente(prof, caso) {
  const t = entidadeDe(prof, caso.tipo).titulo;
  return (typeof t === 'string' && caso.dados[t]) || 'Alguém';
}

__m.fila = fila;
__m.chegar = chegar;
__m.remover = remover;
__m.nomeDoCliente = nomeDoCliente;
__m.MAX_ESPERA = MAX_ESPERA;
__m.casoDe = casoDe;
};

__r("js/app.js");
})();
