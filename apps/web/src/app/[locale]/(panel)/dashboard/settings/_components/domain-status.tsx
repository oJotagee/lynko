import { Badge } from '@/components/ui/badge'
import type { ApiDomain, DomainError, DomainStatus } from '../../_data-access/get-domain'

const LABELS: Record<DomainStatus, string> = {
  pending_owner: 'Confirmando a posse',
  pending_dns: 'Aguardando o DNS',
  active: 'No ar',
  error: 'Precisa de atenção',
}

const ERRORS: Record<DomainError, string> = {
  txt_missing:
    'Ainda não encontramos o registro TXT. Depois de criar, a propagação pode levar de minutos a algumas horas.',
  dns_misconfigured:
    'O domínio ainda não aponta para o Lynko. Confira o registro abaixo no painel do seu provedor.',
  in_use_elsewhere:
    'Este domínio está em uso em outra conta ou projeto. Remova-o de lá e verifique de novo.',
  vercel_failed: 'Não conseguimos conferir agora. Tentamos de novo sozinhos em alguns minutos.',
}

const GUIDES: Record<DomainStatus, string> = {
  pending_owner:
    'Crie os registros abaixo no painel onde você comprou o domínio. Conferimos a cada poucos minutos.',
  pending_dns: 'A posse foi confirmada. Falta o domínio apontar para o Lynko.',
  active: 'Sua página abre neste endereço, com HTTPS.',
  error: 'Resolva o problema abaixo e verifique de novo.',
}

export function DomainStatusBadge({ status }: { status: DomainStatus }) {
  return (
    <Badge
      variant={status === 'error' ? 'destructive' : status === 'active' ? 'default' : 'outline'}
    >
      {LABELS[status]}
    </Badge>
  )
}

export function DomainStatusMessage({ domain }: { domain: ApiDomain }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      <p className="text-muted-foreground">{GUIDES[domain.status]}</p>
      {domain.lastError && domain.status !== 'active' && (
        <p role="status" className={domain.status === 'error' ? 'text-destructive' : ''}>
          {ERRORS[domain.lastError]}
        </p>
      )}
    </div>
  )
}
