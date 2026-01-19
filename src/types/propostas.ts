export interface ValoresProposta {
  valor_entrada: number;
  desconto_avista?: number;
  percentual_exito?: number;
  percentual_partilha?: number;
  condicoes_adicionais?: string;
}

export interface Proposta {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  titulo: string;
  tipo_proposta: string;
  descricao_servico: string;
  valores: ValoresProposta;
  pdf_url?: string;
  status: 'rascunho' | 'enviada' | 'aceita' | 'recusada';
  created_at: string;
  updated_at: string;
}

export interface PropostaFormData {
  cliente_id: string;
  tipo_proposta: string;
  descricao_servico: string;
  valor_entrada: number;
  desconto_avista: number;
  percentual_exito: number;
  condicoes_adicionais: string;
}
