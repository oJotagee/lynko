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

| Variável                                     | Obrigatória          | Uso                                                |
| -------------------------------------------- | -------------------- | -------------------------------------------------- |
| `DATABASE_URL`                               | sim                  | conexão Postgres (Neon)                            |
| `JWT_SECRET`                                 | sim                  | assina o access token (mínimo 32 caracteres)       |
| `PORT`                                       | não (8080)           | porta HTTP                                         |
| `JWT_EXPIRES_IN`                             | não (15m)            | validade do access token                           |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS`              | não (30)             | validade da sessão                                 |
| `CORS_ORIGIN`                                | não (localhost:3000) | origens permitidas, separadas por vírgula          |
| `AWS_REGION`                                 | para upload          | região do bucket                                   |
| `S3_BUCKET`                                  | para upload          | bucket privado das imagens                         |
| `CDN_URL`                                    | para upload          | domínio do CloudFront, sem barra no final          |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | fora da AWS          | credenciais do usuário IAM (cadeia padrão do SDK)  |
| `MEDIA_AVATAR_MAX_BYTES`                     | não (5 MB)           | tamanho máximo do avatar                           |
| `MEDIA_BACKGROUND_MAX_BYTES`                 | não (10 MB)          | tamanho máximo da imagem de fundo                  |
| `MEDIA_MAX_PENDING_PER_PAGE`                 | não (5)              | uploads pendentes por página                       |
| `REDIS_URL`                                  | não                  | Redis de cache das páginas públicas                |
| `QUEUE_REDIS_URL`                            | para analytics       | Redis da fila (BullMQ); obrigatório no worker      |
| `PUBLIC_PAGE_CACHE_TTL`                      | não (14400 s)        | TTL do conteúdo cacheado (4 h)                     |
| `PUBLIC_PAGE_REF_TTL`                        | não (1800 s)         | TTL da chave username → revisão (30 min)           |
| `PUBLIC_PAGE_REFRESH_THRESHOLD`              | não (30 s)           | janela de refresh antes de expirar                 |
| `PUBLIC_PAGE_LOCK_TTL_MS`                    | não (10000)          | expiração do lock de reconstrução                  |
| `PUBLIC_PAGE_WAIT_TIMEOUT_MS`                | não (5000)           | espera máxima de quem aguarda a reconstrução       |
| `METRICS_TOKEN`                              | não                  | protege `GET /health/metrics` (mín. 32 caracteres) |

Sem `AWS_REGION`, `S3_BUCKET` ou `CDN_URL`, a API funciona normalmente e só as rotas `/media` respondem 503.

## Redis

Dois Redis, porque cache e fila pedem políticas opostas:

| Serviço       | Porta | Política                         | Uso                                    |
| ------------- | ----- | -------------------------------- | -------------------------------------- |
| `redis-cache` | 6379  | `allkeys-lru`, 256 MB, sem disco | cache descartável das páginas públicas |
| `redis-queue` | 6380  | `noeviction`, AOF                | fila do BullMQ; não pode perder jobs   |

Em dev, na raiz do monorepo:

```bash
docker compose up -d
```

Sem `REDIS_URL` a API lê direto do Postgres. Sem `QUEUE_REDIS_URL` a captura de analytics só registra no log.

Em produção: senha, `rediss://` (TLS), nenhuma porta pública, alerta de memória no cache e `noeviction` obrigatório na fila.

### Cache da página pública

`GET /pages/:username` passa pelo Redis (cache-aside). O conteúdo vive 4 h (`PUBLIC_PAGE_CACHE_TTL`) e não é renovado por leituras. Quem encontra menos de 30 s de TTL (`PUBLIC_PAGE_REFRESH_THRESHOLD`) reconstrói a página; as demais requisições esperam o resultado.

