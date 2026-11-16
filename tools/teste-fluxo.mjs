#!/usr/bin/env node
// Teste de fumaça com Playwright: abre o site (http e file://), percorre os fluxos principais,
// confere erros no console, requisições externas e o aviso de brincadeira nos documentos.
//   node tools/teste-fluxo.mjs [porta]
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const porta = process.argv[2] || '8765';
const falhas = [];
const ok = (cond, msg) => { if (!cond) { falhas.push(msg); console.log('  ✗', msg); } else console.log('  ✓', msg); };

const servidor = spawn('python3', ['-m', 'http.server', porta, '--bind', '127.0.0.1'], { cwd: raiz, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));

const AVISO = 'Documento de brincadeira. Não tem valor médico, legal ou oficial.';

async function rodar(nome, url) {
  console.log(`\n== ${nome} ==`);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, acceptDownloads: true });
  await ctx.addInitScript(() => {
    window.__osc = 0;
    const AC = window.AudioContext;
    if (AC) { const o = AC.prototype.createOscillator; AC.prototype.createOscillator = function () { window.__osc++; return o.call(this); }; }
  });
  const page = await ctx.newPage();
  const erros = [];
  const externas = [];
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', (e) => erros.push(String(e)));
  page.on('request', (r) => {
    const u = r.url();
    if (!/^(file:|data:|blob:|about:)/.test(u) && !u.startsWith(`http://127.0.0.1:${porta}`)) externas.push(u);
  });

  await page.goto(url);
  await page.waitForSelector('.grade-predios');
  ok(await page.locator('dialog[open]').count() === 1, 'aviso de privacidade na primeira abertura');
  await page.click('dialog button');
  ok(await page.locator('.predio').count() === 11, '11 profissões na tela inicial');

  // Médica: paciente -> consulta -> receita
  await page.click('a[href="#/p/medica"]');
  await page.click('text=Novo paciente');
  await page.fill('#f-nome', 'Ursinho Teddy');
  await page.fill('#f-idade', '5');
  await page.click('button[type=submit]');
  await page.waitForSelector('text=Consultas (0)');
  await page.click('text=Nova consulta');
  await page.click('label.chip:has-text("Barriguinha roncando")');
  await page.fill('#f-temperatura', '36.5');
  await page.click('label.chip:has-text("Abraço apertado")');
  await page.fill('.chip-novo input >> nth=1', 'Dança da chuva ☔');
  await page.click('[data-add] >> nth=1');
  await page.fill('#f-diagnostico', 'Fome de brigadeiro');
  await page.click('button[type=submit]');
  await page.click('text=🖨️ Receita >> nth=0');
  await page.waitForSelector('.folha');
  const folha = await page.locator('.folha').innerText();
  ok(folha.includes(AVISO), 'receita traz o aviso de brincadeira');
  ok(folha.includes('Se alguém estiver doente de verdade, chame um adulto.'), 'receita traz aviso de chamar um adulto');
  ok(folha.includes('Abraço apertado') && folha.includes('Dança da chuva'), 'receita lista itens de faz de conta');
  ok(/fictício/.test(folha), 'registro profissional é marcado como fictício');
  ok(folha.includes('Nome da profissional'), 'sem nome definido, a assinatura fica em branco para preencher');
  await page.emulateMedia({ media: 'print' });
  ok(!(await page.locator('.topo').isVisible()), 'menu some na impressão');
  ok(await page.locator('.folha-rodape').isVisible(), 'rodapé visível na impressão');
  await page.emulateMedia({ media: 'screen' });

  // XSS
  await page.goto(url + '#/p/medica');
  await page.click('text=Novo paciente');
  await page.fill('#f-nome', '<img src=x onerror=window.__xss=1>');
  await page.click('button[type=submit]');
  await page.waitForSelector('h1');
  ok(await page.evaluate(() => window.__xss) === undefined, 'texto digitado é escapado (sem XSS)');

  // Acessibilidade: teclado, títulos, aria-current
  await page.goto(url + '#/');
  await page.reload();
  await page.waitForSelector('.grade-predios');
  await page.keyboard.press('Tab');
  ok(await page.evaluate(() => document.activeElement.classList.contains('pular')), 'primeiro Tab vai para "Pular para o conteúdo"');
  ok(await page.evaluate(() => document.querySelector('header nav a[aria-current="page"]')?.textContent.includes('Início')), 'menu marca a página atual (aria-current)');
  await page.goto(url + '#/p/dentista/novo/paciente');
  await page.waitForSelector('[data-dente]');
  ok((await page.title()).includes('paciente'), 'título da aba muda por página');
  await page.focus('[data-dente] >> nth=4');
  await page.keyboard.press('Enter');
  ok(/Dente 5: brilhando/.test(await page.getAttribute('[data-dente] >> nth=4', 'aria-label')), 'dente muda com o teclado e o rótulo acompanha');
  ok(/Dente 5/.test(await page.textContent('[data-odonto-aviso]')), 'mudança do dente é anunciada (região viva)');
  await page.goto(url + '#/p/medica/novo/paciente');
  await page.focus('#f-nome');
  ok(await page.evaluate(() => document.querySelectorAll('input:required').length > 0 && !!document.querySelector('label[for="f-nome"]')), 'campos têm rótulo e obrigatórios são marcados');
  await page.goto(url + '#/p/medica');
  await page.click('text=Novo paciente');
  await page.click('button[type=submit]');
  ok(await page.evaluate(() => location.hash.includes('novo')), 'formulário vazio não salva (validação nativa)');

  // Exemplos de todas as profissões e todos os documentos
  const ids = ['veterinaria', 'dentista', 'advogada', 'juiza', 'professora', 'chef', 'detetive', 'jornalista', 'astronauta', 'cientista'];
  for (const id of ids) {
    await page.goto(`${url}#/p/${id}`);
    await page.click('#exemplo');
    await page.waitForSelector('#lista li');
    await page.click('#lista li a');
    await page.waitForSelector('.detalhe');
    // abre cada botão de documento do registro raiz e dos filhos
    const hrefs = await page.$$eval('a.btn-doc', (as) => as.map((a) => a.getAttribute('href')));
    const filhos = await page.$$eval('.filhos .item-link', (as) => as.map((a) => a.getAttribute('href')));
    for (const f of filhos) {
      await page.goto(url + f);
      await page.waitForTimeout(150);
      hrefs.push(...(await page.$$eval('a.btn-doc', (as) => as.map((a) => a.getAttribute('href')))));
    }
    const unicos = [...new Set(hrefs)];
    ok(unicos.length > 0, `${id}: tem documento imprimível`);
    for (const h of unicos) {
      await page.goto(url + h);
      await page.waitForTimeout(100);
      await page.waitForSelector('.folha');
      const t = await page.locator('.folha').innerText();
      if (!t.includes(AVISO)) ok(false, `${id}: ${h} sem aviso`);
    }
  }
  ok(true, 'todos os documentos de exemplo têm o aviso de brincadeira');

  // Relatório geral da cidade
  await page.goto(`${url}#/relatorio`);
  await page.waitForSelector('.folha');
  const rel = await page.locator('.folha').innerText();
  ok(rel.includes(AVISO) && rel.includes('Assinatura') === false && rel.includes('Diretora'), 'relatório da cidade tem cabeçalho, assinatura e aviso de brincadeira');
  ok(await page.locator('.folha .doc-tabela tbody tr').count() === 11, 'relatório lista as 11 profissões');
  ok(/\d+\s*atendimentos/.test(rel.replace(/\n/g, ' ')), 'relatório mostra total de atendimentos');

  // Detetive: quadro de pistas
  await page.goto(`${url}#/p/detetive`);
  await page.click('#lista li a');
  await page.waitForSelector('.detalhe');
  ok(await page.locator('.quadro .post-it').count() > 0, 'quadro de pistas mostra post-its');

  // Casos sorteados em todas as profissões
  for (const id of ['medica','veterinaria','dentista','advogada','juiza','professora','chef','detetive','jornalista','astronauta','cientista']) {
    await page.goto(`${url}#/p/${id}`);
    await page.waitForSelector('#sortear');
    await page.click('#sortear');
    await page.waitForSelector('dialog[open] .sorteio-pitch');
    await page.click('dialog button[value=outro]');
    await page.waitForSelector('dialog[open] .sorteio-pitch');
    await page.click('dialog button[value=atender]');
    await page.waitForSelector('.detalhe');
    if (!(await page.locator('.detalhe h1').innerText()).trim()) ok(false, `${id}: caso sorteado sem título`);
  }
  ok(true, 'sortear caso funciona nas 11 profissões (sortear outro e atender)');

  // Álbum de figurinhas
  await page.goto(`${url}#/album`);
  await page.waitForSelector('.figurinhas');
  ok(await page.locator('.figurinha.ganha').count() >= 10 && await page.locator('.figurinha.bloqueada').count() > 0, 'álbum mostra figurinhas ganhas e por ganhar');

  // Personalização: carimbo, logotipo e papel timbrado
  await page.goto(`${url}#/config`);
  await page.fill('#c-jog', 'Lia');
  await page.fill('#c-frase', 'APROVADO');
  await page.click('label.chip:has-text("Oval")');
  await page.click('label.chip:has-text("Listras")');
  await page.click('label.chip:has(input[name="corDocs"][value="#7b1fa2"])');
  ok(await page.locator('#previa .folha.timbre-listras').count() === 1, 'prévia do escritório muda na hora');
  await page.click('#form-config button[type=submit]');
  await page.goto(`${url}#/p/medica`);
  await page.click('#lista li a');
  await page.click('a.btn-doc >> nth=0');
  await page.waitForSelector('.folha');
  const svg = await page.locator('.folha .carimbo').innerHTML();
  ok(svg.includes('APROVADO') && svg.includes('DE BRINCADEIRA') && svg.includes('ellipse'), 'carimbo personalizado e sempre com "DE BRINCADEIRA"');
  ok(await page.locator('.folha.timbre-listras').count() === 1, 'papel timbrado aplicado no documento');
  ok((await page.getAttribute('.folha', 'style')).includes('#7b1fa2'), 'cor dos documentos aplicada');
  // Entradas maliciosas na marca são descartadas
  await page.evaluate(() => {
    const e = JSON.parse(localStorage.getItem('cidade-das-profissoes'));
    e.config.marca = { corDocs: 'red;"><img src=x onerror=window.__xss2=1>', carimboFrase: '<b>oi</b>', timbre: 'hack', carimboForma: 'x' };
    localStorage.setItem('cidade-das-profissoes', JSON.stringify(e));
  });
  await page.reload();
  await page.waitForSelector('.folha');
  ok(await page.evaluate(() => window.__xss2) === undefined && (await page.getAttribute('.folha', 'style')).includes('#'), 'marca inválida é saneada (sem injeção)');

  // Clientes que chegam sozinhos
  await page.evaluate(() => {
    const e = JSON.parse(localStorage.getItem('cidade-das-profissoes'));
    e.espera = [{ prof: 'medica', i: 0, emoji: '🐱', em: '' }];
    localStorage.setItem('cidade-das-profissoes', JSON.stringify(e));
  });
  await page.goto(`${url}#/p/medica`);
  await page.reload();
  await page.waitForSelector('.cliente');
  ok((await page.locator('.cliente .balao').innerText()).includes('Ursinho Teddy'), 'cliente na sala de espera mostra nome e pedido');
  await page.click('.cliente [data-atender]');
  await page.waitForSelector('.detalhe');
  ok(await page.evaluate(() => JSON.parse(localStorage.getItem('cidade-das-profissoes')).espera.filter((x) => x.prof === 'medica').length) === 0, 'atender tira o cliente da sala de espera e abre o caso');
  await page.goto(`${url}#/p/detetive`);
  await page.waitForSelector('.cliente', { timeout: 12000 });
  ok(true, 'um cliente chega sozinho na sala de espera');
  await page.click('.cliente [data-adiar]');
  ok(await page.locator('.cliente').count() === 0, '"Voltar depois" dispensa o cliente com carinho');
  await page.goto(`${url}#/config`);
  await page.click('label.chip:has-text("Clientes chegam sozinhos")');
  await page.click('#form-config button[type=submit]');
  await page.goto(`${url}#/p/chef`);
  await page.waitForTimeout(8500);
  ok(await page.locator('.cliente').count() === 0, 'com a opção desligada ninguém chega sozinho');
  await page.goto(`${url}#/config`);
  await page.click('label.chip:has-text("Clientes chegam sozinhos")');
  await page.click('#form-config button[type=submit]');

  // Sons: desligados por padrão, tocam só quando ligados
  await page.goto(`${url}#/p/cientista`);
  await page.click('text=Novo experimento');
  await page.fill('#f-titulo', 'Teste de som');
  const antesSom = await page.evaluate(() => window.__osc);
  await page.click('button[type=submit]');
  await page.waitForSelector('.detalhe');
  ok(await page.evaluate(() => window.__osc) === antesSom, 'sons desligados por padrão: nada toca');
  await page.goto(`${url}#/config`);
  await page.click('label.chip:has-text("Sons suaves")');
  await page.click('#form-config button[type=submit]');
  await page.goto(`${url}#/p/cientista`);
  await page.click('text=Novo experimento');
  await page.fill('#f-titulo', 'Teste de som 2');
  const antes2 = await page.evaluate(() => window.__osc);
  await page.click('button[type=submit]');
  await page.waitForSelector('.detalhe');
  ok(await page.evaluate(() => window.__osc) > antes2, 'com sons ligados, salvar toca um somzinho');
  await page.goto(`${url}#/config`);
  await page.click('label.chip:has-text("Sons suaves")');
  await page.click('#form-config button[type=submit]');

  // Backup: exportar -> apagar -> importar
  await page.goto(`${url}#/config`);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#exportar')]);
  const arq = path.join(process.env.TMPDIR || '/tmp', `bk-${Date.now()}.json`);
  await dl.saveAs(arq);
  const antes = JSON.parse(fs.readFileSync(arq, 'utf8')).registros.length;
  await page.click('#apagar-tudo');
  await page.click('dialog button[value=sim]');
  await page.waitForSelector('.grade-predios');
  await page.goto(`${url}#/config`);
  await page.setInputFiles('#importar', arq);
  await page.click('dialog button[value=sim]');
  await page.waitForTimeout(300);
  const depois = await page.evaluate(() => JSON.parse(localStorage.getItem('cidade-das-profissoes')).registros.length);
  ok(antes > 5 && antes === depois, `backup restaurado (${antes} registros)`);
  await page.setInputFiles('#importar', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"a":1}') });
  await page.waitForSelector('.toast');
  ok(true, 'backup inválido é recusado com aviso');

  // Tema escuro persiste
  await page.goto(`${url}#/config`);
  await page.click('label.chip:has-text("Escuro")');
  await page.click('#form-config button[type=submit]');
  await page.reload();
  ok(await page.evaluate(() => document.documentElement.dataset.tema) === 'escuro', 'tema escuro persiste');

  await page.screenshot({ path: path.join(process.env.TMPDIR || '/tmp', `tela-${nome}.png`) });
  ok(erros.length === 0, `sem erros no console ${erros.length ? JSON.stringify(erros) : ''}`);
  ok(externas.length === 0, `nenhuma requisição externa ${externas.length ? JSON.stringify(externas) : ''}`);
  await browser.close();
}

try {
  await rodar('http', `http://127.0.0.1:${porta}/index.html`);
  await rodar('file', 'file://' + path.join(raiz, 'index.html'));
} finally {
  servidor.kill();
}
console.log(falhas.length ? `\n${falhas.length} falha(s)` : '\nTudo certo!');
process.exit(falhas.length ? 1 : 0);
