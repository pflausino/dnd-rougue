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

  var CHAVE = "ultima-dungeon:estado";
  var NOME_CANAL = "ultima-dungeon";
  var INTERVALO_POLL = 500;

  var MINUTO = 60 * 1000;
  var HORA = 60 * MINUTO;

  /* A tela dos Jogadores tem só dois modos: o grupo está na dungeon ou no
   * acampamento entre as runs, onde as lojas ficam abertas. */
  var MODOS_PAINEL = [
    { id: "dungeon", nome: "Dungeon" },
    { id: "acampamento", nome: "Acampamento" }
  ];

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
      versao: 3,
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
      if (!salvo || salvo.versao !== 3) return estadoInicial();
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

  /* Compara o conteúdo, não só o carimbo: é a garantia final de convergência. */
  function receberExterno(novo) {
    if (!novo || JSON.stringify(novo) === JSON.stringify(estado)) return;
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
      atualizar({ modo: id === "acampamento" ? "acampamento" : "dungeon" });
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
