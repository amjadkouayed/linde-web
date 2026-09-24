import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { Avatar } from '@/components/avatar'
import { RecordView } from '@/components/discover/record-view'
import { RequestForm } from '@/components/discover/request-form'
import { SiteNav } from '@/components/site-nav'
import { getRequestCard, requireProfile } from '@/lib/data/profiles'

type Params = Promise<{ id: string }>
type SearchParams = Promise<{ sent?: string | string[] }>

export default function RequestPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  return (
    <>
      <SiteNav active="discover" />

      <main className="mx-auto w-full max-w-[640px] flex-grow px-6 py-10">
        <Suspense fallback={<div aria-hidden="true" className="h-[420px] rounded-card border border-line bg-raised" />}>
          <Request params={params} searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  )
}

async function Request({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { id } = await params
  await requireProfile()

  const { sent } = await searchParams
  if (sent === '1') {
    return <RequestSent />
  }

  const card = await getRequestCard(id)
  if (!card?.profile_id) notFound()

  const firstName = (card.name ?? '').split(' ')[0] || 'diese Person'

  return (
    <div className="flex flex-col gap-6">
      {card.offer_id && <RecordView offerId={card.offer_id} />}

      <div className="flex items-center gap-4">
        <Avatar name={card.name} path={card.avatar_path} size={64} />
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

function RequestSent() {
  return (
    <div role="status" className="flex flex-col items-center gap-4 text-center">
      <span aria-hidden="true" className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-brand">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F6F1E3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <h1 className="font-serif text-[27px] font-bold">Anfrage gesendet</h1>
      <p className="text-[18px] leading-relaxed">
        Sobald die Person annimmt, finden Sie das Gespräch unter <strong>Kontakte</strong>.
      </p>
    </div>
  )
}
