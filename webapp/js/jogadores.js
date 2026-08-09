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
    pausaEncerrar: document.querySelector("[data-pausa-encerrar]"),
    lojas: document.querySelector("[data-lojas]"),
    lojasGrade: document.querySelector("[data-lojas-grade]"),
    modalOuro: document.querySelector("[data-modal-ouro]"),
    formOuro: document.querySelector("[data-form-ouro]"),
    valorOuro: document.querySelector("[data-valor-ouro]"),
    atalhosOuro: document.querySelector("[data-atalhos-ouro]"),
    ouroAtual: document.querySelector("[data-ouro-atual]"),
    recado: document.querySelector("[data-recado]"),
    tiraBencaos: document.querySelector("[data-tira-bencaos]"),
    tiraLista: document.querySelector("[data-tira-lista]"),
    modalBencao: document.querySelector("[data-modal-bencao]"),
    bencaoIcone: document.querySelector("[data-bencao-icone]"),
    bencaoTipo: document.querySelector("[data-bencao-tipo]"),
    bencaoNome: document.querySelector("[data-bencao-nome]"),
    bencaoLema: document.querySelector("[data-bencao-lema]"),
    bencaoEfeito: document.querySelector("[data-bencao-efeito]"),
    bencaoRestricao: document.querySelector("[data-bencao-restricao]"),
    bencaoTipoNota: document.querySelector("[data-bencao-tipo-nota]"),
    bencaoConsumir: document.querySelector("[data-consumir-bencao]")
  };

  /* --- bênçãos conquistadas ---------------------------------------------- */

  function ehConsumivel(bencao) {
    return /^Consum/i.test(bencao.tipo || "");
  }

  /* Bênção aberta no modal e se o botão de consumo já está armado: consumir
   * exige dois toques, para ninguém queimar um item sem querer. */
  var bencaoAberta = null;
  var consumoArmado = false;

  function desarmarConsumo() {
    consumoArmado = false;
    el.bencaoConsumir.textContent = "Consumir";
    el.bencaoConsumir.className = "btn btn--ouro";
  }

  el.bencaoConsumir.addEventListener("click", function () {
    if (!bencaoAberta) return;

    if (!consumoArmado) {
      consumoArmado = true;
      el.bencaoConsumir.textContent = "Confirmar consumo";
      el.bencaoConsumir.className = "btn btn--perigo";
      window.clearTimeout(desarmarConsumo.timer);
      desarmarConsumo.timer = window.setTimeout(desarmarConsumo, 5000);
      return;
    }

    window.clearTimeout(desarmarConsumo.timer);
    var consumida = bencaoAberta;
    D.acoes.removerBencao(consumida.id);

    /* Bênção cujo efeito o app sabe aplicar (hoje só o Relógio Místico, com
     * `minutosBonus`) é aplicada aqui, no consumo. O resto do catálogo é regra
     * de mesa e continua na mão do mestre. */
    var extra = "";
    if (consumida.minutosBonus) {
      D.relogio.esticar(consumida.minutosBonus);
      extra = " A sessão ganhou " + consumida.minutosBonus + " minutos.";
    }

    recado(consumida.nome + " foi consumida." + extra);
    el.modalBencao.close();
  });

  el.modalBencao.addEventListener("close", desarmarConsumo);

  function abrirBencao(bencao) {
    bencaoAberta = bencao;
    desarmarConsumo();
    el.bencaoConsumir.hidden = !ehConsumivel(bencao);

    el.bencaoIcone.innerHTML = "";
    var imagem = document.createElement("img");
    imagem.alt = bencao.nome;
    imagem.addEventListener("error", function () {
      imagem.remove();
    });
    imagem.src = bencao.icone;
    el.bencaoIcone.appendChild(imagem);

    el.bencaoTipo.textContent = bencao.tipo || "";
    el.bencaoNome.textContent = bencao.nome;
    el.bencaoLema.textContent = bencao.lema;
    el.bencaoEfeito.textContent = bencao.efeito;
    el.bencaoRestricao.textContent = bencao.restricao ? "Restrição: " + bencao.restricao : "";
    el.bencaoRestricao.hidden = !bencao.restricao;
    el.bencaoTipoNota.textContent = bencao.tipoNota || "";

    el.modalBencao.showModal();
  }

  document.querySelector("[data-fechar-bencao]").addEventListener("click", function () {
    el.modalBencao.close();
  });

  /* A tira é remontada só quando a lista muda. */
  var tiraMontada = "";

  /* A tira fica à vista sempre que o grupo tem alguma bênção. */
  function renderizarTiraBencaos(estado) {
    var ids = estado.bencaos || [];
    el.tiraBencaos.hidden = ids.length === 0;

    var assinatura = ids.join(",");
    if (assinatura === tiraMontada) return;
    tiraMontada = assinatura;

    el.tiraLista.innerHTML = "";
    ids.forEach(function (id) {
      var bencao = window.bencaoPorId(id);
      if (!bencao) return;

      var cartao = document.createElement("button");
      cartao.type = "button";
      cartao.className = "bencao-ficha";
      cartao.addEventListener("click", function () {
        abrirBencao(bencao);
      });

      var icone = document.createElement("span");
      icone.className = "bencao-ficha__icone";
      var imagem = document.createElement("img");
      imagem.alt = "";
      imagem.addEventListener("error", function () {
        imagem.remove();
      });
      imagem.src = bencao.icone;
      icone.appendChild(imagem);

      var texto = document.createElement("span");
      texto.className = "bencao-ficha__texto";
      var nome = document.createElement("strong");
      nome.textContent = bencao.nome;
      var tipo = document.createElement("small");
      tipo.textContent = bencao.tipo;
      texto.appendChild(nome);
      texto.appendChild(tipo);

      cartao.appendChild(icone);
      cartao.appendChild(texto);
      el.tiraLista.appendChild(cartao);
    });
  }

  /* --- registro do ouro do loot ------------------------------------------ */

  var ATALHOS_OURO = [5, 10, 25, 50, 100];

  ATALHOS_OURO.forEach(function (valor) {
    var botao = document.createElement("button");
    botao.type = "button";
    botao.className = "btn btn--pequeno";
    botao.textContent = "+" + valor;
    /* Os atalhos somam no campo: dá para juntar as moedas de vários inimigos. */
    botao.addEventListener("click", function () {
      el.valorOuro.value = String((Number(el.valorOuro.value) || 0) + valor);
      el.valorOuro.focus();
    });
    el.atalhosOuro.appendChild(botao);
  });

  function recado(mensagem) {
    el.recado.textContent = mensagem;
    el.recado.classList.add("recado--visivel");
    window.clearTimeout(recado.timer);
    recado.timer = window.setTimeout(function () {
      el.recado.classList.remove("recado--visivel");
    }, 3000);
  }

  function abrirModalOuro() {
    el.valorOuro.value = "";
    el.modalOuro.showModal();
    el.valorOuro.focus();
  }

  document.querySelector("[data-abrir-ouro]").addEventListener("click", abrirModalOuro);

  document.querySelector("[data-fechar-ouro]").addEventListener("click", function () {
    el.modalOuro.close();
  });

  el.formOuro.addEventListener("submit", function () {
    var valor = Math.round(Number(el.valorOuro.value) || 0);
    if (valor <= 0) return;
    D.acoes.ajustarOuro(valor);
    recado("+" + valor.toLocaleString("pt-BR") + " PO no tesouro do grupo.");
  });

  /* Um cartão por loja, com retrato do mercador. Sem o arquivo de imagem,
   * o cartão cai no retrato de reserva com a inicial do nome. */
  var cartoesLoja = D.LOJAS.map(function (loja) {
    var cartao = document.createElement("a");
    cartao.className = "loja-cartao";
    cartao.href = loja.pagina;

    var retrato = document.createElement("span");
    retrato.className = "loja-cartao__retrato";

    var reserva = document.createElement("span");
    reserva.className = "loja-cartao__inicial";
    reserva.textContent = loja.mercador.charAt(0);
    retrato.appendChild(reserva);

    var imagem = document.createElement("img");
    imagem.alt = "Retrato de " + loja.mercador;
    imagem.addEventListener("error", function () {
      imagem.remove();
    });
    imagem.src = loja.imagem;
    retrato.appendChild(imagem);

    var nome = document.createElement("strong");
    nome.textContent = loja.nome;
    var mercador = document.createElement("span");
    mercador.className = "loja-cartao__mercador";
    mercador.textContent = loja.mercador;
    var chamada = document.createElement("small");
    chamada.textContent = loja.chamada;

    var trava = document.createElement("span");
    trava.className = "loja-cartao__trava";
    trava.textContent = "Ainda fora do alcance do grupo";

    cartao.appendChild(retrato);
    cartao.appendChild(nome);
    cartao.appendChild(mercador);
    cartao.appendChild(chamada);
    cartao.appendChild(trava);
    el.lojasGrade.appendChild(cartao);

    return {
      loja: loja,
      cartao: cartao,
      retrato: retrato,
      reserva: reserva,
      imagem: imagem,
      nome: nome,
      mercador: mercador,
      chamada: chamada,
      trava: trava
    };
  });

  /* A loja de Íria só abre depois que o grupo compra a Pedra de Íria. Antes
   * disso o cartão não entrega nada: fica uma moldura vazia, só para o grupo
   * saber que há outra loja no acampamento. */
  function renderizarLojas(estado) {
    cartoesLoja.forEach(function (item) {
      var travada = Boolean(item.loja.exigeAcesso && !estado.mecanicas[item.loja.exigeAcesso]);

      item.cartao.classList.toggle("loja-cartao--travada", travada);
      item.trava.hidden = !travada;
      item.nome.hidden = travada;
      item.mercador.hidden = travada;
      item.chamada.hidden = travada;
      item.imagem.hidden = travada;
      item.reserva.textContent = travada ? "?" : item.loja.mercador.charAt(0);

      if (travada) {
        item.cartao.removeAttribute("href");
      } else {
        item.cartao.href = item.loja.pagina;
      }
    });
  }

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
    el.ouro.textContent = estado.ouro.toLocaleString("pt-BR");
    el.ouroAtual.textContent = estado.ouro.toLocaleString("pt-BR");

    /* As lojas só abrem no acampamento. */
    el.lojas.hidden = !acampado;
    renderizarLojas(estado);

    renderizarTiraBencaos(estado);

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
