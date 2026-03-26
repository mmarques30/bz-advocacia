

## Plano: Aba Treinamentos + Senhas (admin-only) + Permissões

### 1. Criar tabela `treinamentos` no banco
```sql
CREATE TABLE public.treinamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text,
  drive_url text NOT NULL,
  categoria text DEFAULT 'geral',
  ordem integer DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.treinamentos ENABLE ROW LEVEL SECURITY;
-- Todos autenticados podem ler
CREATE POLICY "Authenticated can read treinamentos" ON public.treinamentos FOR SELECT TO authenticated USING (true);
-- Apenas admins podem gerenciar
CREATE POLICY "Admins can manage treinamentos" ON public.treinamentos FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### 2. Criar tabela `senhas_sistema` no banco (admin-only)
```sql
CREATE TABLE public.senhas_sistema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  url text,
  usuario text,
  senha text NOT NULL,
  categoria text DEFAULT 'geral',
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.senhas_sistema ENABLE ROW LEVEL SECURITY;
-- Apenas admins podem ver e gerenciar
CREATE POLICY "Admins can manage senhas" ON public.senhas_sistema FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### 3. Criar componente `src/pages/configuracoes/Treinamentos.tsx`
- Lista de vídeos de treinamento com título, descrição, link do Drive
- Botão "Adicionar Treinamento" (admin-only) abre dialog com campos: título, descrição, URL do Drive, categoria
- Cards com botão para abrir link em nova aba, editar e excluir (admin-only)
- Hook `useTreinamentos` para CRUD na tabela

### 4. Criar componente `src/pages/configuracoes/SenhasSistema.tsx`
- Visível apenas para admins (verificação via `useIsAdvogada` ou `user_roles`)
- Tabela com colunas: Título, URL, Usuário, Senha (mascarada com toggle), Categoria
- Botão "Adicionar Senha" abre dialog com os campos
- Funcionalidade de copiar senha para clipboard
- Hook `useSenhasSistema` para CRUD na tabela

### 5. Atualizar `src/pages/configuracoes/Controle.tsx`
- Adicionar aba "Treinamentos" com ícone `Video`
- Renderizar componente `Treinamentos`

### 6. Atualizar `src/pages/configuracoes/GuiaDeUso.tsx`
- Adicionar seção "Senhas do Sistema" (com ícone `Lock`) no final dos guias
- Renderizar componente `SenhasSistema` dentro dessa seção, visível apenas para admins

### 7. Atualizar permissões em `src/lib/pagePermissions.ts`
- Adicionar ao grupo `administrativo.children`:
  - `{ key: "administrativo.treinamentos", label: "Treinamentos", parent: "administrativo" }`
  - `{ key: "administrativo.senhas", label: "Senhas do Sistema", parent: "administrativo" }`

### Arquivos criados/editados
- **Migration**: 2 tabelas novas (`treinamentos`, `senhas_sistema`)
- **Criados**: `Treinamentos.tsx`, `SenhasSistema.tsx`, `useTreinamentos.ts`, `useSenhasSistema.ts`
- **Editados**: `Controle.tsx`, `GuiaDeUso.tsx`, `pagePermissions.ts`

