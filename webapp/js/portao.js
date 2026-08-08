/* Portão de acesso das telas de controle.
 *
 * Sem a senha, só a tela dos Jogadores e as lojas abrem — é o que a mesa vê.
 * Mestre, Relógio, Loot e Monstros pedem a senha uma vez por navegador e
 * guardam a liberação em `localStorage`.
 *
 * ATENÇÃO, e isso não é falsa modéstia: **isto é ofuscação, não segurança.**
 * A verificação roda no cliente, então qualquer pessoa com o DevTools aberto
 * grava a chave na mão e entra. Serve para o jogador não abrir a tela do
 * mestre por engano na mesa; não serve para proteger nada de quem esteja
 * decidido a entrar. Barrar de verdade exige o servidor recusar as páginas
 * (ver README, seção de produção) — não dá para fazer daqui.
 *
 * Duas maneiras de usar, as duas só por atributo, como o resto do projeto:
 *   - `data-protegido` no `<html>`: a página inteira fica travada até a senha.
 *   - `data-exige-acesso` num elemento: ele só aparece com a senha dada
 *     (é o que faz o link "Painel" sumir da tela dos Jogadores).
 */
(function (global) {
  "use strict";

  /* A chave não carrega a versão do formato do estado de propósito: subir
   * `VERSAO` em state.js descarta a sessão de jogo, mas não deve deslogar o
   * mestre no meio da mesa. */
  var CHAVE = "ultima-dungeon:acesso";

  /* Impressão FNV-1a da senha. Guardar o hash em vez do texto evita que a
   * senha apareça de graça para quem abrir o arquivo — e só isso. Não é hash
   * criptográfico e não pretende ser: ver o aviso no topo. Trocar a senha =
   * rodar `impressao("nova senha")` no console e colar o resultado aqui. */
  var IMPRESSAO = "1tqucec";

  function impressao(texto) {
    var h = 2166136261;
    for (var i = 0; i < texto.length; i += 1) {
      h ^= texto.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  /* localStorage pode lançar (modo privado, cota, `file://` em certos
   * navegadores). Falhar fechado: sem conseguir ler, ninguém está liberado. */
  function liberado() {
    try {
      return global.localStorage.getItem(CHAVE) === IMPRESSAO;
    } catch (erro) {
      return false;
    }
  }

  function liberar(senha) {
    if (impressao(senha) !== IMPRESSAO) return false;
    try {
      global.localStorage.setItem(CHAVE, IMPRESSAO);
    } catch (erro) {
      /* Sem poder gravar, a liberação vale só para esta página — melhor que
       * recusar o acesso a um mestre que digitou a senha certa. */
    }
    return true;
  }

  function sair() {
    try {
      global.localStorage.removeItem(CHAVE);
    } catch (erro) {
      /* Nada a fazer: se não dá para gravar, também não havia o que apagar. */
    }
  }

  /* --- reflexo no DOM ----------------------------------------------------- */

  var doc = global.document;

  /* A trava entra antes de o corpo pintar (o script está no `<head>` das
   * páginas protegidas justamente por isso) e sai só quando a senha entra. O
   * CSS de `[data-travado]` esconde tudo menos o diálogo. */
  function travar() {
    doc.documentElement.setAttribute("data-travado", "");
  }

  function destravar() {
    doc.documentElement.removeAttribute("data-travado");
  }

  function aplicarVisibilidade() {
    var visivel = liberado();
    doc.querySelectorAll("[data-exige-acesso]").forEach(function (alvo) {
      alvo.hidden = !visivel;
    });
    doc.querySelectorAll("[data-sem-acesso]").forEach(function (alvo) {
      alvo.hidden = visivel;
    });
  }

  /* Monta o diálogo da senha. `<dialog>` + `showModal()` é o padrão do
   * projeto; `alert`/`prompt` estão fora (feios na TV e travam a automação). */
  function montarDialogo(aoLiberar) {
    var dialogo = doc.createElement("dialog");
    dialogo.className = "modal portao";
    dialogo.setAttribute("data-portao", "");

    var forma = doc.createElement("form");
    forma.className = "modal__caixa portao__caixa";

    var marca = doc.createElement("span");
    marca.className = "marca";
    marca.textContent = "A Última Dungeon";

    var titulo = doc.createElement("h2");
    titulo.textContent = "Tela do mestre";

    var texto = doc.createElement("p");
    texto.className = "portao__texto";
    texto.textContent = "Esta tela é de controle. Informe a senha de acesso.";

    var campo = doc.createElement("label");
    campo.className = "campo";
    var rotulo = doc.createElement("span");
    rotulo.className = "rotulo";
    rotulo.textContent = "Senha";
    var entrada = doc.createElement("input");
    entrada.type = "password";
    entrada.autocomplete = "current-password";
    entrada.setAttribute("data-portao-senha", "");
    campo.appendChild(rotulo);
    campo.appendChild(entrada);

    var erro = doc.createElement("p");
    erro.className = "portao__erro";
    erro.setAttribute("role", "alert");
    erro.hidden = true;
    erro.textContent = "Senha incorreta.";

    var linha = doc.createElement("div");
    linha.className = "linha";
    var entrar = doc.createElement("button");
    entrar.type = "submit";
    entrar.className = "btn btn--primario";
    entrar.textContent = "Entrar";
    var jogador = doc.createElement("a");
    jogador.className = "btn btn--fantasma";
    jogador.href = "jogadores.html";
    jogador.textContent = "Sou jogador";
    linha.appendChild(entrar);
    linha.appendChild(jogador);

    forma.appendChild(marca);
    forma.appendChild(titulo);
    forma.appendChild(texto);
    forma.appendChild(campo);
    forma.appendChild(erro);
    forma.appendChild(linha);
    dialogo.appendChild(forma);
    doc.body.appendChild(dialogo);

    forma.addEventListener("submit", function (evento) {
      /* Sem `preventDefault` o form navegaria e a senha iria para a barra de
       * endereços como query string. */
      evento.preventDefault();

      if (!liberar(entrada.value)) {
        erro.hidden = false;
        entrada.value = "";
        entrada.focus();
        return;
      }

      dialogo.close();
      dialogo.remove();
      aoLiberar();
    });

    /* Esc fecharia o diálogo e deixaria a tela travada e sem saída. */
    dialogo.addEventListener("cancel", function (evento) {
      evento.preventDefault();
    });

    dialogo.showModal();
    entrada.focus();
  }

  var protegida = doc.documentElement.hasAttribute("data-protegido");

  if (protegida && !liberado()) travar();

  function iniciar() {
    aplicarVisibilidade();

    doc.querySelectorAll("[data-portao-sair]").forEach(function (botao) {
      botao.addEventListener("click", function () {
        sair();
        aplicarVisibilidade();
      });
    });

    if (!protegida || liberado()) return;
    montarDialogo(function () {
      destravar();
      aplicarVisibilidade();
    });
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }

  global.Portao = {
    liberado: liberado,
    sair: function () {
      sair();
      aplicarVisibilidade();
    },
    /* Exposto para trocar a senha sem sair do navegador: rodar
     * `Portao.impressao("nova senha")` no console e colar em IMPRESSAO. */
    impressao: impressao
  };
})(window);
