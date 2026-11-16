import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
// Auditoria com axe-core (não faz parte do projeto). Uso:
//   npm i --prefix /tmp/axe axe-core && node tools/auditar-acessibilidade.mjs /tmp/axe/node_modules/axe-core/axe.min.js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const axe = fs.readFileSync(process.argv[2], 'utf8');
const url = 'file://' + path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
const b = await chromium.launch();
const resumo = {};
for (const tema of ['claro', 'escuro']) for (const cor of ['rosa','lilas','azul','verde','laranja']) {
  if (tema==='escuro' && cor!=='rosa' && cor!=='verde') continue; if (tema==='claro' && cor==='verde') continue;
  const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage();
  await p.goto(url); await p.evaluate(([t,c]) => { const e = JSON.parse(localStorage.getItem('cidade-das-profissoes')||'{}'); e.config = {avisoVisto:true, tema:t, cor:c}; localStorage.setItem('cidade-das-profissoes', JSON.stringify(e)); }, [tema,cor]);
  await p.reload();
  const rotas = ['#/', '#/config'];
  for (const id of ['medica','veterinaria','dentista','advogada','juiza','professora','chef','detetive','jornalista','astronauta','cientista']) {
    if (cor==='rosa') { await p.goto(url+'#/p/'+id); await p.click('#exemplo'); }
  }
  if (tema==='claro' && cor==='rosa') await p.evaluate(()=>{});
  const todas = [...rotas];
  if (cor==='rosa') {
    for (const id of ['medica','dentista','professora','chef','detetive','jornalista']) {
      await p.goto(url+'#/p/'+id); todas.push('#/p/'+id);
      await p.click('#lista li a'); await p.waitForSelector('.detalhe'); todas.push(await p.evaluate(()=>location.hash));
      todas.push(await p.evaluate(()=>document.querySelector('a[href*="/novo/"]').getAttribute('href')));
      const d = await p.$$eval('a.btn-doc',a=>a.map(x=>x.getAttribute('href'))); if(d[0]) todas.push(d[0]);
      const f = await p.$$eval('.filhos .item-link',a=>a.map(x=>x.getAttribute('href')));
      if (f[0]) { await p.goto(url+f[0]); await p.waitForTimeout(100); const d2=await p.$$eval('a.btn-doc',a=>a.map(x=>x.getAttribute('href'))); if(d2[0]) todas.push(d2[0]); todas.push(f[0].replace('/r/','/e/')); }
    }
  }
  for (const r of todas) {
    await p.goto(url + r.replace(/^#?/,'#').replace('##','#')); await p.waitForTimeout(150);
    await p.evaluate(axe);
    const res = await p.evaluate(() => axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice'] }));
    for (const v of res.violations) {
      const k = `${v.id} [${v.impact}] ${v.help}`;
      (resumo[k] ||= new Set()).add(`${tema}/${cor} ${r} :: ${v.nodes[0].target.join(' ')} :: ${(v.nodes[0].any[0]||v.nodes[0].all[0]||{}).message||''}`.slice(0,230));
    }
  }
  await p.context().close();
}
for (const [k,v] of Object.entries(resumo)) { console.log('\n'+k+' ('+v.size+')'); [...v].slice(0,4).forEach(x=>console.log('   ',x)); }
if (!Object.keys(resumo).length) console.log('SEM VIOLAÇÕES');
await b.close();
