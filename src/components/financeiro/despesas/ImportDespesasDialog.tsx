import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useCreateDespesa } from "@/hooks/useDespesas";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { CATEGORIA_DESPESA_LABELS } from "@/types/financeiro";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ParsedRow {
  data: string;
  descricao: string;
  categoria: string;
  valor: string;
  forma_pagamento?: string;
  status?: string;
  observacoes?: string;
}

interface ProcessedRow extends ParsedRow {
  isValid: boolean;
  errors: string[];
}

const VALID_CATEGORIAS = Object.keys(CATEGORIA_DESPESA_LABELS);

export function ImportDespesasDialog({ open, onClose }: Props) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ProcessedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState({ success: 0, errors: 0 });

  const createDespesa = useCreateDespesa();
  const queryClient = useQueryClient();

  const parseDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    
    const formats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/,
      /^(\d{2})-(\d{2})-(\d{4})$/,
      /^(\d{4})-(\d{2})-(\d{2})$/,
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[2]) {
          return `${match[1]}-${match[2]}-${match[3]}`;
        }
        return `${match[3]}-${match[2]}-${match[1]}`;
      }
    }
    return null;
  };

  const validateRow = (row: ParsedRow): ProcessedRow => {
    const errors: string[] = [];
    
    const parsedDate = parseDate(row.data);
    if (!parsedDate) {
      errors.push("Data inválida");
    }

    if (!row.descricao?.trim()) {
      errors.push("Descrição é obrigatória");
    }

    const categoria = row.categoria?.toLowerCase().trim();
    if (!categoria || !VALID_CATEGORIAS.includes(categoria)) {
      errors.push(`Categoria inválida. Use: ${VALID_CATEGORIAS.join(", ")}`);
    }

    const valorStr = row.valor?.replace(/[^\d,.-]/g, "").replace(",", ".");
    const valor = parseFloat(valorStr);
    if (isNaN(valor) || valor <= 0) {
      errors.push("Valor inválido");
    }

    return {
      ...row,
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const fileName = selectedFile.name.toLowerCase();

    try {
      let data: ParsedRow[] = [];

      if (fileName.endsWith(".csv")) {
        const text = await selectedFile.text();
        const result = Papa.parse<ParsedRow>(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, "_"),
        });
        data = result.data;
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { raw: false });
        
        data = jsonData.map(row => {
          const normalizedRow: Record<string, string> = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().trim().replace(/\s+/g, "_")] = row[key];
          });
          return {
            data: normalizedRow.data || normalizedRow.date || "",
            descricao: normalizedRow.descricao || normalizedRow.description || "",
            categoria: normalizedRow.categoria || normalizedRow.category || "",
            valor: normalizedRow.valor || normalizedRow.value || "",
            forma_pagamento: normalizedRow.forma_pagamento || normalizedRow.pagamento || "",
            status: normalizedRow.status || "pendente",
            observacoes: normalizedRow.observacoes || "",
          };
        });
      } else {
        toast.error("Formato de arquivo não suportado. Use CSV ou XLSX.");
        return;
      }

      const processedData = data.map(validateRow);
      setParsedData(processedData);
      setStep("preview");
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Erro ao ler o arquivo");
    }
  }, []);

  const handleImport = async () => {
    const validRows = parsedData.filter(row => row.isValid);
    
    if (validRows.length === 0) {
      toast.error("Nenhuma linha válida para importar");
      return;
    }

    setStep("importing");
    setProgress(0);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const valorStr = row.valor.replace(/[^\d,.-]/g, "").replace(",", ".");
      const parsedDate = parseDate(row.data);
      
      try {
        await createDespesa.mutateAsync({
          data: parsedDate!,
          descricao: row.descricao.trim(),
          categoria: row.categoria.toLowerCase().trim() as any,
          valor: parseFloat(valorStr),
          forma_pagamento: (row.forma_pagamento || null) as any,
          status: (row.status || "pendente") as any,
          observacoes: row.observacoes || null,
          processo_id: null,
          anexo_url: null,
        });
        successCount++;
      } catch (error) {
        console.error("Import error:", error);
        errorCount++;
      }

      setProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    // Invalidate all related queries
    queryClient.invalidateQueries({ queryKey: ["despesas"] });
    queryClient.invalidateQueries({ queryKey: ["kpis-despesas"] });
    queryClient.invalidateQueries({ queryKey: ["transacoes-financeiras"] });
    queryClient.invalidateQueries({ queryKey: ["kpis-transacoes"] });

    setResult({ success: successCount, errors: errorCount });
    setStep("done");
    toast.success(`${successCount} despesas importadas com sucesso`);
  };

  const handleClose = () => {
    setStep("upload");
    setFile(null);
    setParsedData([]);
    setProgress(0);
    setResult({ success: 0, errors: 0 });
    onClose();
  };

  const validCount = parsedData.filter(r => r.isValid).length;
  const invalidCount = parsedData.filter(r => !r.isValid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Despesas
          </DialogTitle>
          <DialogDescription>
            Importe despesas de arquivos CSV ou XLSX
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Arraste um arquivo ou clique para selecionar
              </p>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="max-w-xs mx-auto"
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Formato esperado:</strong> O arquivo deve conter as colunas: 
                data, descricao, categoria ({VALID_CATEGORIAS.join(", ")}), valor
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <span className="text-sm flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {validCount} válidas
                </span>
                {invalidCount > 0 && (
                  <span className="text-sm flex items-center gap-1 text-destructive">
                    <X className="h-4 w-4" />
                    {invalidCount} com erros
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {file?.name}
              </p>
            </div>

            <div className="border rounded-lg max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 100).map((row, index) => (
                    <TableRow key={index} className={!row.isValid ? "bg-destructive/10" : ""}>
                      <TableCell>
                        {row.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <span title={row.errors.join(", ")}>
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{row.data}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{row.descricao}</TableCell>
                      <TableCell>{row.categoria}</TableCell>
                      <TableCell>{row.valor}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Importar {validCount} Despesas
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <p className="text-lg font-medium mb-4">Importando despesas...</p>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-6 py-8 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-600" />
            <div>
              <p className="text-lg font-medium">Importação Concluída!</p>
              <p className="text-muted-foreground mt-2">
                {result.success} despesas importadas com sucesso
                {result.errors > 0 && `, ${result.errors} com erros`}
              </p>
            </div>
            <Button onClick={handleClose}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
