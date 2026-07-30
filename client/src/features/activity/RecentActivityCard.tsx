import { Activity, ArrowUpRight } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ActivityFeedItem } from '@/features/activity/ActivityFeedItem'
import type { AdminActivity } from '@/features/activity/api'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/features/auth/auth-context'
import { cn } from '@/lib/utils'

type RecentActivityCardProps = {
  activities: AdminActivity[]
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  const { restaurantSlug } = useParams()
  const { owner } = useAuth()
  const slug = restaurantSlug ?? owner?.restaurantSlug ?? ''
  const preview = activities.slice(0, 5)

  return (
    <section className="flex max-h-[420px] flex-col overflow-hidden rounded-[28px] border border-border/80 bg-white/90 shadow-[0_10px_40px_rgb(15_23_42/0.04)]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Recent activity</h2>
          <p className="text-sm text-muted-foreground">Latest menu and restaurant changes.</p>
        </div>
        <Activity className="h-4 w-4 text-primary" aria-hidden />
      </div>

      {preview.length === 0 ? (
        <div className="flex flex-1 items-center px-4 py-6">
          <EmptyState
            icon={Activity}
            title="No recent activity yet"
            description="Create categories, menu items, or update restaurant settings to see activity here."
            className="w-full border-none bg-transparent py-6"
          />
        </div>
      ) : (
        <>
          <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-4 py-2 sm:px-5">
            {preview.map((activity) => (
              <ActivityFeedItem key={activity.id} activity={activity} compact />
            ))}
          </ul>

          <div className="shrink-0 border-t border-border/70 px-4 py-3 sm:px-5">
            <Link
              to={`/${slug}/activity`}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'h-10 w-full justify-between px-3 text-sm font-semibold text-primary hover:bg-primary/5 hover:text-primary',
              )}
            >
              View all activity
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
