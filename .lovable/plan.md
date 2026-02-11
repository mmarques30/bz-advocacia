
# Plano: Automatizar Status do Lead ao Enviar Proposta

## Resumo

Quando uma proposta for gerada pelo sistema (via formulario de Proposta ou Contrato), o status (`estagio`) do lead associado sera automaticamente atualizado para `proposta_enviada`, junto com registro de atividade no historico.

## Pontos de Integracao

Existem dois fluxos que geram documentos vinculados a um lead:

1. **GerarPropostaForm** (aba "Proposta") - insere diretamente no banco via `supabase.from('contratos_gerados').insert()`
2. **GerarContratoForm** (aba "Contrato") - usa o hook `useCreateContrato`

Ambos precisam atualizar o lead apos salvar com sucesso.

## Alteracoes

### 1. `GerarPropostaForm.tsx` - Atualizar lead apos gerar proposta

Apos a insercao bem-sucedida na tabela `contratos_gerados` (linha 130-144), adicionar:

- Update no `contact_submissions` setando `estagio = 'proposta_enviada'` e `data_ultima_atividade = now()`
- Inserir registro na tabela `atividades` com tipo `proposta_enviada` e descricao adequada
- Apenas atualizar se o estagio atual do lead for anterior a `proposta_enviada` (evitar regredir de `fechado`)
- Invalidar query de leads para refletir a mudanca

### 2. `GerarContratoForm.tsx` - Atualizar lead apos gerar contrato

No callback `onSuccess` da geracao de contrato (apos salvar com sucesso), adicionar a mesma logica:

- Update do estagio do lead para `proposta_enviada`
- Registro de atividade
- Condicional: so atualiza se estagio atual nao for `fechado` ou `perdido`

### 3. Logica de protecao de status

Para nao regredir um lead que ja esta em estagio mais avancado, a atualizacao so ocorrera se o estagio atual estiver em: `novo`, `contato_inicial`, `em_analise`. Se ja estiver em `proposta_enviada`, `fechado` ou `perdido`, o status nao sera alterado.

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| `src/components/documentos/GerarPropostaForm.tsx` | Adicionar update de status do lead e registro de atividade apos salvar proposta |
| `src/components/documentos/GerarContratoForm.tsx` | Adicionar update de status do lead e registro de atividade apos salvar contrato |

## Detalhes Tecnicos

Logica a ser adicionada apos salvar com sucesso (em ambos os formularios):

```text
1. Buscar estagio atual do lead: SELECT estagio FROM contact_submissions WHERE id = clienteId
2. Se estagio in ('novo', 'contato_inicial', 'em_analise'):
   - UPDATE contact_submissions SET estagio = 'proposta_enviada', data_ultima_atividade = now() WHERE id = clienteId
   - INSERT INTO atividades (tipo, descricao, entidade_tipo, entidade_id) VALUES ('proposta_enviada', 'Proposta gerada automaticamente pelo sistema', 'lead', clienteId)
3. Invalidar queryKey ['leads']
```

Nenhuma migracao de banco necessaria - as tabelas `contact_submissions` e `atividades` ja existem com os campos necessarios.

## Resultado

- Ao gerar uma proposta, o lead muda automaticamente para "Proposta Enviada"
- Ao gerar um contrato, o mesmo comportamento se aplica
- Leads em estagios avancados (fechado/perdido) nao sao regredidos
- Atividade registrada no historico do lead para rastreabilidade
