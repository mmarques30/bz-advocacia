import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface DemandaSimples {
  id: string;
  titulo: string;
  prioridade: string;
  data_limite: string | null;
  status: string;
}

interface DemandaPendente {
  total: number;
  urgentes: number;
  atrasadas: number;
  lista: DemandaSimples[];
}

interface PagamentoPendente {
  parcelasAtrasadas: number;
  parcelasProximas: number;
  valorTotal: number;
}

interface ProcessoAtraso {
  total: number;
  lista: Array<{
    id: string;
    numero_processo: string | null;
    tipo: string;
    dias_sem_atualizacao: number;
  }>;
}

export interface UserPendencias {
  demandas: DemandaPendente;
  pagamentos: PagamentoPendente;
  processos: ProcessoAtraso;
}

export function useUserPendencias() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-pendencias", user?.id],
    queryFn: async (): Promise<UserPendencias> => {
      const hoje = new Date();
      const hojeISO = hoje.toISOString().split("T")[0];
      const em7Dias = new Date(hoje);
      em7Dias.setDate(em7Dias.getDate() + 7);
      const em7DiasISO = em7Dias.toISOString().split("T")[0];

      // 1. Buscar demandas pendentes do usuário (tabela: demandas_internas)
      const { data: demandas, error: demandasError } = await supabase
        .from("demandas_internas")
        .select("id, titulo, prioridade, data_limite, status")
        .eq("responsavel_id", user?.id || "")
        .in("status", ["pendente", "em_andamento"]);

      if (demandasError) throw demandasError;

      const demandasLista = (demandas || []) as DemandaSimples[];
      const demandasAtrasadas = demandasLista.filter(
        (d) => d.data_limite && new Date(d.data_limite) < hoje
      );
      const demandasUrgentes = demandasLista.filter(
        (d) => d.prioridade === "urgente"
      );

      // 2. Buscar pagamentos pendentes/atrasados
      const { data: parcelasAtrasadas, error: parcelasAtrasadasError } = await supabase
        .from("parcelas_financeiras")
        .select("id, valor")
        .eq("status", "atrasado");

      if (parcelasAtrasadasError) throw parcelasAtrasadasError;

      const { data: parcelasProximas, error: parcelasProximasError } = await supabase
        .from("parcelas_financeiras")
        .select("id, valor")
        .eq("status", "pendente")
        .gte("data_vencimento", hojeISO)
        .lte("data_vencimento", em7DiasISO);

      if (parcelasProximasError) throw parcelasProximasError;

      const valorTotalAtrasado = (parcelasAtrasadas || []).reduce(
        (acc, p) => acc + (p.valor || 0),
        0
      );
      const valorTotalProximo = (parcelasProximas || []).reduce(
        (acc, p) => acc + (p.valor || 0),
        0
      );

      // 3. Buscar processos sem atualização há mais de 30 dias
      const ha30Dias = new Date(hoje);
      ha30Dias.setDate(ha30Dias.getDate() - 30);
      const ha30DiasISO = ha30Dias.toISOString();

      const { data: processos, error: processosError } = await supabase
        .from("processos")
        .select("id, numero_processo, tipo, data_ultima_atualizacao")
        .eq("status", "em_andamento")
        .lt("data_ultima_atualizacao", ha30DiasISO);

      if (processosError) throw processosError;

      const processosComDias = (processos || []).map((p) => {
        const ultimaAtualizacao = p.data_ultima_atualizacao 
          ? new Date(p.data_ultima_atualizacao) 
          : new Date(0);
        const diasSemAtualizacao = Math.floor(
          (hoje.getTime() - ultimaAtualizacao.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          id: p.id,
          numero_processo: p.numero_processo,
          tipo: p.tipo,
          dias_sem_atualizacao: diasSemAtualizacao,
        };
      });

      return {
        demandas: {
          total: demandasLista.length,
          urgentes: demandasUrgentes.length,
          atrasadas: demandasAtrasadas.length,
          lista: demandasLista,
        },
        pagamentos: {
          parcelasAtrasadas: (parcelasAtrasadas || []).length,
          parcelasProximas: (parcelasProximas || []).length,
          valorTotal: valorTotalAtrasado + valorTotalProximo,
        },
        processos: {
          total: processosComDias.length,
          lista: processosComDias,
        },
      };
    },
    enabled: !!user?.id,
  });
}
