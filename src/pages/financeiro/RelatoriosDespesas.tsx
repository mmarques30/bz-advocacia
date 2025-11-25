import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, FileSpreadsheet, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useDespesas, useDespesasPorCategoria } from "@/hooks/useDespesas";
import { CATEGORIA_DESPESA_LABELS } from "@/types/financeiro";
import { exportToExcel, exportToCSV } from "@/lib/exportUtils";

type TipoRelatorioDespesas = 
  | 'despesas_periodo'
  | 'despesas_categoria'
  | 'comparativo_receitas_despesas';

const TIPOS_RELATORIO_LABELS: Record<TipoRelatorioDespesas, string> = {
  despesas_periodo: 'Despesas por Período',
  despesas_categoria: 'Despesas por Categoria',
  comparativo_receitas_despesas: 'Comparativo Receitas vs Despesas',
};

export default function RelatoriosDespesas() {
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorioDespesas>('despesas_periodo');
  const [dataInicio, setDataInicio] = useState<Date | undefined>(new Date());
  const [dataFim, setDataFim] = useState<Date | undefined>(new Date());

  const { data: despesas } = useDespesas({
    data_inicio: dataInicio,
    data_fim: dataFim,
  });

  const { data: despesasPorCategoria } = useDespesasPorCategoria();

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
      <div>
        <h1 className="text-3xl font-bold">Relatórios de Despesas</h1>
        <p className="text-muted-foreground">
          Gere relatórios detalhados das despesas do escritório
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração do Relatório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select value={tipoRelatorio} onValueChange={(value) => setTipoRelatorio(value as TipoRelatorioDespesas)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_RELATORIO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExportExcel} variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
            <Button onClick={handleExportCSV} variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
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

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {despesasPorCategoria?.map((item) => (
                <div key={item.categoria} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {CATEGORIA_DESPESA_LABELS[item.categoria]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantidade} despesa(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(item.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.percentual.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
