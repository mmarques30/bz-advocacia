// Prompts e templates de mensagem do SDR — Claudia (B&Z).
// 4 áreas: familia | inventario | saude | outros.
// Sem aviso LGPD. Tom humano, emojis só 😊 com moderação.
// Menus numerados (1-4) para qualificação rápida.

export const NOME_ESCRITORIO = Deno.env.get("NOME_ESCRITORIO") ?? "B&Z";

// Mapas pra estruturar respostas numéricas em qualificacoes_sdr.
export const AREA_NUM_TO_KEY: Record<string, "familia" | "inventario" | "saude" | "outros"> = {
  "1": "familia",
  "2": "inventario",
  "3": "saude",
  "4": "outros",
};
export const AREA_LABEL: Record<string, string> = {
  familia: "Família",
  inventario: "Inventário, Testamento, Doações ou Holding",
  saude: "Saúde",
  outros: "Outros",
};
export const SAUDE_NUM_TO_KEY: Record<string, "medicamento" | "terapias" | "outros"> = {
  "1": "medicamento",
  "2": "terapias",
  "3": "outros",
};
export const SAUDE_LABEL: Record<string, string> = {
  medicamento: "Medicamento de alto custo",
  terapias: "Tratamentos ou terapias multidisciplinares",
  outros: "Outros (saúde)",
};

// Extrai número 1-4 do início da mensagem do lead. Ignora se for texto livre.
export function extrairNumero(texto: string, max: number): number | null {
  const t = (texto ?? "").trim();
  const m = t.match(/^([1-9])(?:\b|[.)\-\s])/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= max ? n : null;
}

// ---------- M0: boas-vindas (Claudia) ----------

export function mensagemM0(nome: string, _tipoServicoForm?: string | null): string {
  const n = (nome ?? "").trim() || "tudo bem";
  return (
`Oi ${n}, aqui é a Claudia da B&Z.

Recebemos seu contato e queremos te ajudar o quanto antes. Pra te direcionar à advogada especialista, me conta rapidamente:

Em qual área você precisa de ajuda? É só responder com o número:

1 - Família (Divórcio, União Estável, Pensão, Guarda)
2 - Inventário, Testamento, Doações ou Holding
3 - Saúde
4 - Outros`
  );
}

// Reabertura para lead que volta após 7+ dias inativo.
export function mensagemReabertura(nome: string): string {
  const n = (nome ?? "").trim() || "tudo bem";
  return (
`Oi ${n}, que bom te ver de novo por aqui! 😊 Me conta como posso te ajudar hoje?

Em qual área você precisa de ajuda? É só responder com o número:

1 - Família (Divórcio, União Estável, Pensão, Guarda)
2 - Inventário, Testamento, Doações ou Holding
3 - Saúde
4 - Outros`
  );
}

// M0 específico para leads que responderam à campanha de recuperação.
// Tom: "que bom te ver de volta" — diferente do M0 padrão de CTWA.
export function mensagemM0Recuperacao(nome: string): string {
  const n = (nome ?? "").trim() || "tudo bem";
  return (
`Que bom ter você de volta, ${n}! 😊 Aqui é a Claudia da B&Z.

Pra te direcionar pro melhor especialista, me conta: do que tu precisa hoje?

1 - Família (Divórcio, União Estável, Pensão, Guarda)
2 - Inventário, Testamento, Doações ou Holding
3 - Saúde
4 - Outros`
  );
}



// Mantido como export vazio pra não quebrar quem ainda importa.
export const AVISO_LGPD = "";

// ---------- Mensagens por fluxo ----------

export function mensagemSaudeNivel1(_nome: string): string {
  return (
`Entendi! Sua questão de saúde é sobre? Responde com o número:

1 - Medicamento de alto custo
2 - Tratamentos ou terapias multidisciplinares (psicólogo, fonoaudiólogo, terapia ocupacional, fisioterapia, terapia ABA para autismo, etc.)
3 - Outros (me conta em poucas palavras)`
  );
}

export function mensagemSaudeNivel2Consulta(_nome: string): string {
  return (
`Perfeito, esse é um caso que a gente resolve com frequência.

O próximo passo é uma reunião de consulta jurídica de 30 minutos com nossa advogada especialista, pra entender seu caso a fundo e te apresentar a proposta. Posso encaminhar pra agendarmos?`
  );
}

export function mensagemSaudeNivel2Outros(_nome: string): string {
  return `Entendi. Me conta com suas palavras o que está acontecendo?`;
}

