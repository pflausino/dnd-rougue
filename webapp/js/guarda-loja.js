/* As lojas só existem no acampamento.
 *
 * Se o mestre levar o grupo de volta à dungeon enquanto os jogadores estão no
 * catálogo, a tela fecha a loja sozinha e volta para o acampamento.
 */
(function () {
  "use strict";

  window.Dungeon.assinar(function (estado) {
    if (estado.modo !== "acampamento") window.location.replace("jogadores.html");
  });
})();
