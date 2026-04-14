import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Info } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateDespesa } from "@/hooks/useDespesas";
import { useProcessos } from "@/hooks/useProcessos";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORIA_DESPESA_LABELS,
  FORMA_PAGAMENTO_RECEBIDO_LABELS,
  STATUS_DESPESA_LABELS,
  CONTA_LABELS,
} from "@/types/financeiro";
import type {
  Despesa,
  CategoriaDespesa,
  StatusDespesa,
  FormaPagamentoRecebido,
} from "@/types/financeiro";
import { useOpcoesSistema } from "@/hooks/useOpcoesSistema";
import { toast } from "@/lib/toast";

interface NewDespesaDialogProps {
  open: boolean;
  onClose: () => void;
  /**
   * Despesa existente para pre-preencher o form (fluxo "Duplicar").
   * Os valores sao copiados mas o id e a data de pagamento nao — o
   * usuario confirma e cria um novo lancamento. Pass null para novo.
   */
  initialData?: Despesa | null;
}

export function NewDespesaDialog({ open, onClose, initialData }: NewDespesaDialogProps) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState<Date | undefined>(new Date());
  const [categoria, setCategoria] = useState<CategoriaDespesa | "">("");
  const [processoId, setProcessoId] = useState<string>("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamentoRecebido | "">("");
  const [status, setStatus] = useState<StatusDespesa>("pendente");
  const [observacoes, setObservacoes] = useState("");
  const [conta, setConta] = useState("escritorio");

  // Parcelas — default 1 parcela (comportamento antigo inalterado).
  const [numeroParcelas, setNumeroParcelas] = useState<number>(1);
  const [intervaloDias, setIntervaloDias] = useState<number>(30);
  // Entrada (sinal): valor pago "a vista" antes das parcelas. Tipico
  // de cartao de credito parcelado com entrada. Opcional.
  const [entrada, setEntrada] = useState<string>("");
  // Quando o usuario ja interagiu manualmente com o numero de parcelas,
  // nao sobrescrevemos ao mudar a forma de pagamento.
  const [parcelasTocadas, setParcelasTocadas] = useState(false);

  // Auto-sugestao: quando a forma de pagamento e "cartao", promove
  // default de parcelas para 2 (sugere parcelamento). Se o usuario ja
  // editou o numero de parcelas manualmente, respeita a escolha.
  useEffect(() => {
    if (!parcelasTocadas && formaPagamento === "cartao" && numeroParcelas === 1) {
      setNumeroParcelas(2);
    }
  }, [formaPagamento, parcelasTocadas, numeroParcelas]);

  const createDespesa = useCreateDespesa();
  const queryClient = useQueryClient();
  const { data: processos } = useProcessos({ status: undefined });
  const { data: categoriasDespesaDb } = useOpcoesSistema("categoria_despesa", true);

  const categoriasEntries =
    categoriasDespesaDb && categoriasDespesaDb.length > 0
      ? categoriasDespesaDb.map((o) => [o.valor, o.label] as [string, string])
      : Object.entries(CATEGORIA_DESPESA_LABELS);

  // Pre-preencher do initialData quando o dialog abre com despesa existente.
  useEffect(() => {
    if (initialData && open) {
      setDescricao(initialData.descricao || "");
      setValor(initialData.valor?.toString() || "");
      // Data de competencia: usamos a data de hoje como default, nao a
      // da despesa original (duplicar significa criar novo lancamento).
      setData(new Date());
      setCategoria(initialData.categoria);
      setProcessoId(initialData.processo_id || "");
      setFormaPagamento(initialData.forma_pagamento || "");
      // Status: novo lancamento comeca como pendente independente do original.
      setStatus("pendente");
      setObservacoes(initialData.observacoes || "");
      setConta(initialData.conta || "escritorio");
      setNumeroParcelas(1);
      setIntervaloDias(30);
      setEntrada("");
      setParcelasTocadas(false);
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!descricao || !valor || !data || !categoria) {
      return;
    }

    const valorNumerico = parseFloat(valor);
    if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error("Informe um valor válido maior que zero");
      return;
    }

    const n = Math.max(1, Math.floor(numeroParcelas));
    const entradaNumerica = (() => {
      const v = parseFloat(entrada);
      return Number.isFinite(v) && v > 0 ? v : 0;
    })();

    if (entradaNumerica >= valorNumerico) {
      toast.error("A entrada não pode ser maior ou igual ao valor total");
      return;
    }

    // Caso simples (1 parcela e sem entrada): preserva o comportamento antigo 100%.
    if (n === 1 && entradaNumerica === 0) {
      createDespesa.mutate(
        {
          descricao,
          valor: valorNumerico,
          data: format(data, "yyyy-MM-dd"),
          categoria,
          processo_id: processoId || null,
          forma_pagamento: formaPagamento || null,
          status,
          observacoes: observacoes || null,
          anexo_url: null,
          conta,
        },
        {
          onSuccess: () => {
            handleClose();
            createDespesa.reset();
          },
          onError: () => {
            createDespesa.reset();
          },
        },
      );
      return;
    }

    // Caso com entrada: cria 1 lancamento de entrada (hoje, status=pago)
    // ANTES das parcelas. E feito aqui no frontend porque a RPC atomica
    // ainda nao suporta p_entrada — fica para uma migration futura.
    // Se este insert falhar, abortamos sem criar as parcelas.
    if (entradaNumerica > 0) {
      try {
        await createDespesa.mutateAsync({
          descricao: `${descricao} — Entrada`,
          valor: entradaNumerica,
          data: format(new Date(), "yyyy-MM-dd"),
          categoria,
          processo_id: processoId || null,
          forma_pagamento: formaPagamento || null,
          status: "pago",
          observacoes: observacoes
            ? `${observacoes}\n[Entrada de despesa parcelada]`
            : "[Entrada de despesa parcelada]",
          anexo_url: null,
          conta,
        });
      } catch (err) {
        createDespesa.reset();
        toast.error(
          "Erro ao registrar entrada: " +
            (err instanceof Error ? err.message : "desconhecido"),
        );
        return;
      }
    }

    const valorRestante = valorNumerico - entradaNumerica;

    // Se sobrar apenas a entrada (n=1 com entrada), ja foi persistida acima.
    if (n === 1) {
      toast.success("Entrada registrada");
      queryClient.invalidateQueries({ queryKey: ["despesas"] });
      queryClient.invalidateQueries({ queryKey: ["kpis-despesas"] });
      queryClient.invalidateQueries({ queryKey: ["despesas-por-categoria"] });
      handleClose();
      createDespesa.reset();
      return;
    }

    // Multi-parcela sobre `valorRestante`: preferimos a RPC create_despesa_atomica
    // que cria as N despesas numa unica transacao Postgres. Se a RPC
    // nao estiver disponivel (ambiente staging ou migration nao
    // aplicada), cai no fallback antigo de for-loop sequencial.
    try {
      const { error: rpcError } = await (supabase as any).rpc(
        "create_despesa_atomica",
        {
          p_descricao: descricao,
          p_valor_total: valorRestante,
          p_data_primeira: format(data, "yyyy-MM-dd"),
          p_categoria: categoria,
          p_conta: conta,
          p_numero_parcelas: n,
          p_intervalo_dias: intervaloDias,
          p_processo_id: processoId || null,
          p_forma_pagamento: formaPagamento || null,
          p_status_primeira: status,
          p_observacoes: observacoes || null,
        },
      );

      if (rpcError) throw rpcError;

      queryClient.invalidateQueries({ queryKey: ["despesas"] });
      queryClient.invalidateQueries({ queryKey: ["kpis-despesas"] });
      queryClient.invalidateQueries({ queryKey: ["despesas-por-categoria"] });
      toast.success(
        entradaNumerica > 0
          ? `Entrada + ${n} parcelas criadas com sucesso`
          : `${n} parcelas de despesa criadas com sucesso`,
      );
      handleClose();
      return;
    } catch (rpcErr) {
      console.warn(
        "RPC create_despesa_atomica indisponivel, usando fallback sequencial:",
        rpcErr,
      );
    }

    // Fallback legado: for-loop mutateAsync sobre valorRestante.
    const valorParcelaBase = Math.round((valorRestante / n) * 100) / 100;
    const somaBase = valorParcelaBase * (n - 1);
    const ultimaParcela = Math.round((valorRestante - somaBase) * 100) / 100;

    try {
      for (let i = 0; i < n; i++) {
        const dataParcela = addDays(data, i * intervaloDias);
        const valorParcela = i === n - 1 ? ultimaParcela : valorParcelaBase;
        await createDespesa.mutateAsync({
          descricao: `${descricao} (${i + 1}/${n})`,
          valor: valorParcela,
          data: format(dataParcela, "yyyy-MM-dd"),
          categoria,
          processo_id: processoId || null,
          forma_pagamento: formaPagamento || null,
          status: i === 0 ? status : "pendente",
          observacoes: observacoes || null,
          anexo_url: null,
          conta,
        });
      }
      toast.success(
        entradaNumerica > 0
          ? `Entrada + ${n} parcelas criadas com sucesso`
          : `${n} parcelas de despesa criadas com sucesso`,
      );
      handleClose();
      createDespesa.reset();
    } catch (error) {
      createDespesa.reset();
      toast.error(
        "Erro ao criar parcelas: " +
          (error instanceof Error ? error.message : "desconhecido"),
      );
    }
  };

  const handleClose = () => {
    setDescricao("");
    setValor("");
    setData(new Date());
    setCategoria("");
    setProcessoId("");
    setFormaPagamento("");
    setStatus("pendente");
    setObservacoes("");
    setConta("escritorio");
    setNumeroParcelas(1);
    setIntervaloDias(30);
    setEntrada("");
    setParcelasTocadas(false);
    onClose();
  };

  const modoDuplicacao = !!initialData;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modoDuplicacao ? "Duplicar Despesa" : "Nova Despesa"}</DialogTitle>
          {modoDuplicacao && (
            <DialogDescription>
              Os dados foram copiados da despesa original. Ajuste o que for necessário e salve
              para criar um novo lançamento.
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Aluguel do escritório"
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                required
              />
              {numeroParcelas > 1 && valor && (
                <p className="text-xs text-muted-foreground">
                  Cada parcela: R${" "}
                  {(parseFloat(valor) / numeroParcelas).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  (última ajusta diferença)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data de Competência *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data ? format(data, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={data}
                    onSelect={setData}
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                {numeroParcelas > 1
                  ? "Vencimento da 1ª parcela"
                  : "Mês de referência da despesa"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select
                value={categoria}
                onValueChange={(value) => setCategoria(value as CategoriaDespesa)}
                required
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasEntries.map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="processo">Processo (opcional)</Label>
              <Select
                value={processoId || "none"}
                onValueChange={(val) => setProcessoId(val === "none" ? "" : val)}
              >
                <SelectTrigger id="processo">
                  <SelectValue placeholder="Nenhum" />
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
              <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
              <Select
                value={formaPagamento || "none"}
                onValueChange={(value) =>
                  setFormaPagamento(value === "none" ? "" : (value as FormaPagamentoRecebido))
                }
              >
                <SelectTrigger id="forma_pagamento">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não informado</SelectItem>
                  {Object.entries(FORMA_PAGAMENTO_RECEBIDO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status de Pagamento</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as StatusDespesa)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_DESPESA_LABELS).map(([key, label]) => (
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
                <SelectTrigger id="conta">
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
          </div>

          {/*
            Parcelamento — quando forma_pagamento = cartao, mudamos a
            linguagem para deixar claro que e parcelamento de cartao
            (com possibilidade de entrada), e destacamos a borda.
          */}
          <div
            className={cn(
              "rounded-lg border p-3 space-y-3",
              formaPagamento === "cartao"
                ? "bg-primary/5 border-primary/40"
                : "bg-muted/20",
            )}
          >
            <div className="flex items-center justify-between gap-2 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                {formaPagamento === "cartao"
                  ? "Parcelamento no cartão"
                  : "Parcelamento (opcional)"}
              </div>
              {formaPagamento === "cartao" && numeroParcelas === 1 && (
                <span className="text-xs text-primary/80">
                  Dica: cartão costuma ser parcelado
                </span>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="numero_parcelas">Número de parcelas</Label>
                <Input
                  id="numero_parcelas"
                  type="number"
                  min="1"
                  max="60"
                  value={numeroParcelas}
                  onChange={(e) => {
                    setParcelasTocadas(true);
                    setNumeroParcelas(parseInt(e.target.value) || 1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervalo_dias">Intervalo (dias)</Label>
                <Input
                  id="intervalo_dias"
                  type="number"
                  min="1"
                  max="365"
                  value={intervaloDias}
                  onChange={(e) => setIntervaloDias(parseInt(e.target.value) || 30)}
                  disabled={numeroParcelas <= 1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entrada">Entrada (sinal)</Label>
                <Input
                  id="entrada"
                  type="number"
                  step="0.01"
                  min="0"
                  value={entrada}
                  onChange={(e) => setEntrada(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>

            {numeroParcelas > 1 && (
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const ent = parseFloat(entrada) || 0;
                  const total = parseFloat(valor) || 0;
                  const rest = Math.max(0, total - ent);
                  const porParcela = numeroParcelas > 0 ? rest / numeroParcelas : 0;
                  const info = ent > 0
                    ? `Entrada de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(ent)} paga hoje + `
                    : "";
                  const detalhe = total > 0
                    ? ` (${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(porParcela)} por parcela)`
                    : "";
                  return `${info}${numeroParcelas} parcelas a cada ${intervaloDias} dias${detalhe}. Apenas a 1ª parcela herda o status; as demais ficam como Pendente.`;
                })()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre a despesa..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createDespesa.isPending}>
              {createDespesa.isPending
                ? "Salvando..."
                : numeroParcelas > 1
                  ? `Salvar ${numeroParcelas} parcelas`
                  : modoDuplicacao
                    ? "Duplicar"
                    : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
