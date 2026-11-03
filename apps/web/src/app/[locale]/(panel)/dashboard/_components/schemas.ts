import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { type ProfileSchemaData, profileSchema } from './profile-schema'

export { profileSchema, themeSchema } from './profile-schema'
export type { ProfileSchemaData } from './profile-schema'

export function useProfileSchema(profile: ProfileSchemaData) {
  return useForm<ProfileSchemaData>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile,
    mode: 'onChange',
  })
}
