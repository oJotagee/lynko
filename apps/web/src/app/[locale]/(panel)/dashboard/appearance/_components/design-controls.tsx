'use client'

import type { UseFormReturn } from 'react-hook-form'

import type { PageAppearance } from '@/app/[locale]/_components/appearance-schema'
import { type BackgroundImageProps, BackgroundSection } from './sections/background'
import { ButtonsSection } from './sections/buttons'
import { SocialIconsSection } from './sections/social-icons'
import { ThemesSection } from './sections/themes'
import { TypographySection } from './sections/typography'

interface DesignControlsProps extends BackgroundImageProps {
  form: UseFormReturn<PageAppearance>
}

export function DesignControls({ form, imageUrl, onImageChange }: DesignControlsProps) {
  return (
    <div className="space-y-8">
      <ThemesSection form={form} />
      <BackgroundSection form={form} imageUrl={imageUrl} onImageChange={onImageChange} />
      <TypographySection form={form} />
      <ButtonsSection form={form} />
      <SocialIconsSection form={form} />
      <p className="text-xs leading-relaxed text-muted-foreground">
        Escolha cores com bom contraste. Salve para aplicar as mudanças à página.
      </p>
    </div>
  )
}
