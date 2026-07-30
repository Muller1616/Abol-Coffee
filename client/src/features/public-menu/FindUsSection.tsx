import { useEffect, useMemo, useRef, useState } from 'react'
import type { PublicRestaurant } from '@/features/public-menu/api'
import { formatRestaurantAddress, hasCoordinates } from '@/lib/location'

type FindUsSectionProps = {
  restaurant: PublicRestaurant
}

function buildGoogleMapsEmbedUrl(restaurant: PublicRestaurant, fullAddress: string): string | null {
  if (hasCoordinates(restaurant.latitude, restaurant.longitude)) {
    const query = `${restaurant.latitude},${restaurant.longitude}`
    return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`
  }

  if (fullAddress) {
    return `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&z=16&output=embed`
  }

  return null
}

export function FindUsSection({ restaurant }: FindUsSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  const fullAddress = useMemo(
    () =>
      formatRestaurantAddress({
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        country: restaurant.country,
        postalCode: restaurant.postalCode,
      }),
    [restaurant],
  )

  const embedUrl = useMemo(
    () => buildGoogleMapsEmbedUrl(restaurant, fullAddress),
    [restaurant, fullAddress],
  )

  useEffect(() => {
    const node = containerRef.current
    if (!node || !embedUrl) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px 0px', threshold: 0.01 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [embedUrl])

  if (!embedUrl) return null

  return (
    <section id="find-us" className="scroll-mt-28" aria-labelledby="find-us-heading">
      <div className="mb-6 text-center">
        <h2
          id="find-us-heading"
          className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
        >
          Find Us
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-white/60">
          Visit our restaurant using the location below.
        </p>
      </div>

      <div
        ref={containerRef}
        className="h-64 w-full overflow-hidden rounded-[24px] border border-white/10 bg-[#0a1f1a] shadow-[0_24px_60px_rgb(0_0_0/0.35)] sm:h-80 lg:h-[26rem]"
      >
        {visible ? (
          <iframe
            title={`Google Map location for ${restaurant.name}`}
            src={embedUrl}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/40">
            Loading map…
          </div>
        )}
      </div>
    </section>
  )
}
