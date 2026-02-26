export interface PropostaTemplate {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  servico_padrao: string;
  template: string;
}

export const TEMPLATE_PROPOSTA_DIVORCIO = `PROPOSTA DE HONORÁRIOS ADVOCATÍCIOS

CONTRATANTES

CONTRATANTE: {nome_cliente}, {nacionalidade_cliente}, {estado_civil_cliente}, {profissao_cliente}, portador(a) do RG nº {rg_cliente} e inscrito(a) no CPF sob o nº {cpf_cliente}, residente e domiciliado(a) em {endereco_cliente}.

ESCRITÓRIO: {nome_escritorio}, inscrito no CNPJ sob o nº {cnpj_escritorio}, com sede em {endereco_escritorio}.

OBJETO

O presente instrumento tem por objeto a proposta de prestação de serviços advocatícios para assessoria jurídica em ação judicial de divórcio, guarda, alimentos e convivência.

O trabalho inclui reuniões presenciais, contato via WhatsApp ou telefone, além de toda consultoria necessária para esclarecer questões atinentes ao caso.

HONORÁRIOS

Pelos serviços propostos, o(a) CONTRATANTE pagará ao ESCRITÓRIO os seguintes honorários:

a) Entrada: {valor_entrada} ({valor_entrada_extenso});

b) Parcelas: {num_parcelas} parcelas mensais de {valor_parcelas} ({valor_parcelas_extenso}) cada.

PRAZO DE VALIDADE

Esta proposta tem validade de 15 (quinze) dias a partir da data de emissão.

{cidade_contrato}, {data_contrato}.


_________________________________
{nome_escritorio}`;

export const TEMPLATE_PROPOSTA_INVENTARIO = `PROPOSTA DE HONORÁRIOS ADVOCATÍCIOS

CONTRATANTES

CONTRATANTE: {nome_cliente}, {nacionalidade_cliente}, {estado_civil_cliente}, {profissao_cliente}, portador(a) do RG nº {rg_cliente} e inscrito(a) no CPF sob o nº {cpf_cliente}, residente e domiciliado(a) em {endereco_cliente}.

ESCRITÓRIO: {nome_escritorio}, inscrito no CNPJ sob o nº {cnpj_escritorio}, com sede em {endereco_escritorio}.

OBJETO

O presente instrumento tem por objeto a proposta de prestação de serviços advocatícios para assessoria jurídica em inventário judicial ou extrajudicial e partilha de bens.

O trabalho inclui reuniões presenciais, contato via WhatsApp ou telefone, além de toda consultoria necessária para esclarecer questões atinentes ao caso.

HONORÁRIOS

Pelos serviços propostos, o(a) CONTRATANTE pagará ao ESCRITÓRIO os seguintes honorários:

a) Entrada: {valor_entrada} ({valor_entrada_extenso});

b) Parcelas: {num_parcelas} parcelas mensais de {valor_parcelas} ({valor_parcelas_extenso}) cada.

PRAZO DE VALIDADE

Esta proposta tem validade de 15 (quinze) dias a partir da data de emissão.

{cidade_contrato}, {data_contrato}.


_________________________________
{nome_escritorio}`;

export const TEMPLATE_PROPOSTA_INDENIZACAO = `PROPOSTA DE HONORÁRIOS ADVOCATÍCIOS

CONTRATANTES

CONTRATANTE: {nome_cliente}, {nacionalidade_cliente}, {estado_civil_cliente}, {profissao_cliente}, portador(a) do RG nº {rg_cliente} e inscrito(a) no CPF sob o nº {cpf_cliente}, residente e domiciliado(a) em {endereco_cliente}.

ESCRITÓRIO: {nome_escritorio}, inscrito no CNPJ sob o nº {cnpj_escritorio}, com sede em {endereco_escritorio}.

OBJETO

O presente instrumento tem por objeto a proposta de prestação de serviços advocatícios para assessoria jurídica em ação de indenização por danos morais e materiais.

O trabalho inclui reuniões presenciais, contato via WhatsApp ou telefone, além de toda consultoria necessária para esclarecer questões atinentes ao caso.

HONORÁRIOS

a) Entrada: {valor_entrada} ({valor_entrada_extenso});

b) Parcelas: {num_parcelas} parcelas mensais de {valor_parcelas} ({valor_parcelas_extenso}) cada;

c) Êxito: {percentual_exito}% sobre o valor obtido.

PRAZO DE VALIDADE

Esta proposta tem validade de 15 (quinze) dias a partir da data de emissão.

{cidade_contrato}, {data_contrato}.


_________________________________
{nome_escritorio}`;

