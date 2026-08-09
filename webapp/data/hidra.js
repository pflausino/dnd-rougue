/* Retratos das cabeças da Dracohydra, recortados de uma folha de arte única.
 *
 * A cor é enfeite, não regra: o Bite da ficha (data/monstros.js) escolhe o tipo
 * de dano na hora, entre os do Prismatic Breath — não existe "a cabeça de
 * fogo". Servem para o mestre apontar na TV e dizer *aquela*.
 *
 * A arte sai do número da cabeça, em roda: a de nº 6 repete a primeira. Assim o
 * estado guarda só `{ n, viva }` (ver state.js) e nenhuma cabeça nasce sem
 * retrato quando a hidra passa das cinco.
 *
 * Caminho relativo a webapp/, que é de onde relogio.html e mestre.html saem.
 */
window.ARTES_HIDRA = [
  "assets/hidra/cabeca-azul.png",
  "assets/hidra/cabeca-verde-1.png",
  "assets/hidra/cabeca-verde-2.png",
  "assets/hidra/cabeca-fogo.png",
  "assets/hidra/cabeca-vermelha.png"
];

window.arteHidra = function (n) {
  var artes = window.ARTES_HIDRA;
  return artes[(Math.max(1, n) - 1) % artes.length];
};
