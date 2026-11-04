import { ProfileAvatar } from '../profile/profile-avatar'
import { auth } from '@/lib/auth'

export async function NavAccount() {
  const session = await auth()

  const name = session?.user.name ?? ''

  return (
    <>
      <ProfileAvatar profile={{ name, image: '' }} />
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold">{name}</p>
        <p className="truncate text-[11px] text-sidebar-foreground/60">{session?.user.email}</p>
      </div>
    </>
  )
}
