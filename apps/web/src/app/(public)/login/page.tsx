'use client'

import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { LynkoMascot } from '../_components/lynko-mascot'

const loginSchema = z.object({
  email: z.string().trim().email('Digite um e-mail válido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(_values: LoginValues) {
    // Authentication is not available yet. Keep the page honest and avoid
    // simulating a successful sign in.
    form.setError('root', {
      message: 'O acesso ainda não está disponível. Tente novamente mais tarde.',
    })
  }

  return (
    <main className="lynko-login">
      <section className="lynko-login-brand" aria-label="Lynko">
        <Link className="lynko-logo" href="/" aria-label="Lynko, página inicial">
          <span className="lynko-logo-mark" aria-hidden="true"><i /><i /></span>
          <strong>lynko</strong>
        </Link>
        <div className="lynko-login-welcome">
          <span>SEU CANTO NA INTERNET</span>
          <h1>Bom ter você<br /><em>de volta.</em></h1>
          <p>Seus links, sua audiência e seu pequeno espaço digital estão à sua espera.</p>
        </div>
        <div className="lynko-login-art" aria-hidden="true">
          <span>Tudo conectado.</span>
          <LynkoMascot />
        </div>
        <small>© 2025 Lynko, Inc.</small>
      </section>

      <section className="lynko-login-panel">
        <Link className="lynko-login-back" href="/">← Voltar</Link>
        <div className="lynko-login-card">
          <header>
            <span>ENTRAR NA LYNKO</span>
            <h2>Acesse sua conta</h2>
            <p>Continue construindo uma presença que tem a sua cara.</p>
          </header>
          <Button className="lynko-google" variant="outline" type="button" disabled>
            <b aria-hidden="true">G</b> Continuar com Google
          </Button>
          <div className="lynko-divider"><span>ou continue com e-mail</span></div>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <label htmlFor="email">E-mail</label>
            <Input className="lynko-input" id="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" aria-invalid={!!form.formState.errors.email} {...form.register('email')} />
            {form.formState.errors.email && <small className="lynko-field-error">{form.formState.errors.email.message}</small>}
            <div className="lynko-password-label"><label htmlFor="password">Senha</label><button type="button" disabled>Esqueci minha senha</button></div>
            <Input className="lynko-input" id="password" type="password" autoComplete="current-password" placeholder="Mínimo de 8 caracteres" aria-invalid={!!form.formState.errors.password} {...form.register('password')} />
            {form.formState.errors.password && <small className="lynko-field-error">{form.formState.errors.password.message}</small>}
            <label className="lynko-remember"><input type="checkbox" defaultChecked /> Manter minha sessão ativa</label>
            {form.formState.errors.root && <p className="lynko-login-error" role="alert">{form.formState.errors.root.message}</p>}
            <Button className="lynko-submit" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Entrando…' : 'Entrar'} <span aria-hidden="true">→</span>
            </Button>
          </form>
          <p className="lynko-signup">Ainda não tem uma conta? <Button variant="link" disabled>Crie sua Lynko</Button></p>
        </div>
        <p className="lynko-legal">Ao continuar, você concorda com os Termos e a Política de Privacidade.</p>
      </section>
    </main>
  )
}

