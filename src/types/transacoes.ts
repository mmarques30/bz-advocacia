export interface CategoriaFinanceira {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  created_at: string;
}

export interface TipoTransacao {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  created_at: string;
}

export interface SubcategoriaFinanceira {
  id: string;
  codigo: string;
  nome: string;
  categoria_codigo: string;
  descricao: string | null;
  created_at: string;
}

export interface TransacaoFinanceira {
  id: string;
  mes: number;
  ano: number;
  mes_nome: string | null;
  tipo_codigo: string;
  categoria_codigo: string;
  subcategoria_codigo: string;
  descricao: string | null;
  data_transacao: string | null;
  valor: number;
  created_at: string;
}

export interface TransacoesFilters {
  mes?: number;
  ano?: number;
  tipo_codigo?: string;
  categoria_codigo?: string;
  subcategoria_codigo?: string;
  busca?: string;
}

export interface ResumoMensal {
  mes: number;
  mes_nome: string;
  receitas: number;
  despesas: number;
  resultado: number;
}

export interface ResumoCategoria {
  categoria_codigo: string;
  categoria_nome: string;
  total: number;
  percentual: number;
}

export interface ResumoSubcategoria {
  subcategoria_codigo: string;
  subcategoria_nome: string;
  total: number;
  percentual: number;
}
