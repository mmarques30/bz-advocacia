import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  type: 'lead' | 'processo';
  title: string;
  subtitle: string;
  url: string;
}

export function useGlobalSearch(searchTerm: string) {
  const { data: results, isLoading } = useQuery({
    queryKey: ['global-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      const results: SearchResult[] = [];
      
      // Buscar leads
      const { data: leads } = await supabase
        .from('contact_submissions')
        .select('id, nome_completo, email, tipo_processo')
        .or(`nome_completo.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(5);
      
      if (leads) {
        results.push(...leads.map(lead => ({
          id: lead.id,
          type: 'lead' as const,
          title: lead.nome_completo,
          subtitle: `${lead.email} • ${lead.tipo_processo}`,
          url: `/dashboard/leads?id=${lead.id}`,
        })));
      }
      
      // Buscar processos
      const { data: processos } = await supabase
        .from('processos')
        .select('id, numero_processo, tipo, autor, reu')
        .or(`numero_processo.ilike.%${searchTerm}%,tipo.ilike.%${searchTerm}%,autor.ilike.%${searchTerm}%,reu.ilike.%${searchTerm}%`)
        .limit(5);
      
      if (processos) {
        results.push(...processos.map(processo => ({
          id: processo.id,
          type: 'processo' as const,
          title: processo.numero_processo || `Processo ${processo.tipo}`,
          subtitle: `${processo.tipo} • ${processo.autor || 'N/A'} vs ${processo.reu || 'N/A'}`,
          url: `/dashboard/processos?id=${processo.id}`,
        })));
      }
      
      return results;
    },
    enabled: searchTerm.length >= 2,
  });
  
  return {
    results: results || [],
    isLoading,
  };
}
