import { ensureCsrfToken } from '@/features/auth/api'
import { api, type ApiSuccess } from '@/lib/api'

export type AdminActivity = {
  id: string
  action: string
  entity: string
  type: string
  title: string
  entityId: string | null
  summary: string
  createdAt: string
}

export type ActivityListResult = {
  items: AdminActivity[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type ActivityListParams = {
  page?: number
  pageSize?: number
  search?: string
  action?: string
  entity?: string
  type?: string
  from?: string
  to?: string
}

export async function fetchActivities(params: ActivityListParams = {}) {
  const { data } = await api.get<ApiSuccess<ActivityListResult>>('/api/admin/activities', {
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
      ...(params.action ? { action: params.action } : {}),
      ...(params.entity ? { entity: params.entity } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.from ? { from: params.from } : {}),
      ...(params.to ? { to: params.to } : {}),
    },
  })
  return data.data
}

export async function deleteActivity(id: string) {
  await ensureCsrfToken()
  const { data } = await api.delete<ApiSuccess<{ id: string }>>(`/api/admin/activities/${id}`)
  return data.data
}

export async function bulkDeleteActivities(ids: string[]) {
  await ensureCsrfToken()
  const { data } = await api.post<
    ApiSuccess<{ deletedCount: number; requestedCount: number }>
  >('/api/admin/activities/bulk-delete', { ids })
  return data.data
}
