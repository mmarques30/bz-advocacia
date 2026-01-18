-- Limpar tabelas dependentes primeiro (FKs)
TRUNCATE TABLE processos_andamentos CASCADE;
TRUNCATE TABLE processos_documentos CASCADE;
TRUNCATE TABLE processos_historico CASCADE;
TRUNCATE TABLE processos_prazos CASCADE;
TRUNCATE TABLE lead_comunicacoes CASCADE;
TRUNCATE TABLE lead_interacoes CASCADE;
TRUNCATE TABLE lead_notas CASCADE;
TRUNCATE TABLE parcelas_financeiras CASCADE;
TRUNCATE TABLE entidade_tags CASCADE;
TRUNCATE TABLE documentos_drive CASCADE;
TRUNCATE TABLE relatorios_compartilhados CASCADE;
TRUNCATE TABLE historico_pagamentos CASCADE;

-- Limpar tabelas principais
TRUNCATE TABLE transacoes_financeiras CASCADE;
TRUNCATE TABLE acordos_financeiros CASCADE;
TRUNCATE TABLE despesas CASCADE;
TRUNCATE TABLE financeiro CASCADE;
TRUNCATE TABLE processos CASCADE;
TRUNCATE TABLE demandas_internas CASCADE;
TRUNCATE TABLE atividades CASCADE;
TRUNCATE TABLE notificacoes CASCADE;
TRUNCATE TABLE logs_sistema CASCADE;
TRUNCATE TABLE contact_submissions CASCADE;
TRUNCATE TABLE kpis CASCADE;

-- Limpar dados do Meta Ads
TRUNCATE TABLE meta_campanhas CASCADE;
TRUNCATE TABLE meta_connections CASCADE;
TRUNCATE TABLE meta_metricas CASCADE;
TRUNCATE TABLE meta_envios_historico CASCADE;
TRUNCATE TABLE meta_relatorios_auto CASCADE;

-- Limpar dados de consultas
TRUNCATE TABLE consultas_auditoria CASCADE;
TRUNCATE TABLE consultas_realizadas CASCADE;

-- Limpar WhatsApp histórico
TRUNCATE TABLE whatsapp_aprovacao CASCADE;
TRUNCATE TABLE whatsapp_historico CASCADE;

-- Limpar tabelas externas
TRUNCATE TABLE transacoes_externas CASCADE;
TRUNCATE TABLE categorias_externas CASCADE;
TRUNCATE TABLE subcategorias_externas CASCADE;
TRUNCATE TABLE resumo_anual_externo CASCADE;
TRUNCATE TABLE resumo_mensal_externo CASCADE;
TRUNCATE TABLE resumo_por_subcategoria_externo CASCADE;