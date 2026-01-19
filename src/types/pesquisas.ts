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

export type TipoConsulta = 'veiculo' | 'imovel' | 'certidao' | 'processo' | 'cpf';

// Consulta de Processo Judicial (Datajud CNJ)
export interface ConsultaProcessoRequest {
  numeroProcesso: string;
  tribunal: string;
  processo_id?: string;
  motivo: string;
  justificativa: string;
}

export interface ConsultaProcessoResponse {
  processo: {
    numeroProcesso: string;
    classe: string;
    classeCompleta: any;
    tribunal: string;
    tribunalSigla: string;
    dataAjuizamento: string | null;
    dataHoraUltimaAtualizacao: string | null;
    grau: string;
    nivelSigilo: number;
    formato: string;
    sistema: string | null;
    orgaoJulgador: {
      nome: string;
      codigo: string | null;
      codigoMunicipioIBGE: string | null;
    } | null;
    assuntos: Array<{
      codigo: string | null;
      nome: string;
    }>;
    movimentos: Array<{
      codigo: string | null;
      nome: string;
      dataHora: string | null;
      complementosTabelados: any[];
    }>;
  };
  metadados: {
    consultadoEm: string;
    idConsulta: string;
    tribunal: string;
    tribunalNome: string;
  };
}
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
