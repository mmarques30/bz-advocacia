import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { BreadcrumbItem } from '@/types/navigation';

export function useBreadcrumb(): BreadcrumbItem[] {
  const location = useLocation();
  
  return useMemo(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard' }
    ];
    
    // Mapear rotas para labels
    const routeLabels: Record<string, string> = {
      'leads': 'Vendas',
      'processos': 'Processos',
      'financeiro': 'Financeiro',
      'configuracoes': 'Configurações',
      'prazos': 'Prazos',
      'calendario': 'Calendário',
      'acordos': 'Acordos',
      'relatorios': 'Relatórios',
      'perfil': 'Meu Perfil',
      'usuarios': 'Usuários',
      'geral': 'Escritório',
      'templates': 'Templates',
      'tags': 'Tags',
      'logs': 'Logs',
    };
    
    let currentPath = '';
    pathParts.forEach((part, index) => {
      if (part === 'dashboard') return;
      
      currentPath += `/${part}`;
      const label = routeLabels[part] || part.charAt(0).toUpperCase() + part.slice(1);
      
      breadcrumbs.push({
        label,
        href: index < pathParts.length - 1 ? currentPath : undefined,
      });
    });
    
    return breadcrumbs;
  }, [location.pathname]);
}
