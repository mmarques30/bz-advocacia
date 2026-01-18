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
import { Eye, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Despesa, DespesasFilters } from "@/types/financeiro";
import { CATEGORIA_DESPESA_LABELS, STATUS_DESPESA_LABELS } from "@/types/financeiro";
import { useDespesas, useDeleteDespesa } from "@/hooks/useDespesas";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useState } from "react";

interface DespesasTableProps {
  filters: DespesasFilters;
  onSelectDespesa: (id: string) => void;
}

const INITIAL_ITEMS = 3;

export function DespesasTable({ filters, onSelectDespesa }: DespesasTableProps) {
  const { data: despesas, isLoading } = useDespesas(filters);
  const deleteDespesa = useDeleteDespesa();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [despesaToDelete, setDespesaToDelete] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const despesasExibidas = isExpanded 
    ? despesas 
    : despesas?.slice(0, INITIAL_ITEMS);
  
  const temMaisItens = (despesas?.length || 0) > INITIAL_ITEMS;
  const itensRestantes = (despesas?.length || 0) - INITIAL_ITEMS;

  const handleDelete = () => {
    if (despesaToDelete) {
      deleteDespesa.mutate(despesaToDelete);
      setDeleteDialogOpen(false);
      setDespesaToDelete(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pago':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'atrasado':
        return 'destructive';
      default:
        return 'outline';
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

  if (!despesas || despesas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Nenhuma despesa encontrada.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {despesasExibidas?.map((despesa) => (
              <TableRow key={despesa.id}>
                <TableCell className="font-medium">
                  {format(new Date(despesa.data), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{despesa.descricao}</p>
                    {despesa.processo && (
                      <p className="text-xs text-muted-foreground">
                        Processo: {despesa.processo.numero_processo || despesa.processo.tipo}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {CATEGORIA_DESPESA_LABELS[despesa.categoria]}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(despesa.valor)}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(despesa.status)}>
                    {STATUS_DESPESA_LABELS[despesa.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSelectDespesa(despesa.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDespesaToDelete(despesa.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {temMaisItens && (
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-4"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Ocultar
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Ver mais ({itensRestantes} restantes)
            </>
          )}
        </Button>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
