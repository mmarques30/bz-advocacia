

## Corrigir `created_at` dos 7 leads importados

### Problema
Os 7 leads importados via migration ficaram com `created_at = 2026-03-18` (data da execução do SQL), quando deveriam ter a data real do primeiro contato da planilha.

### Correção
Executar um UPDATE para igualar `created_at` ao valor já correto em `primeiro_contato_em` para cada um dos 7 registros:

```sql
UPDATE contact_submissions
SET created_at = primeiro_contato_em
WHERE id IN (
  'ab14230a-b715-4214-b9fa-d4cc2a0b51d1',  -- Ana Flávia (02/03)
  'b3edb86f-6cfb-4568-b807-4ac9d0bfefde',  -- Lory (03/03)
  '87da9e59-860b-483c-bfdd-c307fe0cc072',  -- Luis Silva (12/03)
  '690a9a97-6b61-423b-aae9-f2967c526017',  -- Lurdes (09/03)
  '0ed83c1e-c92c-4db3-b206-c6cb475d2f8b',  -- Rodrigo (03/03)
  'b719fdf5-d5f8-4805-ac24-95b343efe97f',  -- Sergio (10/03)
  'ea067425-28ad-413f-92c6-27a29d445b25'   -- Antonio (28/02)
);
```

Nenhum arquivo de código será alterado. Apenas uma operação de dados no banco.

