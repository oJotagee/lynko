import { Skeleton } from '@/components/ui/skeleton'
import { FormSkeleton } from './profile-form-skeleton'

export function SettingsSkeleton() {
  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex gap-5 border-b border-border pb-4">
        {[1, 2, 3].map((id) => (
          <Skeleton key={id} className="h-4 w-20" />
        ))}
      </div>
      <FormSkeleton />
      <Skeleton className="h-36 w-full rounded-xl" />
    </div>
  )
}
