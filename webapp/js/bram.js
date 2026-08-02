/* A Última Provisão — loja de Bram Barbacobre.
 *
 * Três balcões: equipamentos (catálogo fixo), baú de itens mágicos (cobra a
 * rolagem, que é feita à mão na mesa) e a bênção da run.
 */
(function () {
  "use strict";

  var D = window.Dungeon;

  var el = {
    ouro: document.querySelector("[data-ouro]"),
    balcao: document.querySelector("[data-balcao]"),
    catalogo: document.querySelector("[data-catalogo]"),
    bencao: document.querySelector("[data-bencao]"),
    chamadaBencao: document.querySelector("[data-chamada-bencao]"),
    avisoBau: document.querySelector("[data-aviso-bau]"),
    recado: document.querySelector("[data-recado]")
  };

  var paineis = {};
  document.querySelectorAll("[data-painel]").forEach(function (painel) {
    paineis[painel.getAttribute("data-painel")] = painel;
  });

  /* --- navegação --------------------------------------------------------- */

  function abrir(secao) {
    el.balcao.hidden = Boolean(secao);
    Object.keys(paineis).forEach(function (chave) {
      paineis[chave].hidden = chave !== secao;
    });
    window.scrollTo(0, 0);
  }

  document.querySelectorAll("[data-secao]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      var secao = botao.getAttribute("data-secao");
      if (secao === "bencao") garantirOferta();
      abrir(secao);
    });
  });

  document.querySelectorAll("[data-voltar]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      abrir(null);
    });
  });

  /* --- recados ----------------------------------------------------------- */

  function recado(mensagem, tom) {
    el.recado.textContent = mensagem;
    el.recado.className = "recado recado--visivel" + (tom ? " recado--" + tom : "");
    window.clearTimeout(recado.timer);
    recado.timer = window.setTimeout(function () {
      el.recado.className = "recado";
    }, 3200);
  }

  function comprar(nome, preco) {
    if (D.acoes.gastarOuro(preco)) {
      recado(nome + " — " + preco + " PO pagos. Restam " + D.get().ouro + " PO.");
      return true;
    }
    recado("Ouro insuficiente para " + nome + " (" + preco + " PO).", "falha");
    return false;
  }

  /* --- equipamentos ------------------------------------------------------ */

  /* Guarda os botões de compra para reavaliar a cada mudança de ouro. */
  var botoesPreco = [];

  window.CATALOGO_BRAM.forEach(function (categoria) {
    var bloco = document.createElement("section");
    bloco.className = "painel bloco categoria";

    var cabeca = document.createElement("div");
    cabeca.className = "bloco__cabeca";
    var titulo = document.createElement("h3");
    titulo.textContent = categoria.nome;
    var contagem = document.createElement("span");
    contagem.className = "selo";
    contagem.textContent = categoria.itens.length + (categoria.itens.length === 1 ? " produto" : " produtos");
    cabeca.appendChild(titulo);
    cabeca.appendChild(contagem);
    bloco.appendChild(cabeca);

    if (categoria.nota) {
      var nota = document.createElement("p");
      nota.className = "vazio";
      nota.textContent = categoria.nota;
      bloco.appendChild(nota);
    }

    var rolagem = document.createElement("div");
    rolagem.className = "tabela-rolagem";

    var tabela = document.createElement("table");
    tabela.className = "tabela";

    var thead = document.createElement("thead");
    var linhaCabeca = document.createElement("tr");
    ["Produto"].concat(
      categoria.colunas.map(function (coluna) {
        return coluna.titulo;
      }),
      ["Preço", ""]
    ).forEach(function (texto) {
      var th = document.createElement("th");
      th.textContent = texto;
      linhaCabeca.appendChild(th);
    });
    thead.appendChild(linhaCabeca);
    tabela.appendChild(thead);

    var tbody = document.createElement("tbody");
    categoria.itens.forEach(function (item) {
      var linha = document.createElement("tr");

      var nomeCelula = document.createElement("td");
      nomeCelula.className = "tabela__nome";
      nomeCelula.textContent = item.nome;
      linha.appendChild(nomeCelula);

      categoria.colunas.forEach(function (coluna) {
        var celula = document.createElement("td");
        var valor = item[coluna.chave];

        /* A maestria sai nas duas línguas: o termo em inglês das fichas e a
         * tradução usada na mesa. */
        if (coluna.chave === "maestria" && window.MAESTRIAS_PT[valor]) {
          var original = document.createElement("span");
          original.textContent = valor;
          var traduzido = document.createElement("small");
          traduzido.className = "tabela__traducao";
          traduzido.textContent = window.MAESTRIAS_PT[valor];
          celula.appendChild(original);
          celula.appendChild(traduzido);
        } else {
          celula.textContent = valor || "—";
        }

        linha.appendChild(celula);
      });

      var precoCelula = document.createElement("td");
      precoCelula.className = "tabela__preco mono";
      precoCelula.textContent = item.preco.toLocaleString("pt-BR") + " PO";
      linha.appendChild(precoCelula);

      var acaoCelula = document.createElement("td");
      var botao = document.createElement("button");
      botao.type = "button";
      botao.className = "btn btn--pequeno";
      botao.textContent = "Comprar";
      botao.addEventListener("click", function () {
        comprar(item.nome, item.preco);
      });
      botoesPreco.push({ botao: botao, preco: item.preco });
      acaoCelula.appendChild(botao);
      linha.appendChild(acaoCelula);

      tbody.appendChild(linha);
    });
    tabela.appendChild(tbody);
    rolagem.appendChild(tabela);
    bloco.appendChild(rolagem);
    el.catalogo.appendChild(bloco);
  });

  /* --- baú de itens mágicos ---------------------------------------------- */

  document.querySelectorAll("[data-preco-bau]").forEach(function (alvo) {
    alvo.textContent = String(D.PRECO_BAU);
  });

  var botaoBau = document.querySelector("[data-comprar-bau]");
  botoesPreco.push({ botao: botaoBau, preco: D.PRECO_BAU });

  botaoBau.addEventListener("click", function () {
    if (comprar("Rolagem no baú", D.PRECO_BAU)) {
      el.avisoBau.hidden = false;
      el.avisoBau.textContent = "Rolagem paga. O mestre rola na tabela de itens mágicos.";
    }
  });

  /* --- bênção da run ----------------------------------------------------- */

  function precoComDesconto(preco) {
    return Math.round(preco * (1 - D.DESCONTO_BENCAO));
  }

  /* A oferta é sorteada uma vez por run e fica registrada no estado, para as
   * outras telas verem a mesma bênção. */
  function ofertaDaRun(estado) {
    if (estado.ofertaBencao.run !== estado.run) return null;
    return (
      window.BENCAOS.filter(function (bencao) {
        return bencao.id === estado.ofertaBencao.id;
      })[0] || null
    );
  }

  /* Sorteia só a pedido do grupo. O render nunca escreve no estado: fazer isso
   * fecharia um laço de gravações entre as telas abertas. */
  function garantirOferta() {
    var estado = D.get();
    if (ofertaDaRun(estado)) return;
    var disponiveis = window.bencaosDeBram();
    var sorteada = disponiveis[Math.floor(Math.random() * disponiveis.length)];
    D.acoes.definirOfertaBencao(sorteada.id, estado.run);
  }

  function cartaoBencao(item, opcoes) {
    var cartao = document.createElement("article");
    cartao.className = "painel bloco bencao" + (opcoes.destaque ? " bencao--destaque" : "");

    var icone = document.createElement("span");
    icone.className = "bencao__icone";
    var imagem = document.createElement("img");
    imagem.alt = item.nome;
    imagem.addEventListener("error", function () {
      imagem.remove();
    });
    imagem.src = item.icone;
    icone.appendChild(imagem);
    cartao.appendChild(icone);

    var corpo = document.createElement("div");
    corpo.className = "bencao__corpo";

    var rotulo = document.createElement("span");
    rotulo.className = "rotulo";
    rotulo.textContent = opcoes.rotulo;
    corpo.appendChild(rotulo);

    var nome = document.createElement("h3");
    nome.textContent = item.nome;
    corpo.appendChild(nome);

    var lema = document.createElement("p");
    lema.className = "bencao__lema";
    lema.textContent = item.lema;
    corpo.appendChild(lema);

    var efeito = document.createElement("p");
    efeito.className = "bencao__efeito";
    efeito.textContent = item.efeito;
    corpo.appendChild(efeito);

    if (item.restricao) {
      var restricao = document.createElement("p");
      restricao.className = "bencao__restricao";
      restricao.textContent = "Restrição: " + item.restricao;
      corpo.appendChild(restricao);
    }

    var rodape = document.createElement("div");
    rodape.className = "bencao__rodape";

    var preco = document.createElement("span");
    preco.className = "bencao__preco mono";
    if (opcoes.precoCheio && opcoes.precoCheio !== opcoes.preco) {
      var riscado = document.createElement("s");
      riscado.textContent = opcoes.precoCheio.toLocaleString("pt-BR") + " PO";
      preco.appendChild(riscado);
      preco.appendChild(document.createTextNode(" " + opcoes.preco.toLocaleString("pt-BR") + " PO"));
    } else {
      preco.textContent = opcoes.preco.toLocaleString("pt-BR") + " PO";
    }
    rodape.appendChild(preco);

    if (opcoes.desconto) {
      var selo = document.createElement("span");
      selo.className = "selo";
      selo.textContent = "−25%";
      rodape.appendChild(selo);
    }

    if (opcoes.comprada) {
      var feito = document.createElement("span");
      feito.className = "selo selo--ativo";
      feito.textContent = "Adquirida nesta run";
      rodape.appendChild(feito);
    } else {
      var botao = document.createElement("button");
      botao.type = "button";
      botao.className = opcoes.destaque ? "btn btn--ouro" : "btn btn--primario";
      botao.textContent = "Comprar";
      botao.addEventListener("click", opcoes.aoComprar);
      botoesPreco.push({ botao: botao, preco: opcoes.preco });
      rodape.appendChild(botao);
    }

    corpo.appendChild(rodape);
    cartao.appendChild(corpo);
    return cartao;
  }

  function renderizarBencao(estado) {
    var temAcesso = Boolean(estado.mecanicas.lojaIria);
    var oferta = ofertaDaRun(estado);

    el.chamadaBencao.textContent = temAcesso
      ? "Uma bênção por tentativa · 25% de desconto"
      : "Uma bênção por tentativa";

    if (!oferta) {
      el.bencao.innerHTML = "";
      return;
    }

    var cheio = oferta.preco;
    var preco = temAcesso ? precoComDesconto(cheio) : cheio;

    /* Botões antigos saem da lista antes de recriar os cartões. */
    botoesPreco = botoesPreco.filter(function (registro) {
      return !el.bencao.contains(registro.botao);
    });
    el.bencao.innerHTML = "";

    el.bencao.appendChild(
      cartaoBencao(oferta, {
        rotulo: "Oferta da run " + estado.run,
        preco: preco,
        precoCheio: cheio,
        desconto: temAcesso,
        comprada: estado.ofertaBencao.comprada,
        aoComprar: function () {
          if (!comprar(oferta.nome, preco)) return;
          D.acoes.marcarBencaoComprada();
          D.acoes.adicionarBencao(oferta.id);
        }
      })
    );

    /* Sem acesso à loja de Íria, Bram empurra a pedra que o destrava. */
    if (!temAcesso) {
      var pedra = window.PEDRA_DE_IRIA;
      el.bencao.appendChild(
        cartaoBencao(pedra, {
          rotulo: "Desbloqueio",
          preco: pedra.preco,
          destaque: true,
          aoComprar: function () {
            if (!comprar(pedra.nome, pedra.preco)) return;
            D.acoes.definirMecanica("lojaIria", true);
            D.acoes.adicionarBencao(pedra.id);
            recado("O Véu Entre Vidas está aberto. Bênçãos agora têm 25% de desconto.");
          }
        })
      );
    }

    atualizarBotoes(estado);
  }

  /* --- render geral ------------------------------------------------------ */

  function atualizarBotoes(estado) {
    botoesPreco.forEach(function (registro) {
      registro.botao.disabled = registro.preco > estado.ouro;
    });
  }

  D.assinar(function (estado) {
    el.ouro.textContent = estado.ouro.toLocaleString("pt-BR");
    renderizarBencao(estado);
  });
})();
