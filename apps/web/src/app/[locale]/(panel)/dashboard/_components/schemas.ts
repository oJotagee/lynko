import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { type ProfileSchemaData, profileSchema } from './profile/profile-schema'

export type { ProfileSchemaData } from './profile/profile-schema'
export { profileSchema } from './profile/profile-schema'

export function useProfileSchema(profile: ProfileSchemaData) {
  return useForm<ProfileSchemaData>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile,
    mode: 'onChange',
  })
}
