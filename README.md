# Lynko

Página de links personalizável. Cada pessoa cria uma página pública em `/<username>` com seus links, ícones de redes sociais, foto e fundo, e edita tudo num dashboard com prévia ao vivo.

Monorepo com [Bun](https://bun.com) workspaces:

| Pasta                             | O que é                                                                 |
| --------------------------------- | ----------------------------------------------------------------------- |
| [`api/`](api/README.md)           | API REST em Fastify, Drizzle e Postgres (Neon), upload de imagens no S3 |
| [`apps/web/`](apps/web/README.md) | Site, dashboard e página pública em Next.js 16                          |

## Requisitos

- Bun 1.4.2 ou mais novo
- Um banco Postgres (Neon ou local)
- Opcional, para upload de foto e fundo: bucket S3 e distribuição CloudFront

## Como rodar

1. Instale as dependências na raiz:

   ```bash
   bun install
   ```

2. Crie os arquivos de ambiente a partir dos exemplos e preencha os valores:

   ```bash
   cp api/.env.example api/.env
   ```

   ```bash
   cp apps/web/.env.example apps/web/.env
   ```

3. Aplique as migrations no seu banco:

   ```bash
   bun run db:migrate
   ```

4. Suba a API (porta 8080) e o web (porta 3000):

   ```bash
   bun run dev
   ```

Abra http://localhost:3000. A documentação da API fica em http://localhost:8080/docs.

## Scripts da raiz

| Comando               | Faz                                                   |
| --------------------- | ----------------------------------------------------- |
| `bun run dev`         | API e web juntos                                      |
| `bun run dev:api`     | só a API                                              |
| `bun run dev:web`     | só o web                                              |
| `bun run build`       | build de todos os pacotes                             |
| `bun run typecheck`   | TypeScript em todos os pacotes                        |
| `bun run test`        | testes unitários de todos os pacotes                  |
| `bun run lint`        | Biome (lint e formatação) no repositório              |
| `bun run lint:fix`    | Biome corrigindo o que for automático                 |
| `bun run db:generate` | gera uma migration a partir de `api/src/db/schema.ts` |
| `bun run db:migrate`  | aplica as migrations pendentes                        |
| `bun run db:studio`   | abre o Drizzle Studio                                 |

Os testes de interação do web rodam à parte: `cd apps/web && bun run test:interaction`.

## Convenções

- Estilo: Biome na raiz (2 espaços, aspas simples, sem ponto e vírgula), sem comentários no código e com uma linha em branco entre statements.
- Commits em inglês, no formato [Conventional Commits](https://www.conventionalcommits.org).
- Textos para o usuário final em pt-BR; mensagens de erro da API e resumos do Swagger em inglês.
- Regras completas para quem contribui (pessoas e agentes) em [`AGENTS.md`](AGENTS.md).

## CI

O workflow em [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em cada push na `main` e em pull requests: typecheck e testes unitários da API, e typecheck, testes unitários e de interação do web.
