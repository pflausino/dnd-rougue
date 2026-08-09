/* Barulho do dado batendo na mesa, para a tela do Relógio.
 *
 * O `dice-box` não traz som nenhum — só o Babylon usa `AudioContext`, para
 * outra coisa. Em vez de baixar um arquivo (mais um binário no repositório,
 * mais uma licença para conferir), o ruído é **sintetizado na hora**: cada
 * impacto é um estouro curto de ruído branco passado por um filtro passa-faixa,
 * que é basicamente o que um dado de resina fazendo contato com madeira soa.
 *
 * Sintetizar tem duas vantagens que um .mp3 não tem: nenhuma rolagem sai igual
 * à anterior (o ouvido cansa rápido de um sample repetido a noite toda) e o
 * número de quiques acompanha a quantidade de dados.
 *
 * Só a tela do Relógio carrega este arquivo, pelo mesmo motivo da trilha: ela é
 * a que vai na caixa de som, e o notebook do mestre não deve duplicar o áudio.
 */
(function (global) {
  "use strict";

  var Contexto = global.AudioContext || global.webkitAudioContext;
  if (!Contexto) return;

  var ctx = null;
  var mestre = null;

  /* Volume geral — o número a mexer se ficar alto ou baixo demais na TV.
   *
   * Pode passar de 1 sem medo de estourar: o compressor logo abaixo segura os
   * picos. O que limita é o gosto, não a matemática. */
  var VOLUME = 2.4;

  /* Teto de impactos por rolagem. Sem ele, um `20d6` viraria ruído branco e um
   * pico de CPU no meio da animação. Com os quiques mais longos cabe mais
   * gente, então subiu junto. */
  var MAX_IMPACTOS = 40;

  function garantirContexto() {
    if (ctx) return ctx;
    ctx = new Contexto();

    mestre = ctx.createGain();
    mestre.gain.value = VOLUME;

    /* Trava os picos para o volume poder subir sem distorcer. Um punhado de
     * dados soma vários impactos no mesmo instante e, sem isto, a soma passaria
     * de 1 e viraria estalo sujo. O ataque não é instantâneo de propósito: o
     * "toc" do dado *é* o transiente, e um limitador rápido demais o achataria
     * justamente onde ele importa. */
    var limite = ctx.createDynamicsCompressor();
    limite.threshold.value = -6;
    limite.knee.value = 4;
    limite.ratio.value = 10;
    limite.attack.value = 0.003;
    limite.release.value = 0.15;

    /* Corta o agudo mais áspero do ruído: em caixa de TV, sem isto o impacto
     * vira "chiado" em vez de "toc". */
    var suave = ctx.createBiquadFilter();
    suave.type = "lowpass";
    suave.frequency.value = 7000;

    mestre.connect(limite).connect(suave).connect(ctx.destination);
    return ctx;
  }

  /* O navegador só deixa tocar depois de um gesto na aba — a mesma política que
   * obriga o botão "Ativar trilha". Qualquer toque serve, e depois disso o
   * ouvinte se remove. */
  function destravar() {
    garantirContexto();
    if (ctx.state === "suspended") ctx.resume();
  }

  ["pointerdown", "keydown", "touchstart"].forEach(function (evento) {
    global.addEventListener(evento, destravar, { once: true, passive: true });
  });

  /* Um impacto: ruído branco com decaimento cúbico já embutido na amostra (é o
   * que dá o ataque seco) e um passa-faixa que define o "material". */
  function impacto(quando, ganho, frequencia) {
    var duracao = 0.055;
    var amostras = Math.ceil(ctx.sampleRate * duracao);
    var buffer = ctx.createBuffer(1, amostras, ctx.sampleRate);
    var canal = buffer.getChannelData(0);
    for (var i = 0; i < amostras; i += 1) {
      var restante = 1 - i / amostras;
      canal[i] = (Math.random() * 2 - 1) * restante * restante * restante;
    }

    var fonte = ctx.createBufferSource();
    fonte.buffer = buffer;

    var corpo = ctx.createBiquadFilter();
    corpo.type = "bandpass";
    corpo.frequency.value = frequencia;
    corpo.Q.value = 1.6;

    var volume = ctx.createGain();
    volume.gain.value = ganho;

    fonte.connect(corpo).connect(volume).connect(mestre);
    fonte.start(quando);
  }

  /* Um dado quicando: os quiques vão ficando mais juntos e mais fracos, que é o
   * que faz o ouvido reconhecer "dado assentando" em vez de "três cliques".
   *
   * Os fatores são calibrados para durar por volta de 1 s. A primeira versão
   * usava 0.6/0.55 e morria em 200 ms — a física do dado leva ~2 s até assentar,
   * e o som acabando cedo demais dava a impressão de que o dado tinha parado
   * antes do que a mesa via na tela. */
  function quicar(inicio, frequenciaBase, orcamento, escala) {
    var t = inicio;
    var ganho = (0.6 + Math.random() * 0.25) * escala;
    var intervalo = 0.19 + Math.random() * 0.07;
    var usados = 0;

    while (ganho > 0.04 * escala && usados < orcamento) {
      impacto(t, ganho, frequenciaBase * (0.8 + Math.random() * 0.45));
      t += intervalo;
      intervalo *= 0.78;
      ganho *= 0.72;
      usados += 1;
    }
    return usados;
  }

  /* `lados` muda o timbre: quanto menor o dado, mais agudo o toque. */
  function frequenciaDe(lados) {
    var f = 2900 - lados * 45;
    return Math.max(900, Math.min(2900, f));
  }

  function tocar(qtd, lados) {
    garantirContexto();

    /* `resume()` devolve promessa e **não** muda `state` na mesma volta do
     * laço: checar o estado logo depois, de forma síncrona, faz toda rolagem
     * sair calada. Agendar dentro do `then` é o que aproveita o caso comum —
     * o mestre já tocou na tela (pelo botão da trilha, por exemplo) e o
     * contexto sobe em milissegundos. Se o navegador recusar, nada toca, que é
     * o comportamento certo. */
    if (ctx.state === "suspended") {
      ctx.resume().then(
        function () {
          if (ctx.state === "running") agendar(qtd, lados);
        },
        function () {
          /* Recusado por falta de gesto: silêncio, sem quebrar a animação. */
        }
      );
      return;
    }

    agendar(qtd, lados);
  }

  function agendar(qtd, lados) {
    var quantos = Math.max(1, Math.min(20, Number(qtd) || 1));
    var frequencia = frequenciaDe(Number(lados) || 20);
    var orcamento = Math.max(2, Math.floor(MAX_IMPACTOS / quantos));
    var agora = ctx.currentTime;
    var gastos = 0;

    /* Sem isto, dez dados somam dez impactos no mesmo instante e estouram — foi
     * o que a medição pegou em `10d6`. Fontes independentes somam por volta de
     * √n em amplitude; dividir por `n^0.35` fica um pouco abaixo disso, então a
     * mão cheia de dados ainda soa maior que um dado só, sem passar do teto. */
    var escala = 1 / Math.pow(quantos, 0.35);

    for (var d = 0; d < quantos && gastos < MAX_IMPACTOS; d += 1) {
      /* Os dados não caem juntos: um atraso pequeno e aleatório por dado é o
       * que separa "punhado de dados" de "um dado só mais alto". */
      gastos += quicar(agora + 0.02 + Math.random() * 0.16, frequencia, orcamento, escala);
    }
  }

  global.SomDados = { tocar: tocar, destravar: destravar };
})(window);
