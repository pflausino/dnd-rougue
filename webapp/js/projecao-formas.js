/* Geometria e desenho das formas projetadas na mesa.
 *
 * Vive num arquivo só porque as duas telas precisam dele: a de Projeção
 * desenha, e a do Projetor desenha *e* acerta o clique. Duas cópias
 * divergiriam, e o sintoma seria o pior possível — clicar num lugar e pegar a
 * forma de outro, só na tela do mestre, sem erro nenhum no console.
 *
 * Sistema de coordenadas (o mesmo que state.js documenta em `projecao`):
 * `x`/`y` são frações da largura/altura do canvas; `largura`/`altura` são
 * frações **só da altura**. Medir tamanho pela altura nas duas é o que mantém
 * o círculo redondo quando o notebook do mestre e o projetor têm proporções
 * diferentes, que é o caso normal.
 */
(function (global) {
  "use strict";

  /* Cores escolhidas para projetor, não para monitor: saturadas e claras, que
   * é o que sobrevive à luz da sala batendo na mesa. */
  var CORES = [
    { id: "vermelho", nome: "Vermelho", valor: "#ff2d2d" },
    { id: "laranja", nome: "Laranja", valor: "#ff8a00" },
    { id: "amarelo", nome: "Amarelo", valor: "#ffe000" },
    { id: "verde", nome: "Verde", valor: "#22dd55" },
    { id: "ciano", nome: "Ciano", valor: "#00e5ff" },
    { id: "azul", nome: "Azul", valor: "#2b6bff" },
    { id: "roxo", nome: "Roxo", valor: "#b23cff" },
    { id: "rosa", nome: "Rosa", valor: "#ff4fd8" },
    { id: "preto", nome: "Preto", valor: "#000000" }
  ];

  var FUNDOS = [
    { nome: "Branco", valor: "#ffffff" },
    { nome: "Preto", valor: "#000000" },
    { nome: "Âmbar", valor: "#ffd28a" },
    { nome: "Azul noite", valor: "#0b1b3a" }
  ];

  var TIPOS = [
    { id: "circulo", nome: "Círculo" },
    { id: "retangulo", nome: "Retângulo" }
  ];

  function radianos(graus) {
    return ((graus || 0) * Math.PI) / 180;
  }

  /* Da forma (frações) para pixels do canvas. Todo o resto do módulo trabalha
   * em cima disto, para a conta de conversão existir num lugar só. */
  function caixa(forma, largura, altura) {
    return {
      cx: forma.x * largura,
      cy: forma.y * altura,
      w: forma.largura * altura,
      h: forma.altura * altura,
      giro: radianos(forma.giro)
    };
  }

  function desenharForma(ctx, forma, largura, altura) {
    var c = caixa(forma, largura, altura);
    ctx.save();
    ctx.translate(c.cx, c.cy);
    ctx.rotate(c.giro);
    ctx.fillStyle = forma.cor;
    if (forma.tipo === "circulo") {
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.abs(c.w) / 2, Math.abs(c.h) / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
    }
    ctx.restore();
  }

  /* Pinta o fundo em toda a área e as formas por cima, na ordem da lista. */
  function desenhar(ctx, largura, altura, projecao) {
    ctx.clearRect(0, 0, largura, altura);
    ctx.fillStyle = (projecao && projecao.fundo) || "#ffffff";
    ctx.fillRect(0, 0, largura, altura);
    ((projecao && projecao.formas) || []).forEach(function (forma) {
      desenharForma(ctx, forma, largura, altura);
    });
  }

  /* Leva um ponto do canvas para o espaço da forma, desfazendo o giro. É o
   * que permite acertar o clique numa forma girada sem testar polígono. */
  function paraLocal(ponto, c) {
    var dx = ponto.x - c.cx;
    var dy = ponto.y - c.cy;
    var cos = Math.cos(-c.giro);
    var sen = Math.sin(-c.giro);
    return { x: dx * cos - dy * sen, y: dx * sen + dy * cos };
  }

  function contem(forma, ponto, largura, altura) {
    var c = caixa(forma, largura, altura);
    var p = paraLocal(ponto, c);
    var rx = Math.abs(c.w) / 2;
    var ry = Math.abs(c.h) / 2;
    if (!rx || !ry) return false;
    if (forma.tipo === "circulo") {
      return (p.x / rx) * (p.x / rx) + (p.y / ry) * (p.y / ry) <= 1;
    }
    return Math.abs(p.x) <= rx && Math.abs(p.y) <= ry;
  }

  /* A de cima primeiro: a lista é desenhada em ordem, então a última é a que
   * está por cima e tem de ser a primeira a receber o clique. */
  function formaEm(formas, ponto, largura, altura) {
    for (var i = formas.length - 1; i >= 0; i -= 1) {
      if (contem(formas[i], ponto, largura, altura)) return formas[i];
    }
    return null;
  }

  /* Do espaço da forma de volta para o canvas — as alças de tamanho e de giro
   * são pontos locais fixos que precisam do caminho inverso. */
  function paraCanvas(local, c) {
    var cos = Math.cos(c.giro);
    var sen = Math.sin(c.giro);
    return {
      x: c.cx + local.x * cos - local.y * sen,
      y: c.cy + local.x * sen + local.y * cos
    };
  }

  /* Distância, em pixels do canvas, entre o centro da forma e a alça de giro.
   * Fixa em pixels de propósito: numa forma pequena a alça precisa sobrar para
   * fora, senão fica dentro da própria forma e some. */
  var FOLGA_GIRO = 28;

  function alcas(forma, largura, altura) {
    var c = caixa(forma, largura, altura);
    return {
      tamanho: paraCanvas({ x: Math.abs(c.w) / 2, y: Math.abs(c.h) / 2 }, c),
      giro: paraCanvas({ x: 0, y: -Math.abs(c.h) / 2 - FOLGA_GIRO }, c),
      centro: { x: c.cx, y: c.cy }
    };
  }

  global.ProjecaoFormas = {
    CORES: CORES,
    FUNDOS: FUNDOS,
    TIPOS: TIPOS,
    caixa: caixa,
    desenhar: desenhar,
    desenharForma: desenharForma,
    contem: contem,
    formaEm: formaEm,
    alcas: alcas,
    paraLocal: paraLocal,
    paraCanvas: paraCanvas
  };
})(window);
