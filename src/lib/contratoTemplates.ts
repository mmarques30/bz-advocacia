export const TEMPLATE_CONTRATO_DIVORCIO = `CONTRATO DE HONORÁRIOS ADVOCATÍCIOS

CONTRATANTES

CONTRATANTE: {nome_cliente}, {nacionalidade_cliente}, {estado_civil_cliente}, {profissao_cliente}, portador(a) do RG nº {rg_cliente} e inscrito(a) no CPF sob o nº {cpf_cliente}, residente e domiciliado(a) em {endereco_cliente}.

CONTRATADO: {nome_escritorio}, inscrito no CNPJ sob o nº {cnpj_escritorio}, com sede em {endereco_escritorio}, representado por seus advogados.

CLÁUSULA PRIMEIRA - DO OBJETO

O presente contrato tem por objeto a prestação de serviços advocatícios para {objeto_contrato}.

CLÁUSULA SEGUNDA - DOS HONORÁRIOS

Pelos serviços prestados, o(a) CONTRATANTE pagará ao CONTRATADO os seguintes honorários:

a) Entrada: {valor_entrada} ({valor_entrada_extenso}), a ser paga no ato da assinatura deste contrato;

b) Parcelas: {num_parcelas} parcelas mensais e sucessivas de {valor_parcelas} ({valor_parcelas_extenso}) cada, vencendo a primeira em 30 (trinta) dias após a assinatura deste contrato.

CLÁUSULA TERCEIRA - DA VIGÊNCIA

O presente contrato terá vigência enquanto perdurar a prestação de serviços advocatícios objeto deste instrumento.

CLÁUSULA QUARTA - DAS OBRIGAÇÕES

O CONTRATADO se obriga a:
- Acompanhar e representar o CONTRATANTE em todas as fases do processo;
- Manter o CONTRATANTE informado sobre o andamento do processo;
- Defender os interesses do CONTRATANTE com zelo e dedicação.

O CONTRATANTE se obriga a:
- Fornecer todos os documentos e informações necessários à condução do processo;
- Efetuar os pagamentos nas datas acordadas;
- Comparecer às audiências e demais atos processuais quando convocado.

CLÁUSULA QUINTA - DO FORO

As partes elegem o foro da Comarca de {cidade_contrato}/{estado_escritorio} para dirimir quaisquer dúvidas oriundas do presente contrato.

E por estarem assim justos e contratados, firmam o presente instrumento em duas vias de igual teor e forma.

{cidade_contrato}, {data_contrato}.


_________________________________
{nome_cliente}
CONTRATANTE


_________________________________
{nome_escritorio}
CONTRATADO`;

export const TEMPLATE_CONTRATO_INDENIZACAO = `CONTRATO DE HONORÁRIOS ADVOCATÍCIOS

CONTRATANTES

CONTRATANTE: {nome_cliente}, {nacionalidade_cliente}, {estado_civil_cliente}, {profissao_cliente}, portador(a) do RG nº {rg_cliente} e inscrito(a) no CPF sob o nº {cpf_cliente}, residente e domiciliado(a) em {endereco_cliente}.

CONTRATADO: {nome_escritorio}, inscrito no CNPJ sob o nº {cnpj_escritorio}, com sede em {endereco_escritorio}, representado por seus advogados.

CLÁUSULA PRIMEIRA - DO OBJETO

O presente contrato tem por objeto a prestação de serviços advocatícios para {objeto_contrato}.

CLÁUSULA SEGUNDA - DOS HONORÁRIOS

Pelos serviços prestados, o(a) CONTRATANTE pagará ao CONTRATADO os seguintes honorários:

a) Entrada: {valor_entrada} ({valor_entrada_extenso}), a ser paga no ato da assinatura deste contrato;

b) Parcelas: {num_parcelas} parcelas mensais e sucessivas de {valor_parcelas} ({valor_parcelas_extenso}) cada;

c) Êxito: {percentual_exito}% ({percentual_exito} por cento) sobre o valor total da condenação ou acordo obtido.

CLÁUSULA TERCEIRA - DA VIGÊNCIA

O presente contrato terá vigência enquanto perdurar a prestação de serviços advocatícios objeto deste instrumento.

CLÁUSULA QUARTA - DAS OBRIGAÇÕES DO CONTRATADO

O CONTRATADO se compromete a:
- Ingressar com a ação judicial competente;
- Acompanhar o processo em todas as instâncias necessárias;
- Manter o CONTRATANTE informado sobre o andamento processual;
- Defender os interesses do CONTRATANTE com dedicação e ética profissional.

CLÁUSULA QUINTA - DAS OBRIGAÇÕES DO CONTRATANTE

O CONTRATANTE se compromete a:
- Fornecer todos os documentos e informações solicitados;
- Efetuar os pagamentos conforme estipulado;
- Comparecer às audiências quando convocado;
- Informar mudanças de endereço ou telefone.

CLÁUSULA SEXTA - DO FORO

Fica eleito o foro da Comarca de {cidade_contrato}/{estado_escritorio} para dirimir quaisquer questões oriundas deste contrato.

E por estarem de acordo, assinam o presente em duas vias de igual teor.

{cidade_contrato}, {data_contrato}.


_________________________________
{nome_cliente}
CONTRATANTE


_________________________________
{nome_escritorio}
CONTRATADO`;

export const TEMPLATE_ADENDO = `ADENDO AO CONTRATO DE HONORÁRIOS ADVOCATÍCIOS

CONTRATANTES

CONTRATANTE: {nome_cliente}, inscrito(a) no CPF sob o nº {cpf_cliente}.

CONTRATADO: {nome_escritorio}, inscrito no CNPJ sob o nº {cnpj_escritorio}.

As partes acima qualificadas, já identificadas no contrato de honorários advocatícios firmado anteriormente, resolvem celebrar o presente ADENDO, mediante as seguintes cláusulas e condições:

CLÁUSULA PRIMEIRA - DO OBJETO DO ADENDO

O presente adendo tem por finalidade {objeto_contrato}.

CLÁUSULA SEGUNDA - DAS CONDIÇÕES

{observacoes_contrato}

CLÁUSULA TERCEIRA - DA RATIFICAÇÃO

Ficam ratificadas todas as demais cláusulas e condições do contrato original que não foram expressamente modificadas por este adendo.

E por estarem de acordo, assinam o presente adendo em duas vias de igual teor.

{cidade_contrato}, {data_contrato}.


_________________________________
{nome_cliente}
CONTRATANTE


_________________________________
{nome_escritorio}
CONTRATADO`;

export const MODELOS_CONTRATO = [
  {
    id: 'divorcio',
    nome: 'Contrato de Honorários - Divórcio',
    tipo: 'divorcio',
    descricao: 'Modelo padrão para ações de divórcio consensual ou litigioso',
    template: TEMPLATE_CONTRATO_DIVORCIO,
  },
  {
    id: 'indenizacao',
    nome: 'Contrato de Honorários - Indenização',
    tipo: 'indenizacao',
    descricao: 'Modelo para ações indenizatórias com cláusula de êxito',
    template: TEMPLATE_CONTRATO_INDENIZACAO,
  },
  {
    id: 'adendo',
    nome: 'Adendo Contratual',
    tipo: 'outro',
    descricao: 'Adendo para modificar cláusulas de contrato existente',
    template: TEMPLATE_ADENDO,
  },
];
