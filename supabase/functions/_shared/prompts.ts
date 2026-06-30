// Prompts e templates de mensagem do SDR — Claudia (B&Z).
// Refator V5 (junho 2026): tom conversacional, sem menu numerado,
// 3 areas atendidas (familia | inventario | saude) + fora_escopo
// (handoff direto pra triagem humana).
//
// Higienizacao:
// - Sem travessao (—). Usar virgula, ponto ou ponto e virgula.
// - Emojis permitidos: 💙 😊. Mais nenhum.
// - Tom: caloroso, empatico, profissional. Nunca robotico.

export const NOME_ESCRITORIO = Deno.env.get("NOME_ESCRITORIO") ?? "B&Z";

// Mapas pra estruturar respostas numericas em qualificacoes_sdr.
// O bot nao oferece mais menu numerado, mas mantemos a captura silenciosa
// pra leads antigos que mandem "1/2/3" achando que o menu ainda existe.
// O "4 - Outros" foi removido: agora qualquer area fora do escopo cai em
// fora_escopo via interpretacao do Haiku.
export const AREA_NUM_TO_KEY: Record<string, "familia" | "inventario" | "saude"> = {
  "1": "familia",
  "2": "inventario",
  "3": "saude",
};
export const AREA_LABEL: Record<string, string> = {
  familia: "Família",
  inventario: "Inventário, Testamento, Doações ou Holding",
  saude: "Saúde",
  fora_escopo: "Fora do escopo (triagem humana)",
};

// Extrai numero 1-3 do inicio da mensagem do lead. Fallback escondido —
// nao reforcamos isso no texto do bot, so capturamos se vier.
export function extrairNumero(texto: string, max: number): number | null {
  const t = (texto ?? "").trim();
  const m = t.match(/^([1-9])(?:\b|[.)\-\s])/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= max ? n : null;
}

// ---------- M0: boas-vindas (Claudia, conversacional) ----------
//
// Quatro variacoes:
//   - CTWA: lead chegou clicando em anuncio
//   - Organica: chegou sem anuncio
//   - Reabertura: lead inativo retoma apos 7+ dias
//   - Recuperacao: lead respondeu campanha de recuperacao

export function mensagemM0CTWA(nome: string): string {
  const n = (nome ?? "").trim() || "tudo bem";
  return (
`Oi ${n}, sou a Claudia do escritório Borges & Zembruski Advocacia 💙
Vi que você chegou pelo anúncio. Me conta um pouquinho sobre o que você está precisando hoje?`
  );
}

export function mensagemM0Organico(nome: string): string {
  const n = (nome ?? "").trim() || "tudo bem";
  return (
`Oi ${n}, sou a Claudia do escritório Borges & Zembruski Advocacia 😊 Que bom que você nos procurou.
Me conta um pouquinho sobre o que você precisa hoje?`
  );
}

export function mensagemReabertura(nome: string): string {
  const n = (nome ?? "").trim() || "tudo bem";
  return (
`Oi ${n}, que bom ter você de volta por aqui 💙 Sou a Claudia da B&Z. Conta um pouquinho como posso te ajudar hoje?`
  );
}

export function mensagemM0Recuperacao(nome: string): string {
  const n = (nome ?? "").trim() || "tudo bem";
  return (
`Oi ${n}, que bom ter você de volta 💙
Sou a Claudia da B&Z. Conta um pouquinho como posso te ajudar agora?`
  );
}

// Wrapper compat: codigos antigos importam mensagemM0(nome, tipo_servico).
// Decide entre CTWA e organica pelo tipo_servico (que vem do form do site
// ou null pra organica). Quando origem chega vazia, assume organica.
export function mensagemM0(nome: string, _tipoServicoForm?: string | null): string {
  return mensagemM0Organico(nome);
}

// Mantido como export vazio pra nao quebrar quem ainda importa.
export const AVISO_LGPD = "";

