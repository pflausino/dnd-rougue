/* Tela dos Jogadores: exibição pública e escolha da pausa após cada TPK. */
(function () {
  "use strict";

  var D = window.Dungeon;

  var el = {
    palco: document.querySelector("[data-palco]"),
    etapa: document.querySelector("[data-etapa]"),
    titulo: document.querySelector("[data-titulo]"),
    subtitulo: document.querySelector("[data-subtitulo]"),
    run: document.querySelector("[data-run]"),
    ouro: document.querySelector("[data-ouro]"),
    tempo: document.querySelector("[data-tempo]"),
    pausa: document.querySelector("[data-pausa]"),
    pausaRotulo: document.querySelector("[data-pausa-rotulo]"),
    pausaContagem: document.querySelector("[data-pausa-contagem]"),
    pausaOpcoes: document.querySelector("[data-pausa-opcoes]"),
    pausaEncerrar: document.querySelector("[data-pausa-encerrar]")
  };

  /* Um botão por duração disponível. O rótulo mostra a cota restante. */
  var botoesPausa = D.PAUSAS.map(function (opcao) {
    var botao = document.createElement("button");
    botao.type = "button";
    botao.className = "btn btn--pausa";
    botao.addEventListener("click", function () {
      D.acoes.escolherPausa(opcao.minutos);
    });
    el.pausaOpcoes.appendChild(botao);
    return { opcao: opcao, botao: botao };
  });

  function renderizarOpcoes(estado) {
    botoesPausa.forEach(function (item) {
      var restantes = D.pausasRestantes(item.opcao.minutos, estado);
      var cota = restantes === null ? "sem limite" : restantes + " restante" + (restantes === 1 ? "" : "s");
      item.botao.innerHTML = "";

      var titulo = document.createElement("strong");
      titulo.textContent = item.opcao.minutos + " min";
      var nota = document.createElement("small");
      nota.textContent = cota;

      item.botao.appendChild(titulo);
      item.botao.appendChild(nota);
      item.botao.disabled = restantes === 0;
    });
  }

  function renderizarPausa(estado) {
    var pausa = estado.pausa;
    var ativa = D.pausaAtiva(estado);

    el.pausa.hidden = !(pausa.pendente || ativa);
    el.pausaOpcoes.hidden = !pausa.pendente;
    el.pausaContagem.hidden = !ativa;
    el.pausaEncerrar.hidden = !ativa;

    if (pausa.pendente) {
      el.pausaRotulo.textContent = "Escolham a pausa desta morte";
      renderizarOpcoes(estado);
    } else if (ativa) {
      renderizarContagem(estado);
    }
  }

  /* Chamado a cada segundo enquanto a pausa corre. */
  function renderizarContagem(estado) {
    var atual = estado || D.get();
    if (!D.pausaAtiva(atual)) return;

    var restante = D.restantePausaMs(atual);
    el.pausaContagem.textContent = D.formatarMinutos(restante);
    el.pausaContagem.classList.toggle("pausa__contagem--fim", restante <= 0);
    el.pausaRotulo.textContent = restante <= 0 ? "Pausa encerrada" : "Pausa em andamento";
  }

  function renderizar(estado) {
    var acampado = estado.modo === "acampamento";

    if (acampado) {
      el.etapa.textContent = "Entre as runs";
      el.titulo.textContent = "Acampamento";
      el.subtitulo.textContent = "Lojas abertas — gastem o ouro antes da próxima tentativa";
    } else {
      el.etapa.textContent = "Em andamento";
      el.titulo.textContent = "Dungeon";
      el.subtitulo.textContent = "Run " + estado.run;
    }

    el.palco.classList.toggle("palco--acampamento", acampado);
    el.run.textContent = String(estado.run);
    el.ouro.textContent = String(estado.ouro);

    renderizarPausa(estado);
  }

  el.pausaEncerrar.addEventListener("click", function () {
    D.acoes.encerrarPausa();
  });

  D.assinar(function (estado) {
    renderizar(estado);
    renderizarTempo();
  });

  function renderizarTempo() {
    el.tempo.textContent = D.formatarDuracao(D.restanteMs());
  }

  window.setInterval(function () {
    renderizarTempo();
    renderizarContagem();
  }, 1000);
})();
