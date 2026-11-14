'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { DashboardProfile } from '../(panel)/dashboard/_components/dashboard-data'
import { getInitials } from './initials'

export function ProfileAvatar({
  profile,
  large = false,
}: {
  profile: Pick<DashboardProfile, 'name' | 'image'>
  large?: boolean
}) {
  const initials = getInitials(profile.name)

  return (
    <Avatar className={large ? 'size-16 border-2 border-foreground' : 'size-9'}>
      <AvatarImage src={profile.image || undefined} alt={profile.name} />
      <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
