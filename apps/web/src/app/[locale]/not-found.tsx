import { useTranslations } from 'next-intl'
import { buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { NotFoundAnimation } from '../_components/not-found-animation'

export default function NotFound() {
  const t = useTranslations('NotFound')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md aspect-square">
        <NotFoundAnimation />
      </div>
      <h1 className="text-2xl font-semibold text-foreground mt-4 mb-2">{t('title')}</h1>
      <p className="text-muted-foreground text-center mb-8">{t('description')}</p>
      <Link
        href="/"
        className={cn(
          buttonVariants({ size: 'lg' }),
          'bg-[#b7f34a] text-[#171716] hover:bg-[#b7f34a]/90',
        )}
      >
        {t('home')}
      </Link>
    </div>
  )
}
