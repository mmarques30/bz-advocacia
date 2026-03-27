
## Adicionar formato "link" e "documento" nos Treinamentos

### Contexto
Atualmente os treinamentos só aceitam URL do Google Drive. O usuário quer poder cadastrar tanto links externos (vídeos, artigos) quanto documentos (upload de arquivo).

### Alterações

**1. Migration: adicionar coluna `formato` na tabela `treinamentos`**
```sql
ALTER TABLE public.treinamentos ADD COLUMN formato text DEFAULT 'link';
```
Valores: `link` (URL externa) e `documento` (arquivo enviado ao storage).

**2. Criar bucket de storage `treinamentos`** (via migration)
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('treinamentos', 'treinamentos', false);
```
Com policy para authenticated users lerem e admins inserirem/deletarem.

**3. `src/hooks/useTreinamentos.ts`**
- Adicionar `formato` à interface `Treinamento`
- Adicionar `formato` aos parâmetros de `useCreateTreinamento` e `useUpdateTreinamento`

**4. `src/pages/configuracoes/Treinamentos.tsx`**
- Adicionar estado `formato` (`'link' | 'documento'`)
- No formulário: radio/select para escolher formato
  - Quando `link`: campo de URL (comportamento atual)
  - Quando `documento`: input type="file" com upload para bucket `treinamentos` via `supabase.storage`
  - Após upload, salvar a URL pública/signed no campo `drive_url`
- No card de listagem: ícone diferente para cada formato (`Link` vs `FileText`)
- Botão de abrir: para link abre URL externa; para documento baixa o arquivo

### Arquivos editados
- Migration: coluna `formato` + bucket storage + policies
- `src/hooks/useTreinamentos.ts`
- `src/pages/configuracoes/Treinamentos.tsx`
