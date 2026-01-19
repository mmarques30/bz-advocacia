export interface Contrato {
  id: string;
  cliente_id: string;
  template_id?: string;
  titulo: string;
  tipo_contrato: string;
  conteudo_final: string;
  pdf_url?: string;
  status: 'rascunho' | 'finalizado' | 'assinado' | 'cancelado';
  valores: ValoresContrato;
  dados_contrato: DadosContrato;
  created_at: string;
  updated_at: string;
  created_by?: string;
  cliente?: {
    nome_completo: string;
    email: string;
    telefone: string;
  };
}

export interface ValoresContrato {
  valor_entrada?: number;
  valor_parcelas?: number;
  num_parcelas?: number;
  percentual_exito?: number;
  valor_total?: number;
}

export interface DadosContrato {
  objeto?: string;
  cidade?: string;
  data_contrato?: string;
  observacoes?: string;
}

export interface DadosCliente {
  nome_completo: string;
  cpf?: string;
  rg?: string;
  nacionalidade?: string;
  profissao?: string;
  estado_civil?: string;
  endereco_completo?: string;
  endereco_cep?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  email?: string;
  telefone?: string;
}

export interface DadosEscritorio {
  nome_escritorio: string;
  cnpj?: string;
  oab_principal?: string;
  endereco_completo?: string;
  telefone?: string;
  email?: string;
  cidade?: string;
  estado?: string;
}

export interface ContratoFilters {
  busca?: string;
  cliente_id?: string;
  status?: string;
  tipo_contrato?: string;
  periodo_inicio?: string;
  periodo_fim?: string;
}

export const TIPOS_CONTRATO = [
  { value: 'divorcio', label: 'Divórcio' },
  { value: 'indenizacao', label: 'Indenização' },
  { value: 'curatela', label: 'Curatela' },
  { value: 'inventario', label: 'Inventário' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'previdenciario', label: 'Previdenciário' },
  { value: 'outro', label: 'Outro' },
] as const;

export const STATUS_CONTRATO = [
  { value: 'rascunho', label: 'Rascunho', color: 'bg-muted text-muted-foreground' },
  { value: 'finalizado', label: 'Finalizado', color: 'bg-primary/10 text-primary' },
  { value: 'assinado', label: 'Assinado', color: 'bg-green-100 text-green-700' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-700' },
] as const;

export const ESTADOS_CIVIS = [
  'Solteiro(a)',
  'Casado(a)',
  'Divorciado(a)',
  'Viúvo(a)',
  'União Estável',
  'Separado(a)',
] as const;
