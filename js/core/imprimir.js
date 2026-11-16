// Documentos imprimíveis: cabeçalho, logotipo SVG, carimbo e rodapé obrigatório de brincadeira.
import { getEstado } from './storage.js';
import { esc, fmtData, hoje } from './ui.js';

export const AVISO = 'Documento de brincadeira. Não tem valor médico, legal ou oficial.';
export const AVISO_SAUDE = 'Se alguém estiver doente de verdade, chame um adulto.';

const marcaAtual = () => getEstado().config.marca;

// Número de "registro profissional" sempre fictício (derivado do nome, só para enfeitar).
export function numeroFicticio(prof, nome) {
  let h = 7;
  for (const ch of prof.id + (nome || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `${prof.sigla} ${String(h % 100000).padStart(5, '0')}`;
}

// Cor dos documentos: a escolhida pela jogadora ou a da profissão.
export const corDocs = (prof, marca = marcaAtual()) => marca.corDocs || prof.cor;

export function logoSVG(prof, tam = 56, marca = marcaAtual()) {
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
export function carimboSVG(prof, marca = marcaAtual()) {
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

export function nomeJogadora() {
  return getEstado().config.jogadora || 'Profissional Exemplo';
}

// Monta a folha completa. `corpo` já deve vir com todo texto escapado.
export function htmlFolha(prof, titulo, corpo) {
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
