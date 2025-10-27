import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";
import { useLogs, useLogStats } from "@/hooks/useLogs";
import { useCheckIsAdmin } from "@/hooks/useUsuarios";
import { LogFilters as LogFiltersType } from "@/types/logs";
import { LogStatsCards } from "@/components/logs/LogStatsCards";
import { LogFilters } from "@/components/logs/LogFilters";
import { LogsTable } from "@/components/logs/LogsTable";
import { exportLogsToCSV } from "@/lib/logUtils";
import { toast } from "sonner";

export default function Logs() {
  const [filters, setFilters] = useState<LogFiltersType>({});
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data: isAdmin, isLoading: isLoadingAdmin } = useCheckIsAdmin();
  const { data: stats, isLoading: isLoadingStats } = useLogStats();
  const { data: logsData, isLoading: isLoadingLogs } = useLogs(filters, page, pageSize);

  const handleExport = async () => {
    if (!logsData?.logs) return;
    
    try {
      exportLogsToCSV(logsData.logs);
      toast.success("Logs exportados com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar logs");
    }
  };

  if (isLoadingAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Logs do Sistema</h1>
          <p className="text-muted-foreground mt-2">
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Logs do Sistema</h1>
          <p className="text-muted-foreground mt-2">
            Visualize o histórico de ações realizadas no sistema
          </p>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas administradores podem visualizar os logs do sistema.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Logs do Sistema</h1>
        <p className="text-muted-foreground mt-2">
          Visualize e audite o histórico completo de ações realizadas no sistema
        </p>
      </div>

      <LogStatsCards stats={stats} isLoading={isLoadingStats} />

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ações</CardTitle>
          <CardDescription>
            Todos os logs de auditoria registrados automaticamente pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LogFilters
            filters={filters}
            onFiltersChange={setFilters}
            onExport={handleExport}
          />

          <LogsTable
            logs={logsData?.logs || []}
            total={logsData?.total || 0}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            isLoading={isLoadingLogs}
          />
        </CardContent>
      </Card>
    </div>
  );
}
