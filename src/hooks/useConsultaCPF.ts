import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";

export interface ConsultaCPFRequest {
  cpf: string;
  dataNascimento: string;
  processo_id?: string;
  motivo: string;
  justificativa: string;
}

export interface ConsultaCPFDados {
  cpf: string;
  nome: string;
  dataNascimento: string;
  situacaoCadastral: string;
  dataInscricao: string | null;
  digitoVerificador: string | null;
  anoObito: number | null;
  horaConsulta: string;
  comprovante: string | null;
}

export interface ConsultaCPFResponse {
  status: 'sucesso' | 'sem_dados' | 'erro';
  dados?: ConsultaCPFDados;
  mensagem?: string;
  metadados?: {
    consultadoEm: string;
    idConsulta: string;
    fonte: string;
  };
  error?: string;
}

export const useConsultaCPF = () => {
  return useMutation({
    mutationFn: async (request: ConsultaCPFRequest): Promise<ConsultaCPFResponse> => {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error('Usuário não autenticado');
      }

      const response = await supabase.functions.invoke('consultas-cpf', {
        body: request,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao consultar CPF');
      }

      return response.data as ConsultaCPFResponse;
    },
    onSuccess: (data) => {
      if (data.status === 'sucesso') {
        toast.success('Consulta realizada com sucesso!');
      } else if (data.status === 'sem_dados') {
        toast.warning('Nenhum dado encontrado para o CPF informado');
      }
    },
    onError: (error: Error) => {
      console.error('Erro na consulta CPF:', error);
      toast.error(error.message || 'Erro ao realizar consulta');
    },
  });
};
