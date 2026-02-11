
# Plano: Consolidar Processos Dentro da Ficha do Cliente

## Contexto e Problema

Hoje existem duas areas independentes no sistema:

1. **Clientes** (`/dashboard/clientes`) -- ao clicar em um cliente, abre o `LeadDetailsDialog` com 4 abas: Informacoes, Contratos, Documentos, Notas Internas
2. **Processos** (`/dashboard/processos`) -- pagina separada com tabela propria, filtros, e ao clicar abre o `ProcessoDetailsDialog` com 7 abas: Informacoes, Andamentos, Prazos, Documentos, Comunicacao, Financeiro, Historico

O usuario precisa sair da ficha do cliente e ir para outra pagina para gerenciar processos. Nao existe vinculo visual entre as duas telas.

## Solucao Proposta

Adicionar uma aba **"Processos"** dentro do dialog de detalhes do cliente que:
- Lista todos os processos vinculados ao cliente em formato de tabela resumida
- Permite criar novo processo ja vinculado ao cliente
- Ao clicar em um processo, abre o `ProcessoDetailsDialog` completo (com todas as 7 sub-abas de gestao: andamentos, prazos, documentos, comunicacao, financeiro, historico)
- **Remove** o item "Processos" do menu lateral (submenu "Gestao de Clientes"), ja que o acesso passa a ser exclusivamente pela ficha do cliente

A rota `/dashboard/processos` permanece funcional no codigo para nao quebrar links ou bookmarks, mas sem entrada visivel no menu.

---

## Fluxo do Usuario (Antes vs Depois)

```text
ANTES:
  Menu > Gestao de Clientes > Clientes  -->  Ficha do Cliente (sem processos)
  Menu > Gestao de Clientes > Processos -->  Pagina separada (busca manual)

DEPOIS:
  Menu > Gestao de Clientes > Clientes  -->  Ficha do Cliente
                                              |-- Informacoes
                                              |-- Processos  <-- NOVO
                                              |    |-- Tabela resumida (num, tipo, status)
                                              |    |-- Botao "Novo Processo"
                                              |    |-- Clique em processo -> ProcessoDetailsDialog
                                              |         |-- Informacoes (editar dados do processo)
                                              |         |-- Andamentos (registrar movimentacoes)
                                              |         |-- Prazos (controlar prazos judiciais)
                                              |         |-- Documentos (upload e gestao)
                                              |         |-- Comunicacao (mensagens vinculadas)
                                              |         |-- Financeiro (valores e pagamentos)
                                              |         |-- Historico (log de alteracoes)
                                              |-- Contratos
                                              |-- Documentos
                                              |-- Notas Internas
```

---

## Arquivos a Criar e Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/leads/ClienteProcessosTab.tsx` | **Criar** | Componente da aba "Processos" dentro da ficha do cliente |
| `src/components/leads/LeadDetailsDialog.tsx` | **Modificar** | Adicionar aba "Processos" (de 4 para 5 abas) |
| `src/components/AppSidebar.tsx` | **Modificar** | Remover "Processos" do submenu "Gestao de Clientes" |
| `src/components/processos/NewProcessoDialog.tsx` | **Modificar** | Aceitar prop opcional `clienteId` para pre-vincular ao cliente |

---

## Detalhamento Tecnico

### 1. Novo componente: `ClienteProcessosTab.tsx`

**Props:**
- `clienteId: string` -- ID do cliente (contact_submissions.id)
- `clienteNome: string` -- Nome do cliente (para exibir no estado vazio)

**Funcionalidades:**
- Busca processos do banco: `supabase.from('processos').select('*').eq('lead_id', clienteId).order('created_at', { ascending: false })`
- Exibe contagem de processos encontrados (ex: "3 processo(s) vinculado(s)")
- Tabela com colunas:
  - **Numero do Processo** (ou "Sem numero" se vazio)
  - **Tipo** (ex: Inventario, Divorcio)
  - **Status** (badge colorido: Em Andamento = verde, Concluido = azul, Arquivado = cinza, Suspenso = amarelo)
  - **Data Inicio** (formatada dd/MM/yyyy)
  - **Acoes** (botao "Ver Detalhes")
- Botao "Novo Processo" no topo que abre `NewProcessoDialog` com o `lead_id` pre-preenchido e campo de cliente travado
- Ao clicar em um processo ou no botao "Ver Detalhes", abre o `ProcessoDetailsDialog` existente -- que ja contem todas as 7 abas de gestao completa (andamentos, prazos, documentos, comunicacao, financeiro, historico)
- Estado vazio: icone + mensagem "Nenhum processo vinculado a este cliente" + botao para criar

**Padrao seguido:** Mesmo padrao do `LeadContratosTab.tsx` que ja existe -- componente que recebe `clienteId`, busca dados vinculados, exibe tabela resumida e permite interacao.

### 2. Modificar `LeadDetailsDialog.tsx`

**Mudancas:**
- Importar `ClienteProcessosTab` e `ProcessoDetailsDialog`
- Adicionar estado `selectedProcessoId` para controlar qual processo esta aberto
- Expandir TabsList de `grid-cols-4` para `grid-cols-5`
- Adicionar aba "Processos" entre "Informacoes" e "Contratos"
- Renderizar `ProcessoDetailsDialog` condicionalmente quando um processo for selecionado

**Ordem final das abas:**
```text
Informacoes | Processos | Contratos | Documentos | Notas Internas
```

### 3. Modificar `AppSidebar.tsx`

**Mudanca:** Remover a linha `{ title: "Processos", url: "/dashboard/processos" }` do array de submenu de "Gestao de Clientes".

**Resultado no sidebar (submenu "Gestao de Clientes"):**
- Clientes
- Documentos
- Relatorios Vendas

(Processos some do menu, pois agora e acessado pela ficha do cliente)

### 4. Modificar `NewProcessoDialog.tsx`

**Mudanca:** Adicionar prop opcional `clienteId?: string` ao componente.

- Quando `clienteId` for fornecido, o campo de selecao de cliente vem pre-preenchido e desabilitado (travado)
- Quando nao for fornecido, funciona como hoje (selecao livre)
- Isso permite que o botao "Novo Processo" dentro da aba `ClienteProcessosTab` crie processos ja vinculados ao cliente correto sem necessidade de selecionar manualmente

### 5. Rotas (sem alteracao)

A rota `/dashboard/processos` no `App.tsx` **permanece** inalterada. Ela continua funcional como fallback, mas nao tera mais entrada no menu. Isso garante que links antigos, bookmarks ou referencias internas continuem funcionando.
