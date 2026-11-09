import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { GoogleButton } from '../../_components/google-button'
import { LoginForm } from './login-form'

export function AuthCard({ googleError = false }: { googleError?: boolean }) {
  const t = useTranslations('Auth.Login')

  return (
    <div className="w-full max-w-[430px]">
      <header className="mb-5 text-center">
        <span className="text-[11px] font-bold tracking-[0.16em]">{t('eyebrow')}</span>
        <h2 className="mt-[14px] mb-2 text-[34px] tracking-[-0.04em] max-[600px]:text-[30px]">
          {t('title')}
        </h2>
        <p className="m-0 text-sm text-[#77766f] max-[600px]:text-[13px]">{t('description')}</p>
      </header>

      {googleError && (
        <p
          role="alert"
          className="mb-4 rounded-[10px] border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
        >
          {t('googleError')}
        </p>
      )}

      <GoogleButton>{t('google')}</GoogleButton>

      <div className="my-6 flex items-center gap-2.5 text-xs text-[#8a8983]">
        <span className="h-px flex-1 bg-[#e4e3dd]" />
        <span>{t('divider')}</span>
        <span className="h-px flex-1 bg-[#e4e3dd]" />
      </div>

      <LoginForm />

      <p className="mt-6 mb-0 text-center text-xs">
        {t('noAccount')}{' '}
        <Link className="font-semibold underline" href="/register">
          {t('createAccount')}
        </Link>
      </p>
    </div>
  )
}
