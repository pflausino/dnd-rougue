/* Estado compartilhado entre as telas Mestre, Jogadores e Relógio.
 *
 * O estado vive em localStorage e é propagado por três vias, para funcionar
 * tanto em servidor local quanto abrindo os arquivos direto no navegador:
 *   1. BroadcastChannel (imediato, quando disponível);
 *   2. evento `storage` (outras abas da mesma origem);
 *   3. polling de 500 ms (rede de segurança em file://).
 */
(function (global) {
  "use strict";

  /* A versão entra na chave e no canal: telas de versões diferentes (uma aba
   * antiga que ficou aberta, por exemplo) não disputam o mesmo estado. */
  var VERSAO = 9;
  var CHAVE = "ultima-dungeon:estado:v" + VERSAO;
  var NOME_CANAL = "ultima-dungeon:v" + VERSAO;
  var INTERVALO_POLL = 500;

  var MINUTO = 60 * 1000;
  var HORA = 60 * MINUTO;

  /* A tela dos Jogadores tem só dois modos: o grupo está na dungeon ou no
   * acampamento entre as runs, onde as lojas ficam abertas. */
  var MODOS_PAINEL = [
    { id: "dungeon", nome: "Dungeon" },
    { id: "acampamento", nome: "Acampamento" }
  ];

  /* Lojas do acampamento, conforme referencias/loja.md. A imagem é opcional:
   * sem o arquivo, a tela cai no retrato de reserva com a inicial. */
  var LOJAS = [
    {
      id: "bram",
      mercador: "Bram Barbacobre",
      nome: "A Última Provisão",
      chamada: "Armas, armaduras, poções e equipamento",
      imagem: "../loja/assets/personagens/bram-barbacobre.png",
      pagina: "bram.html"
    },
    {
      id: "iria",
      mercador: "Íria Sete-Véus",
      nome: "O Véu Entre Vidas",
      chamada: "Itens mágicos, bênçãos e encantamentos",
      imagem: "../loja/assets/personagens/iria-sete-veus.png",
      pagina: "iria.html",
      /* Só abre depois que o grupo comprar a Pedra de Íria. */
      exigeAcesso: "lojaIria"
    }
  ];

  /* Preço da rolagem no baú de itens mágicos de Bram. O item em si é sorteado
   * na mesa, à mão; o app apenas cobra o ouro. */
  var PRECO_BAU = 300;

  /* Desconto nas bênçãos de Bram quando o grupo já tem acesso à loja de Íria. */
  var DESCONTO_BENCAO = 0.25;

  function lojaPorId(id) {
    for (var i = 0; i < LOJAS.length; i += 1) {
      if (LOJAS[i].id === id) return LOJAS[i];
    }
    return null;
  }

  var DURACAO_PADRAO_MS = 4 * HORA;

  /* Cada TPK dá direito a uma pausa. As de 5 min são ilimitadas; as maiores
   * têm cota fechada para a sessão inteira. */
  var PAUSAS = [
    { minutos: 5, limite: null },
    { minutos: 10, limite: 2 },
    { minutos: 30, limite: 1 }
  ];

  function estadoInicial() {
    return {
      versao: VERSAO,
      atualizadoEm: 0,
      run: 1,
      mortes: 0,
      ouro: 0,
      relogio: {
        rodando: false,
        acumuladoMs: 0,
        iniciadoEm: null,
        duracaoMs: DURACAO_PADRAO_MS
      },
      modo: "acampamento",
      /* Interruptores que o mestre liga na mesa conforme o grupo progride. */
      mecanicas: {
        lojaIria: false
      },
      /* O que o mestre está projetando na tela do Relógio, além do cronômetro.
       * id nulo = só o relógio. */
      exibicao: {
        id: null,
        variante: null
      },
      /* Bênçãos em posse do grupo, por id, na ordem de aquisição. */
      bencaos: [],
      /* Tudo que já foi comprado alguma vez. Os consumíveis saem de `bencaos`
       * ao serem usados, mas seguem aqui — é o histórico que libera os
       * pergaminhos em escada. */
      bencaosAdquiridas: [],
      /* Contagem de abates da run, por id de inimigo, para o cálculo do loot. */
      abates: {},
      /* Salas com o ouro dobrado nesta run, marcadas à mão pelo mestre. */
      lootDobrado: {},
      /* Bênção que Bram oferece nesta run. Sorteada uma vez por run. */
      ofertaBencao: {
        run: 0,
        id: null,
        comprada: false
      },
      pausa: {
        /* pendente: houve um TPK e o grupo ainda não escolheu a pausa. */
        pendente: false,
        terminaEm: null,
        duracaoMs: 0,
        retomarRelogio: false,
        usadas: { 5: 0, 10: 0, 30: 0 }
      }
    };
  }

  /* --- persistência ------------------------------------------------------ */

  function ler() {
    try {
      var bruto = global.localStorage.getItem(CHAVE);
      if (!bruto) return estadoInicial();
      var salvo = JSON.parse(bruto);
      if (!salvo || salvo.versao !== VERSAO) return estadoInicial();
      return mesclar(estadoInicial(), salvo);
    } catch (erro) {
      return estadoInicial();
    }
  }

  /* Mescla rasa em dois níveis: suficiente para o formato do estado. */
  function mesclar(base, novo) {
    var saida = {};
    Object.keys(base).forEach(function (chave) {
      var valorBase = base[chave];
      var valorNovo = novo[chave];
      if (valorNovo === undefined) {
        saida[chave] = valorBase;
      } else if (valorBase && typeof valorBase === "object" && !Array.isArray(valorBase)) {
        saida[chave] = Object.assign({}, valorBase, valorNovo);
      } else {
        saida[chave] = valorNovo;
      }
    });
    return saida;
  }

  var estado = ler();
  var assinantes = [];
  var canal = null;

  if (typeof global.BroadcastChannel === "function") {
    try {
      canal = new global.BroadcastChannel(NOME_CANAL);
    } catch (erro) {
      canal = null;
    }
  }

  function notificar(origem) {
    assinantes.forEach(function (cb) {
      try {
        cb(estado, origem);
      } catch (erro) {
        console.error("[estado] assinante falhou", erro);
      }
    });
  }

  function gravar() {
    try {
      global.localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (erro) {
      console.warn("[estado] não foi possível gravar", erro);
    }
    if (canal) canal.postMessage({ tipo: "estado", estado: estado });
  }

  /* Carimbo monotônico: duas gravações no mesmo milissegundo precisam de
   * valores diferentes, senão a outra aba descarta a segunda. */
  var ultimoCarimbo = 0;

  function carimbar() {
    var agora = Date.now();
    ultimoCarimbo = agora > ultimoCarimbo ? agora : ultimoCarimbo + 1;
    return ultimoCarimbo;
  }

  /* Aplica um patch (objeto ou função) e propaga para as outras telas. */
  function atualizar(patch) {
    var parcial = typeof patch === "function" ? patch(estado) : patch;
    if (!parcial) return estado;
    estado = mesclar(estado, parcial);
    estado.atualizadoEm = carimbar();
    gravar();
    notificar("local");
    return estado;
  }

  /* Compara o conteúdo, não só o carimbo: é a garantia final de convergência.
   *
   * Estados de outra versão são ignorados. Sem essa trava, uma aba com o código
   * antigo ainda aberta mesclaria o estado novo sobre o formato dela e, na
   * primeira gravação, apagaria os campos que ela não conhece. */
  function receberExterno(novo) {
    if (!novo || novo.versao !== estado.versao) return;
    if (JSON.stringify(novo) === JSON.stringify(estado)) return;
    estado = mesclar(estadoInicial(), novo);
    ultimoCarimbo = Math.max(ultimoCarimbo, estado.atualizadoEm || 0);
    notificar("remoto");
  }

  if (canal) {
    canal.onmessage = function (evento) {
      if (evento.data && evento.data.tipo === "estado") receberExterno(evento.data.estado);
    };
  }

  global.addEventListener("storage", function (evento) {
    if (evento.key && evento.key !== CHAVE) return;
    receberExterno(ler());
  });

  global.setInterval(function () {
    receberExterno(ler());
  }, INTERVALO_POLL);

  /* --- relógio ----------------------------------------------------------- */

  function decorridoMs(algum) {
    var atual = algum || estado;
    var r = atual.relogio;
    var extra = r.rodando && r.iniciadoEm ? Date.now() - r.iniciadoEm : 0;
    return Math.max(0, r.acumuladoMs + extra);
  }

  function restanteMs(algum) {
    var atual = algum || estado;
    return atual.relogio.duracaoMs - decorridoMs(atual);
  }

  function formatarDuracao(ms) {
    var negativo = ms < 0;
    var total = Math.floor(Math.abs(ms) / 1000);
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    var texto = [h, m, s]
      .map(function (n) {
        return String(n).padStart(2, "0");
      })
      .join(":");
    return (negativo ? "-" : "") + texto;
  }

  /* MM:SS, para contagens curtas como a pausa. */
  function formatarMinutos(ms) {
    var total = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  var relogio = {
    iniciar: function () {
      if (estado.relogio.rodando) return;
      atualizar({ relogio: { rodando: true, iniciadoEm: Date.now() } });
    },
    pausar: function () {
      if (!estado.relogio.rodando) return;
      atualizar({
        relogio: { rodando: false, acumuladoMs: decorridoMs(), iniciadoEm: null }
      });
    },
    alternar: function () {
      if (estado.relogio.rodando) relogio.pausar();
      else relogio.iniciar();
    },
    zerar: function () {
      atualizar({ relogio: { rodando: false, acumuladoMs: 0, iniciadoEm: null } });
    },
    /* Ajusta o tempo já decorrido. Minutos negativos devolvem tempo à mesa. */
    ajustar: function (minutos) {
      var alvo = Math.max(0, decorridoMs() + minutos * MINUTO);
      atualizar({
        relogio: {
          acumuladoMs: alvo,
          iniciadoEm: estado.relogio.rodando ? Date.now() : null
        }
      });
    },
    definirDuracao: function (minutos) {
      var ms = Math.max(MINUTO, Math.round(minutos) * MINUTO);
      atualizar({ relogio: { duracaoMs: ms } });
    }
  };

  /* --- pausas ------------------------------------------------------------ */

  function opcaoPausa(minutos) {
    for (var i = 0; i < PAUSAS.length; i += 1) {
      if (PAUSAS[i].minutos === minutos) return PAUSAS[i];
    }
    return null;
  }

  /* Quantas pausas daquele tamanho ainda cabem na sessão. null = ilimitado. */
  function pausasRestantes(minutos, algum) {
    var opcao = opcaoPausa(minutos);
    if (!opcao || opcao.limite === null) return null;
    var atual = algum || estado;
    return Math.max(0, opcao.limite - (atual.pausa.usadas[minutos] || 0));
  }

  function pausaAtiva(algum) {
    var atual = algum || estado;
    return atual.pausa.terminaEm !== null;
  }

  function restantePausaMs(algum) {
    var atual = algum || estado;
    if (!pausaAtiva(atual)) return 0;
    return atual.pausa.terminaEm - Date.now();
  }

  /* --- ações de mesa ----------------------------------------------------- */

  var acoes = {
    ajustarOuro: function (delta) {
      atualizar(function (atual) {
        return { ouro: Math.max(0, atual.ouro + delta) };
      });
    },
    definirOuro: function (valor) {
      atualizar({ ouro: Math.max(0, Math.round(valor) || 0) });
    },
    /* Cobra uma compra. Devolve false, sem gastar nada, se o ouro não cobrir. */
    gastarOuro: function (valor) {
      if (valor > estado.ouro) return false;
      atualizar({ ouro: estado.ouro - valor });
      return true;
    },
    /* id nulo devolve a tela do Relógio ao cronômetro puro. */
    definirExibicao: function (id, variante) {
      atualizar({ exibicao: { id: id || null, variante: variante || null } });
    },
    definirMecanica: function (chave, ligada) {
      var patch = {};
      patch[chave] = !!ligada;
      atualizar({ mecanicas: patch });
    },
    definirOfertaBencao: function (id, run) {
      atualizar({ ofertaBencao: { id: id, run: run, comprada: false } });
    },
    ajustarAbate: function (id, delta) {
      var abates = Object.assign({}, estado.abates);
      abates[id] = Math.max(0, (abates[id] || 0) + delta);
      atualizar({ abates: abates });
    },
    definirAbate: function (id, valor) {
      var abates = Object.assign({}, estado.abates);
      abates[id] = Math.max(0, Math.round(valor) || 0);
      atualizar({ abates: abates });
    },
    alternarLootDobrado: function (idEncontro) {
      var dobrado = Object.assign({}, estado.lootDobrado);
      dobrado[idEncontro] = !dobrado[idEncontro];
      atualizar({ lootDobrado: dobrado });
    },
    /* Zera cada chave em vez de trocar o objeto: `mesclar` funde objetos,
     * então um {} vazio deixaria os valores antigos de pé. */
    zerarAbates: function () {
      var abates = {};
      Object.keys(estado.abates).forEach(function (id) {
        abates[id] = 0;
      });
      var dobrado = {};
      Object.keys(estado.lootDobrado).forEach(function (id) {
        dobrado[id] = false;
      });
      atualizar({ abates: abates, lootDobrado: dobrado });
    },
    adicionarBencao: function (id) {
      if (!id) return;
      atualizar({
        bencaos: estado.bencaos.indexOf(id) >= 0 ? estado.bencaos : estado.bencaos.concat([id]),
        bencaosAdquiridas:
          estado.bencaosAdquiridas.indexOf(id) >= 0
            ? estado.bencaosAdquiridas
            : estado.bencaosAdquiridas.concat([id])
      });
    },
    removerBencao: function (id) {
      atualizar({
        bencaos: estado.bencaos.filter(function (item) {
          return item !== id;
        })
      });
    },
    marcarBencaoComprada: function () {
      atualizar({ ofertaBencao: { comprada: true } });
    },
    ajustarRun: function (delta) {
      atualizar(function (atual) {
        return { run: Math.max(1, atual.run + delta) };
      });
    },
    /* TPK: nova run, volta ao acampamento e libera a escolha da pausa. */
    registrarTpk: function () {
      atualizar(function (atual) {
        return {
          run: atual.run + 1,
          mortes: atual.mortes + 1,
          modo: "acampamento",
          pausa: { pendente: true }
        };
      });
    },
    /* Escolha do grupo. Congela o relógio da sessão enquanto durar a pausa. */
    escolherPausa: function (minutos) {
      var restantes = pausasRestantes(minutos);
      if (restantes === 0) return;

      var rodando = estado.relogio.rodando;
      if (rodando) relogio.pausar();

      atualizar(function (atual) {
        var usadas = Object.assign({}, atual.pausa.usadas);
        usadas[minutos] = (usadas[minutos] || 0) + 1;
        return {
          pausa: {
            pendente: false,
            duracaoMs: minutos * MINUTO,
            terminaEm: Date.now() + minutos * MINUTO,
            retomarRelogio: rodando,
            usadas: usadas
          }
        };
      });
    },
    /* Fim da pausa: o relógio volta a correr se estava correndo antes. */
    encerrarPausa: function () {
      var retomar = estado.pausa.retomarRelogio;
      atualizar({
        pausa: { pendente: false, terminaEm: null, duracaoMs: 0, retomarRelogio: false }
      });
      if (retomar) relogio.iniciar();
    },
    /* O grupo dispensou a pausa desta morte; nenhuma cota é consumida. */
    pularPausa: function () {
      atualizar({ pausa: { pendente: false } });
    },
    definirModo: function (id) {
      var alvo = id === "acampamento" ? "acampamento" : "dungeon";
      atualizar({ modo: alvo });
      if (alvo !== "dungeon") return;

      /* Mandar o grupo de volta à dungeon encerra a pausa em andamento e
       * descarta uma escolha de pausa que ainda não foi feita. */
      if (pausaAtiva()) acoes.encerrarPausa();
      else if (estado.pausa.pendente) acoes.pularPausa();
    },
    reiniciarTudo: function () {
      estado = estadoInicial();
      estado.atualizadoEm = carimbar();
      gravar();
      notificar("local");
    }
  };

  global.Dungeon = {
    MODOS_PAINEL: MODOS_PAINEL,
    PAUSAS: PAUSAS,
    LOJAS: LOJAS,
    PRECO_BAU: PRECO_BAU,
    DESCONTO_BENCAO: DESCONTO_BENCAO,
    lojaPorId: lojaPorId,
    DURACAO_PADRAO_MS: DURACAO_PADRAO_MS,
    get: function () {
      return estado;
    },
    atualizar: atualizar,
    /* Chama o callback imediatamente e a cada mudança; devolve o cancelador. */
    assinar: function (cb) {
      assinantes.push(cb);
      cb(estado, "inicial");
      return function () {
        assinantes = assinantes.filter(function (item) {
          return item !== cb;
        });
      };
    },
    relogio: relogio,
    acoes: acoes,
    decorridoMs: decorridoMs,
    restanteMs: restanteMs,
    pausaAtiva: pausaAtiva,
    restantePausaMs: restantePausaMs,
    pausasRestantes: pausasRestantes,
    formatarDuracao: formatarDuracao,
    formatarMinutos: formatarMinutos
  };
})(window);
