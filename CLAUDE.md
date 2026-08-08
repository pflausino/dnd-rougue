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
  **Única exceção:** [`webapp/assets/dice-box/`](webapp/assets/dice-box/) — a
  lib de dado 3D da tela do Relógio (`js/dados-3d.js`), vendorizada (baixada
  do unpkg, não CDN, não npm) porque física 3D não dá pra fazer em CSS puro.
  É também o único módulo ES do projeto — `dice-box` só publica como import.
- Cada script é um IIFE com `"use strict"`, usa `var` e `function` (ES5 no
  estilo, apesar de rodar em navegador moderno) e conversa com o estado por
  `window.Dungeon`. Dados globais ficam em `window.CATALOGO_BRAM`,
  `window.BENCAOS`, `window.EXIBICOES`, `window.ENCONTROS_LOOT`, `window.SALAS`.
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
- A chave, o canal e a rota da API carregam a versão do formato (`...:estado:v11`).
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

## Trilha das salas

A tela do Relógio toca a faixa da sala escolhida pelo mestre
([`webapp/js/trilha.js`](webapp/js/trilha.js)). Quatro coisas já pagas:

- **Os MP3 vivem em `webapp/assets/audio/`**, não em `referencias/`. O servidor
  só publica `webapp/` e `loja/` — arquivo em `referencias/` dá 404 no navegador.
- **`servidor.js` atende `Range`.** Não é enfeite: o Safari recusa tocar mídia de
  um servidor sem `Accept-Ranges`, e sem isso rebobinar a faixa no loop rebaixa o
  arquivo inteiro. Ao mexer em `servirEstatico`, mantenha o 206.
- **O loop é à mão, com dois `<audio>` e cruzamento de 5 s.** `audio.loop = true`
  dá corte seco no fim da faixa, audível na mesa. O ramp usa curva de potência
  constante (`sin(g·π/2)`): linear afunda o volume no meio da emenda, que é
  justamente o que o crossfade deveria esconder.
- **O autoplay é bloqueado até alguém tocar naquela aba.** Por isso o botão
  *Ativar trilha*; recarregar a página exige um toque novo. Não há como contornar
  — é política do navegador, não bug.

## App instalável (PWA)

A tela dos Jogadores instala como app no tablet da mesa:
[`webapp/jogadores.webmanifest`](webapp/jogadores.webmanifest),
[`webapp/sw.js`](webapp/sw.js) e
[`webapp/js/instalavel.js`](webapp/js/instalavel.js), que só registra o service
worker. As lojas carregam o mesmo manifesto — fazem parte do app; as telas de
controle, não.

**O `sw.js` tem três regras que não são estilo — são o que impede ele de
quebrar o painel. Estão comentadas no arquivo; leia antes de mexer:**

- **`/api/` nunca passa pelo service worker.** `/api/eventos` é um SSE aberto
  pela sessão inteira: responder a ele pelo worker corta o streaming e as telas
  param de sincronizar, sem erro visível. Teste que pega: `POST` no estado por
  `curl` e ver a aba reagir sem F5.
- **Rede primeiro, cache só como queda.** Cache-first tornaria o problema de
  "JS velho" (documentado em *Testar*) **permanente** — sobrevive ao
  Cmd+Shift+R, porque quem responde é o worker, não o cache HTTP. Teste que
  pega: mudar um arquivo, recarregar, conferir que a mudança chegou.
- **Só `status === 200` entra no cache.** O servidor responde 206 a `Range`
  (os MP3 da trilha); um 206 guardado voltaria depois como se fosse o arquivo
  inteiro, entregando áudio truncado. Pedido com cabeçalho `Range` nem passa
  pelo worker.

Mais duas coisas já pagas:

- **Ao mudar o que é guardado, suba `VERSAO` em `sw.js`.** É o que apaga o
  cache antigo no `activate`. Sem isso convivem dois caches e o antigo nunca sai.
- **`.webmanifest` precisa do MIME certo** (`application/manifest+json`, já em
  `servidor/servidor.js`). Sem ele o Chrome recusa o manifesto em silêncio: não
  dá erro, só some a opção de instalar.

Os ícones em `webapp/assets/icones/` foram gerados por script, sem dependência
(PNG é assinatura + chunks, e o `zlib` do Node comprime). Para refazer ou mudar
o desenho, o gerador não está versionado — é mais rápido reescrevê-lo do que
mantê-lo. O `icone-maskable-512.png` tem o dado menor de propósito: o Android
recorta em círculo e comeria a ponta.

## Portão de acesso

