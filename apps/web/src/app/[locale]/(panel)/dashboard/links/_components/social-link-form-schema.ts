import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import {
  type SocialLinkData,
  socialLinkSchema,
} from '@/app/[locale]/_components/social-links/social-link-schema'

export function useSocialLinkSchema(link: SocialLinkData) {
  return useForm<SocialLinkData>({
    resolver: zodResolver(socialLinkSchema),
    defaultValues: link,
    mode: 'onTouched',
  })
}
