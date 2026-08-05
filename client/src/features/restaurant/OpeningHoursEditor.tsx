import type { Control, FieldErrors } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Switch } from '@/components/ui/switch'
import type { RestaurantFormValues } from '@/features/restaurant/schema'
import { WEEKDAY_LABELS, WEEKDAYS, type Weekday } from '@/features/restaurant/types'
import { cn } from '@/lib/utils'

type OpeningHoursEditorProps = {
  control: Control<RestaurantFormValues>
  errors: FieldErrors<RestaurantFormValues>
}

export function OpeningHoursEditor({ control, errors }: OpeningHoursEditorProps) {
  return (
    <div className="space-y-3">
      {WEEKDAYS.map((day) => {
        const dayError = errors.openingHours?.[day]
        const message =
          typeof dayError === 'object' && dayError && 'message' in dayError
            ? String(dayError.message)
            : dayError?.open?.message || dayError?.close?.message || dayError?.root?.message

        return (
          <Controller
            key={day}
            control={control}
            name={`openingHours.${day}`}
            render={({ field }) => {
              const value = field.value
              const isClosed = value.isClosed

              return (
                <div
                  className={cn(
                    'rounded-2xl border px-3 py-3 transition sm:px-4',
                    isClosed ? 'border-border/70 bg-[#f8fafc]' : 'border-primary/15 bg-white',
                    message && 'border-danger/60',
                  )}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{WEEKDAY_LABELS[day as Weekday]}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {isClosed ? 'Closed' : 'Open'}
                        </span>
                        <Switch
                          checked={!isClosed}
                          onCheckedChange={(checked) => {
                            field.onChange(
                              checked
                                ? {
                                    isClosed: false,
                                    open: value.open ?? '08:00',
                                    close: value.close ?? '22:00',
                                  }
                                : { isClosed: true, open: null, close: null },
                            )
                          }}
                        />
                      </div>
                    </div>

                    {!isClosed ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                        <label className="block min-w-0">
                          <span className="mb-1 block text-[11px] font-medium text-muted-foreground sm:sr-only">
                            Opens
                          </span>
                          <input
                            type="time"
                            value={value.open ?? ''}
                            aria-label={`${WEEKDAY_LABELS[day as Weekday]} opens`}
                            aria-invalid={message ? true : undefined}
                            onChange={(event) =>
                              field.onChange({
                                ...value,
                                open: event.target.value || null,
                              })
                            }
                            className={cn(
                              'box-border h-11 w-full max-w-full min-w-0 cursor-pointer rounded-xl border bg-[#f8fafc] px-2 text-sm outline-none transition-all duration-200 focus:ring-4 sm:px-3',
                              message
                                ? 'border-danger/60 focus:border-danger focus:ring-danger/10'
                                : 'border-border/80 hover:border-primary/40 focus:border-primary focus:ring-primary/10',
                            )}
                          />
                        </label>
                        <span className="hidden text-center text-xs text-muted-foreground sm:inline">
                          to
                        </span>
                        <label className="block min-w-0">
                          <span className="mb-1 block text-[11px] font-medium text-muted-foreground sm:sr-only">
                            Closes
                          </span>
                          <input
                            type="time"
                            value={value.close ?? ''}
                            aria-label={`${WEEKDAY_LABELS[day as Weekday]} closes`}
                            aria-invalid={message ? true : undefined}
                            onChange={(event) =>
                              field.onChange({
                                ...value,
                                close: event.target.value || null,
                              })
                            }
                            className={cn(
                              'box-border h-11 w-full max-w-full min-w-0 cursor-pointer rounded-xl border bg-[#f8fafc] px-2 text-sm outline-none transition-all duration-200 focus:ring-4 sm:px-3',
                              message
                                ? 'border-danger/60 focus:border-danger focus:ring-danger/10'
                                : 'border-border/80 hover:border-primary/40 focus:border-primary focus:ring-primary/10',
                            )}
                          />
                        </label>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not accepting guests this day</p>
                    )}
                  </div>
                  {message ? (
                    <p className="mt-2 text-xs font-medium text-danger">❌ {message}</p>
                  ) : null}
                </div>
              )
            }}
          />
        )
      })}
    </div>
  )
}
