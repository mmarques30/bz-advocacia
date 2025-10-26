export const TEMPLATE_VARIABLES = {
  cliente: [
    { value: '{nome_cliente}', label: 'Nome do Cliente' },
    { value: '{cpf_cliente}', label: 'CPF do Cliente' },
    { value: '{email_cliente}', label: 'Email do Cliente' },
    { value: '{telefone_cliente}', label: 'Telefone do Cliente' },
    { value: '{endereco_cliente}', label: 'Endereço do Cliente' },
  ],
  escritorio: [
    { value: '{nome_escritorio}', label: 'Nome do Escritório' },
    { value: '{oab_escritorio}', label: 'OAB do Escritório' },
    { value: '{cnpj_escritorio}', label: 'CNPJ do Escritório' },
    { value: '{endereco_escritorio}', label: 'Endereço do Escritório' },
    { value: '{telefone_escritorio}', label: 'Telefone do Escritório' },
    { value: '{email_escritorio}', label: 'Email do Escritório' },
  ],
  processo: [
    { value: '{numero_processo}', label: 'Número do Processo' },
    { value: '{tipo_processo}', label: 'Tipo do Processo' },
    { value: '{comarca}', label: 'Comarca' },
    { value: '{vara}', label: 'Vara' },
    { value: '{tribunal}', label: 'Tribunal' },
  ],
  sistema: [
    { value: '{data_atual}', label: 'Data Atual' },
    { value: '{hora_atual}', label: 'Hora Atual' },
    { value: '{usuario_atual}', label: 'Usuário Atual' },
  ],
};

export const getAllVariables = () => {
  return Object.values(TEMPLATE_VARIABLES).flat();
};

export const extractVariables = (conteudo: string): string[] => {
  const regex = /\{[^}]+\}/g;
  const matches = conteudo.match(regex);
  return matches ? Array.from(new Set(matches)) : [];
};

export const validateVariables = (conteudo: string): { valid: boolean; invalidVariables: string[] } => {
  const usedVariables = extractVariables(conteudo);
  const allValidVariables = getAllVariables().map(v => v.value);
  const invalidVariables = usedVariables.filter(v => !allValidVariables.includes(v));
  
  return {
    valid: invalidVariables.length === 0,
    invalidVariables,
  };
};

export const substituteVariables = (conteudo: string, data: Record<string, string>): string => {
  let result = conteudo;
  
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, data[key]);
  });
  
  return result;
};
