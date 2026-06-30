import { useState } from "react";
import { toast } from "@/lib/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { useCreateAcordo } from "@/hooks/useFinanceiro";
import { useLeads } from "@/hooks/useLeads";
import { useProcessos } from "@/hooks/useProcessos";
import { format } from "date-fns";
import { 
  TIPO_ENTRADA_FATURAMENTO_LABELS, 
  FORMA_PAGAMENTO_RECEBIDO_LABELS,
  CONTA_LABELS,
  type TipoEntradaFaturamento,
  type FormaPagamentoRecebido 
} from "@/types/financeiro";
import { AcordoForm } from "./AcordoForm";
import { FileText, Receipt, DollarSign, RotateCcw } from "lucide-react";

interface NewEntradaFaturamentoDialogProps {
  open: boolean;
  onClose: () => void;
}

const TIPO_ICONS: Record<TipoEntradaFaturamento, React.ReactNode> = {
  acordo: <FileText className="h-4 w-4" />,
  receita_avulsa: <Receipt className="h-4 w-4" />,
  adiantamento: <DollarSign className="h-4 w-4" />,
  reembolso: <RotateCcw className="h-4 w-4" />,
};

const TIPO_DESCRIPTIONS: Record<TipoEntradaFaturamento, string> = {
  acordo: "Contrato com parcelas e vencimentos definidos",
  receita_avulsa: "Entrada única sem vínculo a acordo (consultoria, êxito)",
  adiantamento: "Valor antecipado pelo cliente",
  reembolso: "Reembolso de despesas do cliente",
};

