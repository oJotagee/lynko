type ScheduleDate = Date | string | null

interface SchedulableLink {
  isActive?: boolean
  startsAt: ScheduleDate
  endsAt: ScheduleDate
}

export const SCHEDULE_ERROR = 'endsAt must be after startsAt'

export function isValidSchedule(startsAt?: ScheduleDate, endsAt?: ScheduleDate) {
  return !startsAt || !endsAt || new Date(endsAt) > new Date(startsAt)
}

export function isLinkLive(
  { isActive = true, startsAt, endsAt }: SchedulableLink,
  now = new Date(),
) {
  if (!isActive) return false

  if (startsAt && new Date(startsAt) > now) return false

  return !endsAt || new Date(endsAt) > now
}
