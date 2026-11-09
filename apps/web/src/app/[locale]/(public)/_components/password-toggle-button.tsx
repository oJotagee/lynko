'use client'

import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { usePasswordVisibility } from './password-visibility'

interface PasswordToggleButtonProps {
  showLabel: string
  hideLabel: string
}

export function PasswordToggleButton({ showLabel, hideLabel }: PasswordToggleButtonProps) {
  const { visible, setVisible } = usePasswordVisibility()

  return (
    <div className="absolute inset-y-0 right-1.5 flex items-center">
      <Button
        className="text-muted-foreground"
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  )
}
