/* Blocos de estatística dos monstros de referencias/aventura.md, seção 15.
 *
 * Transcrito das fichas oficiais de D&D 5e (2014 Monster Manual, exceto onde
 * anotado) para consulta rápida durante a mesa. Nomes de ações/traços e
 * termos de regra ficam em inglês, como nas fichas; o resto é descrição em
 * português para leitura rápida no meio do combate.
 *
 * `ids` seguem os mesmos usados em webapp/data/loot.js, para bater com a
 * calculadora de loot. Mudar um nome aqui não muda o outro arquivo.
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
    pv: 36,
    pvDado: "8d8",
    deslocamento: "30 pés",
    atributos: { for: 16, des: 17, con: 10, int: 11, sab: 10, car: 8 },
    resistenciasDano: "necrótico",
    imunidadesDano: "veneno",
    imunidadesCondicao: "enfeitiçado, exaustão, envenenado",
    sentidos: "visão no escuro 60 pés, Percepção passiva 10",
    idiomas: "Comum",
    nd: "2 (450 XP)",
    tracos: [
      {
        nome: "Stench",
        texto: "Toda criatura que começa o turno a até 5 pés do ghast precisa de um teste de Constituição CD 10 ou fica envenenada até o início do seu próximo turno. Em um sucesso, fica imune ao Fedor de qualquer ghast por 24 horas."
      },
      {
        nome: "Turn Defiance",
        texto: "O ghast e quaisquer ghouls a até 30 pés dele têm vantagem em salvaguardas contra efeitos que banem mortos-vivos."
      }
    ],
    acoes: [
      {
        nome: "Bite",
        texto: "Arma corpo a corpo: +3 para acertar, alcance 5 pés, uma criatura. Acerto: 12 (2d8 + 3) de dano perfurante.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 3 },
          { rotulo: "Dano", dado: "2d8", bonus: 3, tipo: "perfurante" }
        ]
      },
      {
        nome: "Claws",
        texto: "Arma corpo a corpo: +5 para acertar, alcance 5 pés, um alvo. Acerto: 10 (2d6 + 3) de dano cortante. Se o alvo não for morto-vivo, precisa de um teste de Constituição CD 10 ou fica paralisado por 1 minuto. Repete a salvaguarda ao final de cada turno.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 5 },
          { rotulo: "Dano", dado: "2d6", bonus: 3, tipo: "cortante" }
        ]
      }
    ],
    fonte: "Monster Manual (2014)"
  },
  {
    id: "wraith",
    nome: "Wraith",
    quantidade: 1,
    encontro: "ritual",
    classificacao: "Morto-vivo médio, neutro e mau",
    ca: 13,
    pv: 67,
    pvDado: "9d8 + 27",
    deslocamento: "0 pés, voo 60 pés (flutua)",
    atributos: { for: 6, des: 16, con: 16, int: 12, sab: 14, car: 15 },
    resistenciasDano: "ácido, frio, fogo, elétrico, trovejante; contundente, perfurante e cortante não mágico (exceto arma de prata)",
    imunidadesDano: "necrótico, veneno",
    imunidadesCondicao: "enfeitiçado, exaustão, agarrado, paralisado, petrificado, envenenado, caído, contido",
    sentidos: "visão no escuro 60 pés, Percepção passiva 12",
    idiomas: "os idiomas que conhecia em vida",
    nd: "5 (1.800 XP)",
    tracos: [
      {
        nome: "Incorporeal Movement",
        texto: "Move-se através de criaturas e objetos como se fossem terreno difícil. Sofre 5 (1d10) de dano de força se terminar o turno dentro de um objeto."
      },
      {
        nome: "Sunlight Sensitivity",
        texto: "Sob luz do sol, tem desvantagem em rolagens de ataque e em testes de Sabedoria (Percepção) que dependam da visão."
      }
    ],
    acoes: [
      {
        nome: "Life Drain",
        texto: "Arma corpo a corpo: +6 para acertar, alcance 5 pés, uma criatura. Acerto: 21 (4d8 + 3) de dano necrótico. O alvo precisa de um teste de Constituição CD 14 ou seu máximo de PV é reduzido nesse valor até completar um descanso longo. Morre se isso reduzir o máximo a 0.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 6 },
          { rotulo: "Dano", dado: "4d8", bonus: 3, tipo: "necrótico" }
        ]
      },
      {
        nome: "Create Specter",
        texto: "Escolhe um humanoide a até 10 pés que morreu violentamente há no máximo 1 minuto. O espírito se levanta como specter sob controle do wraith, no espaço do corpo ou no espaço livre mais próximo. No máximo sete specters sob controle ao mesmo tempo."
      }
    ],
    fonte: "Monster Manual (2014)"
  },
  {
    id: "bone-devil",
    nome: "Bone Devil",
    quantidade: 1,
    nota: "Só entra em jogo se o ritual não for interrompido em três rodadas.",
    encontro: "ritual",
    classificacao: "Diabo grande, leal e mau",
    ca: 19,
    caObs: "armadura natural",
    pv: 142,
    pvDado: "15d10 + 60",
    deslocamento: "40 pés, voo 40 pés",
    atributos: { for: 18, des: 16, con: 18, int: 13, sab: 14, car: 16 },
    salvaguardas: "Int +5, Wis +6, Cha +7",
    pericias: "Deception +7, Insight +6",
    resistenciasDano: "frio; contundente, perfurante e cortante não mágico (exceto arma de prata)",
    imunidadesDano: "fogo, veneno",
    imunidadesCondicao: "envenenado",
    sentidos: "visão no escuro 120 pés, Percepção passiva 9",
    idiomas: "Infernal, telepatia 120 pés",
    nd: "9 (5.000 XP)",
    tracos: [
      { nome: "Devil's Sight", texto: "Escuridão mágica não afeta sua visão no escuro." },
      { nome: "Magic Resistance", texto: "Vantagem em salvaguardas contra magias e outros efeitos mágicos." }
    ],
    acoes: [
      { nome: "Multiattack", texto: "Faz três ataques: dois de garra e um de ferrão." },
      {
        nome: "Claw",
        texto: "Arma corpo a corpo: +8 para acertar, alcance 10 pés, um alvo. Acerto: 8 (1d8 + 4) de dano cortante.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 8 },
          { rotulo: "Dano", dado: "1d8", bonus: 4, tipo: "cortante" }
        ]
      },
      {
        nome: "Sting",
        texto: "Arma corpo a corpo: +8 para acertar, alcance 10 pés, um alvo. Acerto: 13 (2d8 + 4) de dano perfurante mais 17 (5d6) de dano de veneno; o alvo precisa de um teste de Constituição CD 14 ou fica envenenado por 1 minuto. Repete a salvaguarda ao final de cada turno.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 8 },
          { rotulo: "Dano", dado: "2d8", bonus: 4, tipo: "perfurante" },
          { rotulo: "Dano (veneno)", dado: "5d6", bonus: 0, tipo: "veneno" }
        ]
      }
    ],
    fonte: "Monster Manual (2014)",
    notaEncontro: "Impedir a invocação concede a recompensa dele mesmo assim — referencias/aventura.md §5."
  },
  {
    id: "flameskull",
    nome: "Flameskull",
    quantidade: 2,
    encontro: "lancas",
    classificacao: "Morto-vivo minúsculo, neutro e mau",
    ca: 13,
    pv: 40,
    pvDado: "9d4 + 18",
    deslocamento: "0 pés, voo 40 pés (flutua)",
    atributos: { for: 1, des: 17, con: 14, int: 16, sab: 10, car: 11 },
    pericias: "Arcana +5, Perception +2",
    resistenciasDano: "elétrico, necrótico, perfurante",
    imunidadesDano: "frio, fogo, veneno",
    imunidadesCondicao: "enfeitiçado, amedrontado, paralisado, envenenado, caído",
    sentidos: "visão no escuro 60 pés, Percepção passiva 12",
    idiomas: "Comum",
    nd: "4 (1.100 XP)",
    tracos: [
      {
        nome: "Illumination",
        texto: "Emite luz fraca em raio de 15 pés, ou luz forte em 15 pés mais luz fraca por outros 15 pés. Troca de opção como ação."
      },
      { nome: "Magic Resistance", texto: "Vantagem em salvaguardas contra magias e outros efeitos mágicos." },
      {
        nome: "Rejuvenation",
        texto: "Se destruído, recupera todos os PV em 1 hora — a menos que respinguem água benta sobre os restos, ou alguém lance dispel magic ou remove curse sobre eles."
      },
      {
        nome: "Spellcasting",
        texto: "Conjurador de mago de 5º nível (CD 13, +5 para acertar com ataques de magia). Não precisa de componentes somáticos ou materiais. Magias preparadas — Truques (à vontade): mage hand; 1º nível (3 espaços): magic missile, shield; 2º nível (2 espaços): blur, flaming sphere; 3º nível (1 espaço): fireball."
      }
    ],
    acoes: [
      { nome: "Multiattack", texto: "Usa Fire Ray duas vezes." },
      {
        nome: "Fire Ray",
        texto: "Ataque à distância com magia: +5 para acertar, alcance 30 pés, um alvo. Acerto: 10 (3d6) de dano de fogo.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 5 },
          { rotulo: "Dano", dado: "3d6", bonus: 0, tipo: "fogo" }
        ]
      }
    ],
    fonte: "Monster Manual (2014)",
    notaEncontro: "Em falha crítica no corredor, os dois lançam fireball sobre o mesmo alvo — referencias/aventura.md §6."
  },
  {
    id: "young-gold-dragon",
    nome: "Young Gold Dragon",
    quantidade: 1,
    encontro: "tesouro",
    classificacao: "Dragão grande, leal e bom",
    ca: 18,
    caObs: "armadura natural",
    pv: 178,
    pvDado: "17d10 + 85",
    deslocamento: "40 pés, voo 80 pés, natação 40 pés",
    atributos: { for: 23, des: 14, con: 21, int: 16, sab: 13, car: 20 },
    salvaguardas: "Dex +6, Con +9, Wis +5, Cha +9",
    pericias: "Insight +5, Perception +9, Persuasion +9, Stealth +6",
    imunidadesDano: "fogo",
    sentidos: "visão cega 30 pés, visão no escuro 120 pés, Percepção passiva 19",
    idiomas: "Comum, Dracônico",
    nd: "10 (5.900 XP)",
    tracos: [{ nome: "Amphibious", texto: "Respira ar e água." }],
    acoes: [
      { nome: "Multiattack", texto: "Faz três ataques: um de mordida e dois de garra." },
      {
        nome: "Bite",
        texto: "Arma corpo a corpo: +10 para acertar, alcance 10 pés, um alvo. Acerto: 17 (2d10 + 6) de dano perfurante.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 10 },
          { rotulo: "Dano", dado: "2d10", bonus: 6, tipo: "perfurante" }
        ]
      },
      {
        nome: "Claw",
        texto: "Arma corpo a corpo: +10 para acertar, alcance 5 pés, um alvo. Acerto: 13 (2d6 + 6) de dano cortante.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 10 },
          { rotulo: "Dano", dado: "2d6", bonus: 6, tipo: "cortante" }
        ]
      },
      {
        nome: "Breath Weapons",
        texto: "Recarga 5–6. Usa um dos sopros. Fire Breath: cone de 30 pés, CD 17 de Destreza, 55 (10d10) de dano de fogo (metade em sucesso). Weakening Breath: cone de 30 pés, CD 17 de Força ou desvantagem em ataques, testes e salvaguardas de Força por 1 minuto (repete a salvaguarda a cada turno).",
        rolagens: [{ rotulo: "Dano (Fire Breath)", dado: "10d10", bonus: 0, tipo: "fogo" }]
      }
    ],
    fonte: "Monster Manual (2014)",
    notaEncontro: "Motivo dele atacar o grupo ainda está em aberto — referencias/aventura.md §7 (pendente)."
  },
  {
    id: "mimic",
    nome: "Mimic",
    quantidade: 1,
    nota: "Disfarçado do baú de tesouro; dá a Lâmina Solar.",
    encontro: "tesouro",
    classificacao: "Monstruosidade média, metamorfo, neutro",
    ca: 12,
    caObs: "armadura natural",
    pv: 58,
    pvDado: "9d8 + 18",
    deslocamento: "15 pés",
    atributos: { for: 17, des: 12, con: 15, int: 5, sab: 13, car: 8 },
    pericias: "Stealth +5",
    imunidadesDano: "ácido",
    imunidadesCondicao: "caído",
    sentidos: "visão no escuro 60 pés, Percepção passiva 11",
    idiomas: "—",
    nd: "2 (450 XP)",
    tracos: [
      {
        nome: "Shapechanger",
        texto: "Usa a ação para se transformar em um objeto ou voltar à forma amorfa verdadeira. Atributos iguais em cada forma. Equipamento que carrega não se transforma. Volta à forma verdadeira se morrer."
      },
      {
        nome: "Adhesive",
        texto: "Só na forma de objeto. Adere a qualquer coisa que o toque. Uma criatura Enorme ou menor colada nele também fica agarrada (CD de fuga 13); testes para escapar têm desvantagem."
      },
      {
        nome: "False Appearance",
        texto: "Só na forma de objeto. Enquanto imóvel, é indistinguível de um objeto comum."
      },
      { nome: "Grappler", texto: "Vantagem em ataques contra qualquer criatura que já esteja agarrada por ele." }
    ],
    acoes: [
      {
        nome: "Pseudopod",
        texto: "Arma corpo a corpo: +5 para acertar, alcance 5 pés, um alvo. Acerto: 7 (1d8 + 3) de dano contundente. Na forma de objeto, o alvo sofre o traço Adhesive.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 5 },
          { rotulo: "Dano", dado: "1d8", bonus: 3, tipo: "contundente" }
        ]
      },
      {
        nome: "Bite",
        texto: "Arma corpo a corpo: +5 para acertar, alcance 5 pés, um alvo. Acerto: 7 (1d8 + 3) de dano perfurante mais 4 (1d8) de dano ácido.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 5 },
          { rotulo: "Dano", dado: "1d8", bonus: 3, tipo: "perfurante" },
          { rotulo: "Dano (ácido)", dado: "1d8", bonus: 0, tipo: "ácido" }
        ]
      }
    ],
    fonte: "Monster Manual (2014)"
  },
  {
    id: "flying-sword",
    nome: "Flying Sword",
    quantidade: 4,
    encontro: "tesouro",
    classificacao: "Constructo pequeno, sem alinhamento",
    ca: 17,
    caObs: "armadura natural",
    pv: 17,
    pvDado: "5d6",
    deslocamento: "0 pés, voo 50 pés (flutua)",
    atributos: { for: 12, des: 15, con: 11, int: 1, sab: 5, car: 1 },
    salvaguardas: "Dex +4",
    imunidadesDano: "veneno, psíquico",
    imunidadesCondicao: "cego, enfeitiçado, surdo, amedrontado, paralisado, petrificado, envenenado",
    sentidos: "visão cega 60 pés (cego além disso), Percepção passiva 7",
    idiomas: "—",
    nd: "1/4 (50 XP)",
    tracos: [
      {
        nome: "Antimagic Susceptibility",
        texto: "Fica incapacitada na área de um antimagic field. Se for alvo de dispel magic, precisa de um teste de Constituição contra a CD do conjurador ou cai inconsciente por 1 minuto."
      },
      { nome: "False Appearance", texto: "Enquanto imóvel e sem voar, é indistinguível de uma espada comum." }
    ],
    acoes: [
      {
        nome: "Longsword",
        texto: "Arma corpo a corpo: +3 para acertar, alcance 5 pés, um alvo. Acerto: 5 (1d8 + 1) de dano cortante.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 3 },
          { rotulo: "Dano", dado: "1d8", bonus: 1, tipo: "cortante" }
        ]
      }
    ],
    fonte: "Monster Manual (2014)"
  },
  {
    id: "goblin",
    nome: "Goblin",
    quantidade: 12,
    encontro: "arena-goblin",
    classificacao: "Humanoide pequeno (goblinoide), neutro e mau",
    ca: 15,
    caObs: "armadura de couro, escudo",
    pv: 7,
    pvDado: "2d6",
    deslocamento: "30 pés",
    atributos: { for: 8, des: 14, con: 10, int: 10, sab: 8, car: 8 },
    pericias: "Stealth +6",
    sentidos: "visão no escuro 60 pés, Percepção passiva 9",
    idiomas: "Comum, Goblin",
    nd: "1/4 (50 XP)",
    tracos: [{ nome: "Nimble Escape", texto: "Pode usar a ação Disengage ou Hide como ação bônus em cada turno." }],
    acoes: [
      {
        nome: "Scimitar",
        texto: "Arma corpo a corpo: +4 para acertar, alcance 5 pés, um alvo. Acerto: 5 (1d6 + 2) de dano cortante.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 4 },
          { rotulo: "Dano", dado: "1d6", bonus: 2, tipo: "cortante" }
        ]
      },
      {
        nome: "Shortbow",
        texto: "Arma à distância: +4 para acertar, alcance 80/320 pés, um alvo. Acerto: 5 (1d6 + 2) de dano perfurante.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 4 },
          { rotulo: "Dano", dado: "1d6", bonus: 2, tipo: "perfurante" }
        ]
      }
    ],
    fonte: "Monster Manual (2014)",
    notaEncontro: "Entram em ondas de 3 no fim das rodadas 1 e 2, enquanto o Boss viver — referencias/aventura.md §9."
  },
  {
    id: "goblin-boss",
    nome: "Goblin Boss",
    quantidade: 1,
    encontro: "arena-goblin",
    classificacao: "Humanoide pequeno (goblinoide), neutro e mau",
    ca: 17,
    caObs: "camisa de malha, escudo",
    pv: 21,
    pvDado: "6d6",
    deslocamento: "30 pés",
    atributos: { for: 10, des: 14, con: 10, int: 10, sab: 8, car: 10 },
    pericias: "Stealth +6",
    sentidos: "visão no escuro 60 pés, Percepção passiva 9",
    idiomas: "Comum, Goblin",
    nd: "1 (200 XP)",
    tracos: [{ nome: "Nimble Escape", texto: "Pode usar a ação Disengage ou Hide como ação bônus em cada turno." }],
    acoes: [
      { nome: "Multiattack", texto: "Faz dois ataques de scimitar. O segundo ataque tem desvantagem." },
      {
        nome: "Scimitar",
        texto: "Arma corpo a corpo: +4 para acertar, alcance 5 pés, um alvo. Acerto: 5 (1d6 + 2) de dano cortante.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 4 },
          { rotulo: "Dano", dado: "1d6", bonus: 2, tipo: "cortante" }
        ]
      },
      {
        nome: "Javelin",
        texto: "Arma corpo a corpo ou à distância: +2 para acertar, alcance 5 pés ou 30/120 pés, um alvo. Acerto: 3 (1d6) de dano perfurante.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 2 },
          { rotulo: "Dano", dado: "1d6", bonus: 0, tipo: "perfurante" }
        ]
      }
    ],
    reacoes: [
      {
        nome: "Redirect Attack",
        texto: "Quando uma criatura que ele vê o ataca, escolhe outro goblin a até 5 pés. Os dois trocam de lugar e o escolhido passa a ser o alvo."
      }
    ],
    fonte: "Monster Manual (2014)",
    notaEncontro: "Reforços param de entrar quando ele morre; os goblins restantes fogem no fim da rodada — referencias/aventura.md §9."
  },
  {
    id: "hobgoblin",
    nome: "Hobgoblin",
    quantidade: 6,
    encontro: "arena-hobgoblin",
    classificacao: "Humanoide médio (goblinoide), leal e mau",
    ca: 18,
    caObs: "cota de malha, escudo",
    pv: 11,
    pvDado: "2d8 + 2",
    deslocamento: "30 pés",
    atributos: { for: 13, des: 12, con: 12, int: 10, sab: 10, car: 9 },
    sentidos: "visão no escuro 60 pés, Percepção passiva 10",
    idiomas: "Comum, Goblin",
    nd: "1/2 (100 XP)",
    tracos: [
      {
        nome: "Martial Advantage",
        texto: "Uma vez por turno, causa 7 (2d6) de dano extra a uma criatura que acerte com ataque de arma, se ela estiver a até 5 pés de um aliado do hobgoblin que não esteja incapacitado."
      }
    ],
    acoes: [
      {
        nome: "Longsword",
        texto: "Arma corpo a corpo: +3 para acertar, alcance 5 pés, um alvo. Acerto: 5 (1d8 + 1) de dano cortante, ou 6 (1d10 + 1) se usada com duas mãos.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 3 },
          { rotulo: "Dano", dado: "1d8", bonus: 1, tipo: "cortante" }
        ]
      },
      {
        nome: "Longbow",
        texto: "Arma à distância: +3 para acertar, alcance 150/600 pés, um alvo. Acerto: 5 (1d8 + 1) de dano perfurante.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 3 },
          { rotulo: "Dano", dado: "1d8", bonus: 1, tipo: "perfurante" }
        ]
      }
    ],
    fonte: "Monster Manual (2014)",
    notaEncontro: "4 na linha de frente, 2 como arqueiros; cercam para ativar Martial Advantage — referencias/aventura.md §10."
  },
  {
    id: "hobgoblin-captain",
    nome: "Hobgoblin Captain",
    quantidade: 1,
    encontro: "arena-hobgoblin",
    classificacao: "Humanoide médio (goblinoide), leal e mau",
    ca: 17,
    caObs: "meia-armadura",
    pv: 39,
    pvDado: "6d8 + 12",
    deslocamento: "30 pés",
    atributos: { for: 15, des: 14, con: 14, int: 12, sab: 10, car: 13 },
    sentidos: "visão no escuro 60 pés, Percepção passiva 10",
    idiomas: "Comum, Goblin",
    nd: "3 (700 XP)",
    tracos: [
      {
        nome: "Martial Advantage",
        texto: "Uma vez por turno, causa 10 (3d6) de dano extra a uma criatura que acerte com ataque de arma, se ela estiver a até 5 pés de um aliado do hobgoblin que não esteja incapacitado."
      }
    ],
    acoes: [
      { nome: "Multiattack", texto: "Faz dois ataques de greatsword." },
      {
        nome: "Greatsword",
        texto: "Arma corpo a corpo: +4 para acertar, alcance 5 pés, um alvo. Acerto: 9 (2d6 + 2) de dano perfurante.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 4 },
          { rotulo: "Dano", dado: "2d6", bonus: 2, tipo: "perfurante" }
        ]
      },
      {
        nome: "Javelin",
        texto: "Arma corpo a corpo ou à distância: +4 para acertar, alcance 5 pés ou 30/120 pés, um alvo. Acerto: 5 (1d6 + 2) de dano perfurante.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 4 },
          { rotulo: "Dano", dado: "1d6", bonus: 2, tipo: "perfurante" }
        ]
      },
      {
        nome: "Leadership",
        texto: "Recarrega após um descanso curto ou longo. Por 1 minuto, sempre que um aliado não hostil a até 30 pés dele — e que o veja — fizer um ataque ou salvaguarda, esse aliado soma 1d4 ao resultado, desde que ouça e entenda o hobgoblin. Só um dado de Leadership por vez; termina se o capitão ficar incapacitado.",
        rolagens: [{ rotulo: "Bônus", dado: "1d4", bonus: 0 }]
      }
    ],
    fonte: "Volo's Guide to Monsters (2016)",
    notaEncontro: "Ordena o avanço com metade dos PV; Leadership acaba quando ele cai — referencias/aventura.md §10."
  },
  {
    id: "shambling-mound",
    nome: "Shambling Mound",
    apelido: "Monte Errante",
    quantidade: 1,
    encontro: "arena-monte",
    classificacao: "Planta grande, sem alinhamento",
    ca: 15,
    caObs: "armadura natural",
    pv: 136,
    pvDado: "16d10 + 48",
    deslocamento: "20 pés, natação 20 pés",
    atributos: { for: 18, des: 8, con: 16, int: 5, sab: 10, car: 5 },
    pericias: "Stealth +2",
    resistenciasDano: "frio, fogo",
    imunidadesDano: "elétrico",
    imunidadesCondicao: "cego, surdo, exaustão",
    sentidos: "visão cega 60 pés (cego além disso), Percepção passiva 10",
    idiomas: "—",
    nd: "5 (1.800 XP)",
    tracos: [
      {
        nome: "Lightning Absorption",
        texto: "Sempre que sofrer dano elétrico, não sofre dano e recupera PV iguais ao dano de elétrico sofrido."
      }
    ],
    acoes: [
      {
        nome: "Multiattack",
        texto: "Faz dois ataques de slam. Se ambos acertarem um alvo Médio ou menor, ele fica agarrado (CD de fuga 14) e o monte usa Engulf nele."
      },
      {
        nome: "Slam",
        texto: "Arma corpo a corpo: +7 para acertar, alcance 5 pés, um alvo. Acerto: 13 (2d8 + 4) de dano contundente.",
        rolagens: [
          { rotulo: "Acerto", dado: "1d20", bonus: 7 },
          { rotulo: "Dano", dado: "2d8", bonus: 4, tipo: "contundente" }
        ]
      },
      {
        nome: "Engulf",
        texto: "Engole uma criatura Média ou menor agarrada por ele. O alvo engolido fica cego, contido e sem poder respirar; no início de cada turno do monte, precisa de um teste de Constituição CD 14 ou sofre 13 (2d8 + 4) de dano contundente. Se o monte se mover, o alvo se move com ele. Só engole uma criatura por vez.",
        rolagens: [{ rotulo: "Dano", dado: "2d8", bonus: 4, tipo: "contundente" }]
      }
    ],
    fonte: "Monster Manual (2014)",
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
    notaEncontro: "Dano radiante impede o nascimento de cabeças novas; a Lâmina Solar é a ferramenta persistente contra isso — referencias/aventura.md §12."
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
