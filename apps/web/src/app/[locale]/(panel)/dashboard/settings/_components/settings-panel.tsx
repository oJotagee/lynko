'use client'

import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import type { DashboardData } from '../../_components/dashboard-data'
import { ProfilePreview } from '../../_components/profile/profile-preview'
import type { ApiUser } from '../../_data-access/get-dashboard'
import { ChangePasswordForm } from './change-password-form'
import { DeleteAccountDialog } from './delete-account-dialog'
import { ProfileForm } from './profile-form'

interface SettingsPanelProps {
  user: ApiUser
  data: DashboardData
  hasPage: boolean
}

export function SettingsPanel({ user, data, hasPage }: SettingsPanelProps) {
  const [tab, setTab] = useState('general')

  return (
    <div className="max-w-4xl space-y-5">
      <fieldset className="flex gap-1 border-b border-border" aria-label="Seção de configurações">
        {[
          ['general', 'Geral'],
          ['security', 'Segurança'],
          ['public', 'Perfil público'],
        ].map(([id, label]) => (
          <Button
            key={id}
            variant="ghost"
            aria-pressed={tab === id}
            className={
              'min-h-11 rounded-none! border-0 border-b-2 bg-transparent! px-3 text-xs shadow-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:ring-0 sm:px-4 ' +
              (tab === id ? 'border-foreground' : 'border-transparent text-muted-foreground')
            }
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </fieldset>
      {tab === 'general' && (
        <>
          <section className="rounded-xl border border-border bg-card p-5 sm:p-8">
            <h2 className="text-2xl font-bold">Sua conta</h2>
            <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Nome da conta</dt>
                <dd className="mt-1 font-semibold">{user.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">E-mail</dt>
                <dd className="mt-1 break-all font-semibold">{user.email}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              Alteração de nome e e-mail da conta ainda não está disponível.
            </p>
            <h3 className="mt-8 mb-6 border-t border-border pt-6 text-lg font-bold">
              {hasPage ? 'Sua página' : 'Crie sua página'}
            </h3>
            <div className="max-w-xl">
              <ProfileForm data={data} hasPage={hasPage} />
            </div>
          </section>
          <section className="rounded-xl border border-destructive/40 bg-card p-6">
            <h2 className="text-lg font-semibold">Excluir sua conta Lynko</h2>
            <p className="mt-2 mb-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Apaga sua conta, sua página, seus links, suas mídias e suas estatísticas. Não há como
              desfazer.
            </p>
            <DeleteAccountDialog hasPassword={user.hasPassword} />
          </section>
        </>
      )}
      {tab === 'security' && (
        <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Segurança da conta</h2>
          {user.hasPassword ? (
            <>
              <p className="mt-3 mb-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Ao alterar a senha, os outros dispositivos conectados à sua conta são desconectados.
                Esta sessão continua ativa.
              </p>
              <ChangePasswordForm />
            </>
          ) : (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Sua conta entra com o Google, então não há senha para alterar.
            </p>
          )}
        </section>
      )}
      {tab === 'public' && (
        <section className="grid items-center gap-8 rounded-xl border border-border bg-card p-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">Seu perfil público</h2>
            <p className="mt-3 mb-6 text-sm leading-relaxed text-muted-foreground">
              Edite temas e botões em Aparência. Nome, biografia, foto e visibilidade ficam em
              Geral.
            </p>
            <Link
              href="/dashboard/appearance"
              className={buttonVariants({ variant: 'outline', className: 'min-h-11' })}
            >
              Editar aparência
            </Link>
          </div>
          <ProfilePreview data={data} />
        </section>
      )}
    </div>
  )
}
