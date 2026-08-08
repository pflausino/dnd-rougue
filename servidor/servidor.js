/* Servidor de A Última Dungeon.
 *
 * Duas responsabilidades:
 *   1. servir os arquivos estáticos do painel;
 *   2. guardar o estado da sessão e propagá-lo por SSE.
 *
 * O (2) é o que localStorage e BroadcastChannel não davam: eles só alcançam
 * abas do mesmo navegador, então o Mestre no notebook e a tela dos Jogadores na
 * TV viviam sessões separadas. Aqui o servidor é a autoridade e cada tela
 * recebe as mudanças das outras.
 *
 * Sem dependências: só a biblioteca padrão do Node.
 */
"use strict";

var http = require("http");
var fs = require("fs");
var path = require("path");

var PORTA = Number(process.env.PORTA || 8777);
var ENDERECO = process.env.ENDERECO || "0.0.0.0";
var RAIZ = path.resolve(process.env.RAIZ || path.join(__dirname, ".."));
var ARQUIVO_ESTADO = path.resolve(
  process.env.ARQUIVO_ESTADO || path.join(__dirname, "estado.json")
);

/* Só estes diretórios são servidos. Mantém referencias/, .git/ e as notas de
 * agente fora do alcance de quem descobrir a URL — o painel não precisa deles. */
var DIRETORIOS_PUBLICOS = ["webapp", "loja"];

/* Teto do corpo de um POST. O estado inteiro cabe em poucos KB; o limite existe
 * só para o servidor não engolir um corpo infinito. */
var LIMITE_CORPO = 256 * 1024;

/* Prazo para o corpo de um POST chegar inteiro. Ver `servidor.requestTimeout`. */
var LIMITE_TEMPO_CORPO = 15 * 1000;

/* Comentário SSE periódico. Sem tráfego, proxy e navegador derrubam a conexão
 * por inatividade — o EventSource reconecta, mas cada queda é um buraco de
 * alguns segundos na sincronização. */
var INTERVALO_PULSO = 20 * 1000;

var TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".md": "text/plain; charset=utf-8",
  /* Sem este tipo o Chrome recusa o manifesto e a tela dos Jogadores deixa de
   * ser instalável — sem erro visível, só some a opção de instalar. */
  ".webmanifest": "application/manifest+json; charset=utf-8",
  /* dice-box (webapp/assets/dice-box/) carrega isto via WebAssembly.instantiateStreaming,
   * que exige o Content-Type correto — sem ele cai num caminho mais lento e,
   * em alguns navegadores, falha. */
  ".wasm": "application/wasm"
};

/* --- estado -------------------------------------------------------------- */

/* Um estado por versão de formato, espelhando a chave versionada do
 * localStorage: uma aba com o código antigo ainda aberta não disputa o estado
 * novo, ela só fica surda até recarregar. */
var estados = carregar();

function carregar() {
  try {
    var bruto = fs.readFileSync(ARQUIVO_ESTADO, "utf8");
    var salvo = JSON.parse(bruto);
    return salvo && typeof salvo === "object" ? salvo : {};
  } catch (erro) {
    /* Arquivo ausente na primeira execução é o caso normal, não um problema. */
    if (erro.code !== "ENOENT") {
      console.warn("[estado] não foi possível ler " + ARQUIVO_ESTADO, erro.message);
    }
    return {};
  }
}

/* A gravação é adiada: uma rajada de cliques (o ouro em +5, +5, +5) viraria uma
 * gravação por clique. O que importa é sobreviver a um restart, não cada passo. */
var gravacaoAgendada = null;

function agendarGravacao() {
  if (gravacaoAgendada) return;
  gravacaoAgendada = setTimeout(function () {
    gravacaoAgendada = null;
    try {
      var temporario = ARQUIVO_ESTADO + ".tmp";
      fs.writeFileSync(temporario, JSON.stringify(estados));
      /* Rename é atômico no mesmo sistema de arquivos: um crash no meio da
       * escrita não deixa um JSON truncado no lugar do estado bom. */
      fs.renameSync(temporario, ARQUIVO_ESTADO);
    } catch (erro) {
      console.error("[estado] falha ao gravar", erro.message);
    }
  }, 500);
  gravacaoAgendada.unref();
}