export function NewEntradaFaturamentoDialog({ open, onClose }: NewEntradaFaturamentoDialogProps) {
  // Fluxo único: abre o card, escolhe o tipo no seletor de cima e o
  // formulário correspondente aparece logo abaixo (sem telas intermediárias
  // nem modal separado para contrato).
  const [tipo, setTipo] = useState<TipoEntradaFaturamento>("acordo");

  const handleClose = () => {
    setTipo("acordo");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Entrada de Faturamento</DialogTitle>
          <DialogDescription>
            Selecione o tipo de entrada e preencha os dados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de entrada</Label>
            <ToggleGroup
              type="single"
              value={tipo}
              onValueChange={(v) => v && setTipo(v as TipoEntradaFaturamento)}
              variant="outline"
              className="grid grid-cols-2 sm:grid-cols-4 gap-2"
            >
              {(Object.keys(TIPO_ENTRADA_FATURAMENTO_LABELS) as TipoEntradaFaturamento[]).map((t) => (
                <ToggleGroupItem
                  key={t}
                  value={t}
                  className="flex h-auto flex-col items-center gap-1.5 py-3 data-[state=on]:border-primary data-[state=on]:bg-primary/10"
                >
                  <span className="text-primary">{TIPO_ICONS[t]}</span>
                  <span className="text-xs font-medium text-center leading-tight">
                    {TIPO_ENTRADA_FATURAMENTO_LABELS[t]}
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">{TIPO_DESCRIPTIONS[tipo]}</p>
          </div>

          {tipo === "acordo" ? (
            <AcordoForm onClose={handleClose} />
          ) : (
            <EntradaSimplesForm key={tipo} tipo={tipo} onClose={handleClose} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface EntradaSimplesFormProps {
  tipo: TipoEntradaFaturamento;
  onClose: () => void;
}

function EntradaSimplesForm({ tipo, onClose }: EntradaSimplesFormProps) {
  const [formKey, setFormKey] = useState(0);
  const { data: leads } = useLeads({
    search: "",
    status: [],
    origem: [],
    tipoProcesso: [],
    dateRange: { start: null, end: null },
    diasParado: { min: 0, max: null },
    responsavel: null,
    statusCliente: [],
  });

  const [clienteId, setClienteId] = useState("");
  const [processoId, setProcessoId] = useState("");
  // Filtra os processos pelo cliente selecionado. Antes, o select de
  // processo mostrava TODOS os processos do escritorio, independente
  // do cliente — usuario podia anexar a entrada ao processo errado.
  const { data: processos } = useProcessos(
    clienteId
      ? { status: [], cliente_id: clienteId }
      : { status: [] },
  );
  const createAcordo = useCreateAcordo();
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dataRecebimento, setDataRecebimento] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dataCompetencia, setDataCompetencia] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamentoRecebido>("pix");
  const [observacoes, setObservacoes] = useState("");
  const [conta, setConta] = useState("escritorio");

  const resetForm = () => {
    setClienteId("");
    setProcessoId("");
    setDescricao("");
    setValor("");
    setDataRecebimento(format(new Date(), "yyyy-MM-dd"));
    setDataCompetencia(format(new Date(), "yyyy-MM-dd"));
    setFormaPagamento("pix");
    setObservacoes("");
    setConta("escritorio");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      toast.error("Informe um valor válido maior que zero");
      return;
    }

    createAcordo.mutate(
      {
        cliente_id: clienteId,
        processo_id: processoId && processoId !== "none" ? processoId : null,
        tipo_servico: `${TIPO_ENTRADA_FATURAMENTO_LABELS[tipo]}${descricao ? ` - ${descricao}` : ''}`,
        valor_total: Math.round(valorNum * 100) / 100,
        forma_pagamento: 'a_vista',
        numero_parcelas: 1,
        data_primeiro_vencimento: dataCompetencia,
        observacoes: observacoes || null,
        conta,
        parcelas: [{
          numero_parcela: 1,
          valor: Math.round(valorNum * 100) / 100,
          data_vencimento: dataCompetencia,
          data_pagamento: dataRecebimento,
          valor_pago: Math.round(valorNum * 100) / 100,
          forma_pagamento_recebido: formaPagamento,
          status: 'pago',
        }],
      },
      {
        onSuccess: () => {
          resetForm();
          // Force the entire form to remount (Lovable fix) so any
          // controlled-input state held by Radix/select internals is wiped.
          setFormKey((k) => k + 1);
          // Also clear React Query's mutation bookkeeping so repeated
          // submissions (the 3rd/4th in a row) don't short-circuit on a
          // stale "success" frame.
          createAcordo.reset();
          onClose();
        },
        onError: (error: any) => {
          // Also reset on error so the user can retry without the previous
          // error state blocking the button.
          createAcordo.reset();
          toast.error(error?.message || "Erro ao registrar entrada de faturamento");
        },
      }
    );
  };

  return (
    <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cliente">Cliente *</Label>
        <SearchableCombobox
          value={clienteId}
          onChange={(novoCliente) => {
            setClienteId(novoCliente);
            // Reset processo: o selecionado anteriormente provavelmente
            // pertence a outro cliente. Forca o usuario a reescolher
            // dentro do novo escopo filtrado.
            setProcessoId("");
          }}
          options={(leads ?? []).map((lead) => ({
            value: lead.id,
            label: lead.nome_completo,
          }))}
          placeholder="Selecione o cliente"
          searchPlaceholder="Digite o nome do cliente..."
          emptyText="Nenhum cliente encontrado."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="processo">Processo (opcional)</Label>
        <Select
          value={processoId}
          onValueChange={setProcessoId}
          disabled={!clienteId}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                clienteId
                  ? processos && processos.length > 0
                    ? "Vincular a um processo"
                    : "Cliente sem processos cadastrados"
                  : "Selecione o cliente primeiro"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {processos?.map((processo) => (
              <SelectItem key={processo.id} value={processo.id}>
                {processo.numero_processo || processo.tipo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Input
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder={`Ex: ${tipo === 'receita_avulsa' ? 'Consultoria jurídica' : tipo === 'adiantamento' ? 'Adiantamento processo inventário' : 'Reembolso custas processuais'}`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valor">Valor *</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            min="0"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            required
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data">Data de Recebimento *</Label>
          <Input
            id="data"
            type="date"
            value={dataRecebimento}
            onChange={(e) => setDataRecebimento(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="data_competencia">Data de Competência</Label>
        <Input
          id="data_competencia"
          type="date"
          value={dataCompetencia}
          onChange={(e) => setDataCompetencia(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Mês de referência do pagamento (se diferente da data de recebimento)</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
        <Select value={formaPagamento} onValueChange={(v) => setFormaPagamento(v as FormaPagamentoRecebido)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FORMA_PAGAMENTO_RECEBIDO_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="conta">Conta *</Label>
        <Select value={conta} onValueChange={setConta}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CONTA_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Observações adicionais..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createAcordo.isPending || !clienteId || !valor}>
          {createAcordo.isPending ? "Registrando..." : "Registrar Entrada"}
        </Button>
      </div>
    </form>
  );
}
