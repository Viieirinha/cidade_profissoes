import { txt, area, num, data, sel, chips, emoji, ref, refmulti } from '../core/campos.js';
import { fmtData } from '../core/ui.js';

const MATERIAS = ['Português', 'Matemática', 'Ciências', 'História', 'Geografia', 'Artes', 'Educação Física', 'Inglês', 'Música'];

export default {
  id: 'professora',
  nome: 'Professora',
  emoji: '👩‍🏫',
  cor: '#b45309',
  local: 'Escola da Profa.',
  cargo: 'Profa.',
  sigla: 'MEC-BRINCA',
  descricao: 'Turmas, chamada, notas e boletim',
  selos: { cadastro: 'Primeira turma criada!', atendimento: 'Primeira aluna cadastrada!' },
  entidades: [
    {
      id: 'turma', nome: 'Turma', plural: 'Turmas', emoji: '🏫', f: true, titulo: 'nome', subtitulo: (d) => d.ano || '',
      campos: [
        txt('nome', 'Nome da turma', { obrigatorio: true, dica: 'Ex.: Turma das Estrelas' }),
        txt('ano', 'Ano ou série', { dica: 'Ex.: 5º ano' }),
        chips('materias', 'Matérias', MATERIAS),
      ],
    },
    {
      id: 'aluna', nome: 'Aluna', plural: 'Alunas', emoji: '🧒', f: true, titulo: 'nome',
      campos: [
        txt('nome', 'Apelido da aluna ou aluno', { obrigatorio: true, dica: 'Ex.: Lia' }),
        emoji('emoji', 'Carinha', ['🧒', '👧', '👦', '🧑', '🦸', '🧙', '🧚', '🐱']),
        area('obs', 'Anotações'),
      ],
    },
    {
      id: 'chamada', nome: 'Chamada', plural: 'Chamadas', emoji: '✅', f: true,
      titulo: (d) => `Chamada de ${fmtData(d.data)}`, subtitulo: (d) => `${(d.presentes || []).length} presentes`,
      campos: [
        data('data', 'Data', { padrao: 'hoje', obrigatorio: true }),
        refmulti('presentes', 'Quem veio hoje?', 'aluna', { semOpcoes: 'Cadastre as alunas primeiro.' }),
      ],
    },
    {
      id: 'nota', nome: 'Nota', plural: 'Notas', emoji: '📝', f: true,
      titulo: (d, nomeDe) => `${nomeDe(d.aluna)} — ${d.materia}: ${d.nota}`,
      subtitulo: (d) => d.bimestre || '',
      campos: [
        ref('aluna', 'Aluna', 'aluna', { obrigatorio: true, semOpcoes: 'Cadastre as alunas primeiro.' }),
        txt('materia', 'Matéria', { obrigatorio: true, sugestoes: MATERIAS }),
        num('nota', 'Nota (0 a 10)', { min: 0, max: 10, passo: 0.5, obrigatorio: true, metade: true }),
        sel('bimestre', 'Bimestre', ['1º bimestre', '2º bimestre', '3º bimestre', '4º bimestre'], { metade: true }),
      ],
    },
  ],
  documentos: [
    {
      id: 'boletim', titulo: 'Boletim', de: 'aluna', botao: '🖨️ Boletim',
      render: (c) => {
        const notas = c.filhos('nota', c.pai.id).filter((n) => n.dados.aluna === c.reg.id);
        const porMat = {};
        notas.forEach((n) => { (porMat[n.dados.materia] = porMat[n.dados.materia] || []).push(Number(n.dados.nota)); });
        const mats = Object.keys(porMat);
        const chamadas = c.filhos('chamada', c.pai.id);
        const presencas = chamadas.filter((x) => (x.dados.presentes || []).includes(c.reg.id)).length;
        const media = (a) => (a.reduce((s, x) => s + x, 0) / a.length);
        return `
          ${c.campo('Aluna', c.d.nome)}${c.campo('Turma', `${c.dp.nome || ''} ${c.dp.ano ? '(' + c.dp.ano + ')' : ''}`)}
          <table class="doc-tabela"><thead><tr><th>Matéria</th><th>Notas</th><th class="dir">Média</th></tr></thead><tbody>
          ${mats.length ? mats.map((m) => `<tr><td>${c.e(m)}</td><td>${porMat[m].map((x) => c.e(x)).join(' · ')}</td><td class="dir"><strong>${media(porMat[m]).toFixed(1).replace('.', ',')}</strong></td></tr>`).join('')
            : '<tr><td colspan="3">Ainda não há notas.</td></tr>'}
          </tbody></table>
          ${c.campo('Presença', chamadas.length ? `${presencas} de ${chamadas.length} aulas` : '')}
          <p style="margin-top:1rem">⭐ <em>Continue brilhando! A professora tem orgulho de você.</em></p>`;
      },
    },
    {
      id: 'lista-chamada', titulo: 'Lista de chamada', de: 'chamada', botao: '🖨️ Lista',
      render: (c) => {
        const alunas = c.filhos('aluna', c.pai.id);
        return `${c.campo('Turma', c.dp.nome)}${c.campo('Data', c.data(c.d.data))}
          <table class="doc-tabela"><thead><tr><th>Aluna</th><th>Presença</th></tr></thead><tbody>
          ${alunas.map((a) => `<tr><td>${c.e(a.dados.nome)}</td><td>${(c.d.presentes || []).includes(a.id) ? '✅ Presente' : '⬜ Faltou'}</td></tr>`).join('')}
          </tbody></table>`;
      },
    },
    {
      id: 'certificado', titulo: 'Certificado de Estrela da Turma', de: 'aluna', botao: '🖨️ Certificado',
      render: (c) => `<p style="text-align:center;font-size:3.4rem;margin:.2rem">⭐</p>
        <p style="text-align:center;font-size:1.2rem">Este certificado de brincadeira é entregue a</p>
        <p style="text-align:center;font-size:2rem;margin:.3rem 0">${c.e(c.d.emoji || '')} <strong>${c.e(c.d.nome)}</strong></p>
        <p style="text-align:center">da turma <strong>${c.e(c.dp.nome || '')}</strong>, por ser uma verdadeira <strong>Estrela da Turma</strong>! 🌟</p>`,
    },
    {
      id: 'bilhete', titulo: 'Bilhete para casa', de: 'aluna', botao: '🖨️ Bilhete para casa',
      render: (c) => `<p>Querida família de <strong>${c.e(c.d.nome)}</strong>,</p>
        <p>Hoje foi um dia muito especial na turma ${c.e(c.dp.nome || '')}. Escreva abaixo um recado da professora:</p>
        <div style="border-bottom:1.5px dotted #6b6278;height:2rem"></div><div style="border-bottom:1.5px dotted #6b6278;height:2rem"></div><div style="border-bottom:1.5px dotted #6b6278;height:2rem"></div>
        <p style="margin-top:.8rem">Com carinho, ${c.e(c.prof.cargo)} 💛</p>`,
    },
  ],
  sorteios: [
    { pitch: 'Nova turma: a Turma das Estrelas chegou animada! ⭐', tipo: 'turma', dados: { nome: 'Turma das Estrelas', ano: '5º ano', materias: ['Português', 'Matemática', 'Ciências'] }, filhos: [{ tipo: 'aluna', dados: { nome: 'Lia', emoji: '👧' } }, { tipo: 'aluna', dados: { nome: 'Theo', emoji: '👦' } }, { tipo: 'aluna', dados: { nome: 'Bia', emoji: '🧒' } }] },
    { pitch: 'Nova turma: a Turma dos Dinossauros adora aprender com fósseis! 🦖', tipo: 'turma', dados: { nome: 'Turma dos Dinossauros', ano: '4º ano', materias: ['Ciências', 'História', 'Artes'] }, filhos: [{ tipo: 'aluna', dados: { nome: 'Rex', emoji: '🦸' } }, { tipo: 'aluna', dados: { nome: 'Dudu', emoji: '👦' } }, { tipo: 'aluna', dados: { nome: 'Mia', emoji: '👧' } }] },
    { pitch: 'Nova turma: a Turma do Arco-íris tem aula de música hoje! 🌈', tipo: 'turma', dados: { nome: 'Turma do Arco-íris', ano: '6º ano', materias: ['Música', 'Português', 'Inglês'] }, filhos: [{ tipo: 'aluna', dados: { nome: 'Nina', emoji: '🧚' } }, { tipo: 'aluna', dados: { nome: 'Caio', emoji: '🧒' } }, { tipo: 'aluna', dados: { nome: 'Sol', emoji: '👧' } }] },
    { pitch: 'Nova turma: a Turma dos Super-Heróis precisa aprender frações! 🦸', tipo: 'turma', dados: { nome: 'Turma dos Super-Heróis', ano: '5º ano', materias: ['Matemática', 'Educação Física', 'Geografia'] }, filhos: [{ tipo: 'aluna', dados: { nome: 'Capitã Lu', emoji: '🦸' } }, { tipo: 'aluna', dados: { nome: 'Raio', emoji: '🧒' } }, { tipo: 'aluna', dados: { nome: 'Pipa', emoji: '👧' } }] },
  ],
  exemplo: [{
    tipo: 'turma', dados: { nome: 'Turma das Estrelas', ano: '5º ano', materias: ['Português', 'Matemática', 'Ciências'] },
    filhos: [{ tipo: 'aluna', dados: { nome: 'Lia', emoji: '👧' } }, { tipo: 'aluna', dados: { nome: 'Theo', emoji: '👦' } }],
  }],
};