[`webapp/js/portao.js`](webapp/js/portao.js) separa o que a mesa vê do que só o
mestre vê. Abertas sem senha: **Jogadores** e as duas **lojas**. Pedem senha:
**Mestre, Relógio, Loot e Monstros**. O **hub** (`index.html`) fica aberto — é a
porta de entrada de todos — e só esconde os cartões das telas de controle.

- **Isto é ofuscação, não segurança, e o comentário no topo do arquivo diz isso
  em voz alta.** A conferência roda no cliente: quem abrir o DevTools grava
  `ultima-dungeon:acesso` na mão e entra. Serve para o jogador não abrir a tela
  do mestre por engano na mesa. **Em `dungeon.pflausino.xyz` não barra ninguém
  de fora** — para isso o servidor teria de recusar as páginas, o que exigiria
  mexer em `servirEstatico` (e derrubaria o modo `file://`, que não tem
  servidor). Não prometa proteção que este arquivo não entrega.
- A senha vive como **impressão FNV-1a** (`IMPRESSAO`), não em texto puro — só
  para não entregar a senha a quem abre o arquivo por curiosidade. Trocar:
  `Portao.impressao("nova senha")` no console e colar o resultado.
- **A chave do `localStorage` não carrega a `VERSAO` do estado**, de propósito:
  subir o formato do estado descarta a sessão de jogo, mas não pode deslogar o
  mestre no meio da mesa.
- Duas formas de usar, as duas por atributo, como o resto do projeto:
  `data-protegido` no `<html>` trava a página inteira; `data-exige-acesso` num
  elemento o esconde sem a senha (é o que tira o link *Painel* da tela dos
  Jogadores), e `data-sem-acesso` faz o inverso.
- **`portao.js` entra no `<head>`, não no bloco do fim da página.** É a única
  exceção à ordem dos scripts do projeto, e tem motivo: a trava precisa entrar
  antes do corpo pintar, senão a tela do mestre pisca inteira antes de pedir a
  senha.
- A trava esconde com `visibility`, não `display`: o `<dialog>` é filho do
  `body` e reativa a visibilidade só para si, sem recalcular layout nenhum.
- `Esc` no diálogo é cancelado à mão. Sem isso o `<dialog>` fecharia e deixaria
  a tela travada e sem saída.
- **Ainda descoberto:** o botão *+ Ouro do loot* na tela dos Jogadores é um
  controle de mestre numa tela aberta — quem estiver na frente da TV pode somar
  ouro. Não foi fechado porque também é o atalho que o mestre usa ali; marcar
  com `data-exige-acesso` resolve, se um dia incomodar.

## Rolagens de dado

A tela de Monstros (`webapp/js/monstros.js`) tem botões de rolagem nos blocos
de estatística. Quem decide o número é a tela do Relógio, não quem clicou:

- **O clique só pede a rolagem** (`Dungeon.acoes.pedirRolagem`, grava
  `estado.rolagem` com `status: "pendente"`). Quem resolve de fato
  (`resolverRolagem`) é [`webapp/js/dados-3d.js`](webapp/js/dados-3d.js), na
  tela do Relógio — o número que sai da física do dado 3D é o oficial, porque
  a lib não tem como *forçar* o dado a cair num valor escolhido de fora.
- **Sem a tela do Relógio aberta, quem pediu resolve sozinho** depois de uma
  espera (`ESPERA_RETORNO_MS` em `monstros.js`). Por isso o botão nunca trava
  o jogo, mesmo sem a TV ligada — só perde a animação.
- **`pendente` e `resolvida` chegam com o mesmo `id`.** Um assinante que
  distinga só por id (em vez de por id *e* status) processa a primeira
  notificação e ignora a segunda — foi o bug do log em
  [`webapp/js/log-rolagens.js`](webapp/js/log-rolagens.js): guarde o que já foi
  renderizado por linha (`dataset.resolvida`), não por id isolado.
- **`animando` existe pra travar o retorno local enquanto o dado real está no
  ar.** Sem esse status intermediário entre `pendente` e `resolvida`, dava pra
  o retorno local de `monstros.js` gravar um número diferente enquanto o dado
  3D já tinha começado a cair de verdade — a física, uma vez iniciada, não tem
  como ser cancelada, então o dado terminava mostrando uma face que não batia
  com o que ficou salvo no estado. `dados-3d.js` grava `animando`
  (`marcarRolagemAnimando`) no instante exato antes de chamar `box.roll()`, e o
  retorno local só age se o status ainda for `pendente`. Se depois disso a
  física falhar ou nunca terminar, quem resolve é o próprio `dados-3d.js` no
  `catch` — ele que travou a rolagem, ele que tem de destravar.
