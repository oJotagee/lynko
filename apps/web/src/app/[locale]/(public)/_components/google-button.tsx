'use client'

import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { loginWithGoogle } from '../login/_actions/login-with-google'

export function GoogleButton({ children }: { children: ReactNode }) {
  const { mutate, isPending } = useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: (response) => {
      if (response.error) toast.error(response.error)
    },
    onError: (error) => {
      if ((error as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) return

      toast.error('Não foi possível entrar com o Google. Tente novamente.')
    },
  })

  return (
    <Button
      className="h-[52px] w-full rounded-[10px] !border-[#d8d7d1] !bg-white text-sm !text-[#171716] shadow-none transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:!bg-white hover:!text-[#171716] hover:shadow-[0_5px_0_#17171620] disabled:pointer-events-auto disabled:opacity-100 cursor-pointer"
      variant="outline"
      type="button"
      disabled={isPending}
      aria-busy={isPending}
      onClick={() => mutate()}
    >
      {isPending ? (
        <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : (
        <b className="text-sm text-[#4285f4]" aria-hidden="true">
          G
        </b>
      )}{' '}
      {children}
    </Button>
  )
}
