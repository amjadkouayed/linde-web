import { Suspense } from 'react'

import { SiteNav } from '@/components/site-nav'
import { LocationFilter } from '@/components/discover/location-filter'
import { OfferCard } from '@/components/discover/offer-card'
import { getDiscoverFeed, requireProfile } from '@/lib/data/profiles'

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
  const { plz } = await searchParams
  const profile = await requireProfile()
  const feed = await getDiscoverFeed()

  // Until the postal_codes table and the radius query land, "near me" means the
  // same postal code. This is the one line that changes when they arrive.
  const postalCode = typeof plz === 'string' && /^\d{5}$/.test(plz) ? plz : profile.postal_code
  const cards = feed.filter((card) => card.postal_code === postalCode)

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[19px] text-muted">
        {profile.role === 'student'
          ? 'Seniorinnen und Senioren, die Zeit haben'
          : 'Studierende, die Sie kennenlernen möchten'}
      </p>

      <LocationFilter defaultPostalCode={postalCode} resultCount={cards.length} />

      {cards.length === 0 ? (
        <p className="rounded-card border border-line bg-raised p-8 text-[19px] leading-relaxed">
          Hier ist gerade niemand. Versuchen Sie einen größeren Umkreis, oder schauen Sie später
          noch einmal vorbei — es kommen laufend neue Menschen dazu.
        </p>
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