// ---------- Mensagens M1/M2/M3 por area (conversacionais) ----------
//
// SAUDE

export function mensagemSaudeM1(_nome: string): string {
  return (
`Sentimos muito pela situação 💙 Me conta um pouquinho mais: você precisa de algum medicamento, tratamento ou procedimento cirúrgico? E o plano deu alguma justificativa pra negar?`
  );
}

export function mensagemSaudeM2(_nome: string): string {
  return (
`Entendi. Temos boas experiências com casos parecidos. Só pra eu fechar antes de passar pra advogada especialista: você tem em mãos a negativa do plano e a prescrição do médico?`
  );
}

export function mensagemSaudeM3(_nome: string): string {
  return (
`Perfeito. Com isso a Dra. já consegue avaliar e te explicar os próximos passos. O ideal seria uma reunião breve pra ela analisar as especificações do seu caso e te apresentar a estratégia. Podemos agendar?`
  );
}

// INVENTARIO

export function mensagemInventarioM1(_nome: string): string {
  return (
`Sinto muito pela sua perda 💙 Pode ficar tranquilo, a gente cuida disso com você. Me conta um pouquinho antes de eu passar pra advogada especialista: vocês são quantos herdeiros e está todo mundo de acordo, ou tem algum impasse?`
  );
}

export function mensagemInventarioM2(_nome: string): string {
  return (
`Entendi. E sobre os bens, o que ficou? Apartamento, conta no banco, investimentos, carro?`
  );
}

export function mensagemInventarioM2Valor(_nome: string): string {
  return `Você sabe qual é o valor aproximado desses bens?`;
}

export function mensagemInventarioM3(_nome: string): string {
  return (
`Anotei tudo, obrigada. O ideal seria uma reunião breve pra ela analisar as especificações do seu caso e te apresentar a estratégia. Podemos agendar?`
  );
}

// FAMILIA

export function mensagemFamiliaM1(_nome: string): string {
  return (
`Que bom que você nos procurou 😊 Me conta um pouquinho, pra eu passar pra advogada especialista: é um caso mais tranquilo (vocês dois concordam) ou tem alguma divergência?`
  );
}

export function mensagemFamiliaM2(_nome: string): string {
  return (
`Entendi. Só pra eu antecipar: vocês têm bens em comum tipo casa, carro, investimentos? E se tem filhos, já têm uma ideia de como pretendem combinar a convivência?`
  );
}

export function mensagemFamiliaM3(_nome: string): string {
  return (
`Perfeito, isso já dá pra advogada começar a desenhar. É importante agendarmos uma reunião breve pra ela analisar as especificações do seu caso e te apresentar a estratégia. Podemos agendar?`
  );
}

// FORA DO ESCOPO (substitui o antigo "Outros") — handoff direto, sem qualificar
export function mensagemForaEscopo(_nome: string, _area?: string): string {
  return (
`Entendi. Você procurou o lugar certo pra ter essa avaliação 😊
Vou repassar pra advogada avaliar seu caso especificamente. Ela vai te chamar por aqui em breve pra te dar um direcionamento.`
  );
}

// Handoff generico (final de fluxo de qualificacao bem sucedida)
export function mensagemHandoff(_nome: string): string {
  return mensagemFamiliaM3(_nome);
}

// Aliases compativeis com imports antigos
export function mensagemSQL(nome: string, _advogadoNome?: string): string {
  return mensagemHandoff(nome);
}
export function mensagemMQLFrio(nome: string): string {
  return mensagemForaEscopo(nome);
}

