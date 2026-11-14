<p align="center">
  <img src="apps/web/src/app/icon.svg" width="140" alt="Mascote do Lynko" />
</p>

# Lynko

Página de links personalizável. Cada pessoa cria uma página pública em `/<username>` com seus links, ícones de redes sociais, foto e fundo, e edita tudo num dashboard com prévia ao vivo.

Contas com e-mail e senha ou com Google, confirmação de e-mail, recuperação e troca de senha e exclusão de conta com todos os dados. Login em duas etapas com app autenticador, lista de dispositivos conectados e encerramento de sessões.

Links com data de início e fim, Analytics de visitas e cliques (incluindo as que chegam pelo QR code), QR code da página para baixar e imagem de prévia ao compartilhar o link.

Plano Pro pago por assinatura na [AbacatePay](https://www.abacatepay.com), mensal ou anual: libera o Analytics de 90 dias e a página sem a marca Lynko.

Monorepo com [Bun](https://bun.com) workspaces:

| Pasta                             | O que é                                                                                         |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| [`api/`](api/README.md)           | API REST em Fastify, Drizzle e Postgres (Neon), upload no S3, e-mail, assinaturas na AbacatePay |
| [`apps/web/`](apps/web/README.md) | Site, dashboard e página pública em Next.js 16                                                  |

## Requisitos

- Bun 1.4.2 ou mais novo
- Um banco Postgres (Neon ou local)
- Opcional, para upload de foto e fundo: bucket S3 e distribuição CloudFront
- Opcional, para e-mails de verificação, redefinição e exclusão de conta: um servidor SMTP (por exemplo, Gmail com senha de app)
- Opcional, para entrar com Google: um OAuth Client ID do Google Cloud
- Opcional, para o plano Pro: uma conta na AbacatePay e, em desenvolvimento, o [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) para receber os webhooks

Sem SMTP a API funciona, mas nenhum e-mail é enviado. Sem o Client ID do Google, o botão "Continuar com Google" não conclui o login. Sem as variáveis da AbacatePay, as rotas de cobrança respondem 503 e o resto funciona. A `TOTP_ENCRYPTION_KEY` (login em duas etapas) é obrigatória: a API não sobe sem ela. As variáveis estão em [`api/.env.example`](api/.env.example) e [`apps/web/.env.example`](apps/web/.env.example).

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

   Depois de mudar `api/src/db/schema.ts`, gere uma migration nova com `bun run db:generate` antes de aplicar. Uma migration já aplicada não é reescrita: se o schema mudar (por exemplo, um índice que passa a ser único), gere outra.

4. Suba a API (porta 8080) e o web (porta 3000):

   ```bash
   bun run dev
   ```

Abra http://localhost:3000. A documentação da API fica em http://localhost:8080/docs.

## Scripts da raiz

| Comando               | Faz                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `bun run dev`         | API e web juntos                                                                                 |
| `bun run dev:api`     | só a API                                                                                         |
| `bun run dev:web`     | só o web                                                                                         |
| `bun run webhook`     | túnel público (`cloudflared`) até a API em `localhost:8080`, para receber webhooks da AbacatePay |
| `bun run build`       | build de todos os pacotes                                                                        |
| `bun run typecheck`   | TypeScript em todos os pacotes                                                                   |
| `bun run test`        | testes unitários de todos os pacotes                                                             |
| `bun run lint`        | Biome (lint e formatação) no repositório                                                         |
| `bun run lint:fix`    | Biome corrigindo o que for automático                                                            |
| `bun run db:generate` | gera uma migration a partir de `api/src/db/schema.ts`                                            |
| `bun run db:migrate`  | aplica as migrations pendentes                                                                   |
| `bun run db:studio`   | abre o Drizzle Studio                                                                            |
| `bun run db:reset`    | apaga os schemas `public` e `drizzle` e reaplica as migrations (só em dev; apaga todos os dados) |

Os testes de interação do web rodam à parte: `cd apps/web && bun run test:interaction`. Os testes de lock da API usam um Postgres descartável e também rodam à parte (veja o [README da API](api/README.md#testes-de-lock-com-postgres-descartável)).

## Convenções

- Estilo: Biome na raiz (2 espaços, aspas simples, sem ponto e vírgula), sem comentários no código e com uma linha em branco entre statements.
- Commits em inglês, no formato [Conventional Commits](https://www.conventionalcommits.org).
- Textos para o usuário final em pt-BR; mensagens de erro da API e resumos do Swagger em inglês.
- Regras completas para quem contribui (pessoas e agentes) em [`AGENTS.md`](AGENTS.md).

## CI

O workflow em [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em cada push na `main` e em pull requests: typecheck e testes unitários da API, e typecheck, testes unitários e de interação do web.
