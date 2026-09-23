import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { Avatar } from '@/components/avatar'
import { RecordView } from '@/components/discover/record-view'
import { RequestForm } from '@/components/discover/request-form'
import { SiteNav } from '@/components/site-nav'
import { getDiscoverCard, requireProfile } from '@/lib/data/profiles'

type Params = Promise<{ id: string }>

export default function RequestPage({ params }: { params: Params }) {
  return (
    <>
      <SiteNav active="discover" />

      <main className="mx-auto w-full max-w-[640px] flex-grow px-6 py-10">
        <Suspense fallback={<div aria-hidden="true" className="h-[420px] rounded-card border border-line bg-raised" />}>
          <Request params={params} />
        </Suspense>
      </main>
    </>
  )
}

async function Request({ params }: { params: Params }) {
  const { id } = await params
  await requireProfile()

  const card = await getDiscoverCard(id)
  if (!card?.profile_id) notFound()

  const firstName = (card.name ?? '').split(' ')[0] || 'diese Person'

  return (
    <div className="flex flex-col gap-6">
      {card.offer_id && <RecordView offerId={card.offer_id} />}

      <div className="flex items-center gap-4">
        <Avatar name={card.name} size={64} />
        <h1 className="font-serif text-[28px] font-bold">Anfrage an {firstName}</h1>
      </div>

      {card.description && (
        <p className="text-pretty rounded-card border border-line bg-raised p-5 text-[18px] leading-relaxed">
          {card.description}
        </p>
      )}

      <RequestForm recipientId={card.profile_id} firstName={firstName} />
    </div>
  )
}
