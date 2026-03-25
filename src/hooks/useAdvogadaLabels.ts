import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ADVOGADA_LABELS } from '@/types/demandas';

export function useAdvogadaLabels(): Record<string, string> {
  const { data } = useQuery({
    queryKey: ['advogada-labels'],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('nome_completo')
        .or('nome_completo.ilike.Juliana%,nome_completo.ilike.Eliziane%');

      const labels: Record<string, string> = { ...ADVOGADA_LABELS };
      profiles?.forEach((p) => {
        const nome = p.nome_completo.toLowerCase();
        if (nome.startsWith('juliana')) labels.juliana = p.nome_completo;
        else if (nome.startsWith('eliziane')) labels.liziane = p.nome_completo;
      });
      return labels;
    },
    staleTime: 1000 * 60 * 10,
  });

  return data ?? { ...ADVOGADA_LABELS };
}
