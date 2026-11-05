'use client'

import { Loader2 } from 'lucide-react'
import { Controller, useWatch } from 'react-hook-form'
import type {
  SocialLinkData,
  SocialPlatform,
} from '@/app/[locale]/_components/social-links/social-link-schema'
import { socialPlatforms } from '@/app/[locale]/_components/social-links/social-platforms'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { portalTheme } from '../../_components/portal-theme'
import { useSocialLinkSchema } from './social-link-form-schema'

interface SocialLinkDialogProps {
  link?: SocialLinkData
  platforms: SocialPlatform[]
  isPending: boolean
  onSubmit: (link: SocialLinkData) => void
  onClose: () => void
}

export function SocialLinkDialog({
  link,
  platforms,
  isPending,
  onSubmit,
  onClose,
}: SocialLinkDialogProps) {
  const form = useSocialLinkSchema(
    link ?? { platform: platforms[0] ?? 'instagram', url: '', isActive: true },
  )

  const platform = useWatch({ control: form.control, name: 'platform' })

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isPending) onClose()
      }}
    >
      <DialogContent className={portalTheme} showCloseButton={false}>
        <DialogTitle>
          {link ? `Editar ${socialPlatforms[link.platform].name}` : 'Adicionar rede social'}
        </DialogTitle>
        <DialogDescription>
          O ícone aparece abaixo do seu nome na página. Se ela estiver publicada, a alteração fica
          visível na hora.
        </DialogDescription>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Controller
            name="platform"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="social-platform">Rede social</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    if (value) field.onChange(value)
                  }}
                  disabled={!!link}
                >
                  <SelectTrigger id="social-platform" className="min-h-11 w-full">
                    <SelectValue>{socialPlatforms[field.value].name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((item) => (
                      <SelectItem key={item} value={item}>
                        {socialPlatforms[item].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Controller
            name="url"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  {platform === 'whatsapp' ? 'Número ou URL' : 'URL do perfil'}
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  inputMode={platform === 'whatsapp' ? 'tel' : 'url'}
                  placeholder={socialPlatforms[platform].placeholder}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" disabled={isPending} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Salvar rede social
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
