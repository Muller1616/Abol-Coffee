import type { AdminActivity } from '@/features/activity/api'
import {
  getActivityDisplayTitle,
  getActivityToneClass,
  getActivityVisual,
} from '@/features/activity/meta'
import { formatDateTime, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

type ActivityFeedItemProps = {
  activity: AdminActivity
  compact?: boolean
}

export function ActivityFeedItem({ activity, compact = false }: ActivityFeedItemProps) {
  const visual = getActivityVisual(activity.type, activity.action)
  const Icon = visual.icon
  const title = getActivityDisplayTitle(activity)

  return (
    <li
      className={cn(
        'group flex items-start gap-3 rounded-2xl transition-colors',
        compact
          ? 'px-1 py-2.5'
          : 'border border-border/60 bg-background px-3.5 py-3 hover:border-primary/20 hover:bg-white',
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1',
          getActivityToneClass(visual.tone),
        )}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold tracking-tight text-foreground">{title}</p>
          <time
            dateTime={activity.createdAt}
            title={formatDateTime(activity.createdAt)}
            className="shrink-0 text-[11px] font-medium text-muted-foreground"
          >
            {formatRelativeTime(activity.createdAt)}
          </time>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {activity.summary}
        </p>
      </div>
    </li>
  )
}
