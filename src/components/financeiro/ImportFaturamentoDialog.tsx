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
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useBulkCreateTransacoes } from "@/hooks/useTransacoesFinanceiras";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ParsedRow {
  mes: string;
  tipo: string;
  descricao: string;
  data: string;
  valor_eliziane: string;
  valor_juliana: string;
  valor_pj: string;
  valor_total: string;
  parcela_atual: string;
  total_parcelas: string;
}

interface ProcessedRow extends ParsedRow {
  isValid: boolean;
  errors: string[];
  mesNumero: number;
  valorNumerico: number;
}

const MESES_MAP: Record<string, number> = {
  janeiro: 1, jan: 1,
  fevereiro: 2, fev: 2,
  março: 3, marco: 3, mar: 3,
  abril: 4, abr: 4,
  maio: 5, mai: 5,
  junho: 6, jun: 6,
  julho: 7, jul: 7,
  agosto: 8, ago: 8,
  setembro: 9, set: 9,
  outubro: 10, out: 10,
  novembro: 11, nov: 11,
  dezembro: 12, dez: 12,
};

export function ImportFaturamentoDialog({ open, onClose }: Props) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ProcessedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState({ success: 0, errors: 0 });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const bulkCreateTransacoes = useBulkCreateTransacoes();
  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2020 + 2 }, (_, i) => 2020 + i);

  const parseMes = (mesStr: string): number => {
    if (!mesStr) return 0;
    const mesLower = mesStr.toLowerCase().trim();
    return MESES_MAP[mesLower] || 0;
  };

  const parseDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    
    // Handle Excel serial date numbers
    const numValue = parseFloat(dateStr);
    if (!isNaN(numValue) && numValue > 40000 && numValue < 50000) {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + numValue * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    }
    
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

  const parseValor = (valorStr: string): number => {
    if (!valorStr) return 0;
    const cleaned = valorStr.replace(/[^\d,.-]/g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const validateRow = (row: ParsedRow): ProcessedRow => {
    const errors: string[] = [];
    
    const mesNumero = parseMes(row.mes);
    if (mesNumero === 0) {
      errors.push("Mês inválido");
    }

    if (!row.descricao?.trim()) {
      errors.push("Descrição é obrigatória");
    }

    const valorNumerico = parseValor(row.valor_total);
    if (valorNumerico <= 0) {
      errors.push("Valor total inválido");
    }

    return {
      ...row,
      isValid: errors.length === 0,
      errors,
      mesNumero,
      valorNumerico,
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
          transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, "_").replace(/\//g, "_"),
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
            normalizedRow[key.toLowerCase().trim().replace(/\s+/g, "_").replace(/\//g, "_")] = row[key];
          });
          return {
            mes: normalizedRow.mês || normalizedRow.mes || "",
            tipo: normalizedRow.tipo || "",
            descricao: normalizedRow["cliente_descrição"] || normalizedRow.cliente_descricao || normalizedRow.descricao || normalizedRow.cliente || "",
            data: normalizedRow.data || "",
            valor_eliziane: normalizedRow.valor_eliziane || normalizedRow["eliziane"] || "0",
            valor_juliana: normalizedRow.valor_juliana || normalizedRow["juliana"] || "0",
            valor_pj: normalizedRow.valor_pj || normalizedRow["pj"] || "0",
            valor_total: normalizedRow.valor_total || normalizedRow.total || normalizedRow.valor || "0",
            parcela_atual: normalizedRow.parcela_atual || normalizedRow.parcela || "1",
            total_parcelas: normalizedRow.total_parcelas || normalizedRow.parcelas || "1",
          };
        });
      } else {
        toast.error("Formato de arquivo não suportado. Use CSV ou XLSX.");
        return;
      }

      // Filter out empty rows
      const filteredData = data.filter(row => row.descricao?.trim() || row.valor_total);
      const processedData = filteredData.map(validateRow);
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

    const ano = parseInt(selectedYear);
    const mesesNomes = [
      "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    try {
      const transacoes = validRows.map(row => ({
        ano,
        mes: row.mesNumero,
        mes_nome: mesesNomes[row.mesNumero],
        tipo_codigo: "receita" as const,
        categoria_codigo: row.tipo?.toLowerCase() === "pj" ? "pj" : "pf",
        subcategoria_codigo: null,
        descricao: row.descricao.trim(),
        valor: row.valorNumerico,
        data_transacao: parseDate(row.data) || `${ano}-${String(row.mesNumero).padStart(2, '0')}-01`,
      }));

      // Import in batches of 50
      const batchSize = 50;
      let successCount = 0;

      for (let i = 0; i < transacoes.length; i += batchSize) {
        const batch = transacoes.slice(i, i + batchSize);
        await bulkCreateTransacoes.mutateAsync(batch);
        successCount += batch.length;
        setProgress(Math.round((successCount / transacoes.length) * 100));
      }

      setResult({ success: successCount, errors: 0 });
      setStep("done");
      toast.success(`${successCount} receitas importadas com sucesso`);
    } catch (error) {
      console.error("Import error:", error);
      setResult({ success: 0, errors: validRows.length });
      setStep("done");
      toast.error("Erro ao importar receitas");
    }
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
            Importar Faturamento
          </DialogTitle>
          <DialogDescription>
            Importe receitas de arquivos CSV ou XLSX (planilha anual)
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Ano da planilha</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                Mês, Tipo (PF/PJ), Cliente/Descrição, Data, Valor Total
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ano: {selectedYear}</span>
                <span className="text-sm text-muted-foreground">|</span>
                <span className="text-sm text-muted-foreground">{file?.name}</span>
              </div>
            </div>

            <div className="border rounded-lg max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead>Mês</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
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
                      <TableCell>{row.mes}</TableCell>
                      <TableCell>{row.tipo}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{row.descricao}</TableCell>
                      <TableCell className="text-right">
                        {row.valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
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
                Importar {validCount} Receitas
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <p className="text-lg font-medium mb-4">Importando receitas...</p>
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
                {result.success} receitas importadas com sucesso
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
