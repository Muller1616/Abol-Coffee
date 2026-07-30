import { Eye, Trash2 } from 'lucide-react'
import { ActionMenu } from '@/components/ui/action-menu'
import { Badge } from '@/components/ui/badge'
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
  selectable?: boolean
  selected?: boolean
  onSelectedChange?: (selected: boolean) => void
  onViewDetails?: (activity: AdminActivity) => void
  onDelete?: (activity: AdminActivity) => void
}

export function ActivityFeedItem({
  activity,
  compact = false,
  selectable = false,
  selected = false,
  onSelectedChange,
  onViewDetails,
  onDelete,
}: ActivityFeedItemProps) {
  const visual = getActivityVisual(activity.type, activity.action)
  const Icon = visual.icon
  const title = getActivityDisplayTitle(activity)
  const showActions = Boolean(onViewDetails || onDelete)

  return (
    <li
      className={cn(
        'group flex items-start gap-3 rounded-2xl transition-colors',
        compact
          ? 'px-1 py-2.5'
          : cn(
              'border bg-background px-3.5 py-3',
              selected
                ? 'border-primary/35 bg-primary/[0.03]'
                : 'border-border/60 hover:border-primary/20 hover:bg-white',
            ),
      )}
    >
      {selectable ? (
        <label className="mt-1.5 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => onSelectedChange?.(event.target.checked)}
            aria-label={`Select ${title}`}
            className="h-5 w-5 cursor-pointer rounded-md border border-border accent-primary"
          />
        </label>
      ) : null}

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
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold tracking-tight text-foreground">{title}</p>
              {!compact ? (
                <Badge variant="muted" className="text-[10px] uppercase tracking-wide">
                  {activity.entity.replaceAll('_', ' ')}
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {activity.summary}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <time dateTime={activity.createdAt} title={formatDateTime(activity.createdAt)}>
                {formatRelativeTime(activity.createdAt)}
              </time>
              {!compact ? (
                <span className="tabular-nums">{formatDateTime(activity.createdAt)}</span>
              ) : null}
            </div>
          </div>

          {showActions ? (
            <ActionMenu
              label={`Actions for ${title}`}
              items={[
                ...(onViewDetails
                  ? [
                      {
                        id: 'view',
                        label: 'View details',
                        icon: <Eye className="h-4 w-4" />,
                        onSelect: () => onViewDetails(activity),
                      },
                    ]
                  : []),
                ...(onDelete
                  ? [
                      {
                        id: 'delete',
                        label: 'Delete activity',
                        tone: 'danger' as const,
                        icon: <Trash2 className="h-4 w-4" />,
                        onSelect: () => onDelete(activity),
                      },
                    ]
                  : []),
              ]}
            />
          ) : (
            <time
              dateTime={activity.createdAt}
              title={formatDateTime(activity.createdAt)}
              className="shrink-0 text-[11px] font-medium text-muted-foreground"
            >
              {formatRelativeTime(activity.createdAt)}
            </time>
          )}
        </div>
      </div>
    </li>
  )
}
