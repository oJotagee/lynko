'use client'

import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { resendVerification } from '../../_actions/resend-verification'
import { useCountdown } from './use-countdown'

export function VerifyEmailBanner({ email }: { email: string }) {
  const [sent, setSent] = useState(false)

  const { remaining, start } = useCountdown()

  const { mutate, isPending } = useMutation({
    mutationFn: resendVerification,
    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error)

        return
      }

      setSent(true)

      start(response.data?.retryAfter ?? 60)

      toast.success('Enviamos um novo link para o seu e-mail.')
    },
    onError: () => toast.error('Não foi possível reenviar o e-mail. Tente novamente.'),
  })

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-muted px-4 py-3 text-sm sm:px-8">
      <p role="status" className="min-w-0 flex-1">
        {sent ? (
          <>
            Enviamos um novo link para <strong>{email}</strong>. Abra o e-mail e confirme com um
            clique.
          </>
        ) : (
          <>
            Confirme seu e-mail <strong>{email}</strong> para proteger sua conta. Procure o link na
            sua caixa de entrada.
          </>
        )}
      </p>
      <Button
        size="sm"
        variant="outline"
        type="button"
        disabled={isPending || remaining > 0}
        onClick={() => mutate()}
      >
        {isPending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
        {remaining > 0 ? `Reenviar em ${remaining}s` : 'Reenviar e-mail'}
      </Button>
    </div>
  )
}
