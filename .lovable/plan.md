
# Ajustar Posicao da Foto de Fundo na Pagina de Login

## Problema

A imagem de fundo (`lawyers-new.png`) na pagina de autenticacao esta com `backgroundPosition: 'center center'`, o que corta a cabeca das socias dependendo da resolucao da tela.

## Solucao

Alterar o `backgroundPosition` de `'center center'` para `'center top'` no arquivo `src/pages/Auth.tsx` (linha 93). Isso fara a imagem comecar pelo topo, garantindo que os rostos aparecam.

A mesma alteracao sera aplicada em `src/pages/Index.tsx` (pagina de contato), que usa o mesmo background com o mesmo problema.

## Alteracoes

### `src/pages/Auth.tsx` (linha 93)
- De: `backgroundPosition: 'center center'`
- Para: `backgroundPosition: 'center top'`

### `src/pages/Index.tsx` (linha 24)
- De: `backgroundPosition: 'center center'`
- Para: `backgroundPosition: 'center top'`
