import { LucideIcon, User, Pause, MessageSquare, Clock, DollarSign, FileText } from 'lucide-react';

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
  icon: LucideIcon;
  color: string;
}

export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> = {
  novo_lead: { icon: User, color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400' },
  lead_parado: { icon: Pause, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400' },
  lead_respondeu: { icon: MessageSquare, color: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' },
  prazo_proximo: { icon: Clock, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400' },
  parcela_atrasada: { icon: DollarSign, color: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' },
  novo_andamento: { icon: FileText, color: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' },
};
