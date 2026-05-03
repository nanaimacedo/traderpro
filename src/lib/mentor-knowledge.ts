// Knowledge modules - injected on-demand based on message keywords
// Each module is a self-contained chunk of knowledge the mentor can use

export const KNOWLEDGE_MODULES = {
  jornada: {
    keywords: ['degrau', 'jornada', 'fase', 'desistir', 'desanimar', 'fracasso', 'fracassado', 'vale a pena', 'quando vou', 'consistente', 'consistencia', 'evolucao', 'evoluir', 'começo', 'comeco', 'iniciante', 'principiante', 'quanto tempo', 'desmotivado', 'motivacao', 'cansado', 'cansaço'],
    content: `## EBOOK — JORNADA DO TRADER (Flavia Figueiredo)

### Os 8 Degraus da Evolucao
1. **Decidir estudar** — Fase da furia de querer ganhar rapido. Influencia dos "vendedores de ilusao".
2. **Escolher a forma de estudo** — Tracar plano, procurar mentor ou curso.
3. **Ter nocao sobre mercado e grafico** — Excesso de informacoes faz algazarra na mente. Muitos desistem aqui.
4. **Primeiros resultados (FASE MAIS PERIGOSA)** — Falta seguranca. Um resultado ruim destroi a confianca. Perde tudo tentando recuperar. NUNCA vender bens para operar. Trade e conhecimento, NAO sorte.
5. **Fechar o mes no 0x0 ou com leves ganhos** — Adquire maturidade. Comeca a enxergar os erros. Entende o grafico.
6. **Resultados com cautela** — Respeita gerenciamento. Descobre o verdadeiro gerenciamento de risco. Projeta aumento de lotes.
7. **Operacional e emocional alinhados** — Ganhos consistentes, perde menos, recupera perdas gradativamente.
8. **Trader profissional** — Lucros grandes e consistentes. Liberdade financeira e geografica. Sem perder foco.

### Mindset do Trader
- Mindset e CONFIGURACAO da mente para fracassos e perdas.
- Curva de aprendizado NAO e linear — cheia de altos e baixos.
- Fracassados nao configuraram a mente, pensaram que e cassino, aumentaram mao a cada perda.
- **Mudar a atitude e o grande desafio.**
- Regra das 10 mil horas. Nao adianta curso de final de semana.
- **70% do resultado = emocional. 30% = operacional + gerenciamento.**
- Melhorar emocional: autoconhecimento, terapia, caminhadas, meditacao, leitura (IE e PNL).

### Estatistica
- Somente 3 a 5% dos traders tem resultado positivo.
- E possivel fazer parte dos 5% com dedicacao, estudo, resiliencia e constancia.
- "Lembra da bicicleta? As primeiras peladas davam sensacao de fracasso, mas quanto mais treinava, mais longe conseguia andar."

### Como usar
- Desmotivado: "Voce esta no 5o degrau — fase da maturidade. E aqui que profissionais se formam."
- Ansioso: "70% e emocional. Foca na configuracao da mente primeiro."
- Questionando: "Voce ja esta mais longe que 95% das pessoas que tentaram."
- Pular etapas: "A curva nao e linear. Cada recuo e parte do processo."
- Excesso de confianca: "Cuidado com o 4o degrau — a fase mais perigosa."`,
  },

  indicadores: {
    keywords: ['ma8', 'ma20', 'ma200', 'media', 'média', 'vwap', 'indicador', 'rompimento', 'romper', 'rompeu', 'tabela fipe', 'sobrecomprado', 'sobrevendido', 'posto de gasolina', 'trailing', 'abertura', 'plana', 'inclinada', 'flat'],
    content: `## EBOOK — INDICADORES DETALHADOS (Flavia Figueiredo)

**MA8 (8 periodos):**
- Identifica SUPER TENDENCIA. Preco acima = compradores muito fortes. Abaixo = vendedores fortes.
- Usada para trailing stop.
- Media MAIS FRACA das tres. Preco apoiando so nela = tendencia mais forte.

**MA20 (20 periodos) — INDICADOR MAIS IMPORTANTE:**
- Identifica vies direcional. Cima = comprador. Baixo = vendedor. Plana = lateral.
- Referencia para pullbacks, suporte/resistencia.
- No 5min na abertura: pode indicar o movimento do dia.
- Dificilmente o preco rompe regiao de interesse sem rejeitar/testar primeiro.

**Rompimento da MA20:**
- Operar CONTRA a MA20: preco precisa fazer pullback antes.
- Probabilidade aumenta se preco NAO toca na MA20 (fraqueza do lado oposto).
- Pavio na MA20 = fraqueza. Melhor movimento sera em sentido contrario.

**MA200 (200 periodos) — "Tabela FIPE do Mercado":**
- Identifica sobrecomprado/sobrevendido. Preco afastado tende a retornar.
- "Posto de gasolina" — preco vai pegar combustivel.
- MELHORES OPERACOES se originam dela. Media MAIS FORTE.
- **PLANA:** preco rompe com facilidade.
- **INCLINADA:** preco precisa rejeitar MA20 primeiro para rompe-la.
- Multiplos timeframes: MA200 de 5min, 15min, 60min e 1D como regioes de interesse.
- DOLAR: MA200 60min mais forte. INDICE: MA200 15min mais forte.
- MA200 chega rapido ate preco → acumula/lateraliza. MA200 espera preco → reverte.

**VWAP:**
- Preco medio ponderado por volume. Reinicia todo dia.
- "Preco medio dos grandes players."
- Acima = comprador. Abaixo = vendedor. Serve como trava.
- MAIS FORCA de manha. Essencial na abertura.
- Preco abre "no meio do nada": VWAP decide. Ver para que lado segura e se tem espaco.
- VWAP do dia anterior = possivel reversao.`,
  },

  barras: {
    keywords: ['barra', 'elefante', 'elephant', 'martelo', 'bottoming', 'topping', 'tail', 'doji', 'candle', 'candlestick', 'vela', 'ignicao', 'ignição', 'exaustao', 'exaustão', 'pavio', 'sombra', 'corpo', 'nrb', 'bdp', 'bop', 'reversao', 'reversão', 'continuacao', 'continuação'],
    content: `## EBOOK — TIPOS DE BARRAS DETALHADOS (Flavia Figueiredo)

**Candlesticks — Anatomia:**
- Corpo: entre abertura e fechamento. Quanto MAIOR, MAIOR a forca.
- Sombras/pavios: ate onde preco oscilou. Maxima (topo) e Minima (fundo).
- Verde = alta (abre embaixo, fecha cima). Vermelho = baixa (abre cima, fecha embaixo).
- Corpo grande = forca maxima. Pequeno = neutro. NRB/Cruz = empate.
- Pavio longo = forca para anular outro time. Inferior = pressao compradora. Superior = vendedora.
- Doji (indecisao): abre/fecha mesmo ponto, sombras enormes. Em pontos importantes = reversao.

**Barras Elefante:**
- MAIORES do grafico. Bilhoes de reais dos Big Players.
- Indicam: POTENCIA (ignicao), FALTA de potencia (exaustao), ou CONTINUIDADE.
- Agir SEMPRE a favor dela.

**Elefante de IGNICAO:**
- Da INICIO ao movimento. Mais forte alinhada com regiao e a favor das medias.
- A melhor: cruza MA8/MA20/MA200 ou nasce nelas.
- Na ABERTURA rompendo regioes do dia anterior = altissima probabilidade.

**Elefante de EXAUSTAO:**
- Aparece no FINAL do movimento. Nao da continuidade.
- LONGE das medias. Preco ja cumpriu alvos.

**Martelo / Bottoming Tail (BT):**
- Corpo pequeno + pavio inferior no MINIMO 2x o corpo.
- Quanto maior sombra inferior, mais forte sinal comprador.
- Superior: sem sombra ou bem pequena. COR nao importa, LOCALIZACAO sim.
- Surge apos: queda prolongada, queda rapida, em suportes, correcoes em medias.
- Maior forca de reversao. Vendedores tentaram derrubar, compradores empurraram pra cima.

**Martelo Invertido / Topping Tail (TT):**
- Corpo pequeno embaixo + sombra superior no MINIMO 2x o corpo.
- Inferior minuscula ou inexistente. COR nao importa, LOCALIZACAO sim.
- Apos alta + rejeicao de regiao/media = reversao provavel.
- Compradores tentaram subir, vendedores empurraram pra baixo.

**Dojis — Continuacao:**
- Candles MUITO PEQUENOS vs anteriores. Cor NAO importa. O que importa = PROXIMA BARRA.
- Pontos de adicao ou entrada. Stops BARATOS = posicao maior.
- Compradores: melhor ACIMA das medias. Vendedores: ABAIXO e proximos.
- **Melhor doji = mais PROXIMO da origem.** Distante = maior chance de violino.
- Doji pre-BDP: antecede lateralizacao. Doji pos-BOP: apos origem de pernada.`,
  },

  estrutura: {
    keywords: ['tendencia', 'tendência', 'alta', 'baixa', 'lateral', 'lateralizacao', 'lateralização', 'topo', 'fundo', 'suporte', 'resistencia', 'resistência', 'pullback', 'pernada', 'estrutura', 'range', 'consolidacao', 'consolidação', 'ascendente', 'descendente', 'rompimento'],
    content: `## EBOOK — ESTRUTURA DE MERCADO (Flavia Figueiredo)

**Topos e Fundos:**
- Topo: ponto mais alto antes de cair (vendedores > compradores).
- Fundo: ponto mais baixo antes de subir (compradores > vendedores).
- Fundo anterior = suporte. Topo anterior = resistencia.
- Operar com base neles = stops mais precisos.

**3 movimentos do mercado:** sobe, desce ou anda de lado.

**Tendencia de Alta:**
- Topos e fundos ASCENDENTES. Compradores no controle.
- MA20 para CIMA, preco ACIMA dela.
- Compras: apos rejeicao na MA20, rompimento saindo da MA20.
- Vendas pontuais: preco muito afastado da MA20 rejeitando regiao de interesse.

**Tendencia de Baixa:**
- Topos e fundos DESCENDENTES. Vendedores no controle.
- MA20 para BAIXO, preco ABAIXO dela.
- Vantagem: lucra com venda (vende caro, compra barato).
- Vendas: apos rejeicao da MA20, rompimento saindo da MA20.

**Lateralizacao:**
- Topos lado a lado, fundos simetricos. MA20 PLANA, preco atravessa facil.
- Identificar ciclo macro → regioes de interesse → como mercado reage.
- "Muitos temem o lateral, porem e onde voce sera MAIS LUCRATIVO" — Flavia.

**Pullback:** Respiro do mercado antes de continuar tendencia.
- Alta: sobe, cai pouco, continua subindo. Baixa: cai, sobe pouco, continua caindo.
- Pode ser lateralizacao curta no meio.

**Pernada:** Movimento que ANTECEDE o pullback.
- 1a Pernada → Pullback → 2a Pernada.`,
  },

  mercado: {
    keywords: ['mercado financeiro', 'bolsa', 'b3', 'bovespa', 'player', 'tubarao', 'tubarão', 'sardinha', 'day trade', 'swing', 'position', 'investidor', 'corretora', 'price action', 'analise tecnica', 'análise técnica', 'ativo', 'mini indice', 'mini índice', 'mini dolar', 'mini dólar', 'win', 'wdo', 'vencimento', 'timeframe', 'tempo grafico', 'tempo gráfico', '5 minutos', '15 minutos', '60 minutos'],
    content: `## EBOOK — FUNDAMENTOS DO MERCADO (Flavia Figueiredo)

**Mercado Financeiro:** Lugar onde se negociam ativos listados na bolsa. Influencia a economia do pais. Como um grande mercado municipal.

**Players:**
- Tubaroes (Big Players): Bancos, Fundos, Instituicoes — responsaveis pela volatilidade.
- Sardinhas: Traders individuais que acompanham os grandes players.
- Investidor: longo prazo, conservador. Trader: curto prazo, aceita riscos maiores.

**Modalidades:**
- Day Trade: curtissimo prazo (segundos a horas), mesmo dia. Timeframes 2-15min. Alto risco.
- Swing Trade: dias a semanas. Mais assertivo, risco menor. Timeframes 15-60min/diario.
- Position Trade: meses a 1+ ano. Bem assertivo. Timeframes 4h/diario/semanal/mensal.

**Analise Tecnica vs Price Action:**
- Tecnica: indicadores (MAs, VWAP). Podem estar atrasados.
- Price Action: so movimentos de precos, sem indicadores. Mais imediato e confiavel.
- Nosso metodo: JUNCAO dos dois.

**Ativos:**
- Mini Indice (WIN): mini contrato IBOVESPA. Vencimento bimestral (4a util semana do dia 15). WIN+LETRA+ANO (Fev=G, Abr=J, Jun=M, Ago=Q, Out=V, Dez=Z).
- Mini Dolar (WDO): derivado do dolar. Vencimento mensal (ultimo dia util). WDO+LETRA+ANO (Jan=F, Fev=G, Mar=H, Abr=J, Mai=K, Jun=M, Jul=N, Ago=Q, Set=U, Out=V, Nov=X, Dez=Z).

**Tempos Graficos:**
- 5min: principal para operar. Menos ruido, validado pelo operacional.
- 15min: contexto. Pode operar (mais demorado). Bom pra swing.
- 60min: ANTES de operar — vies, regioes de interesse, ciclo. Swing/position.
- 1D: cada vela = 1 dia. Tendencias gerais, linhas de interesse. Macro.
- Estatistica: somente 3-5% tem resultado positivo. Liberdade economica/geografica e possivel com dedicacao.`,
  },
} as const;

export type KnowledgeModuleKey = keyof typeof KNOWLEDGE_MODULES;

/**
 * Detects which knowledge modules are relevant based on message content.
 * Returns the combined knowledge text to inject into the system prompt.
 * Limits to max 2 modules per request to control token usage.
 */
export function getRelevantKnowledge(message: string): string {
  const lower = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const matched: { key: KnowledgeModuleKey; score: number }[] = [];

  for (const [key, mod] of Object.entries(KNOWLEDGE_MODULES)) {
    let score = 0;
    for (const kw of mod.keywords) {
      const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(kwNorm)) {
        score++;
      }
    }
    if (score > 0) {
      matched.push({ key: key as KnowledgeModuleKey, score });
    }
  }

  if (matched.length === 0) return '';

  // Sort by relevance score, take top 2
  matched.sort((a, b) => b.score - a.score);
  const top = matched.slice(0, 2);

  return top
    .map((m) => KNOWLEDGE_MODULES[m.key].content)
    .join('\n\n');
}
