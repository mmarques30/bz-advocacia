

## Desconectar n8n e importar leads faltantes da planilha

### 1. Desconexão do n8n

O n8n está conectado via MCP (Model Context Protocol) e **não pode ser desconectado por mim**. Isso precisa ser feito manualmente:
- Acesse **Settings → Connectors** no painel do Lovable
- Localize a conexão n8n e remova-a

A edge function `receive-sheet-lead` continuará existindo no projeto, mas não receberá mais chamadas do n8n. Ela pode ser mantida para uso futuro ou removida.

### 2. Leads faltantes identificados

Cruzando a planilha CSV (122 linhas) com o banco de dados, identifiquei **12 telefones** presentes em `lead_acquisition_events` mas **sem registro correspondente** em `contact_submissions` (o CRM). Desses, 5 são números de teste/inválidos e **7 são leads reais**:

| Nome | Telefone | Plataforma | Serviço | Data |
|------|----------|------------|---------|------|
| Sergio Mesquita | 5511999422721 | ig | inventário | 2026-03-10 |
| Rodrigo Bairros | 5551981383419 | ig | inventário | 2026-03-03 |
| Antonio roberto feijo de sous | 5551985525201 | ig | inventário | 2026-02-28 |
| Luis Silva | 5551998080526 | ig | inventário | 2026-03-12 |
| Lurdes Miranda | 5554984432582 | ig | inventário | 2026-03-09 |
| Ana Flávia De Mello Nunes | 5554997033630 | ig | medicamentos_de_alto_custo | 2026-03-02 |
| Lory Lory Dias Dias | 5555991764783 | ig | inventário | 2026-03-03 |

(Juh Lima tem telefone inválido `555199922995292` — 13 dígitos — e será ignorada)

### 3. Plano de importação

#### Passo único: Inserir os 7 leads via SQL migration
Executar um INSERT direto em `contact_submissions` para os 7 leads faltantes, seguindo o mesmo formato que a edge function usa:
- `nome_completo`, `telefone`, `email: ''`, `tipo_processo` (do CSV), `como_conheceu: 'Meta Ads'`, `origem: 'instagram'`, `estagio: 'novo'`, `prioridade: 'media'`, `lgpd_consent: true`
- `primeiro_contato_em` = data do CSV, `ultimo_contato_em` = agora
- `utm_source: 'ig'`, `utm_campaign` = nome da campanha do CSV

Depois, executar UPDATE em `lead_acquisition_events` para vincular o `contact_submission_id` dos novos registros.

### Arquivos modificados
Nenhum arquivo de código será alterado. Apenas operações diretas no banco de dados via migration.

