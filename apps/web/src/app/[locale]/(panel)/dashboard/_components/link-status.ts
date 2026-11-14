import type { DashboardLink } from './dashboard-data'

export type LinkStatus = 'hidden' | 'scheduled' | 'live' | 'ended'

type SchedulableLink = Pick<DashboardLink, 'active' | 'startsAt' | 'endsAt'>

export function getLinkStatus(
  { active, startsAt, endsAt }: SchedulableLink,
  now: Date,
): LinkStatus {
  if (!active) return 'hidden'

  if (startsAt && new Date(startsAt) > now) return 'scheduled'

  if (endsAt && new Date(endsAt) <= now) return 'ended'

  return 'live'
}

export const linkStatusLabels: Record<LinkStatus, string> = {
  hidden: 'Oculto',
  scheduled: 'Agendado',
  live: 'No ar',
  ended: 'Encerrado',
}

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function getScheduleText({ startsAt, endsAt }: SchedulableLink, status: LinkStatus) {
  const format = (value: string) => dateFormat.format(new Date(value))

  if (status === 'scheduled' && startsAt) {
    return `Entra no ar em ${format(startsAt)}${endsAt ? ` e sai em ${format(endsAt)}` : ''}`
  }

  if (status === 'live' && endsAt) return `Sai do ar em ${format(endsAt)}`

  if (status === 'ended' && endsAt) return `Saiu do ar em ${format(endsAt)}`

  return null
}
