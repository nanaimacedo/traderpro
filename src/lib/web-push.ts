import webPush from 'web-push';

// VAPID keys — gerar com: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:trader@traderpro.app';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export { webPush, VAPID_PUBLIC_KEY };

// Trechos de livros consagrados sobre trading, psicologia e performance
export const MORNING_MESSAGES = [
  // === TRADING IN THE ZONE — Mark Douglas (Trader Vencedor) ===
  {
    title: 'Mark Douglas — Trader Vencedor',
    body: 'O mercado nao gera informacao feliz ou dolorosa. Do ponto de vista do mercado, tudo e informacao. Voce e quem atribui significado.',
  },
  {
    title: 'Mark Douglas — Trader Vencedor',
    body: 'Os melhores traders pensam diferente. Eles se treinaram para pensar em probabilidades e nao se apegam ao resultado de nenhum trade individual.',
  },
  {
    title: 'Mark Douglas — Trader Vencedor',
    body: 'Se voce for capaz de aprender a criar um estado mental que nao e afetado pelo comportamento do mercado, a luta simplesmente deixara de existir.',
  },
  {
    title: 'Mark Douglas — Trader Vencedor',
    body: 'A consistencia nao esta no mercado. Esta na sua mente. Os traders consistentes possuem um conjunto unico de atitudes que os permite permanecer disciplinados.',
  },
  {
    title: 'Mark Douglas — Trader Vencedor',
    body: 'Voce nao precisa saber o que vai acontecer a seguir para ganhar dinheiro. Qualquer coisa pode acontecer. Cada momento e unico.',
  },
  {
    title: 'Mark Douglas — Trader Vencedor',
    body: 'Os melhores traders chegaram a um ponto em que acreditam, sem sombra de duvida, que qualquer coisa pode acontecer a qualquer momento.',
  },
  {
    title: 'Mark Douglas — Trader Vencedor',
    body: 'O objetivo de qualquer trader e transformar os lucros disponiveis em lucros consistentes. O que os separa e sua atitude mental.',
  },

  // === O MELHOR PERDEDOR VENCE — Tom Hougaard ===
  {
    title: 'Tom Hougaard — O Melhor Perdedor Vence',
    body: 'O trader que aceita perdas com facilidade e sem hesitacao e aquele que vai sobreviver tempo suficiente para estar la quando as grandes oportunidades aparecerem.',
  },
  {
    title: 'Tom Hougaard — O Melhor Perdedor Vence',
    body: 'Voce nao e o seu trade. Voce nao e o seu P&L. O resultado de uma unica operacao nao diz absolutamente nada sobre voce como pessoa.',
  },
  {
    title: 'Tom Hougaard — O Melhor Perdedor Vence',
    body: 'A sua capacidade de perder bem determinara o seu sucesso no longo prazo. Perdedores profissionais vencem. Perdedores amadores quebram.',
  },
  {
    title: 'Tom Hougaard — O Melhor Perdedor Vence',
    body: 'A maioria dos traders gasta energia tentando ter razao. Os vencedores gastam energia gerenciando o risco de estar errados.',
  },
  {
    title: 'Tom Hougaard — O Melhor Perdedor Vence',
    body: 'Se voce nao consegue aceitar uma perda pequena, mais cedo ou mais tarde voce sera forcado a aceitar a mae de todas as perdas.',
  },
  {
    title: 'Tom Hougaard — O Melhor Perdedor Vence',
    body: 'Nao existe trade perfeito. Existe apenas o proximo trade. Pare de buscar perfeicao e comece a buscar execucao.',
  },

  // === O PODER DO HABITO — Charles Duhigg ===
  {
    title: 'Charles Duhigg — O Poder do Habito',
    body: 'Habitos nunca desaparecem. Eles ficam codificados nas estruturas do nosso cerebro. A chave e aprender a criar novas rotinas que substituam os padroes destrutivos.',
  },
  {
    title: 'Charles Duhigg — O Poder do Habito',
    body: 'A forca de vontade nao e uma habilidade. E um musculo. Ela se cansa quando usada em excesso, mas pode ser fortalecida com pratica deliberada.',
  },
  {
    title: 'Charles Duhigg — O Poder do Habito',
    body: 'Para mudar um habito, mantenha a deixa e a recompensa, mas insira uma nova rotina. Esse e o loop do habito: deixa, rotina, recompensa.',
  },
  {
    title: 'Charles Duhigg — O Poder do Habito',
    body: 'Os habitos mais poderosos sao os habitos angulares — pequenas mudancas que desencadeiam uma reacao em cadeia, alterando outros habitos enquanto se espalham.',
  },
  {
    title: 'Charles Duhigg — O Poder do Habito',
    body: 'Quando a forca de vontade se torna automatica, o cerebro para de participar totalmente da decisao. Ele funciona no piloto automatico — e ai esta o poder.',
  },

  // === O PODER DO SUBCONSCIENTE — Joseph Murphy ===
  {
    title: 'Joseph Murphy — O Poder do Subconsciente',
    body: 'O seu subconsciente nao distingue entre uma experiencia real e uma vividamente imaginada. Use isso a seu favor: visualize o trader disciplinado que voce quer ser.',
  },
  {
    title: 'Joseph Murphy — O Poder do Subconsciente',
    body: 'O pensamento e a unica causa. As condicoes sao efeitos. Mude seu pensamento habitual e voce mudara seu destino.',
  },
  {
    title: 'Joseph Murphy — O Poder do Subconsciente',
    body: 'Antes de dormir, entregue ao seu subconsciente a ideia que deseja materializar. Ele trabalha 24h por dia para concretizar aquilo que voce acredita.',
  },
  {
    title: 'Joseph Murphy — O Poder do Subconsciente',
    body: 'Nunca use as palavras "eu nao consigo". Seu subconsciente aceita isso como um comando e torna impossivel aquilo que voce decretou.',
  },
  {
    title: 'Joseph Murphy — O Poder do Subconsciente',
    body: 'A fe e uma forma de pensamento. Quando voce acredita que algo e possivel, o subconsciente aceita como verdade e trabalha para torna-lo realidade.',
  },

  // === PNL — Richard Bandler & John Grinder / Anthony Robbins ===
  {
    title: 'Anthony Robbins — PNL',
    body: 'A qualidade da sua vida e a qualidade das suas emocoes. E voce pode mudar o estado emocional a qualquer momento mudando sua fisiologia e seu foco.',
  },
  {
    title: 'Richard Bandler — PNL',
    body: 'O mapa nao e o territorio. A forma como voce percebe o mercado nao e o mercado em si. Mude seus filtros e mude sua experiencia.',
  },
  {
    title: 'Anthony Robbins — PNL',
    body: 'Decisoes moldam destinos. Nao sao as condicoes da sua vida que determinam seu destino, mas sim suas decisoes sobre o que focar, o que isso significa e o que fazer.',
  },
  {
    title: 'Richard Bandler — PNL',
    body: 'Se voce sempre faz o que sempre fez, sempre obtara o que sempre obteve. Para resultados diferentes, mude a estrategia, nao a intensidade.',
  },
  {
    title: 'Anthony Robbins — PNL',
    body: 'O passado nao e igual ao futuro. Nao importa quantos dias de loss voce teve. Hoje e um dia novo com possibilidades novas.',
  },

  // === DISCIPLINED TRADER — Mark Douglas ===
  {
    title: 'Mark Douglas — Disciplined Trader',
    body: 'O medo de perder dinheiro e muito mais intenso do que a motivacao de ganha-lo. E por isso que a maioria dos traders trava na hora de executar.',
  },
  {
    title: 'Mark Douglas — Disciplined Trader',
    body: 'Disciplina e simplesmente a capacidade de escolher e redirecionar seu foco mental. Se voce nao controlar seu foco, o mercado controlara suas emocoes.',
  },

  // === REMINISCENCES OF A STOCK OPERATOR — Edwin Lefevre ===
  {
    title: 'Jesse Livermore — Reminiscencias',
    body: 'O mercado foi projetado para enganar a maioria das pessoas na maior parte do tempo. Nao siga a multidao — siga seu sistema.',
  },
  {
    title: 'Jesse Livermore — Reminiscencias',
    body: 'Nunca foi meu pensamento que me rendeu muito dinheiro. Foi sempre minha capacidade de ficar sentado e esperar. Entendeu? Sentar e esperar.',
  },
  {
    title: 'Jesse Livermore — Reminiscencias',
    body: 'Ha um momento para comprar, um momento para vender e um longo momento para nao fazer nada. A maioria ignora o terceiro.',
  },

  // === MARKET WIZARDS — Jack Schwager ===
  {
    title: 'Jack Schwager — Market Wizards',
    body: 'Todos os grandes traders que entrevistei tinham algo em comum: acreditavam totalmente no que estavam fazendo. A conviccao vem da preparacao.',
  },
  {
    title: 'Jack Schwager — Market Wizards',
    body: 'O trader que tem medo de perder ja perdeu. A hesitacao e o maior custo no mercado — maior ate do que um stop loss.',
  },

  // === THE DAILY TRADING COACH — Brett Steenbarger ===
  {
    title: 'Brett Steenbarger — Daily Trading Coach',
    body: 'Seu diario de trade e o melhor coach que voce pode ter. Ele mostra padroes que voce nao enxerga em tempo real. Registre tudo.',
  },
  {
    title: 'Brett Steenbarger — Daily Trading Coach',
    body: 'Performance de elite nao vem de mais informacao. Vem de processar menos informacao de forma mais profunda e deliberada.',
  },

  // === THINKING, FAST AND SLOW — Daniel Kahneman ===
  {
    title: 'Daniel Kahneman — Rapido e Devagar',
    body: 'A aversao a perda e mais forte do que a atracao pelo ganho. Por isso voce segura trades perdedores e fecha gains cedo demais. Reconheca o vies.',
  },
  {
    title: 'Daniel Kahneman — Rapido e Devagar',
    body: 'Excesso de confianca e o mais significativo dos vieses cognitivos. Especialmente apos uma sequencia de gains. E ai que o risco e maior.',
  },

  // === ATOMIC HABITS — James Clear ===
  {
    title: 'James Clear — Habitos Atomicos',
    body: 'Voce nao sobe ao nivel dos seus objetivos. Voce desce ao nivel dos seus sistemas. Construa sistemas de trading, nao metas de lucro.',
  },
  {
    title: 'James Clear — Habitos Atomicos',
    body: 'Cada acao e um voto para o tipo de pessoa que voce quer se tornar. Cada trade disciplinado e um voto para ser um trader consistente.',
  },
  {
    title: 'James Clear — Habitos Atomicos',
    body: 'A diferenca entre um bom dia e um mau dia geralmente sao os primeiros 30 minutos. Comece com ritual, nao com improviso.',
  },
];

export function getRandomMorningMessage() {
  const index = Math.floor(Math.random() * MORNING_MESSAGES.length);
  return MORNING_MESSAGES[index];
}
