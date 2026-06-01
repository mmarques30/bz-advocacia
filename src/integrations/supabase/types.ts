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
          conta: string | null
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
          conta?: string | null
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
          conta?: string | null
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
            foreignKeyName: "acordos_financeiros_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_pipeline_b_z"
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
      advogados_sdr: {
        Row: {
          areas: string[]
          ativo: boolean
          created_at: string | null
          email: string | null
          id: string
          nome: string
          telefone: string | null
          user_id: string | null
        }
        Insert: {
          areas?: string[]
          ativo?: boolean
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
          user_id?: string | null
        }
        Update: {
          areas?: string[]
          ativo?: boolean
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      apify_config: {
        Row: {
          actor_id: string | null
          api_token_configured: boolean | null
          ativo: boolean | null
          created_at: string
          creditos_usados: number | null
          id: string
          ultima_consulta: string | null
          updated_at: string
        }
        Insert: {
          actor_id?: string | null
          api_token_configured?: boolean | null
          ativo?: boolean | null
          created_at?: string
          creditos_usados?: number | null
          id?: string
          ultima_consulta?: string | null
          updated_at?: string
        }
        Update: {
          actor_id?: string | null
          api_token_configured?: boolean | null
          ativo?: boolean | null
          created_at?: string
          creditos_usados?: number | null
          id?: string
          ultima_consulta?: string | null
          updated_at?: string
        }
        Relationships: []
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
      atualizacoes_sistema: {
        Row: {
          conteudo: string
          created_at: string
          created_by: string | null
          data_fim: string
          data_inicio: string
          descricao_manual: string | null
          id: string
          periodo: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          created_by?: string | null
          data_fim: string
          data_inicio: string
          descricao_manual?: string | null
          id?: string
          periodo: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          created_by?: string | null
          data_fim?: string
          data_inicio?: string
          descricao_manual?: string | null
          id?: string
          periodo?: string
        }
        Relationships: []
      }
      campanhas_envio: {
        Row: {
          area: string | null
          campanha: string
          contact_submission_id: string | null
          created_at: string | null
          enviada_em: string | null
          erro_detalhe: string | null
          id: string
          lead_geral_id: string | null
          mensagem_enviada: string | null
          respondida_em: string | null
          status: string
          telefone: string
          variacao_texto: number | null
          zapi_message_id: string | null
        }
        Insert: {
          area?: string | null
          campanha?: string
          contact_submission_id?: string | null
          created_at?: string | null
          enviada_em?: string | null
          erro_detalhe?: string | null
          id?: string
          lead_geral_id?: string | null
          mensagem_enviada?: string | null
          respondida_em?: string | null
          status?: string
          telefone: string
          variacao_texto?: number | null
          zapi_message_id?: string | null
        }
        Update: {
          area?: string | null
          campanha?: string
          contact_submission_id?: string | null
          created_at?: string | null
          enviada_em?: string | null
          erro_detalhe?: string | null
          id?: string
          lead_geral_id?: string | null
          mensagem_enviada?: string | null
          respondida_em?: string | null
          status?: string
          telefone?: string
          variacao_texto?: number | null
          zapi_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_envio_contact_submission_id_fkey"
            columns: ["contact_submission_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_envio_contact_submission_id_fkey"
            columns: ["contact_submission_id"]
            isOneToOne: false
            referencedRelation: "vw_pipeline_b_z"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_envio_lead_geral_id_fkey"
            columns: ["lead_geral_id"]
            isOneToOne: false
            referencedRelation: "leads_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_envio_lead_geral_id_fkey"
            columns: ["lead_geral_id"]
            isOneToOne: false
            referencedRelation: "vw_clientes_ativos"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      categorias_externas: {
        Row: {
          created_at: string | null
          descricao: string | null
          external_id: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          external_id?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          external_id?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      categorias_financeiras: {
        Row: {
          codigo: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          codigo: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
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
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          data_ultima_atividade: string | null
          documentos: string[] | null
          email: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_completo: string | null
          endereco_estado: string | null
          estado_civil: string | null
          estagio: string | null
          id: string
          lead_geral_id: string | null
          lgpd_consent: boolean
          mensagem: string
          nacionalidade: string | null
          nome_completo: string
          notas_internas: string | null
          numero_herdeiros: number | null
          origem: string | null
          outro_como_conheceu: string | null
          outro_tipo_processo: string | null
          pasta_drive_url: string | null
          perguntas_respondidas: number | null
          primeiro_contato_em: string | null
          prioridade: string | null
          profissao: string | null
          regime_casamento: string | null
          responsavel_id: string | null
          rg: string | null
          situacao_atual: string | null
          status: string
          status_cliente: string | null
          tags: string[] | null
          telefone: string
          telefone_digits: string | null
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
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          data_ultima_atividade?: string | null
          documentos?: string[] | null
          email?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_completo?: string | null
          endereco_estado?: string | null
          estado_civil?: string | null
          estagio?: string | null
          id?: string
          lead_geral_id?: string | null
          lgpd_consent?: boolean
          mensagem: string
          nacionalidade?: string | null
          nome_completo: string
          notas_internas?: string | null
          numero_herdeiros?: number | null
          origem?: string | null
          outro_como_conheceu?: string | null
          outro_tipo_processo?: string | null
          pasta_drive_url?: string | null
          perguntas_respondidas?: number | null
          primeiro_contato_em?: string | null
          prioridade?: string | null
          profissao?: string | null
          regime_casamento?: string | null
          responsavel_id?: string | null
          rg?: string | null
          situacao_atual?: string | null
          status?: string
          status_cliente?: string | null
          tags?: string[] | null
          telefone: string
          telefone_digits?: string | null
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
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          data_ultima_atividade?: string | null
          documentos?: string[] | null
          email?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_completo?: string | null
          endereco_estado?: string | null
          estado_civil?: string | null
          estagio?: string | null
          id?: string
          lead_geral_id?: string | null
          lgpd_consent?: boolean
          mensagem?: string
          nacionalidade?: string | null
          nome_completo?: string
          notas_internas?: string | null
          numero_herdeiros?: number | null
          origem?: string | null
          outro_como_conheceu?: string | null
          outro_tipo_processo?: string | null
          pasta_drive_url?: string | null
          perguntas_respondidas?: number | null
          primeiro_contato_em?: string | null
          prioridade?: string | null
          profissao?: string | null
          regime_casamento?: string | null
          responsavel_id?: string | null
          rg?: string | null
          situacao_atual?: string | null
          status?: string
          status_cliente?: string | null
          tags?: string[] | null
          telefone?: string
          telefone_digits?: string | null
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
      contratos_gerados: {
        Row: {
          cliente_id: string
          conteudo_final: string
          created_at: string
          created_by: string | null
          dados_contrato: Json | null
          id: string
          numero_contrato: number | null
          numero_proposta: number | null
          pdf_url: string | null
          status: string
          template_id: string | null
          tipo_contrato: string
          titulo: string
          updated_at: string
          valores: Json | null
        }
        Insert: {
          cliente_id: string
          conteudo_final: string
          created_at?: string
          created_by?: string | null
          dados_contrato?: Json | null
          id?: string
          numero_contrato?: number | null
          numero_proposta?: number | null
          pdf_url?: string | null
          status?: string
          template_id?: string | null
          tipo_contrato: string
          titulo: string
          updated_at?: string
          valores?: Json | null
        }
        Update: {
          cliente_id?: string
          conteudo_final?: string
          created_at?: string
          created_by?: string | null
          dados_contrato?: Json | null
          id?: string
          numero_contrato?: number | null
          numero_proposta?: number | null
          pdf_url?: string | null
          status?: string
          template_id?: string | null
          tipo_contrato?: string
          titulo?: string
          updated_at?: string
          valores?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_gerados_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_gerados_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_pipeline_b_z"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_gerados_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      creditos_condicionais: {
        Row: {
          acordo_id: string | null
          cliente_id: string
          conta: string | null
          created_at: string | null
          created_by: string | null
          data_ativacao: string | null
          descricao: string
          evento_gatilho: string
          id: string
          observacoes: string | null
          processo_id: string | null
          status: string | null
          valor: number
        }
        Insert: {
          acordo_id?: string | null
          cliente_id: string
          conta?: string | null
          created_at?: string | null
          created_by?: string | null
          data_ativacao?: string | null
          descricao: string
          evento_gatilho: string
          id?: string
          observacoes?: string | null
          processo_id?: string | null
          status?: string | null
          valor: number
        }
        Update: {
          acordo_id?: string | null
          cliente_id?: string
          conta?: string | null
          created_at?: string | null
          created_by?: string | null
          data_ativacao?: string | null
          descricao?: string
          evento_gatilho?: string
          id?: string
          observacoes?: string | null
          processo_id?: string | null
          status?: string | null
          valor?: number
        }
        Relationships: []
      }
      demandas_internas: {
        Row: {
          advogada_responsavel: string
          categoria: string | null
          concluida_em: string | null
          created_at: string
          criado_por: string | null
          data_conclusao: string | null
          data_limite: string | null
          descricao: string | null
          horas_gastas: number | null
          id: string
          lead_id: string | null
          ordem: number | null
          parent_id: string | null
          prioridade: string
          processo_id: string | null
          responsavel_id: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          advogada_responsavel?: string
          categoria?: string | null
          concluida_em?: string | null
          created_at?: string
          criado_por?: string | null
          data_conclusao?: string | null
          data_limite?: string | null
          descricao?: string | null
          horas_gastas?: number | null
          id?: string
          lead_id?: string | null
          ordem?: number | null
          parent_id?: string | null
          prioridade?: string
          processo_id?: string | null
          responsavel_id?: string | null
          status?: string
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          advogada_responsavel?: string
          categoria?: string | null
          concluida_em?: string | null
          created_at?: string
          criado_por?: string | null
          data_conclusao?: string | null
          data_limite?: string | null
          descricao?: string | null
          horas_gastas?: number | null
          id?: string
          lead_id?: string | null
          ordem?: number | null
          parent_id?: string | null
          prioridade?: string
          processo_id?: string | null
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
            foreignKeyName: "demandas_internas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_internas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "vw_pipeline_b_z"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_internas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "demandas_internas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_internas_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
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
          conta: string | null
          created_at: string | null
          created_by: string | null
          data: string
          data_lancamento: string | null
          descricao: string
          despesa_fixa_id: string | null
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
          conta?: string | null
          created_at?: string | null
          created_by?: string | null
          data: string
          data_lancamento?: string | null
          descricao: string
          despesa_fixa_id?: string | null
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
          conta?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: string
          data_lancamento?: string | null
          descricao?: string
          despesa_fixa_id?: string | null
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
            foreignKeyName: "despesas_despesa_fixa_id_fkey"
            columns: ["despesa_fixa_id"]
            isOneToOne: false
            referencedRelation: "despesas_fixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas_fixas: {
        Row: {
          ativa: boolean | null
          categoria: string
          conta: string | null
          created_at: string | null
          created_by: string | null
          descricao: string
          dia_vencimento: number
          id: string
          observacoes: string | null
          valor: number
        }
        Insert: {
          ativa?: boolean | null
          categoria: string
          conta?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao: string
          dia_vencimento?: number
          id?: string
          observacoes?: string | null
          valor: number
        }
        Update: {
          ativa?: boolean | null
          categoria?: string
          conta?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string
          dia_vencimento?: number
          id?: string
          observacoes?: string | null
          valor?: number
        }
        Relationships: []
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
      eventos_sdr: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          payload: Json | null
          tipo: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          payload?: Json | null
          tipo: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          payload?: Json | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_sdr_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_sdr_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "vw_clientes_ativos"
            referencedColumns: ["lead_id"]
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
      lead_acquisition_events: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          contact_submission_id: string | null
          created_at: string
          form_id: string | null
          form_name: string | null
          id: string
          ingested_at: string
          ingestion_channel: string | null
          is_organic: boolean | null
          occurred_at: string
          origem_resolved: string | null
          phone_normalized: string
          raw_payload: Json | null
          source_platform: string | null
        }
        Insert: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          contact_submission_id?: string | null
          created_at?: string
          form_id?: string | null
          form_name?: string | null
          id?: string
          ingested_at?: string
          ingestion_channel?: string | null
          is_organic?: boolean | null
          occurred_at?: string
          origem_resolved?: string | null
          phone_normalized: string
          raw_payload?: Json | null
          source_platform?: string | null
        }
        Update: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          contact_submission_id?: string | null
          created_at?: string
          form_id?: string | null
          form_name?: string | null
          id?: string
          ingested_at?: string
          ingestion_channel?: string | null
          is_organic?: boolean | null
          occurred_at?: string
          origem_resolved?: string | null
          phone_normalized?: string
          raw_payload?: Json | null
          source_platform?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_acquisition_events_contact_submission_id_fkey"
            columns: ["contact_submission_id"]
            isOneToOne: false
            referencedRelation: "contact_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_acquisition_events_contact_submission_id_fkey"
            columns: ["contact_submission_id"]
            isOneToOne: false
            referencedRelation: "vw_pipeline_b_z"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "lead_comunicacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "vw_pipeline_b_z"
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
          {
            foreignKeyName: "lead_interacoes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "vw_pipeline_b_z"
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
          {
            foreignKeyName: "lead_notas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "vw_pipeline_b_z"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_backlog: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          id: string
          lead_geral_id: string | null
          nome: string | null
          origem: string
          payload: Json | null
          primeira_mensagem: string | null
          rejeitado_motivo: string | null
          status: string
          telefone: string
          telefone_raw: string | null
          updated_at: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          id?: string
          lead_geral_id?: string | null
          nome?: string | null
          origem?: string
          payload?: Json | null
          primeira_mensagem?: string | null
          rejeitado_motivo?: string | null
          status?: string
          telefone: string
          telefone_raw?: string | null
          updated_at?: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          id?: string
          lead_geral_id?: string | null
          nome?: string | null
          origem?: string
          payload?: Json | null
          primeira_mensagem?: string | null
          rejeitado_motivo?: string | null
          status?: string
          telefone?: string
          telefone_raw?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_backlog_lead_geral_id_fkey"
            columns: ["lead_geral_id"]
            isOneToOne: false
            referencedRelation: "leads_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_backlog_lead_geral_id_fkey"
            columns: ["lead_geral_id"]
            isOneToOne: false
            referencedRelation: "vw_clientes_ativos"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      leads_geral: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          area_normalizada: string | null
          assumido_em: string | null
          bem_inventariar: string | null
          bot_pausado: boolean | null
          call_agendada_em: string | null
          campaign_id: string | null
          campaign_name: string | null
          contato_whatsapp: string | null
          created_time: string | null
          etapa_qualificacao: string | null
          fluxo_sdr: string | null
          form_id: string | null
          form_name: string | null
          full_name: string | null
          humano_responsavel: string | null
          id: string
          is_converted: boolean | null
          is_organic: boolean | null
          is_qualified: boolean | null
          is_quality: boolean | null
          lead_status: string | null
          motivo_qualificacao: string | null
          observacoes: string | null
          origem_sdr: string | null
          phone_number: string | null
          platform: string | null
          preferencia_contato: string | null
          score: number | null
          status_sdr: string | null
          telefone_digits: string | null
          tentativas_etapa: number
          tipo_servico: string | null
          ultima_leitura_humano: string | null
          ultima_mensagem_em: string | null
          updated_at: string | null
        }
        Insert: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          area_normalizada?: string | null
          assumido_em?: string | null
          bem_inventariar?: string | null
          bot_pausado?: boolean | null
          call_agendada_em?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          contato_whatsapp?: string | null
          created_time?: string | null
          etapa_qualificacao?: string | null
          fluxo_sdr?: string | null
          form_id?: string | null
          form_name?: string | null
          full_name?: string | null
          humano_responsavel?: string | null
          id: string
          is_converted?: boolean | null
          is_organic?: boolean | null
          is_qualified?: boolean | null
          is_quality?: boolean | null
          lead_status?: string | null
          motivo_qualificacao?: string | null
          observacoes?: string | null
          origem_sdr?: string | null
          phone_number?: string | null
          platform?: string | null
          preferencia_contato?: string | null
          score?: number | null
          status_sdr?: string | null
          telefone_digits?: string | null
          tentativas_etapa?: number
          tipo_servico?: string | null
          ultima_leitura_humano?: string | null
          ultima_mensagem_em?: string | null
          updated_at?: string | null
        }
        Update: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          area_normalizada?: string | null
          assumido_em?: string | null
          bem_inventariar?: string | null
          bot_pausado?: boolean | null
          call_agendada_em?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          contato_whatsapp?: string | null
          created_time?: string | null
          etapa_qualificacao?: string | null
          fluxo_sdr?: string | null
          form_id?: string | null
          form_name?: string | null
          full_name?: string | null
          humano_responsavel?: string | null
          id?: string
          is_converted?: boolean | null
          is_organic?: boolean | null
          is_qualified?: boolean | null
          is_quality?: boolean | null
          lead_status?: string | null
          motivo_qualificacao?: string | null
          observacoes?: string | null
          origem_sdr?: string | null
          phone_number?: string | null
          platform?: string | null
          preferencia_contato?: string | null
          score?: number | null
          status_sdr?: string | null
          telefone_digits?: string | null
          tentativas_etapa?: number
          tipo_servico?: string | null
          ultima_leitura_humano?: string | null
          ultima_mensagem_em?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_geral_humano_responsavel_fkey"
            columns: ["humano_responsavel"]
            isOneToOne: false
            referencedRelation: "advogados_sdr"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_status_overrides: {
        Row: {
          id: string
          lead_csv_id: string
          lead_status: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          lead_csv_id: string
          lead_status: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          lead_csv_id?: string
          lead_status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
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
      melhorias_registro: {
        Row: {
          created_at: string
          data_implementacao: string
          descricao: string
          id: string
          tipo: Database["public"]["Enums"]["tipo_melhoria"]
          titulo: string
        }
        Insert: {
          created_at?: string
          data_implementacao?: string
          descricao: string
          id?: string
          tipo?: Database["public"]["Enums"]["tipo_melhoria"]
          titulo: string
        }
        Update: {
          created_at?: string
          data_implementacao?: string
          descricao?: string
          id?: string
          tipo?: Database["public"]["Enums"]["tipo_melhoria"]
          titulo?: string
        }
        Relationships: []
      }
      mensagens_inbound_lock: {
        Row: {
          created_at: string
          message_id: string
        }
        Insert: {
          created_at?: string
          message_id: string
        }
        Update: {
          created_at?: string
          message_id?: string
        }
        Relationships: []
      }
      mensagens_sdr: {
        Row: {
          conteudo: string
          enviada_em: string | null
          id: string
          lead_id: string
          metadata: Json | null
          origem: string
        }
        Insert: {
          conteudo: string
          enviada_em?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          origem: string
        }
        Update: {
          conteudo?: string
          enviada_em?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          origem?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_sdr_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_sdr_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "vw_clientes_ativos"
            referencedColumns: ["lead_id"]
          },
        ]
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
      metas_mensais: {
        Row: {
          ano: number
          created_at: string | null
          id: string
          mes: number
          updated_at: string | null
          valor: number
        }
        Insert: {
          ano: number
          created_at?: string | null
          id?: string
          mes: number
          updated_at?: string | null
          valor?: number
        }
        Update: {
          ano?: number
          created_at?: string | null
          id?: string
          mes?: number
          updated_at?: string | null
          valor?: number
        }
        Relationships: []
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
      numeros_bloqueados_bot: {
        Row: {
          created_at: string
          id: string
          motivo: string | null
          nome: string | null
          telefone: string
        }
        Insert: {
          created_at?: string
          id?: string
          motivo?: string | null
          nome?: string | null
          telefone: string
        }
        Update: {
          created_at?: string
          id?: string
          motivo?: string | null
          nome?: string | null
          telefone?: string
        }
        Relationships: []
      }
      opcoes_sistema: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          grupo: string
          id: string
          label: string
          ordem: number | null
          valor: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          grupo: string
          id?: string
          label: string
          ordem?: number | null
          valor: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          grupo?: string
          id?: string
          label?: string
          ordem?: number | null
          valor?: string
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
          codigo_interno: string | null
          comarca: string | null
          created_at: string | null
          data_distribuicao: string | null
          data_inicio: string
          data_prevista_conclusao: string | null
          data_ultima_atualizacao: string | null
          extrajudicial: boolean | null
          grau_tribunal: string | null
          id: string
          instancia: string | null
          lead_id: string | null
          numero_processo: string | null
          observacoes: string | null
          pasta_drive_url: string | null
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
          codigo_interno?: string | null
          comarca?: string | null
          created_at?: string | null
          data_distribuicao?: string | null
          data_inicio: string
          data_prevista_conclusao?: string | null
          data_ultima_atualizacao?: string | null
          extrajudicial?: boolean | null
          grau_tribunal?: string | null
          id?: string
          instancia?: string | null
          lead_id?: string | null
          numero_processo?: string | null
          observacoes?: string | null
          pasta_drive_url?: string | null
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
          codigo_interno?: string | null
          comarca?: string | null
          created_at?: string | null
          data_distribuicao?: string | null
          data_inicio?: string
          data_prevista_conclusao?: string | null
          data_ultima_atualizacao?: string | null
          extrajudicial?: boolean | null
          grau_tribunal?: string | null
          id?: string
          instancia?: string | null
          lead_id?: string | null
          numero_processo?: string | null
          observacoes?: string | null
          pasta_drive_url?: string | null
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
          {
            foreignKeyName: "processos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "vw_pipeline_b_z"
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
      qualificacoes_sdr: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          pergunta_codigo: string
          pergunta_texto: string
          resposta_estruturada: Json | null
          resposta_texto: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          pergunta_codigo: string
          pergunta_texto: string
          resposta_estruturada?: Json | null
          resposta_texto?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          pergunta_codigo?: string
          pergunta_texto?: string
          resposta_estruturada?: Json | null
          resposta_texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qualificacoes_sdr_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualificacoes_sdr_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "vw_clientes_ativos"
            referencedColumns: ["lead_id"]
          },
        ]
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
          {
            foreignKeyName: "relatorios_compartilhados_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_pipeline_b_z"
            referencedColumns: ["id"]
          },
        ]
      }
      resumo_anual_externo: {
        Row: {
          ano: number
          created_at: string | null
          external_id: string | null
          id: string
          saldo: number | null
          total_despesas: number | null
          total_receitas: number | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          external_id?: string | null
          id?: string
          saldo?: number | null
          total_despesas?: number | null
          total_receitas?: number | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          external_id?: string | null
          id?: string
          saldo?: number | null
          total_despesas?: number | null
          total_receitas?: number | null
        }
        Relationships: []
      }
      resumo_mensal_externo: {
        Row: {
          ano: number
          created_at: string | null
          external_id: string | null
          id: string
          mes: number
          mes_nome: string | null
          saldo: number | null
          total_despesas: number | null
          total_receitas: number | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          external_id?: string | null
          id?: string
          mes: number
          mes_nome?: string | null
          saldo?: number | null
          total_despesas?: number | null
          total_receitas?: number | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          external_id?: string | null
          id?: string
          mes?: number
          mes_nome?: string | null
          saldo?: number | null
          total_despesas?: number | null
          total_receitas?: number | null
        }
        Relationships: []
      }
      resumo_por_subcategoria_externo: {
        Row: {
          ano: number | null
          created_at: string | null
          external_id: string | null
          id: string
          mes: number | null
          subcategoria: string | null
          tipo: string | null
          total: number | null
        }
        Insert: {
          ano?: number | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          mes?: number | null
          subcategoria?: string | null
          tipo?: string | null
          total?: number | null
        }
        Update: {
          ano?: number | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          mes?: number | null
          subcategoria?: string | null
          tipo?: string | null
          total?: number | null
        }
        Relationships: []
      }
      rotinas_calendario: {
        Row: {
          created_at: string | null
          created_by: string | null
          data: string
          horario: string | null
          id: string
          observacoes: string | null
          prioridade: string | null
          recorrencia: string | null
          recorrente: boolean | null
          status: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data: string
          horario?: string | null
          id?: string
          observacoes?: string | null
          prioridade?: string | null
          recorrencia?: string | null
          recorrente?: boolean | null
          status?: string | null
          tipo?: string
          titulo: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data?: string
          horario?: string | null
          id?: string
          observacoes?: string | null
          prioridade?: string | null
          recorrencia?: string | null
          recorrente?: boolean | null
          status?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      senhas_sistema: {
        Row: {
          categoria: string | null
          created_at: string | null
          created_by: string | null
          id: string
          observacoes: string | null
          senha: string
          titulo: string
          updated_at: string | null
          url: string | null
          usuario: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          observacoes?: string | null
          senha: string
          titulo: string
          updated_at?: string | null
          url?: string | null
          usuario?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          observacoes?: string | null
          senha?: string
          titulo?: string
          updated_at?: string | null
          url?: string | null
          usuario?: string | null
        }
        Relationships: []
      }
      servicos_sdr: {
        Row: {
          advogado_id: string | null
          area_codigo: string
          area_nome: string
          ativo: boolean | null
          created_at: string | null
          fluxo: string
          id: string
          link_pagamento: string | null
          modalidade_honorarios: string | null
          servico: string
          valor_consulta: number | null
        }
        Insert: {
          advogado_id?: string | null
          area_codigo: string
          area_nome: string
          ativo?: boolean | null
          created_at?: string | null
          fluxo: string
          id?: string
          link_pagamento?: string | null
          modalidade_honorarios?: string | null
          servico: string
          valor_consulta?: number | null
        }
        Update: {
          advogado_id?: string | null
          area_codigo?: string
          area_nome?: string
          ativo?: boolean | null
          created_at?: string | null
          fluxo?: string
          id?: string
          link_pagamento?: string | null
          modalidade_honorarios?: string | null
          servico?: string
          valor_consulta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "servicos_sdr_advogado_id_fkey"
            columns: ["advogado_id"]
            isOneToOne: false
            referencedRelation: "advogados_sdr"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_leads_raw: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          bem_inventariar: string | null
          campaign_id: string | null
          campaign_name: string | null
          contato_whatsapp: string | null
          created_time: string | null
          form_id: string | null
          form_name: string | null
          full_name: string | null
          id: string
          is_converted: boolean | null
          is_organic: boolean | null
          is_qualified: boolean | null
          is_quality: boolean | null
          lead_status: string | null
          observacoes: string | null
          phone_number: string | null
          platform: string | null
          preferencia_contato: string | null
          raw_json: Json
          source_hash: string | null
          synced_at: string
          tipo_servico: string | null
        }
        Insert: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          bem_inventariar?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          contato_whatsapp?: string | null
          created_time?: string | null
          form_id?: string | null
          form_name?: string | null
          full_name?: string | null
          id: string
          is_converted?: boolean | null
          is_organic?: boolean | null
          is_qualified?: boolean | null
          is_quality?: boolean | null
          lead_status?: string | null
          observacoes?: string | null
          phone_number?: string | null
          platform?: string | null
          preferencia_contato?: string | null
          raw_json?: Json
          source_hash?: string | null
          synced_at?: string
          tipo_servico?: string | null
        }
        Update: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          bem_inventariar?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          contato_whatsapp?: string | null
          created_time?: string | null
          form_id?: string | null
          form_name?: string | null
          full_name?: string | null
          id?: string
          is_converted?: boolean | null
          is_organic?: boolean | null
          is_qualified?: boolean | null
          is_quality?: boolean | null
          lead_status?: string | null
          observacoes?: string | null
          phone_number?: string | null
          platform?: string | null
          preferencia_contato?: string | null
          raw_json?: Json
          source_hash?: string | null
          synced_at?: string
          tipo_servico?: string | null
        }
        Relationships: []
      }
      subcategorias_externas: {
        Row: {
          categoria_id: string | null
          created_at: string | null
          external_id: string | null
          id: string
          nome: string
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          nome: string
        }
        Update: {
          categoria_id?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      subcategorias_financeiras: {
        Row: {
          categoria_codigo: string | null
          codigo: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          categoria_codigo?: string | null
          codigo: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          categoria_codigo?: string | null
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategorias_financeiras_categoria_codigo_fkey"
            columns: ["categoria_codigo"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["codigo"]
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
      templates_versoes: {
        Row: {
          conteudo: string
          created_at: string
          descricao: string | null
          editado_por: string | null
          id: string
          nome: string
          template_id: string
          variaveis: string[] | null
          versao: number
        }
        Insert: {
          conteudo: string
          created_at?: string
          descricao?: string | null
          editado_por?: string | null
          id?: string
          nome: string
          template_id: string
          variaveis?: string[] | null
          versao?: number
        }
        Update: {
          conteudo?: string
          created_at?: string
          descricao?: string | null
          editado_por?: string | null
          id?: string
          nome?: string
          template_id?: string
          variaveis?: string[] | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "templates_versoes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_transacao: {
        Row: {
          codigo: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          codigo: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      transacoes_externas: {
        Row: {
          ano: number
          categoria: string
          created_at: string | null
          data_transacao: string
          descricao: string | null
          external_id: string | null
          id: string
          mes: number
          mes_nome: string | null
          subcategoria: string | null
          tipo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          ano: number
          categoria: string
          created_at?: string | null
          data_transacao: string
          descricao?: string | null
          external_id?: string | null
          id?: string
          mes: number
          mes_nome?: string | null
          subcategoria?: string | null
          tipo: string
          updated_at?: string | null
          valor?: number
        }
        Update: {
          ano?: number
          categoria?: string
          created_at?: string | null
          data_transacao?: string
          descricao?: string | null
          external_id?: string | null
          id?: string
          mes?: number
          mes_nome?: string | null
          subcategoria?: string | null
          tipo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: []
      }
      transacoes_financeiras: {
        Row: {
          ano: number
          categoria_codigo: string | null
          conta: string | null
          created_at: string | null
          data_transacao: string | null
          descricao: string | null
          id: string
          mes: number
          mes_nome: string | null
          subcategoria_codigo: string | null
          tipo_codigo: string | null
          valor: number
        }
        Insert: {
          ano: number
          categoria_codigo?: string | null
          conta?: string | null
          created_at?: string | null
          data_transacao?: string | null
          descricao?: string | null
          id?: string
          mes: number
          mes_nome?: string | null
          subcategoria_codigo?: string | null
          tipo_codigo?: string | null
          valor: number
        }
        Update: {
          ano?: number
          categoria_codigo?: string | null
          conta?: string | null
          created_at?: string | null
          data_transacao?: string | null
          descricao?: string | null
          id?: string
          mes?: number
          mes_nome?: string | null
          subcategoria_codigo?: string | null
          tipo_codigo?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_financeiras_categoria_codigo_fkey"
            columns: ["categoria_codigo"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "transacoes_financeiras_subcategoria_codigo_fkey"
            columns: ["subcategoria_codigo"]
            isOneToOne: false
            referencedRelation: "subcategorias_financeiras"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "transacoes_financeiras_tipo_codigo_fkey"
            columns: ["tipo_codigo"]
            isOneToOne: false
            referencedRelation: "tipos_transacao"
            referencedColumns: ["codigo"]
          },
        ]
      }
      treinamentos: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          drive_url: string
          formato: string | null
          id: string
          ordem: number | null
          titulo: string
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          drive_url: string
          formato?: string | null
          id?: string
          ordem?: number | null
          titulo: string
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          drive_url?: string
          formato?: string | null
          id?: string
          ordem?: number | null
          titulo?: string
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
      user_page_permissions: {
        Row: {
          can_access: boolean | null
          created_at: string | null
          id: string
          page_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_access?: boolean | null
          created_at?: string | null
          id?: string
          page_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_access?: boolean | null
          created_at?: string | null
          id?: string
          page_key?: string
          updated_at?: string | null
          user_id?: string
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
            foreignKeyName: "whatsapp_historico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vw_pipeline_b_z"
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
          tipo: string | null
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
          tipo?: string | null
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
          tipo?: string | null
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
      vw_auditoria_leads: {
        Row: {
          crm_data: string | null
          crm_id: string | null
          crm_nome: string | null
          crm_telefone: string | null
          platform: string | null
          raw_data: string | null
          raw_id: string | null
          raw_nome: string | null
          raw_telefone: string | null
          tipo_divergencia: string | null
        }
        Relationships: []
      }
      vw_clientes_ativos: {
        Row: {
          lead_id: string | null
          nome: string | null
          telefone: string | null
        }
        Relationships: []
      }
      vw_pipeline_b_z: {
        Row: {
          area_normalizada: string | null
          bot_pausado: boolean | null
          created_at: string | null
          data_ultima_atividade: string | null
          estagio: string | null
          etapa_qualificacao: string | null
          fluxo_sdr: string | null
          id: string | null
          lead_geral_id: string | null
          nome_completo: string | null
          origem: string | null
          origem_atendimento: string | null
          responsavel_id: string | null
          score: number | null
          status: string | null
          status_sdr: string | null
          telefone: string | null
          tipo_processo: string | null
          ultima_mensagem_em: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_sdr_webhook_secret: { Args: never; Returns: string }
      has_page_access: {
        Args: { _page_key: string; _user_id: string }
        Returns: boolean
      }
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
      tipo_melhoria: "correcao" | "melhoria" | "nova_funcionalidade"
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
      tipo_melhoria: ["correcao", "melhoria", "nova_funcionalidade"],
    },
  },
} as const
