import { PROFISSOES, porId } from '../professions/index.js';
import { getEstado } from '../core/storage.js';
import { obter, listar } from '../core/entidades.js';
import { tituloReg } from '../core/modelo.js';
import { todosSelos, totalAtendimentos } from '../core/selos.js';
import { esc, fmtRelativo } from '../core/ui.js';

export function paginaHome() {
  const { config, recentes } = getEstado();
  const nome = config.jogadora;
  const selos = todosSelos();
  const ganhos = selos.filter((s) => s.ok);

  const predios = PROFISSOES.map((p) => {
    const n = p.entidades[1] ? listar(p.id, p.entidades[1].id).length : 0;
    return `<li><a class="predio" href="#/p/${p.id}" style="--cor:${p.cor}">
      <span class="predio-telhado" aria-hidden="true"></span>
      <span class="predio-emoji" aria-hidden="true">${p.emoji}</span>
      <span class="predio-nome">${esc(p.nome)}</span>
      <span class="predio-desc">${esc(p.descricao || '')}</span>
      <span class="predio-n">${n} ${n === 1 ? 'atendimento' : 'atendimentos'}</span>
    </a></li>`;
  }).join('');

  const docs = recentes.map((r) => {
    const reg = obter(r.id);
    const prof = porId(r.prof);
    const doc = prof && prof.documentos.find((d) => d.id === r.doc);
    if (!reg || !doc) return '';
    return `<li><a class="cartao-item" href="#/p/${prof.id}/d/${reg.id}/${doc.id}" style="--cor:${prof.cor}">
      <span class="item-emoji" aria-hidden="true">${prof.emoji}</span>
      <span class="item-texto"><strong>${esc(doc.titulo)}</strong><small>${esc(tituloReg(prof, reg))}</small></span>
      <small class="item-data">${esc(fmtRelativo(r.em))}</small></a></li>`;
  }).filter(Boolean).slice(0, 6).join('');

  document.getElementById('app').innerHTML = `
    <section class="hero">
      <h1 tabindex="-1">${nome ? `Olá, ${esc(nome)}! 👋` : 'Bem-vinda à cidade! 👋'}</h1>
      <p>${esc(config.escritorio)} — escolha um prédio para começar a trabalhar.</p>
      ${nome ? '' : '<p><a class="btn btn-primario" href="#/config">✏️ Dizer meu nome</a></p>'}
      <ul class="estatisticas" aria-label="Seu progresso">
        <li><strong>${totalAtendimentos()}</strong> atendimentos</li>
        <li><strong>${ganhos.length}</strong> selos</li>
      </ul>
    </section>
    <section aria-labelledby="t-predios">
      <h2 id="t-predios">Profissões</h2>
      <ul class="grade-predios">${predios}</ul>
    </section>
    <section aria-labelledby="t-recentes">
      <h2 id="t-recentes">Meus documentos recentes</h2>
      ${docs ? `<ul class="lista-itens">${docs}</ul>` : '<p class="vazio-texto">Ainda não há documentos. Atenda alguém e abra uma receita, boletim ou relatório! 📄</p>'}
    </section>
    <section aria-labelledby="t-selos">
      <h2 id="t-selos">Meus selos</h2>
      ${ganhos.length ? `<ul class="selos">${ganhos.map((s) => `<li class="selo"><span aria-hidden="true">${s.emoji}</span> ${esc(s.titulo)}</li>`).join('')}</ul>`
        : '<p class="vazio-texto">Os selos aparecem aqui quando você atende e cria coisas. Sem pressa! 🌈</p>'}
    </section>`;
}
