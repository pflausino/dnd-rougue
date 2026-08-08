/* Blocos de estatística dos monstros de referencias/aventura.md, seção 15.
 *
 * Transcrito das fichas oficiais de D&D 5e (2025 Monster Manual, exceto onde
 * anotado) para consulta rápida durante a mesa. Nomes de ações/traços e
 * termos de regra ficam em inglês, como nas fichas; o resto é descrição em
 * português para leitura rápida no meio do combate.
 *
 * O formato de 2025 mudou o bloco: entrou a linha de Iniciativa, o
 * equipamento saiu do parêntese da CA e virou linha própria (`equipamento`),
 * e ações bônus ganharam seção separada (`acoesBonus`). Onde a ficha de 2025
 * renomeou a criatura, o `id` continua o antigo — ele casa com
 * webapp/data/loot.js e mudar um nome aqui não muda o outro arquivo.
 */
window.GRUPOS_MONSTROS = [
  { id: "ritual", titulo: "Sala do Ritual" },
  { id: "lancas", titulo: "Caminho fácil — Corredor das Lanças" },
  { id: "tesouro", titulo: "Caminho difícil — Câmara do Tesouro" },
  { id: "arena-goblin", titulo: "Arena I — Horda Goblin" },
  { id: "arena-hobgoblin", titulo: "Arena II — Falange Hobgoblin" },
  { id: "arena-monte", titulo: "Arena III — Monte Errante" },
  { id: "chefe-final", titulo: "Chefe final — Draconidra" }
];

