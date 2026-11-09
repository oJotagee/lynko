import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { GoogleButton } from '../../_components/google-button'
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

      <GoogleButton>{t('google')}</GoogleButton>

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
