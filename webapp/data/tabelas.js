/* Tabelas que o mestre pode projetar na tela do Relógio.
 * Transcritas de referencias/tabelas.md.
 */
window.EXIBICOES = [
  {
    id: "raridade",
    nome: "Tabela de raridade",
    titulo: "Raridade aleatória de itens mágicos",
    instrucao: "Role 1d100 na coluna correspondente ao nível atual do grupo.",
    nota: "Em uma rolagem de 1d100, 00 representa 100.",
    fonte: "Dungeon Master’s Guide 2024, capítulo 7 — Random Magic Item Rarity",
    variantes: [
      { id: "basico", nome: "Básico" },
      { id: "avancado", nome: "Avançado" }
    ],
    colunaResultado: "Raridade",
    linhas: [
      { resultado: "Comum", basico: "01–30", avancado: "01–11" },
      { resultado: "Incomum", basico: "31–81", avancado: "12–34" },
      { resultado: "Raro", basico: "82–98", avancado: "35–70" },
      { resultado: "Muito raro", basico: "99–00", avancado: "71–93" },
      { resultado: "Lendário", basico: "—", avancado: "94–00" }
    ]
  }
];

window.exibicaoPorId = function (id) {
  var achadas = window.EXIBICOES.filter(function (item) {
    return item.id === id;
  });
  return achadas[0] || null;
};
