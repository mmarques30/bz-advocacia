import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { startVersionCheck } from "@/lib/versionCheck";
import { useAuth } from "@/hooks/useAuth";
import { useHasPageAccess } from "@/hooks/usePagePermissions";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AccessDenied } from "@/components/AccessDenied";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Atendimento from "./pages/Atendimento";
import Clientes from "./pages/Clientes";

import Processos from "./pages/Processos";
import Financeiro from "./pages/Financeiro";
import NotFound from "./pages/NotFound";
import MetaAds from "./pages/vendas/MetaAds";
import MetaAdsCallback from "./pages/vendas/MetaAdsCallback";
import VendasAnalises from "./pages/vendas/Analises";
import RelatoriosVendas from "./pages/vendas/RelatoriosVendas";
import Documentos from "./pages/Documentos";

// Configurações
import Configuracoes from "./pages/configuracoes/index";
import Cadastros from "./pages/configuracoes/Cadastros";
import Modelos from "./pages/configuracoes/Modelos";
import Controle from "./pages/configuracoes/Controle";

// Processos
import ProcessosCalendario from "./pages/processos/Calendario";
import ProcessosDemandas from "./pages/processos/Demandas";

// Financeiro
import FinanceiroAcordos from "./pages/financeiro/Acordos";
import FinanceiroRelatorios from "./pages/financeiro/Relatorios";
import FinanceiroHistorico from "./pages/financeiro/Historico";
import FinanceiroPagamentos from "./pages/financeiro/Pagamentos";

// Pesquisas (apenas Consulta gratuita BrasilAPI + Historico ate contratarmos APIs pagas)
import PesquisasIndex from "./pages/pesquisas/Index";
import PesquisasHistorico from "./pages/pesquisas/Historico";

// Comunicação
import ComunicacaoTemplates from "./pages/comunicacao/Templates";

// Root Redirect Component - Redirects based on auth status
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <Navigate to={user ? "/dashboard" : "/auth"} replace />;
}

// Protected Route Component
//
// `permission` opcional: quando passado, exige useHasPageAccess(permission).
// Admin sempre passa (o hook ja retorna todas as chaves pra admin).
function ProtectedRoute({
  children,
  permission,
}: {
  children: React.ReactNode;
  permission?: string;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout>
      {permission ? <PermissionGate permission={permission}>{children}</PermissionGate> : children}
    </DashboardLayout>
  );
}

// Wrapper interno: chama o hook so quando ha permission, evita
// useQuery rodando em todas as rotas.
function PermissionGate({ permission, children }: { permission: string; children: React.ReactNode }) {
  const { hasAccess, isLoading } = useHasPageAccess(permission);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (!hasAccess) return <AccessDenied />;
  return <>{children}</>;
}

