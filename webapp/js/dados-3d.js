/* Dado 3D da tela do Relógio — a mesa vê o dado físico rolar de verdade.
 *
 * Único módulo ES do projeto: dice-box só publica como import ESM, e é a
 * exceção de dependência externa citada no CLAUDE.md (vendorizada em
 * webapp/assets/dice-box/, sem CDN — o resto do app não tem build nem lib).
 *
 * Quem realmente decide o resultado é esta tela: dice-box não tem como
 * "forçar" o pouso num valor escolhido, então o número que sai da física AQUI
 * é o oficial, gravado de volta no estado. Sem esta tela aberta ou se o dado
 * falhar ao carregar, quem pediu a rolagem (js/monstros.js) resolve sozinho
 * depois de uma espera — daí não travar o jogo.
 */
import DiceBox from "../assets/dice-box/dice-box.es.min.js";

(function () {
  "use strict";

  var D = window.Dungeon;
  if (!D) return;

  /* Quanto o dado fica na tela depois de parar. Conta a partir do fim da
   * física, então o tempo total na tela é isto mais os ~2 s da queda. Precisa
   * dar para a mesa inteira olhar para a TV e ler a face sem correria — 3,2 s
   * era pouco. Uma rolagem nova sempre interrompe a anterior, então alongar
   * aqui não atrapalha quem rola em sequência. */
  var TEMPO_VISIVEL_MS = 8000;

  /* dice-box monta o worker de física por um Worker de Blob URL; se algo no
   * caminho travar (ambiente sem WebGL, extensão de automação interceptando
   * a rede, disco lento na primeira carga…), `init`/`roll` nunca resolvem
   * nem rejeitam — ficam pendentes pra sempre. Sem um limite próprio, essa
   * tela trava esperando o dado por toda a sessão. */
  var LIMITE_INIT_MS = 6000;
  /* Bem acima do `settleTimeout` do próprio dice-box (5 s): este limite é rede
   * de segurança contra promessa que nunca volta, não um prazo de animação.
   * Com 6 s ele disparava antes de a física assentar — o dado sumia no meio da
   * queda e o resultado vinha do caminho de erro. Vale principalmente na
   * primeira rolagem, que ainda está carregando tema e malha. */
  var LIMITE_ROLL_MS = 12000;

  function comLimite(promessa, ms) {
    return new Promise(function (resolve, reject) {
      var venceu = window.setTimeout(function () {
        reject(new Error("tempo esgotado"));
      }, ms);
      promessa.then(
        function (valor) {
          window.clearTimeout(venceu);
          resolve(valor);
        },
        function (erro) {
          window.clearTimeout(venceu);
          reject(erro);
        }
      );
    });
  }

  var camada = document.createElement("div");
  camada.className = "dado-3d";
  camada.setAttribute("data-dado-3d", "");
  document.body.appendChild(camada);

  var CORES = {
    Acerto: "#9d5cf0",
    Dano: "#b23a4d"
  };

  /* O worker de física roda de uma blob URL (dice-box cria o worker a partir
   * de um Blob, não do arquivo em si). Um `assetPath` relativo resolve contra
   * a página quando o fetch sai da thread principal, mas dentro do worker
   * essa blob URL não tem diretório — o mesmo caminho relativo não bate em
   * lugar nenhum e o carregamento de tema fica pendente pra sempre, sem erro
   * nenhum. Por isso o caminho absoluto, calculado a partir do próprio módulo
   * em vez de fixo em "/webapp/": sobrevive a um prefixo diferente no proxy. */
  var ASSET_PATH = new URL("../assets/dice-box/assets/", import.meta.url).href;

  /* `container` quer um seletor CSS (string), não o elemento em si — por
   * isso o atributo em vez do de costume no projeto de ligar DOM só depois de
   * criar o nó, por `data-*`.
   *
   * Física default da lib — testada isolada (sem nenhum ajuste) e o valor
   * bate com a face. Ajustar gravity/spinForce/throwForce só junto de um
   * teste isolado igual a esse, nunca "no escuro" direto no app: são exatamente
   * os parâmetros que mudam o tempo de acomodação e podem reabrir a corrida
   * documentada abaixo em "Rolagens de dado" no CLAUDE.md. `suspendSimulation`
   * NÃO é a solução: desliga a cena 3D inteira e só devolve o número, sem
   * nenhum dado visível — outra armadilha já paga, não repetir. */
  var box = new DiceBox({
    container: "[data-dado-3d]",
    origin: "",
    assetPath: ASSET_PATH,
    scale: 10,
    theme: "default"
  });

  /* Se o WebGL, os assets ou o worker falharem (ou só nunca responderem),
   * `pronto` resolve para null e o dado simplesmente não anima — a rolagem
   * local de js/monstros.js cobre o resto. */
  var pronto = comLimite(box.init(), LIMITE_INIT_MS).then(
    function () {
      return true;
    },
    function (erro) {
      console.error("[dados-3d] não iniciou", erro);
      return null;
    }
  );

  var ultimoId = null;
  var escondendoEm = null;

  function esconder() {
    camada.classList.remove("dado-3d--ativo");
  }

  D.assinar(function (estado) {
    var rolagem = estado.rolagem;
    if (!rolagem || rolagem.status !== "pendente" || rolagem.id === ultimoId) return;
    ultimoId = rolagem.id;

    pronto.then(function (ok) {
      /* A rolagem pode ter sido resolvida por outra via enquanto a lib
       * carregava (fallback de quem pediu, por exemplo). */
      if (!ok || D.get().rolagem.id !== rolagem.id || D.get().rolagem.status !== "pendente") return;

      /* Trava o retorno local ANTES de rolar: a física já vai começar a cair
       * e não tem como cancelar. Sem essa trava, o retorno local podia gravar
       * um número diferente enquanto o dado de verdade ainda está no ar, e a
       * face que ele mostra no final não bateria com o que ficou no estado —
       * foi exatamente esse o bug que motivou este trecho. */
      if (!D.acoes.marcarRolagemAnimando(rolagem.id)) return;

      if (escondendoEm) {
        window.clearTimeout(escondendoEm);
        escondendoEm = null;
      }
      box.clear();
      camada.classList.add("dado-3d--ativo");

      /* Som junto do lançamento, não do resultado: a física leva ~2 s até
       * assentar, e o barulho chegando no fim soaria descolado do que a mesa
       * está vendo. Sai calado se ninguém tocou nesta aba ainda — política de
       * autoplay, a mesma que obriga o botão da trilha. */
      if (window.SomDados) window.SomDados.tocar(rolagem.qtd, rolagem.lados);

      comLimite(
        box.roll({
          qty: rolagem.qtd,
          sides: rolagem.lados,
          themeColor: CORES[rolagem.rotulo] || "#c3a2f7"
        }),
        LIMITE_ROLL_MS
      )
        .then(function (resultados) {
          /* `roll({qty, sides, ...})` devolve um array plano — um item por
           * dado, cada um já com `.value` — não um array de grupos com
           * `.rolls` (isso existe pra outras formas de chamar `roll`, não
           * pra essa). Ler `resultados[0].rolls` aqui SEMPRE dava undefined:
           * a chamada caía no catch, que gerava um número novo e
           * desconectado — o valor real da física, correto, ia pro lixo
           * sem nunca ser gravado. Foi a causa do dado mostrar uma coisa e o
           * log mostrar outra. */
          var dados = resultados.map(function (dado) {
            return dado.value;
          });
          var total = dados.reduce(function (a, b) {
            return a + b;
          }, 0);
          D.acoes.resolverRolagem(rolagem.id, dados, total + rolagem.bonus);
          escondendoEm = window.setTimeout(esconder, TEMPO_VISIVEL_MS);
        })
        .catch(function (erro) {
          /* Já marcamos "animando" — ninguém mais vai resolver essa rolagem.
           * Se a física falhar ou nunca terminar, o retorno tem de ser
           * daqui, senão o estado fica preso pra sempre. */
          console.error("[dados-3d] falhou ao rolar", erro);
          var dados = [];
          for (var i = 0; i < rolagem.qtd; i += 1) {
            dados.push(1 + Math.floor(Math.random() * rolagem.lados));
          }
          var total = dados.reduce(function (a, b) {
            return a + b;
          }, 0);
          D.acoes.resolverRolagem(rolagem.id, dados, total + rolagem.bonus);
          esconder();
        });
    });
  });
})();
