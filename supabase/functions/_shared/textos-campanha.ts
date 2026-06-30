// Textos hardcoded da campanha de recuperação de leads do form Meta.
// 3 variações por área (inventario, saude, outro). Usa {primeiro_nome}.

export type AreaCampanha = "inventario" | "saude" | "outro";

export const TEXTOS_CAMPANHA: Record<AreaCampanha, string[]> = {
  inventario: [
    `Oi {primeiro_nome}, aqui é a Claudia da B&Z Advocacia 😊

Há algumas semanas você buscou nosso anúncio interessada(o) em inventário ou sucessão. Vi aqui que ainda não tivemos chance de conversar.

Espero que esteja tudo bem por aí. Se ainda precisa de orientação pra cuidar disso, é só me responder por aqui que direciono pra nossa advogada especialista em sucessões.

Se já resolveu ou prefere não seguir, fica tudo certo, é só me avisar.`,

    `Oi {primeiro_nome}, aqui é a Claudia da B&Z Advocacia 😊

Vi aqui que há algum tempo você se cadastrou no nosso anúncio sobre inventário e sucessão. Como ainda não conversamos por aqui, queria saber se ainda quer falar com nossa advogada especialista na área.

Se quiser retomar, é só me responder. Caso já tenha resolvido, fica tudo certo também.`,

    `Oi {primeiro_nome}, tudo bem? Aqui é a Claudia, do escritório Borges & Zembruski Advocacia.

Sei que faz um tempinho que você buscou a gente sobre inventário. Espero que esteja tudo bem.

Se ainda precisa de orientação jurídica sobre isso, estou aqui pra te conectar com nossa advogada especialista. É só me responder por aqui 😊`,
  ],

  saude: [
    `Oi {primeiro_nome}, aqui é a Claudia da B&Z Advocacia 😊

Há algumas semanas você buscou nosso anúncio interessada(o) em uma questão de saúde (plano negando cobertura, medicamento de alto custo, terapia ou tratamento). Vi aqui que ainda não tivemos chance de conversar.

Espero que esteja tudo bem por aí. Se ainda precisa de orientação, é só me responder por aqui que direciono pra nossa advogada especialista em direito à saúde.

Se já resolveu ou prefere não seguir, fica tudo certo, é só me avisar.`,

    `Oi {primeiro_nome}, aqui é a Claudia da B&Z Advocacia 😊

Vi aqui que há algum tempo você se cadastrou no nosso anúncio sobre direito à saúde (plano, medicamento ou tratamento negado). Como ainda não conversamos por aqui, queria saber se ainda quer falar com nossa advogada especialista na área.

Se quiser retomar, é só me responder. Caso já tenha resolvido, fica tudo certo também.`,

    `Oi {primeiro_nome}, tudo bem? Aqui é a Claudia, do escritório Borges & Zembruski Advocacia.

Sei que faz um tempinho que você buscou a gente sobre uma questão de saúde (plano, medicamento ou tratamento). Espero que esteja tudo bem.

Se ainda precisa de orientação jurídica sobre isso, estou aqui pra te conectar com nossa advogada especialista. É só me responder por aqui 😊`,
  ],

  outro: [
    `Oi {primeiro_nome}, aqui é a Claudia da B&Z Advocacia 😊

Há algumas semanas você buscou nosso anúncio interessada(o) em orientação jurídica. Vi aqui que ainda não tivemos chance de conversar.

Espero que esteja tudo bem por aí. Se ainda precisa de ajuda, é só me responder por aqui que direciono pra advogada especialista certa.

Se já resolveu ou prefere não seguir, fica tudo certo, é só me avisar.`,

    `Oi {primeiro_nome}, aqui é a Claudia da B&Z Advocacia 😊

Vi aqui que há algum tempo você se cadastrou no nosso anúncio buscando orientação jurídica. Como ainda não conversamos por aqui, queria saber se você ainda quer falar com uma das nossas advogadas.

Se quiser retomar, é só me responder. Caso já tenha resolvido, fica tudo certo também.`,

    `Oi {primeiro_nome}, tudo bem? Aqui é a Claudia, do escritório Borges & Zembruski Advocacia.

Sei que faz um tempinho que você buscou a gente. Espero que esteja tudo bem.

Se ainda precisa de orientação jurídica, estou aqui pra te conectar com a advogada certa pro seu caso. É só me responder por aqui 😊`,
  ],
};

export function classificarAreaCampanha(tipoProcesso: string | null | undefined): AreaCampanha {
  const t = (tipoProcesso ?? "").toLowerCase().trim();
  if (t.includes("invent")) return "inventario";
  if (t.includes("saúde") || t.includes("saude") || t.includes("medicament")) return "saude";
  return "outro";
}

export function primeiroNome(full: string | null | undefined): string {
  const n = (full ?? "").trim().split(/\s+/)[0] ?? "";
  return n || "tudo bem";
}

export function escolherTexto(area: AreaCampanha): { texto: string; variacao: number } {
  const variacao = Math.floor(Math.random() * 3); // 0,1,2
  return { texto: TEXTOS_CAMPANHA[area][variacao], variacao: variacao + 1 };
}
