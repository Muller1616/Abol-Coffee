import { ensureCsrfToken } from '@/features/auth/api'
import { api, type ApiSuccess } from '@/lib/api'

export type MenuItem = {
  id: string
  categoryId: string
  name: string
  description: string
  price: number
  priceFormatted: string
  currency: 'ETB'
  image: string | null
  isAvailable: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    isActive: boolean
  }
}

export type MenuItemsPage = {
  items: MenuItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type MenuItemListQuery = {
  search?: string
  categoryId?: string
  isAvailable?: boolean
  page?: number
  pageSize?: number
}

export type MenuItemInput = {
  categoryId: string
  name: string
  description?: string
  price: number
  isAvailable?: boolean
  displayOrder?: number
}

export async function fetchMenuItems(query: MenuItemListQuery = {}) {
  const { data } = await api.get<ApiSuccess<MenuItemsPage>>('/api/admin/menu-items', {
    params: {
      search: query.search || undefined,
      categoryId: query.categoryId || undefined,
      isAvailable:
        query.isAvailable === undefined ? undefined : query.isAvailable ? 'true' : 'false',
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 12,
    },
  })
  return data.data
}

export async function createMenuItem(input: MenuItemInput) {
  await ensureCsrfToken()
  const { data } = await api.post<ApiSuccess<{ item: MenuItem }>>('/api/admin/menu-items', input)
  return data.data.item
}

export async function updateMenuItem(id: string, input: Partial<MenuItemInput>) {
  await ensureCsrfToken()
  const { data } = await api.patch<ApiSuccess<{ item: MenuItem }>>(
    `/api/admin/menu-items/${id}`,
    input,
  )
  return data.data.item
}

export async function updateMenuItemAvailability(id: string, isAvailable: boolean) {
  await ensureCsrfToken()
  const { data } = await api.patch<ApiSuccess<{ item: MenuItem }>>(
    `/api/admin/menu-items/${id}/availability`,
    { isAvailable },
  )
  return data.data.item
}

export async function deleteMenuItem(id: string) {
  await ensureCsrfToken()
  await api.delete<ApiSuccess<undefined>>(`/api/admin/menu-items/${id}`)
}

export async function uploadMenuItemImage(id: string, file: File) {
  await ensureCsrfToken()
  const formData = new FormData()
  formData.append('image', file)

  const { data } = await api.post<ApiSuccess<{ item: MenuItem }>>(
    `/api/admin/menu-items/${id}/image`,
    formData,
  )

  return data.data.item
}

export async function removeMenuItemImage(id: string) {
  await ensureCsrfToken()
  const { data } = await api.delete<ApiSuccess<{ item: MenuItem }>>(
    `/api/admin/menu-items/${id}/image`,
  )
  return data.data.item
}

export async function reorderMenuItems(items: Array<{ id: string; displayOrder: number }>) {
  await ensureCsrfToken()
  const { data } = await api.patch<ApiSuccess<{ items: MenuItem[] }>>(
    '/api/admin/menu-items/reorder',
    { items },
  )
  return data.data.items
}
