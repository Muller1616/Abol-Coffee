import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowUp,
  FolderTree,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  reorderCategories,
  updateCategory,
  updateCategoryStatus,
  type Category,
} from '@/features/categories/api'
import { CategoryFormDialog } from '@/features/categories/CategoryFormDialog'
import type { CategoryFormValues } from '@/features/categories/schema'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: fetchCategories,
  })

  const invalidateRelated = () => {
    // Soft-invalidate only — never block CRUD on dashboard/activity/public refetches.
    void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'], refetchType: 'none' })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'activities'], refetchType: 'none' })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'menu-items'], refetchType: 'none' })
    void queryClient.invalidateQueries({ queryKey: ['public', 'menu'], refetchType: 'none' })
  }

  const createMutation = useMutation({
    mutationFn: createCategory,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'categories'] })
      const previous = queryClient.getQueryData<Category[]>(['admin', 'categories'])
      const optimistic: Category = {
        id: `temp-${Date.now()}`,
        name: input.name,
        displayOrder: input.displayOrder ?? 0,
        isActive: input.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { menuItems: 0 },
      }
      queryClient.setQueryData<Category[]>(['admin', 'categories'], (current) => [
        ...(current ?? []),
        optimistic,
      ])
      setFormOpen(false)
      setEditing(null)
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'categories'], context.previous)
      }
      setFormOpen(true)
      pushToast(getApiErrorMessage(error, 'Could not create category'), 'error')
    },
    onSuccess: (category) => {
      queryClient.setQueryData<Category[]>(['admin', 'categories'], (current) => {
        const list = current ?? []
        const withoutTemp = list.filter((item) => !item.id.startsWith('temp-'))
        if (withoutTemp.some((item) => item.id === category.id)) {
          return withoutTemp.map((item) => (item.id === category.id ? category : item))
        }
        return [...withoutTemp, category]
      })
      pushToast('Category created successfully')
      invalidateRelated()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: CategoryFormValues }) =>
      updateCategory(id, values),
    onMutate: async ({ id, values }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'categories'] })
      const previous = queryClient.getQueryData<Category[]>(['admin', 'categories'])
      queryClient.setQueryData<Category[]>(['admin', 'categories'], (current) =>
        (current ?? []).map((item) =>
          item.id === id
            ? {
                ...item,
                name: values.name,
                isActive: values.isActive,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      )
      setFormOpen(false)
      setEditing(null)
      return { previous, id, values }
    },
    onError: (error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'categories'], context.previous)
      }
      setEditing(
        context?.previous?.find((item) => item.id === variables.id) ?? {
          id: variables.id,
          name: variables.values.name,
          isActive: variables.values.isActive,
          displayOrder: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: { menuItems: 0 },
        },
      )
      setFormOpen(true)
      pushToast(getApiErrorMessage(error, 'Could not update category'), 'error')
    },
    onSuccess: (category) => {
      queryClient.setQueryData<Category[]>(['admin', 'categories'], (current) =>
        (current ?? []).map((item) => (item.id === category.id ? category : item)),
      )
      pushToast('Category updated successfully')
      invalidateRelated()
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateCategoryStatus(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'categories'] })
      const previous = queryClient.getQueryData<Category[]>(['admin', 'categories'])
      queryClient.setQueryData<Category[]>(['admin', 'categories'], (current) =>
        (current ?? []).map((item) => (item.id === id ? { ...item, isActive } : item)),
      )
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'categories'], context.previous)
      }
      pushToast(getApiErrorMessage(error, 'Could not update status'), 'error')
    },
    onSuccess: (_, variables) => {
      pushToast(variables.isActive ? 'Category enabled' : 'Category disabled')
      invalidateRelated()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'categories'] })
      const previous = queryClient.getQueryData<Category[]>(['admin', 'categories'])
      queryClient.setQueryData<Category[]>(['admin', 'categories'], (current) =>
        (current ?? []).filter((item) => item.id !== id),
      )
      setDeleting(null)
      return { previous }
    },
    onError: (error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'categories'], context.previous)
      }
      pushToast(getApiErrorMessage(error, 'Unable to delete category.'), 'error')
    },
    onSuccess: () => {
      pushToast('Category deleted successfully')
      invalidateRelated()
    },
  })

  const reorderMutation = useMutation({
    mutationFn: reorderCategories,
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'categories'] })
      const previous = queryClient.getQueryData<Category[]>(['admin', 'categories'])
      const orderMap = new Map(items.map((item) => [item.id, item.displayOrder]))
      queryClient.setQueryData<Category[]>(['admin', 'categories'], (current) =>
        [...(current ?? [])]
          .map((item) =>
            orderMap.has(item.id)
              ? { ...item, displayOrder: orderMap.get(item.id)! }
              : item,
          )
          .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)),
      )
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'categories'], context.previous)
      }
      pushToast(getApiErrorMessage(error, 'Could not reorder categories'), 'error')
    },
    onSuccess: (categories) => {
      queryClient.setQueryData(['admin', 'categories'], categories)
      pushToast('Category order updated')
      invalidateRelated()
    },
  })

  const categories = categoriesQuery.data ?? []

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return categories
    return categories.filter((category) => category.name.toLowerCase().includes(query))
  }, [categories, search])

  const activeCount = categories.filter((category) => category.isActive).length
  const inactiveCount = categories.length - activeCount

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setFormOpen(true)
  }

  const handleSubmit = async (values: CategoryFormValues) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, values })
      return
    }

    const nextOrder =
      categories.length === 0
        ? 0
        : Math.max(...categories.map((category) => category.displayOrder)) + 1

    createMutation.mutate({
      name: values.name,
      isActive: values.isActive,
      displayOrder: nextOrder,
    })
  }

  const moveCategory = (category: Category, direction: 'up' | 'down') => {
    const ordered = [...categories].sort((a, b) => a.displayOrder - b.displayOrder)
    const index = ordered.findIndex((item) => item.id === category.id)
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return

    const swapped = [...ordered]
    const current = swapped[index]
    const target = swapped[targetIndex]
    if (!current || !target) return

    swapped[index] = target
    swapped[targetIndex] = current

    reorderMutation.mutate(
      swapped.map((item, displayOrder) => ({
        id: item.id,
        displayOrder,
      })),
    )
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">Catalog</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            Categories
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Structure your menu into elegant sections. Only active categories appear on the public
            QR menu.
          </p>
        </div>
        <Button onClick={openCreate} className="h-11 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total" value={categories.length} />
        <SummaryCard label="Active" value={activeCount} tone="success" />
        <SummaryCard label="Inactive" value={inactiveCount} tone="muted" />
      </div>

      <div className="rounded-[28px] border border-border/80 bg-white/90 p-4 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-5">
        <div className="relative mb-5">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories..."
            className="h-12 w-full cursor-text rounded-2xl border border-border/80 bg-[#f8fafc] pr-4 pl-11 text-sm outline-none transition-all duration-200 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
        </div>

        {categoriesQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20" />
            ))}
          </div>
        ) : categoriesQuery.isError ? (
          <EmptyState
            icon={FolderTree}
            title="Unable to load categories"
            description={getApiErrorMessage(categoriesQuery.error, 'Please refresh and try again.')}
            className="border-none bg-[#f8fafc]"
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title={categories.length === 0 ? 'No categories yet' : 'No matches'}
            description={
              categories.length === 0
                ? 'Create your first category to start organizing the digital menu.'
                : 'Try a different search term.'
            }
            action={
              categories.length === 0 ? (
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Create category
                </Button>
              ) : undefined
            }
            className="border-none bg-[#f8fafc]"
          />
        ) : (
          <ul className="space-y-3">
            {filtered.map((category, index) => {
              const absoluteIndex = categories
                .slice()
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .findIndex((item) => item.id === category.id)

              return (
                <motion.li
                  key={category.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-2xl border border-border/70 bg-[#f8fafc] p-4 transition hover:border-primary/20 hover:bg-white"
                >
                  <div className="flex flex-col gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold">{category.name}</h2>
                        <Badge variant={category.isActive ? 'success' : 'muted'}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {category._count.menuItems} item
                        {category._count.menuItems === 1 ? '' : 's'} · Order{' '}
                        {category.displayOrder + 1}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-border">
                      <span className="text-sm font-medium text-muted-foreground">Visible</span>
                      <Switch
                        checked={category.isActive}
                        disabled={statusMutation.isPending}
                        onCheckedChange={(checked) =>
                          statusMutation.mutate({ id: category.id, isActive: checked })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                      <Button
                        variant="outline"
                        size="icon"
                        className="sm:order-none"
                        disabled={absoluteIndex <= 0 || reorderMutation.isPending}
                        onClick={() => void moveCategory(category, 'up')}
                        aria-label={`Move ${category.name} up`}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={
                          absoluteIndex < 0 ||
                          absoluteIndex >= categories.length - 1 ||
                          reorderMutation.isPending
                        }
                        onClick={() => void moveCategory(category, 'down')}
                        aria-label={`Move ${category.name} down`}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="col-span-2 h-11 sm:col-span-1 sm:min-w-24"
                        onClick={() => openEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="col-span-2 h-11 cursor-pointer border-danger/30 text-danger hover:-translate-y-0.5 hover:border-danger hover:bg-danger/10 hover:text-danger sm:col-span-1 sm:min-w-24"
                        onClick={() => setDeleting(category)}
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
      </div>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        category={editing}
        loading={false}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleting(null)
        }}
        title="Delete category"
        description={
          deleting
            ? `You are about to permanently delete "${deleting.name}".`
            : 'You are about to permanently delete this category.'
        }
        warning={
          deleting && deleting._count.menuItems > 0 ? (
            <>
              <p className="font-semibold">This category cannot be deleted yet.</p>
              <p className="mt-1">
                It still contains {deleting._count.menuItems} menu item
                {deleting._count.menuItems === 1 ? '' : 's'}. Move or delete those items first,
                then try again.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">This action cannot be undone.</p>
              <p className="mt-1">
                The category will be removed from your menu structure and admin catalog.
              </p>
            </>
          )
        }
        confirmLabel="Delete category"
        cancelLabel={deleting && deleting._count.menuItems > 0 ? 'Close' : 'Cancel'}
        tone="danger"
        showConfirm={!deleting || deleting._count.menuItems === 0}
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleting || deleting._count.menuItems > 0) return
          deleteMutation.mutate(deleting.id)
        }}
      />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: number
  tone?: 'default' | 'success' | 'muted'
}) {
  return (
    <div
      className={cn(
        'rounded-[24px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)]',
        tone === 'success' && 'bg-gradient-to-br from-success/5 to-white',
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}
