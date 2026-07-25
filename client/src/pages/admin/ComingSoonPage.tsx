import { Construction } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

type ComingSoonPageProps = {
  title: string
  description: string
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Admin</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
      </div>
      <EmptyState
        icon={Construction}
        title="Premium screen coming next"
        description={description}
        className="min-h-[420px] bg-white/80"
      />
    </div>
  )
}
