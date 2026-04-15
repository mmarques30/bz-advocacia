import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { AlertTriangle, Eye, FileText, Calendar, MoreVertical, Link2, Trash2, FileX, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Processo, PROCESSO_STATUS_LABELS } from "@/types/processos";
import { useDocumentosDriveCount } from "@/hooks/useDocumentosDriveCount";
import { useDeleteProcesso } from "@/hooks/useProcessos";

function ProcessoRow({
  processo,
  onViewDetails,
  onAddAndamento,
  onDelete,
}: {
  processo: Processo;
  onViewDetails: (processoId: string) => void;
  onAddAndamento: (processoId: string) => void;
  onDelete: (processo: Processo) => void;
}) {
  const { data: docsCount } = useDocumentosDriveCount(processo.id);

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      em_andamento: "default",
      concluido: "secondary",
      arquivado: "outline",
      suspenso: "destructive",
    };
    return variants[status] || "default";
  };

  const isPrazoProximo = (prazo: string | null) => {
    if (!prazo) return false;
    const diasRestantes = Math.ceil(
      (new Date(prazo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return diasRestantes >= 0 && diasRestantes <= 7;
  };

  return (
    <TableRow>
      <TableCell className="font-mono text-sm">
        <div className="flex items-center gap-2">
          {processo.extrajudicial ? (
            <>
              <span>{processo.codigo_interno || "Sem código"}</span>
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">Extrajudicial</Badge>
            </>
          ) : (
            processo.numero_processo || "Sem número"
          )}
        </div>
      </TableCell>

      <TableCell>
        {processo.cliente ? (
          <Button
            variant="link"
            className="p-0 h-auto font-normal"
            onClick={() => {
              // TODO: Navegar para perfil do cliente
            }}
          >
            {processo.cliente.nome_completo}
          </Button>
        ) : (
          <span className="text-muted-foreground">Sem cliente</span>
        )}
      </TableCell>

      <TableCell>{processo.tipo}</TableCell>

      <TableCell>
        {processo.tribunal ? (
          <Badge variant="outline">{processo.tribunal}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      <TableCell>
        <Badge variant={getStatusBadgeVariant(processo.status)}>
          {PROCESSO_STATUS_LABELS[processo.status]}
        </Badge>
      </TableCell>

      <TableCell>
        {processo.data_ultima_atualizacao
          ? format(new Date(processo.data_ultima_atualizacao), "dd/MM/yyyy", {
              locale: ptBR,
            })
          : "-"}
      </TableCell>

      <TableCell>
        {processo.prazo_proximo ? (
          <div className="flex items-center gap-2">
            {isPrazoProximo(processo.prazo_proximo) && (
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            )}
            <span
              className={
                isPrazoProximo(processo.prazo_proximo) ? "text-orange-600 font-medium" : ""
              }
            >
              {format(new Date(processo.prazo_proximo), "dd/MM/yyyy")}
            </span>
          </div>
        ) : (
          "-"
        )}
      </TableCell>

      <TableCell>
        {processo.pasta_drive_url ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <a 
                href={processo.pasta_drive_url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Badge className="gap-1 bg-green-600 hover:bg-green-700 cursor-pointer">
                  <Link2 className="h-3 w-3" />
                  {docsCount || 0}
                </Badge>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              Abrir pasta do Google Drive ({docsCount || 0} doc(s))
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 text-muted-foreground cursor-default">
                <FileX className="h-3 w-3" />
                0
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Nenhuma pasta vinculada
            </TooltipContent>
          </Tooltip>
        )}
      </TableCell>

      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir ações do processo">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(processo.id)}>
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddAndamento(processo.id)}>
              <FileText className="h-4 w-4 mr-2" />
              Adicionar Andamento
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Calendar className="h-4 w-4 mr-2" />
              Ver Prazos
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(processo)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

interface ProcessosTableProps {
  processos: Processo[];
  isLoading: boolean;
  onViewDetails: (processoId: string) => void;
  onAddAndamento: (processoId: string) => void;
}

type SortDirection = 'asc' | 'desc' | null;

export function ProcessosTable({
  processos,
  isLoading,
  onViewDetails,
  onAddAndamento,
}: ProcessosTableProps) {
  const [processoToDelete, setProcessoToDelete] = useState<Processo | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const deleteProcesso = useDeleteProcesso();

  const sortedProcessos = useMemo(() => {
    if (!sortDirection) return processos;
    
    return [...processos].sort((a, b) => {
      const nameA = (a.cliente?.nome_completo || 'zzz').toLowerCase();
      const nameB = (b.cliente?.nome_completo || 'zzz').toLowerCase();
      
      if (sortDirection === 'asc') {
        return nameA.localeCompare(nameB, 'pt-BR');
      } else {
        return nameB.localeCompare(nameA, 'pt-BR');
      }
    });
  }, [processos, sortDirection]);

  const toggleSort = () => {
    if (sortDirection === null) setSortDirection('asc');
    else if (sortDirection === 'asc') setSortDirection('desc');
    else setSortDirection('asc');
  };

  const SortIcon = sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ArrowUpDown;

  const handleDelete = () => {
    if (processoToDelete) {
      deleteProcesso.mutate(processoToDelete.id);
      setProcessoToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (processos.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Nenhum processo encontrado</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Processo</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleSort}
                  className="h-8 px-2 -ml-2 hover:bg-muted"
                >
                  Cliente
                  <SortIcon className="ml-1 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tribunal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Última Atualização</TableHead>
              <TableHead>Próximo Prazo</TableHead>
              <TableHead>Docs</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProcessos.map((processo) => (
              <ProcessoRow
                key={processo.id}
                processo={processo}
                onViewDetails={onViewDetails}
                onAddAndamento={onAddAndamento}
                onDelete={setProcessoToDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!processoToDelete} onOpenChange={() => setProcessoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o processo{" "}
              <strong>{processoToDelete?.extrajudicial ? processoToDelete?.codigo_interno : (processoToDelete?.numero_processo || "sem número")}</strong>?
              <br />
              <span className="text-destructive">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
