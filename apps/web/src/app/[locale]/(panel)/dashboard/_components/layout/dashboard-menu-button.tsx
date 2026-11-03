'use client'

import { Menu } from 'lucide-react'

import { useSidebar } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

export function DashboardMenuButton() {
  const { setOpenMobile } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Abrir menu"
      className="size-11 lg:hidden"
      onClick={() => setOpenMobile(true)}
    >
      <Menu />
    </Button>
  )
}
