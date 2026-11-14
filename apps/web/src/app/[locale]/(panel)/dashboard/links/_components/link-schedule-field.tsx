'use client'

import { CalendarIcon, X } from 'lucide-react'
import { useState } from 'react'
import { ptBR } from 'react-day-picker/locale'
import { type Control, Controller } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { LinkFormData } from './link-schema'

const DEFAULT_TIME = '09:00'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

function toTime(date: Date | null) {
  if (!date) return ''

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function withTime(day: Date, time: string) {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)

  const next = new Date(day)

  next.setHours(hours, minutes, 0, 0)

  return next
}

interface LinkScheduleFieldProps {
  control: Control<LinkFormData>
  name: 'startsAt' | 'endsAt'
  label: string
}

export function LinkScheduleField({ control, name, label }: LinkScheduleFieldProps) {
  const [open, setOpen] = useState(false)

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`${name}-date`}>{label}</FieldLabel>
          <div className="flex gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger
                render={
                  <Button
                    id={`${name}-date`}
                    type="button"
                    variant="outline"
                    className="min-h-11 flex-1 justify-start font-normal"
                    aria-invalid={fieldState.invalid}
                  />
                }
              >
                <CalendarIcon className="size-4" />
                {field.value ? dateFormat.format(field.value) : 'Escolher data'}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  locale={ptBR}
                  selected={field.value ?? undefined}
                  onSelect={(day) => {
                    if (!day) return

                    field.onChange(withTime(day, toTime(field.value) || DEFAULT_TIME))

                    setOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
            <Input
              type="time"
              aria-label={`Hora de ${label.toLowerCase()}`}
              className="min-h-11 w-28"
              value={toTime(field.value)}
              onChange={(event) => {
                if (!event.target.value) return

                field.onChange(withTime(field.value ?? new Date(), event.target.value))
              }}
            />
            {field.value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label={`Limpar ${label.toLowerCase()}`}
                onClick={() => field.onChange(null)}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
