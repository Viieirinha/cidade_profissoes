import { txt, area, num, data, sel, chips, odontograma } from '../core/campos.js';
import { htmlOdontograma } from '../core/formulario.js';
import { fmtData } from '../core/ui.js';

// Monta os 32 dentes: D({ 3: 'e' }) deixa o dente 3 "precisando de escovinha" e o resto saudável.
const D = (m) => Array.from({ length: 32 }, (_, i) => m[i + 1] || 's');

export default {
  id: 'dentista',
  nome: 'Dentista',
  emoji: '🦷',
  cor: '#0277bd',
  local: 'Clínica Sorriso da Dra.',
  cargo: 'Dra.',
  sigla: 'CRO-BRINCA',
  saude: true,
  aviso: 'Se alguém estiver com dor de verdade, chame um adulto.',
  descricao: 'Odontograma clicável e atestado de coragem',
  selos: { cadastro: 'Primeiro sorriso cadastrado!', atendimento: 'Primeiro sorriso atendido!' },
  entidades: [
    {
      id: 'paciente', nome: 'Paciente', plural: 'Pacientes', emoji: '😁', titulo: 'nome',
      subtitulo: (d) => [d.tipo, d.idade !== '' && d.idade != null ? `${d.idade} anos` : ''].filter(Boolean).join(' · '),
      campos: [
        txt('nome', 'Apelido do paciente', { obrigatorio: true, dica: 'Ex.: Boneca Rosinha' }),
        num('idade', 'Idade', { min: 0, max: 120, metade: true }),
        sel('tipo', 'Tipo de paciente', ['Amiga ou amigo', 'Ursinho de pelúcia', 'Boneca', 'Dragão de faz de conta', 'Outro'], { metade: true }),
        odontograma('dentes', 'Odontograma (toque nos dentes)'),
        area('obs', 'Anotações'),
      ],
    },
    {
      id: 'consulta', nome: 'Consulta', plural: 'Consultas', emoji: '📋', f: true,
      titulo: (d) => `Consulta de ${fmtData(d.data)}`,
      subtitulo: (d) => (d.coragem ? `Coragem: ${d.coragem}` : ''),
      campos: [
        data('data', 'Data', { padrao: 'hoje', obrigatorio: true }),
        chips('motivo', 'Motivo da visita', ['Visita de rotina', 'Sorriso para a foto', 'Dentinho mole (fada do dente!)', 'Escova nova', 'Dentinho brilhando']),
        chips('plano', 'Plano de tratamento de brincadeira', [
          'Dança da escovação 🪥', 'Sorriso no espelho 😁', 'Escolher uma escova colorida 🌈', 'Conversar com a Fada do Dente 🧚', 'Contar até 10 de boca aberta 🔢',
        ], { ajuda: 'Tudo de faz de conta.' }),
        area('anotacoes', 'Anotações da dentista'),
        sel('coragem', 'Nível de coragem', ['Corajosa(o)', 'Muito corajosa(o)', 'Super-herói / super-heroína dos dentes'], { obrigatorio: true }),
        data('retorno', 'Data de retorno'),
      ],
    },
  ],
  documentos: [
    {
      id: 'atestado', titulo: 'Atestado de Coragem', de: 'consulta', botao: '🖨️ Atestado de coragem',
      render: (c) => `
        <p style="font-size:1.1rem;text-align:center;margin:1rem 0">Atesto, de brincadeira, que
          <strong>${c.e(c.dp.nome || '')}</strong> compareceu à consulta de ${c.e(c.data(c.d.data))} e foi
          <strong>${c.e((c.d.coragem || 'corajosa(o)').toLowerCase())}</strong> durante todo o atendimento! 🦷✨</p>
        <p style="text-align:center;font-size:3rem;margin:.4rem 0">🏅</p>
        ${c.d.plano && c.d.plano.length ? `<section class="doc-bloco"><h4>Plano de tratamento de brincadeira</h4>${c.ul(c.d.plano)}</section>` : ''}
        ${c.campo('Retorno', c.d.retorno ? c.data(c.d.retorno) : '')}`,
    },
    {
      id: 'ficha', titulo: 'Ficha do paciente', de: 'paciente', botao: '🖨️ Ficha e odontograma',
      render: (c) => `
        ${c.campo('Paciente', c.d.nome)}${c.campo('Idade', c.d.idade !== '' && c.d.idade != null ? `${c.d.idade} anos` : '')}${c.campo('Tipo', c.d.tipo)}
        <section class="doc-bloco"><h4>Odontograma</h4>${htmlOdontograma(c.d.dentes, false)}</section>
        ${c.bloco('Anotações', c.d.obs)}`,
    },
    {
      id: 'cartao-retorno', titulo: 'Cartão de retorno', de: 'consulta', botao: '🖨️ Cartão de retorno',
      render: (c) => `<p style="text-align:center;font-size:2.6rem;margin:.2rem">🦷</p>
        <p style="text-align:center;font-size:1.25rem"><strong>${c.e(c.dp.nome || '')}</strong>, seu próximo encontro com a Fada do Dente!</p>
        <p style="text-align:center;font-size:1.5rem;margin:.6rem 0">${c.d.retorno ? `Volte em <strong>${c.e(c.data(c.d.retorno))}</strong>` : 'Volte quando quiser exibir seu sorriso!'}</p>
        <p style="text-align:center">Não esqueça a escova e o melhor sorriso. 🪥😁</p>`,
    },
    {
      id: 'certificado-sorriso', titulo: 'Certificado Sorriso Brilhante', de: 'paciente', botao: '🖨️ Certificado de sorriso',
      render: (c) => `<p style="text-align:center;font-size:3.4rem;margin:.2rem">😁✨</p>
        <p style="text-align:center;font-size:1.2rem">Este certificado de brincadeira é entregue a</p>
        <p style="text-align:center;font-size:2rem;margin:.3rem 0"><strong>${c.e(c.d.nome)}</strong></p>
        <p style="text-align:center">pelo <strong>Sorriso Mais Brilhante</strong> da clínica! 🌟</p>`,
    },
  ],
  sorteios: [
    { pitch: 'A boneca Rosinha precisa de uma visita de rotina para o sorriso ficar brilhando. ✨', tipo: 'paciente', dados: { nome: 'Boneca Rosinha', idade: 7, tipo: 'Boneca', dentes: D({ 4: 'b', 5: 'b', 20: 'e' }) }, filhos: [{ tipo: 'consulta', dados: { motivo: ['Visita de rotina'] } }] },
    { pitch: 'O ursinho Teddy está com um dentinho mole e quer falar com a Fada do Dente. 🧚', tipo: 'paciente', dados: { nome: 'Ursinho Teddy', idade: 5, tipo: 'Ursinho de pelúcia', dentes: D({ 9: 'f', 24: 'f' }) }, filhos: [{ tipo: 'consulta', dados: { motivo: ['Dentinho mole (fada do dente!)'] } }] },
    { pitch: 'O dragão Chama vai tirar uma foto e quer um sorriso de cinema. 📸', tipo: 'paciente', dados: { nome: 'Dragão Chama', idade: 300, tipo: 'Dragão de faz de conta', dentes: D({ 1: 'e', 2: 'e', 16: 'e' }) }, filhos: [{ tipo: 'consulta', dados: { motivo: ['Sorriso para a foto'] } }] },
    { pitch: 'O vovô Beto ganhou uma escova nova colorida e quer testar. 🪥', tipo: 'paciente', dados: { nome: 'Vovô Beto', idade: 68, tipo: 'Amiga ou amigo', dentes: D({ 12: 'o', 13: 'b' }) }, filhos: [{ tipo: 'consulta', dados: { motivo: ['Escova nova'] } }] },
    { pitch: 'O leão Leo diz que seus dentes estão brilhando mais que o sol. ☀️', tipo: 'paciente', dados: { nome: 'Leão Leo', idade: 10, tipo: 'Bichinho de pelúcia', dentes: D({ 7: 'b', 8: 'b', 25: 'b', 26: 'b' }) }, filhos: [{ tipo: 'consulta', dados: { motivo: ['Dentinho brilhando'] } }] },
  ],
  exemplo: [{
    tipo: 'paciente',
    dados: { nome: 'Boneca Rosinha', idade: 7, tipo: 'Boneca', obs: 'Sorriso de estrela.' },
    filhos: [{ tipo: 'consulta', dados: { motivo: ['Visita de rotina'], plano: ['Dança da escovação 🪥'], coragem: 'Muito corajosa(o)' } }],
  }],
};
