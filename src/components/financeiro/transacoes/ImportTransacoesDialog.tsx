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
import { useBulkCreateTransacoes, useSubcategorias } from "@/hooks/useTransacoesFinanceiras";
import { toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ParsedRow {
  data: string;
  descricao: string;
  tipo: string;
  categoria: string;
  subcategoria: string;
  valor: string;
}

interface ProcessedRow extends ParsedRow {
  isValid: boolean;
  errors: string[];
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function ImportTransacoesDialog({ open, onClose }: Props) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ProcessedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState({ success: 0, errors: 0 });
  const [defaultYear, setDefaultYear] = useState(new Date().getFullYear().toString());

  const { data: subcategorias } = useSubcategorias();
  const bulkCreate = useBulkCreateTransacoes();

  const validSubcategorias = subcategorias?.map(s => s.codigo.toLowerCase()) || [];

  const parseDate = (dateStr: string): { day: number; month: number; year: number } | null => {
    if (!dateStr) return null;
    
    // Try different formats
    const formats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // dd/mm/yyyy
      /^(\d{2})-(\d{2})-(\d{4})$/, // dd-mm-yyyy
      /^(\d{4})-(\d{2})-(\d{2})$/, // yyyy-mm-dd
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[2]) {
          return { day: parseInt(match[3]), month: parseInt(match[2]), year: parseInt(match[1]) };
        }
        return { day: parseInt(match[1]), month: parseInt(match[2]), year: parseInt(match[3]) };
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

    const tipo = row.tipo?.toLowerCase().trim();
    if (!tipo || !["receita", "despesa"].includes(tipo)) {
      errors.push("Tipo deve ser 'receita' ou 'despesa'");
    }

    const categoria = row.categoria?.toLowerCase().trim();
    if (!categoria || !["pf", "pj"].includes(categoria)) {
      errors.push("Categoria deve ser 'pf' ou 'pj'");
    }

    const subcategoria = row.subcategoria?.toLowerCase().trim();
    if (!subcategoria) {
      errors.push("Subcategoria é obrigatória");
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
          transformHeader: (header) => header.toLowerCase().trim(),
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
            normalizedRow[key.toLowerCase().trim()] = row[key];
          });
          return {
            data: normalizedRow.data || normalizedRow.date || "",
            descricao: normalizedRow.descricao || normalizedRow.description || "",
            tipo: normalizedRow.tipo || normalizedRow.type || "",
            categoria: normalizedRow.categoria || normalizedRow.category || "",
            subcategoria: normalizedRow.subcategoria || normalizedRow.subcategory || "",
            valor: normalizedRow.valor || normalizedRow.value || "",
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

    const transacoes = validRows.map(row => {
      const parsedDate = parseDate(row.data)!;
      const valorStr = row.valor.replace(/[^\d,.-]/g, "").replace(",", ".");
      
      return {
        mes: parsedDate.month,
        ano: parsedDate.year || parseInt(defaultYear),
        mes_nome: MESES[parsedDate.month - 1],
        tipo_codigo: row.tipo.toLowerCase().trim(),
        categoria_codigo: row.categoria.toLowerCase().trim(),
        subcategoria_codigo: row.subcategoria.toLowerCase().trim(),
        descricao: row.descricao || null,
        data_transacao: `${parsedDate.year || defaultYear}-${String(parsedDate.month).padStart(2, "0")}-${String(parsedDate.day).padStart(2, "0")}`,
        valor: parseFloat(valorStr),
      };
    });

    // Import in batches of 100
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < transacoes.length; i += batchSize) {
      const batch = transacoes.slice(i, i + batchSize);
      
      try {
        await bulkCreate.mutateAsync(batch);
        successCount += batch.length;
      } catch (error) {
        console.error("Batch import error:", error);
        errorCount += batch.length;
      }

      setProgress(Math.round(((i + batch.length) / transacoes.length) * 100));
    }

    setResult({ success: successCount, errors: errorCount });
    setStep("done");
    toast.success(`${successCount} transações importadas com sucesso`);
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
            Importar Transações
          </DialogTitle>
          <DialogDescription>
            Importe transações financeiras de arquivos CSV ou XLSX
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
                data, descricao, tipo (receita/despesa), categoria (pf/pj), subcategoria, valor
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Ano padrão (quando não especificado na data)</Label>
              <Select value={defaultYear} onValueChange={setDefaultYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Subcategoria</TableHead>
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
                      <TableCell>{row.tipo}</TableCell>
                      <TableCell>{row.categoria}</TableCell>
                      <TableCell>{row.subcategoria}</TableCell>
                      <TableCell>{row.valor}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {parsedData.length > 100 && (
              <p className="text-sm text-muted-foreground text-center">
                Mostrando primeiras 100 linhas de {parsedData.length}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Importar {validCount} Transações
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <p className="text-lg font-medium mb-4">Importando transações...</p>
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
                {result.success} transações importadas com sucesso
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
