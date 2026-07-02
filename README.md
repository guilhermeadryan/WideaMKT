# WideaMKT

Landing page da WideaMKT — agência premium de marketing digital, branding, tráfego, sites e IA.

## Stack

- [TanStack Start](https://tanstack.com/start) (SSR + file-based routing)
- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- shadcn/ui + Radix primitives
- Framer Motion

## Requisitos

- [Bun](https://bun.sh) ≥ 1.1 (ou npm/pnpm equivalente)
- Node.js ≥ 20

## Instalação

```bash
bun install
```

## Desenvolvimento

```bash
bun run dev
```

Servidor sobe em `http://localhost:8080`.

## Build de produção

```bash
bun run build
bun run preview
```

## Scripts

| Comando            | Descrição                                |
| ------------------ | ---------------------------------------- |
| `bun run dev`      | Servidor de desenvolvimento              |
| `bun run build`    | Build de produção                        |
| `bun run preview`  | Preview do build de produção             |
| `bun run lint`     | ESLint                                   |
| `bun run format`   | Prettier                                 |

## Estrutura

```
src/
├── routes/         # Rotas file-based do TanStack Router
├── components/     # Componentes React reutilizáveis
├── hooks/          # Hooks customizados
├── lib/            # Utilitários
└── styles.css      # Tailwind + design tokens
```

## Deploy

Compatível com qualquer plataforma que suporte Node.js ou runtimes edge (Cloudflare Workers, Vercel, Netlify, Fly.io, etc.). Ajuste o target em `vite.config.ts` conforme o destino.

## Licença

Todos os direitos reservados — WideaMKT.