window.MONSTROS = [
  {
    id: "ghast",
    nome: "Ghast",
    quantidade: 5,
    encontro: "ritual",
    classificacao: "Morto-vivo médio, caótico e mau",
    ca: 13,
    iniciativa: "+3 (13)",
    pv: 36,
    pvDado: "8d8",
    deslocamento: "30 pés",
    atributos: { for: 16, des: 17, con: 10, int: 11, sab: 10, car: 8 },
    salvaguardas: "Wis +2",
    resistenciasDano: "necrótico",
    imunidadesDano: "veneno",
    imunidadesCondicao: "enfeitiçado, exaustão, envenenado",
    sentidos: "visão no escuro 60 pés, Percepção passiva 10",
    idiomas: "Comum",
    nd: "2 (450 XP)",
    tracos: [
      {
        nome: "Stench",
        texto: "Salvaguarda de Constituição CD 10 para toda criatura que começa o turno numa Emanação de 5 pés a partir do ghast. Falha: fica envenenada até o início do próximo turno dela. Sucesso: fica imune ao Stench deste ghast por 24 horas."
      }
    ],
    acoes: [
      {
        nome: "Bite",
        texto: "Ataque corpo a corpo: +5 para acertar, alcance 5 pés. Acerto: 7 (1d8 + 3) de dano perfurante mais 9 (2d8) de dano necrótico.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 5 },
          { rotulo: "Dano", dado: "1d8", bonus: 3, tipo: "perfurante" },
          { rotulo: "Dano (necrótico)", dado: "2d8", bonus: 0, tipo: "necrótico" }
        ]
      },
      {
        nome: "Claw",
        texto: "Ataque corpo a corpo: +5 para acertar, alcance 5 pés. Acerto: 10 (2d6 + 3) de dano cortante. Se o alvo for uma criatura não morta-viva, faz uma salvaguarda de Constituição CD 10; em uma falha, fica paralisado até o fim do próximo turno dele.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 5 },
          { rotulo: "Dano", dado: "2d6", bonus: 3, tipo: "cortante" }
        ]
      }
    ],
    fonte: "Monster Manual (2025)"
  },
  {
    id: "wraith",
    nome: "Wraith",
    quantidade: 1,
    encontro: "ritual",
    classificacao: "Morto-vivo pequeno ou médio, neutro e mau",
    ca: 13,
    iniciativa: "+3 (13)",
    pv: 67,
    pvDado: "9d8 + 27",
    deslocamento: "5 pés, voo 60 pés (flutua)",
    atributos: { for: 6, des: 16, con: 16, int: 12, sab: 14, car: 15 },
    resistenciasDano: "ácido, contundente, cortante, frio, fogo, perfurante",
    imunidadesDano: "necrótico, veneno",
    imunidadesCondicao: "enfeitiçado, exaustão, agarrado, paralisado, petrificado, envenenado, caído, contido, inconsciente",
    sentidos: "visão no escuro 60 pés, Percepção passiva 12",
    idiomas: "Comum mais dois outros idiomas",
    nd: "5 (1.800 XP)",
    tracos: [
      {
        nome: "Incorporeal Movement",
        texto: "Move-se através de criaturas e objetos como se fossem terreno difícil. Sofre 5 (1d10) de dano de força se terminar o turno dentro de um objeto."
      },
      {
        nome: "Sunlight Sensitivity",
        texto: "Sob luz do sol, tem desvantagem em testes de habilidade e em rolagens de ataque."
      }
    ],
    acoes: [
      {
        nome: "Life Drain",
        texto: "Ataque corpo a corpo: +6 para acertar, alcance 5 pés. Acerto: 21 (4d8 + 3) de dano necrótico. Se o alvo for uma criatura, seu máximo de PV diminui em um valor igual ao dano sofrido — não há mais salvaguarda contra isso.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 6 },
          { rotulo: "Dano", dado: "4d8", bonus: 3, tipo: "necrótico" }
        ]
      },
      {
        nome: "Create Specter",
        texto: "Escolhe o corpo de um humanoide a até 10 pés que morreu há no máximo 1 minuto. O espírito se levanta como specter sob controle do wraith, no espaço do corpo ou no espaço livre mais próximo. No máximo sete specters sob controle ao mesmo tempo."
      }
    ],
    fonte: "Monster Manual (2025)"
  },
  {
    id: "bone-devil",
    nome: "Bone Devil",
    quantidade: 1,
    nota: "Só entra em jogo se o ritual não for interrompido em três rodadas.",
    encontro: "ritual",
    classificacao: "Diabo grande, leal e mau",
    ca: 16,
    iniciativa: "+7 (17)",
    pv: 161,
    pvDado: "17d10 + 68",
    deslocamento: "40 pés, voo 40 pés",
    atributos: { for: 18, des: 16, con: 18, int: 13, sab: 14, car: 16 },
    salvaguardas: "Str +8, Int +5, Wis +6, Cha +7",
    pericias: "Deception +7, Insight +6",
    resistenciasDano: "frio",
    imunidadesDano: "fogo, veneno",
    imunidadesCondicao: "envenenado",
    sentidos: "visão no escuro 120 pés (não atrapalhada por escuridão mágica), Percepção passiva 12",
    idiomas: "Infernal, telepatia 120 pés",
    nd: "9 (5.000 XP)",
    tracos: [
      {
        nome: "Diabolical Restoration",
        texto: "Se morrer fora dos Nove Infernos, o corpo some numa fumaça sulfurosa e ele ganha um corpo novo no ato, revivendo com todos os PV em algum lugar dos Nove Infernos."
      },
      { nome: "Magic Resistance", texto: "Vantagem em salvaguardas contra magias e outros efeitos mágicos." }
    ],
    acoes: [
      { nome: "Multiattack", texto: "Faz dois ataques de Claw e um de Infernal Sting." },
      {
        nome: "Claw",
        texto: "Ataque corpo a corpo: +8 para acertar, alcance 10 pés. Acerto: 13 (2d8 + 4) de dano cortante.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 8 },
          { rotulo: "Dano", dado: "2d8", bonus: 4, tipo: "cortante" }
        ]
      },
      {
        nome: "Infernal Sting",
        texto: "Ataque corpo a corpo: +8 para acertar, alcance 10 pés. Acerto: 15 (2d10 + 4) de dano perfurante mais 18 (4d8) de dano de veneno, e o alvo fica envenenado até o início do próximo turno do diabo. Enquanto envenenado assim, o alvo não recupera PV.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 8 },
          { rotulo: "Dano", dado: "2d10", bonus: 4, tipo: "perfurante" },
          { rotulo: "Dano (veneno)", dado: "4d8", bonus: 0, tipo: "veneno" }
        ]
      }
    ],
    fonte: "Monster Manual (2025)",
    notaEncontro: "Impedir a invocação concede a recompensa dele mesmo assim — referencias/aventura.md §5."
  },
  {
    id: "flameskull",
    nome: "Flameskull",
    quantidade: 2,
    encontro: "lancas",
    classificacao: "Morto-vivo minúsculo, neutro e mau",
    ca: 13,
    iniciativa: "+3 (13)",
    pv: 40,
    pvDado: "9d4 + 18",
    deslocamento: "5 pés, voo 40 pés (flutua)",
    atributos: { for: 1, des: 17, con: 14, int: 16, sab: 10, car: 11 },
    pericias: "Arcana +5, Perception +2",
    imunidadesDano: "fogo, necrótico, veneno",
    imunidadesCondicao: "enfeitiçado, exaustão, amedrontado, paralisado, envenenado, caído",
    sentidos: "visão no escuro 60 pés, Percepção passiva 12",
    idiomas: "Comum mais dois outros idiomas",
    nd: "4 (1.100 XP)",
    tracos: [
      {
        nome: "Illumination",
        texto: "Emite luz forte num raio de 15 pés e luz fraca por outros 15 pés."
      },
      { nome: "Magic Resistance", texto: "Vantagem em salvaguardas contra magias e outros efeitos mágicos." },
      {
        nome: "Undead Restoration",
        texto: "Se destruído, recupera todos os PV em 1 hora — a menos que respinguem água benta sobre os restos ou lancem dispel evil and good sobre eles."
      }
    ],
    acoes: [
      { nome: "Multiattack", texto: "Faz dois ataques de Fire Ray." },
      {
        nome: "Fire Ray",
        texto: "Ataque corpo a corpo ou à distância: +5 para acertar, alcance 5 pés ou 60 pés. Acerto: 13 (3d6 + 3) de dano de fogo.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 5 },
          { rotulo: "Dano", dado: "3d6", bonus: 3, tipo: "fogo" }
        ]
      },
      {
        nome: "Spellcasting",
        texto: "Conjura uma das magias abaixo sem componentes somáticos ou materiais, usando Inteligência (CD de salvaguarda 13). À vontade: mage hand. 1/dia: fireball. 2/dia: magic missile (versão de 2º nível)."
      }
    ],
    fonte: "Monster Manual (2025)",
    notaEncontro: "Em falha crítica no corredor, os dois lançam fireball sobre o mesmo alvo — cada um tem uma única carga por dia, referencias/aventura.md §6."
  },
  {
    id: "young-gold-dragon",
    nome: "Young Gold Dragon",
    quantidade: 1,
    encontro: "tesouro",
    classificacao: "Dragão grande (metálico), leal e bom",
    ca: 18,
    iniciativa: "+6 (16)",
    pv: 178,
    pvDado: "17d10 + 85",
    deslocamento: "40 pés, voo 80 pés, natação 40 pés",
    atributos: { for: 23, des: 14, con: 21, int: 16, sab: 13, car: 20 },
    salvaguardas: "Dex +6, Wis +5",
    pericias: "Insight +5, Perception +9, Persuasion +9, Stealth +6",
    imunidadesDano: "fogo",
    sentidos: "visão cega 30 pés, visão no escuro 120 pés, Percepção passiva 19",
    idiomas: "Comum, Dracônico",
    nd: "10 (5.900 XP)",
    tracos: [{ nome: "Amphibious", texto: "Respira ar e água." }],
    acoes: [
      { nome: "Multiattack", texto: "Faz três ataques de Rend. Pode trocar um deles por um uso de Weakening Breath." },
      {
        nome: "Rend",
        texto: "Ataque corpo a corpo: +10 para acertar, alcance 10 pés. Acerto: 17 (2d10 + 6) de dano cortante.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 10 },
          { rotulo: "Dano", dado: "2d10", bonus: 6, tipo: "cortante" }
        ]
      },
      {
        nome: "Fire Breath (Recarga 5)",
        texto: "Salvaguarda de Destreza CD 17 para cada criatura num cone de 30 pés. Falha: 55 (10d10) de dano de fogo. Sucesso: metade do dano.",
        rolagens: [{ rotulo: "Dano", dado: "10d10", bonus: 0, tipo: "fogo" }]
      },
      {
        nome: "Weakening Breath",
        texto: "Salvaguarda de Força CD 17 para cada criatura num cone de 30 pés que ainda não esteja sob este efeito. Falha: desvantagem em testes de d20 baseados em Força e subtrai 3 (1d6) das próprias rolagens de dano. Repete a salvaguarda ao fim de cada turno; depois de 1 minuto, o sucesso é automático.",
        rolagens: [{ rotulo: "Redução de dano", dado: "1d6", bonus: 0 }]
      }
    ],
    fonte: "Monster Manual (2025)",
    notaEncontro: "Motivo dele atacar o grupo ainda está em aberto — referencias/aventura.md §7 (pendente)."
  },
  {
    id: "mimic",
    nome: "Mimic",
    quantidade: 1,
    nota: "Disfarçado do baú de tesouro; dá a Lâmina Solar.",
    encontro: "tesouro",
    classificacao: "Monstruosidade média, neutra",
    ca: 12,
    iniciativa: "+3 (13)",
    pv: 58,
    pvDado: "9d8 + 18",
    deslocamento: "20 pés",
    atributos: { for: 17, des: 12, con: 15, int: 5, sab: 13, car: 8 },
    pericias: "Stealth +5",
    imunidadesDano: "ácido",
    imunidadesCondicao: "caído",
    sentidos: "visão no escuro 60 pés, Percepção passiva 11",
    idiomas: "—",
    nd: "2 (450 XP)",
    tracos: [
      {
        nome: "Adhesive (só na forma de objeto)",
        texto: "Adere a qualquer coisa que o toque. Uma criatura Enorme ou menor colada nele fica agarrada (CD de fuga 13); testes para escapar desse agarrão têm desvantagem."
      }
    ],
    acoes: [
      {
        nome: "Bite",
        texto: "Ataque corpo a corpo: +5 para acertar (com vantagem se o alvo já estiver agarrado pelo mimic), alcance 5 pés. Acerto: 7 (1d8 + 3) de dano perfurante — ou 12 (2d8 + 3) se o alvo estiver agarrado pelo mimic — mais 4 (1d8) de dano ácido.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 5 },
          { rotulo: "Dano", dado: "1d8", bonus: 3, tipo: "perfurante" },
          { rotulo: "Dano (agarrado)", dado: "2d8", bonus: 3, tipo: "perfurante" },
          { rotulo: "Dano (ácido)", dado: "1d8", bonus: 0, tipo: "ácido" }
        ]
      },
      {
        nome: "Pseudopod",
        texto: "Ataque corpo a corpo: +5 para acertar, alcance 5 pés. Acerto: 7 (1d8 + 3) de dano contundente mais 4 (1d8) de dano ácido. Se o alvo for uma criatura Grande ou menor, fica agarrado (CD de fuga 13); testes para escapar têm desvantagem.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 5 },
          { rotulo: "Dano", dado: "1d8", bonus: 3, tipo: "contundente" },
          { rotulo: "Dano (ácido)", dado: "1d8", bonus: 0, tipo: "ácido" }
        ]
      }
    ],
    acoesBonus: [
      {
        nome: "Shape-Shift",
        texto: "Assume a forma de um objeto Médio ou Pequeno, ou volta à forma verdadeira de gosma. As estatísticas não mudam. Equipamento que carrega não se transforma."
      }
    ],
    fonte: "Monster Manual (2025)"
  },
  {
    id: "flying-sword",
    nome: "Animated Flying Sword",
    apelido: "Espada Voadora",
    quantidade: 4,
    encontro: "tesouro",
    classificacao: "Constructo pequeno, sem alinhamento",
    ca: 17,
    iniciativa: "+4 (14)",
    pv: 14,
    pvDado: "4d6",
    deslocamento: "5 pés, voo 50 pés (flutua)",
    atributos: { for: 12, des: 15, con: 11, int: 1, sab: 5, car: 1 },
    salvaguardas: "Dex +4",
    imunidadesDano: "veneno, psíquico",
    imunidadesCondicao: "enfeitiçado, surdo, exaustão, amedrontado, paralisado, petrificado, envenenado",
    sentidos: "visão cega 60 pés, Percepção passiva 7",
    idiomas: "—",
    nd: "1/4 (50 XP)",
    acoes: [
      {
        nome: "Slash",
        texto: "Ataque corpo a corpo: +4 para acertar, alcance 5 pés. Acerto: 6 (1d8 + 2) de dano cortante.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 4 },
          { rotulo: "Dano", dado: "1d8", bonus: 2, tipo: "cortante" }
        ]
      }
    ],
    fonte: "Monster Manual (2025)",
    notaEncontro: "A ficha de 2025 tirou Antimagic Susceptibility e False Appearance — antimagia não desliga mais a espada, e o disfarce na parede é decisão de cena, não traço."
  },
  {
    id: "goblin",
    nome: "Goblin Warrior",
    quantidade: 12,
    encontro: "arena-goblin",
    classificacao: "Fada pequena (goblinoide), caótica e neutra",
    ca: 15,
    iniciativa: "+2 (12)",
    pv: 10,
    pvDado: "3d6",
    deslocamento: "30 pés",
    atributos: { for: 8, des: 15, con: 10, int: 10, sab: 8, car: 8 },
    pericias: "Stealth +6",
    equipamento: "armadura de couro, cimitarra, escudo, arco curto",
    sentidos: "visão no escuro 60 pés, Percepção passiva 9",
    idiomas: "Comum, Goblin",
    nd: "1/4 (50 XP)",
    acoes: [
      {
        nome: "Scimitar",
        texto: "Ataque corpo a corpo: +4 para acertar, alcance 5 pés. Acerto: 5 (1d6 + 2) de dano cortante, mais 2 (1d4) de dano cortante se a rolagem de ataque teve vantagem.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 4 },
          { rotulo: "Dano", dado: "1d6", bonus: 2, tipo: "cortante" },
          { rotulo: "Dano (com vantagem)", dado: "1d4", bonus: 0, tipo: "cortante" }
        ]
      },
      {
        nome: "Shortbow",
        texto: "Ataque à distância: +4 para acertar, alcance 80/320 pés. Acerto: 5 (1d6 + 2) de dano perfurante, mais 2 (1d4) de dano perfurante se a rolagem de ataque teve vantagem.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 4 },
          { rotulo: "Dano", dado: "1d6", bonus: 2, tipo: "perfurante" },
          { rotulo: "Dano (com vantagem)", dado: "1d4", bonus: 0, tipo: "perfurante" }
        ]
      }
    ],
    acoesBonus: [
      { nome: "Nimble Escape", texto: "Realiza a ação Disengage ou Hide." }
    ],
    fonte: "Monster Manual (2025)",
    notaEncontro: "Entram em ondas de 3 no fim das rodadas 1 e 2, enquanto o Boss viver — referencias/aventura.md §9."
  },
  {
    id: "goblin-boss",
    nome: "Goblin Boss",
    quantidade: 1,
    encontro: "arena-goblin",
    classificacao: "Fada pequena (goblinoide), caótica e neutra",
    ca: 17,
    iniciativa: "+2 (12)",
    pv: 21,
    pvDado: "6d6",
    deslocamento: "30 pés",
    atributos: { for: 10, des: 15, con: 10, int: 10, sab: 8, car: 10 },
    pericias: "Stealth +6",
    equipamento: "camisa de malha, cimitarra, escudo, arco curto",
    sentidos: "visão no escuro 60 pés, Percepção passiva 9",
    idiomas: "Comum, Goblin",
    nd: "1 (200 XP)",
    acoes: [
      { nome: "Multiattack", texto: "Faz dois ataques, com Scimitar ou Shortbow em qualquer combinação." },
      {
        nome: "Scimitar",
        texto: "Ataque corpo a corpo: +4 para acertar, alcance 5 pés. Acerto: 5 (1d6 + 2) de dano cortante, mais 2 (1d4) de dano cortante se a rolagem de ataque teve vantagem.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 4 },
          { rotulo: "Dano", dado: "1d6", bonus: 2, tipo: "cortante" },
          { rotulo: "Dano (com vantagem)", dado: "1d4", bonus: 0, tipo: "cortante" }
        ]
      },
      {
        nome: "Shortbow",
        texto: "Ataque à distância: +4 para acertar, alcance 80/320 pés. Acerto: 5 (1d6 + 2) de dano perfurante, mais 2 (1d4) de dano perfurante se a rolagem de ataque teve vantagem.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 4 },
          { rotulo: "Dano", dado: "1d6", bonus: 2, tipo: "perfurante" },
          { rotulo: "Dano (com vantagem)", dado: "1d4", bonus: 0, tipo: "perfurante" }
        ]
      }
    ],
    acoesBonus: [
      { nome: "Nimble Escape", texto: "Realiza a ação Disengage ou Hide." }
    ],
    reacoes: [
      {
        nome: "Redirect Attack",
        texto: "Gatilho: uma criatura que ele vê faz uma rolagem de ataque contra ele. Resposta: escolhe um aliado Pequeno ou Médio a até 5 pés. Os dois trocam de lugar e o aliado passa a ser o alvo do ataque."
      }
    ],
    fonte: "Monster Manual (2025)",
    notaEncontro: "Reforços param de entrar quando ele morre; os goblins restantes fogem no fim da rodada — referencias/aventura.md §9."
  },
  {
    id: "hobgoblin",
    nome: "Hobgoblin Warrior",
    quantidade: 6,
    encontro: "arena-hobgoblin",
    classificacao: "Fada média (goblinoide), leal e má",
    ca: 18,
    iniciativa: "+3 (13)",
    pv: 11,
    pvDado: "2d8 + 2",
    deslocamento: "30 pés",
    atributos: { for: 13, des: 12, con: 12, int: 10, sab: 10, car: 9 },
    equipamento: "meia-armadura, escudo, espada longa, arco longo",
    sentidos: "visão no escuro 60 pés, Percepção passiva 10",
    idiomas: "Comum, Goblin",
    nd: "1/2 (100 XP)",
    tracos: [
      {
        nome: "Pack Tactics",
        texto: "Tem vantagem numa rolagem de ataque contra uma criatura se pelo menos um aliado do hobgoblin estiver a até 5 pés dela e não estiver incapacitado."
      }
    ],
    acoes: [
      {
        nome: "Longsword",
        texto: "Ataque corpo a corpo: +3 para acertar, alcance 5 pés. Acerto: 12 (2d10 + 1) de dano cortante.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 3 },
          { rotulo: "Dano", dado: "2d10", bonus: 1, tipo: "cortante" }
        ]
      },
      {
        nome: "Longbow",
        texto: "Ataque à distância: +3 para acertar, alcance 150/600 pés. Acerto: 5 (1d8 + 1) de dano perfurante mais 7 (3d4) de dano de veneno.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 3 },
          { rotulo: "Dano", dado: "1d8", bonus: 1, tipo: "perfurante" },
          { rotulo: "Dano (veneno)", dado: "3d4", bonus: 0, tipo: "veneno" }
        ]
      }
    ],
    fonte: "Monster Manual (2025)",
    notaEncontro: "4 na linha de frente, 2 como arqueiros; ficam colados nos alvos para ativar Pack Tactics — referencias/aventura.md §10."
  },
  {
    id: "hobgoblin-captain",
    nome: "Hobgoblin Captain",
    quantidade: 1,
    encontro: "arena-hobgoblin",
    classificacao: "Fada média (goblinoide), leal e má",
    ca: 17,
    iniciativa: "+4 (14)",
    pv: 58,
    pvDado: "9d8 + 18",
    deslocamento: "30 pés",
    atributos: { for: 15, des: 14, con: 14, int: 12, sab: 10, car: 13 },
    equipamento: "meia-armadura, espada grande, arco longo",
    sentidos: "visão no escuro 60 pés, Percepção passiva 10",
    idiomas: "Comum, Goblin",
    nd: "3 (700 XP)",
    tracos: [
      {
        nome: "Aura of Authority",
        texto: "Numa Emanação de 10 pés a partir do capitão, ele e seus aliados têm vantagem em rolagens de ataque e em salvaguardas, desde que o capitão não esteja incapacitado."
      }
    ],
    acoes: [
      { nome: "Multiattack", texto: "Faz dois ataques, com Greatsword ou Longbow em qualquer combinação." },
      {
        nome: "Greatsword",
        texto: "Ataque corpo a corpo: +4 para acertar, alcance 5 pés. Acerto: 9 (2d6 + 2) de dano cortante mais 3 (1d6) de dano de veneno.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 4 },
          { rotulo: "Dano", dado: "2d6", bonus: 2, tipo: "cortante" },
          { rotulo: "Dano (veneno)", dado: "1d6", bonus: 0, tipo: "veneno" }
        ]
      },
      {
        nome: "Longbow",
        texto: "Ataque à distância: +4 para acertar, alcance 150/600 pés. Acerto: 6 (1d8 + 2) de dano perfurante mais 5 (2d4) de dano de veneno.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 4 },
          { rotulo: "Dano", dado: "1d8", bonus: 2, tipo: "perfurante" },
          { rotulo: "Dano (veneno)", dado: "2d4", bonus: 0, tipo: "veneno" }
        ]
      }
    ],
    fonte: "Monster Manual (2025)",
    notaEncontro: "Ordena o avanço com metade dos PV; a Aura of Authority se move com ele, então a formação encolhe em vez de se espalhar — referencias/aventura.md §10."
  },
  {
    id: "shambling-mound",
    nome: "Shambling Mound",
    apelido: "Monte Errante",
    quantidade: 1,
    encontro: "arena-monte",
    classificacao: "Planta grande, sem alinhamento",
    ca: 15,
    iniciativa: "-1 (9)",
    pv: 110,
    pvDado: "13d10 + 39",
    deslocamento: "30 pés, natação 20 pés",
    atributos: { for: 18, des: 8, con: 16, int: 5, sab: 10, car: 5 },
    pericias: "Stealth +3",
    resistenciasDano: "frio, fogo",
    imunidadesDano: "elétrico",
    imunidadesCondicao: "surdo, exaustão",
    sentidos: "visão cega 60 pés, Percepção passiva 10",
    idiomas: "—",
    nd: "5 (1.800 XP)",
    tracos: [
      {
        nome: "Lightning Absorption",
        texto: "Sempre que sofrer dano elétrico, não sofre dano e recupera PV iguais ao dano elétrico recebido."
      }
    ],
    acoes: [
      {
        nome: "Multiattack",
        texto: "Faz três ataques de Charged Tendril. Pode trocar um deles por um uso de Engulf."
      },
      {
        nome: "Charged Tendril",
        texto: "Ataque corpo a corpo: +7 para acertar, alcance 10 pés. Acerto: 7 (1d6 + 4) de dano contundente mais 5 (2d4) de dano elétrico. Se o alvo for uma criatura Média ou menor, é puxado 5 pés em linha reta na direção do monte.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 7 },
          { rotulo: "Dano", dado: "1d6", bonus: 4, tipo: "contundente" },
          { rotulo: "Dano (elétrico)", dado: "2d4", bonus: 0, tipo: "elétrico" }
        ]
      },
      {
        nome: "Engulf",
        texto: "Salvaguarda de Força CD 15 para uma criatura Média ou menor a até 5 pés. Falha: é puxada para o espaço do monte e fica agarrada (CD de fuga 14), cega e contida, sofrendo 10 (3d6) de dano elétrico no início de cada turno dela. Ao se mover, o monte leva o alvo junto. Só engole uma criatura por vez.",
        rolagens: [{ rotulo: "Dano (elétrico)", dado: "3d6", bonus: 0, tipo: "elétrico" }]
      }
    ],
    fonte: "Monster Manual (2025)",
    notaEncontro: "Os condutores elétricos da arena o curam com Lightning Absorption — números ainda pendentes, referencias/aventura.md §11."
  },
  {
    id: "dracohydra",
    nome: "Dracohydra",
    apelido: "Draconidra",
    quantidade: 1,
    encontro: "chefe-final",
    classificacao: "Monstruosidade enorme, caótica e má (tipicamente)",
    ca: 17,
    caObs: "armadura natural",
    pv: 218,
    pvDado: "19d12 + 95",
    deslocamento: "30 pés, voo 30 pés, natação 30 pés",
    atributos: { for: 20, des: 12, con: 20, int: 6, sab: 12, car: 12 },
    pericias: "Perception +9",
    sentidos: "visão no escuro 60 pés, Percepção passiva 19",
    idiomas: "entende Dracônico, mas não consegue falar",
    nd: "11 (7.200 XP)",
    tracos: [
      {
        nome: "Multiple Heads",
        texto: "Tem cinco cabeças. Vantagem em salvaguardas contra ficar cega, enfeitiçada, surda, amedrontada, atordoada ou inconsciente. Uma cabeça morre se sofrer 30 ou mais de dano num único turno. No fim do turno em que uma cabeça morre, nascem duas novas em seu lugar — a menos que ela tenha sofrido dano radiante desde o início do seu último turno."
      },
      {
        nome: "Reactive Heads",
        texto: "Para cada cabeça além da primeira, ganha uma reação extra, usável apenas para ataques de oportunidade."
      },
      { nome: "Wakeful", texto: "Enquanto dorme, pelo menos uma cabeça permanece desperta." }
    ],
    acoes: [
      { nome: "Multiattack", texto: "Faz tantos ataques de Bite quantas cabeças tiver." },
      {
        nome: "Bite",
        texto: "Arma corpo a corpo: +9 para acertar, alcance 10 pés, um alvo. Acerto: 10 (1d10 + 5) de dano de um tipo escolhido entre os do Prismatic Breath.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 9 },
          { rotulo: "Dano", dado: "1d10", bonus: 5, tipo: "escolhido (Prismatic Breath)" }
        ]
      },
      {
        nome: "Prismatic Breath",
        texto: "Recarga 4–6. Uma das cabeças exala uma explosão de energia multicolorida em cone de 60 pés. Cada criatura na área faz um teste de Destreza CD 17, sofrendo 33 (6d10) de dano — ácido, frio, elétrico, fogo ou veneno, à escolha da draconidra — ou metade disso em um sucesso.",
        rolagens: [{ rotulo: "Dano", dado: "6d10", bonus: 0, tipo: "ácido/frio/elétrico/fogo/veneno (escolha)" }]
      }
    ],
    fonte: "Fizban's Treasury of Dragons (2021)",
    notaEncontro: "Sem ficha no Monster Manual de 2025 — segue no formato de 2014. Dano radiante impede o nascimento de cabeças novas; a Lâmina Solar é a ferramenta persistente contra isso, referencias/aventura.md §12."
  }
];

/* Agrupa os monstros pela ordem de webapp.GRUPOS_MONSTROS, para renderizar
 * uma seção por encontro sem repetir a lógica de agrupamento no js da tela. */
window.monstrosPorGrupo = function () {
  return window.GRUPOS_MONSTROS.map(function (grupo) {
    return {
      id: grupo.id,
      titulo: grupo.titulo,
      monstros: window.MONSTROS.filter(function (monstro) {
        return monstro.encontro === grupo.id;
      })
    };
  }).filter(function (grupo) {
    return grupo.monstros.length > 0;
  });
};
