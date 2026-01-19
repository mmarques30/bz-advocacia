import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SituacaoFinanceiraCardProps {
  clienteId: string;
}

export function SituacaoFinanceiraCard({ clienteId }: SituacaoFinanceiraCardProps) {
  const { data: resumo, isLoading } = useQuery({
    queryKey: ["resumo-financeiro-cliente", clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      // Buscar acordos do cliente
      const { data: acordos } = await supabase
        .from("acordos_financeiros")
        .select("id, valor_total")
        .eq("cliente_id", clienteId);

      if (!acordos || acordos.length === 0) {
        return {
          totalContratado: 0,
          totalPago: 0,
          totalPendente: 0,
          emAtraso: 0,
          statusGeral: "sem_acordos",
        };
      }

      const acordoIds = acordos.map((a) => a.id);
      const totalContratado = acordos.reduce((sum, a) => sum + a.valor_total, 0);

      // Buscar parcelas
      const { data: parcelas } = await supabase
        .from("parcelas_financeiras")
        .select("*")
        .in("acordo_id", acordoIds);

      if (!parcelas) {
        return {
          totalContratado,
          totalPago: 0,
          totalPendente: 0,
          emAtraso: 0,
          statusGeral: "sem_parcelas",
        };
      }

      const hoje = new Date();
      let totalPago = 0;
      let totalPendente = 0;
      let emAtraso = 0;

      parcelas.forEach((p) => {
        if (p.status === "pago") {
          totalPago += p.valor_pago || p.valor;
        } else {
          totalPendente += p.valor;
          const vencimento = new Date(p.data_vencimento);
          if (vencimento < hoje) {
            emAtraso += p.valor;
          }
        }
      });

      let statusGeral = "em_dia";
      if (emAtraso > 0) statusGeral = "em_atraso";
      else if (totalPendente === 0 && totalPago > 0) statusGeral = "quitado";

      return {
        totalContratado,
        totalPago,
        totalPendente,
        emAtraso,
        statusGeral,
      };
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    switch (resumo?.statusGeral) {
      case "quitado":
        return <Badge className="bg-green-600">Quitado</Badge>;
      case "em_dia":
        return <Badge className="bg-blue-600">Em dia</Badge>;
      case "em_atraso":
        return <Badge variant="destructive">Em atraso</Badge>;
      default:
        return <Badge variant="secondary">Sem acordos</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Situação Financeira
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Contratado</p>
            <p className="text-lg font-semibold">
              {formatCurrency(resumo?.totalContratado || 0)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <p className="text-xs text-muted-foreground">Total Pago</p>
            </div>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(resumo?.totalPago || 0)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-amber-600" />
              <p className="text-xs text-muted-foreground">Pendente</p>
            </div>
            <p className="text-lg font-semibold text-amber-600">
              {formatCurrency(resumo?.totalPendente || 0)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-destructive" />
              <p className="text-xs text-muted-foreground">Em Atraso</p>
            </div>
            <p className="text-lg font-semibold text-destructive">
              {formatCurrency(resumo?.emAtraso || 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
