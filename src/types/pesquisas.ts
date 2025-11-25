export interface ConsultasConfig {
  id: string;
  provedor: string;
  api_token?: string;
  ambiente: 'sandbox' | 'producao';
  ativo: boolean;
  creditos_disponiveis: number;
  ultima_sincronizacao?: string;
  created_at: string;
  updated_at: string;
}

export type TipoConsulta = 'veiculo' | 'pessoa' | 'imovel' | 'certidao';
export type StatusConsulta = 'sucesso' | 'erro' | 'sem_dados' | 'api_nao_configurada';

export interface ConsultaRealizada {
  id: string;
  tipo_consulta: TipoConsulta;
  parametro_busca: string;
  processo_id?: string;
  usuario_id: string;
  motivo: string;
  justificativa: string;
  resultado?: any;
  status: StatusConsulta;
  mensagem_erro?: string;
  custo: number;
  id_consulta_externa?: string;
  ip_origem?: string;
  created_at: string;
}

export interface ConsultaAuditoria {
  id: string;
  consulta_id: string;
  acao: 'visualizacao' | 'exportacao' | 'compartilhamento';
  usuario_id: string;
  ip_origem?: string;
  detalhes?: any;
  created_at: string;
}

// Consulta de Veículo
export interface ConsultaVeiculoRequest {
  tipo: 'placa' | 'renavam' | 'chassi';
  valor: string;
  processo_id?: string;
  motivo: string;
  justificativa: string;
}

export interface ConsultaVeiculoResponse {
  status: string;
  dados: {
    placa: string;
    renavam: string;
    chassi: string;
    marca: string;
    modelo: string;
    anoFabricacao: number;
    anoModelo: number;
    cor: string;
    combustivel: string;
    categoria: string;
    situacao: {
      status: string;
      ufLicenciamento: string;
      municipio: string;
      licenciadoAte: string;
    };
    restricoes: {
      rouboFurto: boolean;
      financiamento?: {
        ativo: boolean;
        instituicao: string;
      };
      judicial: boolean;
      administrativa: boolean;
    };
    proprietario?: {
      nome: string;
      cpfCnpj: string;
      municipio: string;
      uf: string;
    };
    debitos: {
      ipva: number;
      multas: number;
      licenciamento: number;
      total: number;
    };
  };
  metadados: {
    consultadoEm: string;
    custo: number;
    idConsulta: string;
  };
}

// Consulta de Pessoa
export interface ConsultaPessoaRequest {
  tipo: 'cpf' | 'nome' | 'telefone';
  valor: string;
  incluirEnderecos: boolean;
  incluirTelefones: boolean;
  incluirEmails: boolean;
  incluirScore: boolean;
  processo_id?: string;
  motivo: string;
  justificativa: string;
}

export interface ConsultaPessoaResponse {
  identificacao: {
    nome: string;
    cpf: string;
    dataNascimento: string;
    idade: number;
    situacaoCPF: string;
    naturalidade: string;
  };
  enderecos: Array<{
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    tipo: string;
    ultimaAtualizacao: string;
  }>;
  telefones: Array<{
    numero: string;
    tipo: 'celular' | 'fixo';
    operadora?: string;
    status: string;
  }>;
  emails: string[];
  situacaoFinanceira?: {
    possuiRestricoes: boolean;
    protestos: number;
    valorTotal: number;
  };
  metadados: {
    consultadoEm: string;
    custo: number;
    idConsulta: string;
  };
}

// Consulta de Imóvel
export interface ConsultaImovelRequest {
  tipo: 'endereco' | 'matricula' | 'proprietario';
  valor: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  processo_id?: string;
  motivo: string;
  justificativa: string;
}

export interface ConsultaImovelResponse {
  dados: {
    endereco: string;
    matricula?: string;
    cidade: string;
    uf: string;
    cep: string;
    area: number;
    tipo: string;
    proprietario?: {
      nome: string;
      cpfCnpj: string;
    };
    valor?: number;
    registros: Array<{
      tipo: string;
      data: string;
      descricao: string;
    }>;
  };
  metadados: {
    consultadoEm: string;
    custo: number;
    idConsulta: string;
  };
}

export interface HistoricoFilters {
  tipo?: TipoConsulta;
  dataInicio?: string;
  dataFim?: string;
  usuario_id?: string;
  processo_id?: string;
  status?: StatusConsulta;
}