export const TEMPLATE_PROPOSTA_TRABALHISTA = `PROPOSTA DE HONORÁRIOS ADVOCATÍCIOS

CONTRATANTES

CONTRATANTE: {nome_cliente}, {nacionalidade_cliente}, {estado_civil_cliente}, {profissao_cliente}, portador(a) do RG nº {rg_cliente} e inscrito(a) no CPF sob o nº {cpf_cliente}, residente e domiciliado(a) em {endereco_cliente}.

ESCRITÓRIO: {nome_escritorio}, inscrito no CNPJ sob o nº {cnpj_escritorio}, com sede em {endereco_escritorio}.

OBJETO

O presente instrumento tem por objeto a proposta de prestação de serviços advocatícios para assessoria jurídica em reclamação trabalhista para defesa de direitos laborais.

O trabalho inclui reuniões presenciais, contato via WhatsApp ou telefone, além de toda consultoria necessária para esclarecer questões atinentes ao caso.

HONORÁRIOS

a) Entrada: {valor_entrada} ({valor_entrada_extenso});

b) Parcelas: {num_parcelas} parcelas mensais de {valor_parcelas} ({valor_parcelas_extenso}) cada;

c) Êxito: {percentual_exito}% sobre o valor obtido.

PRAZO DE VALIDADE

Esta proposta tem validade de 15 (quinze) dias a partir da data de emissão.

{cidade_contrato}, {data_contrato}.


_________________________________
{nome_escritorio}`;

export const TEMPLATE_PROPOSTA_CONSUMIDOR = `PROPOSTA DE HONORÁRIOS ADVOCATÍCIOS

CONTRATANTES

CONTRATANTE: {nome_cliente}, {nacionalidade_cliente}, {estado_civil_cliente}, {profissao_cliente}, portador(a) do RG nº {rg_cliente} e inscrito(a) no CPF sob o nº {cpf_cliente}, residente e domiciliado(a) em {endereco_cliente}.

ESCRITÓRIO: {nome_escritorio}, inscrito no CNPJ sob o nº {cnpj_escritorio}, com sede em {endereco_escritorio}.

OBJETO

O presente instrumento tem por objeto a proposta de prestação de serviços advocatícios para assessoria jurídica em ação de direito do consumidor.

O trabalho inclui reuniões presenciais, contato via WhatsApp ou telefone, além de toda consultoria necessária para esclarecer questões atinentes ao caso.

HONORÁRIOS

a) Entrada: {valor_entrada} ({valor_entrada_extenso});

b) Parcelas: {num_parcelas} parcelas mensais de {valor_parcelas} ({valor_parcelas_extenso}) cada.

PRAZO DE VALIDADE

Esta proposta tem validade de 15 (quinze) dias a partir da data de emissão.

{cidade_contrato}, {data_contrato}.


_________________________________
{nome_escritorio}`;

export const MODELOS_PROPOSTA: PropostaTemplate[] = [
  {
    id: 'proposta-divorcio',
    nome: 'Proposta - Divórcio e Família',
    tipo: 'familia',
    descricao: 'Proposta para ações de divórcio, guarda, alimentos e convivência',
    servico_padrao: 'assessoria jurídica em ação judicial de divórcio, guarda, alimentos e convivência',
    template: TEMPLATE_PROPOSTA_DIVORCIO,
  },
  {
    id: 'proposta-inventario',
    nome: 'Proposta - Inventário',
    tipo: 'familia',
    descricao: 'Proposta para inventário e partilha de bens',
    servico_padrao: 'assessoria jurídica em inventário judicial ou extrajudicial e partilha de bens',
    template: TEMPLATE_PROPOSTA_INVENTARIO,
  },
  {
    id: 'proposta-indenizacao',
    nome: 'Proposta - Indenização',
    tipo: 'civel',
    descricao: 'Proposta para ações indenizatórias',
    servico_padrao: 'assessoria jurídica em ação de indenização por danos morais e materiais',
    template: TEMPLATE_PROPOSTA_INDENIZACAO,
  },
  {
    id: 'proposta-trabalhista',
    nome: 'Proposta - Trabalhista',
    tipo: 'trabalhista',
    descricao: 'Proposta para ações trabalhistas',
    servico_padrao: 'assessoria jurídica em reclamação trabalhista para defesa de direitos laborais',
    template: TEMPLATE_PROPOSTA_TRABALHISTA,
  },
  {
    id: 'proposta-consumidor',
    nome: 'Proposta - Consumidor',
    tipo: 'consumidor',
    descricao: 'Proposta para ações de direito do consumidor',
    servico_padrao: 'assessoria jurídica em ação de direito do consumidor',
    template: TEMPLATE_PROPOSTA_CONSUMIDOR,
  },
];

export const TEXTO_INSTITUCIONAL = `Nosso escritório nasceu em meados de 2018, quando, ainda recém-formadas, decidimos nos unir e trilhar esse caminho de mãos dadas.

Trabalhamos com uma carteira limitada de clientes, pois acreditamos que quando damos atenção e acompanhamos a demanda de forma ARTESANAL, nos aproximamos mais de cada situação e conseguimos entregar um trabalho diferenciado.

A advocacia artesanal preza por uma jornada especial, feita calmamente, ouvindo as demandas do cliente e de forma personalizada, prezando pela excelência em todas as fases do trabalho.`;

export const TEXTO_SERVICO_COMPLETO = `O trabalho desenvolvido terá por objeto {descricao_servico}.

O trabalho inclui reuniões presenciais, contato via WhatsApp ou telefone, além de toda consultoria necessária para esclarecer questões atinentes ao caso.`;
