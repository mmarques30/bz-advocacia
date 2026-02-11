
# Plano: Corrigir RLS de Demandas para Todos os Usuarios Autenticados

## Problema Identificado

As politicas de RLS (Row Level Security) da tabela `demandas_internas` so permitem INSERT e UPDATE para usuarios com role `admin`. Usuarios sem essa role conseguem ver as demandas, mas recebem erro ao tentar criar ou alterar status.

Politicas atuais:
| Operacao | Politica | Quem pode |
|----------|----------|-----------|
| SELECT | `true` | Todos autenticados |
| INSERT | `has_role(auth.uid(), 'admin')` | Somente admins |
| UPDATE | `has_role(auth.uid(), 'admin')` | Somente admins |
| DELETE | `has_role(auth.uid(), 'admin')` | Somente admins |

## Solucao

Ajustar as politicas de INSERT e UPDATE para permitir que qualquer usuario autenticado crie e atualize demandas, mantendo DELETE restrito a admins (ou ao criador da demanda).

### Migracao SQL

```sql
-- Remover politicas restritivas
DROP POLICY "Admins can insert demandas" ON demandas_internas;
DROP POLICY "Admins can update demandas" ON demandas_internas;
DROP POLICY "Admins can delete demandas" ON demandas_internas;

-- INSERT: qualquer usuario autenticado
CREATE POLICY "Authenticated users can insert demandas"
  ON demandas_internas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: admins ou o criador ou o responsavel
CREATE POLICY "Users can update own or assigned demandas"
  ON demandas_internas FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR criado_por = auth.uid()
    OR responsavel_id = auth.uid()
  );

-- DELETE: admins ou o criador
CREATE POLICY "Admins or creator can delete demandas"
  ON demandas_internas FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR criado_por = auth.uid()
  );
```

## Resultado

- Todos os usuarios autenticados poderao criar demandas
- Usuarios poderao alterar status das demandas que criaram ou sao responsaveis
- Admins continuam com acesso total
- DELETE continua restrito a admins e ao criador da demanda

## Detalhamento Tecnico

Nenhuma alteracao de codigo frontend sera necessaria. O problema e exclusivamente de permissao no banco de dados. As funcoes `useCreateDemanda` e `useUpdateDemanda` ja estao corretas -- o erro vem da rejeicao do Supabase via RLS.
