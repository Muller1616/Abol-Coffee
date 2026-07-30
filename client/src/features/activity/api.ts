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
    },
  })
  return data.data
}
