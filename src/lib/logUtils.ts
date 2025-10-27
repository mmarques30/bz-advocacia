import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LogAcao, EntidadeTipo, LogSistema } from "@/types/logs";
import { toast } from "sonner";

export const ACAO_LABELS: Record<LogAcao, string> = {
  criar: 'Criou',
  editar: 'Editou',
  deletar: 'Deletou',
};

export const ENTIDADE_LABELS: Record<EntidadeTipo, string> = {
  contact_submissions: 'Lead',
  processos: 'Processo',
  processos_andamentos: 'Andamento',
  processos_documentos: 'Documento',
  processos_prazos: 'Prazo',
  acordos_financeiros: 'Acordo Financeiro',
  parcelas_financeiras: 'Parcela',
  templates: 'Template',
  tags: 'Tag',
  profiles: 'Perfil',
  user_roles: 'Permissão',
};

export function formatLogAction(acao: LogAcao): string {
  return ACAO_LABELS[acao] || acao;
}

export function formatEntityType(tipo: EntidadeTipo): string {
  return ENTIDADE_LABELS[tipo] || tipo;
}

export function getEntityLink(tipo: EntidadeTipo, id?: string): string {
  if (!id) return '#';
  
  const routes: Record<string, string> = {
    contact_submissions: `/dashboard/leads?id=${id}`,
    processos: `/dashboard/processos?id=${id}`,
    acordos_financeiros: `/dashboard/financeiro/acordos?id=${id}`,
    templates: `/dashboard/configuracoes/templates`,
    tags: `/dashboard/configuracoes/tags`,
    profiles: `/dashboard/configuracoes/usuarios`,
  };
  
  return routes[tipo] || '#';
}

export function exportLogsToCSV(logs: LogSistema[]): void {
  if (!logs || logs.length === 0) {
    toast.error("Nenhum log para exportar");
    return;
  }

  try {
    const headers = ['Data/Hora', 'Usuário', 'Email', 'Ação', 'Entidade', 'Descrição', 'IP'];
    const rows = logs.map(log => [
      format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
      log.usuario?.nome_completo || 'Sistema',
      log.usuario?.email || '-',
      ACAO_LABELS[log.acao],
      ENTIDADE_LABELS[log.entidade_tipo],
      log.descricao.replace(/,/g, ';'),
      log.ip_address || '-'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Logs exportados com sucesso!");
  } catch (error) {
    console.error('Erro ao exportar logs:', error);
    toast.error("Erro ao exportar logs");
  }
}
