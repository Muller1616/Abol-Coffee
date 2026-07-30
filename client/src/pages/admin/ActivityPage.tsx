import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Activity, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ActivityFeedItem } from '@/features/activity/ActivityFeedItem'
import {
  bulkDeleteActivities,
  deleteActivity,
  fetchActivities,
  type AdminActivity,
} from '@/features/activity/api'
import {
  ACTIVITY_DATE_PRESETS,
  resolveActivityDateRange,
  type ActivityDatePreset,
} from '@/features/activity/date-range'
import {
  ACTIVITY_ACTION_FILTERS,
  ACTIVITY_ENTITY_FILTERS,
  getActivityDisplayTitle,
} from '@/features/activity/meta'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { getApiErrorMessage } from '@/lib/api'
import { formatActivityDayLabel, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const filterSelectClassName =
  'h-12 w-full min-w-0 max-w-full cursor-pointer appearance-none rounded-2xl border border-border/80 bg-[#f8fafc] bg-[length:1rem] bg-[right_0.85rem_center] bg-no-repeat px-4 pr-10 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10'

const selectChevronStyle = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
} as const

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
  const queryClient = useQueryClient()
  const { pushToast } = useToast()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [action, setAction] = useState('')
  const [entity, setEntity] = useState('')
  const [datePreset, setDatePreset] = useState<ActivityDatePreset>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState<AdminActivity | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [details, setDetails] = useState<AdminActivity | null>(null)

  const dateRange = useMemo(
    () => resolveActivityDateRange(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
    setSelectedIds([])
  }, [action, entity, datePreset, customFrom, customTo, debouncedSearch])

  const listQuery = useQuery({
    queryKey: [
      'admin',
      'activities',
      { page, debouncedSearch, action, entity, datePreset, customFrom, customTo },
    ],
    queryFn: () =>
      fetchActivities({
        page,
        pageSize: 20,
        search: debouncedSearch,
        action: action || undefined,
        entity: entity || undefined,
        from: dateRange.from,
        to: dateRange.to,
      }),
  })

  const items = listQuery.data?.items ?? []
  const pagination = listQuery.data?.pagination
  const groups = useMemo(() => groupByDay(items), [items])
  const pageIds = items.map((item) => item.id)
  const allVisibleSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id))
  const someVisibleSelected = pageIds.some((id) => selectedIds.includes(id))

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'activities'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
    ])
  }

  const adjustPageIfEmptied = (remainingOnPage: number) => {
    if (remainingOnPage === 0 && page > 1) {
      setPage((current) => Math.max(1, current - 1))
    }
  }

  const deleteMutation = useMutation({
    mutationFn: deleteActivity,
    onSuccess: async () => {
      const remainingOnPage = Math.max(0, items.length - 1)
      const id = deleting?.id
      setDeleting(null)
      if (id) setSelectedIds((current) => current.filter((value) => value !== id))
      await invalidate()
      adjustPageIfEmptied(remainingOnPage)
      pushToast('Activity deleted successfully.')
    },
    onError: (error) =>
      pushToast(getApiErrorMessage(error, 'Unable to delete activity.'), 'error'),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteActivities,
    onSuccess: async (result) => {
      const remainingOnPage = items.filter((item) => !selectedIds.includes(item.id)).length
      setBulkOpen(false)
      setSelectedIds([])
      await invalidate()
      adjustPageIfEmptied(remainingOnPage)
      pushToast(
        result.deletedCount === 1
          ? 'Activity deleted successfully.'
          : `${result.deletedCount} activities deleted successfully.`,
      )
    },
    onError: (error) =>
      pushToast(getApiErrorMessage(error, 'Unable to delete activity.'), 'error'),
  })

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !pageIds.includes(id)))
      return
    }
    setSelectedIds((current) => [...new Set([...current, ...pageIds])])
  }

  const pending = deleteMutation.isPending || bulkDeleteMutation.isPending

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Audit</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
          Activity history
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Search, filter, and clean up administrative history. Deleting a log never undoes the
          original business action.
        </p>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-border/80 bg-white/90 p-4 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-5"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, description..."
              className="h-12 w-full min-w-0 rounded-2xl border border-border/80 bg-[#f8fafc] pr-4 pl-11 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <select
            value={entity}
            onChange={(event) => setEntity(event.target.value)}
            className={filterSelectClassName}
            style={selectChevronStyle}
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
            className={filterSelectClassName}
            style={selectChevronStyle}
          >
            {ACTIVITY_ACTION_FILTERS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={datePreset}
            onChange={(event) => setDatePreset(event.target.value as ActivityDatePreset)}
            className={filterSelectClassName}
            style={selectChevronStyle}
          >
            {ACTIVITY_DATE_PRESETS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {datePreset === 'custom' ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-muted-foreground">From</span>
              <input
                type="date"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                className="h-12 w-full rounded-2xl border border-border/80 bg-[#f8fafc] px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-muted-foreground">To</span>
              <input
                type="date"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                className="h-12 w-full rounded-2xl border border-border/80 bg-[#f8fafc] px-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </label>
          </div>
        ) : null}

        {selectedIds.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-foreground">
              {selectedIds.length} activit{selectedIds.length === 1 ? 'y' : 'ies'} selected
            </p>
            <div className="flex flex-row items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-w-0 flex-1 border-border/80 bg-white shadow-sm sm:flex-none"
                onClick={() => setSelectedIds([])}
                disabled={pending}
              >
                <X className="size-4 shrink-0" aria-hidden />
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                className="min-w-0 flex-1 sm:flex-none"
                onClick={() => setBulkOpen(true)}
                disabled={pending}
              >
                <Trash2 className="size-4 shrink-0" aria-hidden />
                Delete
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-5">
          {listQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-2xl" />
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
              <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate = someVisibleSelected && !allVisibleSelected
                      }
                    }}
                    onChange={toggleSelectAllVisible}
                    className="h-5 w-5 cursor-pointer rounded-md border border-border accent-primary"
                    aria-label="Select all visible activities"
                  />
                  Select all on this page
                </label>
                <p className="text-xs text-muted-foreground">
                  {pagination?.total ?? items.length} total
                </p>
              </div>

              {groups.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    {group.label}
                  </p>
                  <ul className="space-y-2">
                    {group.items.map((activity) => (
                      <ActivityFeedItem
                        key={activity.id}
                        activity={activity}
                        selectable
                        selected={selectedIds.includes(activity.id)}
                        onSelectedChange={(checked) => {
                          setSelectedIds((current) =>
                            checked
                              ? [...new Set([...current, activity.id])]
                              : current.filter((id) => id !== activity.id),
                          )
                        }}
                        onViewDetails={setDetails}
                        onDelete={setDeleting}
                      />
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

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleting(null)
        }}
        title="Delete Activity"
        description="You are about to permanently remove this activity from your history."
        warning={
          <>
            <p className="font-semibold">This action cannot be undone.</p>
            <p className="mt-1">
              Deleting this activity only removes the history record. It does not undo or change
              the original action
              {deleting ? ` (“${getActivityDisplayTitle(deleting)}”).` : '.'}
            </p>
          </>
        }
        confirmLabel="Delete Activity"
        cancelLabel="Cancel"
        tone="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleting) return
          deleteMutation.mutate(deleting.id)
        }}
      />

      <ConfirmDialog
        open={bulkOpen}
        onOpenChange={(open) => {
          if (!open && !bulkDeleteMutation.isPending) setBulkOpen(false)
        }}
        title="Delete Selected Activities"
        description={`You are about to permanently delete ${selectedIds.length} selected activity record${selectedIds.length === 1 ? '' : 's'}.`}
        warning={
          <>
            <p className="font-semibold">This action cannot be undone.</p>
            <p className="mt-1">
              Only history records are removed. Categories, menu items, prices, and restaurant
              settings are not affected.
            </p>
          </>
        }
        confirmLabel="Delete Selected"
        cancelLabel="Cancel"
        tone="danger"
        loading={bulkDeleteMutation.isPending}
        onConfirm={() => {
          if (selectedIds.length === 0) return
          bulkDeleteMutation.mutate(selectedIds)
        }}
      />

      <Dialog
        open={Boolean(details)}
        onOpenChange={(open) => {
          if (!open) setDetails(null)
        }}
      >
        <DialogContent
          title="Activity details"
          description="Full details for this administrative event."
          className="sm:max-w-lg"
        >
          {details ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Title
                </p>
                <p className="mt-1 text-base font-semibold">{getActivityDisplayTitle(details)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Description
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{details.summary}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailCell label="Type" value={details.type} />
                <DetailCell label="Action" value={details.action} />
                <DetailCell label="Entity" value={details.entity.replaceAll('_', ' ')} />
                <DetailCell label="When" value={formatDateTime(details.createdAt)} />
              </div>
              <div className="flex justify-end pt-1">
                <Button type="button" variant="outline" onClick={() => setDetails(null)}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn('rounded-2xl border border-border/70 bg-[#f8fafc] px-3.5 py-3')}>
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium break-all text-foreground">{value}</p>
    </div>
  )
}
