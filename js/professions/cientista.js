import { txt, area, data, sel, chips } from '../core/campos.js';
import { fmtData } from '../core/ui.js';

export default {
  id: 'cientista',
  nome: 'Cientista',
  emoji: '🔬',
  cor: '#2e7d32',
  local: 'Laboratório da Dra.',
  cargo: 'Cientista',
  sigla: 'CIEN-BRINCA',
  aviso: 'Experimentos de verdade só com um adulto por perto.',
  descricao: 'Experimentos, observações e relatório científico',
  selos: { cadastro: 'Primeiro experimento criado!', atendimento: 'Primeira observação anotada!' },
  entidades: [
    {
      id: 'experimento', nome: 'Experimento', plural: 'Experimentos', emoji: '🧪', titulo: 'titulo', subtitulo: (d) => d.resultado ? `Resultado: ${d.resultado}` : '',
      campos: [
        txt('titulo', 'Título do experimento', { obrigatorio: true, dica: 'Ex.: Será que a planta gosta de música?' }),
        area('hipotese', 'Hipótese (o que você acha que vai acontecer?)'),
        chips('materiais', 'Materiais', ['Lupa', 'Papel colorido', 'Copo transparente', 'Régua', 'Massinha', 'Balão', 'Sementes', 'Caderno de anotações']),
        sel('resultado', 'Deu certo?', ['Deu certo!', 'Deu mais ou menos', 'Não deu como esperado — e aprendi algo!'], { metade: true }),
        area('conclusao', 'Conclusão', { sugestoes: ['A hipótese estava certa!', 'Descobri que preciso testar de novo.', 'Aprendi algo que não esperava!'] }),
      ],
    },
    {
      id: 'observacao', nome: 'Observação', plural: 'Observações', emoji: '👀', f: true, titulo: (d) => `Observação de ${fmtData(d.data)}`, subtitulo: (d) => (d.texto || '').slice(0, 70),
      campos: [
        data('data', 'Data', { padrao: 'hoje', obrigatorio: true }),
        area('texto', 'O que você observou?', { obrigatorio: true, linhas: 4 }),
      ],
    },
  ],
  documentos: [
    {
      id: 'relatorio', titulo: 'Relatório científico', de: 'experimento', botao: '🖨️ Relatório',
      render: (c) => {
        const obs = c.filhos('observacao');
        return `${c.campo('Experimento', c.d.titulo)}
          ${c.bloco('Hipótese', c.d.hipotese)}
          ${c.d.materiais && c.d.materiais.length ? `<section class="doc-bloco"><h4>Materiais</h4>${c.ul(c.d.materiais)}</section>` : ''}
          <section class="doc-bloco"><h4>Observações</h4>${obs.length ? `<ol class="doc-lista">${obs.map((o) => `<li><strong>${c.e(c.data(o.dados.data))}:</strong> ${c.e(o.dados.texto)}</li>`).join('')}</ol>` : '<p>—</p>'}</section>
          ${c.campo('Resultado', c.d.resultado)}
          ${c.bloco('Conclusão', c.d.conclusao)}`;
      },
    },
  ],
  exemplo: [{
    tipo: 'experimento', dados: { titulo: 'Será que a planta gosta de música?', hipotese: 'Acho que a plantinha vai crescer mais feliz ouvindo música.', materiais: ['Sementes', 'Caderno de anotações'] },
    filhos: [{ tipo: 'observacao', dados: { texto: 'A sementinha ainda está dormindo.' } }],
  }],
};
