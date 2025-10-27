import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Download, AlertTriangle } from "lucide-react";
import { LogFilters as LogFiltersType } from "@/types/logs";
import { useLogs, useLogStats, useCheckIsAdmin } from "@/hooks/useLogs";
import { LogStatsCards } from "@/components/logs/LogStatsCards";
import { LogFilters } from "@/components/logs/LogFilters";
import { LogsTable } from "@/components/logs/LogsTable";
import { exportLogsToCSV } from "@/lib/logUtils";

export default function Logs() {
  const [filters, setFilters] = useState<LogFiltersType>({});
  const [page, setPage] = useState(0);

  const { data: isAdmin, isLoading: isLoadingAdmin } = useCheckIsAdmin();
  const { data: stats, isLoading: isLoadingStats } = useLogStats();
  const { data: logsData, isLoading: isLoadingLogs } = useLogs(filters, page);

  const handleExport = () => {
    if (logsData?.logs) {
      exportLogsToCSV(logsData.logs);
    }
  };

  if (isLoadingAdmin) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-20 w-full bg-muted animate-pulse rounded" />
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

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas administradores podem visualizar logs do sistema.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs do Sistema</h1>
          <p className="text-muted-foreground mt-2">
            Visualize o histórico de ações realizadas no sistema
          </p>
        </div>
        <Button onClick={handleExport} disabled={!logsData?.logs?.length}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <LogStatsCards stats={stats} isLoading={isLoadingStats} />

      <LogFilters
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          setPage(0);
        }}
        onExport={handleExport}
      />

      <LogsTable
        logs={logsData?.logs || []}
        total={logsData?.total || 0}
        page={page}
        onPageChange={setPage}
        isLoading={isLoadingLogs}
      />
    </div>
  );
}
