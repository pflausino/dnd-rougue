/* Trilha da sala, na tela do Relógio.
 *
 * Fica fora de relogio.js porque não é render: mantém dois elementos <audio>
 * vivos entre um estado e outro. Render é chamado a cada segundo e não pode
 * carregar áudio de novo a cada passada.
 *
 * O loop é feito à mão, e não com `audio.loop = true`, porque o corte seco no
 * fim da faixa se ouve na mesa. Dois canais: quando faltam cinco segundos para
 * o fim, o outro canal começa do zero e os volumes se cruzam. Trocar de sala
 * usa o mesmo cruzamento.
 */
(function () {
  "use strict";

  var D = window.Dungeon;

  var CROSSFADE_MS = 5000;

  /* Passo do ramp de volume. 50 ms não deixa degrau audível e não pesa numa TV
   * velha (20 ajustes por segundo, dois elementos). */
  var PASSO_MS = 50;

  /* Quanto antes do cruzamento o outro canal recebe o src. Sem essa
   * antecedência o `play()` do crossfade pega o arquivo ainda sem buffer e
   * engasga logo na emenda. */
  var ANTECEDENCIA_MS = 20000;

  var botao = document.querySelector("[data-trilha-botao]");

  function criarCanal() {
    var canal = { audio: new Audio(), src: null, ganho: 0, alvo: 0 };
    canal.audio.preload = "auto";
    canal.audio.volume = 0;

    /* Rede de segurança: se o cruzamento não disparou (aba em segundo plano
     * segura o timer), a faixa acaba e o loop reentra com corte seco — feio,
     * mas melhor que o silêncio. */
    canal.audio.addEventListener("ended", function () {
      if (canal.src !== desejada || canal.alvo !== 1) return;
      reiniciar(canal);
      tocar(canal);
    });

    /* Arquivo ausente ou corrompido: cai no silêncio em vez de ficar tentando. */
    canal.audio.addEventListener("error", function () {
      console.warn("[trilha] não foi possível carregar", canal.src);
      canal.alvo = 0;
    });

    return canal;
  }

  var canais = [criarCanal(), criarCanal()];
  /* Canal que deve terminar em volume cheio; o outro está sumindo ou parado. */
  var ativo = 0;
  /* src que deveria estar tocando agora. null = silêncio. */
  var desejada = null;
  var mudo = false;
  /* O navegador recusou tocar sem um gesto do usuário nesta aba. */
  var bloqueado = false;

  function aplicarVolume(canal) {
    /* Curva de potência constante. Com dois trechos musicais diferentes somados
     * — o fim e o começo da faixa — o ramp linear afunda o volume no meio da
     * emenda, que é justamente o que o crossfade deveria esconder. */
    canal.audio.volume = mudo ? 0 : Math.sin((canal.ganho * Math.PI) / 2);
  }

  function reiniciar(canal) {
    try {
      canal.audio.currentTime = 0;
    } catch (erro) {
      /* Ainda sem metadata; já está no início de qualquer forma. */
    }
  }

  function tocar(canal) {
    var promessa = canal.audio.play();
    if (!promessa || typeof promessa.catch !== "function") return;
    promessa.catch(function (erro) {
      /* A tela do Relógio é projetada e ninguém encosta nela, então o autoplay
       * cai na política do navegador. Daí o botão no canto. */
      if (erro && erro.name === "NotAllowedError") {
        bloqueado = true;
        renderizarBotao();
      }
    });
  }

  /* Põe `indice` no ar com `src` e manda o outro canal sumir. */
  function assumir(indice, src, doInicio) {
    var canal = canais[indice];
    if (canal.src !== src) {
      canal.src = src;
      canal.audio.src = src;
    }
    if (doInicio) reiniciar(canal);
    canal.alvo = 1;
    tocar(canal);
    canais[1 - indice].alvo = 0;
    ativo = indice;
  }

  function restanteMs(canal) {
    var duracao = canal.audio.duration;
    if (!isFinite(duracao) || duracao <= 0) return null;
    return (duracao - canal.audio.currentTime) * 1000;
  }

  /* Canal zerado sai do ar: parado e rebobinado, mas com o src de pé — o
   * buffer continua no navegador e a próxima emenda não rebaixa nada. */
  function liberar(canal) {
    canal.audio.pause();
    reiniciar(canal);
  }

  function passo() {
    var canalAtivo = canais[ativo];
    var outro = canais[1 - ativo];

    if (desejada && canalAtivo.src === desejada && canalAtivo.alvo === 1) {
      var restante = restanteMs(canalAtivo);
      var outroLivre = outro.ganho === 0 && outro.alvo === 0;

      if (restante !== null && outroLivre) {
        if (restante <= CROSSFADE_MS + ANTECEDENCIA_MS && outro.src !== desejada) {
          outro.src = desejada;
          outro.audio.src = desejada;
          outro.audio.load();
        }
        if (restante <= CROSSFADE_MS) assumir(1 - ativo, desejada, true);
      }
    }

    var incremento = PASSO_MS / CROSSFADE_MS;
    canais.forEach(function (canal) {
      if (canal.ganho === canal.alvo) return;
      canal.ganho =
        canal.alvo > canal.ganho
          ? Math.min(canal.alvo, canal.ganho + incremento)
          : Math.max(canal.alvo, canal.ganho - incremento);
      aplicarVolume(canal);
      if (canal.ganho === 0 && canal.alvo === 0) liberar(canal);
    });
  }

  function renderizarBotao() {
    if (!botao) return;
    botao.hidden = !desejada;
    botao.classList.toggle("trilha__botao--bloqueado", bloqueado);
    botao.textContent = bloqueado ? "Ativar trilha" : mudo ? "Trilha muda" : "Trilha ligada";
    botao.setAttribute("aria-pressed", !bloqueado && !mudo ? "true" : "false");
  }

  function sincronizar(estado) {
    var sala = estado.sala ? window.salaPorId(estado.sala) : null;
    var alvo = sala && sala.trilha ? sala.trilha : null;

    /* Salas que dividem a mesma faixa — as três arenas — caem aqui e o áudio
     * segue tocando, sem reiniciar na troca. */
    if (alvo === desejada) return;
    desejada = alvo;

    if (!alvo) {
      canais.forEach(function (canal) {
        canal.alvo = 0;
      });
    } else {
      /* Se a faixa pedida é a que o canal ativo já tem carregada (o mestre
       * desligou e religou), ele volta de onde parou em vez de recomeçar. */
      var indice = canais[ativo].src === alvo ? ativo : 1 - ativo;
      assumir(indice, alvo, canais[indice].ganho === 0);
    }

    renderizarBotao();
  }

  if (botao) {
    botao.addEventListener("click", function () {
      if (bloqueado) {
        bloqueado = false;
        canais.forEach(function (canal) {
          if (canal.alvo === 1) tocar(canal);
        });
      } else {
        mudo = !mudo;
        canais.forEach(aplicarVolume);
      }
      renderizarBotao();
    });
  }

  D.assinar(sincronizar);
  window.setInterval(passo, PASSO_MS);
})();
