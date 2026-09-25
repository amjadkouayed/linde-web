import Link from 'next/link'
import { Suspense } from 'react'

import { SiteNav } from '@/components/site-nav'
import { LocationFilter } from '@/components/discover/location-filter'
import { OfferCard } from '@/components/discover/offer-card'
import { RequestSentToast } from '@/components/discover/request-sent-toast'
import { lookupPostalCode, requireProfile, searchNearby } from '@/lib/data/profiles'
import { RADIUS_OPTIONS, parseRadius } from '@/lib/discover'

type Search = Promise<{ [key: string]: string | string[] | undefined }>

/**
 * Cache Components: the shell (nav, heading) prerenders and appears instantly.
 * Everything that reads the session — the filter's default postal code and the
 * feed itself — streams in behind the Suspense boundary. See README, "Caching".
 */
export default function DiscoverPage({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <SiteNav active="discover" />

      <main className="mx-auto w-full max-w-[1080px] flex-grow px-6 py-8">
        <div className="flex flex-col gap-6">
          <h1 className="font-serif text-[38px] font-bold">In Ihrer Nähe</h1>

          <Suspense fallback={<FeedSkeleton />}>
            <Feed searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
    </>
  )
}

async function Feed({ searchParams }: { searchParams: Search }) {
  const { plz, umkreis, request } = await searchParams
  const profile = await requireProfile()

  const postalCode = typeof plz === 'string' && /^\d{5}$/.test(plz) ? plz : profile.postal_code
  const radius = parseRadius(umkreis)

  // Tells "we do not know that postal code" apart from "nobody lives there yet".
  // Those need different messages: one is a typo, the other is not their fault.
  // Both queries run at once: an unknown code simply finds nobody.
  const [area, cards] = await Promise.all([
    lookupPostalCode(postalCode),
    searchNearby(postalCode, radius),
  ])
  if (!area) {
    return (
      <div className="flex flex-col gap-6">
        {request === 'sent' && <RequestSentToast />}
        <LocationFilter defaultPostalCode={postalCode} resultCount={0} />
        <p role="alert" className="rounded-card border border-line bg-raised p-8 text-[19px] leading-relaxed">
          Diese Postleitzahl kennen wir nicht. Bitte prüfen Sie die fünf Ziffern.
        </p>
      </div>
    )
  }

  // An empty list is a dead end; the next radius up is a way forward.
  const widerRadius = RADIUS_OPTIONS.find((option) => option > radius)

  return (
    <div className="flex flex-col gap-6">
      {request === 'sent' && <RequestSentToast />}
      <p className="text-[19px] text-muted">
        {profile.role === 'student'
          ? 'Seniorinnen und Senioren, die Zeit haben'
          : 'Studierende, die Sie kennenlernen möchten'}
      </p>

      <LocationFilter defaultPostalCode={postalCode} resultCount={cards.length} />

      {cards.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-card border border-line bg-raised p-8">
          <p className="text-[19px] leading-relaxed">
            Im Umkreis von {radius} km um {area.city} ist gerade niemand.
          </p>
          {widerRadius && (
            <Link
              href={`/discover?plz=${postalCode}&umkreis=${widerRadius}`}
              className="press flex min-h-[56px] items-center justify-center rounded-button bg-brand px-6 text-[19px] font-bold text-surface no-underline"
            >
              Im Umkreis von {widerRadius} km suchen
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {cards.map((card) => (
            <OfferCard key={card.offer_id} card={card} />
          ))}
        </div>
      )}
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="h-[26px] w-[320px] rounded-full bg-tag" />
      <div className="h-[128px] rounded-card border border-line bg-raised" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="h-[280px] rounded-card border border-line bg-raised" />
        <div className="h-[280px] rounded-card border border-line bg-raised" />
      </div>
    </div>
  )
}
