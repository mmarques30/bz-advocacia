import { Lead } from './leads';

export interface ConversaMensagem {
  texto: string;
  de_bot: boolean;
  timestamp: string;
}

export interface LeadBot extends Lead {
  bot_finalizado: boolean;
  perguntas_respondidas: number;
  conversa_bot_completa: ConversaMensagem[] | null;
  whatsapp_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  primeiro_contato_em: string;
  ultimo_contato_em: string;
  canal_especifico: string | null;
}

export type TipoInteracao = 'mensagem_bot' | 'mensagem_manual' | 'email' | 'ligacao' | 'nota_interna';
export type CanalInteracao = 'whatsapp' | 'email' | 'telefone';
export type DirecaoInteracao = 'entrada' | 'saida';

export interface LeadInteracao {
  id: string;
  lead_id: string;
  tipo: TipoInteracao;
  canal: CanalInteracao;
  mensagem: string;
  eh_bot: boolean;
  direcao: DirecaoInteracao;
  created_at: string;
}
