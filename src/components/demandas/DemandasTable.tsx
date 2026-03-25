import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Edit, Trash2, AlertCircle, GitBranch } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Demanda, CATEGORIA_LABELS, TIPO_LABELS, STATUS_LABELS, PRIORIDADE_LABELS } from "@/types/demandas";
import { useAdvogadaLabels } from "@/hooks/useAdvogadaLabels";
import { cn } from "@/lib/utils";

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
      data?.forEach((s: any) => {
        if (!s.parent_id) return;
        if (!counts[s.parent_id]) counts[s.parent_id] = { total: 0, concluidas: 0 };
        counts[s.parent_id].total++;
        if (s.status === 'concluido') counts[s.parent_id].concluidas++;
      });
      return counts;
    },
    enabled: parentIds.length > 0,
  });

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead>Concluída em</TableHead>
            <TableHead>Advogada</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {demandas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                Nenhuma demanda encontrada
              </TableCell>
            </TableRow>
          ) : (
            demandas.map((demanda) => {
              const isAtrasada = demanda.data_limite && 
                isPast(parseISO(demanda.data_limite)) && 
                !['concluido', 'cancelado'].includes(demanda.status);
              
              return (
                <TableRow key={demanda.id} className={cn(isAtrasada && "bg-destructive/5")}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {isAtrasada && <AlertCircle className="h-4 w-4 text-destructive" />}
                      {demanda.titulo}
                      {subtaskCounts?.[demanda.id] && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground font-normal">
                          <GitBranch className="h-3.5 w-3.5" />
                          {subtaskCounts[demanda.id].concluidas}/{subtaskCounts[demanda.id].total}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("text-xs px-2 py-1 rounded-full font-medium", categoriaColors[demanda.categoria || 'geral'])}>
                      {CATEGORIA_LABELS[demanda.categoria as keyof typeof CATEGORIA_LABELS] || 'Geral'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tipoVariant[demanda.tipo]}>
                      {TIPO_LABELS[demanda.tipo]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[demanda.status]}>
                      {STATUS_LABELS[demanda.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={prioridadeVariant[demanda.prioridade]}>
                      {PRIORIDADE_LABELS[demanda.prioridade]}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn(isAtrasada && "text-destructive font-medium")}>
                    {demanda.data_limite 
                      ? format(parseISO(demanda.data_limite), "dd/MM/yyyy", { locale: ptBR })
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {demanda.concluida_em
                      ? format(parseISO(demanda.concluida_em), "dd/MM/yyyy", { locale: ptBR })
                      : '—'
                    }
                  </TableCell>
                  <TableCell>
                    {advogadaLabels[demanda.advogada_responsavel] || '-'}
                  </TableCell>
                  <TableCell>
                    {demanda.responsavel?.nome_completo || '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(demanda)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <DropdownMenuItem onClick={() => onEdit(demanda)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDelete(demanda.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};