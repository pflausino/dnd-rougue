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
estava correndo. O mestre pode encerrar a pausa ou dispensar a escolha.

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
