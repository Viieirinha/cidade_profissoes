// Relatório geral da cidade: resumo de todas as profissões, pronto para imprimir ou salvar em PDF.
import { PROFISSOES } from '../professions/index.js';
import { getEstado } from '../core/storage.js';
import { listar, maisRecentes } from '../core/entidades.js';
import { tituloReg } from '../core/modelo.js';
import { todosSelos, totalAtendimentos } from '../core/selos.js';
import { htmlFolha, imprimir } from '../core/imprimir.js';
import { esc, fmtData } from '../core/ui.js';
import { tocar } from '../core/som.js';

// "Profissional" fictícia só para o cabeçalho do relatório.
const CIDADE = {
  id: 'cidade', nome: 'Direção', emoji: '🏙️', cor: '#c2185b',
  local: 'Direção da Cidade das Profissões, gestão da', cargo: 'Diretora', sigla: 'CIDADE-BRINCA',
};

export function paginaRelatorio() {
  const estado = getEstado();
  const linhas = PROFISSOES.map((p) => {
    const cadastros = listar(p.id, p.entidades[0].id).length;
    const atend = p.entidades[1] ? listar(p.id, p.entidades[1].id).length : 0;
    return { p, cadastros, atend, docs: estado.contadores.documentos[p.id] || 0 };
  });
  const ativas = linhas.filter((l) => l.cadastros > 0).length;
  const selos = todosSelos().filter((s) => s.ok);
  const totalDocs = linhas.reduce((s, l) => s + l.docs, 0);

  const recentes = PROFISSOES.flatMap((p) => p.entidades.slice(1, 2).flatMap((e) =>
    listar(p.id, e.id).map((r) => ({ p, r }))))
    .sort((a, b) => maisRecentes(a.r, b.r)).slice(0, 6);

  const corpo = `
    <p class="doc-campo"><strong>Cidade:</strong> ${esc(estado.config.escritorio)}</p>
    <ul class="relatorio-numeros">
      <li><strong>${ativas}</strong> de ${PROFISSOES.length} profissões em uso</li>
      <li><strong>${totalAtendimentos()}</strong> atendimentos</li>
      <li><strong>${totalDocs}</strong> documentos impressos</li>
      <li><strong>${selos.length}</strong> selos</li>
    </ul>
    <section class="doc-bloco"><h4>Profissões</h4>
      <table class="doc-tabela"><thead><tr><th>Profissão</th><th class="dir">Cadastros</th><th class="dir">Atendimentos</th><th class="dir">Documentos</th></tr></thead><tbody>
      ${linhas.map((l) => `<tr><td>${l.p.emoji} ${esc(l.p.nome)}</td><td class="dir">${l.cadastros}</td><td class="dir">${l.atend}</td><td class="dir">${l.docs}</td></tr>`).join('')}
      </tbody></table>
    </section>
    <section class="doc-bloco"><h4>Últimos atendimentos</h4>
      ${recentes.length ? `<ul class="doc-lista">${recentes.map(({ p, r }) => `<li>${p.emoji} ${esc(p.nome)}: ${esc(tituloReg(p, r))}</li>`).join('')}</ul>` : '<p>Ainda não há atendimentos.</p>'}
    </section>
    <section class="doc-bloco"><h4>Selos conquistados</h4>
      ${selos.length ? `<ul class="doc-lista doc-colunas">${selos.map((s) => `<li>${s.emoji} ${esc(s.titulo)} <small>(${esc(fmtData(estado.selos[s.id]))})</small></li>`).join('')}</ul>` : '<p>Ainda não há selos. Sem pressa! 🌈</p>'}
    </section>
    <p style="margin-top:.8rem"><em>Parabéns pelo trabalho! A cidade está cada dia mais animada. 🎉</em></p>`;

  document.getElementById('app').innerHTML = `<section class="pagina-doc prof" style="--cor:${CIDADE.cor}">
    <div class="barra-doc nao-imprimir">
      <a class="btn" href="#/">← Voltar</a>
      <label class="papel">Papel <select id="papel"><option>A4</option><option>A5</option></select></label>
      <button class="btn btn-primario" id="imprimir" type="button">🖨️ Imprimir ou salvar PDF</button>
    </div>
    <h1 class="sr-only" tabindex="-1">Relatório geral da cidade</h1>
    ${htmlFolha(CIDADE, 'Relatório geral da cidade', corpo)}
  </section>`;

  document.getElementById('imprimir').addEventListener('click', () => { tocar('carimbo'); imprimir(document.getElementById('papel').value); });
}
