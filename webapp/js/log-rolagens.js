/* Log de rolagens, por cima da tela — usado no Mestre e na consulta de
 * Monstros. A tela do Relógio não entra aqui: lá o resultado é o dado 3D
 * (ver js/dados-3d.js); este painel é a versão em texto, pra quem não está
 * de olho na TV.
 *
 * Fica fora de state.js de propósito, como aviso-conexao.js: lá não entra DOM.
 */
(function (global) {
  "use strict";

  var Dungeon = global.Dungeon;
  if (!Dungeon) return;

  var MAX_LINHAS = 8;

  var painel = null;
  var linhasPorId = {};

  function elemento() {
    if (painel) return painel;
    painel = global.document.createElement("div");
    painel.className = "rolagem-log";
    painel.setAttribute("role", "log");
    painel.setAttribute("aria-live", "polite");
    global.document.body.appendChild(painel);
    return painel;
  }

  function sinal(numero) {
    return (numero >= 0 ? "+" : "") + numero;
  }

  function formula(rolagem) {
    var base = rolagem.qtd + "d" + rolagem.lados;
    return rolagem.bonus ? base + sinal(rolagem.bonus) : base;
  }

  function quemRolou(rolagem) {
    return rolagem.monstro + (rolagem.apelido ? " (" + rolagem.apelido + ")" : "") + " — " + rolagem.acao;
  }

  function textoPendente(rolagem) {
    return quemRolou(rolagem) + " · " + rolagem.rotulo + ": rolando " + formula(rolagem) + "…";
  }

  function textoResolvido(rolagem) {
    var dados = "[" + rolagem.dados.join(", ") + "]";
    var tipo = rolagem.tipo ? " de " + rolagem.tipo : "";
    return (
      quemRolou(rolagem) +
      " · " +
      rolagem.rotulo +
      ": " +
      formula(rolagem) +
      " → " +
      dados +
      (rolagem.bonus ? " " + sinal(rolagem.bonus) : "") +
      " = " +
      rolagem.resultado +
      tipo
    );
  }

  /* Mantém no máximo MAX_LINHAS, tirando as mais antigas — sem isso o painel
   * cresce pela sessão inteira. */
  function podar() {
    while (elemento().children.length > MAX_LINHAS) {
      var maisAntiga = elemento().lastElementChild;
      delete linhasPorId[maisAntiga.dataset.rolagemId];
      maisAntiga.remove();
    }
  }

  Dungeon.assinar(function (estado) {
    var rolagem = estado.rolagem;
    if (!rolagem) return;

    if (rolagem.status === "pendente") {
      /* Já criamos a linha pendente desta rolagem — nada a fazer até ela
       * resolver. Sem esta trava, qualquer outra escrita no estado (ajuste de
       * ouro, relógio…) recriaria a linha do zero a cada notificação. */
      if (linhasPorId[rolagem.id]) return;
      var linha = global.document.createElement("p");
      linha.className = "rolagem-log__item";
      linha.dataset.rolagemId = rolagem.id;
      linha.textContent = textoPendente(rolagem);
      elemento().insertBefore(linha, elemento().firstChild);
      linhasPorId[rolagem.id] = linha;
      podar();
      return;
    }

    /* Resolvida. Pendente e resolvida chegam com o mesmo id — não dá pra
     * distinguir por id sozinho, por isso o `dataset.resolvida` na própria
     * linha. Sem uma linha pendente prévia (esta tela abriu depois do
     * pedido), cria a linha já resolvida. */
    var existente = linhasPorId[rolagem.id];
    if (existente && existente.dataset.resolvida) return;

    if (!existente) {
      existente = global.document.createElement("p");
      existente.className = "rolagem-log__item";
      existente.dataset.rolagemId = rolagem.id;
      elemento().insertBefore(existente, elemento().firstChild);
      linhasPorId[rolagem.id] = existente;
      podar();
    }
    existente.textContent = textoResolvido(rolagem);
    existente.classList.add("rolagem-log__item--resolvida");
    existente.dataset.resolvida = "1";
  });
})(window);
