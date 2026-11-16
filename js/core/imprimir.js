// Documentos imprimíveis: cabeçalho, logotipo SVG, carimbo e rodapé obrigatório de brincadeira.
import { getEstado } from './storage.js';
import { esc, fmtData, hoje } from './ui.js';

export const AVISO = 'Documento de brincadeira. Não tem valor médico, legal ou oficial.';
export const AVISO_SAUDE = 'Se alguém estiver doente de verdade, chame um adulto.';

// Número de "registro profissional" sempre fictício (derivado do nome, só para enfeitar).
export function numeroFicticio(prof, nome) {
  let h = 7;
  for (const ch of prof.id + (nome || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `${prof.sigla} ${String(h % 100000).padStart(5, '0')}`;
}

export function logoSVG(prof, tam = 56) {
  return `<svg class="logo" width="${tam}" height="${tam}" viewBox="0 0 64 64" role="img" aria-label="Logotipo de ${esc(prof.nome)}">
    <rect x="2" y="2" width="60" height="60" rx="16" fill="${prof.cor}"/>
    <circle cx="32" cy="32" r="23" fill="#fff" opacity=".2"/>
    <text x="32" y="43" font-size="29" text-anchor="middle">${prof.emoji}</text>
  </svg>`;
}

export function carimboSVG(prof) {
  return `<svg class="carimbo" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <circle cx="60" cy="60" r="55" fill="none" stroke="${prof.cor}" stroke-width="4"/>
    <circle cx="60" cy="60" r="46" fill="none" stroke="${prof.cor}" stroke-width="1.6" stroke-dasharray="4 3"/>
    <text x="60" y="40" font-size="10" font-weight="700" fill="${prof.cor}" text-anchor="middle">CARIMBO DE</text>
    <text x="60" y="53" font-size="10" font-weight="700" fill="${prof.cor}" text-anchor="middle">BRINCADEIRA</text>
    <text x="60" y="88" font-size="30" text-anchor="middle">${prof.emoji}</text>
  </svg>`;
}

export function nomeJogadora() {
  return getEstado().config.jogadora || 'Profissional Exemplo';
}

// Monta a folha completa. `corpo` já deve vir com todo texto escapado.
export function htmlFolha(prof, titulo, corpo) {
  const jog = nomeJogadora();
  const avisoSaude = prof.saude ? `<p class="aviso-saude">${esc(AVISO_SAUDE)}</p>` : '';
  return `<article class="folha" style="--cor:${prof.cor}">
    <header class="folha-cab">
      ${logoSVG(prof, 60)}
      <div class="folha-ident">
        <h2 class="folha-nome">${esc(prof.local)} ${esc(jog)}</h2>
        <p>${esc(prof.cargo)} ${esc(jog)} · ${esc(numeroFicticio(prof, jog))} <em>(registro fictício)</em></p>
      </div>
      <p class="folha-data">${esc(fmtData(hoje()))}</p>
    </header>
    <h3 class="folha-titulo">${esc(titulo)}</h3>
    <div class="folha-corpo">${corpo}</div>
    <div class="folha-assina">
      <div class="assinatura"><span class="linha"></span><small>Assinatura de ${esc(jog)}</small></div>
      ${carimboSVG(prof)}
    </div>
    <footer class="folha-rodape">
      <p class="aviso-brincadeira">${esc(AVISO)}</p>
      ${avisoSaude}
    </footer>
  </article>`;
}

export function imprimir(papel = 'A4') {
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
