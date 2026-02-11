import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useConfiguracoesEscritorio } from "@/hooks/useConfiguracoesEscritorio";
import { useCreateContrato } from "@/hooks/useContratos";
import { MODELOS_CONTRATO } from "@/lib/contratoTemplates";
import { ValoresContrato, DadosContrato, DadosCliente } from "@/types/contratos";
import { substituirVariaveis, extrairVariaveisFaltantes } from "@/lib/contratoUtils";
import { ContratoPreview } from "./ContratoPreview";
import { ComplementarDadosDialog } from "./ComplementarDadosDialog";
import { useModelosPersonalizados, ModeloConteudo } from "@/hooks/useModelosDocumentos";
import { Save, FileDown, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import { ContratoPDF } from "./ContratoPDF";

// Hook simples para buscar leads para o seletor
const useLeadsSimple = () => {
  return useQuery({
    queryKey: ['leads-simple'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('nome_completo', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
};

export function GerarContratoForm() {
  const { data: leads, isLoading: loadingLeads } = useLeadsSimple();
  const { configuracoes, isLoading: loadingConfig } = useConfiguracoesEscritorio();
  const createContrato = useCreateContrato();
  const { data: modelosCustom = [] } = useModelosPersonalizados('contrato');

  const [modeloId, setModeloId] = useState<string>("");
  const [clienteId, setClienteId] = useState<string>("");
  const [titulo, setTitulo] = useState("");
  const [showComplementar, setShowComplementar] = useState(false);
  
  const [valores, setValores] = useState<ValoresContrato>({
    valor_entrada: 0,
    valor_parcelas: 0,
    num_parcelas: 1,
    percentual_exito: 0,
  });

  const [dadosContrato, setDadosContrato] = useState<DadosContrato>({
    objeto: "",
    cidade: "",
    data_contrato: new Date().toISOString().split('T')[0],
  });

  // Combine custom + default models
  const todosModelos = useMemo(() => {
    const customFormatted = modelosCustom.map(m => {
      let parsed: ModeloConteudo = { servico_padrao: '', tipo_modelo: 'contrato', fonte: 'upload_ia' };
      try { parsed = JSON.parse(m.conteudo); } catch {}
      return {
        id: m.id,
        nome: m.nome,
        tipo: m.categoria || 'outro',
        descricao: m.descricao || '',
        template: parsed.servico_padrao,
        isCustom: true,
      };
    });
    const defaultFormatted = MODELOS_CONTRATO.map(m => ({ ...m, isCustom: false }));
    return [...customFormatted, ...defaultFormatted];
  }, [modelosCustom]);

  const clienteSelecionado = useMemo(() => {
    return leads?.find(l => l.id === clienteId);
  }, [leads, clienteId]);

  const modeloSelecionado = useMemo(() => {
    return todosModelos.find(m => m.id === modeloId);
  }, [modeloId, todosModelos]);

  // Auto-select model based on client's tipo_processo
  useEffect(() => {
    if (!clienteSelecionado || modeloId) return;
    const tipoProcesso = clienteSelecionado.tipo_processo;
    if (!tipoProcesso) return;
    const match = todosModelos.find(m => m.tipo === tipoProcesso);
    if (match) setModeloId(match.id);
  }, [clienteSelecionado, todosModelos, modeloId]);

  const dadosCliente: DadosCliente = useMemo(() => {
    if (!clienteSelecionado) return {} as DadosCliente;
    return {
      nome_completo: clienteSelecionado.nome_completo,
      cpf: (clienteSelecionado as unknown as { cpf?: string }).cpf,
      rg: (clienteSelecionado as unknown as { rg?: string }).rg,
      nacionalidade: (clienteSelecionado as unknown as { nacionalidade?: string }).nacionalidade || 'brasileiro(a)',
      profissao: (clienteSelecionado as unknown as { profissao?: string }).profissao,
      estado_civil: clienteSelecionado.situacao_atual,
      endereco_completo: (clienteSelecionado as unknown as { endereco_completo?: string }).endereco_completo,
      email: clienteSelecionado.email,
      telefone: clienteSelecionado.telefone,
      endereco_cidade: (clienteSelecionado as unknown as { endereco_cidade?: string }).endereco_cidade,
      endereco_estado: (clienteSelecionado as unknown as { endereco_estado?: string }).endereco_estado,
      endereco_cep: (clienteSelecionado as unknown as { endereco_cep?: string }).endereco_cep,
    };
  }, [clienteSelecionado]);

  const dadosEscritorio = useMemo(() => {
    if (!configuracoes) return {
      nome_escritorio: 'Borges & Zembruski Advocacia',
      cnpj: '',
      oab_principal: '',
      endereco_completo: '',
      telefone: '',
      email: '',
      cidade: '',
      estado: '',
    };
    return {
      nome_escritorio: configuracoes.nome_escritorio,
      cnpj: configuracoes.cnpj || '',
      oab_principal: configuracoes.oab_principal || '',
      endereco_completo: configuracoes.endereco_completo || '',
      telefone: configuracoes.telefone || '',
      email: configuracoes.email || '',
      cidade: configuracoes.cidade || '',
      estado: configuracoes.estado || '',
    };
  }, [configuracoes]);

  const conteudoPreview = useMemo(() => {
    if (!modeloSelecionado) return "";
    return substituirVariaveis(
      modeloSelecionado.template,
      dadosCliente,
      dadosEscritorio,
      valores,
      dadosContrato
    );
  }, [modeloSelecionado, dadosCliente, dadosEscritorio, valores, dadosContrato]);

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
      tipo_contrato: modeloSelecionado.tipo,
      conteudo_final: conteudoPreview,
      valores: { ...valores },
      dados_contrato: { ...dadosContrato },
      status: 'rascunho',
    });
  };

  const handleGerarPDF = async () => {
    if (!clienteId || !modeloSelecionado || !titulo) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (camposFaltantes.length > 0) {
      setShowComplementar(true);
      return;
    }

    try {
      const blob = await pdf(
        <ContratoPDF 
          conteudo={conteudoPreview}
          titulo={titulo}
          escritorio={dadosEscritorio}
        />
      ).toBlob();

      // Download direto
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${titulo.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Salvar contrato
      await createContrato.mutateAsync({
        cliente_id: clienteId,
        titulo,
        tipo_contrato: modeloSelecionado.tipo,
        conteudo_final: conteudoPreview,
        valores: { ...valores },
        dados_contrato: { ...dadosContrato },
        status: 'finalizado',
      });

      toast.success("PDF gerado e contrato salvo");
    } catch (error) {
      toast.error("Erro ao gerar PDF");
      console.error(error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulário */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Configurar Contrato</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-6">
          {/* Modelo */}
          <div className="space-y-2">
            <Label>Modelo de Contrato</Label>
            <Select value={modeloId} onValueChange={setModeloId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                {todosModelos.some(m => m.isCustom) && (
                  <SelectGroup>
                    <SelectLabel>Personalizados</SelectLabel>
                    {todosModelos.filter(m => m.isCustom).map((modelo) => (
                      <SelectItem key={modelo.id} value={modelo.id}>
                        {modelo.nome}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                <SelectGroup>
                  <SelectLabel>Padrão</SelectLabel>
                  {todosModelos.filter(m => !m.isCustom).map((modelo) => (
                    <SelectItem key={modelo.id} value={modelo.id}>
                      {modelo.nome}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label>Cliente</Label>
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

          {/* Alerta de campos faltantes */}
          {camposFaltantes.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Dados incompletos do cliente</p>
                <p>Campos faltantes: {camposFaltantes.join(', ')}</p>
              </div>
            </div>
          )}

          {/* Título */}
          <div className="space-y-2">
            <Label>Título do Contrato</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Contrato de Honorários - João Silva"
            />
          </div>

          {/* Objeto */}
          <div className="space-y-2">
            <Label>Objeto do Contrato</Label>
            <Input
              value={dadosContrato.objeto}
              onChange={(e) => setDadosContrato({ ...dadosContrato, objeto: e.target.value })}
              placeholder="Ex: Ação de Divórcio Consensual"
            />
          </div>

          {/* Valores */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Valores</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Entrada (R$)</Label>
                <Input
                  type="number"
                  value={valores.valor_entrada}
                  onChange={(e) => setValores({ ...valores, valor_entrada: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Valor Parcela (R$)</Label>
                <Input
                  type="number"
                  value={valores.valor_parcelas}
                  onChange={(e) => setValores({ ...valores, valor_parcelas: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Numero de Parcelas</Label>
                <Input
                  type="number"
                  min="1"
                  value={valores.num_parcelas}
                  onChange={(e) => setValores({ ...valores, num_parcelas: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Percentual de Exito (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={valores.percentual_exito}
                  onChange={(e) => setValores({ ...valores, percentual_exito: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Cidade e Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={dadosContrato.cidade}
                onChange={(e) => setDadosContrato({ ...dadosContrato, cidade: e.target.value })}
                placeholder={dadosEscritorio.cidade || "Cidade"}
              />
            </div>
            <div className="space-y-2">
              <Label>Data do Contrato</Label>
              <Input
                type="date"
                value={dadosContrato.data_contrato}
                onChange={(e) => setDadosContrato({ ...dadosContrato, data_contrato: e.target.value })}
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSalvarRascunho}
              disabled={createContrato.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Rascunho
            </Button>
            <Button
              className="flex-1"
              onClick={handleGerarPDF}
              disabled={createContrato.isPending}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <ContratoPreview 
        conteudo={conteudoPreview}
        titulo={titulo || "Preview do Contrato"}
      />

      {/* Dialog para complementar dados */}
      <ComplementarDadosDialog
        open={showComplementar}
        onOpenChange={setShowComplementar}
        clienteId={clienteId}
        camposFaltantes={camposFaltantes}
        onComplete={() => {
          setShowComplementar(false);
          handleGerarPDF();
        }}
      />
    </div>
  );
}
