import { txt, area, data, sel, emoji, ref } from '../core/campos.js';
import { esc } from '../core/ui.js';

export default {
  id: 'detetive',
  nome: 'Detetive',
  emoji: '🕵️‍♀️',
  cor: '#37474f',
  local: 'Agência de Detetives',
  cargo: 'Detetive',
  sigla: 'DET-BRINCA',
  descricao: 'Casos, suspeitos, pistas e quadro de pistas',
  selos: { cadastro: 'Primeiro caso aberto!', atendimento: 'Primeiro suspeito investigado!' },
  entidades: [
    {
      id: 'caso', nome: 'Caso', plural: 'Casos', emoji: '🔍', titulo: 'titulo', subtitulo: (d) => d.status || '',
      campos: [
        txt('titulo', 'Título do caso', { obrigatorio: true, dica: 'Ex.: O mistério do brigadeiro sumido' }),
        area('resumo', 'O que aconteceu?'),
        txt('local', 'Onde foi?', { metade: true, dica: 'Ex.: Cozinha da vovó' }),
        data('data', 'Quando?', { padrao: 'hoje', metade: true }),
        sel('status', 'Situação', ['Investigando', 'Resolvido'], { obrigatorio: true }),
        ref('culpado', 'Quem foi? (cadastre os suspeitos antes)', 'suspeito', { escopo: 'proprios', semOpcoes: '(cadastre suspeitos e depois edite o caso)' }),
        area('conclusao', 'Conclusão do caso', { sugestoes: ['Foi só um mal-entendido e todos fizeram as pazes.', 'O culpado devolveu o brigadeiro e pediu desculpas.', 'Caso encerrado com um abraço!'] }),
      ],
    },
    {
      id: 'suspeito', nome: 'Suspeito', plural: 'Suspeitos', emoji: '🧐', titulo: 'nome', subtitulo: (d) => d.nivel ? `Suspeita ${d.nivel.toLowerCase()}` : '',
      campos: [
        txt('nome', 'Nome ou apelido', { obrigatorio: true, dica: 'Ex.: Gato Mingau' }),
        emoji('emoji', 'Carinha', ['🐱', '🐶', '🐭', '🦊', '🧑', '👵', '🧔', '🤖', '👻']),
        area('alibi', 'Álibi (onde estava?)', { dica: 'Ex.: estava tirando uma soneca no sofá' }),
        sel('nivel', 'Nível de suspeita', ['Baixa', 'Média', 'Alta'], { metade: true }),
      ],
    },
    {
      id: 'pista', nome: 'Pista', plural: 'Pistas', emoji: '🔎', f: true, titulo: 'descricao',
      subtitulo: (d, nomeDe) => (d.suspeito ? `aponta para ${nomeDe(d.suspeito)}` : 'pista solta'),
      campos: [
        txt('descricao', 'Descrição da pista', { obrigatorio: true, dica: 'Ex.: pegadas de patinha na farinha' }),
        emoji('emoji', 'Emoji da pista', ['🔎', '👣', '🍫', '🧤', '🗝️', '📜', '🧶', '🪶', '💡']),
        ref('suspeito', 'Aponta para quem?', 'suspeito', { semOpcoes: '(sem suspeitos ainda)' }),
      ],
    },
  ],
  paineis: {
    caso: (c) => {
      const suspeitos = c.filhos('suspeito');
      const pistas = c.filhos('pista');
      const nota = (p) => `<div class="post-it">${esc(p.dados.emoji || '🔎')} ${esc(p.dados.descricao)}</div>`;
      const colunas = suspeitos.map((s) => `<div class="quadro-col"><h3>${esc(s.dados.emoji || '🧐')} ${esc(s.dados.nome)}</h3>
        ${pistas.filter((p) => p.dados.suspeito === s.id).map(nota).join('') || '<small>Sem pistas ainda</small>'}</div>`);
      const soltas = pistas.filter((p) => !p.dados.suspeito || !suspeitos.find((s) => s.id === p.dados.suspeito));
      if (soltas.length) colunas.push(`<div class="quadro-col"><h3>🧩 Pistas soltas</h3>${soltas.map(nota).join('')}</div>`);
      return `<section aria-labelledby="t-quadro"><h2 id="t-quadro">📌 Quadro de pistas</h2>
        ${colunas.length ? `<div class="quadro">${colunas.join('')}</div>` : '<p class="vazio-texto">Cadastre suspeitos e pistas para montar o quadro.</p>'}</section>`;
    },
  },
  documentos: [
    {
      id: 'relatorio', titulo: 'Relatório final do caso', de: 'caso', botao: '🖨️ Relatório final',
      render: (c) => {
        const suspeitos = c.filhos('suspeito');
        const pistas = c.filhos('pista');
        return `
          ${c.campo('Caso', c.d.titulo)}${c.campo('Local', c.d.local)}${c.campo('Data', c.data(c.d.data))}${c.campo('Situação', c.d.status)}
          ${c.bloco('O que aconteceu', c.d.resumo)}
          <section class="doc-bloco"><h4>Suspeitos e álibis</h4>
            ${suspeitos.length ? `<table class="doc-tabela"><thead><tr><th>Suspeito</th><th>Álibi</th><th>Suspeita</th></tr></thead><tbody>${suspeitos.map((s) => `<tr><td>${c.e(s.dados.emoji || '')} ${c.e(s.dados.nome)}</td><td>${c.e(s.dados.alibi || '')}</td><td>${c.e(s.dados.nivel || '')}</td></tr>`).join('')}</tbody></table>` : '<p>—</p>'}</section>
          <section class="doc-bloco"><h4>Pistas encontradas</h4>
            ${pistas.length ? `<ul class="doc-lista">${pistas.map((p) => `<li>${c.e(p.dados.emoji || '')} ${c.e(p.dados.descricao)}${p.dados.suspeito ? ` — aponta para <strong>${c.e(c.nome(p.dados.suspeito))}</strong>` : ''}</li>`).join('')}</ul>` : '<p>—</p>'}</section>
          ${c.campo('Quem foi', c.d.culpado ? c.nome(c.d.culpado) : '')}
          ${c.bloco('Conclusão', c.d.conclusao)}`;
      },
    },
  ],
  sorteios: [
    { pitch: 'O mistério do brigadeiro sumido na cozinha da vovó. 🍫', tipo: 'caso', dados: { titulo: 'O mistério do brigadeiro sumido', resumo: 'O brigadeiro da panela desapareceu durante a tarde.', local: 'Cozinha da vovó', status: 'Investigando' }, filhos: [{ tipo: 'suspeito', dados: { nome: 'Gato Mingau', emoji: '🐱', alibi: 'Estava dormindo no sofá.', nivel: 'Média' } }, { tipo: 'suspeito', dados: { nome: 'Papagaio Zeca', emoji: '🤖', alibi: 'Estava cantando no quintal.', nivel: 'Baixa' } }, { tipo: 'pista', dados: { descricao: 'Pegadas de patinha na farinha', emoji: '👣' } }, { tipo: 'pista', dados: { descricao: 'Migalhas de chocolate no tapete', emoji: '🍫' } }] },
    { pitch: 'Quem escondeu os óculos da vovó? Eles estavam na cabeça dela! 👓', tipo: 'caso', dados: { titulo: 'Os óculos desaparecidos', resumo: 'A vovó procurou por toda a casa e não achou os óculos.', local: 'Sala de estar', status: 'Investigando' }, filhos: [{ tipo: 'suspeito', dados: { nome: 'Cachorro Bolota', emoji: '🐶', alibi: 'Estava no passeio.', nivel: 'Baixa' } }, { tipo: 'suspeito', dados: { nome: 'Neto Theo', emoji: '🧑', alibi: 'Estava lendo um gibi.', nivel: 'Média' } }, { tipo: 'pista', dados: { descricao: 'Uma lente brilhando no sofá', emoji: '🔎' } }] },
    { pitch: 'O sumiço do último biscoito do pote. 🍪', tipo: 'caso', dados: { titulo: 'O último biscoito', resumo: 'O pote estava cheio de manhã e à noite só tinha farelo.', local: 'Cozinha', status: 'Investigando' }, filhos: [{ tipo: 'suspeito', dados: { nome: 'Rato Queijinho', emoji: '🐭', alibi: 'Estava na casa de um amigo.', nivel: 'Média' } }, { tipo: 'suspeito', dados: { nome: 'Fantasma Fofo', emoji: '👻', alibi: 'Estava assustando a cortina.', nivel: 'Alta' } }, { tipo: 'pista', dados: { descricao: 'Farelos em fila indiana', emoji: '🪶' } }] },
    { pitch: 'Quem pintou as pegadas coloridas no corredor? 🎨', tipo: 'caso', dados: { titulo: 'As pegadas coloridas', resumo: 'Apareceram pegadas de tinta azul e rosa em todo o corredor.', local: 'Corredor da escola', status: 'Investigando' }, filhos: [{ tipo: 'suspeito', dados: { nome: 'Pintora Mia', emoji: '🧑', alibi: 'Estava na aula de artes.', nivel: 'Baixa' } }, { tipo: 'suspeito', dados: { nome: 'Gato Mingau', emoji: '🐱', alibi: 'Dormindo na mochila.', nivel: 'Média' } }, { tipo: 'pista', dados: { descricao: 'Pegadas de patinha pequena', emoji: '👣' } }] },
    { pitch: 'A chave do baú de brinquedos sumiu. 🗝️', tipo: 'caso', dados: { titulo: 'A chave do baú', resumo: 'O baú de brinquedos está trancado e ninguém acha a chave.', local: 'Quarto de brinquedos', status: 'Investigando' }, filhos: [{ tipo: 'suspeito', dados: { nome: 'Gatinho Tico', emoji: '🐱', alibi: 'Estava abraçando a Lia.', nivel: 'Baixa' } }, { tipo: 'pista', dados: { descricao: 'Um barbante com uma chave desenhada', emoji: '🗝️' } }] },
  ],
  exemplo: [{
    tipo: 'caso', dados: { titulo: 'O mistério do brigadeiro sumido', resumo: 'O brigadeiro da panela desapareceu durante a tarde.', local: 'Cozinha da vovó', status: 'Investigando' },
    filhos: [
      { tipo: 'suspeito', dados: { nome: 'Gato Mingau', emoji: '🐱', alibi: 'Estava dormindo no sofá.', nivel: 'Média' } },
      { tipo: 'pista', dados: { descricao: 'Pegadas de patinha na farinha', emoji: '👣' } },
    ],
  }],
};
