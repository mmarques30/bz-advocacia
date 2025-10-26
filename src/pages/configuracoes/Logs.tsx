import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { LogCard } from "@/components/logs/LogCard";
import { LogDetailsDialog } from "@/components/logs/LogDetailsDialog";
import { LogFilters } from "@/components/logs/LogFilters";
import { useLogs, LogSistema } from "@/hooks/useLogs";
import { exportToCSV } from "@/lib/exportUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Logs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [acao, setAcao] = useState("all");
  const [entidadeTipo, setEntidadeTipo] = useState("all");
  const [selectedLog, setSelectedLog] = useState<LogSistema | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: logs, isLoading } = useLogs({
    acao: acao !== "all" ? acao : undefined,
    entidadeTipo: entidadeTipo !== "all" ? entidadeTipo : undefined,
  });

  const filteredLogs = logs?.filter((log) =>
    log.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    if (!filteredLogs) return;

    const data = filteredLogs.map((log) => ({
      Data: format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
      Ação: log.acao,
      Entidade: log.entidade_tipo,
      Descrição: log.descricao,
      IP: log.ip_address || "-",
    }));

    exportToCSV(data, `logs-sistema-${format(new Date(), "yyyy-MM-dd")}`);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setAcao("all");
    setEntidadeTipo("all");
  };

  const handleViewDetails = (log: LogSistema) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs do Sistema</h1>
          <p className="text-muted-foreground">
            Visualize o histórico de ações realizadas no sistema
          </p>
        </div>
        <Button onClick={handleExport} disabled={!filteredLogs || filteredLogs.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <LogFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        acao={acao}
        onAcaoChange={setAcao}
        entidadeTipo={entidadeTipo}
        onEntidadeTipoChange={setEntidadeTipo}
        onClear={handleClearFilters}
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !filteredLogs || filteredLogs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum log encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredLogs.length} {filteredLogs.length === 1 ? "registro" : "registros"}
          </div>
          {filteredLogs.map((log) => (
            <LogCard key={log.id} log={log} onViewDetails={handleViewDetails} />
          ))}
        </div>
      )}

      <LogDetailsDialog
        log={selectedLog}
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
}
