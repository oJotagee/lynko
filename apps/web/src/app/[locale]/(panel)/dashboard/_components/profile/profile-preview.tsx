import { ArrowRight, Link2 } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import type { DashboardData } from '../dashboard-data'
import { ProfileAvatar } from './profile-avatar'
import { LinkIcon } from '../link-icon'

export function ProfilePreview({ data: { profile, appearance, links } }: { data: DashboardData }) {
  return (
    <div
      className="mx-auto w-full max-w-[280px] overflow-hidden rounded-[34px] border border-foreground/60 p-4 text-center shadow-xl"
      style={{
        background: appearance.background,
        color: appearance.foreground,
        fontFamily: 'var(--font-dashboard-body), sans-serif',
      }}
    >
      <div className="mb-6 flex justify-between px-1 text-[10px]">
        <span>9:41</span>
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      </div>
      <div className="flex justify-center">
        <ProfileAvatar profile={profile} large />
      </div>
      <h2 className="mt-4 text-lg font-bold">{profile.name}</h2>
      <p className="mt-1 text-xs opacity-70">@{profile.username}</p>
      <p className="my-4 break-words text-xs leading-relaxed">{profile.bio}</p>
      {!profile.published && (
        <p className="mt-4 text-xs opacity-70">Rascunho · ainda não publicado</p>
      )}
      {
        <div className="mt-6 space-y-3">
          {links
            .filter((link) => link.active)
            .map((link) => (
              <a
                key={link.id}
                className={`${buttonVariants({ variant: 'outline' })} h-auto min-h-11 w-full justify-start gap-2 border-current px-2 py-3 text-left text-xs whitespace-normal`}
                style={{
                  background:
                    appearance.buttonStyle === 'outline' ? 'transparent' : appearance.button,
                  color: appearance.buttonText,
                  borderColor: appearance.button,
                  borderRadius: { none: 0, small: 4, medium: 10, full: 24 }[appearance.radius],
                }}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkIcon
                  url={link.url}
                  fallbackColor={link.color}
                  className="size-6 text-primary"
                  iconClassName="size-3"
                />
                <span className="min-w-0 flex-1 break-words">{link.title}</span>
                <ArrowRight className="size-3" />
              </a>
            ))}
          {!links.some((link) => link.active) && (
            <p className="py-8 text-sm opacity-70">Seus links aparecerão aqui.</p>
          )}
        </div>
      }
      <p className="mt-8 mb-5 flex items-center justify-center gap-1 text-[10px] opacity-60">
        <Link2 className="size-3" /> Feito com Lynko
      </p>
    </div>
  )
}
