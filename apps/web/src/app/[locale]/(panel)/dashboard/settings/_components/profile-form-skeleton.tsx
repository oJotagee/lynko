import { Skeleton } from '@/components/ui/skeleton'

const FIELDS = ['Nome de exibição', 'Nome de usuário']

export function FormSkeleton() {
  return (
    <div className="max-w-xl space-y-6">
      <div className="space-y-4">
        <p className="text-sm font-medium">Foto</p>
        <div className="flex items-center gap-4">
          <Skeleton className="size-20 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </div>
      {FIELDS.map((label) => (
        <div key={label} className="space-y-2">
          <p className="text-sm font-medium">{label}</p>
          <Skeleton className="h-11 w-full rounded-[10px]" />
        </div>
      ))}
      <div className="space-y-2">
        <p className="text-sm font-medium">Biografia</p>
        <Skeleton className="h-16 w-full rounded-[10px]" />
      </div>
      <div className="flex items-center gap-4 rounded-lg border border-border p-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        <Skeleton className="h-5 w-9 rounded-full" />
      </div>
      <Skeleton className="h-11 w-32 rounded-[10px]" />
    </div>
  )
}
