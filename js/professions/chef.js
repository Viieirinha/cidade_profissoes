import { txt, area, num, sel, emoji, itens } from '../core/campos.js';
import { fmtMoeda } from '../core/ui.js';

const CATEGORIAS = ['Entrada', 'Prato principal', 'Sobremesa', 'Bebida'];

export default {
  id: 'chef',
  nome: 'Chef',
  emoji: '👩‍🍳',
  cor: '#c43e12',
  local: 'Restaurante da Chef',
  cargo: 'Chef',
  sigla: 'CHEF-BRINCA',
  descricao: 'Cardápio, comandas, contas e receitas',
  selos: { cadastro: 'Primeiro cardápio criado!', atendimento: 'Primeiro prato criado!' },
  entidades: [
    {
      id: 'cardapio', nome: 'Cardápio', plural: 'Cardápios', emoji: '📖', titulo: 'nome', subtitulo: (d) => d.tema || '',
      campos: [
        txt('nome', 'Nome do restaurante ou cardápio', { obrigatorio: true, dica: 'Ex.: Cantinho do Brigadeiro' }),
        txt('tema', 'Tema', { dica: 'Ex.: Festa junina de mentirinha' }),
      ],
    },
    {
      id: 'prato', nome: 'Prato', plural: 'Pratos', emoji: '🍽️', titulo: 'nome',
      subtitulo: (d) => [d.categoria, d.preco !== '' && d.preco != null ? fmtMoeda(d.preco) : ''].filter(Boolean).join(' · '),
      campos: [
        txt('nome', 'Nome do prato', { obrigatorio: true, dica: 'Ex.: Brigadeiro de colher' }),
        emoji('emoji', 'Emoji do prato', ['🍫', '🍕', '🍝', '🥗', '🍰', '🧁', '🍓', '🥞', '🍦', '🧃', '🌮', '🍪']),
        sel('categoria', 'Categoria', CATEGORIAS, { obrigatorio: true, metade: true }),
        num('preco', 'Preço (moedinhas de brincadeira)', { min: 0, max: 999, passo: 0.5, metade: true }),
        area('ingredientes', 'Ingredientes', { dica: 'Um por linha' }),
        area('modo', 'Modo de preparo', { linhas: 4 }),
      ],
    },
    {
      id: 'comanda', nome: 'Comanda', plural: 'Comandas', emoji: '🧾', f: true,
      titulo: (d) => `Mesa ${d.mesa}${d.cliente ? ' — ' + d.cliente : ''}`,
      subtitulo: (d) => `${Object.values(d.pedido || {}).reduce((s, q) => s + q, 0)} itens`,
      campos: [
        num('mesa', 'Número da mesa', { min: 1, max: 99, obrigatorio: true, metade: true }),
        txt('cliente', 'Cliente (apelido)', { metade: true }),
        itens('pedido', 'Pedido', 'prato', { semOpcoes: 'Crie alguns pratos primeiro.' }),
      ],
    },
  ],
  documentos: [
    {
      id: 'conta', titulo: 'Conta do restaurante', de: 'comanda', botao: '🖨️ Conta',
      render: (c) => {
        const linhas = Object.entries(c.d.pedido || {}).map(([id, q]) => {
          const p = c.pai && c.filhos('prato', c.pai.id).find((x) => x.id === id);
          const preco = p ? Number(p.dados.preco) || 0 : 0;
          return { nome: p ? `${p.dados.emoji || ''} ${p.dados.nome}` : '(prato apagado)', q, preco, sub: preco * q };
        });
        const total = linhas.reduce((s, l) => s + l.sub, 0);
        return `${c.campo('Mesa', c.d.mesa)}${c.campo('Cliente', c.d.cliente)}
          <table class="doc-tabela"><thead><tr><th>Item</th><th class="dir">Qtde</th><th class="dir">Preço</th><th class="dir">Subtotal</th></tr></thead><tbody>
          ${linhas.length ? linhas.map((l) => `<tr><td>${c.e(l.nome)}</td><td class="dir">${l.q}</td><td class="dir">${c.e(c.moeda(l.preco))}</td><td class="dir">${c.e(c.moeda(l.sub))}</td></tr>`).join('') : '<tr><td colspan="4">Nenhum item.</td></tr>'}
          <tr><th colspan="3" class="dir">Total (moedinhas de brincadeira)</th><th class="dir">${c.e(c.moeda(total))}</th></tr>
          </tbody></table>
          <p style="text-align:center;margin-top:1rem">Obrigada pela visita! Volte sempre 😋 (gorjeta de sorrisos aceita)</p>`;
      },
    },
    {
      id: 'receita', titulo: 'Receita culinária', de: 'prato', botao: '🖨️ Receita',
      render: (c) => `
        <p style="text-align:center;font-size:2.6rem;margin:.2rem">${c.e(c.d.emoji || '🍽️')}</p>
        <h4 style="text-align:center;margin:0 0 .6rem">${c.e(c.d.nome)}</h4>
        ${c.campo('Categoria', c.d.categoria)}
        <section class="doc-bloco"><h4>Ingredientes</h4>${c.ul((c.d.ingredientes || '').split('\n').map((x) => x.trim()).filter(Boolean))}</section>
        ${c.bloco('Modo de preparo', c.d.modo)}
        <p style="margin-top:.8rem"><em>Receita de brincadeira. Cozinhar de verdade só com um adulto por perto.</em></p>`,
    },
    {
      id: 'cardapio-doc', titulo: 'Cardápio', de: 'cardapio', botao: '🖨️ Cardápio',
      render: (c) => {
        const pratos = c.filhos('prato');
        return `<h4 style="text-align:center;font-size:1.4rem;margin:.2rem 0">${c.e(c.d.nome)}</h4>
          <p style="text-align:center">${c.e(c.d.tema || '')}</p>
          ${CATEGORIAS.map((cat) => {
            const l = pratos.filter((p) => p.dados.categoria === cat);
            return l.length ? `<section class="doc-bloco"><h4>${c.e(cat)}</h4><table class="doc-tabela"><tbody>${l.map((p) => `<tr><td>${c.e(p.dados.emoji || '')} ${c.e(p.dados.nome)}</td><td class="dir">${c.e(c.moeda(p.dados.preco))}</td></tr>`).join('')}</tbody></table></section>` : '';
          }).join('')}`;
      },
    },
  ],
  sorteios: [
    { pitch: 'Abriu o Cantinho do Brigadeiro: doces de colher para todo mundo! 🍫', tipo: 'cardapio', dados: { nome: 'Cantinho do Brigadeiro', tema: 'Doces de mentirinha' }, filhos: [{ tipo: 'prato', dados: { nome: 'Brigadeiro de colher', emoji: '🍫', categoria: 'Sobremesa', preco: 6, ingredientes: 'Chocolate\nCarinho\nUma pitada de risada', modo: 'Misture tudo com capricho e sirva com um sorriso.' } }, { tipo: 'prato', dados: { nome: 'Suco de morango', emoji: '🍓', categoria: 'Bebida', preco: 4, ingredientes: 'Morangos\nGelo', modo: 'Bata tudo e sirva gelado.' } }] },
    { pitch: 'Abriu a Pizzaria da Lua: pizzas redondas como a lua cheia! 🌕', tipo: 'cardapio', dados: { nome: 'Pizzaria da Lua', tema: 'Pizzas espaciais' }, filhos: [{ tipo: 'prato', dados: { nome: 'Pizza Lua Cheia', emoji: '🍕', categoria: 'Prato principal', preco: 18, ingredientes: 'Massa\nQueijo\nTomate', modo: 'Abra a massa, cubra com queijo e tomate e asse com um adulto.' } }, { tipo: 'prato', dados: { nome: 'Suco de estrela', emoji: '🧃', categoria: 'Bebida', preco: 5, ingredientes: 'Maracujá\nBrilho de mentirinha', modo: 'Misture e sirva.' } }] },
    { pitch: 'Abriu a Sorveteria Polar: sorvetes para o dia mais quente! 🍦', tipo: 'cardapio', dados: { nome: 'Sorveteria Polar', tema: 'Sorvetes de pinguim' }, filhos: [{ tipo: 'prato', dados: { nome: 'Sorvete de morango', emoji: '🍦', categoria: 'Sobremesa', preco: 7, ingredientes: 'Morango\nLeite\nAçúcar', modo: 'Bata, congele e sirva em casquinha.' } }, { tipo: 'prato', dados: { nome: 'Banana split', emoji: '🍓', categoria: 'Sobremesa', preco: 9, ingredientes: 'Banana\nSorvete\nCalda', modo: 'Monte tudo no prato e capriche na calda.' } }] },
    { pitch: 'Abriu o Café das Panquecas: café da manhã o dia todo! 🥞', tipo: 'cardapio', dados: { nome: 'Café das Panquecas', tema: 'Panquecas fofas' }, filhos: [{ tipo: 'prato', dados: { nome: 'Panqueca de mel', emoji: '🥞', categoria: 'Prato principal', preco: 8, ingredientes: 'Farinha\nOvo\nLeite\nMel', modo: 'Misture, doure na frigideira com um adulto e cubra com mel.' } }, { tipo: 'prato', dados: { nome: 'Cookie gigante', emoji: '🍪', categoria: 'Sobremesa', preco: 5, ingredientes: 'Farinha\nChocolate\nManteiga', modo: 'Misture, modele e asse com um adulto.' } }] },
  ],
  exemplo: [{
    tipo: 'cardapio', dados: { nome: 'Cantinho do Brigadeiro', tema: 'Doces de mentirinha' },
    filhos: [
      { tipo: 'prato', dados: { nome: 'Brigadeiro de colher', emoji: '🍫', categoria: 'Sobremesa', preco: 6, ingredientes: 'Chocolate\nCarinho\nUma pitada de risada', modo: 'Misture tudo com muito capricho e sirva com um sorriso.' } },
      { tipo: 'prato', dados: { nome: 'Suco de morango', emoji: '🍓', categoria: 'Bebida', preco: 4, ingredientes: 'Morangos\nGelo', modo: 'Bata tudo e sirva gelado.' } },
    ],
  }],
};
