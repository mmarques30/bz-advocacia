import { useState } from "react";
import { ChevronDown, Plus, ArrowUpRight, Ban, CheckCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreditosCondicionais, useConverterCredito, useCancelarCredito } from "@/hooks/useCreditosCondicionais";
import { STATUS_CREDITO_CONDICIONAL_LABELS, CONTA_LABELS } from "@/types/financeiro";
import type { CreditoCondicional, StatusCreditoCondicional } from "@/types/financeiro";
import { NewCreditoCondicionalDialog } from "./NewCreditoCondicionalDialog";
import { AtivarCreditoDialog } from "./AtivarCreditoDialog";

const statusVariant: Record<StatusCreditoCondicional, "default" | "secondary" | "destructive" | "outline"> = {
  backlog: "outline",
  a_receber: "secondary",
  convertido: "default",
  cancelado: "destructive",
};

export function CreditosCondicionaisSection() {
  const [newOpen, setNewOpen] = useState(false);
  const [ativarCredito, setAtivarCredito] = useState<CreditoCondicional | null>(null);
  const { data: creditos, isLoading } = useCreditosCondicionais();
  const converter = useConverterCredito();
  const cancelar = useCancelarCredito();

  const ativos = creditos?.filter((c) => c.status !== "cancelado") || [];
  const count = ativos.length;

  const handleConverter = (credito: CreditoCondicional) => {
    if (!credito.data_ativacao) {
      setAtivarCredito(credito);
      return;
    }
    converter.mutate(credito);
  };

  return (
    <>
      <Collapsible defaultOpen className="border rounded-lg">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <span className="font-medium">Créditos Condicionais</span>
            {count > 0 && (
              <Badge variant="secondary" className="text-xs">{count}</Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 pt-0">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Novo Crédito
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !creditos?.length ? (
            <p className="text-sm text-muted-foreground">Nenhum crédito condicional cadastrado.</p>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Processo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Evento Gatilho</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditos.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.cliente?.nome_completo || "—"}</TableCell>
                      <TableCell>{c.processo?.numero_processo || c.processo?.tipo || "—"}</TableCell>
                      <TableCell>{c.descricao}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.evento_gatilho}</TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {Number(c.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{CONTA_LABELS[c.conta || "escritorio"] || c.conta}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[c.status as StatusCreditoCondicional] || "outline"}>
                          {STATUS_CREDITO_CONDICIONAL_LABELS[c.status as StatusCreditoCondicional] || c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {c.status === "backlog" && (
                            <>
                              <Button size="icon" variant="ghost" title="Ativar" aria-label="Ativar crédito" onClick={() => setAtivarCredito(c)}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" title="Cancelar" aria-label="Cancelar crédito" onClick={() => cancelar.mutate(c.id)}>
                                <Ban className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {c.status === "a_receber" && (
                            <Button size="icon" variant="ghost" title="Converter em Acordo" aria-label="Converter crédito em acordo" onClick={() => handleConverter(c)}>
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <NewCreditoCondicionalDialog open={newOpen} onClose={() => setNewOpen(false)} />
      <AtivarCreditoDialog credito={ativarCredito} open={!!ativarCredito} onClose={() => setAtivarCredito(null)} />
    </>
  );
}
