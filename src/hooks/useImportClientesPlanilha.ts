import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";

export interface ProcessoImportado {
  numero: string;
  tribunal: string;
  grau: string;
}

export interface ClienteImportado {
  nome: string;
  observacao: string | null;
  pastaUrl: string | null;
  situacao: 'ativo' | 'inativo';
  processos: ProcessoImportado[];
}

// Mapeia situação do cliente para status do processo
function getProcessoStatus(situacaoCliente: 'ativo' | 'inativo'): string {
  return situacaoCliente === 'ativo' ? 'em_andamento' : 'concluido';
}

export interface ImportResult {
  clientesCriados: number;
  processosCriados: number;
  erros: string[];
}

// Extração de nome e observação
export function parseNomeCliente(nome: string): { nome: string; observacao: string | null } {
  if (!nome) return { nome: '', observacao: null };
  
  const match = nome.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return { nome: match[1].trim(), observacao: match[2].trim() };
  }
  return { nome: nome.trim(), observacao: null };
}

// Extração de processos - CADA PROCESSO SEPARADO POR | = 1 REGISTRO
export function parseProcessos(texto: string, tribunal: string, grau: string): ProcessoImportado[] {
  if (!texto || typeof texto !== 'string') return [];
  
  const textoLower = texto.toLowerCase();
  if (
    texto === '~' || 
    textoLower.includes('não encontrei') ||
    textoLower.includes('nao encontrei') ||
    textoLower.includes('procurei no eproc')
  ) {
    return [];
  }
  
  return texto
    .split('|')
    .map(p => p.trim())
    .filter(p => p.match(/\d{7}-\d{2}\.\d{4}/))
    .map(p => {
      // Detecta tribunal nos parênteses: "0710570-24.2022.8.07.0014 (TJDF)"
      const tribunalMatch = p.match(/\(([^)]+)\)/);
      return {
        numero: p.replace(/\([^)]+\)/g, '').trim(),
        tribunal: tribunalMatch ? tribunalMatch[1].trim().toUpperCase() : tribunal,
        grau: tribunalMatch ? 'Outros' : grau,
      };
    });
}

// Normaliza URL da pasta
export function normalizePastaUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  
  const urlLower = url.toLowerCase();
  if (
    urlLower.includes('não encontrei') ||
    urlLower.includes('nao encontrei') ||
    url === '~'
  ) {
    return null;
  }
  
  return url.trim();
}

// Normaliza situação
export function normalizeSituacao(situacao: string | null | undefined): 'ativo' | 'inativo' {
  if (!situacao || typeof situacao !== 'string') return 'inativo';
  return situacao.toLowerCase().includes('ativo') && !situacao.toLowerCase().includes('inativo') 
    ? 'ativo' 
    : 'inativo';
}

export function useImportClientesPlanilha() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientes: ClienteImportado[]): Promise<ImportResult> => {
      const result: ImportResult = {
        clientesCriados: 0,
        processosCriados: 0,
        erros: [],
      };

      for (const cliente of clientes) {
        try {
          // 1. Criar cliente na contact_submissions
          const { data: clienteData, error: clienteError } = await supabase
            .from('contact_submissions')
            .insert({
              nome_completo: cliente.nome,
              email: '',
              telefone: '',
              tipo_processo: 'Importado',
              como_conheceu: 'importacao',
              mensagem: cliente.observacao || 'Importado da planilha B&Z',
              estagio: 'fechado',
              origem: 'outro',
              pasta_drive_url: cliente.pastaUrl,
              status_cliente: cliente.situacao,
              lgpd_consent: true,
            })
            .select()
            .single();

          if (clienteError) throw clienteError;
          result.clientesCriados++;

          // 2. Criar CADA processo separadamente
          for (const processo of cliente.processos) {
            const { error: processoError } = await supabase
              .from('processos')
              .insert({
                lead_id: clienteData.id,
                numero_processo: processo.numero,
                tipo: 'Importado',
                status: getProcessoStatus(cliente.situacao),
                tribunal: processo.tribunal,
                grau_tribunal: processo.grau,
                data_inicio: new Date().toISOString().split('T')[0],
                pasta_drive_url: cliente.pastaUrl,
              });

            if (!processoError) {
              result.processosCriados++;
            } else {
              result.erros.push(`Processo ${processo.numero}: ${processoError.message}`);
            }
          }
        } catch (error: any) {
          result.erros.push(`Cliente ${cliente.nome}: ${error.message}`);
        }
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['processos'] });
      
      toast({
        title: "Importação concluída",
        description: `${result.clientesCriados} clientes e ${result.processosCriados} processos importados.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
