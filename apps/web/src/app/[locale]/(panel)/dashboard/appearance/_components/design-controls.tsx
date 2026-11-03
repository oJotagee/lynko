'use client'

import { Check } from 'lucide-react'

import { type DashboardAppearance, themes } from '../../_components/dashboard-data'
import { Field, FieldLabel } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DesignControlsProps {
  appearance: DashboardAppearance
  onChange: (appearance: Partial<DashboardAppearance>) => void
}

export function DesignControls({ appearance, onChange: change }: DesignControlsProps) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-lg font-bold">Escolha seu clima</h2>
        <div className="grid grid-cols-2 gap-3">
          {themes.map((theme) => (
            <Button
              key={theme.id}
              variant="outline"
              aria-pressed={appearance.theme === theme.id}
              className={
                'relative h-auto flex-col items-start gap-3 bg-card p-3 ' +
                (appearance.theme === theme.id ? 'ring-2 ring-ring' : '')
              }
              onClick={() => change({ ...theme, theme: theme.id })}
            >
              <span
                className="flex h-20 w-full items-center justify-center rounded-lg"
                style={{ background: theme.background }}
              >
                <span
                  className="h-3 w-14 rounded-full border"
                  style={{ background: theme.button, borderColor: theme.foreground }}
                />
              </span>
              <span className="text-xs">{theme.name}</span>
              {appearance.theme === theme.id && (
                <Check className="absolute right-3 bottom-3 size-4" />
              )}
            </Button>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-base font-semibold">Formato dos botões</h2>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['none', 'Reto'],
              ['small', 'Suave'],
              ['medium', 'Arredondado'],
              ['full', 'Redondo'],
            ] as const
          ).map(([radius, label]) => (
            <Button
              key={radius}
              variant={appearance.radius === radius ? 'default' : 'outline'}
              aria-pressed={appearance.radius === radius}
              className="min-h-11 px-4"
              onClick={() => change({ radius })}
            >
              {label}
            </Button>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-base font-semibold">Estilo dos botões</h2>
        <div className="flex gap-2">
          {(
            [
              ['filled', 'Preenchido'],
              ['outline', 'Contorno'],
            ] as const
          ).map(([buttonStyle, label]) => (
            <Button
              key={buttonStyle}
              variant={appearance.buttonStyle === buttonStyle ? 'default' : 'outline'}
              aria-pressed={appearance.buttonStyle === buttonStyle}
              className="min-h-11 px-4"
              onClick={() => change({ buttonStyle })}
            >
              {label}
            </Button>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-base font-semibold">Ajuste as cores</h2>
        <div className="space-y-4">
          {(
            [
              ['background', 'Fundo'],
              ['foreground', 'Texto'],
              ['button', 'Botões'],
              ['buttonText', 'Texto dos botões'],
            ] as const
          ).map(([name, label]) => (
            <Field key={name}>
              <div className="flex items-center justify-between gap-4">
                <FieldLabel htmlFor={`color-${name}`}>{label}</FieldLabel>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground uppercase">
                    {appearance[name]}
                  </span>
                  <Input
                    id={`color-${name}`}
                    type="color"
                    value={appearance[name]}
                    className="size-11 cursor-pointer p-1"
                    onChange={(event) => change({ [name]: event.target.value, theme: 'custom' })}
                  />
                </div>
              </div>
            </Field>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Escolha cores com bom contraste. Salve para aplicar as mudanças à página.
        </p>
      </section>
    </div>
  )
}
