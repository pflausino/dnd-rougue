/* Catálogo de uma loja. A vitrine em si ainda será implementada. */
(function () {
  "use strict";

  var D = window.Dungeon;

  var el = {
    titulo: document.querySelector("[data-titulo]"),
    loja: document.querySelector("[data-loja]"),
    chamada: document.querySelector("[data-chamada]"),
    retrato: document.querySelector("[data-retrato]"),
    ouro: document.querySelector("[data-ouro]")
  };

  var parametros = new URLSearchParams(window.location.search);
  var loja = D.lojaPorId(parametros.get("loja"));

  if (loja) {
    document.title = loja.nome + " | A Última Dungeon";
    el.titulo.textContent = loja.nome;
    el.loja.textContent = loja.mercador;
    el.chamada.textContent = loja.chamada;

    var inicial = document.createElement("span");
    inicial.className = "loja-cartao__inicial";
    inicial.textContent = loja.mercador.charAt(0);
    el.retrato.appendChild(inicial);

    var imagem = document.createElement("img");
    imagem.alt = "Retrato de " + loja.mercador;
    imagem.addEventListener("error", function () {
      imagem.remove();
    });
    imagem.src = loja.imagem;
    el.retrato.appendChild(imagem);
  } else {
    el.loja.textContent = "Loja não encontrada";
  }

  D.assinar(function (estado) {
    el.ouro.textContent = String(estado.ouro);
  });
})();
