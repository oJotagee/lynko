'use client'

import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button, buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { AUTH_ACTION_CLASS } from '../../_components/auth-action-class'
import { confirmDeletion } from '../_actions/confirm-deletion'

export function ConfirmDeletionCard({ token }: { token?: string }) {
  const t = useTranslations('Auth.ConfirmDeletion')

  const { mutate, isPending, data, isError } = useMutation({
    mutationFn: () => confirmDeletion(token ?? ''),
  })

  const deleted = data !== undefined && !data.error

  const invalid = !token || Boolean(data?.invalid)

  const transient = isError || Boolean(data?.error && !data.invalid)

  const title = deleted
    ? t('successTitle')
    : invalid
      ? t('errorTitle')
      : transient
        ? t('transientTitle')
        : t('title')

  const description = deleted
    ? t('successDescription')
    : !token
      ? t('missingToken')
      : invalid
        ? t('errorDescription')
        : transient
          ? t('transientDescription')
          : t('description')

  return (
    <div className="w-full max-w-[430px]">
      <header className="mb-8 text-center" aria-live="polite">
        <h2 className="mb-2 text-[34px] tracking-[-0.04em] max-[600px]:text-[30px]">{title}</h2>
        <p className="m-0 text-sm text-muted-foreground max-[600px]:text-[13px]">{description}</p>
      </header>

      {deleted ? (
        <Link href="/" className={cn(buttonVariants(), AUTH_ACTION_CLASS)}>
          {t('home')}
          <span aria-hidden="true">→</span>
        </Link>
      ) : (
        !invalid && (
          <Button
            className={AUTH_ACTION_CLASS}
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => mutate()}
          >
            {isPending ? t('submitting') : t('submit')}
            {isPending ? (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
            ) : (
              <span aria-hidden="true">→</span>
            )}
          </Button>
        )
      )}
    </div>
  )
}
