# Lynko Web

Site, dashboard e página pública do Lynko.

Next.js 16 (App Router), React 19, Tailwind CSS 4 com shadcn/ui sobre Base UI, React Query, React Hook Form + Zod, Auth.js (NextAuth 5) e next-intl.

## Rodando

Na raiz do monorepo, depois do `bun install`:

```bash
cp apps/web/.env.example apps/web/.env
```

```bash
bun run dev:web
```

Abre em http://localhost:3000. A API precisa estar no ar em `API_URL` (veja o [README da API](../../api/README.md)).

## Variáveis de ambiente

| Variável                               | Uso                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------- |
| `API_URL`                              | URL da API usada pelas Server Actions e pelo Auth.js                      |
| `NEXT_PUBLIC_API_URL`                  | mesma URL, mantida por compatibilidade                                    |
| `AUTH_SECRET`                          | segredo do Auth.js (`bunx auth secret`), diferente do `JWT_SECRET` da API |
| `AUTH_URL`                             | URL pública do site, exigida pelo Auth.js em produção                     |
| `AUTH_TRUST_HOST`                      | `true` só atrás de proxy confiável ou localmente                          |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | reservados; o login com Google ainda não está ativo                       |
| `NEXT_PUBLIC_SITE_URL`                 | URL canônica para metadata e Open Graph                                   |

Upload de imagens não precisa de variável no web: a URL de envio vem da API.

## Scripts

| Comando                    | Faz                                                                       |
| -------------------------- | ------------------------------------------------------------------------- |
| `bun run dev`              | servidor de desenvolvimento                                               |
| `bun run build`            | build de produção                                                         |
| `bun run start`            | serve o build                                                             |
| `bun run typecheck`        | gera os tipos de rota (`next typegen`) e roda o TypeScript                |
| `bun run test`             | testes unitários (`tests/unit`)                                           |
| `bun run test:interaction` | testes de interação com Testing Library e happy-dom (`tests/interaction`) |

Se o typecheck acusar uma rota que não existe mais em `.next/dev/types`, reinicie o `bun run dev`: esses tipos são gerados pelo servidor de desenvolvimento.

## Rotas

Todas ficam sob `[locale]` (`en` padrão, `pt`). Textos em `src/messages/`.

| Rota                    | Pasta                                        |
| ----------------------- | -------------------------------------------- |
| `/`                     | `(public)/page.tsx`, a home                  |
| `/login`, `/register`   | `(public)/login`, `(public)/register`        |
| `/<username>`           | `(public)/[username]`, a página pública      |
| `/dashboard`            | `(panel)/dashboard`, visão geral             |
| `/dashboard/links`      | links e redes sociais                        |
| `/dashboard/appearance` | temas, fundo, tipografia, botões e ícones    |
| `/dashboard/analytics`  | métricas                                     |
| `/dashboard/settings`   | conta e perfil (nome, bio, foto, publicação) |

`src/proxy.ts` cuida do idioma e de mandar para o login quem acessa o dashboard sem sessão.

## Estrutura

```
src/
├── app/[locale]/
│   ├── _components/        usado pela página pública e pelo dashboard
│   │   ├── page-view/      renderer da página (mesmo no preview e em /<username>)
│   │   ├── link-icon/      ícones de marca dos links
│   │   └── social-links/   schema e plataformas das redes sociais
│   ├── (public)/           home, login, register e [username]
│   └── (panel)/dashboard/
│       ├── _actions/       escrita compartilhada ('use server')
│       ├── _data-access/   leitura compartilhada ('use server')
│       ├── _components/    layout, skeletons globais, upload, preview
│       └── <rota>/         _actions, _components e page.tsx da rota
├── components/ui/          componentes shadcn
├── lib/                    cliente da API, auth e helpers
└── messages/               traduções
```

- Cada rota guarda o que é só dela em pastas com `_`; o que várias rotas usam sobe para o pai comum.
- No client, leitura com `useQuery` e escrita com `useMutation`, sempre chamando funções de `_data-access` e `_actions`. Componentes não chamam a API direto; a única exceção é o `PUT` do upload para a URL assinada do S3.
- `_actions` nunca lançam erro: devolvem `{ data?, error? }`.
- Formulários com `Field` + `Controller` e schemas Zod em arquivos `*-schema.ts`.
- Estilo só com Tailwind e os tokens do tema em `globals.css`, sem cores fixas nem CSS novo.

Regras completas para quem contribui no [`AGENTS.md`](../../AGENTS.md).
