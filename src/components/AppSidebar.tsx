import { useState } from "react";
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
  MessageSquare,
} from "lucide-react";
import { NavLink } from "react-router-dom";
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
    label: "Análises",
    url: "/dashboard", 
    icon: LayoutDashboard 
  },
  {
    title: "Vendas",
    label: "Gestão de Vendas",
    icon: Users,
    submenu: [
      { title: "Análises", url: "/dashboard/vendas/analises" },
      { title: "Marketing", url: "/dashboard/vendas/meta-ads" },
      { title: "Leads e Clientes", url: "/dashboard/leads" },
      { title: "Documentos", url: "/dashboard/documentos" },
      { title: "Relatórios Vendas", url: "/dashboard/vendas/relatorios" },
    ]
  },
    {
      title: "Processos",
      label: "Gestão de Rotinas",
      icon: Scale,
      submenu: [
        { title: "Todos os Processos", url: "/dashboard/processos" },
        { title: "Demandas", url: "/dashboard/processos/demandas" },
        { title: "Calendário e Prazos", url: "/dashboard/processos/calendario" },
        { title: "Relatório Clientes", url: "/dashboard/leads/relatorios-cliente" },
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
      { title: "Análises", url: "/dashboard/financeiro" },
      { title: "Pagamentos", url: "/dashboard/financeiro/pagamentos" },
      { title: "Relatórios Financeiros", url: "/dashboard/financeiro/relatorios" },
    ]
  },
  {
    title: "Administrativo",
    label: "Administrativo",
    icon: Settings,
    submenu: [
      { title: "Meu Perfil", url: "/dashboard/configuracoes/perfil" },
      { title: "Usuários", url: "/dashboard/configuracoes/usuarios" },
      { title: "Modelos Chat", url: "/dashboard/configuracoes/whatsapp-templates" },
      { title: "Automações", url: "/dashboard/configuracoes/automacoes" },
      { title: "Guia de Uso", url: "/dashboard/configuracoes/guia" },
    ]
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const isCollapsed = state === "collapsed";
  
  // Estado para controlar submenus abertos
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  
  const toggleMenu = (title: string) => {
    setOpenMenus(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
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
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.label}>
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && (
                            <>
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
                            </>
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      
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
