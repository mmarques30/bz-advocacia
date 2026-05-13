// Espelho da função fluxoFromArea() em supabase/functions/_shared/db.ts
// Mantém este arquivo em sincronia para que os testes de cobertura validem
// o mapeamento área → fluxo usado pela whatsapp-inbound.
export function fluxoFromArea(area: string | null | undefined): string {
  const a = (area ?? "").toLowerCase();
  if (a === "saude" || a === "saúde") return "saude";
  if (a === "inventario" || a === "inventário") return "inventario";
  if (
    [
      "familia",
      "família",
      "civel",
      "cível",
      "consumidor",
      "trabalhista",
      "previdenciario",
      "previdenciário",
    ].includes(a)
  ) {
    return "qualificacao_geral";
  }
  if (!a) return "qualificacao_geral";
  return "fora_escopo";
}
