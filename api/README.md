# Lynko API

API REST do Lynko: contas (e-mail e senha ou Google), verificação de e-mail, recuperação e troca de senha, login em duas etapas, dispositivos conectados, exclusão de conta, páginas, links agendados, redes sociais, aparência, upload de imagens, analytics e o plano Pro (assinaturas na AbacatePay).

Fastify 5, Zod (`fastify-type-provider-zod`), Drizzle ORM sobre Neon (`neon-http`), JWT com refresh token, Swagger com Scalar, AWS SDK v3 para S3, Nodemailer (SMTP), jose (validação do `id_token` do Google e do desafio do login em duas etapas) e otpauth (códigos TOTP). A AbacatePay é chamada com `fetch`, sem SDK.

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

| Variável                                     | Obrigatória          | Uso                                                                                                                                                                                    |
| -------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                               | sim                  | conexão Postgres (Neon)                                                                                                                                                                |
| `JWT_SECRET`                                 | sim                  | assina o access token (mínimo 32 caracteres)                                                                                                                                           |
| `PORT`                                       | não (8080)           | porta HTTP                                                                                                                                                                             |
| `JWT_EXPIRES_IN`                             | não (15m)            | validade do access token                                                                                                                                                               |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS`              | não (30)             | validade da sessão                                                                                                                                                                     |
| `CORS_ORIGIN`                                | não (localhost:3000) | origens permitidas, separadas por vírgula                                                                                                                                              |
| `AWS_REGION`                                 | para upload          | região do bucket                                                                                                                                                                       |
| `S3_BUCKET`                                  | para upload          | bucket privado das imagens                                                                                                                                                             |
| `CDN_URL`                                    | para upload          | domínio do CloudFront, sem barra no final                                                                                                                                              |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | fora da AWS          | credenciais do usuário IAM (cadeia padrão do SDK)                                                                                                                                      |
| `MEDIA_AVATAR_MAX_BYTES`                     | não (5 MB)           | tamanho máximo do avatar                                                                                                                                                               |
| `MEDIA_BACKGROUND_MAX_BYTES`                 | não (10 MB)          | tamanho máximo da imagem de fundo                                                                                                                                                      |
| `MEDIA_MAX_PENDING_PER_PAGE`                 | não (5)              | uploads pendentes por página                                                                                                                                                           |
| `REDIS_URL`                                  | não                  | Redis de cache das páginas públicas                                                                                                                                                    |
| `QUEUE_REDIS_URL`                            | para analytics       | Redis da fila (BullMQ); obrigatório no worker                                                                                                                                          |
| `PUBLIC_PAGE_CACHE_TTL`                      | não (14400 s)        | TTL do conteúdo cacheado (4 h)                                                                                                                                                         |
| `PUBLIC_PAGE_REF_TTL`                        | não (1800 s)         | TTL da chave username → revisão (30 min)                                                                                                                                               |
| `PUBLIC_PAGE_REFRESH_THRESHOLD`              | não (30 s)           | janela de refresh antes de expirar                                                                                                                                                     |
| `PUBLIC_PAGE_LOCK_TTL_MS`                    | não (10000)          | expiração do lock de reconstrução                                                                                                                                                      |
| `PUBLIC_PAGE_WAIT_TIMEOUT_MS`                | não (5000)           | espera máxima de quem aguarda a reconstrução                                                                                                                                           |
| `METRICS_TOKEN`                              | não                  | protege `GET /health/metrics` (mín. 32 caracteres)                                                                                                                                     |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`        | para e-mail          | servidor SMTP e credenciais (no Gmail, senha de app)                                                                                                                                   |
| `SMTP_PORT`                                  | não (465)            | porta SMTP; 465 usa TLS direto, as outras usam STARTTLS                                                                                                                                |
| `MAIL_FROM`                                  | para e-mail          | remetente, ex.: `Lynko <no-reply@seudominio.com>`                                                                                                                                      |
| `WEB_URL`                                    | para e-mail          | URL pública do web, sem barra no final; base dos links dos e-mails                                                                                                                     |
| `GOOGLE_CLIENT_ID`                           | para Google          | OAuth Client ID; deve ser o mesmo `AUTH_GOOGLE_ID` do web                                                                                                                              |
| `TOTP_ENCRYPTION_KEY`                        | sim                  | 32 bytes em base64 (`openssl rand -base64 32`); cifra o segredo do login em duas etapas e assina os códigos de recuperação. Trocar ou perder a chave desativa o 2FA de todas as contas |
| `ABACATEPAY_API_KEY`                         | para o Pro           | chave da API v2 da AbacatePay (modo de teste em desenvolvimento)                                                                                                                       |
| `ABACATEPAY_WEBHOOK_SECRET`                  | para o Pro           | segredo do webhook (mín. 32 caracteres), o mesmo do painel                                                                                                                             |
| `ABACATEPAY_WEBHOOK_PUBLIC_KEY`              | para o Pro           | chave pública de HMAC da [documentação de webhooks](https://docs.abacatepay.com/pages/notificacoes/seguranca), igual para todas as contas                                              |
| `ABACATEPAY_PRO_MONTHLY_PRODUCT_ID`          | para o Pro           | id do produto Pro Mensal                                                                                                                                                               |
| `ABACATEPAY_PRO_ANNUAL_PRODUCT_ID`           | para o Pro           | id do produto Pro Anual                                                                                                                                                                |
| `ABACATEPAY_METHODS`                         | não (`CARD`)         | meios no checkout: `CARD`, `PIX` ou `CARD,PIX`                                                                                                                                         |

Sem `AWS_REGION`, `S3_BUCKET` ou `CDN_URL`, a API funciona normalmente e só as rotas `/media` respondem 503.

Sem `ABACATEPAY_API_KEY` ou os ids de produto, as rotas `/billing` respondem 503; sem o segredo ou a chave pública, o webhook também. Nas variáveis `ABACATEPAY_*`, um valor vazio (`""`) conta como não configurado.

Sem `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` ou `WEB_URL`, nenhum e-mail é enviado: a falha é registrada no log (`Failed to send email`, com o destino e a mensagem, nunca o link) e a requisição que o disparou continua normal. Sem `GOOGLE_CLIENT_ID`, `POST /auth/google` responde 503. As variáveis só são lidas ao iniciar a API.

Cadastre no Google Cloud, no mesmo Client ID, a origem `{AUTH_URL}` do web (sem caminho) e o URI de redirecionamento `{AUTH_URL}/api/auth/callback/google`.

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

Os serviços do profile `db-test` (Postgres descartável para os testes de lock) não sobem com esse comando.

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

`POST /analytics/views`, `GET /r/:linkId` e `GET /r/social/:pageId/:platform` validam no banco e enfileiram no `redis-queue` (BullMQ). A visita com `source: 'qr'` (página aberta pelo QR code) também soma em `page_views_daily.qr_views`. O redirect e o 202 não dependem da fila. Bots e requisições sem User-Agent não contam. Nenhum IP é guardado.

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

| Comando                    | Faz                                                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `bun run dev`              | servidor com reload                                                                                                                       |
| `bun run typecheck`        | TypeScript                                                                                                                                |
| `bun run test`             | testes unitários (`tests/unit`)                                                                                                           |
| `bun run test:integration` | testes contra Redis e Postgres reais (`tests/integration`; precisam de `REDIS_TEST_URL` / `QUEUE_REDIS_TEST_URL` / `NEON_PROXY_TEST_URL`) |
| `bun run worker`           | worker da fila de analytics                                                                                                               |
| `bun run db:generate`      | gera migration a partir de `src/db/schema.ts`                                                                                             |
| `bun run db:migrate`       | aplica as migrations de `drizzle/`                                                                                                        |
| `bun run db:reset`         | apaga os schemas `public` e `drizzle` e reaplica as migrations (só em dev; recusa `NODE_ENV=production`)                                  |
| `bun run db:studio`        | Drizzle Studio                                                                                                                            |

### Testes de lock com Postgres descartável

`tests/integration/account-locks.spec.ts` exercita com duas conexões os bloqueios de linha da exclusão de conta, do vínculo com Google e da troca de senha. Ele recria o schema a partir de `src/db/schema.ts` (apaga o schema `public`) e pula sozinho sem `NEON_PROXY_TEST_URL`.

Antes de escrever qualquer coisa, o teste recusa o destino se o proxy não estiver em `localhost` ou se o Postgres por trás não for o `lynko_test` com `lynko.disposable=yes`, marca que só o serviço `postgres-test` do Compose define. Qualquer outro banco, inclusive o Neon, é recusado.

Na raiz do repositório, suba os serviços:

```bash
docker compose --profile db-test up -d postgres-test neon-proxy-test
```

Em `api/`, rode o teste (bash ou PowerShell):

```bash
NEON_PROXY_TEST_URL=http://localhost:4444 bun test tests/integration/account-locks.spec.ts
```

```powershell
$env:NEON_PROXY_TEST_URL='http://localhost:4444'; bun test tests/integration/account-locks.spec.ts
```

Na raiz, remova só os dois serviços de teste, sem parar o Redis de desenvolvimento:

```bash
docker compose --profile db-test rm -sf postgres-test neon-proxy-test
```

## Rotas

Caminhos relativos ao prefixo (`POST /` em `/links` é `POST /links`).

| Prefixo    | Rotas                                                                                                                                                          | Auth                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `/health`  | `GET /`, `GET /metrics` (404 sem `METRICS_TOKEN`)                                                                                                              | `/metrics`: header `x-metrics-token` |
| `/auth`    | `POST /register`, `/login`, `/login/two-factor`, `/google`, `/refresh`, `/logout`, `/verify-email`, `/forgot-password`, `/reset-password`, `/confirm-deletion` | não (com rate limit)                 |
| `/auth`    | `POST /verify-email/resend`                                                                                                                                    | sim (com rate limit)                 |
| `/users`   | `GET /me`, `PATCH /me/password`, `POST /me/deletion`                                                                                                           | sim (as duas últimas com rate limit) |
| `/users`   | `GET /me/sessions`, `DELETE /me/sessions/:id`, `DELETE /me/sessions`                                                                                           | sim (com rate limit)                 |
| `/users`   | `GET /me/two-factor`, `POST /me/two-factor/setup`, `/enable`, `/disable`, `/recovery-codes`                                                                    | sim (com rate limit)                 |
| `/pages`   | `POST /`, `GET` `PATCH` `DELETE /me`, `GET /me/preview`, `GET /:username` (pública, só páginas publicadas)                                                     | sim, exceto `/:username`             |
| `/links`   | `GET /`, `POST /`, `PUT /reorder`, `PATCH /:id`, `DELETE /:id`                                                                                                 | sim                                  |
| `/media`   | `POST /presign`, `POST /:id/confirm`, `GET /:id`, `DELETE /:id`                                                                                                | sim (com rate limit)                 |
| `/billing` | `GET /plans` (pública), `GET /subscription`, `POST /checkout`, `POST /subscription/cancel`                                                                     | sim, exceto `/plans`                 |
| `/billing` | `POST /webhooks/abacatepay`                                                                                                                                    | segredo + assinatura HMAC            |

Detalhes de cada body e resposta em `/docs`.

### Contas

`GET /users/me` devolve `hasPassword`, `hasGoogle`, `emailVerified`, `twoFactorEnabled` e `plan` (`free` ou `pro`). Nenhum hash, token, segredo TOTP ou `googleId` sai em resposta.

- **Links de e-mail:** verificação, redefinição de senha e confirmação de exclusão usam tokens de uso único na tabela `auth_tokens`. Só o hash do segredo vai ao banco, o token é consumido com um único `DELETE ... RETURNING` e há no máximo um token por usuário e tipo (índice único). Validade: 24 h para verificação e 30 min para os outros dois. Pedir de novo invalida o link anterior, e há um intervalo de 60 s entre pedidos (429 em `/verify-email/resend`; silencioso em `/forgot-password`).
- **E-mail:** enviado direto por SMTP, sem fila, e sem `await` na requisição, então a resposta não depende do envio nem revela se o e-mail existe. `POST /auth/forgot-password` responde 204 para qualquer endereço e só envia para conta com senha. Falha de envio nunca quebra o cadastro.
- **Senha:** a redefinição (`/reset-password`) e a troca (`PATCH /users/me/password`) gravam o hash novo e revogam sessões. A redefinição revoga todas e confirma o e-mail; a troca mantém só a sessão atual. A troca exige a senha atual e responde 409 para conta sem senha.
- **Google:** `POST /auth/google` valida o `id_token` por assinatura (chaves do Google), emissor, audiência, expiração e `email_verified`. Procura por `googleId`, depois por e-mail (vincula) e, se não achar, cria a conta já verificada e sem senha. Ao vincular uma conta cujo e-mail ainda não estava verificado, a senha e as sessões antigas são apagadas, para que quem cadastrou o e-mail de outra pessoa com uma senha própria não mantenha acesso. Conta só Google recebe o mesmo 401 genérico no `/auth/login`.
- **Exclusão:** `POST /users/me/deletion` apaga na hora, com a senha atual (204), ou, para conta sem senha, envia um link (202) que `POST /auth/confirm-deletion` consome. Apaga usuário, sessões, tokens, página, links, mídia (no banco e no S3), analytics e o cache público, e libera o `username`. Os objetos do S3 são removidos depois e uma falha só é logada.
- **Concorrência:** login, redefinição, troca de senha, vínculo com Google e exclusão se coordenam com bloqueios de linha do Postgres (`FOR UPDATE` e `FOR NO KEY UPDATE`) dentro de um único statement ou `db.batch`, porque o driver `neon-http` não tem transação interativa. Os testes de lock exercitam isso num Postgres real (veja abaixo).

### Login em duas etapas e sessões

- **Ativar:** só para conta com senha. `setup` confere a senha e devolve a chave e o link `otpauth://` para o app autenticador; nada muda até `enable` receber um código válido. A ativação devolve 10 códigos de recuperação (uma única vez), encerra as outras sessões e manda e-mail.
- **Guardado:** o segredo TOTP fica cifrado (AES-256-GCM com `TOTP_ENCRYPTION_KEY`), e os códigos de recuperação ficam em HMAC na tabela `recovery_codes`, cada um de uso único. Um código do app não vale duas vezes (`users.totp_last_step`).
- **Login:** com 2FA ativo, `POST /auth/login` não abre sessão e devolve `{ twoFactorRequired, challengeToken }`. O desafio é um JWT de 5 min com audience própria e uma marca da senha atual, e não serve como Bearer. `POST /auth/login/two-factor` recebe o desafio com o código do app ou um de recuperação. Depois de 5 códigos errados, a etapa fica bloqueada por 15 min (429). Redefinir a senha não desativa o 2FA.
- **Desativar e novos códigos:** pedem a senha e um código.
- **Sessões:** `sessions.user_agent` guarda o navegador enviado pela web no header `x-client-user-agent` (só informativo). `GET /users/me/sessions` lista as sessões ativas com navegador, sistema e última atividade, com a atual primeiro. Encerrar uma sessão corta o acesso na hora, porque o guard confere a sessão em toda requisição.

### Links agendados

`startsAt` e `endsAt` em `POST /links` e `PATCH /links/:id` definem quando o link entra e sai do ar. A página pública só mostra os links no ar naquele momento (a regra fica em `links.schedule.ts`), e o cache guarda as datas para decidir na leitura.

### Plano Pro (AbacatePay)

O Lynko decide quem é Pro pela tabela `subscriptions` (`status` e `current_period_end`), sem consultar a AbacatePay a cada requisição e sem job agendado. Uma assinatura ativa tem 3 dias de tolerância depois do fim do período, para as retentativas de cobrança; uma cancelada vale até o fim do período pago. A regra fica em `billing.access.ts`.

- **Assinar:** `POST /billing/checkout` cria ou reaproveita o cliente na AbacatePay, guarda a assinatura como `pending` e devolve a URL do checkout. O Pro só é liberado pelo webhook.
- **Webhook:** `POST /billing/webhooks/abacatepay` confere o segredo (header `X-Webhook-Secret` ou `?webhookSecret=`) e a assinatura HMAC-SHA256 do corpo cru (`X-Webhook-Signature`) antes de ler o evento. Cada evento é aplicado uma vez só (tabela `billing_events`, num único statement). Trata `subscription.completed`, `renewed`, `cancelled` e `payment_failed`, e ignora os outros com 200. Uma segunda assinatura paga pela mesma conta é cancelada na AbacatePay.
- **Cancelar:** `POST /billing/subscription/cancel` cancela na AbacatePay (o cancelamento lá é imediato) e mantém o Pro até `current_period_end`. Excluir a conta cancela a assinatura antes; se a AbacatePay falhar, a conta não é excluída (503).
- **O que o Pro libera:** o período de 90 dias do Analytics (403 `Pro plan required` no grátis) e `showBranding: false` na página. A página pública decide a marca na leitura, então ela volta assim que o Pro acaba, mesmo com a página no cache.

**Configurar em desenvolvimento:**

1. No modo de teste da AbacatePay, crie dois produtos de assinatura, Pro Mensal e Pro Anual (cada ciclo é um produto), e uma chave de API v2 com `PRODUCT:READ`, `CUSTOMER:CREATE` e `SUBSCRIPTION:CREATE`, `READ` e `DELETE`.
2. Na raiz, abra um túnel até a API e copie o endereço `https://...trycloudflare.com` que aparecer:

   ```bash
   bun run webhook
   ```

3. No painel, crie um webhook v2 com a URL `<endereço do túnel>/billing/webhooks/abacatepay`, um segredo de 32+ caracteres (`openssl rand -hex 32`) e os eventos `subscription.*`.
4. Preencha as variáveis `ABACATEPAY_*` no `api/.env` e reinicie a API. `GET /billing/plans` deve devolver os dois preços, e uma chamada ao webhook sem assinatura deve receber 401.
5. Assine pelo dashboard com o cartão de teste `4242 4242 4242 4242`.

O endereço do túnel muda toda vez que ele reinicia; atualize a URL do webhook no painel. Em produção, use uma chave e um webhook do modo de produção, apontando para a URL real da API, e peça ao suporte da AbacatePay a liberação de assinaturas.

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
tests/integration/      testes contra Redis e Postgres reais (pulam sem as variáveis de teste)
```

Em `modules/`, `auth` tem ainda `auth.tokens.ts` (links de uso único), `auth.google.ts` (validação do `id_token`), `auth.user-agent.ts` e `sessions.service.ts` (dispositivos conectados); `two-factor` tem o TOTP, a cifra do segredo e o desafio do login; `billing` tem o cliente da AbacatePay (`abacatepay.client.ts`), a regra do Pro (`billing.access.ts`) e o webhook (`billing.webhook.ts`); e `mail` tem o envio SMTP e os templates em pt-BR (`mail.service.ts`, `mail.templates.ts`).

- `routes` valida com os DTOs e chama o service; `service` tem a regra e lança os erros de `shared/errors.ts`; `repository` só faz query.
- Toda rota protegida usa o guard `onRequest` e pega o usuário de `request.user.sub`; recurso de outra pessoa responde 404.
- Os testes trocam os repositories por versões em memória com `spyOn` e nunca tocam o banco nem a AWS.

Regras completas para quem contribui no [`AGENTS.md`](../AGENTS.md).
