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
    exibicao: document.querySelector("[data-exibicao]"),
    exibicaoVersao: document.querySelector("[data-exibicao-versao]"),
    exibicaoTitulo: document.querySelector("[data-exibicao-titulo]"),
    exibicaoInstrucao: document.querySelector("[data-exibicao-instrucao]"),
    exibicaoCabeca: document.querySelector("[data-exibicao-cabeca]"),
    exibicaoCorpo: document.querySelector("[data-exibicao-corpo]"),
    exibicaoNota: document.querySelector("[data-exibicao-nota]"),
    hidra: document.querySelector("[data-hidra]"),
    hidraGrade: document.querySelector("[data-hidra-grade]"),
    hidraContagem: document.querySelector("[data-hidra-contagem]")
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

    /* Só o nome. O `sub` de salas.js descreve o que a sala tem dentro — numa
     * tela projetada, isso é spoiler. */
    el.salaNome.textContent = sala.nome;
  }

  /* --- cabeças da hidra ---------------------------------------------------- */

  /* Quantas colunas a grade usa para as cabeças caberem sem rolagem — a tela é
   * projetada. Poucas cabeças ficam grandes; conforme nascem, a grade fecha em
   * mais colunas em vez de crescer para baixo. */
  function colunasDe(quantas) {
    if (quantas <= 3) return Math.max(1, quantas);
    if (quantas <= 8) return 4;
    if (quantas <= 15) return 5;
    return 6;
  }

  var cartas = {};
  var montadas = "";

  function montarCabecas(cabecas) {
    cartas = {};
    el.hidraGrade.innerHTML = "";
    el.hidraGrade.style.setProperty("--colunas", colunasDe(cabecas.length));

    cabecas.forEach(function (cabeca) {
      var carta = document.createElement("figure");
      carta.className = "cabeca";

      var arte = document.createElement("img");
      arte.className = "cabeca__arte";
      arte.src = window.arteHidra(cabeca.n);
      /* Decorativa: quem identifica a cabeça é o número ao lado. */
      arte.alt = "";
      carta.appendChild(arte);

      var numero = document.createElement("figcaption");
      numero.className = "cabeca__num mono";
      numero.textContent = cabeca.n;
      carta.appendChild(numero);

      el.hidraGrade.appendChild(carta);
      cartas[cabeca.n] = carta;
    });
  }

  function renderizarHidra(estado) {
    var ativa = estado.exibicao.id === D.EXIBICAO_HIDRA;
    el.hidra.hidden = !ativa;
    if (!ativa) {
      /* Zera a assinatura para a volta ao painel remontar as cartas: enquanto
       * ele esteve fora, o mestre pode ter cortado meia hidra. */
      montadas = "";
      return;
    }

    var cabecas = estado.hidra.cabecas;
    var assinatura = cabecas
      .map(function (cabeca) {
        return cabeca.n;
      })
      .join(",");

    /* Remonta só quando o conjunto muda. Cortar uma cabeça é troca de classe:
     * remontar recarregaria as imagens e a grade piscaria a cada golpe. */
    if (assinatura !== montadas) {
      montarCabecas(cabecas);
      montadas = assinatura;
    }

    var vivas = 0;
    cabecas.forEach(function (cabeca) {
      if (cabeca.viva) vivas += 1;
      cartas[cabeca.n].classList.toggle("cabeca--cortada", !cabeca.viva);
    });

    el.hidraContagem.textContent = vivas
      ? vivas + " de " + cabecas.length + " de pé"
      : "Sem cabeças";
    el.hidra.classList.toggle("hidra--morta", vivas === 0);
  }

  /* Evita remontar a tabela a cada segundo. */
  var projetado = "";

  /* Só a coluna escolhida pelo mestre aparece, ao lado do resultado. */
  function renderizarExibicao(estado) {
    var exibicao = estado.exibicao.id ? window.exibicaoPorId(estado.exibicao.id) : null;
    var assinatura = exibicao ? exibicao.id + ":" + estado.exibicao.variante : "";

    el.exibicao.hidden = !exibicao;

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
    renderizarHidra(atual);

    /* Com qualquer painel em cartaz o cronômetro cede o palco — o espaço passa
     * a ser do conteúdo. */
    el.raiz.classList.toggle("relogio--compacto", Boolean(atual.exibicao.id));
  }

  D.assinar(renderizar);
  window.setInterval(function () {
    renderizar();
  }, 1000);
})();
