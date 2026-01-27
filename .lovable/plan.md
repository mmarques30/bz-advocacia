
# Plano: Sincronizar Link do Google Drive nos Processos

## Problema Identificado

A consulta ao banco mostra claramente:
- **Clientes** possuem `pasta_drive_url` preenchido (ex: `https://drive.google.com/drive/folders/13R9Bnb4ilIl...`)
- **Processos** estão com `pasta_drive_url = NULL` (mesmo tendo a coluna disponível)

O hook de importação já está correto, mas os processos já importados não receberam o link.

## Solução

### 1. Script SQL para Atualizar Processos Existentes

Executar uma migração para copiar o `pasta_drive_url` do cliente (`contact_submissions`) para os processos vinculados:

```sql
UPDATE processos p
SET pasta_drive_url = cs.pasta_drive_url
FROM contact_submissions cs
WHERE p.lead_id = cs.id
  AND cs.pasta_drive_url IS NOT NULL
  AND (p.pasta_drive_url IS NULL OR p.pasta_drive_url = '');
```

### 2. Verificação do Hook de Importação

O hook `useImportClientesPlanilha.ts` já está corretamente implementado para novas importações:

```typescript
const { error: processoError } = await supabase
  .from('processos')
  .insert({
    lead_id: clienteData.id,
    numero_processo: processo.numero,
    pasta_drive_url: cliente.pastaUrl, // ✅ Já está salvando
    // ...
  });
```

### 3. Exibição na Tabela

A tabela `ProcessosTable.tsx` já exibe corretamente a coluna "Pasta Drive" com ícone clicável.

## Resultado Esperado

Após a migração:
- Todos os 184 processos terão o link do Drive do seu cliente
- Clique no ícone de pasta abrirá diretamente o Google Drive em nova aba

## Resumo das Alterações

| Ação | Descrição |
|------|-----------|
| Migração SQL | Copia `pasta_drive_url` dos clientes para seus processos |
| Hook | Já está correto (sem alteração) |
| Interface | Já está pronta (sem alteração) |