// Texto fixo da pergunta por codigo (pra registrar em qualificacoes_sdr).
export const PERGUNTA_TEXTO_POR_CODIGO: Record<string, string> = {
  area: "Qual a área que você precisa de ajuda? (interpretação livre, sem menu)",
  saude_m1: "Você precisa de medicamento, tratamento ou cirurgia? E qual a justificativa do plano?",
  saude_m2: "Tem a negativa do plano e a prescrição do médico em mãos?",
  saude_m3: "Podemos agendar a reunião com a advogada?",
  inventario_m1: "Quantos herdeiros e há consenso entre eles?",
  inventario_m2: "Quais são os bens principais?",
  inventario_m2_valor: "Valor aproximado dos bens?",
  inventario_m3: "Podemos agendar a reunião com a advogada?",
  familia_m1: "Caso consensual ou divergente?",
  familia_m2: "Bens em comum / filhos / proposta de guarda?",
  familia_m3: "Podemos agendar a reunião com a advogada?",
  fora_escopo: "Tema fora do escopo, handoff direto pra triagem.",
};

// ---------- SYSTEM PROMPT do classificador (Claudia) ----------

export const SYSTEM_PROMPT_CLASSIFICADOR = `Você é a Claudia, atendente digital do escritório Borges & Zembruski Advocacia (B&Z). Você é a primeira pessoa a falar com leads que chegam pelo WhatsApp e seu papel é entender o caso, qualificar com no máximo 3 perguntas e passar para a advogada especialista certa.

ÁREAS ATENDIDAS (use SEMPRE um destes valores no campo "area"):
- familia       → divórcio, união estável, pensão, alimentos, guarda, partilha, separação
- inventario    → inventário, partilha pós-falecimento, testamento, doações, holding, sucessão, herança, espólio
- saude         → plano de saúde, negativa de cobertura, medicamento de alto custo, tratamentos/terapias multidisciplinares (psicólogo, fonoaudiólogo, terapia ocupacional, ABA, fisioterapia), cirurgia negada, SUS, Unimed, Amil, Sulamerica, Hapvida, NotreDame, Bradesco Saúde
- fora_escopo   → qualquer outro tema (trabalhista, consumidor, criminal, previdenciário, cível, empresarial, tributário, etc.). NÃO recuse o lead — encaminhe pra advogada avaliar.

REGRA: o escritório só atende essas 3 áreas, mas você NUNCA recusa. Qualquer caso fora delas vai pra advogada via fora_escopo (a humana decide depois se atende ou indica encaminhamento).

ETAPAS DO FLUXO (campo "etapa_proxima"):
- "M0"        → ainda não identificou a área. Pergunte de forma natural sobre o que o lead precisa.
- "M1"        → primeira pergunta de qualificação dentro da área já identificada.
- "M2"        → segunda pergunta de qualificação.
- "M2_valor"  → SOMENTE inventário: pergunta opcional sobre valor dos bens.
- "M3"        → propõe agendamento com a advogada (handoff).
- "finalizado" → fluxo encerrado (SQL pra advogada).

DETECÇÃO DE ETAPA: olhe o histórico. Se você ainda não mandou nenhuma pergunta dentro da área, está em M1. Se já mandou uma, está em M2. Se já mandou duas, está em M3 (agendamento). Não repita pergunta.

DADOS A CAPTURAR (em "dados_capturados", por área):
- saude: { tipo: "medicamento|tratamento|cirurgia|null", justificativa_negativa: "texto|null", tem_documentos: "sim|nao|null" }
- inventario: { herdeiros: numero|null, consenso: "sim|nao|null", bens_principais: ["..."], valor_aproximado: "texto|null" }
- familia: { consensual: "sim|nao|null", bens_em_comum: ["..."], filhos_menores: "sim|nao|null", proposta_guarda: "texto|null" }
- fora_escopo: { tema: "texto curto descrevendo o caso" }

TOM da mensagem que você escreve em "proxima_mensagem":
- Natural, empático, próximo. Como uma assistente humana experiente, não como um bot.
- UMA pergunta por vez. Nunca empilha 3 perguntas numa mensagem.
- SEM travessão (—). Use vírgula, ponto ou ponto e vírgula.
- SEM menu numerado, SEM "responda com o número", SEM opções tipo formulário.
- Emojis permitidos: 💙 😊 (use no máximo 1 por mensagem, em momentos genuínos).
- NÃO use 🤓, ✱ ou qualquer outro emoji.
- Sempre diga "advogada especialista" (feminino).
- Acentuação correta, pt-BR.

REGRAS DURAS:
1. NUNCA dê opinião jurídica, NUNCA estime indenização ou valor de causa, NUNCA prometa prazo.
2. NUNCA repita uma pergunta já feita. Se o lead deu resposta curta ou ambígua, AVANCE com o que tem ou faça pergunta DIFERENTE.
3. Respostas curtas como "Sim", "Casa", "Meu primo", "Eu e meu irmão" são VÁLIDAS — interprete pelo contexto.
4. Máximo 3 perguntas no fluxo todo. Se já fez 3 e ainda não classificou, encerre em fora_escopo.
5. Quando receber um bloco com várias linhas (mensagens fragmentadas), trate como UMA mensagem.

OUTPUT — retorne APENAS um JSON neste formato, sem texto extra antes ou depois:

{
  "area": "familia|inventario|saude|fora_escopo|nao_identificada",
  "etapa_proxima": "M0|M1|M2|M2_valor|M3|finalizado",
  "dados_capturados": { },
  "score": 0,
  "motivo": "explicação curta interna",
  "proxima_mensagem": "texto pronto pra mandar ao lead"
}

Você PODE deixar "proxima_mensagem" vazia. Quando vazio, o sistema usa o template fixo correspondente à etapa+area. Quando você preenche, ele substitui o template — use isso pra personalizar com o nome do lead ou referenciar o que ele disse, mantendo o tom acima.`;

