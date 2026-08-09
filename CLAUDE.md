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
- A chave, o canal e a rota da API carregam a versão do formato (`...:estado:v14`).
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
- **`receberExterno` recusa estado com `atualizadoEm` menor que o de casa.**
  Não é zelo: numa aba em segundo plano o navegador estica `setTimeout` para
  ~1 s, então o POST de `ESPERA_ENVIO` sai atrasado e o eco do servidor chega
  *depois* da ação seguinte. Sem a comparação, o eco velho vencia e o estado
  voltava sozinho — dois cliques em "+50 PO" chegavam a 100 e caíam para 50; a
  cabeça cortada renascia. Foi bug real e antigo, achado ao testar a hidra. A
  comparação de conteúdo logo abaixo **não** cobria isso: ela só descarta eco
  *igual*. Teste que pega: duas ações com ~200 ms entre elas e a aba fora de
  foco; depois de 3 s o valor tem de ser o segundo.
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

## Atalhos de mesa (`/api/acao/…`)

[`servidor/acoes.js`](servidor/acoes.js) aplica transições de estado sem
navegador no meio, para virarem botão físico. `GET /api/acoes` lista tudo.

- **É uma segunda implementação das transições de `webapp/js/state.js`, copiada
  à mão.** Mudar `registrarTpk` ou `relogio.pausar` lá e esquecer daqui deixa o
  atalho fazendo coisa diferente do botão da tela — e só aparece na mesa. O
  cabeçalho do arquivo diz isso; ao mexer numa transição, mexa nos dois lugares.
  Carregar `state.js` num `vm` evitaria a cópia, mas traria os temporizadores e
  o `EventSource` dele para dentro do servidor.
- **A ordem das salas é lida de `webapp/data/salas.js`, não copiada** — roda o
  arquivo num contexto com `window` falso. É o dado que mais muda, então a
  cópia rotaria rápido.
- **Sem `?v=`, quem decide a versão são as telas conectadas, não o maior estado
  guardado.** O servidor guarda um estado por versão e os antigos ficam lá
  depois de um bump; escolher pelo maior guardado fazia o atalho editar em
  silêncio uma sessão morta enquanto o painel aberto não mexia um dedo — foi
  bug real durante a implementação. O SSE sabe a versão de cada tela.
- **Uma tela recém-aberta e intocada não semeia o servidor** (é a trava que
  impede uma aba nova de apagar a sessão). Então "sem estado" acontece com o
  painel aberto na frente do mestre; a mensagem de erro diz o que destrava.
- **`rolar` precisa de alguém que resolva.** Quem resolve é a tela do Relógio,
  com a física do dado. Sem ela aberta, o servidor resolve sozinho depois de
  `ESPERA_DADO_3D` — sem isso o atalho deixaria um "rolando…" preso para sempre
  no log das outras telas.
- Os atalhos aceitam **GET** além de POST, o que normalmente não se faz com
  rota que muda estado. Passa aqui porque `/api/estado` já aceita POST sem
  autenticação nenhuma: não há nada a proteger que já não esteja aberto.
  Fechar é decisão de proxy (`basic_auth` no Caddy), não deste arquivo.

## Painel de combate

No topo da tela de Monstros ([`webapp/js/combate.js`](webapp/js/combate.js)):
as criaturas da sala marcada pelo mestre, uma linha de vida por criatura e um
bloco de rolagens por *tipo* — o ataque do Ghast é o mesmo nos cinco. Os blocos
de estatística abaixo não são tocados por esse arquivo.

- **`estado.danos` guarda o dano sofrido, não o PV restante.** Assim restaurar
  é escrever `0` em cada chave, que é o que `mesclar` exige — um `{}` vazio não
  limparia nada (a mesma armadilha de `zerarAbates`). E o PV cheio continua
  vindo de `data/monstros.js`, sem cópia no estado para envelhecer.
- **A chave é `<encontro>:<idMonstro>:<índice>`.** O Ghast nº 3 da Sala do
  Ritual é `ritual:ghast:2`.
- **Os ids de encontro em `data/monstros.js` são os mesmos ids de sala em
  `data/salas.js`** — foi por isso que o grupo do chefe deixou de ser
  `chefe-final` e virou `draconidra`. Sem isso seria preciso uma tabela de
  tradução entre os dois arquivos, que envelheceria calada.
- **O painel só é remontado quando a sala muda**; o resto é atualização no
  lugar. Remontar a cada `−1` perderia a rolagem do scroll no meio do combate.
- **`window.RolagemMonstro` existe para não duplicar a rolagem.** O painel e os
  blocos rolam pelo mesmo caminho, com o mesmo retorno local quando não há tela
  do Relógio aberta; duas cópias divergiriam e a errada só apareceria na mesa.
- Um TPK zera os danos junto com a run (`referencias/aventura.md` §4: a dungeon
  reinicia com o grupo). *Restaurar vidas* zera só a sala em campo.
