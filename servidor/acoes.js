/* Atalhos de mesa: transições de estado que o servidor aplica sozinho, sem
 * navegador no meio. Existem para virar botão físico (Steam Deck, teclado
 * macro, celular) e alcançar em um toque o que hoje exige achar o controle na
 * tela do Mestre.
 *
 * **Este arquivo repete de propósito a lógica de `webapp/js/state.js`.** Ele é
 * a segunda implementação das mesmas transições, e é a coisa mais frágil da
 * pasta: mudar `registrarTpk` ou `relogio.pausar` lá e esquecer daqui deixa o
 * atalho fazendo outra coisa que o botão da tela — divergência que só aparece
 * na mesa. Não havia como evitar sem carregar o `state.js` inteiro num `vm`
 * com `window` falso, o que traria os temporizadores e o `EventSource` dele
 * para dentro do servidor. Ao mexer numa transição, mexa nos dois lugares.
 *
 * A ordem das salas é a única coisa lida do front em vez de copiada
 * (`webapp/data/salas.js`), porque é a que mais muda.
 */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var MINUTO = 60 * 1000;

/* Cotas de pausa — cópia de PAUSAS em webapp/js/state.js. */
var PAUSAS = [
  { minutos: 5, limite: null },
  { minutos: 10, limite: 2 },
  { minutos: 30, limite: 1 }
];

/* --- salas: ordem lida do front ------------------------------------------ */

/* `salas.js` é um script de navegador (`window.SALAS = [...]`). Rodá-lo num
 * contexto com um `window` de mentira devolve a lista sem duplicar a ordem
 * aqui. Lido uma vez na subida: o servidor reinicia a cada deploy. */
function carregarSalas() {
  try {
    var arquivo = path.join(__dirname, "..", "webapp", "data", "salas.js");
    var contexto = { window: {} };
    vm.createContext(contexto);
    vm.runInContext(fs.readFileSync(arquivo, "utf8"), contexto, { timeout: 1000 });
    return (contexto.window.SALAS || []).map(function (sala) {
      return sala.id;
    });
  } catch (erro) {
    console.warn("[acoes] não consegui ler salas.js; sala/proxima fica fora", erro.message);
    return [];
  }
}

var ORDEM_SALAS = carregarSalas();

/* --- auxiliares ----------------------------------------------------------- */

function clonar(estado) {
  return JSON.parse(JSON.stringify(estado));
}

/* Espelha decorridoMs de state.js. No servidor o relógio de referência é o
 * próprio `Date.now()` — é dele que as telas tiram a correção. */
function decorridoMs(estado) {
  var r = estado.relogio;
  var extra = r.rodando && r.iniciadoEm ? Date.now() - r.iniciadoEm : 0;
  return Math.max(0, r.acumuladoMs + extra);
}

function pararRelogio(estado) {
  if (!estado.relogio.rodando) return;
  estado.relogio.acumuladoMs = decorridoMs(estado);
  estado.relogio.rodando = false;
  estado.relogio.iniciadoEm = null;
}

function iniciarRelogio(estado) {
  if (estado.relogio.rodando) return;
  estado.relogio.rodando = true;
  estado.relogio.iniciadoEm = Date.now();
}

function zerarChaves(objeto) {
  var saida = {};
  Object.keys(objeto || {}).forEach(function (chave) {
    saida[chave] = 0;
  });
  return saida;
}

function inteiro(valor, padrao) {
  var n = Number(valor);
  return Number.isFinite(n) ? Math.round(n) : padrao;
}

/* --- ações ---------------------------------------------------------------- */

/* Cada ação recebe o estado já clonado e o modifica no lugar. Devolver `false`
 * significa "nada a fazer" — o servidor responde sem gravar nem publicar, para
 * um botão repetido não gerar tráfego à toa. */
