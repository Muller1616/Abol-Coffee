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
import { Link, useParams } from 'react-router-dom'
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
  fetchMenuItems,
  removeMenuItemImage,
  reorderMenuItems,
  updateMenuItem,
  updateMenuItemAvailability,
  uploadMenuItemImage,
  type MenuItem,
  type MenuItemsPage as MenuItemsPageData,
} from '@/features/menu-items/api'
import {
  MenuItemFormDialog,
  type MenuItemFormSubmitPayload,
} from '@/features/menu-items/MenuItemFormDialog'
import { SafeImage } from '@/components/ui/safe-image'
import { getApiErrorMessage } from '@/lib/api'
import { resolveMediaUrl } from '@/lib/format'
import { cn } from '@/lib/utils'

export function MenuItemsPage() {
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const { restaurantSlug } = useParams()
  const slug = restaurantSlug ?? ''

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
    placeholderData: (previous) => previous,
  })

  const invalidateRelated = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'], refetchType: 'none' })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'activities'], refetchType: 'none' })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'], refetchType: 'none' })
    void queryClient.invalidateQueries({ queryKey: ['public', 'menu'], refetchType: 'none' })
  }

  const patchMenuItemCaches = (updater: (data: MenuItemsPageData) => MenuItemsPageData) => {
    queryClient.setQueriesData<MenuItemsPageData>({ queryKey: ['admin', 'menu-items'] }, (data) =>
      data ? updater(data) : data,
    )
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

        // Return immediately for the dialog; finish image work in the background.
        if (payload.removeImage && item.image) {
          void removeMenuItemImage(item.id)
            .then((next) => {
              patchMenuItemCaches((data) => ({
                ...data,
                items: data.items.map((entry) => (entry.id === next.id ? next : entry)),
              }))
            })
            .catch((error: unknown) => {
              pushToast(getApiErrorMessage(error, 'Saved, but could not remove image'), 'error')
            })
        }
        if (payload.imageFile) {
          void uploadMenuItemImage(item.id, payload.imageFile)
            .then((next) => {
              patchMenuItemCaches((data) => ({
                ...data,
                items: data.items.map((entry) => (entry.id === next.id ? next : entry)),
              }))
            })
            .catch((error: unknown) => {
              pushToast(getApiErrorMessage(error, 'Saved, but image upload failed'), 'error')
            })
        }
      } else {
        saved = await createMenuItem(body)

        if (payload.imageFile) {
          void uploadMenuItemImage(saved.id, payload.imageFile)
            .then((next) => {
              patchMenuItemCaches((data) => ({
                ...data,
                items: data.items.map((entry) => (entry.id === next.id ? next : entry)),
              }))
            })
            .catch((error: unknown) => {
              pushToast(getApiErrorMessage(error, 'Item created, but image upload failed'), 'error')
            })
        }
      }

      return saved
    },
    onMutate: async ({ item, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'menu-items'] })
      const snapshots = queryClient.getQueriesData<MenuItemsPageData>({
        queryKey: ['admin', 'menu-items'],
      })

      if (item) {
        for (const [key, data] of snapshots) {
          if (!data) continue
          queryClient.setQueryData<MenuItemsPageData>(key, {
            ...data,
            items: data.items.map((entry) =>
              entry.id === item.id
                ? {
                    ...entry,
                    name: payload.values.name,
                    description: payload.values.description ?? '',
                    price: payload.values.price,
                    priceFormatted: String(payload.values.price),
                    isAvailable: payload.values.isAvailable,
                    categoryId: payload.values.categoryId,
                  }
                : entry,
            ),
          })
        }
      } else {
        const category = categoriesQuery.data?.find((c) => c.id === payload.values.categoryId)
        const optimistic: MenuItem = {
          id: `temp-${Date.now()}`,
          categoryId: payload.values.categoryId,
          name: payload.values.name,
          description: payload.values.description ?? '',
          price: payload.values.price,
          priceFormatted: String(payload.values.price),
          currency: 'ETB',
          image: null,
          isAvailable: payload.values.isAvailable,
          displayOrder: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          category: category
            ? { id: category.id, name: category.name, isActive: category.isActive }
            : { id: payload.values.categoryId, name: 'Category', isActive: true },
        }
        for (const [key, data] of snapshots) {
          if (!data) continue
          queryClient.setQueryData<MenuItemsPageData>(key, {
            ...data,
            items: [optimistic, ...data.items],
            pagination: {
              ...data.pagination,
              total: data.pagination.total + 1,
            },
          })
        }
      }

      setFormOpen(false)
      setEditing(null)
      return { snapshots, item }
    },
    onError: (error, variables, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key as readonly unknown[], data)
      }
      setEditing(variables.item)
      setFormOpen(true)
      pushToast(getApiErrorMessage(error, 'Could not save menu item'), 'error')
    },
    onSuccess: (saved, variables) => {
      queryClient.setQueriesData<MenuItemsPageData>({ queryKey: ['admin', 'menu-items'] }, (data) => {
        if (!data) return data
        const withoutTemp = data.items.filter((entry) => !entry.id.startsWith('temp-'))
        const exists = withoutTemp.some((entry) => entry.id === saved.id)
        return {
          ...data,
          items: exists
            ? withoutTemp.map((entry) => (entry.id === saved.id ? saved : entry))
            : [saved, ...withoutTemp],
          pagination: exists
            ? data.pagination
            : {
                ...data.pagination,
                total: withoutTemp.length + 1,
              },
        }
      })
      pushToast(
        variables.item ? 'Menu item updated successfully' : 'Menu item created successfully',
      )
      invalidateRelated()
    },
  })

  const availabilityMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      updateMenuItemAvailability(id, isAvailable),
    onMutate: async ({ id, isAvailable }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'menu-items'] })
      const snapshots = queryClient.getQueriesData<MenuItemsPageData>({
        queryKey: ['admin', 'menu-items'],
      })
      for (const [key, data] of snapshots) {
        if (!data) continue
        queryClient.setQueryData<MenuItemsPageData>(key, {
          ...data,
          items: data.items.map((entry) =>
            entry.id === id ? { ...entry, isAvailable } : entry,
          ),
        })
      }
      return { snapshots }
    },
    onError: (error, _vars, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key as readonly unknown[], data)
      }
      pushToast(getApiErrorMessage(error, 'Could not update availability'), 'error')
    },
    onSuccess: (_, variables) => {
      pushToast(variables.isAvailable ? 'Item marked available' : 'Item hidden from menu')
      invalidateRelated()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMenuItem,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'menu-items'] })
      const snapshots = queryClient.getQueriesData<MenuItemsPageData>({
        queryKey: ['admin', 'menu-items'],
      })
      for (const [key, data] of snapshots) {
        if (!data) continue
        queryClient.setQueryData<MenuItemsPageData>(key, {
          ...data,
          items: data.items.filter((entry) => entry.id !== id),
          pagination: {
            ...data.pagination,
            total: Math.max(0, data.pagination.total - 1),
          },
        })
      }
      setDeleting(null)
      return { snapshots }
    },
    onError: (error, _id, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key as readonly unknown[], data)
      }
      pushToast(getApiErrorMessage(error, 'Unable to delete menu item.'), 'error')
    },
    onSuccess: () => {
      pushToast('Menu item deleted successfully')
      invalidateRelated()
    },
  })

  const reorderMutation = useMutation({
    mutationFn: reorderMenuItems,
    onMutate: async (orderItems) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'menu-items'] })
      const snapshots = queryClient.getQueriesData<MenuItemsPageData>({
        queryKey: ['admin', 'menu-items'],
      })
      const orderMap = new Map(orderItems.map((entry) => [entry.id, entry.displayOrder]))
      for (const [key, data] of snapshots) {
        if (!data) continue
        queryClient.setQueryData<MenuItemsPageData>(key, {
          ...data,
          items: [...data.items]
            .map((entry) =>
              orderMap.has(entry.id)
                ? { ...entry, displayOrder: orderMap.get(entry.id)! }
                : entry,
            )
            .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)),
        })
      }
      return { snapshots }
    },
    onError: (error, _vars, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key as readonly unknown[], data)
      }
      pushToast(getApiErrorMessage(error, 'Could not reorder items'), 'error')
    },
    onSuccess: () => {
      pushToast('Item order updated')
      invalidateRelated()
    },
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

  const moveItem = (item: MenuItem, direction: 'up' | 'down') => {
    // Swap displayOrder with the adjacent sibling on this page — no extra fetch.
    const siblings = items
      .filter((entry) => entry.categoryId === item.categoryId)
      .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name))
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

    const current = siblings[index]
    const target = siblings[targetIndex]
    if (!current || !target) return

    reorderMutation.mutate([
      { id: current.id, displayOrder: target.displayOrder },
      { id: target.id, displayOrder: current.displayOrder },
    ])
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
            <Link to={`/${slug}/categories`} className={cn(buttonVariants())}>
              Go to categories
            </Link>
          }
          className="min-h-[420px] bg-white/80"
        />
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-6">
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
            className="h-12 w-full min-w-0 max-w-full cursor-pointer rounded-2xl border border-border/80 bg-[#f8fafc] px-4 text-sm outline-none transition-all duration-200 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
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
            className="h-12 w-full min-w-0 max-w-full cursor-pointer rounded-2xl border border-border/80 bg-[#f8fafc] px-4 text-sm outline-none transition-all duration-200 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
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
                      <SafeImage
                        src={imageUrl}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        fallback={
                          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                            <ImageOff className="h-4 w-4" />
                            <span className="text-[10px] font-medium">No image</span>
                          </div>
                        }
                      />
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
                        onClick={() => moveItem(item, 'up')}
                        aria-label={`Move ${item.name} up`}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={reorderMutation.isPending}
                        onClick={() => moveItem(item, 'down')}
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
        loading={false}
        onSubmit={async (payload) => {
          saveMutation.mutate({ item: editing, payload })
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
