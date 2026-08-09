/* O Véu Entre Vidas — loja de Íria Sete-Véus.
 *
 * Diferente de Bram, aqui tudo fica na mesma tela: um card por bênção do
 * catálogo, ao preço cheio. Os Pergaminhos de Experiência formam uma escada —
 * cada um só é liberado depois que o grupo já comprou o anterior.
 */
(function () {
  "use strict";

  var D = window.Dungeon;

  var el = {
    ouro: document.querySelector("[data-ouro]"),
    vitrine: document.querySelector("[data-vitrine]"),
    recado: document.querySelector("[data-recado]")
  };

  function recado(mensagem, tom) {
    el.recado.textContent = mensagem;
    el.recado.className = "recado recado--visivel" + (tom ? " recado--" + tom : "");
    window.clearTimeout(recado.timer);
    recado.timer = window.setTimeout(function () {
      el.recado.className = "recado";
    }, 3200);
  }

  function ehConsumivel(bencao) {
    return /^Consum/i.test(bencao.tipo || "");
  }

  /* Um card por bênção, montado uma vez; o estado muda só o rodapé. */
  var cards = window.BENCAOS.map(function (bencao) {
    var card = document.createElement("article");
    card.className = "painel bloco vitrine__item";

    var icone = document.createElement("span");
    icone.className = "bencao__icone";
    var imagem = document.createElement("img");
    imagem.alt = bencao.nome;
    imagem.addEventListener("error", function () {
      imagem.remove();
    });
    imagem.src = bencao.icone;
    icone.appendChild(imagem);

    var topo = document.createElement("div");
    topo.className = "vitrine__topo";
    var tipo = document.createElement("span");
    tipo.className = "rotulo";
    tipo.textContent = bencao.tipo;
    var nome = document.createElement("h2");
    nome.textContent = bencao.nome;
    topo.appendChild(icone);
    var titulos = document.createElement("div");
    titulos.appendChild(tipo);
    titulos.appendChild(nome);
    topo.appendChild(titulos);

    var lema = document.createElement("p");
    lema.className = "bencao__lema";
    lema.textContent = bencao.lema;

    var efeito = document.createElement("p");
    efeito.className = "bencao__efeito";
    efeito.textContent = bencao.efeito;

    card.appendChild(topo);
    card.appendChild(lema);
    card.appendChild(efeito);

    if (bencao.restricao) {
      var restricao = document.createElement("p");
      restricao.className = "bencao__restricao";
      restricao.textContent = "Restrição: " + bencao.restricao;
      card.appendChild(restricao);
    }

    var rodape = document.createElement("div");
    rodape.className = "bencao__rodape";

    var preco = document.createElement("span");
    preco.className = "bencao__preco mono";
    preco.textContent = bencao.preco.toLocaleString("pt-BR") + " PO";

    var aviso = document.createElement("span");
    aviso.className = "vitrine__aviso";

    var botao = document.createElement("button");
    botao.type = "button";
    botao.className = "btn btn--primario";
    botao.textContent = "Comprar";
    botao.addEventListener("click", function () {
      if (!D.acoes.gastarOuro(bencao.preco)) {
        recado("Ouro insuficiente para " + bencao.nome + ".", "falha");
        return;
      }
      D.acoes.adicionarBencao(bencao.id);
      recado(bencao.nome + " — " + bencao.preco.toLocaleString("pt-BR") + " PO pagos.");
    });

    rodape.appendChild(preco);
    rodape.appendChild(aviso);
    rodape.appendChild(botao);
    card.appendChild(rodape);

    el.vitrine.appendChild(card);
    return { bencao: bencao, card: card, botao: botao, aviso: aviso };
  });

  function renderizar(estado) {
    el.ouro.textContent = estado.ouro.toLocaleString("pt-BR");

    cards.forEach(function (item) {
      var bencao = item.bencao;
      var temNoInventario = estado.bencaos.indexOf(bencao.id) >= 0;
      var requisito = bencao.requer ? window.bencaoPorId(bencao.requer) : null;
      var requisitoCumprido = !requisito || estado.bencaosAdquiridas.indexOf(requisito.id) >= 0;

      /* Permanente já em posse não se compra de novo; consumível pode repetir —
       * a menos que seja `unico`, e aí a conta é contra `bencaosAdquiridas`, o
       * histórico que sobrevive ao consumo. Contra `bencaos` a vitrine reporia
       * o item no instante em que o grupo o usasse. */
      var esgotado = bencao.unico && estado.bencaosAdquiridas.indexOf(bencao.id) >= 0;
      var jaPossui = temNoInventario && !ehConsumivel(bencao);
      var bloqueado = !requisitoCumprido || jaPossui || esgotado;

      item.card.classList.toggle("vitrine__item--bloqueado", bloqueado);
      item.botao.hidden = bloqueado;
      item.botao.disabled = bencao.preco > estado.ouro;

      if (!requisitoCumprido) {
        item.aviso.textContent = "Exige " + requisito.nome;
      } else if (esgotado) {
        item.aviso.textContent = "Íria só tinha um";
      } else if (jaPossui) {
        item.aviso.textContent = "Já em posse do grupo";
      } else {
        item.aviso.textContent = "";
      }
      item.aviso.hidden = !item.aviso.textContent;
    });
  }

  D.assinar(renderizar);
})();
