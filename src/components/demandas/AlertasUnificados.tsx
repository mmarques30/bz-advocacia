import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Clock, User, Calendar, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isBefore, isAfter, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PRIORIDADE_LABELS, STATUS_LABELS, TIPO_LABELS } from "@/types/demandas";
import { useDemandasPerformance } from "@/hooks/useDemandasPerformance";
import { PerformanceIndicators } from "./PerformanceIndicators";
import { DistribuicaoResponsavel } from "./DistribuicaoResponsavel";

export function AlertasUnificados() {
  const { user } = useAuth();
  const { data: performance, isLoading: performanceLoading } = useDemandasPerformance();

  // Alertas importantes (vencidos e urgentes)
  const { data: alertas, isLoading: alertasLoading } = useQuery({
    queryKey: ['demandas-alertas'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('demandas_internas')
        .select(`
          *,
          responsavel:profiles!demandas_internas_responsavel_id_fkey(nome_completo)
        `)
        .not('status', 'in', '("concluido","cancelado")')
        .or(`data_limite.lt.${today},prioridade.eq.urgente`)
        .order('data_limite', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Demandas do usuário logado
  const { data: minhasDemandas, isLoading: minhasLoading } = useQuery({
    queryKey: ['demandas-usuario', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('demandas_internas')
        .select(`
          *,
          criador:profiles!demandas_internas_criado_por_fkey(nome_completo)
        `)
        .eq('responsavel_id', user.id)
        .not('status', 'in', '("concluido","cancelado")')
        .order('prioridade', { ascending: false })
        .order('data_limite', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Demandas futuras (próximos 7 dias)
  const { data: demandasFuturas, isLoading: futurasLoading } = useQuery({
    queryKey: ['demandas-futuras'],
    queryFn: async () => {
      const today = new Date();
      const nextWeek = addDays(today, 7);
      
      const { data, error } = await supabase
        .from('demandas_internas')
        .select(`
          *,
          responsavel:profiles!demandas_internas_responsavel_id_fkey(nome_completo)
        `)
        .not('status', 'in', '("concluido","cancelado")')
        .gte('data_limite', today.toISOString().split('T')[0])
        .lte('data_limite', nextWeek.toISOString().split('T')[0])
        .order('data_limite', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const getPrioridadeBadge = (prioridade: string) => {
    const variants: Record<string, string> = {
      urgente: 'bg-red-500/10 text-red-600 border-red-200',
      alta: 'bg-orange-500/10 text-orange-600 border-orange-200',
      media: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
      baixa: 'bg-green-500/10 text-green-600 border-green-200',
    };
    return variants[prioridade] || variants.media;
  };

  const isAtrasada = (dataLimite: string | null) => {
    if (!dataLimite) return false;
    return isBefore(new Date(dataLimite), new Date());
  };

  const renderDemandaItem = (demanda: any, showResponsavel = true) => (
    <div
      key={demanda.id}
      className={`p-3 rounded-lg border transition-colors hover:bg-muted/50 ${
        isAtrasada(demanda.data_limite) ? 'border-l-4 border-l-red-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{demanda.titulo}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className={getPrioridadeBadge(demanda.prioridade)}>
              {PRIORIDADE_LABELS[demanda.prioridade as keyof typeof PRIORIDADE_LABELS]}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {TIPO_LABELS[demanda.tipo as keyof typeof TIPO_LABELS]}
            </Badge>
            {demanda.data_limite && (
              <span className={`text-xs ${isAtrasada(demanda.data_limite) ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                {format(new Date(demanda.data_limite), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            )}
          </div>
          {showResponsavel && demanda.responsavel?.nome_completo && (
            <p className="text-xs text-muted-foreground mt-1">
              Responsável: {demanda.responsavel.nome_completo}
            </p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </div>
  );

  return (
  <>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Alertas Importantes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-seasons">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Alertas Importantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertasLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : alertas && alertas.length > 0 ? (
            <ScrollArea className="h-[320px] pr-2">
              <div className="space-y-2">
                {alertas.map((demanda) => renderDemandaItem(demanda))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhum alerta no momento</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Minhas Demandas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-seasons">
            <User className="h-4 w-4 text-primary" />
            Minhas Demandas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {minhasLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : minhasDemandas && minhasDemandas.length > 0 ? (
            <ScrollArea className="h-[320px] pr-2">
              <div className="space-y-2">
                {minhasDemandas.map((demanda) => renderDemandaItem(demanda, false))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <User className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma demanda atribuída a você</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demandas Futuras */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-seasons">
            <Calendar className="h-4 w-4 text-blue-500" />
            Próximos 7 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {futurasLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : demandasFuturas && demandasFuturas.length > 0 ? (
            <ScrollArea className="h-[320px] pr-2">
              <div className="space-y-2">
                {demandasFuturas.map((demanda) => renderDemandaItem(demanda))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Calendar className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma demanda para os próximos dias</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    {/* Seção de Performance e Distribuição */}
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <PerformanceIndicators 
        data={performance} 
        loading={performanceLoading} 
      />
      <DistribuicaoResponsavel 
        data={performance?.distribuicaoPorResponsavel} 
        loading={performanceLoading} 
      />
    </div>
  </>
  );
}
