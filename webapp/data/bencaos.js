/* Catálogo de bênçãos, transcrito de referencias/bencaos.md. Preços em PO.
 *
 * `mercador: "iria"` marca as bênçãos reservadas a O Véu Entre Vidas: elas não
 * entram no sorteio de Bram. A Pedra de Íria também fica fora, por ser o item
 * de desbloqueio daquela loja; ela vive em `window.PEDRA_DE_IRIA`.
 */
window.BENCAOS = [
  {
    id: "amuleto-estabilidade",
    tipo: "Permanente",
    tipoNota: "Não é consumido e permanece disponível em runs futuras.",
    nome: "Amuleto da Estabilidade",
    preco: 35,
    lema: "Enquanto houver quem lute, o ciclo pode esperar.",
    efeito: "Quando um integrante do grupo morrer, o retorno imediato ao acampamento deixa de ser obrigatório. O líder do grupo pode escolher concluir o combate com os sobreviventes. Ao fim do confronto, todos retornam ao acampamento.",
    restricao: "O grupo não pode avançar para a próxima sala da dungeon enquanto estiver incompleto.",
    icone: "../loja/assets/bencaos/amuleto-estabilidade.png"
  },
  {
    id: "sino-retorno",
    tipo: "Permanente",
    tipoNota: "Não é consumido e permanece disponível em runs futuras.",
    nome: "Sino do Retorno",
    preco: 25,
    lema: "Um único toque basta para que o caminho de volta encontre o grupo.",
    efeito: "Entre duas salas, o grupo pode encerrar voluntariamente a run e retornar em segurança ao acampamento, mantendo tudo o que conquistou.",
    icone: "../loja/assets/bencaos/sino-retorno.png"
  },
  {
    id: "contrato-fortuna",
    tipo: "Consumível",
    tipoNota: "É consumido ao ser invocado antes de uma sala.",
    nome: "Contrato da Fortuna",
    preco: 200,
    lema: "A fortuna favorece os ousados — e cobra daqueles que fracassam.",
    efeito: "Antes de entrar em uma sala, o grupo pode invocar o contrato. Se vencer o encontro, recebe o dobro do ouro daquela sala; se fracassar, a sala não concede ouro nessa run.",
    icone: "../loja/assets/bencaos/contrato-fortuna.png"
  },
  {
    id: "coroa-provocacao",
    tipo: "Consumível",
    tipoNota: "A coroa é consumida ao elevar a sala; a alteração resultante é permanente.",
    nome: "Coroa da Provocação",
    preco: 200,
    lema: "A dungeon não esquece aqueles que exigem um desafio maior.",
    efeito: "Escolha uma sala já vencida. O nível de dificuldade dessa sala aumenta permanentemente e permanece elevado em todas as runs futuras.",
    icone: "../loja/assets/bencaos/coroa-provocacao.png"
  },
  {
    id: "calice-purificacao",
    tipo: "Consumível",
    tipoNota: "É consumido ao purificar a área; a purificação resultante é permanente.",
    nome: "Cálice da Purificação",
    preco: 300,
    lema: "Onde a vitória já foi conquistada, o mal não criará raízes novamente.",
    efeito: "Use o cálice em uma sala ou estágio já vencido pelo menos uma vez para purificá-lo permanentemente. Em expedições futuras, essa área será considerada concluída e seus inimigos não retornarão.",
    restricao: "O cálice não pode ser usado em uma sala ou estágio que o grupo ainda não tenha vencido.",
    icone: "../loja/assets/bencaos/calice-purificacao.png"
  },
  {
    id: "pergaminho-experiencia",
    tipo: "Permanente",
    tipoNota: "O nível conquistado permanece nas runs futuras.",
    nome: "Pergaminho da Experiência",
    mercador: "iria",
    preco: 1000,
    lema: "O conhecimento conquistado por poucos desperta em todos.",
    efeito: "Todos os personagens do grupo avançam imediatamente para o nível 4.",
    icone: "../loja/assets/bencaos/pergaminho-experiencia.png"
  },
  {
    id: "braseiro-tregua",
    tipo: "Consumível",
    tipoNota: "É consumido ao conceder o Descanso Curto da run atual.",
    nome: "Braseiro da Trégua",
    preco: 2000,
    lema: "Enquanto a chama azul permanecer acesa, até a dungeon respeitará o descanso.",
    efeito: "Uma vez por run, o grupo pode realizar um Descanso Curto em segurança entre duas salas.",
    icone: "../loja/assets/bencaos/braseiro-tregua.png"
  },
  {
    id: "pergaminho-alta-experiencia",
    /* Os pergaminhos formam uma escada: o nível 5 exige ter passado pelo 4. */
    requer: "pergaminho-experiencia",
    tipo: "Permanente",
    tipoNota: "O nível conquistado permanece nas runs futuras.",
    nome: "Pergaminho da Alta Experiência",
    mercador: "iria",
    preco: 2500,
    lema: "Os limites de ontem não podem conter os heróis de amanhã.",
    efeito: "Todos os personagens do grupo avançam imediatamente para o nível 5.",
    icone: "../loja/assets/bencaos/pergaminho-alta-experiencia.png"
  },
  {
    id: "pergaminho-experiencia-suprema",
    requer: "pergaminho-alta-experiencia",
    tipo: "Permanente",
    tipoNota: "O nível conquistado permanece nas runs futuras.",
    nome: "Pergaminho da Experiência Suprema",
    mercador: "iria",
    preco: 5000,
    lema: "Poder, memória e instinto convergem em sua forma definitiva.",
    efeito: "Todos os personagens do grupo avançam imediatamente para o nível 6.",
    icone: "../loja/assets/bencaos/pergaminho-experiencia-suprema.png"
  }
];

/* O que Bram pode oferecer: tudo que não está reservado a Íria. */
window.bencaosDeBram = function () {
  return window.BENCAOS.filter(function (bencao) {
    return bencao.mercador !== "iria";
  });
};

/* Busca por id, incluindo a Pedra de Íria — que fica fora do catálogo, mas
 * entra no inventário do grupo como qualquer outra bênção. */
window.bencaoPorId = function (id) {
  if (id === window.PEDRA_DE_IRIA.id) return window.PEDRA_DE_IRIA;
  return (
    window.BENCAOS.filter(function (bencao) {
      return bencao.id === id;
    })[0] || null
  );
};

window.PEDRA_DE_IRIA = {
  id: "pedra-de-iria",
  tipo: "Permanente (desbloqueio)",
  tipoNota: "Não precisa ser adquirida novamente.",
  nome: "Pedra de Íria",
  preco: 100,
  lema: "Sete véus se abrem diante daqueles reconhecidos pela pedra.",
  efeito: "Ao adquirir a pedra, o grupo desbloqueia permanentemente O Véu Entre Vidas, obtendo acesso à loja de Íria Sete-Véus e às suas mercadorias arcanas.",
  icone: "../loja/assets/bencaos/pedra-de-iria.png"
};
