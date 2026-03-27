

## Corrigir título duplicado de "Senhas do Sistema" no Guia de Uso

### Problema
O componente `SenhasSistema` renderiza seu próprio título `<h2>Senhas do Sistema</h2>` (linhas 66-74). Quando embutido dentro do accordion no `GuiaDeUso.tsx`, o título do accordion já diz "Senhas do Sistema", causando duplicação.

### Solução
Adicionar uma prop `hideHeader` ao `SenhasSistema` para ocultar o cabeçalho (título + descrição) quando usado dentro do Guia de Uso.

### Alterações

**1. `src/pages/configuracoes/SenhasSistema.tsx`**
- Adicionar prop `hideHeader?: boolean` (default `false`)
- Quando `hideHeader === true`, não renderizar o `<div>` com o `<h2>` e `<p>` (linhas 67-74)

**2. `src/pages/configuracoes/GuiaDeUso.tsx`**
- Passar `<SenhasSistema hideHeader />` na seção do accordion

### Arquivos editados
- `src/pages/configuracoes/SenhasSistema.tsx`
- `src/pages/configuracoes/GuiaDeUso.tsx`

