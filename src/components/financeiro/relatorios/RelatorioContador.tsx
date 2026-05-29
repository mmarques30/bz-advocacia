import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FileSpreadsheet, DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { CONTA_LABELS } from "@/types/financeiro";
import { useCategoriasDespesa } from "@/hooks/useCategoriasDespesa";
import { exportToExcelMultiSheet } from "@/lib/exportUtils";

interface RelatorioContadorProps {
  dataInicio: Date;
  dataFim: Date;
  conta: string;
}

interface ReceitaItem {
  data: string;
  descricao: string;
  cliente: string;
  categoria: string;
  conta: string;
  valor: number;
}

interface DespesaItem {
  data: string;
  descricao: string;
  categoria: string;
  conta: string;
  valor: number;
}

interface SaldoConta {
  conta: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function RelatorioContador({ dataInicio, dataFim, conta }: RelatorioContadorProps) {
  const [receitas, setReceitas] = useState<ReceitaItem[]>([]);
  const [despesas, setDespesas] = useState<DespesaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { getLabel: getCategoriaLabel } = useCategoriasDespesa();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicio, dataFim, conta, getCategoriaLabel]);

  async function fetchData() {
    setLoading(true);
    const inicio = format(dataInicio, "yyyy-MM-dd");
    const fim = format(dataFim, "yyyy-MM-dd");

    // 1. Parcelas pagas no período (receitas de acordos)
    let parcelasQuery = supabase
      .from("parcelas_financeiras")
      .select("*, acordos_financeiros(tipo_servico, conta, cliente_id, contact_submissions(nome_completo))")
      .eq("status", "pago")
      .gte("data_pagamento", inicio)
      .lte("data_pagamento", fim);

    const { data: parcelas } = await parcelasQuery;

    const receitasParcelas: ReceitaItem[] = (parcelas || [])
      .filter((p: any) => !conta || conta === "todos" || p.acordos_financeiros?.conta === conta)
      .map((p: any) => ({
        data: p.data_pagamento,
        descricao: `Parcela ${p.numero_parcela} - ${p.acordos_financeiros?.tipo_servico || "Acordo"}`,
        cliente: p.acordos_financeiros?.contact_submissions?.nome_completo || "—",
        categoria: p.acordos_financeiros?.tipo_servico || "Honorários",
        conta: p.acordos_financeiros?.conta || "escritorio",
        valor: Number(p.valor_pago || p.valor),
      }));

    // 2. Transações importadas do período (tipo receita)
    let transQuery = supabase
      .from("transacoes_financeiras")
      .select("*")
      .gte("data_transacao", inicio)
      .lte("data_transacao", fim);

    if (conta && conta !== "todos") {
      transQuery = transQuery.eq("conta", conta);
    }

    const { data: transacoes } = await transQuery;

    const receitasTransacoes: ReceitaItem[] = (transacoes || [])
      .filter((t: any) => Number(t.valor) > 0)
      .map((t: any) => ({
        data: t.data_transacao,
        descricao: t.descricao || "Transação importada",
        cliente: "—",
        categoria: t.categoria_codigo || "Importado",
        conta: t.conta || "escritorio",
        valor: Number(t.valor),
      }));

    const despesasTransacoes: DespesaItem[] = (transacoes || [])
      .filter((t: any) => Number(t.valor) < 0)
      .map((t: any) => ({
        data: t.data_transacao,
        descricao: t.descricao || "Transação importada",
        categoria: t.categoria_codigo || "Importado",
        conta: t.conta || "escritorio",
        valor: Math.abs(Number(t.valor)),
      }));

    // 3. Despesas do período
    let despesasQuery = supabase
      .from("despesas")
      .select("*")
      .gte("data", inicio)
      .lte("data", fim);

    if (conta && conta !== "todos") {
      despesasQuery = despesasQuery.eq("conta", conta);
    }

    const { data: despesasData } = await despesasQuery;

    const despesasCadastradas: DespesaItem[] = (despesasData || []).map((d: any) => ({
      data: d.data,
      descricao: d.descricao,
      categoria: getCategoriaLabel(d.categoria),
      conta: d.conta || "escritorio",
      valor: Number(d.valor),
    }));

    setReceitas([...receitasParcelas, ...receitasTransacoes].sort((a, b) => a.data.localeCompare(b.data)));
    setDespesas([...despesasCadastradas, ...despesasTransacoes].sort((a, b) => a.data.localeCompare(b.data)));
    setLoading(false);
  }

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-8 w-64" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalReceitas = receitas.reduce((s, r) => s + r.valor, 0);
  const totalDespesas = despesas.reduce((s, d) => s + d.valor, 0);
  const saldoLiquido = totalReceitas - totalDespesas;

  // Saldo por conta
  const contas = ["juliana", "liziane", "escritorio"];
  const saldoPorConta: SaldoConta[] = contas.map((c) => {
    const rec = receitas.filter((r) => r.conta === c).reduce((s, r) => s + r.valor, 0);
    const desp = despesas.filter((d) => d.conta === c).reduce((s, d) => s + d.valor, 0);
    return { conta: c, receitas: rec, despesas: desp, saldo: rec - desp };
  }).filter((s) => s.receitas > 0 || s.despesas > 0);

  const handleExportExcel = () => {
    const resumoData = [
      { Descrição: "Total Receitas", Valor: totalReceitas },
      { Descrição: "Total Despesas", Valor: totalDespesas },
      { Descrição: "Saldo Líquido", Valor: saldoLiquido },
      {},
      ...saldoPorConta.map((s) => ({
        Descrição: `Saldo ${CONTA_LABELS[s.conta] || s.conta}`,
        Valor: s.saldo,
      })),
    ];

    const receitasData = receitas.map((r) => ({
      Data: format(new Date(r.data), "dd/MM/yyyy"),
      Descrição: r.descricao,
      Cliente: r.cliente,
      Categoria: r.categoria,
      Conta: CONTA_LABELS[r.conta] || r.conta,
      Valor: r.valor,
    }));
    receitasData.push({ Data: "", Descrição: "TOTAL", Cliente: "", Categoria: "", Conta: "", Valor: totalReceitas });

    const despesasData = despesas.map((d) => ({
      Data: format(new Date(d.data), "dd/MM/yyyy"),
      Descrição: d.descricao,
      Categoria: d.categoria,
      Conta: CONTA_LABELS[d.conta] || d.conta,
      Valor: d.valor,
    }));
    despesasData.push({ Data: "", Descrição: "TOTAL", Categoria: "", Conta: "", Valor: totalDespesas });

    const saldoData = saldoPorConta.map((s) => ({
      Conta: CONTA_LABELS[s.conta] || s.conta,
      Receitas: s.receitas,
      Despesas: s.despesas,
      Saldo: s.saldo,
    }));

    exportToExcelMultiSheet(
      [
        { name: "Resumo", data: resumoData, colWidths: [30, 15] },
        { name: "Receitas", data: receitasData, colWidths: [12, 40, 25, 20, 18, 15] },
        { name: "Despesas", data: despesasData, colWidths: [12, 40, 20, 18, 15] },
        { name: "Saldo por Conta", data: saldoData, colWidths: [20, 15, 15, 15] },
      ],
      "relatorio-contador"
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Relatório para Contador</h2>
          <p className="text-sm text-muted-foreground">
            {format(dataInicio, "dd/MM/yyyy")} a {format(dataFim, "dd/MM/yyyy")}
            {conta && conta !== "todos" ? ` • ${CONTA_LABELS[conta]}` : ""}
          </p>
        </div>
        <Button onClick={handleExportExcel} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Exportar Excel para Contador
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Total Receitas
            </CardDescription>
            <CardTitle className="text-2xl text-green-600">{formatCurrency(totalReceitas)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Total Despesas
            </CardDescription>
            <CardTitle className="text-2xl text-destructive">{formatCurrency(totalDespesas)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Saldo Líquido
            </CardDescription>
            <CardTitle className={`text-2xl ${saldoLiquido >= 0 ? "text-green-600" : "text-destructive"}`}>
              {formatCurrency(saldoLiquido)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Lançamentos
            </CardDescription>
            <CardTitle className="text-2xl">{receitas.length + despesas.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="receitas">
        <TabsList>
          <TabsTrigger value="receitas">Receitas ({receitas.length})</TabsTrigger>
          <TabsTrigger value="despesas">Despesas ({despesas.length})</TabsTrigger>
          <TabsTrigger value="saldo">Saldo por Conta</TabsTrigger>
        </TabsList>

        <TabsContent value="receitas">
          <Card>
            <CardContent className="pt-6">
              {receitas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma receita no período</p>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Conta</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receitas.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>{format(new Date(r.data), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{r.descricao}</TableCell>
                          <TableCell>{r.cliente}</TableCell>
                          <TableCell>{CONTA_LABELS[r.conta] || r.conta}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {formatCurrency(r.valor)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={4}>Total</TableCell>
                        <TableCell className="text-right text-green-600">{formatCurrency(totalReceitas)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despesas">
          <Card>
            <CardContent className="pt-6">
              {despesas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma despesa no período</p>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Conta</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {despesas.map((d, i) => (
                        <TableRow key={i}>
                          <TableCell>{format(new Date(d.data), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{d.descricao}</TableCell>
                          <TableCell>{d.categoria}</TableCell>
                          <TableCell>{CONTA_LABELS[d.conta] || d.conta}</TableCell>
                          <TableCell className="text-right font-semibold text-destructive">
                            {formatCurrency(d.valor)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={4}>Total</TableCell>
                        <TableCell className="text-right text-destructive">{formatCurrency(totalDespesas)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saldo">
          <Card>
            <CardContent className="pt-6">
              {saldoPorConta.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum lançamento no período</p>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conta</TableHead>
                        <TableHead className="text-right">Receitas</TableHead>
                        <TableHead className="text-right">Despesas</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saldoPorConta.map((s) => (
                        <TableRow key={s.conta}>
                          <TableCell className="font-medium">{CONTA_LABELS[s.conta] || s.conta}</TableCell>
                          <TableCell className="text-right text-green-600">{formatCurrency(s.receitas)}</TableCell>
                          <TableCell className="text-right text-destructive">{formatCurrency(s.despesas)}</TableCell>
                          <TableCell className={`text-right font-bold ${s.saldo >= 0 ? "text-green-600" : "text-destructive"}`}>
                            {formatCurrency(s.saldo)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>Total Geral</TableCell>
                        <TableCell className="text-right text-green-600">{formatCurrency(totalReceitas)}</TableCell>
                        <TableCell className="text-right text-destructive">{formatCurrency(totalDespesas)}</TableCell>
                        <TableCell className={`text-right ${saldoLiquido >= 0 ? "text-green-600" : "text-destructive"}`}>
                          {formatCurrency(saldoLiquido)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
