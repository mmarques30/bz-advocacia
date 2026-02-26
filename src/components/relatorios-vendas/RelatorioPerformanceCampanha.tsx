import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { chartColors } from "@/lib/chartConfig";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

interface RelatorioPerformanceCampanhaProps {
  dataInicio: Date;
  dataFim: Date;
}

interface AnuncioAggregated {
  anuncio: string;
  totalLeads: number;
  leadsEnviados: number;
  leadsConvertidos: number;
  taxaConversao: number;
}

const COLORS = [chartColors.primary, chartColors.secondary, chartColors.accent, chartColors.muted, '#8884d8', '#82ca9d'];

export function RelatorioPerformanceCampanha({ dataInicio, dataFim }: RelatorioPerformanceCampanhaProps) {
  const { data: dbLeads, isLoading } = useQuery({
    queryKey: ["leads-ads-report", dataInicio.toISOString(), dataFim.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("created_at, estagio, canal_especifico, origem")
        .in("origem", ["google_sheets", "meta"])
        .gte("created_at", dataInicio.toISOString())
        .lte("created_at", dataFim.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const anuncios = useMemo<AnuncioAggregated[]>(() => {
    if (!dbLeads) return [];

    const map = new Map<string, { total: number; enviados: number; convertidos: number }>();

    dbLeads.forEach((lead) => {
      const name = lead.canal_especifico || "Sem anúncio";
      const entry = map.get(name) || { total: 0, enviados: 0, convertidos: 0 };
      entry.total++;
      if (lead.estagio === "contato_inicial") entry.enviados++;
      if (lead.estagio === "fechado") entry.convertidos++;
      map.set(name, entry);
    });

    return Array.from(map.entries())
      .map(([anuncio, d]) => ({
        anuncio,
        totalLeads: d.total,
        leadsEnviados: d.enviados,
        leadsConvertidos: d.convertidos,
        taxaConversao: d.total > 0 ? (d.convertidos / d.total) * 100 : 0,
      }))
      .sort((a, b) => b.totalLeads - a.totalLeads);
  }, [dbLeads]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalLeads = anuncios.reduce((acc, c) => acc + c.totalLeads, 0);
  const melhorAnuncio = anuncios.length > 0 ? anuncios[0] : null;

  const exportData = anuncios.map(c => ({
    Anúncio: c.anuncio,
    "Total Leads": c.totalLeads,
    "Leads Enviados": c.leadsEnviados,
    "Leads Convertidos": c.leadsConvertidos,
    "Taxa de Conversão (%)": c.taxaConversao.toFixed(1),
  }));

  const handleExportPDF = () => {
    exportToPDF(exportData, "Relatório Performance por Anúncio");
  };

  const handleExportCSV = () => {
    exportToCSV(exportData, "relatorio-performance-anuncio");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Performance por Anúncio</CardTitle>
              <CardDescription>
                {format(dataInicio, "dd 'de' MMMM", { locale: ptBR })} até {format(dataFim, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total de Anúncios</CardDescription>
              <CardTitle className="text-2xl">{anuncios.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total de Leads</CardDescription>
              <CardTitle className="text-2xl">{totalLeads}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Melhor Anúncio</CardDescription>
              <CardTitle className="text-xl truncate">{melhorAnuncio?.anuncio || "-"}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {melhorAnuncio?.totalLeads} leads ({melhorAnuncio?.taxaConversao.toFixed(1)}% conversão)
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Gráfico */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={anuncios.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis 
                dataKey="anuncio" 
                type="category" 
                width={150} 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="totalLeads" name="Total Leads">
                {anuncios.slice(0, 10).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anúncio</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Enviados</TableHead>
                <TableHead className="text-right">Convertidos</TableHead>
                <TableHead className="text-right">Taxa Conversão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anuncios.map((anuncio, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{anuncio.anuncio}</TableCell>
                  <TableCell className="text-right">{anuncio.totalLeads}</TableCell>
                  <TableCell className="text-right">{anuncio.leadsEnviados}</TableCell>
                  <TableCell className="text-right">{anuncio.leadsConvertidos}</TableCell>
                  <TableCell className="text-right">
                    <span className={anuncio.taxaConversao > 10 ? "text-green-600" : "text-muted-foreground"}>
                      {anuncio.taxaConversao.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {anuncios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum anúncio encontrado no período
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
