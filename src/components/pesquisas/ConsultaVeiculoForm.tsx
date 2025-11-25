import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConsultaVeiculo } from "@/hooks/useConsultaVeiculo";
import { useProcessos } from "@/hooks/useProcessos";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { ConsultaVeiculoResponse } from "@/types/pesquisas";

const veiculoSchema = z.object({
  tipo: z.enum(["placa", "renavam", "chassi"]),
  valor: z.string().min(1, "Campo obrigatório"),
  processo_id: z.string().optional(),
  motivo: z.string().min(1, "Campo obrigatório"),
  justificativa: z.string().min(10, "Mínimo 10 caracteres"),
});

type VeiculoFormData = z.infer<typeof veiculoSchema>;

interface ConsultaVeiculoFormProps {
  onResultado?: (resultado: ConsultaVeiculoResponse) => void;
}

export function ConsultaVeiculoForm({ onResultado }: ConsultaVeiculoFormProps) {
  const { consultarVeiculo, isLoading } = useConsultaVeiculo();
  const { data: processos } = useProcessos({ status: [], search: "" });
  const [tipo, setTipo] = useState<"placa" | "renavam" | "chassi">("placa");

  const { register, handleSubmit, formState: { errors } } = useForm<VeiculoFormData>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      tipo: "placa",
    },
  });

  const onSubmit = async (data: VeiculoFormData) => {
    const resultado = await consultarVeiculo.mutateAsync({
      tipo: data.tipo,
      valor: data.valor,
      processo_id: data.processo_id,
      motivo: data.motivo,
      justificativa: data.justificativa,
    });

    if (onResultado) {
      onResultado(resultado);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultar Veículo</CardTitle>
        <CardDescription>
          Busque informações detalhadas sobre veículos por placa, RENAVAM ou chassi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="tipo">Tipo de Consulta *</Label>
            <Select
              value={tipo}
              onValueChange={(value: any) => setTipo(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placa">Por Placa</SelectItem>
                <SelectItem value="renavam">Por RENAVAM</SelectItem>
                <SelectItem value="chassi">Por Chassi</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" {...register("tipo")} value={tipo} />
          </div>

          <div>
            <Label htmlFor="valor">
              {tipo === "placa" && "Placa do Veículo *"}
              {tipo === "renavam" && "RENAVAM *"}
              {tipo === "chassi" && "Chassi *"}
            </Label>
            <Input
              id="valor"
              placeholder={
                tipo === "placa"
                  ? "ABC1D23"
                  : tipo === "renavam"
                  ? "12345678901"
                  : "9BWZZZ377VT004251"
              }
              {...register("valor")}
            />
            {errors.valor && (
              <p className="text-sm text-destructive mt-1">{errors.valor.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="processo_id">Vincular a Processo (opcional)</Label>
            <Select {...register("processo_id")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um processo" />
              </SelectTrigger>
              <SelectContent>
                {processos?.map((processo) => (
                  <SelectItem key={processo.id} value={processo.id}>
                    {processo.numero_processo || processo.tipo} - {processo.autor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="motivo">Motivo da Consulta *</Label>
            <Select {...register("motivo")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="investigacao_patrimonial">Investigação patrimonial</SelectItem>
                <SelectItem value="execucao_alimentos">Execução de alimentos</SelectItem>
                <SelectItem value="partilha_bens">Partilha de bens</SelectItem>
                <SelectItem value="localizacao_ativo">Localização de ativo</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
            {errors.motivo && (
              <p className="text-sm text-destructive mt-1">{errors.motivo.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="justificativa">Justificativa Legal * (LGPD)</Label>
            <Textarea
              id="justificativa"
              placeholder="Descreva a base legal para esta consulta..."
              rows={3}
              {...register("justificativa")}
            />
            {errors.justificativa && (
              <p className="text-sm text-destructive mt-1">{errors.justificativa.message}</p>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta consulta será registrada e auditável conforme requisitos da LGPD.
              Custo estimado: R$ 1,50
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Consultando..." : "Consultar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
