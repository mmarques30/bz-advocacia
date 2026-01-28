import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lead } from "@/types/leads";
import { ProcessoStatus, PROCESSO_STATUS_LABELS } from "@/types/processos";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, FileText, User } from "lucide-react";

interface ClientesKanbanProps {
  leads: Lead[] | undefined;
  isLoading: boolean;
  onViewDetails: (lead: Lead) => void;
}

interface ClienteWithProcessos extends Lead {
  processos?: {
    id: string;
    status: ProcessoStatus;
    tipo: string;
    numero_processo: string | null;
  }[];
}

// Define the process status for grouping clients
type ClienteProcessoStatus = 'sem_processo' | 'em_andamento' | 'concluido' | 'arquivado';

const CLIENTE_STATUS_COLUMNS: { status: ClienteProcessoStatus; titulo: string; color: string }[] = [
  { status: "sem_processo", titulo: "Sem Processo", color: "bg-muted" },
  { status: "em_andamento", titulo: "Em Andamento", color: "bg-blue-500" },
  { status: "concluido", titulo: "Concluído", color: "bg-green-500" },
  { status: "arquivado", titulo: "Arquivado", color: "bg-gray-500" },
];

function ClienteCard({ cliente, onClick }: { cliente: ClienteWithProcessos; onClick: () => void }) {
  const processosCount = cliente.processos?.length || 0;
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate">{cliente.nome_completo}</span>
          </div>
          {cliente.status_cliente && (
            <Badge variant={cliente.status_cliente === 'ativo' ? 'default' : 'secondary'} className="shrink-0">
              {cliente.status_cliente === 'ativo' ? 'Ativo' : 'Inativo'}
            </Badge>
          )}
        </div>
        
        <div className="space-y-1 text-xs text-muted-foreground">
          {cliente.telefone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              <span className="truncate">{cliente.telefone}</span>
            </div>
          )}
          {cliente.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3" />
              <span className="truncate">{cliente.email}</span>
            </div>
          )}
        </div>

        {processosCount > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <FileText className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {processosCount} processo{processosCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {cliente.tipo_processo && (
          <Badge variant="outline" className="text-xs">
            {cliente.tipo_processo}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export function ClientesKanban({ leads, isLoading, onViewDetails }: ClientesKanbanProps) {
  // Fetch processes for all clients
  const clienteIds = leads?.map(l => l.id) || [];
  
  const { data: processos } = useQuery({
    queryKey: ["processos-clientes", clienteIds],
    queryFn: async () => {
      if (clienteIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("processos")
        .select("id, lead_id, status, tipo, numero_processo")
        .in("lead_id", clienteIds);
      
      if (error) throw error;
      return data;
    },
    enabled: clienteIds.length > 0,
  });

  // Map processes to clients
  const clientesWithProcessos = useMemo(() => {
    if (!leads) return [];
    
    return leads.map(lead => ({
      ...lead,
      processos: processos?.filter(p => p.lead_id === lead.id) || [],
    })) as ClienteWithProcessos[];
  }, [leads, processos]);

  // Group clients by their main process status
  const clientesGrouped = useMemo(() => {
    const groups: Record<ClienteProcessoStatus, ClienteWithProcessos[]> = {
      sem_processo: [],
      em_andamento: [],
      concluido: [],
      arquivado: [],
    };

    clientesWithProcessos.forEach(cliente => {
      const clienteProcessos = cliente.processos || [];
      
      if (clienteProcessos.length === 0) {
        groups.sem_processo.push(cliente);
      } else {
        // Determine main status based on priority: em_andamento > suspenso > concluido > arquivado
        const hasEmAndamento = clienteProcessos.some(p => p.status === 'em_andamento');
        const hasSuspenso = clienteProcessos.some(p => p.status === 'suspenso');
        const hasConcluido = clienteProcessos.some(p => p.status === 'concluido');
        
        if (hasEmAndamento || hasSuspenso) {
          groups.em_andamento.push(cliente);
        } else if (hasConcluido) {
          groups.concluido.push(cliente);
        } else {
          groups.arquivado.push(cliente);
        }
      }
    });

    return groups;
  }, [clientesWithProcessos]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4 min-h-[600px]">
        {CLIENTE_STATUS_COLUMNS.map((col) => (
          <div key={col.status}>
            <Skeleton className="h-8 w-full mb-3" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[600px]">
      {CLIENTE_STATUS_COLUMNS.map((coluna) => {
        const colClientes = clientesGrouped[coluna.status] || [];

        return (
          <div key={coluna.status} className="flex flex-col">
            <div className="font-medium mb-3 flex items-center justify-between sticky top-0 bg-background pb-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${coluna.color}`} />
                <span className="text-sm">{coluna.titulo}</span>
              </div>
              <Badge variant="secondary" className="h-6">
                {colClientes.length}
              </Badge>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] pr-2">
              {colClientes.map((cliente) => (
                <ClienteCard
                  key={cliente.id}
                  cliente={cliente}
                  onClick={() => onViewDetails(cliente)}
                />
              ))}
              {colClientes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                  Nenhum cliente
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}