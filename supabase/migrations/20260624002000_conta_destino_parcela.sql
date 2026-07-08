-- Adiciona conta_destino em parcelas_financeiras.
--
-- Cenario: contrato "Conta Juliana" com 3 parcelas. Cliente paga as duas
-- primeiras na conta Juliana e a ultima cai na conta Escritorio (transferiu
-- pra pessoa juridica). Hoje o sistema forcava a mesma conta pra todas as
-- parcelas (herdada do acordo_financeiro pai), entao Ju/Eli reportavam:
-- "nao consigo mudar a conta so da ultima parcela".
--
-- Feature: coluna conta_destino nullable em parcelas_financeiras. Quando
-- NULL herda de acordos_financeiros.conta (comportamento antigo). Quando
-- setada, prevalece.

ALTER TABLE public.parcelas_financeiras
  ADD COLUMN IF NOT EXISTS conta_destino text NULL;

COMMENT ON COLUMN public.parcelas_financeiras.conta_destino IS
  'Conta financeira onde essa parcela especifica foi recebida. NULL = herda '
  'de acordos_financeiros.conta. Permite parcelas do mesmo contrato caindo '
  'em contas diferentes (cenario real: cliente muda a forma de pagamento).';

NOTIFY pgrst, 'reload schema';
