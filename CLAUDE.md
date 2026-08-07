# Notas para agentes

Contexto rápido do repositório. O [README](README.md) descreve o que o app faz;
aqui ficam as convenções e as armadilhas de quem mexe no código.

## O que é

Painel de mesa para conduzir *A Última Dungeon*, uma one-shot roguelike de D&D
5e. Três telas principais rodam em janelas separadas (Mestre, Jogadores,
Relógio), mais as lojas e a calculadora de loot.

`referencias/*.md` é a fonte da verdade das regras e catálogos. O webapp
transcreve esses dados para `webapp/data/*.js` — ao mexer num lado, ajuste o
outro (a tabela no fim do README mapeia os pares).

## Stack e convenções

- HTML, CSS e JavaScript puros. **Sem build, sem dependências, sem framework.**
  Vale para [`servidor/servidor.js`](servidor/servidor.js) também: só a
  biblioteca padrão do Node, mesmo estilo dos scripts do front.
- Cada script é um IIFE com `"use strict"`, usa `var` e `function` (ES5 no
  estilo, apesar de rodar em navegador moderno) e conversa com o estado por
  `window.Dungeon`. Dados globais ficam em `window.CATALOGO_BRAM`,
  `window.BENCAOS`, `window.EXIBICOES`, `window.ENCONTROS_LOOT`.
- Nomes de variáveis, funções, ids e comentários em **português**. Termos de
  regra de D&D ficam como estão nas fichas (`Nick`, `Potion of Healing`).
- Comentários explicam **por quê**, não o quê; existem onde a decisão não é
  óbvia. Não comente o trivial.
- CSS: um arquivo de tokens ([`webapp/css/theme.css`](webapp/css/theme.css)) e um
  de componentes ([`webapp/css/app.css`](webapp/css/app.css)). Classes em
  português, padrão bloco `.bloco__parte--variante`. Paleta roxo-dungeon com ouro
  para valores em PO e vermelho-sangue para ações destrutivas.
- Ligação DOM ↔ JS por atributos `data-*`, nunca por id ou classe de estilo.

## Estado compartilhado

Tudo em [`webapp/js/state.js`](webapp/js/state.js), a única fonte de estado:

- `Dungeon.get()`, `Dungeon.assinar(cb)`, `Dungeon.acoes.*`, `Dungeon.relogio.*`,
  `Dungeon.agora()`, `Dungeon.assinarConexao(cb)`.
- Persistido em `localStorage` e propagado por quatro vias:
  `BroadcastChannel`, evento `storage`, polling de 500 ms e o servidor
  (SSE em `/api/eventos`, `POST /api/estado`).
- **Servido por `file://` a quarta via não liga** (`REMOTO` é falso) e o painel
  se comporta como antes. Com servidor, ele é a autoridade e o `localStorage`
  passa a ser cache local.
- A chave, o canal e a rota da API carregam a versão do formato (`...:estado:v9`).
  **Ao mudar o formato, suba `VERSAO`** — isso isola abas antigas e descarta a
  sessão anterior, que é o comportamento desejado. O servidor guarda um estado
  por versão, seguindo a mesma trava.

Armadilhas já pagas, não repita:

- **`mesclar` funde objetos.** Um patch `{abates: {}}` não limpa nada: para
  zerar, escreva cada chave como `0`/`false` (veja `zerarAbates`).
- **Render não escreve estado.** Sortear/gravar durante o render fecha um laço de
  gravações entre as telas abertas. Escreva só em resposta a ação do usuário —
  foi por isso que o sorteio da bênção virou `garantirOferta()` no clique. Com o
  servidor no meio o laço fica pior: sai da máquina.
- **Carimbo monotônico.** Duas gravações no mesmo milissegundo precisam de
  `atualizadoEm` diferentes, senão a outra aba descarta a segunda.
- **`receberExterno` ignora versão diferente**, senão uma aba antiga mescla o
  estado novo no formato dela e apaga campos ao gravar.
- **`agora()`, nunca `Date.now()`,** em qualquer instante que vá para o estado.
  É `Date.now()` corrigido pela diferença com o relógio do servidor; sem isso um
  dispositivo com relógio atrasado mostra um tempo de sessão diferente das outras
  telas.
