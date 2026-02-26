

# Análise da Call: Erros e Ajustes Necessários

## Problemas identificados na transcrição vs. estado atual do sistema

---

### 1. Email obrigatório para novos clientes (PRIORIDADE ALTA)
**O que disseram**: "O campo de e-mail seja removido como obrigatório para a criação de novos clientes. Sem o e-mail, o sistema não permite emissão de contratos e documentos."

**Estado no código**: No `NewLeadDialog.tsx`, o email é validado com `z.string().email()` mas já tem `.optional().or(z.literal(""))` (linha 37). O label diz "Email *" com asterisco, passando a impressão de obrigatório. No banco, `email` já é nullable (`is_nullable: YES`).

**Problema real**: O label "Email *" confunde. Além disso, no `GerarContratoForm.tsx`, o `dadosCliente` usa `clienteSelecionado.email` na substituição de variáveis do contrato. Se o email estiver vazio, as variáveis do template ficam em branco, o que pode causar erros na geração do PDF.

**Correção**:
- `NewLeadDialog.tsx`: Remover o asterisco do label "Email *" → "Email"
- `GerarContratoForm.tsx` e `ComplementarDadosDialog.tsx`: Não incluir "email" como campo faltante obrigatório nos templates de contrato

---

### 2. Erro ao salvar novos modelos de documentos (PRIORIDADE ALTA)
**O que disseram**: "Não estavam conseguindo gerar novos modelos [...] erro ao tentar salvar um novo modelo de proposta" (00:00:36)

**Estado no código**: O `UploadModeloDialog` usa `useSaveModelo()` que faz insert na tabela `templates`. O fluxo exige upload de arquivo + análise por IA (`analyze-document` edge function). Se a edge function falhar ou a tabela `templates` tiver constraint/RLS bloqueando, o save falha silenciosamente.

**Investigação necessária**: Verificar logs da edge function `analyze-document` e RLS policies na tabela `templates`.

**Correção potencial**:
- Verificar se a edge function `analyze-document` está deployada e funcional
- Verificar RLS da tabela `templates` para garantir que usuários autenticados podem inserir

---

### 3. Dados não atualizam ao complementar no formulário de contrato (PRIORIDADE ALTA)
**O que disseram**: "Mesmo atualizando lá, eu não consegui emitir" e "preenchimento manual no momento da emissão não atualizava o cadastro" (00:07:09)

**Estado no código**: O `ComplementarDadosDialog` usa `useUpdateClienteDados()` que faz update em `contact_submissions`. Após o update, chama `onComplete()` que tenta `handleGerarPDF()` novamente. Porém, os dados do cliente (`dadosCliente`) são um `useMemo` que depende de `clienteSelecionado`, e o `clienteSelecionado` vem de uma query que não é invalidada imediatamente após o update.

**Problema**: O `useUpdateClienteDados` invalida `queryKey: ['leads']`, mas o `GerarContratoForm` usa `useLeadsSimple()` com `queryKey: ['leads-simple']`. As queries são diferentes, então o cache não é atualizado.

**Correção**:
- `useContratos.ts` (`useUpdateClienteDados`): Adicionar invalidação de `['leads-simple']` além de `['leads']`
- Ou renomear o queryKey de `useLeadsSimple` para `['leads']` para reaproveitar a invalidação

---

### 4. Geração de PDF falha com dados incompletos (PRIORIDADE ALTA)
**O que disseram**: "O sistema não está conectando corretamente os dados do cliente e não está atualizando as informações preenchidas para gerar o PDF" (00:03:40)

**Estado no código**: O `handleGerarPDF` verifica `camposFaltantes.length > 0` e abre o dialog de complementação. Mas a lista de campos faltantes vem de `extrairVariaveisFaltantes()` que compara as variáveis do template com os dados do cliente. Se o template exige email e o email está vazio, fica travado.

**Correção**:
- Revisar `extrairVariaveisFaltantes()` em `src/lib/contratoUtils.ts` para não exigir email
- Garantir que variáveis opcionais (email) sejam substituídas por string vazia em vez de travar a geração

---

### 5. Fluxo Proposta → Contrato sem reaproveitar dados (PRIORIDADE MÉDIA)
**O que disseram**: "As informações da proposta emitida deveriam ser usadas para gerar o contrato automaticamente sem preenchimento manual" (00:05:14)

**Estado no código**: `GerarContratoForm` e `GerarPropostaForm` são formulários independentes. Não há linkagem entre proposta emitida e contrato. Quando a proposta é salva em `contratos_gerados`, seus valores são armazenados, mas o formulário de contrato não consulta propostas anteriores.

**Correção**:
- No `GerarContratoForm`, ao selecionar um cliente, buscar propostas existentes na tabela `contratos_gerados` com `tipo_contrato = 'proposta'` e `status = 'finalizado'`
- Pré-preencher os campos de valor (entrada, parcelas, percentual) com os dados da proposta

---

### 6. Foto cortada no layout da proposta (PRIORIDADE BAIXA)
**O que disseram**: "A foto da equipe no layout da proposta está sendo cortada" (00:22:02)

**Correção**: Ajustar altura/aspect-ratio da imagem no componente `PropostaPDF.tsx`

---

## Resumo de alterações por arquivo

| Arquivo | Alteração |
|---|---|
| `src/components/leads/NewLeadDialog.tsx` | Remover asterisco do label "Email" |
| `src/hooks/useContratos.ts` | `useUpdateClienteDados` invalidar `['leads-simple']` |
| `src/lib/contratoUtils.ts` | Tornar email opcional na extração de variáveis faltantes |
| `src/components/documentos/GerarContratoForm.tsx` | Buscar propostas anteriores do cliente e pré-preencher valores |
| `src/components/documentos/PropostaPDF.tsx` | Ajustar height da imagem das advogadas |
| Tabela `templates` (RLS) | Verificar e corrigir policies para permitir insert |
| Edge function `analyze-document` | Verificar logs e funcionalidade |

## Itens não-técnicos mencionados (para referência)
- Criar playbook de vendas com mensagens padrão
- Treinamento para Bruna e nova contratada Mariana
- Transição de agência de marketing (Blueberry → nova)
- Bot de WhatsApp em desenvolvimento (já em andamento)
- Upload de nova foto da equipe (fundo branco)

