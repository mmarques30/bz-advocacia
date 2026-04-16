import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useConfiguracoesEscritorio } from "@/hooks/useConfiguracoesEscritorio";
import { useCreateContrato } from "@/hooks/useContratos";
import { MODELOS_PROCURACAO } from "@/lib/procuracaoTemplates";
import { ValoresContrato, DadosContrato, DadosCliente } from "@/types/contratos";
import { substituirVariaveis, extrairVariaveisFaltantes } from "@/lib/contratoUtils";
import { ContratoPreview } from "./ContratoPreview";
import { ComplementarDadosDialog } from "./ComplementarDadosDialog";
import { ClienteDataPanel } from "./ClienteDataPanel";
import { AlertCircle, FileDown, Save } from "lucide-react";
import { toast } from "@/lib/toast";
import { pdf } from "@react-pdf/renderer";
import { ContratoPDF } from "./ContratoPDF";

const useLeadsSimple = () => {
  return useQuery({
    queryKey: ["leads-simple"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .eq("estagio", "fechado")
        .order("nome_completo", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
};

export function GerarProcuracaoForm() {
  const { data: leads } = useLeadsSimple();
  const { configuracoes } = useConfiguracoesEscritorio();
  const createContrato = useCreateContrato();

  const [modeloId, setModeloId] = useState<string>(MODELOS_PROCURACAO[0]?.id || "");
  const [clienteId, setClienteId] = useState<string>("");
  const [titulo, setTitulo] = useState("");
  const [showComplementar, setShowComplementar] = useState(false);
  const [dadosContrato, setDadosContrato] = useState<DadosContrato>({
    objeto: "",
    cidade: "",
    data_contrato: new Date().toISOString().split("T")[0],
  });

  const valoresVazio: ValoresContrato = { valor_entrada: 0, valor_parcelas: 0, num_parcelas: 0, percentual_exito: 0 };

  const clienteSelecionado = useMemo(() => leads?.find((l) => l.id === clienteId), [leads, clienteId]);
  const modeloSelecionado = useMemo(() => MODELOS_PROCURACAO.find((m) => m.id === modeloId), [modeloId]);

  const dadosCliente: DadosCliente = useMemo(() => {
    if (!clienteSelecionado) return {} as DadosCliente;
    return {
      nome_completo: clienteSelecionado.nome_completo,
      cpf: clienteSelecionado.cpf,
      rg: clienteSelecionado.rg,
      nacionalidade: clienteSelecionado.nacionalidade || "brasileiro(a)",
      profissao: clienteSelecionado.profissao,
      estado_civil: clienteSelecionado.estado_civil || clienteSelecionado.situacao_atual,
      endereco_completo: clienteSelecionado.endereco_completo,
      email: clienteSelecionado.email,
      telefone: clienteSelecionado.telefone,
      endereco_cidade: clienteSelecionado.endereco_cidade,
      endereco_estado: clienteSelecionado.endereco_estado,
      endereco_cep: clienteSelecionado.endereco_cep,
    };
  }, [clienteSelecionado]);

  const dadosEscritorio = useMemo(() => {
    if (!configuracoes)
      return {
        nome_escritorio: "Borges & Zembruski Advocacia",
        cnpj: "",
        oab_principal: "",
        endereco_completo: "",
        telefone: "",
        email: "",
        cidade: "",
        estado: "",
      };
    return {
      nome_escritorio: configuracoes.nome_escritorio,
      cnpj: configuracoes.cnpj || "",
      oab_principal: configuracoes.oab_principal || "",
      endereco_completo: configuracoes.endereco_completo || "",
      telefone: configuracoes.telefone || "",
      email: configuracoes.email || "",
      cidade: configuracoes.cidade || "",
      estado: configuracoes.estado || "",
    };
  }, [configuracoes]);

  const conteudoPreview = useMemo(() => {
    if (!modeloSelecionado) return "";
    return substituirVariaveis(modeloSelecionado.template, dadosCliente, dadosEscritorio, valoresVazio, dadosContrato);
  }, [modeloSelecionado, dadosCliente, dadosEscritorio, dadosContrato]);

  const camposFaltantes = useMemo(() => {
    if (!modeloSelecionado || !clienteSelecionado) return [];
    return extrairVariaveisFaltantes(modeloSelecionado.template, dadosCliente);
  }, [modeloSelecionado, clienteSelecionado, dadosCliente]);

  const handleSalvarRascunho = async () => {
    if (!clienteId || !modeloSelecionado || !titulo) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    await createContrato.mutateAsync({
      cliente_id: clienteId,
      titulo,
      tipo_contrato: "procuracao",
      conteudo_final: conteudoPreview,
      valores: {},
      dados_contrato: { ...dadosContrato },
      status: "rascunho",
    });
  };

  const handleGerarPDF = async () => {
    if (!clienteId || !modeloSelecionado || !titulo) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const { data: freshCliente, error: fetchError } = await supabase
      .from("contact_submissions")
      .select("*")
      .eq("id", clienteId)
      .single();

    if (fetchError || !freshCliente) {
      toast.error("Erro ao buscar dados atualizados do cliente");
      return;
    }

    const freshDados: DadosCliente = {
      nome_completo: freshCliente.nome_completo,
      cpf: freshCliente.cpf,
      rg: freshCliente.rg,
      nacionalidade: freshCliente.nacionalidade || "brasileiro(a)",
      profissao: freshCliente.profissao,
      estado_civil: freshCliente.estado_civil || freshCliente.situacao_atual,
      endereco_completo: freshCliente.endereco_completo,
      email: freshCliente.email,
      telefone: freshCliente.telefone,
      endereco_cidade: freshCliente.endereco_cidade,
      endereco_estado: freshCliente.endereco_estado,
      endereco_cep: freshCliente.endereco_cep,
    };

    const faltantes = extrairVariaveisFaltantes(modeloSelecionado.template, freshDados);
    if (faltantes.length > 0) {
      setShowComplementar(true);
      return;
    }

    const conteudoFinal = substituirVariaveis(modeloSelecionado.template, freshDados, dadosEscritorio, valoresVazio, dadosContrato);

    try {
      const blob = await pdf(<ContratoPDF conteudo={conteudoFinal} titulo={titulo} escritorio={dadosEscritorio} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${titulo.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await createContrato.mutateAsync({
        cliente_id: clienteId,
        titulo,
        tipo_contrato: "procuracao",
        conteudo_final: conteudoFinal,
        valores: {},
        dados_contrato: { ...dadosContrato },
        status: "finalizado",
      });

      toast.success("Procuração gerada com sucesso");
    } catch (error) {
      toast.error("Erro ao gerar PDF");
      console.error(error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Gerar Procuração</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-6">
          {MODELOS_PROCURACAO.length > 1 && (
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Select value={modeloId} onValueChange={setModeloId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {MODELOS_PROCURACAO.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {leads?.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {clienteSelecionado && (
            <ClienteDataPanel
              cliente={{
                id: clienteSelecionado.id,
                cpf: clienteSelecionado.cpf,
                rg: clienteSelecionado.rg,
                nacionalidade: clienteSelecionado.nacionalidade,
                profissao: clienteSelecionado.profissao,
                estado_civil: clienteSelecionado.estado_civil || clienteSelecionado.situacao_atual,
                endereco_completo: clienteSelecionado.endereco_completo,
                endereco_cep: clienteSelecionado.endereco_cep,
                endereco_cidade: clienteSelecionado.endereco_cidade,
                endereco_estado: clienteSelecionado.endereco_estado,
              }}
            />
          )}

          {camposFaltantes.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Dados incompletos do cliente</p>
                <p>Campos faltantes: {camposFaltantes.join(", ")}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Procuração - Maria Silva" />
          </div>

          <div className="space-y-2">
            <Label>Finalidade *</Label>
            <Input
              value={dadosContrato.objeto}
              onChange={(e) => setDadosContrato({ ...dadosContrato, objeto: e.target.value })}
              placeholder="Ex: Ação de Divórcio Consensual"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={dadosContrato.cidade}
                onChange={(e) => setDadosContrato({ ...dadosContrato, cidade: e.target.value })}
                placeholder={dadosEscritorio.cidade || "Cidade"}
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={dadosContrato.data_contrato}
                onChange={(e) => setDadosContrato({ ...dadosContrato, data_contrato: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={handleSalvarRascunho} disabled={createContrato.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Rascunho
            </Button>
            <Button className="flex-1" onClick={handleGerarPDF} disabled={createContrato.isPending}>
              <FileDown className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <ContratoPreview conteudo={conteudoPreview} titulo={titulo || "Preview da Procuração"} />

      <ComplementarDadosDialog
        open={showComplementar}
        onOpenChange={setShowComplementar}
        clienteId={clienteId}
        camposFaltantes={camposFaltantes}
        onComplete={async () => {
          setShowComplementar(false);
          await handleGerarPDF();
        }}
      />
    </div>
  );
}
