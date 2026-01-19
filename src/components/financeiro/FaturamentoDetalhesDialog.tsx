import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useReceitasRecentes, useTopSubcategorias, useReceitasMesAtual } from "@/hooks/useFinanceiro";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, BarChart3, TrendingUp } from "lucide-react";

type TipoDetalhe = 'receitas_recentes' | 'top_categorias' | 'receitas_mes';

interface FaturamentoDetalhesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: TipoDetalhe;
}

const TITULOS: Record<TipoDetalhe, { titulo: string; icon: React.ReactNode }> = {
  receitas_recentes: { titulo: "Receitas Recentes", icon: <Calendar className="h-5 w-5" /> },
  top_categorias: { titulo: "Top Categorias", icon: <BarChart3 className="h-5 w-5" /> },
  receitas_mes: { titulo: "Receitas do Mês", icon: <TrendingUp className="h-5 w-5" /> },
};

export function FaturamentoDetalhesDialog({ open, onOpenChange, tipo }: FaturamentoDetalhesDialogProps) {
  const { data: receitasRecentes } = useReceitasRecentes(20);
  const { data: topSubcategorias } = useTopSubcategorias(20);
  const { data: receitasMes } = useReceitasMesAtual();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatSubcategoria = (subcategoria: string) => {
    return subcategoria.charAt(0).toUpperCase() + subcategoria.slice(1).toLowerCase();
  };

  const { titulo, icon } = TITULOS[tipo];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {titulo}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 pr-4">
            {tipo === 'receitas_recentes' && (
              receitasRecentes?.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma receita registrada</p>
              ) : (
                receitasRecentes?.map((receita) => (
                  <div key={receita.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{formatSubcategoria(receita.descricao)}</p>
                      <p className="text-xs text-muted-foreground">
                        {receita.data ? format(new Date(receita.data), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 ml-2">
                      {formatCurrency(receita.valor)}
                    </Badge>
                  </div>
                ))
              )
            )}

            {tipo === 'top_categorias' && (
              topSubcategorias?.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma categoria encontrada</p>
              ) : (
                topSubcategorias?.map((cat, index) => (
                  <div key={cat.subcategoria} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{formatSubcategoria(cat.subcategoria)}</p>
                        <p className="text-xs text-muted-foreground">
                          {cat.quantidade} transação(ões)
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {formatCurrency(cat.total)}
                    </Badge>
                  </div>
                ))
              )
            )}

            {tipo === 'receitas_mes' && (
              !receitasMes || receitasMes.quantidadeTotal === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma receita no mês atual</p>
              ) : (
                <>
                  <div className="p-3 bg-muted/50 rounded-lg mb-3">
                    <p className="text-xs text-muted-foreground">Total do Mês</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(receitasMes.totalGeral)}</p>
                    <p className="text-xs text-muted-foreground">{receitasMes.quantidadeTotal} transação(ões)</p>
                  </div>
                  {receitasMes.porResponsavel.map((resp) => (
                    <div key={resp.responsavel} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{formatSubcategoria(resp.responsavel)}</p>
                        <p className="text-xs text-muted-foreground">
                          {resp.quantidade} receita(s)
                        </p>
                      </div>
                      <Badge variant="outline">
                        {formatCurrency(resp.total)}
                      </Badge>
                    </div>
                  ))}
                </>
              )
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
