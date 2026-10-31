'use client'

import { useLocale, useTranslations } from 'next-intl'

import { usePathname, useRouter } from '@/i18n/navigation'
import type { routing } from '@/i18n/routing'

export function LocaleSwitcher({ className = '' }: { className?: string }) {
  const locale = useLocale()
  const t = useTranslations('Common')
  const pathname = usePathname()
  const router = useRouter()
  const nextLocale = locale === 'en' ? 'pt' : 'en'

  return (
    <button
      type="button"
      aria-label={t(nextLocale === 'pt' ? 'switchToPortuguese' : 'switchToEnglish')}
      className={`inline-grid h-7 min-w-[38px] cursor-pointer place-items-center rounded-full border border-[#171716] bg-transparent px-[9px] text-[10px] font-bold tracking-[0.06em] text-[#171716] transition-[border-color,transform] duration-200 hover:-translate-y-px hover:border-[#b7f34a] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#171716] ${className}`}
      onClick={() =>
        router.replace(pathname, { locale: nextLocale as (typeof routing.locales)[number] })
      }
    >
      {locale.toUpperCase()}
    </button>
  )
}
