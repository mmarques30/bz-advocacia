export interface ProcuracaoTemplate {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  template: string;
}

export const TEMPLATE_PROCURACAO_GERAL = `PROCURAÇÃO


OUTORGANTE:\t{nome_cliente}, {nacionalidade_cliente}, inscrito(a) no CPF sob o nº {cpf_cliente}, inscrito(a) no RG sob o nº {rg_cliente}, {estado_civil_cliente}, {profissao_cliente}, residente e domiciliado(a) em {endereco_cliente}.

OUTORGADA:\tJULIANA DE LIMA BORGES GASPARINI, brasileira, casada, advogada com OAB/RS n. 83.345 e ELIZIANE ZEMBRUSKI, brasileira, divorciada, advogada com OAB/RS n. 115.245, ambas com escritório profissional a {endereco_escritorio}.

PODERES:\tPor este instrumento particular, o(s) outorgante(s) nomeia(m) e constitue(m), seu(s) bastante(s) procurador(es) acima identificado(s) para individualmente, patrocinar judicial, extrajudicial ou administrativamente, em qualquer foro ou instância, seus direitos e interesses, podendo, para tanto promover e acompanhar, transigir, desistir, concordar, reconvir, receber e dar quitação, arrematar, ou adjudicar bens em nome dos outorgantes; recusar julgadores, argüindo suspeição, firmar compromisso, usar dos poderes contidos nas cláusulas "ad judicia" e "et extra", assegurando ao(s) outorgado(s) honorários advocatícios de acordo com tabela de honorários da OAB/RS, com poderes para o foro em geral, mais os contidos no art. 38 CPC. Substabelecer no todo ou em parte com ou sem reserva dos poderes.

FINALIDADE:\t{objeto_contrato}


{cidade_contrato}, {data_contrato}.


_______________________________
{nome_cliente}`;

export const MODELOS_PROCURACAO: ProcuracaoTemplate[] = [
  {
    id: 'procuracao-geral',
    nome: 'Procuração Geral',
    tipo: 'procuracao',
    descricao: 'Procuração com poderes gerais para representação judicial e extrajudicial',
    template: TEMPLATE_PROCURACAO_GERAL,
  },
];
