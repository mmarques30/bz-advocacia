import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReceitasRecentes, useTopSubcategorias, useReceitasMesAtual } from "@/hooks/useFinanceiro";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { FaturamentoFiltersState } from "./FaturamentoFilters";
import { TrendingUp, BarChart3, Calendar, ChevronRight } from "lucide-react";
import { FaturamentoDetalhesDialog } from "./FaturamentoDetalhesDialog";

type TipoDetalhe = 'receitas_recentes' | 'top_categorias' | 'receitas_mes';

interface FaturamentoWidgetsProps {
  onRegistrarPagamento?: (parcelaId: string) => void;
  filters?: FaturamentoFiltersState;
}

export function FaturamentoWidgets({ onRegistrarPagamento, filters }: FaturamentoWidgetsProps) {
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [tipoDetalhe, setTipoDetalhe] = useState<TipoDetalhe>('receitas_recentes');

  const { data: receitasRecentes } = useReceitasRecentes(5);
  const { data: topSubcategorias } = useTopSubcategorias(5);
  const { data: receitasMes } = useReceitasMesAtual();

  const handleVerMais = (tipo: TipoDetalhe) => {
    setTipoDetalhe(tipo);
    setDetalhesOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatSubcategoria = (subcategoria: string) => {
    return subcategoria.charAt(0).toUpperCase() + subcategoria.slice(1).toLowerCase();
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Receitas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {receitasRecentes?.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma receita registrada</p>
              ) : (
                receitasRecentes?.slice(0, 3).map((receita) => (
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
              )}
              {receitasRecentes && receitasRecentes.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-muted-foreground hover:text-primary"
                  onClick={() => handleVerMais('receitas_recentes')}
                >
                  Ver mais <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Top Categorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSubcategorias?.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma categoria encontrada</p>
              ) : (
                topSubcategorias?.slice(0, 3).map((cat, index) => (
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
              )}
              {topSubcategorias && topSubcategorias.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-muted-foreground hover:text-primary"
                  onClick={() => handleVerMais('top_categorias')}
                >
                  Ver mais <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Receitas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!receitasMes || receitasMes.quantidadeTotal === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma receita no mês atual</p>
              ) : (
                <>
                  <div className="p-3 bg-muted/50 rounded-lg mb-3">
                    <p className="text-xs text-muted-foreground">Total do Mês</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(receitasMes.totalGeral)}</p>
                    <p className="text-xs text-muted-foreground">{receitasMes.quantidadeTotal} transação(ões)</p>
                  </div>
                  {receitasMes.porResponsavel.slice(0, 3).map((resp) => (
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
                  {receitasMes.porResponsavel.length > 3 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-muted-foreground hover:text-primary"
                      onClick={() => handleVerMais('receitas_mes')}
                    >
                      Ver mais <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <FaturamentoDetalhesDialog 
        open={detalhesOpen} 
        onOpenChange={setDetalhesOpen} 
        tipo={tipoDetalhe} 
      />
    </>
  );
}