var ACOES = {
  "relogio/alternar": {
    resumo: "Inicia ou pausa o cronômetro da sessão.",
    aplicar: function (estado) {
      if (estado.relogio.rodando) pararRelogio(estado);
      else iniciarRelogio(estado);
    }
  },

  "relogio/iniciar": {
    resumo: "Inicia o cronômetro, se estiver parado.",
    aplicar: function (estado) {
      if (estado.relogio.rodando) return false;
      iniciarRelogio(estado);
    }
  },

  "relogio/pausar": {
    resumo: "Pausa o cronômetro, se estiver correndo.",
    aplicar: function (estado) {
      if (!estado.relogio.rodando) return false;
      pararRelogio(estado);
    }
  },

  "relogio/zerar": {
    resumo: "Volta o cronômetro a zero e o deixa parado.",
    aplicar: function (estado) {
      estado.relogio.rodando = false;
      estado.relogio.acumuladoMs = 0;
      estado.relogio.iniciadoEm = null;
    }
  },

  "relogio/ajustar": {
    resumo: "Soma minutos ao tempo decorrido. Negativo devolve tempo à mesa.",
    parametros: "minutos",
    aplicar: function (estado, params) {
      var minutos = inteiro(params.minutos, 0);
      if (!minutos) return false;
      estado.relogio.acumuladoMs = Math.max(0, decorridoMs(estado) + minutos * MINUTO);
      estado.relogio.iniciadoEm = estado.relogio.rodando ? Date.now() : null;
    }
  },

  tpk: {
    resumo: "Registra um TPK: nova run, volta ao acampamento, libera a pausa.",
    aplicar: function (estado) {
      estado.run += 1;
      estado.mortes += 1;
      estado.modo = "acampamento";
      /* A dungeon reinicia com o grupo (aventura.md §4). */
      estado.danos = zerarChaves(estado.danos);
      estado.pausa.pendente = true;
    }
  },

  "modo/alternar": {
    resumo: "Troca a tela dos Jogadores entre dungeon e acampamento.",
    aplicar: function (estado) {
      definirModo(estado, estado.modo === "dungeon" ? "acampamento" : "dungeon");
    }
  },

  "modo/definir": {
    resumo: "Manda a tela dos Jogadores para dungeon ou acampamento.",
    parametros: "id (dungeon | acampamento)",
    aplicar: function (estado, params) {
      var alvo = params.id === "acampamento" ? "acampamento" : "dungeon";
      if (estado.modo === alvo) return false;
      definirModo(estado, alvo);
    }
  },

  "sala/limpar": {
    resumo: "Desmarca a sala atual — tira o nome do Relógio e corta a trilha.",
    aplicar: function (estado) {
      if (!estado.sala) return false;
      estado.sala = null;
    }
  },

  "sala/definir": {
    resumo: "Marca uma sala pelo id de webapp/data/salas.js.",
    parametros: "id (" + ORDEM_SALAS.join(" | ") + ")",
    aplicar: function (estado, params) {
      if (ORDEM_SALAS.indexOf(params.id) === -1) {
        return { erro: "sala desconhecida: " + params.id };
      }
      if (estado.sala === params.id) return false;
      estado.sala = params.id;
    }
  },

  "sala/proxima": {
    resumo: "Avança para a próxima sala do fluxo da aventura.",
    aplicar: function (estado) {
      return andarSala(estado, 1);
    }
  },

  "sala/anterior": {
    resumo: "Volta para a sala anterior do fluxo.",
    aplicar: function (estado) {
      return andarSala(estado, -1);
    }
  },

  "ouro/ajustar": {
    resumo: "Soma (ou tira) ouro do grupo.",
    parametros: "delta",
    aplicar: function (estado, params) {
      var delta = inteiro(params.delta, 0);
      if (!delta) return false;
      estado.ouro = Math.max(0, estado.ouro + delta);
    }
  },

  "run/ajustar": {
    resumo: "Corrige o número da tentativa sem contar como morte.",
    parametros: "delta",
    aplicar: function (estado, params) {
      var delta = inteiro(params.delta, 0);
      if (!delta) return false;
      estado.run = Math.max(1, estado.run + delta);
    }
  },

  "pausa/escolher": {
    resumo: "Começa a pausa de 5, 10 ou 30 minutos e congela o cronômetro.",
    parametros: "minutos (5 | 10 | 30)",
    aplicar: function (estado, params) {
      var minutos = inteiro(params.minutos, 0);
      var opcao = PAUSAS.filter(function (p) {
        return p.minutos === minutos;
      })[0];
      if (!opcao) return { erro: "pausa inválida: use 5, 10 ou 30" };

      var usadas = estado.pausa.usadas[minutos] || 0;
      if (opcao.limite !== null && usadas >= opcao.limite) {
        return { erro: "cota de pausas de " + minutos + " min esgotada" };
      }

      var rodando = estado.relogio.rodando;
      pararRelogio(estado);

      estado.pausa.pendente = false;
      estado.pausa.duracaoMs = minutos * MINUTO;
      estado.pausa.terminaEm = Date.now() + minutos * MINUTO;
      estado.pausa.retomarRelogio = rodando;
      estado.pausa.usadas[minutos] = usadas + 1;
    }
  },

  "pausa/encerrar": {
    resumo: "Encerra a pausa; o cronômetro volta se estava correndo antes.",
    aplicar: function (estado) {
      var retomar = estado.pausa.retomarRelogio;
      estado.pausa.pendente = false;
      estado.pausa.terminaEm = null;
      estado.pausa.duracaoMs = 0;
      estado.pausa.retomarRelogio = false;
      if (retomar) iniciarRelogio(estado);
    }
  },

  "vidas/restaurar": {
    resumo: "Devolve o PV cheio às criaturas da sala marcada.",
    aplicar: function (estado) {
      if (!estado.sala) return { erro: "nenhuma sala marcada" };
      var prefixo = estado.sala + ":";
      var mexeu = false;
      Object.keys(estado.danos).forEach(function (chave) {
        if (chave.indexOf(prefixo) === 0 && estado.danos[chave] !== 0) {
          estado.danos[chave] = 0;
          mexeu = true;
        }
      });
      if (!mexeu) return false;
    }
  },

  rolar: {
    resumo: "Joga um dado avulso — aparece em 3D na tela do Relógio.",
    parametros: "dados (ex.: 1d20), bonus, rotulo",
    aplicar: function (estado, params) {
      var achado = /^(\d*)d(\d+)$/i.exec(String(params.dados || "1d20").trim());
      if (!achado) return { erro: "notação inválida: use 1d20, 2d6…" };

      var qtd = Math.min(20, Math.max(1, Number(achado[1] || 1)));
      var lados = Math.min(100, Math.max(2, Number(achado[2])));
      var bonus = inteiro(params.bonus, 0);
      var rotulo = params.rotulo || "Dado";

      /* Mesmo formato que `pedirRolagem` de state.js monta — é o que a tela do
       * Relógio (js/dados-3d.js) espera para animar e depois resolver. */
      estado.rolagem = {
        id: ["Mesa", rotulo, qtd + "d" + lados, Date.now()].join(":"),
        monstro: "Mesa",
        apelido: null,
        acao: qtd + "d" + lados + (bonus ? (bonus > 0 ? "+" : "") + bonus : ""),
        rotulo: rotulo,
        qtd: qtd,
        lados: lados,
        bonus: bonus,
        tipo: null,
        status: "pendente",
        dados: null,
        resultado: null
      };
    }
  }
};

