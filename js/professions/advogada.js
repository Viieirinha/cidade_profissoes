import { txt, area, data, hora, sel, chips } from '../core/campos.js';
import { fmtData } from '../core/ui.js';

export default {
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
