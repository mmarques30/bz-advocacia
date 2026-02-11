
-- Adicionar coluna conta nas tabelas financeiras
ALTER TABLE acordos_financeiros ADD COLUMN conta text DEFAULT 'escritorio';
ALTER TABLE despesas ADD COLUMN conta text DEFAULT 'escritorio';
ALTER TABLE transacoes_financeiras ADD COLUMN conta text DEFAULT 'escritorio';

-- Seed opcoes_sistema para contas
INSERT INTO opcoes_sistema (grupo, valor, label, ordem) VALUES
  ('conta_financeira', 'juliana', 'Conta Juliana', 1),
  ('conta_financeira', 'liziane', 'Conta Liziane', 2),
  ('conta_financeira', 'escritorio', 'Conta Escritório', 3);
