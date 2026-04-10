import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
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

// Pesquisas
import PesquisasIndex from "./pages/pesquisas/Index";
import PesquisasProcessos from "./pages/pesquisas/Processos";
import PesquisasHistorico from "./pages/pesquisas/Historico";
import PesquisasCNPJ from "./pages/pesquisas/CNPJ";
import PesquisasCPF from "./pages/pesquisas/CPF";

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
function ProtectedRoute({ children }: { children: React.ReactNode }) {
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

  return <DashboardLayout>{children}</DashboardLayout>;
}

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/auth" element={<Auth />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/leads" 
        element={
          <ProtectedRoute>
            <Leads />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/clientes" 
        element={
          <ProtectedRoute>
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
          <ProtectedRoute>
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
          <ProtectedRoute>
            <RelatoriosVendas />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/documentos"
        element={
          <ProtectedRoute>
            <Documentos />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/processos"
        element={
          <ProtectedRoute>
            <Processos />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/financeiro" 
        element={
          <ProtectedRoute>
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
          <ProtectedRoute>
            <Cadastros />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/configuracoes/modelos" 
        element={
          <ProtectedRoute>
            <Modelos />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/configuracoes/controle" 
        element={
          <ProtectedRoute>
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
          <ProtectedRoute>
            <ProcessosCalendario />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/processos/demandas" 
        element={
          <ProtectedRoute>
            <ProcessosDemandas />
          </ProtectedRoute>
        } 
      />
      
      {/* Financeiro - Subrotas */}
      <Route 
        path="/dashboard/financeiro/acordos" 
        element={
          <ProtectedRoute>
            <FinanceiroAcordos />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/financeiro/relatorios" 
        element={
          <ProtectedRoute>
            <FinanceiroRelatorios />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/financeiro/historico" 
        element={
          <ProtectedRoute>
            <FinanceiroHistorico />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/financeiro/pagamentos" 
        element={
          <ProtectedRoute>
            <FinanceiroPagamentos />
          </ProtectedRoute>
        } 
      />
      
      {/* Comunicação - Subrotas */}
      <Route 
        path="/dashboard/configuracoes/whatsapp-templates" 
        element={
          <ProtectedRoute>
            <ComunicacaoTemplates />
          </ProtectedRoute>
        } 
      />
      
      {/* Pesquisas - Subrotas */}
      <Route 
        path="/dashboard/pesquisas" 
        element={
          <ProtectedRoute>
            <PesquisasIndex />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/pesquisas/cnpj" 
        element={
          <ProtectedRoute>
            <PesquisasCNPJ />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/pesquisas/cpf" 
        element={
          <ProtectedRoute>
            <PesquisasCPF />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/pesquisas/historico" 
        element={
          <ProtectedRoute>
            <PesquisasHistorico />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/pesquisas/processos" 
        element={
          <ProtectedRoute>
            <PesquisasProcessos />
          </ProtectedRoute>
        } 
      />
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
