import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProcessoPrazos } from "@/hooks/useProcessoPrazos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProcessosPrazos() {
  const { data: prazos, isLoading } = useProcessoPrazos();

  const prazosOrdenados = prazos?.sort((a, b) => {
    return new Date(a.data_prazo).getTime() - new Date(b.data_prazo).getTime();
  });

  const getUrgenciaColor = (diasRestantes: number) => {
    if (diasRestantes < 0) return "destructive";
    if (diasRestantes <= 3) return "destructive";
    if (diasRestantes <= 7) return "default";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Prazos Processuais</h1>
        <p className="text-muted-foreground mt-2">
          Acompanhe todos os prazos dos seus processos
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : prazosOrdenados && prazosOrdenados.length > 0 ? (
        <div className="space-y-4">
          {prazosOrdenados.map((prazo) => (
            <Card key={prazo.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {prazo.descricao}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(prazo.data_prazo), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                    {prazo.observacoes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {prazo.observacoes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={getUrgenciaColor(prazo.dias_restantes || 0)}>
                      {prazo.dias_restantes !== undefined && prazo.dias_restantes < 0
                        ? `Vencido há ${Math.abs(prazo.dias_restantes)} dias`
                        : prazo.dias_restantes === 0
                        ? "Vence hoje"
                        : `${prazo.dias_restantes} dias`}
                    </Badge>
                    {prazo.alerta_ativo && (
                      <div className="flex items-center gap-1 text-destructive text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        Alerta
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Nenhum prazo cadastrado
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
