import { Suspense } from 'react'

import { Avatar } from '@/components/avatar'
import { OfferEditor } from '@/components/offer/offer-editor'
import { SiteNav } from '@/components/site-nav'
import { getMyOffer, getMyOfferStats, requireProfile } from '@/lib/data/profiles'

export const metadata = { title: 'Mein Angebot – Linde' }

const STATUS_LABEL: Record<string, string> = {
  rentner: 'Rentner',
  rentnerin: 'Rentnerin',
  berufstaetig: 'Noch berufstätig',
}

export default function AngebotPage() {
  return (
    <>
      <SiteNav active="offer" />

      <main className="mx-auto w-full max-w-[720px] flex-grow px-6 py-8">
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h1 className="font-serif text-[38px] font-bold">Mein Angebot</h1>
            <p className="text-[18px] text-muted">
              Immer nur ein Angebot gleichzeitig — so bleibt es übersichtlich.
            </p>
          </div>

          <Suspense
            fallback={<div aria-hidden="true" className="h-[420px] rounded-card border border-line bg-raised" />}
          >
            <Content />
          </Suspense>
        </div>
      </main>
    </>
  )
}

async function Content() {
  const profile = await requireProfile()
  const [offer, stats] = await Promise.all([getMyOffer(), getMyOfferStats()])

  const detail =
    profile.role === 'student' ? profile.study_field : STATUS_LABEL[profile.status ?? '']
  const age = profile.birth_year ? new Date().getFullYear() - profile.birth_year : null

  return (
    <div className="flex flex-col gap-7">
      {offer && (
        <>
          <h2 className="text-[17px] font-bold uppercase tracking-wide text-muted">
            So sehen andere Ihr Angebot
          </h2>

          <article className="flex flex-col gap-4 rounded-card border border-line bg-raised p-5">
            <div className="flex items-start gap-4">
              <Avatar name={profile.name} size={72} />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-serif text-[23px] font-semibold">{profile.name}</span>
                <span className="text-[17px] text-muted">
                  {[age ? `${age} Jahre` : null, detail].filter(Boolean).join(' · ')}
                </span>
              </div>
              <span
                className={`ml-auto flex-none rounded-full px-3 py-1.5 text-[16px] font-bold ${
                  offer.is_published ? 'bg-brand text-surface' : 'bg-tag text-ink'
                }`}
              >
                {offer.is_published ? 'Aktiv' : 'Nicht veröffentlicht'}
              </span>
            </div>

            {profile.bio && <p className="text-pretty text-[18px] leading-relaxed">{profile.bio}</p>}
            <p className="text-pretty text-[18px] leading-relaxed">{offer.description}</p>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[17px] text-muted">
              <span>
                {profile.postal_code} {profile.city}
              </span>
              <span>{offer.availability}</span>
            </div>
          </article>

          <div className="grid grid-cols-2 gap-4">
            <Stat value={stats?.views_this_week ?? 0} label="Aufrufe diese Woche" />
            <Stat value={stats?.open_requests ?? 0} label="offene Anfragen" />
          </div>
        </>
      )}

      {!offer && (
        <p className="rounded-card border border-line bg-raised p-6 text-[19px] leading-relaxed">
          Sie haben noch kein Angebot. Schreiben Sie ein paar Sätze — danach können andere Sie
          finden.
        </p>
      )}

      <OfferEditor offer={offer} />
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-line bg-raised p-5">
      <span className="font-serif text-[32px] font-bold">{value}</span>
      <span className="text-[17px] text-muted">{label}</span>
    </div>
  )
}
