# Lynko

Regras do projeto para qualquer agente (Claude, Codex, Copilot). Este arquivo é a fonte única: `CLAUDE.md` importa ele e `.github/copilot-instructions.md` aponta para ele.

Monorepo Bun: `api/` (Fastify, Drizzle, Neon) e `apps/web/` (Next.js 16, padrão do projeto booktattoo).

## Sempre buscar antes de criar

Nunca escreva do zero algo que você não procurou antes. Vale para tudo, de validar uma data a implementar um gráfico.

A ordem é sempre: **o que já existe no projeto → alternativas prontas → só por último criar.**

Se houver componente shadcn para o caso, use. Se já estiver em `components/ui`, importe. Se não estiver, instale com `bunx shadcn add <componente>` e use. Exemplo: seletor de data é o `date-picker` do shadcn; pergunta e resposta é o `accordion`; checkbox é o `checkbox`. Instalar componente shadcn não precisa de aprovação.

1. **No repositório:** procure helper, componente, schema ou padrão parecido em `api/src/shared`, `apps/web/src/lib`, `apps/web/src/components` e no módulo ou rota mais próximos.
2. **Nas dependências:** veja o `package.json` e use o que já está instalado. Exemplos: validação com Zod, gráficos com `recharts`, componentes com shadcn.
3. **Na documentação da versão instalada:** consulte a doc oficial. Para Next.js, leia `node_modules/next/dist/docs/` em `apps/web`, porque esta versão difere do que você conhece. Drizzle está em `1.0.0-rc`: confira os tipos instalados em vez de confiar na memória.
4. **Em soluções que já existem:** você tem permissão para pesquisar na internet antes de implementar, sem pedir: npm, GitHub, registry do shadcn, exemplos oficiais e guias. Confira se a solução é mantida e compatível com as versões do projeto.
5. **Só então crie.** Se nada servir, escreva o mínimo necessário e diga o que procurou. Nova dependência precisa de aprovação do usuário.

Na resposta, informe em uma linha o que encontrou e reaproveitou.

## Regras gerais

- **Mudanças não triviais:** apresente o que vai mudar e as opções, e espere a aprovação antes de implementar.
- **Banco:** nunca rode `db:generate`, `db:migrate` ou `db:studio`, nem escreva no Neon. O usuário roda. Teste com repository em memória.
- **Commits:** só quando pedido, em inglês, no formato conventional commits, sem `Co-Authored-By` nem qualquer atribuição a IA.
- **Idioma:** textos para o usuário final em pt-BR. Summaries do Swagger, mensagens de erro da API e commits em inglês.
- **Estilo:** Biome na raiz (2 espaços, aspas simples, sem ponto e vírgula). Rode `bun run lint`.
- **Verificação:** rode o typecheck e teste o comportamento antes de dizer que terminou.
- **Segredos:** nunca leia nem exiba valores de `.env`. Novas variáveis entram no `.env.example`.

## Frontend (`apps/web`)

### Estrutura

Cada rota guarda o que é dela, em pastas com `_`:

```
src/app/(panel)/dashboard/links/
├── _actions/        create-link.ts       escrita, com 'use server'
├── _data-access/    get-all-links.ts     leitura, com 'use server'
├── _components/     link-form.tsx, schemas.ts
└── page.tsx
```

- Código usado por várias rotas sobe para o grupo (`(panel)/_actions`) ou para `src/components` e `src/lib`.
- Um arquivo por função, nomeado pela ação em kebab-case.
- Componentes shadcn ficam em `src/components/ui`. Adicione com `bunx shadcn add`.

### Dados: sempre React Query

- No client, toda leitura usa `useQuery` e toda escrita usa `useMutation`. Nunca use `useEffect` com `fetch` ou axios.
- `queryFn` chama uma função de `_data-access`; `mutationFn` chama uma de `_actions`.
- Componentes nunca chamam `api` diretamente.
- Server Components podem chamar `_data-access` diretamente no carregamento inicial.
- Depois de uma mutation, use `invalidateQueries` para o que o usuário está vendo.

### `_data-access`: leitura

- Primeira linha `'use server'`. Exporte só funções `async`; tipos também são permitidos.
- Exporte as interfaces do retorno e declare o tipo de saída da função.
- Em caso de erro, lance (`throw`). Quem trata é o `isError` do `useQuery` ou o `error.tsx`.

```ts
'use server'

import { api } from '@/lib/api'

export interface Link {
  id: string
  title: string
  url: string
}

export async function getAllLinks(): Promise<Link[]> {
  const { data } = await api.get<Link[]>('/links')

  return data
}
```

### `_actions`: escrita

- Primeira linha `'use server'`.
- Nunca lance erro: retorne `{ data?, error? }`, com a mensagem de `getApiErrorMessage`.
- Chame `revalidatePath` quando a rota depender de dados de servidor.

