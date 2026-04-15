import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileSpreadsheet, Users, Scale, CheckCircle, AlertCircle, ChevronDown, ChevronRight, Info, FolderOpen, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import {
  useImportClientesPlanilha,
  parseNomeCliente,
  parseProcessos,
  normalizePastaUrl,
  normalizeSituacao,
  ClienteImportado,
} from "@/hooks/useImportClientesPlanilha";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ImportClientesPlanilhaDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'upload' | 'preview' | 'importing' | 'done';

export function ImportClientesPlanilhaDialog({ open, onClose }: ImportClientesPlanilhaDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [clientes, setClientes] = useState<ClienteImportado[]>([]);
  const [progress, setProgress] = useState(0);
  const [expandedClientes, setExpandedClientes] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<{ clientesCriados: number; processosCriados: number; erros: string[] } | null>(null);

  const importMutation = useImportClientesPlanilha();

  const resetState = useCallback(() => {
    setStep('upload');
    setClientes([]);
    setProgress(0);
    setExpandedClientes(new Set());
    setResult(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Encontrar o cabeçalho
        let headerIndex = 0;
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          const row = jsonData[i];
          if (row && row[0] && String(row[0]).toUpperCase().includes('CLIENTE')) {
            headerIndex = i;
            break;
          }
        }

        const clientesImportados: ClienteImportado[] = [];

        // Processar linhas após o cabeçalho
        for (let i = headerIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || !row[0]) continue;

          const nomeRaw = String(row[0] || '').trim();
          if (!nomeRaw) continue;

          const { nome, observacao } = parseNomeCliente(nomeRaw);
          
          // Colunas: CLIENTES | TJRS 1º GRAU | TJ RS 2º GRAU | OUTROS TRIBUNAIS | LINK DA PASTA | SITUAÇÃO
          const tjrs1grau = String(row[1] || '');
          const tjrs2grau = String(row[2] || '');
          const outrosTribunais = String(row[3] || '');
          const linkPasta = row[4];
          const situacao = String(row[5] || '');

          const processos = [
            ...parseProcessos(tjrs1grau, 'TJRS', '1º Grau'),
            ...parseProcessos(tjrs2grau, 'TJRS', '2º Grau'),
            ...parseProcessos(outrosTribunais, 'Outros', 'Outros'),
          ];

          clientesImportados.push({
            nome,
            observacao,
            pastaUrl: normalizePastaUrl(linkPasta),
            situacao: normalizeSituacao(situacao),
            processos,
          });
        }

        setClientes(clientesImportados);
        setStep('preview');
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.xlsx')) {
      processFile(file);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleImport = useCallback(async () => {
    setStep('importing');
    setProgress(0);

    // Simular progresso durante a importação. Garantimos clearInterval
    // via finally — antes, se a mutation rejeitasse com erro nao-Error
    // ou se o componente fosse desmontado durante o await, o interval
    // ficaria orfao acumulando timers a cada importacao.
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 90));
    }, 500);

    try {
      const importResult = await importMutation.mutateAsync(clientes);
      setProgress(100);
      setResult(importResult);
      setStep('done');
    } catch (error) {
      setStep('preview');
    } finally {
      clearInterval(progressInterval);
    }
  }, [clientes, importMutation]);

  const toggleClienteExpanded = (index: number) => {
    setExpandedClientes(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const totalProcessos = clientes.reduce((acc, c) => acc + c.processos.length, 0);
  const clientesAtivos = clientes.filter(c => c.situacao === 'ativo').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Planilha de Clientes B&Z
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('planilha-input')?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Arraste a planilha ou clique</p>
              <p className="text-sm text-muted-foreground">(formato XLSX)</p>
              <input
                id="planilha-input"
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="font-medium text-sm flex items-center gap-1.5">
                <Info className="h-4 w-4 text-muted-foreground" />
                Formato esperado:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Coluna A: CLIENTES</li>
                <li>• Coluna B: TJRS - 1º GRAU</li>
                <li>• Coluna C: TJ RS - 2º GRAU</li>
                <li>• Coluna D: OUTROS TRIBUNAIS</li>
                <li>• Coluna E: LINK DA PASTA</li>
                <li>• Coluna F: SITUAÇÃO</li>
              </ul>
              <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 mt-3">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Processos separados por | serão cadastrados individualmente para cada cliente</span>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{clientes.length}</p>
                <p className="text-sm text-muted-foreground">clientes</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Scale className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold">{totalProcessos}</p>
                <p className="text-sm text-muted-foreground">processos</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                <p className="text-2xl font-bold">{clientesAtivos}</p>
                <p className="text-sm text-muted-foreground">ativos</p>
              </div>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg">
              <div className="p-4 space-y-2">
                {clientes.map((cliente, index) => (
                  <Collapsible
                    key={index}
                    open={expandedClientes.has(index)}
                    onOpenChange={() => toggleClienteExpanded(index)}
                  >
                    <div className="border rounded-lg overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer">
                          <div className="flex items-center gap-2">
                            {cliente.processos.length > 0 ? (
                              expandedClientes.has(index) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )
                            ) : (
                              <div className="w-4" />
                            )}
                            <span className="font-medium">{cliente.nome}</span>
                            {cliente.observacao && (
                              <span className="text-sm text-muted-foreground">({cliente.observacao})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{cliente.processos.length} processos</Badge>
                            {cliente.pastaUrl && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <FolderOpen className="h-3 w-3" />
                                Pasta
                              </Badge>
                            )}
                            <Badge variant={cliente.situacao === 'ativo' ? 'default' : 'secondary'}>
                              {cliente.situacao === 'ativo' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      {cliente.processos.length > 0 && (
                        <CollapsibleContent>
                          <div className="border-t bg-muted/30 p-3 space-y-1">
                            {cliente.processos.map((processo, pIndex) => (
                              <div key={pIndex} className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">├─</span>
                                <code className="bg-muted px-2 py-0.5 rounded text-xs">
                                  {processo.numero}
                                </code>
                                <span className="text-muted-foreground">
                                  ({processo.tribunal} {processo.grau})
                                </span>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      )}
                    </div>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleImport}>
                Importar {clientes.length} clientes
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-12 space-y-6">
            <div className="text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
              <p className="text-lg font-medium">Importando dados...</p>
              <p className="text-sm text-muted-foreground">
                {clientes.length} clientes e {totalProcessos} processos
              </p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">{progress}%</p>
          </div>
        )}

        {step === 'done' && result && (
          <div className="py-8 space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
              <p className="text-xl font-medium">Importação concluída!</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-950 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-emerald-600">{result.clientesCriados}</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">clientes criados</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{result.processosCriados}</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">processos criados</p>
              </div>
            </div>

            {result.erros.length > 0 && (
              <div className="bg-destructive/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="font-medium text-destructive">{result.erros.length} erros</p>
                </div>
                <ScrollArea className="h-[100px]">
                  <ul className="text-sm text-destructive/80 space-y-1">
                    {result.erros.map((erro, index) => (
                      <li key={index}>• {erro}</li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-center">
              <Button onClick={handleClose}>Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