- **Consistência:** toda escrita que muda o conteúdo público incrementa `pages.revision` na mesma transação e, depois de persistir, aponta a chave `lynko:page:ref:<username>` para a revisão nova. Uma reconstrução baseada em revisão antiga é recusada.
- **Uma consulta por vez:** singleflight na instância e lock `SET NX PX` no Redis (`PUBLIC_PAGE_LOCK_TTL_MS`); a espera tem timeout (`PUBLIC_PAGE_WAIT_TIMEOUT_MS`). O lock só é liberado pelo dono.
- **Redis fora ou espera estourada:** a leitura vai ao Postgres, uma por página em cada instância e no máximo 20 simultâneas; acima disso, 503. Nunca serve conteúdo antigo.
- **Invalidação perdida:** se o Redis falhar durante uma escrita, a escrita continua e o erro é logado (`cache.invalidation_failed`). A versão antiga vive no máximo `PUBLIC_PAGE_REF_TTL` (30 min).
- **Métricas:** `GET /health/metrics` com o header `x-metrics-token`. Responde 404 sem `METRICS_TOKEN`. Os contadores são por instância.

**Next.js (RF-RD-09):** a rota `/[locale]/[username]` é renderizada a cada request (`ƒ Dynamic` no `next build`) e busca os dados por axios, fora do Data Cache. Por isso o Next não guarda a página e reflete o Redis na hora. Não adicione `generateStaticParams`, `revalidate` nem `use cache` nessa rota sem revalidar junto, e confira a tabela de rotas do `next build`.

### Analytics e worker

`POST /analytics/views`, `GET /r/:linkId` e `GET /r/social/:pageId/:platform` validam no banco e enfileiram no `redis-queue` (BullMQ). O redirect e o 202 não dependem da fila. Bots e requisições sem User-Agent não contam. Nenhum IP é guardado.

O worker é um processo separado da API:

```bash
bun run --filter '@lynko/api' worker
```

- Exige `QUEUE_REDIS_URL`; sem ela, sai com erro.
- Cada evento tem `jobId = eventId` e até 5 tentativas com backoff exponencial. Payload inválido não é refeito.
- A contagem e a deduplicação (`analytics_processed_events`) acontecem num único statement SQL, então um evento repetido nunca conta duas vezes. A data é o dia do evento em UTC.
- Um job diário (03:00) apaga de `analytics_processed_events` o que tem mais de 30 dias.
- As tabelas `*_daily` não têm FK: apagar uma página ou link deixa agregações órfãs, só contadores por UUID, sem dado pessoal e sem rota que as exponha.
- O backlog da fila (`waiting`, `active`, `delayed`, `failed`) aparece em `GET /health/metrics`, em `queue`.

## Scripts

| Comando                    | Faz                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `bun run dev`              | servidor com reload                                                                                   |
| `bun run typecheck`        | TypeScript                                                                                            |
| `bun run test`             | testes unitários (`tests/unit`)                                                                       |
| `bun run test:integration` | testes contra Redis real (`tests/integration`; precisam de `REDIS_TEST_URL` / `QUEUE_REDIS_TEST_URL`) |
| `bun run worker`           | worker da fila de analytics                                                                           |
| `bun run db:generate`      | gera migration a partir de `src/db/schema.ts`                                                         |
| `bun run db:migrate`       | aplica as migrations de `drizzle/`                                                                    |
| `bun run db:studio`        | Drizzle Studio                                                                                        |

## Rotas

Caminhos relativos ao prefixo (`POST /` em `/links` é `POST /links`).

| Prefixo   | Rotas                                                                                                      | Auth                                 |
| --------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `/health` | `GET /`, `GET /metrics` (404 sem `METRICS_TOKEN`)                                                          | `/metrics`: header `x-metrics-token` |
| `/auth`   | `POST /register`, `/login`, `/refresh`, `/logout`                                                          | não (com rate limit)                 |
| `/users`  | `GET /me`                                                                                                  | sim                                  |
| `/pages`  | `POST /`, `GET` `PATCH` `DELETE /me`, `GET /me/preview`, `GET /:username` (pública, só páginas publicadas) | sim, exceto `/:username`             |
| `/links`  | `GET /`, `POST /`, `PUT /reorder`, `PATCH /:id`, `DELETE /:id`                                             | sim                                  |
| `/media`  | `POST /presign`, `POST /:id/confirm`, `GET /:id`, `DELETE /:id`                                            | sim (com rate limit)                 |

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
