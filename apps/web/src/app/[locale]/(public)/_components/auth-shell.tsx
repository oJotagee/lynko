import { LoginBrand } from '../login/_components/login-brand'
import { LegalNotice } from './legal-notice'
import { PasswordVisibilityProvider } from './password-visibility'

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <PasswordVisibilityProvider>
      <main className="grid min-h-svh grid-cols-[47.5%_52.5%] bg-background font-[var(--font-roboto)] text-foreground max-[900px]:grid-cols-1">
        <LoginBrand />

        <section className="relative flex min-h-svh flex-col items-center justify-center bg-background px-8 pt-16 pb-[45px] max-[900px]:min-h-[996px] max-[900px]:justify-start max-[900px]:px-8 max-[900px]:pt-[185px] max-[900px]:pb-[110px] max-[600px]:min-h-[745px] max-[600px]:px-[22px] max-[600px]:pt-[52px]">
          {children}
          <LegalNotice />
        </section>
      </main>
    </PasswordVisibilityProvider>
  )
}
