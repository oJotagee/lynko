'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, LogOut } from 'lucide-react'
import { getSession } from 'next-auth/react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/navigation'
import { logout } from '../../_actions/logout'

export function LogoutButton() {
  const router = useRouter()
  const client = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: logout,
    async onSuccess(response) {
      if (response.error) {
        toast.error(response.error)
        return
      }
      await getSession()
      client.clear()
      router.replace('/')
      router.refresh()
    },
    onError() {
      toast.error('Não foi possível sair da conta. Tente novamente.')
    },
  })

  return (
    <Button
      variant="ghost"
      className="min-h-11 w-full justify-start gap-3 px-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      disabled={isPending}
      onClick={() => mutate()}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}Sair
      da conta
    </Button>
  )
}
