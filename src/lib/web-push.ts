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
    body: 'O mercado não gera informação feliz ou dolorosa. Do ponto de vista do mercado, tudo é informação. Você é quem atribui significado.',
  },
  {
    title: 'Mark Douglas — Trader Vencedor',
    body: 'Os melhores traders pensam diferente. Eles se treinaram para pensar em probabilidades e não se apegam ao resultado de nenhum trade individual.',
  },
  {
    title: 'Mark Douglas — Trader Vencedor',
    body: 'Se você for capaz de aprender a criar um estado mental que não é afetado pelo comportamento do mercado, a luta simplesmente deixará de existir.',
  },
  {
    title: 'Mark Douglas — Trader Vencedor',
    body: 'A consistência não está no mercado. Está na sua mente. Os traders consistentes possuem um conjunto único de atitudes que os permite permanecer disciplinados.',
  },
  {
    title: 'Mark Douglas — Trader Vencedor',
    body: 'Você não precisa saber o que vai acontecer a seguir para ganhar dinheiro. Qualquer coisa pode acontecer. Cada momento é único.',
  },
  {
    title: 'Mark Douglas — Trader Vencedor',
    body: 'Os melhores traders chegaram a um ponto em que acreditam, sem sombra de dúvida, que qualquer coisa pode acontecer a qualquer momento.',
  },
  {
    title: 'Mark Douglas — Trader Vencedor',
    body: 'O objetivo de qualquer trader é transformar os lucros disponíveis em lucros consistentes. O que os separa é sua atitude mental.',
  },

  // === O MELHOR PERDEDOR VENCE — Tom Hougaard ===
  {
    title: 'Tom Hougaard — O Melhor Perdedor Vence',
    body: 'O trader que aceita perdas com facilidade e sem hesitação é aquele que vai sobreviver tempo suficiente para estar lá quando as grandes oportunidades aparecerem.',
  },
  {
    title: 'Tom Hougaard — O Melhor Perdedor Vence',
    body: 'Você não é o seu trade. Você não é o seu P&L. O resultado de uma única operação não diz absolutamente nada sobre você como pessoa.',
  },
  {
    title: 'Tom Hougaard — O Melhor Perdedor Vence',
    body: 'A sua capacidade de perder bem determinará o seu sucesso no longo prazo. Perdedores profissionais vencem. Perdedores amadores quebram.',
  },
  {
    title: 'Tom Hougaard — O Melhor Perdedor Vence',
    body: 'A maioria dos traders gasta energia tentando ter razão. Os vencedores gastam energia gerenciando o risco de estar errados.',
  },
  {
    title: 'Tom Hougaard — O Melhor Perdedor Vence',
    body: 'Se você não consegue aceitar uma perda pequena, mais cedo ou mais tarde você será forçado a aceitar a mãe de todas as perdas.',
  },
  {
    title: 'Tom Hougaard — O Melhor Perdedor Vence',
    body: 'Não existe trade perfeito. Existe apenas o próximo trade. Pare de buscar perfeição e comece a buscar execução.',
  },

  // === O PODER DO HÁBITO — Charles Duhigg ===
  {
    title: 'Charles Duhigg — O Poder do Hábito',
    body: 'Hábitos nunca desaparecem. Eles ficam codificados nas estruturas do nosso cérebro. A chave é aprender a criar novas rotinas que substituam os padrões destrutivos.',
  },
  {
    title: 'Charles Duhigg — O Poder do Hábito',
    body: 'A força de vontade não é uma habilidade. É um músculo. Ela se cansa quando usada em excesso, mas pode ser fortalecida com prática deliberada.',
  },
  {
    title: 'Charles Duhigg — O Poder do Hábito',
    body: 'Para mudar um hábito, mantenha a deixa e a recompensa, mas insira uma nova rotina. Esse é o loop do hábito: deixa, rotina, recompensa.',
  },
  {
    title: 'Charles Duhigg — O Poder do Hábito',
    body: 'Os hábitos mais poderosos são os hábitos angulares — pequenas mudanças que desencadeiam uma reação em cadeia, alterando outros hábitos enquanto se espalham.',
  },
  {
    title: 'Charles Duhigg — O Poder do Hábito',
    body: 'Quando a força de vontade se torna automática, o cérebro para de participar totalmente da decisão. Ele funciona no piloto automático — e aí está o poder.',
  },

  // === O PODER DO SUBCONSCIENTE — Joseph Murphy ===
  {
    title: 'Joseph Murphy — O Poder do Subconsciente',
    body: 'O seu subconsciente não distingue entre uma experiência real e uma vividamente imaginada. Use isso a seu favor: visualize o trader disciplinado que você quer ser.',
  },
  {
    title: 'Joseph Murphy — O Poder do Subconsciente',
    body: 'O pensamento é a única causa. As condições são efeitos. Mude seu pensamento habitual e você mudará seu destino.',
  },
  {
    title: 'Joseph Murphy — O Poder do Subconsciente',
    body: 'Antes de dormir, entregue ao seu subconsciente a ideia que deseja materializar. Ele trabalha 24h por dia para concretizar aquilo que você acredita.',
  },
  {
    title: 'Joseph Murphy — O Poder do Subconsciente',
    body: 'Nunca use as palavras "eu não consigo". Seu subconsciente aceita isso como um comando e torna impossível aquilo que você decretou.',
  },
  {
    title: 'Joseph Murphy — O Poder do Subconsciente',
    body: 'A fé é uma forma de pensamento. Quando você acredita que algo é possível, o subconsciente aceita como verdade e trabalha para torná-lo realidade.',
  },

  // === PNL — Richard Bandler & John Grinder / Anthony Robbins ===
  {
    title: 'Anthony Robbins — PNL',
    body: 'A qualidade da sua vida é a qualidade das suas emoções. E você pode mudar o estado emocional a qualquer momento mudando sua fisiologia e seu foco.',
  },
  {
    title: 'Richard Bandler — PNL',
    body: 'O mapa não é o território. A forma como você percebe o mercado não é o mercado em si. Mude seus filtros e mude sua experiência.',
  },
  {
    title: 'Anthony Robbins — PNL',
    body: 'Decisões moldam destinos. Não são as condições da sua vida que determinam seu destino, mas sim suas decisões sobre o que focar, o que isso significa e o que fazer.',
  },
  {
    title: 'Richard Bandler — PNL',
    body: 'Se você sempre faz o que sempre fez, sempre obterá o que sempre obteve. Para resultados diferentes, mude a estratégia, não a intensidade.',
  },
  {
    title: 'Anthony Robbins — PNL',
    body: 'O passado não é igual ao futuro. Não importa quantos dias de loss você teve. Hoje é um dia novo com possibilidades novas.',
  },

  // === DISCIPLINED TRADER — Mark Douglas ===
  {
    title: 'Mark Douglas — Disciplined Trader',
    body: 'O medo de perder dinheiro é muito mais intenso do que a motivação de ganhá-lo. É por isso que a maioria dos traders trava na hora de executar.',
  },
  {
    title: 'Mark Douglas — Disciplined Trader',
    body: 'Disciplina é simplesmente a capacidade de escolher e redirecionar seu foco mental. Se você não controlar seu foco, o mercado controlará suas emoções.',
  },

  // === REMINISCÊNCIAS — Jesse Livermore ===
  {
    title: 'Jesse Livermore — Reminiscências',
    body: 'O mercado foi projetado para enganar a maioria das pessoas na maior parte do tempo. Não siga a multidão — siga seu sistema.',
  },
  {
    title: 'Jesse Livermore — Reminiscências',
    body: 'Nunca foi meu pensamento que me rendeu muito dinheiro. Foi sempre minha capacidade de ficar sentado e esperar. Entendeu? Sentar e esperar.',
  },
  {
    title: 'Jesse Livermore — Reminiscências',
    body: 'Há um momento para comprar, um momento para vender e um longo momento para não fazer nada. A maioria ignora o terceiro.',
  },

  // === MARKET WIZARDS — Jack Schwager ===
  {
    title: 'Jack Schwager — Market Wizards',
    body: 'Todos os grandes traders que entrevistei tinham algo em comum: acreditavam totalmente no que estavam fazendo. A convicção vem da preparação.',
  },
  {
    title: 'Jack Schwager — Market Wizards',
    body: 'O trader que tem medo de perder já perdeu. A hesitação é o maior custo no mercado — maior até do que um stop loss.',
  },

  // === THE DAILY TRADING COACH — Brett Steenbarger ===
  {
    title: 'Brett Steenbarger — Daily Trading Coach',
    body: 'Seu diário de trade é o melhor coach que você pode ter. Ele mostra padrões que você não enxerga em tempo real. Registre tudo.',
  },
  {
    title: 'Brett Steenbarger — Daily Trading Coach',
    body: 'Performance de elite não vem de mais informação. Vem de processar menos informação de forma mais profunda e deliberada.',
  },

  // === RÁPIDO E DEVAGAR — Daniel Kahneman ===
  {
    title: 'Daniel Kahneman — Rápido e Devagar',
    body: 'A aversão à perda é mais forte do que a atração pelo ganho. Por isso você segura trades perdedores e fecha gains cedo demais. Reconheça o viés.',
  },
  {
    title: 'Daniel Kahneman — Rápido e Devagar',
    body: 'Excesso de confiança é o mais significativo dos vieses cognitivos. Especialmente após uma sequência de gains. É aí que o risco é maior.',
  },

  // === HÁBITOS ATÔMICOS — James Clear ===
  {
    title: 'James Clear — Hábitos Atômicos',
    body: 'Você não sobe ao nível dos seus objetivos. Você desce ao nível dos seus sistemas. Construa sistemas de trading, não metas de lucro.',
  },
  {
    title: 'James Clear — Hábitos Atômicos',
    body: 'Cada ação é um voto para o tipo de pessoa que você quer se tornar. Cada trade disciplinado é um voto para ser um trader consistente.',
  },
  {
    title: 'James Clear — Hábitos Atômicos',
    body: 'A diferença entre um bom dia e um mau dia geralmente são os primeiros 30 minutos. Comece com ritual, não com improviso.',
  },
];

export function getRandomMorningMessage() {
  const index = Math.floor(Math.random() * MORNING_MESSAGES.length);
  return MORNING_MESSAGES[index];
}
