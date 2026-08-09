# A Última Dungeon

Aplicativo web e referências de **A Última Dungeon**, uma one-shot roguelike de
D&D 5e para 6 jogadores de nível 3, em cerca de 4 horas.

- [`webapp/`](webapp/): painel de mesa — telas do Mestre, dos Jogadores, do
  Relógio, as duas lojas e a calculadora de loot. As trilhas das salas ficam em
  `webapp/assets/audio/`.
- [`referencias/`](referencias/): a aventura, os catálogos das lojas, as bênçãos
  e as tabelas de jogo. É a fonte da verdade; o webapp transcreve esses dados.
- [`loja/`](loja/): arte dos mercadores e dos ícones de bênção, em
  `loja/assets/`, mais um esqueleto de site anterior ao painel.
- [`servidor/`](servidor/): servidor do painel — serve os arquivos e guarda o
  estado da sessão. Só biblioteca padrão do Node.
- [`compose.yml`](compose.yml) e [`deploy/`](deploy/): o serviço no VPS e o bloco
  a acrescentar ao Caddy de lá.

## Como rodar

```sh
node servidor/servidor.js
```

Depois abra <http://localhost:8777/webapp/>.

Abrir os arquivos direto do disco (`file://`) continua funcionando, e um
servidor estático qualquer (`python3 -m http.server 8777`) também — mas nos dois
casos a sincronização fica limitada às abas do mesmo navegador, porque não há
servidor de estado para conversar. Ver [Sincronização](#sincronização).

Variáveis de ambiente:

| Variável | Padrão | Para que serve |
|---|---|---|
| `PORTA` | `8777` | Porta HTTP. |
| `ENDERECO` | `0.0.0.0` | Interface. Em produção, `127.0.0.1` — só o proxy fala com ele. |
| `RAIZ` | raiz do repositório | De onde saem os arquivos estáticos. |
| `ARQUIVO_ESTADO` | `servidor/estado.json` | Onde a sessão é gravada. |

Só `webapp/` e `loja/` são servidos. `referencias/`, `.git/` e as notas de
agente ficam fora do alcance de quem tiver a URL.

## Telas

| Tela | Arquivo | Para quem |
|---|---|---|
| Painel | [`webapp/index.html`](webapp/index.html) | Escolhe qual tela abrir. |
| Mestre | [`webapp/mestre.html`](webapp/mestre.html) | Mestre: relógio, run, ouro, mecânicas, pausas e o que projetar. |
| Jogadores | [`webapp/jogadores.html`](webapp/jogadores.html) | Tela pública da mesa. |
| Relógio | [`webapp/relogio.html`](webapp/relogio.html) | Cronômetro da sessão, sala atual, trilha e o painel que o Mestre projetar (tabela ou hidra); só exibe, quem controla é o Mestre. |
| Loot | [`webapp/loot.html`](webapp/loot.html) | Mestre: contagem de abates e fechamento do ouro da run. |
| Monstros | [`webapp/monstros.html`](webapp/monstros.html) | Mestre: painel de combate da sala marcada e as fichas completas. |
| Projetor | [`webapp/projetor.html`](webapp/projetor.html) | Mestre: monta as formas que marcam áreas na mesa física. |
| Projeção | [`webapp/projecao.html`](webapp/projecao.html) | A janela que vai para o projetor: só o canvas. |
| A Última Provisão | [`webapp/bram.html`](webapp/bram.html) | Jogadores, no acampamento. |
| O Véu Entre Vidas | [`webapp/iria.html`](webapp/iria.html) | Jogadores, no acampamento, depois da Pedra de Íria. |

Cada tela fica em uma janela ou monitor diferente e todas compartilham o mesmo
estado, atualizando-se entre si.

### Sincronização

Quatro vias de propagação. As três locais — `BroadcastChannel`, evento `storage`
e polling de 500 ms sobre o `localStorage` — cobrem várias janelas **do mesmo
navegador**. A quarta é o servidor, e é ela que permite o Mestre no notebook, os
Jogadores na TV e o Relógio no tablet: cada tela recebe por SSE
(`/api/eventos`) e envia por `POST /api/estado`.

Servido por `file://` ou por um servidor estático qualquer, a quarta via
simplesmente não liga e o painel se comporta como antes.

Com o servidor no ar ele é a autoridade: ao abrir, a tela adota o estado que vier
de lá. Se o servidor estiver sem estado — primeira tela da sessão, ou servidor
reiniciado sem o arquivo — a tela semeia o dele com o que tem em cache, desde que
não seja um estado intocado (uma tela recém-aberta nunca apaga uma sessão em
andamento). O eco do próprio envio é descartado comparando o conteúdo, então não
há laço de gravações — e estado que chegue mais **velho** que o de casa é
recusado pelo carimbo, senão um eco atrasado desfaria a ação seguinte.

Instantes vêm de `Dungeon.agora()`, que é `Date.now()` corrigido pela diferença
com o relógio do servidor. Sem isso, um dispositivo com o relógio atrasado
mostraria um tempo de sessão diferente do das outras telas. **Use `agora()` em
vez de `Date.now()`** em qualquer coisa que vá para o estado.

Se a sincronização cair, todas as telas mostram um aviso discreto no canto
inferior direito ([`webapp/js/aviso-conexao.js`](webapp/js/aviso-conexao.js)) e
seguem funcionando com o último estado recebido. O `EventSource` reconecta
sozinho e o aviso some. Sem esse aviso a queda é invisível: cada tela continua
mostrando o que tinha e ninguém percebe que pararam de conversar.

A chave e o canal levam a versão do formato no nome
(`ultima-dungeon:estado:v14`), e estados de outra versão são ignorados. Assim uma
aba antiga que ficou aberta não corrompe o estado novo — ela apenas fica surda
até recarregar. Mudar o formato do estado exige subir `VERSAO` em
[`webapp/js/state.js`](webapp/js/state.js), o que descarta a sessão anterior.

O servidor guarda **um estado por versão**, espelhando essa mesma trava: subir
`VERSAO` cria um estado novo em vez de misturar com o antigo.

### API

| Rota | O que faz |
|---|---|
| `GET /api/eventos?v=14` | SSE. Manda o estado atual na conexão e a cada mudança. |
| `GET /api/estado?v=14` | Estado atual, ou `null` se o servidor não tem nenhum. |
| `POST /api/estado?v=14` | Grava o estado enviado no corpo e publica para as outras telas. |
| `DELETE /api/estado?v=14` | Descarta a sessão daquela versão. |
| `GET /api/saude` | Diagnóstico: quantas telas ligadas e quais versões em memória. |

## Atalhos de mesa

Ações do painel por HTTP, para virarem botão físico (Steam Deck, teclado macro,
atalho de celular) e evitar procurar o controle na tela do Mestre no meio do
combate.

```sh
curl -s http://localhost:8777/api/acoes            # lista tudo, com os parâmetros
curl -s http://localhost:8777/api/acao/relogio/alternar
curl -s "http://localhost:8777/api/acao/ouro/ajustar?delta=150"
```

Aceitam GET e POST — um atalho que só abre a URL funciona. A resposta traz um
resumo do painel (`run`, `ouro`, `modo`, `sala`, tempo restante), que dá para
mostrar de volta no aparelho.

| Atalho | O que faz |
| --- | --- |
| `relogio/alternar` | Inicia ou pausa o cronômetro |
| `relogio/ajustar?minutos=±N` | Soma ou devolve tempo à mesa |
| `relogio/zerar` | Volta a zero, parado |
| `tpk` | Nova run, volta ao acampamento, libera a pausa |
| `modo/alternar` | Tela dos Jogadores entre dungeon e acampamento |
| `sala/proxima`, `sala/anterior` | Anda no fluxo da aventura |
| `sala/limpar` | Desmarca a sala e corta a trilha |
| `sala/definir?id=ritual` | Marca uma sala pelo id |
| `ouro/ajustar?delta=N` | Soma (ou tira) ouro do grupo |
| `run/ajustar?delta=N` | Corrige a tentativa sem contar morte |
| `pausa/escolher?minutos=5` | Começa a pausa (respeita a cota) |
| `pausa/encerrar` | Encerra a pausa |
| `vidas/restaurar` | PV cheio nas criaturas da sala marcada |
| `rolar?dados=1d20&bonus=0` | Joga um dado — aparece em 3D no Relógio |

Três coisas que valem saber:

- **Não passe `?v=`.** Sem ele o atalho age na versão que as telas abertas
  estão usando; fixar a versão na mão quebraria todos os botões no próximo bump
  do formato do estado.
- **O painel precisa ter gravado algo** na sessão para os atalhos agirem — uma
  tela recém-aberta e intocada não semeia o servidor. Mexer em qualquer coisa
  uma vez destrava.
- **Não há autenticação nenhuma** nesses atalhos. Isso não é novidade da rota:
  `POST /api/estado` já era aberto, então quem alcança a URL sempre pôde
  reiniciar a sessão. Em `dungeon.pflausino.xyz` isso vale para a internet
  inteira. Fechar é `basic_auth` no bloco do Caddy cobrindo `/api/`, lembrando
  que aí as telas também precisam mandar a credencial.

## Produção

Em <https://dungeon.pflausino.xyz>, no VPS `pflausino.xyz`. Um container na rede
`proxy` do Docker, atrás do Caddy que já serve os outros sites de lá — o Caddy
termina o TLS e repassa para `dungeon:8777`.

O [`compose.yml`](compose.yml) não constrói imagem nenhuma: o painel não tem
dependências, então `node:22-alpine` roda o servidor direto sobre o repositório
montado em somente-leitura.

```sh
# no VPS, como pflausino (não precisa de sudo: Docker e /opt/proxy são dele)
git clone -b feat/prod-vps git@github.com:pflausino/dnd-rougue.git /opt/apps/dungeon
cd /opt/apps/dungeon && mkdir -p estado
docker compose up -d

# o bloco do site entra no Caddyfile compartilhado, sem substituí-lo
cp /opt/proxy/Caddyfile /opt/proxy/Caddyfile.bak
cat deploy/Caddyfile.trecho >> /opt/proxy/Caddyfile
docker exec caddy caddy validate --config /etc/caddy/Caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Conferir: `curl -s https://dungeon.pflausino.xyz/api/saude`, `docker logs
dungeon` e `docker inspect --format '{{.State.Health.Status}}' dungeon`.

Atualizar: `git -C /opt/apps/dungeon pull && docker restart dungeon`. O estado
sobrevive ao restart — o servidor o relê do disco.

Quatro detalhes que não são opcionais:

- **A porta 8777 não é publicada no host.** Só `expose`, para o Caddy alcançar
  pela rede do Docker. Publicá-la abriria o painel em HTTP puro, contornando o
  TLS.
- **O `deploy/Caddyfile.trecho` é um trecho**, não um Caddyfile. Colá-lo sobre
  `/opt/proxy/Caddyfile` derruba os outros oito sites do mesmo proxy. Acrescente,
  e valide antes de recarregar.
- **O SSE tem rota própria no bloco do Caddy**, sem `encode` e com
  `flush_interval -1`. Comprimido ou bufferizado, o fluxo de eventos só chega
  quando enche um bloco: as telas param de sincronizar e o aviso de conexão
  pisca sem motivo.
- **A trilha também tem rota própria, sem `encode`.** Com `Accept-Encoding:
  gzip`, que todo navegador manda, o Caddy responde `200` sem `Content-Range` no
  lugar do `206` do servidor — o `<audio>` trava calado e a trilha não toca, só
  em produção. MP3 já é comprimido, então nada se perde tirando a rota do
  `encode`.
- **`ARQUIVO_ESTADO` aponta para `estado/`**, montado fora do `:ro` e ignorado
  pelo git, para um `git pull` não levar a sessão embora.

**A senha do painel não protege de verdade.** As telas de controle (Mestre,
Relógio, Loot, Monstros) pedem uma senha antes de abrir, mas a conferência roda
no navegador: quem abrir o DevTools grava a chave em `localStorage` e entra. Ela
evita o jogador abrir a tela do mestre por engano na mesa — não evita mais nada,
e quem tiver a URL ainda alcança tudo. Barrar de verdade continua sendo
`basic_auth` no bloco do Caddy, cobrindo `/webapp/mestre.html`,
`/webapp/loot.html`, `/webapp/monstros.html` e `/webapp/relogio.html`.

## Tela dos Jogadores

Barra fixa com run, ouro do grupo e tempo restante. O palco muda conforme o modo
que o mestre escolhe:

- **Dungeon** — "Run N" em destaque.
- **Acampamento** — as lojas abertas e, depois de um TPK, a escolha da pausa.

### Instalar como app no tablet

Esta tela (e as lojas) instala como aplicativo, para ficar em tela cheia no
tablet da mesa, sem barra de endereço:

- **Chrome/Edge** — ícone de instalar na barra de endereço, ou menu ⋮ →
  *Instalar A Última Dungeon*.
- **iPad/Safari** — Compartilhar → *Adicionar à Tela de Início*.

Precisa de HTTPS, então funciona em <https://dungeon.pflausino.xyz> (e em
`localhost` para testar). Servindo por `file://` não instala.

Perdendo o wi-fi no meio da mesa, o app ainda abre e mostra o último estado que
recebeu, com o aviso de sincronização caída no canto — não sincroniza até a rede
voltar, mas não vira tela de erro.

### Bênçãos do grupo

Toda bênção comprada entra no inventário (`estado.bencaos`) e aparece numa tira
de fichas abaixo do cabeçalho, com ícone, nome e tipo (**Consumível** ou
**Permanente**, conforme [`referencias/bencaos.md`](referencias/bencaos.md)).
Clicar abre um modal com lema, efeito, restrição e a nota sobre o consumo.

Consumíveis ganham no modal um botão **Consumir**, que exige dois toques (o
segundo confirma) e se desarma em cinco segundos. Ao consumir, a bênção sai do
inventário e a ficha desaparece. Permanentes não têm esse botão.

### Ouro do loot

Botão discreto **+ Ouro do loot** no canto inferior esquerdo. Abre um modal com
atalhos (+5, +10, +25, +50, +100, que se somam no campo) e entrada livre, para o
grupo registrar o que recolheu sem depender do mestre.

### Pausas por TPK

Ao registrar um TPK, o grupo volta ao acampamento e escolhe uma pausa de 5, 10 ou
30 minutos na própria tela. As cotas valem para a sessão inteira:

| Pausa | Quantidade |
|---|---|
| 5 min | ilimitada |
| 10 min | 2 |
| 30 min | 1 |

Enquanto a pausa corre, o cronômetro da sessão fica congelado — as 4 horas contam
só tempo de jogo — e a tela do Relógio mostra a contagem numa pílula pequena. Ao
encerrar, o relógio volta a correr se já estava correndo. O mestre pode encerrar
a pausa ou dispensar a escolha; mudar o grupo para **Dungeon** também encerra a
pausa em andamento ou descarta a escolha pendente.

## Lojas do acampamento

As duas lojas de [`referencias/loja.md`](referencias/loja.md), declaradas em
`Dungeon.LOJAS`:

| Loja | Mercador | Tela |
|---|---|---|
| A Última Provisão | Bram Barbacobre | [`bram.html`](webapp/bram.html) |
| O Véu Entre Vidas | Íria Sete-Véus | [`iria.html`](webapp/iria.html) |

Na dungeon as lojas ficam escondidas, e se o mestre trocar para **Dungeon**
enquanto os jogadores estão dentro de uma loja, ela fecha e a tela volta sozinha
para o acampamento ([`webapp/js/guarda-loja.js`](webapp/js/guarda-loja.js)).

Os retratos vêm de `loja/assets/personagens/`; sem o arquivo de imagem, o cartão
cai num retrato de reserva com a inicial do mercador.

### A Última Provisão (Bram)

Três balcões, em subtelas:

| Balcão | O que faz |
|---|---|
| Equipamentos | Os 55 produtos de `referencias/loja.md`, por categoria, com preço e botão de compra. |
| Baú de Itens Mágicos | Cobra 500 PO pela rolagem. O item é sorteado na mesa, pelo mestre. |
| Bênção | A bênção sorteada para a run, com 25% de desconto se o grupo já tem acesso à Íria. |

A bênção é sorteada uma vez por run e fica no estado, então todas as telas veem a
mesma oferta; ela troca quando a run avança, e o mestre pode forçar novo sorteio.
Os três Pergaminhos de Experiência ficam fora do sorteio dele — são marcados com
`mercador: "iria"` em [`webapp/data/bencaos.js`](webapp/data/bencaos.js).

Sem acesso à loja de Íria, o balcão de bênçãos também oferece a **Pedra de Íria**
(100 PO). Comprá-la debita o ouro e libera o acesso na hora; o mestre também pode
ligar ou desligar isso à mão em **Mecânicas**. Enquanto estiver desligado, o
cartão de O Véu Entre Vidas não revela nada — só uma moldura tracejada com um
"?", dando a dica de que há outra loja.

A coluna Maestria mostra o termo em inglês e a tradução em português. O mapa fica
em `window.MAESTRIAS_PT`, no topo de
[`webapp/data/equipamentos.js`](webapp/data/equipamentos.js) — as traduções vieram
de um guia da comunidade, **não** do Livro do Jogador oficial em pt-BR, então vale
conferir e corrigir ali quando tiver o livro à mão.

### O Véu Entre Vidas (Íria)

Vende as dez bênçãos do catálogo, ao preço cheio. Diferente de Bram, não há
balcões: todos os cards aparecem já na entrada.

Os Pergaminhos de Experiência formam uma escada — o de nível 5 exige que o grupo
já tenha comprado o de nível 4, e o de nível 6 exige o de nível 5. O card
bloqueado mostra "Exige &lt;pergaminho anterior&gt;" e não tem botão. O
pré-requisito olha o histórico de compras (`bencaosAdquiridas`), não o
inventário, para que consumir uma bênção nunca retranque a seguinte.

Bênçãos permanentes já em posse não podem ser recompradas; consumíveis podem — a
exceção é o **Relógio Místico**, de compra única (`unico` em
[`webapp/data/bencaos.js`](webapp/data/bencaos.js)). Depois de comprado, o card
mostra "Íria só tinha um" e não volta, nem depois de consumido, nem depois de um
TPK: o limite é da sessão.

O Relógio Místico é também a única bênção cujo efeito o app aplica sozinho.
Consumi-lo na tela dos Jogadores acrescenta **30 minutos à duração da sessão** —
o cronômetro do Relógio vai de 04:00:00 para 04:30:00 e o tempo já decorrido não
muda.

Toda compra debita o ouro do grupo, nas duas lojas, e o botão fica travado quando
o ouro não cobre o preço.

## Mesa do Mestre

Blocos independentes: **Relógio** (iniciar/pausar, ±min, duração da sessão),
**Run** (tentativa, ouro, Registrar TPK), **Tela dos Jogadores** (Dungeon ou
Acampamento), **Sala atual**, **Exibir no Relógio**, **Mecânicas**, **Pausas** e
**Sessão** (duração e reiniciar tudo).

### Sala atual

Um botão por sala do fluxo da aventura, de
[`webapp/data/salas.js`](webapp/data/salas.js). A sala escolhida aparece nomeada
no alto da tela do Relógio e escolhe a trilha que toca lá. Clicar na sala já
marcada desmarca — é como o mestre corta a trilha sem escolher outra sala.

### Trilha das salas

Cada sala aponta para um MP3 em `webapp/assets/audio/<pasta>/`. Quem toca é a
tela do Relógio, e só ela: as outras telas ficam mudas, então dá para deixar o
Relógio na caixa de som sem que o notebook do mestre duplique o áudio.

O loop é feito à mão em [`webapp/js/trilha.js`](webapp/js/trilha.js), com dois
elementos `<audio>` e um cruzamento de cinco segundos entre o fim e o começo da
faixa — `audio.loop` daria um corte seco, que se ouve na mesa. Trocar de sala usa
o mesmo cruzamento. As três arenas dividem a mesma faixa e trocar entre elas não
reinicia o áudio.

Duas coisas que valem saber na hora de usar:

- **O navegador não deixa a trilha começar sozinha.** A tela do Relógio é
  projetada e ninguém encosta nela, então o autoplay cai na política do
  navegador. Aparece um botão **Ativar trilha** no canto inferior esquerdo: um
  toque libera o áudio pelo resto da sessão daquela aba. Depois disso o mesmo
  botão liga e desliga o som, sem mexer no estado das outras telas — recarregar a
  página exige um novo toque.
- **Sala sem faixa gerada toca silêncio**, e o nome dela aparece igual. No
  controle do mestre ela vem marcada com *(sem trilha)*. Ao gerar o áudio, largue
  o arquivo em `webapp/assets/audio/<pasta>/batalha.mp3` e aponte o caminho no
  campo `trilha` de [`webapp/data/salas.js`](webapp/data/salas.js).

### Exibir no Relógio

Escolhe o que projetar além do cronômetro. Com algo selecionado, os dígitos
encolhem e o conteúdo ocupa o centro da tela. São três modos:

- **Só o cronômetro** — o padrão.
- **Tabela de raridade** — a tabela de raridade aleatória de itens mágicos de
  [`referencias/tabelas.md`](referencias/tabelas.md), nas versões **Básico** ou
  **Avançado**; só a coluna escolhida aparece. Novas tabelas entram em
  [`webapp/data/tabelas.js`](webapp/data/tabelas.js) e surgem aqui sozinhas.
- **Hidra** — as cabeças da Draconidra, abaixo.

### Hidra

Rastreia as cabeças da Dracohydra no chefe final. Começa com **cinco**, mas o
traço *Multiple Heads* faz o número mudar durante o combate: uma cabeça morre ao
sofrer 30 de dano num turno e, no fim dele, nascem **duas** no lugar — a menos
que ela tenha sofrido dano radiante.

No **Mestre**, cada cabeça é um botão: clicar corta, clicar de novo traz de
volta (elas renascem, então cortar e curar são o mesmo gesto). Ao lado, **+1** e
**+2 cabeças** para os nascimentos, **− última** para desfazer um clique errado
e **Reiniciar** para voltar às cinco. No **Relógio** as mesmas cabeças aparecem
grandes, com o número embaixo; as cortadas ficam cinza com um X vermelho.

Um TPK devolve a hidra inteira, junto com o resto da run. Passando de cinco, a
arte se repete em roda — a de nº 6 usa o retrato da primeira.

Os cinco retratos vivem em `webapp/assets/hidra/`, recortados de uma folha de
arte única. A cor é enfeite: o *Bite* escolhe o tipo de dano na hora, entre os
do *Prismatic Breath* — não existe "a cabeça de fogo" na ficha.

### Mecânicas

Interruptores que o mestre liga conforme o grupo progride. Hoje: **Acesso à loja
de Íria**, que libera O Véu Entre Vidas e dá os 25% de desconto nas bênçãos de
Bram. O bloco também mostra a bênção da run e permite sortear outra.

## A Arena num quadro só

A Arena é **uma sala só** em [`webapp/data/salas.js`](webapp/data/salas.js), não
três fases. Os inimigos entram em sequência sem pausa, então marcar a fase
seguinte no meio do combate só para achar a vida de um zumbi custaria o tempo
que o painel existe para poupar: goblins, zumbis e o Contemplador Zumbi
aparecem juntos, com a mesma trilha.

A calculadora de loot em [`webapp/data/loot.js`](webapp/data/loot.js) continua
com os três encontros separados — lá o eixo é o ouro por inimigo, e é onde a
divisão ainda paga.

## Hordas conduzidas como mob

O painel de combate da tela de Monstros dá uma linha de vida por criatura — cinco
Ghasts, cinco linhas. Fichas com `mob` em
[`webapp/data/monstros.js`](webapp/data/monstros.js) fogem disso: a linha passa a
ser do **grupo**, com o PV das criaturas somado, e ao lado quantas ainda estão de
pé, derivado do dano.

Hoje só a Arena 2 usa: 10 zumbis em `{ grupos: 2, porGrupo: 5 }` viram duas
barras de `75` PV, cada uma mostrando "5 de pé", "4 de pé"… Dez barras de 15 não
diriam nada a mais e custariam tempo de mesa.

O contador arredonda **para cima**: com 1 PV sobrando ainda há uma criatura em pé,
e é ela que ataca no turno. Ele importa porque as regras continuam sendo por
criatura, não por barra — quantos Slams saem, e quantas salvaguardas de Undead
Fortitude rolar quando o dano acumulado cruza um múltiplo de 15.

## Projetor na mesa

Duas telas para marcar áreas na mesa física com um projetor apontado para o
tapete: [`webapp/projetor.html`](webapp/projetor.html), onde o mestre monta as
formas, e [`webapp/projecao.html`](webapp/projecao.html), a janela que se arrasta
para o projetor e não mostra nada além do canvas. Elas conversam pelo mesmo
estado compartilhado das outras telas, então o mestre pode montar do notebook e
projetar de outro aparelho.

Formas disponíveis: **círculo** e **retângulo**. Arraste pelo meio para mover, a
alça do canto muda o tamanho e a de cima gira — `Shift` ao girar trava de 15 em
15 graus, `Delete` apaga a forma marcada, `Esc` desmarca. A cor da forma e a do
fundo saem de paletas prontas ou de um seletor livre.

**Esconder da mesa** (`H`) é o interruptor geral do que sai no projetor. Com ele
ligado a projeção mostra só o fundo, e a prévia do mestre continua mostrando as
formas apagadas — dá para montar a marcação da próxima sala sem a mesa ver e
revelar tudo de uma vez. Enquanto está escondido, um selo vermelho avisa na tela
do Projetor; sem ele o erro fácil é montar a marcação, esquecer que escondeu e
ficar esperando a mesa reagir a uma coisa que ninguém está vendo.

Cada forma tem ainda um **efeito** — *Parado*, *Pulsar* ou *Piscar* — e um modo
**só contorno**, que projeta a borda em vez da área cheia e deixa ver o que está
no tapete por baixo. Efeito e contorno valem para a forma marcada, não para
todas: o normal na mesa é uma área "ativa" pulsando e as outras paradas. Os dois
efeitos usam o mesmo período (1,6 s) e tiram a fase de `Dungeon.agora()`, o
relógio corrigido pelo servidor — é o que mantém a prévia e a projeção piscando
juntas mesmo em máquinas diferentes.

Quatro coisas que valem saber:

- **Nada é medido em pés.** Não há grade nem calibragem: o tamanho se acerta no
  olho, arrastando até bater com o tapete. Foi escolha consciente, não pendência.
- **Posição e tamanho são frações, não pixels.** `x`/`y` são frações da largura e
  da altura do canvas; `largura`/`altura` são frações **só da altura**. A tela do
  mestre e o projetor quase nunca têm a mesma proporção, e medir tamanho pela
  altura nos dois é o que mantém o círculo redondo em vez de virar elipse na
  projeção.
- **A prévia desenha de um rascunho local enquanto se arrasta.** Gravar estado a
  cada `pointermove` viraria uma enxurrada de POSTs. O estado recebe no máximo
  uma gravação a cada 60 ms, mais a final ao soltar o botão — um arraste inteiro
  sai em 1 ou 2 POSTs.
- **A tela de Projeção não tem o aviso de conexão caída.** As outras têm; ela
  não, de propósito — o aviso apareceria projetado no tapete. Quem percebe a
  queda é o mestre, pelo aviso da tela do Projetor.

A senha cobre só `projetor.html`. `projecao.html` fica aberta para poder ser
aberta direto num tablet ou num segundo computador ligado ao projetor, e ela não
mostra nada que a mesa já não esteja vendo na própria mesa.

## Loot da run

[`webapp/loot.html`](webapp/loot.html) acumula o que o grupo derrubou e fecha a
conta no fim do ciclo. Inimigos e faixas de recompensa vêm da seção 13 de
[`referencias/aventura.md`](referencias/aventura.md), em
[`webapp/data/loot.js`](webapp/data/loot.js).

Cada linha tem contador (−/+, valor digitável e "Todos" para marcar o encontro
inteiro), a expressão daquele grupo (`5d8 + 40`) e a média. O resumo lateral junta
tudo por tipo de dado — `19d4 + 8d8 + 2d20 + 180` — com média, mínimo e máximo. É
essa expressão que o mestre anuncia à mesa.

Cada sala tem um botão **Ouro dobrado**, para efeitos como o Contrato da Fortuna:
a sala dobra os próprios dados (`5d8 + 40` vira `10d8 + 80`), então a expressão
anunciada já sai pronta. É marcação manual do mestre — nenhuma bênção liga isso
sozinha.

"Rolar por eles" sorteia quando ninguém quer rolar; o campo de resultado aceita o
valor rolado na mesa e **Somar ao ouro** joga no ouro do grupo. **Zerar contagem**
limpa os contadores e as salas dobradas para a próxima run.

## De onde vêm os dados

| Referência | Arquivo do webapp | Conteúdo |
|---|---|---|
| `referencias/loja.md` | [`webapp/data/equipamentos.js`](webapp/data/equipamentos.js) | Os 55 produtos de Bram e as maestrias. |
| `referencias/bencaos.md` | [`webapp/data/bencaos.js`](webapp/data/bencaos.js) | As nove bênçãos, a Pedra de Íria, preços e tipos. |
| `referencias/tabelas.md` | [`webapp/data/tabelas.js`](webapp/data/tabelas.js) | Tabelas projetáveis no Relógio. |
| `referencias/aventura.md` (seção 13) | [`webapp/data/loot.js`](webapp/data/loot.js) | Inimigos, ND e faixas de ouro. |
| `referencias/aventura.md` (seção 2) | [`webapp/data/salas.js`](webapp/data/salas.js) | Salas do fluxo e a trilha de cada uma. |
| `referencias/aventura.md` (seção 15) | [`webapp/data/monstros.js`](webapp/data/monstros.js) | Blocos de estatística dos 13 monstros e as rolagens de cada ação. |
| — (arte, sem referência em `.md`) | [`webapp/data/hidra.js`](webapp/data/hidra.js) | Retratos das cabeças da hidra, em `webapp/assets/hidra/`. |

Ao mudar uma referência, atualize o arquivo de dados correspondente — e
vice-versa.
