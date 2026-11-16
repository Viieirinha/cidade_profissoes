// Utilitários de interface: escape de HTML, datas, avisos e diálogos.

const MAPA = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Escapa TODO texto digitado antes de colocar em HTML.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => MAPA[c]);
// Escapa e preserva quebras de linha.
export const par = (s) => esc(s).replace(/\r?\n/g, '<br>');

export const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
export const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];

export function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fmtData(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(s || '');
}

export function fmtMoeda(n) {
  const v = Number(n) || 0;
  return 'R$ ' + v.toFixed(2).replace('.', ',');
}

// "Data estelar" de brincadeira: ano.diaDoAno
export function dataEstelar(iso = hoje()) {
  const d = new Date(iso + 'T12:00:00');
  const dia = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  return `${d.getFullYear()}.${String(dia).padStart(3, '0')}`;
}

export function fmtRelativo(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ---- Avisos rápidos (toasts) ----
export function toast(mensagem, ms = 3800) {
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

export function confirmar(mensagem, { sim = 'Sim', nao = 'Cancelar', perigo = false } = {}) {
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

export function avisoModal(titulo, htmlCorpo, botao = 'Entendi!') {
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
