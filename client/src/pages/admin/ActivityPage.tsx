import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Activity, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ActivityFeedItem } from '@/features/activity/ActivityFeedItem'
import { fetchActivities, type AdminActivity } from '@/features/activity/api'
import {
  ACTIVITY_ACTION_FILTERS,
  ACTIVITY_ENTITY_FILTERS,
} from '@/features/activity/meta'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiErrorMessage } from '@/lib/api'
import { formatActivityDayLabel } from '@/lib/format'

function groupByDay(items: AdminActivity[]) {
  const groups: Array<{ label: string; items: AdminActivity[] }> = []
  const indexByLabel = new Map<string, number>()

  for (const item of items) {
    const label = formatActivityDayLabel(item.createdAt)
    const existing = indexByLabel.get(label)
    if (existing === undefined) {
      indexByLabel.set(label, groups.length)
      groups.push({ label, items: [item] })
    } else {
      groups[existing]?.items.push(item)
    }
  }

  return groups
}

export function ActivityPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [action, setAction] = useState('')
  const [entity, setEntity] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [action, entity])

  const listQuery = useQuery({
    queryKey: ['admin', 'activities', { page, debouncedSearch, action, entity }],
    queryFn: () =>
      fetchActivities({
        page,
        pageSize: 20,
        search: debouncedSearch,
        action: action || undefined,
        entity: entity || undefined,
      }),
  })

  const items = listQuery.data?.items ?? []
  const pagination = listQuery.data?.pagination
  const groups = useMemo(() => groupByDay(items), [items])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Audit</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
          Activity history
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Search and filter every administrative action across your restaurant console.
        </p>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-border/80 bg-white/90 p-4 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-5"
      >
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search activity..."
              className="h-12 w-full rounded-2xl border border-border/80 bg-[#f8fafc] pr-4 pl-11 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <select
            value={entity}
            onChange={(event) => setEntity(event.target.value)}
            className="h-12 cursor-pointer rounded-2xl border border-border/80 bg-[#f8fafc] px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          >
            {ACTIVITY_ENTITY_FILTERS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={action}
            onChange={(event) => setAction(event.target.value)}
            className="h-12 cursor-pointer rounded-2xl border border-border/80 bg-[#f8fafc] px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          >
            {ACTIVITY_ACTION_FILTERS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5">
          {listQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : listQuery.isError ? (
            <EmptyState
              icon={Activity}
              title="Unable to load activity"
              description={getApiErrorMessage(listQuery.error, 'Please refresh and try again.')}
              className="border-none bg-[#f8fafc]"
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity found"
              description="Try adjusting your search or filters."
              className="border-none bg-[#f8fafc]"
            />
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    {group.label}
                  </p>
                  <ul className="space-y-2">
                    {group.items.map((activity) => (
                      <ActivityFeedItem key={activity.id} activity={activity} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-between">
            <Button
              variant="outline"
              className="h-11"
              disabled={page <= 1 || listQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <p className="col-span-2 order-first text-center text-sm text-muted-foreground sm:order-none">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} events
            </p>
            <Button
              variant="outline"
              className="h-11"
              disabled={page >= pagination.totalPages || listQuery.isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        ) : pagination ? (
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {pagination.total} event{pagination.total === 1 ? '' : 's'}
          </p>
        ) : null}
      </motion.section>
    </div>
  )
}
