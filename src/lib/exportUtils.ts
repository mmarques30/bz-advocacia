import { toast } from "@/hooks/use-toast";

export function exportToPDF(data: any, title: string) {
  // Para simplificar, usamos window.print() com formatação otimizada
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast({
      title: "Erro ao exportar",
      description: "Não foi possível abrir a janela de impressão",
      variant: "destructive",
    });
    return;
  }

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Data de geração: ${new Date().toLocaleDateString("pt-BR")}</p>
        <pre>${JSON.stringify(data, null, 2)}</pre>
        <button onclick="window.print()">Imprimir/Salvar como PDF</button>
      </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();

  toast({
    title: "Relatório preparado",
    description: "Use a opção de impressão para salvar como PDF",
  });
}

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    toast({
      title: "Sem dados",
      description: "Não há dados para exportar",
      variant: "destructive",
    });
    return;
  }

  // Converter objeto para CSV
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Escapar vírgulas e aspas
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",")
    ),
  ].join("\n");

  // Criar arquivo e fazer download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast({
    title: "Exportado com sucesso",
    description: `Arquivo ${filename}.csv foi baixado`,
  });
}

export function exportToExcel(data: any[], filename: string) {
  if (!data || data.length === 0) {
    toast({
      title: "Sem dados",
      description: "Não há dados para exportar",
      variant: "destructive",
    });
    return;
  }

  // Converter para TSV (Tab-Separated Values) para melhor compatibilidade com Excel
  const headers = Object.keys(data[0]);
  const tsvContent = [
    headers.join("\t"),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Converter para string e escapar tabs
        return String(value || "").replace(/\t/g, " ");
      }).join("\t")
    ),
  ].join("\n");

  // Criar arquivo e fazer download com BOM para UTF-8
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + tsvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.xls`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast({
    title: "Exportado com sucesso",
    description: `Arquivo ${filename}.xls foi baixado`,
  });
}
