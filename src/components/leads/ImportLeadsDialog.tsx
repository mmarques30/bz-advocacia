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
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Download } from "lucide-react";
import { useBulkCreateLeads } from "@/hooks/useLeads";
import { toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface Props {
  open: boolean;
  onClose: () => void;
  isCliente?: boolean;
}

interface ParsedRow {
  nome_completo: string;
  email: string;
  telefone: string;
  tipo_processo: string;
  origem: string;
  prioridade: string;
  mensagem: string;
}

interface ProcessedRow extends ParsedRow {
  isValid: boolean;
  errors: string[];
}

const VALID_ORIGENS = ['google', 'meta', 'indicacao', 'site', 'whatsapp_bot', 'outro'];
const VALID_PRIORIDADES = ['alta', 'media', 'baixa'];

export function ImportLeadsDialog({ open, onClose, isCliente = false }: Props) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ProcessedRow[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState({ success: 0, errors: 0 });

  const bulkCreate = useBulkCreateLeads();
  const entityLabel = isCliente ? "Clientes" : "Leads";
  const entityLabelSingular = isCliente ? "Cliente" : "Lead";

  const isValidEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateRow = (row: ParsedRow): ProcessedRow => {
    const errors: string[] = [];

    // Nome é obrigatório
    if (!row.nome_completo?.trim()) {
      errors.push("Nome é obrigatório");
    }

    // Email válido (se informado)
    if (row.email && !isValidEmail(row.email.trim())) {
      errors.push("Email inválido");
    }

    // Origem válida (se informada)
    const origem = row.origem?.toLowerCase().trim();
    if (origem && !VALID_ORIGENS.includes(origem)) {
      errors.push("Origem inválida");
    }

    // Prioridade válida (se informada)
    const prioridade = row.prioridade?.toLowerCase().trim();
    if (prioridade && !VALID_PRIORIDADES.includes(prioridade)) {
      errors.push("Prioridade inválida");
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
          transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, '_'),
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
            normalizedRow[key.toLowerCase().trim().replace(/\s+/g, '_')] = row[key];
          });
          return {
            nome_completo: normalizedRow.nome_completo || normalizedRow.nome || "",
            email: normalizedRow.email || "",
            telefone: normalizedRow.telefone || normalizedRow.phone || "",
            tipo_processo: normalizedRow.tipo_processo || normalizedRow.tipo || "",
            origem: normalizedRow.origem || "",
            prioridade: normalizedRow.prioridade || "",
            mensagem: normalizedRow.mensagem || normalizedRow.observacoes || "",
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

    const leads = validRows.map(row => ({
      nome_completo: row.nome_completo.trim(),
      email: row.email?.trim() || "",
      telefone: row.telefone?.trim() || "",
      tipo_processo: row.tipo_processo?.trim() || "",
      origem: (row.origem?.toLowerCase().trim() || "site") as "google" | "meta" | "indicacao" | "site" | "whatsapp_bot" | "outro",
      prioridade: (row.prioridade?.toLowerCase().trim() || "media") as "alta" | "media" | "baixa",
      mensagem: row.mensagem?.trim() || "",
      estagio: (isCliente ? "fechado" : "novo") as "novo" | "contato_inicial" | "em_analise" | "proposta_enviada" | "fechado" | "perdido",
    }));

    // Import in batches of 50
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);

      try {
        await bulkCreate.mutateAsync(batch);
        successCount += batch.length;
      } catch (error) {
        console.error("Batch import error:", error);
        errorCount += batch.length;
      }

      setProgress(Math.round(((i + batch.length) / leads.length) * 100));
    }

    setResult({ success: successCount, errors: errorCount });
    setStep("done");
    toast.success(`${successCount} ${entityLabel.toLowerCase()} importados com sucesso`);
  };

  const handleClose = () => {
    setStep("upload");
    setFile(null);
    setParsedData([]);
    setProgress(0);
    setResult({ success: 0, errors: 0 });
    onClose();
  };

  const downloadTemplate = () => {
    const template = [
      {
        nome_completo: "João Silva",
        email: "joao@email.com",
        telefone: "(11) 99999-9999",
        tipo_processo: "Divórcio Consensual",
        origem: "site",
        prioridade: "media",
        mensagem: "Interessado em consulta",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, `modelo_importacao_${isCliente ? 'clientes' : 'leads'}.xlsx`);
  };

  const validCount = parsedData.filter(r => r.isValid).length;
  const invalidCount = parsedData.filter(r => !r.isValid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar {entityLabel}
          </DialogTitle>
          <DialogDescription>
            Importe {entityLabel.toLowerCase()} de arquivos CSV ou XLSX
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
                nome_completo (obrigatório), email, telefone, tipo_processo, origem, prioridade, mensagem
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Baixar modelo
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <span className="text-sm flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {validCount} válidos
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
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tipo Processo</TableHead>
                    <TableHead>Origem</TableHead>
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
                      <TableCell className="max-w-[150px] truncate">{row.nome_completo}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{row.email}</TableCell>
                      <TableCell>{row.telefone}</TableCell>
                      <TableCell className="max-w-[120px] truncate">{row.tipo_processo}</TableCell>
                      <TableCell>{row.origem}</TableCell>
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
                Importar {validCount} {entityLabel}
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <p className="text-lg font-medium mb-4">Importando {entityLabel.toLowerCase()}...</p>
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
                {result.success} {entityLabel.toLowerCase()} importados com sucesso
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
