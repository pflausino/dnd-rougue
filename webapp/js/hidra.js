/* Controle das cabeças da hidra, na tela do Mestre.
 *
 * A tela do Relógio só mostra (js/relogio.js); quem corta e conta é aqui. Ficou
 * em arquivo próprio, como js/combate.js, por ser um painel inteiro dentro de
 * uma tela que já tem dono.
 *
 * O retrato de cada cabeça sai do número dela, em data/hidra.js — o estado
 * guarda só `{ n, viva }`.
 */
(function () {
  "use strict";

  var D = window.Dungeon;
  if (!D) return;

  var el = {
    estado: document.querySelector("[data-hidra-estado]"),
    grade: document.querySelector("[data-hidra-cabecas]"),
    reiniciar: document.querySelector("[data-hidra-reiniciar]"),
    remover: document.querySelector("[data-hidra-remover]")
  };
  if (!el.grade) return;

  document.querySelectorAll("[data-hidra-nascer]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      D.acoes.hidraNascer(Number(botao.getAttribute("data-hidra-nascer")));
    });
  });

  el.reiniciar.addEventListener("click", function () {
    D.acoes.hidraReiniciar();
  });

  /* Tira a última da fila: é para desfazer um nascimento clicado por engano,
   * não para matar — matar é clicar na cabeça. */
  el.remover.addEventListener("click", function () {
    var cabecas = D.get().hidra.cabecas;
    if (cabecas.length) D.acoes.hidraRemover(cabecas[cabecas.length - 1].n);
  });

  var botoes = {};
  var montadas = "";

  function montar(cabecas) {
    botoes = {};
    el.grade.innerHTML = "";

    cabecas.forEach(function (cabeca) {
      var botao = document.createElement("button");
      botao.type = "button";
      botao.className = "cabeca";

      var arte = document.createElement("img");
      arte.className = "cabeca__arte";
      arte.src = window.arteHidra(cabeca.n);
      arte.alt = "";
      botao.appendChild(arte);

      var numero = document.createElement("span");
      numero.className = "cabeca__num mono";
      numero.textContent = cabeca.n;
      botao.appendChild(numero);

      botao.addEventListener("click", function () {
        D.acoes.hidraAlternar(cabeca.n);
      });

      el.grade.appendChild(botao);
      botoes[cabeca.n] = botao;
    });
  }

  function renderizar(estado) {
    var cabecas = estado.hidra.cabecas;
    var assinatura = cabecas
      .map(function (cabeca) {
        return cabeca.n;
      })
      .join(",");

    /* Remonta só quando o conjunto muda: cortar é troca de classe, e remontar
     * recarregaria as imagens a cada golpe. */
    if (assinatura !== montadas) {
      montar(cabecas);
      montadas = assinatura;
    }

    var vivas = 0;
    cabecas.forEach(function (cabeca) {
      if (cabeca.viva) vivas += 1;
      var botao = botoes[cabeca.n];
      botao.classList.toggle("cabeca--cortada", !cabeca.viva);
      botao.setAttribute(
        "aria-label",
        "Cabeça " + cabeca.n + (cabeca.viva ? " — de pé" : " — cortada")
      );
    });

    el.remover.disabled = cabecas.length === 0;
    el.estado.textContent = vivas
      ? vivas + " de " + cabecas.length + " de pé"
      : "Sem cabeças";
    el.estado.classList.toggle("selo--ativo", vivas > 0);
  }

  D.assinar(renderizar);
})();
