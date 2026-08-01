/* Tela do Mestre: controla o relógio, a run e a tela dos Jogadores. */
(function () {
  "use strict";

  var D = window.Dungeon;

  var el = {
    tempo: document.querySelector("[data-tempo]"),
    decorrido: document.querySelector("[data-decorrido]"),
    estadoRelogio: document.querySelector("[data-estado-relogio]"),
    alternar: document.querySelector("[data-alternar]"),
    zerar: document.querySelector("[data-zerar]"),
    runValor: document.querySelector("[data-run-valor]"),
    mortes: document.querySelector("[data-mortes]"),
    ouroValor: document.querySelector("[data-ouro-valor]"),
    ouroInput: document.querySelector("[data-ouro-input]"),
    modos: document.querySelector("[data-modos]"),
    modoAtual: document.querySelector("[data-modo-atual]"),
    duracaoInput: document.querySelector("[data-duracao-input]"),
    pausaEstado: document.querySelector("[data-pausa-estado]"),
    pausaContagem: document.querySelector("[data-pausa-contagem]"),
    pausaEncerrar: document.querySelector("[data-pausa-encerrar]"),
    pausaPular: document.querySelector("[data-pausa-pular]"),
    cotas: document.querySelector("[data-cotas]")
  };

  var LIMITE_CRITICO_MS = 15 * 60 * 1000;

  /* --- montagem dos controles dinâmicos ---------------------------------- */

  var botoesModo = D.MODOS_PAINEL.map(function (modo) {
    var botao = document.createElement("button");
    botao.type = "button";
    botao.className = "btn btn--pequeno";
    botao.textContent = modo.nome;
    botao.setAttribute("aria-pressed", "false");
    botao.addEventListener("click", function () {
      D.acoes.definirModo(modo.id);
    });
    el.modos.appendChild(botao);
    return { id: modo.id, nome: modo.nome, botao: botao };
  });

  /* --- render ------------------------------------------------------------ */

  function renderizarTempo(estado) {
    var atual = estado || D.get();
    var restante = atual.relogio.duracaoMs - D.decorridoMs(atual);

    el.tempo.textContent = D.formatarDuracao(restante);
    el.tempo.classList.toggle("relogio-mini--critico", restante <= LIMITE_CRITICO_MS);
    el.decorrido.textContent = D.formatarDuracao(D.decorridoMs(atual));
    el.alternar.textContent = atual.relogio.rodando ? "Pausar" : "Iniciar";
    el.estadoRelogio.textContent = atual.relogio.rodando ? "Em andamento" : "Pausado";
    el.estadoRelogio.classList.toggle("selo--ativo", atual.relogio.rodando);
  }

  /* Uma linha por duração: usadas e cota restante na sessão. */
  var linhasCota = D.PAUSAS.map(function (opcao) {
    var item = document.createElement("li");
    var rotulo = document.createElement("span");
    rotulo.textContent = opcao.minutos + " min";
    var valor = document.createElement("span");
    valor.className = "mono";
    item.appendChild(rotulo);
    item.appendChild(valor);
    el.cotas.appendChild(item);
    return { opcao: opcao, valor: valor, item: item };
  });

  function renderizarPausa(estado) {
    var pausa = estado.pausa;
    var ativa = D.pausaAtiva(estado);
    var restante = D.restantePausaMs(estado);

    if (ativa) {
      el.pausaEstado.textContent = restante <= 0 ? "Pausa encerrada" : "Em pausa";
      el.pausaEstado.classList.add("selo--ativo");
    } else {
      el.pausaEstado.textContent = pausa.pendente ? "Aguardando escolha" : "Sem pausa";
      el.pausaEstado.classList.remove("selo--ativo");
    }

    el.pausaContagem.hidden = !ativa;
    el.pausaContagem.textContent = D.formatarMinutos(restante);
    el.pausaContagem.classList.toggle("relogio-mini--critico", ativa && restante <= 0);
    el.pausaEncerrar.hidden = !ativa;
    el.pausaPular.hidden = !pausa.pendente;

    linhasCota.forEach(function (linha) {
      var usadas = pausa.usadas[linha.opcao.minutos] || 0;
      var restantes = D.pausasRestantes(linha.opcao.minutos, estado);
      linha.valor.textContent = restantes === null ? usadas + " usadas · ∞" : usadas + " / " + linha.opcao.limite;
      linha.item.classList.toggle("cotas__esgotada", restantes === 0);
    });
  }

  function renderizar(estado) {
    renderizarTempo(estado);
    renderizarPausa(estado);

    el.runValor.textContent = String(estado.run);
    el.mortes.textContent = estado.mortes === 1 ? "1 TPK" : estado.mortes + " TPKs";
    el.ouroValor.textContent = String(estado.ouro);

    botoesModo.forEach(function (item) {
      item.botao.setAttribute("aria-pressed", item.id === estado.modo ? "true" : "false");
      if (item.id === estado.modo) el.modoAtual.textContent = item.nome;
    });

    /* O campo só é sincronizado quando não está em edição. */
    if (document.activeElement !== el.duracaoInput) {
      el.duracaoInput.value = String(Math.round(estado.relogio.duracaoMs / 60000));
    }
  }

  /* --- eventos ----------------------------------------------------------- */

  el.alternar.addEventListener("click", function () {
    D.relogio.alternar();
  });

  el.zerar.addEventListener("click", function () {
    if (window.confirm("Zerar o relógio da sessão?")) D.relogio.zerar();
  });

  document.querySelectorAll("[data-ajustar]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      D.relogio.ajustar(Number(botao.getAttribute("data-ajustar")));
    });
  });

  document.querySelectorAll("[data-run]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      D.acoes.ajustarRun(Number(botao.getAttribute("data-run")));
    });
  });

  document.querySelectorAll("[data-ouro]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      D.acoes.ajustarOuro(Number(botao.getAttribute("data-ouro")));
    });
  });

  document.querySelector("[data-ouro-definir]").addEventListener("click", function () {
    D.acoes.definirOuro(Number(el.ouroInput.value));
    el.ouroInput.value = "";
  });

  document.querySelector("[data-tpk]").addEventListener("click", function () {
    if (window.confirm("Registrar TPK? O grupo volta ao acampamento e escolhe a pausa.")) {
      D.acoes.registrarTpk();
    }
  });

  el.pausaEncerrar.addEventListener("click", function () {
    D.acoes.encerrarPausa();
  });

  el.pausaPular.addEventListener("click", function () {
    D.acoes.pularPausa();
  });

  document.querySelector("[data-duracao-definir]").addEventListener("click", function () {
    var minutos = Number(el.duracaoInput.value);
    if (minutos > 0) D.relogio.definirDuracao(minutos);
  });

  document.querySelector("[data-reiniciar]").addEventListener("click", function () {
    if (window.confirm("Reiniciar tudo: relógio, run e ouro. Continuar?")) {
      D.acoes.reiniciarTudo();
    }
  });

  D.assinar(renderizar);
  window.setInterval(function () {
    renderizarTempo();
    renderizarPausa(D.get());
  }, 1000);
})();
