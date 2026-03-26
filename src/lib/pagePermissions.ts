// Definição de todas as páginas, subpáginas e abas do sistema
export interface PagePermission {
  key: string;
  label: string;
  description?: string;
  parent?: string;
  children?: PagePermission[];
}

export const PAGE_PERMISSIONS: PagePermission[] = [
  {
    key: "painel",
    label: "Painel B&Z",
    description: "Dashboard principal do sistema",
  },
  {
    key: "gestao_vendas",
    label: "Gestão de Vendas",
    description: "Módulo de vendas e marketing",
    children: [
      { key: "gestao_vendas.marketing", label: "Marketing", parent: "gestao_vendas" },
      { key: "gestao_vendas.leads", label: "Leads", parent: "gestao_vendas" },
    ],
  },
  {
    key: "gestao_clientes",
    label: "Gestão de Clientes",
    description: "Gerenciamento de clientes ativos",
    children: [
      { key: "gestao_clientes.clientes", label: "Clientes", parent: "gestao_clientes" },
      { key: "gestao_clientes.documentos", label: "Documentos", parent: "gestao_clientes" },
    ],
  },
  {
    key: "gestao_rotinas",
    label: "Gestão de Rotinas",
    description: "Tarefas e prazos operacionais",
    children: [
      { key: "gestao_rotinas.tarefas", label: "Tarefas", parent: "gestao_rotinas" },
      { key: "gestao_rotinas.prazos", label: "Prazos", parent: "gestao_rotinas" },
    ],
  },
  {
    key: "pesquisas",
    label: "Pesquisas",
    description: "Consultas e pesquisas jurídicas",
    children: [
      { key: "pesquisas.visao_geral", label: "Visão Geral", parent: "pesquisas" },
      { key: "pesquisas.processos", label: "Consultar Processo", parent: "pesquisas" },
      { key: "pesquisas.cpf", label: "Consultar Pessoa (CPF)", parent: "pesquisas" },
      { key: "pesquisas.cnpj", label: "Consultar Empresa", parent: "pesquisas" },
      { key: "pesquisas.historico", label: "Histórico", parent: "pesquisas" },
    ],
  },
  {
    key: "financeiro",
    label: "Financeiro",
    description: "Módulo financeiro",
    children: [
      { key: "financeiro.analises", label: "Análises", parent: "financeiro" },
      { key: "financeiro.pagamentos", label: "Pagamentos", parent: "financeiro" },
    ],
  },
  {
    key: "relatorios",
    label: "Relatórios",
    description: "Relatórios de vendas e financeiros",
    children: [
      { key: "relatorios.vendas", label: "Vendas", parent: "relatorios" },
      { key: "relatorios.financeiro", label: "Financeiro", parent: "relatorios" },
    ],
  },
  {
    key: "administrativo",
    label: "Administrativo",
    description: "Configurações do sistema",
    children: [
      { key: "administrativo.cadastros", label: "Cadastros", parent: "administrativo" },
      { key: "administrativo.modelos", label: "Modelos", parent: "administrativo" },
      { key: "administrativo.controle", label: "Controle", parent: "administrativo" },
      { key: "administrativo.treinamentos", label: "Treinamentos", parent: "administrativo" },
      { key: "administrativo.senhas", label: "Senhas do Sistema", parent: "administrativo" },
    ],
  },
];

// Mapeamento de rotas para chaves de permissão
export const ROUTE_TO_PERMISSION: Record<string, string> = {
  "/dashboard": "painel",
  "/dashboard/vendas/meta-ads": "gestao_vendas.marketing",
  "/dashboard/leads": "gestao_vendas.leads",
  "/dashboard/clientes": "gestao_clientes.clientes",
  "/dashboard/documentos": "gestao_clientes.documentos",
  "/dashboard/vendas/relatorios": "relatorios.vendas",
  "/dashboard/processos/demandas": "gestao_rotinas.tarefas",
  "/dashboard/processos/calendario": "gestao_rotinas.prazos",
  "/dashboard/pesquisas": "pesquisas.visao_geral",
  "/dashboard/pesquisas/processos": "pesquisas.processos",
  "/dashboard/pesquisas/cpf": "pesquisas.cpf",
  "/dashboard/pesquisas/cnpj": "pesquisas.cnpj",
  "/dashboard/pesquisas/historico": "pesquisas.historico",
  "/dashboard/financeiro": "financeiro.analises",
  "/dashboard/financeiro/pagamentos": "financeiro.pagamentos",
  "/dashboard/financeiro/relatorios": "relatorios.financeiro",
  "/dashboard/configuracoes/cadastros": "administrativo.cadastros",
  "/dashboard/configuracoes/modelos": "administrativo.modelos",
  "/dashboard/configuracoes/controle": "administrativo.controle",
};

// Obter todas as chaves de permissão em formato flat
export function getAllPermissionKeys(): string[] {
  const keys: string[] = [];
  
  for (const page of PAGE_PERMISSIONS) {
    keys.push(page.key);
    if (page.children) {
      for (const child of page.children) {
        keys.push(child.key);
      }
    }
  }
  
  return keys;
}

// Verificar se uma chave é de página pai
export function isParentKey(key: string): boolean {
  return PAGE_PERMISSIONS.some(p => p.key === key && p.children && p.children.length > 0);
}

// Obter filhos de uma página pai
export function getChildrenKeys(parentKey: string): string[] {
  const parent = PAGE_PERMISSIONS.find(p => p.key === parentKey);
  if (!parent?.children) return [];
  return parent.children.map(c => c.key);
}
