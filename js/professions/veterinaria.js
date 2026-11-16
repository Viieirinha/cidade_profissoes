import { txt, area, num, data, sel, chips, emoji, secao } from '../core/campos.js';
import { fmtData } from '../core/ui.js';

export default {
  id: 'veterinaria',
  nome: 'Veterinária',
  emoji: '🐾',
  cor: '#00796b',
  local: 'Clínica Veterinária da Dra.',
  cargo: 'Dra. Vet',
  sigla: 'VET-BRINCA',
  saude: true,
  aviso: 'Se um bichinho de verdade estiver doente, chame um adulto.',
  descricao: 'Pets, ursinhos de pelúcia e carteirinha de vacinação',
  selos: { cadastro: 'Primeiro bichinho cadastrado!', atendimento: 'Primeiro bichinho atendido!' },
  entidades: [
    {
      id: 'pet', nome: 'Pet', plural: 'Pets e pelúcias', emoji: '🐶', titulo: 'nome',
      subtitulo: (d) => [d.especie, d.tutor ? `tutor(a): ${d.tutor}` : ''].filter(Boolean).join(' · '),
      campos: [
        txt('nome', 'Nome do bichinho', { obrigatorio: true, dica: 'Ex.: Mingau' }),
        emoji('emoji', 'Carinha', ['🐱', '🐶', '🐰', '🐹', '🐦', '🧸', '🐉', '🐢', '🦄']),
        sel('especie', 'Espécie', ['Gato', 'Cachorro', 'Coelho', 'Hamster', 'Passarinho', 'Ursinho de pelúcia', 'Dragão de faz de conta', 'Outro'], { metade: true }),
        txt('tutor', 'Tutor(a) (apelido)', { metade: true, dica: 'Ex.: Vovó Lu' }),
        num('idade', 'Idade (anos)', { min: 0, max: 100, metade: true }),
        area('obs', 'Anotações', { dica: 'Ex.: adora bolinha e dormir no sol' }),
      ],
    },
    {
      id: 'consulta', nome: 'Consulta', plural: 'Consultas', emoji: '📋', f: true,
      titulo: (d) => `Consulta de ${fmtData(d.data)}`,
      subtitulo: (d) => (d.diagnostico || '').slice(0, 60),
      campos: [
        data('data', 'Data', { padrao: 'hoje', obrigatorio: true }),
        chips('sintomas', 'O que o bichinho tem?', [
          'Não quer brincar', 'Derrubou o vaso', 'Ronronando demais', 'Rabinho balançando sem parar', 'Costura soltinha (pelúcia)',
          'Latido de alegria', 'Quer colo o dia todo', 'Bigodinhos tortos',
        ]),
        area('sintomasLivre', 'Outros sintomas'),
        num('peso', 'Peso', { unidade: 'kg', passo: 0.1, min: 0, max: 300, metade: true }),
        area('diagnostico', 'Diagnóstico de brincadeira', { sugestoes: ['Muita energia', 'Saudade do dono', 'Travessura confirmada', 'Soneca atrasada'] }),
        chips('receita', 'Receita para o bichinho', [
          'Carinho na barriguinha 🐾', 'Passeio de 10 minutos 🌳', 'Petisco imaginário 🦴', 'Cama fofinha 🛏️',
          'Brincar com bolinha ⚽', 'Banho de espuma de mentirinha 🫧',
        ], { ajuda: 'Só itens de brincadeira! Nada de remédio de verdade.' }),
        data('retorno', 'Data de retorno'),
      ],
    },
    {
      id: 'vacina', nome: 'Vacina de brincadeira', plural: 'Carteirinha de vacinação', emoji: '⭐', f: true,
      titulo: 'nome', subtitulo: (d) => (d.data ? `em ${fmtData(d.data)}` : ''),
      campos: [
        txt('nome', 'Nome da vacina de faz de conta', { obrigatorio: true, sugestoes: ['Vacina do Pulo Alto', 'Vacina da Fofura', 'Vacina do Ronronar', 'Vacina da Coragem'] }),
        data('data', 'Data', { padrao: 'hoje' }),
        data('proxima', 'Próxima dose'),
      ],
    },
  ],
  documentos: [
    {
      id: 'receita', titulo: 'Receita para o bichinho', de: 'consulta', botao: '🖨️ Receita',
      render: (c) => `
        ${c.campo('Bichinho', `${c.dp.emoji || ''} ${c.dp.nome || ''}`)}
        ${c.campo('Espécie', c.dp.especie)}
        ${c.campo('Tutor(a)', c.dp.tutor)}
        ${c.campo('Consulta', c.data(c.d.data))}
        ${c.campo('Sintomas', [...(c.d.sintomas || []), ...(c.d.sintomasLivre ? [c.d.sintomasLivre] : [])])}
        ${c.campo('Peso', c.d.peso !== '' && c.d.peso != null ? `${c.d.peso} kg` : '')}
        ${c.bloco('Diagnóstico de brincadeira', c.d.diagnostico)}
        <section class="doc-bloco"><h4>℞ Receita de faz de conta</h4>
          ${(c.d.receita || []).length ? `<ol class="doc-receita">${c.d.receita.map((r) => `<li>${c.e(r)}</li>`).join('')}</ol>` : '<p>—</p>'}</section>
        ${c.campo('Retorno', c.d.retorno ? c.data(c.d.retorno) : '')}`,
    },
    {
      id: 'carteirinha', titulo: 'Carteirinha de vacinação divertida', de: 'pet', botao: '🖨️ Carteirinha',
      render: (c) => {
        const vs = c.filhos('vacina');
        return `
        <p class="doc-campo" style="font-size:1.4rem">${c.e(c.d.emoji || '🐾')} <strong>${c.e(c.d.nome)}</strong></p>
        ${c.campo('Espécie', c.d.especie)}${c.campo('Tutor(a)', c.d.tutor)}
        <table class="doc-tabela"><thead><tr><th>Vacina de brincadeira</th><th>Data</th><th>Próxima dose</th><th>Selo</th></tr></thead><tbody>
        ${vs.length ? vs.map((v) => `<tr><td>${c.e(v.dados.nome)}</td><td>${c.e(c.data(v.dados.data))}</td><td>${c.e(c.data(v.dados.proxima))}</td><td>⭐</td></tr>`).join('') : '<tr><td colspan="4">Nenhuma vacina de brincadeira ainda.</td></tr>'}
        </tbody></table>`;
      },
    },
    {
      id: 'ficha', titulo: 'Ficha do bichinho', de: 'pet', botao: '🖨️ Ficha do bichinho',
      render: (c) => {
        const cs = c.filhos('consulta');
        const vs = c.filhos('vacina');
        return `<p class="doc-campo" style="font-size:1.4rem">${c.e(c.d.emoji || '🐾')} <strong>${c.e(c.d.nome)}</strong></p>
          ${c.campo('Espécie', c.d.especie)}${c.campo('Tutor(a)', c.d.tutor)}${c.bloco('Anotações', c.d.obs)}
          <section class="doc-bloco"><h4>Consultas</h4>
          <table class="doc-tabela"><thead><tr><th>Data</th><th>Sintomas</th><th>Diagnóstico</th></tr></thead><tbody>
          ${cs.length ? cs.map((x) => `<tr><td>${c.e(c.data(x.dados.data))}</td><td>${c.e((x.dados.sintomas || []).join(', '))}</td><td>${c.e(x.dados.diagnostico || '')}</td></tr>`).join('') : '<tr><td colspan="3">Nenhuma consulta ainda.</td></tr>'}
          </tbody></table></section>
          <section class="doc-bloco"><h4>Vacinas de brincadeira</h4>${vs.length ? c.ul(vs.map((v) => `${v.dados.nome} (${c.data(v.dados.data)})`)) : '<p>—</p>'}</section>`;
      },
    },
    {
      id: 'medalha', titulo: 'Medalha de Bom Bichinho', de: 'pet', botao: '🖨️ Medalha',
      render: (c) => `<p style="text-align:center;font-size:4rem;margin:.2rem">🏅</p>
        <p style="text-align:center;font-size:1.3rem">A medalha de <strong>Bom Bichinho</strong> vai para</p>
        <p style="text-align:center;font-size:2rem;margin:.3rem 0">${c.e(c.d.emoji || '🐾')} <strong>${c.e(c.d.nome)}</strong></p>
        <p style="text-align:center">por ser muito fofo(a), corajoso(a) e ficar quietinho(a) na consulta!${c.d.tutor ? `<br>Tutor(a): ${c.e(c.d.tutor)}` : ''}</p>`,
    },
  ],
  sorteios: [
    { pitch: 'O gato Mingau derrubou o vaso e agora está com cara de inocente. 🐱', tipo: 'pet', dados: { nome: 'Mingau', emoji: '🐱', especie: 'Gato', tutor: 'Vovó Lu', idade: 3 }, filhos: [{ tipo: 'consulta', dados: { sintomas: ['Derrubou o vaso', 'Ronronando demais'], peso: 4.1 } }] },
    { pitch: 'A hamster Pipoca não quer mais brincar na rodinha. 🐹', tipo: 'pet', dados: { nome: 'Pipoca', emoji: '🐹', especie: 'Hamster', tutor: 'Lia', idade: 1 }, filhos: [{ tipo: 'consulta', dados: { sintomas: ['Não quer brincar'], peso: 0.1 } }] },
    { pitch: 'O cachorro Bolota está com latido de alegria e não para de abanar o rabinho! 🐶', tipo: 'pet', dados: { nome: 'Bolota', emoji: '🐶', especie: 'Cachorro', tutor: 'Theo', idade: 2 }, filhos: [{ tipo: 'consulta', dados: { sintomas: ['Latido de alegria', 'Rabinho balançando sem parar'], peso: 9 } }] },
    { pitch: 'O dragãozinho Fumaça está espirrando faíscas de mentirinha. 🐉', tipo: 'pet', dados: { nome: 'Fumaça', emoji: '🐉', especie: 'Dragão de faz de conta', tutor: 'Capitã Estrela', idade: 100 }, filhos: [{ tipo: 'consulta', dados: { sintomas: ['Bigodinhos tortos'], sintomasLivre: 'Espirra faíscas coloridas.' } }] },
    { pitch: 'O coelhinho de pelúcia Algodão está com a costura soltinha no bracinho. 🧸', tipo: 'pet', dados: { nome: 'Algodão', emoji: '🧸', especie: 'Ursinho de pelúcia', tutor: 'Bia', idade: 4 }, filhos: [{ tipo: 'consulta', dados: { sintomas: ['Costura soltinha (pelúcia)'], peso: 0.3 } }] },
  ],
  exemplo: [{
    tipo: 'pet',
    dados: { nome: 'Mingau', emoji: '🐱', especie: 'Gato', tutor: 'Vovó Lu', idade: 3, obs: 'Derruba vasos por esporte.' },
    filhos: [
      { tipo: 'consulta', dados: { sintomas: ['Derrubou o vaso', 'Ronronando demais'], diagnostico: 'Travessura confirmada', receita: ['Brincar com bolinha ⚽', 'Cama fofinha 🛏️'] } },
      { tipo: 'vacina', dados: { nome: 'Vacina do Ronronar' } },
    ],
  }],
};
