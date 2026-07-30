import { Loader2, MapPin, Search } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { InteractiveMapMount } from '@/features/restaurant/map/InteractiveMap'
import {
  reverseGeocode,
  searchPlaces,
  type ParsedPlace,
} from '@/features/restaurant/map/nominatim'
import { DEFAULT_MAP_CENTER } from '@/lib/location'
import { cn } from '@/lib/utils'

export type LocationPickResult = {
  latitude: number
  longitude: number
  address: string
  city: string
  state: string
  country: string
  postalCode: string
}

type LocationMapPickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: Partial<LocationPickResult>
  onConfirm: (result: LocationPickResult) => void
}

export function LocationMapPicker({
  open,
  onOpenChange,
  initial,
  onConfirm,
}: LocationMapPickerProps) {
  const searchId = useId()
  const [latitude, setLatitude] = useState(initial.latitude ?? DEFAULT_MAP_CENTER.lat)
  const [longitude, setLongitude] = useState(initial.longitude ?? DEFAULT_MAP_CENTER.lng)
  const [address, setAddress] = useState(initial.address ?? '')
  const [city, setCity] = useState(initial.city ?? '')
  const [state, setState] = useState(initial.state ?? '')
  const [country, setCountry] = useState(initial.country ?? '')
  const [postalCode, setPostalCode] = useState(initial.postalCode ?? '')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ParsedPlace[]>([])
  const [searching, setSearching] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLatitude(initial.latitude ?? DEFAULT_MAP_CENTER.lat)
    setLongitude(initial.longitude ?? DEFAULT_MAP_CENTER.lng)
    setAddress(initial.address ?? '')
    setCity(initial.city ?? '')
    setState(initial.state ?? '')
    setCountry(initial.country ?? '')
    setPostalCode(initial.postalCode ?? '')
    setQuery('')
    setResults([])
    setError(null)
    // Reset only when the dialog opens; avoid resetting on parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [open])

  useEffect(() => {
    if (!open) return
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      return
    }

    const timer = window.setTimeout(async () => {
      setSearching(true)
      setError(null)
      try {
        const places = await searchPlaces(trimmed)
        setResults(places)
      } catch {
        setError('Could not search locations. Try again or tap the map.')
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => window.clearTimeout(timer)
  }, [query, open])

  const applyPlace = (place: ParsedPlace) => {
    setLatitude(place.latitude)
    setLongitude(place.longitude)
    setAddress(place.address)
    setCity(place.city)
    setState(place.state)
    setCountry(place.country)
    setPostalCode(place.postalCode)
    setQuery(place.displayName)
    setResults([])
  }

  const handlePositionChange = async (lat: number, lng: number) => {
    setLatitude(lat)
    setLongitude(lng)
    setResolving(true)
    setError(null)
    try {
      const place = await reverseGeocode(lat, lng)
      if (place) {
        setAddress(place.address || address)
        setCity(place.city || city)
        setState(place.state || state)
        setCountry(place.country || country)
        setPostalCode(place.postalCode || postalCode)
      }
    } catch {
      // Keep coordinates even if reverse geocode fails.
    } finally {
      setResolving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Pick restaurant location"
        description="Search, click the map, or drag the marker. Coordinates and address fill automatically when available."
        className="sm:max-w-3xl"
        hideHeader={false}
      >
        <div className="space-y-4">
          <div className="relative">
            <label htmlFor={searchId} className="sr-only">
              Search for a place
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id={searchId}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search address or place…"
              className="h-12 w-full rounded-2xl border border-border/80 bg-white pr-10 pl-10 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              autoComplete="off"
            />
            {searching ? (
              <Loader2 className="absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
            ) : null}
            {results.length > 0 ? (
              <ul
                className="absolute z-20 mt-2 max-h-52 w-full overflow-auto rounded-2xl border border-border/80 bg-white py-1 shadow-xl"
                role="listbox"
              >
                {results.map((place) => (
                  <li key={`${place.latitude}-${place.longitude}-${place.displayName}`}>
                    <button
                      type="button"
                      role="option"
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-primary/5"
                      onClick={() => applyPlace(place)}
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="line-clamp-2 text-foreground">{place.displayName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="relative h-64 overflow-hidden rounded-2xl border border-border/80 shadow-inner sm:h-80">
            <InteractiveMapMount
              active={open}
              latitude={latitude}
              longitude={longitude}
              draggable
              onPositionChange={handlePositionChange}
              className="h-full w-full"
            />
            {resolving ? (
              <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-md">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Updating address…
                </span>
              </div>
            ) : null}
          </div>

          <div className="grid gap-2 rounded-2xl border border-border/70 bg-slate-50/80 px-4 py-3 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Latitude</span>
              <span className="ml-2 font-semibold tabular-nums">{latitude.toFixed(6)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Longitude</span>
              <span className="ml-2 font-semibold tabular-nums">{longitude.toFixed(6)}</span>
            </p>
            <p className="sm:col-span-2">
              <span className="text-muted-foreground">Address</span>
              <span className={cn('ml-2 font-medium', !address && 'text-muted-foreground')}>
                {address || 'Tap the map to set a pin'}
              </span>
            </p>
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="h-11" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="h-11"
              onClick={() => {
                onConfirm({
                  latitude,
                  longitude,
                  address: address.trim() || initial.address || '',
                  city,
                  state,
                  country,
                  postalCode,
                })
                onOpenChange(false)
              }}
            >
              <MapPin className="h-4 w-4" />
              Use this location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
