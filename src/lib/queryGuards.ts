/**
 * Helpers para queries paginadas/limitadas.
 *
 * Motivacao: varios hooks financeiros usam `.limit(10000)` como guardrail
 * contra payloads imensos. Isso vira um bug silencioso quando a base
 * cresce alem desse teto (os graficos perdem registros sem avisar).
 * O helper abaixo loga um warning no console quando a query retorna
 * exatamente o limite — sinal forte de que houve truncamento e alguem
 * precisa refinar filtros ou migrar para uma RPC de agregacao.
 *
 * Nao lanca excecao, so loga. Assim nao quebra o fluxo em prod, mas
 * fica visivel no devtools para quem estiver investigando relatorios
 * que "parecem estranhos".
 */

const DEFAULT_LIMIT = 10_000;

export function warnIfTruncated<T>(
  data: T[] | null | undefined,
  queryName: string,
  limit: number = DEFAULT_LIMIT,
): T[] | null | undefined {
  if (data && data.length >= limit) {
    // eslint-disable-next-line no-console
    console.warn(
      `[query-truncated] "${queryName}" atingiu o limite de ${limit} rows. ` +
        `Refine os filtros ou migre para uma RPC de agregacao ` +
        `(o resultado pode estar incompleto).`,
    );
  }
  return data;
}
