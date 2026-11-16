import { txt, area, data, sel } from '../core/campos.js';
import { fmtData } from '../core/ui.js';

export default {
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
