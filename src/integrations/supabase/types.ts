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
      acordos_financeiros: {
        Row: {
          cliente_id: string
          created_at: string | null
          created_by: string | null
          data_primeiro_vencimento: string | null
          forma_pagamento: string
          id: string
          numero_parcelas: number | null
          observacoes: string | null
          processo_id: string | null
          status: string | null
          tipo_servico: string
          valor_total: number
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          created_by?: string | null
          data_primeiro_vencimento?: string | null
          forma_pagamento: string
          id?: string
          numero_parcelas?: number | null
          observacoes?: string | null
          processo_id?: string | null
          status?: string | null
          tipo_servico: string
          valor_total: number
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          created_by?: string | null
          data_primeiro_vencimento?: string | null
          forma_pagamento?: string
          id?: string
          numero_parcelas?: number | null
          observacoes?: string | null
          processo_id?: string | null
          status?: string | null
          tipo_servico?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "acordos_financeiros_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acordos_financeiros_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
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
      configuracoes_escritorio: {
        Row: {
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          endereco_completo: string | null
          estado: string | null
          id: string
          logo_url: string | null
          nome_escritorio: string
          oab_principal: string | null
          preferencias: Json | null
          redes_sociais: Json | null
          site: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco_completo?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          nome_escritorio: string
          oab_principal?: string | null
          preferencias?: Json | null
          redes_sociais?: Json | null
          site?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco_completo?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          nome_escritorio?: string
          oab_principal?: string | null
          preferencias?: Json | null
          redes_sociais?: Json | null
          site?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      consultas_auditoria: {
        Row: {
          acao: string
          consulta_id: string | null
          created_at: string | null
          detalhes: Json | null
          id: string
          ip_origem: string | null
          usuario_id: string
        }
        Insert: {
          acao: string
          consulta_id?: string | null
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          ip_origem?: string | null
          usuario_id: string
        }
        Update: {
          acao?: string
          consulta_id?: string | null
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          ip_origem?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultas_auditoria_consulta_id_fkey"
            columns: ["consulta_id"]
            isOneToOne: false
            referencedRelation: "consultas_realizadas"
            referencedColumns: ["id"]
          },
        ]
      }
      consultas_config: {
        Row: {
          ambiente: string | null
          api_token: string | null
          ativo: boolean | null
          created_at: string | null
          creditos_disponiveis: number | null
          id: string
          provedor: string
          ultima_sincronizacao: string | null
          updated_at: string | null
        }
        Insert: {
          ambiente?: string | null
          api_token?: string | null
          ativo?: boolean | null
          created_at?: string | null
          creditos_disponiveis?: number | null
          id?: string
          provedor?: string
          ultima_sincronizacao?: string | null
          updated_at?: string | null
        }
        Update: {
          ambiente?: string | null
          api_token?: string | null
          ativo?: boolean | null
          created_at?: string | null
          creditos_disponiveis?: number | null
          id?: string
          provedor?: string
          ultima_sincronizacao?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      consultas_realizadas: {
        Row: {
          created_at: string | null
          custo: number | null
          id: string
          id_consulta_externa: string | null
          ip_origem: string | null
          justificativa: string
          mensagem_erro: string | null
          motivo: string
          parametro_busca: string
          processo_id: string | null
          resultado: Json | null
          status: string
          tipo_consulta: string
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          custo?: number | null
          id?: string
          id_consulta_externa?: string | null
          ip_origem?: string | null
          justificativa: string
          mensagem_erro?: string | null
          motivo: string
          parametro_busca: string
          processo_id?: string | null
          resultado?: Json | null
          status: string
          tipo_consulta: string
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          custo?: number | null
          id?: string
          id_consulta_externa?: string | null
          ip_origem?: string | null
          justificativa?: string
          mensagem_erro?: string | null
          motivo?: string
          parametro_busca?: string
          processo_id?: string | null
          resultado?: Json | null
          status?: string
          tipo_consulta?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultas_realizadas_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          bens_partilhar: string | null
          bot_finalizado: boolean | null
          canal_especifico: string | null
          como_conheceu: string
          conversa_bot_completa: Json | null
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
          perguntas_respondidas: number | null
          primeiro_contato_em: string | null
          prioridade: string | null
          regime_casamento: string | null
          responsavel_id: string | null
          situacao_atual: string | null
          status: string
          tags: string[] | null
          telefone: string
          tem_filhos: boolean | null
          tipo_processo: string
          ultimo_contato_em: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          valor_estimado_bens: string | null
          valor_pretendido: string | null
          valor_proposta: number | null
          whatsapp_id: string | null
        }
        Insert: {
          bens_partilhar?: string | null
          bot_finalizado?: boolean | null
          canal_especifico?: string | null
          como_conheceu: string
          conversa_bot_completa?: Json | null
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
          perguntas_respondidas?: number | null
          primeiro_contato_em?: string | null
          prioridade?: string | null
          regime_casamento?: string | null
          responsavel_id?: string | null
          situacao_atual?: string | null
          status?: string
          tags?: string[] | null
          telefone: string
          tem_filhos?: boolean | null
          tipo_processo: string
          ultimo_contato_em?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor_estimado_bens?: string | null
          valor_pretendido?: string | null
          valor_proposta?: number | null
          whatsapp_id?: string | null
        }
        Update: {
          bens_partilhar?: string | null
          bot_finalizado?: boolean | null
          canal_especifico?: string | null
          como_conheceu?: string
          conversa_bot_completa?: Json | null
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
          perguntas_respondidas?: number | null
          primeiro_contato_em?: string | null
          prioridade?: string | null
          regime_casamento?: string | null
          responsavel_id?: string | null
          situacao_atual?: string | null
          status?: string
          tags?: string[] | null
          telefone?: string
          tem_filhos?: boolean | null
          tipo_processo?: string
          ultimo_contato_em?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor_estimado_bens?: string | null
          valor_pretendido?: string | null
          valor_proposta?: number | null
          whatsapp_id?: string | null
        }
        Relationships: []
      }
      demandas_internas: {
        Row: {
          created_at: string
          criado_por: string | null
          data_conclusao: string | null
          descricao: string | null
          id: string
          prioridade: string
          responsavel_id: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          data_conclusao?: string | null
          descricao?: string | null
          id?: string
          prioridade?: string
          responsavel_id?: string | null
          status?: string
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          data_conclusao?: string | null
          descricao?: string | null
          id?: string
          prioridade?: string
          responsavel_id?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandas_internas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_internas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          anexo_url: string | null
          categoria: string
          created_at: string | null
          created_by: string | null
          data: string
          descricao: string
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          processo_id: string | null
          status: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          anexo_url?: string | null
          categoria: string
          created_at?: string | null
          created_by?: string | null
          data: string
          descricao: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          processo_id?: string | null
          status?: string | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          anexo_url?: string | null
          categoria?: string
          created_at?: string | null
          created_by?: string | null
          data?: string
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          processo_id?: string | null
          status?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_drive: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_documento: string | null
          descricao: string | null
          drive_file_id: string
          drive_url: string
          id: string
          nome: string
          processo_id: string
          tags: string[] | null
          tipo_documento: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_documento?: string | null
          descricao?: string | null
          drive_file_id: string
          drive_url: string
          id?: string
          nome: string
          processo_id: string
          tags?: string[] | null
          tipo_documento: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_documento?: string | null
          descricao?: string | null
          drive_file_id?: string
          drive_url?: string
          id?: string
          nome?: string
          processo_id?: string
          tags?: string[] | null
          tipo_documento?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_drive_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      entidade_tags: {
        Row: {
          created_at: string | null
          entidade_id: string
          entidade_tipo: string
          id: string
          tag_id: string | null
        }
        Insert: {
          created_at?: string | null
          entidade_id: string
          entidade_tipo: string
          id?: string
          tag_id?: string | null
        }
        Update: {
          created_at?: string | null
          entidade_id?: string
          entidade_tipo?: string
          id?: string
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entidade_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
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
      historico_pagamentos: {
        Row: {
          created_at: string | null
          data_pagamento: string
          forma_pagamento: string
          id: string
          observacoes: string | null
          parcela_id: string
          registrado_por: string | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          data_pagamento: string
          forma_pagamento: string
          id?: string
          observacoes?: string | null
          parcela_id: string
          registrado_por?: string | null
          valor: number
        }
        Update: {
          created_at?: string | null
          data_pagamento?: string
          forma_pagamento?: string
          id?: string
          observacoes?: string | null
          parcela_id?: string
          registrado_por?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "historico_pagamentos_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "parcelas_financeiras"
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
      lead_interacoes: {
        Row: {
          canal: string
          created_at: string | null
          direcao: string
          eh_bot: boolean | null
          id: string
          lead_id: string
          mensagem: string
          tipo: string
        }
        Insert: {
          canal: string
          created_at?: string | null
          direcao: string
          eh_bot?: boolean | null
          id?: string
          lead_id: string
          mensagem: string
          tipo: string
        }
        Update: {
          canal?: string
          created_at?: string | null
          direcao?: string
          eh_bot?: boolean | null
          id?: string
          lead_id?: string
          mensagem?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_interacoes_lead_id_fkey"
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
      logs_sistema: {
        Row: {
          acao: string
          created_at: string | null
          descricao: string
          entidade_id: string | null
          entidade_tipo: string
          id: string
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          descricao: string
          entidade_id?: string | null
          entidade_tipo: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          descricao?: string
          entidade_id?: string | null
          entidade_tipo?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      meta_campanhas: {
        Row: {
          atualizado_em: string | null
          campaign_id: string
          cliques: number | null
          connection_id: string | null
          ctr: number | null
          custo_lead: number | null
          gasto: number | null
          id: string
          impressoes: number | null
          leads: number | null
          nome: string
          objetivo: string | null
          status: string | null
        }
        Insert: {
          atualizado_em?: string | null
          campaign_id: string
          cliques?: number | null
          connection_id?: string | null
          ctr?: number | null
          custo_lead?: number | null
          gasto?: number | null
          id?: string
          impressoes?: number | null
          leads?: number | null
          nome: string
          objetivo?: string | null
          status?: string | null
        }
        Update: {
          atualizado_em?: string | null
          campaign_id?: string
          cliques?: number | null
          connection_id?: string | null
          ctr?: number | null
          custo_lead?: number | null
          gasto?: number | null
          id?: string
          impressoes?: number | null
          leads?: number | null
          nome?: string
          objetivo?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_campanhas_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "meta_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_connections: {
        Row: {
          access_token: string
          account_id: string
          account_name: string | null
          conectado_em: string | null
          created_at: string | null
          id: string
          status: string | null
          token_expires_at: string
          ultima_sincronizacao: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          account_id: string
          account_name?: string | null
          conectado_em?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          token_expires_at: string
          ultima_sincronizacao?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          account_id?: string
          account_name?: string | null
          conectado_em?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          token_expires_at?: string
          ultima_sincronizacao?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      meta_envios_historico: {
        Row: {
          data_envio: string | null
          destinatarios: string[] | null
          erro_mensagem: string | null
          id: string
          periodo_fim: string | null
          periodo_inicio: string | null
          relatorio_config_id: string | null
          status: string | null
        }
        Insert: {
          data_envio?: string | null
          destinatarios?: string[] | null
          erro_mensagem?: string | null
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          relatorio_config_id?: string | null
          status?: string | null
        }
        Update: {
          data_envio?: string | null
          destinatarios?: string[] | null
          erro_mensagem?: string | null
          id?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          relatorio_config_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_envios_historico_relatorio_config_id_fkey"
            columns: ["relatorio_config_id"]
            isOneToOne: false
            referencedRelation: "meta_relatorios_auto"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_metricas: {
        Row: {
          alcance: number | null
          cliques: number | null
          connection_id: string | null
          cpc: number | null
          created_at: string | null
          ctr: number | null
          custo_lead: number | null
          data_referencia: string
          gasto: number | null
          id: string
          impressoes: number | null
          leads: number | null
        }
        Insert: {
          alcance?: number | null
          cliques?: number | null
          connection_id?: string | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          custo_lead?: number | null
          data_referencia: string
          gasto?: number | null
          id?: string
          impressoes?: number | null
          leads?: number | null
        }
        Update: {
          alcance?: number | null
          cliques?: number | null
          connection_id?: string | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          custo_lead?: number | null
          data_referencia?: string
          gasto?: number | null
          id?: string
          impressoes?: number | null
          leads?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_metricas_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "meta_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_relatorios_auto: {
        Row: {
          assunto: string | null
          ativo: boolean | null
          connection_id: string | null
          created_at: string | null
          destinatarios: string[]
          dia_mes: number | null
          dia_semana: number | null
          formato: string | null
          frequencia: string
          horario: string
          id: string
          mensagem: string | null
          proximo_envio: string | null
          updated_at: string | null
        }
        Insert: {
          assunto?: string | null
          ativo?: boolean | null
          connection_id?: string | null
          created_at?: string | null
          destinatarios: string[]
          dia_mes?: number | null
          dia_semana?: number | null
          formato?: string | null
          frequencia: string
          horario: string
          id?: string
          mensagem?: string | null
          proximo_envio?: string | null
          updated_at?: string | null
        }
        Update: {
          assunto?: string | null
          ativo?: boolean | null
          connection_id?: string | null
          created_at?: string | null
          destinatarios?: string[]
          dia_mes?: number | null
          dia_semana?: number | null
          formato?: string | null
          frequencia?: string
          horario?: string
          id?: string
          mensagem?: string | null
          proximo_envio?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_relatorios_auto_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "meta_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          lida: boolean | null
          link: string | null
          metadata: Json | null
          tipo: string
          titulo: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          lida?: boolean | null
          link?: string | null
          metadata?: Json | null
          tipo: string
          titulo: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          lida?: boolean | null
          link?: string | null
          metadata?: Json | null
          tipo?: string
          titulo?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      parcelas_financeiras: {
        Row: {
          acordo_id: string
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          forma_pagamento_recebido: string | null
          id: string
          numero_parcela: number
          observacoes: string | null
          pago_por: string | null
          status: string | null
          valor: number
          valor_pago: number | null
        }
        Insert: {
          acordo_id: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          forma_pagamento_recebido?: string | null
          id?: string
          numero_parcela: number
          observacoes?: string | null
          pago_por?: string | null
          status?: string | null
          valor: number
          valor_pago?: number | null
        }
        Update: {
          acordo_id?: string
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          forma_pagamento_recebido?: string | null
          id?: string
          numero_parcela?: number
          observacoes?: string | null
          pago_por?: string | null
          status?: string | null
          valor?: number
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parcelas_financeiras_acordo_id_fkey"
            columns: ["acordo_id"]
            isOneToOne: false
            referencedRelation: "acordos_financeiros"
            referencedColumns: ["id"]
          },
        ]
      }
      processos: {
        Row: {
          autor: string | null
          comarca: string | null
          created_at: string | null
          data_distribuicao: string | null
          data_inicio: string
          data_prevista_conclusao: string | null
          data_ultima_atualizacao: string | null
          id: string
          lead_id: string | null
          numero_processo: string | null
          observacoes: string | null
          prazo_proximo: string | null
          responsavel_id: string | null
          reu: string | null
          status: string | null
          tipo: string
          tribunal: string | null
          valor: number | null
          vara: string | null
        }
        Insert: {
          autor?: string | null
          comarca?: string | null
          created_at?: string | null
          data_distribuicao?: string | null
          data_inicio: string
          data_prevista_conclusao?: string | null
          data_ultima_atualizacao?: string | null
          id?: string
          lead_id?: string | null
          numero_processo?: string | null
          observacoes?: string | null
          prazo_proximo?: string | null
          responsavel_id?: string | null
          reu?: string | null
          status?: string | null
          tipo: string
          tribunal?: string | null
          valor?: number | null
          vara?: string | null
        }
        Update: {
          autor?: string | null
          comarca?: string | null
          created_at?: string | null
          data_distribuicao?: string | null
          data_inicio?: string
          data_prevista_conclusao?: string | null
          data_ultima_atualizacao?: string | null
          id?: string
          lead_id?: string | null
          numero_processo?: string | null
          observacoes?: string | null
          prazo_proximo?: string | null
          responsavel_id?: string | null
          reu?: string | null
          status?: string | null
          tipo?: string
          tribunal?: string | null
          valor?: number | null
          vara?: string | null
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
      processos_andamentos: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_andamento: string
          descricao: string
          id: string
          processo_id: string
          responsavel_id: string | null
          tipo_andamento: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_andamento: string
          descricao: string
          id?: string
          processo_id: string
          responsavel_id?: string | null
          tipo_andamento: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_andamento?: string
          descricao?: string
          id?: string
          processo_id?: string
          responsavel_id?: string | null
          tipo_andamento?: string
        }
        Relationships: [
          {
            foreignKeyName: "processos_andamentos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      processos_documentos: {
        Row: {
          andamento_id: string | null
          caminho_storage: string
          categoria: string
          created_at: string | null
          id: string
          mime_type: string | null
          nome_arquivo: string
          processo_id: string
          tamanho_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          andamento_id?: string | null
          caminho_storage: string
          categoria: string
          created_at?: string | null
          id?: string
          mime_type?: string | null
          nome_arquivo: string
          processo_id: string
          tamanho_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          andamento_id?: string | null
          caminho_storage?: string
          categoria?: string
          created_at?: string | null
          id?: string
          mime_type?: string | null
          nome_arquivo?: string
          processo_id?: string
          tamanho_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processos_documentos_andamento_id_fkey"
            columns: ["andamento_id"]
            isOneToOne: false
            referencedRelation: "processos_andamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_documentos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      processos_historico: {
        Row: {
          acao: string
          campo_alterado: string | null
          created_at: string | null
          entidade_id: string | null
          entidade_tipo: string
          id: string
          processo_id: string
          usuario_id: string | null
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          acao: string
          campo_alterado?: string | null
          created_at?: string | null
          entidade_id?: string | null
          entidade_tipo: string
          id?: string
          processo_id: string
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          acao?: string
          campo_alterado?: string | null
          created_at?: string | null
          entidade_id?: string | null
          entidade_tipo?: string
          id?: string
          processo_id?: string
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processos_historico_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      processos_prazos: {
        Row: {
          alerta_1_dia: boolean | null
          alerta_3_dias: boolean | null
          alerta_7_dias: boolean | null
          alerta_dias_antes: number | null
          created_at: string | null
          created_by: string | null
          data_prazo: string
          descricao: string
          id: string
          observacoes: string | null
          prioridade: string | null
          processo_id: string
          responsavel_id: string | null
          status: string | null
          tipo_prazo: string
        }
        Insert: {
          alerta_1_dia?: boolean | null
          alerta_3_dias?: boolean | null
          alerta_7_dias?: boolean | null
          alerta_dias_antes?: number | null
          created_at?: string | null
          created_by?: string | null
          data_prazo: string
          descricao: string
          id?: string
          observacoes?: string | null
          prioridade?: string | null
          processo_id: string
          responsavel_id?: string | null
          status?: string | null
          tipo_prazo: string
        }
        Update: {
          alerta_1_dia?: boolean | null
          alerta_3_dias?: boolean | null
          alerta_7_dias?: boolean | null
          alerta_dias_antes?: number | null
          created_at?: string | null
          created_by?: string | null
          data_prazo?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          prioridade?: string | null
          processo_id?: string
          responsavel_id?: string | null
          status?: string | null
          tipo_prazo?: string
        }
        Relationships: [
          {
            foreignKeyName: "processos_prazos_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          cargo: string | null
          created_at: string | null
          email: string
          id: string
          nome_completo: string
          telefone: string | null
          ultimo_acesso: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email: string
          id: string
          nome_completo: string
          telefone?: string | null
          ultimo_acesso?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nome_completo?: string
          telefone?: string | null
          ultimo_acesso?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      relatorios_compartilhados: {
        Row: {
          cliente_id: string
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          expires_at: string
          id: string
          tipo_relatorio: string
          token: string
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          expires_at: string
          id?: string
          tipo_relatorio: string
          token: string
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          expires_at?: string
          id?: string
          tipo_relatorio?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_compartilhados_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          cor: string
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          tipo: string
        }
        Insert: {
          cor: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          tipo: string
        }
        Update: {
          cor?: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          tipo?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          conteudo: string
          created_at: string | null
          criado_por: string | null
          descricao: string | null
          id: string
          nome: string
          tipo: string
          updated_at: string | null
          variaveis: string[] | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          conteudo: string
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          nome: string
          tipo: string
          updated_at?: string | null
          variaveis?: string[] | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          conteudo?: string
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string | null
          variaveis?: string[] | null
        }
        Relationships: []
      }
      user_invites: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_aprovacao: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string | null
          historico_id: string | null
          id: string
          motivo_rejeicao: string | null
          rejeitado: boolean | null
          status: string | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string | null
          historico_id?: string | null
          id?: string
          motivo_rejeicao?: string | null
          rejeitado?: boolean | null
          status?: string | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string | null
          historico_id?: string | null
          id?: string
          motivo_rejeicao?: string | null
          rejeitado?: boolean | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_aprovacao_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_aprovacao_historico_id_fkey"
            columns: ["historico_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_historico"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_config: {
        Row: {
          active: boolean | null
          created_at: string | null
          credentials: Json
          id: string
          phone_number: string
          phone_number_id: string | null
          provider: string
          updated_at: string | null
          webhook_verify_token: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          credentials?: Json
          id?: string
          phone_number: string
          phone_number_id?: string | null
          provider: string
          updated_at?: string | null
          webhook_verify_token?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          credentials?: Json
          id?: string
          phone_number?: string
          phone_number_id?: string | null
          provider?: string
          updated_at?: string | null
          webhook_verify_token?: string | null
        }
        Relationships: []
      }
      whatsapp_historico: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          cliente_id: string | null
          cliente_respondeu: boolean | null
          created_at: string | null
          custo: number | null
          destinatario_nome: string | null
          destinatario_telefone: string
          entregue_em: string | null
          enviado_em: string | null
          erro_mensagem: string | null
          id: string
          lido_em: string | null
          mensagem: string
          message_id_externo: string | null
          processo_id: string | null
          provider: string | null
          regra_id: string | null
          resposta_cliente: string | null
          resposta_em: string | null
          status: string
          template_id: string | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          cliente_id?: string | null
          cliente_respondeu?: boolean | null
          created_at?: string | null
          custo?: number | null
          destinatario_nome?: string | null
          destinatario_telefone: string
          entregue_em?: string | null
          enviado_em?: string | null
          erro_mensagem?: string | null
          id?: string
          lido_em?: string | null
          mensagem: string
          message_id_externo?: string | null
          processo_id?: string | null
          provider?: string | null
          regra_id?: string | null
          resposta_cliente?: string | null
          resposta_em?: string | null
          status?: string
          template_id?: string | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          cliente_id?: string | null
          cliente_respondeu?: boolean | null
          created_at?: string | null
          custo?: number | null
          destinatario_nome?: string | null
          destinatario_telefone?: string
          entregue_em?: string | null
          enviado_em?: string | null
          erro_mensagem?: string | null
          id?: string
          lido_em?: string | null
          mensagem?: string
          message_id_externo?: string | null
          processo_id?: string | null
          provider?: string | null
          regra_id?: string | null
          resposta_cliente?: string | null
          resposta_em?: string | null
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_historico_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_historico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_historico_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_historico_regra_id_fkey"
            columns: ["regra_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_regras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_historico_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_regras: {
        Row: {
          agendamento: Json | null
          ativa: boolean | null
          condicoes: Json | null
          created_at: string | null
          destinatarios: string
          evento_gatilho: string | null
          horario_comercial: boolean | null
          id: string
          ignorar_fim_semana: boolean | null
          intervalo_minimo: number | null
          lembretes: Json | null
          lista_destinatarios: string[] | null
          nome: string
          periodicidade: Json | null
          requer_aprovacao: boolean | null
          template_id: string | null
          tipo_gatilho: string
          total_envios: number | null
          ultima_execucao: string | null
          updated_at: string | null
        }
        Insert: {
          agendamento?: Json | null
          ativa?: boolean | null
          condicoes?: Json | null
          created_at?: string | null
          destinatarios: string
          evento_gatilho?: string | null
          horario_comercial?: boolean | null
          id?: string
          ignorar_fim_semana?: boolean | null
          intervalo_minimo?: number | null
          lembretes?: Json | null
          lista_destinatarios?: string[] | null
          nome: string
          periodicidade?: Json | null
          requer_aprovacao?: boolean | null
          template_id?: string | null
          tipo_gatilho: string
          total_envios?: number | null
          ultima_execucao?: string | null
          updated_at?: string | null
        }
        Update: {
          agendamento?: Json | null
          ativa?: boolean | null
          condicoes?: Json | null
          created_at?: string | null
          destinatarios?: string
          evento_gatilho?: string | null
          horario_comercial?: boolean | null
          id?: string
          ignorar_fim_semana?: boolean | null
          intervalo_minimo?: number | null
          lembretes?: Json | null
          lista_destinatarios?: string[] | null
          nome?: string
          periodicidade?: Json | null
          requer_aprovacao?: boolean | null
          template_id?: string | null
          tipo_gatilho?: string
          total_envios?: number | null
          ultima_execucao?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_regras_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          ativo: boolean | null
          categoria: string
          created_at: string | null
          criado_por: string | null
          id: string
          mensagem: string
          nome: string
          total_envios: number | null
          updated_at: string | null
          usado_ultima_vez: string | null
          variaveis: string[] | null
        }
        Insert: {
          ativo?: boolean | null
          categoria: string
          created_at?: string | null
          criado_por?: string | null
          id?: string
          mensagem: string
          nome: string
          total_envios?: number | null
          updated_at?: string | null
          usado_ultima_vez?: string | null
          variaveis?: string[] | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          created_at?: string | null
          criado_por?: string | null
          id?: string
          mensagem?: string
          nome?: string
          total_envios?: number | null
          updated_at?: string | null
          usado_ultima_vez?: string | null
          variaveis?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "advogado" | "assistente" | "financeiro"
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
    Enums: {
      app_role: ["admin", "advogado", "assistente", "financeiro"],
    },
  },
} as const
