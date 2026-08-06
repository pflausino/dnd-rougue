/* Aviso de sincronização caída.
 *
 * Com as telas em máquinas diferentes, uma queda do servidor é silenciosa: cada
 * tela continua mostrando o último estado que recebeu e ninguém percebe que
 * pararam de conversar. Este aviso é a única pista visível de que isso
 * aconteceu — some sozinho quando a conexão volta.
 *
 * Fica fora de `state.js` de propósito: lá não entra DOM.
 */
(function (global) {
  "use strict";

  var Dungeon = global.Dungeon;
  if (!Dungeon || !Dungeon.assinarConexao) return;

  /* Carência antes de acusar. A conexão sobe alguns milissegundos depois do
   * carregamento, e sem a espera o aviso pisca em toda abertura de tela. */
  var CARENCIA_MS = 2500;

  var aviso = null;
  var agendado = null;

  function elemento() {
    if (aviso) return aviso;
    aviso = global.document.createElement("div");
    aviso.className = "aviso-conexao";
    aviso.setAttribute("role", "status");
    aviso.textContent = "Sem sincronização com o servidor";
    global.document.body.appendChild(aviso);
    return aviso;
  }

  Dungeon.assinarConexao(function (conexao) {
    if (!conexao.ativo) return;

    if (conexao.ligado) {
      if (agendado) {
        global.clearTimeout(agendado);
        agendado = null;
      }
      if (aviso) aviso.hidden = true;
      return;
    }

    if (agendado) return;
    agendado = global.setTimeout(function () {
      agendado = null;
      elemento().hidden = false;
    }, CARENCIA_MS);
  });
})(window);
