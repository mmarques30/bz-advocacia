

# Plano: Igualar layout dos cards de Leads Anúncios ao de Leads Orgânicos

## Problema
O `DraggableLeadCard` (Kanban de Anúncios, `src/pages/Leads.tsx` linhas 401-441) usa um layout simples sem ícones. O `LeadCard` dos orgânicos usa ícones `Briefcase` e `Clock` com estilização do componente `Card`.

## Alteração

### `src/pages/Leads.tsx` — `DraggableLeadCard`
Substituir o conteúdo interno do card (linhas 424-438) para usar o mesmo layout do `LeadCard`:
- Importar `Clock` e `Briefcase` de lucide-react (já importados no arquivo)
- Usar o componente `Card` com `p-3 cursor-pointer hover:shadow-md transition-shadow`
- Exibir `tipo_servico` com ícone `Briefcase` (mesma formatação)
- Exibir `há X dias` com ícone `Clock` e cor condicional (vermelho se > 7 dias)

Layout final do card interno:
```
Nome do Lead
📁 Tipo de Serviço
🕐 há X dias
```

Mesmo padrão visual do `LeadCard` orgânico (screenshot do usuário).

