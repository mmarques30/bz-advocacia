export type WhatsAppProvider = 'meta' | 'twilio' | 'zenvia';

export type TemplateCategoria = 
  | 'andamento' 
  | 'audiencia' 
  | 'sentenca' 
  | 'geral' 
  | 'cobranca'
  | 'documento'
  | 'prazo';

export type NotificacaoStatus = 
  | 'pendente' 
  | 'aprovado' 
  | 'enviado' 
  | 'entregue' 
  | 'lido' 
  | 'falhou'
  | 'rejeitado';

export interface WhatsAppConfig {
  id: string;
  provider: WhatsAppProvider;
  phone_number: string;
  phone_number_id?: string;
  credentials: Record<string, any>;
  active: boolean;
  webhook_verify_token?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  nome: string;
  categoria: TemplateCategoria;
  mensagem: string;
  variaveis: string[];
  ativo: boolean;
  total_envios: number;
  usado_ultima_vez?: string;
  criado_por?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppRegra {
  id: string;
  nome: string;
  ativa: boolean;
  tipo_gatilho: 'evento' | 'agendamento' | 'periodicidade';
  evento_gatilho?: string;
  agendamento?: any;
  periodicidade?: any;
  condicoes?: any;
  template_id?: string;
  destinatarios: 'cliente' | 'advogado' | 'equipe' | 'personalizado';
  lista_destinatarios?: string[];
  intervalo_minimo: number;
  horario_comercial: boolean;
  ignorar_fim_semana: boolean;
  requer_aprovacao: boolean;
  lembretes?: any;
  total_envios: number;
  ultima_execucao?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppHistorico {
  id: string;
  regra_id?: string;
  template_id?: string;
  processo_id?: string;
  cliente_id?: string;
  destinatario_nome?: string;
  destinatario_telefone: string;
  mensagem: string;
  status: NotificacaoStatus;
  provider?: string;
  message_id_externo?: string;
  erro_mensagem?: string;
  created_at: string;
  aprovado_em?: string;
  enviado_em?: string;
  entregue_em?: string;
  lido_em?: string;
  cliente_respondeu: boolean;
  resposta_cliente?: string;
  resposta_em?: string;
  custo?: number;
  aprovado_por?: string;
}

export interface WhatsAppAprovacao {
  id: string;
  historico_id: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  aprovado_por?: string;
  aprovado_em?: string;
  rejeitado: boolean;
  motivo_rejeicao?: string;
  created_at: string;
}

export interface EnviarMensagemParams {
  destinatario_telefone: string;
  destinatario_nome?: string;
  mensagem: string;
  processo_id?: string;
  cliente_id?: string;
  template_id?: string;
}

// Variáveis disponíveis para templates
export const VARIAVEIS_DISPONIVEIS = {
  nome_cliente: 'Nome do cliente',
  numero_processo: 'Número do processo',
  tipo_processo: 'Tipo de ação',
  data_andamento: 'Data do andamento',
  descricao_andamento: 'Descrição do andamento',
  data_audiencia: 'Data da audiência',
  hora_audiencia: 'Horário da audiência',
  local_audiencia: 'Local da audiência',
  resultado_sentenca: 'Resultado da sentença',
  nome_escritorio: 'Nome do escritório',
  nome_advogado: 'Nome do advogado responsável',
  prazo_vencimento: 'Data de vencimento',
  valor_devido: 'Valor devido',
  descricao_prazo: 'Descrição do prazo',
  data_prazo: 'Data do prazo',
  nome_documento: 'Nome do documento',
  tipo_documento: 'Tipo do documento',
};

// Helper para processar template com variáveis
export function processarTemplate(
  template: string,
  dados: Record<string, any>
): string {
  let mensagem = template;
  
  Object.keys(dados).forEach(variavel => {
    const regex = new RegExp(`{{${variavel}}}`, 'g');
    mensagem = mensagem.replace(regex, dados[variavel] || '');
  });
  
  return mensagem;
}

// Helper para extrair variáveis de um template
export function extrairVariaveis(template: string): string[] {
  const regex = /{{([^}]+)}}/g;
  const variaveis: string[] = [];
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    if (!variaveis.includes(match[1])) {
      variaveis.push(match[1]);
    }
  }
  
  return variaveis;
}
