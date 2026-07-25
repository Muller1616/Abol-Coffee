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
                    'rounded-2xl border px-4 py-3 transition',
                    isClosed ? 'border-border/70 bg-[#f8fafc]' : 'border-primary/15 bg-white',
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center justify-between gap-3 sm:justify-start">
                      <p className="min-w-28 text-sm font-semibold">{WEEKDAY_LABELS[day as Weekday]}</p>
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
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={value.open ?? ''}
                          onChange={(event) =>
                            field.onChange({
                              ...value,
                              open: event.target.value || null,
                            })
                          }
                          className="h-11 rounded-xl border border-border/80 bg-[#f8fafc] px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <input
                          type="time"
                          value={value.close ?? ''}
                          onChange={(event) =>
                            field.onChange({
                              ...value,
                              close: event.target.value || null,
                            })
                          }
                          className="h-11 rounded-xl border border-border/80 bg-[#f8fafc] px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not accepting guests this day</p>
                    )}
                  </div>
                  {message ? <p className="mt-2 text-xs font-medium text-danger">{message}</p> : null}
                </div>
              )
            }}
          />
        )
      })}
    </div>
  )
}
