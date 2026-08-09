/* Consulta rápida dos blocos de estatística.
 *
 * A busca é só local (renderiza uma vez, filtra em memória a cada tecla). Os
 * botões de rolagem já escrevem em window.Dungeon: pedem a rolagem no estado
 * compartilhado e a tela do Relógio (dado 3D) resolve. Sem ela conectada,
 * esta tela mesmo resolve depois de uma espera — ver `rolarComRetorno`.
 */
(function () {
  "use strict";

  var D = window.Dungeon;

  var el = {
    lista: document.querySelector("[data-lista-monstros]"),
    busca: document.querySelector("[data-busca-monstros]"),
    vazio: document.querySelector("[data-monstros-vazio]")
  };

  /* Espera pelo dado 3D do Relógio antes de rolar aqui mesmo. Curta o
   * suficiente para não travar a mesa, longa o bastante para a animação. */
  var ESPERA_RETORNO_MS = 5000;

  function modificador(valor) {
    var mod = Math.floor((valor - 10) / 2);
    return (mod >= 0 ? "+" : "") + mod;
  }

  function notacao(rolagem) {
    if (!rolagem.bonus) return rolagem.dado;
    return rolagem.dado + (rolagem.bonus >= 0 ? "+" : "") + rolagem.bonus;
  }

  /* d20+3, 2d8+3... sempre "qtd" dados de "lados" faces. */
  function parseDado(dado) {
    var partes = dado.split("d");
    return { qtd: Number(partes[0]), lados: Number(partes[1]) };
  }

  function rolarDados(qtd, lados) {
    var dados = [];
    for (var i = 0; i < qtd; i += 1) {
      dados.push(1 + Math.floor(Math.random() * lados));
    }
    return dados;
  }

  function somar(dados) {
    return dados.reduce(function (total, valor) {
      return total + valor;
    }, 0);
  }

  /* Pede a rolagem pelo estado compartilhado. Se em ESPERA_RETORNO_MS
   * ninguém resolveu (a tela do Relógio não está aberta, ou falhou ao
   * carregar o dado 3D), esta tela resolve sozinha — sem isso, sem Relógio
   * o botão simplesmente não faz nada. */
  function rolarComRetorno(monstro, acaoNome, rolagemDef) {
    if (!D) return;
    var partes = parseDado(rolagemDef.dado);
    var id = D.acoes.pedirRolagem({
      monstro: monstro.nome,
      apelido: monstro.apelido,
      acao: acaoNome,
      rotulo: rolagemDef.rotulo,
      qtd: partes.qtd,
      lados: partes.lados,
      bonus: rolagemDef.bonus,
      tipo: rolagemDef.tipo
    });

    window.setTimeout(function () {
      var atual = D.get().rolagem;
      if (!atual || atual.id !== id || atual.status !== "pendente") return;
      var dados = rolarDados(partes.qtd, partes.lados);
      D.acoes.resolverRolagem(id, dados, somar(dados) + rolagemDef.bonus);
    }, ESPERA_RETORNO_MS);
  }

  function linha(rotuloTexto, valor) {
    if (!valor) return null;
    var p = document.createElement("p");
    var rotulo = document.createElement("strong");
    rotulo.textContent = rotuloTexto + ": ";
    p.appendChild(rotulo);
    p.appendChild(document.createTextNode(valor));
    return p;
  }

  function blocoDeItens(titulo, itens, monstro) {
    if (!itens || !itens.length) return null;
    var secao = document.createElement("div");
    secao.className = "monstro__secao";
    var h4 = document.createElement("h4");
    h4.textContent = titulo;
    secao.appendChild(h4);
    itens.forEach(function (item) {
      var p = document.createElement("p");
      p.className = "monstro__item";
      var nome = document.createElement("strong");
      nome.textContent = item.nome + ". ";
      p.appendChild(nome);
      p.appendChild(document.createTextNode(item.texto));
      secao.appendChild(p);

      if (item.rolagens && item.rolagens.length) {
        var botoes = document.createElement("div");
        botoes.className = "monstro__rolagens";
        item.rolagens.forEach(function (rolagemDef) {
          var botao = document.createElement("button");
          botao.type = "button";
          botao.className = "btn btn--fantasma btn--pequeno mono";
          botao.textContent = rolagemDef.rotulo + " · " + notacao(rolagemDef);
          botao.addEventListener("click", function () {
            rolarComRetorno(monstro, item.nome, rolagemDef);
          });
          botoes.appendChild(botao);
        });
        secao.appendChild(botoes);
      }
    });
    return secao;
  }

  function cartaoMonstro(monstro) {
    var cartao = document.createElement("article");
    cartao.className = "painel bloco monstro";
    cartao.dataset.buscaTexto = (monstro.nome + " " + (monstro.apelido || "")).toLowerCase();

    var cabeca = document.createElement("div");
    cabeca.className = "monstro__cabeca";

    var titulo = document.createElement("div");
    titulo.className = "monstro__titulo";
    var h3 = document.createElement("h3");
    h3.textContent = monstro.nome;
    titulo.appendChild(h3);
    if (monstro.apelido) {
      var apelido = document.createElement("span");
      apelido.className = "monstro__apelido";
      apelido.textContent = "— " + monstro.apelido;
      titulo.appendChild(apelido);
    }
    cabeca.appendChild(titulo);

    var quantidade = document.createElement("span");
    quantidade.className = "selo monstro__quantidade";
    quantidade.textContent = monstro.quantidade + "×  ND " + monstro.nd.split(" ")[0];
    cabeca.appendChild(quantidade);
    cartao.appendChild(cabeca);

    var classificacao = document.createElement("p");
    classificacao.className = "monstro__classificacao";
    classificacao.textContent = monstro.classificacao;
    cartao.appendChild(classificacao);

    if (monstro.nota) {
      var nota = document.createElement("p");
      nota.className = "monstro__nota";
      nota.textContent = monstro.nota;
      cartao.appendChild(nota);
    }

    var vitals = document.createElement("div");
    vitals.className = "monstro__vitals mono";
    /* Ordem do bloco de 2025: CA, Iniciativa, PV, Deslocamento. A Draconidra
     * ainda é ficha de 2014 e não tem linha de iniciativa — daí o filtro. */
    [
      ["CA", monstro.ca + (monstro.caObs ? " (" + monstro.caObs + ")" : "")],
      ["Iniciativa", monstro.iniciativa],
      ["PV", monstro.pv + " (" + monstro.pvDado + ")"],
      ["Deslocamento", monstro.deslocamento]
    ]
      .filter(function (par) {
        return par[1];
      })
      .forEach(function (par) {
      var campo = document.createElement("div");
      var rotulo = document.createElement("span");
      rotulo.className = "rotulo";
      rotulo.textContent = par[0];
      var valor = document.createElement("div");
      valor.textContent = par[1];
      campo.appendChild(rotulo);
      campo.appendChild(valor);
      vitals.appendChild(campo);
    });
    cartao.appendChild(vitals);

    var atributos = document.createElement("div");
    atributos.className = "monstro__atributos";
    [
      ["FOR", monstro.atributos.for],
      ["DES", monstro.atributos.des],
      ["CON", monstro.atributos.con],
      ["INT", monstro.atributos.int],
      ["SAB", monstro.atributos.sab],
      ["CAR", monstro.atributos.car]
    ].forEach(function (par) {
      var atributo = document.createElement("div");
      atributo.className = "monstro__atributo";
      var rotulo = document.createElement("span");
      rotulo.className = "rotulo";
      rotulo.textContent = par[0];
      var valor = document.createElement("strong");
      valor.textContent = par[1] + " (" + modificador(par[1]) + ")";
      atributo.appendChild(rotulo);
      atributo.appendChild(valor);
      atributos.appendChild(atributo);
    });
    cartao.appendChild(atributos);

    var linhas = document.createElement("div");
    linhas.className = "monstro__linhas";
    [
      linha("Salvaguardas", monstro.salvaguardas),
      linha("Perícias", monstro.pericias),
      linha("Equipamento", monstro.equipamento),
      linha("Resistências a dano", monstro.resistenciasDano),
      linha("Imunidades a dano", monstro.imunidadesDano),
      linha("Imunidades a condição", monstro.imunidadesCondicao),
      linha("Sentidos", monstro.sentidos),
      linha("Idiomas", monstro.idiomas),
      linha("ND", monstro.nd)
    ]
      .filter(Boolean)
      .forEach(function (p) {
        linhas.appendChild(p);
      });
    cartao.appendChild(linhas);

    [
      blocoDeItens("Traços", monstro.tracos, monstro),
      blocoDeItens("Ações", monstro.acoes, monstro),
      blocoDeItens("Raios do olho", monstro.raios, monstro),
      blocoDeItens("Ações bônus", monstro.acoesBonus, monstro),
      blocoDeItens("Reações", monstro.reacoes, monstro)
    ]
      .filter(Boolean)
      .forEach(function (secao) {
        cartao.appendChild(secao);
      });

    var fonte = document.createElement("p");
    fonte.className = "monstro__fonte";
    fonte.textContent = "Fonte: " + monstro.fonte;
    cartao.appendChild(fonte);
    if (monstro.notaEncontro) {
      var notaEncontro = document.createElement("p");
      notaEncontro.className = "monstro__fonte";
      notaEncontro.textContent = monstro.notaEncontro;
      cartao.appendChild(notaEncontro);
    }

    return cartao;
  }

  window.GRUPOS_MONSTROS.forEach(function (grupo) {
    var monstrosDoGrupo = window.MONSTROS.filter(function (monstro) {
      return monstro.encontro === grupo.id;
    });
    if (!monstrosDoGrupo.length) return;

    var secao = document.createElement("section");
    secao.className = "painel bloco categoria";
    secao.dataset.grupoMonstros = grupo.id;

    var cabeca = document.createElement("div");
    cabeca.className = "bloco__cabeca";
    var h2 = document.createElement("h3");
    h2.textContent = grupo.titulo;
    var contagem = document.createElement("span");
    contagem.className = "selo";
    contagem.textContent = monstrosDoGrupo.length + (monstrosDoGrupo.length === 1 ? " monstro" : " monstros");
    cabeca.appendChild(h2);
    cabeca.appendChild(contagem);
    secao.appendChild(cabeca);

    var grade = document.createElement("div");
    grade.className = "monstro-grade";
    monstrosDoGrupo.forEach(function (monstro) {
      grade.appendChild(cartaoMonstro(monstro));
    });
    secao.appendChild(grade);

    el.lista.appendChild(secao);
  });

  /* Filtro em memória: esconde cartões e, quando um grupo fica vazio, o grupo
   * inteiro. Sem gravação de estado — é busca local, cada tela tem a sua. */
  el.busca.addEventListener("input", function () {
    var termo = el.busca.value.trim().toLowerCase();
    var algumVisivel = false;

    el.lista.querySelectorAll("[data-grupo-monstros]").forEach(function (grupo) {
      var visivelNoGrupo = false;
      grupo.querySelectorAll(".monstro").forEach(function (cartao) {
        var combina = !termo || cartao.dataset.buscaTexto.indexOf(termo) !== -1;
        cartao.hidden = !combina;
        if (combina) visivelNoGrupo = true;
      });
      grupo.hidden = !visivelNoGrupo;
      if (visivelNoGrupo) algumVisivel = true;
    });

    el.vazio.hidden = algumVisivel;
  });

  /* O painel de combate (js/combate.js) rola os mesmos ataques e precisa do
   * mesmo caminho de ida e volta — inclusive do retorno local quando não há
   * tela do Relógio aberta. Exposto em vez de copiado: duas cópias
   * divergiriam, e a que estivesse errada só apareceria na mesa. */
  window.RolagemMonstro = {
    pedir: rolarComRetorno,
    notacao: notacao
  };
})();
