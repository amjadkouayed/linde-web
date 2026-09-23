import { Suspense } from 'react'

import { OfferManager } from '@/components/offer/offer-manager'
import { SiteNav } from '@/components/site-nav'
import { getMyOffer, getMyOfferStats, requireProfile } from '@/lib/data/profiles'

export default function OfferPage() {
  return (
    <>
      <SiteNav active="offer" />

      <main className="mx-auto w-full max-w-[1080px] flex-grow px-6 py-8">
        <div className="flex flex-col gap-6">
          <h1 className="font-serif text-[38px] font-bold">Mein Angebot</h1>

          <Suspense
            fallback={
              <div aria-hidden="true" className="h-[360px] rounded-card border border-line bg-raised" />
            }
          >
            <MyOffer />
          </Suspense>
        </div>
      </main>
    </>
  )
}

async function MyOffer() {
  const profile = await requireProfile()
  const [offer, stats] = await Promise.all([getMyOffer(), getMyOfferStats()])

  return (
    <>
      {offer && (
        <div
          role="status"
          className="flex w-fit items-center gap-2.5 rounded-full border border-line bg-tag px-4 py-2.5"
        >
          <span aria-hidden="true" className="h-3 w-3 rounded-full bg-brand" />
          <span className="text-[17px] font-bold">Ihr Angebot ist sichtbar</span>
        </div>
      )}

      <OfferManager profile={profile} offer={offer} stats={stats} />
    </>
  )
}
