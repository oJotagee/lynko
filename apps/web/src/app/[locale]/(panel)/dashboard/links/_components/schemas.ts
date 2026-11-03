import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { type LinkSchemaData, linkSchema } from './link-schema'

export type { LinkSchemaData } from './link-schema'
export { linkSchema } from './link-schema'

export function useLinkSchema(defaultValues: LinkSchemaData) {
  return useForm<LinkSchemaData>({ resolver: zodResolver(linkSchema), defaultValues })
}
