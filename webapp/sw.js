/* Service worker da tela dos Jogadores instalada como app.
 *
 * Existe por dois motivos, nessa ordem: o Chrome só oferece "instalar" a um
 * site que tenha um service worker com `fetch`, e um tablet na mesa perde o
 * wi-fi de vez em quando — com o cache, a tela ao menos abre em vez de dar
 * erro de rede.
 *
 * Três regras que não são estilo, são o que impede este arquivo de quebrar o
 * painel:
 *
 * 1. **`/api/` nunca passa por aqui.** `/api/eventos` é um fluxo SSE que fica
 *    aberto pela sessão inteira; responder a ele pelo service worker corta o
 *    streaming e as telas param de sincronizar. `/api/estado` é POST e também
 *    não pode ser servido de cache. Os dois saem daqui sem `respondWith`.
 *
 * 2. **Rede primeiro, cache só como queda.** O CLAUDE.md registra o tempo que
 *    já se perdeu caçando "bug" que era JS velho servido de cache. Um service
 *    worker cache-first tornaria isso permanente — sobrevive até ao
 *    Cmd+Shift+R. Aqui todo GET tenta a rede antes; o cache só entra quando a
 *    rede falha, então um deploy aparece na hora.
 *
 * 3. **Só guarda 200.** Um 206 (resposta parcial de `Range`, que o servidor
 *    usa para os MP3 da trilha) guardado no cache voltaria depois como se
 *    fosse o arquivo inteiro, entregando áudio truncado.
 *
 * Ao mudar o que é guardado, **suba `VERSAO`**: é o que apaga o cache antigo
 * no `activate`.
 */
var VERSAO = "v1";
var CACHE = "ultima-dungeon:" + VERSAO;

/* O esqueleto da tela dos Jogadores, para o primeiro carregamento offline não
 * cair na tela de erro do navegador. Lista curta de propósito: ela envelhece
 * junto com os `<script>` de jogadores.html, e quem mantiver os dois
 * desencontrados só perceberia offline. Não é o cache principal — o de uso
 * diário é o que a regra 2 preenche sozinho. */
var ESQUELETO = [
  "jogadores.html",
  "css/theme.css",
  "css/app.css",
  "js/state.js",
  "js/aviso-conexao.js",
  "js/portao.js",
  "data/bencaos.js",
  "js/jogadores.js",
  "assets/icones/icone-192.png"
];

self.addEventListener("install", function (evento) {
  /* Não espera as abas antigas fecharem: a versão nova assume no próximo
   * carregamento, que é o que se espera de um painel de mesa. */
  self.skipWaiting();
  evento.waitUntil(
    caches.open(CACHE).then(function (cache) {
      /* `addAll` falha inteiro se um item falhar; guardar um a um deixa o
       * install passar mesmo que um arquivo tenha sido renomeado. */
      return Promise.all(
        ESQUELETO.map(function (caminho) {
          return cache.add(caminho).catch(function () {
            /* Silêncio de propósito: item faltando não pode impedir o app de
             * instalar. A regra 2 recupera na primeira visita com rede. */
          });
        })
      );
    })
  );
});

self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches
      .keys()
      .then(function (nomes) {
        return Promise.all(
          nomes.map(function (nome) {
            if (nome !== CACHE && nome.indexOf("ultima-dungeon:") === 0) {
              return caches.delete(nome);
            }
            return null;
          })
        );
      })
      .then(function () {
        /* Assume as abas já abertas, sem esperar um F5. */
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (evento) {
  var pedido = evento.request;

  /* POST do estado e qualquer outro verbo saem sem passar por aqui. */
  if (pedido.method !== "GET") return;

  var url;
  try {
    url = new URL(pedido.url);
  } catch (erro) {
    return;
  }

  /* Outra origem (nada usa hoje, mas o service worker veria) fica com o
   * navegador. */
  if (url.origin !== self.location.origin) return;

  /* Regra 1: o SSE e o estado nunca passam por aqui. */
  if (url.pathname.indexOf("/api/") !== -1) return;

  /* Requisição com `Range` (áudio da trilha) devolve 206 e não pode ser
   * guardada — deixa o navegador cuidar direto. */
  if (pedido.headers.get("range")) return;

  /* Regra 2: rede primeiro. */
  evento.respondWith(
    fetch(pedido)
      .then(function (resposta) {
        /* Regra 3: só 200 entra no cache. */
        if (resposta && resposta.status === 200 && resposta.type === "basic") {
          var copia = resposta.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(pedido, copia);
          });
        }
        return resposta;
      })
      .catch(function () {
        return caches.match(pedido).then(function (guardada) {
          if (guardada) return guardada;
          /* Navegação sem nada no cache cai na tela dos Jogadores, que é a
           * porta do app — melhor que o erro de rede do navegador. */
          if (pedido.mode === "navigate") return caches.match("jogadores.html");
          return Response.error();
        });
      })
  );
});
