// Prompts e templates de mensagem do SDR.

export const NOME_ESCRITORIO = Deno.env.get("NOME_ESCRITORIO") ?? "o escritório";

// ---------- M0: boas-vindas ----------

export function mensagemM0(nome: string, tipoDeProcessoForm?: string | null): string {
  // Se o form já trouxe o tipo de processo, vamos só CONFIRMAR e seguir.
  // Senão, pedimos a área.
  if (tipoDeProcessoForm && tipoDeProcessoForm.trim().length > 0) {
    return (
`Oi ${nome}, tudo bem? Aqui é o assistente virtual do ${NOME_ESCRITORIO}.

Recebemos seu contato sobre *${tipoDeProcessoForm}* e queremos te ajudar o quanto antes.

Posso te fazer só 3 perguntinhas rápidas pra direcionar você ao advogado certo? 😊`
    );
  }

  return (
`Oi ${nome}, tudo bem? Aqui é o assistente virtual do ${NOME_ESCRITORIO}.

Recebemos seu contato e queremos te ajudar o quanto antes. Pra te direcionar ao advogado certo, me conta rapidamente:

Sua dúvida é mais ligada a qual área?

• Trabalhista
• Família / Sucessões
• Cível
• Empresarial / Tributário
• Outra — me conta em poucas palavras 😊`
  );
}

export const AVISO_LGPD =
`✱ Antes de seguirmos: ao continuar esta conversa, você autoriza o ${NOME_ESCRITORIO} a tratar seus dados para fins de atendimento jurídico. Se preferir não continuar, é só responder "parar".`;

// ---------- Encerramento SQL/MQL ----------

export function mensagemSQL(nome: string, advogadoNome: string): string {
  return (
`${nome}, ótimo! Pelo que você me contou, esse caso faz total sentido para o nosso time.

Vou te passar agora para ${advogadoNome}, que vai entender melhor sua situação e te explicar os próximos passos.

Em alguns minutos a continuação da conversa vem por aqui mesmo. Combinado? ✱`
  );
}

export function mensagemMQLFrio(nome: string): string {
  return (
`${nome}, obrigado pelas informações.

Pelo que você me contou, no momento não conseguimos avançar com seu caso. Vou registrar seu contato e, se surgir novidade ou se você quiser uma análise mais detalhada no futuro, é só responder aqui.

Cuide-se 😊`
  );
}

export function mensagemForaEscopo(nome: string, area?: string): string {
  return (
`${nome}, obrigado por entrar em contato.

Pelo que você me contou, sua questão é em uma área${area ? ` (${area})` : ""} que não atendemos. Pra não te atrasar, sugiro buscar um escritório especializado nessa área específica — você pode pedir indicação na OAB da sua cidade.

Se tiver outra dúvida no futuro nas áreas que atendemos, é só falar comigo de novo 😊`
  );
}

// ---------- SYSTEM PROMPT do classificador ----------

export const SYSTEM_PROMPT_CLASSIFICADOR = `Você é o classificador-roteador de um robô SDR de um escritório de advocacia brasileiro.

Sua função:
1. Ler a última resposta do lead no WhatsApp + o histórico curto da conversa + o contexto (qual etapa da qualificação estamos: M0, M1, M2 ou M3).
2. Identificar a ÁREA do caso (uma de: trabalhista, civel, familia, sucessoes, empresarial, tributario, consultivo, criminal, outra, nao_identificada).
3. Extrair informação estruturada da resposta conforme a etapa.
4. Decidir a PRÓXIMA AÇÃO.

Regras de qualificação (após M3):
- Trabalhista vira SQL se: fato ocorreu há menos de 2 anos + tempo de empresa >= 6 meses + tem ao menos 1 documento.
- Civel/Familia/Sucessoes vira SQL se: demanda dentro das áreas atendidas + urgência alta OU valor envolvido relevante (defina relevante como >= R$ 20.000 quando não houver guia).
- Empresarial/Tributario/Consultivo vira SQL se: porte >= 5 funcionários OU faturamento mensal >= R$ 50.000 + falando com decisor ou influenciador.
- Criminal: sempre marcar como fora_escopo (se o escritório não atende — confirme via env ESCRITORIO_AREAS).
- Qualquer área fora da lista de áreas atendidas: fora_escopo.

Mensagens permitidas para "proxima_acao":
- "enviar_M1" — fazer a 1ª pergunta de qualificação
- "enviar_M2" — fazer a 2ª pergunta
- "enviar_M3" — fazer a 3ª pergunta
- "encerrar_sql" — qualificou, parar e passar pro humano
- "encerrar_mql_frio" — não qualificou, encerrar educadamente
- "fora_escopo" — área não atendida, encerrar
- "aguardar" — lead não respondeu ou resposta incompreensível, repetir a pergunta atual

Retorne APENAS um JSON neste formato, sem texto extra:

{
  "area": "trabalhista|civel|familia|sucessoes|empresarial|tributario|consultivo|criminal|outra|nao_identificada",
  "proxima_acao": "enviar_M1|enviar_M2|enviar_M3|encerrar_sql|encerrar_mql_frio|fora_escopo|aguardar",
  "resposta_estruturada": { ... },
  "score": 0,
  "motivo": "explicação curta",
  "mensagem_para_enviar": "texto pronto pra mandar ao lead, em pt-BR, tom direto e próximo, com bullets usando • e emojis 😊 ou ✱ se fizer sentido"
}

Revise antes de enviar: nunca escreva palavras grudadas. Sempre inclua espaço entre todas as palavras. Frases tipo 'Apenasqueremos' ou 'aindavou' são erros — corrija pra 'Apenas queremos', 'ainda vou'.

Quando a etapa atual for M0 (área ainda não confirmada), use "proxima_acao": "enviar_M1" assim que conseguir identificar a área e formule a M1 já específica da área.

Sempre fale como humano educado e atencioso, nunca como robô. Nunca prometa resultado jurídico, nunca dê opinião jurídica.`;

