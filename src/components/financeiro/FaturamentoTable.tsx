import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronDown, ChevronUp, MoreHorizontal, Pencil, Trash2, Copy } from "lucide-react";
import { useFaturamentoDetalhado } from "@/hooks/useFinanceiro";
import { useDeleteTransacao } from "@/hooks/useTransacoesFinanceiras";
import { EditTransacaoDialog } from "./transacoes/EditTransacaoDialog";
import { NewTransacaoDialog } from "./transacoes/NewTransacaoDialog";
import type { FaturamentoFiltersState } from "./FaturamentoFilters";
import type { TransacaoFinanceira } from "@/types/transacoes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CONTA_LABELS } from "@/types/financeiro";
import { toast } from "@/lib/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

interface FaturamentoTableProps {
  filters?: FaturamentoFiltersState;
}

const INITIAL_ITEMS = 3;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function FaturamentoTable({ filters }: FaturamentoTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<TransacaoFinanceira | null>(null);
  const [duplicatingTransacao, setDuplicatingTransacao] = useState<TransacaoFinanceira | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transacaoToDelete, setTransacaoToDelete] = useState<string | null>(null);
  
  const { data: faturamentos, isLoading } = useFaturamentoDetalhado(filters);
  const deleteTransacao = useDeleteTransacao();

  const filteredData = faturamentos?.filter(item => 
    item.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subcategoria?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const displayedData = isExpanded 
    ? filteredData 
    : filteredData.slice(0, INITIAL_ITEMS);

  const temMaisItens = filteredData.length > INITIAL_ITEMS;

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setIsExpanded(false);
  };

  const toTransacao = (item: any): TransacaoFinanceira => ({
    id: item.id,
    mes: item.mes,
    ano: item.ano,
    mes_nome: item.mes_nome,
    tipo_codigo: item.tipo_codigo,
    categoria_codigo: item.categoria_codigo || item.categoria,
    subcategoria_codigo: item.subcategoria_codigo || item.subcategoria,
    descricao: item.descricao,
    data_transacao: item.data_transacao || item.data,
    valor: item.valor,
    created_at: item.created_at || "",
    conta: item.conta,
  });

  const handleEdit = (item: any) => {
    setEditingTransacao(toTransacao(item));
  };

  const handleDuplicate = (item: any) => {
    setDuplicatingTransacao(toTransacao(item));
  };

  const handleDelete = async () => {
    if (!transacaoToDelete) return;
    try {
      await deleteTransacao.mutateAsync(transacaoToDelete);
      toast.success("Registro excluído com sucesso");
    } catch {
      toast.error("Erro ao excluir registro");
    } finally {
      setDeleteDialogOpen(false);
      setTransacaoToDelete(null);
    }
  };

  const total = filteredData.reduce((sum, item) => sum + item.valor, 0);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {filteredData.length} registro(s) encontrado(s)
        </p>
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium">
            Total:{" "}
            <span className="text-emerald-600">
              {formatCurrency(total)}
            </span>
          </p>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Subcategoria</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              displayedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.data ? format(new Date(item.data), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                  </TableCell>
                  <TableCell>{item.descricao || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.categoria || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {item.subcategoria || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {CONTA_LABELS[item.conta || 'escritorio'] || 'Escritório'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">
                    +{formatCurrency(item.valor)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Abrir ações do faturamento">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(item)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setTransacaoToDelete(item.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {temMaisItens && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Recolher
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Ver todos os {filteredData.length} registros
              </>
            )}
          </Button>
        </div>
      )}

      <EditTransacaoDialog
        open={!!editingTransacao}
        onClose={() => setEditingTransacao(null)}
        transacao={editingTransacao}
      />

      <NewTransacaoDialog
        open={!!duplicatingTransacao}
        onClose={() => setDuplicatingTransacao(null)}
        initialData={duplicatingTransacao}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
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
    </div>
  );
}
