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
    duracao: document.querySelector("[data-duracao]"),
    pausa: document.querySelector("[data-pausa]"),
    pausaRotulo: document.querySelector("[data-pausa-rotulo]"),
    pausaContagem: document.querySelector("[data-pausa-contagem]"),
    sala: document.querySelector("[data-sala]"),
    salaNome: document.querySelector("[data-sala-nome]"),
    salaSub: document.querySelector("[data-sala-sub]"),
    exibicao: document.querySelector("[data-exibicao]"),
    exibicaoVersao: document.querySelector("[data-exibicao-versao]"),
    exibicaoTitulo: document.querySelector("[data-exibicao-titulo]"),
    exibicaoInstrucao: document.querySelector("[data-exibicao-instrucao]"),
    exibicaoCabeca: document.querySelector("[data-exibicao-cabeca]"),
    exibicaoCorpo: document.querySelector("[data-exibicao-corpo]"),
    exibicaoNota: document.querySelector("[data-exibicao-nota]")
  };

  /* A pausa aparece em segundo plano: o cronômetro da sessão, congelado
   * enquanto ela corre, continua sendo o número principal da tela. */
  function renderizarPausa(estado) {
    var ativa = D.pausaAtiva(estado);
    el.pausa.hidden = !ativa;
    if (!ativa) return;

    var restante = D.restantePausaMs(estado);
    el.pausaContagem.textContent = D.formatarMinutos(restante);
    el.pausaContagem.classList.toggle("pausa-mini__contagem--fim", restante <= 0);
    el.pausaRotulo.textContent = restante <= 0 ? "Pausa encerrada" : "Pausa em andamento";
  }

  function renderizarSala(estado) {
    var sala = estado.sala ? window.salaPorId(estado.sala) : null;
    el.sala.hidden = !sala;
    if (!sala) return;

    el.salaNome.textContent = sala.nome;
    el.salaSub.textContent = sala.sub || "";
  }

  /* Evita remontar a tabela a cada segundo. */
  var projetado = "";

  /* Só a coluna escolhida pelo mestre aparece, ao lado do resultado. */
  function renderizarExibicao(estado) {
    var exibicao = estado.exibicao.id ? window.exibicaoPorId(estado.exibicao.id) : null;
    var assinatura = exibicao ? exibicao.id + ":" + estado.exibicao.variante : "";

    el.exibicao.hidden = !exibicao;
    el.raiz.classList.toggle("relogio--com-exibicao", Boolean(exibicao));

    if (!exibicao || assinatura === projetado) {
      projetado = assinatura;
      return;
    }
    projetado = assinatura;

    var variante = (exibicao.variantes || []).filter(function (item) {
      return item.id === estado.exibicao.variante;
    })[0] || (exibicao.variantes || [])[0];

    el.exibicaoVersao.textContent = variante ? "Versão " + variante.nome : "";
    el.exibicaoTitulo.textContent = exibicao.titulo;
    el.exibicaoInstrucao.textContent = exibicao.instrucao || "";
    el.exibicaoNota.textContent = exibicao.nota || "";

    el.exibicaoCabeca.innerHTML = "";
    [variante ? "1d100" : "", exibicao.colunaResultado].forEach(function (texto) {
      var th = document.createElement("th");
      th.textContent = texto;
      el.exibicaoCabeca.appendChild(th);
    });

    el.exibicaoCorpo.innerHTML = "";
    exibicao.linhas.forEach(function (linha) {
      var faixa = variante ? linha[variante.id] : "";
      /* Faixa vazia significa que a raridade não existe naquela versão. */
      if (faixa === "—") return;

      var tr = document.createElement("tr");
      var celulaFaixa = document.createElement("td");
      celulaFaixa.className = "mono tabela--projetada__faixa";
      celulaFaixa.textContent = faixa;
      var celulaResultado = document.createElement("td");
      celulaResultado.textContent = linha.resultado;
      tr.appendChild(celulaFaixa);
      tr.appendChild(celulaResultado);
      el.exibicaoCorpo.appendChild(tr);
    });
  }

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

    renderizarSala(atual);
    renderizarPausa(atual);
    renderizarExibicao(atual);
  }

  D.assinar(renderizar);
  window.setInterval(function () {
    renderizar();
  }, 1000);
})();
