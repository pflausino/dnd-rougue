/* Painel de combate no topo da tela de Monstros.
 *
 * Mostra só as criaturas da sala que o mestre marcou (`estado.sala`), uma
 * linha de vida por criatura — cinco Ghasts, cinco linhas — e um bloco de
 * rolagens por *tipo* de criatura, porque o ataque do Ghast é o mesmo nos
 * cinco.
 *
 * Fichas com `mob` fogem dessa regra: a linha passa a ser do grupo, com o PV
 * das criaturas somado, e ao lado quantas ainda estão de pé. É para horda
 * grande demais para rastrear uma a uma — ver `pelotoes`.
 *
 * O dano vive no estado compartilhado (`estado.danos`), então some do painel
 * do mestre e volta igual depois de um F5 no meio do combate. O que está
 * gravado é o dano sofrido, não o PV restante — ver o comentário em state.js.
 *
 * Os blocos de estatística abaixo não são tocados por este arquivo.
 */
(function () {
  "use strict";

  var D = window.Dungeon;
  if (!D) return;

  var el = {
    sala: document.querySelector("[data-combate-sala]"),
    zerar: document.querySelector("[data-combate-zerar]"),
    dica: document.querySelector("[data-combate-dica]"),
    grade: document.querySelector("[data-combate-grade]")
  };

  /* `<encontro>:<idMonstro>:<índice>` — o mesmo formato que state.js espera. */
  function chaveDe(encontro, idMonstro, indice) {
    return encontro + ":" + idMonstro + ":" + indice;
  }

  /* Média de "2d8+3": cada dado vale (lados+1)/2. Bate com o número que a
   * ficha oficial mostra entre parênteses — 12 (2d8 + 3). */
  function media(rolagem) {
    var partes = rolagem.dado.split("d");
    var qtd = Number(partes[0]);
    var lados = Number(partes[1]);
    return Math.floor((qtd * (lados + 1)) / 2 + (rolagem.bonus || 0));
  }

  function monstrosDaSala(idSala) {
    if (!idSala) return [];
    return window.MONSTROS.filter(function (monstro) {
      return monstro.encontro === idSala;
    });
  }

  /* --- montagem ----------------------------------------------------------- */

  /* Guarda o que precisa mudar a cada clique, para o painel inteiro não ser
   * remontado a cada -1: remontar perderia a rolagem do scroll no meio do
   * combate, que é justamente quando o mestre não quer perder o lugar. */
  var celulas = {};

  /* Uma linha de vida por criatura — cinco Ghasts, cinco linhas — exceto quando
   * a ficha traz `mob`: aí o mestre conduz por grupo, e a linha é do grupo
   * inteiro, com o PV das criaturas somado. O `unidade` guarda o PV de uma só,
   * que é o que permite derivar quantas ainda estão de pé a partir do dano do
   * grupo. Sem esse número o mob vira uma barra sem sentido de mesa: Slam e
   * Undead Fortitude são por criatura, não por barra. */
  function pelotoes(monstro) {
    var lista = [];
    var i;
    if (monstro.mob) {
      for (i = 0; i < monstro.mob.grupos; i += 1) {
        lista.push({
          rotulo: "Grupo " + String.fromCharCode(65 + i),
          maximo: monstro.mob.porGrupo * monstro.pv,
          unidade: monstro.pv
        });
      }
      return lista;
    }
    for (i = 0; i < monstro.quantidade; i += 1) {
      lista.push({
        /* Sozinha na sala, a criatura não precisa de número. */
        rotulo: monstro.quantidade > 1 ? "#" + (i + 1) : "—",
        maximo: monstro.pv,
        unidade: 0
      });
    }
    return lista;
  }

  function linhaDeVida(monstro, indice, pelotao) {
    var chave = chaveDe(monstro.encontro, monstro.id, indice);

    var linha = document.createElement("div");
    linha.className = "combate-vida";
    if (pelotao.unidade) linha.classList.add("combate-vida--mob");

    var rotulo = document.createElement("span");
    rotulo.className = "combate-vida__num";
    rotulo.textContent = pelotao.rotulo;
    linha.appendChild(rotulo);

    var pv = document.createElement("span");
    pv.className = "combate-vida__pv mono";
    linha.appendChild(pv);

    var pe = null;
    if (pelotao.unidade) {
      pe = document.createElement("span");
      pe.className = "combate-vida__pe mono";
      linha.appendChild(pe);
    }

    var barra = document.createElement("span");
    barra.className = "combate-vida__barra";
    var enche = document.createElement("span");
    barra.appendChild(enche);
    linha.appendChild(barra);

    var botoes = document.createElement("div");
    botoes.className = "combate-vida__botoes";
    [
      { texto: "−10", delta: 10, classe: "btn--perigo" },
      { texto: "−1", delta: 1, classe: "btn--perigo" },
      { texto: "+1", delta: -1, classe: "" }
    ].forEach(function (item) {
      var botao = document.createElement("button");
      botao.type = "button";
      botao.className = "btn btn--pequeno " + item.classe;
      botao.textContent = item.texto;
      botao.addEventListener("click", function () {
        /* Escrever só em resposta ao clique: render que grava fecha laço entre
         * as telas abertas (ver CLAUDE.md). */
        D.acoes.ajustarDano(chave, item.delta, pelotao.maximo);
      });
      botoes.appendChild(botao);
    });
    linha.appendChild(botoes);

    celulas[chave] = {
      linha: linha,
      pv: pv,
      pe: pe,
      enche: enche,
      maximo: pelotao.maximo,
      unidade: pelotao.unidade
    };
    return linha;
  }

  function blocoDeAtaques(monstro) {
    var comRolagem = (monstro.acoes || []).filter(function (acao) {
      return acao.rolagens && acao.rolagens.length;
    });
    if (!comRolagem.length) return null;

    var bloco = document.createElement("div");
    bloco.className = "combate-ficha__ataques";

    comRolagem.forEach(function (acao) {
      var linha = document.createElement("div");
      linha.className = "combate-ataque";

      var nome = document.createElement("span");
      nome.className = "combate-ataque__nome";
      nome.textContent = acao.nome;
      linha.appendChild(nome);

      acao.rolagens.forEach(function (rolagem) {
        var botao = document.createElement("button");
        botao.type = "button";
        botao.className = "btn btn--fantasma btn--pequeno mono";

        /* A média só interessa nas rolagens de dano: é o número que o mestre
         * usa quando decide não rolar para acelerar a mesa. */
        var ehDano = rolagem.rotulo.indexOf("Dano") === 0;
        botao.textContent =
          rolagem.rotulo +
          " " +
          window.RolagemMonstro.notacao(rolagem) +
          (ehDano ? " · méd " + media(rolagem) : "");

        botao.addEventListener("click", function () {
          window.RolagemMonstro.pedir(monstro, acao.nome, rolagem);
        });
        linha.appendChild(botao);
      });

      bloco.appendChild(linha);
    });

    return bloco;
  }

  function fichaDeCombate(monstro) {
    var ficha = document.createElement("article");
    ficha.className = "painel combate-ficha";

    var cabeca = document.createElement("header");
    cabeca.className = "combate-ficha__cabeca";

    var titulo = document.createElement("h3");
    var sufixo = monstro.quantidade > 1 ? " ×" + monstro.quantidade : "";
    if (monstro.mob) {
      sufixo += " · " + monstro.mob.grupos + " grupos de " + monstro.mob.porGrupo;
    }
    titulo.textContent = monstro.nome + sufixo;
    cabeca.appendChild(titulo);

    var selo = document.createElement("span");
    selo.className = "selo mono";
    selo.textContent = "CA " + monstro.ca + " · PV " + monstro.pv;
    cabeca.appendChild(selo);
    ficha.appendChild(cabeca);

    if (monstro.nota) {
      var nota = document.createElement("p");
      nota.className = "combate-ficha__nota";
      nota.textContent = monstro.nota;
      ficha.appendChild(nota);
    }

    /* Ataques antes das vidas: com doze goblins a lista de vidas fica longa, e
     * deixar as rolagens embaixo dela obrigaria a rolar a página no meio do
     * turno. Em cima, a altura do que o mestre mais usa não depende de quantas
     * criaturas a sala tem. */
    var ataques = blocoDeAtaques(monstro);
    if (ataques) ficha.appendChild(ataques);

    var vidas = document.createElement("div");
    vidas.className = "combate-ficha__vidas";
    pelotoes(monstro).forEach(function (pelotao, i) {
      vidas.appendChild(linhaDeVida(monstro, i, pelotao));
    });
    ficha.appendChild(vidas);

    return ficha;
  }

  /* --- render -------------------------------------------------------------- */

  function atualizarVidas(estado) {
    Object.keys(celulas).forEach(function (chave) {
      var celula = celulas[chave];
      var dano = estado.danos[chave] || 0;
      var restante = Math.max(0, celula.maximo - dano);

      celula.pv.textContent = restante + " / " + celula.maximo;
      /* Arredonda para cima: com 1 PV sobrando ainda há uma criatura de pé, e
       * é ela que ataca no turno. */
      if (celula.pe) celula.pe.textContent = Math.ceil(restante / celula.unidade) + " de pé";
      celula.enche.style.width = (restante / celula.maximo) * 100 + "%";
      celula.linha.classList.toggle("combate-vida--caida", restante === 0);
      /* Abaixo de um terço o mestre precisa notar sem ler o número. */
      celula.linha.classList.toggle(
        "combate-vida--ferida",
        restante > 0 && restante <= celula.maximo / 3
      );
    });
  }

  /* Só remonta quando a sala muda; o resto é atualização no lugar. */
  var salaMontada = null;

  function renderizar(estado) {
    var idSala = estado.sala;
    var doGrupo = monstrosDaSala(idSala);
    var sala = idSala && window.salaPorId ? window.salaPorId(idSala) : null;

    if (idSala !== salaMontada) {
      salaMontada = idSala;
      celulas = {};
      el.grade.innerHTML = "";
      doGrupo.forEach(function (monstro) {
        el.grade.appendChild(fichaDeCombate(monstro));
      });
    }

    var temCombate = doGrupo.length > 0;
    el.grade.hidden = !temCombate;
    el.dica.hidden = temCombate;
    el.zerar.hidden = !temCombate;
    el.sala.textContent = sala ? sala.nome : "Nenhuma sala marcada";

    if (temCombate) atualizarVidas(estado);
  }

  el.zerar.addEventListener("click", function () {
    /* Restaura só a sala em campo: o dano das outras salas continua onde
     * estava, porque `mesclar` funde e as chaves não escritas ficam. */
    D.acoes.zerarDanos(Object.keys(celulas));
  });

  D.assinar(renderizar);
})();
