// Ponto de entrada.
import { carregar, getEstado, salvar, aoErro } from './core/storage.js';
import { rota, iniciar } from './core/roteador.js';
import { toast, avisoModal } from './core/ui.js';
import { aplicarAparencia } from './core/aparencia.js';
import { paginaHome } from './paginas/home.js';
import { paginaRelatorio } from './paginas/relatorio.js';
import { paginaAlbum } from './paginas/album.js';
import { paginaConfig } from './paginas/config.js';
import { paginaEscritorio, paginaDetalhe, paginaForm, paginaDocumento } from './paginas/escritorio.js';

function primeiraAbertura() {
  const { config } = getEstado();
  if (config.avisoVisto) return;
  avisoModal('Bem-vinda à Cidade das Profissões! 🏙️', `
    <p>Aqui você brinca de ter profissões: médica, detetive, professora e muito mais.</p>
    <p>🔒 <strong>Seus dados ficam só neste aparelho.</strong> Nada vai para a internet.</p>
    <p>✏️ Use <strong>apelidos</strong> em vez de sobrenomes, endereços, telefones ou fotos reais.</p>
    <p>📄 Os documentos são de brincadeira e não valem nada de verdade.</p>`, 'Entendi, vamos brincar!')
    .then(() => { config.avisoVisto = true; salvar(); });
}

function iniciarApp() {
  aoErro((msg) => toast('⚠️ ' + msg, 9000));
  carregar();
  aplicarAparencia();

  rota('/', paginaHome);
  rota('/config', paginaConfig);
  rota('/relatorio', paginaRelatorio);
  rota('/album', paginaAlbum);
  rota('/p/:prof', paginaEscritorio);
  rota('/p/:prof/r/:id', paginaDetalhe);
  rota('/p/:prof/novo/:tipo', paginaForm);
  rota('/p/:prof/e/:id', paginaForm);
  rota('/p/:prof/d/:id/:doc', paginaDocumento);

  iniciar(() => {
    document.getElementById('app').innerHTML =
      '<section class="vazio"><h1 tabindex="-1">Página não encontrada 🔎</h1><p><a class="btn btn-primario" href="#/">Voltar ao início</a></p></section>';
  });
  primeiraAbertura();
}

iniciarApp();
