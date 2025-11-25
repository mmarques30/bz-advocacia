import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeadBot } from "@/types/bot";

export function useBotLeads() {
  return useQuery({
    queryKey: ['bot-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .or('origem.eq.whatsapp_bot,bot_finalizado.eq.true')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as LeadBot[];
    },
  });
}

export function useBotLeadsStats() {
  return useQuery({
    queryKey: ['bot-leads-stats'],
    queryFn: async () => {
      // Total de leads do bot
      const { count: totalBot } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .or('origem.eq.whatsapp_bot,bot_finalizado.eq.true');

      // Leads com bot completo
      const { count: botCompleto } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('bot_finalizado', true);

      // Leads convertidos (fechado)
      const { count: convertidos } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .or('origem.eq.whatsapp_bot,bot_finalizado.eq.true')
        .eq('estagio', 'fechado');

      // Novos hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const { count: novosHoje } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .or('origem.eq.whatsapp_bot,bot_finalizado.eq.true')
        .gte('created_at', hoje.toISOString());

      return {
        totalBot: totalBot || 0,
        botCompleto: botCompleto || 0,
        convertidos: convertidos || 0,
        novosHoje: novosHoje || 0,
        taxaConversao: totalBot ? ((convertidos || 0) / totalBot * 100).toFixed(1) : '0',
      };
    },
  });
}
