import { Skeleton } from '@/components/ui/skeleton'

export function RouteFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full max-w-xl" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}
