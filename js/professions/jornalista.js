import { txt, area, data, sel, emoji } from '../core/campos.js';
import { fmtData } from '../core/ui.js';

const EDITORIAS = ['Cidade', 'Esportes', 'Cultura', 'Ciência', 'Bichinhos', 'Culinária', 'Brincadeiras'];

export default {
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
