import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

let configured = false

/** Fix default marker asset paths under Vite and load Leaflet CSS once. */
export function ensureLeafletDefaults() {
  if (configured) return
  configured = true

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proto = L.Icon.Default.prototype as any
  delete proto._getIconUrl

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  })
}

export const brandMapPin = L.divIcon({
  className: '',
  html: `<div style="
      width:36px;height:36px;border-radius:9999px;
      background:#10b981;border:3px solid #fff;
      box-shadow:0 8px 24px rgba(16,185,129,0.45);
      display:flex;align-items:center;justify-content:center;
    ">
      <div style="width:10px;height:10px;border-radius:9999px;background:#fff;"></div>
    </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
})
