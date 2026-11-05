# Lynko

Regras do projeto para qualquer agente (Claude, Codex, Copilot). Este arquivo é a porta de entrada: `CLAUDE.md` importa ele e `.github/copilot-instructions.md` aponta para ele. O conteúdo detalhado fica em `.agents/`, compartilhado por todos.

Monorepo Bun: `api/` (Fastify, Drizzle, Neon) e `apps/web/` (Next.js 16, padrão do projeto booktattoo).

## Estrutura compartilhada (`.agents/`)

```
.agents/
├── rules/       regras do projeto (fonte única)
├── skills/      skills do fluxo de tarefas (fonte única)
└── templates/   templates de prd, techspec, tasks, N_task e N_task_review
```

O Claude enxerga as skills por `.claude/skills/*`, que só apontam para `.agents/skills/*`. O Codex lê `.agents/skills` direto. Mudou regra, skill ou template: edite só em `.agents/`.

## Regras (leia antes de agir)

Leia sempre `geral.md` e `busca-antes-de-criar.md`. Leia a da área que for tocar.

| Arquivo                                 | Quando                                                  |
| --------------------------------------- | ------------------------------------------------------- |
| `.agents/rules/geral.md`                | sempre: aprovação, banco, commits, idioma, estilo       |
| `.agents/rules/busca-antes-de-criar.md` | sempre: buscar antes de criar                           |
| `.agents/rules/frontend.md`             | qualquer mudança em `apps/web`                          |
| `.agents/rules/design.md`               | UI em `apps/web`: skills de design obrigatórias         |
| `.agents/rules/seguranca.md`            | todo código novo e toda revisão: skill `security-audit` |
| `.agents/rules/backend.md`              | qualquer mudança em `api`                               |
| `.agents/rules/fluxo-tarefas.md`        | trabalhar com PRD, techspec, tarefas e review           |

## Resumo do essencial

- **Frontend:** qualquer UI em `apps/web` usa as skills de design (`impeccable`, `design-taste-frontend`, `hallmark`, `shadcn`). Ver `.agents/rules/design.md`.
- **Segurança:** todo código novo e toda revisão passam pela skill `security-audit` em modo orientação. Auditoria completa só se o usuário pedir. Ver `.agents/rules/seguranca.md`.
- **Busque antes de criar:** projeto → dependências → doc da versão instalada → soluções existentes → só então criar. Diga em uma linha o que reaproveitou.
- **Mudanças não triviais:** apresente o que vai mudar e espere aprovação.
- **Banco:** nunca rode `db:generate`, `db:migrate` ou `db:studio`, nem escreva no Neon.
- **Commits:** só quando pedido, em inglês, conventional commits, sem `Co-Authored-By` nem atribuição a IA.
- **Código:** sem comentários, linha em branco entre statements, Biome (`bun run lint`).
- **Verificação:** `bun run typecheck`, `bun run lint` e `bun run test` antes de dizer que terminou.
- **Segredos:** nunca leia nem exiba `.env`.

## Fluxo PRD → techspec → tarefas → execução → review

Tudo em `tasks/<slug>/` (`prd.md`, `techspec.md`, `tasks.md`, `N_task.md`, `N_task_review.md`). Detalhes em `.agents/rules/fluxo-tarefas.md`.

| Skill             | Faz                                                          | Chamada (Claude)              |
| ----------------- | ------------------------------------------------------------ | ----------------------------- |
| `criar-prd`       | tira dúvidas e gera `prd.md`                                 | `/criar-prd <ideia>`          |
| `criar-techspec`  | lê o PRD, busca no código, gera `techspec.md`                | `/criar-techspec <slug>`      |
| `criar-tarefas`   | quebra em N tarefas atômicas e gera `tasks.md` + `N_task.md` | `/criar-tarefas <slug>`       |
| `executar-tarefa` | implementa a tarefa, marca subtarefas, roda as verificações  | `/executar-tarefa <slug> <N>` |
| `revisar-tarefa`  | revisa o código real e cria `N_task_review.md`               | `/revisar-tarefa <slug> <N>`  |

No Codex, peça pelo nome da skill (ex.: `$criar-prd link-analytics`).
