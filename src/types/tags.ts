export type TagTipo = 'lead' | 'processo' | 'geral';

export interface Tag {
  id: string;
  nome: string;
  tipo: TagTipo;
  cor: string;
  descricao?: string;
  created_by?: string;
  created_at: string;
}

export interface EntidadeTag {
  id: string;
  tag_id: string;
  entidade_id: string;
  entidade_tipo: 'lead' | 'processo';
  created_at: string;
}

export interface TagFilters {
  busca?: string;
  tipo?: TagTipo | null;
  ordenacao?: 'recente' | 'antigo' | 'az' | 'za' | 'mais-usado';
}

export interface TagFormData {
  nome: string;
  tipo: TagTipo;
  cor: string;
  descricao?: string;
}

export interface TagWithStats extends Tag {
  uso_count: number;
}

export const TAG_COLORS = [
  { name: 'Azul', hex: '#3B82F6' },
  { name: 'Verde', hex: '#10B981' },
  { name: 'Amarelo', hex: '#F59E0B' },
  { name: 'Vermelho', hex: '#EF4444' },
  { name: 'Roxo', hex: '#8B5CF6' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Cinza', hex: '#6B7280' },
  { name: 'Laranja', hex: '#F97316' },
  { name: 'Verde Água', hex: '#14B8A6' },
  { name: 'Índigo', hex: '#6366F1' },
];

export const TIPO_LABELS: Record<TagTipo, string> = {
  lead: 'Lead',
  processo: 'Processo',
  geral: 'Geral',
};
