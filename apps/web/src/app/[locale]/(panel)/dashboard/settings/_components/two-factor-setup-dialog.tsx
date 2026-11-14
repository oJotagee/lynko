'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import type { TwoFactorSetup } from '../../_actions/two-factor-setup'
import { portalTheme } from '../../_components/portal-theme'
import { RecoveryCodesList } from './recovery-codes-list'
import { TwoFactorPasswordStep } from './two-factor-password-step'
import { TwoFactorScanStep } from './two-factor-scan-step'

type Step =
  | { name: 'password' }
  | { name: 'scan'; setup: TwoFactorSetup }
  | { name: 'codes'; codes: string[] }

const DESCRIPTIONS: Record<Step['name'], string> = {
  password: 'Além da senha, vamos pedir um código do seu celular sempre que você entrar.',
  scan: 'Cadastre a Lynko no app autenticador e digite o código que ele mostrar.',
  codes:
    'Guarde estes códigos em um lugar seguro. Cada um funciona uma vez, se você perder o celular.',
}

export function TwoFactorSetupDialog({ showTrigger }: { showTrigger: boolean }) {
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)

  const [step, setStep] = useState<Step>({ name: 'password' })

  const [saved, setSaved] = useState(false)

  function handleOpenChange(next: boolean) {
    if (!next && step.name === 'codes' && !saved) return

    setOpen(next)

    if (!next) {
      setStep({ name: 'password' })

      setSaved(false)
    }
  }

  function handleEnabled(codes: string[]) {
    setStep({ name: 'codes', codes })

    toast.success('Login em duas etapas ativado')

    void queryClient.invalidateQueries({ queryKey: ['two-factor'] })

    void queryClient.invalidateQueries({ queryKey: ['sessions'] })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {showTrigger && (
        <DialogTrigger render={<Button className="min-h-11 self-start px-5" />}>
          Ativar login em duas etapas
        </DialogTrigger>
      )}
      <DialogContent className={portalTheme} showCloseButton={step.name !== 'codes' || saved}>
        <DialogTitle>
          {step.name === 'codes' ? 'Seus códigos de recuperação' : 'Ativar login em duas etapas'}
        </DialogTitle>
        <DialogDescription>{DESCRIPTIONS[step.name]}</DialogDescription>
        {step.name === 'password' && (
          <TwoFactorPasswordStep onDone={(setup) => setStep({ name: 'scan', setup })} />
        )}
        {step.name === 'scan' && <TwoFactorScanStep setup={step.setup} onDone={handleEnabled} />}
        {step.name === 'codes' && (
          <div className="grid gap-5">
            <RecoveryCodesList codes={step.codes} />
            <Field orientation="horizontal">
              <Checkbox
                id="recovery-codes-saved"
                checked={saved}
                onCheckedChange={(checked) => setSaved(checked === true)}
              />
              <FieldLabel htmlFor="recovery-codes-saved">
                Guardei os códigos em um lugar seguro
              </FieldLabel>
            </Field>
            <Button className="min-h-11" disabled={!saved} onClick={() => handleOpenChange(false)}>
              Concluir
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
