import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lead, LEAD_STATUS_LABELS, ORIGEM_LABELS, TIPO_PROCESSO_OPTIONS } from "@/types/leads";
import { format } from "date-fns";
import { Mail, Phone, Calendar, FileText, AlertCircle, ClipboardList, MessageCircle, MessageSquare, AlertTriangle, Wallet } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { LeadContratosTab } from "./LeadContratosTab";
import { ClienteProcessosTab } from "./ClienteProcessosTab";
import { ClienteTarefasTab } from "./ClienteTarefasTab";
import { ClienteFinanceiroTab } from "./ClienteFinanceiroTab";
import { LeadMensagensTab } from "./LeadMensagensTab";
import { LeadQualificacaoTab } from "./LeadQualificacaoTab";
import { ConversaBot } from "./ConversaBot";
import { Bot } from "lucide-react";
import { ProcessoDetailsInline } from "@/components/processos/ProcessoDetailsInline";
import { supabase } from "@/integrations/supabase/client";
import { useWhatsAppTemplates } from "@/hooks/useWhatsAppTemplates";
import { processarTemplate } from "@/types/whatsapp";
import { openWhatsAppLink } from "@/lib/whatsappUtils";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface LeadDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  onEdit: (lead: Lead) => void;
  isCliente?: boolean;
  initialTab?: string;
}

const TIPOS_CONTATO_OPTS = [
  { v: "lead", l: "Lead (entra no funil)" },
  { v: "fornecedor", l: "Fornecedor" },
  { v: "parceiro", l: "Parceiro" },
  { v: "institucional", l: "Institucional / Vara" },
  { v: "pessoal", l: "Contato pessoal" },
];

const ESTAGIO_OPTS: { v: Lead["estagio"]; l: string }[] = [
  { v: "novo", l: "Novo" },
  { v: "contato_inicial", l: "Enviado" },
  { v: "em_analise", l: "Qualificado" },
  { v: "proposta_enviada", l: "Em Proposta" },
  { v: "fechado", l: "Convertido" },
  { v: "perdido", l: "Perdido" },
];

