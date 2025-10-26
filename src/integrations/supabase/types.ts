export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      atividades: {
        Row: {
          created_at: string | null
          descricao: string
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          descricao: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          bens_partilhar: string | null
          como_conheceu: string
          created_at: string
          data_ultima_atividade: string | null
          documentos: string[] | null
          email: string
          estagio: string | null
          id: string
          lgpd_consent: boolean
          mensagem: string
          nome_completo: string
          notas_internas: string | null
          numero_herdeiros: number | null
          origem: string | null
          outro_como_conheceu: string | null
          outro_tipo_processo: string | null
          prioridade: string | null
          regime_casamento: string | null
          responsavel_id: string | null
          situacao_atual: string | null
          status: string
          tags: string[] | null
          telefone: string
          tem_filhos: boolean | null
          tipo_processo: string
          valor_estimado_bens: string | null
          valor_pretendido: string | null
          valor_proposta: number | null
        }
        Insert: {
          bens_partilhar?: string | null
          como_conheceu: string
          created_at?: string
          data_ultima_atividade?: string | null
          documentos?: string[] | null
          email: string
          estagio?: string | null
          id?: string
          lgpd_consent?: boolean
          mensagem: string
          nome_completo: string
          notas_internas?: string | null
          numero_herdeiros?: number | null
          origem?: string | null
          outro_como_conheceu?: string | null
          outro_tipo_processo?: string | null
          prioridade?: string | null
          regime_casamento?: string | null
          responsavel_id?: string | null
          situacao_atual?: string | null
          status?: string
          tags?: string[] | null
          telefone: string
          tem_filhos?: boolean | null
          tipo_processo: string
          valor_estimado_bens?: string | null
          valor_pretendido?: string | null
          valor_proposta?: number | null
        }
        Update: {
          bens_partilhar?: string | null
          como_conheceu?: string
          created_at?: string
          data_ultima_atividade?: string | null
          documentos?: string[] | null
          email?: string
          estagio?: string | null
          id?: string
          lgpd_consent?: boolean
          mensagem?: string
          nome_completo?: string
          notas_internas?: string | null
          numero_herdeiros?: number | null
          origem?: string | null
          outro_como_conheceu?: string | null
          outro_tipo_processo?: string | null
          prioridade?: string | null
          regime_casamento?: string | null
          responsavel_id?: string | null
          situacao_atual?: string | null
          status?: string
          tags?: string[] | null
          telefone?: string
          tem_filhos?: boolean | null
          tipo_processo?: string
          valor_estimado_bens?: string | null
          valor_pretendido?: string | null
          valor_proposta?: number | null
        }
        Relationships: []
      }
      financeiro: {
        Row: {
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string | null
          id: string
          processo_id: string | null
          status: string | null
          tipo: string | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao?: string | null
          id?: string
          processo_id?: string | null
          status?: string | null
          tipo?: string | null
          valor: number
        }
        Update: {
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string | null
          id?: string
          processo_id?: string | null
          status?: string | null
          tipo?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          created_at: string | null
          data: string
          id: string
          novos_clientes: number | null
          processos_ativos: number | null
          receita_mes: number | null
          taxa_conversao: number | null
          taxa_inadimplencia: number | null
          total_leads: number | null
        }
        Insert: {
          created_at?: string | null
          data: string
          id?: string
          novos_clientes?: number | null
          processos_ativos?: number | null
          receita_mes?: number | null
          taxa_conversao?: number | null
          taxa_inadimplencia?: number | null
          total_leads?: number | null
        }
        Update: {
          created_at?: string | null
          data?: string
          id?: string
          novos_clientes?: number | null
          processos_ativos?: number | null
          receita_mes?: number | null
          taxa_conversao?: number | null
          taxa_inadimplencia?: number | null
          total_leads?: number | null
        }
        Relationships: []
      }
      lead_comunicacoes: {
        Row: {
          created_at: string
          enviado_por: string | null
          id: string
          lead_id: string
          mensagem: string
          status: string
          template_usado: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          enviado_por?: string | null
          id?: string
          lead_id: string
          mensagem: string
          status?: string
          template_usado?: string | null
          tipo: string
        }
        Update: {
          created_at?: string
          enviado_por?: string | null
          id?: string
          lead_id?: string
          mensagem?: string
          status?: string
          template_usado?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_comunicacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notas: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          texto: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          texto: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          texto?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      processos: {
        Row: {
          created_at: string | null
          data_inicio: string
          data_ultima_atualizacao: string | null
          id: string
          lead_id: string | null
          numero_processo: string | null
          prazo_proximo: string | null
          status: string | null
          tipo: string
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          data_inicio: string
          data_ultima_atualizacao?: string | null
          id?: string
          lead_id?: string | null
          numero_processo?: string | null
          prazo_proximo?: string | null
          status?: string | null
          tipo: string
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          data_inicio?: string
          data_ultima_atualizacao?: string | null
          id?: string
          lead_id?: string | null
          numero_processo?: string | null
          prazo_proximo?: string | null
          status?: string | null
          tipo?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "processos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
