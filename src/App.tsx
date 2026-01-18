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
import RelatoriosCliente from "./pages/leads/RelatoriosCliente";
import Processos from "./pages/Processos";
import Financeiro from "./pages/Financeiro";
import NotFound from "./pages/NotFound";
import MetaAds from "./pages/vendas/MetaAds";
import MetaAdsCallback from "./pages/vendas/MetaAdsCallback";
import VendasAnalises from "./pages/vendas/Analises";

// Configurações
import Configuracoes from "./pages/configuracoes/index";
import Perfil from "./pages/configuracoes/Perfil";
import Usuarios from "./pages/configuracoes/Usuarios";
import Geral from "./pages/configuracoes/Geral";
import Templates from "./pages/configuracoes/Templates";
import Tags from "./pages/configuracoes/Tags";
import Logs from "./pages/configuracoes/Logs";
import Demandas from "./pages/configuracoes/Demandas";

// Processos
import ProcessosPrazos from "./pages/processos/Prazos";
import ProcessosCalendario from "./pages/processos/Calendario";
import ProcessosDocumentos from "./pages/processos/Documentos";

// Financeiro
import FinanceiroAcordos from "./pages/financeiro/Acordos";
import FinanceiroRelatorios from "./pages/financeiro/Relatorios";
import FinanceiroHistorico from "./pages/financeiro/Historico";

// Pesquisas
import PesquisasIndex from "./pages/pesquisas/Index";
import PesquisasPessoas from "./pages/pesquisas/Pessoas";
import PesquisasHistorico from "./pages/pesquisas/Historico";


// Comunicação
import ComunicacaoIndex from "./pages/comunicacao/Index";
import ComunicacaoTemplates from "./pages/comunicacao/Templates";
import ComunicacaoHistorico from "./pages/comunicacao/Historico";
import ComunicacaoConfiguracao from "./pages/comunicacao/Configuracao";

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
        path="/dashboard/leads/relatorios-cliente" 
        element={
          <ProtectedRoute>
            <RelatoriosCliente />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/vendas/analises"
        element={
          <ProtectedRoute>
            <VendasAnalises />
          </ProtectedRoute>
        } 
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
        path="/dashboard/configuracoes/perfil" 
        element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/configuracoes/usuarios" 
        element={
          <ProtectedRoute>
            <Usuarios />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/configuracoes/geral" 
        element={
          <ProtectedRoute>
            <Geral />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/configuracoes/templates" 
        element={
          <ProtectedRoute>
            <Templates />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/configuracoes/tags" 
        element={
          <ProtectedRoute>
            <Tags />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/configuracoes/logs" 
        element={
          <ProtectedRoute>
            <Logs />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/configuracoes/demandas" 
        element={
          <ProtectedRoute>
            <Demandas />
          </ProtectedRoute>
        } 
      />
      
      {/* Processos - Subrotas */}
      <Route 
        path="/dashboard/processos/prazos" 
        element={
          <ProtectedRoute>
            <ProcessosPrazos />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/processos/calendario" 
        element={
          <ProtectedRoute>
            <ProcessosCalendario />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/processos/documentos" 
        element={
          <ProtectedRoute>
            <ProcessosDocumentos />
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
      
      {/* Comunicação - Subrotas */}
      <Route 
        path="/dashboard/comunicacao/historico" 
        element={
          <ProtectedRoute>
            <ComunicacaoHistorico />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/comunicacao/configuracao" 
        element={
          <ProtectedRoute>
            <ComunicacaoConfiguracao />
          </ProtectedRoute>
        } 
      />
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
        path="/dashboard/pesquisas/pessoas" 
        element={
          <ProtectedRoute>
            <PesquisasPessoas />
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
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