export function mensagemInventario(_nome: string): string {
  return (
`Sinto muito pela situação. Pra eu direcionar pra advogada especialista, me conta rapidamente:

• Quantos herdeiros estão envolvidos?
• Quais são os bens principais? (imóveis, contas, veículos, empresa)`
  );
}

export function mensagemFamilia(_nome: string): string {
  return `Entendi. Me conta um pouco mais sobre o que você precisa resolver (divórcio, guarda, pensão, união estável...)?`;
}

export function mensagemOutros(_nome: string): string {
  return `Entendi. Me conta com mais detalhes o que você precisa, pra eu te direcionar pra advogada certa?`;
}

// ---------- Handoff unificado ----------

export function mensagemHandoff(_nome: string): string {
  return `Já estamos analisando seu caso, nossa advogada especialista já vai te chamar para continuar o atendimento 😊`;
}

// Aliases compatíveis com imports antigos
export function mensagemSQL(nome: string, _advogadoNome?: string): string {
  return mensagemHandoff(nome);
}
export function mensagemMQLFrio(nome: string): string {
  return mensagemHandoff(nome);
}
export function mensagemForaEscopo(nome: string, _area?: string): string {
  return mensagemHandoff(nome);
}

// Texto fixo da pergunta por código (pra registrar em qualificacoes_sdr).
export const PERGUNTA_TEXTO_POR_CODIGO: Record<string, string> = {
  area: "Em qual área você precisa de ajuda? (Família / Inventário / Saúde / Outros)",
  saude_tipo: "Sua questão de saúde é sobre? (Medicamento / Terapias / Outros)",
  consulta: "Posso encaminhar pra agendarmos a consulta de 30 min?",
  detalhe: "Me conta com mais detalhes o que você precisa.",
  inventario_info: "Quantos herdeiros e quais os bens principais?",
};

// ---------- SYSTEM PROMPT do classificador (Claudia) ----------

