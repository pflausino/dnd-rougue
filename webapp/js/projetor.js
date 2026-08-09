/* Tela do Projetor: onde o mestre monta o que a tela de Projeção joga na mesa.
 *
 * O canvas daqui é uma prévia em escala do outro — mesmas coordenadas, mesmo
 * módulo de desenho (js/projecao-formas.js), só menor. Arrastar, redimensionar
 * e girar acontecem aqui; a outra tela só lê o estado e pinta.
 *
 * Duas decisões que valem saber:
 *
 * - **A prévia desenha de um rascunho local durante o arraste**, não do
 *   estado. Cada `pointermove` gravando estado viraria uma enxurrada de POSTs
 *   no servidor e um arraste travado. O rascunho dá 60 fps aqui, e o estado
 *   recebe no máximo uma gravação a cada INTERVALO_GRAVACAO_MS, mais uma
 *   final e exata ao soltar o botão.
 * - **Só se escreve estado em resposta a evento de ponteiro ou clique.** O
 *   render nunca grava — com o servidor no meio, um render que grava vira laço
 *   de gravações entre as telas abertas.
 */
(function () {
  "use strict";

  var D = window.Dungeon;
  var Formas = window.ProjecaoFormas;

  var el = {
    canvas: document.querySelector("[data-projetor-canvas]"),
    tipos: document.querySelector("[data-projetor-tipos]"),
    cores: document.querySelector("[data-projetor-cores]"),
    corLivre: document.querySelector("[data-projetor-cor-livre]"),
    fundos: document.querySelector("[data-projetor-fundos]"),
    fundoLivre: document.querySelector("[data-projetor-fundo-livre]"),
    efeitos: document.querySelector("[data-projetor-efeitos]"),
    contorno: document.querySelector("[data-projetor-contorno]"),
    alternar: document.querySelector("[data-projetor-alternar]"),
    apagar: document.querySelector("[data-projetor-apagar]"),
    limpar: document.querySelector("[data-projetor-limpar]"),
    contagem: document.querySelector("[data-projetor-contagem]"),
    escondido: document.querySelector("[data-projetor-escondido]"),
    dica: document.querySelector("[data-projetor-dica]")
  };

  var ctx = el.canvas.getContext("2d");

  var INTERVALO_GRAVACAO_MS = 60;
  var RAIO_ALCA = 9;
  /* Em frações da altura do canvas, como todo tamanho de forma. O mínimo
   * existe para uma forma encolhida até zero não sumir sem volta. */
  var TAMANHO_MINIMO = 0.02;
  var TAMANHO_NOVO = 0.22;
  var PASSO_GIRO = 15;

  var selecionada = null;
  var corAtual = Formas.CORES[0].valor;
  /* Gesto em andamento: {modo, id, ...âncoras}. null quando parado. */
  var gesto = null;
  /* A forma sendo manipulada, à frente do estado. null fora do gesto. */
  var rascunho = null;
  var ultimaGravacao = 0;

  function tamanhoCanvas() {
    return { largura: el.canvas.clientWidth, altura: el.canvas.clientHeight };
  }

  function formasAtuais() {
    var lista = D.get().projecao.formas;
    if (!rascunho) return lista;
    return lista.map(function (forma) {
      return forma.id === rascunho.id ? rascunho : forma;
    });
  }

  /* --- desenho ----------------------------------------------------------- */

  function desenharAlcas(forma, tamanho) {
    var pontos = Formas.alcas(forma, tamanho.largura, tamanho.altura);
    var c = Formas.caixa(forma, tamanho.largura, tamanho.altura);

    ctx.save();
    ctx.translate(c.cx, c.cy);
    ctx.rotate(c.giro);
    ctx.strokeStyle = "#7b3fbf";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(-Math.abs(c.w) / 2, -Math.abs(c.h) / 2, Math.abs(c.w), Math.abs(c.h));
    ctx.restore();

    /* A haste da alça de giro sai do topo da caixa; sem ela a bolinha solta no
     * ar não se lê como "gire por aqui". */
    var topo = Formas.paraCanvas({ x: 0, y: -Math.abs(c.h) / 2 }, c);
    ctx.save();
    ctx.strokeStyle = "#7b3fbf";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(topo.x, topo.y);
    ctx.lineTo(pontos.giro.x, pontos.giro.y);
    ctx.stroke();
    ctx.restore();

    [pontos.tamanho, pontos.giro].forEach(function (ponto) {
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#7b3fbf";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ponto.x, ponto.y, RAIO_ALCA - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  }

  /* Mexer em `canvas.width`/`height` realoca o buffer e zera o contexto — caro,
   * e a animação passa por aqui 60 vezes por segundo. Só toca quando o tamanho
   * mudou de fato. */
  function ajustarTamanho(tamanho) {
    var escala = window.devicePixelRatio || 1;
    var largura = Math.round(tamanho.largura * escala);
    var altura = Math.round(tamanho.altura * escala);
    if (el.canvas.width !== largura || el.canvas.height !== altura) {
      el.canvas.width = largura;
      el.canvas.height = altura;
    }
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
  }

  function pintar() {
    var tamanho = tamanhoCanvas();
    ajustarTamanho(tamanho);

    var projecao = D.get().projecao;
    Formas.desenhar(
      ctx,
      tamanho.largura,
      tamanho.altura,
      { fundo: projecao.fundo, visivel: projecao.visivel, formas: formasAtuais() },
      /* `esmaecer` é o que mantém as formas visíveis aqui enquanto a projeção
       * está escondida — o mestre monta a próxima marcação sem a mesa ver. */
      { instante: D.agora(), esmaecer: true }
    );

    var alvo = formaSelecionada();
    if (alvo) desenharAlcas(alvo, tamanho);
  }

  /* Mesma lógica da tela de Projeção: quadro a quadro só com forma animada.
   * Durante um gesto o laço fica de fora — quem repinta é o `pointermove`, e
   * dois repintadores na mesma prévia brigariam pelo rascunho. */
  var quadro = null;

  function laco() {
    quadro = null;
    if (gesto) return;
    pintar();
    if (Formas.temAnimacao(D.get().projecao)) quadro = window.requestAnimationFrame(laco);
  }

  function acompanhar() {
    if (quadro !== null || gesto) return;
    if (!Formas.temAnimacao(D.get().projecao)) {
      pintar();
      return;
    }
    quadro = window.requestAnimationFrame(laco);
  }

  function formaSelecionada() {
    return (
      formasAtuais().filter(function (forma) {
        return forma.id === selecionada;
      })[0] || null
    );
  }

  /* --- interface --------------------------------------------------------- */

  function sincronizarControles() {
    var projecao = D.get().projecao;
    var total = projecao.formas.length;
    var alvo = formaSelecionada();
    var escondido = projecao.visivel === false;

    el.contagem.textContent = total + (total === 1 ? " forma" : " formas");
    el.apagar.disabled = !alvo;
    el.limpar.disabled = !total;
    el.fundoLivre.value = projecao.fundo;
    el.dica.hidden = total > 0;

    el.alternar.textContent = escondido ? "Mostrar na mesa" : "Esconder da mesa";
    el.alternar.classList.toggle("btn--primario", escondido);
    el.escondido.hidden = !escondido;

    el.cores.querySelectorAll("[data-cor]").forEach(function (botao) {
      botao.setAttribute("aria-pressed", String(botao.dataset.cor === corAtual));
    });
    el.fundos.querySelectorAll("[data-fundo]").forEach(function (botao) {
      botao.setAttribute("aria-pressed", String(botao.dataset.fundo === projecao.fundo));
    });

    /* Efeito e contorno são por forma: sem uma marcada não há o que ajustar. */
    el.efeitos.querySelectorAll("[data-efeito]").forEach(function (botao) {
      botao.disabled = !alvo;
      var atual = (alvo && alvo.efeito) || "nenhum";
      botao.setAttribute("aria-pressed", String(!!alvo && botao.dataset.efeito === atual));
    });
    el.contorno.disabled = !alvo;
    el.contorno.setAttribute("aria-pressed", String(!!alvo && !!alvo.contorno));
  }

  function montarPaletas() {
    Formas.TIPOS.forEach(function (tipo) {
      var botao = document.createElement("button");
      botao.type = "button";
      botao.className = "btn btn--fantasma btn--pequeno";
      botao.dataset.tipo = tipo.id;
      botao.textContent = "+ " + tipo.nome;
      el.tipos.appendChild(botao);
    });

    Formas.EFEITOS.forEach(function (efeito) {
      var botao = document.createElement("button");
      botao.type = "button";
      botao.className = "btn btn--fantasma btn--pequeno";
      botao.dataset.efeito = efeito.id;
      botao.textContent = efeito.nome;
      el.efeitos.appendChild(botao);
    });

    Formas.CORES.forEach(function (cor) {
      var botao = document.createElement("button");
      botao.type = "button";
      botao.className = "amostra";
      botao.dataset.cor = cor.valor;
      botao.style.setProperty("--amostra-cor", cor.valor);
      botao.title = cor.nome;
      botao.setAttribute("aria-label", cor.nome);
      el.cores.appendChild(botao);
    });

    Formas.FUNDOS.forEach(function (fundo) {
      var botao = document.createElement("button");
      botao.type = "button";
      botao.className = "amostra";
      botao.dataset.fundo = fundo.valor;
      botao.style.setProperty("--amostra-cor", fundo.valor);
      botao.title = fundo.nome;
      botao.setAttribute("aria-label", fundo.nome);
      el.fundos.appendChild(botao);
    });
  }

  /* --- ações ------------------------------------------------------------- */

  function adicionar(tipo) {
    selecionada = D.acoes.adicionarForma({
      tipo: tipo,
      x: 0.5,
      y: 0.5,
      largura: TAMANHO_NOVO,
      altura: TAMANHO_NOVO,
      giro: 0,
      cor: corAtual,
      efeito: "nenhum",
      contorno: false
    });
    /* `adicionarForma` já notificou os assinantes *antes* de `selecionada`
     * receber o id, então o repintar de lá não desenhou as alças. Repinta. */
    acompanhar();
    sincronizarControles();
  }

  function aplicarCor(valor) {
    corAtual = valor;
    if (selecionada) D.acoes.ajustarForma(selecionada, { cor: valor });
    else sincronizarControles();
  }

  /* --- ponteiro ---------------------------------------------------------- */

  function pontoDoEvento(evento) {
    var caixa = el.canvas.getBoundingClientRect();
    return { x: evento.clientX - caixa.left, y: evento.clientY - caixa.top };
  }

  function perto(ponto, alvo) {
    var dx = ponto.x - alvo.x;
    var dy = ponto.y - alvo.y;
    return dx * dx + dy * dy <= RAIO_ALCA * RAIO_ALCA * 4;
  }

  function gravarGesto(forcar) {
    if (!rascunho) return;
    /* `Date.now()` e não `agora()` de propósito: isto é só o relógio do
     * estrangulamento local, não vai para o estado. */
    var momento = Date.now();
    if (!forcar && momento - ultimaGravacao < INTERVALO_GRAVACAO_MS) return;
    ultimaGravacao = momento;
    D.acoes.ajustarForma(rascunho.id, {
      x: rascunho.x,
      y: rascunho.y,
      largura: rascunho.largura,
      altura: rascunho.altura,
      giro: rascunho.giro
    });
  }

  el.canvas.addEventListener("pointerdown", function (evento) {
    var ponto = pontoDoEvento(evento);
    var tamanho = tamanhoCanvas();
    var alvo = formaSelecionada();

    /* As alças ganham do corpo da forma: elas ficam justamente na borda, e
     * quem clica ali quer redimensionar, não arrastar. */
    if (alvo) {
      var pontos = Formas.alcas(alvo, tamanho.largura, tamanho.altura);
      if (perto(ponto, pontos.giro)) gesto = { modo: "girar" };
      else if (perto(ponto, pontos.tamanho)) gesto = { modo: "tamanho" };
    }

    if (!gesto) {
      alvo = Formas.formaEm(formasAtuais(), ponto, tamanho.largura, tamanho.altura);
      if (!alvo) {
        selecionada = null;
        acompanhar();
        sincronizarControles();
        return;
      }
      selecionada = alvo.id;
      gesto = {
        modo: "mover",
        ancoraX: ponto.x - alvo.x * tamanho.largura,
        ancoraY: ponto.y - alvo.y * tamanho.altura
      };
    }

    rascunho = Object.assign({}, alvo);
    el.canvas.setPointerCapture(evento.pointerId);
    pintar();
    sincronizarControles();
  });

  el.canvas.addEventListener("pointermove", function (evento) {
    if (!gesto || !rascunho) return;
    var ponto = pontoDoEvento(evento);
    var tamanho = tamanhoCanvas();

    if (gesto.modo === "mover") {
      rascunho.x = (ponto.x - gesto.ancoraX) / tamanho.largura;
      rascunho.y = (ponto.y - gesto.ancoraY) / tamanho.altura;
    } else if (gesto.modo === "tamanho") {
      /* O cursor vira ponto local da forma: assim o canto acompanha a mão
       * mesmo com a forma girada, sem precisar tratar cada ângulo. */
      var caixa = Formas.caixa(rascunho, tamanho.largura, tamanho.altura);
      var local = Formas.paraLocal(ponto, caixa);
      rascunho.largura = Math.max(TAMANHO_MINIMO, (Math.abs(local.x) * 2) / tamanho.altura);
      rascunho.altura = Math.max(TAMANHO_MINIMO, (Math.abs(local.y) * 2) / tamanho.altura);
    } else if (gesto.modo === "girar") {
      var cx = rascunho.x * tamanho.largura;
      var cy = rascunho.y * tamanho.altura;
      /* +90 porque a alça fica acima do centro: com o cursor no topo o ângulo
       * cru é -90, e o que se espera ver ali é 0. */
      var graus = (Math.atan2(ponto.y - cy, ponto.x - cx) * 180) / Math.PI + 90;
      if (evento.shiftKey) graus = Math.round(graus / PASSO_GIRO) * PASSO_GIRO;
      rascunho.giro = Math.round(graus);
    }

    pintar();
    gravarGesto(false);
  });

  function encerrarGesto(evento) {
    if (!gesto) return;
    gravarGesto(true);
    gesto = null;
    rascunho = null;
    if (evento && el.canvas.hasPointerCapture(evento.pointerId)) {
      el.canvas.releasePointerCapture(evento.pointerId);
    }
    acompanhar();
    sincronizarControles();
  }

  el.canvas.addEventListener("pointerup", encerrarGesto);
  el.canvas.addEventListener("pointercancel", encerrarGesto);

  /* --- cliques e teclado -------------------------------------------------- */

  el.tipos.addEventListener("click", function (evento) {
    var botao = evento.target.closest("[data-tipo]");
    if (botao) adicionar(botao.dataset.tipo);
  });

  el.cores.addEventListener("click", function (evento) {
    var botao = evento.target.closest("[data-cor]");
    if (botao) aplicarCor(botao.dataset.cor);
  });

  el.corLivre.addEventListener("input", function () {
    aplicarCor(el.corLivre.value);
  });

  el.efeitos.addEventListener("click", function (evento) {
    var botao = evento.target.closest("[data-efeito]");
    if (botao && selecionada) D.acoes.ajustarForma(selecionada, { efeito: botao.dataset.efeito });
  });

  el.contorno.addEventListener("click", function () {
    var alvo = formaSelecionada();
    if (alvo) D.acoes.ajustarForma(alvo.id, { contorno: !alvo.contorno });
  });

  el.alternar.addEventListener("click", function () {
    D.acoes.alternarProjecao();
  });

  el.fundos.addEventListener("click", function (evento) {
    var botao = evento.target.closest("[data-fundo]");
    if (botao) D.acoes.definirFundoProjecao(botao.dataset.fundo);
  });

  el.fundoLivre.addEventListener("input", function () {
    D.acoes.definirFundoProjecao(el.fundoLivre.value);
  });

  el.apagar.addEventListener("click", function () {
    if (!selecionada) return;
    D.acoes.removerForma(selecionada);
    selecionada = null;
  });

  el.limpar.addEventListener("click", function () {
    D.acoes.limparProjecao();
    selecionada = null;
  });

  /* Sem isto, apagar uma forma enquanto o campo de cor está focado também
   * mexeria no campo. O teste de `matches` é defensivo de propósito: sem nada
   * focado o alvo do keydown pode ser o próprio `document`, que não tem o
   * método — e aí o atalho inteiro morria num TypeError silencioso. */
  function emCampo(alvo) {
    return !!alvo && typeof alvo.matches === "function" && alvo.matches("input, textarea");
  }

  document.addEventListener("keydown", function (evento) {
    if (emCampo(evento.target)) return;
    /* Com modificador não é atalho nosso: Cmd+H esconde a janela no macOS e
     * Ctrl+H é histórico do navegador. */
    if (evento.ctrlKey || evento.metaKey || evento.altKey) return;
    /* Atalho de mesa: esconder tudo é o que se faz com pressa, no meio do
     * combate, sem procurar o botão. */
    if (evento.key === "h" || evento.key === "H") {
      D.acoes.alternarProjecao();
      return;
    }
    if (evento.key === "Escape") {
      selecionada = null;
      acompanhar();
      sincronizarControles();
      return;
    }
    if ((evento.key === "Delete" || evento.key === "Backspace") && selecionada) {
      evento.preventDefault();
      D.acoes.removerForma(selecionada);
      selecionada = null;
    }
  });

  window.addEventListener("resize", pintar);

  montarPaletas();
  D.assinar(function () {
    /* Uma forma apagada em outra tela não pode continuar selecionada aqui. */
    if (selecionada && !formaSelecionada()) selecionada = null;
    acompanhar();
    sincronizarControles();
  });
})();