/* --- transições compartilhadas -------------------------------------------- */

/* Espelha definirModo de state.js, inclusive o efeito colateral: voltar para a
 * dungeon encerra a pausa em andamento e descarta a escolha ainda não feita. */
function definirModo(estado, alvo) {
  estado.modo = alvo;
  if (alvo !== "dungeon") return;

  if (estado.pausa.terminaEm !== null) {
    var retomar = estado.pausa.retomarRelogio;
    estado.pausa.pendente = false;
    estado.pausa.terminaEm = null;
    estado.pausa.duracaoMs = 0;
    estado.pausa.retomarRelogio = false;
    if (retomar) iniciarRelogio(estado);
  } else if (estado.pausa.pendente) {
    estado.pausa.pendente = false;
  }
}

/* Anda no fluxo da aventura. Sem sala marcada, o primeiro passo cai na
 * primeira sala — é o que faz um botão só servir para começar e para avançar. */
function andarSala(estado, passo) {
  if (!ORDEM_SALAS.length) return { erro: "ordem de salas indisponível" };

  var atual = ORDEM_SALAS.indexOf(estado.sala);
  if (atual === -1) {
    estado.sala = ORDEM_SALAS[passo > 0 ? 0 : ORDEM_SALAS.length - 1];
    return;
  }

  var alvo = atual + passo;
  if (alvo < 0 || alvo >= ORDEM_SALAS.length) {
    return { erro: passo > 0 ? "já está na última sala" : "já está na primeira sala" };
  }
  estado.sala = ORDEM_SALAS[alvo];
}

/* --- fachada -------------------------------------------------------------- */

function lista() {
  return Object.keys(ACOES)
    .sort()
    .map(function (nome) {
      return {
        acao: nome,
        resumo: ACOES[nome].resumo,
        parametros: ACOES[nome].parametros || null
      };
    });
}

/* Devolve `{ estado }` com o estado novo, `{ semMudanca: true }` quando a ação
 * não teve efeito, ou `{ erro }`. Nunca modifica o estado recebido. */
function aplicar(nome, estado, params) {
  var acao = ACOES[nome];
  if (!acao) return { erro: "ação desconhecida: " + nome };
  /* Uma tela recém-aberta e intocada não semeia o servidor (é a trava que
   * impede uma aba nova de apagar a sessão em andamento — ver state.js). Então
   * "sem estado" pode acontecer com o painel aberto na frente do mestre, e a
   * mensagem precisa dizer o que destrava: mexer em qualquer coisa uma vez. */
  if (!estado) {
    return { erro: "o painel ainda não gravou nada nesta versão — mexa em algo nele uma vez" };
  }

  var copia = clonar(estado);
  var saida = acao.aplicar(copia, params || {});

  if (saida && saida.erro) return { erro: saida.erro };
  if (saida === false) return { semMudanca: true, estado: estado };

  return { estado: copia };
}

module.exports = { lista: lista, aplicar: aplicar, ORDEM_SALAS: ORDEM_SALAS };
