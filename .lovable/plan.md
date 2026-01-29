

# Plano: Ícone de Docs Clicável para Pasta do Cliente

## Objetivo
Transformar o ícone da coluna "Docs" na tabela de processos em um link clicável que direciona para a pasta do Google Drive do cliente/processo.

## Situação Atual

Na `ProcessosTable.tsx`, a coluna "Docs" exibe:
- **Badge verde com Link2**: quando há documentos vinculados
- **Badge outline com FileX**: quando não há documentos

Atualmente, esses badges são apenas visuais (`cursor-default`) e não têm interação.

## Mudança Proposta

Modificar a lógica da célula "Docs" para:
1. Se `processo.pasta_drive_url` existir → tornar o badge clicável, abrindo a pasta em nova aba
2. Manter o visual atual, apenas adicionando interatividade
3. Atualizar o tooltip para indicar que é clicável

## Detalhamento Técnico

### Arquivo: `src/components/processos/ProcessosTable.tsx`

Modificar a célula da coluna Docs (linhas 138-164):

**De:**
```tsx
<TableCell>
  {docsCount !== undefined && docsCount > 0 ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className="gap-1 bg-green-600 hover:bg-green-700 cursor-default">
          <Link2 className="h-3 w-3" />
          {docsCount}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {docsCount} documento(s) vinculado(s)
      </TooltipContent>
    </Tooltip>
  ) : (
    // ... badge sem documentos
  )}
</TableCell>
```

**Para:**
```tsx
<TableCell>
  {processo.pasta_drive_url ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <a 
          href={processo.pasta_drive_url} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <Badge className="gap-1 bg-green-600 hover:bg-green-700 cursor-pointer">
            <Link2 className="h-3 w-3" />
            {docsCount || 0}
          </Badge>
        </a>
      </TooltipTrigger>
      <TooltipContent>
        Abrir pasta do Google Drive ({docsCount || 0} doc(s))
      </TooltipContent>
    </Tooltip>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="gap-1 text-muted-foreground cursor-default">
          <FileX className="h-3 w-3" />
          0
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        Nenhuma pasta vinculada
      </TooltipContent>
    </Tooltip>
  )}
</TableCell>
```

## Lógica de Exibição

| Condição | Visual | Comportamento |
|----------|--------|---------------|
| `pasta_drive_url` existe | Badge verde com ícone Link2 | Clicável → abre pasta no Drive |
| `pasta_drive_url` não existe | Badge outline com ícone FileX | Não clicável, apenas informativo |

## Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/processos/ProcessosTable.tsx` | Modificar célula da coluna Docs |

## Benefícios

1. **Acesso Rápido**: Um clique leva direto à pasta do cliente
2. **Feedback Visual**: Cursor pointer indica que é clicável
3. **Tooltip Informativo**: Usuário sabe o que esperar ao clicar
4. **Sem Quebra de Fluxo**: `stopPropagation` evita conflitos com cliques na linha