- **`box.roll({qty, sides, ...})` devolve um array PLANO — não array de grupos
  com `.rolls`.** `resultados[0].rolls.map(...)` (o que os docs de "Common
  Objects" da lib sugerem) dá `undefined` pra essa forma de chamar `roll` — o
  formato com `.rolls` é de outra assinatura, não desta. Foi bug real, não
  suposição: ficou gravado `console.error` a cada clique, a noite inteira,
  antes de alguém notar. O `.catch` engolia o erro e caía num Math.random()
  novo e **desconectado do resultado físico real** (que estava certo, só não
  lido) — por isso o dado rolava uma face e o log mostrava outro número
  qualquer, sem relação nenhuma. Leitura certa é `resultados.map(d => d.value)`
  direto. Se voltar a mexer nisso, teste isolado primeiro (sem app no meio,
  ver o padrão acima) e confira o `console.error` a cada rolagem — ele avisa.
- **`assetPath` do `dice-box` tem de ser absoluto.** A lib cria o worker de
  física a partir de uma *blob URL* (`new Worker(URL.createObjectURL(blob))`),
  e é o worker que busca o tema (`theme.config.json`, malha, texturas). Uma
  blob URL não tem diretório — um `assetPath` relativo resolve certinho na
  thread principal mas não bate em lugar nenhum dentro do worker, e o
  carregamento do tema fica pendente pra sempre, **sem erro nenhum** (nem
  `catch`, nem evento `error` do worker). `dados-3d.js` usa
  `new URL("../assets/dice-box/assets/", import.meta.url).href` para sempre
  mandar um caminho absoluto, robusto a prefixo de proxy diferente.
- **Mesmo com o caminho certo, `init()`/`roll()` podem nunca resolver.** Rede
  lenta, WebGL ausente, disco lento na primeira carga — a promise não resolve
  nem rejeita, só fica pendente. `dados-3d.js` embrulha os dois num timeout
  próprio (`comLimite`) por isso; sem ele a tela do Relógio trava esperando o
  dado por toda a sessão.
- **`suspendSimulation: true` não é o que parece — desliga a cena 3D inteira.**
  A descrição ("usa RNG em vez de física 3D") sugere só pular a física e manter
  a queda visual; na prática é um modo sem visual nenhum, pensado para uso
  headless. Ligá-la faz o dado nunca aparecer. Já foi tentado e revertido aqui.
- **Física real pode divergir do valor gravado — é limitação conhecida, não
  bug deste app.** O próprio Roll20 sofre disso há anos (fórum cheio de
  reclamação): o "leitor" de face às vezes marca a rolagem como parada um
  instante antes da física acomodar de verdade. `dados-3d.js` amortece a
  física (menos força, menos altura, `settleTimeout` maior) para reduzir a
  chance, mas não elimina — é física de verdade, não teatro.

## Testar

Não há suíte automatizada. O ciclo usado até agora:

1. `node --check` em cada arquivo alterado de `webapp/js`, `webapp/data` e
   `servidor/`.
2. `node servidor/servidor.js` e abrir duas telas (Mestre + a tela afetada) para
   ver a sincronização.
3. Conferir números contra as referências — as médias de loot, por exemplo,
   batem com a seção 13 do `aventura.md` (uma run pelo caminho fácil dá 284,5 PO).

Ao mexer na sincronização, dois testes que pegam o que o olho não pega:

- **Simular a outra máquina com `curl`.** `GET /api/estado?v=10`, mudar um campo,
  `POST` de volta: a tela aberta tem de reagir sem F5. É o único jeito fácil de
  exercitar o caminho do servidor em vez do `BroadcastChannel`, que atende as
  abas do mesmo navegador e mascara um SSE quebrado.
- **Contar POSTs com o painel parado.** Instrumentar `window.fetch`, clicar uma
  vez e esperar alguns segundos: tem de ficar em 1. Mais que isso é laço de
  gravações.

Para o modo `file://`, que a automação do Chrome não alcança, dá para carregar
`state.js` num `window` falso com `vm.runInContext` e conferir que `REMOTO` é
falso, que nenhum `EventSource` abre e que o `localStorage` continua recebendo.

**Dado 3D: se `init()`/`roll()` nunca resolverem, confira `assetPath` antes de
qualquer outra coisa.** Foi a causa real de uma tarde perdida — parecia bug de
ambiente (WebGL, extensão de automação, rede), mas era o `assetPath` relativo
não batendo dentro do worker de blob URL da lib (ver "Rolagens de dado"
acima). O sintoma é sempre o mesmo: nem erro, nem rejeição, só pendente para
sempre. Confirmar com `new URL(assetPath, import.meta.url)` OU um `origin`
absoluto antes de suspeitar de mais nada.

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
