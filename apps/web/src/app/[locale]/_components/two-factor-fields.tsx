'use client'

import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

const SLOTS = [0, 1, 2, 3, 4, 5]

interface TwoFactorFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  autoFocus?: boolean
  label?: string
}

export function TwoFactorCodeField<T extends FieldValues>({
  control,
  name,
  autoFocus,
  label = 'Código de 6 dígitos do app autenticador',
}: TwoFactorFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className="items-center text-center">
          <FieldLabel htmlFor={field.name} className="justify-center">
            {label}
          </FieldLabel>
          <InputOTP
            id={field.name}
            containerClassName="justify-center"
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus={autoFocus}
            aria-invalid={fieldState.invalid}
          >
            <InputOTPGroup>
              {SLOTS.map((slot) => (
                <InputOTPSlot key={slot} index={slot} className="size-11 text-base" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}

export function TwoFactorPasswordField<T extends FieldValues>({
  control,
  name,
  autoFocus,
}: TwoFactorFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>Sua senha</FieldLabel>
          <Input
            {...field}
            id={field.name}
            type="password"
            autoComplete="current-password"
            autoFocus={autoFocus}
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}

export function TwoFactorRecoveryCodeField<T extends FieldValues>({
  control,
  name,
  autoFocus,
  label = 'Código de recuperação',
}: TwoFactorFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            {...field}
            id={field.name}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus={autoFocus}
            placeholder="abcde-fghij"
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
