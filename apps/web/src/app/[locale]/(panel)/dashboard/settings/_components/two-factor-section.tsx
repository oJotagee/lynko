'use client'

import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getTwoFactor } from '../../_data-access/get-two-factor'
import { RecoveryCodesDialog } from './recovery-codes-dialog'
import { TwoFactorDisableDialog } from './two-factor-disable-dialog'
import { TwoFactorSetupDialog } from './two-factor-setup-dialog'

function codesLeftText(left: number) {
  if (left === 0) return 'Você não tem mais códigos de recuperação. Gere novos.'

  return left === 1 ? 'Resta 1 código de recuperação' : `Restam ${left} códigos de recuperação`
}

export function TwoFactorSection({ hasPassword }: { hasPassword: boolean }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['two-factor'],
    queryFn: () => getTwoFactor(),
    enabled: hasPassword,
  })

  return (
    <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <h2 className="flex flex-wrap items-center gap-3 text-2xl font-bold">
        Login em duas etapas
        {data?.enabled && <Badge variant="secondary">Ativo</Badge>}
      </h2>
      {!hasPassword ? (
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Como você entra com o Google, a verificação em duas etapas é feita pela sua Conta Google,
          nas configurações de segurança dela.
        </p>
      ) : (
        <>
          <p className="mt-3 mb-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {data?.enabled
              ? 'Além da senha, pedimos um código do seu app autenticador quando você entra.'
              : 'Proteja sua conta pedindo, além da senha, um código do app autenticador do seu celular.'}
          </p>
          {isPending && (
            <div aria-busy="true">
              <span className="sr-only">Carregando…</span>
              <Skeleton className="h-11 w-56" />
            </div>
          )}
          {isError && (
            <div role="alert" className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-destructive">
                Não foi possível carregar o login em duas etapas.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}
          {data && <TwoFactorSetupDialog showTrigger={!data.enabled} />}
          {data?.enabled && (
            <div className="grid gap-4">
              <p className={data.recoveryCodesLeft === 0 ? 'text-sm text-destructive' : 'text-sm'}>
                {codesLeftText(data.recoveryCodesLeft)}
              </p>
              <div className="flex flex-wrap gap-3">
                <RecoveryCodesDialog />
                <TwoFactorDisableDialog />
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
