import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { brandMapPin, ensureLeafletDefaults } from '@/features/restaurant/map/leaflet-setup'
import { DEFAULT_MAP_CENTER } from '@/lib/location'

ensureLeafletDefaults()

type MapEventsProps = {
  onPick: (lat: number, lng: number) => void
}

function MapClickHandler({ onPick }: MapEventsProps) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.6 })
  }, [lat, lng, map])
  return null
}

export type InteractiveMapProps = {
  latitude: number
  longitude: number
  draggable?: boolean
  onPositionChange?: (lat: number, lng: number) => void
  className?: string
  zoom?: number
  interactive?: boolean
}

export function InteractiveMap({
  latitude,
  longitude,
  draggable = false,
  onPositionChange,
  className,
  zoom = 15,
  interactive = true,
}: InteractiveMapProps) {
  const lat = Number.isFinite(latitude) ? latitude : DEFAULT_MAP_CENTER.lat
  const lng = Number.isFinite(longitude) ? longitude : DEFAULT_MAP_CENTER.lng

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      scrollWheelZoom={interactive}
      dragging={interactive}
      doubleClickZoom={interactive}
      zoomControl={interactive}
      attributionControl
      className={className}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={lat} lng={lng} />
      {onPositionChange ? <MapClickHandler onPick={onPositionChange} /> : null}
      <Marker
        position={[lat, lng]}
        icon={brandMapPin}
        draggable={draggable && interactive}
        eventHandlers={
          onPositionChange && draggable
            ? {
                dragend: (event) => {
                  const marker = event.target
                  const position = marker.getLatLng()
                  onPositionChange(position.lat, position.lng)
                },
              }
            : undefined
        }
      />
    </MapContainer>
  )
}

/** Stable wrapper that remounts map when first opened (avoids blank tile issues in dialogs). */
export function InteractiveMapMount(props: InteractiveMapProps & { active: boolean }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!props.active) {
      setReady(false)
      return
    }
    const id = window.setTimeout(() => setReady(true), 40)
    return () => window.clearTimeout(id)
  }, [props.active])

  if (!props.active || !ready) {
    return <div className={props.className} aria-hidden />
  }

  return <InteractiveMap {...props} />
}
