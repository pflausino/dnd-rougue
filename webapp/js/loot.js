/* Calculadora do loot de moedas — ferramenta do mestre.
 *
 * O mestre marca o que caiu durante a run; a tela devolve a expressão de dados
 * para anunciar à mesa, a média e os extremos. A rolagem em si costuma ser dos
 * jogadores, mas dá para rolar aqui quando ninguém quiser.
 */
(function () {
  "use strict";

  var D = window.Dungeon;

  var el = {
    encontros: document.querySelector("[data-encontros]"),
    expressao: document.querySelector("[data-expressao]"),
    media: document.querySelector("[data-media]"),
    minimo: document.querySelector("[data-minimo]"),
    maximo: document.querySelector("[data-maximo]"),
    totalAbates: document.querySelector("[data-total-abates]"),
    dobradas: document.querySelector("[data-dobradas]"),
    resultado: document.querySelector("[data-resultado]"),
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

  function dadoDe(inimigo) {
    return window.FAIXAS_LOOT[inimigo.faixa].dado;
  }

  /* "3d8 + 24" para três criaturas de 1d8+8. */
  function expressaoDe(dado, vezes) {
    if (!vezes) return "—";
    return vezes * dado.quantidade + "d" + dado.faces + " + " + vezes * dado.fixo;
  }

  function mediaDe(dado, vezes) {
    var mediaDoDado = (dado.faces + 1) / 2;
    return vezes * (dado.quantidade * mediaDoDado + dado.fixo);
  }

  function formatarPO(valor) {
    return Number(valor.toFixed(1)).toLocaleString("pt-BR");
  }

  /* --- linhas por encontro ------------------------------------------------ */

  var linhas = [];
  var blocos = [];

  window.ENCONTROS_LOOT.forEach(function (encontro) {
    var bloco = document.createElement("section");
    bloco.className = "painel bloco";

    var cabeca = document.createElement("div");
    cabeca.className = "bloco__cabeca";
    var titulo = document.createElement("h2");
    titulo.textContent = encontro.nome;

    /* Bênçãos como o Contrato da Fortuna dobram o ouro da sala; quem decide é
     * o mestre, aqui na mão. */
    var dobro = document.createElement("button");
    dobro.type = "button";
    dobro.className = "btn btn--pequeno";
    dobro.textContent = "Ouro dobrado";
    dobro.setAttribute("aria-pressed", "false");
    dobro.addEventListener("click", function () {
      D.acoes.alternarLootDobrado(encontro.id);
    });

    cabeca.appendChild(titulo);
    cabeca.appendChild(dobro);
    bloco.appendChild(cabeca);
    blocos.push({ encontro: encontro, bloco: bloco, dobro: dobro });

    encontro.inimigos.forEach(function (inimigo) {
      var dado = dadoDe(inimigo);

      var linha = document.createElement("div");
      linha.className = "loot-linha";

      var identificacao = document.createElement("div");
      identificacao.className = "loot-linha__nome";
      var nome = document.createElement("strong");
      nome.textContent = inimigo.nome;
      var detalhe = document.createElement("small");
      detalhe.textContent =
        "ND " + inimigo.nd + " · " + window.FAIXAS_LOOT[inimigo.faixa].nome +
        " · " + dado.quantidade + "d" + dado.faces + "+" + dado.fixo +
        " · " + inimigo.previstos + " no encontro";
      identificacao.appendChild(nome);
      identificacao.appendChild(detalhe);
      if (inimigo.nota) {
        var nota = document.createElement("small");
        nota.className = "loot-linha__nota";
        nota.textContent = inimigo.nota;
        identificacao.appendChild(nota);
      }

      var controles = document.createElement("div");
      controles.className = "loot-linha__controles";

      var menos = document.createElement("button");
      menos.type = "button";
      menos.className = "btn btn--pequeno";
      menos.textContent = "−";
      menos.addEventListener("click", function () {
        D.acoes.ajustarAbate(inimigo.id, -1);
      });

      var campo = document.createElement("input");
      campo.type = "number";
      campo.min = "0";
      campo.className = "loot-linha__campo mono";
      campo.addEventListener("change", function () {
        D.acoes.definirAbate(inimigo.id, Number(campo.value));
      });

      var mais = document.createElement("button");
      mais.type = "button";
      mais.className = "btn btn--pequeno";
      mais.textContent = "+";
      mais.addEventListener("click", function () {
        D.acoes.ajustarAbate(inimigo.id, 1);
      });

      var todos = document.createElement("button");
      todos.type = "button";
      todos.className = "btn btn--fantasma btn--pequeno";
      todos.textContent = "Todos";
      todos.title = "Marca os " + inimigo.previstos + " do encontro";
      todos.addEventListener("click", function () {
        D.acoes.definirAbate(inimigo.id, inimigo.previstos);
      });

      controles.appendChild(menos);
      controles.appendChild(campo);
      controles.appendChild(mais);
      controles.appendChild(todos);

      var soma = document.createElement("div");
      soma.className = "loot-linha__soma";
      var expressao = document.createElement("span");
      expressao.className = "mono";
      var media = document.createElement("small");
      soma.appendChild(expressao);
      soma.appendChild(media);

      linha.appendChild(identificacao);
      linha.appendChild(controles);
      linha.appendChild(soma);
      bloco.appendChild(linha);

      linhas.push({
        inimigo: inimigo,
        encontro: encontro,
        dado: dado,
        linha: linha,
        campo: campo,
        expressao: expressao,
        media: media
      });
    });

    el.encontros.appendChild(bloco);
  });

  /* --- totais ------------------------------------------------------------- */

  /* Dobrar a sala dobra os dados dela: 5d8+40 vira 10d8+80. */
  function fatorDe(estado, encontro) {
    return estado.lootDobrado && estado.lootDobrado[encontro.id] ? 2 : 1;
  }

  function renderizar(estado) {
    var abates = estado.abates || {};

    blocos.forEach(function (item) {
      var dobrado = fatorDe(estado, item.encontro) === 2;
      item.dobro.setAttribute("aria-pressed", dobrado ? "true" : "false");
      item.bloco.classList.toggle("bloco--dobrado", dobrado);
    });

    /* Junta os dados por número de faces: 12d4, 3d8, 1d20… mais o fixo. */
    var porFaces = {};
    var fixo = 0;
    var media = 0;
    var minimo = 0;
    var maximo = 0;
    var totalAbates = 0;
    var salasDobradas = 0;

    blocos.forEach(function (item) {
      if (fatorDe(estado, item.encontro) === 2) salasDobradas += 1;
    });

    linhas.forEach(function (item) {
      var abatidos = abates[item.inimigo.id] || 0;
      var vezes = abatidos * fatorDe(estado, item.encontro);
      totalAbates += abatidos;

      item.linha.classList.toggle("loot-linha--ativa", abatidos > 0);
      if (document.activeElement !== item.campo) item.campo.value = String(abatidos);
      item.expressao.textContent = expressaoDe(item.dado, vezes);
      item.media.textContent = vezes ? "média " + formatarPO(mediaDe(item.dado, vezes)) + " PO" : "";

      if (!vezes) return;

      porFaces[item.dado.faces] = (porFaces[item.dado.faces] || 0) + vezes * item.dado.quantidade;
      fixo += vezes * item.dado.fixo;
      media += mediaDe(item.dado, vezes);
      minimo += vezes * (item.dado.quantidade * 1 + item.dado.fixo);
      maximo += vezes * (item.dado.quantidade * item.dado.faces + item.dado.fixo);
    });

    var partes = Object.keys(porFaces)
      .map(Number)
      .sort(function (a, b) {
        return a - b;
      })
      .map(function (faces) {
        return porFaces[faces] + "d" + faces;
      });

    if (fixo) partes.push(String(fixo));

    el.expressao.textContent = partes.length ? partes.join(" + ") : "—";
    el.media.textContent = formatarPO(media);
    el.minimo.textContent = minimo.toLocaleString("pt-BR");
    el.maximo.textContent = maximo.toLocaleString("pt-BR");
    el.totalAbates.textContent = totalAbates === 1 ? "1 abate" : totalAbates + " abates";
    el.totalAbates.classList.toggle("selo--ativo", totalAbates > 0);

    el.dobradas.hidden = salasDobradas === 0;
    el.dobradas.textContent =
      salasDobradas === 1 ? "1 sala com ouro dobrado" : salasDobradas + " salas com ouro dobrado";
  }

  /* --- ações -------------------------------------------------------------- */

  document.querySelector("[data-rolar]").addEventListener("click", function () {
    var estado = D.get();
    var abates = estado.abates || {};
    var total = 0;
    var rolou = false;

    linhas.forEach(function (item) {
      var vezes = abates[item.inimigo.id] || 0;
      for (var i = 0; i < vezes * item.dado.quantidade; i += 1) {
        total += Math.floor(Math.random() * item.dado.faces) + 1;
        rolou = true;
      }
      total += vezes * item.dado.fixo;
    });

    if (!rolou) {
      recado("Nenhum abate marcado.", "falha");
      return;
    }

    el.resultado.value = String(total);
    recado("Rolagem: " + total.toLocaleString("pt-BR") + " PO.");
  });

  document.querySelector("[data-somar]").addEventListener("click", function () {
    var valor = Math.round(Number(el.resultado.value) || 0);
    if (valor <= 0) {
      recado("Informe o valor rolado.", "falha");
      return;
    }
    D.acoes.ajustarOuro(valor);
    el.resultado.value = "";
    recado("+" + valor.toLocaleString("pt-BR") + " PO. Total: " + D.get().ouro.toLocaleString("pt-BR") + " PO.");
  });

  document.querySelector("[data-zerar]").addEventListener("click", function () {
    D.acoes.zerarAbates();
    el.resultado.value = "";
    recado("Contagem zerada para a próxima run.");
  });

  D.assinar(renderizar);
})();
