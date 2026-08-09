/* Salas da dungeon, na ordem do fluxo de referencias/aventura.md (seção 2).
 *
 * `trilha` é o MP3 que a tela do Relógio toca em loop enquanto o grupo está
 * ali. Caminho relativo a webapp/, porque é de lá que relogio.html sai.
 *
 * `trilha: null` é sala sem faixa gerada ainda: o nome aparece na tela e o som
 * fica em silêncio. Ao gerar o áudio, largue o arquivo em
 * `webapp/assets/audio/<pasta>/batalha.mp3` e aponte aqui.
 *
 * A Arena é **uma sala só**, não três. Na ficção sempre foi um espaço único, e
 * na mesa os inimigos entram em sequência sem pausa: separar em fases obrigava
 * o mestre a trocar de sala no meio do combate só para achar a vida de um
 * zumbi. O loot continua contando por inimigo em data/loot.js, que é o eixo em
 * que a divisão ainda importa — lá o ouro sai por encontro, não por sala.
 *
 * `sub` hoje não é exibido em lugar nenhum: ele diz o que a sala tem dentro
 * ("5 Ghasts, 1 Wraith…") e a única tela que o mostrava era a do Relógio, que é
 * projetada para a mesa — era spoiler puro. Se um dia servir, que seja numa
 * tela só do mestre; **nunca** de volta ao Relógio ou aos Jogadores.
 */
window.SALAS = [
  {
    id: "acampamento",
    nome: "Acampamento",
    sub: "Entre as runs",
    trilha: null
  },
  {
    id: "ritual",
    nome: "Sala do Ritual",
    sub: "5 Ghasts, 1 Wraith e os três totens",
    trilha: "assets/audio/01-sala-do-ritual/batalha.mp3"
  },
  {
    id: "lancas",
    nome: "Corredor das Lanças",
    sub: "Caminho fácil — 2 Flameskulls",
    trilha: null
  },
  {
    id: "tesouro",
    nome: "Câmara do Tesouro",
    sub: "Caminho difícil — Dragão de Ouro Jovem",
    trilha: "assets/audio/02-camara-do-tesouro/batalha.mp3"
  },
  {
    id: "arena",
    nome: "A Arena",
    sub: "Goblins, zumbis e o Contemplador Zumbi, em sequência",
    trilha: "assets/audio/03-arena/batalha.mp3"
  },
  {
    id: "draconidra",
    nome: "Covil da Draconidra",
    sub: "Chefe final",
    trilha: "assets/audio/05-draconidra/batalha.mp3"
  }
];

window.salaPorId = function (id) {
  return (
    window.SALAS.filter(function (sala) {
      return sala.id === id;
    })[0] || null
  );
};
