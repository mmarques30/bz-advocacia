export interface PropostaTemplate {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  servico_padrao: string;
}

export const MODELOS_PROPOSTA: PropostaTemplate[] = [
  {
    id: 'proposta-divorcio',
    nome: 'Proposta - Divórcio e Família',
    tipo: 'familia',
    descricao: 'Proposta para ações de divórcio, guarda, alimentos e convivência',
    servico_padrao: 'assessoria jurídica em ação judicial de divórcio, guarda, alimentos e convivência'
  },
  {
    id: 'proposta-inventario',
    nome: 'Proposta - Inventário',
    tipo: 'familia',
    descricao: 'Proposta para inventário e partilha de bens',
    servico_padrao: 'assessoria jurídica em inventário judicial ou extrajudicial e partilha de bens'
  },
  {
    id: 'proposta-indenizacao',
    nome: 'Proposta - Indenização',
    tipo: 'civel',
    descricao: 'Proposta para ações indenizatórias',
    servico_padrao: 'assessoria jurídica em ação de indenização por danos morais e materiais'
  },
  {
    id: 'proposta-trabalhista',
    nome: 'Proposta - Trabalhista',
    tipo: 'trabalhista',
    descricao: 'Proposta para ações trabalhistas',
    servico_padrao: 'assessoria jurídica em reclamação trabalhista para defesa de direitos laborais'
  },
  {
    id: 'proposta-consumidor',
    nome: 'Proposta - Consumidor',
    tipo: 'consumidor',
    descricao: 'Proposta para ações de direito do consumidor',
    servico_padrao: 'assessoria jurídica em ação de direito do consumidor'
  },
];

export const TEXTO_INSTITUCIONAL = `Nosso escritório nasceu em meados de 2018, quando, ainda recém-formadas, decidimos nos unir e trilhar esse caminho de mãos dadas.

Trabalhamos com uma carteira limitada de clientes, pois acreditamos que quando damos atenção e acompanhamos a demanda de forma ARTESANAL, nos aproximamos mais de cada situação e conseguimos entregar um trabalho diferenciado.

A advocacia artesanal preza por uma jornada especial, feita calmamente, ouvindo as demandas do cliente e de forma personalizada, prezando pela excelência em todas as fases do trabalho.`;

export const TEXTO_SERVICO_COMPLETO = `O trabalho desenvolvido terá por objeto {descricao_servico}.

O trabalho inclui reuniões presenciais, contato via WhatsApp ou telefone, além de toda consultoria necessária para esclarecer questões atinentes ao caso.`;
