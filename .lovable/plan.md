

# Separar Visao de Lead e Cliente

## Problema Atual

O dialog de detalhes (`LeadDetailsDialog`) mostra as mesmas 6 abas (Informacoes, Processos, Contratos, Tarefas, Documentos, Notas) tanto para Leads quanto para Clientes. Leads nao precisam de Processos, Contratos nem Tarefas -- sao apenas cadastros iniciais.

## Solucao

Condicionar as abas exibidas com base na prop `isCliente`:

### Quando `isCliente = false` (Lead)

Exibir apenas 3 abas:
- **Informacoes** -- dados basicos do cadastro (nome, email, telefone, origem, estagio, tipo de processo, mensagem, valor proposta)
- **Documentos** -- documentos anexados
- **Notas** -- notas internas

Remover da visao de Lead:
- Aba Processos
- Aba Contratos  
- Aba Tarefas

O grid de abas passa de `grid-cols-6` para `grid-cols-3`.

### Quando `isCliente = true` (Cliente)

Manter todas as 6 abas como esta hoje (hub completo):
- Informacoes, Processos, Contratos, Tarefas, Documentos, Notas

---

## Detalhes Tecnicos

### Arquivo: `src/components/leads/LeadDetailsDialog.tsx`

1. Alterar o `TabsList` para usar `grid-cols-3` quando nao for cliente e `grid-cols-6` quando for cliente
2. Renderizar condicionalmente os `TabsTrigger` e `TabsContent` de Processos, Contratos e Tarefas apenas quando `isCliente = true`
3. Remover imports de `ClienteProcessosTab`, `LeadContratosTab` e `ClienteTarefasTab` do escopo quando nao for cliente (ou simplesmente condicionar a renderizacao)
4. Na aba Informacoes do Lead, remover campos que so fazem sentido para clientes (como "Status do Cliente") e manter apenas os dados de cadastro

Nenhum outro arquivo precisa ser alterado -- a pagina `Leads.tsx` ja passa `isCliente={false}` (implicitamente) e `Clientes.tsx` ja passa `isCliente={true}`.
