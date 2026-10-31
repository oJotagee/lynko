import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { RegisterForm } from './register-form'

export function RegisterCard() {
  const t = useTranslations('Auth.Register')

  return (
    <div className="w-full max-w-[430px]">
      <header className="mb-5 text-center">
        <span className="text-[11px] font-bold tracking-[0.16em]">{t('eyebrow')}</span>
        <h2 className="mt-[14px] mb-2 text-[34px] tracking-[-0.04em] max-[600px]:text-[30px]">
          {t('title')}
        </h2>
        <p className="m-0 text-sm text-[#77766f] max-[600px]:text-[13px]">{t('description')}</p>
      </header>

      <Button
        className="h-[52px] w-full rounded-[10px] !border-[#d8d7d1] !bg-white text-sm !text-[#171716] shadow-none hover:!bg-white hover:!text-[#171716] disabled:pointer-events-none disabled:opacity-100"
        variant="outline"
        type="button"
        disabled
      >
        <b className="text-sm text-[#4285f4]" aria-hidden="true">
          G
        </b>{' '}
        {t('google')}
      </Button>

      <div className="my-6 flex items-center gap-2.5 text-xs text-[#8a8983]">
        <span className="h-px flex-1 bg-[#e4e3dd]" />
        <span>{t('divider')}</span>
        <span className="h-px flex-1 bg-[#e4e3dd]" />
      </div>

      <RegisterForm />

      <p className="mt-6 mb-0 text-center text-xs">
        {t('hasAccount')}{' '}
        <Link className="font-semibold underline" href="/login">
          {t('login')}
        </Link>
      </p>
    </div>
  )
}
