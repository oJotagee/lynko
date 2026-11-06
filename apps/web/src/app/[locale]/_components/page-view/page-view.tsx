import { ArrowRight, Link2 } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import type {
  DashboardLink,
  DashboardProfile,
} from '../../(panel)/dashboard/_components/dashboard-data'
import type { PageAppearance } from '../appearance-schema'
import { LinkIcon } from '../link-icon'
import { ProfileAvatar } from '../profile-avatar'
import type { SocialLinkData } from '../social-links/social-link-schema'
import { buttonHoverClasses, getBackgroundStyle, getButtonStyle } from './appearance-style'
import { fontFamilyStyles } from './fonts'
import { SocialIcons } from './social-icons'

export interface PageViewProps {
  profile: Pick<DashboardProfile, 'name' | 'username' | 'bio' | 'image'> & {
    published?: boolean
  }
  appearance: PageAppearance
  socialLinks: (SocialLinkData & { href?: string })[]
  links: (Pick<DashboardLink, 'id' | 'title' | 'url' | 'color'> & { href?: string })[]
  backgroundImageUrl?: string | null
  headingAs?: 'h1' | 'h2'
  fixedFooter?: boolean
  className?: string
}

export function PageView({
  profile,
  appearance,
  socialLinks,
  links,
  backgroundImageUrl,
  headingAs: Heading = 'h2',
  fixedFooter = false,
  className,
}: PageViewProps) {
  const { buttons, typography } = appearance

  return (
    <div
      className={cn('px-4 py-8 text-center', fixedFooter && 'pb-20', className)}
      style={{
        ...getBackgroundStyle(appearance, backgroundImageUrl),
        color: typography.textColor,
        fontFamily: fontFamilyStyles[typography.fontFamily],
      }}
    >
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center">
          <ProfileAvatar profile={profile} large />
        </div>
        <Heading className="mt-4 text-lg font-bold">{profile.name}</Heading>
        <p className="mt-1 text-xs opacity-70">@{profile.username}</p>
        {profile.bio && <p className="my-4 break-words text-xs leading-relaxed">{profile.bio}</p>}
        <SocialIcons links={socialLinks} appearance={appearance.socialIcons} />
        {profile.published === false && (
          <p className="mt-4 text-xs opacity-70">Rascunho · ainda não publicado</p>
        )}
        <div className="mt-6 space-y-3">
          {links.map((link) => (
            <a
              key={link.id}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'h-auto min-h-11 w-full justify-start gap-2 px-2 py-3 text-left text-xs whitespace-normal motion-safe:transition-[translate,scale,box-shadow,background-color,color,border-color,opacity] motion-safe:duration-200 motion-reduce:transition-none hover:border-(--button-hover-bg)! hover:bg-(--button-hover-bg)! hover:text-(--button-hover-fg)! focus-visible:border-(--button-hover-bg)! focus-visible:bg-(--button-hover-bg)! focus-visible:text-(--button-hover-fg)!',
                buttonHoverClasses[buttons.hoverEffect],
              )}
              style={getButtonStyle(buttons)}
              href={link.href ?? link.url}
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
          {links.length === 0 && (
            <p className="py-8 text-sm opacity-70">Seus links aparecerão aqui.</p>
          )}
        </div>
        {fixedFooter ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-4 flex justify-center">
            <p
              className="pointer-events-auto flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] shadow-sm"
              style={{ background: buttons.backgroundColor, color: buttons.textColor }}
            >
              <Link2 className="size-3" aria-hidden="true" /> Feito com
              <LynkoLink />
            </p>
          </div>
        ) : (
          <p className="mt-8 flex items-center justify-center gap-1 text-[10px] opacity-60">
            <Link2 className="size-3" aria-hidden="true" /> Feito com
            <LynkoLink />
          </p>
        )}
      </div>
    </div>
  )
}

function LynkoLink() {
  return (
    <Link
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold underline-offset-2 hover:underline focus-visible:underline"
    >
      Lynko
    </Link>
  )
}
