# Lynko API

API REST do Lynko: contas, páginas, links, redes sociais, aparência e upload de imagens.

Fastify 5, Zod (`fastify-type-provider-zod`), Drizzle ORM sobre Neon (`neon-http`), JWT com refresh token, Swagger com Scalar e AWS SDK v3 para S3.

## Rodando

Na raiz do monorepo, depois do `bun install`:

```bash
cp api/.env.example api/.env
```

```bash
bun run dev:api
```

A API sobe em http://localhost:8080 e a documentação interativa fica em http://localhost:8080/docs.

## Variáveis de ambiente

Validadas em [`src/config/env.ts`](src/config/env.ts); a API não sobe com valor inválido. Use `process.env` só nesse arquivo.

| Variável                                     | Obrigatória          | Uso                                               |
| -------------------------------------------- | -------------------- | ------------------------------------------------- |
| `DATABASE_URL`                               | sim                  | conexão Postgres (Neon)                           |
| `JWT_SECRET`                                 | sim                  | assina o access token (mínimo 32 caracteres)      |
| `PORT`                                       | não (8080)           | porta HTTP                                        |
| `JWT_EXPIRES_IN`                             | não (15m)            | validade do access token                          |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS`              | não (30)             | validade da sessão                                |
| `CORS_ORIGIN`                                | não (localhost:3000) | origens permitidas, separadas por vírgula         |
| `AWS_REGION`                                 | para upload          | região do bucket                                  |
| `S3_BUCKET`                                  | para upload          | bucket privado das imagens                        |
| `CDN_URL`                                    | para upload          | domínio do CloudFront, sem barra no final         |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | fora da AWS          | credenciais do usuário IAM (cadeia padrão do SDK) |
| `MEDIA_AVATAR_MAX_BYTES`                     | não (5 MB)           | tamanho máximo do avatar                          |
| `MEDIA_BACKGROUND_MAX_BYTES`                 | não (10 MB)          | tamanho máximo da imagem de fundo                 |
| `MEDIA_MAX_PENDING_PER_PAGE`                 | não (5)              | uploads pendentes por página                      |

Sem `AWS_REGION`, `S3_BUCKET` ou `CDN_URL`, a API funciona normalmente e só as rotas `/media` respondem 503.

## Scripts

| Comando               | Faz                                           |
| --------------------- | --------------------------------------------- |
| `bun run dev`         | servidor com reload                           |
| `bun run typecheck`   | TypeScript                                    |
| `bun run test`        | testes unitários (`tests/unit`)               |
| `bun run db:generate` | gera migration a partir de `src/db/schema.ts` |
| `bun run db:migrate`  | aplica as migrations de `drizzle/`            |
| `bun run db:studio`   | Drizzle Studio                                |

## Rotas

Caminhos relativos ao prefixo (`POST /` em `/links` é `POST /links`).

| Prefixo   | Rotas                                                                                                      | Auth                     |
| --------- | ---------------------------------------------------------------------------------------------------------- | ------------------------ |
| `/health` | `GET /health`                                                                                              | não                      |
| `/auth`   | `POST /register`, `/login`, `/refresh`, `/logout`                                                          | não (com rate limit)     |
| `/users`  | `GET /me`                                                                                                  | sim                      |
| `/pages`  | `POST /`, `GET` `PATCH` `DELETE /me`, `GET /me/preview`, `GET /:username` (pública, só páginas publicadas) | sim, exceto `/:username` |
| `/links`  | `GET /`, `POST /`, `PUT /reorder`, `PATCH /:id`, `DELETE /:id`                                             | sim                      |
| `/media`  | `POST /presign`, `POST /:id/confirm`, `GET /:id`, `DELETE /:id`                                            | sim (com rate limit)     |

Detalhes de cada body e resposta em `/docs`.

### Upload de imagens

1. `POST /media/presign` cria a mídia `pending` e devolve um `PUT` assinado (300 s) para `pending/<pageId>/<mediaId>`, com `Content-Type` e `Content-Length` assinados.
2. O navegador envia o arquivo direto ao S3.
3. `POST /media/:id/confirm` confere o tamanho e os primeiros bytes (JPEG, PNG ou WebP), copia para `media/<pageId>/<mediaId>.<ext>` e marca como `ready`. É idempotente.
4. `PATCH /pages/me` associa a mídia (`avatarMediaId` ou `appearance.background.imageMediaId`) e apaga a anterior. As respostas trazem `avatarUrl` e `backgroundImageUrl` da CDN.

No S3, deixe o bucket privado, libere `PUT` da origem do web no CORS e expire `pending/` em 1 dia. No CloudFront, use OAC e libere só `media/*` na bucket policy. O usuário IAM precisa de `s3:PutObject`, `s3:GetObject` e `s3:DeleteObject` em `pending/*` e `media/*`, e de `s3:ListBucket` com prefixo `pending/*`; sem ele, um upload ausente vira erro 500 em vez de 400.

## Estrutura

```
src/
├── app.ts              registra plugins e módulos
├── server.ts           sobe o servidor
├── config/env.ts       variáveis de ambiente validadas
├── db/                 conexão Drizzle e schema
├── modules/<dominio>/  routes → service → repository, mais dto
├── plugins/            auth, erros, segurança (helmet, CORS, rate limit), Swagger, Zod
└── shared/             erros HTTP, senha, tokens, erros de banco
drizzle/                migrations geradas
tests/unit/             testes com repositories em memória (sem banco)
```

- `routes` valida com os DTOs e chama o service; `service` tem a regra e lança os erros de `shared/errors.ts`; `repository` só faz query.
- Toda rota protegida usa o guard `onRequest` e pega o usuário de `request.user.sub`; recurso de outra pessoa responde 404.
- Os testes trocam os repositories por versões em memória com `spyOn` e nunca tocam o banco nem a AWS.

Regras completas para quem contribui no [`AGENTS.md`](../AGENTS.md).