const App = () => {
  useEffect(() => { startVersionCheck(); }, []);
  return (
  <TooltipProvider>
    <Sonner />
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute permission="painel">
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/leads"
        element={
          <ProtectedRoute permission="gestao_vendas.leads">
            <Leads />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/atendimento"
        element={
          <ProtectedRoute permission="gestao_vendas.atendimento">
            <Atendimento />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/clientes"
        element={
          <ProtectedRoute permission="gestao_clientes.clientes">
            <Clientes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/vendas/analises"
        element={<Navigate to="/dashboard/vendas/meta-ads" replace />}
      />
      <Route
        path="/dashboard/vendas/meta-ads"
        element={
          <ProtectedRoute permission="gestao_vendas.marketing">
            <MetaAds />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/vendas/meta-ads/callback"
        element={<MetaAdsCallback />}
      />
      <Route
        path="/dashboard/vendas/relatorios"
        element={
          <ProtectedRoute permission="relatorios.vendas">
            <RelatoriosVendas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/documentos"
        element={
          <ProtectedRoute permission="gestao_clientes.documentos">
            <Documentos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/processos"
        element={
          <ProtectedRoute permission="gestao_rotinas.processos">
            <Processos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/financeiro"
        element={
          <ProtectedRoute permission="financeiro.analises">
            <Financeiro />
          </ProtectedRoute>
        }
      />

      {/* Configurações */}
      <Route
        path="/dashboard/configuracoes"
        element={
          <ProtectedRoute>
            <Configuracoes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/configuracoes/cadastros"
        element={
          <ProtectedRoute permission="administrativo.cadastros">
            <Cadastros />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/configuracoes/modelos"
        element={
          <ProtectedRoute permission="administrativo.modelos">
            <Modelos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/configuracoes/controle"
        element={
          <ProtectedRoute permission="administrativo.controle">
            <Controle />
          </ProtectedRoute>
        }
      />
      {/* Redirects for old routes */}
      <Route path="/dashboard/configuracoes/perfil" element={<Navigate to="/dashboard/configuracoes/cadastros" replace />} />
      <Route path="/dashboard/configuracoes/usuarios" element={<Navigate to="/dashboard/configuracoes/cadastros" replace />} />
      
      <Route path="/dashboard/configuracoes/listas" element={<Navigate to="/dashboard/configuracoes/modelos" replace />} />
      <Route path="/dashboard/configuracoes/guia" element={<Navigate to="/dashboard/configuracoes/controle" replace />} />
      <Route path="/dashboard/configuracoes/atualizacoes" element={<Navigate to="/dashboard/configuracoes/controle" replace />} />
      <Route path="/dashboard/configuracoes/automacoes" element={<Navigate to="/dashboard/configuracoes/controle" replace />} />
      
      {/* Processos - Subrotas */}
      <Route
        path="/dashboard/processos/calendario"
        element={
          <ProtectedRoute permission="gestao_rotinas.prazos">
            <ProcessosCalendario />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/processos/demandas"
        element={
          <ProtectedRoute permission="gestao_rotinas.tarefas">
            <ProcessosDemandas />
          </ProtectedRoute>
        }
      />

      {/* Financeiro - Subrotas */}
      <Route
        path="/dashboard/financeiro/acordos"
        element={
          <ProtectedRoute permission="financeiro.analises">
            <FinanceiroAcordos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/financeiro/relatorios"
        element={
          <ProtectedRoute permission="relatorios.financeiro">
            <FinanceiroRelatorios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/financeiro/historico"
        element={
          <ProtectedRoute permission="financeiro.historico">
            <FinanceiroHistorico />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/financeiro/pagamentos"
        element={
          <ProtectedRoute permission="financeiro.pagamentos">
            <FinanceiroPagamentos />
          </ProtectedRoute>
        }
      />

      {/* Comunicação - Subrotas (Templates compartilha a mesma chave de Modelos) */}
      <Route
        path="/dashboard/configuracoes/whatsapp-templates"
        element={
          <ProtectedRoute permission="administrativo.modelos">
            <ComunicacaoTemplates />
          </ProtectedRoute>
        }
      />

      {/* Pesquisas - Subrotas */}
      <Route
        path="/dashboard/pesquisas"
        element={
          <ProtectedRoute permission="pesquisas.consulta_empresa">
            <PesquisasIndex />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/pesquisas/historico"
        element={
          <ProtectedRoute permission="pesquisas.historico">
            <PesquisasHistorico />
          </ProtectedRoute>
        }
      />
      {/* Links antigos (cnpj, cpf via Apify, processos via Datajud) redirecionam pra raiz */}
      <Route path="/dashboard/pesquisas/cnpj" element={<Navigate to="/dashboard/pesquisas" replace />} />
      <Route path="/dashboard/pesquisas/cpf" element={<Navigate to="/dashboard/pesquisas" replace />} />
      <Route path="/dashboard/pesquisas/processos" element={<Navigate to="/dashboard/pesquisas" replace />} />
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </BrowserRouter>
  </TooltipProvider>
  );
};

export default App;
