'use client'

import { usePasswordVisibility } from '../../_components/password-visibility'
import { LocaleSwitcher } from '../../_components/locale-switcher'
import { LynkoMascot } from '../../_components/lynko-mascot'
import { LynkoLogo } from '../../_components/lynko-logo'
import { useTranslations } from 'next-intl'

export function LoginBrand({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  const { visible } = usePasswordVisibility()
  const t = useTranslations('Auth.Brand')

  return (
    <section
      className="lynko-login-brand relative flex min-h-svh flex-col overflow-hidden bg-[#9b8cff] px-[52px] py-[30px] max-[900px]:min-h-[540px] max-[900px]:p-[30px] max-[600px]:min-h-[255px] max-[600px]:px-5 max-[600px]:py-[18px]"
      aria-label="Lynko"
    >
      <LynkoLogo className="lynko-logo max-[600px]:top-[11px] max-[600px]:left-4" />
      <LocaleSwitcher className="absolute top-6 right-6 z-[2]" />

      <div className="z-[1] mt-auto mb-[42px] max-[900px]:mb-[135px] max-[600px]:absolute max-[600px]:top-[70px] max-[600px]:right-5 max-[600px]:left-5 max-[600px]:m-0">
        <span className="text-[11px] font-bold tracking-[0.16em] max-[600px]:text-[10px]">
          {t('eyebrow')}
        </span>
        <h1 className="mt-[18px] mb-[14px] text-[clamp(42px,4vw,58px)] leading-[0.98] tracking-[-0.065em] max-[900px]:text-5xl max-[600px]:mt-[14px] max-[600px]:mb-[10px] max-[600px]:text-[clamp(34px,9vw,40px)]">
          {mode === 'login' ? t('welcome') : t('registerTitle')}
          <br />
          <em className="text-[#b7f34a] not-italic">
            {mode === 'login' ? t('welcomeAccent') : t('registerAccent')}
          </em>
        </h1>
        <p className="max-w-[340px] text-sm leading-[1.65] max-[600px]:max-w-[235px] max-[600px]:text-xs max-[600px]:leading-[1.55]">
          {mode === 'login' ? t('description') : t('registerDescription')}
        </p>
      </div>

      <div
        className="relative flex min-h-[190px] items-center justify-end pr-[7%] max-[900px]:absolute max-[900px]:right-0 max-[900px]:bottom-0 max-[900px]:min-h-0 max-[900px]:p-0"
        aria-hidden="true"
      >
        <span className="z-[1] mr-[-15px] -translate-y-[35px] rotate-[-8deg] border border-[#171716] bg-[#fff7ca] px-[14px] py-2.5 text-sm text-[#171716] shadow-[3px_4px_0_#171716] max-[900px]:hidden">
          {t('connected')}
        </span>
        <LynkoMascot className="max-[900px]:w-[150px] max-[600px]:w-[120px]" eyesClosed={visible} />
      </div>

      <small className="mt-[15px] text-xs opacity-55 max-[900px]:absolute max-[900px]:bottom-[14px] max-[900px]:left-[30px] max-[900px]:mt-0 max-[600px]:hidden">
        © {new Date().getFullYear()} Lynko, Inc.
      </small>
    </section>
  )
}