- **A Arena é uma sala só, não três fases.** Já foi dividida em
  `arena-goblin`/`arena-zumbis`/`arena-beholder`, com uma máquina de `palco` que
  juntava as três no painel; a divisão foi desfeita porque na mesa os inimigos
  entram em sequência sem pausa e trocar de sala no meio do combate só para
  achar a vida de um zumbi custava o tempo que o painel existe para poupar.
  **`data/loot.js` continua com os três encontros** — lá o eixo é ouro por
  inimigo, não sala, e é onde a separação ainda paga.
- **Ficha com `mob` inverte a regra de uma linha por criatura**: a linha passa a
  ser do grupo, com o PV somado, e ganha uma coluna com quantas ainda estão de
  pé. Hoje só a Arena 2 usa (`{ grupos: 2, porGrupo: 5 }` nos dez zumbis). Três
  coisas que vão junto:
  - **`grupos × porGrupo` tem de fechar com `quantidade`.** Nada valida isso em
    tempo de execução; o sintoma seria a calculadora de loot contar um número de
    criaturas diferente do que o painel mostra.
  - **O índice da chave de dano passa a ser o do grupo**, não o da criatura:
    `arena:zombie:0` é o grupo A inteiro. Mudar `grupos` depois de uma
    sessão começada deixa dano órfão — inofensivo, mas some da tela.
  - **O contador de "de pé" arredonda para cima**, porque com 1 PV sobrando
    ainda há uma criatura viva, e é ela que ataca no turno.

## Cabeças da hidra

Terceiro modo da tela do Relógio, ao lado do cronômetro puro e da tabela:
[`webapp/js/relogio.js`](webapp/js/relogio.js) mostra,
[`webapp/js/hidra.js`](webapp/js/hidra.js) controla (na tela do Mestre) e
[`webapp/data/hidra.js`](webapp/data/hidra.js) tem os retratos.

- **É um campo só, `exibicao.id`, com `"hidra"` reservado** (`EXIBICAO_HIDRA` em
  `state.js`). A hidra não sai de `data/tabelas.js`, então `exibicaoPorId` não a
  acha — quem monta o seletor e o selo do Mestre trata esse caso à mão. Dois
  campos separados deixariam projetar tabela e hidra ao mesmo tempo, e a tela
  não tem espaço para as duas.
- **O estado guarda só `{ n, viva }`; a arte sai do número**, em roda
  (`arteHidra`). Assim a cabeça nº 6 nasce com retrato sem ninguém escolher, e
  `state.js` não precisa conhecer caminho de imagem.
- **Os números nunca se repetem na sessão** — `proxima` não recua nem quando uma
  cabeça é removida. É o que deixa o mestre dizer "a cabeça 7" sem ambiguidade.
- **Cortar e ressuscitar são o mesmo clique.** Na mesa a mesma cabeça cai e
  volta várias vezes no mesmo combate; dois botões separados seriam dois alvos
  para errar.
- **O número de colunas da grade vem do JS** (`colunasDe`), não de
  `auto-fit`: a tela é projetada e não pode rolar, então a grade fecha em mais
  colunas conforme as cabeças nascem em vez de crescer para baixo. Conferido até
  22 cabeças sem rolagem. Ao mexer, o teste é o de sempre —
  `document.documentElement.scrollHeight <= innerHeight`.
- **O painel só é remontado quando o conjunto de cabeças muda**, pela mesma
  razão de `combate.js`: cortar é troca de classe, e remontar recarregaria as
  imagens a cada golpe.
- **O X é `::after`, não elemento.** O que muda no clique é só a classe.
- **O TPK devolve a hidra inteira**, junto com os danos — e por isso a
  transição também está em [`servidor/acoes.js`](servidor/acoes.js), com a
  cópia à mão que aquele arquivo avisa no topo.
- Os recortes em `webapp/assets/hidra/` saíram de uma folha de arte com fundo
  transparente, separados por componente conexa (as cabeças quase se encostam;
  caixa medida a olho trazia pedaço da vizinha). O gerador não está versionado,
  como o dos ícones — refazer é mais rápido que manter.

## Economia de ouro

`webapp/data/loot.js` e a seção 13 de `referencias/aventura.md` têm de contar a
mesma coisa. **Trocar monstro de encontro muda o ouro da run**, porque a faixa
sai do ND: os 6 Hobgoblin Warriors (ND 1/2, faixa baixa) viraram 10 zumbis
(ND 1/4, também baixa) e a Arena 2 subiu de 51,5 para 77,5 PO de média — a run
pelo caminho fácil foi de 284,5 para 310,5. Ao mexer num encontro, recalcule
também os acumulados de quatro runs e o mínimo/máximo, que aparecem em três
lugares diferentes da seção 13.

## Projetor na mesa

