import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDespesas } from "@/hooks/useDespesas";
import { CATEGORIA_DESPESA_LABELS } from "@/types/financeiro";
import { exportToExcel, exportToCSV } from "@/lib/exportUtils";

interface RelatorioDespesasPeriodoProps {
  dataInicio: Date;
  dataFim: Date;
}

export function RelatorioDespesasPeriodo({ dataInicio, dataFim }: RelatorioDespesasPeriodoProps) {
  const { data: despesas } = useDespesas({
    data_inicio: dataInicio,
    data_fim: dataFim,
  });

  const handleExportExcel = () => {
    if (!despesas) return;

    const dados = despesas.map(d => ({
      Data: format(new Date(d.data), 'dd/MM/yyyy'),
      Descrição: d.descricao,
      Categoria: CATEGORIA_DESPESA_LABELS[d.categoria],
      Valor: d.valor,
      Status: d.status,
      'Forma Pagamento': d.forma_pagamento || '-',
      Observações: d.observacoes || '-',
    }));

    exportToExcel(dados, `relatorio-despesas-${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const handleExportCSV = () => {
    if (!despesas) return;

    const dados = despesas.map(d => ({
      Data: format(new Date(d.data), 'dd/MM/yyyy'),
      Descrição: d.descricao,
      Categoria: CATEGORIA_DESPESA_LABELS[d.categoria],
      Valor: d.valor,
      Status: d.status,
      'Forma Pagamento': d.forma_pagamento || '-',
      Observações: d.observacoes || '-',
    }));

    exportToCSV(dados, `relatorio-despesas-${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const totalDespesas = despesas?.reduce((sum, d) => sum + d.valor, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button onClick={handleExportExcel} variant="outline" size="sm">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
        <Button onClick={handleExportCSV} variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo do Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de Despesas:</span>
              <span className="font-bold">{despesas?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor Total:</span>
              <span className="font-bold text-destructive">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(totalDespesas)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Média por Despesa:</span>
              <span className="font-bold">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(despesas?.length ? totalDespesas / despesas.length : 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento das Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {despesas?.map((despesa) => (
              <div key={despesa.id} className="flex items-center justify-between border-b pb-2">
                <div className="flex-1">
                  <p className="font-medium">{despesa.descricao}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(despesa.data), 'dd/MM/yyyy', { locale: ptBR })} • {CATEGORIA_DESPESA_LABELS[despesa.categoria]}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(despesa.valor)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {despesa.status}
                  </p>
                </div>
              </div>
            ))}
            {!despesas || despesas.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma despesa encontrada no período selecionado
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
