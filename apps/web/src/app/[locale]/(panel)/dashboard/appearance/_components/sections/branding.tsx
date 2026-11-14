'use client'

import { Lock } from 'lucide-react'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { Link } from '@/i18n/navigation'

interface BrandingSectionProps {
  value: boolean
  isPro: boolean
  onChange: (showBranding: boolean) => void
}

export function BrandingSection({ value, isPro, onChange }: BrandingSectionProps) {
  const locked = !isPro && value

  return (
    <section>
      <h2 className="mb-4 text-base font-semibold">Marca Lynko</h2>
      <Field orientation="horizontal" className="justify-between">
        <FieldContent>
          <FieldLabel htmlFor="show-branding">Mostrar “Feito com Lynko” na página</FieldLabel>
          {locked && (
            <FieldDescription id="show-branding-pro">
              <Lock className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />
              Esconder a marca é do plano Pro.{' '}
              <Link href="/dashboard/plans" className="underline underline-offset-2">
                Ver planos
              </Link>
            </FieldDescription>
          )}
        </FieldContent>
        <Switch
          id="show-branding"
          checked={value}
          disabled={locked}
          aria-describedby={locked ? 'show-branding-pro' : undefined}
          onCheckedChange={(checked) => onChange(checked)}
        />
      </Field>
    </section>
  )
}
