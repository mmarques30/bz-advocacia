import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, XCircle, RefreshCw } from "lucide-react";
import { useDespesasFixas, useDesativarDespesaFixa, useGerarDespesasFixasMes } from "@/hooks/useDespesasFixas";
import { CONTA_LABELS } from "@/types/financeiro";
import { useCategoriasDespesa } from "@/hooks/useCategoriasDespesa";
import type { DespesaFixa } from "@/types/financeiro";
import { NewDespesaFixaDialog } from "./NewDespesaFixaDialog";
import { EditDespesaFixaDialog } from "./EditDespesaFixaDialog";
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

interface DespesasFixasDialogProps {
  open: boolean;
  onClose: () => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function DespesasFixasDialog({ open, onClose }: DespesasFixasDialogProps) {
  const { data: fixas, isLoading } = useDespesasFixas();
  const { getLabel: getCategoriaLabel } = useCategoriasDespesa();
  const desativar = useDesativarDespesaFixa();
  const gerarMes = useGerarDespesasFixasMes();

  const [newOpen, setNewOpen] = useState(false);
  const [editItem, setEditItem] = useState<DespesaFixa | null>(null);
  const [desativarId, setDesativarId] = useState<string | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Despesas Fixas (recorrentes)</DialogTitle>
            <DialogDescription>
              Modelos que geram um lançamento todo mês. As ocorrências geradas aparecem na
              tabela de despesas com o selo "Fixa".
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Button size="sm" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nova Despesa Fixa
            </Button>
            <Button size="sm" variant="outline" onClick={() => gerarMes.mutate()} disabled={gerarMes.isPending}>
              <RefreshCw className={`h-4 w-4 mr-1 ${gerarMes.isPending ? "animate-spin" : ""}`} />
              Gerar Mês Atual
            </Button>
          </div>

          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

          {fixas && fixas.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma despesa fixa cadastrada.</p>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {fixas?.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{f.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {getCategoriaLabel(f.categoria)} · {CONTA_LABELS[f.conta || "escritorio"]} · Dia {f.dia_vencimento}
                  </p>
                  <p className="text-sm font-semibold mt-1">{formatCurrency(f.valor)}</p>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Editar despesa fixa" onClick={() => setEditItem(f)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label="Desativar despesa fixa" onClick={() => setDesativarId(f.id)}>
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <NewDespesaFixaDialog open={newOpen} onClose={() => setNewOpen(false)} />
      <EditDespesaFixaDialog despesaFixa={editItem} open={!!editItem} onClose={() => setEditItem(null)} />

      <AlertDialog open={!!desativarId} onOpenChange={() => setDesativarId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar despesa fixa?</AlertDialogTitle>
            <AlertDialogDescription>
              A despesa não será mais gerada nos próximos meses. Ocorrências já geradas não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (desativarId) desativar.mutate(desativarId); setDesativarId(null); }}>
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
