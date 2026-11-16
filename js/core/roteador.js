// Roteador simples por hash: #/p/medica/r/ID?x=1  (funciona em file:// e no GitHub Pages)

const rotas = [];
let naoEncontrada = null;
let primeiraVez = true;

export function rota(padrao, tratador) {
  const nomes = [];
  const re = new RegExp('^' + padrao.replace(/:([a-z]+)/g, (_, n) => { nomes.push(n); return '([^/]+)'; }) + '$');
  rotas.push({ re, nomes, tratador });
}

export function caminhoAtual() {
  const h = location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = h.split('?');
  return { path, query: Object.fromEntries(new URLSearchParams(qs)) };
}

export function navegar(caminho) {
  if (location.hash === '#' + caminho) executar();
  else location.hash = '#' + caminho;
}

export function executar() {
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

export function iniciar(fnNaoEncontrada) {
  naoEncontrada = fnNaoEncontrada;
  addEventListener('hashchange', executar);
  executar();
}
