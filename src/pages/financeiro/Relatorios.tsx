import { useState } from "react";
import { subMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, FileText, TrendingDown, TrendingUp, Calculator } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TipoRelatorio } from "@/types/financeiro";
import { RelatorioContador } from "@/components/financeiro/relatorios/RelatorioContador";
import { RelatorioInadimplencia } from "@/components/financeiro/relatorios/RelatorioInadimplencia";
import { RelatorioFluxoCaixa } from "@/components/financeiro/relatorios/RelatorioFluxoCaixa";

const relatorios = [
  {
    tipo: "consolidado_contador" as TipoRelatorio,
    titulo: "Relatório para Contador",
    descricao: "Receitas + Despesas + Saldo por conta com exportação Excel",
    icon: Calculator,
  },
  {
    tipo: "inadimplencia_detalhada" as TipoRelatorio,
    titulo: "Inadimplência",
    descricao: "Clientes e valores em atraso",
    icon: TrendingDown,
  },
  {
    tipo: "fluxo_caixa_projetado" as TipoRelatorio,
    titulo: "Fluxo de Caixa",
    descricao: "Entradas previstas para os próximos meses",
    icon: TrendingUp,
  },
];

export default function FinanceiroRelatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio | null>(null);
  const [dataInicio, setDataInicio] = useState<Date>(subMonths(new Date(), 1));
  const [dataFim, setDataFim] = useState<Date>(new Date());
  const [conta, setConta] = useState<string>("todos");

  const renderRelatorio = () => {
    if (!tipoRelatorio) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Selecione um relatório acima para visualizar</p>
        </div>
      );
    }

    switch (tipoRelatorio) {
      case "consolidado_contador":
        return <RelatorioContador dataInicio={dataInicio} dataFim={dataFim} conta={conta} />;
      case "inadimplencia_detalhada":
        return <RelatorioInadimplencia />;
      case "fluxo_caixa_projetado":
        return <RelatorioFluxoCaixa />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios Financeiros</h1>
        <p className="text-muted-foreground mt-2">Relatórios consolidados e análises financeiras</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataInicio, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataInicio} onSelect={(d) => d && setDataInicio(d)} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 space-y-2">
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataFim, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataFim} onSelect={(d) => d && setDataFim(d)} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 space-y-2">
              <Label>Conta</Label>
              <Select value={conta} onValueChange={setConta}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as contas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Contas</SelectItem>
                  <SelectItem value="juliana">Conta Juliana</SelectItem>
                  <SelectItem value="liziane">Conta Liziane</SelectItem>
                  <SelectItem value="escritorio">Conta Escritório</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de relatório */}
      <div className="grid gap-4 md:grid-cols-3">
        {relatorios.map((rel) => (
          <Card
            key={rel.tipo}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg",
              tipoRelatorio === rel.tipo && "ring-2 ring-primary"
            )}
            onClick={() => setTipoRelatorio(rel.tipo)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  tipoRelatorio === rel.tipo ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <rel.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{rel.titulo}</CardTitle>
                  <CardDescription className="text-sm">{rel.descricao}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Relatório renderizado */}
      <div>{renderRelatorio()}</div>
    </div>
  );
}
