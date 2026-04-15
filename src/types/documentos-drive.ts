export type TipoDocumentoDrive =
  | 'peticao_inicial'
  | 'contestacao'
  | 'replica_treplica'
  | 'recurso'
  | 'sentenca_decisao'
  | 'procuracao'
  | 'contrato'
  | 'documentos_pessoais'
  | 'provas_documentais'
  | 'provas_fotograficas'
  | 'depoimentos_atas'
  | 'laudos_pericias'
  | 'correspondencias'
  | 'outros';

export interface DocumentoDrive {
  id: string;
  processo_id: string | null;
  /**
   * Cliente direto a que o documento pertence. Opcional — um doc pode
   * ser vinculado a processo (que por sua vez tem cliente) ou direto
   * ao cliente (procuração geral, RG, comprovantes que nao sao de um
   * processo especifico). Coluna adicionada em migration 20260415090549.
   */
  cliente_id: string | null;
  tipo_documento: TipoDocumentoDrive;
  nome: string;
  descricao: string | null;
  drive_url: string;
  drive_file_id: string;
  data_documento: string | null;
  tags: string[] | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export const TIPO_DOCUMENTO_DRIVE_LABELS: Record<TipoDocumentoDrive, string> = {
  peticao_inicial: 'Petição Inicial',
  contestacao: 'Contestação',
  replica_treplica: 'Réplica/Tréplica',
  recurso: 'Recurso',
  sentenca_decisao: 'Sentença/Decisão',
  procuracao: 'Procuração',
  contrato: 'Contrato',
  documentos_pessoais: 'Documentos Pessoais',
  provas_documentais: 'Provas Documentais',
  provas_fotograficas: 'Provas Fotográficas',
  depoimentos_atas: 'Depoimentos/Atas',
  laudos_pericias: 'Laudos/Perícias',
  correspondencias: 'Correspondências',
  outros: 'Outros',
};
