import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Scale, AlertTriangle, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConsultaProcesso } from "@/hooks/useConsultaProcesso";
import { useProcessos } from "@/hooks/useProcessos";
import type { ConsultaProcessoRequest } from "@/types/pesquisas";

const TRIBUNAIS = [
  { value: "stf", label: "STF - Supremo Tribunal Federal" },
  { value: "stj", label: "STJ - Superior Tribunal de Justiça" },
  { value: "tst", label: "TST - Tribunal Superior do Trabalho" },
  { value: "trf1", label: "TRF 1ª Região" },
  { value: "trf2", label: "TRF 2ª Região" },
  { value: "trf3", label: "TRF 3ª Região" },
  { value: "trf4", label: "TRF 4ª Região" },
  { value: "trf5", label: "TRF 5ª Região" },
  { value: "trf6", label: "TRF 6ª Região" },
  { value: "tjsp", label: "TJSP - São Paulo" },
  { value: "tjrj", label: "TJRJ - Rio de Janeiro" },
  { value: "tjmg", label: "TJMG - Minas Gerais" },
  { value: "tjrs", label: "TJRS - Rio Grande do Sul" },
  { value: "tjpr", label: "TJPR - Paraná" },
  { value: "tjsc", label: "TJSC - Santa Catarina" },
  { value: "tjba", label: "TJBA - Bahia" },
  { value: "tjpe", label: "TJPE - Pernambuco" },
  { value: "tjce", label: "TJCE - Ceará" },
  { value: "tjgo", label: "TJGO - Goiás" },
  { value: "tjdft", label: "TJDFT - Distrito Federal" },
  { value: "tjes", label: "TJES - Espírito Santo" },
  { value: "tjmt", label: "TJMT - Mato Grosso" },
  { value: "tjms", label: "TJMS - Mato Grosso do Sul" },
  { value: "tjpa", label: "TJPA - Pará" },
  { value: "tjam", label: "TJAM - Amazonas" },
  { value: "tjma", label: "TJMA - Maranhão" },
  { value: "tjpb", label: "TJPB - Paraíba" },
  { value: "tjrn", label: "TJRN - Rio Grande do Norte" },
  { value: "tjpi", label: "TJPI - Piauí" },
  { value: "tjal", label: "TJAL - Alagoas" },
  { value: "tjse", label: "TJSE - Sergipe" },
  { value: "tjro", label: "TJRO - Rondônia" },
  { value: "tjto", label: "TJTO - Tocantins" },
  { value: "tjac", label: "TJAC - Acre" },
  { value: "tjap", label: "TJAP - Amapá" },
  { value: "tjrr", label: "TJRR - Roraima" },
  { value: "trt1", label: "TRT 1ª Região (RJ)" },
  { value: "trt2", label: "TRT 2ª Região (SP)" },
  { value: "trt3", label: "TRT 3ª Região (MG)" },
  { value: "trt4", label: "TRT 4ª Região (RS)" },
  { value: "trt5", label: "TRT 5ª Região (BA)" },
  { value: "trt15", label: "TRT 15ª Região (Campinas)" },
];

const MOTIVOS = [
  { value: "acompanhamento", label: "Acompanhamento processual" },
  { value: "diligencia", label: "Diligência advocatícia" },
  { value: "pesquisa_patrimonial", label: "Pesquisa patrimonial" },
  { value: "analise_credito", label: "Análise de crédito" },
  { value: "due_diligence", label: "Due diligence" },
  { value: "outro", label: "Outro" },
];

const formSchema = z.object({
  numeroProcesso: z.string().min(15, "Número do processo inválido"),
  tribunal: z.string().min(1, "Selecione um tribunal"),
  processo_id: z.string().optional(),
  motivo: z.string().min(1, "Selecione um motivo"),
  justificativa: z.string().min(20, "Justificativa deve ter pelo menos 20 caracteres"),
});

type FormData = z.infer<typeof formSchema>;

interface ConsultaProcessoFormProps {
  onSuccess?: () => void;
}

export function ConsultaProcessoForm({ onSuccess }: ConsultaProcessoFormProps) {
  const { consultarProcesso, isLoading } = useConsultaProcesso();
  const { data: processos } = useProcessos({ status: [] });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numeroProcesso: "",
      tribunal: "",
      processo_id: "",
      motivo: "",
      justificativa: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    const request: ConsultaProcessoRequest = {
      numeroProcesso: data.numeroProcesso,
      tribunal: data.tribunal,
      processo_id: data.processo_id === "none" ? undefined : data.processo_id,
      motivo: data.motivo,
      justificativa: data.justificativa,
    };

    await consultarProcesso.mutateAsync(request);
    onSuccess?.();
  };

  // Format process number as user types
  const formatProcessNumber = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "");
    
    // Apply mask: NNNNNNN-DD.AAAA.J.TR.OOOO
    if (digits.length <= 7) return digits;
    if (digits.length <= 9) return `${digits.slice(0, 7)}-${digits.slice(7)}`;
    if (digits.length <= 13) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9)}`;
    if (digits.length <= 14) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13)}`;
    if (digits.length <= 16) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14)}`;
    return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14, 16)}.${digits.slice(16, 20)}`;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numeroProcesso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Processo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0000000-00.0000.0.00.0000"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatProcessNumber(e.target.value);
                          field.onChange(formatted);
                        }}
                        maxLength={25}
                      />
                    </FormControl>
                    <FormDescription>
                      Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tribunal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tribunal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tribunal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {TRIBUNAIS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="processo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vincular a Processo (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um processo interno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {processos?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.numero_processo || p.tipo} - {p.cliente?.nome_completo || "Sem cliente"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Vincule esta consulta a um processo do sistema
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da Consulta</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o motivo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOTIVOS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="justificativa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa Legal (LGPD)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a finalidade legítima desta consulta conforme LGPD..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Esta informação é obrigatória para fins de auditoria e conformidade com a LGPD
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Esta consulta será registrada para fins de auditoria conforme LGPD. 
                A API é gratuita mas limitada a 120 requisições por minuto.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Consultar Processo
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
