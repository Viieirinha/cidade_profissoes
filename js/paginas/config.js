import { getEstado, salvar, substituirEstado, apagarTudo, CORES } from '../core/storage.js';
import { exportarBackup, lerBackup } from '../core/backup.js';
import { todosSelos } from '../core/selos.js';
import { PALETA, FORMAS_LOGO, FORMAS_CARIMBO, TIMBRES, AVATARES, EMOJIS_MARCA, normalizarMarca } from '../core/marca.js';
import { logoSVG, carimboSVG } from '../core/imprimir.js';
import { PROFISSOES } from '../professions/index.js';
import { aplicarAparencia } from '../core/aparencia.js';
import { esc, toast, confirmar } from '../core/ui.js';
import { navegar } from '../core/roteador.js';
import { tocar, NOMES_SONS } from '../core/som.js';

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

export function paginaConfig() {
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
