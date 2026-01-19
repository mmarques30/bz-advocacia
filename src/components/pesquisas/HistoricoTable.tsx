import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import type { ConsultaRealizada } from "@/types/pesquisas";

interface HistoricoTableProps {
  consultas: ConsultaRealizada[];
  onVisualizarResultado?: (consulta: ConsultaRealizada) => void;
  onExportar?: (consulta: ConsultaRealizada) => void;
}

const tipoLabels: Record<string, string> = {
  processo: "Processo",
  cpf: "Pessoa (CPF)",
  cnpj: "Empresa (CNPJ)",
};

const statusLabels: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
  sucesso: { label: "Sucesso", variant: "default" },
  erro: { label: "Erro", variant: "destructive" },
  sem_dados: { label: "Sem dados", variant: "secondary" },
  api_nao_configurada: { label: "API não configurada", variant: "outline" },
};

export function HistoricoTable({
  consultas,
  onVisualizarResultado,
  onExportar,
}: HistoricoTableProps) {
  if (!consultas || consultas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma consulta realizada ainda
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data/Hora</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Parâmetro</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Custo</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {consultas.map((consulta) => (
          <TableRow key={consulta.id}>
            <TableCell>
              {format(new Date(consulta.created_at), "dd/MM/yyyy HH:mm", {
                locale: ptBR,
              })}
            </TableCell>
            <TableCell>{tipoLabels[consulta.tipo_consulta]}</TableCell>
            <TableCell className="font-mono text-sm">
              {consulta.parametro_busca}
            </TableCell>
            <TableCell className="text-sm">{consulta.motivo}</TableCell>
            <TableCell>
              <Badge variant={statusLabels[consulta.status]?.variant || "secondary"}>
                {statusLabels[consulta.status]?.label || consulta.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              R$ {consulta.custo.toFixed(2)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex gap-1 justify-end">
                {consulta.status === "sucesso" && consulta.resultado && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onVisualizarResultado?.(consulta)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onExportar?.(consulta)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
