import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { AlertTriangle, Eye, FileText, Calendar, MoreVertical, Link2, Trash2 } from "lucide-react";
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
        {processo.numero_processo || "Sem número"}
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
        {docsCount !== undefined && docsCount > 0 ? (
          <Badge variant="secondary" className="gap-1">
            <Link2 className="h-3 w-3" />
            {docsCount}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>

      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
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

export function ProcessosTable({
  processos,
  isLoading,
  onViewDetails,
  onAddAndamento,
}: ProcessosTableProps) {
  const [processoToDelete, setProcessoToDelete] = useState<Processo | null>(null);
  const deleteProcesso = useDeleteProcesso();

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
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tribunal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Última Atualização</TableHead>
              <TableHead>Próximo Prazo</TableHead>
              <TableHead>Docs Drive</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processos.map((processo) => (
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
              <strong>{processoToDelete?.numero_processo || "sem número"}</strong>?
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
