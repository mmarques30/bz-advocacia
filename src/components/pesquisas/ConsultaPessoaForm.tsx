import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConsultaPessoa } from "@/hooks/useConsultaPessoa";
import { useProcessos } from "@/hooks/useProcessos";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { ConsultaPessoaResponse } from "@/types/pesquisas";

const pessoaSchema = z.object({
  tipo: z.enum(["cpf", "nome", "telefone"]),
  valor: z.string().min(1, "Campo obrigatório"),
  incluirEnderecos: z.boolean(),
  incluirTelefones: z.boolean(),
  incluirEmails: z.boolean(),
  incluirScore: z.boolean(),
  processo_id: z.string().min(1, "Campo obrigatório"),
  motivo: z.string().min(1, "Campo obrigatório"),
  justificativa: z.string().min(10, "Mínimo 10 caracteres"),
});

type PessoaFormData = z.infer<typeof pessoaSchema>;

interface ConsultaPessoaFormProps {
  onResultado?: (resultado: ConsultaPessoaResponse) => void;
}

export function ConsultaPessoaForm({ onResultado }: ConsultaPessoaFormProps) {
  const { consultarPessoa, isLoading } = useConsultaPessoa();
  const { data: processos } = useProcessos({ status: [], search: "" });
  const [tipo, setTipo] = useState<"cpf" | "nome" | "telefone">("cpf");
  const [incluirEnderecos, setIncluirEnderecos] = useState(true);
  const [incluirTelefones, setIncluirTelefones] = useState(true);
  const [incluirEmails, setIncluirEmails] = useState(true);
  const [incluirScore, setIncluirScore] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<PessoaFormData>({
    resolver: zodResolver(pessoaSchema),
    defaultValues: {
      tipo: "cpf",
      incluirEnderecos: true,
      incluirTelefones: true,
      incluirEmails: true,
      incluirScore: false,
    },
  });

  const onSubmit = async (data: PessoaFormData) => {
    const resultado = await consultarPessoa.mutateAsync({
      tipo: data.tipo,
      valor: data.valor,
      incluirEnderecos: data.incluirEnderecos,
      incluirTelefones: data.incluirTelefones,
      incluirEmails: data.incluirEmails,
      incluirScore: data.incluirScore,
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
        <CardTitle>Localizar Pessoa</CardTitle>
        <CardDescription>
          Busque endereços, telefones e outras informações de pessoas físicas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="tipo">Tipo de Busca *</Label>
            <Select
              value={tipo}
              onValueChange={(value: any) => setTipo(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpf">Por CPF</SelectItem>
                <SelectItem value="nome">Por Nome</SelectItem>
                <SelectItem value="telefone">Por Telefone</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" {...register("tipo")} value={tipo} />
          </div>

          <div>
            <Label htmlFor="valor">
              {tipo === "cpf" && "CPF *"}
              {tipo === "nome" && "Nome Completo *"}
              {tipo === "telefone" && "Telefone *"}
            </Label>
            <Input
              id="valor"
              placeholder={
                tipo === "cpf"
                  ? "123.456.789-00"
                  : tipo === "nome"
                  ? "João da Silva"
                  : "(11) 98765-4321"
              }
              {...register("valor")}
            />
            {errors.valor && (
              <p className="text-sm text-destructive mt-1">{errors.valor.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Dados a buscar:</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluirEnderecos"
                checked={incluirEnderecos}
                onCheckedChange={(checked) => setIncluirEnderecos(checked as boolean)}
              />
              <input type="hidden" {...register("incluirEnderecos")} value={incluirEnderecos.toString()} />
              <Label htmlFor="incluirEnderecos" className="font-normal">
                Endereços conhecidos
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluirTelefones"
                checked={incluirTelefones}
                onCheckedChange={(checked) => setIncluirTelefones(checked as boolean)}
              />
              <input type="hidden" {...register("incluirTelefones")} value={incluirTelefones.toString()} />
              <Label htmlFor="incluirTelefones" className="font-normal">
                Telefones
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluirEmails"
                checked={incluirEmails}
                onCheckedChange={(checked) => setIncluirEmails(checked as boolean)}
              />
              <input type="hidden" {...register("incluirEmails")} value={incluirEmails.toString()} />
              <Label htmlFor="incluirEmails" className="font-normal">
                E-mails
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluirScore"
                checked={incluirScore}
                onCheckedChange={(checked) => setIncluirScore(checked as boolean)}
              />
              <input type="hidden" {...register("incluirScore")} value={incluirScore.toString()} />
              <Label htmlFor="incluirScore" className="font-normal">
                Score de crédito (custo adicional)
              </Label>
            </div>
          </div>

          <div>
            <Label htmlFor="processo_id">Vincular a Processo *</Label>
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
            {errors.processo_id && (
              <p className="text-sm text-destructive mt-1">{errors.processo_id.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="motivo">Motivo da Consulta *</Label>
            <Select {...register("motivo")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="citacao_processual">Citação processual</SelectItem>
                <SelectItem value="execucao_alimentos">Execução de alimentos</SelectItem>
                <SelectItem value="localizacao_devedor">Localização de devedor</SelectItem>
                <SelectItem value="investigacao_patrimonial">Investigação patrimonial</SelectItem>
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
              placeholder="Descreva a necessidade jurídica para esta consulta..."
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
              Custo estimado: R$ 2,50
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
