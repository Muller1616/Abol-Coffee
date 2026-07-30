import type { LucideIcon } from 'lucide-react'
import {
  CheckCircle2,
  Clock3,
  DollarSign,
  EyeOff,
  FolderTree,
  ImagePlus,
  MapPin,
  Pencil,
  Phone,
  Plus,
  QrCode,
  Store,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'

export type ActivityTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

type ActivityVisual = {
  icon: LucideIcon
  tone: ActivityTone
}

const toneClass: Record<ActivityTone, string> = {
  success: 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/20',
  warning: 'bg-amber-500/12 text-amber-700 ring-amber-500/20',
  danger: 'bg-red-500/12 text-red-700 ring-red-500/20',
  info: 'bg-primary/12 text-primary ring-primary/20',
  neutral: 'bg-zinc-500/10 text-zinc-600 ring-zinc-500/15',
}

const BY_TYPE: Record<string, ActivityVisual> = {
  CATEGORY_CREATED: { icon: FolderTree, tone: 'success' },
  CATEGORY_UPDATED: { icon: Pencil, tone: 'info' },
  CATEGORY_DELETED: { icon: Trash2, tone: 'danger' },
  CATEGORY_TOGGLED: { icon: EyeOff, tone: 'warning' },
  MENU_ITEM_CREATED: { icon: Plus, tone: 'success' },
  MENU_ITEM_UPDATED: { icon: UtensilsCrossed, tone: 'info' },
  MENU_ITEM_DELETED: { icon: Trash2, tone: 'danger' },
  MENU_ITEM_TOGGLED: { icon: EyeOff, tone: 'warning' },
  MENU_ITEM_PRICE_UPDATED: { icon: DollarSign, tone: 'warning' },
  MENU_ITEM_IMAGE_UPDATED: { icon: ImagePlus, tone: 'info' },
  MENU_ITEM_IMAGE_REMOVED: { icon: ImagePlus, tone: 'neutral' },
  RESTAURANT_UPDATED: { icon: Store, tone: 'info' },
  RESTAURANT_STATUS_UPDATED: { icon: Store, tone: 'warning' },
  RESTAURANT_LOGO_UPDATED: { icon: ImagePlus, tone: 'success' },
  RESTAURANT_LOGO_REMOVED: { icon: ImagePlus, tone: 'neutral' },
  RESTAURANT_COVER_UPDATED: { icon: ImagePlus, tone: 'success' },
  RESTAURANT_COVER_REMOVED: { icon: ImagePlus, tone: 'neutral' },
  RESTAURANT_LOCATION_UPDATED: { icon: MapPin, tone: 'info' },
  RESTAURANT_HOURS_UPDATED: { icon: Clock3, tone: 'info' },
  RESTAURANT_CONTACT_UPDATED: { icon: Phone, tone: 'info' },
  QR_TOKEN_REGENERATED: { icon: QrCode, tone: 'warning' },
}

const BY_ACTION: Record<string, ActivityVisual> = {
  CREATE: { icon: Plus, tone: 'success' },
  UPDATE: { icon: Pencil, tone: 'info' },
  DELETE: { icon: Trash2, tone: 'danger' },
  TOGGLE: { icon: EyeOff, tone: 'warning' },
}

export function getActivityVisual(type: string, action: string): ActivityVisual {
  return (
    BY_TYPE[type] ??
    BY_ACTION[action] ?? {
      icon: CheckCircle2,
      tone: 'neutral' as const,
    }
  )
}

const FALLBACK_TITLES: Record<string, string> = {
  'CREATE:CATEGORY': 'Category created',
  'UPDATE:CATEGORY': 'Category updated',
  'DELETE:CATEGORY': 'Category deleted',
  'TOGGLE:CATEGORY': 'Category visibility changed',
  'CREATE:MENU_ITEM': 'Menu item added',
  'UPDATE:MENU_ITEM': 'Menu item updated',
  'DELETE:MENU_ITEM': 'Menu item deleted',
  'TOGGLE:MENU_ITEM': 'Availability updated',
  'UPDATE:RESTAURANT': 'Restaurant information updated',
  'UPDATE:QR': 'Public menu link regenerated',
}

/** Prefer stored title; fall back for legacy rows. */
export function getActivityDisplayTitle(activity: {
  title: string
  type: string
  action: string
  entity: string
  summary: string
}) {
  if (activity.title && activity.title !== 'Activity') return activity.title
  if (activity.type === 'MENU_ITEM_PRICE_UPDATED' || /price/i.test(activity.summary)) {
    return 'Price updated'
  }
  const key = `${activity.action}:${activity.entity}`
  if (FALLBACK_TITLES[key]) return FALLBACK_TITLES[key]
  if (activity.type && activity.type !== 'SYSTEM') {
    return activity.type
      .split('_')
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' ')
  }
  return 'Activity'
}

export function getActivityToneClass(tone: ActivityTone) {
  return toneClass[tone]
}

export const ACTIVITY_ENTITY_FILTERS = [
  { value: '', label: 'All entities' },
  { value: 'CATEGORY', label: 'Categories' },
  { value: 'MENU_ITEM', label: 'Menu items' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'QR', label: 'QR code' },
] as const

export const ACTIVITY_ACTION_FILTERS = [
  { value: '', label: 'All actions' },
  { value: 'CREATE', label: 'Created' },
  { value: 'UPDATE', label: 'Updated' },
  { value: 'DELETE', label: 'Deleted' },
  { value: 'TOGGLE', label: 'Toggled' },
] as const
