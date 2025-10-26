export type NotificationType = 
  | 'novo_lead' 
  | 'lead_parado' 
  | 'lead_respondeu' 
  | 'prazo_proximo' 
  | 'parcela_atrasada' 
  | 'novo_andamento';

export interface Notification {
  id: string;
  tipo: NotificationType;
  titulo: string;
  descricao: string;
  created_at: string;
  lida: boolean;
  link?: string;
  metadata?: {
    leadId?: string;
    processoId?: string;
    parcelaId?: string;
  };
}

export interface NotificationConfig {
  icon: string;
  color: string;
}

export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> = {
  novo_lead: { icon: '👤', color: 'bg-blue-100 text-blue-600' },
  lead_parado: { icon: '⏸️', color: 'bg-yellow-100 text-yellow-600' },
  lead_respondeu: { icon: '💬', color: 'bg-green-100 text-green-600' },
  prazo_proximo: { icon: '⏰', color: 'bg-yellow-100 text-yellow-600' },
  parcela_atrasada: { icon: '💰', color: 'bg-red-100 text-red-600' },
  novo_andamento: { icon: '📝', color: 'bg-green-100 text-green-600' },
};
