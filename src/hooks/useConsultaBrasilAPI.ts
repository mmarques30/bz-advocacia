import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConsultaCNPJRequest {
  tipo: "cnpj" | "cep";
  valor: string;
  processo_id?: string;
  motivo: string;
  justificativa: string;
}

export interface ConsultaCNPJResponse {
  dados: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string;
    situacaoCadastral: string;
    dataSituacao: string;
    dataAbertura: string;
    naturezaJuridica: string;
    porte: string;
    capitalSocial: number;
    endereco: {
      logradouro: string;
      numero: string;
      complemento: string;
      bairro: string;
      municipio: string;
      uf: string;
      cep: string;
    };
    atividadePrincipal: {
      codigo: number;
      descricao: string;
    };
    atividadesSecundarias: Array<{
      codigo: number;
      descricao: string;
    }>;
    qsa: Array<{
      nome: string;
      qualificacao: string;
      dataEntrada: string;
    }>;
    contato: {
      telefone?: string;
      email?: string;
    };
    simplesNacional: {
      optante: boolean;
      dataOpcao?: string;
    };
    mei: {
      optante: boolean;
    };
  };
  metadados: {
    consultadoEm: string;
    fonte: string;
    idConsulta: string;
  };
}

export interface ConsultaCEPResponse {
  dados: {
    cep: string;
    logradouro: string;
    bairro: string;
    cidade: string;
    uf: string;
    localizacao?: {
      latitude: number;
      longitude: number;
    };
  };
  metadados: {
    consultadoEm: string;
    fonte: string;
    idConsulta: string;
  };
}

export function useConsultaCNPJ() {
  return useMutation({
    mutationFn: async (request: ConsultaCNPJRequest) => {
      const { data, error } = await supabase.functions.invoke("consultas-brasilapi", {
        body: request,
      });

      if (error) {
        console.error("Erro na consulta CNPJ:", error);
        throw new Error(error.message || "Erro ao realizar consulta");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.status === "sem_dados") {
        throw new Error(data.mensagem || "CNPJ não encontrado");
      }

      return data as ConsultaCNPJResponse;
    },
    onError: (error: Error) => {
      toast.error("Erro na consulta", {
        description: error.message,
      });
    },
  });
}

export function useConsultaCEP() {
  return useMutation({
    mutationFn: async (request: ConsultaCNPJRequest) => {
      const { data, error } = await supabase.functions.invoke("consultas-brasilapi", {
        body: { ...request, tipo: "cep" },
      });

      if (error) {
        console.error("Erro na consulta CEP:", error);
        throw new Error(error.message || "Erro ao realizar consulta");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.status === "sem_dados") {
        throw new Error(data.mensagem || "CEP não encontrado");
      }

      return data as ConsultaCEPResponse;
    },
    onError: (error: Error) => {
      toast.error("Erro na consulta", {
        description: error.message,
      });
    },
  });
}
