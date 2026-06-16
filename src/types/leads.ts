export type LeadStatus = 'novo' | 'contato_inicial' | 'em_analise' | 'proposta_enviada' | 'fechado' | 'perdido';
export type LeadOrigem = 'google' | 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'meta' | 'indicacao' | 'site' | 'whatsapp_bot' | 'outro';
export type LeadPrioridade = 'alta' | 'media' | 'baixa';

export interface Lead {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  tipo_processo: string;
  outro_tipo_processo: string | null;
  status: string;
  estagio: LeadStatus;
  origem: LeadOrigem;
  created_at: string;
  data_ultima_atividade: string;
  responsavel_id: string | null;
  valor_proposta: number | null;
  notas_internas: string | null;
  mensagem: string;
  como_conheceu: string;
  outro_como_conheceu: string | null;
  regime_casamento: string | null;
  tem_filhos: boolean | null;
  numero_herdeiros: number | null;
  bens_partilhar: string | null;
  valor_estimado_bens: string | null;
  situacao_atual: string | null;
  valor_pretendido: string | null;
  documentos: string[] | null;
  lgpd_consent: boolean;
  prioridade: LeadPrioridade;
  tags: string[] | null;
  dias_parado?: number;
  // Novos campos
  pasta_drive_url: string | null;
  status_cliente: 'ativo' | 'inativo' | null;
  estado_civil: string | null;
  origem_descricao: string | null;
  endereco_completo: string | null;
  // Campos de documentação pessoal
  cpf: string | null;
  rg: string | null;
  nacionalidade: string | null;
  profissao: string | null;
  data_nascimento: string | null;
  // Vínculo com o bot SDR (leads_geral)
  lead_geral_id?: string | null;
  status_sdr?: string | null;
  fluxo_sdr?: string | null;
  area_normalizada?: string | null;
  score?: number | null;
  etapa_qualificacao?: string | null;
  bot_pausado?: boolean | null;
  ultima_mensagem_em?: string | null;
  origem_sdr?: string | null;
  // True quando o bot detectou que o lead veio de fora de anuncio
  // (platform sem sufixo _ads). Fonte: leads_geral.is_organic.
  // Mais confiavel que `origem` (contact_submissions) pra separar
  // pipeline Organico vs Anuncios.
  is_organic?: boolean | null;
  // Classificacao do contato. Default 'lead' (entra no funil). Outros
  // valores ('fornecedor', 'parceiro', 'institucional', 'pessoal') sao
  // filtrados do Kanban principal.
  tipo_contato?: "lead" | "fornecedor" | "parceiro" | "institucional" | "pessoal" | string | null;
  campanha_envio?: {
    enviada_em: string | null;
    respondida_em: string | null;
    variacao_texto: number | null;
    status: string;
  } | null;
}

export type StatusSdr =
  | 'novo'
  | 'em_atendimento_bot'
  | 'sql_aguardando_humano'
  | 'assumido_humano'
  | 'agendado'
  | 'cliente'
  | 'mql_frio'
  | 'perdido';

export interface LeadNota {
  id: string;
  lead_id: string;
  usuario_id: string;
  texto: string;
  created_at: string;
  updated_at: string | null;
}

export interface LeadAtividade {
  id: string;
  tipo: string;
  descricao: string;
  entidade_tipo: string;
  entidade_id: string;
  usuario_id: string | null;
  created_at: string;
}

export interface LeadComunicacao {
  id: string;
  lead_id: string;
  tipo: 'email' | 'whatsapp' | 'ligacao';
  template_usado: string | null;
  mensagem: string;
  status: 'enviado' | 'entregue' | 'lido' | 'erro';
  enviado_por: string | null;
  created_at: string;
}

export type StatusCliente = 'ativo' | 'inativo';

export interface LeadsFilters {
  search: string;
  status: LeadStatus[];
  origem: LeadOrigem[];
  tipoProcesso: string[];
  dateRange: { start: Date | null; end: Date | null };
  diasParado: { min: number; max: number | null };
  responsavel: string | null;
  statusCliente: StatusCliente[];
}

export const STATUS_CLIENTE_LABELS: Record<StatusCliente, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  novo: 'Novo',
  contato_inicial: 'Enviado',
  em_analise: 'Qualificado',
  proposta_enviada: 'Em Proposta',
  fechado: 'Convertido',
  perdido: 'Perdido',
};

export const ORIGEM_LABELS: Record<LeadOrigem, string> = {
  google: 'Google',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  meta: 'Meta',
  indicacao: 'Indicação',
  site: 'Site',
  whatsapp_bot: 'WhatsApp Bot',
  outro: 'Outro',
};

export const TIPO_PROCESSO_OPTIONS = [
  'Divórcio Consensual',
  'Divórcio Litigioso',
  'Inventário',
  'Pensão Alimentícia',
  'União Estável',
  'Outro',
];
