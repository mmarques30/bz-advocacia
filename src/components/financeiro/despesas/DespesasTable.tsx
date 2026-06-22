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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2, ChevronDown, ChevronUp, CalendarClock, Copy, Columns3 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Despesa, DespesasFilters } from "@/types/financeiro";
import { STATUS_DESPESA_LABELS, CONTA_LABELS } from "@/types/financeiro";
import { useDespesas, useDeleteDespesa } from "@/hooks/useDespesas";
import { useCategoriasDespesa } from "@/hooks/useCategoriasDespesa";
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
import { useEffect, useState } from "react";

// Colunas opcionais (Data / Descricao / Acoes ficam sempre visiveis pra
// a tabela continuar utilizavel). Preferencia persiste em localStorage.
const COLUNAS_OPCIONAIS = [
  { key: "categoria", label: "Categoria" },
  { key: "valor", label: "Valor" },
  { key: "conta", label: "Conta" },
  { key: "status", label: "Status" },
] as const;
type ColunaOpcionalKey = (typeof COLUNAS_OPCIONAIS)[number]["key"];
const STORAGE_KEY = "despesas-tabela-colunas-v1";

interface DespesasTableProps {
  filters: DespesasFilters;
  onSelectDespesa: (id: string) => void;
  /**
   * Abre o dialog "Nova Despesa" pre-preenchido com os dados desta
   * despesa. Fluxo "Duplicar": usuario revisa e confirma antes de
   * persistir um novo lancamento (tambem cobre o caso de "validar
   * antes de pagar" — o original continua intacto).
   */
  onDuplicateDespesa?: (despesa: Despesa) => void;
}

const INITIAL_ITEMS = 3;

export function DespesasTable({ filters, onSelectDespesa, onDuplicateDespesa }: DespesasTableProps) {
  const { data: despesas, isLoading } = useDespesas(filters);
  const deleteDespesa = useDeleteDespesa();
  const { getLabel: getCategoriaLabel } = useCategoriasDespesa();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [despesaToDelete, setDespesaToDelete] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [colunasVisiveis, setColunasVisiveis] = useState<Record<ColunaOpcionalKey, boolean>>(() => {
    if (typeof window === "undefined") return { categoria: true, valor: true, conta: true, status: true };
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) return { categoria: true, valor: true, conta: true, status: true, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return { categoria: true, valor: true, conta: true, status: true };
  });
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(colunasVisiveis)); } catch { /* ignore */ }
  }, [colunasVisiveis]);
  const toggleColuna = (key: ColunaOpcionalKey) =>
    setColunasVisiveis((prev) => ({ ...prev, [key]: !prev[key] }));

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
      <div className="flex justify-end mb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Columns3 className="h-3.5 w-3.5" />
              Colunas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Exibir colunas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COLUNAS_OPCIONAIS.map((c) => (
              <label
                key={c.key}
                className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
              >
                <Checkbox
                  checked={colunasVisiveis[c.key]}
                  onCheckedChange={() => toggleColuna(c.key)}
                />
                {c.label}
              </label>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              {colunasVisiveis.categoria && <TableHead>Categoria</TableHead>}
              {colunasVisiveis.valor && <TableHead className="text-right">Valor</TableHead>}
              {colunasVisiveis.conta && <TableHead>Conta</TableHead>}
              {colunasVisiveis.status && <TableHead>Status</TableHead>}
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
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium">{despesa.descricao}</p>
                      {despesa.processo && (
                        <p className="text-xs text-muted-foreground">
                          Processo: {despesa.processo.numero_processo || despesa.processo.tipo}
                        </p>
                      )}
                    </div>
                    {despesa.despesa_fixa_id && (
                      <Badge variant="outline" className="text-xs gap-1 shrink-0">
                        <CalendarClock className="h-3 w-3" />
                        Fixa
                      </Badge>
                    )}
                  </div>
                </TableCell>
                {colunasVisiveis.categoria && (
                  <TableCell>
                    <span className="text-sm">
                      {getCategoriaLabel(despesa.categoria)}
                    </span>
                  </TableCell>
                )}
                {colunasVisiveis.valor && (
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(despesa.valor)}
                  </TableCell>
                )}
                {colunasVisiveis.conta && (
                  <TableCell>
                    <Badge variant="outline">
                      {CONTA_LABELS[despesa.conta || 'escritorio'] || 'Escritório'}
                    </Badge>
                  </TableCell>
                )}
                {colunasVisiveis.status && (
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(despesa.status)}>
                      {STATUS_DESPESA_LABELS[despesa.status]}
                    </Badge>
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onSelectDespesa(despesa.id)}
                      title="Editar"
                      aria-label="Editar despesa"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {onDuplicateDespesa && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDuplicateDespesa(despesa)}
                        title="Duplicar despesa"
                        aria-label="Duplicar despesa"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDespesaToDelete(despesa.id);
                        setDeleteDialogOpen(true);
                      }}
                      title="Excluir"
                      aria-label="Excluir despesa"
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
