'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { checkDomain } from '../../_actions/check-domain'
import type { ApiDomain } from '../../_data-access/get-domain'
import { DomainRecords } from './domain-records'
import { DomainRemoveButton } from './domain-remove-button'
import { DomainStatusBadge, DomainStatusMessage } from './domain-status'

const timeFormat = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' })

export function DomainDetails({ domain }: { domain: ApiDomain }) {
  const queryClient = useQueryClient()

  const check = useMutation({
    mutationFn: () => checkDomain(),
    onSuccess: (response) => {
      if (response.error || !response.data) {
        toast.error(response.error ?? 'Não foi possível verificar agora. Tente novamente.')

        return
      }

      queryClient.setQueryData(['domain'], response.data)

      if (response.data.status === 'active') toast.success('Seu domínio está no ar')
    },
    onError: () => toast.error('Não foi possível verificar agora. Tente novamente.'),
  })

  const live = domain.status === 'active'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-lg font-semibold break-all">{domain.hostname}</p>
        <DomainStatusBadge status={domain.status} />
      </div>
      <DomainStatusMessage domain={domain} />
      {domain.records.length > 0 && <DomainRecords records={domain.records} />}
      <div className="flex flex-wrap items-center gap-3">
        {live ? (
          <a
            href={`https://${domain.hostname}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline', className: 'min-h-11' })}
          >
            <ExternalLink />
            Abrir página
          </a>
        ) : (
          <Button className="min-h-11" disabled={check.isPending} onClick={() => check.mutate()}>
            {check.isPending ? (
              <Loader2 className="animate-spin motion-reduce:animate-none" />
            ) : (
              <RefreshCw />
            )}
            Verificar agora
          </Button>
        )}
        <DomainRemoveButton hostname={domain.hostname} />
        {domain.checkedAt && !live && (
          <p className="text-xs text-muted-foreground">
            Última verificação às {timeFormat.format(new Date(domain.checkedAt))}
          </p>
        )}
      </div>
    </div>
  )
}
