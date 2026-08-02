/* Catálogo de A Última Provisão (Bram Barbacobre).
 *
 * Transcrito de referencias/loja.md: capítulo 6 do Livro do Jogador de 2024,
 * sem armas de fogo, com piso de 1 PO por produto. Preços em PO.
 */
/* Maestrias do PHB 2024 em inglês e português.
 *
 * As traduções seguem o guia de equipamentos do Critical20 (cap. 6 do PHB
 * 2024). Não foram conferidas contra o Livro do Jogador oficial em pt-BR, e
 * outros sites usam termos diferentes para as mesmas maestrias — corrigir aqui
 * ajusta a tabela inteira.
 */
window.MAESTRIAS_PT = {
  Cleave: "Trespassar",
  Graze: "Garantido",
  Nick: "Ágil",
  Push: "Empurrar",
  Sap: "Drenar",
  Slow: "Lentidão",
  Topple: "Derrubar",
  Vex: "Afligir"
};

window.CATALOGO_BRAM = [
  {
    id: "armas-simples-cc",
    nome: "Armas simples corpo a corpo",
    colunas: [
      { chave: "dano", titulo: "Dano" },
      { chave: "propriedades", titulo: "Propriedades" },
      { chave: "maestria", titulo: "Maestria" }
    ],
    itens: [
      { nome: "Club", preco: 1, dano: "1d4 contundente", propriedades: "Leve", maestria: "Slow" },
      { nome: "Dagger", preco: 2, dano: "1d4 perfurante", propriedades: "Acuidade, leve, arremesso 20/60", maestria: "Nick" },
      { nome: "Greatclub", preco: 1, dano: "1d8 contundente", propriedades: "Duas mãos", maestria: "Push" },
      { nome: "Handaxe", preco: 5, dano: "1d6 cortante", propriedades: "Leve, arremesso 20/60", maestria: "Vex" },
      { nome: "Javelin", preco: 1, dano: "1d6 perfurante", propriedades: "Arremesso 30/120", maestria: "Slow" },
      { nome: "Light Hammer", preco: 2, dano: "1d4 contundente", propriedades: "Leve, arremesso 20/60", maestria: "Nick" },
      { nome: "Mace", preco: 5, dano: "1d6 contundente", propriedades: "—", maestria: "Sap" },
      { nome: "Quarterstaff", preco: 1, dano: "1d6 contundente", propriedades: "Versátil 1d8", maestria: "Topple" },
      { nome: "Sickle", preco: 1, dano: "1d4 cortante", propriedades: "Leve", maestria: "Nick" },
      { nome: "Spear", preco: 1, dano: "1d6 perfurante", propriedades: "Arremesso 20/60, versátil 1d8", maestria: "Sap" }
    ]
  },
  {
    id: "armas-simples-distancia",
    nome: "Armas simples à distância",
    colunas: [
      { chave: "dano", titulo: "Dano" },
      { chave: "propriedades", titulo: "Propriedades" },
      { chave: "maestria", titulo: "Maestria" }
    ],
    itens: [
      { nome: "Dart", preco: 1, dano: "1d4 perfurante", propriedades: "Acuidade, arremesso 20/60", maestria: "Vex" },
      { nome: "Light Crossbow", preco: 25, dano: "1d8 perfurante", propriedades: "Munição 80/320, recarga, duas mãos", maestria: "Slow" },
      { nome: "Shortbow", preco: 25, dano: "1d6 perfurante", propriedades: "Munição 80/320, duas mãos", maestria: "Vex" },
      { nome: "Sling", preco: 1, dano: "1d4 contundente", propriedades: "Munição 30/120", maestria: "Slow" }
    ]
  },
  {
    id: "armas-marciais-cc",
    nome: "Armas marciais corpo a corpo",
    colunas: [
      { chave: "dano", titulo: "Dano" },
      { chave: "propriedades", titulo: "Propriedades" },
      { chave: "maestria", titulo: "Maestria" }
    ],
    itens: [
      { nome: "Battleaxe", preco: 10, dano: "1d8 cortante", propriedades: "Versátil 1d10", maestria: "Topple" },
      { nome: "Flail", preco: 10, dano: "1d8 contundente", propriedades: "—", maestria: "Sap" },
      { nome: "Glaive", preco: 20, dano: "1d10 cortante", propriedades: "Pesada, alcance, duas mãos", maestria: "Graze" },
      { nome: "Greataxe", preco: 30, dano: "1d12 cortante", propriedades: "Pesada, duas mãos", maestria: "Cleave" },
      { nome: "Greatsword", preco: 50, dano: "2d6 cortante", propriedades: "Pesada, duas mãos", maestria: "Graze" },
      { nome: "Halberd", preco: 20, dano: "1d10 cortante", propriedades: "Pesada, alcance, duas mãos", maestria: "Cleave" },
      { nome: "Lance", preco: 10, dano: "1d10 perfurante", propriedades: "Pesada, alcance, duas mãos exceto montado", maestria: "Topple" },
      { nome: "Longsword", preco: 15, dano: "1d8 cortante", propriedades: "Versátil 1d10", maestria: "Sap" },
      { nome: "Maul", preco: 10, dano: "2d6 contundente", propriedades: "Pesada, duas mãos", maestria: "Topple" },
      { nome: "Morningstar", preco: 15, dano: "1d8 perfurante", propriedades: "—", maestria: "Sap" },
      { nome: "Pike", preco: 5, dano: "1d10 perfurante", propriedades: "Pesada, alcance, duas mãos", maestria: "Push" },
      { nome: "Rapier", preco: 25, dano: "1d8 perfurante", propriedades: "Acuidade", maestria: "Vex" },
      { nome: "Scimitar", preco: 25, dano: "1d6 cortante", propriedades: "Acuidade, leve", maestria: "Nick" },
      { nome: "Shortsword", preco: 10, dano: "1d6 perfurante", propriedades: "Acuidade, leve", maestria: "Vex" },
      { nome: "Trident", preco: 5, dano: "1d8 perfurante", propriedades: "Arremesso 20/60, versátil 1d10", maestria: "Topple" },
      { nome: "Warhammer", preco: 15, dano: "1d8 contundente", propriedades: "Versátil 1d10", maestria: "Push" },
      { nome: "War Pick", preco: 5, dano: "1d8 perfurante", propriedades: "Versátil 1d10", maestria: "Sap" },
      { nome: "Whip", preco: 2, dano: "1d4 cortante", propriedades: "Acuidade, alcance", maestria: "Slow" }
    ]
  },
  {
    id: "armas-marciais-distancia",
    nome: "Armas marciais à distância",
    colunas: [
      { chave: "dano", titulo: "Dano" },
      { chave: "propriedades", titulo: "Propriedades" },
      { chave: "maestria", titulo: "Maestria" }
    ],
    itens: [
      { nome: "Blowgun", preco: 10, dano: "1 perfurante", propriedades: "Munição 25/100, recarga", maestria: "Vex" },
      { nome: "Hand Crossbow", preco: 75, dano: "1d6 perfurante", propriedades: "Munição 30/120, leve, recarga", maestria: "Vex" },
      { nome: "Heavy Crossbow", preco: 50, dano: "1d10 perfurante", propriedades: "Munição 100/400, pesada, recarga, duas mãos", maestria: "Push" },
      { nome: "Longbow", preco: 50, dano: "1d8 perfurante", propriedades: "Munição 150/600, pesada, duas mãos", maestria: "Slow" }
    ]
  },
  {
    id: "armaduras-leves",
    nome: "Armaduras leves",
    colunas: [
      { chave: "ca", titulo: "Classe de Armadura" },
      { chave: "furtividade", titulo: "Furtividade" }
    ],
    itens: [
      { nome: "Padded Armor", preco: 5, ca: "11 + Des", furtividade: "Desvantagem" },
      { nome: "Leather Armor", preco: 10, ca: "11 + Des", furtividade: "Normal" },
      { nome: "Studded Leather Armor", preco: 45, ca: "12 + Des", furtividade: "Normal" }
    ]
  },
  {
    id: "armaduras-medias",
    nome: "Armaduras médias",
    colunas: [
      { chave: "ca", titulo: "Classe de Armadura" },
      { chave: "furtividade", titulo: "Furtividade" }
    ],
    itens: [
      { nome: "Hide Armor", preco: 10, ca: "12 + Des, máximo +2", furtividade: "Normal" },
      { nome: "Chain Shirt", preco: 50, ca: "13 + Des, máximo +2", furtividade: "Normal" },
      { nome: "Scale Mail", preco: 50, ca: "14 + Des, máximo +2", furtividade: "Desvantagem" },
      { nome: "Breastplate", preco: 400, ca: "14 + Des, máximo +2", furtividade: "Normal" },
      { nome: "Half Plate Armor", preco: 750, ca: "15 + Des, máximo +2", furtividade: "Desvantagem" }
    ]
  },
  {
    id: "armaduras-pesadas",
    nome: "Armaduras pesadas",
    colunas: [
      { chave: "ca", titulo: "Classe de Armadura" },
      { chave: "forca", titulo: "Força" },
      { chave: "furtividade", titulo: "Furtividade" }
    ],
    itens: [
      { nome: "Ring Mail", preco: 30, ca: "14", forca: "—", furtividade: "Desvantagem" },
      { nome: "Chain Mail", preco: 75, ca: "16", forca: "13", furtividade: "Desvantagem" },
      { nome: "Splint Armor", preco: 200, ca: "17", forca: "15", furtividade: "Desvantagem" },
      { nome: "Plate Armor", preco: 1500, ca: "18", forca: "15", furtividade: "Desvantagem" }
    ]
  },
  {
    id: "escudo",
    nome: "Escudo",
    colunas: [{ chave: "efeito", titulo: "Efeito" }],
    itens: [{ nome: "Shield", preco: 10, efeito: "+2 na Classe de Armadura" }]
  },
  {
    id: "municoes",
    nome: "Munições",
    colunas: [{ chave: "quantidade", titulo: "Quantidade" }],
    itens: [
      { nome: "Arrows", preco: 1, quantidade: "20" },
      { nome: "Crossbow Bolts", preco: 1, quantidade: "20" },
      { nome: "Sling Bullets", preco: 1, quantidade: "20" },
      { nome: "Blowgun Needles", preco: 1, quantidade: "50" }
    ]
  },
  {
    id: "pocoes",
    nome: "Poções de cura",
    nota: "Beber ou administrar a poção exige uma Ação Bônus; depois disso, ela é consumida.",
    colunas: [
      { chave: "raridade", titulo: "Raridade" },
      { chave: "efeito", titulo: "Efeito" }
    ],
    itens: [
      { nome: "Potion of Healing", preco: 50, raridade: "Comum", efeito: "Recupera 2d4 + 2 Pontos de Vida" },
      { nome: "Potion of Greater Healing", preco: 200, raridade: "Incomum", efeito: "Recupera 4d4 + 4 Pontos de Vida" }
    ]
  }
];