/* --- ouvintes SSE -------------------------------------------------------- */

var ouvintes = [];

function inscrever(versao, resposta) {
  var ouvinte = { versao: versao, resposta: resposta };
  ouvintes.push(ouvinte);
  resposta.on("close", function () {
    ouvintes = ouvintes.filter(function (item) {
      return item !== ouvinte;
    });
  });
  return ouvinte;
}

function enviarEvento(resposta, nome, dados) {
  try {
    resposta.write("event: " + nome + "\n");
    resposta.write("data: " + JSON.stringify(dados) + "\n\n");
  } catch (erro) {
    /* Conexão já morta; o handler de close limpa a lista. */
  }
}

/* Publica para todas as telas daquela versão, inclusive quem enviou. O cliente
 * descarta o próprio eco comparando o conteúdo, então o reenvio é inofensivo e
 * evita ter de identificar as conexões. */
function publicar(versao, estado) {
  ouvintes.forEach(function (ouvinte) {
    if (ouvinte.versao !== versao) return;
    enviarEvento(ouvinte.resposta, "estado", { estado: estado, servidorEm: Date.now() });
  });
}

setInterval(function () {
  ouvintes.forEach(function (ouvinte) {
    try {
      ouvinte.resposta.write(": pulso\n\n");
    } catch (erro) {
      /* idem */
    }
  });
}, INTERVALO_PULSO).unref();

/* --- respostas ----------------------------------------------------------- */

function responderJson(resposta, codigo, corpo) {
  var texto = JSON.stringify(corpo);
  resposta.writeHead(codigo, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(texto),
    "Cache-Control": "no-store"
  });
  resposta.end(texto);
}

