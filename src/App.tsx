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
import RelatoriosDespesas from "./pages/financeiro/RelatoriosDespesas";

// Pesquisas
import PesquisasIndex from "./pages/pesquisas/Index";
import PesquisasVeiculos from "./pages/pesquisas/Veiculos";
import PesquisasPessoas from "./pages/pesquisas/Pessoas";
import PesquisasImoveis from "./pages/pesquisas/Imoveis";
import PesquisasHistorico from "./pages/pesquisas/Historico";
import PesquisasConfiguracao from "./pages/pesquisas/Configuracao";

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
          path="/dashboard/vendas/meta-ads" 
          element={
            <ProtectedRoute>
              <MetaAds />
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
          path="/dashboard/financeiro/relatorios-despesas" 
          element={
            <ProtectedRoute>
              <RelatoriosDespesas />
            </ProtectedRoute>
          } 
        />
        
        {/* Comunicação - Subrotas */}
        <Route 
          path="/dashboard/comunicacao" 
          element={
            <ProtectedRoute>
              <ComunicacaoIndex />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/comunicacao/templates" 
          element={
            <ProtectedRoute>
              <ComunicacaoTemplates />
            </ProtectedRoute>
          } 
        />
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
          path="/dashboard/pesquisas/veiculos" 
          element={
            <ProtectedRoute>
              <PesquisasVeiculos />
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
          path="/dashboard/pesquisas/imoveis" 
          element={
            <ProtectedRoute>
              <PesquisasImoveis />
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
          path="/dashboard/pesquisas/configuracao" 
          element={
            <ProtectedRoute>
              <PesquisasConfiguracao />
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