- **O eco do servidor é descartado por comparação de conteúdo** em
  `receberExterno`. É o que impede o laço POST → broadcast → POST. Se algum dia
  o servidor passar a reescrever campos do estado que recebe, essa comparação
  para de bater e o laço volta.
- **`receberExterno` grava no `localStorage`.** Sem isso um F5 volta ao último
  estado que *aquela* tela gravou, descartando o que as outras fizeram.
- **`state.js` não toca no DOM.** O aviso de conexão caída vive em
  [`webapp/js/aviso-conexao.js`](webapp/js/aviso-conexao.js) justamente por isso;
  ele entra depois de `state.js` nas sete páginas.

## Armadilhas de front

- `[hidden]` precisa de `display: none !important` no tema, porque os
  componentes usam `display: flex` e venceriam o estilo padrão do atributo.
- Modais usam `<dialog>` + `showModal()`. **Nunca** `alert`/`confirm`/`prompt`:
  além de feios na TV, travam a automação do navegador.
- Ações destrutivas na tela pública pedem dois toques (ver o botão Consumir), não
  um diálogo.
- A tela dos Jogadores e a do Relógio são projetadas: o conteúdo tem de fechar na
  altura da viewport, sem rolagem. Ao acrescentar coisas ali, confira
  `document.documentElement.scrollHeight <= innerHeight`.

## Testar

Não há suíte automatizada. O ciclo usado até agora:

1. `node --check` em cada arquivo alterado de `webapp/js`, `webapp/data` e
   `servidor/`.
2. `node servidor/servidor.js` e abrir duas telas (Mestre + a tela afetada) para
   ver a sincronização.
3. Conferir números contra as referências — as médias de loot, por exemplo,
   batem com a seção 13 do `aventura.md` (uma run pelo caminho fácil dá 284,5 PO).

Ao mexer na sincronização, dois testes que pegam o que o olho não pega:

- **Simular a outra máquina com `curl`.** `GET /api/estado?v=9`, mudar um campo,
  `POST` de volta: a tela aberta tem de reagir sem F5. É o único jeito fácil de
  exercitar o caminho do servidor em vez do `BroadcastChannel`, que atende as
  abas do mesmo navegador e mascara um SSE quebrado.
- **Contar POSTs com o painel parado.** Instrumentar `window.fetch`, clicar uma
  vez e esperar alguns segundos: tem de ficar em 1. Mais que isso é laço de
  gravações.

Para o modo `file://`, que a automação do Chrome não alcança, dá para carregar
`state.js` num `window` falso com `vm.runInContext` e conferir que `REMOTO` é
falso, que nenhum `EventSource` abre e que o `localStorage` continua recebendo.

**Cache do Chrome atrapalhava muito** com `python3 -m http.server`, que não manda
`Cache-Control` — o navegador servia JS/CSS antigos por heurística e já custou
tempo caçando "bug" que era arquivo velho. `servidor/servidor.js` manda
`no-cache` + `ETag`, então revalida sempre e o problema não aparece. Servindo com
outra coisa, a armadilha volta.

## Produção

`dungeon.pflausino.xyz`, no VPS `pflausino.xyz` (`/opt/apps/dungeon`). Container
`dungeon` na rede `proxy`, atrás do Caddy que já serve outros oito sites de lá.
Receita e armadilhas no [README](README.md#produção). Duas que importam ao mexer:

- **`/opt/proxy/Caddyfile` é compartilhado.** Acrescente o bloco, nunca
  substitua o arquivo, e rode `caddy validate` antes de `caddy reload` — erro de
  sintaxe ali derruba os outros sites.
- **`sudo` no VPS pede senha.** Não precisa: o usuário está no grupo `docker` e é
  dono de `/opt/apps` e `/opt/proxy`. Se um passo exigir root, o caminho está
  errado.

## Git

- O usuário pede commit e push explicitamente. Não commite sem pedido.
- `main` é a branch default: trabalhe numa branch e pergunte antes de mergear.
- Mensagens de commit em inglês, Conventional Commits, corpo explicando o porquê.
  Terminam com o trailer `Co-Authored-By`.
