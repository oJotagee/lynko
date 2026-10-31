# Lynko

As regras completas do projeto estão em [AGENTS.md](../AGENTS.md). Siga esse arquivo. Resumo do essencial:

- **Busque antes de criar:** repositório, dependências instaladas, documentação oficial e soluções que já existem na internet, de validar uma data a implementar um gráfico.
- **Ordem:** o que já existe no projeto → alternativas prontas (shadcn: use; se faltar, `bunx shadcn add`) → só por último criar.
- **Componentes:** `page.tsx` só compõe, componentes pequenos, formulários com `Field`.
- **Frontend:** React Query sempre (`useQuery`, `useMutation`). `_data-access` e `_actions` com `'use server'`. Schema separado, exportando um hook `useXSchema`.
- **Backend:** módulos com `routes`, `service`, `repository` e `dto`. Usuário vem de `request.user.sub`, e toda query filtra pelo dono.
- **Banco:** nunca rode migrations.
- **Commits:** em inglês, conventional commits, sem atribuição a IA.
