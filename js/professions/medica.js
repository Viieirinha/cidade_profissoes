import { txt, area, num, data, sel, chips, secao } from '../core/campos.js';
import { fmtData } from '../core/ui.js';

const REMEDIOS = [
  'Abraço apertado 🤗', 'Suco de risadas 🧃', 'Soneca de 20 minutos 😴', 'Dançar por 5 minutos 💃',
  'Sopa de estrelinhas ✨', 'Cantar uma música 🎵', 'Dia de filme com pipoca 🍿', 'Cócegas de leve 🪶',
];

export default {
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
