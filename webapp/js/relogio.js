/* Tela do Relógio: só exibe o tempo da sessão. Quem controla é o Mestre. */
(function () {
  "use strict";

  var D = window.Dungeon;
  var LIMITE_CRITICO_MS = 15 * 60 * 1000;

  var el = {
    raiz: document.querySelector("[data-relogio]"),
    estado: document.querySelector("[data-estado]"),
    digitos: document.querySelector("[data-digitos]"),
    barra: document.querySelector("[data-barra]"),
    decorrido: document.querySelector("[data-decorrido]"),
    run: document.querySelector("[data-run]"),
    duracao: document.querySelector("[data-duracao]")
  };

  function renderizar(estado) {
    var atual = estado || D.get();
    var decorrido = D.decorridoMs(atual);
    var restante = atual.relogio.duracaoMs - decorrido;
    var progresso = Math.min(100, (decorrido / atual.relogio.duracaoMs) * 100);

    el.digitos.textContent = D.formatarDuracao(restante);
    el.decorrido.textContent = D.formatarDuracao(decorrido);
    el.barra.style.width = progresso + "%";

    el.raiz.classList.toggle("relogio--critico", restante <= LIMITE_CRITICO_MS);
    el.raiz.classList.toggle("relogio--estourado", restante < 0);

    el.estado.textContent = atual.relogio.rodando ? "Em andamento" : "Pausado";
    el.run.textContent = "Run " + atual.run;
    el.duracao.textContent = D.formatarDuracao(atual.relogio.duracaoMs);
  }

  D.assinar(renderizar);
  window.setInterval(function () {
    renderizar();
  }, 1000);
})();
