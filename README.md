# A Última Dungeon

Este repositório reúne o aplicativo web e as referências de **A Última Dungeon**, uma aventura roguelike de D&D 5e:

- [`webapp/`](webapp/): painel de mesa com as telas Mestre, Jogadores e Relógio.
- [`loja/`](loja/): pequeno site da loja disponível aos jogadores.
- [`referencias/`](referencias/): documentação da aventura e da loja.

## Painel de mesa

| Tela | Arquivo | Função |
|---|---|---|
| Painel | [`webapp/index.html`](webapp/index.html) | Escolhe qual tela abrir. |
| Mestre | [`webapp/mestre.html`](webapp/mestre.html) | Controla a tela dos jogadores, o relógio, a run e o ouro. |
| Jogadores | [`webapp/jogadores.html`](webapp/jogadores.html) | Tela pública da mesa: dungeon ou acampamento, tempo e ouro. |
| Relógio | [`webapp/relogio.html`](webapp/relogio.html) | Cronômetro da sessão em tela cheia; só exibe, quem controla é o Mestre. |

Cada tela deve ficar em uma janela ou monitor diferente. As três compartilham o
mesmo estado e se atualizam entre si automaticamente.

### Bênçãos do grupo

Toda bênção comprada entra no inventário do grupo (`estado.bencaos`). Durante a
dungeon, a tela dos jogadores mostra uma tira de fichas logo abaixo do cabeçalho
— ícone, nome e tipo (**Consumível** ou **Permanente**, conforme
[`referencias/bencaos.md`](referencias/bencaos.md)). Clicar em uma ficha abre um
modal com lema, efeito, restrição e a nota sobre o consumo.

Bênçãos **consumíveis** ganham no modal um botão **Consumir**, que exige dois
toques (o segundo confirma) e some sozinho depois de cinco segundos sem
confirmação. Ao consumir, a bênção sai do inventário e a ficha desaparece da
tira. As permanentes não têm esse botão.

### Ouro do loot

No canto inferior esquerdo da tela dos jogadores há um botão discreto
**+ Ouro do loot**. Ele abre um modal com atalhos (+5, +10, +25, +50, +100, que
se somam no campo) e entrada livre, para o grupo registrar o que recolheu sem
depender do mestre. O valor entra no ouro do grupo e aparece em todas as telas.

### Exibir no Relógio

Em **Exibir no Relógio**, na mesa do mestre, ele escolhe o que projetar além do
cronômetro. Com algo selecionado, os dígitos encolhem e a tabela ocupa o centro
da tela; em "Só o cronômetro" o relógio volta ao tamanho cheio.

A primeira exibição é a **tabela de raridade aleatória de itens mágicos**
([`referencias/tabelas.md`](referencias/tabelas.md)), nas versões **Básico** ou
**Avançado** — só a coluna escolhida aparece, ao lado da raridade. Novas
exibições entram em [`webapp/data/tabelas.js`](webapp/data/tabelas.js) e
aparecem no controle automaticamente.

### Pausas por TPK

Ao registrar um TPK, o grupo volta ao acampamento e escolhe, na própria tela dos
jogadores, uma pausa de 5, 10 ou 30 minutos. As cotas valem para a sessão
inteira:

| Pausa | Quantidade |
|---|---|
| 5 min | ilimitada |
| 10 min | 2 |
| 30 min | 1 |

Enquanto a pausa corre, o cronômetro da sessão fica congelado — as 4 horas
contam só tempo de jogo. Ao encerrar a pausa, o relógio volta a correr se já
estava correndo. O mestre pode encerrar a pausa ou dispensar a escolha, e mudar
o grupo para **Dungeon** também encerra a pausa em andamento — ou descarta a
escolha que ainda não foi feita.

Enquanto a pausa corre, a tela do Relógio mostra a contagem numa pílula pequena,
sem tirar o cronômetro da sessão do lugar de destaque.

### Lojas do acampamento

No acampamento, a tela dos jogadores mostra as duas lojas descritas em
[`referencias/loja.md`](referencias/loja.md):

| Loja | Mercador | Catálogo |
|---|---|---|
| A Última Provisão | Bram Barbacobre | `catalogo.html?loja=bram` |
| O Véu Entre Vidas | Íria Sete-Véus | `catalogo.html?loja=iria` |

Na dungeon as lojas ficam escondidas. Se o mestre trocar para **Dungeon**
enquanto os jogadores estão dentro de um catálogo, a loja fecha e a tela volta
sozinha para o acampamento. Os retratos vêm de
`loja/assets/personagens/`; sem o arquivo de imagem, o cartão cai num retrato de
reserva com a inicial do mercador. As lojas são declaradas em `Dungeon.LOJAS`,
em [`webapp/js/state.js`](webapp/js/state.js).

### A Última Provisão (Bram)

A loja tem três balcões:

| Balcão | O que faz |
|---|---|
| Equipamentos | Os 55 produtos de `referencias/loja.md`, por categoria, com preço e botão de compra. |
| Baú de Itens Mágicos | Cobra 300 PO pela rolagem. O item é sorteado na mesa, pelo mestre. |
| Bênção | Mostra a bênção sorteada para a run, com 25% de desconto se o grupo já tem acesso à Íria. |

Os três Pergaminhos de Experiência ficam fora do sorteio de Bram: são marcados
com `mercador: "iria"` em [`webapp/data/bencaos.js`](webapp/data/bencaos.js) e
serão vendidos por O Véu Entre Vidas. Sobram seis bênçãos no sorteio dele.

A coluna Maestria mostra o termo em inglês (como nas fichas) e a tradução em
português logo abaixo. O mapa fica em `window.MAESTRIAS_PT`, no topo de
[`webapp/data/equipamentos.js`](webapp/data/equipamentos.js) — as traduções
vieram de um guia da comunidade, não do Livro do Jogador oficial em pt-BR, então
vale conferir e corrigir ali quando tiver o livro à mão.

Toda compra debita o ouro do grupo; o botão fica travado quando o ouro não
cobre o preço. Os dados ficam em [`webapp/data/`](webapp/data/), transcritos de
`referencias/loja.md` e `referencias/bencaos.md`.

A bênção é sorteada uma vez por run e fica registrada no estado, então as três
telas mostram a mesma oferta. Ela troca sozinha quando a run avança, e o mestre
pode forçar um novo sorteio.

Sem acesso à loja de Íria, o balcão de bênçãos também oferece a **Pedra de Íria**
(100 PO). Comprá-la debita o ouro e liga o acesso na hora — o mestre também pode
ligar ou desligar isso à mão em **Mecânicas**, na mesa do mestre. Enquanto o
acesso estiver desligado, o cartão de O Véu Entre Vidas não revela nada: fica só
uma moldura tracejada com um "?", dando a dica de que há outra loja no
acampamento.

### Como rodar

Servir os arquivos por HTTP é a forma recomendada, pois garante a sincronização
entre as telas:

```sh
python3 -m http.server 8777
```

Depois abra <http://localhost:8777/webapp/>.

Abrir os arquivos direto do disco (`file://`) também funciona no mesmo
navegador, mas a sincronização depende do `localStorage` compartilhado e é menos
confiável.

### Sincronização

O estado (relógio, run, ouro e modo) fica em `localStorage` e é
propagado por `BroadcastChannel`, pelo evento `storage` e por um polling de
500 ms. Isso cobre várias janelas **do mesmo navegador, no mesmo computador**.
Usar telas em dispositivos diferentes exigirá um servidor de estado, ainda não
implementado.
