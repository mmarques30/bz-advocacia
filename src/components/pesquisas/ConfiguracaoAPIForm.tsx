import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useConsultasConfig } from "@/hooks/useConsultasConfig";
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";

const configSchema = z.object({
  api_token: z.string().optional(),
  ambiente: z.enum(["sandbox", "producao"]),
  ativo: z.boolean(),
});

type ConfigFormData = z.infer<typeof configSchema>;

export function ConfiguracaoAPIForm() {
  const { config, isLoading, updateConfig, testarConexao } = useConsultasConfig();

  const { register, handleSubmit, watch } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      api_token: config?.api_token || "",
      ambiente: config?.ambiente || "sandbox",
      ativo: config?.ativo || false,
    },
  });

  const ambiente = watch("ambiente");

  const onSubmit = async (data: ConfigFormData) => {
    await updateConfig.mutateAsync(data);
  };

  const handleTestarConexao = async () => {
    await testarConexao.mutateAsync();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuração da API de Consultas</CardTitle>
              <CardDescription>
                Configure as credenciais para realizar consultas de dados
              </CardDescription>
            </div>
            {config?.ativo ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Ativo
              </Badge>
            ) : (
              <Badge variant="secondary">Não configurado</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Provedor</Label>
              <Input value="BigDataCorp" disabled />
              <p className="text-sm text-muted-foreground mt-1">
                Provedor de dados jurídicos e consultas públicas
              </p>
            </div>

            <div>
              <Label htmlFor="api_token">Token de API</Label>
              <Input
                id="api_token"
                type="password"
                placeholder="Cole seu token da API aqui..."
                {...register("api_token")}
              />
            </div>

            <div>
              <Label htmlFor="ambiente">Ambiente</Label>
              <Select
                value={ambiente}
                onValueChange={(value: any) => register("ambiente").onChange({ target: { value } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (testes)</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" {...register("ambiente")} value={ambiente} />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Como obter credenciais:</AlertTitle>
              <AlertDescription className="space-y-1 mt-2">
                <p>1. Acesse <a href="https://bigdatacorp.com.br" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  bigdatacorp.com.br <ExternalLink className="h-3 w-3" />
                </a></p>
                <p>2. Crie uma conta ou faça login</p>
                <p>3. Copie seu Token de API no painel</p>
                <p>4. Cole acima e salve</p>
              </AlertDescription>
            </Alert>

            {config?.creditos_disponiveis !== undefined && (
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Créditos Disponíveis:</span>
                  <span className="text-lg font-bold">{config.creditos_disponiveis}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Custo médio por consulta: R$ 0,50 - R$ 3,00
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={updateConfig.isPending}>
                {updateConfig.isPending ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleTestarConexao}
                disabled={testarConexao.isPending || !config?.api_token}
              >
                {testarConexao.isPending ? "Testando..." : "Testar Conexão"}
              </Button>
            </div>
          </form>

          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>IMPORTANTE: Legalidade e LGPD</AlertTitle>
            <AlertDescription className="space-y-1 mt-2">
              <p>• Use apenas para fins legítimos e processos jurídicos</p>
              <p>• Mantenha log de todas as consultas realizadas</p>
              <p>• Consultas são rastreáveis e auditáveis</p>
              <p>• Respeite a privacidade e proteção de dados</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
