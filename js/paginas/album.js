// Álbum de figurinhas: os selos de todas as profissões, sem ranking e sem pressa.
import { PROFISSOES } from '../professions/index.js';
import { getEstado } from '../core/storage.js';
import { todosSelos } from '../core/selos.js';
import { esc, fmtData } from '../core/ui.js';

export function htmlFigurinha(s, cor) {
  const data = s.ok ? getEstado().selos[s.id] : '';
  return s.ok
    ? `<li class="figurinha ganha" style="--cor:${cor}"><span class="fig-emoji" aria-hidden="true">${esc(s.emoji)}</span><span class="fig-titulo">${esc(s.titulo)}</span>${data ? `<small>${esc(fmtData(data))}</small>` : ''}</li>`
    : `<li class="figurinha bloqueada"><span class="fig-emoji" aria-hidden="true">❔</span><span class="fig-titulo">${esc(s.titulo)}</span><small>Ainda vai chegar!<span class="sr-only"> (você ainda não ganhou)</span></small></li>`;
}

export function paginaAlbum() {
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
