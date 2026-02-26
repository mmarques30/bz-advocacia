import { DadosCliente, DadosContrato, DadosEscritorio, ValoresContrato } from "@/types/contratos";

export const formatarCPF = (cpf: string): string => {
  const numeros = cpf.replace(/\D/g, '');
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatarTelefone = (telefone: string): string => {
  const numeros = telefone.replace(/\D/g, '');
  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
};

export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

export const formatarDataExtenso = (data: Date | string): string => {
  const d = typeof data === 'string' ? new Date(data) : data;
  return d.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const valorPorExtenso = (valor: number): string => {
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  if (valor === 0) return 'zero reais';
  if (valor === 100) return 'cem reais';

  const partes: string[] = [];
  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);

  if (inteiro >= 1000) {
    const milhares = Math.floor(inteiro / 1000);
    if (milhares === 1) {
      partes.push('mil');
    } else {
      partes.push(converterCentenas(milhares, unidades, especiais, dezenas, centenas) + ' mil');
    }
  }

  const resto = inteiro % 1000;
  if (resto > 0) {
    partes.push(converterCentenas(resto, unidades, especiais, dezenas, centenas));
  }

  let resultado = partes.join(' e ');
  resultado += inteiro === 1 ? ' real' : ' reais';

  if (centavos > 0) {
    resultado += ' e ' + converterCentenas(centavos, unidades, especiais, dezenas, centenas);
    resultado += centavos === 1 ? ' centavo' : ' centavos';
  }

  return resultado;
};

const converterCentenas = (
  num: number,
  unidades: string[],
  especiais: string[],
  dezenas: string[],
  centenas: string[]
): string => {
  if (num === 0) return '';
  if (num < 10) return unidades[num];
  if (num < 20) return especiais[num - 10];
  if (num < 100) {
    const dezena = Math.floor(num / 10);
    const unidade = num % 10;
    return dezenas[dezena] + (unidade > 0 ? ' e ' + unidades[unidade] : '');
  }
  if (num === 100) return 'cem';
  const centena = Math.floor(num / 100);
  const resto = num % 100;
  return centenas[centena] + (resto > 0 ? ' e ' + converterCentenas(resto, unidades, especiais, dezenas, centenas) : '');
};

export const substituirVariaveis = (
  template: string,
  cliente: DadosCliente,
  escritorio: DadosEscritorio,
  valores: ValoresContrato,
  dadosContrato: DadosContrato
): string => {
  let resultado = template;

  // Dados do cliente
  resultado = resultado.replace(/{nome_cliente}/g, cliente.nome_completo || '');
  resultado = resultado.replace(/{cpf_cliente}/g, cliente.cpf ? formatarCPF(cliente.cpf) : '');
  resultado = resultado.replace(/{rg_cliente}/g, cliente.rg || '');
  resultado = resultado.replace(/{nacionalidade_cliente}/g, cliente.nacionalidade || 'brasileiro(a)');
  resultado = resultado.replace(/{profissao_cliente}/g, cliente.profissao || '');
  resultado = resultado.replace(/{estado_civil_cliente}/g, cliente.estado_civil || '');
  resultado = resultado.replace(/{endereco_cliente}/g, cliente.endereco_completo || '');
  resultado = resultado.replace(/{email_cliente}/g, cliente.email || '');
  resultado = resultado.replace(/{telefone_cliente}/g, cliente.telefone ? formatarTelefone(cliente.telefone) : '');
  resultado = resultado.replace(/{cidade_cliente}/g, cliente.endereco_cidade || '');
  resultado = resultado.replace(/{estado_cliente}/g, cliente.endereco_estado || '');
  resultado = resultado.replace(/{cep_cliente}/g, cliente.endereco_cep || '');

  // Dados do escritório
  resultado = resultado.replace(/{nome_escritorio}/g, escritorio.nome_escritorio || '');
  resultado = resultado.replace(/{cnpj_escritorio}/g, escritorio.cnpj || '');
  resultado = resultado.replace(/{oab_escritorio}/g, escritorio.oab_principal || '');
  resultado = resultado.replace(/{endereco_escritorio}/g, escritorio.endereco_completo || '');
  resultado = resultado.replace(/{telefone_escritorio}/g, escritorio.telefone || '');
  resultado = resultado.replace(/{email_escritorio}/g, escritorio.email || '');
  resultado = resultado.replace(/{cidade_escritorio}/g, escritorio.cidade || '');
  resultado = resultado.replace(/{estado_escritorio}/g, escritorio.estado || '');

  // Valores do contrato
  resultado = resultado.replace(/{valor_entrada}/g, valores.valor_entrada ? formatarMoeda(valores.valor_entrada) : '');
  resultado = resultado.replace(/{valor_entrada_extenso}/g, valores.valor_entrada ? valorPorExtenso(valores.valor_entrada) : '');
  resultado = resultado.replace(/{valor_parcelas}/g, valores.valor_parcelas ? formatarMoeda(valores.valor_parcelas) : '');
  resultado = resultado.replace(/{valor_parcelas_extenso}/g, valores.valor_parcelas ? valorPorExtenso(valores.valor_parcelas) : '');
  resultado = resultado.replace(/{num_parcelas}/g, valores.num_parcelas?.toString() || '');
  resultado = resultado.replace(/{percentual_exito}/g, valores.percentual_exito?.toString() || '');
  resultado = resultado.replace(/{valor_total}/g, valores.valor_total ? formatarMoeda(valores.valor_total) : '');
  resultado = resultado.replace(/{valor_total_extenso}/g, valores.valor_total ? valorPorExtenso(valores.valor_total) : '');

  // Dados do contrato
  resultado = resultado.replace(/{objeto_contrato}/g, dadosContrato.objeto || '');
  resultado = resultado.replace(/{cidade_contrato}/g, dadosContrato.cidade || escritorio.cidade || '');
  resultado = resultado.replace(/{data_contrato}/g, dadosContrato.data_contrato ? formatarDataExtenso(dadosContrato.data_contrato) : formatarDataExtenso(new Date()));

  // Sistema
  resultado = resultado.replace(/{data_atual}/g, formatarDataExtenso(new Date()));
  resultado = resultado.replace(/{hora_atual}/g, new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

  return resultado;
};

export const extrairVariaveisFaltantes = (
  template: string,
  cliente: DadosCliente
): string[] => {
  // Email é opcional - não exigir para gerar contrato
  const variaveisCliente = [
    { var: '{cpf_cliente}', campo: 'cpf', valor: cliente.cpf },
    { var: '{rg_cliente}', campo: 'rg', valor: cliente.rg },
    { var: '{nacionalidade_cliente}', campo: 'nacionalidade', valor: cliente.nacionalidade },
    { var: '{profissao_cliente}', campo: 'profissao', valor: cliente.profissao },
    { var: '{estado_civil_cliente}', campo: 'estado_civil', valor: cliente.estado_civil },
    { var: '{endereco_cliente}', campo: 'endereco_completo', valor: cliente.endereco_completo },
  ];

  return variaveisCliente
    .filter(v => template.includes(v.var) && !v.valor)
    .map(v => v.campo);
};
