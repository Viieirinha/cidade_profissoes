import { txt, area, data, sel, chips, emoji } from '../core/campos.js';

export default {
  id: 'astronauta',
  nome: 'Astronauta',
  emoji: '🚀',
  cor: '#4527a0',
  local: 'Agência Espacial da Astronauta',
  cargo: 'Astronauta',
  sigla: 'AEB-BRINCA',
  descricao: 'Missões, tripulação e diário de bordo',
  selos: { cadastro: 'Primeira missão criada!', atendimento: 'Primeiro tripulante a bordo!' },
  entidades: [
    {
      id: 'missao', nome: 'Missão', plural: 'Missões', emoji: '🛰️', f: true, titulo: 'nome', subtitulo: (d) => d.destino || '',
      campos: [
        txt('nome', 'Nome da missão', { obrigatorio: true, dica: 'Ex.: Missão Estrela Cintilante' }),
        sel('destino', 'Destino', ['Lua', 'Marte', 'Saturno', 'Estrela Cintilante', 'Planeta de Brigadeiro', 'Galáxia dos Sorrisos'], { metade: true }),
        txt('nave', 'Nome da nave', { metade: true, dica: 'Ex.: Foguete Arco-íris' }),
        data('lancamento', 'Data de lançamento', { padrao: 'hoje' }),
        area('objetivo', 'Objetivo da missão'),
      ],
    },
    {
      id: 'tripulante', nome: 'Tripulante', plural: 'Tripulação', emoji: '🧑‍🚀', titulo: 'nome', subtitulo: (d) => d.funcao || '',
      campos: [
        txt('nome', 'Nome ou apelido', { obrigatorio: true }),
        emoji('emoji', 'Carinha', ['🧑‍🚀', '👩‍🚀', '👨‍🚀', '🐱', '🐶', '🤖', '👽', '🧸']),
        sel('funcao', 'Função', ['Comandante', 'Piloto', 'Engenheira', 'Cientista', 'Cozinheira espacial', 'Mascote'], { metade: true }),
      ],
    },
    {
      id: 'diario', nome: 'Registro do diário', plural: 'Diário de bordo', emoji: '📓', titulo: (d) => `Data estelar ${d.dataEstelar}`, subtitulo: (d) => (d.texto || '').slice(0, 70),
      campos: [
        txt('dataEstelar', 'Data estelar', { padrao: 'estelar', obrigatorio: true, ajuda: 'Gerada pela data de hoje. Pode inventar a sua!' }),
        chips('humor', 'Como está a tripulação?', ['😄 Animada', '🤩 Maravilhada', '😴 Sonolenta', '🍫 Com fome de doce', '🤗 Cheia de saudade']),
        area('texto', 'Diário de bordo', { linhas: 5, dica: 'O que aconteceu hoje no espaço?' }),
        chips('descobertas', 'Descobertas', ['Cometa de açúcar', 'Planeta que ri', 'Estrela com nome novo', 'Alienígena simpático', 'Chuva de meteoros colorida']),
      ],
    },
  ],
  documentos: [
    {
      id: 'diario-bordo', titulo: 'Diário de bordo', de: 'missao', botao: '🖨️ Diário de bordo',
      render: (c) => {
        const trip = c.filhos('tripulante');
        const regs = c.filhos('diario');
        return `${c.campo('Missão', c.d.nome)}${c.campo('Nave', c.d.nave)}${c.campo('Destino', c.d.destino)}${c.campo('Lançamento', c.data(c.d.lancamento))}
          ${c.bloco('Objetivo', c.d.objetivo)}
          <section class="doc-bloco"><h4>Tripulação</h4>${c.ul(trip.map((t) => `${t.dados.emoji || ''} ${t.dados.nome}${t.dados.funcao ? ' — ' + t.dados.funcao : ''}`))}</section>
          <section class="doc-bloco"><h4>Registros</h4>${regs.length ? regs.map((r) => `<div style="margin:.5rem 0;padding-bottom:.4rem;border-bottom:1px dotted #b9b0c4">
            <strong>Data estelar ${c.e(r.dados.dataEstelar)}</strong>${(r.dados.humor || []).length ? ` · ${c.e(r.dados.humor.join(', '))}` : ''}
            <p style="margin:.2rem 0">${c.par(r.dados.texto || '')}</p>${(r.dados.descobertas || []).length ? `<small>Descobertas: ${c.e(r.dados.descobertas.join(', '))}</small>` : ''}</div>`).join('') : '<p>—</p>'}</section>`;
      },
    },
  ],
  sorteios: [
    { pitch: 'Missão Estrela Cintilante: descobrir de onde vêm as estrelas cadentes. ⭐', tipo: 'missao', dados: { nome: 'Missão Estrela Cintilante', destino: 'Estrela Cintilante', nave: 'Foguete Arco-íris', objetivo: 'Descobrir de onde vêm as estrelas cadentes.' }, filhos: [{ tipo: 'tripulante', dados: { nome: 'Capitã Lia', emoji: '👩‍🚀', funcao: 'Comandante' } }, { tipo: 'tripulante', dados: { nome: 'Gato Astro', emoji: '🐱', funcao: 'Mascote' } }] },
    { pitch: 'Missão Planeta de Brigadeiro: provar uma colher de espaço! 🍫', tipo: 'missao', dados: { nome: 'Missão Planeta de Brigadeiro', destino: 'Planeta de Brigadeiro', nave: 'Foguete Colher', objetivo: 'Descobrir se o planeta é mesmo doce.' }, filhos: [{ tipo: 'tripulante', dados: { nome: 'Chef Teo', emoji: '🧑‍🚀', funcao: 'Cozinheira espacial' } }, { tipo: 'tripulante', dados: { nome: 'Robô Beep', emoji: '🤖', funcao: 'Engenheira' } }] },
    { pitch: 'Missão Lua: plantar uma bandeira de sorrisos. 🌙', tipo: 'missao', dados: { nome: 'Missão Lua', destino: 'Lua', nave: 'Nave Lunar', objetivo: 'Plantar uma bandeira de sorrisos na Lua.' }, filhos: [{ tipo: 'tripulante', dados: { nome: 'Piloto Dudu', emoji: '👨‍🚀', funcao: 'Piloto' } }, { tipo: 'tripulante', dados: { nome: 'Dra. Mia', emoji: '👩‍🚀', funcao: 'Cientista' } }] },
    { pitch: 'Missão Saturno: contar quantos anéis o planeta tem. 🪐', tipo: 'missao', dados: { nome: 'Missão Saturno', destino: 'Saturno', nave: 'Foguete Anelzinho', objetivo: 'Contar os anéis e fazer um desenho.' }, filhos: [{ tipo: 'tripulante', dados: { nome: 'Capitão Raio', emoji: '🧑‍🚀', funcao: 'Comandante' } }, { tipo: 'tripulante', dados: { nome: 'Alien Gui', emoji: '👽', funcao: 'Mascote' } }] },
  ],
  exemplo: [{
    tipo: 'missao', dados: { nome: 'Missão Estrela Cintilante', destino: 'Estrela Cintilante', nave: 'Foguete Arco-íris', objetivo: 'Descobrir de onde vêm as estrelas cadentes.' },
    filhos: [
      { tipo: 'tripulante', dados: { nome: 'Capitã Lia', emoji: '👩‍🚀', funcao: 'Comandante' } },
      { tipo: 'diario', dados: { humor: ['🤩 Maravilhada'], texto: 'Hoje vimos um cometa feito de açúcar!', descobertas: ['Cometa de açúcar'] } },
    ],
  }],
};
