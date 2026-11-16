# 🏙️ Cidade das Profissões

Um "sistema de escritório" de faz de conta onde crianças de 10 a 13 anos brincam de ter profissões:
**médica, veterinária, dentista, advogada, juíza, professora, chef, detetive, jornalista, astronauta e cientista**.
Cada profissão é um escritório com cadastros, atendimentos, histórico e **documentos imprimíveis**
(receita, boletim, petição, sentença, relatório, primeira página de jornal…).

- 100% estático: HTML, CSS e JavaScript puro. Sem build obrigatório, sem framework, sem servidor.
- Funciona **offline**. Nenhuma requisição externa (sem CDN, fontes, analytics, anúncios ou login).
- Dados salvos no `localStorage` **só neste aparelho**, com backup em JSON (exportar/importar).
- Português do Brasil, mobile-first, botões grandes, navegação por teclado, modo claro e escuro.

> ⚠️ Todo documento traz o rodapé **"Documento de brincadeira. Não tem valor médico, legal ou oficial."**
> Receitas usam só itens de faz de conta, e o registro profissional é sempre fictício.

## Como abrir localmente

Basta dar dois cliques em `index.html`. Abrindo direto do disco (`file://`) o navegador bloqueia módulos ES,
então o `index.html` carrega automaticamente `js/bundle.js` (uma versão sem módulos, já incluída no repositório).

Se preferir um servidor local (usa os módulos ES diretamente):

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Como publicar no GitHub Pages

**Opção simples (Deploy from branch)**

1. Crie um repositório no GitHub e envie este projeto (`git push -u origin main`).
2. Vá em **Settings → Pages**.
3. Em **Build and deployment**, escolha **Source: Deploy from a branch**.
4. Selecione a branch **main** e a pasta **/ (root)**, depois clique em **Save**.
5. Em um ou dois minutos o site aparece em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

**Opção automática (GitHub Actions)**: em **Settings → Pages → Source**, escolha **GitHub Actions**.
O workflow `.github/workflows/pages.yml` checa a sintaxe, regenera o bundle e publica a cada push na `main`.

Todos os caminhos são relativos, então funciona em subpastas como `/NOME-DO-REPOSITORIO/`.

## Como criar uma nova profissão

1. Copie um arquivo de `js/professions/` (por exemplo `cientista.js`, que é pequeno) para `js/professions/minha-profissao.js`.
2. Edite o objeto exportado:
   - `id`, `nome`, `emoji`, `cor` (use uma cor escura para o texto branco ficar legível), `local`, `cargo`, `sigla`
     (prefixo do registro fictício), `descricao`, `aviso` (opcional) e `saude: true` se for uma profissão de saúde.
   - `entidades`: a **primeira** é a principal (ex.: Paciente) e as **demais** pertencem a ela (ex.: Consulta).
     Cada uma tem `campos` criados com os atalhos de `js/core/campos.js`
     (`txt`, `area`, `num`, `data`, `sel`, `chips`, `emoji`, `ref`, `refmulti`, `itens`, `odontograma`).
   - `documentos`: modelos imprimíveis. `render(ctx)` devolve HTML; use `ctx.e()`, `ctx.campo()`, `ctx.bloco()`,
     `ctx.ul()` e `ctx.filhos(tipo)` para **escapar** todo texto digitado. O cabeçalho, a assinatura, o carimbo
     e o rodapé de brincadeira são adicionados automaticamente pelo núcleo.
   - `exemplo` (opcional): dados leves para o botão "Criar um exemplo".
3. Registre a profissão em `js/professions/index.js` (um `import` e um item na lista `PROFISSOES`).
4. Se for abrir o site direto do disco, rode `node tools/gerar-bundle.mjs` para atualizar `js/bundle.js`.

## Estrutura

```
index.html
css/            tema.css (cores, modo escuro) · componentes.css · impressao.css (@media print, A4/A5)
js/
  app.js        ponto de entrada e rotas
  bundle.js     GERADO (para abrir via file://) — rode tools/gerar-bundle.mjs
  core/         storage, roteador, ui, entidades (CRUD), formulario, imprimir, backup, selos, modelo, campos
  paginas/      home, escritorio (listar/detalhe/formulário/documento), config
  professions/  um arquivo por profissão + index.js (lista)
tools/          gerar-bundle.mjs · teste-fluxo.mjs (Playwright)
```

## Dados e migrações

Tudo fica em uma única chave do `localStorage` (`cidade-das-profissoes`):

```json
{ "schema": 1, "config": {…}, "selos": {…}, "contadores": {…},
  "registros": [ { "id": "…", "prof": "medica", "tipo": "paciente", "pai": "…", "dados": {…} } ],
  "recentes": [] }
```

`schema` é a versão do formato. Para mudar o formato no futuro, aumente `VERSAO` em `js/core/storage.js` e
acrescente uma função em `migracoes` (ela recebe o estado antigo e devolve o novo). A importação de backup
valida o arquivo e aplica as mesmas migrações. Se o armazenamento estiver cheio ou bloqueado, o sistema avisa
e continua funcionando em memória, sugerindo um backup.

## Testes

```bash
for f in $(find js tools -name '*.js' -o -name '*.mjs'); do node --check "$f"; done
node tools/gerar-bundle.mjs
node tools/teste-fluxo.mjs     # precisa do Playwright; abre http e file://
```

O teste cadastra uma paciente, gera a receita, confere o aviso de brincadeira em **todos** os documentos,
testa XSS, backup (exportar → apagar → importar), tema escuro e confirma **zero erros no console e zero requisições externas**.

## Privacidade e segurança

- Nenhum dado sai do aparelho. Sem upload de fotos (use emojis e desenhos simples).
- Na primeira abertura há um aviso pedindo apelidos em vez de sobrenomes, endereços, telefones ou fotos reais.
- Todo texto digitado é escapado antes de virar HTML.
- Os exemplos são leves e inocentes. O sistema nunca sugere remédios, dosagens ou tratamentos reais,
  e nunca imita documentos oficiais.