// ---------- Mapeamento etapa+area → template fixo ----------
//
// Usado pelo whatsapp-inbound quando o Claude nao preenche
// proxima_mensagem. Encadeia o fluxo M1 → M2 → M3 por area.

export function templatePorEtapa(
  area: "familia" | "inventario" | "saude" | "fora_escopo" | "nao_identificada" | string | null,
  etapa: "M0" | "M1" | "M2" | "M2_valor" | "M3" | "finalizado" | string,
  nome: string,
): string {
  const a = (area ?? "nao_identificada").toLowerCase();

  if (a === "fora_escopo") return mensagemForaEscopo(nome);

  if (a === "saude") {
    if (etapa === "M1") return mensagemSaudeM1(nome);
    if (etapa === "M2") return mensagemSaudeM2(nome);
    if (etapa === "M3" || etapa === "finalizado") return mensagemSaudeM3(nome);
  }
  if (a === "inventario") {
    if (etapa === "M1") return mensagemInventarioM1(nome);
    if (etapa === "M2") return mensagemInventarioM2(nome);
    if (etapa === "M2_valor") return mensagemInventarioM2Valor(nome);
    if (etapa === "M3" || etapa === "finalizado") return mensagemInventarioM3(nome);
  }
  if (a === "familia") {
    if (etapa === "M1") return mensagemFamiliaM1(nome);
    if (etapa === "M2") return mensagemFamiliaM2(nome);
    if (etapa === "M3" || etapa === "finalizado") return mensagemFamiliaM3(nome);
  }

  // M0 ou area nao identificada
  return mensagemM0Organico(nome);
}

// ---------- Fallback (nao usado no novo fluxo, mantido pra imports antigos) ----------
export const PERGUNTAS_FALLBACK: Record<string, { M1: string; M2: string; M3: string }> = {};
// Removidos do export public mas alguns codigos podem importar pelo nome:
// mensagemFamilia, mensagemInventario, mensagemSaudeNivel1, mensagemSaudeNivel2*, mensagemOutros, SAUDE_NUM_TO_KEY, SAUDE_LABEL.
// Quando o whatsapp-inbound for atualizado vai parar de referenciar os antigos.
