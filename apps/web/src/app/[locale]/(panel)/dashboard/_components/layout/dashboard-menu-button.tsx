'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'

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