```ts
'use server'

import { getApiErrorMessage } from '@/lib/api-error'
import { api } from '@/lib/api'
import type { Link } from '../_data-access/get-all-links'

export async function createLink(input: CreateLinkInput): Promise<{ data?: Link; error?: string }> {
  try {
    const { data } = await api.post<Link>('/links', input)

    return { data }
  } catch (error) {
    return { error: getApiErrorMessage(error, 'Não foi possível criar o link') }
  }
}
```

### Schemas de formulário

Ficam separados do componente, em `_components/schemas.ts` (ou `<feature>-schema.ts`), que exporta o schema Zod, o tipo e um **hook** que entrega o formulário pronto. Esse arquivo não leva `'use server'`.

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

export const linkSchema = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório'),
})

export type LinkSchemaData = z.infer<typeof linkSchema>

export function useLinkSchema() {
  return useForm<LinkSchemaData>({
    resolver: zodResolver(linkSchema),
    defaultValues: { title: '' },
  })
}
```

O componente só usa o hook:

```tsx
const form = useLinkSchema()

const { mutateAsync, isPending } = useMutation({ mutationFn: createLink })

async function onSubmit(values: LinkSchemaData) {
  const response = await mutateAsync(values)

  if (response.error) {
    toast.error(response.error)
    return
  }

  toast.success('Link criado com sucesso')
}
```

### Componentes

- `page.tsx` é Server Component e só compõe: metadata, layout e componentes. Lógica de formulário e estado ficam em `_components`.
- Divida em componentes pequenos, cada um com uma responsabilidade. Uma seção, um arquivo. Passou de cerca de 100 linhas, procure dividir.
- `'use client'` só no menor componente que precisa de estado ou evento, nunca na página inteira.
- Elementos com componente em `components/ui` não são escritos à mão: use `Button`, `Input`, `Checkbox`, `Accordion`. Link com cara de botão usa `buttonVariants`, porque o `Button` é do Base UI e não tem `asChild`.
- Todo campo de formulário usa `Field`, `FieldLabel` e `FieldError` com `Controller`, nunca `label` e mensagem de erro soltos.
- Estilize com Tailwind e os tokens do tema. Não crie CSS novo.

### UI

- Feedback ao usuário com `toast` do `sonner`.
- Botão de envio desabilitado com `isPending` e `Loader2` girando.
- Trate os estados de carregamento, vazio e erro.
- Tema escuro, tokens do `globals.css` (`bg-background`, `text-muted-foreground`). Sem cores fixas.
- Animações Lottie em `public/animation`, com `LottieLight`.

## Backend (`api`)

### Módulos

Cada domínio fica em `src/modules/<dominio>/`:

| Arquivo                   | Responsabilidade                            | Não faz                                    |
| ------------------------- | ------------------------------------------- | ------------------------------------------ |
| `<dominio>.routes.ts`     | rota, schema, chama o service               | regra de negócio, acesso ao banco          |
| `<dominio>.service.ts`    | regras de negócio                           | conhecer `request`/`reply`, escrever query |
| `<dominio>.repository.ts` | consultas Drizzle                           | regra, hash, HTTP                          |
| `<dominio>.dto.ts`        | schemas Zod de entrada e saída e seus tipos | lógica                                     |
- Dependência em uma direção: `routes` → `service` → `repository`.
- Registre o módulo no `app.ts`, depois do swagger e do auth: `app.register(xRoutes, { prefix: '/x' })`.
- Tabelas ficam em `src/db/schema.ts`, nomeadas `xSchema`, com `...timestamps`.
- O código compartilhado está em `src/shared` (`errors`, `password`, `token`, `db-errors`) e os plugins em `src/plugins`.

### Rotas

- Tipe com `FastifyPluginAsyncZod` e valide `body`, `params` e `response` com os DTOs.
- Caminhos são relativos ao prefixo: use `''` na raiz do módulo, não `'/'`.
- Toda rota tem `tags` e `summary`.
- Rota protegida: guard (`onRequest: [app.authenticate]` ou `addHook` no módulo) **e** `security: [{ bearerAuth: [] }]`. O `security` só documenta; quem protege é o guard.
- Limites específicos com `config: { rateLimit }`.

### Segurança

- O id do usuário vem de `request.user.sub`, nunca do body nem da URL. Prefira rotas `/me`.
- Recurso com id próprio: filtre sempre pelo dono no `where`. Recurso alheio responde 404.
- Nunca retorne `passwordHash`: use `publicUserColumns` e response schemas.
- URLs vindas do usuário aceitam só `http` e `https`.
- Variáveis de ambiente passam pelo `src/config/env.ts`. Não use `process.env` no restante do código.

### Erros e banco

- O service lança os erros de `src/shared/errors.ts` (`ConflictError`, `NotFoundError`...), e o error handler converte em HTTP.
- Unicidade: faça a checagem e trate a corrida com `getUniqueViolation`.
- O driver é `neon-http`: não há transação interativa. Prefira um único statement.
- Colunas buscadas com frequência (FKs, filtros) ganham índice.
- Depois de mudar o schema, avise o usuário para gerar e aplicar a migration.
