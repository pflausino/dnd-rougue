/* Economia de ouro, transcrita de referencias/aventura.md (seção 13).
 *
 * Cada ameaça vale um dado conforme a faixa de dificuldade. A Draconidra fica
 * fora: o chefe final não concede ouro.
 */
window.FAIXAS_LOOT = {
  baixa: { nome: "Baixa", dado: { quantidade: 1, faces: 4, fixo: 4 } },
  media: { nome: "Média", dado: { quantidade: 1, faces: 8, fixo: 8 } },
  alta: { nome: "Alta", dado: { quantidade: 1, faces: 20, fixo: 20 } },
  especial: { nome: "Especial", dado: { quantidade: 1, faces: 100, fixo: 100 } }
};

window.ENCONTROS_LOOT = [
  {
    id: "ritual",
    nome: "Sala do Ritual",
    inimigos: [
      { id: "ghast", nome: "Ghast", previstos: 5, nd: "2", faixa: "media" },
      { id: "wraith", nome: "Wraith", previstos: 1, nd: "5", faixa: "alta" },
      {
        id: "bone-devil",
        nome: "Bone Devil",
        previstos: 1,
        nd: "9",
        faixa: "alta",
        nota: "Vale mesmo se o grupo impedir a invocação."
      }
    ]
  },
  {
    id: "lancas",
    nome: "Caminho fácil — Corredor das Lanças",
    inimigos: [
      {
        id: "flameskull",
        nome: "Flameskull",
        previstos: 2,
        nd: "4",
        faixa: "media",
        nota: "Vale mesmo se o grupo atravessar antes de eles atacarem."
      }
    ]
  },
  {
    id: "tesouro",
    nome: "Caminho difícil — Câmara do Tesouro",
    inimigos: [
      { id: "young-gold-dragon", nome: "Young Gold Dragon", previstos: 1, nd: "10", faixa: "especial" },
      { id: "mimic", nome: "Mimic", previstos: 1, nd: "2", faixa: "media" },
      { id: "flying-sword", nome: "Animated Flying Sword", previstos: 4, nd: "1/4", faixa: "baixa" }
    ]
  },
  {
    id: "arena-goblin",
    nome: "Arena I — Horda Goblin",
    inimigos: [
      {
        id: "goblin",
        nome: "Goblin Warrior",
        previstos: 12,
        nd: "1/4",
        faixa: "baixa",
        nota: "Os que fogem após a morte do Boss contam."
      },
      { id: "goblin-boss", nome: "Goblin Boss", previstos: 1, nd: "1", faixa: "baixa" }
    ]
  },
  {
    id: "arena-zumbis",
    nome: "Arena II — Horda de Zumbis",
    inimigos: [
      {
        id: "zombie",
        nome: "Zumbi",
        previstos: 10,
        nd: "1/4",
        faixa: "baixa",
        nota: "Dois grupos de cinco, conduzidos como mob."
      },
      { id: "hobgoblin-captain", nome: "Hobgoblin Captain", previstos: 1, nd: "3", faixa: "media" }
    ]
  },
  {
    id: "arena-beholder",
    nome: "Arena III — Contemplador Zumbi",
    inimigos: [
      {
        id: "beholder-zombie",
        nome: "Contemplador Zumbi",
        previstos: 1,
        nd: "5",
        faixa: "especial",
        nota: "Só paga se for derrotado ou neutralizado."
      }
    ]
  }
];

/* Percorre todos os inimigos numa lista só, para busca por id. */
window.inimigosLoot = function () {
  return window.ENCONTROS_LOOT.reduce(function (todos, encontro) {
    return todos.concat(encontro.inimigos);
  }, []);
};
