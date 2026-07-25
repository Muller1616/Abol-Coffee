import { ensureCsrfToken } from '@/features/auth/api'
import { api, type ApiSuccess } from '@/lib/api'

export type Category = {
  id: string
  name: string
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    menuItems: number
  }
}

export type CategoryInput = {
  name: string
  displayOrder?: number
  isActive?: boolean
}

export async function fetchCategories() {
  const { data } = await api.get<ApiSuccess<{ categories: Category[] }>>('/api/admin/categories')
  return data.data.categories
}

export async function createCategory(input: CategoryInput) {
  await ensureCsrfToken()
  const { data } = await api.post<ApiSuccess<{ category: Category }>>(
    '/api/admin/categories',
    input,
  )
  return data.data.category
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  await ensureCsrfToken()
  const { data } = await api.patch<ApiSuccess<{ category: Category }>>(
    `/api/admin/categories/${id}`,
    input,
  )
  return data.data.category
}

export async function updateCategoryStatus(id: string, isActive: boolean) {
  await ensureCsrfToken()
  const { data } = await api.patch<ApiSuccess<{ category: Category }>>(
    `/api/admin/categories/${id}/status`,
    { isActive },
  )
  return data.data.category
}

export async function deleteCategory(id: string) {
  await ensureCsrfToken()
  await api.delete<ApiSuccess<undefined>>(`/api/admin/categories/${id}`)
}

export async function reorderCategories(items: Array<{ id: string; displayOrder: number }>) {
  await ensureCsrfToken()
  const { data } = await api.patch<ApiSuccess<{ categories: Category[] }>>(
    '/api/admin/categories/reorder',
    { items },
  )
  return data.data.categories
}
