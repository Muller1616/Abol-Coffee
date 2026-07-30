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

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'menu-items'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'activities'] }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      await invalidate()
      setFormOpen(false)
      pushToast('Category created successfully')
    },
    // Errors for the dialog form are handled by handleFormMutationError.
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: CategoryFormValues }) =>
      updateCategory(id, values),
    onSuccess: async () => {
      await invalidate()
      setFormOpen(false)
      setEditing(null)
      pushToast('Category updated successfully')
    },
    // Errors for the dialog form are handled by handleFormMutationError.
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateCategoryStatus(id, isActive),
    onSuccess: async (_, variables) => {
      await invalidate()
      pushToast(variables.isActive ? 'Category enabled' : 'Category disabled')
    },
    onError: (error) => pushToast(getApiErrorMessage(error, 'Could not update status'), 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      await invalidate()
      setDeleting(null)
      pushToast('Category deleted successfully')
    },
    onError: (error) =>
      pushToast(getApiErrorMessage(error, 'Unable to delete category.'), 'error'),
  })

  const reorderMutation = useMutation({
    mutationFn: reorderCategories,
    onSuccess: async () => {
      await invalidate()
      pushToast('Category order updated')
    },
    onError: (error) => pushToast(getApiErrorMessage(error, 'Could not reorder categories'), 'error'),
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
      await updateMutation.mutateAsync({ id: editing.id, values })
      return
    }

    const nextOrder =
      categories.length === 0
        ? 0
        : Math.max(...categories.map((category) => category.displayOrder)) + 1

    await createMutation.mutateAsync({
      name: values.name,
      isActive: values.isActive,
      displayOrder: nextOrder,
    })
  }

  const moveCategory = async (category: Category, direction: 'up' | 'down') => {
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

    await reorderMutation.mutateAsync(
      swapped.map((item, displayOrder) => ({
        id: item.id,
        displayOrder,
      })),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
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
        loading={createMutation.isPending || updateMutation.isPending}
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
