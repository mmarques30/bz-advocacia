import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, ChevronDown, Pencil, XCircle, RefreshCw, CalendarClock } from "lucide-react";
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

export function DespesasFixasManager() {
  const { data: fixas, isLoading } = useDespesasFixas();
  const { getLabel: getCategoriaLabel } = useCategoriasDespesa();
  const desativar = useDesativarDespesaFixa();
  const gerarMes = useGerarDespesasFixasMes();

  const [newOpen, setNewOpen] = useState(false);
  const [editItem, setEditItem] = useState<DespesaFixa | null>(null);
  const [desativarId, setDesativarId] = useState<string | null>(null);

  // Auto-gerar despesas fixas do mês ao carregar
  useEffect(() => {
    if (fixas && fixas.length > 0) {
      gerarMes.mutate();
    }
  }, [fixas?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <>
      <Collapsible defaultOpen>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5" />
                  <CardTitle className="text-base">Despesas Fixas</CardTitle>
                  <Badge variant="secondary">{fixas?.length || 0}</Badge>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setNewOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Nova Despesa Fixa
                </Button>
                <Button size="sm" variant="outline" onClick={() => gerarMes.mutate()} disabled={gerarMes.isPending}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${gerarMes.isPending ? 'animate-spin' : ''}`} />
                  Gerar Mês Atual
                </Button>
              </div>

              {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

              {fixas && fixas.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma despesa fixa cadastrada.</p>
              )}

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {fixas?.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{f.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORIA_DESPESA_LABELS[f.categoria as keyof typeof CATEGORIA_DESPESA_LABELS] || f.categoria} · {CONTA_LABELS[f.conta || 'escritorio']} · Dia {f.dia_vencimento}
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
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
