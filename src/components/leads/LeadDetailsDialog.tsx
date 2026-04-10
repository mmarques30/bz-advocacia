import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lead, LEAD_STATUS_LABELS, ORIGEM_LABELS } from "@/types/leads";
import { format } from "date-fns";
import { Mail, Phone, Calendar, FileText, AlertCircle, ClipboardList, MessageCircle, MessageSquare, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { LeadContratosTab } from "./LeadContratosTab";
import { ClienteProcessosTab } from "./ClienteProcessosTab";
import { ClienteTarefasTab } from "./ClienteTarefasTab";
import { LeadMensagensTab } from "./LeadMensagensTab";
import { supabase } from "@/integrations/supabase/client";
import { useWhatsAppTemplates } from "@/hooks/useWhatsAppTemplates";
import { processarTemplate } from "@/types/whatsapp";
import { openWhatsAppLink } from "@/lib/whatsappUtils";
import { toast } from "@/hooks/use-toast";

interface LeadDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  onEdit: (lead: Lead) => void;
  isCliente?: boolean;
}

export function LeadDetailsDialog({ open, onClose, lead, onEdit, isCliente = false }: LeadDetailsDialogProps) {
  const diasParado = lead?.dias_parado || 0;
  const [sendingPrimeiroContato, setSendingPrimeiroContato] = useState(false);
  const [markingConcluido, setMarkingConcluido] = useState(false);
  const queryClient = useQueryClient();

  // Check if client has processes
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {lead ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-2xl">{lead.nome_completo}</DialogTitle>
                  <DialogDescription className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className={getOrigemBadgeColor(lead.origem)}>
                      {ORIGEM_LABELS[lead.origem] || lead.origem}
                    </Badge>
                    {lead.origem_descricao && (
                      <span className="text-xs text-muted-foreground">{lead.origem_descricao}</span>
                    )}
                    <Badge variant="outline" className={getEstagioColor(lead.estagio)}>
                      {LEAD_STATUS_LABELS[lead.estagio]}
                    </Badge>
                  </DialogDescription>
                </div>
                <div className="flex gap-2">
                  {!isCliente && lead.estagio === 'novo' && (
                    <Button 
                      variant="outline" 
                      onClick={handlePrimeiroContato}
                      disabled={sendingPrimeiroContato}
                      className="gap-1.5"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Primeiro Contato
                    </Button>
                  )}
                  <Button onClick={() => onEdit(lead)}>{isCliente ? 'Editar Cliente' : 'Editar Lead'}</Button>
                </div>
              </div>
            </DialogHeader>

            {!isCliente && diasParado > 7 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-destructive font-medium">
                  Lead parado há {diasParado} dias - Atenção necessária
                </p>
              </div>
            )}

            {isCliente && processosCount === 0 && (
              <div className="bg-[hsl(38,92%,50%)]/10 border border-[hsl(38,92%,50%)]/20 rounded-lg p-3 flex items-center justify-between gap-2">
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

            <Tabs defaultValue="info" className="mt-4">
              <TabsList className={`grid w-full ${isCliente ? 'grid-cols-7' : 'grid-cols-5'}`}>
                <TabsTrigger value="info">Informações</TabsTrigger>
                {isCliente && <TabsTrigger value="processos">Processos</TabsTrigger>}
                <TabsTrigger value="contratos">{isCliente ? 'Contratos' : 'Propostas'}</TabsTrigger>
                {isCliente && (
                  <TabsTrigger value="tarefas" className="flex items-center gap-1">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Tarefas
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
                <div className="grid grid-cols-2 gap-4">
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

                  {isCliente && lead.status_cliente && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-sm font-medium">Status do Cliente</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={lead.status_cliente === 'ativo' 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "bg-gray-100 text-gray-800 border-gray-200"
                        }
                      >
                        {lead.status_cliente === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
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
                  <ClienteProcessosTab clienteId={lead.id} clienteNome={lead.nome_completo} />
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
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Carregando detalhes...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
