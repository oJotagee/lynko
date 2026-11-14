import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { type LinkFormData, linkFormSchema } from './link-schema'

export type { LinkFormData, LinkSchemaData } from './link-schema'
export { linkFormSchema, linkSchema } from './link-schema'

export function useLinkSchema(defaultValues: LinkFormData) {
  return useForm<LinkFormData>({ resolver: zodResolver(linkFormSchema), defaultValues })
}
