export type NominatimAddress = {
  road?: string
  house_number?: string
  neighbourhood?: string
  suburb?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  state?: string
  region?: string
  country?: string
  postcode?: string
}

export type NominatimResult = {
  lat: string
  lon: string
  display_name: string
  address?: NominatimAddress
}

export type ParsedPlace = {
  latitude: number
  longitude: number
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  displayName: string
}

function streetLine(address?: NominatimAddress): string {
  if (!address) return ''
  const number = address.house_number?.trim()
  const road = address.road?.trim() || address.neighbourhood?.trim() || address.suburb?.trim()
  if (number && road) return `${road} ${number}`
  return road || number || ''
}

export function parseNominatimResult(result: NominatimResult): ParsedPlace {
  const address = result.address
  const city =
    address?.city || address?.town || address?.village || address?.municipality || ''
  const street = streetLine(address)
  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    address: street || result.display_name.split(',')[0]?.trim() || result.display_name,
    city,
    state: address?.state || address?.region || '',
    country: address?.country || '',
    postalCode: address?.postcode || '',
    displayName: result.display_name,
  }
}

async function nominatimFetch<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error('Location lookup failed. Please try again.')
  }
  return response.json() as Promise<T>
}

export async function searchPlaces(query: string): Promise<ParsedPlace[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const params = new URLSearchParams({
    q: trimmed,
    format: 'json',
    addressdetails: '1',
    limit: '6',
  })

  const results = await nominatimFetch<NominatimResult[]>(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
  )
  return results.map(parseNominatimResult)
}

export async function reverseGeocode(lat: number, lng: number): Promise<ParsedPlace | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    addressdetails: '1',
  })

  const result = await nominatimFetch<NominatimResult>(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
  )
  if (!result?.lat || !result?.lon) return null
  return parseNominatimResult(result)
}
