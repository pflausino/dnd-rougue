/* Estado compartilhado entre as telas Mestre, Jogadores e Relógio.
 *
 * O estado vive em localStorage e é propagado por quatro vias, para funcionar
 * abrindo os arquivos direto no navegador, num servidor local ou no VPS:
 *   1. BroadcastChannel (imediato, quando disponível);
 *   2. evento `storage` (outras abas da mesma origem);
 *   3. polling de 500 ms (rede de segurança em file://);
 *   4. servidor (SSE para receber, POST para enviar).
 *
 * As três primeiras só alcançam abas do mesmo navegador. A quarta é o que
 * permite o Mestre no notebook e os Jogadores na TV: quando a página vem por
 * http(s), o servidor é a autoridade e o localStorage passa a ser só o cache
 * local — de onde a tela parte enquanto a conexão não sobe.
 */
(function (global) {
  "use strict";

  /* A versão entra na chave, no canal e na rota da API: telas de versões
   * diferentes (uma aba antiga que ficou aberta, por exemplo) não disputam o
   * mesmo estado. */
  var VERSAO = 13;
  var CHAVE = "ultima-dungeon:estado:v" + VERSAO;
  var NOME_CANAL = "ultima-dungeon:v" + VERSAO;
  var INTERVALO_POLL = 500;

  /* Em file:// não há servidor para conversar; as três vias locais bastam. */
  var REMOTO =
    global.location &&
    (global.location.protocol === "http:" || global.location.protocol === "https:");

  /* A API é irmã de webapp/, e não fixa na raiz, para o painel continuar
   * funcionando se um dia for servido sob um subcaminho (`/dungeon/webapp/`). */
  var BASE_API = (function () {
    if (!REMOTO) return null;
    var caminho = global.location.pathname;
    var pasta = caminho.indexOf("/webapp/") >= 0 ? caminho.replace(/\/webapp\/.*$/, "") : "";
    return pasta + "/api";
  })();

  /* Espera antes de enviar ao servidor. Uma rajada de cliques (+5, +5, +5)
   * viraria um POST por clique; coalescer manda só o estado final. */
  var ESPERA_ENVIO = 40;

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
      /* Onde o grupo está agora, por id de data/salas.js. É o que a tela do
       * Relógio nomeia e de onde ela tira a trilha. null = sala não indicada. */
      sala: null,
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
      /* Formas que a tela de Projeção joga na mesa pelo projetor, na ordem em
       * que foram criadas — a última desenhada é a que fica por cima.
       *
       * As posições são frações da largura/altura do canvas e os tamanhos,
       * frações só da **altura**. A tela do mestre e a do projetor quase nunca
       * têm a mesma proporção; medindo tudo pela altura, um círculo continua
       * redondo nas duas e a forma cai no mesmo ponto relativo. */
      projecao: {
        fundo: "#ffffff",
        /* Interruptor geral do que sai no projetor. Escondido, a tela de
         * Projeção mostra só o fundo e a do Projetor segue mostrando as formas
         * apagadas — o mestre arruma a próxima marcação fora da vista da mesa
         * e revela quando quiser. */
        visivel: true,
        formas: []
      },
      /* Bênçãos em posse do grupo, por id, na ordem de aquisição. */
      bencaos: [],
      /* Tudo que já foi comprado alguma vez. Os consumíveis saem de `bencaos`
       * ao serem usados, mas seguem aqui — é o histórico que libera os
       * pergaminhos em escada. */
      bencaosAdquiridas: [],
      /* Contagem de abates da run, por id de inimigo, para o cálculo do loot. */
      abates: {},
      /* Dano sofrido por cada criatura em campo, por chave
       * "<encontro>:<idMonstro>:<índice>" — o Ghast nº 3 da Sala do Ritual é
       * "ritual:ghast:2".
       *
       * Guarda o dano acumulado, não o PV restante, por dois motivos: o PV
       * cheio já vem de data/monstros.js (não precisa ser copiado para cá), e
       * zerar vira escrever `0` em cada chave — que é o que `mesclar` exige,
       * já que um `{}` vazio não limparia nada (ver zerarAbates). */
      danos: {},
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
      },
      /* Última rolagem pedida na tela de Monstros. "pendente" = ainda sem
       * resultado; a tela do Relógio (dado 3D) ou, na falta dela, quem pediu
       * é que preenche `dados`/`resultado` e vira "resolvida". null = nenhuma
       * rolagem ainda, ou a última já foi de uma versão anterior do formato. */
      rolagem: null
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

  /* Diferença entre o relógio do servidor e o desta máquina. Com as telas em
   * dispositivos diferentes, um relógio atrasado faria o cronômetro da sessão
   * mostrar um tempo diferente em cada tela — todo instante do estado passa por
   * `agora()` para que todas contem pelo mesmo relógio. */
  var desvioServidor = 0;

  function agora() {
    return Date.now() + desvioServidor;
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

  function persistirLocal() {
    try {
      global.localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (erro) {
      console.warn("[estado] não foi possível gravar", erro);
    }
  }

  function gravar() {
    persistirLocal();
    if (canal) canal.postMessage({ tipo: "estado", estado: estado });
    publicarRemoto();
  }

  /* Carimbo monotônico: duas gravações no mesmo milissegundo precisam de
   * valores diferentes, senão a outra aba descarta a segunda. */
  var ultimoCarimbo = 0;

  function carimbar() {
    var instante = agora();
    ultimoCarimbo = instante > ultimoCarimbo ? instante : ultimoCarimbo + 1;
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
    /* Guarda o que veio de fora: sem isso, um F5 voltaria ao último estado que
     * *esta* tela gravou, descartando o que as outras fizeram desde então. */
    persistirLocal();
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

  /* --- servidor ----------------------------------------------------------- */

  /* Estado da conexão, para as telas avisarem quando a sincronização cai.
   * `ativo: false` é o modo file:// ou local, em que não há nada a monitorar. */
  var conexao = { ativo: !!REMOTO, ligado: false, erro: null };
  var assinantesConexao = [];

  function anunciarConexao(ligado, erro) {
    if (conexao.ligado === ligado && conexao.erro === (erro || null)) return;
    conexao.ligado = ligado;
    conexao.erro = erro || null;
    assinantesConexao.forEach(function (cb) {
      try {
        cb(conexao);
      } catch (falha) {
        console.error("[estado] assinante de conexão falhou", falha);
      }
    });
  }

  var envioAgendado = null;

  function publicarRemoto() {
    if (!REMOTO || envioAgendado) return;
    envioAgendado = global.setTimeout(function () {
      envioAgendado = null;
      enviarAoServidor();
    }, ESPERA_ENVIO);
  }

  function enviarAoServidor() {
    global
      .fetch(BASE_API + "/estado?v=" + VERSAO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(estado)
      })
      .then(function (resposta) {
        if (!resposta.ok) throw new Error("HTTP " + resposta.status);
        return resposta.json();
      })
      .then(function (corpo) {
        if (corpo && typeof corpo.servidorEm === "number") {
          desvioServidor = corpo.servidorEm - Date.now();
        }
        anunciarConexao(true, null);
      })
      .catch(function (erro) {
        anunciarConexao(false, String(erro.message || erro));
      });
  }

  function abrirFluxo() {
    if (!REMOTO || typeof global.EventSource !== "function") return;

    var fonte = new global.EventSource(BASE_API + "/eventos?v=" + VERSAO);

    fonte.addEventListener("open", function () {
      anunciarConexao(true, null);
    });

    fonte.addEventListener("estado", function (evento) {
      var corpo;
      try {
        corpo = JSON.parse(evento.data);
      } catch (erro) {
        return;
      }
      anunciarConexao(true, null);
      if (typeof corpo.servidorEm === "number") {
        desvioServidor = corpo.servidorEm - Date.now();
      }

      /* Servidor sem estado: primeira tela a abrir semeia o dele com o que tem
       * em cache. É também o caminho de recuperação se o servidor reiniciar sem
       * o arquivo. Um estado intocado (`atualizadoEm` zero) não semeia nada —
       * senão uma tela recém-aberta apagaria a sessão em andamento. */
      if (!corpo.estado) {
        if (estado.atualizadoEm > 0) enviarAoServidor();
        return;
      }

      receberExterno(corpo.estado);
    });

    /* O EventSource reconecta sozinho; o handler existe só para a tela saber
     * que está desconectada enquanto isso. */
    fonte.addEventListener("error", function () {
      if (fonte.readyState !== global.EventSource.OPEN) {
        anunciarConexao(false, "sem conexão com o servidor");
      }
    });
  }

  abrirFluxo();

  /* --- relógio ----------------------------------------------------------- */

  function decorridoMs(algum) {
    var atual = algum || estado;
    var r = atual.relogio;
    var extra = r.rodando && r.iniciadoEm ? agora() - r.iniciadoEm : 0;
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
      atualizar({ relogio: { rodando: true, iniciadoEm: agora() } });
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
          iniciadoEm: estado.relogio.rodando ? agora() : null
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
    return atual.pausa.terminaEm - agora();
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
    /* Sala onde o grupo está. Clicar na mesma sala de novo desmarca — é como o
     * mestre corta a trilha sem ter de escolher outra sala. */
    definirSala: function (id) {
      atualizar({ sala: id === estado.sala ? null : id || null });
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
    /* Soma dano (delta positivo) ou cura (negativo) numa criatura. `maximo` é
     * o PV cheio dela: sem ele o dano cresceria sem fim depois de a criatura
     * já ter caído, e um "+1" depois disso levaria vários cliques para voltar
     * a mexer no PV visível. */
    ajustarDano: function (chave, delta, maximo) {
      var danos = Object.assign({}, estado.danos);
      var alvo = (danos[chave] || 0) + delta;
      if (alvo < 0) alvo = 0;
      if (typeof maximo === "number" && alvo > maximo) alvo = maximo;
      danos[chave] = alvo;
      atualizar({ danos: danos });
    },
    /* Sem `chaves`, restaura tudo. Com, restaura só aquelas — é como a tela de
     * Monstros restaura uma sala sem mexer nas outras. Escreve `0` em cada
     * chave em vez de trocar o objeto: `mesclar` funde, então `{}` não limpa. */
    zerarDanos: function (chaves) {
      var danos = {};
      (chaves || Object.keys(estado.danos)).forEach(function (chave) {
        danos[chave] = 0;
      });
      atualizar({ danos: danos });
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
        /* A dungeon reinicia com o grupo (referencias/aventura.md §4), então o
         * dano dos monstros vai junto. Cada chave a `0`, nunca `{}`. */
        var danos = {};
        Object.keys(atual.danos).forEach(function (chave) {
          danos[chave] = 0;
        });
        return {
          run: atual.run + 1,
          mortes: atual.mortes + 1,
          modo: "acampamento",
          danos: danos,
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
            terminaEm: agora() + minutos * MINUTO,
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
    /* --- projeção na mesa ------------------------------------------------ */

    /* Devolve o id para quem criou já sair arrastando a forma nova. `agora()`
     * entra no id porque dois cliques no mesmo botão dentro do mesmo
     * milissegundo precisam de ids diferentes. */
    adicionarForma: function (forma) {
      var id = "f" + agora() + "-" + Math.round(Math.random() * 1e6);
      var lista = estado.projecao.formas.concat([Object.assign({ id: id }, forma)]);
      atualizar({ projecao: { formas: lista } });
      return id;
    },
    /* `mesclar` funde objetos mas troca arrays inteiros, então a forma alterada
     * é reconstruída aqui e a lista vai completa. */
    ajustarForma: function (id, patch) {
      var lista = estado.projecao.formas.map(function (forma) {
        return forma.id === id ? Object.assign({}, forma, patch) : forma;
      });
      atualizar({ projecao: { formas: lista } });
    },
    removerForma: function (id) {
      var lista = estado.projecao.formas.filter(function (forma) {
        return forma.id !== id;
      });
      atualizar({ projecao: { formas: lista } });
    },
    limparProjecao: function () {
      atualizar({ projecao: { formas: [] } });
    },
    definirFundoProjecao: function (cor) {
      atualizar({ projecao: { fundo: cor } });
    },
    alternarProjecao: function () {
      atualizar({ projecao: { visivel: estado.projecao.visivel === false } });
    },
    reiniciarTudo: function () {
      estado = estadoInicial();
      estado.atualizadoEm = carimbar();
      gravar();
      notificar("local");
    },
    /* Pede uma rolagem (dado da ficha de monstro + bônus). Devolve o id para
     * quem pediu casar com `resolverRolagem` — inclui `agora()` porque dois
     * cliques rápidos no mesmo botão precisam de ids diferentes. Quem resolve
     * de fato é a tela do Relógio, com o dado 3D; sem ela conectada, quem
     * pediu tem um retorno próprio via Math.random(). */
    pedirRolagem: function (detalhe) {
      var id = [detalhe.monstro, detalhe.acao, detalhe.rotulo, agora()].join(":");
      atualizar({
        rolagem: {
          id: id,
          monstro: detalhe.monstro,
          apelido: detalhe.apelido || null,
          acao: detalhe.acao,
          rotulo: detalhe.rotulo,
          qtd: detalhe.qtd,
          lados: detalhe.lados,
          bonus: detalhe.bonus || 0,
          tipo: detalhe.tipo || null,
          status: "pendente",
          dados: null,
          resultado: null
        }
      });
      return id;
    },
    /* Trava a rolagem em "animando": o dado 3D já carregou e está de fato
     * caindo. Sem isso, o retorno local de quem pediu (js/monstros.js) pode
     * destravar a rolagem enquanto o dado real ainda está no ar — o dado
     * termina de rolar do mesmo jeito (a física já começou, não dá pra
     * cancelar), só que a face que ele mostra não vai bater com o número que
     * o retorno local gravou por cima. "animando" impede o retorno local de
     * agir enquanto o dado de verdade está em voo. */
    marcarRolagemAnimando: function (id) {
      if (!estado.rolagem || estado.rolagem.id !== id || estado.rolagem.status !== "pendente") {
        return false;
      }
      atualizar({ rolagem: { status: "animando" } });
      return true;
    },
    /* Resolve uma rolagem "pendente" ou "animando" — nunca uma já resolvida.
     * Evita que uma segunda tela de Relógio, ou um retorno atrasado,
     * sobrescreva o resultado já mostrado. */
    resolverRolagem: function (id, dados, resultado) {
      if (
        !estado.rolagem ||
        estado.rolagem.id !== id ||
        (estado.rolagem.status !== "pendente" && estado.rolagem.status !== "animando")
      ) {
        return false;
      }
      atualizar({ rolagem: { status: "resolvida", dados: dados, resultado: resultado } });
      return true;
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
    /* Relógio ajustado ao do servidor; use em vez de `Date.now()`. */
    agora: agora,
    conexao: function () {
      return conexao;
    },
    /* Como `assinar`, mas para o estado da conexão com o servidor. */
    assinarConexao: function (cb) {
      assinantesConexao.push(cb);
      cb(conexao);
      return function () {
        assinantesConexao = assinantesConexao.filter(function (item) {
          return item !== cb;
        });
      };
    },
    decorridoMs: decorridoMs,
    restanteMs: restanteMs,
    pausaAtiva: pausaAtiva,
    restantePausaMs: restantePausaMs,
    pausasRestantes: pausasRestantes,
    formatarDuracao: formatarDuracao,
    formatarMinutos: formatarMinutos
  };
})(window);
