import { format } from 'date-fns';
import { LogSistema, ACAO_LABELS, ENTIDADE_LABELS, LogAcao, EntidadeTipo } from '@/types/logs';

export function formatLogAction(acao: LogAcao): string {
  return ACAO_LABELS[acao] || acao;
}

export function formatEntityType(tipo: EntidadeTipo): string {
  return ENTIDADE_LABELS[tipo] || tipo;
}

export function getEntityLink(tipo: EntidadeTipo, id?: string): string | null {
  if (!id) return null;
  
  const routes: Partial<Record<EntidadeTipo, string>> = {
    contact_submissions: `/dashboard/leads?id=${id}`,
    processos: `/dashboard/processos?id=${id}`,
  };
  
  return routes[tipo] || null;
}

export function exportLogsToCSV(logs: LogSistema[]): void {
  const headers = ['Data/Hora', 'Usuário', 'Email', 'Ação', 'Entidade', 'Descrição', 'IP'];
  const rows = logs.map(log => [
    format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
    log.usuario_nome || 'Sistema',
    log.usuario_email || '-',
    formatLogAction(log.acao),
    formatEntityType(log.entidade_tipo),
    log.descricao.replace(/,/g, ';'), // Remove vírgulas para não quebrar CSV
    log.ip_address || '-',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `logs-sistema-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