export function LeadDetailsDialog({ open, onClose, lead, onEdit, isCliente = false, initialTab }: LeadDetailsDialogProps) {
  const diasParado = lead?.dias_parado || 0;
  const [sendingPrimeiroContato, setSendingPrimeiroContato] = useState(false);
  const [markingConcluido, setMarkingConcluido] = useState(false);
  const [selectedProcessoId, setSelectedProcessoId] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<string | null>(null);
  const queryClient = useQueryClient();

  async function updateContactSubmission(patch: Record<string, unknown>) {
    if (!lead) return;
    const { error } = await supabase
      .from("contact_submissions")
      .update(patch)
      .eq("id", lead.id);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  }

  async function handleTipoContato(value: string) {
    if (!lead) return;
    setSavingField("tipo_contato");
    try {
      // Garante lead_geral pra registros antigos (form do site, importacao)
      // que nao tem vinculo com o bot. Sem isso o update silenciosamente
      // nao faz nada e o lead continua no pipeline.
      let leadGeralId = lead.lead_geral_id;
      if (!leadGeralId) {
        const { data: novoId, error: rpcErr } = await (supabase as any).rpc(
          "garantir_lead_geral_para_contact",
          { p_contact_submission_id: lead.id },
        );
        if (rpcErr) throw rpcErr;
        leadGeralId = novoId as string;
      }
      const patch: Record<string, unknown> = { tipo_contato: value };
      if (value !== "lead") patch.bot_pausado = true;
      const { error } = await (supabase as any)
        .from("leads_geral")
        .update(patch)
        .eq("id", leadGeralId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads-kanban"] });
      queryClient.invalidateQueries({ queryKey: ["lead-info", leadGeralId] });
      toast({ title: value === "lead" ? "Voltou pro pipeline" : "Reclassificado como nao-lead" });
    } catch (err: any) {
      toast({ title: "Erro ao classificar", description: err?.message, variant: "destructive" });
    } finally {
      setSavingField(null);
    }
  }

  async function handleEstagio(value: string) {
    if (!lead) return;
    setSavingField("estagio");
    const ok = await updateContactSubmission({ estagio: value });
    setSavingField(null);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads-kanban"] });
      toast({ title: "Estágio atualizado" });
    }
  }

  async function handleTipoProcesso(value: string) {
    if (!lead) return;
    setSavingField("tipo_processo");
    const ok = await updateContactSubmission({ tipo_processo: value });
    setSavingField(null);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads-kanban"] });
      toast({ title: "Área atualizada" });
    }
  }

  const handleDialogClose = () => {
    setSelectedProcessoId(null);
    onClose();
  };

  const { data: processosCount } = useQuery({
    queryKey: ["cliente-processos-count", lead?.id],
    queryFn: async () => {
      const { count } = await supabase.from("processos")
        .select("id", { count: "exact", head: true })
        .eq("lead_id", lead!.id);
      return count || 0;
    },
    enabled: isCliente && !!lead?.id && open,
  });

  // Item 3: quem assumiu o lead (advogado humano responsável)
  const { data: atendente } = useQuery({
    queryKey: ["lead-atendente", lead?.lead_geral_id],
    queryFn: async () => {
      const { data: lg } = await (supabase as any)
        .from("leads_geral")
        .select("humano_responsavel, assumido_em")
        .eq("id", lead!.lead_geral_id!)
        .maybeSingle();
      if (!lg?.humano_responsavel) return null;
      const { data: adv } = await (supabase as any)
        .from("advogados_sdr")
        .select("id, nome, email, user_id")
        .eq("id", lg.humano_responsavel)
        .maybeSingle();
      return adv ? { ...adv, assumido_em: lg.assumido_em } : null;
    },
    enabled: !!lead?.lead_geral_id && open,
  });

  const handleMarcarConcluido = async () => {
    if (!lead) return;
    setMarkingConcluido(true);
    await supabase.from("contact_submissions")
      .update({ status_cliente: "inativo" })
      .eq("id", lead.id);
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["cliente-processos-count", lead.id] });
    setMarkingConcluido(false);
    toast({ title: "Status atualizado para Concluído/Inativo" });
  };

  const { data: templatesPrimeiroContato } = useWhatsAppTemplates({ 
    tipo: 'primeiro_contato', 
    ativo: true 
  });

  const handlePrimeiroContato = async () => {
    if (!lead) return;
    const template = templatesPrimeiroContato?.[0];
    if (!template) {
      toast({
        title: "Modelo não encontrado",
        description: "Crie um modelo do tipo 'Primeiro Contato' em Administrativo > Modelos",
        variant: "destructive",
      });
      return;
    }
    if (!lead.telefone) {
      toast({ title: "Telefone não cadastrado", variant: "destructive" });
      return;
    }
    setSendingPrimeiroContato(true);
    const tipoServico = lead.tipo_processo === 'Outro' && lead.outro_tipo_processo
      ? lead.outro_tipo_processo : lead.tipo_processo;
    const mensagem = processarTemplate(template.mensagem, {
      nome_cliente: lead.nome_completo,
      tipo_processo: tipoServico,
    });
    openWhatsAppLink(lead.telefone, mensagem);
    await supabase.from("lead_interacoes").insert({
      lead_id: lead.id,
      tipo: "whatsapp",
      canal: "whatsapp",
      direcao: "saida",
      mensagem,
    });
    setSendingPrimeiroContato(false);
    toast({ title: "Mensagem de primeiro contato enviada" });
  };

  const getOrigemBadgeColor = (origem: string) => {
    const colors: Record<string, string> = {
      google: "bg-blue-100 text-blue-800 border-blue-200",
      facebook: "bg-blue-100 text-blue-800 border-blue-200",
      instagram: "bg-pink-100 text-pink-800 border-pink-200",
      tiktok: "bg-gray-100 text-gray-800 border-gray-200",
      linkedin: "bg-sky-100 text-sky-800 border-sky-200",
      meta: "bg-purple-100 text-purple-800 border-purple-200",
      indicacao: "bg-green-100 text-green-800 border-green-200",
      site: "bg-primary/10 text-primary border-primary/20",
      whatsapp_bot: "bg-emerald-100 text-emerald-800 border-emerald-200",
      outro: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[origem] || colors.outro;
  };

  const getEstagioColor = (estagio: string) => {
    const colors: Record<string, string> = {
      novo: "bg-blue-100 text-blue-800 border-blue-200",
      contato_inicial: "bg-cyan-100 text-cyan-800 border-cyan-200",
      em_analise: "bg-yellow-100 text-yellow-800 border-yellow-200",
      proposta_enviada: "bg-orange-100 text-orange-800 border-orange-200",
      fechado: "bg-green-100 text-green-800 border-green-200",
      perdido: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[estagio] || "";
  };

  const maskCpf = (cpf: string) => {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length >= 11) {
      return `***.***.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    }
    return cpf;
  };

  const summaryParts: string[] = [];
  if (lead?.cpf) summaryParts.push(maskCpf(lead.cpf));
  if (typeof processosCount === 'number') summaryParts.push(`${processosCount} processo${processosCount !== 1 ? 's' : ''}`);
  if (lead?.endereco_completo) {
    const city = lead.endereco_completo.split(',').pop()?.trim();
    if (city) summaryParts.push(city);
  }

  const sideBySide = false;
  const defaultTab = initialTab || "info";

  return (
    <Sheet open={open} onOpenChange={handleDialogClose}>
      <SheetContent
        side="right"
        className={cn(
          "overflow-hidden p-0",
          sideBySide
            ? "w-full sm:w-[700px] lg:w-[1200px] sm:max-w-[1200px]"
            : "w-full sm:w-[900px] sm:max-w-[900px]"
        )}
      >
        {lead ? (
          selectedProcessoId ? (
            <ProcessoDetailsInline
              processoId={selectedProcessoId}
              onBack={() => setSelectedProcessoId(null)}
              clienteNome={lead.nome_completo}
            />
          ) : (
          <div className="flex h-full max-h-screen">
          <div className={cn(
            "overflow-y-auto p-6",
            sideBySide ? "flex-1 lg:w-[420px] lg:flex-none lg:border-r" : "flex-1"
          )}>
            <SheetHeader className="space-y-1 pr-6">
              <div className="flex items-center gap-3">
                <SheetTitle className="text-2xl">{lead.nome_completo}</SheetTitle>
                {isCliente && lead.status_cliente && (
                  <Badge 
                    variant="outline" 
                    className={lead.status_cliente === 'ativo' 
                      ? "bg-green-100 text-green-800 border-green-200" 
                      : "bg-gray-100 text-gray-800 border-gray-200"
                    }
                  >
                    {lead.status_cliente === 'ativo' ? 'Ativo' : 'Inativo'}
                  </Badge>
                )}
              </div>
              <SheetDescription className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={getOrigemBadgeColor(lead.origem)}>
                  {ORIGEM_LABELS[lead.origem] || lead.origem}
                </Badge>
                {lead.origem_descricao && (
                  <span className="text-xs text-muted-foreground">{lead.origem_descricao}</span>
                )}
                <Badge variant="outline" className={getEstagioColor(lead.estagio)}>
                  {LEAD_STATUS_LABELS[lead.estagio]}
                </Badge>
              </SheetDescription>
              {summaryParts.length > 0 && (
                <p className="text-xs text-muted-foreground">{summaryParts.join(' · ')}</p>
              )}
            </SheetHeader>

            <div className="flex gap-2 mt-3">
              {!isCliente && lead.estagio === 'novo' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePrimeiroContato}
                  disabled={sendingPrimeiroContato}
                  className="gap-1.5"
                >
                  <MessageSquare className="h-4 w-4" />
                  Primeiro Contato
                </Button>
              )}
              <Button size="sm" onClick={() => onEdit(lead)}>{isCliente ? 'Editar Cliente' : 'Editar Lead'}</Button>
            </div>

            {atendente && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase">
                  {(atendente.nome || atendente.email || "?").charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Atendido por</span>
                  <span className="text-sm font-medium leading-tight">{atendente.nome || atendente.email}</span>
                </div>
                {atendente.assumido_em && (
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    desde {format(new Date(atendente.assumido_em), "dd/MM HH:mm")}
                  </span>
                )}
              </div>
            )}

            {!isCliente && diasParado > 7 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2 mt-4">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  Lead parado há {diasParado} dias - Atenção necessária
                </p>
              </div>
            )}

            {isCliente && processosCount === 0 && (
              <div className="bg-[hsl(38,92%,50%)]/10 border border-[hsl(38,92%,50%)]/20 rounded-lg p-3 flex items-center justify-between gap-2 mt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-[hsl(38,92%,50%)]" />
                  <p className="text-sm font-medium text-[hsl(38,92%,50%)]">
                    Este cliente não possui processos ativos. Considere atualizar o status para Concluído.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarcarConcluido}
                  disabled={markingConcluido || lead?.status_cliente === 'inativo'}
                  className="shrink-0"
                >
                  {lead?.status_cliente === 'inativo' ? 'Já concluído' : 'Marcar como Concluído'}
                </Button>
              </div>
            )}

            <Tabs defaultValue={defaultTab} key={`${lead.id}-${defaultTab}`} className="mt-4">
              <TabsList className="flex w-full overflow-x-auto">
                <TabsTrigger value="info">Informações</TabsTrigger>
                {isCliente && <TabsTrigger value="processos">Processos</TabsTrigger>}
                <TabsTrigger value="contratos">{isCliente ? 'Contratos' : 'Propostas'}</TabsTrigger>
                {isCliente && (
                  <TabsTrigger value="tarefas" className="flex items-center gap-1">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Tarefas
                  </TabsTrigger>
                )}
                {isCliente && (
                  <TabsTrigger value="financeiro" className="flex items-center gap-1">
                    <Wallet className="h-3.5 w-3.5" />
                    Financeiro
                  </TabsTrigger>
                )}
                <TabsTrigger value="mensagens" className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Mensagens
                </TabsTrigger>
                <TabsTrigger value="documentos">Documentos</TabsTrigger>
                <TabsTrigger value="notas">Notas</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                {/* Classificacao rapida: tipo de contato, area e estagio sem abrir o formulario completo */}
                <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Classificação rápida
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Tipo de contato</label>
                      <Select
                        value={lead.tipo_contato || "lead"}
                        onValueChange={handleTipoContato}
                        disabled={savingField === "tipo_contato"}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_CONTATO_OPTS.map((t) => (
                            <SelectItem key={t.v} value={t.v} className="text-xs">{t.l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Área</label>
                      <Select
                        value={lead.tipo_processo || undefined}
                        onValueChange={handleTipoProcesso}
                        disabled={savingField === "tipo_processo"}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPO_PROCESSO_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Estágio</label>
                      <Select
                        value={lead.estagio}
                        onValueChange={handleEstagio}
                        disabled={savingField === "estagio"}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTAGIO_OPTS.map((e) => (
                            <SelectItem key={e.v} value={e.v} className="text-xs">{e.l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <p className="text-sm">{lead.email || '-'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm font-medium">Telefone</span>
                    </div>
                    <p className="text-sm">{lead.telefone || '-'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">Tipo de Processo</span>
                    </div>
                    <p className="text-sm">
                      {lead.tipo_processo === 'Outro' && lead.outro_tipo_processo
                        ? lead.outro_tipo_processo
                        : lead.tipo_processo}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">Data de Entrada</span>
                    </div>
                    <p className="text-sm">{format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm")}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">Última Atividade</span>
                    </div>
                    <p className="text-sm">
                      {format(new Date(lead.data_ultima_atividade), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                  </div>

                  {!isCliente && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-sm font-medium">Tempo Parado</span>
                    </div>
                    <p className={`text-sm font-medium ${diasParado > 7 ? 'text-destructive' : ''}`}>
                      {diasParado} {diasParado === 1 ? 'dia' : 'dias'}
                    </p>
                  </div>
                  )}

                  {lead.cpf && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-sm font-medium">CPF/CNPJ</span>
                      </div>
                      <p className="text-sm">{lead.cpf}</p>
                    </div>
                  )}

                  {lead.data_nascimento && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">Data de Nascimento</span>
                      </div>
                      <p className="text-sm">{format(new Date(lead.data_nascimento + 'T00:00:00'), "dd/MM/yyyy")}</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Mensagem Inicial</h3>
                  <p className="text-sm whitespace-pre-wrap">{lead.mensagem || '-'}</p>
                </div>

                {lead.valor_proposta && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Valor da Proposta</h3>
                      <p className="text-lg font-semibold">
                        R$ {Number(lead.valor_proposta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </>
                )}

                {lead.pasta_drive_url && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Pasta Google Drive</h3>
                      <a 
                        href={lead.pasta_drive_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Abrir pasta do cliente
                      </a>
                    </div>
                  </>
                )}
              </TabsContent>

              {isCliente && (
              <TabsContent value="processos" className="mt-4">
                  <ClienteProcessosTab 
                    clienteId={lead.id} 
                    clienteNome={lead.nome_completo} 
                    onSelectProcesso={(id) => setSelectedProcessoId(id)}
                  />
                </TabsContent>
              )}

              <TabsContent value="contratos" className="mt-4">
                <LeadContratosTab clienteId={lead.id} />
              </TabsContent>

              {isCliente && (
                <TabsContent value="tarefas" className="mt-4">
                  <ClienteTarefasTab leadId={lead.id} />
                </TabsContent>
              )}

              {isCliente && (
                <TabsContent value="financeiro" className="mt-4">
                  <ClienteFinanceiroTab leadId={lead.id} />
                </TabsContent>
              )}


              <TabsContent value="mensagens" className="mt-4">
                <LeadMensagensTab leadId={lead.id} telefone={lead.telefone} nomeCompleto={lead.nome_completo} email={lead.email} dataNascimento={lead.data_nascimento} />
              </TabsContent>

              <TabsContent value="documentos" className="mt-4">
                {lead.documentos && lead.documentos.length > 0 ? (
                  <div className="space-y-2">
                    {lead.documentos.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{doc}</span>
                        </div>
                        <Button size="sm" variant="ghost">
                          Baixar
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum documento anexado</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notas" className="mt-4">
                <div className="space-y-4">
                  {lead.notas_internas ? (
                    <div className="p-4 border rounded-lg bg-muted/20">
                      <p className="text-sm whitespace-pre-wrap">{lead.notas_internas}</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma nota interna registrada</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          </div>
          )
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Carregando detalhes...
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
