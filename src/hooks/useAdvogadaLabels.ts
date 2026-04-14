import { ADVOGADA_LABELS } from "@/types/demandas";
import { useAdvogadas } from "@/hooks/useAdvogadas";

/**
 * Retorna um map { juliana: "...", liziane: "..." } com os nomes
 * atuais vindos de profiles. Mantido com a mesma API por compatibilidade
 * com os consumidores existentes.
 *
 * A fonte de verdade hoje e `useAdvogadas()` (que le `profiles.is_advogada`).
 * Este hook ainda existe como camada de compat; para novos codigos,
 * prefira `useAdvogadas()` diretamente.
 */
export function useAdvogadaLabels(): Record<string, string> {
  const { data: advogadas } = useAdvogadas();

  const labels: Record<string, string> = { ...ADVOGADA_LABELS };
  advogadas?.forEach((a) => {
    if (a.legacy_key) {
      labels[a.legacy_key] = a.nome_completo;
    }
  });
  return labels;
}
