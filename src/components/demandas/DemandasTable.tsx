import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Edit, Trash2, AlertCircle, GitBranch } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Demanda, CATEGORIA_LABELS, TIPO_LABELS, STATUS_LABELS, PRIORIDADE_LABELS } from "@/types/demandas";
import { useAdvogadaLabels } from "@/hooks/useAdvogadaLabels";
import { cn } from "@/lib/utils";
import { DataTable, DataTableColumn } from "@/components/shared/DataTable";

function safeFormatDate(dateStr: string | null, fmt = "dd/MM/yyyy"): string {
  if (!dateStr) return '-';
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, fmt, { locale: ptBR }) : '-';
  } catch { return '-'; }
}

function safeIsPast(dateStr: string | null): boolean {
  if (!dateStr) return false;
  try {
    const d = parseISO(dateStr);
    return isValid(d) && isPast(d);
  } catch { return false; }
}

interface DemandasTableProps {
  demandas: Demanda[];
  onView: (demanda: Demanda) => void;
  onEdit: (demanda: Demanda) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

const tipoVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  melhoria: 'default',
  bug: 'destructive',
  sugestao: 'secondary',
  tarefa: 'outline',
};

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pendente: 'secondary',
  em_andamento: 'default',
  concluido: 'outline',
  cancelado: 'destructive',
};

const prioridadeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  baixa: 'outline',
  media: 'secondary',
  alta: 'default',
  urgente: 'destructive',
};

const categoriaColors: Record<string, string> = {
  processos: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  vendas: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  pagamentos: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  administrativo: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  geral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const prioridadeOrder: Record<string, number> = {
  urgente: 4, alta: 3, media: 2, baixa: 1,
};
const statusOrder: Record<string, number> = {
  em_andamento: 3, pendente: 2, concluido: 1, cancelado: 0,
};

export const DemandasTable = ({ demandas, onView, onEdit, onDelete, isAdmin }: DemandasTableProps) => {
  const advogadaLabels = useAdvogadaLabels();

  // Fetch subtask counts for all parent tasks
  const parentIds = demandas.map(d => d.id);
  const { data: subtaskCounts } = useQuery({
    queryKey: ['subtask-counts', parentIds],
    queryFn: async () => {
      if (parentIds.length === 0) return {};
      const { data, error } = await supabase
        .from('demandas_internas')
        .select('parent_id, status')
        .in('parent_id', parentIds);
      if (error) throw error;
      const counts: Record<string, { total: number; concluidas: number }> = {};
      data?.forEach((s: { parent_id: string | null; status: string }) => {
        if (!s.parent_id) return;
        if (!counts[s.parent_id]) counts[s.parent_id] = { total: 0, concluidas: 0 };
        counts[s.parent_id].total++;
        if (s.status === 'concluido') counts[s.parent_id].concluidas++;
      });
      return counts;
    },
    enabled: parentIds.length > 0,
  });

  const isAtrasada = (d: Demanda) =>
    safeIsPast(d.data_limite) && !['concluido', 'cancelado'].includes(d.status);

  const columns = useMemo<DataTableColumn<Demanda>[]>(
    () => [
      {
        id: "titulo",
        header: "Título",
        sortable: true,
        searchable: true,
        sortValue: (d) => d.titulo,
        className: "font-medium",
        cell: (d) => (
          <div className="flex items-center gap-2">
            {isAtrasada(d) && <AlertCircle className="h-4 w-4 text-destructive" />}
            <span className="font-medium">{d.titulo}</span>
            {subtaskCounts?.[d.id] && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-normal">
                <GitBranch className="h-3.5 w-3.5" />
                {subtaskCounts[d.id].concluidas}/{subtaskCounts[d.id].total}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "categoria",
        header: "Categoria",
        sortable: true,
        searchable: true,
        sortValue: (d) => CATEGORIA_LABELS[d.categoria as keyof typeof CATEGORIA_LABELS] || 'Geral',
        cell: (d) => (
          <span className={cn("text-xs px-2 py-1 rounded-full font-medium", categoriaColors[d.categoria || 'geral'])}>
            {CATEGORIA_LABELS[d.categoria as keyof typeof CATEGORIA_LABELS] || 'Geral'}
          </span>
        ),
      },
      {
        id: "tipo",
        header: "Tipo",
        sortable: true,
        sortValue: (d) => TIPO_LABELS[d.tipo],
        cell: (d) => <Badge variant={tipoVariant[d.tipo]}>{TIPO_LABELS[d.tipo]}</Badge>,
      },
      {
        id: "status",
        header: "Status",
        sortable: true,
        sortValue: (d) => statusOrder[d.status] ?? 0,
        cell: (d) => <Badge variant={statusVariant[d.status]}>{STATUS_LABELS[d.status]}</Badge>,
      },
      {
        id: "prioridade",
        header: "Prioridade",
        sortable: true,
        sortValue: (d) => prioridadeOrder[d.prioridade] ?? 0,
        cell: (d) => (
          <Badge variant={prioridadeVariant[d.prioridade]}>
            {PRIORIDADE_LABELS[d.prioridade]}
          </Badge>
        ),
      },
      {
        id: "data_limite",
        header: "Prazo",
        sortable: true,
        sortValue: (d) => (d.data_limite ? new Date(d.data_limite).getTime() : 0),
        cell: (d) => (
          <span className={cn(isAtrasada(d) && "text-destructive font-medium")}>
            {safeFormatDate(d.data_limite)}
          </span>
        ),
      },
      {
        id: "concluida_em",
        header: "Concluída em",
        sortable: true,
        sortValue: (d) => (d.concluida_em ? new Date(d.concluida_em).getTime() : 0),
        cell: (d) => safeFormatDate(d.concluida_em),
      },
      {
        id: "advogada_responsavel",
        header: "Advogada",
        sortable: true,
        searchable: true,
        sortValue: (d) => advogadaLabels[d.advogada_responsavel] || '',
        cell: (d) => advogadaLabels[d.advogada_responsavel] || '-',
      },
      {
        id: "responsavel",
        header: "Responsável",
        sortable: true,
        searchable: true,
        sortValue: (d) => d.responsavel?.nome_completo || '',
        cell: (d) => d.responsavel?.nome_completo || '-',
      },
      {
        id: "actions",
        header: "",
        className: "w-[50px]",
        cell: (d) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(d)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(d)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(d.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [advogadaLabels, subtaskCounts, onView, onEdit, onDelete, isAdmin],
  );

  return (
    <DataTable
      data={demandas}
      columns={columns}
      rowKey={(d) => d.id}
      searchPlaceholder="Buscar por título, categoria ou responsável..."
      emptyMessage="Nenhuma demanda encontrada"
      pageSize={25}
      // Realça linhas atrasadas com o mesmo tom da versao anterior.
      rowClassName={(d) => (isAtrasada(d) ? "bg-destructive/5" : undefined)}
    />
  );
};
