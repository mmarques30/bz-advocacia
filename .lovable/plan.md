

## Substituir imagem de fundo em /auth

### Alterações

1. **Copiar imagem** `user-uploads://IMG_8432.jpg` para `src/assets/lawyers-auth.jpg` (substituindo a atual)

2. **`src/pages/Auth.tsx`** — ajustar estilo do background:
   - `backgroundPosition: 'center 50%'` (centralizar melhor as pessoas)
   - `backgroundSize: '100% auto'` ou similar para reduzir o zoom e mostrar mais da imagem

