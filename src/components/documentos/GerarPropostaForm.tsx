import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Loader2 } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { MODELOS_PROPOSTA } from "@/lib/propostaTemplates";
import { PropostaPreview } from "./PropostaPreview";
import { PropostaPDF } from "./PropostaPDF";
import { pdf } from '@react-pdf/renderer';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const GerarPropostaForm = () => {
  const [modeloSelecionado, setModeloSelecionado] = useState<string>("");
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("");
  const [descricaoServico, setDescricaoServico] = useState<string>("");
  const [valorEntrada, setValorEntrada] = useState<number>(0);
  const [descontoAvista, setDescontoAvista] = useState<number>(0);
  const [percentualExito, setPercentualExito] = useState<number>(0);
  const [condicoesAdicionais, setCondicoesAdicionais] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Buscar leads (clientes potenciais)
  const { data: leads = [], isLoading: leadsLoading } = useLeads({
    search: '',
    status: [],
    origem: [],
    tipoProcesso: [],
    dateRange: { start: null, end: null },
    diasParado: { min: 0, max: null },
    responsavel: null,
    statusCliente: [],
  });

  const clienteData = useMemo(() => {
    const cliente = leads.find(l => l.id === clienteSelecionado);
    return {
      nome: cliente?.nome_completo || '',
      cpf: cliente?.cpf || '',
    };
  }, [leads, clienteSelecionado]);

  const clienteNome = clienteData.nome;
  const clienteCPF = clienteData.cpf;

  const handleModeloChange = (modeloId: string) => {
    setModeloSelecionado(modeloId);
    const modelo = MODELOS_PROPOSTA.find(m => m.id === modeloId);
    if (modelo) {
      setDescricaoServico(modelo.servico_padrao);
    }
  };

  const handleClienteChange = (clienteId: string) => {
    setClienteSelecionado(clienteId);
    const cliente = leads.find(l => l.id === clienteId);
    if (cliente) {
      // Tentar determinar o modelo baseado no tipo de processo
      const tipoProcesso = cliente.tipo_processo?.toLowerCase() || '';
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
    if (!clienteSelecionado || !descricaoServico) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await pdf(
        <PropostaPDF
          clienteNome={clienteNome}
          clienteCPF={clienteCPF}
          descricaoServico={descricaoServico}
          valorEntrada={valorEntrada}
          descontoAvista={descontoAvista}
          percentualExito={percentualExito}
          condicoesAdicionais={condicoesAdicionais}
        />
      ).toBlob();

      // Download do PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Proposta_${clienteNome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Salvar proposta no banco de dados
      const { error: saveError } = await supabase.from('contratos_gerados').insert({
        cliente_id: clienteSelecionado,
        titulo: `Proposta - ${clienteNome}`,
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
      });

      if (saveError) {
        console.error('Erro ao salvar proposta:', saveError);
        toast.warning("Proposta gerada, mas houve erro ao salvar no histórico");
      } else {
        toast.success("Proposta gerada e salva com sucesso!");
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
      {/* Formulário */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configurar Proposta
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-6">
          {/* Cliente */}
          <div className="space-y-2">
            <Label>Cliente (Lead) *</Label>
            <Select value={clienteSelecionado} onValueChange={handleClienteChange}>
              <SelectTrigger>
                <SelectValue placeholder={leadsLoading ? "Carregando..." : "Selecione o cliente"} />
              </SelectTrigger>
              <SelectContent>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.nome_completo} - {lead.tipo_processo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Modelo */}
          <div className="space-y-2">
            <Label>Modelo de Proposta</Label>
            <Select value={modeloSelecionado} onValueChange={handleModeloChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                {MODELOS_PROPOSTA.map((modelo) => (
                  <SelectItem key={modelo.id} value={modelo.id}>
                    {modelo.nome}
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
            size="lg"
            disabled={isGenerating || !clienteSelecionado || !descricaoServico}
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
        clienteNome={clienteNome}
        clienteCPF={clienteCPF}
        descricaoServico={descricaoServico}
        valorEntrada={valorEntrada}
        descontoAvista={descontoAvista}
        percentualExito={percentualExito}
        condicoesAdicionais={condicoesAdicionais}
      />
    </div>
  );
};
