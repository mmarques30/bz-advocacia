import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, User, FileText, AlertCircle, Scale, GitBranch } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useSubtarefas } from "@/hooks/useSubtarefas";
import { format, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Demanda, CATEGORIA_LABELS, PRIORIDADE_LABELS, ADVOGADA_LABELS } from "@/types/demandas";
import { cn } from "@/lib/utils";

interface DemandaCardProps {
  demanda: Demanda;
  onClick: () => void;
}

const prioridadeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  baixa: "outline",
  media: "secondary",
  alta: "default",
  urgente: "destructive",
};

const categoriaColors: Record<string, string> = {
  processos: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  vendas: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  pagamentos: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  administrativo: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  geral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export const DemandaCard = ({ demanda, onClick }: DemandaCardProps) => {
  const isAtrasada = demanda.data_limite && 
    isPast(parseISO(demanda.data_limite)) && 
    !['concluido', 'cancelado'].includes(demanda.status);

  const isParent = !demanda.parent_id;
  const { data: subtarefas } = useSubtarefas(isParent ? demanda.id : null);
  const subTotal = subtarefas?.length || 0;
  const subConcluidas = subtarefas?.filter(s => s.status === 'concluido').length || 0;

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        isAtrasada && "border-l-4 border-l-destructive"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={cn("text-xs px-2 py-1 rounded-full font-medium", categoriaColors[demanda.categoria || 'geral'])}>
            {CATEGORIA_LABELS[demanda.categoria as keyof typeof CATEGORIA_LABELS] || 'Geral'}
          </span>
          <Badge variant={prioridadeVariant[demanda.prioridade]}>
            {PRIORIDADE_LABELS[demanda.prioridade]}
          </Badge>
        </div>

        {/* Título */}
        <h4 className="font-medium text-sm line-clamp-2">{demanda.titulo}</h4>

        {/* Informações */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          {demanda.advogada_responsavel && (
            <div className="flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5" />
              <span className="truncate font-medium text-foreground">
                {ADVOGADA_LABELS[demanda.advogada_responsavel as keyof typeof ADVOGADA_LABELS]}
              </span>
            </div>
          )}

          {demanda.processo && (
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span className="truncate">
                {demanda.processo.numero_processo || demanda.processo.tipo}
              </span>
            </div>
          )}
          
          {demanda.responsavel && (
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span className="truncate">{demanda.responsavel.nome_completo}</span>
            </div>
          )}
          
          {demanda.data_limite && (
            <div className={cn(
              "flex items-center gap-1.5",
              isAtrasada && "text-destructive font-medium"
            )}>
              {isAtrasada && <AlertCircle className="h-3.5 w-3.5" />}
              <CalendarDays className="h-3.5 w-3.5" />
              <span>
                {format(parseISO(demanda.data_limite), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          )}
        </div>

        {/* Subtask progress */}
        {subTotal > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" /> Subtarefas</span>
              <span>{subConcluidas}/{subTotal}</span>
            </div>
            <Progress value={(subConcluidas / subTotal) * 100} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
