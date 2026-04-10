import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scale, Plus, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NewProcessoDialog } from "@/components/processos/NewProcessoDialog";

interface ClienteProcessosTabProps {
  clienteId: string;
  clienteNome: string;
  onSelectProcesso?: (id: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ativo: { label: "Em Andamento", className: "bg-green-100 text-green-800 border-green-200" },
  em_andamento: { label: "Em Andamento", className: "bg-green-100 text-green-800 border-green-200" },
  concluido: { label: "Concluído", className: "bg-blue-100 text-blue-800 border-blue-200" },
  arquivado: { label: "Arquivado", className: "bg-muted text-muted-foreground border-border" },
  suspenso: { label: "Suspenso", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
};

export function ClienteProcessosTab({ clienteId, clienteNome, onSelectProcesso }: ClienteProcessosTabProps) {
  const [newProcessoOpen, setNewProcessoOpen] = useState(false);

  const { data: processos, isLoading } = useQuery({
    queryKey: ["processos-cliente", clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processos")
        .select("*")
        .eq("lead_id", clienteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clienteId,
  });

  const getStatusConfig = (status: string | null) => {
    return STATUS_CONFIG[status || "ativo"] || STATUS_CONFIG.ativo;
  };

  const handleSelectProcesso = (id: string) => {
    if (onSelectProcesso) {
      onSelectProcesso(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!processos || processos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Scale className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nenhum processo vinculado a {clienteNome}</p>
        <Button className="mt-4" size="sm" onClick={() => setNewProcessoOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Novo Processo
        </Button>
        <NewProcessoDialog
          open={newProcessoOpen}
          onClose={() => setNewProcessoOpen(false)}
          clienteId={clienteId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {processos.length} processo(s) vinculado(s)
        </h3>
        <Button size="sm" onClick={() => setNewProcessoOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Novo Processo
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Processo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processos.map((processo) => {
              const statusConfig = getStatusConfig(processo.status);
              return (
                <TableRow
                  key={processo.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSelectProcesso(processo.id)}
                >
                  <TableCell className="font-medium">
                    {processo.numero_processo || "Sem número"}
                  </TableCell>
                  <TableCell>{processo.tipo}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusConfig.className}>
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(processo.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Ver Detalhes"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectProcesso(processo.id);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <NewProcessoDialog
        open={newProcessoOpen}
        onClose={() => setNewProcessoOpen(false)}
        clienteId={clienteId}
      />
    </div>
  );
}
