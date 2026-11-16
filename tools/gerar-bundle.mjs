#!/usr/bin/env node
// Gera js/bundle.js: uma versão "clássica" (sem módulos ES) de js/app.js.
// Usada só quando o index.html é aberto direto do disco (file://), onde o navegador bloqueia módulos.
// Rode de novo sempre que mudar algum arquivo em js/:   node tools/gerar-bundle.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTRADA = 'js/app.js';
const modulos = new Map(); // caminho -> código transformado

function resolver(de, spec) {
  return path.posix.normalize(path.posix.join(path.posix.dirname(de), spec));
}

function transformar(arquivo, src) {
  const exportados = [];
  const deps = [];

  // import ... from '...';  (uma linha só)
  src = src.replace(/^import\s+([^;\n]+?)\s+from\s+['"]([^'"]+)['"];?[ \t]*$/gm, (_, clausula, spec) => {
    const alvo = resolver(arquivo, spec);
    deps.push(alvo);
    const req = `__r(${JSON.stringify(alvo)})`;
    let m;
    if ((m = /^\*\s+as\s+([\w$]+)$/.exec(clausula))) return `const ${m[1]} = ${req};`;
    const partes = [];
    let resto = clausula;
    const chaves = /\{([^}]*)\}/.exec(resto);
    if (chaves) {
      const nomes = chaves[1].split(',').map((s) => s.trim()).filter(Boolean)
        .map((s) => s.replace(/^([\w$]+)\s+as\s+([\w$]+)$/, '$1: $2'));
      partes.push(`const { ${nomes.join(', ')} } = ${req};`);
      resto = resto.replace(chaves[0], '').replace(/,/g, '').trim();
    }
    if (resto) partes.unshift(`const ${resto} = ${req}.default;`);
    return partes.join(' ');
  });
  src = src.replace(/^import\s+['"]([^'"]+)['"];?[ \t]*$/gm, (_, spec) => {
    const alvo = resolver(arquivo, spec);
    deps.push(alvo);
    return `__r(${JSON.stringify(alvo)});`;
  });

  src = src.replace(/^export\s+default\s+/gm, '__m.default = ');
  src = src.replace(/^export\s+(?:async\s+)?function\s*\*?\s*([\w$]+)/gm, (m, n) => { exportados.push(n); return m.replace(/^export\s+/, ''); });
  src = src.replace(/^export\s+(?:const|let|class)\s+([\w$]+)/gm, (m, n) => { exportados.push(n); return m.replace(/^export\s+/, ''); });
  src = src.replace(/^export\s*\{([^}]*)\};?[ \t]*$/gm, (_, lista) => {
    lista.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => exportados.push(s));
    return '';
  });

  if (/^\s*(import|export)\s/m.test(src.replace(/`[\s\S]*?`/g, ''))) {
    throw new Error(`Sintaxe de import/export não suportada pelo gerador em ${arquivo}`);
  }
  const fim = exportados.map((n) => `__m.${n} = ${n};`).join('\n');
  return { codigo: `${src}\n${fim}`, deps };
}

function coletar(arquivo) {
  if (modulos.has(arquivo)) return;
  modulos.set(arquivo, '');
  const { codigo, deps } = transformar(arquivo, readFileSync(path.join(raiz, arquivo), 'utf8'));
  deps.forEach(coletar);
  modulos.set(arquivo, codigo);
}

coletar(ENTRADA);

let saida = `/* ARQUIVO GERADO por tools/gerar-bundle.mjs — não edite à mão. */
(function () {
'use strict';
const __defs = {};
const __cache = {};
function __r(id) {
  if (__cache[id]) return __cache[id];
  const m = {};
  __cache[id] = m;
  __defs[id](m, __r);
  return m;
}
`;
for (const [arquivo, codigo] of modulos) {
  saida += `\n// ---- ${arquivo} ----\n__defs[${JSON.stringify(arquivo)}] = function (__m, __r) {\n${codigo}\n};\n`;
}
saida += `\n__r(${JSON.stringify(ENTRADA)});\n})();\n`;

writeFileSync(path.join(raiz, 'js/bundle.js'), saida);
console.log(`js/bundle.js gerado com ${modulos.size} módulos.`);
