import { cn } from '@/lib/utils'
import type { PageAppearance } from '../appearance-schema'
import { getSocialLinkHref, type SocialLinkData } from '../social-links/social-link-schema'
import { socialPlatforms } from '../social-links/social-platforms'
import { socialIconSizes } from './appearance-style'

interface SocialIconsProps {
  links: (SocialLinkData & { href?: string })[]
  appearance: PageAppearance['socialIcons']
}

export function SocialIcons({ links, appearance }: SocialIconsProps) {
  const items = links
    .filter((link) => link.isActive)
    .flatMap((link) => {
      const href = link.href ?? getSocialLinkHref(link)

      return href ? [{ link, href }] : []
    })

  if (items.length === 0) return null

  const size = socialIconSizes[appearance.size]

  return (
    <ul className="mt-4 flex flex-wrap justify-center gap-1">
      {items.map(({ link, href }) => {
        const { name, icon: Icon } = socialPlatforms[link.platform]

        return (
          <li key={link.platform}>
            <a
              className={cn(
                'flex items-center justify-center rounded-full motion-safe:transition-opacity motion-safe:hover:opacity-70',
                size.box,
              )}
              style={{ color: appearance.color }}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
            >
              <Icon className={size.icon} aria-hidden="true" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
