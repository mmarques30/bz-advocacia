export const chartColors = {
  primary: 'hsl(var(--chart-1))',       // Terra cota
  secondary: 'hsl(var(--chart-2))',     // Cinza
  accent: 'hsl(var(--chart-1))',        // Terra cota
  muted: 'hsl(var(--muted))',
  success: 'hsl(var(--chart-4))',       // Verde
  warning: 'hsl(var(--chart-5))',       // Amarelo
  danger: 'hsl(0, 84%, 60%)',           // Vermelho
  terracota: 'hsl(var(--chart-1))',     // Terra cota explícito
  dark: 'hsl(var(--chart-3))',          // Escuro
  gray: 'hsl(var(--chart-2))',          // Cinza
};

export const chartTheme = {
  tooltip: {
    contentStyle: {
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '8px',
      color: 'hsl(var(--card-foreground))',
    },
  },
  grid: {
    strokeDasharray: '3 3',
    stroke: 'hsl(var(--border))',
  },
};
