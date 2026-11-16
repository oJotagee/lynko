import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import type { ApiDomain } from '../../_data-access/get-domain'
import { DomainRemoveButton } from './domain-remove-button'

export function DomainPaused({ domain }: { domain: ApiDomain }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-lg font-semibold break-all">{domain.hostname}</p>
        <Badge variant="outline">Pausado</Badge>
      </div>
      <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
        Seu Pro terminou, então {domain.hostname} não abre mais sua página. A configuração continua
        salva e volta a valer quando você assinar de novo.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/plans"
          className={buttonVariants({ variant: 'outline', className: 'min-h-11' })}
        >
          Ver o Pro
        </Link>
        <DomainRemoveButton hostname={domain.hostname} />
      </div>
    </div>
  )
}
