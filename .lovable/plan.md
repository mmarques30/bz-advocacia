

## Substituir emoji 🎂 por ícone Lucide Cake

### Alteração única em `src/pages/Dashboard.tsx`

**Linha 82** — trocar `🎂` pelo componente `<Cake />` do lucide-react:

- Adicionar import: `import { Cake } from "lucide-react";`
- Substituir `🎂` por `<Cake className="inline-block w-3.5 h-3.5 mr-0.5 -mt-0.5" />` na linha 82

Nenhum outro arquivo precisa ser alterado.

