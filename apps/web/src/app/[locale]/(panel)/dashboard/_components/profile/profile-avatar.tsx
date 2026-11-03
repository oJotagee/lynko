'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { DashboardProfile } from '../dashboard-data'

export function ProfileAvatar({
  profile,
  large = false,
}: {
  profile: Pick<DashboardProfile, 'name' | 'image'>
  large?: boolean
}) {
  const initials = profile.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .filter((_, index, words) => index === 0 || index === words.length - 1)
    .join('')
    .toUpperCase()

  return (
    <Avatar className={large ? 'size-16 border-2 border-foreground' : 'size-9'}>
      <AvatarImage src={profile.image || undefined} alt={profile.name} />
      <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
