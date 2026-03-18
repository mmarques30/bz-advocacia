

## Ajustar imagem de fundo em /auth

### Alteração em `src/pages/Auth.tsx`

Modificar as propriedades de background da imagem (linha ~93):
- Mudar `backgroundSize` de `'cover'` para `'contain'` ou manter `cover` mas ajustar `backgroundPosition` de `'center 15%'` para `'center 30%'` para descer mais a imagem e mostrar as cabeças
- Alternativamente, usar `backgroundSize: '110%'` para dar um leve zoom out mantendo cobertura total

Abordagem recomendada: manter `backgroundSize: 'cover'` e alterar `backgroundPosition: 'center 30%'` para empurrar a imagem mais para baixo, revelando as cabeças das pessoas.

