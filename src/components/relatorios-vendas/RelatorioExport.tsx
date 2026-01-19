import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { PeriodoRelatorio } from "@/hooks/useRelatoriosVendas";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RelatorioExportProps {
  periodo: PeriodoRelatorio;
}

function getDateRange(periodo: PeriodoRelatorio): { inicio: Date; fim: Date } {
  const now = new Date();
  
  switch (periodo) {
    case "semanal":
      return { inicio: startOfWeek(now, { weekStartsOn: 1 }), fim: endOfWeek(now, { weekStartsOn: 1 }) };
    case "mensal":
      return { inicio: startOfMonth(now), fim: endOfMonth(now) };
    case "trimestral":
      return { inicio: startOfQuarter(now), fim: endOfQuarter(now) };
    default:
      return { inicio: startOfMonth(now), fim: endOfMonth(now) };
  }
}

export function RelatorioExport({ periodo }: RelatorioExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async () => {
    setIsExporting(true);
    
    try {
      const { inicio, fim } = getDateRange(periodo);
      
      const { data: leads, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .gte("created_at", inicio.toISOString())
        .lte("created_at", fim.toISOString())
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      if (!leads || leads.length === 0) {
        toast.info("Nenhum dado para exportar no período selecionado");
        return;
      }
      
      const exportData = leads.map(lead => ({
        "Nome": lead.nome_completo,
        "Email": lead.email,
        "Telefone": lead.telefone,
        "Tipo de Processo": lead.tipo_processo,
        "Estágio": lead.estagio || "Novo",
        "Status": lead.status,
        "Origem": lead.origem || "-",
        "Campanha": lead.utm_campaign || "-",
        "Canal": lead.canal_especifico || "-",
        "Valor Proposta": lead.valor_proposta || 0,
        "Data Cadastro": format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        "Primeiro Contato": lead.primeiro_contato_em 
          ? format(new Date(lead.primeiro_contato_em), "dd/MM/yyyy HH:mm", { locale: ptBR })
          : "-",
        "Última Atividade": lead.data_ultima_atividade 
          ? format(new Date(lead.data_ultima_atividade), "dd/MM/yyyy HH:mm", { locale: ptBR })
          : "-"
      }));
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Ajustar largura das colunas
      const colWidths = [
        { wch: 30 }, // Nome
        { wch: 30 }, // Email
        { wch: 15 }, // Telefone
        { wch: 20 }, // Tipo de Processo
        { wch: 15 }, // Estágio
        { wch: 12 }, // Status
        { wch: 15 }, // Origem
        { wch: 20 }, // Campanha
        { wch: 15 }, // Canal
        { wch: 15 }, // Valor Proposta
        { wch: 18 }, // Data Cadastro
        { wch: 18 }, // Primeiro Contato
        { wch: 18 }, // Última Atividade
      ];
      ws["!cols"] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, "Relatório de Leads");
      
      const periodoLabel = periodo === "semanal" ? "Semanal" : periodo === "mensal" ? "Mensal" : "Trimestral";
      const fileName = `relatorio_vendas_${periodoLabel}_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      
      XLSX.writeFile(wb, fileName);
      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar relatório");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    
    try {
      const { inicio, fim } = getDateRange(periodo);
      
      const { data: leads, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .gte("created_at", inicio.toISOString())
        .lte("created_at", fim.toISOString())
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      if (!leads || leads.length === 0) {
        toast.info("Nenhum dado para exportar no período selecionado");
        return;
      }
      
      const headers = [
        "Nome", "Email", "Telefone", "Tipo de Processo", "Estágio",
        "Status", "Origem", "Campanha", "Canal", "Valor Proposta",
        "Data Cadastro", "Primeiro Contato", "Última Atividade"
      ];
      
      const rows = leads.map(lead => [
        lead.nome_completo,
        lead.email,
        lead.telefone,
        lead.tipo_processo,
        lead.estagio || "Novo",
        lead.status,
        lead.origem || "-",
        lead.utm_campaign || "-",
        lead.canal_especifico || "-",
        lead.valor_proposta || 0,
        format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        lead.primeiro_contato_em 
          ? format(new Date(lead.primeiro_contato_em), "dd/MM/yyyy HH:mm", { locale: ptBR })
          : "-",
        lead.data_ultima_atividade 
          ? format(new Date(lead.data_ultima_atividade), "dd/MM/yyyy HH:mm", { locale: ptBR })
          : "-"
      ]);
      
      const csvContent = [
        headers.join(";"),
        ...rows.map(row => row.join(";"))
      ].join("\n");
      
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const periodoLabel = periodo === "semanal" ? "Semanal" : periodo === "mensal" ? "Mensal" : "Trimestral";
      link.href = url;
      link.download = `relatorio_vendas_${periodoLabel}_${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar relatório");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="h-4 w-4 mr-2" />
          CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
