export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type Weekday = (typeof WEEKDAYS)[number]

export type DayHours = {
  isClosed: boolean
  open: string | null
  close: string | null
}

export type OpeningHours = Record<Weekday, DayHours>

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

export function createDefaultOpeningHours(): OpeningHours {
  const closedDay: DayHours = { isClosed: true, open: null, close: null }
  const openDay: DayHours = { isClosed: false, open: '08:00', close: '22:00' }

  return {
    monday: { ...openDay },
    tuesday: { ...openDay },
    wednesday: { ...openDay },
    thursday: { ...openDay },
    friday: { ...openDay },
    saturday: { ...openDay },
    sunday: { ...closedDay },
  }
}