// ---------- M1, M2, M3 por área (fallback se Claude não gerar a mensagem) ----------

export const PERGUNTAS_FALLBACK: Record<string, { M1: string; M2: string; M3: string }> = {
  trabalhista: {
    M1: "Entendi. O fato que você quer discutir (demissão, salário, assédio etc.) aconteceu há quanto tempo?\n\n• Menos de 6 meses\n• Entre 6 meses e 2 anos\n• Mais de 2 anos\n• Ainda está acontecendo",
    M2: "Perfeito. Por quanto tempo você trabalhou nessa empresa e qual era a faixa do seu salário? (pode ser estimativa, ex: \"3 anos, ganhava entre 3 e 5 mil\")",
    M3: "Última pergunta: você tem algum desses documentos?\n\n• Carteira de trabalho (CTPS)\n• Holerites recentes\n• Termo de rescisão\n• Conversas (WhatsApp/e-mail) com a empresa\n\nPode marcar mais de um ou dizer \"não tenho nada ainda\".",
  },
  civel: {
    M1: "Entendi. Sua questão envolve qual situação específica? (ex: indenização, contrato, problema com produto/serviço, vizinhança, outra)",
    M2: "Existe algum prazo apertado ou processo já em andamento?\n\n• Sim, tem audiência ou prazo próximo\n• Tem processo, sem urgência imediata\n• Ainda não tem processo\n• Não sei dizer",
    M3: "Pra entender melhor o caso: tem alguma estimativa do valor envolvido? (pode ser uma faixa aproximada ou \"não sei ainda\")",
  },
  familia: {
    M1: "Entendi. Sua questão envolve qual situação? (divórcio, guarda, pensão, partilha, outra)",
    M2: "Existe algum prazo apertado, audiência marcada ou processo em andamento?",
    M3: "Pra entender melhor: tem alguma estimativa do valor envolvido (bens, pensão, etc.) ou da urgência da situação?",
  },
  sucessoes: {
    M1: "Entendi. Estamos falando de inventário, partilha, testamento ou outra situação sucessória?",
    M2: "Há quanto tempo ocorreu o falecimento e existe inventário aberto?",
    M3: "Tem alguma estimativa dos bens envolvidos? (imóveis, valores, etc.)",
  },
  empresarial: {
    M1: "Entendi. Sua empresa tem aproximadamente quantos funcionários e qual o faturamento mensal estimado? (pode ser uma faixa)",
    M2: "Vocês buscam apoio para:\n\n• Consultivo recorrente (mensal)\n• Demanda pontual (contrato, caso específico)\n• Contencioso (já tem processo)\n• Tese tributária (revisão de impostos)",
    M3: "Você é a pessoa que decide a contratação ou existe outra pessoa que decide junto (sócio, financeiro, jurídico interno)?",
  },
  tributario: {
    M1: "Entendi. Sua empresa tem aproximadamente quantos funcionários e qual o faturamento mensal estimado?",
    M2: "Vocês buscam revisão de impostos pagos, defesa de autuação, planejamento tributário ou outra demanda?",
    M3: "Você é a pessoa que decide a contratação ou existe outra pessoa envolvida (sócio, contabilidade, financeiro)?",
  },
  consultivo: {
    M1: "Entendi. Sua empresa tem aproximadamente quantos funcionários e qual o faturamento mensal estimado?",
    M2: "É consultivo recorrente (acompanhamento mensal) ou demanda pontual?",
    M3: "Você é a pessoa que decide a contratação?",
  },
};
