export type TemplateType = 
  | 'contrato' 
  | 'procuracao' 
  | 'peticao' 
  | 'email' 
  | 'documento' 
  | 'comunicacao';

export interface Template {
  id: string;
  nome: string;
  tipo: TemplateType;
  categoria?: string;
  conteudo: string;
  variaveis?: string[];
  descricao?: string;
  ativo: boolean;
  criado_por?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateFilters {
  busca?: string;
  tipo?: TemplateType[];
  categoria?: string;
  ativo?: boolean | null;
  ordenacao?: 'recente' | 'antigo' | 'az' | 'za';
}

export interface TemplateFormData {
  nome: string;
  tipo: TemplateType;
  categoria?: string;
  conteudo: string;
  descricao?: string;
  ativo: boolean;
  variaveis?: string[];
}
