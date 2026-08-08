/* Registra o service worker que torna a tela dos Jogadores instalável.
 *
 * Fica separado de sw.js porque são dois mundos: este roda na página, aquele
 * roda fora dela. Aqui não há nada além do registro — nenhum botão próprio de
 * "instalar", porque esta tela vai projetada para a mesa e não deve ganhar
 * enfeite. Quem instala usa o caminho do próprio navegador:
 *
 *   - Chrome/Edge: ícone de instalar na barra de endereço, ou menu ⋮ →
 *     "Instalar A Última Dungeon".
 *   - iPad/Safari: Compartilhar → "Adicionar à Tela de Início". O Safari
 *     ignora o manifesto para o ícone e usa o `apple-touch-icon` do HTML.
 *
 * Em `file://` não há service worker (a API exige origem segura); o painel
 * continua funcionando, só não instala.
 */
(function (global) {
  "use strict";

  if (!("serviceWorker" in global.navigator)) return;

  global.addEventListener("load", function () {
    /* O caminho é relativo à página, e todas as páginas que registram estão em
     * `webapp/` — o escopo resultante cobre a tela dos Jogadores e as lojas. */
    global.navigator.serviceWorker.register("sw.js").catch(function (erro) {
      /* Falhar aqui não pode derrubar a tela: sem service worker o painel roda
       * igual, só perde o "instalar" e a abertura offline. */
      console.warn("[instalavel] service worker não registrou", erro);
    });
  });
})(window);
