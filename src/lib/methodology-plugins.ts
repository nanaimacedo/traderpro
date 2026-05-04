// Methodology plugins — each defines setups, rules, and vocabulary for the mentor

export interface MethodologyPlugin {
  id: string;
  name: string;
  author: string;
  description: string;
  setups: string;
  rules: string;
  vocabulary: string;
}

export const METHODOLOGY_PLUGINS: Record<string, MethodologyPlugin> = {
  "oliver-velez": {
    id: "oliver-velez",
    name: "Oliver Velez / Pristine Method",
    author: "Oliver Velez & Flavia Figueiredo",
    description: "Price action baseado em barras, localização e médias móveis",
    setups: `### SETUPS PRINCIPAIS
- **Elephant Bar (EB)** — Barra de corpo grande (≥2x média), alto volume. Sinaliza força institucional. Operar na direção do EB.
- **Bottoming Tail (BT)** — Sombra inferior longa, corpo pequeno no topo. Rejeição de preço baixo. Sinal de reversão altista.
- **Topping Tail (TT)** — Sombra superior longa, corpo pequeno embaixo. Rejeição de topo. Sinal de reversão baixista.
- **NRB (Narrow Range Bar)** — Barra de range estreito. Compressão = explosão iminente. Entrar na direção do rompimento.
- **RBI (Red Bar Ignored)** — Barra vermelha dentro de tendência de alta que é superada pela próxima barra verde. Continuação.
- **GBI (Green Bar Ignored)** — Barra verde dentro de tendência de baixa que é superada pela próxima barra vermelha. Continuação.
- **180° Reversal** — Sequência de barra forte + barra oposta forte. Mudança abrupta de sentimento.
- **20-bar play** — Pullback à MA20 em tendência. Melhor setup de continuação.`,
    rules: `### REGRAS OPERACIONAIS
1. **Localização é TUDO** — Nunca opere no meio do range. Só nos extremos (suportes, resistências, médias).
2. **MA8 é o guarda** — Se o preço está acima da MA8, viés comprador. Abaixo, vendedor.
3. **MA20 é o juiz** — Define a tendência intermediária. Pullback na MA20 = melhor entrada.
4. **MA200 é a lei** — Tendência macro. Preço acima = bull. Abaixo = bear.
5. **Volume confirma** — Sem volume, não há convicção. EB sem volume = armadilha.
6. **Stop técnico** — Abaixo/acima do setup. Nunca financeiro fixo.
7. **Alvo mínimo 1:2** — Risk/reward mínimo de 1 para 2.
8. **Máximo 4 entradas/dia** — Após 4, trava a plataforma.`,
    vocabulary: `### VOCABULÁRIO
- Localização, zona de valor, guarda da M8, juiz da M20, lei da M200
- Elephant bar, topping tail, bottoming tail, NRB, RBI, GBI
- Pullback, breakout, rompimento, trap, armadilha
- Tendência, lateralidade, range, compressão, explosão`,
  },

  "al-brooks": {
    id: "al-brooks",
    name: "Al Brooks Price Action",
    author: "Al Brooks",
    description: "Leitura barra a barra, canais, wedges e measured moves",
    setups: `### SETUPS PRINCIPAIS
- **Signal Bar** — Barra que gera sinal de entrada. Corpo na direção do trade, sombra pequena.
- **Entry Bar** — Barra que confirma a signal bar. Entrada no rompimento.
- **ii Pattern** — Inside bar dentro de inside bar. Compressão extrema = breakout forte.
- **Wedge (cunha)** — 3 pushes na mesma direção. O 3º push geralmente é o último → reversão.
- **Double Bottom/Top** — Teste de fundo/topo anterior. Se não rompe, reverte.
- **Measured Move (MM)** — Projeção de alvo: tamanho do primeiro leg = alvo do segundo.
- **Breakout Pullback** — Rompimento + recuo ao ponto de rompimento = melhor entrada.
- **Trend Channel Line Overshoot** — Preço ultrapassa linha de canal → provável reversão.`,
    rules: `### REGRAS OPERACIONAIS
1. **Sempre leia barra a barra** — Cada barra conta uma história. Corpo, sombras, localização.
2. **Context is king** — O mesmo padrão tem significados diferentes dependendo do contexto.
3. **Always in** — Pergunte: "Se eu fosse forçado a estar posicionado, estaria comprado ou vendido?"
4. **2nd entry** — A segunda tentativa de entrada é mais confiável que a primeira.
5. **Stop abaixo da signal bar** — Sempre técnico.
6. **Trader's equation** — Probabilidade × Reward ≥ Risco. Só entre se a equação for favorável.
7. **Reversals need strong signal** — Reversões exigem signal bar forte + contexto claro.
8. **80% dos breakouts falham** — A maioria dos rompimentos são traps. Espere confirmação.`,
    vocabulary: `### VOCABULÁRIO
- Signal bar, entry bar, follow-through, gap, overlap
- Always in long/short, tight channel, broad channel
- Wedge, double bottom/top, measured move, leg
- Breakout, pullback, trap, failed breakout
- Barbwire (lateralidade estreita), spike and channel`,
  },

  "ict": {
    id: "ict",
    name: "ICT / Smart Money Concepts",
    author: "Inner Circle Trader (Michael J. Huddleston)",
    description: "Order flow institucional, liquidity pools, fair value gaps",
    setups: `### SETUPS PRINCIPAIS
- **Order Block (OB)** — Última vela contrária antes de um movimento forte. Zona onde institucionais posicionaram.
- **Fair Value Gap (FVG)** — Gap entre 3 velas onde o preço não negociou. Imã de preço.
- **Breaker Block** — Order block que falhou e virou suporte/resistência oposta.
- **Liquidity Sweep** — Preço varre stops acima/abaixo de highs/lows óbvios, depois reverte.
- **Displacement** — Sequência de velas fortes na mesma direção. Mostra intenção institucional.
- **Optimal Trade Entry (OTE)** — Retração de 62-79% de Fibonacci no bloco de ordens.
- **Kill Zones** — Horários de alta volatilidade: London Open, NY Open, London Close.
- **Judas Swing** — Falso movimento inicial da sessão para capturar liquidez.`,
    rules: `### REGRAS OPERACIONAIS
1. **Siga o dinheiro institucional** — Smart money move primeiro, retail segue.
2. **Liquidez é o combustível** — Preço vai onde tem stops. Highs iguais = liquidez acima.
3. **HTF primeiro** — Análise top-down: diário → 4h → 1h → 15min → 5min.
4. **FVG como imã** — Preço tende a preencher fair value gaps antes de continuar.
5. **Kill zones** — Só opere nos horários de alta liquidez. Fora = ruído.
6. **Confirmação no LTF** — Use timeframe menor para refinar entrada após HTF dar direção.
7. **Narrativa do dia** — Defina a narrativa antes do mercado abrir. Se mudar, saia.
8. **Risk máximo 1-2%** — Nunca arriscar mais que 2% do capital por trade.`,
    vocabulary: `### VOCABULÁRIO
- Order block, fair value gap, breaker, mitigation block
- Liquidity sweep, stop hunt, inducement
- Displacement, imbalance, inefficiency
- Kill zone, Judas swing, Asian range
- Smart money, retail trap, institutional candle`,
  },

  "tape-reading": {
    id: "tape-reading",
    name: "Tape Reading / Fluxo de Ordens",
    author: "Scalper / Day Trade Brasil",
    description: "Leitura de book, times & trades, fluxo de agressão",
    setups: `### SETUPS PRINCIPAIS
- **Absorção** — Grande quantidade de lotes sendo absorvida em um nível. Institucional defendendo preço.
- **Agressão direcional** — Sequência de trades no ask (compra) ou bid (venda) acima da média.
- **Iceberg** — Ordens grandes fatiadas em lotes pequenos no book. Detectável pelo volume oculto.
- **Pullback no fluxo** — Preço recua com volume baixo, depois retoma com agressão forte.
- **Rompimento com fluxo** — Preço rompe nível + agressão confirma. Diferente de rompimento seco.
- **Exaustão** — Volume altíssimo sem progressão de preço. Possível reversão.
- **Leilão** — Abertura do mercado com formação de range inicial. Direção definida pelo fluxo.`,
    rules: `### REGRAS OPERACIONAIS
1. **Book não mostra intenção** — Ordens podem ser canceladas. Foque no Times & Trades.
2. **Volume confirma direção** — Agressão no ask = força compradora. No bid = vendedora.
3. **Absorção é sinal forte** — Se o preço não cai com venda pesada, vai subir.
4. **Opere com o fluxo, não contra** — Se o fluxo é comprador, só compre.
5. **Stops curtos** — Tape reading exige stops técnicos curtos e precisos.
6. **Horários de liquidez** — Abertura (9:00-10:30) e fechamento (16:00-17:00) têm melhor fluxo.
7. **Sem fluxo = sem trade** — Se o book está vazio e T&S parado, não opere.`,
    vocabulary: `### VOCABULÁRIO
- Book de ofertas, times & trades (T&S), fluxo de ordens
- Agressão, absorção, iceberg, spoofing
- Ask (oferta de venda), bid (oferta de compra)
- Volume at price (VAP), footprint chart
- Leilão, range de abertura, VWAP, POC`,
  },
};

export function getMethodologyPrompt(methodologyId: string): string {
  const plugin = METHODOLOGY_PLUGINS[methodologyId];
  if (!plugin) return "";

  return `## METODOLOGIA: ${plugin.name}
Por: ${plugin.author}
${plugin.description}

${plugin.setups}

${plugin.rules}

${plugin.vocabulary}

IMPORTANTE: Use SEMPRE a terminologia e os conceitos desta metodologia ao responder. Identifique setups específicos pelo nome. Seja técnico e preciso.`;
}

export function listMethodologies(): { id: string; name: string; author: string; description: string }[] {
  return Object.values(METHODOLOGY_PLUGINS).map(({ id, name, author, description }) => ({
    id, name, author, description,
  }));
}
