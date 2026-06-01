import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Scale, 
  DollarSign, 
  Settings, 
  LogOut,
  ChevronDown,
  ChevronUp,
  Search,
  TrendingUp,
  FileBarChart,
  Inbox,

} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logoBZ from "@/assets/logo-bz-new.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useBacklogTriagemCount } from "@/hooks/useBacklogTriagem";


interface MenuItem {
  title: string;
  label: string;
  icon: any;
  url?: string;
  badge?: number;
  submenu?: {
    title: string;
    url: string;
    badge?: number;
  }[];
}

const menuItems: MenuItem[] = [
  { 
    title: "Analises", 
    label: "Painel B&Z",
    url: "/dashboard", 
    icon: LayoutDashboard 
  },
  {
    title: "GestaoVendas",
    label: "Gestão de Vendas",
    icon: TrendingUp,
    submenu: [
      { title: "Marketing", url: "/dashboard/vendas/meta-ads" },
      { title: "Leads", url: "/dashboard/leads" },
      { title: "Atendimento", url: "/dashboard/atendimento" },
      { title: "Backlog Triagem", url: "/dashboard/backlog-triagem" },
    ]

  },
  {
    title: "Clientes",
    label: "Gestão de Clientes",
    icon: Users,
    submenu: [
      { title: "Clientes", url: "/dashboard/clientes" },
      { title: "Documentos", url: "/dashboard/documentos" },
    ]
  },
  {
    title: "Rotinas",
    label: "Gestão de Rotinas",
    icon: Scale,
    submenu: [
      { title: "Processos", url: "/dashboard/processos" },
      { title: "Tarefas", url: "/dashboard/processos/demandas" },
      { title: "Prazos", url: "/dashboard/processos/calendario" },
    ]
  },
  {
    title: "Pesquisas",
    label: "Pesquisas",
    icon: Search,
    submenu: [
      { title: "Visão Geral", url: "/dashboard/pesquisas" },
      { title: "Consultar Processo", url: "/dashboard/pesquisas/processos" },
      { title: "Consultar Pessoa (CPF)", url: "/dashboard/pesquisas/cpf" },
      { title: "Consultar Empresa", url: "/dashboard/pesquisas/cnpj" },
      { title: "Histórico", url: "/dashboard/pesquisas/historico" },
    ]
  },
  {
    title: "Financeiro",
    label: "Financeiro",
    icon: DollarSign,
    submenu: [
      { title: "Gestão Financeira", url: "/dashboard/financeiro" },
      { title: "Pagamentos", url: "/dashboard/financeiro/pagamentos" },
      { title: "Histórico", url: "/dashboard/financeiro/historico" },
    ]
  },
  {
    title: "Relatorios",
    label: "Relatórios",
    icon: FileBarChart,
    submenu: [
      { title: "Vendas", url: "/dashboard/vendas/relatorios" },
      { title: "Financeiro", url: "/dashboard/financeiro/relatorios" },
    ]
  },
  {
    title: "Administrativo",
    label: "Administrativo",
    icon: Settings,
    submenu: [
      { title: "Cadastros", url: "/dashboard/configuracoes/cadastros" },
      { title: "Modelos", url: "/dashboard/configuracoes/modelos" },
      { title: "Controle", url: "/dashboard/configuracoes/controle" },
    ]
  },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const { signOut } = useAuth();
  const location = useLocation();
  const isCollapsed = state === "collapsed";
  const { data: backlogCount = 0 } = useBacklogTriagemCount();

  // Injeta badge dinâmico no item Backlog Triagem + grupo pai
  const dynamicMenu: MenuItem[] = menuItems.map((item) => {
    if (!item.submenu) return item;
    const subs = item.submenu.map((s) =>
      s.url === "/dashboard/backlog-triagem"
        ? { ...s, badge: backlogCount > 0 ? backlogCount : undefined }
        : s,
    );
    const groupBadge = subs.some((s) => s.url === "/dashboard/backlog-triagem")
      ? (backlogCount > 0 ? backlogCount : undefined)
      : item.badge;
    return { ...item, submenu: subs, badge: groupBadge };
  });

  const activeGroup = dynamicMenu.find(item =>
    item.submenu?.some(sub => location.pathname.startsWith(sub.url))
  )?.title;


  const [openMenus, setOpenMenus] = useState<string[]>(
    () => {
      const initial = menuItems.find(item =>
        item.submenu?.some(sub => location.pathname.startsWith(sub.url))
      )?.title;
      return initial ? [initial] : [];
    }
  );

  useEffect(() => {
    if (activeGroup && !openMenus.includes(activeGroup)) {
      setOpenMenus(prev => [...prev, activeGroup]);
    }
  }, [location.pathname, activeGroup]);
  
  const toggleMenu = (title: string) => {
    setOpenMenus(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const handleCollapsedClick = (title: string) => {
    toggleSidebar();
    if (!openMenus.includes(title)) {
      setOpenMenus(prev => [...prev, title]);
    }
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <img src={logoBZ} alt="B&Z Advocacia" className="h-8 w-8 object-contain" />
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-seasons font-bold text-foreground">B&Z</h2>
              <p className="text-xs text-muted-foreground">Advocacia</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isOpen = openMenus.includes(item.title);
                
                if (!hasSubmenu) {
                  // Item simples sem submenu
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <NavLink
                          to={item.url!}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-2",
                              isActive
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-accent/50"
                            )
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span>{item.label}</span>}
                          {!isCollapsed && item.badge && (
                            <Badge variant="destructive" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
                
                // Item com submenu
                return (
                  <Collapsible
                    key={item.title}
                    open={isOpen}
                    onOpenChange={() => toggleMenu(item.title)}
                  >
                    <SidebarMenuItem>
                       {isCollapsed ? (
                        <SidebarMenuButton
                          tooltip={item.label}
                          onClick={() => handleCollapsedClick(item.title)}
                        >
                          <item.icon className="h-4 w-4" />
                        </SidebarMenuButton>
                      ) : (
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.label}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                            {item.badge && (
                              <Badge variant="destructive" className="ml-auto">
                                {item.badge}
                              </Badge>
                            )}
                            {isOpen ? (
                              <ChevronUp className="ml-auto h-4 w-4" />
                            ) : (
                              <ChevronDown className="ml-auto h-4 w-4" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                      )}
                      
                      {!isCollapsed && (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.submenu.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.url}>
                                <SidebarMenuSubButton asChild>
                                  <NavLink
                                    to={subItem.url}
                                    className={({ isActive }) =>
                                      cn(
                                        "flex items-center gap-2",
                                        isActive && "bg-accent text-accent-foreground"
                                      )
                                    }
                                  >
                                    <span>{subItem.title}</span>
                                    {subItem.badge && (
                                      <Badge variant="secondary" className="ml-auto">
                                        {subItem.badge}
                                      </Badge>
                                    )}
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-2"
          size={isCollapsed ? "icon" : "default"}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
