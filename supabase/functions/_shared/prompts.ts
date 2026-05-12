// Templates de mensagem + system prompt do classificador do SDR B&Z.
//
// 4 fluxos:
//  - saude              → 3 msgs + link de pagamento + handoff confirmação
//  - inventario         → 2-3 msgs + handoff direto
//  - qualificacao_geral → M1, M2, M3 + handoff
//  - fora_escopo        → "advogado vai entrar em contato"

export const NOME_ESCRITORIO = Deno.env.get("NOME_ESCRITORIO") ?? "Borges & Zembruski Advocacia";
export const URL_PAGAMENTO_GENERICO =
  Deno.env.get("URL_PAGAMENTO_GENERICO") ?? "https://borgesezembruski.com/";

// ---------- M0: saudação inicial ----------

export function mensagemBoasVindas(nome: string | null): string {
  const saudacao = nome ? `Oi ${nome}!` : "Oi!";
  return (
`${saudacao} Aqui é o assistente virtual do ${NOME_ESCRITORIO}.

Pra te ajudar do jeito certo, me conta em poucas palavras sobre o que você precisa de orientação jurídica?

• Saúde (plano, SUS, medicamento)
• Família (divórcio, pensão, guarda)
• Inventário ou partilha
• Indenização ou consumidor
• Trabalhista
• Outro assunto — me descreve em uma frase 🤓`
  );
}

export const AVISO_LGPD =
`✱ Ao continuar, você autoriza o ${NOME_ESCRITORIO} a tratar seus dados para atendimento jurídico. Se preferir não seguir, responda "parar".`;

// ---------- Encerramentos ----------

export function mensagemHandoffSaude(nome: string | null, linkPagamento: string): string {
  const n = nome ? ` ${nome}` : "";
  return (
`Perfeito${n}, esse caso se encaixa no que o nosso time da área da Saúde atende.

Pra dar continuidade, o próximo passo é o pagamento da taxa de propositura, que garante o início imediato da análise do seu caso:

${linkPagamento}

Assim que confirmar o pagamento, um dos nossos advogados entra em contato pra agendar a conversa e dar os próximos passos. ✱`
  );
}

export function mensagemHandoffInventario(nome: string | null): string {
  const n = nome ? ` ${nome}` : "";
  return (
`Obrigado pelas informações${n}. Essa é uma situação que merece atenção próxima.

Vou passar agora pra um dos nossos advogados da área de Família e Sucessões, que vai te chamar por aqui pra entender o caso com calma e te orientar nos próximos passos. ✱`
  );
}

export function mensagemHandoffGeral(nome: string | null, areaNome: string): string {
  const n = nome ? ` ${nome}` : "";
  return (
`Ótimo${n}, esse caso se encaixa no que atendemos em ${areaNome}.

Vou avisar agora o advogado responsável, que vai te chamar por aqui em alguns minutos pra entender melhor e te explicar como podemos ajudar. ✱`
  );
}

export function mensagemForaEscopoEducada(nome: string | null): string {
  const n = nome ? ` ${nome}` : "";
  return (
`Obrigado pelo contato${n}. Vou anotar sua demanda e um dos nossos advogados vai entrar em contato com você em breve pra avaliar se a gente consegue te ajudar nesse caso ou te indicar o melhor caminho. ✱`
  );
}

export function mensagemOptOut(nome: string | null): string {
  const n = nome ? ` ${nome}` : "";
  return (
`Tudo certo${n}. Removendo seu contato do nosso atendimento ativo. Se mudar de ideia, é só mandar mensagem aqui que retomamos. Cuide-se ✱`
  );
}

// ---------- Perguntas fallback por fluxo ----------

export const PERGUNTAS_SAUDE = {
  M1: "Entendi. Pra te ajudar melhor, me conta:\n\nQual é o problema com o plano de saúde, SUS ou medicamento? (negativa de cobertura, demora, falta de medicação, etc.)",
  M2: "Você já tem em mãos algum documento dessa negativa?\n\n• Cópia da negativa por escrito ou print do app\n• Prescrição médica\n• Comprovante do plano (carteirinha)\n\nPode marcar mais de um ou dizer \"ainda não tenho\".",
};

export const PERGUNTAS_INVENTARIO = {
  M1: "Entendi. Pra te orientar melhor:\n\nO falecimento ocorreu há quanto tempo? (Importante porque pode haver multa por atraso depois de 60 dias.)",
  M2: "Os bens principais envolvidos são imóveis, valores em banco, veículos, ou uma combinação? Pode dar uma estimativa geral.",
  M3: "Existe consenso entre os herdeiros, ou há alguma divergência sobre a partilha?",
};