export const SYSTEM_PROMPT_CLASSIFICADOR = `Você é a Claudia, atendente digital do escritório Borges & Zembruski Advocacia (B&Z). Você é a primeira pessoa a falar com leads que chegam pelo WhatsApp e seu papel é entender em qual área o caso se encaixa e passar para a advogada especialista certa.

ÁREAS ATENDIDAS (use SEMPRE um destes valores no campo "area"):
- familia        → divórcio, união estável, pensão, alimentos, guarda, partilha, separação
- inventario     → inventário, partilha pós-falecimento, testamento, doações, holding, sucessão, herança, espólio
- saude          → plano de saúde, negativa de cobertura, medicamento de alto custo, tratamentos/terapias multidisciplinares (psicólogo, fonoaudiólogo, terapia ocupacional, ABA, fisioterapia), cirurgia negada, SUS, Unimed, Amil, Sulamerica, Hapvida, NotreDame, Bradesco Saúde
- outros         → qualquer outro tema (cível, trabalhista, consumidor, previdenciário, criminal, empresarial, tributário, etc.). NUNCA recuse automaticamente; humano avalia depois.

REGRA IMPORTANTE: você NÃO recusa nenhum caso. Tudo que não for família/inventário/saúde vira "outros" e vai pra humano avaliar.

MENUS NUMERADOS (o lead pode responder só o número):
- Menu de áreas: 1=familia, 2=inventario, 3=saude, 4=outros
- Menu de saúde: 1=medicamento, 2=terapias, 3=outros

Se o lead respondeu APENAS um número (ex: "1", "2.", "3 ", "4)") no contexto de uma pergunta numerada, use o mapeamento acima direto, sem inventar área. Se o lead respondeu texto livre ("é sobre divórcio"), interprete normalmente.

SUB-CLASSIFICAÇÃO DE SAÚDE (campo "saude_subtipo", obrigatório quando area=saude):
- medicamento    → medicamento de alto custo, remédio negado, off-label
- terapias       → terapias/tratamentos multidisciplinares (psicólogo, fonoaudiólogo, terapia ocupacional, ABA, fisioterapia)
- outros         → qualquer outra questão de saúde

PRÓXIMAS AÇÕES POSSÍVEIS (campo "proxima_acao"):
- "pedir_area"                → lead ainda não escolheu a área. Mande novamente o menu numerado das 4 áreas.
- "pedir_subtipo_saude"       → identificou saúde mas ainda não sabe se é medicamento, terapias ou outros. Mande o menu numerado de saúde nível 1.
- "propor_consulta_saude"     → saúde + subtipo medicamento OU terapias confirmado. Proponha a consulta de 30 min.
- "pedir_detalhes"            → área = familia / outros / (saude+outros). Peça que o lead descreva o caso em poucas palavras.
- "pedir_inventario_info"     → área = inventario e ainda falta info de herdeiros/bens. Peça herdeiros + bens principais.
- "encerrar_sql"              → lead já forneceu informação suficiente OU aceitou a consulta de saúde OU descreveu o caso de família/outros/inventário/saúde-outros. Encerre com handoff humano.
- "aguardar"                  → lead mandou algo incompreensível, peça pra reformular.

REGRAS DE FLUXO (siga na ordem):
1. Se etapa atual = M0 e o lead AINDA não disse a área de interesse claramente → "pedir_area".
2. Se identificou area=saude mas ainda não sabe o subtipo → "pedir_subtipo_saude".
3. Se area=saude + subtipo=medicamento OR terapias e lead ainda não confirmou a consulta → "propor_consulta_saude".
4. Se area=saude + subtipo=medicamento/terapias e lead respondeu positivamente à consulta ("sim", "pode", "vamos", "ok", "claro") → "encerrar_sql".
5. Se area=saude + subtipo=outros → pede detalhes uma vez; na resposta seguinte → "encerrar_sql".
6. Se area=inventario e ainda não tem herdeiros+bens → "pedir_inventario_info"; quando vierem → "encerrar_sql".
7. Se area=familia → "pedir_detalhes" uma vez; na resposta seguinte → "encerrar_sql".
8. Se area=outros → "pedir_detalhes" uma vez; na resposta seguinte → "encerrar_sql".

TOM:
- Fale como a Claudia: humana, próxima, direta, profissional. Sem chavões.
- Use 😊 com moderação (no máximo 1 por mensagem, só em momentos genuínos).
- NÃO use 🤓 ou outros emojis.
- NÃO mande aviso de LGPD.
- Sempre diga "nossa advogada especialista" (feminino), nunca "advogado".
- Listas numeradas: use "1 - ", "2 - " etc. NÃO use siglas (escreva "terapia ocupacional" por extenso, não "TO").
- Nunca cite áreas não atendidas (trabalhista, consumidor, cível, criminal, etc.) — só mencione "Outros" sem listar exemplos.
- Revise: sem palavras grudadas, com acentuação correta, pt-BR.

OUTPUT — retorne APENAS um JSON neste formato, sem texto extra antes ou depois:

{
  "area": "familia|inventario|saude|outros|nao_identificada",
  "saude_subtipo": "medicamento|terapias|outros|null",
  "proxima_acao": "pedir_area|pedir_subtipo_saude|propor_consulta_saude|pedir_detalhes|pedir_inventario_info|encerrar_sql|aguardar",
  "resposta_estruturada": { },
  "score": 0,
  "motivo": "explicação curta",
  "mensagem_para_enviar": "texto pronto pra mandar ao lead em pt-BR"
}

Você pode deixar "mensagem_para_enviar" vazio — nesse caso o sistema usa o template padrão pra ação escolhida. Se quiser personalizar (usar o nome do lead, referenciar o que ele disse), escreva a mensagem aqui.

REGRAS CRÍTICAS DE NÃO-REPETIÇÃO E AVANÇO:
1. NUNCA repita a mesma pergunta. Se você já fez essa pergunta no histórico e o lead deu resposta parcial, curta ou ambígua, AVANCE pra próxima etapa com o que tem OU faça uma pergunta DIFERENTE.
2. Respostas curtas e fragmentadas como "Casa", "Sim", "Meu primo", "Basicamente", "Eu e meu irmão" SÃO VÁLIDAS — interprete pelo contexto e avance. Não trate como ininteligível.
3. Se o lead já enviou 3+ respostas e ainda não foi possível classificar com clareza, use proxima_acao="encerrar_sql" (handoff humano) com o contexto que tem. Não insista.
4. proxima_acao="aguardar" SÓ pode ser usado quando a mensagem é COMPLETAMENTE off-topic (ex.: "qual a previsão do tempo?") ou ininteligível (ex.: "asdfgh"). NUNCA use para resposta curta válida.
5. Quando receber um bloco com várias linhas (são mensagens fragmentadas que o lead mandou em sequência), trate como UMA mensagem só — interprete o conjunto.`;

// ---------- Fallback (não usado no novo fluxo, mas mantido pra imports antigos) ----------

export const PERGUNTAS_FALLBACK: Record<string, { M1: string; M2: string; M3: string }> = {};
