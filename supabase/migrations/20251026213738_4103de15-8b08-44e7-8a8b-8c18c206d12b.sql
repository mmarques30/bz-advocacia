-- Corrigir search_path na funcao de notificacoes
CREATE OR REPLACE FUNCTION criar_notificacao_novo_lead()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notificacoes (usuario_id, tipo, titulo, descricao, link, metadata)
  VALUES (
    COALESCE(NEW.responsavel_id, (SELECT id FROM auth.users LIMIT 1)),
    'novo_lead',
    'Novo lead recebido',
    NEW.nome_completo || ' - ' || NEW.tipo_processo || ' (via ' || COALESCE(NEW.origem, 'site') || ')',
    '/dashboard/leads?id=' || NEW.id,
    jsonb_build_object('leadId', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;