Duas telas — [`webapp/projetor.html`](webapp/projetor.html) monta as formas,
[`webapp/projecao.html`](webapp/projecao.html) é o que vai para o projetor.
Receita e uso no [README](README.md#projetor-na-mesa); aqui só as armadilhas:

- **A geometria vive num arquivo só**
  ([`webapp/js/projecao-formas.js`](webapp/js/projecao-formas.js)), porque as
  duas telas precisam dela: uma desenha, a outra desenha *e* acerta o clique.
  Duas cópias divergiriam e o sintoma seria clicar num lugar e pegar a forma de
  outro — só na tela do mestre, sem erro nenhum no console.
- **Tamanho é fração da altura, posição é fração dos dois eixos.** Não é
  capricho: a tela do mestre e o projetor têm proporções diferentes, e medir
  largura pela largura de cada um faria o círculo virar elipse na projeção.
- **O arraste desenha de um rascunho local, não do estado.** Gravar a cada
  `pointermove` enche o servidor de POSTs e trava o gesto. O estado recebe uma
  gravação a cada 60 ms no máximo, mais a final e exata no `pointerup` — sem a
  final, a forma para no último quadro estrangulado, alguns pixels fora.
- **`adicionarForma` notifica os assinantes antes de quem chamou guardar o id
  devolvido**, então o repintar que vem do estado ainda não conhece a seleção
  nova. Por isso `adicionar()` repinta à mão logo depois. Vale para qualquer
  ação que devolva id e mexa em seleção.
- **A tela de Projeção não carrega `aviso-conexao.js`.** É a única sem ele, de
  propósito: o aviso apareceria projetado no tapete. Quem vê a queda é o mestre,
  na outra tela.
- **`projecao.html` não é protegida pelo portão**, para abrir direto num tablet
  ligado ao projetor. Só `projetor.html` pede senha.
- **`canvas.width`/`height` só mudam quando o tamanho mudou de fato.** Escrever
  neles realoca o buffer e zera o contexto; com forma animada isso passaria 60
  vezes por segundo. Era assim na primeira versão e foi corrigido.
- **O laço de animação só existe se houver forma animada**
  (`ProjecaoFormas.temAnimacao`), e na tela do Projetor ele fica de fora durante
  um gesto — quem repinta ali é o `pointermove`, e dois repintadores brigariam
  pelo rascunho. Ao terminar o gesto, chame `acompanhar()`, não `pintar()`, ou a
  animação não volta.
- **`requestAnimationFrame` não dispara em aba escondida.** Não é bug: a janela
  da projeção fica visível no projetor. Mas isso trava qualquer teste de
  automação que espere quadro — foi o que fez uma leitura de pixels estourar o
  timeout do CDP aqui. Confira `document.visibilityState` antes de suspeitar do
  código.
- **Guarda de teclado com `matches` precisa ser defensiva.** Sem nada focado, o
  alvo do `keydown` pode ser o próprio `document`, que não tem o método — o
  atalho inteiro morria num TypeError silencioso. Foi bug real; ver `emCampo`.
- **A fase dos efeitos sai de `agora()`, não de `Date.now()`.** É o relógio
  corrigido pelo servidor, e é o que mantém a prévia e a projeção piscando
  juntas em máquinas diferentes.

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

## Som do dado

[`webapp/js/som-dados.js`](webapp/js/som-dados.js), tocado pela tela do Relógio
no instante do lançamento (não do resultado: a física leva ~2 s a assentar, e o
barulho chegando no fim soaria descolado do que a mesa vê).

- **O `dice-box` não tem som.** O `AudioContext` que aparece nos arquivos dele é
  do Babylon, para outra coisa; a lista de opções da config não tem nada de
  áudio. Já foi conferido — não procure de novo.
- **O ruído é sintetizado, não é arquivo.** Cada impacto é um estouro curto de
  ruído branco com decaimento cúbico embutido na amostra, passado por um
  passa-faixa. Evita mais um binário no repositório e mais uma licença para
  conferir, e nenhuma rolagem sai igual à anterior — um sample repetido a noite
  toda cansa.
- **`ctx.resume()` é assíncrono e não muda `state` na mesma volta do laço.**
  Checar o estado logo depois, de forma síncrona, faz *toda* rolagem sair
  calada. Foi bug real aqui; o agendamento agora vive dentro do `then`.
- **Precisa de um toque na aba do Relógio**, como a trilha — mesma política de
  autoplay, mesma impossibilidade de contornar. Na prática o toque em *Ativar
  trilha* já destrava os dois. Sem trilha escolhida aquele botão não aparece, e
  aí é preciso tocar em qualquer lugar da tela uma vez.
- **Só o Relógio carrega o arquivo**, pelo mesmo motivo da trilha: é a tela que
  vai na caixa de som, e o notebook do mestre não deve duplicar o áudio.
- Os fatores de `quicar()` são calibrados para durar ~1 s. A primeira versão
  morria em 200 ms e dava a impressão de o dado ter parado antes do que a tela
  mostrava. `VOLUME`, no topo, é o número a mexer se ficar alto demais na TV.

## Testar

Não há suíte automatizada. O ciclo usado até agora:

1. `node --check` em cada arquivo alterado de `webapp/js`, `webapp/data` e
   `servidor/`.
2. `node servidor/servidor.js` e abrir duas telas (Mestre + a tela afetada) para
   ver a sincronização.
3. Conferir números contra as referências — as médias de loot, por exemplo,
   batem com a seção 13 do `aventura.md` (uma run pelo caminho fácil dá 310,5 PO).

Ao mexer na sincronização, dois testes que pegam o que o olho não pega:

- **Simular a outra máquina com `curl`.** `GET /api/estado?v=14`, mudar um campo,
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
