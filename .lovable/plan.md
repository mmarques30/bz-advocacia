# Apagar 3 leads fantasma @lid restantes

## Ação

Executar via `supabase--insert` (DELETE em dados, não migration):

```sql
DELETE FROM mensagens_sdr     WHERE lead_id IN ('sdr_wa_1778684483139_156309','sdr_wa_1778681523334_052839','sdr_wa_1778681498034_370134');
DELETE FROM qualificacoes_sdr WHERE lead_id IN ('sdr_wa_1778684483139_156309','sdr_wa_1778681523334_052839','sdr_wa_1778681498034_370134');
DELETE FROM eventos_sdr       WHERE lead_id IN ('sdr_wa_1778684483139_156309','sdr_wa_1778681523334_052839','sdr_wa_1778681498034_370134');
DELETE FROM contact_submissions WHERE lead_geral_id IN ('sdr_wa_1778684483139_156309','sdr_wa_1778681523334_052839','sdr_wa_1778681498034_370134');
DELETE FROM leads_geral       WHERE id IN ('sdr_wa_1778684483139_156309','sdr_wa_1778681523334_052839','sdr_wa_1778681498034_370134');
```

## Validação

```sql
SELECT id FROM leads_geral WHERE id IN ('sdr_wa_1778684483139_156309','sdr_wa_1778681523334_052839','sdr_wa_1778681498034_370134');
SELECT count(*) FROM contact_submissions WHERE lead_geral_id IN (...);
SELECT count(*) FROM mensagens_sdr WHERE lead_id IN (...);
```

Esperado: 0 linhas em todas.
