import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { Avatar } from '@/components/avatar'
import { Chat } from '@/components/contacts/chat'
import { getConnection, getMessages } from '@/lib/data/connections'
import { requireProfile } from '@/lib/data/profiles'

type Params = Promise<{ id: string }>

export default function ChatPage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={<div aria-hidden="true" className="h-[520px] rounded-card border border-line bg-raised" />}
    >
      <Thread params={params} />
    </Suspense>
  )
}

async function Thread({ params }: { params: Params }) {
  const { id } = await params
  const profile = await requireProfile()

  // RLS decides this, not the UI: a connection you are not part of, or one that
  // has not been accepted, simply comes back empty.
  const connection = await getConnection(id)
  if (!connection || connection.status !== 'accepted') notFound()

  const messages = await getMessages(id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/kontakte" aria-label="Zurück zu den Kontakten" className="text-[24px] text-ink no-underline lg:hidden">
          ‹
        </Link>
        <Avatar name={connection.other_name} path={connection.other_avatar_path} size={56} />
        <div className="flex flex-col">
          <h1 className="font-serif text-[26px] font-bold">{connection.other_name}</h1>
          {connection.other_age !== null && (
            <span className="text-[17px] text-muted">{connection.other_age} Jahre</span>
          )}
        </div>
      </div>

      {connection.intro_message && messages.length === 0 && (
        <p className="text-pretty rounded-card border border-line bg-tag p-4 text-[18px] leading-relaxed">
          {connection.intro_message}
        </p>
      )}

      <Chat connectionId={id} myProfileId={profile.id} initialMessages={messages} />

      <p className="rounded-card border border-line bg-raised p-4 text-[16px] leading-relaxed text-muted">
        Termine vereinbaren Sie hier im Chat. Treffen Sie sich beim ersten Mal an einem
        öffentlichen Ort. Eine seriöse Anfrage fragt nie nach Geld oder Bankdaten.
      </p>
    </div>
  )
}
