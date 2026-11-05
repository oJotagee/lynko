import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { appearanceSchema, type PageAppearance } from '@/app/[locale]/_components/appearance-schema'

export function useAppearanceSchema(appearance: PageAppearance) {
  return useForm<PageAppearance>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: appearance,
  })
}
