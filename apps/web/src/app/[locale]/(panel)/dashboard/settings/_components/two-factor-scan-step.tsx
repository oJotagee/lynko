'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { Copy, Loader2 } from 'lucide-react'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import { TwoFactorCodeField } from '@/app/[locale]/_components/two-factor-fields'
import { Button } from '@/components/ui/button'
import { enableTwoFactor } from '../../_actions/two-factor-enable'
import type { TwoFactorSetup } from '../../_actions/two-factor-setup'
import { useTwoFactorCodeSchema } from './two-factor-schema'

interface TwoFactorScanStepProps {
  setup: TwoFactorSetup
  onDone: (recoveryCodes: string[]) => void
}

export function TwoFactorScanStep({ setup, onDone }: TwoFactorScanStepProps) {
  const form = useTwoFactorCodeSchema()

  const qr = useQuery({
    queryKey: ['two-factor-qr', setup.otpauthUrl],
    queryFn: () => QRCode.toDataURL(setup.otpauthUrl, { margin: 2, width: 512 }),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (code: string) => enableTwoFactor(code),
    onSuccess: (response) => {
      if (response.data) {
        onDone(response.data.recoveryCodes)

        return
      }

      form.setError('code', { message: response.error })
    },
  })

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(setup.secret)

      toast.success('Chave copiada')
    } catch {
      toast.error('Não foi possível copiar. Digite a chave no app.')
    }
  }

  return (
    <form
      className="grid gap-5"
      noValidate
      onSubmit={form.handleSubmit(({ code }) => mutate(code))}
    >
      <p className="text-sm text-muted-foreground">
        Escaneie o QR code com o Google Authenticator, Authy ou 1Password. Se não der, digite a
        chave no app.
      </p>
      <div className="flex size-48 items-center justify-center justify-self-center rounded-xl bg-white p-2">
        {qr.data ? (
          <img src={qr.data} alt="QR code para cadastrar a Lynko no app autenticador" />
        ) : (
          <Loader2 className="size-6 animate-spin text-muted-foreground motion-reduce:animate-none" />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
        <code className="min-w-0 break-all font-mono text-sm tracking-wide">
          {setup.secret.match(/.{1,4}/g)?.join(' ')}
        </code>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Copiar chave"
          onClick={copySecret}
        >
          <Copy className="size-4" />
        </Button>
      </div>
      <TwoFactorCodeField control={form.control} name="code" autoFocus />
      <Button type="submit" className="min-h-11" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
        Ativar
      </Button>
    </form>
  )
}
