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

interface ConsultaAgrupada {
  parametro: string;
  tipo: string;
  quantidade: number;
  ultimaConsulta: string;
}

interface RepetidasTableProps {
  consultas: ConsultaAgrupada[];
}

const tipoLabels: Record<string, string> = {
  veiculo: "Veículo",
  pessoa: "Pessoa",
  imovel: "Imóvel",
  certidao: "Certidão",
};

export function RepetidasTable({ consultas }: RepetidasTableProps) {
  if (!consultas || consultas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma consulta repetida encontrada
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Parâmetro</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-center">Qtd. Pesquisas</TableHead>
          <TableHead>Última Consulta</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {consultas.map((consulta, index) => (
          <TableRow key={`${consulta.parametro}-${index}`}>
            <TableCell className="font-mono text-sm">
              {consulta.parametro}
            </TableCell>
            <TableCell>{tipoLabels[consulta.tipo] || consulta.tipo}</TableCell>
            <TableCell className="text-center">
              <Badge variant={consulta.quantidade > 3 ? "destructive" : "secondary"}>
                {consulta.quantidade}x
              </Badge>
            </TableCell>
            <TableCell>
              {format(new Date(consulta.ultimaConsulta), "dd/MM/yyyy HH:mm", {
                locale: ptBR,
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
