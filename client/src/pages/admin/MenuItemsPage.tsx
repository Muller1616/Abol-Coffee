import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowUp,
  ImageOff,
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { fetchCategories } from '@/features/categories/api'
import {
  createMenuItem,
  deleteMenuItem,
  fetchAllMenuItemsInCategory,
  fetchMenuItems,
  removeMenuItemImage,
  reorderMenuItems,
  updateMenuItem,
  updateMenuItemAvailability,
  uploadMenuItemImage,
  type MenuItem,
} from '@/features/menu-items/api'
import {
  MenuItemFormDialog,
  type MenuItemFormSubmitPayload,
} from '@/features/menu-items/MenuItemFormDialog'
import { getApiErrorMessage } from '@/lib/api'
import { resolveMediaUrl } from '@/lib/format'
import { cn } from '@/lib/utils'

export function MenuItemsPage() {
  const queryClient = useQueryClient()
  const { pushToast } = useToast()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [availability, setAvailability] = useState<'all' | 'available' | 'hidden'>('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [deleting, setDeleting] = useState<MenuItem | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, categoryId, availability])

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: fetchCategories,
  })

  const listQuery = useQuery({
    queryKey: ['admin', 'menu-items', { debouncedSearch, categoryId, availability, page }],
    queryFn: () =>
      fetchMenuItems({
        search: debouncedSearch || undefined,
        categoryId: categoryId || undefined,
        isAvailable:
          availability === 'all' ? undefined : availability === 'available' ? true : false,
        page,
        pageSize: 12,
      }),
  })

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'menu-items'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'activities'] }),
    ])
  }

  const saveMutation = useMutation({
    mutationFn: async ({
      item,
      payload,
    }: {
      item: MenuItem | null
      payload: MenuItemFormSubmitPayload
    }) => {
      const body = {
        categoryId: payload.values.categoryId,
        name: payload.values.name,
        description: payload.values.description ?? '',
        price: payload.values.price,
        isAvailable: payload.values.isAvailable,
      }

      let saved: MenuItem

      if (item) {
        saved = await updateMenuItem(item.id, body)

        if (payload.removeImage && item.image) {
          saved = await removeMenuItemImage(item.id)
        }
        if (payload.imageFile) {
          saved = await uploadMenuItemImage(item.id, payload.imageFile)
        }
      } else {
        const siblings = await fetchAllMenuItemsInCategory(body.categoryId)
        const nextOrder =
          siblings.length === 0
            ? 0
            : Math.max(...siblings.map((entry) => entry.displayOrder)) + 1

        saved = await createMenuItem({
          ...body,
          displayOrder: nextOrder,
        })

        if (payload.imageFile) {
          saved = await uploadMenuItemImage(saved.id, payload.imageFile)
        }
      }

      return saved
    },
    onSuccess: async (_, variables) => {
      await invalidate()
      setFormOpen(false)
      setEditing(null)
      pushToast(
        variables.item ? 'Menu item updated successfully' : 'Menu item created successfully',
      )
    },
    // Errors for the dialog form are handled by handleFormMutationError.
  })

  const availabilityMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      updateMenuItemAvailability(id, isAvailable),
    onSuccess: async (_, variables) => {
      await invalidate()
      pushToast(variables.isAvailable ? 'Item marked available' : 'Item hidden from menu')
    },
    onError: (error) =>
      pushToast(getApiErrorMessage(error, 'Could not update availability'), 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: async () => {
      await invalidate()
      setDeleting(null)
      pushToast('Menu item deleted successfully')
    },
    onError: (error) =>
      pushToast(getApiErrorMessage(error, 'Unable to delete menu item.'), 'error'),
  })

  const reorderMutation = useMutation({
    mutationFn: reorderMenuItems,
    onSuccess: async () => {
      await invalidate()
      pushToast('Item order updated')
    },
    onError: (error) => pushToast(getApiErrorMessage(error, 'Could not reorder items'), 'error'),
  })

  const categories = categoriesQuery.data ?? []
  const items = listQuery.data?.items ?? []
  const pagination = listQuery.data?.pagination

  const summary = useMemo(() => {
    const total = pagination?.total ?? 0
    return {
      total,
      pageLabel: pagination
        ? `Page ${pagination.page} of ${Math.max(pagination.totalPages, 1)}`
        : '—',
    }
  }, [pagination])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const moveItem = async (item: MenuItem, direction: 'up' | 'down') => {
    // Always reorder within the item's category using the full category list so
    // filters, pagination, and mixed-category views cannot corrupt displayOrder.
    const siblings = await fetchAllMenuItemsInCategory(item.categoryId)
    const index = siblings.findIndex((entry) => entry.id === item.id)
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) {
      pushToast(
        direction === 'up'
          ? 'Already at the top of this category'
          : 'Already at the bottom of this category',
        'error',
      )
      return
    }

    const swapped = [...siblings]
    const current = swapped[index]
    const target = swapped[targetIndex]
    if (!current || !target) return
    swapped[index] = target
    swapped[targetIndex] = current

    await reorderMutation.mutateAsync(
      swapped.map((entry, displayOrder) => ({ id: entry.id, displayOrder })),
    )
  }

  if (categoriesQuery.isSuccess && categories.length === 0) {
    return (
      <div className="space-y-6">
        <Header onCreate={openCreate} disableCreate />
        <EmptyState
          icon={UtensilsCrossed}
          title="Create a category first"
          description="Menu items must belong to a category before you can add them."
          action={
            <Link to="/admin/categories" className={cn(buttonVariants())}>
              Go to categories
            </Link>
          }
          className="min-h-[420px] bg-white/80"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header onCreate={openCreate} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[24px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)]">
          <p className="text-sm text-muted-foreground">Matching items</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{summary.total}</p>
        </div>
        <div className="rounded-[24px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:col-span-2">
          <p className="text-sm text-muted-foreground">Browse</p>
          <p className="mt-1 text-lg font-semibold tracking-tight">{summary.pageLabel}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Currency is fixed to Ethiopian Birr (ETB) across the menu.
          </p>
        </div>
      </div>

      <div className="rounded-[28px] border border-border/80 bg-white/90 p-4 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-5">
        <div className="mb-5 grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or description..."
              className="h-12 w-full cursor-text rounded-2xl border border-border/80 bg-[#f8fafc] pr-4 pl-11 text-sm outline-none transition-all duration-200 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="h-12 cursor-pointer rounded-2xl border border-border/80 bg-[#f8fafc] px-4 text-sm outline-none transition-all duration-200 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={availability}
            onChange={(event) =>
              setAvailability(event.target.value as 'all' | 'available' | 'hidden')
            }
            className="h-12 cursor-pointer rounded-2xl border border-border/80 bg-[#f8fafc] px-4 text-sm outline-none transition-all duration-200 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          >
            <option value="all">All availability</option>
            <option value="available">Available only</option>
            <option value="hidden">Hidden only</option>
          </select>
        </div>

        {listQuery.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-40" />
            ))}
          </div>
        ) : listQuery.isError ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="Unable to load menu items"
            description={getApiErrorMessage(listQuery.error, 'Please refresh and try again.')}
            className="border-none bg-[#f8fafc]"
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="No menu items found"
            description="Create your first item or adjust filters to see results."
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add menu item
              </Button>
            }
            className="border-none bg-[#f8fafc]"
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {items.map((item, index) => {
              const imageUrl = resolveMediaUrl(item.image)
              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="overflow-hidden rounded-2xl border border-border/70 bg-[#f8fafc] transition hover:border-primary/20 hover:bg-white"
                >
                  <div className="flex gap-3 p-4 sm:gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-border sm:h-24 sm:w-24">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                          <ImageOff className="h-4 w-4" />
                          <span className="text-[10px] font-medium">No image</span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold">{item.name}</h2>
                        <Badge variant={item.isAvailable ? 'success' : 'muted'}>
                          {item.isAvailable ? 'Available' : 'Hidden'}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {item.description || 'No description'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-primary">
                          {item.priceFormatted} ETB
                        </span>
                        <span className="truncate text-muted-foreground">· {item.category.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-border/60 px-4 py-3">
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-border">
                      <span className="text-sm font-medium text-muted-foreground">Available</span>
                      <Switch
                        checked={item.isAvailable}
                        disabled={availabilityMutation.isPending}
                        onCheckedChange={(checked) =>
                          availabilityMutation.mutate({ id: item.id, isAvailable: checked })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={reorderMutation.isPending}
                        onClick={() => void moveItem(item, 'up')}
                        aria-label={`Move ${item.name} up`}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={reorderMutation.isPending}
                        onClick={() => void moveItem(item, 'down')}
                        aria-label={`Move ${item.name} down`}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="col-span-2 h-11 sm:col-span-1 sm:min-w-24"
                        onClick={() => {
                          setEditing(item)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="col-span-2 h-11 cursor-pointer border-danger/30 text-danger hover:-translate-y-0.5 hover:border-danger hover:bg-danger/10 hover:text-danger sm:col-span-1 sm:min-w-24"
                        onClick={() => setDeleting(item)}
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </motion.li>
              )
            })}
          </ul>
        )}

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
            <p className="col-span-2 order-first text-center text-sm text-muted-foreground sm:order-none sm:col-span-1">
              {summary.pageLabel}
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
        ) : null}
      </div>

      <MenuItemFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        item={editing}
        categories={categories}
        loading={saveMutation.isPending}
        onSubmit={async (payload) => {
          await saveMutation.mutateAsync({ item: editing, payload })
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleting(null)
        }}
        title="Delete menu item"
        description={
          deleting
            ? `You are about to permanently delete "${deleting.name}".`
            : 'You are about to permanently delete this menu item.'
        }
        warning={
          <>
            <p className="font-semibold">This action cannot be undone.</p>
            <p className="mt-1">
              The item will be removed from your catalog and will no longer appear on the public QR
              menu.
            </p>
          </>
        }
        confirmLabel="Delete menu item"
        cancelLabel="Cancel"
        tone="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleting) return
          deleteMutation.mutate(deleting.id)
        }}
      />
    </div>
  )
}

function Header({
  onCreate,
  disableCreate = false,
}: {
  onCreate: () => void
  disableCreate?: boolean
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">Catalog</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
          Menu items
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Manage prices, photos, and availability. Changes appear on the public QR menu immediately.
        </p>
      </div>
      <Button onClick={onCreate} disabled={disableCreate} className="h-11 w-full sm:w-auto">
        <Plus className="h-4 w-4" />
        Add menu item
      </Button>
    </div>
  )
}
