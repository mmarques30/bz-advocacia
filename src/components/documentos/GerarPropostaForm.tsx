import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Loader2, Sparkles } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { MODELOS_PROPOSTA } from "@/lib/propostaTemplates";
import { PropostaPreview } from "./PropostaPreview";
import { PropostaPDF } from "./PropostaPDF";
import { ClienteDataPanel } from "./ClienteDataPanel";
import { pdf } from '@react-pdf/renderer';
import { toast } from "@/lib/toast";
import { supabase } from "@/integrations/supabase/client";
import { useModelosPersonalizados, ModeloConteudo } from "@/hooks/useModelosDocumentos";
import { atualizarLeadParaPropostaEnviada } from "@/lib/leadStatusAutomation";
import { useQueryClient } from "@tanstack/react-query";

export const GerarPropostaForm = () => {
  const queryClient = useQueryClient();
  const [modeloSelecionado, setModeloSelecionado] = useState<string>("");
  const [leadSelecionado, setLeadSelecionado] = useState<string>("");
  const [descricaoServico, setDescricaoServico] = useState<string>("");
  const [valorEntrada, setValorEntrada] = useState<number>(0);
  const [descontoAvista, setDescontoAvista] = useState<number>(0);
  const [percentualExito, setPercentualExito] = useState<number>(0);
  const [condicoesAdicionais, setCondicoesAdicionais] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: allLeads = [], isLoading: leadsLoading } = useLeads({
    search: '',
    status: [],
    origem: [],
    tipoProcesso: [],
    dateRange: { start: null, end: null },
    diasParado: { min: 0, max: null },
    responsavel: null,
    statusCliente: [],
  });

  // Filtrar apenas leads (não-fechados) para propostas
  const leads = useMemo(() => allLeads.filter(l => l.estagio !== 'fechado'), [allLeads]);

  const { data: modelosPersonalizados = [] } = useModelosPersonalizados('proposta');

  const todosModelos = useMemo(() => {
    const modelosDB = modelosPersonalizados.map(m => {
      let conteudo: ModeloConteudo = { servico_padrao: '', tipo_modelo: 'proposta', fonte: 'upload_ia' };
      try {
        conteudo = JSON.parse(m.conteudo);
      } catch {}
      
      return {
        id: m.id,
        nome: m.nome,
        tipo: m.categoria || 'civel',
        descricao: m.descricao || '',
        servico_padrao: conteudo.servico_padrao,
        isCustom: true,
      };
    });
    
    return [...modelosDB, ...MODELOS_PROPOSTA.map(m => ({ ...m, isCustom: false }))];
  }, [modelosPersonalizados]);

  const leadData = useMemo(() => {
    return leads.find(l => l.id === leadSelecionado);
  }, [leads, leadSelecionado]);

  const leadNome = leadData?.nome_completo || '';
  const leadCPF = leadData?.cpf || '';

  const ESTAGIO_LABELS: Record<string, string> = {
    novo: 'Novo',
    contato_inicial: 'Enviado',
    em_analise: 'Qualificado',
    proposta_enviada: 'Proposta Enviada',
    perdido: 'Perdido',
  };

  const handleModeloChange = (modeloId: string) => {
    setModeloSelecionado(modeloId);
    const modelo = todosModelos.find(m => m.id === modeloId);
    if (modelo) {
      setDescricaoServico(modelo.servico_padrao);
    }
  };

  const handleLeadChange = (leadId: string) => {
    setLeadSelecionado(leadId);
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      const tipoProcesso = lead.tipo_processo?.toLowerCase() || '';
      if (tipoProcesso.includes('divórcio') || tipoProcesso.includes('divorcio')) {
        handleModeloChange('proposta-divorcio');
      } else if (tipoProcesso.includes('inventário') || tipoProcesso.includes('inventario')) {
        handleModeloChange('proposta-inventario');
      } else if (tipoProcesso.includes('indenização') || tipoProcesso.includes('indenizacao')) {
        handleModeloChange('proposta-indenizacao');
      }
    }
  };

  const handleGerarPDF = async () => {
    if (!leadSelecionado || !descricaoServico) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await pdf(
        <PropostaPDF
          clienteNome={leadNome}
          clienteCPF={leadCPF}
          descricaoServico={descricaoServico}
          valorEntrada={valorEntrada}
          descontoAvista={descontoAvista}
          percentualExito={percentualExito}
          condicoesAdicionais={condicoesAdicionais}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Proposta_${leadNome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const { data: savedProposta, error: saveError } = await supabase.from('contratos_gerados').insert({
        cliente_id: leadSelecionado,
        titulo: `Proposta - ${leadNome}`,
        tipo_contrato: 'proposta',
        conteudo_final: descricaoServico,
        valores: {
          valor_entrada: valorEntrada,
          desconto_avista: descontoAvista,
          percentual_exito: percentualExito,
        },
        dados_contrato: {
          condicoes_adicionais: condicoesAdicionais,
        },
        status: 'finalizado',
      }).select('numero_proposta').single();

      if (saveError) {
        console.error('Erro ao salvar proposta:', saveError);
        toast.warning("Proposta gerada, mas houve erro ao salvar no histórico");
      } else {
        const numeroProposta = savedProposta?.numero_proposta;
        await atualizarLeadParaPropostaEnviada(leadSelecionado, 'proposta', queryClient);
        toast.success(numeroProposta 
          ? `Proposta #${numeroProposta} gerada e salva com sucesso!`
          : "Proposta gerada e salva com sucesso!"
        );
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error("Erro ao gerar proposta");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configurar Proposta
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-6">
          {/* Lead */}
          <div className="space-y-2">
            <Label>Lead *</Label>
            <Select value={leadSelecionado} onValueChange={handleLeadChange}>
              <SelectTrigger>
                <SelectValue placeholder={leadsLoading ? "Carregando..." : "Selecione o lead"} />
              </SelectTrigger>
              <SelectContent>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    <span className="flex items-center gap-1">
                      {lead.nome_completo} - {lead.tipo_processo}
                      <span className="text-xs text-muted-foreground ml-1">
                        · {ESTAGIO_LABELS[lead.estagio] || lead.estagio}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Propostas são geradas para leads em fase de negociação. Após aceita, o lead é convertido em cliente.
            </p>
          </div>

          {/* Painel de dados do lead */}
          {leadData && (
            <ClienteDataPanel
              cliente={{
                id: leadData.id,
                cpf: leadData.cpf,
                rg: leadData.rg,
                nacionalidade: leadData.nacionalidade,
                profissao: leadData.profissao,
                estado_civil: leadData.estado_civil || leadData.situacao_atual,
                endereco_completo: leadData.endereco_completo,
                endereco_cep: (leadData as unknown as { endereco_cep?: string }).endereco_cep,
                endereco_cidade: (leadData as unknown as { endereco_cidade?: string }).endereco_cidade,
                endereco_estado: (leadData as unknown as { endereco_estado?: string }).endereco_estado,
              }}
            />
          )}

          {/* Modelo */}
          <div className="space-y-2">
            <Label>Modelo de Proposta</Label>
            <Select value={modeloSelecionado} onValueChange={handleModeloChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                {todosModelos.map((modelo) => (
                  <SelectItem key={modelo.id} value={modelo.id}>
                    <span className="flex items-center gap-2">
                      {modelo.isCustom && <Sparkles className="h-3 w-3 text-primary" />}
                      {modelo.nome}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição do Serviço */}
          <div className="space-y-2">
            <Label>Descrição do Serviço *</Label>
            <Textarea
              value={descricaoServico}
              onChange={(e) => setDescricaoServico(e.target.value)}
              placeholder="Descreva os serviços a serem prestados..."
              rows={3}
            />
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor da Entrada (R$)</Label>
              <Input
                type="number"
                value={valorEntrada || ''}
                onChange={(e) => setValorEntrada(Number(e.target.value))}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Desconto à Vista (%)</Label>
              <Input
                type="number"
                value={descontoAvista || ''}
                onChange={(e) => setDescontoAvista(Number(e.target.value))}
                placeholder="0"
                max={100}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Percentual de Êxito (%)</Label>
            <Input
              type="number"
              value={percentualExito || ''}
              onChange={(e) => setPercentualExito(Number(e.target.value))}
              placeholder="0"
              max={100}
            />
            <p className="text-xs text-muted-foreground">
              Percentual sobre o valor obtido na ação (se aplicável)
            </p>
          </div>

          {/* Condições Adicionais */}
          <div className="space-y-2">
            <Label>Condições Adicionais</Label>
            <Textarea
              value={condicoesAdicionais}
              onChange={(e) => setCondicoesAdicionais(e.target.value)}
              placeholder="Condições especiais de pagamento, observações..."
              rows={2}
            />
          </div>

          {/* Botão Gerar */}
          <Button 
            onClick={handleGerarPDF} 
            className="w-full" 
            size="default"
            disabled={isGenerating || !leadSelecionado || !descricaoServico}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Gerar Proposta em PDF
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <PropostaPreview
        clienteNome={leadNome}
        clienteCPF={leadCPF}
        descricaoServico={descricaoServico}
        valorEntrada={valorEntrada}
        descontoAvista={descontoAvista}
        percentualExito={percentualExito}
        condicoesAdicionais={condicoesAdicionais}
      />
    </div>
  );
};
