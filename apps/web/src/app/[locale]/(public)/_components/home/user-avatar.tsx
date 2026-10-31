import type { Session } from 'next-auth'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function UserAvatar({ user }: { user: Pick<Session['user'], 'name' | 'email' | 'image'> }) {
  const name = user.name?.trim() || user.email || 'U'
  const names = name.split(/\s+/)
  const initials =
    `${names[0][0]}${names.length > 1 ? names[names.length - 1][0] : ''}`.toUpperCase()

  return (
    <Avatar size="lg">
      {user.image && <AvatarImage src={user.image} alt={name} />}
      <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