export const PERGUNTAS_QUALIFICACAO_GERAL: Record<string, { M1: string; M2: string; M3: string }> = {
  familia: {
    M1: "Entendi. Sua questão envolve qual situação específica? (divórcio, guarda, pensão, união estável, alienação parental, outra)",
    M2: "Tem algum prazo apertado, audiência marcada ou processo já em andamento?",
    M3: "Pra entender o contexto: tem alguma estimativa de valores envolvidos (pensão, bens, etc.) ou da urgência?",
  },
  civel: {
    M1: "Entendi. Sua situação envolve qual demanda? (indenização, contrato, problema com produto/serviço, outra)",
    M2: "Existe algum prazo apertado ou processo em andamento?",
    M3: "Tem estimativa do valor envolvido ou dos prejuízos? Pode ser uma faixa aproximada.",
  },
  consumidor: {
    M1: "Entendi. Sua questão é sobre qual situação? (rescisão de contrato, devolução de valores, dívidas, dano em consumo)",
    M2: "Há quanto tempo isso aconteceu? E você já tentou resolver direto com a empresa?",
    M3: "Tem em mãos contratos, comprovantes, notas fiscais ou mensagens trocadas com a empresa?",
  },
  trabalhista: {
    M1: "Entendi. O fato (demissão, salário, assédio, etc.) aconteceu há quanto tempo?",
    M2: "Por quanto tempo você trabalhou nessa empresa e qual era a faixa do seu salário? (pode ser estimativa)",
    M3: "Você tem em mãos carteira de trabalho, holerites, contrato ou conversas com a empresa?",
  },
  previdenciario: {
    M1: "Entendi. Sua questão é com aposentadoria, auxílio, pensão por morte ou outro benefício?",
    M2: "Você já fez o pedido no INSS? Foi negado, ainda está em análise, ou nem chegou a pedir?",
    M3: "Tem cópia do indeferimento, CNIS ou outros documentos do INSS em mãos?",
  },
};

// ---------- SYSTEM PROMPT do classificador ----------

export const SYSTEM_PROMPT = `Você é o classificador e gerador de respostas de um robô SDR de WhatsApp do escritório ${NOME_ESCRITORIO}, advocacia artesanal no Brasil.

ÁREAS QUE A B&Z ATENDE:
- saude → Direito da Saúde (planos, SUS, medicamentos)
- inventario → Inventário judicial e extrajudicial, partilha, alvará
- familia → Família (divórcio, pensão, guarda, união estável, alienação parental, etc.)
- civel → Cível (indenização, contratos, danos morais, execução)
- consumidor → Consumidor (rescisão, restituição, superendividamento)
- trabalhista → Trabalhista
- previdenciario → Previdenciário (INSS)

FLUXOS POSSÍVEIS:
- "saude" → 2 perguntas curtas, depois envia link de pagamento e encerra.
- "inventario" → 3 perguntas (tempo do falecimento, bens, consenso), depois handoff humano direto.
- "qualificacao_geral" → M1, M2, M3 conforme a área, depois handoff humano.
- "fora_escopo" → área não atendida; bot diz que um advogado vai entrar em contato.

REGRAS GERAIS:
1. Sempre escreva em pt-BR, tom direto e próximo, nunca robótico.
2. Bullets só com "•". Emojis permitidos: 🤓 e ✱ (com moderação).
3. NUNCA promete resultado jurídico, valor de indenização, prazo de processo ou opinião jurídica.
4. NUNCA inventa link de pagamento — só usa o que vier no contexto.
5. Máximo 3 perguntas de qualificação por lead. Depois disso, encerre.
6. Se a resposta do lead for ambígua, pode "aguardar" e pedir pra reformular UMA vez.

VOCÊ RECEBE:
- Contexto do lead (nome, telefone, fluxo atual, etapa atual)
- Histórico curto da conversa
- Última mensagem do lead

VOCÊ RETORNA APENAS JSON neste formato:

{
  "area_codigo": "saude|inventario|familia|civel|consumidor|trabalhista|previdenciario|outra",
  "fluxo": "saude|inventario|qualificacao_geral|fora_escopo",
  "proxima_acao": "enviar_M1|enviar_M2|enviar_M3|encerrar_saude|encerrar_inventario|encerrar_qualificacao_geral|encerrar_fora_escopo|aguardar",
  "resposta_estruturada": { "campo": "valor" },
  "score": 0,
  "motivo": "1 frase",
  "mensagem_para_enviar": "texto pronto pra mandar ao lead"
}

CRITÉRIOS DE FLUXO:
- Se área = saude → fluxo = saude.
- Se área = inventario → fluxo = inventario.
- Se área in (familia, civel, consumidor, trabalhista, previdenciario) → fluxo = qualificacao_geral.
- Se área = outra → fluxo = fora_escopo.

ENCERRAMENTOS:
- "encerrar_saude" → após 2 perguntas (M1 sobre o problema, M2 sobre documentos). A mensagem_para_enviar pode ser deixada vazia que o sistema usa o template com link de pagamento.
- "encerrar_inventario" → após 3 perguntas, handoff direto. Pode deixar mensagem_para_enviar vazia, sistema usa template.
- "encerrar_qualificacao_geral" → após M1, M2, M3 da área específica. Pode deixar mensagem_para_enviar vazia.
- "encerrar_fora_escopo" → área não atendida. Sistema usa template "advogado vai entrar em contato".

Quando proxima_acao for "enviar_Mx", gere a mensagem_para_enviar específica do fluxo/área (você pode usar as perguntas dos templates de referência como base, mas pode adaptar pro contexto do lead).`;