function responderTexto(resposta, codigo, texto) {
  resposta.writeHead(codigo, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  resposta.end(texto);
}

/* --- estático ------------------------------------------------------------ */

/* Resolve o caminho pedido dentro de RAIZ e recusa o que sair dos diretórios
 * públicos. `path.resolve` já normaliza `..`; a checagem de prefixo é o que
 * impede `/webapp/../.git/config`. */
function resolverArquivo(caminho) {
  var partes = caminho.split("/").filter(Boolean).map(decodeURIComponent);
  if (!partes.length) return null;
  if (DIRETORIOS_PUBLICOS.indexOf(partes[0]) < 0) return null;
  if (
    partes.some(function (parte) {
      return parte.charAt(0) === ".";
    })
  ) {
    return null;
  }

  var alvo = path.resolve(path.join.apply(path, [RAIZ].concat(partes)));
  var permitido = path.join(RAIZ, partes[0]) + path.sep;
  if (alvo !== path.join(RAIZ, partes[0]) && alvo.indexOf(permitido) !== 0) return null;
  return alvo;
}

/* `bytes=inicio-fim`, com qualquer das pontas omitida. Devolve null para o que
 * não for uma faixa simples: múltiplas faixas e sufixos malformados caem no
 * 200 inteiro, que é resposta válida para um Range que o servidor não atende. */
function faixaPedida(cabecalho, tamanho) {
  var achado = /^bytes=(\d*)-(\d*)$/.exec((cabecalho || "").trim());
  if (!achado) return null;

  var temInicio = achado[1] !== "";
  var temFim = achado[2] !== "";
  if (!temInicio && !temFim) return null;

  var inicio;
  var fim;
  if (!temInicio) {
    /* `bytes=-500`: os últimos 500 bytes. */
    inicio = Math.max(0, tamanho - Number(achado[2]));
    fim = tamanho - 1;
  } else {
    inicio = Number(achado[1]);
    fim = temFim ? Math.min(Number(achado[2]), tamanho - 1) : tamanho - 1;
  }

  if (inicio > fim || inicio >= tamanho) return { invalida: true };
  return { inicio: inicio, fim: fim };
}

function servirEstatico(caminho, resposta, faixaBruta) {
  var alvo = resolverArquivo(caminho);
  if (!alvo) return responderTexto(resposta, 404, "não encontrado");

  fs.stat(alvo, function (erro, info) {
    if (erro) return responderTexto(resposta, 404, "não encontrado");

    if (info.isDirectory()) {
      /* Diretório sem barra final quebraria os caminhos relativos das páginas
       * (`css/app.css` viria de um nível acima). Redireciona antes de servir. */
      if (caminho.charAt(caminho.length - 1) !== "/") {
        resposta.writeHead(301, { Location: caminho + "/" });
        return resposta.end();
      }
      return servirEstatico(caminho + "index.html", resposta, faixaBruta);
    }

    var extensao = path.extname(alvo).toLowerCase();
    var etag = '"' + info.size.toString(36) + "-" + info.mtimeMs.toString(36) + '"';

    /* `no-cache` revalida sempre, e o ETag faz a revalidação custar um 304.
     * Cache heurístico do Chrome já custou tempo de caça a "bug" que era JS
     * velho — para seis pessoas numa mesa, o tráfego extra não pesa.
     *
     * `Accept-Ranges` existe pelas trilhas: o Safari recusa tocar mídia de um
     * servidor que não atende Range, e o Chrome precisa dele para rebobinar a
     * faixa no loop sem baixar tudo de novo. */
    var cabecalhos = {
      "Content-Type": TIPOS[extensao] || "application/octet-stream",
      "Cache-Control": "no-cache",
      "Accept-Ranges": "bytes",
      ETag: etag
    };

    if (resposta.reqEtag === etag) {
      resposta.writeHead(304, cabecalhos);
      return resposta.end();
    }

    var faixa = faixaPedida(faixaBruta, info.size);

    if (faixa && faixa.invalida) {
      cabecalhos["Content-Range"] = "bytes */" + info.size;
      resposta.writeHead(416, cabecalhos);
      return resposta.end();
    }

    var opcoes = {};
    if (faixa) {
      opcoes = { start: faixa.inicio, end: faixa.fim };
      cabecalhos["Content-Range"] = "bytes " + faixa.inicio + "-" + faixa.fim + "/" + info.size;
      cabecalhos["Content-Length"] = faixa.fim - faixa.inicio + 1;
      resposta.writeHead(206, cabecalhos);
    } else {
      cabecalhos["Content-Length"] = info.size;
      resposta.writeHead(200, cabecalhos);
    }

    fs.createReadStream(alvo, opcoes)
      .on("error", function () {
        resposta.destroy();
      })
      .pipe(resposta);
  });
}

/* --- roteamento ---------------------------------------------------------- */

function versaoDoPedido(consulta) {
  var achado = /(?:^|&)v=(\d+)/.exec(consulta || "");
  return achado ? Number(achado[1]) : 0;
}

function lerCorpo(pedido, pronto) {
  var pedacos = [];
  var total = 0;
  var abortado = false;

  /* Substitui o `requestTimeout`, desligado por causa do SSE: sem isto, um
   * cliente que manda meio corpo e para segura o socket para sempre. */
  var relogioCorpo = setTimeout(function () {
    abortado = true;
    pedido.destroy();
    pronto(new Error("corpo não chegou no tempo"));
  }, LIMITE_TEMPO_CORPO);

  function encerrar(erro, texto) {
    if (abortado) return;
    abortado = true;
    clearTimeout(relogioCorpo);
    pronto(erro, texto);
  }

  pedido.on("data", function (pedaco) {
    if (abortado) return;
    total += pedaco.length;
    if (total > LIMITE_CORPO) return encerrar(new Error("corpo grande demais"));
    pedacos.push(pedaco);
  });
  pedido.on("end", function () {
    encerrar(null, Buffer.concat(pedacos).toString("utf8"));
  });
  pedido.on("error", function (erro) {
    encerrar(erro);
  });
}

var servidor = http.createServer(function (pedido, resposta) {
  var partido = (pedido.url || "/").split("?");
  var caminho = partido[0];
  var consulta = partido[1] || "";
  resposta.reqEtag = pedido.headers["if-none-match"];

  if (caminho === "/") {
    resposta.writeHead(302, { Location: "/webapp/" });
    return resposta.end();
  }

  if (caminho === "/api/eventos") {
    var versao = versaoDoPedido(consulta);
    resposta.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
      /* Desliga o buffer de proxies que não reconhecem event-stream. */
      "X-Accel-Buffering": "no"
    });
    /* Retry do EventSource: 2 s em vez dos 3 s padrão. */
    resposta.write("retry: 2000\n\n");
    inscrever(versao, resposta);
    enviarEvento(resposta, "estado", {
      estado: estados[versao] || null,
      servidorEm: Date.now()
    });
    return;
  }

  if (caminho === "/api/estado") {
    var v = versaoDoPedido(consulta);

    if (pedido.method === "GET") {
      return responderJson(resposta, 200, {
        estado: estados[v] || null,
        servidorEm: Date.now()
      });
    }

    if (pedido.method === "POST") {
      return lerCorpo(pedido, function (erro, texto) {
        if (erro) return responderJson(resposta, 413, { erro: erro.message });

        var recebido;
        try {
          recebido = JSON.parse(texto);
        } catch (falha) {
          return responderJson(resposta, 400, { erro: "json inválido" });
        }
        if (!recebido || typeof recebido !== "object" || typeof recebido.versao !== "number") {
          return responderJson(resposta, 400, { erro: "estado sem versao" });
        }

        estados[recebido.versao] = recebido;
        agendarGravacao();
        publicar(recebido.versao, recebido);
        return responderJson(resposta, 200, { ok: true, servidorEm: Date.now() });
      });
    }

    if (pedido.method === "DELETE") {
      delete estados[v];
      agendarGravacao();
      publicar(v, null);
      return responderJson(resposta, 200, { ok: true });
    }

    resposta.writeHead(405, { Allow: "GET, POST, DELETE" });
    return resposta.end();
  }

  if (caminho === "/api/saude") {
    return responderJson(resposta, 200, {
      ok: true,
      ouvintes: ouvintes.length,
      versoes: Object.keys(estados).map(Number)
    });
  }

  if (pedido.method !== "GET" && pedido.method !== "HEAD") {
    resposta.writeHead(405, { Allow: "GET, HEAD" });
    return resposta.end();
  }

  return servirEstatico(caminho, resposta, pedido.headers.range);
});

/* O `requestTimeout` do Node derruba requisições longas, e o SSE de uma sessão
 * de mesa fica aberto por horas. Desligá-lo abre a porta para um cliente que
 * manda meio corpo e para — daí o timeout manual em `lerCorpo`. O
 * `headersTimeout` fica no padrão, que é o que protege a fase de cabeçalhos. */
servidor.requestTimeout = 0;

servidor.listen(PORTA, ENDERECO, function () {
  console.log("[dungeon] servindo " + RAIZ + " em http://" + ENDERECO + ":" + PORTA + "/webapp/");
  console.log("[dungeon] estado em " + ARQUIVO_ESTADO);
});

/* Fecha os SSE antes de sair, para o systemd não esperar o timeout na reinicialização. */
["SIGINT", "SIGTERM"].forEach(function (sinal) {
  process.on(sinal, function () {
    ouvintes.forEach(function (ouvinte) {
      try {
        ouvinte.resposta.end();
      } catch (erro) {
        /* já fechado */
      }
    });
    servidor.close(function () {
      process.exit(0);
    });
    /* Se algo travar, não deixa o processo pendurado. */
    setTimeout(function () {
      process.exit(0);
    }, 2000).unref();
  });
});
