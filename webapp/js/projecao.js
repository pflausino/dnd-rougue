/* Tela de Projeção: a janela que vai para o projetor.
 *
 * Não edita nada — só desenha o que a tela do Projetor gravou no estado. Toda
 * a interface (botão de tela cheia, cursor) some sozinha depois de um tempo
 * parada: o que sai daqui bate na mesa de jogo, e uma seta de mouse ou uma
 * barra de botões projetada no tapete estraga o efeito.
 */
(function () {
  "use strict";

  var D = window.Dungeon;
  var Formas = window.ProjecaoFormas;

  var el = {
    canvas: document.querySelector("[data-projecao-canvas]"),
    controles: document.querySelector("[data-projecao-controles]"),
    telaCheia: document.querySelector("[data-projecao-tela-cheia]")
  };

  var ctx = el.canvas.getContext("2d");
  var OCIOSO_MS = 2000;
  var temporizadorOcioso = null;

  /* O canvas tem dois tamanhos: o de CSS (o que ocupa na tela) e o de buffer
   * (quantos pixels ele realmente pinta). Sem multiplicar pelo
   * devicePixelRatio, a borda do círculo sai serrilhada num projetor de
   * resolução alta.
   *
   * Mexer em `width`/`height` realoca o buffer e zera o contexto — caro, e com
   * forma animada isto roda 60 vezes por segundo. Só toca quando mudou. */
  function ajustarTamanho() {
    var escala = window.devicePixelRatio || 1;
    var largura = el.canvas.clientWidth;
    var altura = el.canvas.clientHeight;
    var bufferL = Math.round(largura * escala);
    var bufferA = Math.round(altura * escala);
    if (el.canvas.width !== bufferL || el.canvas.height !== bufferA) {
      el.canvas.width = bufferL;
      el.canvas.height = bufferA;
    }
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    return { largura: largura, altura: altura };
  }

  function pintar() {
    var tamanho = ajustarTamanho();
    var estado = D.get();
    Formas.desenhar(ctx, tamanho.largura, tamanho.altura, estado.projecao, {
      /* `agora()` e não `Date.now()`: é o relógio do servidor, e é ele que
       * mantém esta tela pulsando em fase com a prévia do Projetor, mesmo em
       * máquinas diferentes. */
      instante: D.agora()
    });
    /* O fundo do canvas vaza para a página: numa janela com barras (proporção
     * diferente da do canvas) o entorno fica da mesma cor, sem moldura. */
    document.body.style.background = estado.projecao.fundo;
  }

  /* Só roda quadro a quadro se houver forma animada. Parado, a tela repinta
   * apenas quando o estado muda — um requestAnimationFrame ligado a sessão
   * inteira num projetor não paga o que custa. */
  var quadro = null;

  function laco() {
    quadro = null;
    pintar();
    if (Formas.temAnimacao(D.get().projecao)) quadro = window.requestAnimationFrame(laco);
  }

  function acompanhar() {
    if (quadro !== null) return;
    if (!Formas.temAnimacao(D.get().projecao)) {
      pintar();
      return;
    }
    quadro = window.requestAnimationFrame(laco);
  }

  function mostrarControles() {
    el.controles.hidden = false;
    document.body.classList.remove("projecao--ociosa");
    window.clearTimeout(temporizadorOcioso);
    temporizadorOcioso = window.setTimeout(function () {
      el.controles.hidden = true;
      document.body.classList.add("projecao--ociosa");
    }, OCIOSO_MS);
  }

  el.telaCheia.addEventListener("click", function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  });

  document.addEventListener("mousemove", mostrarControles);
  document.addEventListener("keydown", mostrarControles);
  window.addEventListener("resize", pintar);

  D.assinar(acompanhar);
  mostrarControles();
})();
